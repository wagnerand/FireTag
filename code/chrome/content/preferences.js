if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

function init() {
    let serverListElem = document.getElementById("servers");
    let prefServers = dfki.FireTag.common.prefBranch.getCharPref("servers");

    /*serverListElem.addEventListener("popupshown", function(event) {
        window.addEventListener("keypress",
            function(event) {
                if (event.keyCode == KeyboardEvent.DOM_VK_DELETE) {
                    dump(serverListElem.selectedIndex + "\n");
                    //serverListElem.removeItemAt();
                }
            }, true);
    });*/
    if (prefServers) {
        let servers = prefServers.split(",");
        for (let i = 0; i < servers.length; i++) {
            serverListElem.appendItem(servers[i]);
        }
        serverListElem.value = servers[0];
    }
}

function ok() {
    let serverListElem = document.getElementById("servers");
    let prefServers = [];
    if (serverListElem.value) {
        prefServers.push(serverListElem.value);
    }
    for (let i = 0; i < serverListElem.itemCount; i++) {
        let curr = serverListElem.getItemAtIndex(i);
        if (curr.label != serverListElem.value) {
            prefServers.push(curr.label);
        }
    }
    dfki.FireTag.common.prefBranch.setCharPref("servers", prefServers.join(","));
}
