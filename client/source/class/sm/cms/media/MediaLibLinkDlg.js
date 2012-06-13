/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.media.MediaLibLinkDlg", {
    extend  : qx.ui.window.Window,

    events :
    {
        /**
         * Fired if media file was selected,
         * data: [fileId, hierachy]
         */
        fileSelected : "qx.event.type.Data",

        /**
         * Fired if media branch was selected
         * data: [branchId, hierachy]
         */
        branchSelected : "qx.event.type.Data"
    },

    properties :
    {
        /**
         * Page ID will be opened in nav hierarchy during init()
         */
        ensureOpened : {
            check : "String",
            nullable : true
        }
    },

    construct : function(options, caption, icon) {
        this.base(arguments, caption ? caption : this.tr("Link to media resource"), icon);
        this.setLayout(new qx.ui.layout.VBox(5));
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 340,
            height : 460
        });

        var canSelectBranch = options["branchSelectable"] === undefined || !!options["branchSelectable"];
        var canSelectFile = options["fileSelectable"] === undefined || !!options["fileSelectable"];

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);

        this.__navCont = new sm.cms.nav.NavResources(this.tr("Media resources"), "media");
        this.add(this.__navCont, {flex : 1});

        var footer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({alignX : "right"}));
        var ok = new qx.ui.form.Button(options["oklabel"] || this.tr("Choose"));

        ok.addListener("execute", function(ev) {
            if (this.__currentMedia == null) {
                return;
            }
            var hr = this.__navCont.getHierarchy(this.__currentMediaNode); //obtain hierarchy
            if (hr.length > 0) {
                hr.shift();
            }
            var ename = (this.__currentMediaNode.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) ? "branchSelected" : "fileSelected";
            this.fireDataEvent(ename, [this.__currentMedia, hr]);
        }, this);

        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", function(ev) {
            this.close();
        }, this);

        ok.setEnabled(false);
        footer.add(ok);
        footer.add(cancel);
        this.add(footer);

        this.__navCont.addListener("selectMedia", function(ev) {
            var data = ev.getData();
            if ((canSelectBranch && data[1].type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) ||
                    (canSelectFile && data[1].type == qx.ui.treevirtual.MTreePrimitive.Type.LEAF)) {
                ok.setEnabled(true);
                this.__currentMedia = data[0];
                this.__currentMediaNode = data[1];
            } else {
                ok.setEnabled(false);
                this.__currentMedia = null;
                this.__currentMediaNode = null;
            }
        }, this);

        this.__navCont.addListener("selectOther", function(ev) {
            ok.setEnabled(false);
            this.__currentMedia = null;
            this.__currentMediaNode = null;
        }, this);
    },

    members :
    {

        __currentMedia : null,

        __currentMediaNode : null,

        __navCont : null,

        __closeCmd : null,

        open : function() {
            this.base(arguments);
            this.__navCont.init(this.getEnsureOpened());
        },

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__currentMedia = this.__currentMediaNode = null;
            this._disposeObjects("__closeCmd", "__navCont");
        },

        close : function() {
            this.base(arguments);
            this.__dispose();
        }
    },

    destruct : function() {
        this.__dispose();
        //this._disposeObjects("__field_name");
    }
});