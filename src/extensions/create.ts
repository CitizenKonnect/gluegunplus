import axios, { AxiosResponse } from 'axios'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import * as AdmZip from 'adm-zip'
import * as fsExtra from 'fs-extra'
import {  init } from "../commander";


const username = 'CitizenKonnect'
const repository = 'gluegunplus'

// Define an interface for the GitHub tag object
interface GitHubTag {
  object: {
    sha: string
  }
}

async function getLatestTagZipUrl(
  username: string,
  repository: string
): Promise<string | null> {
  try {
    const tagsEndpoint = `https://api.github.com/repos/${username}/${repository}/git/refs/tags`
    const response: AxiosResponse<GitHubTag[]> = await axios.get(tagsEndpoint)

    const tags: GitHubTag[] = response.data

    if (tags.length > 0) {
      const latestTagSha = (tags.pop()).object.sha
      const zipUrl = `https://github.com/${username}/${repository}/archive/${latestTagSha}.zip`
      return zipUrl
    } else {
      throw new Error('No tags found in the repository.')
    }
  } catch (error) {
    console.error('Error:', error.message)
    return null
  }
}

async function downloadLatestTagZip(): Promise<void> {
  const zipUrl = await getLatestTagZipUrl(username, repository)
  if (zipUrl) {
    try {
      const response: AxiosResponse<Buffer> = await axios.get(zipUrl, {
        responseType: 'arraybuffer',
      })

      const tmpDir = os.tmpdir()
      const filePath = path.join(tmpDir, `${repository}-latest.zip`)

      fs.writeFileSync(filePath, response.data)

      // Unzipping the downloaded file
      const extractDir = path.join(tmpDir, `${repository}-latest`)
      const zip = new AdmZip(filePath)
      zip.extractAllTo(extractDir, /* overwrite */ true)

      // Find and copy the 'config' directory to the current directory
      const contents = fs.readdirSync(extractDir)
      const firstDir = contents.find((item) =>
        fs.statSync(path.join(extractDir, item)).isDirectory()
      )

      if (firstDir) {
        let copyDirs_ = ['config', 'src/commands/commandsTemplate'/*not used*/, 'src/commander.ts', 'src/commands/gluegunplus.ts', ]
        const copyDirs = copyDirs_.map(dir=>path.join(extractDir, firstDir, dir))
        if (fs.existsSync(copyDirs[0])) {
          await fsExtra.copy(copyDirs[0], './config', {
            recursive: true,
            overwrite: false,
          })
          for(let i=2; i<=2; i++){
            await fsExtra.copy(copyDirs[i], `./${copyDirs_[i]}`, {
            overwrite: true,
          })
          }
          let files = fs.readdirSync("bin");
          if(files.length >0){
            let cliBin = files[0]
            if(fs.existsSync(`./src/commands/${cliBin}.ts`))
            await fsExtra.copy(copyDirs[3], `./src/commands/${cliBin}.ts`)

            files = fs.readdirSync("src/commands");
            let filesNotToDelete = ["commandsTemplate", "generate.ts", `${cliBin}.ts`]
            files.map(file=>{
              if(!filesNotToDelete.includes(file)){
                fsExtra.unlinkSync( `./src/commands/${file}`)
              }
              // 
            })
            await init();
          }
          
        } else {
          console.error(`'config' directory not found inside ${firstDir}.`)
        }
      } else {
        console.error(`No directories found inside the extracted folder.`)
      }
    } catch (error) {
      console.error('Error downloading zip file:', error.message)
    }
  }
}

// Replace 'username' and 'repository' with your GitHub username and repository name
module.exports = (toolbox) => {
  toolbox.create = async () => {
    await downloadLatestTagZip()
  }
}
