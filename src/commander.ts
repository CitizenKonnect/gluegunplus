const jsonCommands = require('../config/commands.json') // how to import jsonCommands from "../config/commands.json";
const packageJson = require('../package.json')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
// const {to} = require("await-to-js")

const name = function () {
  return module.parent.filename.split('/').slice(-1)[0].replace(/\.ts/, '')
}

const nameFromFilePath = (filePath: string): string => {
  return (filePath.split('/').pop()).replace(/\.ts$/, '').replace(/\.js$/, '')
}

/**
 * Read full path (name/alias) given in configuration file
 * @param current - name of current command
 * @returns
 */
const fullname = (current: string): string => {
  let commands = Object.keys(jsonCommands)
  let regex = new RegExp(`^${current}/`)
  commands = commands.filter((command) => regex.test(command))
  let command: string = commands[0] || current
  return command
}

const packageName = (): string => {
  return packageJson.name
}
const packageNames = (item: string): string => {
  return packageJson[item]
}

const alias = (current: string): string => {
  let fullNameCurrent: string = fullname(current)
  let fullnameParts = fullNameCurrent.split('/')
  return fullnameParts.length > 1 ? fullNameCurrent.slice(-1)[0] : null
}

const commandActionFromFullCommand = (
  fullCommandStr: string,
  current = ''
): string => {
  let command = fullCommandStr.replace(/\/.*$/, '')
  let fullnameParts = fullCommandStr.split('/')
  let alias_ = fullnameParts.length > 1 ? fullnameParts.pop() : null
  return (
    (current.length > 0 ? `${current} ` : '') +
    `--${command}` +
    (alias_ ? `(-${alias_})` : '')
  )
}

function processLevel1Arguments(furtherOptions, required) {
  let innerOptionLines = []
  if (!furtherOptions) return innerOptionLines
  Object.keys(furtherOptions).map((innerItem) => {
    let desc =
      typeof furtherOptions[innerItem] === 'object'
        ? furtherOptions[innerItem].description
        : furtherOptions[innerItem]
    innerOptionLines.push(
      `${innerItem.length === 1 ? '-' : '--'}${innerItem} <${desc}>`
    )
  })
  let optionLine = ''
  if (innerOptionLines.length > 0) {
    if (!required) optionLine += ` [${innerOptionLines.join(' ')}]`
    else optionLine += ` ${innerOptionLines.join(' ')}`
  }
  innerOptionLines.push(optionLine)
  return optionLine
}

function processCommandOptions(
  currentCommand,
  level = 0,
  current = ''
): string {
  if (typeof currentCommand !== 'object') {
    return
  }
  let appName: string = packageJson.name
  let descriptionFirstLine = ''
  let descriptionLines = []
  let shortOptionsForParentCommand = []
  let currentCommandDescription = ''
  if (
    currentCommand.description &&
    currentCommand.description.replace(/\s/g, '').length > 0
  ) {
    descriptionFirstLine = currentCommand.description
    currentCommandDescription = currentCommand.description
  }

  let descriptions_ = []
  // check if final args supplied
  let tabs = ''
  for (let i = 0; i < level; i++) tabs += '\t'
  if (
    Object.keys(currentCommand).includes('optional') ||
    Object.keys(currentCommand).includes('required')
  ) {
    Object.keys(currentCommand).map((key) => {
      if (['optional', 'required'].includes(key)) {
        let tmp = processLevel1Arguments(
          currentCommand[key],
          'required' === key
        )
        shortOptionsForParentCommand.push(tmp)
        return
      }
    })
    let tmp1 = shortOptionsForParentCommand.reverse().join(' ')
    if (tmp1.length > 0) {
      if (level === 0) {
        descriptionFirstLine =
          appName + ' ' + current + tmp1 + ' ' + currentCommand.description
      } else {
        descriptionFirstLine = tmp1 + ' ' + currentCommand.description
      }
    } else {
      descriptionFirstLine = currentCommand.description
    }

    descriptionLines.unshift(descriptionFirstLine)
    let description_ = descriptionLines.join('\n')
    descriptions_.push(description_)
  } else {
    descriptions_[0] = currentCommandDescription
    if (level === 0) {
      descriptions_[1] = 'Options:'
    }
    Object.keys(currentCommand)
      .filter((key) => !['description', '__run'].includes(key))
      .map((key) => {
        let nextLines = processCommandOptions(
          currentCommand[key],
          level + 1,
          current
        )
        if (nextLines.split('\n').length > 1) {
          descriptions_.push(
            '\n' +
              tabs +
              commandActionFromFullCommand(key, '') +
              ' ' +
              nextLines
          )
        } else {
          descriptions_.push(
            '\n' +
              tabs +
              commandActionFromFullCommand(key, '') +
              ' ' +
              nextLines
          )
        }
      })
  }
  if (descriptions_.slice(-1)[0] === 'Options:') descriptions_.pop()
  return descriptions_.join('\n').replace(/\n\n/g, '\n')
}

const description = (current: string): string => {
  let commands = Object.keys(jsonCommands)
  let regex = new RegExp(`^${current}/`)
  commands = commands.filter((command) => regex.test(command))
  let fullname_ = fullname(current)
  let currentCommand = jsonCommands[fullname_]
  if (!currentCommand) return ''
  let description_ = processCommandOptions(currentCommand, 0, current)
  return description_
}

const getConfigSection = (arg, obj) => {
  let fullArg = null
  Object.keys(obj).map((key) => {
    if (arg === key) fullArg = key
    else {
      let regex = new RegExp(`^${arg}/`)
      if (regex.test(key)) fullArg = key
      else {
        regex = new RegExp(`/${arg}$`)
        if (regex.test(key)) fullArg = key
      }
      // if(key.)
    }
  })
  if (!fullArg) return obj
  return obj[fullArg]
}

const getFuncToRun = (argsArr, obj = jsonCommands) => {
  let finalCommandIndex = 0
  argsArr.map((mainCommand) => {
    let obj_ = getConfigSection(mainCommand, obj)
    if (JSON.stringify(obj_) !== JSON.stringify(obj)) {
      finalCommandIndex = argsArr.indexOf(mainCommand)
    }
    obj = obj_
  })
  finalCommandIndex =
    finalCommandIndex > 0 ? finalCommandIndex - 1 : finalCommandIndex
  let func_ = obj.__run || ''
  let args = null
  let func = func_
  if (typeof func === 'object') {
    func = func_.func
    args = func_.args
  }
  return [
    func,
    args,
    { required: obj.required, optional: obj.optional },
    finalCommandIndex,
  ]
}

const validateOptions = (supplied, required) => {
  let requiredOptions = required.required || {}
  let optionalOptions = required.optional || {}
  let suppliedKeys = Object.keys(supplied).map((key) => key.replace(/^\-+/, ''))
  Object.keys(requiredOptions).map((key) => {
    if (!suppliedKeys.includes(key)) throw `Required arg ${key} missing.`
  })
  Object.keys(optionalOptions).map((key) => {
    requiredOptions[key] = optionalOptions[key]
  })
  const errors = {}
  let supplieds = {}
  Object.keys(supplied).map((key) => {
    let key_ = key.replace(/^\-+/, '')
    supplieds[key_] = supplied[key]
  })

  for (const key in supplieds) {
    const option = requiredOptions[key]
    if (option === undefined) {
      throw `Unexpected arg ${key}`
    }

    const inputValue = supplieds[key]
    if (typeof option === 'object') {
      switch (option.type) {
        case 'text':
          if (option.length) {
            const { min, max } = option.length
            const inputLength = inputValue.length
            if (min !== undefined && inputLength < min) {
              errors[key] = `${key} should be at least ${min} characters long.`
            }
            if (max !== undefined && inputLength > max) {
              errors[key] = `${key} should be at most ${max} characters long.`
            }
          }
          break
        case 'int':
          const inputValueAsInt = parseInt(inputValue)
          if (isNaN(inputValueAsInt)) {
            errors[key] = `${key} should be an integer.`
          } else if (option.range) {
            const { min, max } = option.range
            if (min !== undefined && inputValueAsInt < min) {
              errors[key] = `${key} should be greater than or equal to ${min}.`
            }
            if (max !== undefined && inputValueAsInt > max) {
              errors[key] = `${key} should be less than or equal to ${max}.`
            }
          }
          break
      }
    }
  }
  if (Object.keys(errors).length > 0) throw Object.values(errors).join('\n')
}
const commands = (current: string) => {
  current = nameFromFilePath(current)
  let obj = {
    name: current,
    description: description(current),
    alias: alias(current),
    run: null,
  }
  obj.run = async (toolbox) => {
    let args = {}
    let key = null,
      val = null
    let mainCommand = toolbox.parameters.argv[2]
    toolbox.parameters.argv.slice(3).map((item) => {
      if (item.match(/^\-/)) {
        // is new arg
        if (key === (undefined || null)) {
          key = item
        } else {
          args[key] = val
          val = null
          key = item
        }
      } else {
        if (val === (undefined || null)) {
          val = item
        } else {
          val += `${item}`
        }
      }
    })
    args[key] = val
    let argsArr = Object.keys(args).map((key) => key.replace(/^\-+/g, ''))
    argsArr.unshift(mainCommand)
    let [funcToRun, funcToRunArgs, argSettings, finalCommandIndex] =
      getFuncToRun(argsArr)
    let suppliedFuncOptions = {}
    for (let i = finalCommandIndex + 1; i < Object.keys(args).length; i++) {
      suppliedFuncOptions[Object.keys(args)[i]] = args[Object.keys(args)[i]]
    }
    try {
      validateOptions(suppliedFuncOptions, argSettings)
    } catch (error) {
      return console.error(chalk.red(error))
    }

    if (funcToRun === '') {
      return console.error(
        chalk.red(`No function found for the supplied arguments`)
      )
    }
    try {
      await toolbox[funcToRun](suppliedFuncOptions, funcToRunArgs)
    } catch (error) {
      if (error.toString().includes('is not a function'))
        console.error(chalk.red(`Controller for ${funcToRun} not found`))
      else console.error(error)
    }
  }
  return obj
}

const init = async () => {
  let commands = Object.keys(jsonCommands)
  commands = commands.map((command) => command.replace(/\/.*$/, ''))
  // const currentDirectory = process.cwd();
  // const commandsDir = path.join(process.cwd(), 'src', 'commands')
  const commandsDir = __dirname
  // const templateFilePath = path.join(commandsDir, 'commands', 'commandsTemplate')
  const templateFilePath = path.join(commandsDir, '../config', 'commandsTemplate')
  const templateContent = fs.readFileSync(templateFilePath, 'utf8')
  commands.forEach((command) => {
    const commandFileName = `${command}.ts`
    const commandFilePath = path.join(commandsDir, 'commands', commandFileName)

    // Replace placeholders in the template content with the command name
    // const fileContent = templateContent.replace(/{{commandName}}/g, command);
    fs.writeFileSync(commandFilePath, templateContent)
  })
}
export {
  description,
  init,
  commands,
  name,
  packageName,
  packageNames,
  commandActionFromFullCommand,
}
