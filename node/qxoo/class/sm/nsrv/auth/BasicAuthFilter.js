/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.nsrv.auth.BasicAuthFilter", {
    extend  : qx.core.Object,

    statics:
    {
        HEADER: 'authorization',
        HEADER_MATCH: /^Basic\s(.*)/
    },

    events:
    {
    },

    properties:
    {
    },

    construct: function(options, userProvider, securityStore) {
        this.base(arguments);

        options = options || {};

        this.__realmName = options.realmName || 'NKServer';

        this.__userProvider = userProvider;
        if (!this.__userProvider) {
            throw new Error('UserProvider must be provided');
        }

        this.__securityStore = securityStore;
        if (!this.__securityStore) {
            throw new Error('SecurityStore must be provided');
        }

        this.__ignoreFailure = options.ignoreFailure || false;
    },

    members:
    {
        __realmName: null,
        __userProvider: null,
        __ignoreFailure: null,
        __security: null,

        authenticate: function(request, response, callback) {
            if (this.__securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else if (request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER]) {
                var header = request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER];
                var match = header.match(sm.nsrv.auth.BasicAuthFilter.HEADER_MATCH);
                if (match != null) {
                    var details = match[1];
                    var parts = new Buffer(details, 'base64').toString().split(/:/);
                    var login = parts[0];
                    var password = parts[1];

                    this.__userProvider.login(login, password, (function(scope) {
                        return function(err, user) {
                            if (!err && user) {
                                scope.__securityStore.setUser(request, user);
                                scope.success(request, response, callback);
                            } else {
                                scope.failure(request, response, callback);
                            }
                        }
                    })(this));
                } else {
                    this.failure(request, response, callback);
                }
            } else {
                this.failure(request, response, callback);
            }
        },

        success: function(request, response, callback) {
            callback();
        },

        failure: function(request, response, callback) {
            if (!this.__ignoreFailure) {
                this.commence(request, response, null);
            } else {
                callback();
            }
        },

        commence: function(request, response, error) {
            response.sendSCode(401, { 'WWW-Authenticate' : 'Basic realm="' + this.__realmName + '"' });
        }
    },

    destruct: function() {
        this.__realmName = this.__ignoreFailure = null;
        this._disposeObjects('__userProvider', '__securityStore');
    }
});