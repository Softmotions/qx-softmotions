/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.news.AbstractShowNewsExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],
      type : "abstract",

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
                    doc["mdate"] = df.format(new Date(parseInt(doc["mdate"])));
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

          _in_page_news : function(req, resp, ctx) {
              var page = ctx["_page_"];
              if (!page) {
                  qx.log.Logger.warn(this, "No page in context");
                  ctx();
                  return;
              }
              this._fetch_news_list(req, resp, ctx,
                {"refpage" : page["_id"],
                    "queryOpts" : {
                        "limit" : 8
                    }});
          }

      }
  });

