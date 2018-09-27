# Github Show Avatars

Github is **awesome**... and yet sometimes you wish for a cooler UX, especially compared to its little brother Bitbucket.  
Maybe you are used to look at the long lists of pull requests of your team, several times a day, and sometimes you are struggling to spot who created what - the small author text doesn't really stand out !

Well, good news, You shall no longer put up with this awkwardness.

This userscript will display a **large avatar picture** in each row, in lists such as pull requests and issues.

> The hell with the compact mode, I have a 27'' monitor after all !"

Doesn't it look better like this ?!

<img src="images/processed-PR-list-2.png" width="800">

## Getting Started

### Prerequisites

The application is has been tested/styled on the latest version of Chrome. (It should also work with Firefox)

Your browser needs be able to run userscripts.
For this, install the [Tampermonkey extension](https://tampermonkey.net/?ext=dhdg&browser=chrome)

### Installation

Go to this url: [/matthizou/github-show-avatars/raw/master/main.user.js](https://github.com/matthizou/github-show-avatars/raw/master/main.user.js)  
Tampermonkey will pick up the fact that you are displaying a raw userscript and will ask you if you want to install the script.  
Click the **install** button.

<img src="images/userscript-installation.png" width="500">

### Notes

The implementation has been kept simple and efficient, using a basic logic of scanning and storing the avatar urls in pull request pages. No extra server call is performed.

Consequently, **the first time** this script is activated, all users will get the default unknown avatar; but after entering a few pull requests, the script will accumulate data and display the correct avatars.

## Authors

- **Matthieu Izoulet**

## Acknowledgments

Thanks to [Xing](https://www.xing.com/) for encouraging the development of this script. Hack weeks are awesome !

## Full-size screenshots

Issues list  
<img src="images/processed-issues-list.png" width="800">

Pull requests list  
<img src="images/processed-PR-list.png" width="800">
