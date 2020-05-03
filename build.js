const fs = require('fs')

const cwd = process.cwd()
const manifestPath = './extension/manifest.json'
// const userscriptPath = './userscript/userscript.user.js'

try {
    const manifest = require(manifestPath)
    const [major, minor, patch] = manifest.version.split('.').map(parseFloat)

    if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
        console.log(major, minor, patch)

        throw `Invalid Version number in manifest: ${manifest.version}`
    }
    const newVersion = `${major}.${minor}.${patch + 1}`
    console.log('New Version:', newVersion)

    // Update manifest
    manifest.version = newVersion
    const newManifestContent = JSON.stringify(manifest, null, 2)
    fs.writeFileSync(manifestPath, newManifestContent)

    // Generate userscript
    // fs.writeFileSync(userscriptPath, generateUserscript(newVersion))

    createExtensionArchive(newVersion)
} catch (err) {
    console.error(`  Details: ${err}`)
}

// function generateUserscript(newVersion) {
//     const logic = fs.readFileSync('./extension/content.js')
//     const header = fs.readFileSync('./userscript/userscript-header.txt')
//     return [
//         '// ==UserScript==',
//         header,
//         `// @version      ${newVersion}`,
//         '// ==/UserScript==',
//         '',
//         logic,
//     ].join('\n')
// }

// Works for mac users only
function createExtensionArchive(newVersion) {
    const child_process = require('child_process')
    child_process.execSync(`rm -f build/extension*`, {
        cwd,
    })
    child_process.execSync(
        `zip -r build/extension_${newVersion}.zip extension/ -x extension/images/screenshots/*`,
        {
            cwd,
        }
    )
}
