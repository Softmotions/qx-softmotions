/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.Application", {
      extend : qx.application.Standalone,
      include : [qx.locale.MTranslation],

      statics :
      {
          "INSTANCE" : null,
          "APP_STATE" : null,
          "ACT" : null,


          __CONFIRM : null,
          __ALERT : null,

          ///////////////////////////////////////////////////////////
          //                         Alerts
          ///////////////////////////////////////////////////////////
          confirm : function(message, callback, context) {
              if (this.__CONFIRM == null) {
                  var root = qx.core.Init.getApplication().getRoot();
                  this.__CONFIRM = new dialog.Confirm({
                        "blockerOpacity" : root.getBlockerOpacity(),
                        "blockerColor" : root.getBlockerColor() || "transparent",
                        "yesButtonLabel" : root.tr("Да"),
                        "noButtonLabel" : root.tr("Нет")
                    });
              }
              this.__CONFIRM.set({ "message"     : message,
                    "callback"    : callback || null,
                    "context"     : context || null}).show();
          },

          alert : function(message, callback, context) {
              if (this.__ALERT == null) {
                  var root = qx.core.Init.getApplication().getRoot();
                  this.__ALERT = new dialog.Alert({
                        "blockerOpacity" : root.getBlockerOpacity(),
                        "blockerColor" : root.getBlockerColor() || "transparent"
                    });
              }
              this.__ALERT.set({ "message"     : message,
                    "callback"    : callback || null,
                    "context"     : context || null}).show();
          },

          getComponent : function(name) {
              var val = sm.cms.Application.INSTANCE.__components[name];
              if (!val) {
                  throw new Error("Unknown component: '" + name + "'");
              }
              return val;
          },

          registerComponent : function(name, component) {
              var val = sm.cms.Application.INSTANCE.__components[name];
              if (val) {
                  throw new Error("Component with name: " + name + " already registered");
              }
              sm.cms.Application.INSTANCE.__components[name] = component;
          },

          userHasRole : function(role) {
              return sm.cms.Application.APP_STATE.userHasRole(role);
          },

          userInRoles : function(roles) {
              return sm.cms.Application.APP_STATE.userInRoles(roles);
          }
      },

      events :
      {

          /**
           * Fired when main gui widget created and attached
           */
          "guiInitialized" : "qx.event.type.Event"
      },

      members :
      {

          /**
           * Refs to gui components
           */
          __components : null,

          __nav : null,

          __rightSideStack : null,

          main : function() {

              // Call super class
              this.base(arguments);

              this.__components = {};
              sm.cms.Application.INSTANCE = this;

              // Enable logging in debug variant
              if (qx.core.Environment.get("sm.cms.debug") == true) {
                  // support native logging capabilities, e.g. Firebug for Firefox
                  qx.log.appender.Native;
                  // support additional cross-browser console. Press F7 to toggle visibility
                  qx.log.appender.Console;
              }

              this.__bootstrap();

              var layout = new qx.ui.layout.Dock().set({separatorY : "separator-vertical"});
              var comp = new qx.ui.container.Composite(layout);
              this.getRoot().add(comp, {edge : 0});

              var hsp = new qx.ui.splitpane.Pane();
              comp.add(hsp);

              //Nav
              var nav = this.__nav = new sm.cms.nav.NavResources();
              nav.setContextMenuHandler(this.__navTreeCtxMenuHandler, this);

              //Init nav panel after starting
              sm.cms.Application.INSTANCE.addListenerOnce("guiInitialized", function(ev) {
                  nav.init();
              }, this);

              //Right side
              var right = new qx.ui.container.Composite(new qx.ui.layout.Grow());

              var rStack = this.__rightSideStack = new sm.ui.cont.LazyStack();
              right.add(rStack);

              var editPageHandler = function(ev) {
                  var pid = ev.getData()[0];
                  //Мы на странице.
                  var pedit = rStack.getWidget("pageEditor", true);
                  qx.core.Assert.assertInstance(pedit, sm.cms.editor.PageEditor);
                  var pinfo = rStack.getWidget("pageInfo");
                  if (pinfo) {
                      pinfo.setEditEnabled(false);
                  }
                  pedit.setPage(pid, null, function() {
                      rStack.showWidget("pageEditor");
                  });
              };


              var selectPageHandler = function(ev) {
                  var pid = ev.getData()[0];
                  //Мы на странице.
                  var pinfo = rStack.getWidget("pageInfo", true);
                  qx.core.Assert.assertInstance(pinfo, sm.cms.page.PageInfo);
                  pinfo.setPage(pid);
                  rStack.showWidget("pageInfo");
              };

              var savePageHandler = function(ev) {
                  this.__nav._updateSelectedNodes();
              };

              var selectMediaHandler = function(ev) {
                  var mid = ev.getData()[0];
                  //Мы на странице.
                  var minfo = rStack.getWidget("mediaInfo", true);
                  qx.core.Assert.assertInstance(minfo, sm.cms.media.MediaInfo);
                  minfo.setMedia(mid);
                  rStack.showWidget("mediaInfo");
              };

              var selectNewsHandler = function(ev) {
                  var npanel = rStack.getWidget("newsPanel", true);
                  qx.core.Assert.assertInstance(npanel, sm.cms.news.NewsPanel);
                  rStack.showWidget("newsPanel");
              };

              var selectBannerHandler = function(ev) {
                  var btype = ev.getData()[0];
                  var bedit = rStack.getWidget("bannersEditor", true);
                  qx.core.Assert.assertInstance(bedit, sm.cms.banners.BannersEditor);
                  bedit.setBanner(btype);
                  rStack.showWidget("bannersEditor");
              };

              var selectUsersHandler = function(ev) {
                  rStack.showWidget("usersPanel");
              };

              var selectOtherHandler = function(ev) {
                  var ref = ev.getData()[0];
                  //todo implement other cats handling
                  rStack.showWidget("root");
              };

              rStack.registerWidget("root", function() {
                  return new qx.ui.core.Widget();
              });
              rStack.registerWidget("pageEditor", function() {
                  var pageEditor = new sm.cms.editor.PageEditor();
                  pageEditor.addListener("pageSaved", savePageHandler, this);
                  return pageEditor;
              }, null, this);
              rStack.registerWidget("pageInfo", function() {
                  var pinfo = new sm.cms.page.PageInfo();
                  pinfo.addListener("editPage", editPageHandler, this);
                  return pinfo;
              }, null, this);
              rStack.registerWidget("mediaInfo", function() {
                  return new sm.cms.media.MediaInfo();
              }, null, this);
              rStack.registerWidget("newsPanel", function() {
                  return new sm.cms.news.NewsPanel();
              }, null, this);
              rStack.registerWidget("bannersEditor", function() {
                  return new sm.cms.banners.BannersEditor();
              }, null, this);
              rStack.registerWidget("usersPanel", function() {
                  return new sm.cms.users.UsersPanel();
              }, null, this);

              nav.addListener("selectPage", selectPageHandler, this);
              nav.addListener("selectMedia", selectMediaHandler, this);
              nav.addListener("selectNews", selectNewsHandler, this);
              nav.addListener("selectBanner", selectBannerHandler, this);
              nav.addListener("selectUsers", selectUsersHandler, this);
              nav.addListener("selectOther", selectOtherHandler, this);

              nav.setWidth(250);
              hsp.add(nav, 0);
              hsp.add(right, 1);
              sm.cms.Application.registerComponent("nav-resources", nav);

              //Init completed
              this.fireEvent("guiInitialized");
          },

          __navTreeCtxMenuHandler : function(col, row, table, dataModel, contextMenu) {
              var node = dataModel.getNodeFromRow(row);
              var nData = node.$$data;
              if (!nData) {
                  return;
              }
              var bt;
              var me = this;
              var res = false;

              //Разделы сайта
              if (nData.indexOf("pages.") == 0) {
                  if (sm.cms.Application.userHasRole("structure.admin")) {

                      if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) {
                          bt = new qx.ui.menu.Button(this.tr("Создать страницу"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._newPageDld(ev, node);
                          }, this);
                          contextMenu.add(bt);

                          bt = new qx.ui.menu.Button(this.tr("Создать раздел"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._newCatDlg(ev, node);
                          }, this);
                          contextMenu.add(bt);
                      }

                      if (nData != "pages.root") {
                          bt = new qx.ui.menu.Button(this.tr("Переименовать"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._renameNodeDld(ev, node, function(removed) {
                                  if (removed) {
                                      me.__rightSideStack.showWidget("root");
                                  }
                              });

                          }, this);
                          contextMenu.add(bt);

                          bt = new qx.ui.menu.Button(this.tr("Удалить"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._rmNavItem(ev, node, function(removed) {
                                  if (removed) {
                                      me.__rightSideStack.showWidget("root");
                                  }
                              });

                          }, this);
                          contextMenu.add(bt);
                      }
                      res = true;
                  }
              }
              //Разделы медиа
              if (nData.indexOf("media.") == 0) {
                  if (sm.cms.Application.userInRoles(["admin", "config.admin", "media.admin"])) {

                      if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) {
                          bt = new qx.ui.menu.Button(this.tr("Добавить ресурсы"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._newMediaDld(ev, node);
                          }, this);
                          contextMenu.add(bt);

                          bt = new qx.ui.menu.Button(this.tr("Создать раздел"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._newCatDlg(ev, node);
                          }, this);
                          contextMenu.add(bt);
                      }

                      if (nData != "media.root") {
                          bt = new qx.ui.menu.Button(this.tr("Переименовать"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._renameNodeDld(ev, node, function(removed) {
                                  if (removed) {
                                      me.__rightSideStack.showWidget("root");
                                  }
                              });

                          }, this);
                          contextMenu.add(bt);

                          bt = new qx.ui.menu.Button(this.tr("Удалить"));
                          bt.addListener("execute", function(ev) {
                              this.__nav._rmMediaItem(ev, node, function(removed) {
                                  if (removed) {
                                      me.__rightSideStack.showWidget("root");
                                  }
                              });

                          }, this);
                          contextMenu.add(bt);
                      }
                      res = true;
                  }
              }
              return res;
          },

          __bootstrap : function() {
              sm.cms.Application.APP_STATE = new sm.app.AppState(sm.cms.Application.ACT.getUrl("app.state"));
          }
      },

      defer : function(statics) {
          //Class modulations
          qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);

          if (statics.ACT == null) {
              statics.ACT = new sm.cms.Actions();
          }
      }
  });
