/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.nsrv.tengines.JazzCtxLib", {
    statics :
    {

        /**
         * Setup content type to the response headers
         *
         */
        ctype : function(req, headers, ctype, cb) {
            if ((typeof ctype) === "string") {
                headers["Content-Type"] = ctype;
            } else if ((typeof ctype) === "object") {
                var hv = sm.nsrv.HTTPUtils.selectForUserAgent(ctype, req.headers);
                if (hv != null) {
                    headers["Content-Type"] = hv;
                }
            }
            cb();
        },


        /**
         * Simple include directive
         *
         * @param te {sm.nsrv.tengines.JazzTemplateEngine} Template engine
         * @param ctx {Map} Request context
         * @param path {String} Requested path
         * @param cb {Function} Callback: function(data)
         */
        include : function(vhe, te, ctx, path, ctxParams, cb) {
            var cbc = false;
            try {
                var me = this;
                if (!qx.lang.Type.isString(path)) {
                    qx.log.Logger.error(this, "include(), invalid path=" + path);
                    cbc = true;
                    cb("");
                    return;
                }
                if (path.length > 0 && path.charAt(0) != '/') {
                    path = '/' + path;
                }

                var wrappedCtx = ctx;
                if (ctxParams != null) { //Clone context
                    wrappedCtx = function() {
                        return ctx.apply(this, arguments);
                    };
                    for (var key in ctx) {
                        wrappedCtx[key] = ctx[key];
                    }
                    for (var key in ctxParams) {
                        wrappedCtx[key] = ctxParams[key];
                    }
                }
                var req = wrappedCtx["_req_"];
                var res = wrappedCtx["_res_"];
                var headers = ctx["_headers_"];
                var lpath = $$node.require("path");

                path = lpath.join(req.info.webapp["docRoot"], path);
                te.createTemplate(path, function(err, template) {
                    if (err) {
                        qx.log.Logger.error(me, "Failed template, path: " + path, err);
                        cbc = true;
                        cb("");
                        return;
                    }
                    te.mergeTemplateInternal(vhe, template, req, res, wrappedCtx, headers, function(nf, err, data) {
                        cbc = true;
                        if (nf) {
                            qx.log.Logger.warn(me, "Resource: '" + path + "' not found");
                            cb("");
                            return;
                        }
                        if (err) { //error was reported
                            cb("");
                            return;
                        }
                        cb(data, {escaping : false});
                    });
                });
            } catch(e) {
                qx.log.Logger.error(this, path, e);
                if (!cbc) {
                    cb("");
                }
            }
        },


        /**
         * Internal request directive
         *
         * @param vhe {sm.nsrv.VHostEngine} Virtual host engine
         * @param te {sm.nsrv.tengines.JazzTemplateEngine} Template engine
         * @param ctx {Map} Request context
         * @param path {String} Requested path
         * @param params {Map|null} Request params map
         * @param ctxParams {Map|null} Embedded context params map
         * @param cb {Function} Callback: function(data)
         */
        irequest : function(vhe, te, ctx, path, params, ctxParams, cb) {
            this.irequestExt(vhe, te, ctx, path, params, ctxParams, function(err, data) {
                if (err) {
                    qx.log.Logger.error(this, err);
                }
                cb(data != null ? data : "", {escaping : false});
            });
        },

        irequestExt : function(vhe, te, ctx, path, params, ctxParams, cb) {
            var cbc = false;
            try {

                if (!qx.lang.Type.isString(path)) {
                    cbc = true;
                    cb("irequest(), invalid path=" + path, null);
                    return;
                }

                var me = this;
                var req = ctx["_req_"];
                var res = ctx["_res_"];

                var url = path;
                if (path.length > 0 && path.charAt(0) != '/') {
                    url = req.info.webapp["context"] + '/' + path;
                }

                //Internal request proxy
                var ireq = {
                    internal : true,
                    url : url,
                    method : "GET",
                    headers : req.headers,
                    httpVersion : "1.0",
                    info : req.info,
                    params : {},
                    form : req.form,
                    outerParams : req.outerParams,
                    stripParams : req.stripParams,
                    //session & cookies
                    session : req.session,
                    sessionID : req.sessionID,
                    sessionStore : req.sessionStore,
                    secret : req.secret,
                    cookies : req.cookies,
                    signedCookies : req.signedCookies,
                    cookieHashes : req.cookieHashes,
                    //auth staff
                    isAuthenticated : req.isAuthenticated,
                    getUser : req.getUser,
                    getUserId : req.getUserId,
                    getUserRoles : req.getUserRoles,
                    isUserHasRoles : req.isUserHasRoles,
                    isUserInRoles : req.isUserInRoles,
                    allRoles : req.allRoles
                };

                if (params) {
                    for (var p in params) {
                        ireq.params[p] = params[p];
                    }
                }

                if (req.$$ctxParams) {
                    ireq.$$ctxParams = {};
                    for (var p in req.$$ctxParams) {
                        ireq.$$ctxParams[p] = req.$$ctxParams[p];
                    }
                }

                //Internal response proxy
                var ires = {

                    internal : true,
                    statusCode : 200,
                    headers : {},
                    messages : [],
                    __data : [],
                    __end : false,
                    outerResponse : res.outerResponse,

                    writeContinue : function() {
                        throw new Error("Unsupported opreation: writeContinue()");
                    },

                    writeHead : function(scode, headers) {
                        this.statusCode = scode;
                        if (headers) {
                            qx.lang.Object.mergeWith(this.headers, headers);
                        }
                    },

                    setHeader : function(hn, hv) {
                        this.headers[hn] = hv;
                    },

                    getHeader : function(hn) {
                        var ret = this.headers[hn];
                        if (ret == null) {
                            ret = res.getHeader(hn);
                        }
                        return ret;
                    },

                    removeHeader : function(hn) {
                        if (this.headers[hn] != undefined) {
                            delete this.headers[hn];
                        }
                    },

                    addTrailers : function(headers) {
                        //discard it
                    },

                    write : function(chunk, encoding) {
                        //todo encoding ignored, assumed utf8
                        this.__data.push((typeof chunk === "string") ? chunk : chunk.toString());
                    },

                    end : function(chunk, encoding) {
                        if (this.__end) { //End already called
                            qx.log.Logger.warn(me, "resp.end() called twice!");
                            return;
                        }
                        this.__end = true;
                        if (chunk != null) {
                            this.write(chunk, encoding);
                            chunk = null;
                        }

                        for (var i = 0; i < this.messages.length; ++i) {
                            var msg = this.messages[i];
                            if (this.statusCode != 500 && msg.isError()) {
                                this.statusCode = 500; //Mark as err
                            }
                            res.messages.push(msg);
                        }
                        if (this.statusCode != 200) {
                            qx.log.Logger.warn(me, "_irequest_() statusCode is not OK: " + ires.statusCode +
                              ", path: " + ireq.url);
                        }

                        cbc = true;
                        try {
                            if (this.__data.length > 0) {
                                cb(null, this.__data.join(""));
                            } else {
                                cb(null, "");
                            }
                        } finally {
                            sm.nsrv.VHostEngine.cleanupRequest(ireq, ires);
                            ires = null;
                            ireq = null;
                            req = null;
                            res = null;
                        }
                    }
                };

                //Perform fake request
                vhe.handle(ireq, ires, ctxParams, function(err) {
                    if (err) {
                        qx.log.Logger.error(me, err);
                        ires.sendError();
                    } else {
                        ires.sendNotFound();
                    }
                });

            } catch(e) {
                if (!cbc) {
                    cb(e, null);
                }
            }
        },

        /**
         * Invoke assembly
         */
        assembly : function(vhe, te, ctx, name, params, ctxParams, asmProps, cb) {
            this.assemblyExt(vhe, te, ctx, name, params, ctxParams, asmProps, function(err, data) {
                if (err) {
                    qx.log.Logger.error(this, err);
                }
                cb(data != null ? data : "", {escaping : false});
            })
        },

        /**
         *
         * @param vhe       {sm.nsrv.VHostEngine}
         * @param te        {sm.nsrv.ITemplateEngine}
         * @param ctx       {Object} Request context
         * @param name      {String} Name of assemble
         * @param params    {Map?null} Internal request params
         * @param ctxParams {Map?null} Extra context params
         * @param asmProps  {Map?null} Extra assembly properties
         * @param cb        {function(err, data)} Callback
         */
        assemblyExt : function(vhe, te, ctx, name, params, ctxParams, asmProps, cb) {
            var me = this;
            vhe.loadAssembly(ctx, name, function(err, asm, asmCtxParams) {
                if (err) {
                    cb(err, null);
                    return;
                }
                if (asmProps != null && typeof asmProps === "object") {
                    asm = qx.lang.Object.clone(asm);
                    for (var k in asmProps) {
                        asm[k] = asmProps[k];
                    }
                }
                var req = ctx["_req_"];
                var core = asm["_core_"];
                if (!core) {
                    cb("Missing core for assembly: '" + name + "'", null);
                    return;
                }
                if (ctxParams == null) {
                    ctxParams = {};
                }
                var aiStack = ctxParams["_astack_"] = ctx["_astack_"] != null ? [].concat(ctx["_astack_"]) : [];
                for (var i = 0; i < aiStack.length; ++i) {
                    if (aiStack[i] == asm) {
                        qx.log.Logger.warn(me, "Recursive assembly reference: " + name + "'");
                        cb(null, "");
                        return;
                    }
                }
                ctxParams["_asm_"] = asm;
                if (asmCtxParams != null) {
                    qx.lang.Object.carefullyMergeWith(ctxParams, asmCtxParams);
                }

                sm.nsrv.tengines.JazzCtxLib.__populateAsmCtxParams(req, asm, ctxParams);

                //Save assembly instance
                aiStack.push(asm);
                me.irequestExt(vhe, te, ctx, core, params, ctxParams, cb);
            });
        },


        assemblyArg : function(vhe, te, ctx, name, def, cb) {
            var asm = ctx["_asm_"];
            if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                qx.core.Assert.assert(!!asm, "Assembly is not in ctx");
            }
            var val = asm[name];
            if (val === undefined) {
                val = def;
            }
            var jclib = sm.nsrv.tengines.JazzCtxLib;
            var req = ctx["_req_"];
            if (val != null) {
                if (val["_assembly_"]) {
                    jclib.assembly(vhe, te, ctx, val["_assembly_"], req.params, val["_ctxParams_"], val["_props_"], cb);
                } else if (val["_irequest_"]) {
                    jclib.irequest(vhe, te, ctx, val["_irequest_"], req.params, val["_ctxParams_"], cb);
                } else if (val["_include_"]) {
                    jclib.include(vhe, te, ctx, val["_include_"], val["_ctxParams_"], cb);
                } else if ((typeof val) == "function") {
                    val.call(val, req, ctx, asm, cb);
                } else {
                    cb(val);
                }
            } else {
                cb("");
            }
        },

        utils : function() {

            return {
                /**
                 * Transform given array into new array of blocks of size blocklen
                 * @param arr Array to be transfomed
                 * @param blocklen Block size
                 */
                split : function(arr, blocklen) {
                    if (arr == null || arr.length == 0 || blocklen <= 0) {
                        return [];
                    }
                    var ret = [];
                    var block;
                    for (var i = 0; i < arr.length; ++i) {
                        if (i == 0 || block.length >= blocklen) {
                            block = [];
                            ret.push(block);
                        }
                        block.push(arr[i]);
                    }
                    return ret;
                },

                /**
                 * Get link target from link spec:
                 * <code>
                 *  link_target|link_name
                 * </code>
                 *
                 */
                linkTarget : function(linkSpec, cb) {
                    cb(linkSpec != null ? linkSpec.split("|")[0] : "");
                },

                /**
                 * Get link name from link spec:
                 * <code>
                 *  link_target|link_name
                 * </code>
                 *
                 */
                linkName : function(linkSpec, cb) {
                    cb(linkSpec != null ? linkSpec.split("|")[1] : "");
                },


                /**
                 * Escape argument as URI component
                 */
                escapeUrl : function(data, cb) {
                    cb(data != null ? encodeURIComponent(data) : "");
                },

                /**
                 * Print emit if ctx[prop] is not null otherwise empty stnring will be printed
                 */
                printIf : function(ctx, prop, emit, cb) {
                    cb(ctx != null && ctx[prop] != null ? emit : "");
                },

                printIfInvalid : function(ctx, fname, emit, cb) {
                    this.printIf(ctx ? ctx["_invalid_refs_"] : null, fname, emit, cb);
                },

                /**
                 * Format date
                 * @param date{Date|null} Date to format, if null current date will be used
                 * @param format{String|null} Date format if null default date represendations will be used
                 * @see qx.util.format.DateFormat
                 */
                date : function(date, format, cb) {
                    if (date == null) {
                        date = new Date();
                    }
                    if (format == null) {
                        cb(date.toString());
                        return;
                    }
                    if (format == "rfc822") {
                        cb(sm.cms.util.DateTimeHelper.formatRFC822(date));
                        return;
                    } else {
                        var df = new qx.util.format.DateFormat(format);
                        cb(df.format(date));
                    }
                }
            };
        },

        __populateAsmCtxParams : function(req, asm, ctxParams) {
            var pstack = asm["_ctx_provider_stack_"];
            if (pstack) {
                for (var i = 0; i < pstack.length; ++i) {
                    var cp = pstack[i];
                    cp.call(cp, req, asm, ctxParams);
                }
            }
        }
    }
});