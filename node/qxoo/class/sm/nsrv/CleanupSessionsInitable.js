/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.nsrv.CleanupSessionsInitable", {
    extend  : qx.core.Object,
    implement : [sm.app.IInitable],

    members :
    {
        __checkInterval : null,

        init : function(env) {
            if (this.__checkInterval) {
                clearInterval(this.__checkInterval);
            }
            var me = this;
            var cfg = env.getJSONConfig("http");
            var sessionCfg = (cfg["webapps"] || {})["session"] || {};
            var ims = parseInt(sessionCfg["cleanupInterval"]);
            if (isNaN(ims)) {
                ims = 3600000; //1hour
            }
            qx.log.Logger.info(this, "Setup sessions cleanup interval: " + ims + " ms");
            var cleanupFun = function() {
                var cdate = +new Date();
                var scoll = env.getMongo().collection(sessionCfg["collection"] || "sessions");
                scoll.remove({"expires" : {$lt : cdate}}, function(err, count) {
                    if (err) {
                        qx.log.Logger.error(me, err);
                    } else if (count > 0) {
                        qx.log.Logger.info(me, "Removed: " + count + " expired sessions");
                    }
                });
            };
            this.__checkInterval = setInterval(cleanupFun, ims);
            cleanupFun(); //Call it directly
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
        if (this.__checkInterval) {
            try {
                clearInterval(this.__checkInterval);
            } catch(e) {
                qx.log.Logger.warn(this, e);
            } finally {
                this.__checkInterval = null;
            }
        }
    }
});

