chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (
        changeInfo.status !== 'complete' ||
        !tab ||
        !tab.url ||
        !tab.url.startsWith('https://github.com')
    ) {
        return
    }

    if (tab.url.includes('/pulls') || tab.url.includes('/issues')) {
        chrome.scripting.insertCSS({
            target: { tabId },
            files: ['stylesheet.css'],
        })

        chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
        })
    }
})
