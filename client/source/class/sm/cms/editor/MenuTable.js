/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(qx/icon/${qx.icontheme}/16/actions/list-add.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/list-remove.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/go-up.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/go-down.png)
 */

/**
 * Menu editor table
 */
qx.Class.define("sm.cms.editor.MenuTable", {
      extend : sm.table.ToolbarLocalTable,
      implement : [
          qx.ui.form.IStringForm,
          qx.ui.form.IForm
      ],
      include : [
          qx.ui.form.MForm,
          qx.ui.core.MChildrenHandling,
          sm.table.MTableMutator
      ],

      events :
      {
          /** Fired when the value was modified */
          "changeValue" : "qx.event.type.Data",

          /** Fired when the enabled state was modified */
          "changeEnabled" : "qx.event.type.Data",

          /** Fired when the valid state was modified */
          "changeValid" : "qx.event.type.Data",

          /** Fired when the invalidMessage was modified */
          "changeInvalidMessage" : "qx.event.type.Data",

          /** Fired when the required was modified */
          "changeRequired" : "qx.event.type.Data"
      },

      properties :
      {
      },

      construct : function(options) {

          this.__options = options || {};
          this.__toolbar_items = [];

          this.base(arguments);

          this.set({allowGrowX : true, allowGrowY : false, height : 170});

          for (var i = 0; i < this.__toolbar_items.length; ++i) {
              this.__doItemEnabled(this.__toolbar_items[i], false);
          }

          this._reload([]);
      },

      members :
      {

          __options : null,

          /**
           * List of widgets and its enabled rules
           */
          __tollbar_items : null,

          __synchronize: null,
          __synchronizePath: null,


          ///////////////////////////////////////////////////////////////////////////
          //                         sm.table.ToolbarTable                         //
          ///////////////////////////////////////////////////////////////////////////

          _createToolbarItems : function(toolbar) {
              var mainPart = new qx.ui.toolbar.Part();
              toolbar.add(mainPart);

              var mb = new qx.ui.toolbar.Button(this.tr("Новая ссылка"), "icon/16/actions/list-add.png");
              mb.addListener("execute", function(e) {
                  this.__manageLink();
              }, this);
              this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: false,
                    inactiveOnSync: true
                });

              mainPart.add(mb);

              mainPart.addSeparator();

              mb = new qx.ui.toolbar.Button(this.tr("Удалить"), "icon/16/actions/list-remove.png");
              mb.addListener("execute", function(e) {
                  this.removeRowByIndex(this.getSelectedRowIndex());
              }, this);
              this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: true,
                    inactiveOnSync: true
                });
              mainPart.add(mb);

              mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-up.png");
              mb.addListener("execute", function(ev) {
                  var ind = this.getSelectedRowIndex();
                  this.moveRowByIndex(ind, -1, true);
              }, this);
              this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: true,
                    inactiveOnSync: true
                });
              mainPart.add(mb);

              mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-down.png");
              mb.addListener("execute", function(ev) {
                  var ind = this.getSelectedRowIndex();
                  this.moveRowByIndex(ind, 1, true);
              }, this);
              this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: true,
                    inactiveOnSync: true
                });
              mainPart.add(mb);

              if (this.__options["synchronizable"]) {
                  mb = new qx.ui.toolbar.Separator().set({width: 25});
                  mainPart.add(mb);

                  mb = new qx.ui.basic.Label("Синхронизация: ").set({alignY: "middle", marginRight: 5});
                  mainPart.add(mb);

                  mb = new qx.ui.toolbar.Button(this.tr("Вкл.")/*, "icon/16/actions/go-down.png"*/);
                  mb.addListener("execute", function(ev) {
                      this.__manageSync();
                  }, this);
                  this.__toolbar_items.push({
                        item: mb,
                        activeOnItem: false,
                        inactiveOnSync: true
                    });
                  mainPart.add(mb);

                  mb = new qx.ui.toolbar.Button(this.tr("Выкл")/*, "icon/16/actions/go-down.png"*/);
                  mb.addListener("execute", function(ev) {
                      sm.cms.Application.confirm(this.tr("Вы действительно хотите отключить синхронизацию?"), function(res){
                          if(res) {
                              this.__synchronize = null;
                              this.__synchronizePath = "";
                              this.__applyEditorEnabled();
                          }
                      }, this);
                  }, this);
                  this.__toolbar_items.push({
                        item: mb,
                        activeOnItem: false,
                        activeOnSync: true
                    });
                  mainPart.add(mb);
              }

              return toolbar;
          },

          //overriden
          _createTable : function(tm) {
              var table = new sm.table.Table(tm, tm.getCustom());
              table.set({showCellFocusIndicator : false,
                    statusBarVisible : !!this.__options["synchronizable"],
                    focusCellOnMouseMove : false});

              var smodel = table.getSelectionModel();
              smodel.addListener("changeSelection", function(ev) {
                  var scount = smodel.getSelectedCount();
                  for (var i = 0; i < this.__toolbar_items.length; ++i) {
                      this.__doItemEnabled(this.__toolbar_items[i], scount > 0);
                  }
              }, this);

              return table;
          },

          //overriden
          _setJsonTableData : function(tm, items) {
              var data = {
                  "title" : "",
                  "columns" : [
                      {
                          "title" : this.tr("Название").toString(),
                          "id" : "name",
                          "sortable" : false,
                          "width" : "1*"
                      },
                      {
                          "title" : this.tr("Ссылка").toString(),
                          "id" : "link",
                          "sortable" : false,
                          "width" : "1*"
                      }
                  ],
                  "items" : items
              };
              tm.setJsonData(data);
          },

          ///////////////////////////////////////////////////////////////////////////
          //                               Impl                                    //
          ///////////////////////////////////////////////////////////////////////////

          // apply enabled rule for item
          __doItemEnabled: function(item, onItem) {
              item.item.setEnabled(
                (!item.activeOnItem || onItem) &&
                  (!item.inactiveOnSync || !this.__synchronize) &&
                  (!item.activeOnSync || !!this.__synchronize)
              );
          },

          __applyEditorEnabled: function() {
              var table = this.getTable();

              if (this.__options["synchronizable"] && this.__synchronize) {
                  table.setEnabled(false);
                  table.setAdditionalStatusBarText(", " + this.tr("синхронизуется с ").toString() + (this.__synchronizePath || ""));
              } else {
                  table.setEnabled(true);
                  table.setAdditionalStatusBarText("");
              }

              for (var i = 0; i < this.__toolbar_items.length; ++i) {
                  this.__doItemEnabled(this.__toolbar_items[i], false);
              }
          },

          // add new menu link
          __manageLink : function() {
              var dlg = new sm.cms.page.PageLinkDlg({
                    "requireLinkName": true,
                    "allowOuterLinks" : this.__options["allowOuterLinks"]
                });
              dlg.addListener("pageSelected", function(ev) {
                  var data = ev.getData();
                  var ldata = {
                      "name" : data[1],
                      "link" : "/exp/p" + data[0]
                  };
                  this.addRow(function(odata) {
                      return (odata["name"] == ldata["name"])
                  }, [ldata["name"], ldata["link"]], ldata);

                  dlg.close();
              }, this);
              dlg.addListener("linkSelected", function(ev) {
                  var data = ev.getData();
                  var ldata = {
                      "name" : data[1],
                      "link" : data[0]
                  };
                  this.addRow(function(odata) {
                      return (odata["name"] == ldata["name"])
                  }, [ldata["name"], ldata["link"]], ldata);

                  dlg.close();
              }, this);
              dlg.open();
          },

          // enable menu synchronization
          __manageSync : function() {
              var dlg = new sm.cms.page.PageLinkDlg({
                    "oklabel": this.tr("Выбрать"),
                    "requireLinkName": false,
                    "allowOuterLinks" : false
                });
              dlg.addListener("pageSelected", function(ev) {
                  var data = ev.getData();
                  if (this.__options.pageInfo && this.__options.pageInfo["_id"] == data[0]) {
                      sm.cms.Application.alert(this.tr("Нельзя синхронизовывать с тойже страницей!"));
                      return;
                  }

                  this.__synchronize = data[0];
                  this.__synchronizePath = data[2].join("/");

                  dlg.close();

                  this.__applyEditorEnabled();
              }, this);
              dlg.open();
          },

          ///////////////////////////////////////////////////////////////////////////
          //                            StringForm stuff                           //
          ///////////////////////////////////////////////////////////////////////////


          // overridden
          setValue : function(value) {
              value = value || {};
              if (!qx.lang.Type.isObject(value)) {
                  qx.log.Logger.error(this, "Value is not object", value);
                  value = {};
              }

              value.items = value.items || [];
              if (!qx.lang.Type.isArray(value.items)) {
                  qx.log.Logger.error(this, "Value items is not array", value.items);
                  value.items = [];
              }
              this.__synchronize = value.synchronize = this.__options["synchronizable"] ? value.synchronize : null;
              this.__synchronizePath = value.synchronizePath = this.__options["synchronizable"] ? value.synchronizePath : null;

              var tdata = [];
              for (var i = 0; i < value.items.length; ++i) {
                  var name = value.items[i]["name"];
                  var link = value.items[i]["link"];
                  if (name == null || link == null) {
                      continue;
                  }
                  var rdata = [name, link];
                  rdata.rowData = value.items[i];
                  tdata.push(rdata);
              }

              var table = this.getTable();
              var tm = this.getTableModel();
              tm.setData(tdata);

              this.__applyEditorEnabled();

              this.fireDataEvent("changeValue", value);
          },

          // overridden
          resetValue : function() {
              this.setValue({});
          },

          // overridden
          getValue : function() {
              if (this.__options["synchronizable"] && this.__synchronize) {
                  return {
                      synchronize: this.__synchronize,
                      synchronizePath: this.__synchronizePath || "",
                      items: []
                  };
              } else {
                  var obj = [];
                  var tdata = this.getTableModel().getData();
                  for (var i = 0; i < tdata.length; ++i) {
                      obj.push(tdata[i].rowData);
                  }

                  return {
                      synchronize: null,
                      synchronizePath: "",
                      items: obj
                  };
              }
          },

          destruct : function() {
              this.__toolbar_items = this.__options = this.__synchronize = null;
          }
      }
  });

