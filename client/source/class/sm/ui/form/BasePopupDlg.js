qx.Class.define("sm.ui.form.BasePopupDlg", {
    extend : qx.ui.popup.Popup,

    events :
    {
        //JSon nav item
        "completed" : "qx.event.type.Data"
    },

    properties :
    {
        /**
         * Is this popup is modal
         */
        "modal" : {
            "check" : "Boolean",
            "init" : false,
            "apply" : "__applyModal"
        }
    },

    construct : function() {
        this.base(arguments);
        this.addListener("changeVisibility", function(ev) {
            var root = qx.core.Init.getApplication().getRoot();
            var val = ev.getData();
            if (val == "visible") {
                if (this.getModal() == true) {
                    root.blockContent(this.getZIndex() - 1);
                }
            } else {
                if (this.getModal() == true) {
                    root.unblockContent();
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
                    } catch(e) {
                        qx.log.Logger.error(e);
                    }
                    this.__previousFocus = null;
                }
                qx.ui.core.FocusHandler.getInstance().removeRoot(this);
            }
        }, this);


        this._setLayout(new qx.ui.layout.VBox());
        this.set({
            width: 250,
            padding: [10, 4]
        });

        this._form = new qx.ui.form.Form();

        this._configureForm(this._form);
        this._configureFormButtons(this._form);

        var fh = this._createFormRenderer(this._form);
        this.add(fh);

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", this.hide, this);
    },

    members :
    {
        __previousFocus : null,

        __closeCmd : null,

        _form : null,

        show : function() {
            this.__previousFocus = qx.ui.core.FocusHandler.getInstance().getActiveWidget();
            this.base(arguments);
        },

        hide : function() {
            this.base(arguments);
            this._disposeFields();
        },

        save : function() {
            var vmgr = this._form.getValidationManager();
            vmgr.validate();
            if (!vmgr.isValid()) {
                return;
            }
            var me = this;
            window.setTimeout(function() {
                me._save();
            }, 0);
        },

        __applyModal : function(val) {
            if (val == true && this.isVisible()) {
                var root = qx.core.Init.getApplication().getRoot();
                root.blockContent(this.getZIndex() - 1);
            }
        },

        _createFormRenderer : function(form) {
            var fr = new qx.ui.form.renderer.Single(form);
            fr._getLayout().setColumnFlex(0, 0);
            fr._getLayout().setColumnFlex(1, 1);
            return fr;
        },

        _save : function() {
        },

        _configureForm : function(form) {
        },

        _configureFormButtons : function(form) {
            var ok = new qx.ui.form.Button(this.tr("Ok"));
            ok.addListener("execute", this.save, this);
            form.addButton(ok);

            var cancel = new qx.ui.form.Button(this.tr("Cancel"));
            cancel.addListener("execute", this.hide, this);
            form.addButton(cancel);
        },

        _disposeFields : function() {
            this._disposeObjects("_form", "__closeCmd");
        }
    },

    destruct : function() {
        this._disposeFields();
    }
});