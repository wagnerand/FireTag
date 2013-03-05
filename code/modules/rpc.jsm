var EXPORTED_SYMBOLS = [ "rpc" ];

if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

var rpc = {

    JSONRPCCall : function (json, callback, param) {

        var host = dfki.FireTag.common.prefBranch.getCharPref("server.host");
        var port = dfki.FireTag.common.prefBranch.getCharPref("server.port");
        var path = dfki.FireTag.common.prefBranch.getCharPref("server.path");

        var p = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                .createInstance(Components.interfaces.nsIXMLHttpRequest);
        var destination = "http://" + host + ":" + port + "/" + path;

        p.onreadystatechange = function () {
            if (p.readyState == 4) {
                if (p.status == 200) {
                    if ((p.responseText) && (callback)) {
                        callback.call(this, p.responseText, param);
                    }
                }
            }
        };

        p.open("POST", destination);
        p.send(JSON.stringify(json));
        dfki.FireTag.common.LOG("JSON sent to: " + destination + "\n " + JSON.stringify(json) + "\n");
    }

};
