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
                  published : !!page["published"]
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


              var breadcrumbs = [];
              ctx["breadcrumbs"] = breadcrumbs;
              var newsbc = {
                  name : this.tr("Новости"),
                  link : news_root || "",
                  published : !!news_root
              };
              if (page.refpage && page.refpage.oid) {
                  newsbc.link = newsbc.link + "?refpage=" + page.refpage.oid;
              }
              breadcrumbs.push(newsbc);

              var df = sm.cms.util.DateTimeHelper.DDMMYYYY_FMT;

              ctx["last_breadcrumb"] = {
                  name : page["category"] ? page["category"] : "",
                  published : false,
                  date : page["mdate"] ? df.format(new Date(parseInt(page["mdate"]))) : null
              };

              ctx();
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });

