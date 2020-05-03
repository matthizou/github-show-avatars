const { version } = chrome.runtime.getManifest()
// const { id: extensionId } = chrome.runtime
document.getElementById('version').innerText = version
console.log(chrome.runtime.getManifest())

const btGrantPermission = document.getElementById('btGrant')

const hasPermission = (domain) =>
    new Promise((resolve) =>
        chrome.permissions.contains(
            {
                permissions: ['tabs'],
                origins: [domain],
            },
            resolve
        )
    )

const getCurrentTab = () =>
    new Promise((resolve) =>
        chrome.tabs.query(
            {
                active: true,
                currentWindow: true,
            },
            resolve
        )
    )

const requestPermission = (origin) =>
    new Promise((resolve) =>
        chrome.permissions.request(
            {
                origins: [origin],
            },
            resolve
        )
    )

;(async function () {
    const [currentTab] = await getCurrentTab()
    const url = new URL(currentTab.url)
    const origin = url.origin + '/*'
    document.getElementById('origin').innerText = origin
    let isActivated = await hasPermission(origin)
    isActivated = Boolean(isActivated)

    if (isActivated) {
        document.getElementById('availability').innerText = 'Extension activated for this domain'
        btGrantPermission.style.display = 'none'
    } else {
        document.getElementById('goToOptions').innerText = ''
        btGrantPermission.addEventListener('click', async () => {
            const granted = await requestPermission(origin)
            if (!granted) {
                const error = document.getElementById('error')
                error.textContent = 'An error happened'
            }
        })
        document.getElementById('availability').innerHTML =
            'Extension not activated for this domain.'
    }
})()
