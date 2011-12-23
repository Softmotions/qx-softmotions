/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Пример менеджера пользователей
 */
qx.Class.define('sm.nsrv.auth.InMemoryUserProvider', {
    extend  : qx.core.Object,
    include : [sm.nsrv.auth.MUserProvider],
    implement : [sm.nsrv.auth.IUserProvider],


    construct: function(options) {
        this.base(arguments);

        var me = this;

        var roles = options.roles || [];
        this.__roles = [];
        for (var i = 0; i < roles.length; ++i) {
            if (typeof roles[i].parent === "string") {
                roles[i].parent = [roles[i].parent];
            }
            this.__roles.push(roles[i]);
        }


        var users = options.users || [];
        this.__users = {};
        users.forEach(function(user) {
            me.__users[user.login] = { login: user.login, password: user.password, roles: user.roles || [] };
        });
    },

    members:
    {
        __roles: null,
        __users: null,

        login: function(login, password, callback) {
            var user = login ? this.__users[login] : null;
            if (user && user.password == password) {
                callback(null, {login: user.login, roles: this.resolveUserRoles(this.__roles, user.roles)});
            } else {
                callback(null, null);
            }
        },

        getAuthInfo: function(login, callback) {
            var user = this.__users[login];
            if (!user) {
                callback(null, null);
                return;
            }
            var ai = {
                login: user.login,
                plainPassword: user.password,
                user: { login: user.login, roles: this.resolveUserRoles(this.__roles, user.roles)}
            };
            callback(null, ai);
        },

        getRolesList: function(callback) {
            callback(null, this.__roles);
        }
    },

    destruct: function() {
        this.__roles = this.__users = null;
    }
});