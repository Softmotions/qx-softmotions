/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.nsrv.auth.FixedAuthFilter", {
    extend    : sm.nsrv.auth.AAuthFilter,
    implement : [sm.nsrv.auth.IAuthFilter],


    construct : function(options, userProvider, securityStore) {
        this.base(arguments, options, userProvider, securityStore);
        this.__user = options["user"];
        this.__password = options["password"];
    },

    members :
    {
        __user : null,
        __password : null,

        authenticate: function(request, response, callback) {
            if (this._securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else {
                var me = this;
                this._userProvider.login(this.__user, this.__password,
                        function(err, user) {
                            if (!err && user) {
                                me.login(request, response, user, callback);
                            } else {
                                me.failure(request, response, callback);
                            }
                        }
                );
            }
        },

        commence: function(request, response, error) {
            response.sendSCode(401, { "WWW-Authenticate" : "FixedAuthFilter" });
        }
    },

    destruct : function() {
        this.__user = this.__password = null;
        //this._disposeObjects("__field_name");
    }
});
