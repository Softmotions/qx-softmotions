/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * News management
 */
qx.Class.define("sm.cms.news.ManageNewsExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

      members :
      {
          /**
           * Создание новой страницы новости
           */
          __news_new : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["name"]) || !qx.lang.Type.isString(req.params["refpage"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var me = this;
              var nmgr = sm.cms.page.PageMgr;
              nmgr.isPageActionAllowed("news", req.params["refpage"], req, function(err, granted) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (!granted) {
                      me.handleError(resp, ctx,
                        me.tr("У вас недостаточно прав для создания новостей в данном разделе"),
                        false, true);
                      return;
                  }
                  var coll = nmgr.getColl();
                  var node = nmgr.buildNewsNode({name : req.params["name"],
                        "refpage" : req.params["refpage"]});
                  coll.save(node, function(err, doc) {
                      if (err) {
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      me.writeJSONObject(doc, resp, ctx);
                  });
              });
          },


          /**
           * Result:
           * <code>
           *       [
           *         [_id, name],
           *         [_id, name]
           *         ...
           *       ]
           * </code>
           */
          __news_roots : function(req, resp, ctx) {

              var uid = req.getUserId();
              if (uid == null) {
                  this.handleError(resp, ctx, "User must be authenticated");
                  return;
              }
              var me = this;
              var pmgr = sm.cms.page.PageMgr;
              var umgr = sm.cms.user.UsersMgr;
              var mongo = sm.app.Env.getDefault().getMongo();

              var finish = function(roots) {
                  me.writeJSONObject(roots, resp, ctx);
              };

              umgr.userProperty(uid, "news_roots", function(err, roots) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (roots == null || roots.length == 0) {
                      finish([]);
                      return;
                  }
                  for (var i = 0; i < roots.length; ++i) {
                      roots[i] = mongo.toObjectID(roots[i]);
                  }
                  var aq = null;
                  if (req.isUserInRoles(["admin", ["news.admin"]])) { //admin user
                      aq = pmgr.getColl().createQuery();
                  } else { //casual user, needs to check access
                      aq = pmgr.getAcessPagesQuery(uid, "news");
                  }
                  aq.updateQuery({"_id" : {"$in" : roots}});
                  aq.updateOptions({"fields" : {"_id" : 1, "name" : 1}});
                  var aroots = [];
                  aq.each(
                    function(index, doc) {
                        aroots.push([doc["_id"], doc["name"]]);
                    }).exec(function(err) {
                        if (err) {
                            me.handleError(resp, ctx, err);
                            return;
                        }
                        finish(aroots);
                    });
              });
          },


          /**
           * Result:
           *   [array of updated news roots]
           *
           */
          __news_roots_manage : function(req, resp, ctx) {

              var uid = req.getUserId();
              if (uid == null) {
                  this.handleError(resp, ctx, "User must be authenticated");
                  return;
              }

              var me = this;
              var umgr = sm.cms.user.UsersMgr;
              var pmgr = sm.cms.page.PageMgr;
              var action = req.params["action"];
              var root = req.params["ref"];
              if (sm.lang.String.isEmpty(action) || sm.lang.String.isEmpty(root)) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              umgr.userProperty(uid, "news_roots", function(err, roots) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (!qx.lang.Type.isArray(roots)) {
                      roots = [];
                  }

                  var finish = function() {
                      umgr.updateUserProperty(uid, "news_roots", roots, function(err) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          me.writeJSONObject(roots, resp, ctx);
                      });
                  };

                  if (action == "remove") {
                      qx.lang.Array.remove(roots, root);
                      finish();
                  } else if (action == "add") {
                      pmgr.isPageActionAllowed("news", root, req, function(err, granted) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          if (!granted) {
                              me.handleError(resp, ctx,
                                me.tr("У вас недостаточно прав для управления новостями в данном разделе"),
                                false, true);
                              return;
                          }
                          if (roots.indexOf(root) == -1) {
                              roots.unshift(root);
                          }
                          finish();
                      });
                  }
              });
          }
      },

      handlers :
      {
          //New news page
          "/news/new" : {
              webapp : "adm",
              handler : "__news_new"
          },

          //News roots available to the user
          "/news/roots" : {
              webapp : "adm",
              handler : "__news_roots"
          },

          //Manage news roots
          "/news/roots/manage" : {
              webapp : "adm",
              handler : "__news_roots_manage"
          }
      }

  });

