let EXPORTED_SYMBOLS = [ "common" ];

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/devtools/Console.jsm");

let common = {
    authKey : null,
    autoComplete : [],
    prefBranch : Services.prefs.getBranch("extensions.dfki.FireTag."),
    LOG : function(message, ...args) {
        if (this.prefBranch.getBoolPref("debug")) {
            console.log("[FireTag] " + message, args);
        }
    }
};
