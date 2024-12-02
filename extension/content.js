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

            if (isListPage(urlData)) {
                // -------------------------------
                // PULL REQUESTS / ISSUES LIST PAGE
                // -------------------------------
                landmarkElement = await waitForUmarkedElement(selectorEnum.LIST)
                markElement(landmarkElement)

                const allCustomizations = await getNamespaceData(CUSTOMIZATION_NAMESPACE)

                // Loop through the rows
                $('.application-main div[data-id]').forEach((li) => {
                    if (!li.id.startsWith('issue_')) return

                    const assignees = $('img.from-avatar', li)
                        // Remove '@' at the beginning
                        .map((image) => image.alt.slice(1))
                        .slice(0, MAX_AVATARS)

                    const usernames = assignees.length
                        ? assignees
                        : [li.querySelector('.opened-by a').innerHTML]

                    const avatarsImgs = usernames.map((username) => {
                        const avatarUrl = `https://github.com/${username}.png`
                        return createAvatarImage(allCustomizations[username] || avatarUrl, username)
                    })

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
        } catch (e) {
            // console.log('🙉', e)
        }
    }

    /** Check page url and returns whether or not we are in a list page (pull request/issues lists )*/
    function isListPage(urlData) {
        const { section, itemId } = urlData || getInfoFromUrl()
        return section === 'pulls' || (section === 'issues' && !itemId)
    }


    async function getNamespaceData(namespace) {
        return new Promise((resolve) => {
            chrome.storage.local.get(namespace, function (namespaceData) {
                const data = namespaceData && namespaceData[namespace]
                resolve(data || {})
            })
        })
    }

    const PROCESSED_FLAG = 'avatarExtensionFlag' // notes: it must be camel-cased, otherwise Chrome complains

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
        if (url) {
            img = document.createElement('img')
            img.src = `${url}?s=88`
            img.className = 'avatarImg'
            img.alt = username
            img.title = username
        } else {
            // Use default avatar
            img = $('svg.octicon.octicon-mark-github')[0].cloneNode(true)
            img.style.width = '44px'
            img.dataset.avatarUnknown = true
        }
        img.dataset.avatarUsername = username
        return img
    }

    // -------------------
    // BOOTSTRAP BLOCK
    // -------------------

    // Process page
    applyExtension()

    // Handle browser navigation changes (previous/forward button)
    window.onpopstate = function () {
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
