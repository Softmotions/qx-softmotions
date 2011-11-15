/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.ShowPageExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    statics :
    {
        __getPageAssembly : function(vhe, name, cb) {
            if (name.charAt(0) != "p") {
                cb("Assembly: " + name + " not found", null);
                return;
            }
            var pid = name.substring(1);
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"_id" : coll.toObjectID(pid)}, {fields : {"extra" : 0, "media" : 0, "access" : 0}}, function(err, doc) {
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
                    var meta = parent["_meta_"] || {};
                    var asm = {
                        _name_ : name
                    };

                    qx.lang.Object.carefullyMergeWith(asm, parent);

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
        }
    },

    members :
    {

        __pageInternal : function(req, resp, ctx, pid, preview) {
            if (!/^\w{24}$/.test(pid)) { //mongodb ID
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var me = this;
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"_id" : coll.toObjectID(pid)}, {fields : {"access" : 0, "media" : 0}},
                    function(err, doc) {
                        if (err) {
                            me.handleError(resp, ctx, err);
                            return;
                        }
                        if (!doc || (!preview && !doc.published)) { //Page not published
                            resp.sendNotFound();
                            return;
                        }
                        ctx["_ctx_"] = ctx;
                        ctx["_req_"] = req;
                        ctx["_res_"] = resp;

                        sm.cms.Events.getInstance().fireDataEvent("pageShowing", [doc, ctx]);

                        var ctxParams = {};
                        var asmName = "p" + pid;
                        var vhe = ctx._vhost_engine_;
                        var te = vhe.getTemplateEngineForExt("jz");
                        qx.core.Assert.assert(te != null, "Missing template engine for jz files");

                        //Load assembly
                        sm.nsrv.tengines.JazzCtxLib.assemblyExt(vhe, te, ctx, asmName, req.params, ctxParams, function(err, data) {
                            if (err) {
                                me.handleError(resp, ctx, err, true);
                                return;
                            }
                            var ctype = sm.nsrv.HTTPUtils.selectForUserAgent(
                                    { "default" : "application/xhtml+xml; charset=UTF-8",
                                        "MSIE 7" : "text/html; charset=UTF-8",
                                        "MSIE 8" : "text/html; charset=UTF-8"}, req.headers);
                            me.writeHead(resp, ctx, 200, { "Content-Type": ctype });
                            resp.end(data);
                        });
                    });
        },

        __page : function(req, resp, ctx) {
            var path = req.info.path;
            if (path.indexOf("/p") != 0) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var pid = path.substring("/p".length);
            this.__pageInternal(req, resp, ctx, pid);

        },

        __preview : function(req, resp, ctx) {
            //todo check preview access rights
            var path = req.info.path;
            if (path.indexOf("/pp") != 0) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var pid = path.substring("/pp".length);
            this.__pageInternal(req, resp, ctx, pid, true);
        },

        __main : function(req, resp, ctx) {
            var session = req.session || {};
            var langs = [];
            if (req.params.lang) {
                langs.push(req.params.lang);
            }
            if (session.language) {
                langs.push(session.language);
            }
            var httpLangs = req.headers['accept-language'];
            if (httpLangs) {
                httpLangs.split(',').forEach(function(lang) {
                    langs.push(lang.split(';', 1)[0].toLowerCase());
                });
            }
            var config = sm.app.Env.getDefault().getConfig();
            langs.push(config.defaultLanguage);
            // todo handle languages like "en-gb" and "ru-ru"?
            for (var i = 0, l = langs.length; i < l; ++i) {
                var language = langs[i];
                if (language == config.defaultLanguage) {
                    session.language = config.defaultLanguage;
                    ctx();
                    return;
                }
                var subsite = config.subsites["/" + language];
                if (subsite) {
                    session.language = language;
                    this.__pageInternal(req, resp, ctx, subsite.id);
                    return;
                }
            }
            qx.core.Assert.assert(false, "The for loop should have returned");
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
        },

        /**
         * Main page
         */
        "/index.jz" : {
            webapp : "exp",
            handler : "__main"
        }
    },

    defer : function(statics) {
        sm.nsrv.VHostEngine.registerAssemblyProvider(statics.__getPageAssembly);
    }

});