const {getInstalledApps} = require('get-installed-apps')
getInstalledApps().then(apps => {
    console.log(apps)
})