/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.nav.BaseNavPopup", {
    extend : qx.ui.popup.Popup,

    events :
    {
        //JSon nav item
        "completed" : "qx.event.type.Data"
    },

    properties :
    {
    },

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox());
        this.set({
            width: 250,
            padding: [10, 4]
        });

        this._form = new qx.ui.form.Form();

        this._configureForm();

        var ok = new qx.ui.form.Button(this.tr("Сохранить"));
        ok.addListener("execute", this.save, this);
        this._form.addButton(ok);

        var cancel = new qx.ui.form.Button(this.tr("Отмена"));
        cancel.addListener("execute", this.hide, this);
        this._form.addButton(cancel);

        var vmgr = this._form.getValidationManager();
        vmgr.setRequiredFieldMessage(this.tr("Это поле является обязательным"));

        var fh = new qx.ui.form.renderer.Single(this._form);
        //todo небольшой хак
        fh._getLayout().setColumnFlex(0, 0);
        fh._getLayout().setColumnFlex(1, 1);

        this.add(fh);

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", this.hide, this);

    },

    members :
    {
        __closeCmd : null,

        _form : null,

        save : function() {
            var vmgr = this._form.getValidationManager();
            vmgr.validate();
            if (!vmgr.isValid()) {
                return;
            }
            this._save();
        },

        _save : function() {
        },

        _configureForm : function() {
        },

        hide : function() {
            this.base(arguments);
            this._disposeFields();
        },

        _disposeFields : function() {
            this._disposeObjects("_form", "__closeCmd");
        }
    },

    destruct : function() {
        this._disposeFields();
    }
});