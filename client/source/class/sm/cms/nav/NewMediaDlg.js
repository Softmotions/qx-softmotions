/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.nav.NewMediaDlg", {
    extend  : qx.ui.window.Window,

    events :
    {
        //JSon nav item
        "completed" : "qx.event.type.Data"
    },

    /**
     * @param pnode Parent node in navigation tree
     */
    construct : function(pnode, caption, icon) {
        this.base(arguments, caption ? caption : this.tr("Добавление ресурса"), icon);

        this.__pnode = pnode;
        qx.core.Assert.assert(this.__pnode != null);

        this.setLayout(new qx.ui.layout.VBox());
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 350,
            height : 50
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", this.close, this);

        var ok = new qx.ui.form.Button(this.tr("Сохранить"));
        ok.addListener("execute", this.save, this);

        var cancel = new qx.ui.form.Button(this.tr("Отмена"));
        cancel.addListener("execute", this.close, this);

        var fileForm = this.__fileForm = new sm.ui.form.UploadForm("media_form", sm.cms.Application.ACT.getUrl("medialib.upload"));
        fileForm.addListener("changeValue", function(ev) {
            var fcount = ev.getData();
            ok.setEnabled(fcount > 0);
        });
        fileForm._addFileItem();

        fileForm.getControlContainer().add(ok, {flex : 1});
        fileForm.getControlContainer().add(cancel, {flex : 1});

        this.add(fileForm);

        this.addListenerOnce("resize", this.center, this);
    },

    members :
    {
        __pnode : null,

        __closeCmd : null,

        __fileForm : null,

        save: function() {
            var root = qx.core.Init.getApplication().getRoot();
            root.setGlobalCursor("wait");
            root.blockContent(this.getZIndex() + 1);

            this.__fileForm.setParameter("parent", this.__pnode.$$data);
            this.__fileForm.addListenerOnce("completed", this.__uploadCompleted, this);
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
                    var alert = new sm.alert.AlertMessages(this.tr("Внимание"));
                    alert.addMessages(this.tr("Ошибки при загрузке файлов"), errors);
                    alert.show();
                }
            }, this);
            this.__fileForm.send();
        },

        __uploadCompleted : function() {
            try {
                this.fireDataEvent("completed", []);
            } finally {
                var root = qx.core.Init.getApplication().getRoot();
                root.resetGlobalCursor();
                root.unblockContent();
            }
        }
    },

    destruct : function() {

    }
});