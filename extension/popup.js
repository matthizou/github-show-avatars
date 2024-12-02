const { version } = chrome.runtime.getManifest()
document.getElementById('version').innerText = version
console.log(chrome.runtime.getManifest())

