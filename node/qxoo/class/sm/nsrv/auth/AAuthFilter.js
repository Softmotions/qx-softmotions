/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.nsrv.auth.AAuthFilter", {
    type      : 'abstract',
    extend    : qx.core.Object,
    implement : sm.nsrv.auth.IAuthFilter,

    /**
     * @param options Опции фильтра:
     *      <code>ignoreFailure<code>   - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
     *                                    По умолчанию <code>false</code>
     * @param userProvider  менеджер пользователей
     * @param securityStore хранилице авторизованных пользователей
     */
    construct: function(options, userProvider, securityStore) {
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
        __ignoreFailure: null,

        login: function(request, response, user, callback) {
            this.__securityStore.setUser(request, user);
            this.success(request, response, callback);
        },

        logout: function(request, response, callback) {
            this.__securityStore.setUser(request, null);
            callback();
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
        }
    },

    destruct: function() {
        this.__ignoreFailure = null;
        this._disposeObjects('__userProvider', '__securityStore');
    }
});
