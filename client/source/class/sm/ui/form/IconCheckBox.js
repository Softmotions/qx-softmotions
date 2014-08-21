/**
 * Checkbox with extra tail icon.
 */
qx.Class.define("sm.ui.form.IconCheckBox", {
    extend : qx.ui.form.CheckBox,

    events : {
        "iconClicked" : "qx.event.type.Event"
    },

    construct : function(icon) {
        this.base(arguments);
        if (icon != null) {
            this.__icon = new qx.ui.basic.Image(icon);
            this.__icon.setCursor("pointer");
            this.__icon.addListener("tap", function(ev) {
                ev.stop();
                this.fireEvent("iconClicked");
            }, this);
            this._add(this.__icon);
        }
    },

    members : {

        __icon : null,

        _onPointerDown : function(ev) {
            if (ev.getTarget() === this.__icon) {
                return;
            }
            this.base(arguments, ev);
        }
    },

    destruct : function() {
        this.__icon = null;
    }
});
