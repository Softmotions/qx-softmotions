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
        this.__rolesColl = options["rolesCollection"] || "roles";
        this.__usersColl = options["usersCollection"] || "users";
        this.__hashFormat = options["hashFormat"] || "md5";
    },

    members:
    {
        __rolesColl: null,
        __usersColl: null,
        __hashFormat : null,

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
                  if (err || !user) {
                      callback(err, null);
                      return;
                  }
                  if (user.roles == null || user.roles.constructor !== Array) {
                      user.roles = [];
                  }
                  me.buildUserAuth(user, callback);
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
            return $$node.require("crypto").createHash(this.__hashFormat).update(data).digest("hex");
        },

        buildUserData: function(user, callback) {
            var result = {login: user.login};
            var me = this;
            me.getRolesList(function(err, allRoles) {
                if (err) {
                    callback(err, null);
                } else {
                    result.roles = me.resolveUserRoles(allRoles, user.roles || []);
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
        this.__rolesColl = this.__usersColl = this.__hashFormat = null;
    }
});