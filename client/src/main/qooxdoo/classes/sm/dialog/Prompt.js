/**
 * Prompt dialog. Contains optional image, message and two buttons (ok & cancel)
 *
 * Available options for dialog:
 *  - caption {String|null} - caption on window
 *  - image {String|null} - image to show on window
 *  - message {String} - message to show
 *  - callback {Function|null} - callback on dialog close
 *  - context {Object|null} - context for callback
 *  - okButtonLabel - label on close button (default 'ok')
 *  - closeButtonLabel - label on close button (default 'cancel')
 *
 * @childControl button-ok {qx.ui.form.Button}
 * @childControl input {qx.ui.form.TextField}
 */
qx.Class.define("sm.dialog.Prompt", {
    extend : sm.dialog.Message,

    properties : {
        "image" : {
            init : null,
            refine : true
        },

        "closeButtonLabel" : {
            init : qx.locale.Manager.tr("Cancel"),
            refine : true
        },

        "okButtonLabel" : {
            check : "String",
            init : qx.locale.Manager.tr("Ok"),
            nullable : false
        }
    },

    construct : function(options) {
        this.base(arguments, options);
        this.getChildControl("button-ok").addListener("execute", function() {
            this._handleOk();
        }, this);
    },

    members : {
        _createChildControlImpl : function(id, hash) {
            var control;
            switch (id) {
                case "button-ok":
                    control = new qx.ui.form.Button(this.getOkButtonLabel());
                    this.getChildControl("buttons-container").addBefore(control, this.getChildControl("button-close"));
                    break;

                case "input":
                    control = new qx.ui.form.TextField();
                    this.addAfter(control, this.getChildControl("general-container"));
                    break;
            }

            return control || this.base(arguments, id);
        },

        _handleOk : function() {
            if (this.getCallback()) {
                var input = this.getChildControl("input", true);
                this.getCallback().call(this.getContext() || this, (input != null ? input.getValue() : null));
            }
            this.resetCallback();
            this.close();
        }

    }
});