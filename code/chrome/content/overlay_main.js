if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/prefObserver.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/rpc.jsm", dfki.FireTag);

dfki.FireTag.overlay = {

    storeSidebarState : function () {
        let splitter = document.getElementById("FireTagSidebar-splitter");
        if (!splitter.getAttribute("state")) {
            splitter.setAttribute("state", "open");
        }
    },

    init : function () {
        let overlayPrefListener = new dfki.FireTag.prefObserver(function (branch, name) {
            switch (name) {
            case "servers":
                dfki.FireTag.common.authKey = dfki.FireTag.common.prefBranch.getCharPref("servers").split(",")[0].split("|")[1].trim();
                break;
            case "autocomplete.showDocuments":
                let showDocuments = dfki.FireTag.common.prefBranch.getBoolPref("autocomplete.showDocuments");
                dfki.FireTag.common.showDocuments = showDocuments;
                break;
            case "autocomplete.showTasks":
                let showTasks = dfki.FireTag.common.prefBranch.getBoolPref("autocomplete.showTasks");
                dfki.FireTag.common.showTasks = showTasks;
                break;
            }
        });

        overlayPrefListener.register(true);
    }
};

window.addEventListener("load", dfki.FireTag.overlay.init, false);
