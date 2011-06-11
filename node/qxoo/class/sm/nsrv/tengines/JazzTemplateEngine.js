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


      construct : function() {
          this.base(arguments);
          this.__path = $$node.require("path");
          this.__util = $$node.require("util");
          this.__jazz = $$node.require("jazz");

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
              me.__path.exists(path, function(exists) {
                  if (!exists) {
                      cb(null, {"path" : path, "notfound" : true});
                      return;
                  }
                  $$node.fs.stat(path, function(err, stat) {
                      if (err || !stat.isFile()) {
                          cb(null, {"path" : path, "notfound" : true});
                          return;
                      }
                      //checking the cache
                      var cached = me.__tcache[path];
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
                          "jazz" : jazzTemplate};

                      me.__tcache[path] = template;
                      cb(null, template);
                  });
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
              ctx["_global_"] = window;
              ctx["_ctx_"] = ctx;
              ctx["_req_"] = req;
              ctx["_res_"] = res;
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
                  var _cb = arguments[arguments.length - 1];
                  sm.nsrv.tengines.JazzCtxLib.assembly(vhe, me, ctx, _name, _params, _ctxParams, _cb);
              };
              ctx["_A"] = function() {
                  var _name = arguments[0];
                  var _def = arguments.length > 2 ? arguments[1] : null;
                  var _cb = arguments[arguments.length - 1];
                  sm.nsrv.tengines.JazzCtxLib.assemblyArg(vhe, me, ctx, _name, _def, _cb);
              };
              ctx["_utils_"] = sm.nsrv.tengines.JazzCtxLib.utils();

              try {
                  tjazz.process(ctx,
                    function(data, opts, dynamic) { //Mediator todo FIXME XHTML mediator hardcoded!!!
                        if (data == null || !dynamic || (opts && opts["escaping"] === false)) {
                            return data;
                        }
                        //qx.log.Logger.info("Escape data: " + data + " esc=" + sm.lang.String.escapeXML(data));
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
              var me = this;
              this.mergeTemplateInternal(vhe, template, req, res, ctx, headers, function(nf, err, data) {
                  if (nf) { //Notfound
                      res.sendNotFound(headers);
                      return;
                  }
                  if (err) {
                      res.sendError();
                      return;
                  }
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
