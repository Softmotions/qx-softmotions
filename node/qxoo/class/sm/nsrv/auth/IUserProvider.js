/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Interface.define("sm.nsrv.auth.IUserProvider", {
    members :
    {
        login: function(login, password, callback) {},
        getAuthInfo: function(login, callback){},
        getRolesList: function(callback) {}
    }
});