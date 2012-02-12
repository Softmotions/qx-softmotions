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

        ///////////////////////////////////////////////////////////////////////////
        //                           Direct page props                           //
        ///////////////////////////////////////////////////////////////////////////


        /**
         * Save attribute as direct page property
         */
        savePageProperty : function(opts, cb) {
            opts.page[opts.attrName] = opts.attrVal;
            cb(null, null);
        },

        /**
         * Load attribute as direct page property
         */
        loadPageProperty : function(attrName, attrVal, page, cb) {
            cb(null, page[attrName]);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                               Tags                                    //
        ///////////////////////////////////////////////////////////////////////////

        saveTagsVal : function(opts, cb) {
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
            cb(null, value);
        },

        loadTagsVal : function(attrName, attrVal, page, cb) {
            cb(null, page["tags"] || []);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                             Wiki                                      //
        ///////////////////////////////////////////////////////////////////////////

        saveWikiVal : function(opts, cb) {
            var http = $$node.require("http");
            var env = sm.app.Env.getDefault();
            var ropts = env.getJServiceRequestOpts();
            ropts["path"] = "/wiki";
            ropts["method"] = "POST";
            var me = this;
            var html = [];
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
    },

    ///////////////////////////////////////////////////////////////////////////
    //                                Aliases                                //
    ///////////////////////////////////////////////////////////////////////////

    saveAliasVal : function(opts, cb) {
        var alias = opts.attrVal;
        if (!opts.req.isUserHasRoles("alias.admin")) {
            cb(null);
            return;
        }
        opts.ctx._vhost_engine_.isPathCanBeServed(opts.req.info.webapp.id, alias, function(result) {
            if (result) {
                cb(null);
                return;
            }
            var areg = sm.cms.page.AliasRegistry.getInstance();
            areg.findPageByAlias(alias, function(err, docId) {
                if (err) {
                    cb(err);
                    return;
                }
                var coll = sm.cms.page.PageMgr.getColl();
                if (!sm.lang.String.isEmpty(alias)) { //reset this alias for other pages
                    opts.page["alias"] = alias;
                    coll.update({"alias" : alias, "_id" : {"$ne" : coll.toObjectID(docId)}}, {"$unset" : {"alias" : 1}});
                } else {
                    delete opts.page["alias"];
                }
                cb(null, null);
            });
        });
    },

    loadAliasVal : this.loadPageProperty,

    ///////////////////////////////////////////////////////////////////////////
    //                                  MISC                                 //
    ///////////////////////////////////////////////////////////////////////////

    /**
     * Update sort order if user wants it to be on top again
     */
    popupNewsOnTop : function(opts, cb) {
        if (opts.attrVal || opts.page["popupdate"] == null) {
            opts.page["popupdate"] = +new Date();
        }
        cb(null);
    }
});