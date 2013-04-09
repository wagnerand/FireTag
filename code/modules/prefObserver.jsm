let EXPORTED_SYMBOLS = [ "prefObserver" ];

let prefService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService);

let prefObserver = function (callback) {
    // We need to keep a reference to the branch to prevent garbage collection
    this._branch = prefService.getBranch("extensions.dfki.FireTag.");
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
    this._callback = callback;
};

prefObserver.prototype.observe = function (subject, topic, data) {
    if (topic === "nsPref:changed") {
        this._callback(this._branch, data);
    }
};

prefObserver.prototype.register = function (trigger) {
    this._branch.addObserver("", this, false);
    if (trigger) {
        let that = this;
        this._branch.getChildList("", {}).
            forEach(function (pref_leaf_name) { that._callback(that._branch, pref_leaf_name); });
    }
};

prefObserver.prototype.unregister = function () {
    if (this._branch) {
        this._branch.removeObserver("", this);
    }
};
