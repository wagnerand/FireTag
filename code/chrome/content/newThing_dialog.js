if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/rpc.jsm", dfki.FireTag);

var visibleItems = [];
var classes = [];

var classTree = null;
var treeboxObject = null;

function onAccept() {
    var selectionIndex = classTree.currentIndex;
    var selectedItem = visibleItems[selectionIndex];
    window.arguments[0].out = {
            type : selectedItem.uri,
            icon : selectedItem.iconBase64For16x16
    };
}

function onCancel() {
    window.arguments[0].out = null;
}

function onClickTree(event) {
    if ((event.detail === 2) && (event.button === 0)) {
        document.documentElement.getButton("accept").click();
    }
}

var treeView = {
    treebox: null,
    selection: null,
    rowCount : visibleItems.length,
    setTree: function (treebox) { this.treebox = treebox; },
    getCellText : function (row, column) {
        return visibleItems[row].label;
    },
    isContainer: function (row) { return false; },
    isSeparator: function (row) { return false; },
    isSorted: function () { return false; },
    getLevel: function (row) { return 0; },
    getImageSrc: function (row, col) {
        if (col.id === "name") {
            return visibleItems[row].iconBase64For16x16;
        }
        return null;
    },
    getParentIndex: function (row) { return -1; },
    getRowProperties: function (idx, prop) {},
    getCellProperties: function (idx, column, prop) {},
    getColumnProperties: function (column, element, prop) {}
};

function setView() {
    classTree.view = treeView;
}

function getAllClasses() {
    var json = {
            method : "PimoSchemaQueryApi.getAllThingSubclasses",
            params : [dfki.FireTag.common.authKey, 0, 0]
        };

    var callback = function (response) {
        classes = JSON.parse(response).result;
        visibleItems = classes.slice(0);
        treeboxObject.rowCountChanged(0, visibleItems.length);
    };
    dfki.FireTag.rpc.JSONRPCCall(json, callback);
}

function searchClass() {
    treeboxObject.rowCountChanged(0, -visibleItems.length);
    visibleItems.length = 0;
    var searchString = document.getElementById("newThingSearchBox").value.trim().toLowerCase();
    if (searchString.length > 0) {
        for (let i = 0; i < classes.length; i++) {
            if (classes[i].label.toLowerCase().indexOf(searchString) >= 0) {
                visibleItems[visibleItems.length] = {
                    label : classes[i].label,
                    uri : classes[i].uri,
                    iconBase64For16x16 : classes[i].iconBase64For16x16
                };
            }
        }
    } else {
        visibleItems = classes.slice(0);
    }
    treeboxObject.rowCountChanged(0, visibleItems.length);
}

function onLoad() {
    classTree = document.getElementById("classTree");
    setView();
    treeboxObject = classTree.boxObject;
    treeboxObject.QueryInterface(Components.interfaces.nsITreeBoxObject);

    document.getElementById("newThingName").value += "\"" + window.arguments[0].inn.name + "\"";

    getAllClasses();
}

window.addEventListener("load", onLoad, false);
