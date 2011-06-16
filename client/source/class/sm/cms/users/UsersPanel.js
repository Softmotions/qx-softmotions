/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/actions/user_add.png)
 #asset(sm/cms/icon/16/actions/user_edit.png)
 */

qx.Class.define("sm.cms.users.UsersPanel", {
      extend : qx.ui.core.Widget,
      include : [ qx.ui.core.MChildrenHandling],

      events :
      {
      },

      properties :
      {
      },

      construct : function() {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox());

          var toolbar = new qx.ui.toolbar.ToolBar();
          var mainPart = new qx.ui.toolbar.Part();
          toolbar.add(mainPart);


          var mb = new qx.ui.toolbar.Button(this.tr("Новый пользователь"), "sm/cms/icon/16/actions/user_add.png");
          mb.addListener("execute", this.__addUser, this);
          mainPart.add(mb);

          var eb = new qx.ui.toolbar.Button(this.tr("Изменить"), "sm/cms/icon/16/actions/user_edit.png").set({enabled : false});
          eb.addListener("execute", function(ev) {
              var user = this.__uselector.getSelectedUser();
              var ind = this.__uselector.getSelectedUserInd();
              if (user == null) {
                  return;
              }
              this.__editUser(user, ind);
          }, this);
          mainPart.add(eb);

          this._add(toolbar);

          var sp = new qx.ui.splitpane.Pane("vertical");
          this._add(sp, {flex : 1});

          var us = this.__uselector = new sm.cms.users.UsersSelector();
          sp.add(us);

          us.getTable().addListener("cellDblclick", function(ev) {
              var user = this.__uselector.getSelectedUser();
              var ind = this.__uselector.getSelectedUserInd();
              if (user == null) {
                  return;
              }
              this.__editUser(user, ind);
          }, this);

          us.addListener("userSelected", function(ev) {
              var user = ev.getData();
              this.__uprops.setUser(user ? user["login"] : null);
              if (user == null) {
                  eb.setEnabled(false);
                  return;
              }
              eb.setEnabled(true);
          }, this);

          var up = this.__uprops = new sm.cms.users.UserPropsPanel();
          sp.add(up);

          us.setViewSpec({});
      },

      members :
      {
          __uselector : null,

          __uprops : null,


          __editUser : function(user, ind) {
              var dlg = new sm.cms.users.EditUserDlg(user);
              dlg.addListener("completed", function(ev) {
                  var doc = ev.getData();
                  dlg.close();
                  if (user == null || ind == null) {
                      this.__uselector.setViewSpec({login : doc["login"]});
                      this.__uprops.setUser(null);
                  } else {
                      this.__uselector.setUserData(ind, doc);
                  }
              }, this);
              dlg.open();
          },

          __addUser : function() {
              this.__editUser(null);
          }
      },

      destruct : function() {
          this.__uselector = this.__uprops = null;
          //this._disposeObjects("__field_name");
      }
  });

