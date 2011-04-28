/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Реализация фильтра авторизации, для авторизации по методу HTTP-Basic
 */
qx.Class.define("sm.nsrv.auth.BasicAuthFilter", {
    extend  : qx.core.Object,
    implement: [sm.nsrv.auth.IAuthFilter],
    include : [sm.nsrv.auth.MAuthFilter],

    statics:
    {
        /**
         * Название заголовка запроса со строкой авторизации
         */
        HEADER: 'authorization',
        /**
         * Шаблон для заголовка авторизации
         */
        HEADER_MATCH: /^Basic\s(.*)/
    },

    /**
     * @param options Опции фильтра:
     *      <code>realmName</code>      - название области авторизации. По умолчанию <code>"NKServer"</code>
     *      <code>ignoreFailure<code>   - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
     *                                    По умолчанию <code>false</code>
     * @param userProvider  менеджер пользователей
     * @param securityStore хранилице авторизованных пользователей
     */
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
        __securityStore: null,

        authenticate: function(request, response, callback) {
            if (this.__securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else if (request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER]) {
                var header = request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER];
                var match = header.match(sm.nsrv.auth.BasicAuthFilter.HEADER_MATCH);
                if (match != null) {
                    var details = match[1];
                    var parts = new $$node.Buffer(details, 'base64').toString().split(/:/);
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

        commence: function(request, response, error) {
            response.sendSCode(401, { 'WWW-Authenticate' : 'Basic realm="' + this.__realmName + '"' });
        }
    },

    destruct: function() {
        this.__realmName = this.__ignoreFailure = null;
        this._disposeObjects('__userProvider', '__securityStore');
    }
});