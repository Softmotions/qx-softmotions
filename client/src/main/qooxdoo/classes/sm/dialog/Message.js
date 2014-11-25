/**
 * General message window. Contains optional image, message and one button (close)
 *
 * Available options for dialog
 *  - caption {String|null} - caption on window
 *  - image {String|null} - image to show on window
 *  - message {String} - message to show
 *  - callback {Function|null} - callback on dialog close
 *  - context {Object|null} - context for callback
 *  - closeButtonLabel - label on close button
 *
 * @childControl general-container {qx.ui.container.Composite}
 * @childControl image {qx.ui.basic.Image}
 * @childControl message {qx.ui.basic.Label}
 * @childControl buttons-container {qx.ui.container.Composite}
 * @childControl button-close {qx.ui.form.Button}
 * @childControl checkbox {qx.ui.form.CheckBox}
 *
 * @asset(qx/icon/${qx.icontheme}/48/status/dialog-information.png)
 */
qx.Class.define("sm.dialog.Message", {
    extend : qx.ui.window.Window,

    events : {
    },

    properties : {

        appearance : {
            refine : true,
            init : "sm-message"
        },

        /**
         * Image/logo that is displayed
         */
        "image" : {
            check : "String",
            init : "icon/48/status/dialog-information.png",
            apply : "_applyImage",
            nullable : true
        },

        /**
         * Message to show
         */
        "message" : {
            check : "String",
            init : null,
            apply : "_applyMessage",
            nullable : true
        },

        /**
         * Label on close button
         */
        "closeButtonLabel" : {
            check : "String",
            init : qx.locale.Manager.tr("Close"),
            nullable : false
        },

        /**
         * Callback function that will be called when the user
         * has interacted with the widget.
         */
        callback : {
            check : "Function",
            nullable : true
        },

        /**
         * The context for the callback function
         */
        context : {
            check : "Object",
            nullable : true
        }
    },

    construct : function(options) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.VBox(10));
        this.set({
            modal : true,
            showMinimize : false,
            showMaximize : false,
            allowMaximize : false,
            width : 390
        });

        this._applyOptions(options);

        this._excludeChildControl("captionbar");

        this.getChildControl("button-close").addListener("execute", function() {
            this.close();
        }, this);
        this.addListenerOnce("resize", function() {
            this.center();
            this.getChildControl("button-close").focus();
        }, this);

        var cmd = this.createCommand("Esc");
        cmd.addListener("execute", this.close, this);
    },

    members : {
        _options : null,

        _applyOptions : function(options) {
            this._options = options = options || {};
            if (options["caption"]) {
                this.setCaption(options["caption"]);
            }
            this.setImage(options["image"] !== undefined ? options["image"] : this.getImage());
            this.setMessage(options["message"]);

            if (options["checkbox"]) {
                this.getChildControl("checkbox");
            }
            this.setCallback(options["callback"]);
            this.setContext(options["context"]);
        },

        _createChildControlImpl : function(id, hash) {
            var control;

            switch (id) {
                case "general-container":
                    control = new qx.ui.container.Composite(new qx.ui.layout.HBox(10));
                    this.add(control);
                    break;

                case "image" :
                    control = new qx.ui.basic.Image(this.getImage());
                    this.getChildControl("general-container").addAt(control, 0);
                    break;

                case "message" :
                    control = new qx.ui.basic.Label();
                    control.set({rich : true, selectable : true, maxWidth : 350, wrap : true});
                    control.setValue(this.getMessage());
                    this.getChildControl("general-container").add(control);
                    break;

                case "checkbox" :
                    var cbo = this._options["checkbox"];
                    control = new qx.ui.form.CheckBox(cbo["label"]);
                    control.setValue(!!cbo["value"]);
                    this.addAfter(control, this.getChildControl("general-container"));
                    break;

                case "buttons-container":
                    control = new qx.ui.container.Composite(new qx.ui.layout.HBox(10, "center"));
                    //this.addAfter(control, this.getChildControl("general-container"));
                    this.add(control);
                    break;

                case "button-close":
                    control = new qx.ui.form.Button(this.getCloseButtonLabel());
                    this.getChildControl("buttons-container").add(control);
                    break;
            }

            return control || this.base(arguments, id);
        },

        _applyImage : function() {
            if (this.getImage()) {
                this.getChildControl("image").setSource(this.getImage());
                this._showChildControl("image");
            } else {
                this._excludeChildControl("image");
            }
        },

        _applyMessage : function() {
            this.getChildControl("message").setValue(this.getMessage());
        },

        ensureOnTop : function() {
            var me = this;
            window.setTimeout(function() {
                var root = qx.core.Init.getApplication().getRoot();
                var maxWindowZIndex = me.getZIndex();
                var windows = root.getWindows();
                for (var i = 0; i < windows.length; i++) {
                    if (windows[i] != this) {
                        var zIndex = windows[i].getZIndex();
                        maxWindowZIndex = Math.max(maxWindowZIndex, zIndex);
                    }
                }
                me.setZIndex(maxWindowZIndex + 1e8); //including popups
                me.setActive(true);
                me.focus();
                me.getChildControl("button-close").focus();
            }, 0);
        },

        open : function() {
            this.base(arguments);
            this.ensureOnTop();
        },

        close : function() {
            this.base(arguments);
            if (this.getCallback()) {
                this.getCallback().call(this.getContext() || this);
            }
            this.resetCallback();
            this._dispose();
        },

        _dispose : function() {
            this._options = null;
        }
    },

    destruct : function() {
        this._dispose();
    }
});