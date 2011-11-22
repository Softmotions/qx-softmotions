/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Реализация фильтра авторизации, для авторизации по методу HTTP-Digest
 */
qx.Class.define("sm.nsrv.auth.DigestAuthFilter", {
    extend    : sm.nsrv.auth.AAuthFilter,
    implement : [sm.nsrv.auth.IAuthFilter],

    statics:
    {
        /**
         * Название заголовка запроса со строкой авторизации
         */
        HEADER: 'authorization',
        /**
         * Шаблон для заголовка авторизации
         */
        HEADER_MATCH: /^Digest\s(.*)/
    },

    /**
     * @param options Опции фильтра:
     *      <code>realmName</code>      - название области авторизации. По умолчанию <code>"NKServer"</code>
     *      <code>nonceExpire<code>     - время хранения уникальных ключей авторизации, генерируемых сервером (в миллисекундах). По умолчанию 30 минут
     *      <code>opaque<code>          - дополнительная строка проверки авторизации. По умолчанию совпадает с <code>realmName</code>
     *      <code>ignoreFailure<code>   - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
     *                                    По умолчанию <code>false</code>
     * @param userProvider  менеджер пользователей
     * @param securityStore хранилице авторизованных пользователей
     */
    construct: function(options, userProvider, securityStore) {
        options = options || {};
        this.base(arguments, options, userProvider, securityStore);

        this.__crypto = $$node.require('crypto');

        this.__realmName = options.realmName || 'NKServer';
        this.__nonceExpire = options.nonceExpire || 1800000;
        this.__opaque = this.buildHash(options.opaque || this.__realmName);

        this.__nonces = {};
    },

    members:
    {
        __realmName: null,
        __nonces: null,
        __nonceExpire: null,

        authenticate: function(req, res, cb) {
            if (this._securityStore.isAuthenticated(req)) {
                this.success(req, res, cb);
            } else if (req.headers[sm.nsrv.auth.DigestAuthFilter.HEADER]) {
                var header = req.headers[sm.nsrv.auth.DigestAuthFilter.HEADER];
                var match = header.match(sm.nsrv.auth.DigestAuthFilter.HEADER_MATCH);
                if (match != null) {
                    var authinfo = this.__parseHeaderString(match[1]);
                    if (authinfo === false || !authinfo.username) {
                        this.failure(req, res, cb);
                        return;
                    }
                    // check for expiration
                    if (!(authinfo.nonce in this.__nonces)) {
                        this.failure(req, res, cb);
                        return;
                    }
                    this._userProvider.getAuthInfo(
                            authinfo.username,
                            (function(scope, auth) {
                                return function(err, user) {
                                    if (!err && user && user.user) {
                                        if (auth.qop == 'auth-int') {
                                            // TODO: implement auth-int
                                            scope.failure(req, res, cb);
                                            return;
                                        }

                                        var ha1;
                                        if (user.realmName) {
                                            if (user.realmName == scope.__realmName && user.digestPassword) {
                                                // get HA1 from user provider
                                                ha1 = user.digestPassword;
                                            } else {
                                                scope.failure(req, res, cb);
                                                return;
                                            }
                                        } else {
                                            if (user.plainPassword) {
                                                // calculate HA1
                                                ha1 = scope.buildHash(user.login + ':' + scope.__realmName + ':' + user.plainPassword)
                                            } else {
                                                scope.failure(req, res, cb);
                                                return;
                                            }
                                        }

                                        if (auth.algorithm == 'MD5-sess') {
                                            // RFC 2617 (MD5-sess)
                                            ha1 = scope.buildHash(ha1 + ':' + auth.nonce + ':' + auth.cnonce);
                                        }

                                        // calculate a2
                                        var ha2 = scope.buildHash(req.method + ':' + auth.uri);

                                        // calculate request digest
                                        var digest;
                                        if (!('qop' in auth)) {
                                            // For RFC 2069 compatibility
                                            digest = scope.buildHash(ha1 + ':' + auth.nonce + ':' + ha2);
                                        } else {
                                            var nonceCount = parseInt(auth.nc, 16);
                                            if (nonceCount <= scope.__nonces[auth.nonce].count) {
                                                scope.failure(req, res, cb);
                                                return;
                                            }
                                            scope.__nonces[auth.nonce].count = nonceCount;
                                            digest = scope.buildHash(ha1 + ':' + auth.nonce + ':' + auth.nc + ':' + auth.cnonce + ':' + auth.qop + ':' + ha2);
                                        }

                                        if (digest == auth.response) {
                                            scope.login(req, res, user.user, cb);
                                        } else {
                                            scope.failure(req, res, cb);
                                        }
                                    } else {
                                        scope.failure(req, res, cb);
                                    }
                                }
                            })(this, authinfo));
                } else {
                    this.failure(req, res, cb);
                }
            } else {
                this.failure(req, res, cb);
            }
        },

        commence: function(req, res, err) {
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
            res.sendSCode(401,
                    { 'WWW-Authenticate': 'Digest realm="' + this.__realmName + '", qop="auth", nonce="' + nonce + '", opaque="' + this.__opaque + '"' });
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
        this.base(arguments);
        this.__crypto = null;
        this.__realmName = this.__nonceExpire = null;
        this._disposeObjects('__nonces');
    }
});