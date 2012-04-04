/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.nav.BaseNavPopup", {
    extend : sm.ui.form.BasePopupDlg,

    construct : function() {
        this.base(arguments);
        var vmgr = this._form.getValidationManager();
        vmgr.setRequiredFieldMessage(this.tr("This field is required"));
    },

    members :
    {
        _configureFormButtons : function(form) {
            var ok = new qx.ui.form.Button(this.tr("Save"));
            ok.addListener("execute", this.save, this);
            form.addButton(ok);

            var cancel = new qx.ui.form.Button(this.tr("Cancel"));
            cancel.addListener("execute", this.hide, this);
            form.addButton(cancel);
        }
    }
});