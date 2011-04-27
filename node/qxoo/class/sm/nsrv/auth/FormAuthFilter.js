/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Реализация фильтра авторизации, для авторизации c использованием формы
 */
qx.Class.define("sm.nsrv.auth.FormAuthFilter", {
    extend  : qx.core.Object,
    implement: [sm.nsrv.auth.IAuthFilter],
    include : [sm.nsrv.auth.MAuthFilter],

    /**
     * @param options Опции фильтра:
     *      <code>formUrl</code>            - адрес формы авторизации. Обязательный.
     *      <code>actionParameter</code>    - имя параметра запроса, содержащего название действия. По умолчанию <code>'action'</code>
     *      <code>action</code>             - название действия авторизации. По умолчанию <code>'login'</code>
     *      <code>loginParameter</code>     - имя параметра запроса, содержащего логин. По умолчанию <code>'login'</code>
     *      <code>passwordParameter</code>  - имя параметра запроса, содержащего пароль. По умолчанию <code>'password'</code>
     *      <code>ignoreFailure<code>       - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
     *                                        По умолчанию <code>false</code>
     * @param userProvider  менеджер пользователей
     * @param securityStore хранилице авторизованных пользователей
     */
    construct: function(options, userProvider, securityStore) {
        this.base(arguments);

        options = options || {};

        this.__formUrl = options.formUrl;
        if (!this.__formUrl) {
            throw new Error('FormUrl must be provided');
        }

        this.__actionParameter = options.actionParameter || 'action';
        this.__actionName = options.action || 'login';
        this.__loginParameter = options.loginParameter || 'login';
        this.__passwordParameter = options.passwordParameter || 'password';

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
        __userProvider: null,
        __securityStore: null,
        __formUrl: null,
        __actionParameter: null,
        __actionName: null,
        __loginParameter: null,
        __passwordParameter: null,

        authenticate: function(request, response, callback) {
            if (this.__securityStore.isAuthenticated(request)) {
                this.success(request, response, callback);
            } else if (request.params[this.__actionParameter] && this.__actionName == request.params[this.__actionParameter]){
                var login = request.params[this.__loginParameter];
                var password = request.params[this.__passwordParameter];
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
            } else if (request.info.pathname == this.__formUrl) {
                this.success(request, response, callback);
            } else {
                this.failure(request, response, callback);

            }
        },

        commence: function(request, response, error) {
            response.sendSCode(302, { 'Location' : this.__formUrl });
        }
    },

    destruct: function() {
        this.__formUrl = this.__ignoreFailure = null;
        this.__actionParameter = this.__actionName = this.__loginParameter = this.__passwordParameter = null;
        this._disposeObjects('__userProvider', '__securityStore');
    }
});