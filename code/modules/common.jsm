let EXPORTED_SYMBOLS = [ "common" ];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/devtools/Console.jsm");

let common = {
    authKey : null,
    autoComplete : [],
    prefBranch : Services.prefs.getBranch("extensions.dfki.FireTag."),
    LOG : function(message) {
        if (this.prefBranch.getBoolPref("debug")) {
            console.log((new Date().toISOString()) + " [FireTag] " + message);
        }
    }
};
