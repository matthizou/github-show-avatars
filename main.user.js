// ==UserScript==
// @name         Github Show Avatars
// @namespace    https://github.com/matthizou
// @version      1.1.1
// @description  Display avatars in lists (pull requests, issues), making easier to identify who created the item
// @author       Matthieu Izoulet
// @license      MIT
// @match        https://github.com/*
// @grant        GM.getValue
// ==/UserScript==

;(async function() {
    'use strict'
    console.log('Starting extension: Github Show Avatars')

    // -------------------
    // MAIN LOGIC FUNCTIONS
    // -------------------

    const selectorEnum = {
        LIST: '#js-issues-toolbar',
        DETAILS: '#discussion_bucket',
    }

    async function applyExtension() {
        const url = window.location.pathname
        // Element that signals that we are on such or such page
        let landmarkElement

        if (isListPage()) {
            // -------------------------------
            // PULL REQUESTS / ISSUES LIST PAGE
            // -------------------------------
            landmarkElement = await waitForUnmarkedElement(selectorEnum.LIST)
            markElement(landmarkElement)

            // Make container a bit bigger to accomodate the new stuff
            $('.container')[0].style.width = '1080px'

            const USER_ID_REGEX = /user_id=([0-9]+)/
            let userCustomizations = await GM.getValue('user_customizations')
            userCustomizations = userCustomizations || {}

            // Loop through the rows
            $('.repository-content [data-id]').forEach(row => {
                const pullRequestId = row.id.replace('issue_', '')
                const authorTag = row.querySelector('.opened-by a')
                const authorName = authorTag.innerHTML

                const customizations = userCustomizations[authorName] || {}
                let avatarUrl
                if (customizations.url) {
                    avatarUrl = customizations.url
                } else {
                    const avatarId = USER_ID_REGEX.exec(authorTag.dataset.hovercardUrl)[1]
                    avatarUrl = `https://avatars1.githubusercontent.com/u/${avatarId}`
                }

                // Create avatar image and its container
                const img = createAvatarImage(avatarUrl, authorName, customizations)
                const imgContainer = document.createElement('div')
                imgContainer.className = 'float-left pl-3 py-2'
                imgContainer.appendChild(img)

                // Reduce size of the last container of the row to avoid line wrapping
                const rightContainer = row.querySelector('.float-right')
                rightContainer.className =
                    rightContainer.className.replace('col-2', 'col-1') + 'pr-3'

                // Insert avatar container in the row
                const firstElementInRow = row.querySelector('.float-left')
                if (firstElementInRow.querySelector('input[type="checkbox"]')) {
                    // Avatar added after the checkbox
                    insertAfter(imgContainer, firstElementInRow)
                } else {
                    // No checkbox: Happens if the user doesn't have write permissions
                    // Image added at the beginning of the line
                    insertBefore(imgContainer, firstElementInRow)
                }
            })
        }
    }

    /** Check page url and returns whether or not we are in a list page (pull request/issues lists )*/
    function isListPage() {
        const url = window.location.pathname
        return url.indexOf('/pulls') !== -1 || url.indexOf('/issues') !== -1
    }

    const PROCESSED_FLAG = 'avatar-extension-flag'

    function markElement(element) {
        element.dataset[PROCESSED_FLAG] = true
    }

    function isMarked(element) {
        return element.dataset[PROCESSED_FLAG]
    }

    async function waitForUnmarkedElement(selector) {
        return await waitFor(selector, {
            condition: element => !isMarked(element),
        })
    }

    function createAvatarImage(url, username, options = {}) {
        let img
        if (url) {
            // Create avatar image from stored data
            img = document.createElement('img')
            img.src = `${url}?s=88`
            img.alt = username
            img.title = username
            const { css } = options
            img.style.width = '44px'
            if (css) {
                Object.entries(css).forEach(([key, value]) => {
                    img.style[key] = value
                })
            }
        } else {
            // Use default avatar
            img = $('svg.octicon.octicon-mark-github')[0].cloneNode(true)
            img.dataset.avatarUnknown = true
            img.style.width = '44px'
        }
        img.dataset.avatarUsername = username
        return img
    }

    // -------------------
    // STARTUP BLOCK
    // -------------------

    // Process page
    applyExtension()

    // Ensure we rerun the page transform code when the route changes
    const pushState = history.pushState
    history.pushState = function() {
        pushState.apply(history, arguments)
        applyExtension()
    }

    // ---------------
    // UTIL FUNCTIONS
    // ---------------

    /** Shorthand for querySelectorAll, JQuery style */
    function $(selector) {
        return Array.from(document.querySelectorAll(selector))
    }

    /** Insert in DOM the specified node right after the specified reference node */
    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    }
    /** Insert in DOM the specified node right before the specified reference node */
    function insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode)
    }

    /**
     * Wait for an element to appear in document. When not found, wait a bit, and tries again,
     * until the threshold number of retries is reached.
     * @return {Promise}
     */
    function waitFor(selector, options = {}) {
        const SEARCH_THRESHOLD = 300
        const INTERVAL = 50
        const { condition } = options
        let iterationCount = 0

        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector)
                if (element && (!condition || condition(element))) {
                    clearInterval(interval)
                    resolve(element)
                } else if (++iterationCount > SEARCH_THRESHOLD) {
                    // End of cycle with failure
                    clearInterval(interval)
                    reject("Github PR extension error: timeout, couldn't find element")
                }
            }, INTERVAL)
        })
    }
})()
