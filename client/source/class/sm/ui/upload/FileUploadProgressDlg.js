/**
 * File upload progress dialog.
 * NOTE: It uses HTML5 FileAPI.
 */

qx.Class.define("sm.ui.upload.FileUploadProgressDlg", {
    extend : qx.ui.window.Window,

    statics : {
    },

    events : {
    },

    properties : {
    },

    /**
     * Files (FileAPI)
     * to be sent via HTTP request.
     *
     * @param url {String}
     * @param files {File}
     */
    construct : function(url, files) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.HBox(5));
        this.set({
            modal : true,
            showMinimize : false,
            showMaximize : false,
            allowMaximize : false,
            showClose : false

        });
        this.__progress = new qx.ui.indicator.ProgressBar();
        this.add(this.__progress, {flex : 1});

        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", this.__cancel, this);
        this.add(cancel);
        this.addListenerOnce("resize", this.center, this);
        this.addListenerOnce("appear", this.__transfer, this);
    },

    members : {

        __xhr : null,

        __progress : null,

        __transfer : function() {

        },

        __cancel : function(ev) {
            ev.getTarget().setEnabled(false);
            this.close();
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});
