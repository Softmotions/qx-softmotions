/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Virtual host managers
 */
qx.Class.define("sm.nsrv.VHostEngine", {
      extend  : qx.core.Object,

      statics :
      {
          /**
           * Array of extra assembly providers
           */
          __asmProvider : null,

          registerAssemblyProvider : function(provider) {
              if ((typeof provider) != "function") {
                  qx.log.Logger.warn(this, "Assembly provider must be a function()");
                  return;
              }
              this.__asmProvider = provider;
          }
      },

      events :
      {
      },

      properties :
      {
      },

      construct : function(config) {
          //required libs
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
           * Template engines
           */
          __tengines : null,

          /**
           * Web handlers storage
           */
          __handlers : null,

          /**
           * Web handlers for regexp matching
           */
          __regexpHandlers : null,

          /**
           * Web assembly config
           */
          __assembly : null,

          /**
           * Current connect server
           */
          __server : null,

          /**
           * Security (by webapps)
           */
          __security : null,

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


              this.__tengines = {
                  "*" : new sm.nsrv.tengines.StaticTemplateEngine(),
                  "jz" : new sm.nsrv.tengines.JazzTemplateEngine()
              };

              if (config["templateOptions"] != null) {
                  var topts = config["templateOptions"];
                  for (var tn in this.__tengines) {
                      var te = this.__tengines[tn];
                      if (te.classname == null) {
                          continue;
                      }
                      var to = topts[te.classname];
                      if (to) {
                          te.set(to);
                      }
                  }
              }


              if (!this.__vhostName) {
                  throw new Error("Invalid vhost config: " + qx.util.Json.stringify(this.__config));
              }
              if (!qx.lang.Type.isArray(this.__config["webapps"])) {
                  throw new Error("Invalid vhost config, webapps section must be array: " + qx.util.Json.stringify(this.__config));
              }
              var wapps = this.__config["webapps"];

              var wappsIds = {};
              var wappsCtx = {};

              this.__security = {};

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
                  if (!this.__path.existsSync(dr) || !$$node.fs.statSync(dr).isDirectory()) {
                      throw new Error("The 'docRoot': " + wa["docRoot"] + " is not directory");
                  }

                  // configure security
                  if (wa["security"]) {
                      var sconf = wa["security"];
                      var security = this.__security[wa["id"]] = {};
                      var securityStore = security._securityStore = sm.nsrv.auth.Security.getSecurity({key: sconf["securityKey"]});

                      if (!sconf["userProvider"] || !sconf["userProvider"]["type"]) {
                          throw new Error("Missing user provider type in config: " + qx.util.Json.stringify(this.__config));
                      }

                      var uconf = sconf["userProvider"];
                      var upName = uconf["type"];
                      var upClass;
                      if (qx.lang.Type.isString(upName)) {
                          upClass = qx.Class.getByName(upName);
                      } else if (qx.lang.Type.isFunction(upName)) {
                          upClass = upName;
                      }
                      if (!upClass || !qx.lang.Type.isFunction(upClass)) {
                          throw new Error("Invalid user provider type in config: " + qx.util.Json.stringify(this.__config));
                      }

                      var userProvider = security._userProvider = new upClass(uconf["options"]);

                      if (!sconf["auth"] || !sconf["auth"]["type"]) {
                          throw new Error("Missing auth filter type in config: " + qx.util.Json.stringify(this.__config));
                      }

                      var aconf = sconf["auth"];
                      var aName = aconf["type"];
                      var aClass;
                      if (qx.lang.Type.isString(aName)) {
                          aClass = qx.Class.getByName(aName);
                      } else if (qx.lang.Type.isFunction(aName)) {
                          aClass = aName;
                      }
                      if (!aClass || !qx.lang.Type.isFunction(aClass)) {
                          throw new Error("Invalid auth filter type in config: " + qx.util.Json.stringify(this.__config));
                      }
                      security.__filter = new aClass(aconf["options"], userProvider, securityStore);
                  }
              }

              //Sort webapp configs accordingly to its 'context' length
              //longer prefix first
              wapps.sort(function(w1, w2) {
                  return (w2["context"].length - w1["context"].length);
              });

              if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                  qx.log.Logger.debug("VHost[" + this.__vhostName + "] config: " + qx.util.Json.stringify(this.__config));
              }

              this.__loadHandlers();
              this.__loadAssembly();
          },

          /**
           * Returns configuration of webapp identified by __id__
           * If nothing found returns __null__
           *
           * @param id {String ?} if __null__ default webapp ID will be used
           * @return {Map}
           */
          __getWebappConfig : function(id, failIfNotfound) {

              if (failIfNotfound == null) {
                  failIfNotfound = true;
              }
              var me = this;
              var wapp = (function () {
                  if (id == null) {
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
              if (!wapp && failIfNotfound) {
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
              if (ret === undefined) {
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

          loadAssembly : function(name, cb) {
              if ((typeof name) != "string") {
                  cb("Invalid assembly name: " + name, null);
                  return;
              }
              var asm = this.__assembly[name];
              if (asm) {
                  cb(null, asm, null);
                  return;
              }
              var provider = this.self(arguments).__asmProvider;
              if (!provider) {
                  cb("Assembly: " + name + " not found", null);
                  return;
              }
              try {
                  provider(this, name, cb);
              } catch(e) {
                  cb(e, null);
              }
          },

          getBuiltInAssemblyMap : function() {
              return this.__assembly ? this.__assembly : {};
          },

          /**
           * Load web assembly
           */
          __loadAssembly : function() {

              this.__assembly = {};

              for (var k in qx.Bootstrap.$$registry) {
                  var clazz = qx.Bootstrap.$$registry[k];
                  if (!clazz || !clazz.prototype) {
                      continue;
                  }
                  var assembly = clazz.prototype["$$assembly"];
                  if (!assembly) {
                      continue;
                  }
                  var wappId = null;
                  for (var asn in assembly) {
                      if (asn == "_webapp_") {
                          wappId = assembly[asn];
                      }
                  }
                  if (!wappId) {
                      qx.log.Logger.warn(this, "No webapp configured in assembly class: " + k);
                  }
                  var wc = this.__getWebappConfig(wappId, false);
                  if (!wc) {
                      continue; //Now our webapp
                  }
                  for (var asn in assembly) {
                      if (asn == "_webapp_") {
                          continue;
                      }
                      if (this.__assembly[asn]) {
                          qx.log.Logger.warn(this, "Found duplicated assembly item: '" + asn + "' class: " + k);
                      }
                      this.__assembly[asn] = assembly[asn];
                  }
              }

              //Postprocess assembly
              for (var asn in this.__assembly) {
                  if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                      qx.log.Logger.debug("Loaded assembly: '" + asn + "' class: " + k +
                        " [" + this.__vhostName + "]:[" + wappId + "]");
                  }
                  var asm = this.__assembly[asn];
                  asm["_name_"] = asn;
                  if (asm["_ctx_provider_"]) {
                      asm["_ctx_provider_stack_"] = [asm["_ctx_provider_"]];
                  }
                  for (var esm = (asm["_extends_"] ? this.__assembly[asm["_extends_"]] : null);
                       esm; esm = (esm["_extends_"] ? this.__assembly[esm["_extends_"]] : null)) {
                      //Context provider staff
                      if (qx.lang.Type.isFunction(esm["_ctx_provider_"])) {
                          var ep = esm["_ctx_provider_"];
                          var pstack = asm["_ctx_provider_stack_"];
                          if (!qx.lang.Type.isArray(pstack)) {
                              pstack = asm["_ctx_provider_stack_"] = [];
                          }
                          if (pstack.indexOf(ep) == -1) {
                              pstack.unshift(ep);
                          }
                      }
                      //Merge assembly props
                      var name = asm["name"]; //do not extend name attr
                      qx.lang.Object.carefullyMergeWith(asm, esm);
                      asm["name"] = name;
                  }
                  delete asm["_ctx_provider_"];

                  if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                      qx.log.Logger.debug("Assembly '" + asn + "':\n" +
                        JSON.stringify(asm, true));
                  }
              }

              //Replace _extends_ string ref by real assembly instance
              for (var asn in this.__assembly) {
                  var asm = this.__assembly[asn];
                  if (asm["_extends_"]) {
                      asm["_extends_"] = this.__assembly[asm["_extends_"]];
                  }
                  if (asm["_extends_"] == asm) {
                      delete asm["_extends_"];
                  }
              }
          },


          /**
           * Load request handlers index
           */
          __loadHandlers : function() {

              this.__handlers = {};
              this.__regexpHandlers = [];

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
                          if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                              qx.log.Logger.debug("Handler: '" + k + "#" + (hconf["handler"]) +
                                "()' attached: [" + this.__vhostName + "]:[" + wappId + "]:" + hl);
                          }

                          var reMatching = ("regexp" == hconf["matching"]);

                          if (!reMatching) {
                              var hlSlot = this.__handlers[hl];
                              if (hlSlot) {
                                  qx.log.Logger.warn(this, "Handler: '" + hlSlot["$$class"] + "#" + (hlSlot["handler"]) +
                                    "()' replaced by: " + (k + "#" + hconf["handler"] + "()"));
                              }
                              this.__handlers[hl] = hconf;
                          } else {
                              hconf["$$re"] = new RegExp(lArr[i]);
                              this.__regexpHandlers.push(hconf);
                          }

                          hconf["$$class"] = k;
                          hconf["$$instance"] = hinstance;
                      }
                  }
              }
          },

          getTemplateEngineForExt : function(ext) {
              return this.__tengines[ext];
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

              if (qx.core.Environment.get("sm.nsrv.debug") == true) {
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
              var tengine = this.__tengines[ext];
              if (!tengine) {
                  tengine = this.__tengines["*"]; //use sm.nsrv.tengines.StaticTemplateEngine
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

              if (req.info.webapp["headers"] != null) { //Apply custom headers by pattern matching
                  var cheaders = req.info.webapp["headers"];
                  for (var hk in cheaders) {
                      var hspec = cheaders[hk];
                      if (hspec.$$re === undefined) {
                          hspec.$$re = new RegExp(hk);
                      }
                      if (hspec.$$re.test(req.info.path)) {
                          for (var hname in hspec) {
                              if (hname == "$$re" || headers[hname] != null) {
                                  continue;
                              }
                              headers[hname] = hspec[hname];
                          }
                      }
                  }
              }

              //write template
              if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                  qx.log.Logger.debug("Merging: '" + path + "', template engine: " + tengine);
              }

              var me = this;
              tengine.createTemplate(path, function(err, template) {
                  if (err) {
                      qx.log.Logger.error(me, "Failed template, path: " + path, err);
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
              if (!hconf) { //try to find regexp handler
                  var path = req.info.path;
                  for (var i = 0; i < this.__regexpHandlers.length; ++i) {
                      var rh = this.__regexpHandlers[i];
                      if (rh["$$re"].test(path)) {
                          hconf = rh;
                          break;
                      }
                  }
              }
              var me = this;
              var ctx = function(forward) {
                  if (forward && forward["terminated"] == true) {
                      return; //response must be managed by executor
                  }
                  ctx.collectMessageHeaders();
                  me.__renderTemplate(req, res, ctx, forward);
              };

              ctx._vhost_engine_ = this;

              /**
               * Stores messages into response headers
               * Return true if found message errors
               */
              ctx.collectMessageHeaders = function(ignoreScode) {
                  var errC = me.__messageHeaders(res);
                  if (errC > 0 && !ignoreScode) {
                      //todo review status code
                      res.statusCode = 500;
                      return true;
                  } else {
                      return false;
                  }
              };
              if (req.$$ctxParams) {
                  for (var k in req.$$ctxParams) {
                      if (ctx[k] === undefined) {
                          ctx[k] = req.$$ctxParams[k];
                      }
                  }
              }

              if (hconf) { //found handlers

                  var hinst = hconf["$$instance"];
                  var exec = hinst[hconf["handler"]];
                  if (!qx.lang.Type.isFunction(exec)) {
                      throw new Error("No handler function: " + hconf["handler"] + " in " + hconf["$$class"]);
                  }
                  if (qx.core.Environment.get("sm.nsrv.debug") == true) {
                      qx.log.Logger.debug("Executing handler: '" + hconf["$$class"] + "#" + (hconf["handler"]) + "()");
                  }

                  var callback = function() {
                      try {
                          exec.call(hinst, req, res, ctx);
                      } catch(e) {
                          var report = true;
                          if (e instanceof sm.nsrv.Message) {
                              report = e.isError();
                          }
                          if (report) {
                              qx.log.Logger.warn(this, "Handler: " + hconf["$$class"] + "#" + (hconf["handler"]) + "() throws exception: " + e.message);
                          }
                          next(e);
                      }
                  };

                  var security;
                  var secured = this.__getHconfValue(hconf, "secured");
                  var roles = this.__getHconfValue(hconf, "roles") || [];

                  if (qx.core.Environment.get("sm.nsrv.security.suppress") == true) {
                      callback();
                  } else if ((secured || hconf["logout"]) && (security = this.__security[this.__getHconfValue(hconf, "webapp")])) {
                      if (hconf["logout"]) {
                          security.__filter.logout(req, res, callback);
                      } else {
                          security.__filter.authenticate(req, res, function(err) {
                              if (err || !req.isUserHasRoles(roles)) {
                                  res.sendForbidden();
                                  return;
                              }
                              callback();
                          });
                      }
                  } else {
                      callback();
                  }

                  return;
              }

              ctx(null);
          },


          /**
           * Flush message headers into response
           */
          __messageHeaders : function(res) {

              //skip saving message headers in internal responses
              if (res.internal === true || !qx.lang.Type.isArray(res.messages)) {
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
              if (errC > 0 || nerrC > 0) {
                  res.messages = []; //Reset msg array
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
              var body = (errOpts["showErrorMsg"] && !errOpts["messagesInHeaders"]) ? err.toString() : "";
              //todo review status code
              res.writeHead((message && errC == 0) ? 200 : 500, headers);
              res.end(body);

          },

          /**
           * Initiate request
           */
          __initRequestHandler : function(req, res, next) {
              var me = this;
              //Response messages
              res.messages = res.messages || [];

              //Response headers to be merged
              res.headers = res.headers || {};

              res.sendSCode = function(scode, headers, data) {
                  headers = headers || {};
                  qx.lang.Object.carefullyMergeWith(headers, { "Content-Type": "text/plain" });
                  res.writeHead(scode, headers);
                  res.end((typeof(data) === "string") ? data : "");
              };
              res.sendNotFound = function(headers, data) {
                  res.sendSCode(404, headers, data);
              };
              res.sendForbidden = function(headers, data) {
                  res.sendSCode(403, headers, data);
              };
              res.sendError = function(headers, data) {
                  res.sendSCode(500, headers, data);
              };
              res.sendOk = function(headers, data) {
                  res.sendSCode(200, headers, data);
              };
              res._implicitHeader = function() {// TODO: for session compatibility
              };

              if (qx.core.Environment.get("sm.nsrv.access-control-allow") == true) {
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
                  if (info.pathname == "/" && this.__config["rootRedirect"]) { //if root redirect defined
                      res.sendSCode(301, {"Location" : this.__config["rootRedirect"]});
                  } else {
                      res.sendNotFound();
                  }
                  return;
              }

              var security = this.__security[info.webapp.id];
              req.isAuthenticated = function() {
                  if (qx.core.Environment.get("sm.nsrv.security.suppress") == true) {
                      return true;
                  } else {
                      return security && security._securityStore ? security._securityStore.isAuthenticated(this) : false;
                  }
              };
              req.getUser = function() {
                  return security && security._securityStore ? security._securityStore.getUser(this) : null;
              };
              req.getUserId = function() {
                  var user = this.getUser();
                  return user != null ? user.login : null;
              };
              req.getUserRoles = function() {
                  return security && security._securityStore ? security._securityStore.getRoles(this) : [];
              };
              req.isUserHasRoles = function(roles) {
                  if (qx.core.Environment.get("sm.nsrv.security.suppress") == true) {
                      return true;
                  } else {
                      return security && security._securityStore ? security._securityStore.hasRoles(this, roles) : false;
                  }
              };
              req.isUserInRoles = function(roles) {
                  if (qx.core.Environment.get("sm.nsrv.security.suppress") == true) {
                      return true;
                  } else {
                      return security && security._securityStore ? security._securityStore.inRoles(this, roles) : false;
                  }
              };

              //Call next() element in chain
              next();
          },

          /**
           * Save request params
           */
          __populateRequestParams : function(req, res, next) {
              var isFormRequest = sm.nsrv.HTTPUtils.isFormRequest(req);
              if (req.method == "GET" || isFormRequest) {
                  req.params = req.params || {};
                  var qs = req.info.query;
                  if (qs) {
                      qx.lang.Object.mergeWith(req.params, this.__querystring.parse(qs), false);
                  }
                  if (isFormRequest) {
                      var form = req.form = new this.__formidable.IncomingForm();
                      var fopts = this.__config["formdiableOptions"];
                      if (fopts) {
                          qx.lang.Object.mergeWith(form, fopts, true);
                      }
                      form.parse(req, function(err, fields, files) {
                          qx.lang.Object.mergeWith(req.params, fields, true);
                          form.files = files;
                          next(err);
                      });
                  } else {
                      next();
                  }
              } else {
                  //todo other requests forbidden?
                  res.sendForbidden();
              }
              if (!req.outerParams) {
                  req.outerParams = req.params;
              }
              req.stripParams = function(prefix) {
                  var res = {};
                  for (var k in req.outerParams) {
                      if (prefix && prefix.length > 0) {
                          if (k.indexOf(prefix) == 0) {
                              res[k.substring(prefix.length)] = req.outerParams[k];
                          }
                      } else {
                          res[k] = req.outerParams[k];
                      }
                  }
                  return res;
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
              var conf = this.__config;

              var cookieParser = connect.cookieParser();
              var session = connect.session({secret: (conf["sessionSecret"] || "5bb1097b24bd420a82ef4e916e864a48")});

              this.__server = connect.createServer(
                function (req, res, next) {
                    if (req.internal === true) {
                        next()
                    } else {
                        cookieParser(req, res, next);
                    }
                },
                function (req, res, next) {
                    if (req.internal === true) {
                        next()
                    } else {
                        session(req, res, next);
                    }
                },
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
          handle : function(req, res, ctxParams, cb) {
              req.internal = res.internal = true;
              if (ctxParams) {
                  if (qx.lang.Type.isObject(req.$$ctxParams)) {
                      qx.lang.Object.mergeWith(req.$$ctxParams, ctxParams);
                  } else {
                      req.$$ctxParams = ctxParams;
                  }
              }
              this.__server.handle(req, res, cb);
          }
      },

      destruct : function() {
          this.__config = this.__handlers = this.__regexpHandlers = this.__vhostName = null;
          this.__path = this.__url = this.__formidable = this.__querystring = null;
          this.__server = null;
          //this._disposeObjects("__field_name");
      },

      defer : function(statics) {
      }
  });
