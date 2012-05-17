/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Render jazz (https://github.com/shinetech/jazz) templates
 */
qx.Class.define("sm.nsrv.tengines.JazzTemplateEngine", {
    extend  : qx.core.Object,
    implement : [sm.nsrv.ITemplateEngine],

    properties :
    {

        "extensions" : {
            check : "Array",
            init : ["jz"]
        },

        /**
         * Whenever escape XML during template generation
         */
        "escapeXML" : {
            check : "Boolean",
            init : true
        },

        /**
         * Time period (ms) within it filestat will not be checked,
         * last fetched stat and cached value of template will be used
         */
        "statTrustPeriod" : {
            check : "Integer",
            init : 3000 //3sec
        }
    },


    construct : function() {
        this.base(arguments);
        this.__path = $$node.require("path");
        this.__util = $$node.require("util");
        this.__jazz = $$node.require("softmotions-jazz");

        //temlate cache
        this.__tcache = {};
    },

    members :
    {
        /**
         * Templates cache
         */
        __tcache : null,

        __path : null,
        __util : null,
        __jazz : null,


        createTemplate : function(path, cb) {

            var me = this;
            var cached = me.__tcache[path];
            var now = new Date().getTime();

            if (cached != null && now - cached.ttime <= this.getStatTrustPeriod()) {
                cb(null, cached);
                return;
            }

            $$node.fs.stat(path, function(err, stat) {
                if (err || !stat.isFile()) {
                    cb(null, {"path" : path, "notfound" : true});
                    return;
                }
                //checking the cache
                if (cached) {
                    if (cached.mtime != stat.mtime.getTime() || cached.fsize != stat.size) {
                        if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                            qx.log.Logger.debug(this, "Invalidate cache: " + path);
                        }
                        cached = null;
                        delete me.__tcache[path];
                    }
                    if (cached) {
                        if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                            qx.log.Logger.debug(this, "Cached template fetched: " + path);
                        }
                        cached.ttime = now;
                        cb(null, cached);
                        return;
                    }
                }

                var fdata = $$node.fs.readFileSync(path, "utf8");
                var jazzTemplate;
                try {
                    jazzTemplate = me.__jazz.compile(fdata);
                } catch(e) {
                    cb(e, null);
                    return;
                }

                var template = {"path" : path,
                    "mtime" : stat.mtime.getTime(),
                    "fsize" : stat.size,
                    "jazz" : jazzTemplate,
                    "ttime" : now //todo a bit inaccurate time
                };

                me.__tcache[path] = template;
                cb(null, template);
            });
        },

        /**
         *
         * @param vhe
         * @param template
         * @param req
         * @param res
         * @param ctx
         * @param headers
         * @param cb {function(notfound{Boolean}, error{Error}, data{String})}
         */
        mergeTemplateInternal : function(vhe, template, req, res, ctx, headers, cb) {
            var me = this;
            var tjazz = template["jazz"];
            if (!tjazz || template["notfound"]) {
                cb(true, null, null);
                return;
            }
            ctx["_global_"] = qxglobal;
            ctx["_env_"] = sm.app.Env.getDefault(true);
            ctx["_ctx_"] = ctx;
            ctx["_req_"] = req;
            ctx["_res_"] = res;
            ctx["_ctxpath_"] = req.info.contextPath;
            ctx["_headers_"] = headers;
            ctx["_ctype_"] = function(_ctype, _cb) {
                sm.nsrv.tengines.JazzCtxLib.ctype(req, headers, _ctype, _cb);
            };
            ctx["_ctype_xhtml_"] = function(_cb) {
                sm.nsrv.tengines.JazzCtxLib.ctype(req, headers,
                  {"default" : "application/xhtml+xml; charset=UTF-8",
                      "MSIE 7" : "text/html; charset=UTF-8",
                      "MSIE 8" : "text/html; charset=UTF-8"}, _cb);
            };
            ctx["_set_header_"] = function(headerName, headerVal, _cb) {
                headers[headerName] = headerVal;
                _cb("");
            };
            ctx["_strip_"] = function(prefix) {
                return req.stripParams(prefix);
            };
            ctx["_params_"] = function(_pname, _cb) {
                _cb(req.params[_pname]);
            };
            ctx["_include_"] = function() {
                var _path = arguments[0];
                var _ctxParams = arguments.length > 2 ? arguments[1] : null;
                var _cb = arguments[arguments.length - 1];
                sm.nsrv.tengines.JazzCtxLib.include(vhe, me, ctx, _path, _ctxParams, _cb);
            };
            ctx["_irequest_"] = function() {
                var _path = arguments[0];
                var _params = arguments.length > 2 ? arguments[1] : null;
                var _ctxParams = arguments.length > 3 ? arguments[2] : null;
                var _cb = arguments[arguments.length - 1];
                sm.nsrv.tengines.JazzCtxLib.irequest(vhe, me, ctx, _path, _params, _ctxParams, _cb);
            };
            ctx["_assembly_"] = function() {
                var _name = arguments[0];
                var _params = arguments.length > 2 ? arguments[1] : null;
                var _ctxParams = arguments.length > 3 ? arguments[2] : null;
                var _asmProps = arguments.length > 4 ? arguments[3] : null;
                var _cb = arguments[arguments.length - 1];
                sm.nsrv.tengines.JazzCtxLib.assembly(vhe, me, ctx, _name, _params, _ctxParams, _asmProps, _cb);
            };
            ctx["_A"] = function() {
                var _name = arguments[0];
                var _def = arguments.length > 2 ? arguments[1] : null;
                var _cb = arguments[arguments.length - 1];
                sm.nsrv.tengines.JazzCtxLib.assemblyArg(vhe, me, ctx, _name, _def, _cb);
            };
            ctx["_utils_"] = sm.nsrv.tengines.JazzCtxLib.utils();

            if (ctx._webapp_.jazzTemplateLib) {
                for (var k in ctx._webapp_.jazzTemplateLib) {
                    if (ctx[k] === undefined && typeof ctx._webapp_.jazzTemplateLib[k] === "function") {
                        ctx[k] = ctx._webapp_.jazzTemplateLib[k];
                    }
                }
            }
            try {
                tjazz.process(ctx,
                  function(data, opts, dynamic) { //Mediator todo XHTML mediator hardcoded!
                      if (data == null || !dynamic || (opts && opts["escaping"] === false) || me.getEscapeXML() == false) {
                          return data;
                      }
                      return sm.lang.String.escapeXML(data);
                  }, function(data) { //Data
                      cb(false, null, data);
                  }
                );
            } catch(err) {
                qx.log.Logger.error(me, "Jazz template merging failed! Path: " + template["path"], err);
                cb(null, err, null);
            }
        },

        mergeTemplate : function(vhe, template, req, res, ctx, headers) {
            this.mergeTemplateInternal(vhe, template, req, res, ctx, headers, function(nf, err, data) {
                if (nf) { //Notfound
                    headers["Content-Type"] = "text/plain";
                    res.sendNotFound(headers);
                    return;
                }
                if (err) {
                    res.sendError();
                    return;
                }

                //qx.log.Logger.info("typeof data=" + (typeof data) );

                ctx.collectMessageHeaders(true);
                qx.lang.Object.carefullyMergeWith(res.headers, headers);
                res.writeHead((res.statusCode || 200), res.headers);
                res.end(data);
            });
        }
    },

    destruct : function() {
        this.__util = this.__jazz = this.__path = this.__tcache = null;
    }
});
