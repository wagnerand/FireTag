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
if (!dfki.FireTag.overlay.tb.compose) {
    dfki.FireTag.overlay.tb.compose = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

window.addEventListener("compose-window-close", function() { dfki.FireTag.common.LOG("Destroying cached X-PIMO-DRAFTURI on close: " + dfki.FireTag.instance.draftId); dfki.FireTag.instance.draftId = null; });

