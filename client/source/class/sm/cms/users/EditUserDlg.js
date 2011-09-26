/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Create new user dialog
 */
qx.Class.define("sm.cms.users.EditUserDlg", {
    extend  : qx.ui.window.Window,

    events :
    {

        /**
         * Fired if user successfully created/modified
         * data [userId, login, name]
         */
        completed : "qx.event.type.Data",


        /**
         * Fired if dlg closed
         */
        closed : "qx.event.type.Event"
    },

    properties :
    {
    },


    /**
     * @param user{Object?null} Users login if needs to edit user otherwise creating new user
     */
    construct : function(user) {
        this.base(arguments, user ? (this.tr("Редактирование") + " " + user["name"]) :
                             this.tr("Новый пользователь"), null);
        if (user) {
            this.__user = qx.lang.Object.clone(user);
        }

        this.setLayout(new qx.ui.layout.VBox);
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 380,
            height : 300
        });

        var form = this.__form = new qx.ui.form.Form();

        form.add(new qx.ui.form.TextField().set({required : true, maxLength : 64, readOnly : (user != null)}), this.tr("Логин"), null, "login");
        form.add(new qx.ui.form.TextField().set({required : true, maxLength : 256}), this.tr("Имя"), null, "name");
        form.add(new qx.ui.form.TextField().set({required : true, maxLength : 256}), this.tr("Email"),
                qx.util.Validate.email(), "email");

        var pVal = qx.lang.Function.bind(function() {
            var items = form.getItems();
            if (items["password"].getValue() == null || items["password"].getValue() == "") {
                if (!user) {
                    throw new qx.core.ValidationError("Validation Error", this.tr("Поле: пароль должно быть заполнено"));
                } else {

                }
            }
            if (items["password"].getValue() != items["passwordConfirm"].getValue()) {
                throw new qx.core.ValidationError("Validation Error", this.tr("Пароль и подтверждение пароля не совпадают"));
            }
        }, this);

        if (user) {
            var items = form.getItems();
            for (var k in items) {
                var it = items[k];
                if (it.setValue && user[k] !== undefined) {
                    it.setValue(user[k]);
                }
            }
        }

        form.add(new qx.ui.form.PasswordField().set({required : (user == null), maxLength : 64}), this.tr("Пароль"), pVal, "password");
        form.add(new qx.ui.form.PasswordField().set({required : (user == null), maxLength : 64}), this.tr("Повторите пароль"), pVal, "passwordConfirm");

        var ok = new qx.ui.form.Button(user != null ? this.tr("Изменить") : this.tr("Создать"));
        ok.addListener("execute", this.__createUser, this);
        form.addButton(ok);

        var cancel = new qx.ui.form.Button(this.tr("Отменить"));
        cancel.addListener("execute", this.close, this);
        form.addButton(cancel);

        var fr = new sm.ui.form.OneColumnFormRenderer(form);
        this.add(fr);

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);
    },

    members :
    {

        __user : null,

        __form : null,

        __createUser : function() {
            if (!this.__form.validate()) {
                return;
            }
            var create = (this.__user == null);
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl(create ? "create.user" : "update.user"),
                    "POST", "application/json");
            var items = this.__form.getItems();
            for (var k  in items) {
                var el = items[k];
                if (el.getValue() != null) {
                    req.setParameter(k, el.getValue(), true);
                }
            }
            req.send(function(resp) {
                var doc = resp.getContent();
                this.fireDataEvent("completed", doc);
            }, this);
        },

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__user = null;
            this._disposeObjects("__closeCmd", "__form");
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
