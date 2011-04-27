/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Хранилище авторизованных пользователей
 */
qx.Class.define("sm.nsrv.auth.Security", {
    extend  : qx.core.Object,

    statics:
    {
        $$instances: {},

        /**
         * Получение экземпляра хранилища
         * @param options параметры хранилища:
         *      <code>key</code>    - ключ хранилища. По умолчанию <code>'general'</code>
         */
        getSecurity: function(options) {
            var key = options.key || 'general';
            if (!sm.nsrv.auth.Security.$$instances[key]) {
                sm.nsrv.auth.Security.$$instances[key] = new sm.nsrv.auth.Security(options['key']);
            }

            return sm.nsrv.auth.Security.$$instances[key];
        }
    },

    construct: function(key) {
        this.base(arguments);

        this.__user_key = '__nsrv_user_' + key;
    },

    members:
    {
        __user_key: null,

        /**
         * Проверка аутентификации пользователя
         */
        isAuthenticated: function(req) {
            return this.getUser(req) != null;
        },

        /**
         * Получение аутентифицированного пользователя из хранилища
         */
        getUser: function(req) {
            if (!req.session) {
                throw new Error('Security requires sessions to work');
            }
            return req.session[this.__user_key];
        },

        /**
         * Запись в хранилище аутентифицированного пользователя
         */
        setUser: function(req, user) {
            if (!req.session) {
                throw new Error('Security requires sessions to work');
            }
            if (user) {
                req.session[this.__user_key] = user;
            } else {
                delete req.session[this.__user_key];
            }
        },

        /**
         * Проверка наличия всех указанных ролей у пользователя
         */
        hasRoles: function(req, roles) {
            if (qx.lang.Type.isString(roles)) {
                roles = [ roles ];
            }

            var user = this.getUser(req) || {};
            if (user.roles) {
                return roles.every(function(role) {
                    return user.roles.some(function(userRole) {
                        return role == userRole;
                    });
                });
            }
            return false;
        }

    },

    destruct: function() {
        this.__user_key = null;
    }
});