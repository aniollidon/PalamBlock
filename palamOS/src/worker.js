require('dotenv').config();
const {exec, execSync} = require('child_process');
const fs = require('fs');
const path = require('path');
const { listOpenWindows } = require('@josephuspaye/list-open-windows');
const iconExtractor = require('extract-file-icon');

const axios = require("axios");
const si = require('systeminformation');
const {getInstalledApps} = require("get-installed-apps");
let username = 'unknown';


try {
    // Check login on hidden file
    username = fs.readFileSync(path.join(__dirname, 'login.txt'), 'utf8');
} catch (err) {
    // No login file, create one
    require('./login-launcher')
}

async function getCurrentPrograms(){
    // Get the list of open windows
    const windows = listOpenWindows();

    if(windows.find((win) => { return win.className === 'ApplicationFrameWindow' })) {

        // Search all process & get ApplicationFrameWindow process
        const allProcesses = await si.processes();
        const afw = allProcesses.list.find((proc) => proc.name === 'ApplicationFrameHost.exe');

        // update the list of Windows apps
        return await updateWindowsAppDetails(windows, allProcesses, afw);
    }

    return windows;
}

function getIcon(path){
    let buffer = iconExtractor(path, 64);
    if(!buffer.length)
        buffer = iconExtractor(path, 32);
    if(!buffer.length)
        buffer = iconExtractor(path, 16);
    return buffer;
}

async function updateWindowsAppDetails(winapps, allprocesses, afw){
    if(!afw) return [];

    const appsList = allprocesses.list.filter((proc) => proc.parentPid === afw.parentPid);

    // load from json
    const matchlist = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "assets",  "ApplicationFrameWindow-apps.json"), 'utf8'));

    for (const app of winapps) {
        if(app.className === 'TaskManagerWindow') {
            app.hide = true;
            continue;
        }
        if(app.className !== 'ApplicationFrameWindow') continue;
        const appName = app.caption.toLowerCase();
        let iconSVG = undefined;
        let appData = appsList.find((proc) => path.parse(proc.name).name.toLowerCase().includes(appName));

        if(!appData && matchlist[appName]){
            if(matchlist[appName].hide) {
                app.hide = true;
                continue;
            }

            appData = appsList.find((proc) => proc.name.toLowerCase().includes(matchlist[appName].tip));
            iconSVG = matchlist[appName].iconSVG;
        }

        if(appData) {

            if(!fs.existsSync(appData.path))
                app.processPath = path.join(appData.path, '..', appData.name);
            else if(fs.lstatSync(appData.path).isDirectory())
                app.processPath = path.join(appData.path, appData.name);
            else
                app.processPath = appData.path;

            app.name = appData.name;
            app.className = appName;
            app.processId = appData.pid;
            app.iconSVG = iconSVG;
        }
    }

    // Filter hidden apps
    return winapps.filter((app) => !app.hide);
}
async function sendPrograms(){
    const programs = await getCurrentPrograms();
    const programsToSend = [];
    for (let program of programs) {
        let icon = program.iconSVG;
        let iconType = 'svg';

        if(!program.iconSVG) {
            const iconBuffer = await getIcon(program.processPath);
            icon = iconBuffer.toString('base64');
            iconType = 'base64';
        }
        programsToSend.push({
            name: path.basename(program.processPath),
            title: program.caption,
            path: program.processPath,
            icon: icon,
            iconType: iconType,
            pid: program.processId
        });
    }

    await axios.post(process.env.API_PALAMBLOCK + '/validacio/apps', {
        apps: programsToSend,
        alumne: username
    }).then(async (res) => {
        const doList = res.data.do;

        for (const process of programsToSend) {
            if(!doList[process.pid]) continue;

            if (doList[process.pid] === 'close' || doList[process.pid] === 'block' || doList[process.pid].includes('uninstall')) {
                try {
                    // Tanca el procés
                    const res = execSync(`taskkill /PID ${process.pid} /F`);
                    console.log(res.toString());
                }
                catch (err) {
                    console.error(err);
                }
            }
            if (doList[process.pid].includes('uninstall')) {
                const nameNoExt = path.parse(process.name).name;
                let uninstalled = false;
                // Primer prova de desintal·lar si s'ha instal·lat per la store
                try {
                    const res = execSync("powershell -command \"Get-AppxPackage | Where-Object { $_.Name -like \\\"*" + nameNoExt + "*\\\" } | ForEach-Object { Remove-AppxPackage -Package $_.PackageFullName }\"")
                    console.log(res.toString());
                    uninstalled = res.length > 0;
                }
                catch (err) {
                    console.error(err);
                }

                if(!uninstalled){
                    // Segon mètode: Busca i fes corre l'uninstal·lador
                    const apps = await getInstalledApps();
                    const appDir = path.dirname(process.path);
                    const apptodelete = apps.find((app) =>
                        (app.InstallLocation? app.InstallLocation : app.InstallSource) === appDir);
                    if(apptodelete){
                        try {
                            if(apptodelete.UninstallString) {
                                const res = execSync(apptodelete.UninstallString);
                                console.log(res.toString());
                                uninstalled = res.length > 0;
                            }
                        }
                        catch (err) {
                            console.error(err);
                            // Torna a provar amb el paràmetre --force-uninstall
                            if(apptodelete.UninstallString) {
                                const res = execSync(apptodelete.UninstallString + " --force-uninstall");
                                console.log(res.toString());
                                uninstalled = res.length > 0;
                            }
                        }
                    }
                }

                if(!uninstalled && doList[process.pid].includes('force_uninstall')){
                    // Tercer mètode: Esborra el contingut de l'executable

                    const protectedDirs = [ // Directoris protegits
                        "C:\\Windows\\",
                        "C:\\Program Files\\",
                        "C:\\Program Files (x86)\\",
                    ];

                    if(!protectedDirs.find((dir) => process.path.startsWith(dir))) {
                        // Destrossa el programa ☠ UAHAHAHA!
                        fs.writeFileSync(process.path, "");
                        uninstalled = true;
                    }
                }

                if(!uninstalled){
                    // No s'ha pogut desinstal·lar
                    axios.post(process.env.API_PALAMBLOCK + '/apps/uninstall', {
                        app: process,
                        status: 'error',
                        alumne: username
                    }).then((res) => {
                        console.log(res.data);
                    }).catch((err) => {
                        console.error(err);
                    });
                }
            }
        }
    }).catch((err) => {
        console.error("Server not found");
    });


}

sendPrograms();
setInterval(()=>{
    try{
        console.log("Sending programs");
        sendPrograms();
    }
    catch(err){
        console.error(err);
    }
}, process.env.UPDATE_INTERVAL * 1000)

