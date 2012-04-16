/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * NodeJS MVC server
 */

qx.Class.define("sm.nsrv.NKServer", {
    extend  : qx.core.Object,

    events :
    {
        /**
         * Fired if NKServer started listening
         * data: NKServer instance
         */
        "started" : "qx.event.type.Data",

        /**
         * Fired if NKServer going to shutdown
         * data: NKServer instance
         */
        "goingshutdown" : "qx.event.type.Data",

        /**
         * Fired if VHostEngine was configured
         * Data: [sm.nsrv.VHostEngine, sm.nsrv.NKServer]
         */
        "configuredVHE" : "qx.event.type.Data"
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

        __venginesById : null,

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
            this.__venginesById = {};

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
                var vId = vconf["id"] || vconf["vhost"];
                this.__venginesById[vId] = this.__vengines[vhost] = new sm.nsrv.VHostEngine(vconf, vId, this);
            }
            if (this.__vengines["__default__"] && i > 1) {
                throw new Error("Ony one default virtual host must be configured");
            }
        },


        getDefaultVHE : function() {
            return this.getVHE["__default__"];
        },


        /**
         * Get virtual host engine (sm.nsrv.VHostEngine)
         * @param id {String} virtual host ID
         */
        getVHE : function(id) {
            return this.__venginesById[id];
        },


        getHTTPServer : function() {
            return this.__server;
        },

        /**
         * Server startup
         */
        startup : function(port, host, opts) {

            var me = this;
            if (this.__server) {
                this.shutdown(function() {
                    if (me.__server == null) {
                        me.startup(port, host, opts);
                    }
                });
                return;
            }

            opts = opts || {};
            port = port || 3000;
            host = host || null;
            qx.log.Logger.warn(this, "Starting web server at port: " + port + " on: " + (host || "INADDR_ANY"));

            var filters = opts["filters"];
            var connect = $$node.require("connect");
            var http = $$node.require("http");
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
                if (ve.getVHostName() === "__default__") {
                    if (i == vengines.length - 1) {
                        break;
                    }
                    //push default vhost to end of vhosts list
                    vengines.splice(i, 1);
                    vengines.push(ve);
                    break;
                }
            }

            for (var i = 0; i < vengines.length; ++i) {
                var ve = vengines[i];
                ve._setWebappsRuntimeOptions(opts["webapps"] || {});
                if (ve.getVHostName() == "__default__") {
                    chandlers.push(ve.createConnectApp());
                } else {
                    chandlers.push(connect.vhost(ve.getVHostName(), ve.createConnectApp()));
                }
                this.fireDataEvent("configuredVHE", [ve, this]);
                sm.nsrv.NKServerEvents.getInstance().fireDataEvent("configuredVHE", [ve, this]);
            }

            $$node.process.nextTick(
              (function() {
                  var capp = connect();
                  chandlers.forEach(function(h) {
                      capp.use(h);
                  });
                  this.__server = http.createServer(capp);
                  this.__server.listen(port, host);
                  this.fireDataEvent("started", this);
                  sm.nsrv.NKServerEvents.getInstance().fireDataEvent("started", this);
              }).bind(this));
        },

        /**
         * Server shutdown
         */
        shutdown : function(cb) {
            if (this.__server) {
                var me = this;
                this.fireDataEvent("goingshutdown", this);
                sm.nsrv.NKServerEvents.getInstance().fireDataEvent("goingshutdown", this);
                try {
					me.__server.once("close", function() {
						if (cb) {
							cb();
						}
					});
                    me.__server.close();
                } finally {
                    me.__server = null;                    
                }
                //});
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