Sidebar.prototype.addListeners = function() {
    var self = this;
    window.setInterval(function() { self.rebuildSidebar.call(self, true); }, 10000);
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
    let originalId = Sidebar.mainWin.gMsgCompose.compFields.messageId;
    let cleanedId = originalId.replace("<", "").replace(">", "");
    return "message-id://" + cleanedId;
};

Sidebar.getPimoResourceLabel = function(resource) {
    return Sidebar.mainWin.gMsgCompose.compFields.subject;
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
