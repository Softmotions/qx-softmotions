/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Реализация фильтра авторизации, для авторизации по методу HTTP-Basic
 */
qx.Class.define("sm.nsrv.auth.BasicAuthFilter", {
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
        options = options || {};
        this.base(arguments, options, userProvider, securityStore);

        this.__realmName = options.realmName || 'NKServer';
    },

    members:
    {
        __realmName: null,

        authenticate: function(request, response, callback) {
            if (this._securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else if (request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER]) {
                var header = request.headers[sm.nsrv.auth.BasicAuthFilter.HEADER];
                var match = header.match(sm.nsrv.auth.BasicAuthFilter.HEADER_MATCH);
                if (match != null) {
                    var details = match[1];
                    var parts = new $$node.Buffer(details, 'base64').toString().split(/:/);
                    var login = parts[0];
                    var password = parts[1];

                    this._userProvider.login(login, password, (function(scope) {
                        return function(err, user) {
                            if (!err && user) {
                                scope.login(request, response, user, callback);
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
        this.base(arguments);
        this.__realmName = null;
    }
});