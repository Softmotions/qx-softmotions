/**
 * Window manager with extended features:
 *   1. Automatic enabling/disabling commands (qx.ui.command.Command)
 *   created by <code>sm.ui.window.MExtendedWindow.createCommand()</code>
 *
 *
 */

qx.Class.define("sm.ui.window.ExtendedWindowManager", {
    extend : qx.ui.window.Manager,

    members : {

        changeActiveWindow : function(active, oldActive) {
            this.base(arguments, active, oldActive);
            var windows = this.getDesktop().getWindows();
            windows.forEach(function(w) {
                if (typeof w._freezeCommands !== "function") {
                    return;
                }
                if (w.getActive()) {
                    w._unfreezeCommands();
                } else {
                    w._freezeCommands();
                }
            });
        }
    },

    defer : function(statics) {
        //Class modulations
        qx.Class.include(qx.ui.window.Window, sm.ui.window.MExtendedWindow);
    }
});