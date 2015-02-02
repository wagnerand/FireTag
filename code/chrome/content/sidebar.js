if (!dfki) {
    var dfki = {};
}
if (!dfki.FireTag) {
    dfki.FireTag = {};
}

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://FireTag/common.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/prefObserver.jsm", dfki.FireTag);
Components.utils.import("resource://FireTag/rpc.jsm", dfki.FireTag);

// Constructor
function Sidebar() {
    this.suggestedConceptsLastPimoResult = [];
    this.suggestedConcepts = [];
    this.annotatedConcepts = [];
    this.conversationConcepts = [];
    this.lastSelectedResources = null;
    this.currentResourcesAsPimoThings = null;
    this.stopIt = false;
    this.lastSelectedAutoCompleteIndex = -99;
    this.treeboxObject = null;
    componentConstruct.call(this);

    this.annotationTree = document.getElementById("annotationTree");
//    this.treeboxObject.QueryInterface(Components.interfaces.nsITreeBoxObject);

    let autoCompleteTextbox = document.getElementById(Sidebar.annotationSearchBoxName);
    autoCompleteTextbox.popup.addEventListener("popuphidden", this.onAutoCompletePopupHidden );
    autoCompleteTextbox.popup.addEventListener("popupshown", this.onAutoCompletePopupShown );
}

// Instance methods
Sidebar.prototype = {
    disableSidebar : function (reason, code, isError) {
        document.getElementById("firetag-disabled-label").value = reason;
        document.getElementById("firetag-disabled-errorcode").value = "(Error " + code + ")";
        let isTryAgainVisible = isError ? "visible" : "hidden";
        document.getElementById("firetag-disabled-tryagain").style.visibility = isTryAgainVisible;
        document.getElementById("firetag-disabled-errorcode").style.visibility = isTryAgainVisible;
        document.getElementById("firetag-deck").setAttribute("selectedIndex", "0");
        this.lastSelectedResources = null;
    },

    enableSidebar : function() {
        document.getElementById("firetag-deck").setAttribute("selectedIndex", "1");
    },

    resetTree : function() {
        this.treeboxObject.rowCountChanged(this.annotatedConcepts.length + 1 + this.conversationConcepts.length + 1 + 1, -this.suggestedConcepts.length);
        this.treeboxObject.rowCountChanged(this.annotatedConcepts.length + 2, -this.conversationConcepts.length);
        this.treeboxObject.rowCountChanged(1, -this.annotatedConcepts.length);
        this.annotatedConcepts.length = 0;
        this.conversationConcepts.length = 0;
        this.suggestedConcepts.length = 0;
    },

    resetSidebar : function() {
        this.currentResourcesAsPimoThings = [];

        document.getElementById("imageIsPrivate").style.visibility = "hidden";
        document.getElementById("labelResource").value = "";
        document.getElementById("labelResource").tooltipText = "";

        this.resetTree();
    },

    initTree : function() {
        let currentResources = Sidebar.getCurrentResources();
        if ((currentResources) && (currentResources.length > 0)) {
            this.getPimoResults(currentResources);
        }
    },

    initSidebar : function() {
        let resources = this.currentResourcesAsPimoThings;
        let imageIsPrivate  = document.getElementById("imageIsPrivate");
        let labelResource = document.getElementById("labelResource");

    //    let code=""; while(code = prompt("Enter code", code)) alert(eval(code));

        let currentSelectionCount = Sidebar.getCurrentSelectionCount();

        if (currentSelectionCount === 1) {
            if ((!resources) || (resources.length === 0)) {
                imageIsPrivate.style.visibility = "hidden";
                labelResource.value = "";
                labelResource.tooltipText = "";
            } else {
                labelResource.style.fontWeight = "normal";
                labelResource.value = resources[0].label;
                labelResource.tooltipText = resources[0].label;
                if (resources[0].public) {
                    imageIsPrivate.style.visibility = "hidden";
                }
                else {
                    imageIsPrivate.src = "chrome://firetag/skin/private.png";
                    imageIsPrivate.style.visibility = "visible";
                }
            }
        }
        //We already check for selection count < 1 in rebuildSidebar, so it must be > 1 here
        else {
            if ((!resources) || (resources.length === 0)) {
                imageIsPrivate.style.visibility = "hidden";
                labelResource.style.fontWeight = "bold";
                labelResource.value = "0 of " + currentSelectionCount + " messages in PIMO.";
                labelResource.tooltipText = "0 of " + currentSelectionCount + " messages in PIMO.";
            } else {
                labelResource.style.fontWeight = "bold";
                let nrResources = resources.length;
                if (resources.length >= Sidebar.MAX_NUMBER_OF_THINGS_FOR_GROCC ) {
                    nrResources = Sidebar.MAX_NUMBER_OF_THINGS_FOR_GROCC + "+";
                }
                labelResource.value = nrResources + " of " + Sidebar.getCurrentSelectionCount() + " messages in PIMO.";
                labelResource.tooltipText = nrResources + " of " + Sidebar.getCurrentSelectionCount() + " messages in PIMO.";
                let isPublic = resources[0].public;
                let mixedStatus = false;
                for (let i = 1; i < resources.length; i++) {
                    if (resources[i].public !== isPublic) {
                        mixedStatus = true;
                        break;
                    }
                }
                if (mixedStatus) {
                    imageIsPrivate.src = "chrome://firetag/skin/private_part.png";
                    imageIsPrivate.style.visibility = "visible";
                } else {
                    if (isPublic) {
                        imageIsPrivate.style.visibility = "hidden";
                    } else {
                        imageIsPrivate.src = "chrome://firetag/skin/private.png";
                        imageIsPrivate.style.visibility = "visible";
                    }
                }
            }
        }

        this.initTree();
    },

    rebuildTree : function() {
        this.resetTree();
        this.initTree();
    },

    rebuildSidebar : function(force) {
        if ((Sidebar.inPrivateMode()) || !this.isValidURL()) {
            this.resetSidebar();
            this.disableSidebar("FireTag has been disabled for this page.", -1, false);
            return;
        }

        let needsRebuild = false;
        if (this.selectedResourcesChanged()) {
            needsRebuild = true;
        }
        else if (typeof force == "Event") {
            needsRebuild = arguments[1];
        }
        else if (typeof force == "boolean") {
            needsRebuild = force;
        }
        if (needsRebuild) {
            this.resetSidebar();

            let selectCount = Sidebar.getCurrentSelectionCount();
            if (selectCount > 0) {
                let currentResources = Sidebar.getCurrentResources();
                this.lastSelectedResources = currentResources;
                let pimoResourceURIs = [];
                for (let i = 0; i < currentResources.length; i++) {
                    let resourceURI = Sidebar.getPimoResourceUri(currentResources[i]);
                    pimoResourceURIs.push(resourceURI);
                }

                this.lookupResources(pimoResourceURIs);
            }
        }
    },

    selectedResourcesChanged : function() {
        if ((this.lastSelectedResources) && (this.lastSelectedResources.length === Sidebar.getCurrentResources().length)) {
            for (let i = 0; i < Sidebar.getCurrentResources().length; i++) {
                if ((!this.lastSelectedResources[i]) || (Sidebar.getCurrentResources()[i] !== this.lastSelectedResources[i])) {
                    return true;
                }
            }
            return false;
        }
        return true;
    },

    lookupResources : function(resourceURIs) {
        let resourceURIsSliced = resourceURIs.slice(0, Sidebar.MAX_NUMBER_OF_THINGS_FOR_GROCC);
        if (resourceURIsSliced.length > 0) {
            let json = {
                method : "PimoDataApi.getAndCollectThingsForGroundingOccurrences",
                params : [ dfki.FireTag.common.authKey, resourceURIsSliced ]
            };
            let self = this;
            let callback = function (response) {
                let result = JSON.parse(response).result;
                if ((result)) {
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].res) {
                            self.currentResourcesAsPimoThings.push(result[i].res);
                        }
                    }
                }
                self.initSidebar.call(self);

            };
            dfki.FireTag.rpc.JSONRPCCall(json, callback);
        }
    },

    previousOBIEText : "",
    previousPimoResourceUris : "",

    rebuildSidebarIfDifferentOBIEResultsAreAvaible : function() {
        let currentResources = Sidebar.getCurrentResources();
        if ((!currentResources) || (currentResources.length <= 0))
            return;
        let obieTexts = [];
        let pimoResourceUris = [];
        let len = Math.min(currentResources.length, Sidebar.MAX_NUMBER_OF_RESOURCES);
        for (let i = 0; i < len; i++) {
            obieTexts.push(Sidebar.getResourceTextForOBIE(currentResources[i]));
            pimoResourceUris.push(Sidebar.getPimoResourceUri(currentResources[i]));
        }

        if ((obieTexts.join() === this.previousOBIEText) && (pimoResourceUris.join() === this.previousPimoResourceUris)) {
            return;
        }
        this.previousOBIEText = obieTexts.join();
        this.previousPimoResourceUris = pimoResourceUris.join();

        let json = {
            method : "ObieApi.findAndCollectEntityReferencesInTexts",
            params : [ dfki.FireTag.common.authKey, obieTexts, pimoResourceUris ]
        };

        let self = this;
        let callback = function (response) {
            let result = JSON.parse(response).result;
            if (result) {
                if( self.suggestedConceptsLastPimoResult.length != result.length ) {
                    self.rebuildTree.call( self );
                    return;
                }
                for (let i = 0, len = result.length; i < len; i++) {
                    if (result[i].res.uri != self.suggestedConceptsLastPimoResult[i].res.uri ) {
                        self.rebuildTree.call( self );
                        return;
                    }
                }
            }
        };
        dfki.FireTag.rpc.JSONRPCCall(json, callback);
    },

    getOBIEResults : function(resources) {
        let obieTexts = [];
        let pimoResourceUris = [];
        let len = Math.min(resources.length, Sidebar.MAX_NUMBER_OF_RESOURCES);
        for (let i = 0; i < len; i++) {
            obieTexts.push(Sidebar.getResourceTextForOBIE(resources[i]));
            pimoResourceUris.push(Sidebar.getPimoResourceUri(resources[i]));
        }

        let json = {
            method : "ObieApi.findAndCollectEntityReferencesInTexts",
            params : [ dfki.FireTag.common.authKey, obieTexts, pimoResourceUris ]
        };

        let self = this;
        let callback = function (response) {
            let result = JSON.parse(response).result;
            if (result) {
                self.suggestedConceptsLastPimoResult = result.slice( 0 );  // copy the array

                self.treeboxObject.rowCountChanged(self.annotatedConcepts.length + 1 + self.conversationConcepts.length + 1 + 1, -self.suggestedConcepts.length);
                self.suggestedConcepts.length = 0;

                for (let i = 0, len = result.length; i < len; i++) {
                    if (result[i].res) {
                        let currentResult = result[i].res;

                        let alreadyInAnnotated = false;
                        for (let k = 0; k < self.annotatedConcepts.length; k++) {
                            if (self.annotatedConcepts[k].uri === currentResult.uri) {
                                alreadyInAnnotated = true;
                                break;
                            }
                        }

                        if (!alreadyInAnnotated) {
                            let alreadyInConversation = false;
                            for (let m = 0; m < self.conversationConcepts.length; m++) {
                                if (self.conversationConcepts[m].uri === currentResult.uri) {
                                    alreadyInConversation = true;
                                    break;
                                }
                            }

                            if (!alreadyInConversation) {
                                Sidebar.addPimoConceptToModel(currentResult, self.suggestedConcepts, true);
                            }
                        }
                    }
                }
                self.treeboxObject.rowCountChanged(self.annotatedConcepts.length + 1 + self.conversationConcepts.length + 1 + 1, self.suggestedConcepts.length);
            }
        };
        dfki.FireTag.rpc.JSONRPCCall(json, callback);
    },

    getPimoResults : function(resources) {
        let resourceURIs = [];
        for (let i = 0; i < resources.length; i++) {
            resourceURIs.push(Sidebar.getPimoResourceUri(resources[i]));
        }
        let json = {
            method : "PimoAnnotationApi.getAnnotationsForDataResources",
            params : [ dfki.FireTag.common.authKey, resourceURIs ]
        };

        let self = this;
        let callback = function (response) {
            let result = JSON.parse(response).result;
            if ((result) && (result.length > 0)) {

                self.treeboxObject.rowCountChanged(1, -self.annotatedConcepts.length);
                self.annotatedConcepts.length = 0;
                for (let i = 0, len = result.length; i < len; i++) {
                    Sidebar.addPimoConceptToModel(result[i], self.annotatedConcepts, false);
                }
                self.treeboxObject.rowCountChanged(1, self.annotatedConcepts.length);
            }

            self.getConversationAnnotations.call(self, resources);
        };
        dfki.FireTag.rpc.JSONRPCCall(json, callback);
    },

    getConversationAnnotations : function(resources) {
        for (let x = 1; x < resources.length; x++) {
            if (resources[x].threadId !== resources[0].threadId) {
                if (Sidebar.prefs.getBoolPref("suggestConcepts")) {
                    this.getOBIEResults(resources);
                }
                return;
            }
        }

        let self = this;

        function checkAndAddConvConcepts(resourceURIs) {
            if (resourceURIs.length > 0) {
                let json = {
                    method: "PimoAnnotationApi.getAnnotationsForDataResources",
                    params: [ dfki.FireTag.common.authKey, resourceURIs ]
                };

                let callback = function (response) {
                    let result = JSON.parse(response).result;
                    if (result) {

                        self.treeboxObject.rowCountChanged(self.annotatedConcepts.length + 2, -self.conversationConcepts.length);
                        self.conversationConcepts.length = 0;

                        for (let i = 0; i < result.length; i++) {
                            let alreadyInAnnotated = false;
                            for (let j = 0; j < self.annotatedConcepts.length; j++) {
                                if (self.annotatedConcepts[j].uri === result[i].uri) {
                                    alreadyInAnnotated = true;
                                    break;
                                }
                            }
                            if (!alreadyInAnnotated) {
                                Sidebar.addPimoConceptToModel(result[i], self.conversationConcepts, false);
                            }
                        }
                        self.treeboxObject.rowCountChanged(self.annotatedConcepts.length + 2, self.conversationConcepts.length);
                        self.treeboxObject.invalidateRow(self.annotatedConcepts.length + 1);
                    }
                    if (Sidebar.prefs.getBoolPref("suggestConcepts")) {
                        self.getOBIEResults.call(self, resources);
                    }
                };
                dfki.FireTag.rpc.JSONRPCCall(json, callback);
            } else {
                if (Sidebar.prefs.getBoolPref("suggestConcepts")) {
                    self.getOBIEResults.call(self, resources);
                }
            }
        }

        if ("Gloda" in window) {
            let convFinderListener = {
                onItemsAdded: function _onItemsAdded(aItems, aCollection) {
                },
                onItemsModified: function _onItemsModified(aItems, aCollection) {
                },
                onItemsRemoved: function _onItemsRemoved(aItems, aCollection) {
                },
                onQueryCompleted: function _onQueryCompleted(conversation_coll) {
                    let messagesListener = {
                        onItemsAdded: function _onItemsAdded(aItems, aCollection) {
                        },
                        onItemsModified: function _onItemsModified(aItems, aCollection) {
                        },
                        onItemsRemoved: function _onItemsRemoved(aItems, aCollection) {
                        },
                        onQueryCompleted: function _onQueryCompleted(conversation_coll) {
                            let resourceURIs = [];
                            try {
                                for (let i = 0; i < conversation_coll.items.length; i++) {
                                    let currentConvHeader = conversation_coll.items[i].folderMessage;
                                    if (resources.indexOf(currentConvHeader) < 0) {
                                        resourceURIs.push(Sidebar.getPimoResourceUri(currentConvHeader));
                                    }
                                }
                            } catch (e) {
                            }
                            checkAndAddConvConcepts(resourceURIs);
                        }
                    };

                    try {
                        for (let h = 0; h < conversation_coll.items.length; h++) {
                            conversation_coll.items[h].conversation.getMessagesCollection(messagesListener);
                        }
                    } catch (e) {
                    }
                }
            };

            Gloda.getMessageCollectionForHeader(resources[0], convFinderListener);
        } else if ((resources[0].references) && (resources[0].references.length > 0)) {
            // Adding references to reply-compose
            let references = resources[0].references.split(" ");
            for (let i = 0; i < references.length; i++) {
                // Remove "<" and ">" at the beginning and end
                references[i] = "message-id://" + encodeURI(references[i].slice(1, -1));
            }
            checkAndAddConvConcepts(references);
        } else {
            if (Sidebar.prefs.getBoolPref("suggestConcepts")) {
                this.getOBIEResults(resources);
            }
        }
    },

    treeView : {
        treebox: null,
        selection: null,
        rowCount : 0,
        setTree: function (treebox) { this.treebox = treebox; },
        getCellText : function (row, column) {
            if (column.id === "name") {
                if (row === 0) {
                    return "Annotated Concepts";
                } else if (row === dfki.FireTag.instance.annotatedConcepts.length + 1) {
                    return "Inferred Concepts";
                } else if (row === (dfki.FireTag.instance.conversationConcepts.length + 1 + dfki.FireTag.instance.annotatedConcepts.length + 1)) {
                    return "Found Concepts";
                } else {
                    let resource = dfki.FireTag.instance.getResourceAtRow(row);
                    if (resource) {
                        return resource.name;
                    }
                }
            }
            return null;
        },
        isContainer: function (row) {
            return ((row === 0) || (row === dfki.FireTag.instance.annotatedConcepts.length + 1) || (row === dfki.FireTag.instance.annotatedConcepts.length + 1 + dfki.FireTag.instance.conversationConcepts.length + 1));
        },
        isContainerOpen : function (row) {
            if (row === 0) {
                return true;
            } else if (row === (dfki.FireTag.instance.annotatedConcepts.length + 1)) {
                return true;
            } else if (row === (dfki.FireTag.instance.annotatedConcepts.length + 1 + dfki.FireTag.instance.conversationConcepts.length + 1)) {
                return true;
            }
            return false;
        },
        isContainerEmpty : function (row) {
            if ((row === 0) && (dfki.FireTag.instance.annotatedConcepts.length === 0)) {
                return true;
            } else if ((row === dfki.FireTag.instance.annotatedConcepts.length + 1) && (dfki.FireTag.instance.conversationConcepts.length === 0)) {
                return true;
            } else if ((row === (dfki.FireTag.instance.annotatedConcepts.length + 1 + dfki.FireTag.instance.conversationConcepts.length + 1)) && (dfki.FireTag.instance.suggestedConcepts.length === 0)) {
                return true;
            }
            return false;
        },
        isSeparator: function (row) { return false; },
        isSorted: function () { return false; },
        isEditable: function (row, column) { return false; },
        isSelectable : function (row, col) {
            if (col.id === "action") {
                let resource = dfki.FireTag.instance.getResourceAtRow(row);
                if (resource) {
                    return true;
                }
            }
            return false;
        },
        getParentIndex : function (row) {
            if (row === 0) {
                return -1;
            } else if (row === dfki.FireTag.instance.annotatedConcepts.length + 1) {
                return -1;
            } else if (row === (dfki.FireTag.instance.annotatedConcepts.length + 1 + dfki.FireTag.instance.conversationConcepts.length + 1)) {
                return -1;
            } else {
                let resource = dfki.FireTag.instance.getResourceAtRow(row);
                if (resource) {
                    let parent = dfki.FireTag.instance.getResourceParent(resource);
                    return row - parent.indexOf(resource) - 1;
                }
            }
            return -1;
        },
        getLevel: function (row) {
            if ((row === 0) || (row === dfki.FireTag.instance.annotatedConcepts.length + 1) || (row === (dfki.FireTag.instance.annotatedConcepts.length + 1 + dfki.FireTag.instance.conversationConcepts.length + 1))) {
                return 0;
            }
            return 1;
        },
        hasNextSibling : function (row, afterIndex) {
            let thisLevel = dfki.FireTag.instance.getLevel(row);
            for (let t = afterIndex + 1; t < this.rowCount; t++) {
                let nextLevel = dfki.FireTag.instance.getLevel(t);
                if (nextLevel === thisLevel) {
                    return true;
                }
                if (nextLevel < thisLevel) {
                    break;
                }
            }
            return false;
        },
        toggleOpenState : function (row) {},
        getImageSrc: function (row, col) {
            if (col.id === "name") {
                let resource = dfki.FireTag.instance.getResourceAtRow(row);
                if (resource) {
                    return resource.icon;
                }
            } else if (col.id === "action") {
                if (row === (dfki.FireTag.instance.annotatedConcepts.length + 1)) {
                    if (dfki.FireTag.instance.conversationConcepts.length > 0) {
                        return "chrome://firetag/skin/addAll.png";
                    }
                } else if (row === (dfki.FireTag.instance.conversationConcepts.length + 1 + dfki.FireTag.instance.annotatedConcepts.length + 1)) {
                    if (dfki.FireTag.instance.suggestedConcepts.length > 0) {
                        return "chrome://firetag/skin/addAll.png";
                    }
                } else {
                    let resource = dfki.FireTag.instance.getResourceAtRow(row);
                    let parent = dfki.FireTag.instance.getResourceParent(resource);
                    if (parent === dfki.FireTag.instance.annotatedConcepts) {
                        return "chrome://firetag/skin/delete.png";
                    } else if ((parent === dfki.FireTag.instance.conversationConcepts) || (parent === dfki.FireTag.instance.suggestedConcepts)) {
                        return "chrome://firetag/skin/add.png";
                    }
                }
            } else if (col.id === "isPublic") {
                let resource = dfki.FireTag.instance.getResourceAtRow(row);
                if (resource) {
                    if (!resource.isPublic) {
                        return "chrome://firetag/skin/private.png";
                    }
                }
            }
            return null;
        },
        getProgressMode : function (idx, column) {},
        getCellValue: function (idx, column) {},
        cycleHeader : function (col) {},
        selectionChanged: function () {},
        cycleCell: function (idx, column) {},
        performAction: function (action) {},
        performActionOnCell: function (action, index, column) {},
        getRowProperties: function (idx, prop) {},
        getCellProperties: function (idx, column, prop) {},
        getColumnProperties: function (column, element, prop) {}
    },

    getResourceAtRow : function(row) {
        if ((row > 0) && (row < this.annotatedConcepts.length + 1)) {
            return this.annotatedConcepts[row - 1];
        } else if ((row > this.annotatedConcepts.length + 1) && (row < (this.annotatedConcepts.length + 1 + this.conversationConcepts.length + 1))) {
            return this.conversationConcepts[row - this.annotatedConcepts.length - 1 - 1];
        } else if (row > (this.annotatedConcepts.length + 1 + this.conversationConcepts.length + 1)) {
            return this.suggestedConcepts[row - this.annotatedConcepts.length - 1 - this.conversationConcepts.length - 1 - 1];
        }
        return null;
    },

    getResourceParent : function(resource) {
        if (this.annotatedConcepts.indexOf(resource) > -1) {
            return this.annotatedConcepts;
        } else if (this.conversationConcepts.indexOf(resource) > -1) {
            return this.conversationConcepts;
        }  else if (this.suggestedConcepts.indexOf(resource) > -1) {
            return this.suggestedConcepts;
        }
        return null;
    },

    onAutoCompletePopupShown : function () {
        if (dfki.FireTag.instance.stopIt) {
            dfki.FireTag.instance.stopIt = false;
            return;
        }
        // TODO: Prettify!
        window.setTimeout(dfki.FireTag.instance.onAutoCompletePopupShown, 100);
        let autoCompleteTextbox = document.getElementById(Sidebar.annotationSearchBoxName);
        dfki.FireTag.instance.lastSelectedAutoCompleteIndex = autoCompleteTextbox.popup.selectedIndex;
    },

    onAutoCompletePopupHidden : function (e) {
        dfki.FireTag.instance.stopIt = true;
        e.preventDefault();
        e.stopPropagation();
    },

    setPrefLabel : function(newLabel) {
        let resourceURI = this.currentResourcesAsPimoThings[0].uri;
        let json = {
            method : "PimoManipulationApi.setPrefLabel",
            params : [ dfki.FireTag.common.authKey, resourceURI, newLabel ]
        };
        dfki.FireTag.rpc.JSONRPCCall(json);

        let labelElement = document.getElementById("labelResource");
        labelElement.value = newLabel;
        labelElement.style.fontWeight = "normal";
        labelElement.tooltipText = newLabel;
    },

    onButtonPublishResourcesClicked : function(resources) {
        this.publish(resources, true);
        let imageIsPrivate  = document.getElementById("imageIsPrivate");
        imageIsPrivate.style.visibility = "hidden";

        if (Sidebar.getCurrentSelectionCount() > 1) {
            let labelResource = document.getElementById("labelResource");
            labelResource.style.fontWeight = "bold";
            labelResource.value = Sidebar.getCurrentSelectionCount() + " of " + Sidebar.getCurrentSelectionCount() + " messages in PIMO.";
        }
    },

    onTreeClicked : function(event) {
        let row = {}, column = {}, part = {}, json = null;
        this.treeboxObject.getCellAt(event.clientX, event.clientY, row, column, part);
        if (column.value) {
            if (column.value.id === "action") {
                let rowIndex = row.value;
                let resources = Sidebar.getCurrentResources();

                this.suggestedConceptsLastPimoResult.length = 0;

                if ((rowIndex > 0) && (rowIndex < this.annotatedConcepts.length + 1)) {
                    // Annotated concepts
                    let removedItem = this.annotatedConcepts.splice(rowIndex - 1, 1)[0];
                    this.treeboxObject.rowCountChanged(rowIndex, -1);

                    let resourceURIs = [];
                    for (let i = 0; i < resources.length; i++) {
                        let resourceURI = Sidebar.getPimoResourceUri(resources[i]);
                        resourceURIs.push(resourceURI);
                    }

                    json = {
                        method : "PimoAnnotationApi.removeAnnotationForDataResources",
                        params : [ dfki.FireTag.common.authKey, resourceURIs, removedItem.uri ]
                    };
                    dfki.FireTag.rpc.JSONRPCCall(json);
                } else if (rowIndex === (this.annotatedConcepts.length + 1)) {
                    // Conversation (inferred) concepts header
                    while (this.conversationConcepts.length > 0) {
                        this.annotatedConcepts[this.annotatedConcepts.length] = this.conversationConcepts.splice(rowIndex - this.annotatedConcepts.length - 1 - 1, 1)[0];
                        this.treeboxObject.invalidate();

                        let metadataArray = Sidebar.getResourcesMetadata(resources);

                        json = {
                            method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                            params : [ dfki.FireTag.common.authKey, metadataArray, this.annotatedConcepts[this.annotatedConcepts.length - 1].uri  ]
                        };
                        let self = this;
                        let callback = function(response, params) {
                            if ((self.annotatedConcepts.length <= 0) && (self.conversationConcepts.length === 0)) {
                                self.rebuildSidebar.call(self, true);
                            }
                        };
                        dfki.FireTag.rpc.JSONRPCCall(json, callback);

                    }
                } else if ((rowIndex > this.annotatedConcepts.length + 1) && (rowIndex < (this.annotatedConcepts.length + 1 + this.conversationConcepts.length + 1))) {
                    // Conversation (found) concepts
                    this.annotatedConcepts[this.annotatedConcepts.length] = this.conversationConcepts.splice(rowIndex - this.annotatedConcepts.length - 1 - 1, 1)[0];
                    this.treeboxObject.invalidate();

                    let metadataArray = Sidebar.getResourcesMetadata(resources);

                    json = {
                        method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                        params : [ dfki.FireTag.common.authKey, metadataArray, this.annotatedConcepts[this.annotatedConcepts.length - 1].uri  ]
                    };
                    let self = this;
                    let callback = function(response) {
                        if (self.annotatedConcepts.length === 1)
                            self.rebuildSidebar.call(self, true);
                    };
                    dfki.FireTag.rpc.JSONRPCCall(json, callback);
                } else if (rowIndex === (dfki.FireTag.instance.conversationConcepts.length + 1 + dfki.FireTag.instance.annotatedConcepts.length + 1)) {
                    // Suggested (found) concepts header
                    while (this.suggestedConcepts.length > 0) {
                        this.annotatedConcepts[this.annotatedConcepts.length] = this.suggestedConcepts.splice(rowIndex - this.annotatedConcepts.length - 1 - 1, 1)[0];
                        this.treeboxObject.invalidate();

                        let metadataArray = Sidebar.getResourcesMetadata(resources);

                        json = {
                            method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                            params : [ dfki.FireTag.common.authKey, metadataArray, this.annotatedConcepts[this.annotatedConcepts.length - 1].uri  ]
                        };
                        let self = this;
                        let callback = function(response, params) {
                            if ((self.annotatedConcepts.length <= 0) && (self.suggestedConcepts.length === 0)) {
                                self.rebuildSidebar.call(self, true);
                            }
                        };
                        dfki.FireTag.rpc.JSONRPCCall(json, callback);

                    }
                } else if (rowIndex > this.annotatedConcepts.length + 1 + this.conversationConcepts.length + 1) {
                    // Suggested (found) concepts
                    this.annotatedConcepts[this.annotatedConcepts.length] = this.suggestedConcepts.splice(rowIndex - this.annotatedConcepts.length - 1 - this.conversationConcepts.length - 1 - 1, 1)[0];
                    this.treeboxObject.invalidate();

                    let metadataArray = Sidebar.getResourcesMetadata(resources);

                    json = {
                        method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                        params : [ dfki.FireTag.common.authKey, metadataArray, this.annotatedConcepts[this.annotatedConcepts.length - 1].uri  ]
                    };
                    let self = this;
                    let callback = function(response) {
                        if (self.annotatedConcepts.length === 1)
                            self.rebuildSidebar.call(self, true);
                    };
                    dfki.FireTag.rpc.JSONRPCCall(json, callback);
                }

                this.annotationTree.currentIndex = -1;
                this.annotationTree.view.selection.clearSelection();
                this.annotationTree.view.selection.invalidateSelection();
            }
            else if (column.value.id === "name") {
                if (event.detail === 2) {
                    let rowIndex = row.value;

                    let resource = this.getResourceAtRow(rowIndex);
                    if (resource) {
                        Sidebar.openResourceExternal(resource);
                    }
                }
            }
            else if (column.value.id === "isPublic") {
                if (event.detail === 2) {
                    let rowIndex = row.value;
                    let resource = this.getResourceAtRow(rowIndex);
                    if ((resource) && (!resource.isPublic)) {
                        this.publish.call(this, [resource], false);
                        resource.isPublic = true;
                    }
                }
            }
        }
    },

    onButtonToggleTasksClicked : function() {
        Sidebar.toggleTasks();
    },

    onButtonToggleDocumentsClicked : function() {
        Sidebar.toggleDocuments();
    },

    onTreeItemTooltipShowing : function(event) {
        let row = {}, column = {}, part = {};
        dfki.FireTag.instance.treeboxObject.getCellAt(event.clientX, event.clientY, row, column, part);
        if ((column.value) && (column.value.id === "name")) {
            let resource = this.getResourceAtRow(row.value);
            if (resource) {
                let conceptText = resource.types[0].label;
                if ((conceptText) && (conceptText.length > 0)) {
                    let tooltip = document.getElementById("treeItemTooltip");
                    tooltip.label = conceptText;
                    return;
                }
            }
        }
        event.preventDefault();
    },

    onSearchboxTextEntered : function() {
        let searchString  = document.getElementById(Sidebar.annotationSearchBoxName).value;

        let resources = Sidebar.getCurrentResources();
        let metadataArray = Sidebar.getResourcesMetadata(resources);

        if (dfki.FireTag.instance.lastSelectedAutoCompleteIndex < 0) {
            let params = { inn : { name : searchString }, out : null };
            window.openDialog("chrome://firetag/content/newThing_dialog.xul", "",
                "chrome, dialog, modal, centerscreen, resizable=yes", params).focus();
            if (params.out) {

                let self = this;

                let jsonNewThing = {
                    method : "PimoManipulationApi.createNewThing",
                    params : [ dfki.FireTag.common.authKey, searchString ]
                };

                let callbackNewThing = function (response) {
                    let newThingUri = JSON.parse(response).result;

                    let jsonAddType = {
                        method : "PimoManipulationApi.addType",
                        params : [ dfki.FireTag.common.authKey, newThingUri, params.out.type ]
                    };

                    let callbackAddType = function (response) {
                        //                    let types = [];
                        //                    let obj = { uri : params.out.type };
                        //                    types[0] = obj;
                        //                    annotatedConcepts[annotatedConcepts.length] = {
                        //                        name : searchString,
                        //                        uri : newThingUri,
                        //                        types : types,
                        //                        icon: params.out.icon
                        //                    };
                        //                    treeboxObject.rowCountChanged(annotatedConcepts.length, 1);
                        document.getElementById(Sidebar.annotationSearchBoxName).value = "";

                        let jsonAddProperty = {
                            method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                            params : [ dfki.FireTag.common.authKey, metadataArray, newThingUri ]
                        };
                        let callbackJsonAddProperty = function(response) {
                            self.rebuildSidebar.call(self, true);
                        };
                        dfki.FireTag.rpc.JSONRPCCall(jsonAddProperty, callbackJsonAddProperty);
                    };
                    dfki.FireTag.rpc.JSONRPCCall(jsonAddType, callbackAddType);

                };
                dfki.FireTag.rpc.JSONRPCCall(jsonNewThing, callbackNewThing);
            }
        } else {
            let autoCompleteResult = dfki.FireTag.common.autoComplete.results[dfki.FireTag.instance.lastSelectedAutoCompleteIndex];

            let isAlreadyInList = false;
            for (let i = 0; i < dfki.FireTag.instance.annotatedConcepts.length; i++) {
                if (autoCompleteResult.uri === dfki.FireTag.instance.annotatedConcepts[i].uri) {
                    isAlreadyInList = true;
                    break;
                }
            }

            if (!isAlreadyInList) {
                //            annotatedConcepts[annotatedConcepts.length] = {
                //                name : rpcResult[0].label,
                //                uri : rpcResult[0].uri,
                //                icon : rpcResult[0].iconBase64For16x16,
                //                types : rpcResult[0].types
                //            };
                //            treeboxObject.rowCountChanged(annotatedConcepts.length, 1);

                let json = {
                    method : "PimoAnnotationApi.addAnnotationForDataResourcesWithMetadatas",
                    params : [ dfki.FireTag.common.authKey, metadataArray, autoCompleteResult.uri ]
                };
                let self = this;
                let callbackAdd =  function (response) {
                    self.rebuildSidebar.call(self, true);
                };

                dfki.FireTag.rpc.JSONRPCCall(json, callbackAdd);
            }
            document.getElementById(Sidebar.annotationSearchBoxName).value = "";
            dfki.FireTag.instance.lastSelectedAutoCompleteIndex = -1;
        }
    },

    onLabelClicked : function(event) {
        if ((event.button === 1) && (event.detail === 2)) {
            let resources = this.currentResourcesAsPimoThings;
            for (let i = 0; i < resources.length; i++) {
                Sidebar.openResourceExternal(resources[i]);
            }
        }
    },

    onResourceContextMenuShowed : function(event) {
        let resources = this.currentResourcesAsPimoThings;
        if ((!resources) || (resources.length != 1)) {
            event.preventDefault();
        }
    },

    onContextMenuRename : function() {
        if (Sidebar.getCurrentSelectionCount() === 1) {
            let newLabel = prompt("New Label:", document.getElementById("labelResource").value);
            if (newLabel) {
                this.setPrefLabel(newLabel);
            }
        }
    }
};

Sidebar.testConceptIsOfType = function( concept, typeUri ) {
    for (let i = 0; i < concept.allTypes.length; i++) {
        let conceptTypeUri = concept.allTypes[i].uri;
        if (conceptTypeUri === typeUri)
        	return true;
    }
    return false;
};

// Class methods
Sidebar.addPimoConceptToModel = function(concept, model, filter) {
    if (!Sidebar.testConceptIsOfType(concept, "pimo:thing#Thing") && (!Sidebar.testConceptIsOfType(concept, "http://www.w3.org/2000/01/rdf-schema#Class")))
    	return;
    if (filter) {
        if (Sidebar.testConceptIsOfType(concept, "pimo:thing#Document") && (!Sidebar.prefs.getBoolPref("autocomplete.showDocuments")) ||
            Sidebar.testConceptIsOfType(concept, "pimo:task#Task") && (!Sidebar.prefs.getBoolPref("autocomplete.showTasks"))) {
            return;
        }
    }

    model.push({
        uri : concept.uri,
        name : concept.label,
        icon : concept.iconBase64For16x16,
        types : concept.types,
        isPublic : concept.public
    });
};

Sidebar.toggleTasks = function() {
    let checked = document.getElementById("toggleTasks").checked;
    Sidebar.prefs.setBoolPref("autocomplete.showTasks", checked);
};

Sidebar.toggleDocuments = function() {
    let checked = document.getElementById("toggleDocuments").checked;
    Sidebar.prefs.setBoolPref("autocomplete.showDocuments", checked);
};

Sidebar.openResourceExternal = function(resource) {
    let base = dfki.FireTag.common.prefBranch.getCharPref("servers").split(",")[0].split("|")[0].trim();
    let destination = base + "pimo5/#res/" + encodeURIComponent(resource.uri);
    let uri = Services.io.newURI(destination, null, null);
    Sidebar.extProtService.loadUrl(uri);
};

Sidebar.prefs = Services.prefs.getBranch("extensions.dfki.FireTag.");
Sidebar.extProtService = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);

Sidebar.inPrivateMode = function() {
    try {
        if (PrivateBrowsingUtils) {
            //Todo: check window!
            return PrivateBrowsingUtils.isWindowPrivate(window);
        }
    } catch (e) {
        let privateB = Components.classes["@mozilla.org/privatebrowsing;1"];
        if (privateB) {
            return privateB.getService(Components.interfaces.nsIPrivateBrowsingService).privateBrowsingEnabled;
        }
    }
    return false;
};

// Class properties
// ex. Sidebar.PRODUCT = "TB";
Sidebar.MAX_NUMBER_OF_THINGS_FOR_GROCC = 20;
Sidebar.MAX_NUMBER_OF_RESOURCES = 5;

dfki.FireTag.registerPrefListener = function() {
    let myPrefListener = new dfki.FireTag.prefObserver(function (branch, name) {
        switch (name) {
            case "autocomplete.showDocuments":
                let showDocuments = Sidebar.prefs.getBoolPref("autocomplete.showDocuments");
                let buttonDocuments = document.getElementById("toggleDocuments");
                buttonDocuments.checked = showDocuments;
                if (showDocuments) {
                    buttonDocuments.image = "chrome://firetag/skin/document.png";
                } else {
                    buttonDocuments.image = "chrome://firetag/skin/document-disabled.png";
                }
                dfki.FireTag.instance.rebuildTree.call(dfki.FireTag.instance);
                break;
            case "autocomplete.showTasks":
                let showTasks = Sidebar.prefs.getBoolPref("autocomplete.showTasks");
                let buttonTasks = document.getElementById("toggleTasks");
                buttonTasks.checked = showTasks;
                if (showTasks) {
                    buttonTasks.image = "chrome://firetag/skin/task.png";
                } else {
                    buttonTasks.image = "chrome://firetag/skin/task-disabled.png";
                }
                dfki.FireTag.instance.rebuildTree.call(dfki.FireTag.instance);
                break;
        }
    });
    myPrefListener.register(false);
};

Sidebar.pingServer = function() {
    let json = {
        method : "PimoUserApi.ping",
        params : []
    };
    dfki.FireTag.rpc.JSONRPCCall(json);
};

Sidebar.openPreferences = function() {
    let optionsURL = "chrome://firetag/content/preferences.xul";
    let windows = Services.wm.getEnumerator(null);
    while (windows.hasMoreElements()) {
        let win = windows.getNext();
        if (win.closed) {
            continue;
        }
        if (win.document.documentURI == optionsURL) {
            win.focus();
            return;
        }
    }
    let features = "chrome,titlebar,toolbar,centerscreen";
    try {
        var instantApply = Services.prefs.getBoolPref("browser.preferences.instantApply");
        features += instantApply ? ",dialog=no" : ",modal";
    } catch (e) {
        features += ",modal";
    }
    openDialog(optionsURL, "", features);
};

Sidebar.onLoadListener = function() {
    dfki.FireTag.instance = new Sidebar();
    dfki.FireTag.instance.treeView.rowCount = (dfki.FireTag.instance.conversationConcepts.length + dfki.FireTag.instance.suggestedConcepts.length + dfki.FireTag.instance.annotatedConcepts.length + 3);
    dfki.FireTag.instance.annotationTree.view = dfki.FireTag.instance.treeView;
    dfki.FireTag.instance.treeboxObject = dfki.FireTag.instance.annotationTree.boxObject;
    dfki.FireTag.registerPrefListener();
    dfki.FireTag.instance.addListeners.call(dfki.FireTag.instance);
    dfki.FireTag.instance.rebuildSidebar.call(dfki.FireTag.instance);

    let rpcObserver = {
        observe : function(subject, topic, data) {
            subject.QueryInterface(Components.interfaces.nsISupportsString);
            let statusCode = parseInt(subject.data);
            if ((statusCode >= 200) && (statusCode < 400)) {
                if (document.getElementById("firetag-disabled-tryagain").style.visibility === "visible") {
                    dfki.FireTag.instance.enableSidebar();
                }
            } else {
                dfki.FireTag.instance.disableSidebar("Connecting to server failed!", subject.data, true);
            }
        }
    };
    Services.obs.addObserver(rpcObserver, "firetag-rpc-result", false);
};

window.addEventListener("load", Sidebar.onLoadListener, false);

function getStackDump() {
    let lines = [];
    for (let frame = Components.stack; frame; frame = frame.caller) {
        lines.push(frame.filename + " (" + frame.lineNumber + ")");
    }
    return lines.join("\n");
}
