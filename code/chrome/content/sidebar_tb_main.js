function componentConstruct() {
}

Sidebar.STRIP_PER_RESOURCE = 1000;
Sidebar.annotationSearchBoxName = "annotationSearchBoxTb";

//var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
Components.utils.import("resource:///modules/gloda/public.js");

Sidebar.prototype.addListeners = function() {
//    let code=""; while(code = prompt("Enter code", code)) alert(eval(code));
    if (window.top.document.location == "chrome://messenger/content/messenger.xul") {
        let msgTree = window.top.GetThreadTree();
        let self = this;
        msgTree.addEventListener("select", function() { self.rebuildSidebar.call(self); }, false);

        let folderTree = window.top.document.getElementById("folderTree");
        folderTree.addEventListener("select", function() { self.rebuildSidebar.call(self); }, false);

//        var msgDisplayedObserver = {
//                observe : function(subject, topic, data) {
//                    var msgDbHdr = messen.messageServiceFromURI(data).messageURIToMsgHdr(data);
//                    rebuildSidebar();
//                }
//        };

//        observerService.addObserver(msgDisplayedObserver, "MsgMsgDisplayed", false);

        let tabMonitor = {
            monitorName : "FireTag_tabMonitor",
            onTabTitleChanged : function (aTab) {},
            onTabSwitched : function (aTab, aOldTab) {
                if (aTab.mode.name == "folder") {
                    self.rebuildSidebar.call(self);
                } /*else if (aTab.mode.name == "message") {
                 var msgHdr = aTab.folderDisplay.selectedMessage;
                 getPimoResults([msgHdr]);
                 }*/
            },
            onTabOpened : function (aTab, aIsFirstTab, aWasCurrentTab) {},
            onTabClosing :  function (aTab) {},
            onTabPersist : function (aTab) {},
            onTabRestored : function (aTab, aState, aIsFirstTab) {}
        };
        window.top.document.getElementById("tabmail").registerTabMonitor(tabMonitor);
    } /*else if (window.top.document.location == "chrome://messenger/content/messengercompose/messengercompose.xul") {
     var msgHdr = window.top.messageSinkHeader.mSaveHdr;
     getPimoResults([msgHdr]);
     }*/
};

Sidebar.getCurrentResources = function() {
    return window.top.gFolderDisplay.selectedMessages;
};

Sidebar.getCurrentSelectionCount = function() {
    return window.top.gFolderDisplay.selectedCount;
};

Sidebar.getResourcesMetadata = function(resources) {
    let result = [];
    for (let i = 0, len = resources.length; i < len; i++) {
        result.push({
            uri : Sidebar.getPimoResourceUri(resources[i]),
            label : Sidebar.getPimoResourceLabel(resources[i]),
            messageURI : resources[i].folder.getUriForMsg(resources[i]),
            date : resources[i].dateInSeconds,
            folderURL : resources[i].folder.folderURL,
            folderName : resources[i].folder.name,
            from : resources[i].author,
            to : resources[i].recipients,
            cc : resources[i].ccList,
            bcc : resources[i].bccList,
            subject : resources[i].subject
        });
    }
    return result;
};

Sidebar.getPimoResourceUri = function(resource) {
    if ((resource) && (resource.messageId)) {
        return "message-id://" + resource.messageId;
    }
    return null;
};

Sidebar.getPimoResourceLabel = function(resource) {
    if ((resource) && (resource.subject)) {
        return resource.subject;
    }
    return null;
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
    let messenger = Components.classes["@mozilla.org/messenger;1"].
        createInstance(Components.interfaces.nsIMessenger);
    let listener = Components.classes["@mozilla.org/network/sync-stream-listener;1"].
        createInstance(Components.interfaces.nsISyncStreamListener);
    let uri = aMessageHeader.folder.getUriForMsg(aMessageHeader);
    messenger.messageServiceFromURI(uri).streamMessage(uri, listener, null, null, false, "");
    let folder = aMessageHeader.folder;
    return folder.getMsgTextFromStream(listener.inputStream, aMessageHeader.Charset, 65536, 32768, false, true, { });
};
