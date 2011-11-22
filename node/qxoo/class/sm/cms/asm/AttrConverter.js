/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.asm.AttrConverter", {
    statics :
    {
        /**
         * Load attribute value if attribute stored in page context
         */
        loadCtxVal : function(attrName, attrVal, page, cb) {
            var val = (attrVal != null && attrVal["ctx"] != null ? attrVal["ctx"] : {});
            cb(null, val);
        },


        /**
         * Update sort order if user wants it to be on top again
         */
        popupNewsOnTop : function(attrVal, attrName, attrMeta, asm, page, cb) {
            if (attrVal || page["popupdate"] == null) {
                page["popupdate"] = +new Date();
            }
            cb(null);
        },


        saveAliasVal : function(attrVal, attrName, attrMeta, asm, page, cb, ctx) {
            if (ctx._req_.isUserHasRoles("alias.admin")) {
                ctx._vhost_engine_.isPathFreeAndCanBeUsed("/exp", attrVal, function(result) {
                    if (result || attrVal == "") {
                        // todo check if alias exists
                        cb(null, {
                            value: attrVal
                        });
                    } else {
                        // todo report an error that user can't use this alias
                        cb(null);
                    }
                });
            } else {
                // maybe to report some kind of error instead if old value differs from new one?
                cb(null);
            }
        },


        /**
         * Save attribute as direct page property
         */
        savePageProperty : function(attrVal, attrName, attrMeta, asm, page, cb) {
            page[attrName] = attrVal;
            cb(null, null);
        },


        /**
         * Load attribute as direct page property
         */
        loadPageProperty : function(attrName, attrVal, page, cb) {
            cb(null, page[attrName]);
        },


        /**
         * If attribute is page tags
         */
        saveTagsVal : function(attrVal, attrName, attrMeta, asm, page, cb) {
            var value = {};
            var tags;
            value["value"] = page["tags"] || [];
            try {
                page["tags"] = JSON.parse(attrVal) || [];
            } catch(e) {
                qx.log.Logger.error(this, "Failed to parse as json object. asm: " + asm["_name_"] +
                  ", attr: " + attrName + ", attrValue: " + attrVal, e);
            }
            cb(null, value);
        },

        loadTagsVal : function(attrName, attrVal, page, cb) {
            cb(null, page["tags"] || []);
        },


        saveWikiVal : function(attrVal, attrName, attrMeta, asm, page, cb) {
            var http = $$node.require("http");
            var env = sm.app.Env.getDefault();
            var ropts = env.getJServiceRequestOpts();
            ropts["path"] = "/wiki";
            ropts["method"] = "POST";
            var me = this;
            var html = [];
            var req = http.request(ropts, function(res) {
                if (res.statusCode != 200) {
                    var msg = "Invalid response, status=" + res.statusCode;
                    qx.log.Logger.error(me, "sm.cms.asm.AttrConverter.saveWikiVal", msg);
                    cb(msg, null);
                    return;
                }
                res.setEncoding("UTF-8");
                res.on("data", function (chunk) {
                    html.push(chunk);
                });
                res.on("end", function() {
                    var extra = page["extra"];
                    if (!extra) {
                        extra = page["extra"] = {};
                    }
                    extra[attrName] = attrVal;
                    cb(null, {"ctx" : {"html" : html.join("")}});
                });
            });
            req.on("error", function(err) {
                qx.log.Logger.error(me, "sm.cms.asm.AttrConverter.saveWikiVal", err);
                cb(err, null);
            });
            req.write(attrVal);
            req.end();
        },

        loadWikiVal : function(attrName, attrVal, page, cb) {
            cb(null, page["extra"] && page["extra"][attrName] ? page["extra"][attrName] : "");
        }
    }
});