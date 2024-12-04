const puppeteer = require('puppeteer')

const EXTENSION_PATH = './extension'
const PR_URL = 'https://github.com/facebook/react/pulls'
const ISSUES_URL = 'https://github.com/facebook/react/issues'
// const MAX_PER_PAGE = 25
const MAX_PER_PAGE = 13 // change to triger error

let browser
beforeEach(async () => {
    browser = await puppeteer.launch({
        // headless: false, // Uncomment this to see test in browser
        args: [
            `--disable-extensions-except=${EXTENSION_PATH}`,
            `--load-extension=${EXTENSION_PATH}`,
        ],
    })
})

afterEach(async () => {
    await browser.close()
    browser = undefined
})

test('displays avatars for all pull requests', async () => {
    const page = await browser.newPage()

    await page.goto(`${PR_URL}?is%3Aclosed`)

    await page.waitForSelector('[data-testid="avatar-image"]')

    const avatars = await page.$$('[data-testid="avatar-image"]')

    expect(avatars.length).toBe(MAX_PER_PAGE)
})

test('displays avatars for all issues', async () => {
    const page = await browser.newPage()

    await page.goto(`${ISSUES_URL}?is%3Aclosed`)

    await page.waitForSelector('[data-testid="avatar-image"]')

    const avatars = await page.$$('[data-testid="avatar-image"]')

    expect(avatars.length).toBe(MAX_PER_PAGE)
})

describe('when navigating', () => {
    test('displays avatars', async () => {
        const page = await browser.newPage()

        await page.goto(`${PR_URL}?is%3Aclosed`)

        // Wait for avatars to load
        await page.waitForSelector('[data-testid="avatar-image"]')

        // Navigate to the Issues page by clicking the tab
        await page.click('#issues-tab')
        await page.waitForNavigation({ waitUntil: 'networkidle2' })

        // Ensure the Issues page has loaded properly
        const inputValue = await page.$eval('#js-issues-search', (input) => input.value)
        expect(inputValue).toContain('is:issue')

        // Wait for avatars to load
        // React is such a big repo that there always will be at least one issue opened
        const avatar = await page.waitForSelector('[data-testid="avatar-image"]')
        expect(avatar).not.toBe(null)
    })
})
