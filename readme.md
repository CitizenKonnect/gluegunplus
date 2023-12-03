# gluegunplus CLI

Gluegun Plus provides the first steps into developing language-agnostic and framework-agnostic CLIs. The CLI is built from a command API definition, which is currently given in a json file. There is also provided validation functions so that these do not have to be independently written in each command handler.

## 1. Features

1. Inbuilt argument validation
2. Command API definition

## 2. Supported Languages and Toolkits

| Language | Toolkit | Support |
| -------- | ------- | ------- |
| Node     | Gluegun | ✔       |
| Go       | Cobra   | ❌      |

## 3. Commands Structure

Example `config.json`

```json
{
  "command1/c": {
    "description": "Command 1 Description",
    "__run": "command1Handler"
  },
  "command2/d": {
    "description": "Command 2 Description",
    "__run": { "func": "command2Handler", "args": { "a": true, "b": 4 } },
    "optional": {
      "a": "a argument supplied to command2Handler",
      "b": {
        "description": "b argument",
        "type": "int",
        "range": { "min": 1, "max": 10 },
        "default": 1
      }
    },
    "required": {
      "c": "A required arg"
    }
  },
  "command3": {
    "description": "Command 3 Description",
    "command4/d": {
      "description": "Command 4 Description",
      "__run": { "func": "command4Handler", "args": { "a": true, "b": 4 } },
      "optional": {
        "a": "a argument supplied to command4Handler",
        "b": {
          "description": "b argument",
          "type": "int",
          "range": { "min": 1, "max": 10 },
          "default": 1
        }
      },
      "required": {
        "c": "A required arg"
      }
    }
  }
}
```

The commands have a hierarchical structure. For example:

```bash
sample command1 
sample command2 
sample command3 command4
```

Each command/sub-command has the following sections:
| Section | Description|
|---------|------------|
|command/alias| The command and the alias in the format `cli rootcommand --subcommand1 --subcommandOfSubcommand1 ... --arg1 value`. The commands and subcommands have an optional alias. They from the first part of the cli `args` supplied and they are supplied as args without a value. The command and the alias will do the same thing. Eg `cli command1` is the same as `cli c`. Due to the hierarchical structure, arguments are processed in the order in which they are supplied. So that the following example will result in the execution of different functions: 1.  `cli c -c -d -c 1`. and 2.  `cli c -d -e -c 1`. The args after the root command arg are in order the subcommands in the hierarchy. The last subcommand has a "__run" object |
|__run| This gives the name, an optionally the arguments, to be supplied to the function to be run for this command. The name can be given either as a string, or in an object in the format: `{"description": "", "type": "", "range": {"min":1, "max":10}}`|
|description| String which gives the description of the command.|
|optional| optional args to be supplied for the command. Supplied in either the format: `{ "arg": "description"}` or `{"arg:{"decription:"", {...type configuration}}}`

### Supported Arg Types
- [x] int
- [ ] float
- [x] text
- [ ] email
- [ ] date
- [ ] boolean

#### int
An `int` type can be configured with a `range` object which has optionally a `min` and `max` value.

#### text
A `text` type can be configured with a `length` object. The value for a length object is either an integer for a fixed length string, or an object with a `min` and `max` value.

## 4. Usage

You can either use the github repo as a template.

Or

Create a gluegun project using

```bash
npx gluegun new projectName
cd projectName
npm link
```

and run from `projectName` directory

```bash
npx gluegunplus init
```

This modifies the gluegun directory by creating

1. `root/config/commands.json` with an sample commands file
2. corresponding command files for each command specified in the json file.

// the file to run...

If you need to update to the latest version, run

```bash
npx gluegunplus update
```

## 5. Fixes
### Chalk
`npm install chalk@4.1.0`

## 6. License

See [LICENSE](LICENSE.txt)
