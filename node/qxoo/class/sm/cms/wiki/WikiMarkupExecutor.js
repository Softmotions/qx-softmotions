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
            resp.end(ctx["html"] ? ctx["html"] : "");
            ctx({"terminated" : true});
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