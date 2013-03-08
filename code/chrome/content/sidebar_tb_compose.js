function componentConstruct() {
    if (Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") > -1) {
        let head = Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders;
        this.draftId = head.match(/X-PIMO-DRAFTURI: message-draft-id:\/\/[\w]{8}-[\w]{4}-[\w]{4}-[\w]{4}-[\w]{12}/);
        dfki.FireTag.common.LOG("Recovered X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " from header.");
    }
}

Sidebar.prototype.addListeners = function() {
    var self = this;
    window.setInterval(function() { self.rebuildSidebar.call(self, true); }, 10000);

//    let code=""; while(code = prompt("Enter code", code)) alert(eval(code));

    let sendOrCloseListener = function() {
        let head = "X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + "\r\n";
        if ((Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") < 0) && (dfki.FireTag.instance.annotatedConcepts.length > 0)) {
            Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders += head;
            dfki.FireTag.common.LOG("Added X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " to header.");
        } else if ((Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.indexOf("X-PIMO-DRAFTURI:") > -1) && (dfki.FireTag.instance.annotatedConcepts.length < 1)) {
            Sidebar.mainWin.gMsgCompose.compFields.otherRandomHeaders.replace(head, "");
            dfki.FireTag.common.LOG("Removed X-PIMO-DRAFTURI: " + dfki.FireTag.instance.draftId + " from header.");
        }
    }

    Sidebar.mainWin.addEventListener( "compose-send-message", sendOrCloseListener, true );
    Sidebar.mainWin.addEventListener( "compose-window-close", sendOrCloseListener, true );
};

Sidebar.STRIP_PER_RESOURCE = 1000;
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
            label : Sidebar.getPimoResourceLabel(resources[i])
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
    var allText = "";
    var subject = resource.subject;
    if (subject) {
        allText += subject + "\n";
    }
    var body = Sidebar.getMessageBody(resource);
    if (body) {
        allText += body.substring(0, Sidebar.STRIP_PER_RESOURCE) + "\n";
    }
    return allText;
};

Sidebar.getMessageBody = function(aMessageHeader) {
    return Sidebar.mainWin.GetCurrentEditor().outputToString("text/plain", 4);
};
