/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/actions/page_link.png)

 */

/**
 * Dialog for creating new news
 */
qx.Class.define("sm.cms.news.NewNewsDlg", {
    extend  : qx.ui.window.Window,

    events :
    {

        /**
         * Fired if dialo applied
         * data: [news caption, page id]
         */
        completed : "qx.event.type.Data",


        /**
         * Fired when dialog closed
         */
        close : "qx.event.type.Event"
    },


    construct : function(options) {
        this.base(arguments, this.tr("Создание новости"), null);
        this.setLayout(new qx.ui.layout.Grow());
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 480,
            height : 140
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);

        var pid = null;
        var form = this.__form = new qx.ui.form.Form();

        var title = new qx.ui.form.TextField().set({required : true, maxLength : 64});
        title.addListener("keydown", function(ev) {
            if (ev.getKeyCode() == 13) {
                ev.stop();
                if (!form.validate()) {
                    return;
                }
                this.fireDataEvent("completed", [title.getValue(), pid])
            }
        }, this);
        title.focus();
        form.add(title, this.tr("Заголовок"), null, "name");

        var ps = new sm.ui.form.ButtonField(null, "sm/cms/icon/16/actions/page_link.png");

        if (options && options["rootPage"]) {
            var rp = options["rootPage"];
            pid = rp["pageId"];
            ps.setValue(rp["name"]);
            ps.setEnabled(false);
        }

        ps.setRequired(true);
        ps.setReadOnly(true);
        ps.addListener("execute", function() {
            var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : false,
                includeLinkName : false,
                oklabel : this.tr("Выбрать раздел")});
            var pageSelected = function(ev) {
                var sp = ev.getData();
                pid = sp[0];
                ps.setValue(sp[2].join("/"));
                dlg.close();
            };
            dlg.addListener("pageSelected", pageSelected, this);
            dlg.addListener("linkSelected", pageSelected, this);
            dlg.open();
        }, this);
        form.add(ps, this.tr("Корневая страница"));


        var cancel = new qx.ui.form.Button("Отменить");
        var ok = new qx.ui.form.Button("Создать");
        ok.addListener("execute", function() {
            if (!form.validate()) {
                return;
            }
            ok.setEnabled(false);
            cancel.setEnabled(false);
            this.fireDataEvent("completed", [title.getValue(), pid])
        }, this);


        cancel.addListener("execute", function() {
            this.close();
        }, this);
        form.addButton(ok);
        form.addButton(cancel);

        var fr = new sm.cms.util.FlexFormRenderer(form);
        this.add(fr);
    },

    members :
    {

        __closeCmd : null,

        __form : null,


        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this._disposeObjects("__form", "__closeCmd");
        },

        close : function() {
            this.base(arguments);
            this.__dispose();
            this.fireEvent("close");
        }

    },

    destruct : function() {
        this.__dispose();
    }
});

