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
        let splitter = document.getElementById("FireTagSplitter");
        if (!splitter.getAttribute("state")) {
            splitter.setAttribute("state", "open");
        }
    },

    init : function () {
        let overlayPrefListener = new dfki.FireTag.prefObserver(function (branch, name) {
            switch (name) {
            case "server.authKey":
                let authKey = dfki.FireTag.common.prefBranch.getCharPref("server.authKey");
                dfki.FireTag.common.authKey = authKey;
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

        let sidebar = document.getElementById("FireTagSidebar");
        if (sidebar) {
            sidebar.setAttribute("src", "chrome://FireTag/content/sidebar_tb_main.xul");
        }
    }
};

window.addEventListener("load", dfki.FireTag.overlay.init, false);
