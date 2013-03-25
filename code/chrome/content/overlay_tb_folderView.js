Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/prefObserver.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/rpc.jsm", dfki.FireTag);


function gPimoFolderTreeItem(aId, aLabel) {
    this._id = aId;
    this._text = aLabel;
}

gPimoFolderTreeItem.prototype = {
    get id() {
        return this._id;
    },
    get text() {
        return this._text;
    },
    get level() {
        return 0;
    },
    open : true,
    get children() {
        return [];
    },
    getProperties : function() {
        return null;
    },
    command : function() {
    }
};

let gPimoFolderTreeMode = {
    __proto__ : IFolderTreeMode,
    generateMap: function (aFolderTreeView) {
        let json = {
            method : "PimoSchemaQueryApi.getThingsOfTypeAndSubTypes",
            params : [dfki.FireTag.common.authKey, "pimo:thing#Thing", 0, 0]
        };
        let callback = function (response, counter) {
            let rpcResult = JSON.parse(response).result;
            let map = [];
            for (let i = 0, len = rpcResult.length; i < len; i++) {
                if (testConceptIsOfType(rpcResult[i], "pimo:informationelement#InformationElement")) {
                    continue;
                }
                if (testConceptIsOfType(rpcResult[i], "pimo:thing#Document")) {
                    if (!dfki.FireTag.common.showDocuments)
                        continue;
                }
                if (testConceptIsOfType(rpcResult[i], "pimo:thing#Task")) {
                    if (!dfki.FireTag.common.showTasks)
                        continue;
                }

                map.push(new gPimoFolderTreeItem(rpcResult[i].uri, rpcResult[i].label.trim()));
            }
            gFolderTreeView._rowMap = map;
            gFolderTreeView._tree.rowCountChanged(0, map.length);
        };
        dfki.FireTag.rpc.JSONRPCCall.call(this, json, callback);

        return [];
    },

    getParentOfFolder: function (aFolder) {
      //return aFolder.parent;
      return null;
    },

    getFolderForMsgHdr: function (aMsgHdr) {
      return aMsgHdr.folder;
    },

    onFolderAdded: function (aParent, aFolder) {
      gFolderTreeView.addFolder(aParent, aFolder);
    }
};

gFolderTreeView.registerFolderTreeMode('pimo', gPimoFolderTreeMode, "Pimo Annotations!");

function testConceptIsOfType ( concept, typeUri ) {
    for (let i = 0; i < concept.allTypes.length; i++) {
        let conceptTypeUri = concept.allTypes[i].uri;
        if (conceptTypeUri == typeUri)
            return true;
    }
    return false;
}
