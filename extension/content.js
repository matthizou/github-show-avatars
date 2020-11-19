;(async function () {
    'use strict'

    // const seed = Math.floor(Math.random() * 100)
    // console.log('Github Show Avatars', seed)
    // -------------------
    // MAIN LOGIC FUNCTIONS
    // -------------------

    const CUSTOMIZATION_NAMESPACE = '__Avatar_customizations__'
    const selectorEnum = {
        LIST: '#js-issues-toolbar',
        DETAILS: '#discussion_bucket',
    }
    // Maximum number of avatars that can be shown simultaneously on the same PR/issue
    const MAX_AVATARS = 2

    async function applyExtension() {
        try {
            // Element that signals that we are on such or such page
            let landmarkElement

            const urlData = getInfoFromUrl()
            const namespace = urlData.repoOwner
            let storedUsers

            if (isDetailsPage(urlData)) {
                // ------------------------------------
                // Individual PR or Issue page
                // That's where the "machine learning" is done
                // All the avatar images are analysed and, if found, new data is stored for later uses
                // ------------------------------------
                landmarkElement = await waitForUmarkedElement(selectorEnum.DETAILS)
                markElement(landmarkElement)
                const dataFromImages = $('img')
                    .filter((img) => img.alt.startsWith('@'))
                    .map(getUserAvatarDataFromImage)

                const uniqueUsernames = dataFromImages
                    .map((data) => data.username)
                    .filter((value, index, array) => array.indexOf(value) === index)
                    .map((username) => dataFromImages.find((item) => item.username === username))

                storedUsers = await getNamespaceData(namespace)
                let shouldUpdate = false
                const updatedStoredUsers = uniqueUsernames.reduce((res, { username, url }) => {
                    const storedUrl = storedUsers[username]
                    if (storedUsers && storedUrl === url) {
                        return res
                    }
                    shouldUpdate = true
                    return {
                        ...res,
                        [username]: url,
                    }
                }, storedUsers)
                if (shouldUpdate) {
                    chrome.storage.local.set({ [namespace]: updatedStoredUsers })
                }
            } else if (isListPage(urlData)) {
                // -------------------------------
                // PULL REQUESTS / ISSUES LIST PAGE
                // -------------------------------
                landmarkElement = await waitForUmarkedElement(selectorEnum.LIST)
                markElement(landmarkElement)

                storedUsers = await getNamespaceData(namespace)
                const allCustomizations = await getNamespaceData(CUSTOMIZATION_NAMESPACE)

                // Loop through the rows
                $('.repository-content div[data-id]').forEach((li) => {
                    if (!li.id.startsWith('issue_')) return
                    // Stretch the title area a bit in the Enterprise version
                    const titleLink = document.getElementById(`${li.id}_link`)
                    if (titleLink) {
                        titleLink.parentNode.className = titleLink.parentNode.className.replace(
                            'col-8',
                            'col-9'
                        )
                    }

                    const assignees = $('img.from-avatar', li)
                        // Remove '@' at the beginning
                        .map((image) => image.alt.slice(1))
                        .slice(0, MAX_AVATARS)

                    const usernames = assignees.length
                        ? assignees
                        : [li.querySelector('.opened-by a').innerHTML]

                    const avatarsImgs = usernames.map((username) =>
                        createAvatarImage(
                            allCustomizations[username] || storedUsers[username],
                            username
                        )
                    )
                    if (usernames.length > 1) {
                        avatarsImgs.forEach((img, index) => {
                            if (img.tagName === 'IMG') {
                                img.className += ` small-avatar ${
                                    index > 0 ? ' additionnal-avatar' : ''
                                }`
                            }
                        })
                    }

                    const imgContainer = document.createElement('div')
                    imgContainer.className = 'avatar-container'
                    avatarsImgs.forEach((img) => imgContainer.appendChild(img))

                    const wrapper = Array.from(li.children).find(({ tagName }) => tagName === 'DIV')
                    if (!wrapper || !wrapper.children.length) {
                        return
                    }

                    // Reduce size of the last container of the row to avoid line wrapping
                    // That only happens in Github enterprise
                    const rightContainer = wrapper.querySelector('.float-right')
                    if (rightContainer) {
                        rightContainer.className = rightContainer.className.replace('col-3', '')
                    }

                    // Insert avatar container in the row
                    const firstElementInRow = wrapper.children[0]
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
            // eslint-disable-next-line no-empty
        } catch (e) {
            console.log('🙉')
        }
    }

    /** Check page url and returns whether or not we are in a list page (pull request/issues lists )*/
    function isListPage(urlData) {
        const { section, itemId } = urlData || getInfoFromUrl()
        return section === 'pulls' || (section === 'issues' && !itemId)
    }

    function isDetailsPage(urlData) {
        const { section, itemId } = urlData || getInfoFromUrl()
        return section === 'pull' || (section === 'issues' && itemId)
    }

    /**
     * Attempt to update the avatars of the unknown users.
     * This function is typically called when browsing back in history, as more data may have been accumulated.
     * Note that this is only used in Github Enterprise (SPA)
     */
    async function updateListPage() {
        await waitFor(selectorEnum.LIST)
        const namespace = getInfoFromUrl().repoOwner
        const unknownUsers = $('svg[data-avatar-unknown]')
        if (unknownUsers.length) {
            const namespaceData = await getNamespaceData(namespace)
            const allCustomizations = await getNamespaceData(CUSTOMIZATION_NAMESPACE)

            $('svg[data-avatar-unknown]').forEach(async (unknownAvatarElement) => {
                const username = unknownAvatarElement.dataset.avatarUsername
                const customizationsForUser = allCustomizations[username] || {}
                const url = customizationsForUser.url || namespaceData[username]
                if (url) {
                    const img = createAvatarImage(url, username, customizationsForUser)
                    unknownAvatarElement.parentNode.replaceChild(img, unknownAvatarElement)
                }
            })
        }
    }

    async function getNamespaceData(namespace) {
        return new Promise((resolve) => {
            chrome.storage.local.get(namespace, function (namespaceData) {
                const data = namespaceData && namespaceData[namespace]
                resolve(data || {})
            })
        })
    }

    function getUserAvatarDataFromImage(img) {
        // Username: remove trailing '$'
        const username = img.alt.replace(/^@/, '')
        // url: remove querystring part
        const url = img.src.replace(/\?\S+$/, '')
        return { username, url }
    }

    const PROCESSED_FLAG = '__AVATAR_EXTENSION_FLAG__'

    function markElement(element) {
        element.dataset[PROCESSED_FLAG] = true
    }

    function isMarked(element) {
        return element.dataset[PROCESSED_FLAG]
    }

    async function waitForUmarkedElement(selector) {
        return await waitFor(selector, { condition: (element) => !isMarked(element) })
    }

    function createAvatarImage(url, username) {
        let img
        img = document.createElement('img');
        img.src = `https://github.com/${username}.png?size=88`;
        img.className = 'avatarImg';
        img.alt = username;
        img.title = username;
        img.dataset.avatarUsername = username;
        return img
    }

    addStyle(`
    .avatar-container { position: relative; float: left; padding: 8px; display: flex; align-items: center; }
    .avatarImg { border-radius: 99px; width: 44px; }
    img.small-avatar { width: 33px; }
`)

    // -------------------
    // BOOTSTRAP BLOCK
    // -------------------

    // Process page
    applyExtension()

    // Ensure we rerun the page transform code when the route changes
    // Note: This code is not necessary in the Chrome extension, as the background script
    // takes care of that
    // const pushState = history.pushState
    // history.pushState = function () {
    //     console.log('Push state')
    //     pushState.apply(history, arguments)
    //     applyExtension()
    // }

    // Handle browser navigation changes (previous/forward button)
    window.onpopstate = function () {
        if (isListPage()) {
            updateListPage()
        }
    }

    // ---------------
    // UTIL FUNCTIONS
    // ---------------

    /** Shorthand for querySelectorAll, JQuery style */
    function $(selector, element = document) {
        return Array.from(element.querySelectorAll(selector))
    }

    /** Insert in DOM the specified node right after the specified reference node */
    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
    }
    /** Insert in DOM the specified node right before the specified reference node */
    function insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode)
    }

    /** Insert css styles in a stylesheet injected in the head of the document */
    function addStyle(css) {
        const style = document.createElement('style')
        style.type = 'text/css'
        style.innerHTML = css
        document.getElementsByTagName('head')[0].appendChild(style)
    }

    /**
     * Extract the username of the repo owner from the url
     * i.e: https://github.com/styleguidist/react-styleguidist/pulls ====> styleguidist
     */
    // function getRepoOwnerFromUrl() {
    //     return window.location.pathname.substr(1).match(/^[^\/]+/)[0]
    // }

    /** Breakdown Github's URL into data */
    function getInfoFromUrl() {
        const [repoOwner, repo, section, itemId] = window.location.pathname.substr(1).split('/')
        return {
            repoOwner,
            repo,
            section,
            itemId,
        }
    }

    /**
     * Wait for an element to appear in document. When not found, wait a bit, and tries again,
     * until the threshold number of retries is reached.
     * @return {Promise}
     */
    function waitFor(selector, options = {}) {
        const SEARCH_THRESHOLD = 80
        const INTERVAL = 100
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
                    reject(
                        `Github PR extension error: timeout, couldn't find element with selector: ${selector}`
                    )
                }
            }, INTERVAL)
        })
    }
})()
