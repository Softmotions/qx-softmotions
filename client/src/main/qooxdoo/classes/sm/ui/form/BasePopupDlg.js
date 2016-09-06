qx.Class.define("sm.ui.form.BasePopupDlg", {
    extend: qx.ui.popup.Popup,

    events: {
        //JSon nav item
        "completed": "qx.event.type.Data"
    },

    properties: {
        /**
         * Is this popup is modal
         */
        "modal": {
            "check": "Boolean",
            "init": false,
            "apply": "__applyModal"
        }
    },

    construct: function () {

        this._broadcaster = sm.event.Broadcaster.create({
            // It true a save dialog buttons are enabled
            enabledSave: true
        });

        this.base(arguments);

        this.addListener("changeVisibility", function (ev) {
            var root = qx.core.Init.getApplication().getRoot();
            var val = ev.getData();
            if (val == "visible") {
                qx.ui.core.FocusHandler.getInstance().addRoot(this);
                if (this.getModal() == true) {
                    root.blockContent(this.getZIndex() - 1);
                }
            } else {
                if (this.getModal() == true) {
                    root.unblock();
                }
                //Restore previous focus
                if (this.__previousFocus) {
                    try {
                        var w = this.__previousFocus;
                        while (w != null && w.getFocusable() == false) {
                            w = w.getLayoutParent();
                        }
                        if (w != null) {
                            w.focus();
                        }
                    } catch (e) {
                        qx.log.Logger.error(e);
                    }
                    this.__previousFocus = null;
                }
                qx.ui.core.FocusHandler.getInstance().removeRoot(this);
            }
        }, this);


        this._setLayout(new qx.ui.layout.VBox());
        this.set({
            width: 300,
            padding: [10, 4]
        });

        this._form = new sm.ui.form.ExtendedForm();
        this._configureForm(this._form);
        this._configureFormButtons(this._form);
        var fh = this._createFormRenderer(this._form);
        if (fh != null) {
            this.add(fh);
        }

        this.__closeCmd = new qx.ui.command.Command("Esc");
        this.__closeCmd.addListener("execute", this.destroy, this);
        this.addListener("disappear", this.destroy, this);
    },

    members: {

        _form: null,

        _saveBt: null,

        _broadcaster: null,

        __previousFocus: null,

        __closeCmd: null,

        show: function () {
            this.__previousFocus = qx.ui.core.FocusHandler.getInstance().getActiveWidget();
            this.base(arguments);
        },

        close: function () {
            this.destroy();
        },

        open: function () {
            this.show();
        },

        save: function () {
            var vmgr = this._form.getValidationManager();
            vmgr.validate();
            if (!vmgr.isValid()) {
                return;
            }
            var me = this;
            window.setTimeout(function () {
                me._broadcaster.setEnabledSave(false);
                try {
                    me._save(function () {
                        me._broadcaster.setEnabledSave(true);
                    });
                } catch (e) {
                    me._broadcaster.setEnabledSave(true);
                    throw e;
                }
            }, 0);
        },

        __applyModal: function (val, old) {
            if (val == true && val != old && this.isVisible()) {
                var root = qx.core.Init.getApplication().getRoot();
                root.blockContent(this.getZIndex() - 1);
            }
        },

        _createFormRenderer: function (form) {
            var fr = new qx.ui.form.renderer.Single(form);
            fr._getLayout().setColumnFlex(0, 0);
            fr._getLayout().setColumnFlex(1, 1);
            return fr;
        },

        _save: function (cb) {
            cb();
        },

        _configureForm: function (form) {
        },

        _configureFormButtons: function (form) {
            var ok = this._saveBt = new qx.ui.form.Button(this.tr("Ok"));
            this._broadcaster.attach(ok, "enabledSave", "enabled");
            ok.addListener("execute", this.save, this);
            form.addButton(ok);

            var cancel = new qx.ui.form.Button(this.tr("Cancel"));
            cancel.addListener("execute", this.hide, this);
            form.addButton(cancel);
        },

        _disposeFields: function () {
            this._disposeObjects("_form", "__closeCmd");
        }
    },

    destruct: function () {
        this._disposeFields();
        this._saveBt = null;
    }
});