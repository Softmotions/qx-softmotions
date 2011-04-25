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

        "/roles/a": {
            webapp : "testsecurity",
            handler : "__content",
            secured: true,
            roles: ["a"]
        },

        "/roles/b": {
            webapp : "testsecurity",
            handler : "__content",
            secured: true,
            roles: ["b"]
        },

        "/roles/c": {
            webapp : "testsecurity",
            handler : "__content",
            secured: true,
            roles: ["c"]
        },

        "/roles/d": {
            webapp : "testsecurity",
            handler : "__content",
            secured: true,
            roles: ["a", "b"]
        },

        "/unsecured" : {
            webapp : "testsecurity",
            handler : "__content"
        },

        "/logout" : {
            webapp : "testsecurity",
            handler : "__content",
            logout: true
        }
    },

    destruct : function() {
    }
});