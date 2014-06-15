/**
 *  Wrapper around GUI Widget adapting it
 *  to qx.ui.form.IForm
 */
qx.Class.define("sm.ui.form.FormWidgetAdapter", {
    extend : qx.ui.core.Widget,
    implement : [ qx.ui.form.IForm,
                  qx.ui.form.IStringForm ],
    include : [ sm.ui.form.MStringForm ],

    properties : {

        readOnly : {
            check : "Boolean",
            apply : "_applyReadOnly",
            event : "changeReadOnly",
            init : false
        }
    },

    construct : function(widget) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this._add(widget);
        this.__wrapped = widget;
    },

    members : {

        __wrapped : null,

        _forwardStates : {
            focused : true,
            disabled : true,
            readonly : true,
            invalid : true
        },

        getWrapped : function() {
            return this.__wrapped;
        },

        _applyReadOnly : function(value, old) {
            if (value) {
                this.addState("readonly");
                this.setFocusable(false);
            } else {
                this.removeState("readonly");
                this.setFocusable(true);
            }
        }
    },

    destruct : function() {
        this.__wrapped = null;
    }
});