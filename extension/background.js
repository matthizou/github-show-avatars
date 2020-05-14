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

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete' || !tab || !tab.url || tab.url === 'chrome://newtab/') {
        return
    }
    const url = new URL(tab.url)
    const origin = url.origin + '/*'

    let isAuthorized = await hasPermission(origin)
    isAuthorized = Boolean(isAuthorized)

    if (isAuthorized) {
        chrome.tabs.executeScript(tabId, {
            file: 'content.js',
            runAt: 'document_end',
        })
    }
})

// The handler toggles the icon between grayscale and color modes,
// depending whether the script has the page access for this URL.
// It could have been done simpler with "page action" rather than "browser action"
// but I didn't manage to have the popup working in this setup.
chrome.tabs.onActivated.addListener(async () => {
    // B&W icon
    chrome.browserAction.setIcon({
        path: './images/github-avatars16_disabled.png',
    })
    const [currentTab] = await getCurrentTab()

    let url = null
    try {
        url = new URL(currentTab.url)
        // eslint-disable-next-line no-empty
    } catch (e) {
        console.log('Unable to retrieve active tab info or to parse current tab url', currentTab)
    }

    if (!url || url.origin === 'chrome://newtab') return

    const origin = url.origin + '/*'

    let isAuthorized = await hasPermission(origin)
    isAuthorized = Boolean(isAuthorized)
    if (isAuthorized) {
        // Color icon
        chrome.browserAction.setIcon({
            path: './images/github-avatars16.png',
        })
    }
})
