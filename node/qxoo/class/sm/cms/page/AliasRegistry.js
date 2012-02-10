/*
 * Copyright (c) 2012. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.AliasRegistry", {
    extend  : qx.core.Object,
    type : "singleton",

    construct: function() {
        var size = sm.app.Env.getDefaultConfig()["aliasesCacheSize"];
        if (isNaN(size) || size <= 0) {
            size = 1024;
        }
        this.__maxLength = size;
        this.__lruList = new sm.lang.DoubleLinkedList();
    },

    members : {

        __mapABP : {},
        __mapPBA : {},
        __lruList : null,
        __length : 0,
        __maxLength : null,

        __hOP : function(obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key);
        },

        __set : function(id, alias) {
            if (this.__hOP(this.__mapABP, id)) {
                this.__delId(id);
            }
            if (this.__hOP(this.__mapPBA, alias)) {
                this.__delAlias(id);
            }
            var hit = {
                id: id,
                alias: alias
            };
            this.__mapABP[id] = this.__mapPBA[alias] = hit;
            this.__lruList.add(hit);
            this.__length++;
            if (this.__length > this.__maxLength) {
                this.__trim();
            }
        },

        __getId : function(alias) {
            if (!this.__hOP(this.__mapPBA, alias)) return undefined;
            var hit = this.__mapPBA[alias];
            this.__lruList.del(hit);
            this.__lruList.add(hit);
            return hit.id;
        },

        __getAlias : function(id) {
            if (!this.__hOP(this.__mapABP, id)) return undefined;
            var hit = this.__mapABP[id];
            this.__lruList.del(hit);
            this.__lruList.add(hit);
            return hit.alias;
        },

        __delId : function(id) {
            if (!this.__hOP(this.__mapABP, id)) return undefined;
            var hit = this.__mapABP[id];
            delete this.__mapABP[id];
            delete this.__mapPBA[hit.alias];
            this.__lruList.del(hit);
            this.__length--;
        },

        __delAlias : function(alias) {
            if (!this.__hOP(this.__mapPBA, alias)) return undefined;
            var hit = this.__mapPBA[alias];
            delete this.__mapPBA[alias];
            delete this.__mapABP[hit.id];
            this.__lruList.del(hit);
            this.__length--;
        },

        __trim : function() {
            if (this.__length <= this.__maxLength) return undefined;
            for (var i = 0, l = this.__length - this.__maxLength; i < l; ++i) {
                this.__lruList.del(this.__lruList.getTail());
            }
            this.__length = this.__maxLength;
        },

        __aliasForPage : function(doc) {
            doc = doc || {};
            if (doc.alias) {
                return doc.alias;
            }
            if (doc._id) {
                return "p" + doc._id.toString();
            }
            return null;
        },

        findAliasByPage : function(pageId, cb) {
            var me = this;
            var alias = this.__getAlias(pageId);
            if (alias !== undefined) {
                cb(alias);
                return;
            }
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"_id" : coll.toObjectID(pageId)}, {"fields" : {"alias" : 1}}, function(err, doc) {
                if (err) {
                    qx.log.Logger.error(me, "find alias by page", err);
                    cb("p" + pageId);
                    return;
                }
                doc = doc || {
                    _id : pageId
                };
                alias = me.__aliasForPage(doc);
                me.__set(pageId, alias);
                if (alias != null) {
                    cb(alias)
                } else {
                    cb("p" + pageId);
                }
            });
        },

        findPageByAlias : function(alias, cb) {
            var me = this;
            var result = this.__getId(alias);
            if (result === undefined) {
                var coll = sm.cms.page.PageMgr.getColl();
                coll.findOne({"alias" : alias}, function(err, doc) {
                    if (err) {
                        qx.log.Logger.error(me, "find page by alias", err);
                        cb(null);
                        return;
                    }
                    if (doc) {
                        var id = doc._id.toString();
                        me.__set(id, alias);
                        cb(id);
                    } else {
                        cb(null);
                    }
                });
            } else {
                cb(result);
            }
        },

        __onPageSaved : function(doc) {
            if (doc == null || doc._id == null) {
                return;
            }
            this.__set(doc._id.toString(), this.__aliasForPage(doc));
        }
    },

    defer : function(statics) {
        var ee = sm.cms.Events.getInstance();
        ee.addListener("pageSaved", function(ev) {
            sm.cms.page.AliasRegistry.getInstance().__onPageSaved(ev.getData());
        });
    }
});