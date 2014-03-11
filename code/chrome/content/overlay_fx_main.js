if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}
if (!dfki.FireTag.overlay) {
    dfki.FireTag.overlay = {};
}
if (!dfki.FireTag.overlay.fx) {
    dfki.FireTag.overlay.fx = {};
}

Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);

dfki.FireTag.overlay.fx = {
    init : function() {
        window.removeEventListener("load", dfki.FireTag.overlay.fx.init, false);
    },

    toggleSidebar : function() {
        toggleSidebar('viewAnnotationSidebar');
    }
};

window.addEventListener("load", dfki.FireTag.overlay.fx.init, false);
