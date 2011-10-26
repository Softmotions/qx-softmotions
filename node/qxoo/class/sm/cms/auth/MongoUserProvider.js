/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Users and roles store using mongodb as backend
 */
qx.Class.define('sm.cms.auth.MongoUserProvider', {
    extend  : qx.core.Object,
    include : [sm.nsrv.auth.MUserProvider],
    implement : [sm.nsrv.auth.IUserProvider],

    construct: function(options) {
        this.base(arguments);
        this.__crypto = $$node.require("crypto");
        this.__rolesColl = options["rolesCollection"] || "roles";
        this.__usersColl = options["usersCollection"] || "users";
    },

    members:
    {
        __crypto: null,
        __rolesColl: null,
        __usersColl: null,

        login: function(login, password, callback) {
            var me = this;
            var env = sm.app.Env.getDefault();
            env.getMongo()
              .collection(this.__usersColl)
              .findOne({"login": login, "password": me.buildHash(password)},
              function(err, user) {
                  if (err || user == null || user["disabled"] == true) {
                      callback(err, null);
                      return;
                  }
                  if (!user.roles) {
                      user.roles = [];
                  }
                  me.buildUserData(user, callback);
              });
        },

        getAuthInfo: function(login, callback) {
            var me = this;
            var env = sm.app.Env.getDefault();
            env.getMongo()
              .collection(this.__usersColl)
              .findOne({"login": login},
              function(err, user) {
                  err || !user ? callback(err, null) : me.buildUserAuth(user, callback);
              });
        },

        getRolesList : function(callback) {
            var env = sm.app.Env.getDefault();
            var roles = [];
            env.getMongo()
              .collection(this.__rolesColl)
              .createQuery()
              .each(function(index, role) {
                  roles.push(role);
              })
              .exec(function(err) {
                  callback(err, roles)
              });
        },

        buildHash: function(data) {
            return this.__crypto
              .createHash('MD5')
              .update(data)
              .digest('hex');
        },

        buildUserData: function(user, callback) {
            var result = {login: user.login};
            var me = this;
            me.getRolesList(function(err, allRoles) {
                if (err) {
                    callback(err, null);
                } else {
                    result.roles = me.resolveUserRoles(allRoles, user.roles);
                    callback(null, result);
                }
            });
        },

        buildUserAuth: function(user, callback) {
            var result = {login: user.login};
            if (user.realmName != null) {
                result.realmName = user.realmName;
                result.digestPassword = user.digestPassword;
            } else {
                result.plainPassword = user.plainPassword;
            }

            var me = this;
            me.buildUserData(user, function(err, udata) {
                if (err) {
                    callback(err, null);
                } else {
                    result.user = udata;
                    callback(null, result);
                }
            });
        }
    },

    destruct: function() {
        this.__crypto = null;
        this.__rolesColl = this.__usersColl = null;
    }
});