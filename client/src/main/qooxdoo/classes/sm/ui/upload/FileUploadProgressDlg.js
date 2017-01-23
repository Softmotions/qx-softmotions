/**
 * File upload progress dialog.
 * NOTE: It uses HTML5 FileAPI.
 */

qx.Class.define("sm.ui.upload.FileUploadProgressDlg", {
    extend: qx.ui.window.Window,

    statics: {
        __ALERT_WND: null
    },

    events: {
        "completed": "qx.event.type.Data"
    },

    properties: {},

    /**
     * Files (FileAPI)
     * to be sent via HTTP request.
     *
     * @param urlFactory {Function} Url factory accepts file as agrument return request url string.
     * @param files {File}
     */
    construct: function (urlFactory, files) {
        this.base(arguments);
        this.setLayout(new qx.ui.layout.HBox(5));
        this.set({
            modal: true,
            showMinimize: false,
            showMaximize: false,
            allowMaximize: false,
            showClose: false

        });
        this.__errors = [];
        this.__urlFactory = urlFactory;
        this.__files = files;
        this.__progress = new qx.ui.indicator.ProgressBar();
        this.add(this.__progress, {flex: 1});

        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", this.__cancel, this);
        this.add(cancel);
        this.addListenerOnce("resize", this.center, this);
        this.addListenerOnce("appear", this.__transfer, this);
    },

    members: {

        __urlFactory: null,

        __progress: null,

        __files: null,

        __transferRequests: null,

        __errors: null,

        __transfer: function () {
            var me = this;
            var tasks = this.__files.length;
            var total = 0;
            var current = 0;
            var errors = this.__errors = [];
            for (var i = 0; this.__files[i]; ++i) {
                total += this.__files[i].size;
            }
            this.__transferRequests = [];
            this.__progress.setMaximum(total);
            var updateProgress = function (delta) {
                current += delta;
                me.__progress.setValue(current);
            };

            for (var i = 0; i < this.__files.length; ++i) {
                (function (f, url) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("PUT", url, true);
                    me.__transferRequests.push(xhr);
                    var uploaded = 0;
                    if (f.type == null || f.type.length == 0 || f.type == "") {
                        xhr.setRequestHeader("Content-Type", "application/octet-stream");
                    }
                    xhr.onreadystatechange = function () {
                        if (this.readyState == this.DONE) {
                            me.__parseMessageHeaders(this);
                            --tasks;
                            if (this.status >= 400) {
                                errors.push("HTTP error " + this.status);
                            }
                            if (tasks == 0) {
                                me.__done();
                            }
                        }
                    };
                    xhr.upload.onprogress = function (evt) {
                        var delta = evt.loaded - uploaded;
                        if (delta > 0) {
                            updateProgress(delta);
                        }
                        uploaded = evt.loaded;
                    };
                    xhr.onerror = function (err) {
                        errors.push(err);
                    };
                    xhr.send(f);
                })(this.__files[i], this.__urlFactory(this.__files[i]));
            }
        },

        __done: function () {
            this.__transferRequests = [];
            var data = {};
            if (this.__errors && this.__errors.length) {
                data["errors"] = this.__errors;
            }
            this.fireDataEvent("completed", data);
        },

        close: function () {
            this.base(arguments);
            this.__destroy();
        },

        __cancel: function (ev) {
            ev.getTarget().setEnabled(false);
            if (this.__transferRequests != null) {
                this.__transferRequests.forEach(function (r) {
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

        __destroy: function () {
            this.__files = null;
            this.__progress = null;
            this.__urlFactory = null;
            this.__transferRequests = null;
        },

        __parseMessageHeaders: function (xhr) {
            var errors = [];
            var msgs = [];
            var eh = "X-Softmotions-Err";
            for (var i = 0; xhr.getResponseHeader(eh + i) != undefined; ++i) {
                errors[errors.length] = "*" + decodeURIComponent(xhr.getResponseHeader(eh + i).replace(/\+/g, ' '));
            }
            eh = "X-Softmotions-Msg";
            for (var i = 0; xhr.getResponseHeader(eh + i) != undefined; ++i) {
                msgs[msgs.length] = "*" + decodeURIComponent(xhr.getResponseHeader(eh + i).replace(/\+/g, ' '));
            }
            if (errors.length > 0) {
                this.__addMessages(this.tr("Errors"), errors);
            }
            if (msgs.length > 0) {
                this.__addMessages(this.tr("Messages"), msgs);
            }
        },

        __addMessages: function (caption, msgs) {
            var self = this.self(arguments);
            var awnd = self.__ALERT_WND;
            if (awnd == null) {
                awnd = self.__ALERT_WND = new sm.alert.DefaultAlertMessages(this.tr("System messages"));
                awnd.addListener("close", function () {
                    self.__ALERT_WND = null;
                }, this);
            }
            awnd.addMessages(caption, msgs);
            if (!awnd.isVisible()) {
                awnd.open();
            } else {
                awnd.ensureOnTop();
            }
        }
    },

    destruct: function () {
        this.__destroy();
    }
});
