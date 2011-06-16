/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.nav.EditNavigationExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

      statics :
      {
          CATEGORIES: [
              {"path": "config", "label": "Конфигурация", "mgr" : sm.cms.nav.ConfigMgr, "roles": ["config.admin"]},
              {"path": "pages", "label": "Страницы", "mgr" : sm.cms.page.PageMgr},
              {"path": "media", "label": "Медиа", "mgr" : sm.cms.media.MediaMgr, "roles" : ["config.admin", "media.admin"]}
          ]
      },

      members :
      {

          /**
           * Load navigation items
           */
          __nav : function(req, resp, ctx) {
              var me = this;
              var cats = this.self(arguments).CATEGORIES;
              var parent = req.params["parent"];

              if (!parent) {
                  var nmode = req.params["navMode"];
                  var res = [];

                  cats.forEach(function(item) {
                      if (nmode == null || nmode == "all" || nmode == item.path) {
                          if (!item.roles || req.isUserInRoles(item.roles)) {
                              res.push(item.mgr.buildRootNavItem(item.path, item.label));
                          }
                      }
                  });

                  if (nmode == null || nmode == "all") {

                      res.push({
                            "id" : "news.root",
                            "cont" : false,
                            "label" : this.tr("Новости").toString(),
                            "opened" : false
                        });

                      if (req.isUserInRoles("users.admin")) {
                          res.push({
                                "id" : "users.root",
                                "cont" : false,
                                "label" : this.tr("Пользователи").toString(),
                                "opened" : false
                            });
                      }
                  }

                  this.writeJSONObject(res, resp, ctx);
              } else {
                  //Выбрали что-то вложенное
                  var category = this.__getCategoryForNode(parent);
                  if (category != null) {
                      this.__loadLevel(category, parent.substring((category.path + ".").length), resp, ctx);
                  } else {
                      this.writeJSONObject([], resp, ctx);
                  }

              }
          },

          /**
           * Load navigation item data
           */
          __node : function(req, resp, ctx) {
              var me = this;
              var cats = this.self(arguments).CATEGORIES;
              if (!qx.lang.Type.isString(req.params["ref"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var ref = req.params["ref"];

              var res = {};
              var category = this.__getCategoryForNode(ref);
              if (category != null && category.mgr.fetchNodeById) {
                  ref = ref.substring(category.path.length + 1);
                  category.mgr.fetchNodeById(ref, function(err, doc) {
                      if (err) {
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      me.writeJSONObject(category.mgr.buildNavItem(category.path, doc), resp, ctx);
                  });
              } else {
                  this.writeJSONObject(res, resp, ctx);
              }
          },

          /**
           * Загрузка уровня в иерархии
           */
          __loadLevel : function(category, pageId, resp, ctx) {
              var res = [];
              var me = this;

              if (category.mgr.getChildNodesQuery) {
                  var q = category.mgr.getChildNodesQuery(pageId == "root" ? null : pageId);
                  q.each(
                    function(index, doc) {
                        res.push(category.mgr.buildNavItem(category.path, doc));
                    }).exec(function() {
                        me.writeJSONObject(res, resp, ctx);
                    });
              } else if (category.mgr.getChildNavItems) {
                  me.writeJSONObject(category.mgr.getChildNavItems(category.path, pageId), resp, ctx);
              } else {
                  me.writeJSONObject(res, resp, ctx);
              }
          },

          /**
           * Создание новой категории
           */
          __newcat : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["name"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              if (!qx.lang.Type.isString(req.params["parent"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var parent = req.params["parent"];
              var category = this.__getCategoryForNode(parent);
              if (category == null) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              parent = parent.substring(category.path.length + 1);//+ dot symbol
              if (parent == "root") {
                  parent = null;
              }

              var node = (category.mgr).buildCategoryNode(req.params);
              var me = this;
              (category.mgr).createNodeForParent(parent, node, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  var res = [];
                  res.push(category.mgr.buildNavItem(category.path, doc));
                  me.writeJSONObject(res, resp, ctx);
              });
          },

          /**
           * Переименование раздела или страницы
           */
          __rennode : function(req, resp, ctx) {
              if (req.params["ref"] == null) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              if (!qx.lang.Type.isString(req.params["name"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var me = this;
              var ref = req.params["ref"];
              var category = this.__getCategoryForNode(ref);
              if (category == null) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              ref = ref.substring(category.path.length + 1);//+ dot symbol

              (category.mgr).renameNode(ref,
                req.params["name"],
                function(err, status) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    me.writeJSONObject({}, resp, ctx);
                });
          },

          /**
           * Удаление элемента навигации (раздела, страницы)
           */
          __rmnode : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["ref"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var me = this;
              var ref = req.params["ref"];
              var category = this.__getCategoryForNode(ref);
              if (category == null) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              ref = ref.substring(category.path.length + 1);//+ dot symbol
              (category.mgr).rmNode(ref, function(err) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject({}, resp, ctx);
              });
          },

          /**
           * Возвращает мета-описание из sm.cms.EditNavigationExecutor.CATEGORIES[]
           * подходящее для переданной параметром node ссылки на эелемент дерева
           * @param node {String} Сссылка на элемент дерева
           */
          __getCategoryForNode : function(node) {
              var cats = this.self(arguments).CATEGORIES;
              for (var i = 0; i < cats.length; ++i) {
                  if (node.indexOf(cats[i].path + ".") == 0) {
                      return cats[i];
                  }
              }
              return null;
          }
      },

      handlers :
      {
          //Текущее дерево навигации
          "/nav" : {
              webapp : "adm",
              handler : "__nav"
          },

          //Текущая нода навигации
          "/node" : {
              webapp : "adm",
              handler : "__node"
          },

          //Новая категория в иерархии навигации
          "/newcat" : {
              webapp : "adm",
              handler : "__newcat"
          },

          //Переименование ноды навигации
          "/rennode" : {
              "webapp" : "adm",
              handler : "__rennode"
          },

          //Удаление страницы или категории
          "/rmnode" : {
              "webapp" : "adm",
              handler : "__rmnode"
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });
