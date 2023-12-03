import { GluegunCommand } from 'gluegun' 
import { packageNames } from "../commander";

/**
 * 
 */
const chalk = require("chalk");
const figlet = require("figlet")

  
const command: GluegunCommand = {
  name: packageNames('name'),
  run: async (toolbox) => {
    console.log(
      chalk.cyan(figlet.textSync(packageNames('short-description'), { horizontalLayout: 'full' }))
    )
    const { printHelp } = toolbox.print
    printHelp(toolbox)
  },
}

module.exports = command
