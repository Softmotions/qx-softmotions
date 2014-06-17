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
        qx.ui.core.MChildrenHandling,
        sm.event.MForwardEvent
    ],

    events : {

        /** Fired when the value was modified */
        "changeValue" : "qx.event.type.Data",

        /** Text field input event */
        "input" : "qx.event.type.Data",

        /** Execute search, press ENTER ot button pressed */
        "execute" : "qx.event.type.Event",

        /** Reset field event */
        "reset" : "qx.event.type.Event"
    },

    properties : {

        appearance : {
            init : "sm-bt-field",
            refine : true
        },

        focusable : {
            refine : true,
            init : true
        },

        /**
         * Whenever to show reset button.
         */
        showResetButton : {
            check : "Boolean",
            init : false,
            nullable : false,
            apply : "__applyShowResetButton"
        },

        /**
         * Whenever to show main button.
         */
        showMainButton : {
            check : "Boolean",
            init : false,
            nullable : false,
            apply : "__applyShowMainButton"
        }
    },


    /**
     *
     * @param label {String} Button label
     * @param icon {String} Button icon path
     * @param revese {Boolean?false}
     *                Show child controls in referce order:
     *                button -> reset button -> text field
     */
    construct : function(label, icon, revese) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.HBox(4).set({alignY : "middle"}));
        this.__label = label;
        this.__icon = icon;
        this.__ensureControls(!!revese);
        this.setShowResetButton(false);
    },

    members : {


        __label : null,

        __icon : null,

        __button : null,


        _forwardStates : {
            invalid : true
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
            this.getChildControl("reset").setEnabled(value);
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
                case "reset":
                    control = new qx.ui.form.Button();
                    control.addListener("execute", function(ev) {
                        this.fireEvent("reset");
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
                    control.addListener("dblclick", function(ev) {
                        if (control.hasState("readonly")) {
                            this.fireEvent("execute");
                        }
                    }, this);
                    control.addListener("changeValue", this.forwardEvent, this);
                    control.addListener("input", this.forwardEvent, this);
                    this._add(control, {flex : 1});
                    break;
            }
            return control || this.base(arguments, id);
        },

        __ensureControls : function(reverse) {
            var names = ["text", "reset", "button"];
            if (reverse) {
                names.reverse();
            }
            names.forEach(function(n) {
                this.getChildControl(n);
            }, this);
        },

        __applyShowResetButton : function(val) {
            if (val) {
                this._showChildControl("reset");
            } else {
                this._excludeChildControl("reset");
            }
        },

        __applyShowMainButton : function(val) {
            if (val) {
                this._showChildControl("button");
            } else {
                this._excludeChildControl("button");
            }
        },

        setMainButtonEnabled : function(val) {
            this.getChildControl("button", true).setEnabled(!!val);
        }
    },

    destruct : function() {
        this.__label = this.__icon = this.__button = null;
    }
});

