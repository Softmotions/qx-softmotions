/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.ShowPageExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor, sm.cms.page.MPageMixin],

    statics :
    {
        missingAssemblyHandler : function(vhe, name, cb) {
            if (name.charAt(0) != "p") {
                cb("Assembly: " + name + " not found", null);
                return;
            }

            var coll = sm.cms.page.PageMgr.getColl();
            try {
                var oid = coll.toObjectID(name.substring(1));
            } catch(e) {
                cb("Assembly: " + name + " not found", null);
                return;
            }

            coll.findOne({"_id" : oid}, {fields : {"extra" : 0, "media" : 0, "access" : 0}}, function(err, doc) {
                if (err) {
                    cb(err, null);
                    return;
                }
                if (!doc) {
                    cb("Assembly: " + name + " not found", null);
                    return;
                }
                if (!doc["asm"]) {
                    cb("Assembly: " + name + " must have parent", null);
                    return;
                }

                vhe.loadAssembly(doc["asm"], function(err, parent) {
                    if (err) {
                        cb(err, null);
                        return;
                    }
                    var meta = {};
                    var metaParent = parent;
                    while (metaParent != null) {
                        if (metaParent["_meta_"]) {
                            qx.lang.Object.mergeWith(meta, metaParent["_meta_"], false);
                        }
                        metaParent = metaParent["_extends_"];
                    }
                    var asm = {
                        _name_ : name
                    };
                    qx.lang.Object.mergeWith(asm, parent, false);

                    if (doc["attrs"] == null) {
                        doc["attrs"] = {};
                    }
                    var attrs = doc["attrs"];
                    for (var an in attrs) {
                        var ameta = meta[an];
                        var av = attrs[an];
                        if (av == null) {
                            continue;
                        }
                        if (av.value !== undefined) {
                            asm[an] = av.value;
                        } else if (av.ctx !== undefined && (typeof asm[an]) === "object") {
                            var aav = asm[an] = qx.lang.Object.clone(asm[an]);
                            var ctxParams = aav["_ctxParams_"] = aav["_ctxParams_"] || {};
                            if (ameta != null && (typeof ameta.ctx_value_name) === "string") { //Save under specified context key
                                ctxParams[ameta.ctx_value_name] = av.ctx;
                            } else if (qx.lang.Type.isObject(av.ctx)) { //Merge object value with ctx
                                qx.lang.Object.mergeWith(ctxParams, av.ctx, true);
                            } else {
                                ctxParams[an] = av.ctx; //Save non object value value under attibute name
                            }
                        }
                    }

                    cb(null, asm, {"_page_" : doc});
                });
            });
        },

        missingExecutorAliasHandler : function(req, cb) {
            if (req.info.webapp.id !== "exp") {
                cb(false);
                return;
            }
            sm.cms.page.AliasRegistry.getInstance().findPageByAlias(req.info.path, function(err, pageId) {
                if (err || pageId == null) {
                    cb(false);
                    return;
                }
                req.info.path = "/p" + pageId;
                req.info.pathname = req.info.contextPath + req.info.path;
                cb(true);
            });
        }
    },

    members :
    {

        __page : function(req, resp, ctx) {
            var path = req.info.path;
            if (path.indexOf("/p") !== 0) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var pid = path.substring("/p".length);
            this._pageInternal(req, resp, ctx, pid);
        },

        __preview : function(req, resp, ctx) {
            //todo check preview access rights
            var path = req.info.path;
            if (path.indexOf("/pp") !== 0) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var pid = path.substring("/pp".length);
            this._pageInternal(req, resp, ctx, pid, true);
        }
    },

    handlers :
    {
        /**
         * Public page accesss
         */
        "^/p[a-z0-9]{24}$" : {
            webapp : "exp",
            handler : "__page",
            matching : "regexp"
        },

        /**
         * Preview page
         */
        "^/pp[a-z0-9]{24}$" : {
            webapp : "exp",
            handler : "__preview",
            matching : "regexp"
        }
    },

    defer : function(statics) {
    }

});