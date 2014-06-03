/**
 * Confirmation dialog. Contains optional image, message and two buttons (ok & close)
 *
 * Available options for dialog:
 *  - caption {String|null} - caption on window
 *  - image {String|null} - image to show on window
 *  - message {String} - message to show
 *  - callback {Function|null} - callback on dialog close
 *  - context {Object|null} - context for callback
 *  - okButtonLabel - label on close button
 *  - closeButtonLabel - label on close button
 *
 * @childControl button-ok {qx.ui.form.Button}
 */
qx.Class.define("sm.dialog.Confirm", {
    extend : sm.dialog.Message,

    properties : {
        "image" : {
            init : null,
            refine : true
        },

        "closeButtonLabel" : {
            init :qx.locale.Manager.tr("No"),
            refine : true
        },

        /**
         * Label on ok/yes button
         */
        "okButtonLabel" : {
            check : "String",
            init :qx.locale.Manager.tr("Yes"),
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

            switch(id) {
                case "button-ok":
                    control = new qx.ui.form.Button(this.getOkButtonLabel());
                    this.getChildControl("buttons-container").addBefore(control, this.getChildControl("button-close"));
                    break;
            }

            return control || this.base(arguments, id);
        },

        _handleOk : function() {
            if (this.getCallback()) {
                this.getCallback().call(this.getContext() || this, true);
            }
            this.resetCallback();
            this.close();
        }

    }
});