/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Dialog for selecting user
 */
qx.Class.define("sm.cms.users.UsersSelectorDlg", {
    extend  : qx.ui.window.Window,

    events :
    {
        /**
         * Fired if user successfully created/modified
         * data [login, name]
         */
        completed : "qx.event.type.Data",

        /**
         * Fired if dlg closed
         */
        closed : "qx.event.type.Event"
    },

    construct : function(options) {
        this.base(arguments, this.tr("Select user"), null);

        this.setLayout(new qx.ui.layout.VBox(4));
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 500,
            height : 460
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);

        var sel = this.__selector = new sm.cms.users.UsersSelector();
        this.add(sel, {flex : 1});


        var footer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({alignX : "right"}));
        var ok = new qx.ui.form.Button(this.tr("Select")).set({enabled : false});
        ok.addListener("execute", function(ev) {
            var user = this.__selector.getSelectedUser();
            if (user) {
                this.fireDataEvent("completed", user);
            }
        }, this);
        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", function(ev) {
            this.close();
        }, this);

        footer.add(ok);
        footer.add(cancel);
        this.add(footer);


        sel.addListener("userSelected", function(ev) {
            var user = ev.getData();
            ok.setEnabled(user != null);
        }, this);
    },

    members :
    {
        __selector : null,

        __closeCmd : null,

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__selector = null;
            this._disposeObjects("__closeCmd");
        },

        show : function() {
            this.__selector.setViewSpec({});
            this.base(arguments);

        },

        close : function() {
            this.base(arguments);
            this.fireEvent("closed");
            this.__dispose();
        }
    },

    destruct : function() {
        this.__dispose();
    }
});
