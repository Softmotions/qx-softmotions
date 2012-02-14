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
            ar.fixUrls(req.info.contextPath, ctx["html"] || "", function(data) {
                resp.end(data);
                ctx({"terminated" : true});
            })
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