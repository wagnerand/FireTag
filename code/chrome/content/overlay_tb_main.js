if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}
if (!dfki.FireTag.overlay) {
    dfki.FireTag.overlay = {};
}
if (!dfki.FireTag.overlay.tb) {
    dfki.FireTag.overlay.tb = {};
}
if (!dfki.FireTag.overlay.tb.main) {
    dfki.FireTag.overlay.tb.main = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

dfki.FireTag.overlay.tb.main.init = function() {
    window.removeEventListener("load", dfki.FireTag.overlay.tb.main.init, false);

    var notificationService = Components.classes["@mozilla.org/messenger/msgnotificationservice;1"].getService(Components.interfaces.nsIMsgFolderNotificationService);

    var sentMailListener = {
        msgsClassified: function(aMsgs, aJunkProcessed, aTraitProcessed) {
            for (var hdr in fixIterator(aMsgs.enumerate(), Components.interfaces.nsIMsgDBHdr)) {

                // Is this message a draft? Then don't try to change the uri!
                if (hdr.folder.getFlag(0x00000400) == false) {
                    let jsonCheckExisting = {
                        method : "PimoQueryApi.isExisting",
                        params : [ dfki.FireTag.common.authKey, hdr.messageId ]
                    };

                    var callbackCheckExisting =  function (response) {
                        var result = JSON.parse(response).result;
                        if (result == false) {
                            let uri = hdr.folder.getUriForMsg(hdr);
                            let messageService = Components.classes["@mozilla.org/messenger;1"]
                                .createInstance(Components.interfaces.nsIMessenger)
                                .messageServiceFromURI(uri);

                            MsgHdrToMimeMessage(hdr, null,
                                function (aMsgHdr, aMimeMsg) {
                                    if (aMimeMsg.has("X-PIMO-DRAFTURI")) {
                                        let jsonChangeURI = {
                                            method : "PimoManipulationApi.changeResourceUri",
                                            params : [ dfki.FireTag.common.authKey, aMimeMsg.get("X-PIMO-DRAFTURI"), "message-id://" + hdr.messageId ]
                                        };
                                        dfki.FireTag.rpc.JSONRPCCall(jsonChangeURI);
                                    }
                                }, true, {
                                    partsOnDemand: true
                                });
                        }
                    };
                    dfki.FireTag.rpc.JSONRPCCall(jsonCheckExisting, callbackCheckExisting);
                }
            }
        }
    };

    notificationService.addListener(sentMailListener, notificationService.msgsClassified);

    /*
     * COLUMN HANDLER DEMO
     */
    //        Services.obs.addObserver({
    //            observe: function (aMsgFolder, aTopic, aData) {
    //                window.gDBView.addColumnHandler("betweenCol", columnHandler);
    //            }
    //        }, "MsgCreateDBView", false);
    //        try {
    //            window.gDBView.addColumnHandler("betweenCol", columnHandler);
    //        } catch (e) {
    // This is really weird, but rkent does it for junquilla, and this solves
    //  the issue of enigmail breaking us... don't wanna know why it works,
    //  but it works.
    // After investigating, it turns out that without enigmail, we have the
    //  following sequence of events:
    // - jsm load
    // - onload
    // - msgcreatedbview
    // With enigmail, this sequence is modified
    // - jsm load
    // - msgcreatedbview
    // - onlaod
    // So our solution kinda works, but registering the thing at jsm load-time
    //  would work as well.
    //        }
};

window.addEventListener("load", dfki.FireTag.overlay.tb.main.init, false);
