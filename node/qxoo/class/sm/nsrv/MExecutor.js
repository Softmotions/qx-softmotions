/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Mixin of common routines for NKServer executors
 */
qx.Mixin.define("sm.nsrv.MExecutor", {

    members :
    {
        /**
         * Writes resp headers. Headers specified by argument
         * merged with headers presented in resp object
         *
         * @param resp {Object} Http response
         * @param scode {Integer} Http status code
         * @param headers Headers to be merged
         */
        writeHead : function(resp, ctx, scode, headers) {
            if (scode) {
                resp.statusCode = scode;
            }
            //Save messages and errors into headers
            ctx.collectMessageHeaders();
            return sm.nsrv.HTTPUtils.writeHead(resp, resp.statusCode, headers);
        },

        /**
         * Response completely with JSON object
         */
        writeJSONObject : function(jsonObj, resp, ctx) {
            this.writeHead(resp, ctx, 200, { "Content-Type": "application/json" });
            resp.end(JSON.stringify(jsonObj));
            ctx({"terminated" : true});
        },

        /**
         * Response completely with string data
         */
        writeString : function(data, resp, ctx, ctype) {
            this.writeHead(resp, ctx, 200, { "Content-Type": ctype ? ctype : "text/plain" });
            resp.end(data);
            ctx({"terminated" : true});
        },

        /**
         * Write message to the response headers
         */
        writeMessage : function(resp, ctx, msg, isErr, ctype, data) {
            resp.messages.push(new sm.nsrv.Message(msg, !!isErr));
            this.writeHead(resp, ctx, null, { "Content-Type": ctype ? ctype : "text/plain" });
            resp.end(data ? data : "");
            ctx({"terminated" : true});
        },

        /**
         * Add message into response
         */
        addMessage : function(resp, msg, isErr) {
            resp.messages.push(new sm.nsrv.Message(msg, !!isErr));
        },


        /**
         * Add internal error message for internal requests/templates
         */
        addInternalError : function(ctx, msg) {
            if (!ctx["_errors_"] || ctx["_errors_"].constructor !== Array) {
                ctx["_errors_"] = [];
            }
            if (msg) {
                ctx["_errors_"].push(msg.toString());
            }
        },


        /**
         * Add reference to invalid form field
         * If msg is null it will be registered as internal error
         *
         * @param ctx
         * @param ref {String?null} Field reference
         * @param msg {String?null} Error message
         * @see #addInternalError
         */
        addInvalidRef : function(ctx, ref, msg) {
            if (!ctx["_invalid_refs_"] || typeof ctx["_invalid_refs_"] !== "object") {
                ctx ["_invalid_refs_"] = {};
            }
            if (ref != null) {
                ctx ["_invalid_refs_"][ref] = msg;
            }
            if (msg != null) {
                this.addInternalError(ctx, msg);
            }
        },

        /**
         * Validate field by validation func.
         * If validation func emmits exception this field will be marked as invalid
         * and {@link #addInvalidRef} will be called with following arguments:
         * 'ref' will be field name, 'msg' will be error message
         *
         * @param ctx {Executor context}
         * @param fname {String} Field name
         * @param val   {Object} Field value
         * @param cf  {Function} Check function
         *
         * @return Non zero if val is invalid, 0 is val is valid
         */
        validateField : function(ctx, fname, val, cf) {
            try {
                cf(val);
            } catch(e) {
                this.addInvalidRef(ctx, fname, e.message ? e.message : e);
                return 1;
            }
            return 0;
        },

        /**
         * Add internal message for internal requests/templates
         */
        addInternalMessage : function(ctx, msg) {
            if (!ctx["_messages_"] || ctx["_messages_"].constructor !== Array) {
                ctx ["_messages_"] = [];
            }
            if (msg) {
                ctx ["_messages_"].push(msg);
            }
        },


        /**
         * Handle error, write error to the response headers
         *
         * @param resp {HTTP Response}
         * @param ctx  {Object} Request context
         * @param err  {Object|String|LocalizedString?null} Error object
         * @param hide {Boolean?false} If true: do not inform user about this error
         * @param syshide {Boolean?true} If true: do not log this error
         */
        handleError : function(resp, ctx, err, hide, syshide) {
            if (err instanceof qx.locale.LocalizedString) {
                err = err.toString();
            }
            if (err != null && !syshide) {
                qx.log.Logger.error(this, err);
            }
            this.writeMessage(resp, ctx, (hide || err == null) ? "Ошибка" : err.toString(), true);
        },

        /**
         * Return default env
         */
        getDefaultEnv : function() {
            return sm.app.Env.getDefault();
        },


        /**
         * Generate assembly
         * @param req
         * @param resp
         * @param ctx
         * @param asmName  {String} Assembly name
         * @param ctxParams {Map?null} Assembly ctx params
         * @param asmProps {Map?null} Assembly props
         * @param cb {function?} Callback when done
         */
        generateAssembly : function(req, resp, ctx, asmName, ctxParams, asmProps, cb) {

            ctx["_ctx_"] = ctx;
            ctx["_req_"] = req;
            ctx["_res_"] = resp;

            var vhe = ctx._vhost_engine_;
            var te = vhe.getTemplateEngineForExt("jz");
            qx.core.Assert.assert(te != null, "Missing template engine for jz files");

            //Load assembly
            sm.nsrv.tengines.JazzCtxLib.assemblyExt(vhe, te, ctx, asmName, req.params, ctxParams, asmProps, function(err, data) {
                if (err) {
                    if (cb) {
                        cb(err);
                    }
                    return;
                }
                if (cb) {
                    cb(null, data);
                }
            });
        },


        _doNotRecreateMe : function(val) {
            this.$$notrecreate = !!val;
        }
    }
});