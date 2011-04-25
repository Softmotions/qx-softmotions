/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.nsrv.test.TestSecurityExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    construct : function() {
        this.base(arguments);
    },

    members :
    {
        __content : function(req, resp, ctx) {
            this.writeString("content", resp, ctx);
        }
    },

    handlers :
    {
        "/secured" : {
            webapp : "testsecurity",
            handler : "__content",
            secured: true
        },

        "/unsecured" : {
            webapp : "testsecurity",
            handler : "__content"
        }
    },

    destruct : function() {
    }
});