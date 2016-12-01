/**
 * BasePopupDlg with Save/Cancel buttons.
 */
qx.Class.define("sm.ui.form.BaseSavePopupDlg", {
    extend: sm.ui.form.BasePopupDlg,

    construct: function () {
        this.base(arguments);
        this.setAutoHide(false);
        var vmgr = this._form.getValidationManager();
        vmgr.setRequiredFieldMessage(this.tr("This field is required"));
    },

    members: {
        _configureFormButtons: function (form) {
            var ok = new qx.ui.form.Button(this.tr("Save"));
            this._broadcaster.attach(ok, "enabledSave", "enabled");
            ok.addListener("execute", this.save, this);
            form.addButton(ok);

            var cancel = new qx.ui.form.Button(this.tr("Cancel"));
            cancel.addListener("execute", this.close, this);
            form.addButton(cancel);
        }
    }
});