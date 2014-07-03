/**
 * Extended command
 * which uses {@link sm.bom.ExtendedShortcut}
 * for event handling
 */
qx.Class.define("sm.ui.core.ExtendedCommand", {
    extend : qx.ui.core.Command,

    /**
     * @param shortcut {String} Shortcuts can be composed of optional modifier
     *    keys Control, Alt, Shift, Meta and a non modifier key.
     *    If no non modifier key is specified, the second paramater is evaluated.
     *    The key must be separated by a <code>+</code> or <code>-</code> character.
     *    Examples: Alt+F1, Control+C, Control+Alt+Delete
     * @param dontStop {Boolean?false} If true, keyboard event will not be stopped on handling. Default: false
     */
    construct : function(shortcut, dontStop) {
        this._shortcut = new sm.bom.ExtendedShortcut(shortcut, dontStop);
        this._shortcut.addListener("execute", this.execute, this);
    },

    members : {

    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});