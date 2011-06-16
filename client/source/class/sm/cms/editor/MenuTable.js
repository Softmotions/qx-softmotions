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
          this.__active_on_item = [];

          this.base(arguments);

          this.set({allowGrowX : true, allowGrowY : false, height : 170});

          for (var i = 0; i < this.__active_on_item.length; ++i) {
              var item = this.__active_on_item[i];
              item.setEnabled(false);
          }

          this._reload([]);
      },

      members :
      {

          __options : null,

          /**
           * List of widgets active on selected element
           */
          __active_on_item : null,


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
              mainPart.add(mb);

              mb = new qx.ui.toolbar.Button(this.tr("Удалить"), "icon/16/actions/list-remove.png");
              mb.addListener("execute", function(e) {
                  this.removeRowByIndex(this.getSelectedRowIndex());
              }, this);
              this.__active_on_item.push(mb);
              mainPart.add(mb);

              mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-up.png");
              mb.addListener("execute", function(ev) {
                  var ind = this.getSelectedRowIndex();
                  this.moveRowByIndex(ind, -1, true);
              }, this);
              this.__active_on_item.push(mb);
              mainPart.add(mb);

              mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-down.png");
              mb.addListener("execute", function(ev) {
                  var ind = this.getSelectedRowIndex();
                  this.moveRowByIndex(ind, 1, true);
              }, this);
              this.__active_on_item.push(mb);
              mainPart.add(mb);

              return toolbar;
          },

          //overriden
          _createTable : function(tm) {
              var table = new sm.table.Table(tm, tm.getCustom());
              table.set({showCellFocusIndicator : false,
                    statusBarVisible : false,
                    focusCellOnMouseMove : false});

              var smodel = table.getSelectionModel();
              smodel.addListener("changeSelection", function(ev) {
                  var scount = smodel.getSelectedCount();
                  for (var i = 0; i < this.__active_on_item.length; ++i) {
                      var item = this.__active_on_item[i];
                      item.setEnabled(scount > 0);
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

          ///////////////////////////////////////////////////////////////////////////
          //                            StringForm stuff                           //
          ///////////////////////////////////////////////////////////////////////////


          // overridden
          setValue : function(value) {
              if (value == null) {
                  value = [];
              }
              if (!qx.lang.Type.isArray(value)) {
                  qx.log.Logger.error(this, "Value is not array ", value);
                  value = [];
              }
              var tdata = [];
              for (var i = 0; i < value.length; ++i) {
                  var name = value[i]["name"];
                  var link = value[i]["link"];
                  if (name == null || link == null) {
                      continue;
                  }
                  var rdata = [name, link];
                  rdata.rowData = value[i];
                  tdata.push(rdata);
              }
              var tm = this.getTableModel();
              tm.setData(tdata);
              this.fireDataEvent("changeValue", value);
          },

          // overridden
          resetValue : function() {
              this.setValue([]);
          },

          // overridden
          getValue : function() {
              var obj = [];
              var tdata = this.getTableModel().getData();
              for (var i = 0; i < tdata.length; ++i) {
                  obj.push(tdata[i].rowData);
              }
              return obj;
          }
      },

      destruct : function() {
          this.__active_on_item = this.__options = null;
      }
  });

