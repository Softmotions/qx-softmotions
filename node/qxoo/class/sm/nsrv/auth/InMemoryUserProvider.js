/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define('sm.nsrv.auth.InMemoryUserProvider', {
    extend  : qx.core.Object,
    include : [sm.nsrv.auth.MUserProvider],
    implement : [sm.nsrv.auth.IUserProvider],

    construct: function(options) {
        this.base(arguments);

        var idx;

        var roles = options.roles || [];
        this.__roles = [];
        for(idx in roles) {
            var role = roles[idx];
            this.__roles[role.id] = role;
        }

        var users = options.users || [];
        this.__users = [];
        for(idx in users) {
            var user = users[idx];
            this.__users[user.login] = { login: user.login, password: user.password, roles: user.roles || [] };
        }
    },

    members:
    {
        __roles: null,
        __users: null,

        login: function(login, password, callback) {
            var user = this.__users[login];
            if (!user) {
                callback(null, null);
            }

            if (user.password != password) {
                callback(null, null);
            }

            callback(null, {login: user.login, roles: this.getUserRoles(this.__roles, user.roles)});
        },

        getRolesList: function(callback) {
            callback(null, this.__roles);
        }
    },

    destruct: function() {
        this.__roles = this.__users = null;
    }
});