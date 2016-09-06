/**
 * Simple popup prompt dialog.
 */
qx.Class.define("sm.ui.form.SimplePromptPopupDlg", {
    extend : sm.ui.form.BasePopupDlg,

    events : {
        /**
         * Data: {String} The entered text
         */
        completed : "qx.event.type.Data"
    },

    /**
     * Options:
     * <code>
     *     {
     *          label : {String?''} // Text field label
     *          initialValue : {String?} //Initial text field value
     *          selectAll : {Boolean?false} //Whenever to select initial text field value
     *          required : {Boolean?true} // Text field is required
     *          maxLength : {Number?64} //Text field max length
     *          okLabel : {String?'Ok'} // Label for ok button
     *          cancelLabel : {String?'Cancel'} // Label for cancel button
     *     }
     * </code>
     *
     * @param options {Object?}
     */
    construct : function(options) {
        this.__options = options || {};
        this.base(arguments);
        this.setAutoHide(false);
        var vmgr = this._form.getValidationManager();
        vmgr.setRequiredFieldMessage(this.tr("This field is required"));
    },

    members : {

        __options : null,

        _configureForm : function() {
            var opts = this.__options;

            var tf = new qx.ui.form.TextField()
                    .set(
                    {
                        allowGrowY : true,
                        maxLength : (opts["maxLength"] != null) ? opts["maxLength"] : 64,
                        required : (opts["required"] != null) ? !!opts["required"] : true,
                        value : (opts["initialValue"] != null) ? opts["initialValue"] : ""
                    });
            if (opts["selectAll"]) {
                tf.selectAllText();
            }
            tf.addListener("keypress", function(ev) {
                if (ev.getKeyIdentifier() == "Enter") {
                    this.save();
                }
            }, this);
            this._form.add(tf, (opts["label"] != null) ? opts["label"] : "", null, "text");
            tf.focus();
        },


        _configureFormButtons : function(form) {
            var opts = this.__options;

            var ok = new qx.ui.form.Button(opts["okLabel"] || this.tr("Ok"));
            this._broadcaster.attach(ok, "enabledSave", "enabled");
            ok.addListener("execute", this.save, this);
            form.addButton(ok);

            var cancel = new qx.ui.form.Button(opts["cancelLabel"] || this.tr("Cancel"));
            cancel.addListener("execute", this.destroy, this);
            form.addButton(cancel);
        },

        _save : function(cb) {
            cb();
            this.fireDataEvent("completed", this._form.getItems()["text"].getValue());
        }
    }
});
