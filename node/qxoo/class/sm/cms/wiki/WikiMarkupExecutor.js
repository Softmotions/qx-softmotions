/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.wiki.WikiMarkupExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    members :
    {
        /**
         * Generate html code based on markup
         */
        __wiki : function(req, resp, ctx) {
            var ar = sm.cms.page.AliasRegistry.getInstance();
            var ctxpath = req.info.contextPath;
            var re = new RegExp('href="(?:http:\\/\\/[\\w.]+)?\\' + qx.lang.String.escapeRegexpChars(ctxpath) + '\\/p([0-9a-f]{24})"', "g");
            var beforeIndex = 0;
            var data = ctx["html"] || "";
            var out = [];

            function searchNext() {
                beforeIndex = re.lastIndex;
                var res = re.exec(data);
                if (!res) {
                    out.push(data.slice(beforeIndex));
                    resp.end(out.join(""));
                    ctx({"terminated" : true});
                    return;
                }
                var pid = res[1];
                ar.findAliasByPage(pid, function(err, alias) {
                    out.push(data.slice(beforeIndex, res.index));
                    if (err || alias == null) {
                        alias = "p" + pid;
                    }
                    out.push('href="' + ctx + "/" + alias + '"');
                    searchNext();
                });
            }

            searchNext();
        }
    },

    handlers :
    {
        "/wiki" : {
            webapp : "exp",
            handler : "__wiki"
        }
    }
});