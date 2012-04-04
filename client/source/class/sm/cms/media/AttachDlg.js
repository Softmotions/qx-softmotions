/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.cms.media.AttachDlg", {
    extend  : qx.ui.window.Window,

    events :
    {

        /**
         * When insert button was pressed
         * data: [fname, ctype, ltext, link]
         */
        insert : "qx.event.type.Data"

    },

    properties :
    {
    },

    construct : function(pageRef, caption, icon) {
        this.base(arguments, caption ? caption : this.tr("Managing files"), icon);

        var me = this;

        this.__pageRef = pageRef;
        qx.core.Assert.assert(this.__pageRef != null);

        this.setLayout(new qx.ui.layout.Dock(5, 5).set({sort : "y"}));
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 510,
            height : 410
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        var tm = new qx.ui.table.model.Simple();
        tm.setColumns([this.tr("File").toString(), this.tr("Type").toString(), this.tr("Size").toString()],
                ["fname", "ftype", "fsize"]);

        var custom = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };

        this.__table = new qx.ui.table.Table(tm, custom).set({statusBarVisible : false});
        this.__table.setContextMenuHandler(0, this.__contextMenuHandlerShow, this);
        this.__table.setContextMenuHandler(1, this.__contextMenuHandlerShow, this);
        this.__table.setContextMenuHandler(2, this.__contextMenuHandlerShow, this);

        var rb = this.__table.getTableColumnModel().getBehavior();
        rb.set(0, { width:"2*"});
        rb.set(1, { width:"1*"});
        rb.set(2, { width:"1*"});

        var uploadBt = new qx.ui.form.Button(this.tr("Upload")).set({enabled : false});
        uploadBt.addListener("execute", this.__uploadFiles, this);

        this.__fileForm = new sm.ui.form.UploadForm("attach_form", sm.cms.Application.ACT.getUrl("media.upload"));
        this.__fileForm.addListener("changeValue", function(ev) {
            var fcount = ev.getData();
            uploadBt.setEnabled(fcount > 0);
        });


        var form = this.__form = new qx.ui.form.Form();
        var linkText = new qx.ui.form.TextField().set({required : false});
        var linkTarget = new qx.ui.form.TextField().set({required : false});
        form.add(linkText, this.tr("Link text"), null, "linkText");
        form.add(linkTarget, this.tr("Link"), null, "linkTarget");
        var fr = new qx.ui.form.renderer.Single(form);
        fr._getLayout().setColumnFlex(0, 0);
        fr._getLayout().setColumnFlex(1, 1);

        //// CENTER
        this.add(this.__table, {edge : "center"});

        var infoSide = this.__infoSide = new qx.ui.container.Composite(new qx.ui.layout.VBox(5));
        //// IPARAMS STACK
        var iparams = new qx.ui.container.Stack();
        iparams.add(new qx.ui.core.Widget());        //0

        var imgParams = new qx.ui.groupbox.GroupBox(this.tr("Image"));
        imgParams.setLayout(new qx.ui.layout.HBox(5, "center"));

        var ipreview = new qx.ui.basic.Image();

        imgParams.add(ipreview);
        iparams.add(imgParams);                      //1
        //// EOF IPARAMS STACK

        var dbutton = new qx.ui.form.Button(this.tr("Delete")).set({enabled : false});
        var ibutton = new qx.ui.form.Button(this.tr("Insert")).set({enabled : false});
        ibutton.addListener("execute", this.__insertAction, this);

        infoSide.add(iparams, {flex : 0});

        this.__fileForm.getControlContainer().add(uploadBt, {flex : 1});
        this.__fileForm.getControlContainer().add(dbutton, {flex : 1});
        this.__fileForm.getControlContainer().add(ibutton, {flex : 1});

        ///SOUTH
        this.add(fr, {edge : "south"});
        this.add(this.__fileForm, {edge : "south"});

        ///EAST
        this.add(this.__infoSide, {edge : "east"});


        var changeTableSelection = function() {
            var sModel = me.__table.getSelectionModel();
            var sind = sModel.getAnchorSelectionIndex();
            if (sind >= 0 || sm.getSelectedCount() > 0) {
                var tmrow = tm.getData()[sind];
                if (tmrow[1] && tmrow[1].indexOf("image/") == 0) {
                    var source = sm.cms.Application.ACT.getUrl("media.get", "ref", pageRef + tmrow[0] + ".thumb");
                    ipreview.setSource(source);
                    iparams.setSelection([iparams.getChildren()[1]]);
                    linkTarget.setEnabled(true);
                }
                ibutton.setEnabled(true);
                dbutton.setEnabled(true);

                return;
            }

            ibutton.setEnabled(false);
            dbutton.setEnabled(false);

            ipreview.setSource(null);
            iparams.setSelection([iparams.getChildren()[0]]);
            linkTarget.setValue("");
            linkTarget.setEnabled(false);
        };


        this.__table.getSelectionModel().addListener("changeSelection", changeTableSelection, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);


        dbutton.addListener("execute", function(ev) {
            var row = this.__table.getSelectionModel().getAnchorSelectionIndex();
            if (row == -1) {
                return;
            }
            sm.cms.Application.confirm(this.tr("Do you really want to delete the selected file?"), function(res) {
                if (res) {
                    this.__removeMediaFile(this.__table.getTableModel().getData()[row]);
                }
            }, this);
        }, this);
    },

    members :
    {
        __pageRef : null,

        __closeCmd : null,

        __table : null,

        __form : null,

        __fileForm : null,

        __infoSide : null,

        open : function() {
            this.base(arguments);
            this.__loadMediaList();
        },


        __insertAction : function() {
            var row = this.__table.getSelectionModel().getAnchorSelectionIndex();
            if (row == -1) {
                return;
            }
            var rdata = this.__table.getTableModel().getData()[row];
            var fitems = this.__form.getItems();
            var linkText = fitems["linkText"].getValue();
            var linkTarget = fitems["linkTarget"].getValue();
            if (linkText == "") {
                linkText = null;
            }
            if (linkTarget == "") {
                linkTarget = null;
            }
            var edata = [rdata[0], rdata[1], linkText, linkTarget];
            this.fireDataEvent("insert", edata);
        },


        __loadMediaList : function() {
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("media.list"), "GET", "application/json");
            req.setParameter("ref", this.__pageRef, false);
            req.send(function(resp) {
                var files = resp.getContent();
//              [{"name":"P7120783.JPG","contentType":"image/jpeg","length":1671329},
//              {"name":"P7120784.JPG","contentType":"image/jpeg","length":1603178}]
                var tm = this.__table.getTableModel();
                var rowData = [];
                for (var i = 0; i < files.length; ++i) {
                    var f = files[i];
                    rowData.push([f["name"], f["contentType"], f["length"]]);
                }
                tm.setData(rowData);
                if (rowData.length == 0) {
                    this.__table.getSelectionModel().resetSelection();
                }
            }, this);
        },

        __uploadFiles : function() {

            var root = qx.core.Init.getApplication().getRoot();
            root.setGlobalCursor("wait");
            root.blockContent(this.getZIndex() + 1);

            this.__fileForm.setParameter("ref", this.__pageRef, true);
            this.__fileForm.addListenerOnce("completed", this.__uploadFilesCompleted, this);
            this.__fileForm.addListenerOnce("completedResponse", function(ev) {
                var resp = null;
                var errors = [];
                try {
                    resp = qx.lang.Json.parse(ev.getData());
                    if (qx.lang.Type.isArray(resp.errors)) {
                        errors = resp.errors;
                    }
                } catch(e) {
                    qx.log.Logger.error(this, e);
                    errors.push(e.toString());
                }
                if (errors.length > 0) {
                    var alert = new sm.alert.AlertMessages(this.tr("Alert"));
                    alert.addMessages(this.tr("Errors when uploading files"), errors);
                    alert.show();
                }
            }, this);
            this.__fileForm.send();
        },

        __uploadFilesCompleted : function() {
            try {
                this.__fileForm.removeAllUploadRows();
                this.__loadMediaList();
            } finally {
                var root = qx.core.Init.getApplication().getRoot();
                root.resetGlobalCursor();
                root.unblockContent();
            }
        },

        __contextMenuHandlerShow : function(col, row, table, dataModel, contextMenu) {
            var menuEntry = new qx.ui.menu.Button(this.tr("Delete"));
            menuEntry.addListener("execute", function(e) {
                sm.cms.Application.confirm(this.tr("Do you really want to delete the selected file?"), function(res) {
                    if (res) {
                        this.__removeMediaFile(dataModel.getData()[row]);
                    }
                }, this);
            }, this);
            contextMenu.add(menuEntry);
            return true;
        },

        __removeMediaFile : function(rowData) {
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("media.remove"), "GET", "application/json");
            var fname = (this.__pageRef + rowData[0]);
            req.setParameter("ref", fname, false);
            req.send(function() {
                this.__loadMediaList();
                this.__table.getSelectionModel().resetSelection();
            }, this);
        },

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__pageRef = null;
            this._disposeObjects("__closeCmd", "__table", "__infoSide", /*"__fileForm", todo due to focus bug?*/ "__form");
        },

        close : function() {
            this.base(arguments);
            this.__dispose();
        }

    },

    destruct : function() {
        this.__dispose();
    }
});
