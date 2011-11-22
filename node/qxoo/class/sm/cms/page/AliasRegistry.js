/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.cms.page.AliasRegistry", {
    extend  : qx.core.Object,
    type : "singleton",

    construct: function() {
        var size = sm.app.Env.getDefaultConfig()["aliasesCacheSize"];
        if (isNaN(size)) {
            size = 1024;
        }
        var LRUCache = $$node.require("lru-cache");
        this.__cacheABP = new LRUCache(size);
        this.__cachePBA = new LRUCache(size);
    },

    members : {

        __cacheABP : null,
        __cachePBA : null,

        findAliasByPage : function(pageId, cb) {
            var me = this;
            var result = this.__cacheABP.get(pageId);
            if (result === undefined) {
                sm.cms.page.PageMgr.fetchNodeById(pageId, function(err, document) {
                    if (err) {
                        qx.log.Logger.error(me, "find alias by page", err);
                        cb(pageId);
                    } else {
                        document = document || {};
                        var attrs = document.attrs || {};
                        var alias = attrs.alias || {};
                        var value = alias.value || pageId;
                        me.__cacheABP.set(pageId, value);
                        cb(value);
                    }
                });
            } else {
                cb(result);
            }
        },

        findPageByAlias : function(alias, cb) {
            var me = this;
            var result = this.__cachePBA.get(alias);
            if (result === undefined) {
                var coll = sm.cms.page.PageMgr.getColl();
                coll.findOne({"attrs.alias.value":alias}, function(err, document) {
                    if (err) {
                        qx.log.Logger.error(me, "find page by alias", err);
                        cb(null);
                    } else if (document) {
                        var id = document._id.toString();
                        me.__cachePBA.set(alias, id);
                        cb(id);
                    } else {
                        cb(null);
                    }
                });
            } else {
                cb(result);
            }
        }
    }
});