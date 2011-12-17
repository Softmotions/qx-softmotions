/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Implementations of this interface
 * will be created and initialted by {@link sm.app.IInitable#init()}
 * after {mh.Env} initialization
 */
qx.Interface.define("sm.app.IInitable", {

    members :
    {
        /**
         * Init function
         * @param env {sm.app.Env}
         * @param cb {function(err)} Called on init() completion
         */
        init : function(env, cb) {
            qx.core.Assert.assertObject(env);
            qx.core.Assert.assertFunction(cb);
        }

    }
});