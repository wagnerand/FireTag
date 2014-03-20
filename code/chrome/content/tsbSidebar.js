/* ***** BEGIN LICENSE BLOCK *****
Version: MPL 1.1/GPL 2.0/LGPL 2.1

The contents of this collection are subject to the Mozilla Public License Version
1.1 (the "License"); you may not use this file except in compliance with
the License. You may obtain a copy of the License at
http://www.mozilla.org/MPL/

Software distributed under the License is distributed on an "AS IS" basis,
WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
for the specific language governing rights and limitations under the
License.

The Original Code is mozilla.org code from the Firefox, Thunderbird and
SeaMonkey projects.

The Initial Developer of the Original Code is
Philip Chee <philip.chee@gmail.com>.
based on source code from the Mozilla Foundation <http://www.mozilla.org/>.

Portions created by the Initial Developer are Copyright (C) 2006
the Initial Developer. All Rights Reserved.

Contributor(s):
Andreas Wagner <mail@andreaswagner.org> - Changes for FireTag

Alternatively, the contents of this file may be used under the terms of
either the GNU General Public License Version 2 or later (the "GPL"), or
the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
in which case the provisions of the GPL or the LGPL are applicable instead
of those above. If you wish to allow use of your version of this file only
under the terms of either the GPL or the LGPL, and not to allow others to
use your version of this file under the terms of the MPL, indicate your
decision by deleting the provisions above and replace them with the notice
and other provisions required by the GPL or the LGPL. If you do not delete
the provisions above, a recipient may use your version of this file under
the terms of any one of the MPL, the GPL or the LGPL.

***** END LICENSE BLOCK ***** */

// global vars from aviary.
var gMustLoadSidebar = false;
var gSidebarCommand = "";
var gWebPanelURI;

var xSidebar = {

  windowStartup : function () {
    window.removeEventListener("load", xSidebar.windowStartup, false);
    var sidebarBox = document.getElementById("sidebar-box");
    if (!sidebarBox) {
      return
    }
    var sidebarSplitter = document.getElementById("sidebar-splitter");
    var sidebarTitle = document.getElementById("sidebar-title");
    var sidebarTitleBox = document.getElementById("sidebar-title-box");
    var sidebarPanelsSplitterBox = document.getElementById("sidebar-panels-splitter-box");

    if (window.opener && !window.opener.closed) {
      var thisWinType = document.documentElement.getAttribute("windowtype");
      var openerWinType = window.opener.document
                          .documentElement.getAttribute("windowtype");
      var openerIsSameType = (thisWinType == openerWinType);
    }
    if (window.opener && !window.opener.closed && openerIsSameType) {
      // If this window is opened from a sidebar link, the opener is the
      // sidebar box not the main window, so we need to use ".top".
      var openerSidebarBox = window.opener.top.document.getElementById("sidebar-box");
      // The opener can be the hidden window too, if we're coming from the state
      // where no windows are open, and the hidden window has no sidebar box.
      if (openerSidebarBox && !openerSidebarBox.hidden) {
        sidebarTitle.setAttribute("value",
          window.opener.top.document.getElementById("sidebar-title").getAttribute("value"));
        sidebarBox.setAttribute("width", openerSidebarBox.boxObject.width);
        var sidebarCmd = openerSidebarBox.getAttribute("sidebarcommand");
        sidebarBox.setAttribute("sidebarcommand", sidebarCmd);
        sidebarBox.setAttribute("src",
          window.opener.top.document.getElementById("sidebar").getAttribute("src"));
        gMustLoadSidebar = true;
        sidebarBox.hidden = false;
        sidebarSplitter.hidden = false;
        var isCollapsed = openerSidebarBox.collapsed;
        if (isCollapsed) {
          sidebarBox.collapsed = true;
          sidebarSplitter.setAttribute("state", "collapsed");
        }
        else if (sidebarSplitter.getAttribute("state") == "collapsed") {
          sidebarSplitter.removeAttribute("state");
        }
        document.getElementById(sidebarCmd).setAttribute("checked", "true");
      }
    }
    else {
      if (sidebarBox.hasAttribute("sidebarcommand")) {
        var commandID = sidebarBox.getAttribute("sidebarcommand");
        if (commandID) {
          var command = document.getElementById(commandID);
          if (command) {
            //if (!sidebarBox.hidden) {
            if (sidebarBox.getAttribute("sidebarVisible") == "true") {
              gMustLoadSidebar = true;
              sidebarBox.hidden = false;
              sidebarSplitter.hidden = false;
              if (sidebarSplitter.getAttribute("state") == "collapsed")
                sidebarBox.collapsed = true;
              var title = command.getAttribute("sidebartitle");
              if (!title)
                title = command.getAttribute("label");
              // Since we are now persisting the sidebar-title, don't override it.
              if (!sidebarTitle.getAttribute("value"))
                sidebarTitle.setAttribute("value", title);
              command.setAttribute("checked", "true");
            }
          }
          else {
            // Remove the |sidebarcommand| attribute, because the element it
            // refers to no longer exists, so we should assume this sidebar
            // panel has been uninstalled. (249883)
            sidebarBox.removeAttribute("sidebarcommand");
            // Hide sidebar since the sidebar has been uninstalled.
            sidebarBox.hidden = true;
            sidebarSplitter.hidden = true;
          }
        }
      }
    }
    if (!gMustLoadSidebar) {
      sidebarBox.collapsed = true;
      sidebarBox.hidden = true;
      sidebarSplitter.hidden = true;
      sidebarBox.setAttribute("sidebarVisible", "false");
      sidebarPanelsSplitterBox.collapsed = true;
      sidebarPanelsSplitterBox.hidden = true;
      sidebarTitleBox.hidden = true;
    }
    setTimeout(xSidebar.delayedStartup, 0);
  },

  delayedStartup : function () {
    if (gMustLoadSidebar) {
      var sidebar = document.getElementById("sidebar");
      var sidebarBox = document.getElementById("sidebar-box");
      sidebar.setAttribute("src", sidebarBox.getAttribute("src"));
    }
  },

  windowShutdown : function () {
    window.removeEventListener("unload", xSidebar.windowShutdown, false);
    document.persist("sidebar-box", "sidebarcommand");
    document.persist("sidebar-box", "width");
    document.persist("sidebar-box", "height");
    document.persist("sidebar-box", "src");
    document.persist("sidebar-box", "hidden");
    document.persist("sidebar-title", "value");
    document.persist("sidebar-title-box", "hidden");
    document.persist("sidebar-splitter", "hidden");
    document.persist("sidebar-splitter", "state");
  },

  sidebarInit : function () {
    window.removeEventListener("load", xSidebar.sidebarInit, false);

    var cssplit = document.getElementById("contacts-pane-splitter");
    if (cssplit) {
      cssplit.parentNode.removeChild(cssplit.nextSibling);
      cssplit.parentNode.removeChild(cssplit);
      document.loadOverlay("chrome://firetag/content/tsbSidebar.xul", null);
    }
    // On Linux F9 fetches new messages
    // see Bug 221360 – support F5 and/or F9 for checking mail
    if (/Linux/.test(navigator.platform) || /Unix/.test(navigator.platform)) {
      var tKey = document.getElementById("showHideSidebar");
      if (tKey)
        tkey.setAttribute("keycode", "VK_F4");
    }
  },

  buildSidebarMenu : function () {
    var xSidebarMenu = document.getElementById("xsidebar-panel-viewer-popup");
    while (xSidebarMenu.hasChildNodes()) {
      xSidebarMenu.removeChild(xSidebarMenu.firstChild);
    }
    var sidebarMenu =  document.getElementById("viewSidebarMenu");
    if (sidebarMenu) {
    // cloning the whole menu in one step causes Mozilla 1.7.12 to crash
    // when the cloned menu is used. If we don't want to support Moz 1.7
    // we can simplify the following code for Seamonkey only builds.
      var newItem;
      for (var ii = 0; ii < sidebarMenu.childNodes.length; ii++) {
        newItem = sidebarMenu.childNodes[ii].cloneNode(true);
        xSidebarMenu.appendChild(newItem);
      }
    }
  }
};

function toggleSidebar(aCommandID, forceOpen) {
    var sidebarBox = document.getElementById("sidebar-box");
    if (!aCommandID)
      aCommandID = sidebarBox.getAttribute("sidebarcommand");
    if (!aCommandID)
      aCommandID = "viewAddressPicker";

    var elt = document.getElementById(aCommandID);
    var sidebar = document.getElementById("sidebar");
    var sidebarTitle = document.getElementById("sidebar-title");
    var sidebarTitleBox = document.getElementById("sidebar-title-box");
    var sidebarSplitter = document.getElementById("sidebar-splitter");

    var sidebarPanelsSplitter = document.getElementById("sidebar-panels-splitter");
    var sidebarPanelsSplitterBox = document.getElementById("sidebar-panels-splitter-box");
    var sidebarMenuItem = document.getElementById("sidebar-menu");

    if ((!forceOpen && elt && elt.getAttribute("checked") == "true")) {
      elt.removeAttribute("checked");
      sidebarTitle.setAttribute("value", "");
      sidebar.setAttribute("src", "about:blank");
      sidebar.removeAttribute("src");

      var hideEverything = sidebarPanelsSplitter.getAttribute("hidden") == "true";
      if (hideEverything) {
        sidebarBox.collapsed = true;
        sidebarBox.hidden = true;
        sidebarBox.setAttribute("sidebarVisible", "false");
        sidebarSplitter.hidden = true;
      } else {
        sidebarPanelsSplitter.hidden = true;
      }
      sidebarTitleBox.hidden = true;
      sidebarPanelsSplitterBox.collapsed = true;
      sidebarPanelsSplitterBox.hidden = true;
      sidebarMenuItem.setAttribute("checked", "false");
    } else {
      sidebarBox.hidden = false;
      sidebarBox.removeAttribute("collapsed");
      sidebarBox.setAttribute("sidebarVisible", "true");
      sidebarTitleBox.hidden = false;
      sidebarPanelsSplitterBox.hidden = false;
      sidebarPanelsSplitterBox.removeAttribute("collapsed");
      sidebarMenuItem.setAttribute("checked", "true");

      sidebarSplitter.hidden = false;
      if (sidebarSplitter.getAttribute("state") == "collapsed")
        sidebarSplitter.removeAttribute("state");

      var elts = document.getElementsByAttribute("group", "sidebar");
      for (var i = 0; i < elts.length; i++)
        elts[i].removeAttribute("checked");

      elt.setAttribute("checked", "true");

      var url = elt.getAttribute("sidebarurl");
      var title = elt.getAttribute("sidebartitle");
      if (!title)
        title = elt.getAttribute("label");
      sidebar.setAttribute("src", url);
      sidebarBox.setAttribute("src", url);
      sidebarBox.setAttribute("sidebarcommand", elt.id);
      sidebarTitle.setAttribute("value", title);
    }
    document.persist("sidebar-box", "sidebarcommand");
    document.persist("sidebar-box", "width");
    document.persist("sidebar-box", "height");
    document.persist("sidebar-box", "src");
    document.persist("sidebar-box", "hidden");
    document.persist("sidebar-title", "value");
    document.persist("sidebar-title-box", "hidden");
    document.persist("sidebar-splitter", "hidden");
    document.persist("sidebar-splitter", "state");

    window.content.focus();
}

window.addEventListener("load",   xSidebar.windowStartup,  false);
window.addEventListener("load",   xSidebar.sidebarInit,    false);
window.addEventListener("unload", xSidebar.windowShutdown, false);
