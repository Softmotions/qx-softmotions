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
        this.__reCache = {};
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


        /**
         * Regexp cache for {@link #fixUrls}
         */
        __reCache : null,


        __aliasForPage : function(doc) {
            return (doc != null && doc.alias != null) ? doc.alias : null;
        },

        __onPageSaved : function(doc) {
            this.invalidateForPage(doc);
        },

        findAliasByPage : function(pageId, cb) {
            var me = this;
            pageId = pageId.toString();
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
            alias = alias.toString();
            if (alias === "-") {
                cb(null, null);
                alias = cb = null;
                return;
            }
            var pid = this.__a2pageCache.get(alias);
            if (pid !== undefined) {
                cb(null, pid);
                alias = cb = null;
                return;
            }
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"alias" : alias}, {"fields" : {"_id" : 1}}, function(err, doc) {
                if (err) {
                    cb(err);
                    alias = cb = null;
                    return;
                }
                var pid = doc ? doc._id.toString() : null;
                me.__a2pageCache.set(alias, pid);
                cb(null, pid);
                alias = cb = null;
            });
        },

        invalidateFor : function(pid, alias) {
            if (alias != null) {
                alias = alias.toString();
                this.__a2pageCache.del(alias);
            }
            if (pid != null) {
                pid = pid.toString();
                this.__p2aliasCache.del(pid);
            }
        },

        invalidateForPage : function(doc) {
            this.invalidateFor(doc._id, doc.alias);
        },

        invalidate : function() {
            this.__a2pageCache.reset();
            this.__p2aliasCache.reset();
        },


        fixUrls : function(ctxpath, data, cb) {
            var me = this;
            var re = this.__reCache[ctxpath];
            if (re === undefined) {
                re = new RegExp('(http:\\/\\/[\\w.]+)?' + qx.lang.String.escapeRegexpChars(ctxpath) + '\\/p([0-9a-z]{24})((#\\S*)?|(\\?\\S*))', "g");
                this.__reCache[ctxpath] = re;
            }

            re.lastIndex = 0;
            var beforeIndex = 0;
            var out = [];

            function searchNext() {
                beforeIndex = re.lastIndex;
                var res = re.exec(data);
                if (!res) {
                    if (out.length > 0) {
                        out.push(data.slice(beforeIndex));
                        cb(out.join(""));
                    } else {
                        cb(data);
                    }
                    ctxpath = data = cb = re = out = null; //dereference all
                    return;
                }

                var pid = new String(res[2]);
                var alias = me.__p2aliasCache.get(pid);
                var handleAlias = function(err, alias) {
                    out.push(data.slice(beforeIndex, res.index));
                    if (err || alias == null || alias === "-") {
                        alias = "/p" + pid;
                    }
                    out.push(
                      (res[1] ? new String(res[1]) : "") +
                        ctxpath + qx.lang.String.stripTags(alias) +
                        (res[3] ? new String(res[3]) : "")
                    );

                    searchNext();
                };
                if (alias !== undefined) {
                    handleAlias(null, alias);
                } else { //we have to make async mongodb query
                    //clone cached RE to avoid race condition on RE obj during parallel async searches
                    var cre = new RegExp(re.source, "g");
                    cre.lastIndex = re.lastIndex;
                    re = cre;
                    me.findAliasByPage(pid, handleAlias);
                }
            }

            searchNext();
        }
    },

    defer : function(statics) {
        var ee = sm.cms.Events.getInstance();
        ee.addListener("pageSaved", function(ev) {
            sm.cms.page.AliasRegistry.getInstance().__onPageSaved(ev.getData());
        });
    }
});