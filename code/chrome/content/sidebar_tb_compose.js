function componentConstruct() {
// not working as otherRandomHeaders is empty!
//    if (Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") > -1) {
//        let head = Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders;
//        this.draftId = head.match(/X-PIMO-DRAFTURI: message-draft-id:\/\/[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}/);
//        dfki.FireTag.common.LOG("Recovered X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " from header.");
//    }
}

Sidebar.prototype.addListeners = function() {
    let self = this;
    let rebuildTimer = setInterval(function() { dfki.FireTag.instance.rebuildSidebarIfDifferentOBIEResultsAreAvaible.call(self); }, 10000);

//    let code=""; while(code = prompt("Enter code", code)) alert(eval(code));

    let sendOrCloseListener = function() {
        Sidebar.mainWin.removeEventListener( "compose-send-message", sendOrCloseListener, false);

        let head = "X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + "\r\n";
        if ((Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") < 0) && (dfki.FireTag.instance.annotatedConcepts.length > 0)) {
            Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders += head;
            dfki.FireTag.common.LOG("Added X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " to header.");
        } else if ((Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") > -1) && (dfki.FireTag.instance.annotatedConcepts.length < 1)) {
            Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.replace(head, "");
            dfki.FireTag.common.LOG("Removed X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " from header.");
        }
        dfki.FireTag.common.LOG("Destroying cached X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId);
        dfki.FireTag.instance.draftId = null;
    };

    Sidebar.mainWin.addEventListener( "compose-send-message", sendOrCloseListener, false);
    //not working as otherRandomHeaders is empty when the window gets reopened, so no need to save our header on close
    //Sidebar.mainWin.addEventListener( "compose-window-close", sendOrCloseListener, false);

    Sidebar.mainWin.document.getElementById("FireTagToggleSidebar").setAttribute("checkState", "1");
    Sidebar.mainWin.document.getElementById("FireTagToggleSidebar").setAttribute("checked", "true");

    window.addEventListener("unload", function() {
        clearInterval(rebuildTimer);

        Sidebar.mainWin.document.getElementById("FireTagToggleSidebar").setAttribute("checkState", "0");
        Sidebar.mainWin.document.getElementById("FireTagToggleSidebar").removeAttribute("checked");
    }, true);

    Sidebar.mainWin.addEventListener("compose-window-close", function() {
        if (rebuildTimer) {
            clearInterval(rebuildTimer);
            dfki.FireTag.instance.resetSidebar();
        }
    }, true);
};

Sidebar.prototype.publish = function (resources, defer) {
    let execute = function(aMsgID, aMsgSize) {
        for (let i = 0, len = resources.length; i < len; i++) {
            let resourceURI = resources[i].uri;
            let json = {
                method: "PimoGroupApi.setPublic",
                params: [ dfki.FireTag.common.authKey, resourceURI, true ]
            };
            dfki.FireTag.rpc.JSONRPCCall(json);
        }
    };

    if (defer) {
        let sendListener = {
            onStartSending : function(aMsgID, aMsgSize) { execute(aMsgID, aMsgSize); },
            onProgress : function(aMsgID, aProgress, aProgressMax) {},
            onStatus : function(aMsgID, aMsg) {},
            onStopSending : function(aMsgID, aStatus, aMsg, aReturnFile) {},
            onGetDraftFolderURI : function(aFolderURI) {},
            onSendNotPerformed : function(aMsgID, aStatus) {}
        };

        Sidebar.mainWin.gMsgCompose.addMsgSendListener(sendListener);
    } else {
        execute(null, null);
    }
};

Sidebar.STRIP_PER_RESOURCE = 10000;
Sidebar.annotationSearchBoxName = "annotationSearchBoxTb";
Sidebar.mainWin = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).
    getInterface(Components.interfaces.nsIWebNavigation).
    QueryInterface(Components.interfaces.nsIDocShellTreeItem).
    rootTreeItem.
    QueryInterface(Components.interfaces.nsIInterfaceRequestor).
    getInterface(Components.interfaces.nsIDOMWindow);

Sidebar.getCurrentResources = function() {
    return [Sidebar.mainWin.gMsgCompose.compFields];
};

Sidebar.getCurrentSelectionCount = function() {
    return 1;
};

Sidebar.getResourcesMetadata = function(resources) {
    let result = [];
    for (let i = 0, len = resources.length; i < len; i++) {
        result.push({
            uri : Sidebar.getPimoResourceUri(resources[i]),
            label : Sidebar.getPimoResourceLabel(resources[i]),
            type : "pimo:informationelement#Email"
            /*
            messageURI : resources[i].folder.getUriForMsg(resources[i]),

            date : resources[i].dateInSeconds,
            folderURL : resources[i].folder.folderURL,
            folderName : resources[i].folder.name,
            from : resources[i].author,
            to : resources[i].recipients,
            cc : resources[i].ccList,
            bcc : resources[i].bccList,
            subject : resources[i].subject
             */
        });
    }
    return result;
};

Sidebar.getPimoResourceUri = function(resource) {
    // This is not the messageId! It is an internal id because the messageId might change when the draft is saved.
    let draftId = dfki.FireTag.instance.draftId;
    if (!draftId) {
        let uuidGenerator = Components.classes["@mozilla.org/uuid-generator;1"].getService(Components.interfaces.nsIUUIDGenerator);
        let uuidPtr = uuidGenerator.generateUUID();
        dfki.FireTag.instance.draftId = "message-draft-id://" + uuidPtr.number.replace("{", "").replace("}", "");
        dfki.FireTag.common.LOG("Created new X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId);
    }

    return dfki.FireTag.instance.draftId
};

Sidebar.getPimoResourceLabel = function(resource) {
    return Sidebar.mainWin.document.getElementById("msgSubject").value;
};

Sidebar.getResourceTextForOBIE = function(resource) {
    let allText = "";
    let subject = resource.subject;
    if (subject) {
        allText += subject + "\n";
    }
    let body = Sidebar.getMessageBody(resource);
    if (body) {
        allText += body.substring(0, Sidebar.STRIP_PER_RESOURCE) + "\n";
    }
    return allText;
};

Sidebar.getMessageBody = function(aMessageHeader) {
    return Sidebar.mainWin.GetCurrentEditor().outputToString("text/plain", 4);
};
