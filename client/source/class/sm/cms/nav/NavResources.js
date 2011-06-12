/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/*
 #asset(sm/cms/icon/16/nav/page-folder.png)
 */
qx.Class.define("sm.cms.nav.NavResources", {
      extend : qx.ui.container.Composite,
      include : [qx.ui.treevirtual.MNode, qx.ui.treevirtual.MFamily],

      statics : {
          BRANCH_PAGE_ICON : "sm/cms/icon/16/nav/page-folder.png"
      },

      events :
      {

          /**
           * Fired if page containing content was selected
           * data: [pageId, node, asm]
           */
          selectPage : "qx.event.type.Data",

          /**
           * Fired if page containing content was selected
           * data: [mediaId, node]
           */
          selectMedia : "qx.event.type.Data",

          /**
           * Fired if news category selected
           * data: [newscatId, node]
           */
          selectNews : "qx.event.type.Data",

          /**
           * Fired if banner selected
           * data: [bannerType, node]
           */
          selectBanner : "qx.event.type.Data",

          /**
           * Fired if users management was se
           * data: [nodeId, node]
           */
          "selectUsers" : "qx.event.type.Data",

          /**
           * Fired if other nodes selected
           * data: [itemId, node]
           */
          selectOther : "qx.event.type.Data"
      },

      properties :
      {

          navMode : {
              check : ["all", "pages", "media"],
              nullable : true
          }
      },

      construct : function(treeCaption, navMode) {
          this.base(arguments);
          this.setLayout(new qx.ui.layout.VBox());

          if (navMode != null) {
              this.setNavMode(navMode);
          }

          this.__navTree = new qx.ui.treevirtual.TreeVirtual(treeCaption != null ? treeCaption : this.tr("Меню навигации"));
          this.__navTree.setUseTreeLines(false);
          this.__navTree.setExcludeFirstLevelTreeLines(true);
          this.__navTree.setAlwaysShowOpenCloseSymbol(true);
          this.__navTree.setStatusBarVisible(false);
          this.__navTree.setFocusCellOnMouseMove(false);
          this.__navTree.setSelectionMode(qx.ui.treevirtual.TreeVirtual.SelectionMode.SINGLE);


          this.__navTree.addListener("treeOpenWhileEmpty", function(ev) {
              var node = ev.getData();
              this.__loadLevel(node);
          }, this);


          this.__navTree.addListener("treeOpenWithContent", function(ev) {
              var node = ev.getData();
              this.__loadLevel(node);
          }, this);

          this.add(this.__navTree, {flex : 1});

          this.__navTree.addListener("changeSelection", function(ev) {
              var edata = ev.getData();
              if (edata.length == 0) {
                  return;
              }
              var snode = edata[0];
              var nRef = snode.$$data;
              if (!nRef) {
                  return;
              }
              if (nRef.indexOf("pages.") == 0 && nRef != "pages.root") {
                  var pid = nRef.substring("pages.".length);
                  this.fireDataEvent("selectPage", [pid, snode, snode.$$asm]);
              } else if (nRef.indexOf("media.") == 0 && nRef != "media.root") {
                  var mid = nRef.substring("media.".length);
                  this.fireDataEvent("selectMedia", [mid, snode]);
              } else if (nRef.indexOf("news.") == 0) {
                  var catId = nRef.substring("news.".length);
                  this.fireDataEvent("selectNews", [catId, snode]);
              } else if (nRef.indexOf("config.banners.") == 0) {
                  var btype = nRef.substring("config.banners.".length);
                  this.fireDataEvent("selectBanner", [btype, snode]);
              } else if (nRef.indexOf("users.") == 0) {
                  var id = nRef.substring("users.".length);
                  this.fireDataEvent("selectUsers", [id, snode]);
              } else {
                  this.fireDataEvent("selectOther", [nRef, snode]);
              }
          }, this);

      },

      members :
      {
          __navTree : null,

          getHierarchy : function(node) {
              return this.__navTree.getHierarchy(node);
          },

          setContextMenuHandler : function(handler, context) {
              this.__navTree.setContextMenuHandler(0, handler, context);
          },

          getTableModel : function() {
              return this.__navTree.getTableModel();
          },

          init : function(ensureOpened) {
              //todo use ensureOpened
              this.__loadLevel();
          },

          __loadLevel : function(node, cb) {
              var dm = this.__navTree.getDataModel();
              var nodeId = null;
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.resources"), "GET", "application/json");
              if (this.getNavMode() != null) {
                  req.setParameter("navMode", this.getNavMode());
              }
              if (node != null) {
                  nodeId = node.nodeId;
                  req.setParameter("parent", node.$$data);
                  dm.prune(nodeId, false);
              }
              req.send(function(resp) {
                  var openArr = [];
                  var navs = resp.getContent();
                  for (var i = 0; i < navs.length; ++i) {
                      var n = navs[i];
                      var icon = n.asm != null ? sm.cms.nav.NavResources.BRANCH_PAGE_ICON : null;
                      var nid = !n.cont ? dm.addLeaf(nodeId, n.label) : dm.addBranch(nodeId, n.label, false, !n.cont, icon, icon);
                      if (n.cont && n.opened) {
                          openArr.push(nid);
                      }
                      var node = dm.getData()[nid];
                      node.$$data = n.id;
                      if (n.asm != null) {
                          node.$$asm = n.asm;
                      }
                  }
                  dm.setData();
                  for (var i = 0; i < openArr.length; ++i) {
                      this.nodeSetOpened(openArr[i], true)
                  }
                  if (cb) {
                      cb();
                  }
              }, this);
          },

          /**
           * Открывает диалог создания подкатегории
           * @param pnode Родительская нода
           */
          _newCatDlg : function(ev, pnode) {
              var d = new sm.cms.nav.NewCategoryDlg(pnode);
              d.setPosition("bottom-right");
              d.addListener("completed", function(ev) {
                  d.hide();
                  this.__newNavItemCompleted(pnode);
              }, this);
              d.placeToWidget(ev.getTarget(), false);
              d.show();
          },

          /**
           * Открывает диалог создания страницы
           * @param pnode Родительская нода
           */
          _newPageDld : function(ev, pnode) {
              var d = new sm.cms.nav.NewPageDlg(pnode);
              d.setPosition("bottom-right");
              d.addListener("completed", function(ev) {
                  d.hide();
                  this.__newNavItemCompleted(pnode);
              }, this);
              d.placeToWidget(ev.getTarget(), false);
              d.show();
          },

          /**
           * Открывает диалог добавления медиа ресурса
           * @param pnode Родительская нода
           */
          _newMediaDld : function(ev, pnode) {
              var d = new sm.cms.nav.NewMediaDlg(pnode);
              d.addListener("completed", function(ev) {
                  d.hide();
                  this.__newNavItemCompleted(pnode);
              }, this);
              d.open();
          },

          /**
           * Открывает диалог переименования ноды навигации
           * @param pnode Текущая нода
           */
          _renameNodeDld : function(ev, pnode) {
              var d = new sm.cms.nav.RenameNavDlg(pnode);
              d.setPosition("bottom-right");
              d.addListener("completed", function(ev) {
                  d.hide();
                  // после удачного переименования ноды необходимо получить с сервера текущее её состояние
                  // и обновить в дереве (не трогая всё остальное дерево)
                  var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.resource"), "GET", "application/json");
                  req.setParameter("ref", pnode.$$data);
                  req.send(function(resp) {
                      var node = resp.getContent();
                      pnode.label = node.label;
                      this.__navTree.getDataModel().setData();
                  }, this);
              }, this);
              d.placeToWidget(ev.getTarget(), false);
              d.show();
          },


          /**
           * Update all selected nodes
           */
          _updateSelectedNodes : function() {
              var snodes = this.__navTree.getSelectedNodes();
              for (var i = 0; i < snodes.length; ++i) {
                  this._updateNode(snodes[i]);
              }
          },

          /**
           * Update node state (label and icon)
           * @param nnode Navigation node
           */
          _updateNode : function(nnode) {
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.resource"), "GET", "application/json");
              req.setParameter("ref", nnode.$$data);
              req.send(function(resp) {
                  var node = resp.getContent();
                  nnode.label = node.label;
                  if (node.cont) {
                      nnode.icon = node.asm != null ? sm.cms.nav.NavResources.BRANCH_PAGE_ICON : null;
                      nnode.iconSelected = node.asm != null ? sm.cms.nav.NavResources.BRANCH_PAGE_ICON : null;
                  }
                  this.__navTree.getDataModel().setData();
              }, this);
          },

          __newNavItemCompleted : function(pnode) {
              if (pnode != null && pnode.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH && !pnode.bOpened) {
                  this.nodeSetOpened(pnode, true)
              } else {
                  this.__loadLevel(pnode);
              }
              this.__navTree.focus();
          },

          /**
           * Удаление категории или страницы
           */
          _rmNavItem : function(ev, node, cb) {
              if (!node || node.nodeId == null) {
                  if (cb) {
                      cb(false);
                  }
                  return;
              }
              var msg = (this.tr("Вы действительно хотите удалить").toString() + " ");
              if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) {
                  msg += this.tr("раздел").toString();
              } else {
                  msg += this.tr("страницу").toString();
              }
              msg += (" '" + this.nodeGetLabel(node) + "'?");
              sm.cms.Application.confirm(msg, function(result) {
                  if (!result) {
                      if (cb) {
                          cb(false);
                      }
                      return;
                  }
                  var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.rmnode"), "GET", "application/json");
                  req.setParameter("ref", node.$$data);
                  req.send(function(resp) {
                      var dm = this.__navTree.getDataModel();
                      dm.prune(node.nodeId, true);
                      dm.setData();
                  }, this);
                  req.addListener("finished", function() {
                      if (cb) {
                          cb(true);
                      }
                  });
              }, this);
          },

          /**
           * Удаление категории или страницы
           */
          _rmMediaItem : function(ev, node, cb) {
              if (!node || node.nodeId == null) {
                  if (cb) {
                      cb(false);
                  }
                  return;
              }
              var url;
              var msg = (this.tr("Вы действительно хотите удалить").toString() + " ");
              if (node.type == qx.ui.treevirtual.MTreePrimitive.Type.BRANCH) {
                  url = sm.cms.Application.ACT.getUrl("nav.rmnode");
                  msg += this.tr("раздел").toString();
              } else {
                  url = sm.cms.Application.ACT.getUrl("medialib.remove");
                  msg += this.tr("страницу").toString();
              }
              msg += (" '" + this.nodeGetLabel(node) + "'?");
              sm.cms.Application.confirm(msg, function(result) {
                  if (!result) {
                      if (cb) {
                          cb(false);
                      }
                      return;
                  }
                  var req = new sm.io.Request(url, "GET", "application/json");
                  req.setParameter("ref", node.$$data);
                  req.send(function(resp) {
                      var dm = this.__navTree.getDataModel();
                      dm.prune(node.nodeId, true);
                      dm.setData();
                  }, this);
                  req.addListener("finished", function() {
                      if (cb) {
                          cb(true);
                      }
                  });
              }, this);
          }
      },

      destruct : function() {
          this._disposeObjects("__navTree");
      }
  });