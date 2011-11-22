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

        __aliasForPage : function(document) {
            document = document || {};
            var attrs = document.attrs || {};
            var alias = attrs.alias || {};
            var value = alias.value;
            if (value) {
                return value;
            }
            var id = document._id;
            if (id) {
                return "p" + id.toString();
            }
            return null;
        },

        findAliasByPage : function(pageId, cb) {
            var me = this;
            var result = this.__getAlias(pageId);
            if (result === undefined) {
                sm.cms.page.PageMgr.fetchNodeById(pageId, function(err, document) {
                    if (err) {
                        qx.log.Logger.error(me, "find alias by page", err);
                        cb("p" + pageId);
                    } else {
                        document = document || {
                            _id : pageId
                        };
                        var alias = me.__aliasForPage(document);
                        me.__set(pageId, alias);
                        cb(alias);
                    }
                });
            } else {
                cb(result);
            }
        },

        findPageByAlias : function(alias, cb) {
            var me = this;
            var result = this.__getId(alias);
            if (result === undefined) {
                var coll = sm.cms.page.PageMgr.getColl();
                coll.findOne({"attrs.alias.value":alias}, function(err, document) {
                    if (err) {
                        qx.log.Logger.error(me, "find page by alias", err);
                        cb(null);
                    } else if (document) {
                        var id = document._id.toString();
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
            if (doc == null) {
                return;
            }
            var id = doc._id;
            if (id == null) {
                return;
            }
            this.__set(id.toString(), this.__aliasForPage(doc));
        }
    },

    defer : function(statics) {
        var ee = sm.cms.Events.getInstance();
        ee.addListener("pageSaved", function(ev) {
            sm.cms.page.AliasRegistry.getInstance().__onPageSaved(ev.getData());
        });
    }
});