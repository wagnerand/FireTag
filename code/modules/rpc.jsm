let EXPORTED_SYMBOLS = [ "rpc" ];

if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

let rpc = {

    globalCount : 0,

    JSONRPCCall : function (json, callback, param) {
        let localCount = ++this.globalCount;
        let start = Date.now();

        let host = dfki.FireTag.common.prefBranch.getCharPref("server.host");
        let port = dfki.FireTag.common.prefBranch.getCharPref("server.port");
        let path = dfki.FireTag.common.prefBranch.getCharPref("server.path");

        let p = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);
        let destination = "http://" + host + ":" + port + "/" + path;

        p.onreadystatechange = function () {
            if (p.readyState === 4) {
                if (p.status === 200) {
                    let duration = Date.now() - start;
                    dfki.FireTag.common.LOG("RPC (" + localCount + ") took: " + duration / 1000 + "s");
                    if ((p.responseText) && (callback)) {
                        if (dfki.FireTag.common.prefBranch.getBoolPref("debug.rpc")) {
                            dfki.FireTag.common.LOG("RPC (" + localCount + ") response: " + p.responseText);
                        }
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
