/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Mixin.define("sm.nsrv.auth.MAuthFilter", {

    members:
    {
        __ignoreFailure: null,

        success: function(request, response, callback) {
            callback();
        },

        failure: function(request, response, callback) {
            if (!this.__ignoreFailure) {
                this.commence(request, response, null);
            } else {
                callback();
            }
        }
    }
});
