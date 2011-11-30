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
        popupNewsOnTop : function(opts) {
            if (opts.attrVal || opts.page["popupdate"] == null) {
                opts.page["popupdate"] = +new Date();
            }
            opts.cb(null);
        },


        saveAliasVal : function(opts) {
            var attrVal = opts.attrVal;
            var cb = opts.cb;
            if (!opts.req.isUserHasRoles("alias.admin")) {
                cb(null);
                return;
            }
            var webapp = "exp";
            opts.ctx._vhost_engine_.isPathFreeAndCanBeUsed(webapp, attrVal, function(result) {
                if (!result && attrVal != "") {
                    cb(null);
                    return;
                }
                sm.cms.page.AliasRegistry.getInstance().findPageByAlias(attrVal, function(res) {
                    if (res) {
                        cb(null);
                    } else {
                        cb(null, {
                            value: attrVal
                        })
                    }
                });
            });
        },


        /**
         * Save attribute as direct page property
         */
        savePageProperty : function(opts) {
            opts.page[opts.attrName] = opts.attrVal;
            opts.cb(null, null);
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
        saveTagsVal : function(opts) {
            var value = {};
            var tags;
            var page = opts.page;
            value["value"] = page["tags"] || [];
            var attrVal = opts.attrVal;
            try {
                page["tags"] = JSON.parse(attrVal) || [];
            } catch(e) {
                qx.log.Logger.error(this, "Failed to parse as json object. asm: " + opts.asm["_name_"] +
                  ", attr: " + opts.attrName + ", attrValue: " + attrVal, e);
            }
            opts.cb(null, value);
        },

        loadTagsVal : function(attrName, attrVal, page, cb) {
            cb(null, page["tags"] || []);
        },


        saveWikiVal : function(opts) {
            var http = $$node.require("http");
            var env = sm.app.Env.getDefault();
            var ropts = env.getJServiceRequestOpts();
            ropts["path"] = "/wiki";
            ropts["method"] = "POST";
            var me = this;
            var html = [];
            var cb = opts.cb;
            var attrVal = opts.attrVal;
            var page = opts.page;
            var attrName = opts.attrName;
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