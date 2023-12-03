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
    let description = packageNames('short-description')
    if(description === undefined){
      description = packageNames('description')
      if(description === undefined || description.length > 20){
        description = packageNames('name')
      }
    }
    console.log(
      chalk.cyan(figlet.textSync(description, { horizontalLayout: 'full' }))
    )
    const { printHelp } = toolbox.print
    printHelp(toolbox)
  },
}

module.exports = command
