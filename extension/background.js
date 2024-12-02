chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
    if (changeInfo.status !== 'complete' || !tab || !tab.url || tab.url === 'chrome://newtab/') {
        return
    }

    if (tab.url.startsWith('https://github.com')) {
        chrome.scripting.insertCSS({
            target: { tabId },
            files: ["stylesheet.css"],
          });

        chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js'],
        })
    }
})

