qx.Mixin.define("sm.app.MApplyInitable", {

    properties :
    {
        "applyConfigName" : {
            check : "String",
            init : "areg",
            nullable : false
        }
    },

    members :
    {
        init : function(env, cb) {
            var me = this;
            env.getJSONConfigTemplate(me.getApplyConfigName(), function(err, treg) {
                if (err) {
                    cb(err);
                    return;
                }
                var tasks = [];
                var areg = env.getJSONConfig(me.getApplyConfigName());
                Object.keys(treg).forEach(function(akey) {
                    if (areg[akey]) {  //Already applied
                        return;
                    }
                    var amethodName = "apply" + akey;
                    var amethod = me[amethodName];
                    if (typeof amethod !== "function") {
                        //qx.log.Logger.error(me, "Apply method: " + amethodName + " does not exists");
                        return;
                    }
                    tasks.push(function(_cb) {
                        qx.log.Logger.warn(me, "Applying: " + akey + " ...");
                        try {
                            amethod.call(me, env, function(err) {
                                if (err) {
                                    qx.log.Logger.error(me, "Apply method: " + amethodName + " failed", err);
                                } else {
                                    areg[akey] = true; //Mark amethod as applied
                                }
                                _cb(err);
                            });
                        } catch(e) {
                            if (e) {
                                qx.log.Logger.error(me, "Apply method: " + amethodName + " failed", e);
                            }
                            _cb(e);
                        }
                    });
                });
                var async = $$node.require("async");
                async.series(tasks, function() {
                    env.setJSONConfig(me.getApplyConfigName(), areg, function() {
                        cb();
                    });
                });
            });
        }
    }
});