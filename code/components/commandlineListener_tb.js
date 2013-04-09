Components.utils.import("resource:///modules/XPCOMUtils.jsm");

const nsICommandLineHandler = Components.interfaces.nsICommandLineHandler;

const CLASS_ID = Components.ID("{1bcae763-a497-40ea-89f2-089e38c07421}");
const CLASS_NAME = "FireTag Concept Search";
const CONTRACT_ID = "@mozilla.org/commandlinehandler/general-startup;1?type=messageidopener";
const CATEGORY = "m-messageidopener";

function MessageIdOpener() {
    Components.utils.import("resource:///modules/gloda/public.js");
    Components.utils.import("resource:///modules/MailUtils.js");
}

MessageIdOpener.prototype = {

    classDescription : CLASS_NAME,
    classID : CLASS_ID,
    contractID : CONTRACT_ID,

    QueryInterface: XPCOMUtils.generateQI([nsICommandLineHandler]),

    _xpcom_categories: [{
        category: "command-line-handler",
        entry: "m-messageidopener"
    }],

    handle : function clh_handle(cmdLine) {
        try {
            let uristr = cmdLine.handleFlagWithParam("message-id", false);
            if (uristr) {
                if (uristr.substr(0, 11) === "message-id:") {
                    uristr = uristr.substr(11);
                    if (uristr.substr(0, 2) === "//") {
                        uristr = uristr.substr(2);
                    }
                    if (uristr.substr(uristr.length - 1) === "/") {
                        uristr = uristr.substr(0, uristr.length - 1);
                    }
                }
                let query = Gloda.newQuery(Gloda.NOUN_MESSAGE);
                query.headerMessageID(uristr);

                let messageIdListener = {
                        onItemsAdded: function myListener_onItemsAdded(aItems, aCollection) {},
                        onItemsModified: function myListener_onItemsModified(aItems, aCollection) {},
                        onItemsRemoved: function myListener_onItemsRemoved(aItems, aCollection) {},
                        onQueryCompleted: function myListener_onQueryCompleted(aCollection) {
                            let message = aCollection.items[0];

                            let messen = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);
                            let msgService = messen.messageServiceFromURI(message.folderMessageURI);
                            let msgHdr = msgService.messageURIToMsgHdr(message.folderMessageURI);
                            MailUtils.displayMessage(msgHdr);
                        }
                    };
                query.getCollection(messageIdListener);
            }
        } catch (e) {
            Components.utils.reportError("incorrect parameter passed to -message-id on the command line.");
        }
    },

    helpInfo : "  -message-id <id>     Open email by message-id \n"
};

const NSGetFactory = XPCOMUtils.generateNSGetFactory([ MessageIdOpener ]);
