/**
 * Additional window features used with
 */
qx.Mixin.define("sm.ui.window.MExtendedWindow", {

    members : {

        __commands : null,

        __frozenCommands : null,

        /**
         * @param shortcut {String} Shortcuts can be composed of optional modifier
         *    keys Control, Alt, Shift, Meta and a non modifier key.
         *    If no non modifier key is specified, the second paramater is evaluated.
         *    The key must be separated by a <code>+</code> or <code>-</code> character.
         *    Examples: Alt+F1, Control+C, Control+Alt+Delete
         * @param dontStop {Boolean?false} If true, keyboard event will not be stopped on handling. Default: false
         */
        createCommand : function(shortcut, dontStop) {
            var cmd = new sm.ui.core.ExtendedCommand(shortcut, dontStop);
            var me = this;
            cmd.$$cmdispose = cmd.dispose;
            cmd.dispose = function() {
                if (me.__commands) {
                    qx.lang.Array.remove(me.__commands, cmd);
                }
                if (cmd.$$cmdispose) {
                    cmd.$$cmdispose.call(cmd);
                    cmd.$$cmdispose = null;
                }
            };
            if (this.__commands == null) {
                this.__commands = [];
            }
            this.__commands.push(cmd);
            return cmd;
        },

        _freezeCommands : function() {
            if (this.__commands == null || this.__frozenCommands) {
                return;
            }
            this.__frozenCommands = [];
            this.__commands.forEach(function(cmd) {
                if (cmd.getEnabled()) {
                    this.__frozenCommands.push(cmd);
                    cmd.setEnabled(false);
                }
            }, this);
        },

        _unfreezeCommands : function() {
            if (this.__frozenCommands == null) {
                return;
            }
            this.__frozenCommands.forEach(function(cmd) {
                cmd.setEnabled(true);
            }, this);
            this.__frozenCommands = null;
        }
    },

    destruct : function() {
        this.__frozenCommands = null;
        if (this.__commands) {
            this.__commands.forEach(function(cmd) {
                if (cmd.$$cmdispose) {
                    cmd.$$cmdispose.call(cmd);
                    cmd.$$cmdispose = null;
                }
            });
            this.__commands = null;
        }
    }
});