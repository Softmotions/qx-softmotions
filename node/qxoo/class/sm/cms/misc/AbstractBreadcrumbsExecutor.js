/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.misc.AbstractBreadcrumbsExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],
      type : "abstract",

      members :
      {
          /**
           * Load breadcrumbs
           */
          _get_breadcrumbs : function(req, resp, ctx) {
              if (!ctx["_page_"]) {
                  ctx();
                  return;
              }

              var page = ctx["_page_"];

              if (page["type"] == sm.cms.page.PageMgr.TYPE_NEWS_PAGE) {
                  this.__build_news_breadcrumbs(req, resp, ctx, page);
              } else {
                  this.__build_page_breadcrumbs(req, resp, ctx, page);
              }
          },

          // build page breadcrumbs by his hierarchy
          __build_page_breadcrumbs : function(req, resp, ctx, page) {
              var me = this;
              var coll = sm.cms.page.PageMgr.getColl();

              var breadcrumbs = [];
              ctx["breadcrumbs"] = breadcrumbs;

              ctx["last_breadcrumb"] = {
                  name : page["name"],
                  published : !!page["published"],
                  link : page["_id"]
              };

              if (page["hierarchy"] == null) {
                  ctx();
                  return;
              }

              // hierarchy cache (items)
              var hcache = {};
              coll.createQuery({"_id" : {"$in" : page["hierarchy"]}}, {fields : {"_id" : 1, "name" : 1, "published" : 1}})
                .each(function(index, hdoc) {
                    hcache[hdoc["_id"]] = hdoc;
                })
                .exec(function(err) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    // build breadcrumb items for pages from node hierarchy
                    var hierarchy = page["hierarchy"];
                    for (var i = 0; i < hierarchy.length; ++ i) {
                        var bcitem = hcache[hierarchy[i]] || {};
                        breadcrumbs.push({
                              name : bcitem["name"] || "",
                              link : "/exp/p" + bcitem["_id"],
                              published : !!bcitem["published"]
                          });
                    }
                    ctx();
                });
          },

          // build custom breadcrumbs for news page
          __build_news_breadcrumbs : function(req, resp, ctx, page) {
              var config = sm.app.Env.getDefault().getConfig();
              var news_root = config["urls"] ? config["urls"]["news"] : null;

              var finish = function() {
                  if (page.refpage && page.refpage.oid) {
                      var me = this;
                      var pmgr = sm.cms.page.PageMgr;
                      var coll = pmgr.getColl();
                      coll.findOne({_id : coll.toObjectID(page.refpage.oid)}, {fields : {name : 1}}, function(err, doc) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          ctx["first_breadcrumb"] = {
                              name : doc["name"],
                              link : "/exp/p" + doc["_id"]
                          };
                          ctx();
                      });
                  } else {
                      ctx();
                  }
              };

              var df = sm.cms.util.DateTimeHelper.DDMMYYYY_FMT;

              var breadcrumbs = [];
              var newsbc = {
                  published : !!news_root,
                  name : this.tr("Новости"),
                  link : news_root || ""
              };

              var lastbc = {
                  published : !!news_root,
                  name : page["category"] ? page["category"] : "",
                  link : news_root || "",
                  date : page["cdate"] ? df.format(new Date(parseInt(page["cdate"]))) : null
              };

              if (news_root) {
                  if (page.refpage && page.refpage.oid) {
                      lastbc.link = newsbc.link = (newsbc.link + "?refpage=" + page.refpage.oid);
                      lastbc.link = lastbc.link + "&cats=" + encodeURIComponent(lastbc.name);
                  } else {
                      lastbc.link = lastbc.link + "?cats=" + encodeURIComponent(lastbc.name);
                  }
              }

              breadcrumbs.push(newsbc);

              ctx["breadcrumbs"] = breadcrumbs;
              ctx["last_breadcrumb"] = lastbc;

              finish();
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });

