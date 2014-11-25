qx.Class.define("sm.util.Clipboard", {

    statics : {
        /**
         * tries to copy text to the clipboard of the underlying operating system
         *
         * sources: http://www.krikkit.net/howto_javascript_copy_clipboard.html
         *          http://www.xulplanet.com/tutorials/xultu/clipboard.html
         *          http://www.codebase.nl/index.php/command/viewcode/id/174
         *
         * works only in Mozilla and Internet Explorer
         * In Mozilla, add this line to your prefs.js file in your Mozilla user profile directory
         *    user_pref("signed.applets.codebase_principal_support", true);
         * or change the setting from within the browser with calling the "about:config" page
         **/
        copyToSystemClipboard : function(text, flavor) {
            if (!flavor) {
                // default
                flavor = "text/unicode";
            }

            if (window.clipboardData) {
                // IE
                window.clipboardData.setData("Text", text);
            } else if (window.netscape) {
                // Mozilla, Firefox etc.
                try {
                    netscape.security.PrivilegeManager.enablePrivilege("UniversalXPConnect");
                }
                catch (e) {
                    window.alert(
                                    "Because of tight security settings in Mozilla / Firefox you cannot copy " +
                                    "to the system clipboard at the moment. Please open the 'about:config' page " +
                                    "in your browser and change the preference 'signed.applets.codebase_principal_support' to 'true'."
                    );
                    return false;
                }
                // we could successfully enable the privilege
                var clip = Components.classes['@mozilla.org/widget/clipboard;1'].createInstance(Components.interfaces.nsIClipboard);
                if (!clip) return;
                var trans = Components.classes['@mozilla.org/widget/transferable;1'].createInstance(Components.interfaces.nsITransferable);
                if (!trans) return;
                trans.addDataFlavor(flavor);
                var len = {};
                var str = Components.classes["@mozilla.org/supports-string;1"].createInstance(Components.interfaces.nsISupportsString);
                var copytext = text;
                str.data = copytext;
                trans.setTransferData(flavor, str, copytext.length * 2);
                var clipid = Components.interfaces.nsIClipboard;
                if (!clip) return false;
                clip.setData(trans, null, clipid.kGlobalClipboard);
                return true;
            } else {
                window.alert("Your browser does not support copying to the clipboard!");
            }
        }
    }
});
