// ==UserScript==
// @name         Github Show Avatars
// @namespace    https://github.com/matthizou
// @version      1.0
// @description  Display avatars in lists (pull requests, issues), making easier to identify who created the item
// @author       Matthieu Izoulet
// @license      MIT
// @match        https://source.xing.com/*
// @match        https://github.com/*
// @grant        GM.getValue
// @grant        GM.setValue
// ==/UserScript==

(async function() {
    'use strict'
    console.log('Starting extension: Github Show Avatars')

    // -------------------
    // MAIN LOGIC FUNCTIONS
    // -------------------

    const selectorEnum = {
        LIST: '#js-issues-toolbar',
        DETAILS: '#discussion_bucket'
    }

    async function applyExtension() {
        const url = window.location.pathname
        // Element that signals that we are on such or such page
        let landmarkElement

        const namespace = getRepoOwnerFromUrl()

        if (url.indexOf('/pull/') !== -1){
            // ------------------------------------
            // INDIVIDUAL PULL REQUEST DETAILS PAGE
            // All the avatar images are analysed and, if found, new data is stored for later uses
            // ------------------------------------

            landmarkElement = await waitForUmarkedElement(selectorEnum.DETAILS)
            const dataFromImages = $('img').filter(img => img.alt.startsWith('@'))
            .map(getUserAvatarDataFromImage)

            const uniqueUsernames = dataFromImages.map(data => data.username)
            .filter((value, index, array) => array.indexOf(value)=== index)
            .map(username => dataFromImages.find(item => item.username === username))

            for (let i=0, length = uniqueUsernames.length; i < length; i++){
                await updateAvatar(uniqueUsernames[i], namespace)
            }

        } else if (url.indexOf('/pulls') !== -1 || url.indexOf('/issues') !== -1){
            // -----------------------
            // PULL REQUESTS LIST PAGE
            // -----------------------
            landmarkElement = await waitForUmarkedElement(selectorEnum.LIST)

            markElement(landmarkElement)

            // Make container a bit bigger to accomodate the new stuff
            $('.container')[0].style.width = '1080px'

            // Browse the pictures of the reviewers
            $('.repository-content li img').forEach(img => {
                updateAvatar(getUserAvatarDataFromImage(img), namespace)
            })

            const namespaceData = await getNamespaceData(namespace)

            // Loop through the rows
            $('.repository-content li[data-id]').forEach(li => {
                const pullRequestId = li.id.replace('issue_','')
                const author = li.querySelector('.opened-by a').innerHTML
                const avatarUrl = namespaceData[author]

                // Create avatar image and its container
                const img = createAvatarImage(avatarUrl, author)
                const imgContainer = document.createElement('div')
                imgContainer.className = 'float-left pl-3 py-2'
                imgContainer.appendChild(img)

                // Reduce size of the last container of the row to avoid line wrapping
                const rightContainer = li.querySelector('.float-right')
                rightContainer.className = rightContainer.className.replace('col-2','col-1') + 'pr-3'

                // Insert avatar container in the row
                const firstElementInRow = li.querySelector('.float-left')
                if (firstElementInRow.querySelector('input[type="checkbox"]')){
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
    function isListPage(){
        const url = window.location.pathname
        return url.indexOf('/pulls') !== -1 || url.indexOf('/issues') !== -1
    }

    /*
     * Attempt to update the avatars of the unknown users.
     * This function is typically called when browsing back in history, as more data may have been accumulated
     */
    async function updateListPage() {
        const container = await waitFor(selectorEnum.LIST)
        const namespace = getRepoOwnerFromUrl()
        const unknownUsers = $('svg[data-avatar-unknown]')
        if (unknownUsers.length){
            const namespaceData = await getNamespaceData(namespace)

            $('svg[data-avatar-unknown]').forEach(async unknownAvatarElement => {
                const username = unknownAvatarElement.dataset.avatarUsername
                const url = namespaceData[username]
                if (url){
                    const img = createAvatarImage(url, username)
                    unknownAvatarElement.parentNode.replaceChild(img, unknownAvatarElement)
                }
            })
        }
    }

    async function getNamespaceData(namespace){
        const namespaceData = await GM.getValue(namespace)
        return namespaceData || {}
    }

    async function updateAvatar({username, url}, namespace){
        const namespaceData = await getNamespaceData(namespace)
        const currentUrl = namespaceData[username]
        if (!currentUrl || currentUrl !== url){
            GM.setValue(namespace, { ...namespaceData, [username]: url })
        }
    }

    function getUserAvatarDataFromImage(img){
        // Username: remove trailing '$'
        const username = img.alt.replace(/^@/,'')
        // url: remove querystring part
        const url = img.src.replace(/\?\S+$/,'')
        return {username, url}
    }

    const PROCESSED_FLAG = '__AVATAR_EXTENSION_FLAG__'

    function markElement(element){
        element.dataset[PROCESSED_FLAG] = true
    }

    function isMarked(element){
        return element.dataset[PROCESSED_FLAG]
    }

    async function waitForUmarkedElement(selector) {
        return await waitFor(selector, { condition: element => !isMarked(element) })
    }

    function createAvatarImage(url, username){
        let img
        if (url){
            // Create avatar image from stored data
            img = document.createElement('img')
            img.src = `${url}?s=88`
            img.alt = username
            img.title = username
        } else {
            // Use default avatar
            img = $('svg.octicon.octicon-mark-github')[0].cloneNode(true)
            img.dataset.avatarUnknown = true
        }
        img.dataset.avatarUsername = username
        img.style.width = '44px'
        return img
    }



    // -------------------
    // BOOTSTRAP BLOCK
    // -------------------

    // Process page
    applyExtension()

    // Ensure we rerun the page transform code when the route changes
    const pushState = history.pushState
    history.pushState = function () {
        pushState.apply(history, arguments)
        applyExtension()
    }

    // Handle browser navigation changes (previous/forward button)
    window.onpopstate = function(event) {
        if (isListPage){
            updateListPage()
        }
    }

    // ---------------
    // UTIL FUNCTIONS
    // ---------------

    /** Shorthand for querySelectorAll, JQuery style */
    function $(selector){
        return Array.from(document.querySelectorAll(selector))
    }

    /** Insert in DOM the specified node right after the specified reference node */
    function insertAfter(newNode, referenceNode){
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    }
    /** Insert in DOM the specified node right before the specified reference node */
    function insertBefore(newNode, referenceNode){
        referenceNode.parentNode.insertBefore(newNode, referenceNode)
    }

    /**
     * Extract the username of the repo owner from the url
     * i.e: https://github.com/styleguidist/react-styleguidist/pulls ====> styleguidist
     */
    function getRepoOwnerFromUrl(){
        return window.location.pathname.substr(1).match(/^[^\/]+/)[0]
    }

    /**
     * Wait for an element to appear in document. When not found, wait a bit, and tries again,
     * until the threshold number of retries is reached.
     * @return {Promise}
     */
    function waitFor(selector, options={}){
        const SEARCH_THRESHOLD = 300
        const INTERVAL = 500
        const { condition } = options
        let iterationCount = 0

        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                const element = document.querySelector(selector)
                if (element && (!condition || condition(element))){
                    clearInterval(interval)
                    resolve(element)
                } else if (++iterationCount > SEARCH_THRESHOLD){
                    // End of cycle with failure
                    clearInterval(interval)
                    reject('Github PR extension error: timeout, couldn\'t find element')
                }
            }, INTERVAL)
            })
    }

})();
