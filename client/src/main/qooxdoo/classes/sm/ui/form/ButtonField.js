/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Form field with button control at the end
 */

qx.Class.define("sm.ui.form.ButtonField", {
    extend: qx.ui.core.Widget,
    implement: [
        qx.ui.form.IStringForm,
        qx.ui.form.IForm
    ],
    include: [
        qx.ui.form.MForm,
        qx.ui.core.MChildrenHandling,
        sm.event.MForwardEvent
    ],

    events: {

        /** Fired when the value was modified */
        "changeValue": "qx.event.type.Data",

        /** Text field input event */
        "input": "qx.event.type.Data",

        /** Execute search, press ENTER ot button pressed */
        "execute": "qx.event.type.Data",

        /** Reset field event */
        "reset": "qx.event.type.Event"
    },

    properties: {

        appearance: {
            init: "sm-bt-field",
            refine: true
        },

        focusable: {
            refine: true,
            init: true
        },

        /**
         * Whenever to show reset button.
         */
        showResetButton: {
            check: "Boolean",
            init: false,
            nullable: false,
            apply: "__applyShowResetButton"
        },

        /**
         * Whenever to show main button.
         */
        showMainButton: {
            check: "Boolean",
            init: false,
            nullable: false,
            apply: "__applyShowMainButton"
        }
    },


    /**
     *
     * @param label {String} Button label
     * @param icon {String} Button icon path
     * @param revese {Boolean?false}
     *                Show child controls in referce order:
     *                button -> reset button -> text field
     * @param menuspec {Array?null} Array of [label, value]
     *
     */
    construct: function (label, icon, revese, menuspec) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.HBox(4).set({alignY: "middle"}));
        this.__label = label;
        this.__menuspec = Array.isArray(menuspec) ? menuspec : null;
        this.__icon = icon;
        this.__ensureControls(!!revese);
        this.setShowResetButton(false);
    },

    members: {


        __label: null,

        __icon: null,

        __menuspec: null,


        _forwardStates: {
            invalid: true
        },

        getTextField: function () {
            return this.getChildControl("text");
        },

        setReadOnly: function (val) {
            return this.getChildControl("text").setReadOnly(val);
        },

        getReadOnly: function () {
            return this.getChildControl("text").getReadOnly();
        },

        // overridden
        setValue: function (value) {
            this.getChildControl("text").setValue(value);
        },

        // overridden
        resetValue: function () {
            this.getChildControl("text").resetValue();
        },

        // overridden
        getValue: function () {
            return this.getChildControl("text").getValue();
        },

        setPlaceholder: function (text) {
            this.getChildControl("text").setPlaceholder(text);
        },

        getMainButton: function () {
            return this.getChildControl("button", true);
        },

        getResetButton: function () {
            return this.getChildControl("reset", true);
        },

        //overriden
        _applyEnabled: function (value, old) {
            this.base(arguments, value, old);
            ["button", "reset", "text"].forEach(function (name) {
                var el = this.getChildControl(name, true);
                if (el) {
                    el.setEnabled(value);
                }
            }, this);
        },

        _createChildControlImpl: function (id, hash) {
            var control;
            switch (id) {
                case "button" :
                    if (this.__menuspec != null && this.__menuspec.length > 1) {
                        var menu = new qx.ui.menu.Menu();
                        this.__menuspec.forEach(function (ms) {
                            var mbt = new qx.ui.menu.Button(ms[0]);
                            mbt.setUserData("model", ms[1]);
                            mbt.addListener("execute", function (ev) {
                                var mbt = ev.getTarget();
                                this.fireDataEvent("execute", mbt.getUserData("model"));
                            }, this);
                            menu.add(mbt);
                        }, this);
                        control = new qx.ui.form.MenuButton(this.__label, this.__icon, menu);
                    } else {
                        control = new qx.ui.form.Button(this.__label, this.__icon);
                        if (this.__menuspec != null && this.__menuspec.length === 1) {
                            this.setUserData("model", this.__menuspec[0][1]);
                        }
                        control.addListener("execute", function (ev) {
                            this.fireDataEvent("execute", this.getUserData("model"));
                        }, this);
                    }
                    this._add(control);
                    break;
                case "reset":
                    control = new qx.ui.form.Button();
                    control.addListener("execute", function (ev) {
                        this.fireEvent("reset");
                    }, this);
                    this._add(control);
                    break;
                case "text" : //text field
                    control = new qx.ui.form.TextField();
                    control.addListener("focusin", function (ev) {
                        this.addState("focused");
                    }, this);
                    control.addListener("focusout", function (ev) {
                        this.removeState("focused");
                    }, this);
                    control.addListener("keydown", function (ev) {
                        if (ev.getKeyCode() == 13) {
                            ev.stop();
                            this.fireDataEvent("execute", this.getUserData("model"));
                        }
                    }, this);
                    control.addListener("dblclick", function (ev) {
                        if (control.hasState("readonly")) {
                            this.fireDataEvent("execute", this.getUserData("model"));
                        }
                    }, this);
                    control.addListener("changeValue", this.forwardEvent, this);
                    control.addListener("input", this.forwardEvent, this);
                    this._add(control, {flex: 1});
                    break;
            }
            return control || this.base(arguments, id);
        },

        __ensureControls: function (reverse) {
            var names = ["text", "reset", "button"];
            if (reverse) {
                names.reverse();
            }
            names.forEach(function (n) {
                this.getChildControl(n);
            }, this);

            var text = this.getChildControl("text");
            var reset = this.getChildControl("reset");
            function enabledReset() {
                reset.setEnabled(!sm.lang.String.isEmpty(text.getValue()));
            }
            text.addListener("input", enabledReset);
            text.addListener("changeValue", enabledReset);
            enabledReset();
        },

        __applyShowResetButton: function (val) {
            if (val) {
                this._showChildControl("reset");
            } else {
                this._excludeChildControl("reset");
            }
        },

        __applyShowMainButton: function (val) {
            if (val) {
                this._showChildControl("button");
            } else {
                this._excludeChildControl("button");
            }
        },

        setMainButtonEnabled: function (val) {
            this.getChildControl("button", true).setEnabled(!!val);
        }
    },

    destruct: function () {
        this.__label = null;
        this.__icon = null;
        this.__menuspec = null;
    }
});

