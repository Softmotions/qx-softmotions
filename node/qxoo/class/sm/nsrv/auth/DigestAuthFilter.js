/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.nsrv.auth.DigestAuthFilter", {
    extend  : qx.core.Object,
    implement: [sm.nsrv.auth.IAuthFilter],

    statics:
    {
        HEADER: 'authorization',
        HEADER_MATCH: /^Digest\s(.*)/
    },

    construct: function(options, userProvider, securityStore) {
        this.base(arguments);

        this.__crypto = $$node.require('crypto');

        options = options || {};

        this.__realmName = options.realmName || 'NKServer';
        this.__nonceExpire = options.nonceExpire || 1800000;
        this.__opaque = this.buildHash(options.opaque || this.__realmName);

        this.__userProvider = userProvider;
        if (!this.__userProvider) {
            throw new Error('UserProvider must be provided');
        }
        this.__securityStore = securityStore;

        if (!this.__securityStore) {
            throw new Error('SecurityStore must be provided');
        }
        this.__ignoreFailure = options.ignoreFailure || false;

        this.__nonces = {};
    },

    members:
    {
        __realmName: null,
        __userProvider: null,
        __ignoreFailure: null,
        __securityStore: null,
        __nonces: null,
        __nonceExpire: null,

        authenticate: function(request, response, callback) {
            if (this.__securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else if (request.headers[sm.nsrv.auth.DigestAuthFilter.HEADER]) {
                var header = request.headers[sm.nsrv.auth.DigestAuthFilter.HEADER];
                var match = header.match(sm.nsrv.auth.DigestAuthFilter.HEADER_MATCH);
                if (match != null) {
                    var authinfo = this.__parseHeaderString(match[1]);
                    if (authinfo === false || !authinfo.username) {
                        this.failure(request, response, callback);
                        return;
                    }

                    // check for expiration
                    if (!(authinfo.nonce in this.__nonces)) {
                        this.failure(request, response, callback);
                        return;
                    }

                    this.__userProvider.getAuthInfo(
                            authinfo.username,
                            (function(scope, auth) {
                                return function(err, user) {
                                    if (!err && user) {
                                        if (auth.algorithm == 'MD5-sess') {
                                            // TODO: implement MD5-sess
                                            scope.failure(request, response, callback);
                                            return;
                                        }

                                        if (auth.qop == 'auth-int') {
                                            // TODO: implement auth-int
                                            scope.failure(request, response, callback);
                                            return;
                                        }

                                        var ha1;
                                        if (user.realmName) {
                                            if (user.realmName == scope && user.digestPassword) {
                                                // get HA1 from user provider
                                                ha1 = user.digestPassword;
                                            } else {
                                                this.failure(request, response, callback);
                                                return;
                                            }
                                        } else {
                                            if (user.plainPassword) {
                                                // calculate HA1
                                                ha1 = scope.buildHash(user.login + ':' + scope.__realmName + ':' + user.plainPassword)
                                            } else {
                                                this.failure(request, response, callback);
                                                return;
                                            }
                                        }

                                        // calculate a2
                                        var ha2 = scope.buildHash(request.method + ':' + auth.uri);

                                        // calculate request digest
                                        var digest;
                                        if (!('qop' in auth)) {
                                            // For RFC 2069 compatibility
                                            digest = scope.buildHash(ha1 + ':' + auth.nonce + ':' + ha2);
                                        } else {
                                            if (auth.nc <= scope.__nonces[auth.nonce].count) {
                                                scope.failure(request, response, callback);
                                                return;
                                            }
                                            scope.__nonces[auth.nonce].count = auth.nc;
                                            digest = scope.buildHash(ha1 + ':' + auth.nonce + ':' + auth.nc + ':' + auth.cnonce + ':' + auth.qop + ':' + ha2);
                                        }

                                        if (digest == auth.response) {
                                            scope.__securityStore.setUser(request, user);
                                            scope.success(request, response, callback);
                                        } else {
                                            scope.failure(request, response, callback);
                                        }
                                    } else {
                                        scope.failure(request, response, callback);
                                    }
                                }
                            })(this, authinfo));
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
            var nonce = this.buildHash(new Date().getTime() + this.__realmName);
            this.__nonces[nonce] = {count: 0};
            setTimeout(
                    (function(scope) {
                        return function(dnonce) {
                            delete scope.__nonces[dnonce]
                        }
                    })(this),
                    this.__nonceExpire,
                    nonce);

            response.sendSCode(401, { 'WWW-Authenticate': 'Digest realm="' + this.__realmName + '", qop="auth", nonce="' + nonce + '", opaque="' + this.__opaque + '"' });
        },

        buildHash: function(data) {
            return this.__crypto
                    .createHash('MD5')
                    .update(data)
                    .digest('hex');
        },

        // node-http-digest::parse_header_string
        __parseHeaderString: function (header) {
            var dict = {};
            var first = true;
            while (header.length > 0) {
                // eat whitespace and comma
                if (first) {
                    first = false;
                } else {
                    if (header[0] != ",") {
                        return false;
                    }
                    header = header.slice(1);
                }
                header = header.trimLeft();

                // parse key
                var key = header.match(/^\w+/);
                if (key === null) {
                    return false;
                }
                key = key[0];
                header = header.slice(key.length);

                // parse equals
                var eq = header.match(/^\s*=\s*/);
                if (eq === null) {
                    return false;
                }
                header = header.slice(eq[0].length);

                // parse value
                var value;
                if (header[0] == "\"") {
                    // quoted string
                    value = header.match(/^"([^"\\\r\n]*(?:\\.[^"\\\r\n]*)*)"/);
                    if (value === null) {
                        return false;
                    }
                    header = header.slice(value[0].length);
                    value = value[1];
                } else {
                    // unquoted string
                    value = header.match(/^[^\s,]+/);
                    if (value === null) {
                        return false;
                    }
                    header = header.slice(value[0].length);
                    value = value[0];
                }
                dict[key] = value;

                // eat whitespace
                header = header.trimLeft();
            }

            return dict;
        }
    },

    destruct: function() {
        this.__crypto = null;
        this.__realmName = this.__ignoreFailure = this.__nonceExpire = null;
        this._disposeObjects('__userProvider', '__securityStore', '__nonces');
    }
});