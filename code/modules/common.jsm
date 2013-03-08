var EXPORTED_SYMBOLS = [ "common" ];

Components.utils.import("resource://gre/modules/Services.jsm");

var common = {
    authKey : null,
    autoComplete : [],
    prefBranch : Services.prefs.getBranch("extensions.dfki.FireTag."),
    LOG : function(message) {
        if (this.prefBranch.getBoolPref("debug")) {
            let now = new Date().toISOString();
            dump(now + " [FireTag] " + message + "\n");
        }
    }
};
