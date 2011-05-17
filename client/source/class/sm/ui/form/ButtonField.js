/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Form field with button control at the end
 */

qx.Class.define("sm.ui.form.ButtonField", {
    extend : qx.ui.core.Widget,
    implement : [
        qx.ui.form.IStringForm,
        qx.ui.form.IForm
    ],
    include : [
        qx.ui.form.MForm,
        qx.ui.core.MChildrenHandling
    ],

    events :
    {
        /** Fired when the value was modified */
        "changeValue" : "qx.event.type.Data",

        /** Fired when the enabled state was modified */
        "changeEnabled" : "qx.event.type.Data",

        /** Fired when the valid state was modified */
        "changeValid" : "qx.event.type.Data",

        /** Fired when the invalidMessage was modified */
        "changeInvalidMessage" : "qx.event.type.Data",

        /** Fired when the required was modified */
        "changeRequired" : "qx.event.type.Data",

        /** Execute search, press ENTER ot button pressed */
        "execute" : "qx.event.type.Event"
    },

    properties :
    {
        appearance : {
            init : "sm-bt-field",
            refine : true
        },

        focusable : {
            refine : true,
            init : true
        }
    },


    construct : function(label, icon) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.HBox(2).set({alignY : "middle"}));
        this.__label = label;
        this.__icon = icon;
        this.getChildControl("text");
        this.getChildControl("button");
    },

    members :
    {
        __label : null,

        __icon : null,

        __button : null,

        _forwardStates : {
            invalid : true
        },

        // overridden
        addListener : function(type, listener, self, capture) {
            switch (type) {
                case "execute":
                    this.base(arguments, type, listener, self, capture);
                    break;
                default:
                    this.getChildControl("text").addListener(type, listener, self, capture);
                    this.getChildControl("button");
                    break;
            }
        },

        getTextField : function() {
            return this.getChildControl("text");
        },

        setReadOnly : function(val) {
            return this.getChildControl("text").setReadOnly(val);
        },

        getReadOnly : function() {
            return this.getChildControl("text").getReadOnly();
        },

        // overridden
        setValue : function(value) {
            this.getChildControl("text").setValue(value);
        },

        // overridden
        resetValue : function() {
            this.getChildControl("text").resetValue();
        },

        // overridden
        getValue : function() {
            return this.getChildControl("text").getValue();
        },

        setPlaceholder : function(text) {
            this.getChildControl("text").setPlaceholder(text);
        },

        //overriden
        _applyEnabled : function(value, old) {
            this.base(arguments, value, old);
            this.getChildControl("text").setEnabled(value);
            this.getChildControl("button").setEnabled(value);
        },

        _createChildControlImpl : function(id, hash) {
            var control;
            switch (id) {
                case "button" :
                    control = new qx.ui.form.Button(this.__label, this.__icon);
                    control.addListener("execute", function(ev) {
                        this.fireEvent("execute");
                    }, this);
                    this._add(control);
                    break;
                case "text" : //text field
                    control = new qx.ui.form.TextField();
                    control.addListener("focusin", function(ev) {
                        this.addState("focused");
                    }, this);
                    control.addListener("focusout", function(ev) {
                        this.removeState("focused");
                    }, this);
                    control.addListener("keydown", function(ev) {
                        if (ev.getKeyCode() == 13) {
                            ev.stop();
                            this.fireEvent("execute");
                        }
                    }, this);
                    this._add(control, {flex : 1});
                    break;
            }
            return control || this.base(arguments, id);
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
        this.__label = this.__icon = null;
    }
});

