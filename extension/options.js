function displayStoredProfiles() {
    // Count the number of profiles
    chrome.storage.local.get(null, function (items) {
        if (!items) return
        const allProfiles = new Set()
        Object.entries(items).forEach(([domain, profiles]) => {
            if (domain === 'custom_url' || domain === CUSTOMIZATION_NAMESPACE) return
            Object.keys(profiles).forEach((name) => allProfiles.add(name))
        })
        document.getElementById('nbProfiles').innerHTML = allProfiles.size
    })
}

function clearCache() {
    chrome.storage.local.clear(displayStoredProfiles)
}

const CUSTOMIZATION_NAMESPACE = '__Avatar_customizations__'

async function displayAvatarOverwrites() {
    const items = await getNamespaceData(CUSTOMIZATION_NAMESPACE)
    console.log('Avatar overwrites:', items)
    const container = document.getElementById('customizations')
    container.innerHTML = Object.entries(items)
        .map(
            ([username, url]) => `
        <div id="${username}" class="mb10 custom-avatar-row">
            <input disabled type="text" value="${username}" placeholder="Username" class="username" />
            <input  disabled type="text" value="${url}" placeholder="Image URL" class="avatar-url" />
            <img src="${url}" width=22 height=22 class="mr5"/>
            <a href="#" class="btRemove">Remove</a>
        </div>`
        )
        .join('')

    $('.btRemove', container).forEach((btRemove) =>
        btRemove.addEventListener('click', onDeleteCustomAvatar)
    )
}

async function onDeleteCustomAvatar(e) {
    const usernameToRemove = e.target.parentNode.id
    let avatars = await getNamespaceData(CUSTOMIZATION_NAMESPACE)
    if (avatars && usernameToRemove) {
        delete avatars[usernameToRemove]
        chrome.storage.local.set({ [CUSTOMIZATION_NAMESPACE]: avatars }, displayAvatarOverwrites)
    }
}

async function onAddCustomAvatar() {
    const container = document.getElementById('add-avatar-row')
    const usernameInput = container.querySelector('.username')
    const avatarInput = container.querySelector('.avatar-url')
    const username = usernameInput.value
    const url = avatarInput.value

    let avatars = await getNamespaceData(CUSTOMIZATION_NAMESPACE)
    if (avatars && username && url) {
        usernameInput.value = ''
        avatarInput.value = ''
        container.querySelector('img').src =
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=='
        chrome.storage.local.set(
            {
                [CUSTOMIZATION_NAMESPACE]: {
                    ...avatars,
                    [username]: url,
                },
            },
            displayAvatarOverwrites
        )
    }
}

async function addEventsForAddCustomAvatar() {
    const container = document.getElementById('add-avatar-row')
    const newAvatarImg = container.querySelector('img')
    container.querySelector('#btAddCustomAvatar').addEventListener('click', onAddCustomAvatar)
    container.querySelector('.avatar-url').addEventListener('keyup', (e) => {
        newAvatarImg.src = e.target.value
    })
}

function init() {
    document.getElementById('btClearCache').addEventListener('click', clearCache)
    displayStoredProfiles()
    displayAvatarOverwrites()
    addEventsForAddCustomAvatar()
}

document.addEventListener('DOMContentLoaded', init)

// ---------------
// UTIL FUNCTIONS
// ---------------

async function getNamespaceData(namespace) {
    return new Promise((resolve) => {
        chrome.storage.local.get(namespace, function (namespaceData) {
            const data = namespaceData && namespaceData[namespace]
            resolve(data || {})
        })
    })
}

/** Shorthand for querySelectorAll, JQuery style */
function $(selector, element = document) {
    return Array.from(element.querySelectorAll(selector))
}
