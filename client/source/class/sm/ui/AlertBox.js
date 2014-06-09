/**
 * Simple inline alert box
 *
 * @asset(sm/icons/32/exclamation.png)
 */
qx.Class.define("sm.ui.AlertBox", {
    extend : qx.ui.core.Widget,

    construct : function(label, icon, rich) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        icon = icon || "sm/icons/32/exclamation.png";
        var atom = this.__atom = new qx.ui.basic.Atom(label, icon);
        if (rich != null) {
            atom.setRich(!!rich);
        }
        this._add(atom);
    },

    members : {

        __atom : null,

        showAsInfo : function() {
            this.__atom.setIcon("sm/icons/32/information.png")
        },

        showAsWarning : function() {
            this.__atom.setIcon("sm/icons/32/exclamation.png")
        },

        setRich : function(rich) {
            this.__atom.setRich(rich);
        },

        setLabel : function(label) {
            this.__atom.setLabel(label);
        },

        setIcon : function(icon) {
            this.__atom.setIcon(icon);
        },

        getLabelWidget : function() {
            return this.__atom.getChildControl("label");
        }
    },

    destruct : function() {
        this.__atopm = null;
        //this._disposeObjects("__field_name");                                
    }
});
