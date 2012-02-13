/*
 * Copyright (c) 2012. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.AliasRegistry", {
    extend  : qx.core.Object,
    type : "singleton",

    construct: function() {
        var mlen = sm.app.Env.getDefaultConfig()["aliasesCacheSize"];
        if (isNaN(mlen) || mlen <= 0) {
            mlen = 1024;
        }
        var LRUCache = $$node.require("lru-cache");
        this.__a2pageCache = new LRUCache(mlen);
        this.__p2aliasCache = new LRUCache(mlen);
    },

    members : {

        /**
         * Alias -> pages LRU cache
         */
        __a2pageCache : null,

        /**
         * Page -> alias LRU cache
         */
        __p2aliasCache : null,


        __aliasForPage : function(doc) {
            return (doc != null && doc.alias != null) ? doc.alias : null;
        },

        __onPageSaved : function(doc) {
            this.invalidateForPage(doc);
        },

        findAliasByPage : function(pageId, cb) {
            var me = this;
            var alias = this.__p2aliasCache.get(pageId);
            if (alias !== undefined) {
                cb(null, alias);
                return;
            }
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"_id" : coll.toObjectID(pageId)}, {"fields" : {"alias" : 1}}, function(err, doc) {
                if (err) {
                    cb(err);
                    return;
                }
                alias = me.__aliasForPage(doc);
                me.__p2aliasCache.set(pageId, alias);
                cb(null, alias);
            });
        },

        findPageByAlias : function(alias, cb) {
            var me = this;
            if (alias === "-") {
                cb(null, null);
                return;
            }
            var pid = this.__a2pageCache.get(alias);
            if (pid !== undefined) {
                cb(null, pid);
                return;
            }
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"alias" : alias}, {"fields" : {"_id" : 1}}, function(err, doc) {
                if (err) {
                    cb(err);
                    return;
                }
                var pid = doc ? doc._id.toString() : null;
                me.__a2pageCache.set(alias, pid);
                cb(null, pid);
            });
        },

        invalidateFor : function(pid, alias) {
            if (alias != null) {
                this.__a2pageCache.del(alias);
            }
            if (pid != null) {
                this.__p2aliasCache.del(pid.toString());
            }
        },

        invalidateForPage : function(doc) {
            this.invalidateFor(doc._id, doc.alias);
        },

        invalidate : function() {
            this.__a2pageCache.reset();
            this.__p2aliasCache.reset();
        }
    },

    defer : function(statics) {
        var ee = sm.cms.Events.getInstance();
        ee.addListener("pageSaved", function(ev) {
            sm.cms.page.AliasRegistry.getInstance().__onPageSaved(ev.getData());
        });
    }
});