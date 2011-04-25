/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Interface.define("sm.nsrv.auth.IAuthFilter", {
    members:
    {
        authenticate: function(request, response, callback){},
        commence: function(request, response, error) {}
    }
});