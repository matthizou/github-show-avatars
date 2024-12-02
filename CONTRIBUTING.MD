

## DEVELOPMENT
- Pull this repo from github
- In Chrome, load the unpacked extension.  
Select the folder `extension` of this freshly pulled repo as the target.  
[Read more about unpacked extensions](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
- Verify in Github that the extension is working.  
For instance, [here](https://github.com/facebook/react/pulls) in the React repo.

Remember that everytime that a change in code is made, the extension needs to be refreshed.  
[Read more](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#reload)


## DEPLOYMENT
A script is available to help with the process.
```
yarn build
```
Then, if you are an administrator, head to the [Chrome Developer Dashboard](https://developer.chrome.com/docs/webstore/publish)  
[Read more](https://developer.chrome.com/docs/webstore/publish)