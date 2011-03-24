qx.Class.define("sm.nsrv.tengines.JazzCtxLib", {
    statics :
    {

        /**
         * Setup content type to the response headers
         *
         * @param headers
         * @param ctype
         * @param cb
         */
        ctype : function(headers, ctype, cb) {
            if (ctype) {
                headers["Content-Type"] = ctype;
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
        include : function(vhe, te, ctx, path, cb) {
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
                var req = ctx["_req_"];
                var res = ctx["_res_"];
                var headers = ctx["_headers_"];
                path = req.info.webapp["docRoot"] + path;
                te.createTemplate(path, function(err, template) {
                    if (err) {
                        qx.log.Logger.error(me, err);
                        cbc = true;
                        cb("");
                        return;
                    }
                    te.mergeTemplateInternal(vhe, template, req, res, ctx, headers, function(nf, data) {
                        cbc = true;
                        if (nf) {
                            qx.log.Logger.warn(me, "Resource: '" + path + "' not found");
                            cb("");
                            return;
                        }
                        cb(data);
                    });
                });
            } catch(e) {
                qx.log.Logger.error(this, e);
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
            var cbc = false;
            try {

                if (!qx.lang.Type.isString(path)) {
                    qx.log.Logger.error(this, "irequest(), invalid path=" + path);
                    cbc = true;
                    cb("");
                    return;
                }

                var me = this;
                var req = ctx["_req_"];
                var res = ctx["_res_"];
                var headers = ctx["_headers_"];

                var url = path;
                if (path.length > 0 && path.charAt(0) != '/') {
                    url = req.info.webapp["context"] + '/' + path;
                }

                //Internal request proxy
                var ireq = {
                    url : url,
                    method : "GET",
                    headers : req.headers,
                    httpVersion : "1.0",
                    params : {},
                    outerParams : req.outerParams,
                    stripParams : req.stripParams
                    //todo stream methods?
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

                    statusCode : 200,

                    headers : {},

                    messages : [],

                    __data : [],

                    __end : false,

                    writeContinue : function() {
                        throw new Error("Unsupported opreation: writeContinue()");
                    },

                    writeHead : function(scode, headers) {
                        ires.statusCode = scode;
                        if (headers) {
                            qx.lang.Object.mergeWith(ires.headers, headers);
                        }
                    },

                    setHeader : function(hn, hv) {
                        ires.headers[hn] = hv;
                    },

                    getHeader : function(hn) {
                        var ret = ires.headers[hn];
                        if (ret == undefined) {
                            ret = res.getHeader(hn);
                        }
                        return ret;
                    },

                    removeHeader : function(hn) {
                        if (ires.headers[hn] != undefined) {
                            delete ires.headers[hn];
                        }
                    },

                    addTrailers : function(headers) {
                        //discard it
                    },

                    write : function(chunk, encoding) {
                        //todo encoding ignored, assumed utf8
                        ires.__data.push(chunk.toString());
                    },

                    end : function(chunk, encoding) {
                        if (ires.__end) { //End already called
                            qx.log.Logger.warn(me, "resp.end() called twice!");
                            return;
                        }
                        ires.__end = true;
                        if (chunk != null && chunk != undefined) {
                            ires.write(chunk, encoding);
                        }

                        for (var i = 0; i < ires.messages.length; ++i) {
                            var msg = ires.messages[i];
                            if (ires.statusCode != 500 && msg.isError()) {
                                ires.statusCode = 500; //Mark as err
                            }
                            res.messages.push(msg);
                        }
                        if (ires.statusCode != 200) {
                            qx.log.Logger.warn(me, "_irequest_() statusCode is not OK: " + ires.statusCode +
                                    ", path: " + ireq.url);
                        }

                        cbc = true;
                        if (ires.__data.length > 0) {
                            cb(ires.__data.join(""));
                        } else {
                            cb("");
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
                qx.log.Logger.error(this, e);
                if (!cbc) {
                    cb("");
                }
            }
        },

        /**
         * Invoke assembly
         */
        assembly : function(vhe, te, ctx, name, params, ctxParams, cb) {
            var asm = vhe.getAssembly(name);
            if (!asm) {
                qx.log.Logger.warn(this, "Missing assembly: '" + name + "'");
                cb("");
                return;
            }
            var core = asm["_core_"];
            if (!core) {
                qx.log.Logger.warn(this, "Missing core for assembly: '" + name + "'");
                cb("");
                return;
            }
            if (qx.core.Environment.get("sm.nsrv.debug") == "on") {
                qx.log.Logger.debug("Assembly core: " + core);
            }
            if (!ctxParams) {
                ctxParams = {};
            }
            var aiStack = ctxParams["_astack_"] = qx.lang.Type.isArray(ctx["_astack_"]) ? ctx["_astack_"] : [];
            for (var i = 0; i < aiStack.length; ++i) {
                if (aiStack[i] == asm) {
                    qx.log.Logger.warn(this, "Recursive assembly reference: " + name + "'");
                    cb("");
                    return;
                }
            }
            ctxParams["_asm_"] = asm;

            var req = ctx["_req_"];
            sm.nsrv.tengines.JazzCtxLib.__populateAsmCtxParams(req, asm, ctxParams);

            //Save assembly instance
            aiStack.push(asm);
            this.irequest(vhe, te, ctx, core, params, ctxParams, function(data) {
                qx.lang.Array.remove(aiStack, asm); //Can't use asm.pop() due to async calls
                cb(data);
            });
        },


        assemblyArg : function(vhe, te, ctx, name, def, cb) {
            var asm = ctx["_asm_"];
            if (qx.core.Environment.get("sm.nsrv.debug") == "on") {
                qx.core.Assert.assert(!!asm, "Assembly is not in ctx");
            }
            var val = asm[name];
            if (val == undefined) {
                val = def;
            }
            var jclib = sm.nsrv.tengines.JazzCtxLib;
            var req = ctx["_req_"];
            if (val != undefined && val != null) {
                if (val["_assembly_"]) {
                    jclib.assembly(vhe, te, ctx, val["_assembly_"], req.params, val["_ctxParams_"], cb);
                } else if (val["_irequest_"]) {
                    jclib.irequest(vhe, te, ctx, val["_irequest_"], req.params, val["_ctxParams_"], cb);
                } else if (val["_include_"]) {
                    jclib.include(vhe, te, ctx, val["_include_"], cb);
                } else if ((typeof val) == "function") {
                    val.call(val, req, ctx, asm, cb);
                } else {
                    cb(val);
                }
            } else {
                cb("");
            }
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