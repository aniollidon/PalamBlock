const axios = require("axios");
require('dotenv').config();
const {exec} = require('child_process');
const path = require("path");


class OperaTracker{
    constructor() {
        this.timeouts = {};
        this.captions = {};
        this.operaPath = "start"
    }

    async check(alumne) {
        try {
            const since = new Date() - process.env.OPERA_TRACKER_INTERVAL * 1000 || 5000;
            // Send a message to the server and check if has news from Opera extention
            await axios.get(process.env.API_PALAMBLOCK + '/alumne/' + alumne + '/browser/opera', {
                params: {
                    caption: this.captions[alumne],
                    since: since
                }
            }).then(async (res) => {
                if (!res.data.news)
                {
                    if(!this.caption[alumne].includes("PalamBlock")) {
                        console.log(`No news from Opera extention for ${alumne}`);
                        exec(`${this.operaPath} "${path.join(__dirname, 'opera-error.html')}"`).catch((error) => {
                            console.log(`Error: ${error.message}`);
                        });
                    }
                }
            });
        }
        catch (err) {
            console.error("No server connection");
        }
    }
    track(alumne, opera) {
        this.captions[alumne] = opera.caption.replace(/ - Opera$/, '');
        this.operaPath = opera.processPath;
        console.log(`Opera caption: ${this.captions[alumne]}`);

        if(!this.timeouts[alumne])
            this.timeouts[alumne] = setTimeout(
                ()=>{
                    this.check(alumne);
                    clearTimeout(this.timeouts[alumne]);
                    this.timeouts[alumne] = null;
                }, process.env.OPERA_TRACKER_INTERVAL * 1000 || 5000);
    }
}

const operaTracker = new OperaTracker();

exports.track = operaTracker.track.bind(operaTracker);