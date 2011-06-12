/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.users.UserRolesTable", {
      extend : sm.table.ToolbarLocalTable,

      construct : function() {
          this.base(arguments);
          this._reload([]);
      },

      members :
      {

          __user : null,


          setUser : function(login) {
              if (login == null) {
                  this._reload([]);
                  this.__user = login;
                  return;
              }
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("select.user.roles"), "GET", "application/json");
              req.setParameter("ref", login, false);
              req.send(function(resp) {
                  var roles = resp.getContent();
                  this._reload(roles);
                  this.__user = login;
              }, this);
          },

          __saveUserRole : function(user, roleId, active) {
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("update.user.role"), "GET", "application/json");
              req.setParameter("ref", user, false);
              req.setParameter("role", roleId, false);
              req.setParameter("active", active, false);
              req.send();
          },

          ///////////////////////////////////////////////////////////////////////////
          //                         sm.table.ToolbarTable                         //
          ///////////////////////////////////////////////////////////////////////////

          // table.addListener("dataEdited", function(ev) {
          // edata.col, edata.row, edata.value

          //overriden
          _createToolbarItems : function(toolbar) {
              return toolbar;
          },

          //overriden
          _createTable : function(tm) {
              var table = new sm.table.Table(tm, tm.getCustom());
              table.addListener("dataEdited", function(ev) {
                  if (this.__user == null) {
                      return;
                  }
                  var data = ev.getData();
                  var role = this.getRowCellValue(0, data.row);
                  this.__saveUserRole(this.__user, role, data.value);
              }, this);
              table.set({statusBarVisible : false});
              return table;
          },

          //overriden
          _setJsonTableData : function(tm, items) {
              var data = {
                  "title" : "",
                  "columns" : [
                      {
                          "title" : this.tr("ID роли").toString(),
                          "id" : "id",
                          "width" : "1*"
                      },
                      {
                          "title" : this.tr("Название роли").toString(),
                          "id" : "name",
                          "width" : "2*"
                      },
                      {
                          "title" : this.tr("Назначена").toString(),
                          "id" : "active",
                          "type" : "boolean",
                          "editable" : true,
                          "width" : "1*"
                      }

                  ],
                  "items" : items ? items : []
              };
              tm.setJsonData(data);
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });

