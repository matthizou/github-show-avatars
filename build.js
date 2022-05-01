const fs = require('fs')

const cwd = process.cwd()
const manifestPath = './extension/manifest.json'

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

    createExtensionArchive(newVersion)
} catch (err) {
    console.error(`  Details: ${err}`)
}

// Works for mac users only
function createExtensionArchive(newVersion) {
    const child_process = require('child_process')
    child_process.execSync(`rm -f dist/extension*`, {
        cwd,
    })
    child_process.execSync(
        `zip -r extension_${newVersion}.zip extension/ -x extension/images/screenshots/*`,
        {
            cwd,
        }
    )
}
