/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Управляем параметрами соединений с Server Side
 * для production и тестинг окружений
 */

qx.Class.define("sm.conn.Actions", {
    extend  : qx.core.Object,

    members :
    {
        __actions : null,

        _addAction : function(name, url) {
            this.__actions[name] = {
                url : url
            };
        },

        getUrl : function(name, varagrs) {
            var act = this.__actions[name];
            if (!act) {
                throw new Error("Action group: '" + name + "' not found");
            }
            if (varagrs) {
                var sb = new qx.util.StringBuilder();
                sb.add(act.url);
                for (var i = 1; i < arguments.length; i += 2) {
                    sb.add(i > 1 ? "&" : "?");
                    sb.add(encodeURIComponent(arguments[i]));
                    sb.add("=");
                    sb.add(encodeURIComponent(arguments[i + 1]));
                }
                return sb.join("");
            } else {
                return act.url;
            }
        },

        prepareRequest : function(name, params, handler, method, resptype) {
            if (method == null) {
                method = "GET";
            }
            if (resptype == null) {
                resptype = "text/plain";
            }
            var url = this.getUrl(name);
            var req = new sm.io.Request(url, method, resptype);
            if (params) {
                for (var p in params) {
                    var v = params[p];
                    if (v != null && v != undefined) {
                        req.setParameter(p, v);
                    }
                }
            }
            if (handler) {
                req.addListener("completed", handler, handler);
            }
            return req;
        },

        sendRequest : function(name, params, handler, method, resptype) {
            return this.prepareRequest(name, params, handler, method, resptype).send();
        }
    },

    construct : function() {
        this.base(arguments);
        this.__actions = {};
    }
});