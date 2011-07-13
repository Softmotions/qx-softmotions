/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * NodeJS MVC server
 */

qx.Class.define("sm.nsrv.NKServer", {
      extend  : qx.core.Object,

      statics :
      {
         __CS_INTERCEPTORS : [],

         registerConnectServerConfigInterceptor : function(ic) {
             if (typeof ic == "function") {
                 this.__CS_INTERCEPTORS.push(ic);
             }
         }
      },

      events :
      {
          /**
           * Fired if NKServer started listening
           * data: NKServer instance
           */
         "startup" : "qx.event.type.Data",

          /**
           * Fired if NKServer going to shutdown
           * data: NKServer instance
           */
         "shutdown" : "qx.event.type.Data"
      },

      properties :
      {

      },

      construct : function(config) {
          this.base(arguments);
          this.__handlers = {};
          this.__applyConfig(config);
      },

      members :
      {

          /**
           * Connect server instance
           */
          __server : null,

          /**
           * Virtual host engines
           */
          __vengines : null,

          /**
           * Init server config
           */
          __applyConfig : function(config) {

              if (!qx.lang.Type.isArray(config)) {
                  throw new Error("Invalid configuration: must be array of vhost configs");
              }
              if (config.length == 0) {
                  throw new Error("Invalid configuration: no vhosts provided");
              }

              this.__vengines = {};

              var i = 0;
              for (; i < config.length; ++i) {
                  var vconf = config[i];
                  if (!qx.lang.Type.isObject(vconf)) {
                      throw new Error("Invalid vhost config: " + vconf);
                  }
                  if (!vconf["vhost"]) {
                      vconf["vhost"] = "__default__"; //default virtualhost name
                  }
                  var vhost = vconf["vhost"];
                  if (this.__vengines[vhost]) {
                      throw new Error("Duplicated vhost config, for virtual host: " + vhost);
                  }
                  this.__vengines[vhost] = new sm.nsrv.VHostEngine(vconf);
              }
              if (this.__vengines["__default__"] && i > 1) {
                  throw new Error("Ony one default virtual host must be configured");
              }
          },


          /**
           * Server startup
           */
          startup : function(port, host, filters) {

              var me = this;

              if (this.__server) {
                  this.shutdown(function() {
                    if (me.__server == null) {
                        me.startup(port, host, filters);
                    }
                  });
                  return;
              }

              port = port || 3000;
              host = host || "0.0.0.0";
              qx.log.Logger.info("Starting 'sm.nsrv.NKServer' server at port: " + port + " on address: " + host);

              var connect = $$node.require("connect");
              var chandlers = [];

              //Processing custom filters
              if (filters != null && filters.constructor === Array) {
                  for (var i = 0; i < filters.length; ++i) {
                      chandlers.push(filters[i]);
                  }
              }

              var vengines = qx.lang.Object.getValues(this.__vengines);
              for (var i = 0; i < vengines.length; ++i) {
                  var ve = vengines[i];
                  var srv = ve.createConnectServer();

                  //Postconfigure connect HTTP server by custom config interceptors
                  var ciInst = null;
                  var ci = this.self(arguments).__CS_INTERCEPTORS;
                  while (ci.length > 0 && (ciInst = ci.shift()) != null) {
                      try {
                          ciInst.call(ciInst, srv, this);
                      } catch(e) {
                          qx.log.Logger.error(this, e);
                      }
                  }

                  chandlers.push(this.__vhost(ve.getVHostName(), srv));
              }
              this.__server = new connect.HTTPServer(chandlers);
              this.__server.listen(port, host);
              this.fireDataEvent("startup", this);
          },

          __vhost : function(hostname, server) {
              if (!hostname) throw new Error('vhost hostname required');
              if (!server) throw new Error('vhost server required');
              var regexp = new RegExp('^' + hostname.replace(/[*]/g, '(.*?)') + '$');
              return function(req, res, next) {
                  var host = (req.headers.host && hostname != "__default__") ? req.headers.host.split(':')[0] : null;
                  if (host && (req.subdomains = regexp.exec(host))) {
                      req.subdomains = req.subdomains.slice(1);
                      server.emit("request", req, res, next);
                  } else if (hostname == "__default__") {
                      //default vhost recieves all requests
                      server.emit("request", req, res, next);
                  } else {
                      next();
                  }
              };
          },

          /**
           * Server shutdown
           */
          shutdown : function(cb) {
              if (this.__server) {
                  var me = this;
                  this.fireDataEvent("shutdown", this);
                  $$node.process.nextTick(function() {
                      qx.log.Logger.info("Shutdown 'sm.nsrv.NKServer'...");
                      try {
                          me.__server.close();
                      } finally {
                          me.__server = null;
                          if (cb) {
                              cb();
                          }
                      }
                  });
              } else if (cb) {
                  cb();
              }
          }
      },

      destruct : function() {
          var me = this;
          this.shutdown(function() {
              me._disposeMap("__vengines");
          });
      }
});