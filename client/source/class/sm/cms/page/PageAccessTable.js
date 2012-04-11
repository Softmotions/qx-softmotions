/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/actions/user.png)
 #asset(sm/cms/icon/16/actions/user_add.png)
 #asset(sm/cms/icon/16/actions/user_delete.png)
 */

/**
 * Page access list
 */
qx.Class.define("sm.cms.page.PageAccessTable", {
    extend  : sm.table.ToolbarLocalTable,
    include : [
        sm.table.MTableMutator
    ],

    construct : function() {
        this.base(arguments);
        this._reload([]);
    },

    members :
    {
        __pageRef : null,

        __ownerBt : null,

        __rmBt : null,

        __aclTable : null,

        setPage : function(ref) {

            if (this.__aclTable.isEditing()) {
                this.__aclTable.stopEditing();
            }

            var uid = sm.cms.Application.getUserId();
            var creator = null;

            this.__pageRef = ref;

            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.acl", "ref", ref),
              "GET", "application/json");

            req.addListener("finished", function(ev) {
                var err = ev.getData();
                if (err) { //If error, cleanup
                    this.__ownerBt.setValue("");
                    this._reload([]);
                }
                if (uid == creator || sm.cms.Application.userInRoles(["structure.admin"])) {
                    this.__ownerBt.setEnabled(true);
                } else {
                    this.__ownerBt.setEnabled(false);
                }
            }, this);

            req.send(function(resp) {
                var udata = resp.getContent();
                this.__ownerBt.setValue("");
                if (!qx.lang.Type.isArray(udata)) {
                    this._reload([]);
                    return;
                }
                var tdata = [];
                for (var i = 0; i < udata.length; ++i) {
                    var urow = udata[i];
                    var roles = urow[3];
                    if (!qx.lang.Type.isArray(roles)) {
                        continue;
                    }
                    var user = {
                        login : urow[0],
                        name : urow[1],
                        email : urow[2]
                    };
                    if (roles.indexOf("owner") != -1) {
                        this.__ownerBt.setValue(user["login"] + " | " + user["name"]);
                        this.__ownerBt.setUserData(user);
                    }
                    if (roles.indexOf("creator") != -1) {
                        creator = user["login"];
                    }

                    //Process edit & news
                    if (roles.indexOf("edit") == -1 &&
                      roles.indexOf("news") == -1 &&
                      roles.indexOf("del") == -1) {
                        //no edit/news flags, skipping
                        continue;
                    }
                    // todo rolenames hardcoded
                    var rowSpec = [
                        [user.login, user.name,
                            (roles.indexOf("edit") != -1), (roles.indexOf("news") != -1),   (roles.indexOf("del") != -1), (roles.indexOf("recursive") != -1)],
                        user.login
                    ];
                    tdata.push(rowSpec);
                }
                this._reload(tdata);
            }, this);
        },

        _setJsonTableData : function(tm, items) {
            var data = {
                "title" : "",
                "columns" : [
                    {
                        "title" : this.tr("Логин").toString(),
                        "id" : "login",
                        "width" : 60
                    },
                    {
                        "title" : this.tr("Имя пользователя").toString(),
                        "id" : "name",
                        "width" : "2*"
                    },
                    // todo rolenames hardcode
                    {
                        "title" : this.tr("Редактирование").toString(),
                        "id" : "role.edit",
                        "type" : "boolean",
                        "editable" : true,
                        "width" : "1*"
                    },
                    {
                        "title" : this.tr("Новости").toString(),
                        "id" : "role.news",
                        "type" : "boolean",
                        "editable" : true,
                        "width" : "1*"
                    },
                    {
                        "title" : this.tr("Удаление").toString(),
                        "id" : "role.del",
                        "type" : "boolean",
                        "editable" : true,
                        "width" : "1*"
                    },
                    {
                        "title" : this.tr("Рекурсивно").toString(),
                        "id" : "role.recursive",
                        "type" : "boolean",
                        "editable" : true,
                        "width" : "1*"
                    }
                ],
                "items" : items ? items : []
            };
            tm.setJsonData(data);
        },

        _createTable : function(tableModel) {
            var table = this.__aclTable = new sm.table.Table(tableModel, tableModel.getCustom());
            table.set({statusBarVisible : false});
            table.getSelectionModel().addListener("changeSelection", function(ev) {
                var scount = table.getSelectionModel().getSelectedCount();
                this.__rmBt.setEnabled(scount > 0);
            }, this);
            table.addListener("dataEdited", function(ev) {
                var data = ev.getData();
                var row = data.row;
                var value = data.value;
                var colId = tableModel.getColumnId(data.col);
                if (colId == null || colId.indexOf("role.") != 0) {
                    return;
                }
                var uid = this.getRowData(row);
                var mode = (value == true ? "+" : "-") + colId.substring("role.".length);
                this.__updateAccess(uid, mode, function(err) {
                    if (err) {
                        tableModel.setValueById(colId, row, false);  //reset role if error
                    }
                });
            }, this);
            return table;
        },

        _initPrecedingWidgets : function() {
            var ownerBt = this.__ownerBt = new sm.ui.form.ButtonField(this.tr("Владелец"), "sm/cms/icon/16/actions/user.png");
            ownerBt.setReadOnly(true);
            ownerBt.addListener("execute", function() {
                var dlg = new sm.cms.users.UsersSelectorDlg();
                dlg.addListenerOnce("completed", function(ev) {
                    var user = ev.getData();
                    dlg.close();
                    this.__updateAccess(user["login"], "+owner", function(err) {
                        if (!err) {
                            ownerBt.setValue(user["login"] + " | " + user["name"]);
                            ownerBt.setUserData(user);
                        }
                    });
                }, this);
                dlg.show();
            }, this);
            this.add(ownerBt);
        },

        __updateAccess : function(uid, mode, cb) {
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.update.acl",
              "ref", this.__pageRef,
              "uid", uid,
              "role", mode), "GET", "application/json");
            req.addListener("finished", function(ev) {
                var err = ev.getData();
                if (cb) {
                    cb.call(this, err);
                }
            }, this);
            req.send();
        },

        _createToolbarItems : function(toolbar) {
            var mainPart = new qx.ui.toolbar.Part();
            toolbar.add(mainPart);

            var addBt = new qx.ui.toolbar.Button(this.tr("Добавить пользователя"), "sm/cms/icon/16/actions/user_add.png");
            addBt.addListener("execute", function(ev) {
                var dlg = new sm.cms.users.UsersSelectorDlg();
                dlg.addListenerOnce("completed", function(ev) {
                    var user = ev.getData();
                    this.addRow(user["login"], [user["login"], user["name"], false, false, false, false]);
                    dlg.close();
                }, this);
                dlg.show();
            }, this);
            mainPart.add(addBt);

            var rmBt = this.__rmBt =
              new qx.ui.toolbar.Button(this.tr("Убрать пользователя"), "sm/cms/icon/16/actions/user_delete.png")
                .set({enabled : false});
            rmBt.addListener("execute", function(ev) {
                var user = this.getSelectedRowData();
                if (user == null) {
                    return;
                }
                this.__updateAccess(user, "-*", function(err) {
                    if (!err) {
                        this.removeRow(user);
                    }
                });
            }, this);

            mainPart.add(rmBt);
            return toolbar;
        }
    },

    destruct : function() {
        this.__rmBt = this.__ownerBt = this.__pageRef = this.__aclTable = null;
        //this._disposeObjects("__field_name");
    }
});