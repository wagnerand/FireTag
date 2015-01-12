let EXPORTED_SYMBOLS = [ "rpc" ];

if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://gre/modules/Services.jsm");

let rpc = {

    globalCount : 0,

    JSONRPCCall : function (json, callback, param) {
        let localCount = ++this.globalCount;
        let start = Date.now();

        let destination = dfki.FireTag.common.prefBranch.getCharPref("servers").split(",")[0].split("|")[0].trim();
        destination += "/pimodb/json-rpc";

        let p = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);

        p.onreadystatechange = function () {
            if (p.readyState === 4) {
                let subject = Components.classes["@mozilla.org/supports-string;1"].
                    createInstance(Components.interfaces.nsISupportsString);
                subject.data = p.status;
                Services.obs.notifyObservers(subject, "firetag-rpc-result", p.responseText);

                let duration = Date.now() - start;
                dfki.FireTag.common.LOG("RPC (" + localCount + ") took: " + duration / 1000 + "s");
                if (dfki.FireTag.common.prefBranch.getBoolPref("debug.rpc")) {
                    dfki.FireTag.common.LOG("RPC (" + localCount + ") response (" + p.status + "): " + p.responseText);
                }

                if (p.status === 200) {
                    if ((p.responseText) && (callback)) {
                        callback.call(this, p.responseText, param);
                    }
                }
            }
        };

        p.open("POST", destination);
        p.send(JSON.stringify(json));
        dfki.FireTag.common.LOG("RPC (" + localCount + ") to: " + destination + "\n " + JSON.stringify(json) + "\n");
    }

};
