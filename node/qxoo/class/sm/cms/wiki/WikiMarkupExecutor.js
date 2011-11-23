/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.wiki.WikiMarkupExecutor", {
    extend  : qx.core.Object,

    members :
    {
        /**
         * Generate html code based on markup
         */
        __wiki : function(req, resp, ctx) {
            var html = ctx["html"] || "";
            var registry = sm.cms.page.AliasRegistry.getInstance();
            var re = /href="(?:http:\/\/[\w.]+)?\/exp\/p([0-9a-f]{24})"/g;
            function searchNext() {
                var res = re.exec(html);
                if (res) {
                    // replace and continue
                    registry.findAliasByPage(res[1], function(alias) {
                        var before = html.slice(0, res.index);
                        var after = html.slice(res.index + res[0].length);
                        var replace = 'href="/exp/' + alias + '"';
                        html = before + replace + after;
                        re.lastIndex += replace.length - res[0].length;
                        searchNext();
                    });
                } else {
                    resp.end(html);
                    ctx({"terminated" : true});
                }
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