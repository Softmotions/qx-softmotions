/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.AbstractPagesSearchExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],
    type : "abstract",

    members :
    {

        _page_search : function(req, resp, ctx, defaultPageSize) {

            var me = this;
            var pmgr = sm.cms.page.PageMgr;

            var pageIndex = req.params["pageIndex"];
            var pageSize = req.params["pageSize"];
            var type = req.params["type"];

            pageIndex = Math.max(1, pageIndex || 1);
            pageSize = Math.max(0, pageSize || defaultPageSize);

            var pages = {
                pageSize: pageSize,
                upageSize: pageSize != defaultPageSize,
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

            var qspec = {
                published : true,
                stext : req.params.stext
            };
            if (type == "pages") {
                qspec.type = [pmgr.TYPE_PAGE, pmgr.TYPE_CATEGORY];
            } else if (type == "news") {
                qspec.type = pmgr.TYPE_NEWS_PAGE;
            }


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
                    "mdate" : 1,
                    "attrs.image" : 1,
                    "attrs.name" : 1,
                    "annotation" : 1
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
                }

                ctx["pages"] = pages;
                ctx["items"] = pages.items;
                ctx();
            };

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
        }
    }
});
