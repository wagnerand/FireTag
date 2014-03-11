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
        var toolbarButton = document.getElementById("FireTagToggleSidebar");
        if (toolbarButton && toolbarButton.checkState) {
            document.getElementById("FireTagToggleSidebar").setAttribute("checked", "true");
        }
    },

    toggleSidebar : function() {
        toggleSidebar('viewAnnotationSidebar');
        document.persist("FireTagToggleSidebar", "checkState");
    }
};

window.addEventListener("load", dfki.FireTag.overlay.fx.init, false);
