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
    },

    events :
    {
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
        startup : function(port, host) {
            if (this.__server) {
                try {
                    this.__server.close();
                } catch(e) {
                }
            }

            port = port || 3000;
            host = host || "0.0.0.0";
            qx.log.Logger.info("Starting 'sm.nsrv.NKServer' server at port: " + port + " on address: " + host);

            var connect = $$node.require("connect");

            var vhost = function(hostname, server) {
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
            };
            var chandlers = [];
            var vengines = qx.lang.Object.getValues(this.__vengines);
            for (var i = 0; i < vengines.length; ++i) {
                var ve = vengines[i];
                chandlers[i] = vhost(ve.getVHostName(), ve.createConnectServer());
            }
            this.__server = new connect.HTTPServer(chandlers);
            this.__server.listen(port, host);
        },

        /**
         * Server shutdown
         */
        shutdown : function() {
            if (this.__server) {
                qx.log.Logger.info("Shutdown 'sm.nsrv.NKServer'...");
                try {
                    this.__server.close();
                } finally {
                    this.__server = null;
                }
            }
        }
    },

    destruct : function() {
        this.shutdown();
        this.__server = null;
        this._disposeMap("__vengines");
    }
});