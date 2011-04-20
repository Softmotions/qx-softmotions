/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Manage sm.mongo.Mongo instance as provided by
 * configuration object:
 *
 */

//Mongodb configuration example: 
// {
//    "db_name" : "mediahouse",
//    "db_host" : "localhost",
//    "db_port" : 27017,
//    "indexes"
//            :
//            [
//                {
//                    "collection" : "mediainfo",
//                    "unique" : true,
//                    "spec" : [
//                        ["file", 1]
//                    ]
//                },
//                {
//                    "collection" : "mediainfo",
//                    "spec" : [
//                        ["basename", 1]
//                    ]
//                },
//                {
//                    "collection" : "mediainfo",
//                    "spec" : [
//                        ["scanned", -1]
//                    ]
//                },
//                {
//                    "collection" : "mediainfo",
//                    "spec" : [
//                        ["minfo.TRACK", 1]
//                    ]
//                }
//            ]
//}

qx.Class.define("sm.mongo.MongoConfig", {
    extend  : qx.core.Object,

    properties :
    {
        config : {
            check : "Object",
            nullable : true,
            apply : "__applyConfig"
        }
    },

    construct : function(cfg) {
        this.base(arguments);
        this.setConfig(cfg);
    },

    members :
    {
        /**
         * sm.mongo.Mongo
         */
        __mongo : null,

        getMongo : function() {
            return this.__mongo;
        },

        __applyConfig : function(mcfg) {

            qx.core.Assert.assertObject(mcfg);

            var async = $$node.require("async");
            var me = this;

            if (this.__mongo) {
                /*var cinfo = this.__mongo.getConnectInfo();
                 needInit = (cinfo["dbname"] != mcfg["db_name"] ||
                 cinfo["host"] != mcfg["db_host"] ||
                 cinfo["port"] != mcfg["db_port"]);*/
                this.__mongo.close();
                this.__mongo = null;
            }

            qx.log.Logger.info(this, "Init mongodb connection: " + qx.util.Json.stringify(mcfg));
            this.__mongo = new sm.mongo.Mongo(mcfg["db_name"],
                                              mcfg["db_host"],
                                              mcfg["db_port"],
                                              {native_parser : !!mcfg["native_parser"]});
            this.__mongo.open(
                    function(err) {
                        if (err) {
                            return;
                        }
                        var ilist = mcfg["indexes"];
                        if (qx.lang.Type.isArray(ilist)) {
                            async.forEach(ilist, qx.lang.Function.bind(me.__ensureIndex, me),
                                          function(err) {
                                              if (err) {
                                                  qx.log.Logger.error(me, "Ensure index failed: " + err);
                                              }
                                          });
                        }
                    });
        },

        /**
         * Ensure index for config
         */
        __ensureIndex : function(cfg, cb) {
            var cname = cfg["collection"];
            var spec = cfg["spec"];
            if (!cname || !spec) {
                if (cb) {
                    cb();
                }
                return;
            }
            var coll = this.__mongo.collection(cname);
            coll.ensureIndex(spec, !!cfg["unique"], cb);
        }
    },

    destruct : function() {
        if (this.__mongo) {
            this.__mongo.close();
            this.__mongo = null;
        }
        //this._disposeObjects("__field_name");
    }
});