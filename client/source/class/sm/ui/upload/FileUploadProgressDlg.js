/**
 * File upload progress dialog.
 * NOTE: It uses HTML5 FileAPI.
 */

qx.Class.define("sm.ui.upload.FileUploadProgressDlg", {
    extend : qx.ui.window.Window,

    statics : {
    },

    events : {
        "completed" : "qx.event.type.Event"
    },

    properties : {
    },

    /**
     * Files (FileAPI)
     * to be sent via HTTP request.
     *
     * @param urlFactory {Function} Url factory accepts file as agrument return request url string.
     * @param files {File}
     */
    construct : function(urlFactory, files) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.HBox(5));
        this.set({
            modal : true,
            showMinimize : false,
            showMaximize : false,
            allowMaximize : false,
            showClose : false

        });
        this.__urlFactory = urlFactory;
        this.__files = files;
        this.__progress = new qx.ui.indicator.ProgressBar();
        this.add(this.__progress, {flex : 1});

        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", this.__cancel, this);
        this.add(cancel);
        this.addListenerOnce("resize", this.center, this);
        this.addListenerOnce("appear", this.__transfer, this);
    },

    members : {

        __urlFactory : null,

        __progress : null,

        __files : null,

        __transferRequests : null,

        __transfer : function() {
            var me = this;
            var tasks = this.__files.length;
            var total = 0;
            var current = 0;
            for (var i = 0; this.__files[i]; ++i) {
                total += this.__files[i].size;
            }
            this.__transferRequests = [];
            this.__progress.setMaximum(total);
            var updateProgress = function(delta) {
                current += delta;
                me.__progress.setValue(current);
            };

            for (var i = 0; i < this.__files.length; ++i) {
                (function(f, url) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("PUT", url, true);
                    me.__transferRequests.push(xhr);
                    var uploaded = 0;
                    if (f.type == null || f.type.length == 0 || f.type == "") {
                        xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    }
                    xhr.onreadystatechange = function() {
                        if (this.readyState == this.DONE) {
                            --tasks;
                            if (tasks == 0) {
                                me.__done();
                            }
                        }
                    };
                    xhr.upload.onprogress = function(evt) {
                        var delta = evt.loaded - uploaded;
                        if (delta > 0) {
                            updateProgress(delta);
                        }
                        uploaded = evt.loaded;
                    };
                    xhr.send(f);
                })(this.__files[i], this.__urlFactory(this.__files[i]));
            }
        },

        __done : function() {
            this.__transferRequests = [];
            this.fireEvent("completed");
        },

        close : function() {
            this.base(arguments);
            this.__destroy();
        },

        __cancel : function(ev) {
            ev.getTarget().setEnabled(false);
            if (this.__transferRequests != null) {
                this.__transferRequests.forEach(function(r) {
                    try {
                        r.abort();
                    } catch (e) {
                        ;
                    }
                });
                this.__transferRequests = null;
            }
            this.close();
        },

        __destroy : function() {
            this.__files = null;
            this.__progress = null;
            this.__urlFactory = null;
            this.__transferRequests = null;
        }

    },

    destruct : function() {
        this.__destroy();
    }
});
