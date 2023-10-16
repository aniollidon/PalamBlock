let socket = io();

socket.on('browsingActivity', function (data) {
    let alumnesList = document.getElementById("alumnesList");
    alumnesList.innerHTML = "";
    //chromeTabs.removeAllTabs();

    for (const alumne in data) {
        if (Object.hasOwnProperty.call(data, alumne)) {
            const alumneInfo = data[alumne];
            let alumneDiv = document.createElement("div");
            alumneDiv.setAttribute("class", "alumne-browser-container");
            alumneDiv.setAttribute("id", alumne + "-browser-container");

            let alumneDivHeader = document.createElement("div");
            alumneDivHeader.setAttribute("class", "alumne-browser-header");
            alumneDivHeader.setAttribute("id", alumne + "-browser-header");
            alumneDiv.appendChild(alumneDivHeader);
            alumneDivHeader.innerHTML = alumne;
            alumnesList.appendChild(alumneDiv);

            let alumneBrowsersDiv = document.createElement("div");
            alumneBrowsersDiv.setAttribute("class", "browsers");
            alumneDiv.appendChild(alumneBrowsersDiv);
            for (const browser in alumneInfo.browsers) {
                if (Object.hasOwnProperty.call(alumneInfo.browsers, browser)) {
                    const browserInfo = alumneInfo.browsers[browser];
                    let tbrowserDiv = document.createElement("div");
                    tbrowserDiv.setAttribute("class", "browser");
                    tbrowserDiv.setAttribute("id", browser);
                    tbrowserDiv.innerHTML = browserInfo.browser + " " + browserInfo.browserId;
                    alumneBrowsersDiv.appendChild(tbrowserDiv);
                    let tbrowserTabsDiv = document.createElement("div");
                    tbrowserTabsDiv.setAttribute("class", "tabs");
                    tbrowserDiv.appendChild(tbrowserTabsDiv);

                    // Create a browser
                    let browserDiv = document.createElement("div");
                    browserDiv.setAttribute("class", "chrome-tabs");
                    browserDiv.setAttribute("id", browser+ "-browser");
                    browserDiv.style = "--tab-content-margin: 9px;";
                    browserDiv.setAttribute("data-chrome-tabs-instance-id", browser);
                    alumneBrowsersDiv.appendChild(browserDiv);


                    let browserInfoDiv = document.createElement("div");
                    browserInfoDiv.setAttribute("class", "browser-info");
                    let browserIcon = document.createElement("img");
                    browserIcon.setAttribute("src", "img/" +browserInfo.browser + ".png");
                    browserIcon.setAttribute("class", "browser-icon");
                    browserInfoDiv.appendChild(browserIcon);
                    browserDiv.appendChild(browserInfoDiv);

                    let browserContent = document.createElement("div");
                    browserContent.setAttribute("class", "chrome-tabs-content");
                    browserDiv.appendChild(browserContent);

                    let browserTabsBottomBar = document.createElement("div");
                    browserTabsBottomBar.setAttribute("class", "chrome-tabs-bottom-bar");
                    browserDiv.appendChild(browserTabsBottomBar);

                    // opcions del menu

                    const obreUrl = (info) => {
                        const url = info.webPage.protocol + "//" + info.webPage.host + info.webPage.pathname + info.webPage.search
                        window.open(url, '_blank').focus();

                    }
                    const onBloqueja = (info) => {
                        socket.emit("addNorma", {
                            who: "alumne",
                            whoid: alumne,
                            severity: "block",
                            mode: "blacklist",
                            hosts_list: [info.webPage.host],
                            //protocols_list: [info.webPage.protocol],
                            //searches_list: [info.webPage.search],
                            pathnames_list: [info.webPage.pathname],
                            //titles_list: [info.webPage.title],
                            //enabled_on: undefined
                        })
                    }

                    const onBloquejaGrup = (info) => {
                        console.log("bloqueja");
                    }

                    const onAfegeixLlistaBlanca = (info) => {
                        console.log("bloqueja");
                    }
                    const menu_options = {
                        "Obre aquí": obreUrl,
                        "Bloqueja": onBloqueja,
                        "Bloqueja al grup": onBloquejaGrup,
                        "Afegeix a llista blanca": onAfegeixLlistaBlanca,
                    }

                    // init chrome tabs
                    let chromeTabs = new ChromeTabs()
                    chromeTabs.init(browserDiv, menu_options)
                    //browserDiv.addEventListener('activeTabChange', ({ detail }) => console.log('Active tab changed', detail.tabEl))
                    //browserDiv.addEventListener('tabAdd', ({ detail }) => console.log('Tab added', detail.tabEl))
                    browserDiv.addEventListener('tabRemove', ({ detail }) => {
                        console.log('Tab removed', detail.tabEl)
                        socket.emit("closeTab", { alumne: alumne, browser: browserInfo.browser, browserId: browserInfo.browserId, tabId: detail.tabEl.info.tabId })
                    });

                    for (const tab in browserInfo.tabs) {
                        if (Object.hasOwnProperty.call(browserInfo.tabs, tab)) {
                            const tabInfo = browserInfo.tabs[tab];
                            if(!tabInfo.opened) continue;
                            let ttabDiv = document.createElement("div");
                            ttabDiv.setAttribute("class", "tab");
                            ttabDiv.setAttribute("id", tab);
                            const url = tabInfo.webPage.protocol + "//" + tabInfo.webPage.host + tabInfo.webPage.pathname + tabInfo.webPage.search
                            ttabDiv.innerHTML = `${tabInfo.tabId}  <a href="${url}"> ${tabInfo.webPage.title} </a> ${tabInfo.incognito ? "[INCOGNITO]" : ""} ${tabInfo.active ? "ACTIVE" : "INACTIVE"}`
                            tbrowserTabsDiv.appendChild(ttabDiv);
                            chromeTabs.addTab({
                                title: tabInfo.webPage.title,
                                favicon: tabInfo.webPage.favicon,
                                info: tabInfo,
                            }, {
                                background: !tabInfo.active
                            })
                        }
                    }
                }
            }
        }
    }

});

