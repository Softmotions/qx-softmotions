/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/actions/newspaper_add.png)
 #asset(sm/cms/icon/16/actions/add.png)
 #asset(sm/cms/icon/16/actions/delete.png)
 */

/**
 * Admin frontend for the news
 */
qx.Class.define("sm.cms.news.NewsWorkspace", {
      extend  : qx.ui.container.Composite,


      events :
      {
          /**
           * Fired if user submitted new news.
           * data: [news name, refpage]
           */
          "newNews" : "qx.event.type.Data",

          /**
           * Fired if user start to edit nes
           * data: pageId
           */
          "editNews" : "qx.event.type.Data",


          /**
           * Fired if user wants to remove news
           */
          "rmNews" : "qx.event.type.Data",


          /**
           * If this panel wants to be active
           */
          "activatePanel" : "qx.event.type.Event"
      },

      construct : function() {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox(4));

          var toolbar = new qx.ui.toolbar.ToolBar();

          var mainPart = new qx.ui.toolbar.Part();
          toolbar.add(mainPart);

          var createNewsBt = this.__createNewsBt =
            new qx.ui.toolbar.Button(this.tr("Создать"), "sm/cms/icon/16/actions/newspaper_add.png").set({enabled : false});
          createNewsBt.addListener("execute", function(ev) {
              var options = {};
              var ps = this.__pageSelect;
              var pSelection = ps.getSelection();
              if (pSelection.length == 1) {
                  options["rootPage"] = {
                      "pageId" : pSelection[0].getModel(),
                      "name" : pSelection[0].getLabel()
                  }
              }
              var d = new sm.cms.news.NewNewsDlg(options);
              d.addListener("completed", function(ev) {
                  var data = ev.getData();
                  this.fireDataEvent("newNews", [data[0], data[1]]); //name, refpage
                  d.close();
              }, this);
              d.show();
          }, this);
          mainPart.add(createNewsBt);

          //List of pages to create news
          var prPart = new qx.ui.toolbar.Part();
          prPart.getChildrenContainer()._getLayout().set({alignY : "middle"}); //samll hack
          prPart.getChildrenContainer().setLayoutProperties({flex : 1}); //small hack!


          var pageSelect = this.__pageSelect = new qx.ui.form.SelectBox().set({allowGrowY : false, margin : [0, 4, 0, 4]});
          prPart.add(pageSelect, {flex : 1});

          var addPageBt = this.__addPageBt = new qx.ui.toolbar.Button(null, "sm/cms/icon/16/actions/add.png");
          addPageBt.addListener("execute", function() {
              var dlg = new sm.cms.page.PageLinkDlg({
                    oklabel : this.tr("Добавить корневую страницу для новостей"),
                    allowOuterLinks : false,
                    includeLinkName : false});
              dlg.addListener("pageSelected", function(ev) {
                  this.__manageNewsRoot(ev.getData()[0], "add", ev.getData()[1]); //pageId, pageName
                  dlg.close();
              }, this);
              dlg.open();
          }, this);
          prPart.add(addPageBt);

          var rmPageBt = this.__rmPageBt = new qx.ui.toolbar.Button(null, "sm/cms/icon/16/actions/delete.png").set({enabled : false});
          rmPageBt.addListener("execute", function() {
              var sitems = pageSelect.getSelection();
              if (sitems.length != 1) {
                  return;
              }
              this.__manageNewsRoot(sitems[0].getModel(), "remove");
          }, this);
          prPart.add(rmPageBt);

          toolbar.add(prPart, {flex : 1});
          this.add(toolbar);

          var ps = this.__pageSelector = new sm.cms.page.PageSelector().set({enabled : false});
          this.add(ps, {flex : 1});

          pageSelect.addListener("changeSelection", function(ev) {
              var sdata = ev.getData();
              if (!sdata || sdata.length == 0) {
                  rmPageBt.setEnabled(false);
                  createNewsBt.setEnabled(false);
                  ps.cleanup();
                  ps.setEnabled(false);
              } else {
                  ps.setEnabled(true);
                  rmPageBt.setEnabled(true);
                  createNewsBt.setEnabled(true);
                  ps.setConstViewSpec({
                        "type" : 2, //news type
                        "refpage" : sdata[0].getModel()});
                  this.__reloadNews();
              }
          }, this);

          //Table context menu
          var ptable = ps.getTable();
          ptable.addListener("cellDblclick", function(ev) {
              var page = ptable.getSelectedPage();
              this.fireDataEvent("editNews", page["id"]);
          }, this);


          var ccount = ptable.getTableModel().getColumnCount();
          for (var i = 0; i < ccount; ++i) {
              ptable.setContextMenuHandler(i, this.__newsCtxMenuHandler, this);
          }

          this.__loadNewsRoots();
          this.addListener("activatePanel", this.__reloadNews, this);
      },

      members :
      {
          __createNewsBt : null,

          __addPageBt : null,

          __rmPageBt : null,

          __pageSelect : null,

          __pageSelector : null,



          __newsCtxMenuHandler : function(col, row, table, dataModel, contextMenu) {
              var page = table.getSelectedPage();
              if (page == null || page["id"] == null) {
                  return false;
              }

              var renBt = new qx.ui.menu.Button(this.tr("Переименовать"));
              renBt.addListener("execute", function(ev) {
                  var d = new sm.cms.nav.RenameNavDlg({$$data: "pages." + page["id"], label: page["name"]});
                  d.setPosition("bottom-right");
                  d.addListener("completed", function(ev) {
                      d.hide();
                      this.__reloadNews();
                  }, this);
                  d.placeToWidget(ev.getTarget(), false);
                  d.show();
              }, this);
              contextMenu.add(renBt);

              var edBt = new qx.ui.menu.Button(this.tr("Редактировать"));
              edBt.addListener("execute", function() {
                  this.fireDataEvent("editNews", page["id"]);
              }, this);
              contextMenu.add(edBt);

              var rmBt = new qx.ui.menu.Button(this.tr("Удалить"));
              rmBt.addListener("execute", function() {
                  sm.cms.Application.confirm(this.tr("Вы действительно желаете удалить") + " '" + page["name"] + "'?",
                    function(res) {
                        if (!res) {
                            return;
                        }
                        var pid = page["id"];
                        var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.rmnode"), "GET", "application/json");
                        req.setParameter("ref", ("pages." + pid), false);
                        req.send(function(resp) {
                            this.__pageSelector.updateViewSpec({});
                        }, this);
                    }, this);
              }, this);
              contextMenu.add(rmBt);

              return true;
          },

          __reloadNews : function() {
              var ps = this.__pageSelector;
              ps.updateViewSpec({});
          },

          __manageNewsRoot : function(pageId, action, pageName) {
              qx.core.Assert.assertString(pageId);
              qx.core.Assert.assertInArray(action, ["add", "remove"]);
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("news.roots.manage",
                "ref", pageId,
                "action", action), "GET", "application/json");
              req.send(function(resp) {
                  var ps = this.__pageSelect;
                  var items = ps.getChildren();
                  var found = null;
                  for (var i = 0; i < items.length; ++i) {
                      if (items[i].getModel() == pageId) {
                          found = items[i];
                          break;
                      }
                  }
                  if (action == "add") {
                      if (found != null) {
                          return;
                      }
                      var litem = new qx.ui.form.ListItem(pageName, null, pageId);
                      ps.addAt(litem, 0);
                      ps.setSelection([litem]);
                  } else {
                      if (found != null) {
                          ps.remove(found);
                      }
                  }
              }, this);
          },

          /**
           * Select news roots available to the user
           */
          __loadNewsRoots : function() {
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("news.roots"), "GET", "application/json");
              req.send(function(resp) {
                  var roots = resp.getContent();
                  var ps = this.__pageSelect;
                  ps.removeAll();
                  for (var i = 0; i < roots.length; ++i) {
                      var root = roots[i];
                      var li = new qx.ui.form.ListItem(root[1], null, root[0]);
                      ps.add(li);
                  }
              }, this);
          }
      },

      destruct : function() {
          this.__pageSelector = this.__pageSelect =
            this.__addPageBt = this.__rmPageBt =
              this.__createNewsBt = null;
      }
  });

