if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://gre/modules/Task.jsm");

const maxColumns = 3;
const imgWidth = 48;
const imgHeight = 48;

const classesToDisplay = [
    "pimo:thing#Topic",
    "pimo:thing#Project",
    "pimo:thing#Person",
    "pimo:thing#Organization",
    "pimo:thing#Event",
    "pimo:thing#City",
    "pimo:thing#Country",
    "pimo:thing#Software",
    "pimo:thing#Tool"
];

function onAccept(fromOther) {
    if (fromOther) return;
    let radioGroup = document.getElementById("radiogroup");
    window.arguments[0].out = {
        type : radioGroup.selectedItem.id
    };
    return true;
}

function onCancel() {
    window.arguments[0].out = null;
    return true;
}

function openDialogOther() {
    let params = window.arguments[0];
    window.openDialog("chrome://firetag/content/newThing_dialog_other.xul", "",
        "chrome, dialog, modal, centerscreen, resizable=yes", params).focus();
    if (params.out) {
        onAccept(true);
        window.close();
    }
    else {
        onCancel();
    }
}

function Request(options) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest;
        xhr.onload = event => resolve(event.target);
        xhr.onerror = reject;

        let destination = dfki.FireTag.common.prefBranch.getCharPref("servers").split(",")[0].split("|")[0].trim();
        destination += "pimodb/json-rpc";
        xhr.open("POST", destination);

        dfki.FireTag.common.LOG("RPC to: " + destination, options);
        xhr.send(JSON.stringify(options));
    });
}

function onLoad() {
    document.getElementById("newThingName").value += "\"" + window.arguments[0].inn.name + "\":";
    Task.spawn(function* () {
        let json = {
            method : "PimoFastQueryApi.getResources",
            params : [
                dfki.FireTag.common.authKey, {
                    uris : classesToDisplay,
                    resultItemType : "json",
                    fillAttributes : ["label", "icon"],
                    iconSize: imgWidth + "x" + imgHeight
                }
            ]
        };

        let xhr = yield Request(json);
        let result = JSON.parse(xhr.responseText);
        dfki.FireTag.common.LOG("RPC response (" + xhr.status + "):", result);
        let data = result.result.elements;

        data.sort(function(a, b) {
            if (classesToDisplay.indexOf(a.uri) < classesToDisplay.indexOf(b.uri)) return -1;
            if (classesToDisplay.indexOf(a.uri) === classesToDisplay.indexOf(b.uri)) return 0;
            if (classesToDisplay.indexOf(a.uri) > classesToDisplay.indexOf(b.uri)) return 1;
        });

        let rowsElement = document.getElementById("rows");
        for (let i = 0; i < data.length; i++) {
            let radio = document.createElement("radio");
            radio.id = data[i].uri;
            radio.setAttribute("src", data[i].icon);
            radio.setAttribute("label", data[i].label);
            radio.addEventListener("click", function(event) {
               if (event.detail === 2) {
                   onAccept();
                   window.close();
               }
            });

            if (i % 3 === 0) {
                let newRow = document.createElement("row");
                rowsElement.appendChild(newRow);
            }
            let currentRow = rowsElement.lastChild;
            currentRow.appendChild(radio);
        }
        setTimeout(function() {sizeToContent()}, 0);

    });
}

window.addEventListener("load", onLoad, false);
