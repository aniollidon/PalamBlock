require('dotenv').config();
const {exec} = require('child_process');
const fs = require('fs');
const path = require('path');
let username = 'unknown';


try {
    // Check login on hidden file
    username = fs.readFileSync(path.join(__dirname, 'login.txt'), 'utf8');
} catch (err) {
    // No login file, create one
    require('./login-launcher')
}


// Execute the 'tasklist' command with the specified filters and format
exec('tasklist /v /fo csv /NH /fi  "STATUS eq RUNNING" | findstr /V /I /C:"N/D"', (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }

    if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
    }

    // Split the output into lines
    const lines = stdout.split('\r\n');
    // Remove the last line, which is empty
    lines.pop();
    // Split each csv line into an array of columns
    const processes = lines.map(line => line.split('","'));
    // Extract the process name from each line
    const processNames = processes.map(process => process[0].replace('"', ''));
    const processIds = processes.map(process => process[1]);
    const processTitles = processes.map(process => process[8].replace('"', ''));

    // Load common windows processes whitelist
    const commonWindowsProcessNames =
        fs.readFileSync(path.join(__dirname, 'common-windows-processes.txt'), 'utf8')
            .split('\r\n');
    const commonWindowsProcessTitles =
        fs.readFileSync(path.join(__dirname, 'common-windows-processes-titles.txt'), 'utf8')
            .split('\r\n');

    // create a dict with the process name as key and the process id as value
    const processNameId = {};
    const significativeProcesses = [];

    for (let i = 0; i < processNames.length; i++) {
        if (commonWindowsProcessNames.includes(processNames[i])) continue;
        if (commonWindowsProcessTitles.includes(processTitles[i])) continue;

        if (!processNameId[processNames[i]])
            processNameId[processNames[i]] = []

        processNameId[processNames[i]].push(processIds[i]);
        significativeProcesses.push(processNames[i]);
    }

    // Ensure uniqueness
    significativeProcesses.filter((value, index) => significativeProcesses.indexOf(value) === index);

    console.log(significativeProcesses);

    // Send processes to server to validate
    const axios = require('axios');
    axios.post(process.env.API_PALAMBLOCK + '/validacio/apps', {
        apps: significativeProcesses,
        alumne: username
    })
        .then((res) => {
            console.log(res.data);
            const doList = res.data.do;

            for (const process of significativeProcesses) {
                if (doList[process] === 'block' || doList[process] === 'uninstall') {
                    for (const pid of processNameId[process]) {
                        exec(`taskkill /PID ${pid} /F`, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`Error: ${error.message}`);
                                return;
                            }

                            if (stderr) {
                                console.error(`Error: ${stderr}`);
                                return;
                            }

                            console.log(`stdout: ${stdout}`);
                        });
                    }
                }
                if (doList[process] === 'uninstall') {
                    // TODO get uninstall command from list
                    // read uninstall-apps.json

                    exec(``, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`Error: ${error.message}`);
                            return;
                        }

                        if (stderr) {
                            console.error(`Error: ${stderr}`);
                            return;
                        }

                        console.log(`stdout: ${stdout}`);
                    });
                }
            }
        }).catch((err) => {
            console.error(err);
    });
});



