/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.news.AbstractShowNewsExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor, qx.locale.MTranslation],
    type : "abstract",

    statics :
    {
        ARCH_PAGE_SIZE : 20
    },


    members :
    {

        _fetch_news_list : function(req, resp, ctx, options) {

            var refpage = options["refpage"];
            qx.core.Assert.assertTrue(refpage != null);

            var pmgr = sm.cms.page.PageMgr;
            var q = null;

            try {
                q = pmgr.getPagesSearchQuery({
                    "type" : pmgr.TYPE_NEWS_PAGE,
                    "refpage" :  refpage,
                    "published" : true
                }, {
                    "name" : 1,
                    "category" : 1,
                    "annotation" : 1,
                    "mdate" : 1,
                    "cdate" : 1,
                    "attrs.image" : 1
                });
            } catch(err) {
                qx.log.Logger.error(this, err);
                me.handleError(resp, ctx, err);
                return;
            }
            if (options["queryOpts"]) {
                q.updateOptions(options["queryOpts"]);
            }

            var df = sm.cms.util.DateTimeHelper.DDMMYYYY_FMT;
            var me = this;
            var res = [];
            q.each(
              function(index, doc) {
                  if (doc["mdate"] != null) {
                      doc["mdateDate"] = new Date(parseInt(doc["mdate"]));
                      doc["mdate"] = df.format(doc["mdateDate"]);
                  }
                  if (doc["cdate"] != null) {
                      doc["cdateDate"] = new Date(parseInt(doc["cdate"]));
                      doc["cdate"] = df.format(doc["cdateDate"]);
                  }
                  res.push(doc);
              }).exec(function(err) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  ctx["news"] = res;
                  ctx();
              });
        },

        /**
         * First bunch of news attached to current page
         */
        _in_page_news : function(req, resp, ctx, limit) {

            var pageId = ctx["_page_"] ? ctx["_page_"]._id : null;
            if (pageId == null) { //try to get main
                var cfg = this.getDefaultEnv().getConfig();
                pageId = cfg.main_page;
                if (pageId == null) {
                    qx.log.Logger.warn(this, "Cannot find page to fetch news");
                    ctx();
                    return;
                }
            }
            this._fetch_news_list(req, resp, ctx,
              {"refpage" : pageId,
                  "queryOpts" : {
                      "sort" : [
                          ["sortOrder" , -1]
                      ],
                      "limit" : limit != null ? limit : 8
                  }});
        },

        /**
         * News archive page
         */
        _news_archive : function(req, resp, ctx) {

            var me = this;
            var pmgr = sm.cms.page.PageMgr;

            var pageIndex = req.params["pageIndex"];
            var pageSize = req.params["pageSize"];

            //checked categories
            var cats = req.params["cats"];
            if (typeof cats === "string" && cats != "") {
                cats = [cats];
            }
            if (cats == null || cats.constructor !== Array) {
                cats = [];
            }

            pageIndex = Math.max(1, pageIndex || 1);
            pageSize = Math.max(0, pageSize || this.self(arguments).ARCH_PAGE_SIZE);

            var pages = {
                pageSize: pageSize,
                upageSize: pageSize != this.self(arguments).ARCH_PAGE_SIZE,
                prevPage: pageSize > 0 && pageIndex > 1 ? pageIndex - 1 : null,
                prevPages: [],
                pageIndex: pageIndex,
                nextPage: null,
                nextPages: [],
                items : []
            };

            // 3 previous pages
            for (var i = Math.max(1, pageIndex - 3); i < pageIndex; ++i) {
                pages.prevPages.push(i);
            }

            var refpage = req.params["refpage"];
            if (refpage == null) { //main refpage will be used
                refpage = this.getDefaultEnv().getConfig()["main_page"];
            }

            var qspec = {
                type : pmgr.TYPE_NEWS_PAGE,
                published : true,
                refpage : refpage,
                categories : cats,
                stext : req.params.stext,
                sdate : req.params.sdate,
                edate : req.params.edate
            };

            var pageOpts = {};
            if (pageSize != 0) {
                pageOpts = {
                    skip : (pageIndex - 1) * pageSize,
                    limit : pageSize
                }
            }

            var bq = null;
            try {
                bq = pmgr.getPagesSearchQuery(qspec, {
                    "name" : 1,
                    "category" : 1,
                    "annotation" : 1,
                    "mdate" : 1,
                    "cdate" : 1,
                    "attrs.image" : 1,
                    "refpage" : 1
                });
            } catch(err) {
                me.handleError(resp, ctx, err);
                return;
            }

            var finish = function() {
                var df = sm.cms.util.DateTimeHelper.DDMMYYYY_FMT;
                for (var i = 0; i < pages.items.length; ++i) {
                    var p = pages.items[i];
                    if (p.mdate != null) {
                        try {
                            p.mdate = df.format(new Date(parseInt(p.mdate)));
                        } catch(e) {
                            qx.log.Logger.error(this, e);
                        }
                    }
                    if (p.cdate != null) {
                        try {
                            p.cdate = df.format(new Date(parseInt(p.cdate)));
                        } catch(e) {
                            qx.log.Logger.error(this, e);
                        }
                    }
                }

                ctx["hasCategory"] = function(name) {
                    return (name != null && cats.indexOf(name) != -1);
                };
                ctx["pages"] = pages;
                ctx["news"] = pages.items;


                ctx();
            };

            this._load_news_cats(refpage, function(err, cats) {

                if (err) {
                    me.handleError(resp, ctx, err);
                    return;
                }

                //Save available categories
                ctx["categories"] = cats;
                bq.count(function(err, count) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    pages.count = count;
                    pages.pages = pageSize > 0 ? Math.ceil(count / pageSize) : 1;
                    pages.nextPage = pageIndex < pages.pages ? pageIndex + 1 : null;

                    // 3 next pages
                    for (var i = pageIndex + 1; i <= pages.pages && i <= pages.pageIndex + 3; ++i) {
                        pages.nextPages.push(i);
                    }

                    bq.updateOptions(pageOpts).each(
                      function(index, doc) {
                          pages.items.push(doc);
                      }).exec(function(err) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          finish();
                      });
                });
            });
        },

        /**
         * List of available news categories for searching
         */
        _load_news_cats : function(refpage, cb) {

            var pmgr = sm.cms.page.PageMgr;
            var coll = pmgr.getColl();
            coll.distinct("category",
              refpage ? {type : pmgr.TYPE_NEWS_PAGE, refpage : coll.toDBRef(refpage)} : {type : pmgr.TYPE_NEWS_PAGE},
              function(err, vals) {
                  if (err) {
                      cb(err, null);
                      return;
                  }
                  cb(null, vals.sort());
              });
        },


        /**
         * Custom breadcrumbs for news archive page
         */
        _news_archive_breadcrumbs : function(req, resp, ctx) {
            var refpage = req.params["refpage"];
            if (sm.lang.String.isEmpty(refpage)) {
                refpage = this.getDefaultEnv().getConfig()["main_page"];
            }
            if (sm.lang.String.isEmpty(refpage)) {
                ctx();
                return;
            }
            var me = this;
            var pmgr = sm.cms.page.PageMgr;
            var coll = pmgr.getColl();
            coll.findOne({_id : coll.toObjectID(refpage)}, {fields : {name : 1}}, function(err, doc) {
                if (err) {
                    me.handleError(resp, ctx, err);
                    return;
                }
                ctx["refpage"] = doc;
                ctx();
            });
        }

    }
});

