/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.users.UsersTable", {
      extend  : qx.ui.table.Table,

      construct : function() {

          var tm = new sm.model.RemoteVirtualTableModel({
                "login" : this.tr("Логин"),
                "name" : this.tr("Имя"),
                "email" : this.tr("Email")
            })
            .set({
                "useColumns" : ["login", "name", "email"],
                "rowdataUrl" : sm.cms.Application.ACT.getUrl("select.users"),
                "rowcountUrl" : sm.cms.Application.ACT.getUrl("select.users.count")
            });

          var custom = {
              tableColumnModel : function(obj) {
                  var cm = new qx.ui.table.columnmodel.Resize(obj);
                  var scb = new qx.ui.table.columnmodel.resizebehavior.Default();
                  cm.setBehavior(scb);
                  return cm;
              }
          };
          this.base(arguments, tm, custom);

          var rr = new sm.table.renderer.CustomRowRenderer();
          rr.setBgColorInterceptor(qx.lang.Function.bind(function(rowInfo) {
              var rdata = rowInfo.rowData;
              if (rdata && rdata["disabled"] == false) {
                  return "gray";
              } else {
                  return "white";
              }
          }, this));
          this.setDataRowRenderer(rr);

          var tcm = this.getTableColumnModel();
          var cInd = tm.getColumnIndexById("login");
          if (cInd != null) {
              tcm.getBehavior().setWidth(cInd, 60);
          }
          cInd = tm.getColumnIndexById("name");
          if (cInd != null) {
              tcm.getBehavior().setWidth(cInd, "2*");
          }
           cInd = tm.getColumnIndexById("email");
          if (cInd != null) {
              tcm.getBehavior().setWidth(cInd, "1*");
          }
      },

      members :
      {

          getSelectedUserInd : function() {
              return this.getSelectionModel().getAnchorSelectionIndex();
          },

          getSelectedUser : function() {
              var sind = this.getSelectedUserInd();
              return sind != -1 ? this.getTableModel().getRowData(sind) : null;
          },

          setUserData : function(ind, data) {
              var tm = this.getTableModel();
              var rdata = tm.getRowData(ind);
              if (rdata == null || data == null) {
                  return;
              }
              for (var k in data) {
                  var kind = tm.getColumnIndexById(k);
                  if (kind == null) {
                      continue
                  }
                  tm.setValue(kind, ind, data[k]);
              }
          }

      }
  });

