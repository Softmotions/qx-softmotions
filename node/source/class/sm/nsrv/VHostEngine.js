/**
 * Virtual host managers
 */
qx.Class.define("sm.nsrv.VHostEngine", {
    extend  : qx.core.Object,

    statics :
    {
    },

    events :
    {
    },

    properties :
    {
    },

    construct : function(config) {
        //required libs
        this.__fs = $$node.require("fs");
        this.__path = $$node.require("path");
        this.__url = $$node.require("url");
        this.__formidable = $$node.require("formidable");
        this.__querystring = $$node.require("querystring");

        this.base(arguments);
        this.__applyConfig(config);

    },

    members :
    {

        /**
         * Name of virtual host
         */
        __vhostName : null,

        /**
         * Vhost config
         */
        __config : null,

        /**
         * Web handlers storage
         */
        __handlers : null,

        /**
         * Current connect server
         */
        __server : null,

        /**
         * Returns virtual host name
         * @return {String}
         */
        getVHostName : function() {
            return this.__vhostName;
        },

        __applyConfig : function(config) {

            this.__config = config;
            this.__vhostName = this.__config["vhost"];

            if (!this.__vhostName) {
                throw new Error("Invalid vhost config: " + qx.util.Json.stringify(this.__config));
            }
            if (!qx.lang.Type.isArray(this.__config["webapps"])) {
                throw new Error("Invalid vhost config, webapps section must be array: " + qx.util.Json.stringify(this.__config));
            }
            var wapps = this.__config["webapps"];

            var wappsIds = {};
            var wappsCtx = {};

            for (var i = 0; i < wapps.length; ++i) {

                var wa = wapps[i];
                if (!qx.lang.Type.isString(wa["id"])) {
                    throw new Error("Missing webapp 'id' in config: " + qx.util.Json.stringify(this.__config));
                }
                if (!qx.lang.Type.isString(wa["docRoot"])) {
                    throw new Error("Missing webapp 'docRoot' in config: " + qx.util.Json.stringify(this.__config));
                }
                if (wappsIds[wa["id"]]) {
                    throw new Error("Duplicated webapp 'id' in config: " + qx.util.Json.stringify(this.__config));
                }
                wappsIds[wa["id"]] = true;

                //normalize context path
                var waCtx = wa["context"];
                if (!qx.lang.Type.isString(waCtx) || waCtx.length == 0) {
                    waCtx = wa["context"] = "/";
                }
                if (waCtx != "/" && waCtx.charAt(waCtx.length - 1) == '/') {
                    waCtx = wa["context"] = waCtx.substring(0, waCtx.length - 1);
                }
                if (wappsCtx[waCtx]) {
                    throw new Error("Duplicated webapp 'context' in config: " + qx.util.Json.stringify(this.__config));
                }
                wappsCtx[waCtx] = true;
                wa["contextPath"] = (waCtx == "/") ? "" : waCtx;

                //check document root
                var dr = wa["docRoot"];
                if (!this.__path.existsSync(dr) || !this.__fs.statSync(dr).isDirectory()) {
                    throw new Error("The 'docRoot': " + wa["docRoot"] + " is not directory");
                }
            }

            //Sort webapp configs accordingly to its 'context' length
            //longer prefix first
            wapps.sort(function(w1, w2) {
                return (w2["context"].length - w1["context"].length);
            });

            if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                qx.log.Logger.debug("VHost[" + this.__vhostName + "] config: " + qx.util.Json.stringify(this.__config));
            }

            this.__loadHandlers();
        },

        /**
         * Returns configuration of webapp identified by __id__
         * If nothing found returns __null__
         *
         * @param id {String ?} if __null__ default webapp ID will be used
         * @return {Map}
         */
        __getWebappConfig : function(id) {

            var me = this;
            var wapp = (function () {
                if (id == null || id == undefined) {
                    id = me.__getDefaultWebappId();
                }
                if (id == null) {
                    return null;
                }
                var apps = me.__config["webapps"];
                if (!apps) {
                    return null;
                }
                for (var i = 0; i < apps.length; ++i) {
                    var app = apps[i];
                    if (app["id"] == id) {
                        return app;
                    }
                }
            })();
            if (!wapp) {
                throw new Error("No webapp config, for webapp ID: '" + id + "' please check configuration");
            }
            return wapp;
        },

        /**
         * Returns default webapp ID
         * @return {String} default webapp ID or __null__ if nothing found
         */
        __getDefaultWebappId : function() {
            var id = this.__config["defaultWebapp"];
            if (!id) {
                var apps = this.__config["webapps"];
                id = (apps && apps.length > 0) ? apps[0]["id"] : null;
            }
            return (id || null);
        },

        /**
         * Value of handler config if it missing
         * default val from __server config__ will be used
         *
         * @param hconf {Map} hconf Web handler config
         * @param key {String} Config value key
         *
         */
        __getHconfValue : function(hconf, key) {
            var ret = hconf[key];
            if (ret == undefined) {
                var wapp = this.__getWebappConfig(hconf["webapp"]);
                if (wapp["handlerDefaults"]) {
                    ret = wapp["handlerDefaults"][key];
                }
            }
            if (!ret && key == "webapp") {
                ret = this.__getDefaultWebappId();
            }
            return ret;
        },

        /**
         * Load request handlers index
         */
        __loadHandlers : function() {

            this.__handlers = {};
            var wapps = this.__config["webapps"];
            var wappsIds = {};
            for (var i = 0; i < wapps.length; ++i) {
                wappsIds[wapps[i]["id"]] = true;
            }

            for (var k in qx.Bootstrap.$$registry) {

                var clazz = qx.Bootstrap.$$registry[k];
                if (!clazz || !clazz.prototype) {
                    continue;
                }
                var handlers = clazz.prototype["$$handlers"];
                if (!handlers) {
                    continue;
                }

                var hinstance = new clazz();
                for (var lList in handlers) {

                    var hconf = handlers[lList];
                    var lArr = lList.split(/\s+/);

                    for (var i = 0; i < lArr.length; ++i) {
                        var hl = lArr[i];
                        if (hl.charAt(0) == "/") {
                            hl = hl.substring(1);
                        }
                        if (hl.charAt(hl.length - 1) == "/") {
                            hl = hl.substring(0, hl.length - 1);
                        }

                        var wappId = this.__getHconfValue(hconf, "webapp");
                        if (!wappsIds[wappId]) {
                            continue;
                        }
                        var wapp = this.__getWebappConfig(wappId);

                        var cpath = wapp["context"] || "/";
                        if (cpath.length > 0 && cpath.charAt(cpath.length - 1) != "/") {
                            cpath += "/";
                        }
                        hl = (cpath + hl);
                        if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                            qx.log.Logger.debug("Handler: '" + k + "#" + (hconf["handler"]) +
                                    "()' attached: [" + this.__vhostName + "]:[" + wappId + "]:" + hl);
                        }
                        var hlSlot = this.__handlers[hl];
                        if (hlSlot) {
                            qx.log.Logger.warn("Handler: '" + k + "#" + (hlSlot["handler"]) +
                                    "()' replaced by: " + hconf["handler"] + "()");
                        }
                        hconf["$$class"] = k;
                        hconf["$$instance"] = hinstance;
                        this.__handlers[hl] = hconf;
                    }
                }
            }
        },

        /**
         * Render file template
         * @param req {http.ServerRequest}
         * @param res {http.ServerResponse}
         * @param ctx {Object}
         * @param forward {Object} forward object
         */
        __renderTemplate : function(req, res, ctx, forward) {

            if (!req.info.contextPath) { //not in webapp
                res.sendNotFound();
                return;
            }

            if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                qx.log.Logger.debug("Forward: " + qx.util.Json.stringify(forward));
            }

            if (forward && forward["terminated"] == true) { //executor takes control of the request
                return;
            }

            var path = (forward && qx.lang.Type.isString(forward.path)) ? forward.path : req.info.path;
            if (path.length > 0 && path.charAt(0) != '/') {
                path = '/' + path;
            }
            path = req.info.webapp["docRoot"] + path;
            var ext = this.__path.extname(path);
            if (ext && ext != "") {
                ext = ext.substring(1);
            } else {
                ext = null;
            }
            var tengine = this.self(arguments).__tengines[ext];
            if (!tengine) {
                tengine = this.self(arguments).__tengines["*"]; //use sm.nsrv.tengines.StaticTemplateEngine
            }

            //guess content-type
            var ctype = null;
            if (ext) {
                ctype = sm.nsrv.HTTPUtils.getCType(ext);
            }
            if (!ctype) {
                ctype = sm.nsrv.HTTPUtils.getCType("bin");
            }

            //template engine headers
            var headers = qx.lang.Object.clone(res.headers);
            qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": ctype });

            //write template
            if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                qx.log.Logger.debug("Merging: '" + path + "', template engine: " + tengine);
            }

            var me = this;
            tengine.createTemplate(path, function(err, template) {
                if (err) {
                    qx.log.Logger.error(me, "Create template failed: " + err);
                    res.sendError();
                    return;
                }
                tengine.mergeTemplate(me, template, req, res, ctx, headers);
            });
        },

        /**
         * Main routine to handle http request
         */
        __handleReq : function(req, res, next) {

            //trying to find handlers
            var hconf = this.__handlers[req.info.pathname];

            var me = this;
            var ctx = function(forward) {
                if (forward && forward["terminated"] == true) {
                    return; //response must be managed by executor
                }
                ctx.collectMessageHeaders();
                me.__renderTemplate(req, res, ctx, forward);
            };

            /**
             * Return true if found message errors
             */
            ctx.collectMessageHeaders = function() {
                var errC = me.__messageHeaders(res);
                if (errC > 0) {
                    //todo review status code
                    res.statusCode = 500;
                    return true;
                } else {
                    return false;
                }
            };

            var execCalled = false;
            if (hconf) { //found handlers
                var hinst = hconf["$$instance"];
                var exec = hinst[hconf["handler"]];
                if (!qx.lang.Type.isFunction(exec)) {
                    throw new Error("No handler function: " + hconf["handler"] + " in " + hconf["$$class"]);
                }
                if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                    qx.log.Logger.debug("Executing handler: '" + hconf["$$class"] + "#" + (hconf["handler"]) + "()");
                }
                try {
                    exec.call(hinst, req, res, ctx);
                    execCalled = true;
                } catch(e) {
                    var report = true;
                    if (e instanceof sm.nsrv.Message) {
                        report = e.isError();
                    }
                    if (report) {
                        qx.log.Logger.warn("Handler: " + hconf["$$class"] + "#" + (hconf["handler"]) + "() throws exception: " + e.message);
                    }
                    next(e);
                    return;
                }
            }

            if (!execCalled) { //Exec handler not called
                ctx(null);
            }
        },


        /**
         * Flush message headers into response
         */
        __messageHeaders : function(res) {

            if (!qx.lang.Type.isArray(res.messages)) {
                return 0; //no messages found
            }
            if (!res.headers) {
                res.headers = {};
            }
            var errC = 0;  //Error messages count
            var nerrC = 0; //Not error messages count
            for (var i = 0; i < res.messages.length; ++i) {
                var m = res.messages[i];
                var isErr = m.isError();
                res.headers[(isErr ? ("Softmotions-Msg-Err" + errC) : ("Softmotions-Msg-Reg" + nerrC))]
                        = encodeURIComponent(m.getMessage());
                if (isErr) {
                    ++errC;
                } else {
                    ++nerrC;
                }
            }
            return errC;
        },

        /**
         * Error handling
         */
        __handleError : function(err, req, res, next) {

            var errOpts = this.__config["errorOptions"];
            if (!errOpts) {
                errOpts = {};
            }
            var errC = 0; //errors count
            var message = (err instanceof sm.nsrv.Message);
            var report = true;
            if (message) {
                res.messages.push(err);
                report = err.isError();
                if (report && !errOpts["messagesInHeaders"]) {
                    ++errC;
                }
            }
            if (report && !message) {
                qx.log.Logger.error(this, err.stack);
            }
            var headers = { "Content-Type": "text/plain" };
            if (errOpts["messagesInHeaders"]) {
                errC = this.__messageHeaders(res); //Collect message headers
            }
            if (res.headers) {
                qx.lang.Object.mergeWith(headers, res.headers);
            }
            var body = (errOpts["showErrorMsg"] && !errOpts["messagesInHeaders"])
                    ? err.toString()
                    : "";
            //todo review status code
            res.writeHead((message && errC == 0) ? 200 : 500, headers);
            res.end(body);

        },

        /**
         * Initiate request
         */
        __initRequestHandler : function(req, res, next) {

            //Response messages
            res.messages = res.messages || [];

            //Response headers to be merged
            res.headers = res.headers || {};

            res.sendNotFound = function(headers) {
                headers = headers || {};
                qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": "text/plain" });
                res.writeHead(404, headers);
                res.end();
            };
            res.sendForbidden = function(headers) {
                headers = headers || {};
                qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": "text/plain" });
                res.writeHead(403, headers);
                res.end();
            };
            res.sendError = function(headers) {
                headers = headers || {};
                qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": "text/plain" });
                res.writeHead(500, headers);
                res.end();
            };
            res.sendOk = function(headers) {
                headers = headers || {};
                qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": "text/plain" });
                res.writeHead(200, headers);
                res.end();
            };

            if (qx.core.Variant.isSet("sm.nsrv.access-control-allow", "on")) {
                var hset = {"Access-Control-Allow-Origin" : "*"};
                var rh = req.headers["access-control-request-headers"];
                if (rh) {
                    hset["Access-Control-Allow-Headers"] = rh;
                }
                var rm = req.headers["access-control-request-method"];
                if (rm) {
                    hset["Access-Control-Allow-Methods"] = rm;
                }
                qx.lang.Object.carefullyMergeWith(res.headers, hset);
            }

            if (req.method == "OPTIONS") { //todo options processing?                
                res.sendOk(res.headers);
                return;
            }


            var info = req.info = this.__url.parse(req.url);
            if (~info.pathname.indexOf("..")) { //Simple security checking
                return res.sendForbidden(res);
            }

            var wapps = this.__config["webapps"];
            for (var i = 0; i < wapps.length; ++i) {
                var wa = wapps[i];
                var cpath = wa["contextPath"] + "/";
                if (qx.lang.String.startsWith(info.pathname, cpath)) {
                    info.webapp = wa;
                    info.path = info.pathname.substring(cpath.length - 1, info.pathname.length);
                    info.contextPath = wa["contextPath"];
                    break;
                }
            }

            if (!info.webapp) { //No webapp found, abort
                res.sendNotFound();
                return;
            }

            //Call next() element in chain
            next();
        },

        /**
         * Save request params
         */
        __populateRequestParams : function(req, res, next) {

            if (sm.nsrv.HTTPUtils.isFormRequest(req)) {
                var form = req.form = new this.__formidable.IncomingForm();
                var fopts = this.__config["formdiableOptions"];
                if (fopts) {
                    qx.lang.Object.mergeWith(form, fopts);
                }
                form.parse(req, function(err, fields, files) {
                    form.fields = fields;
                    form.files = files;
                    next(err);
                });
            } else if (req.method == "GET") {
                req.form = req.form || {};
                var qs = req.info.query;
                if (qs) {
                    if (req.form.fields) {
                        qx.lang.Object.mergeWith(req.form.fields, this.__querystring.parse(qs), false);
                    } else {
                        req.form.fields = this.__querystring.parse(qs);
                    }
                }
                if (!req.form.fields) {
                    req.form.fields = {};
                }
                next();

            } else {
                //todo other requests forbidden?
                res.sendForbidden();
            }
        },

        /**
         * Creates connect server
         * based on its configuration
         *
         * @return {Server} Connect server
         */
        createConnectServer : function() {
            var me = this;
            var connect = $$node.require("connect");
            this.__server = connect.createServer(
                    function (req, res, next) {
                        me.__initRequestHandler(req, res, next);
                    },
                    function (req, res, next) {
                        me.__populateRequestParams(req, res, next);
                    },
                    function (req, res, next) {
                        me.__handleReq(req, res, next);
                    },
                    function (err, req, res, next) {
                        me.__handleError(err, req, res, next);
                    });

            return this.__server;
        },


        /**
         * Handle raw server request
         */
        handle : function(req, res, cb) {
            this.__server.handle(req, res, cb);
        }
    },

    destruct : function() {
        this.__config = this.__handlers = this.__vhostName = null;
        this.__path = this.__url = this.__formidable = this.__querystring = null;
        this.__server = null;
        //this._disposeObjects("__field_name");
    },

    defer : function(statics) {
        /**
         * List of template engines
         */
        statics.__tengines = {
            "*" : new sm.nsrv.tengines.StaticTemplateEngine(),
            "jz" : new sm.nsrv.tengines.JazzTemplateEngine()
        };
    }
});
