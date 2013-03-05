Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

function init() {
    window.removeEventListener("load", init, false);
//    let code=""; while(code = prompt("Enter code", code)) alert(eval(code));
    var mySendListener = {
        onStartSending : function(aMsgID, aMsgSize) {},
        onProgress : function(aMsgID, aProgress, aProgressMax) {},
        onStatus : function(aMsgID, aMsg) {},
        onStopSending : function(aMsgID, aStatus, aMsg, aReturnFile) {
            if (Components.isSuccessCode(aStatus)) {
                let msgId = aMsgID.slice(1,-1);
                dfki.FireTag.common.sentMsgs.push(msgId);
            }
        },
        onGetDraftFolderURI : function(aFolderURI) {},
        onSendNotPerformed : function(aMsgID, aStatus) {}
    };

    gMsgCompose.QueryInterface(Components.interfaces.nsIMsgCompose).addMsgSendListener(mySendListener);
}

window.addEventListener("load", init, false);
