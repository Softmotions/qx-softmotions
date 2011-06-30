/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.user.UsersExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, sm.nsrv.auth.MUserProvider, qx.locale.MTranslation],

      members :
      {

          __select_users : function(req, resp, ctx) {

              var me = this;
              var q = this.__build_basic_users_query(req.params);
              var rarr = [];
              q.each(
                function(index, doc) {
                    var item = {
                        "login" : doc["login"],
                        "name" : doc["name"],
                        "email" : doc["email"],
                        "disabled" :  doc["disabled"]
                    };
                    rarr.push(item);
                }).exec(function(err) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    me.writeJSONObject(rarr, resp, ctx);
                });
          },


          __select_users_count : function(req, resp, ctx) {
              var me = this;
              var q = this.__build_basic_users_query(req.params);
              q.count(function(err, count) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject(count, resp, ctx);
              });
          },


          __build_basic_users_query : function(params) {

              var coll = sm.cms.user.UsersMgr.getColl();
              var qp = {};
              var opts = {
                  sort : []
              };
              if (params["stext"] != null) {
                  var re = new RegExp("^" + qx.lang.String.escapeRegexpChars(params["stext"]) + ".*", "i");
                  qp["$or"] = [
                      {"login" : re},
                      {"name" : re}
                  ];
              }
              if (params["name"] != null) {
                  qp["name"] = params["name"];
              }
              if (params["login"] != null) {
                  qp["login"] = params["login"];
              }
              if (params["sortAsc"] != null) {
                  opts["sort"].push([params["sortAsc"], 1]);
              }
              if (params["sortDesc"] != null) {
                  opts["sort"].push([params["sortDesc"], -1]);
              }
              if (params["firstRow"] != null) {
                  var frow = parseInt(params["firstRow"]);
                  var lrow = parseInt(params["lastRow"]);
                  if (isNaN(frow) || isNaN(lrow)) {
                      throw new sm.nsrv.Message("Invalid request", true);
                  }
                  opts["skip"] = frow;
                  opts["limit"] = Math.abs(lrow - frow) + 1;
              } else {
                  if (params["limit"] != null) {
                      var limit = parseInt(params["limit"]);
                      if (isNaN(limit)) {
                          throw new sm.nsrv.Message("Invalid request", true);
                      }
                      opts["limit"] = limit;
                  }
                  if (params["skip"] != null) {
                      var skip = parseInt(params["skip"]);
                      if (isNaN(skip)) {
                          throw new sm.nsrv.Message("Invalid request", true);
                      }
                      opts["skip"] = skip;
                  }
              }

              opts["fields"] = {
                  "password" : 0
              };

              return coll.createQuery(qp, opts);
          },


          __create_user : function(req, resp, ctx) {
              this.__update_user_int(req, resp, ctx, true);
          },


          __update_user : function(req, resp, ctx) {
              this.__update_user_int(req, resp, ctx, false);
          },

          __update_user_int : function(req, resp, ctx, create) {

              var params = req.params;

              if (sm.lang.String.isEmpty(params["login"]) ||
                sm.lang.String.isEmpty(params["name"]) ||
                sm.lang.String.isEmpty(params["email"])
                ) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }
              var login = params["login"].trim();
              var name = params["name"].trim();
              var password = params["password"] ? params["password"].trim() : "";
              var email = params["email"].trim();

              var me = this;
              var env = sm.app.Env.getDefault();
              var sconf = env.getJSONConfig("security");
              var realm = sconf["adminRealm"] || "Admin";

              var coll = sm.cms.user.UsersMgr.getColl();
              coll.findOne({login : login}, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (create) {
                      if (doc) {
                          me.writeMessage(resp, ctx, "Пользователь с логином: " + login + " уже существует", true);
                          return;
                      }
                      doc = {
                          "login" : login,
                          "props" : {
                          }
                      };
                  } else if (!doc) {
                      me.writeMessage(resp, ctx, "Пользователь с логином: " + login + " не существует", true);
                      return;
                  }
                  doc["name"] = name;
                  if (password != "" && password != null) {
                      var crypto = $$node.require("crypto");
                      doc["password"] = crypto.createHash("MD5").update(password).digest("hex");
                      doc["digestPassword"] = crypto.createHash("MD5").update(login + ":" + realm + ":" + password).digest("hex");
                      doc["realmName"] = realm;
                  }
                  doc["email"] = email;
                  coll.save(doc, {safe : true}, function(err, udoc) {
                      if (err) {
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      me.writeJSONObject(doc["_id"] == null ? udoc : doc, resp, ctx);
                  });
              });
          },


          __update_user_role : function(req, resp, ctx) {

              var login = req.params["ref"];
              var role = req.params["role"];
              if (sm.lang.String.isEmpty(login) ||
                sm.lang.String.isEmpty(role)) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }

              var active = (req.params["active"] == "true");
              var me = this;
              var coll = sm.cms.user.UsersMgr.getColl();

              coll.update({"login" : login},
                (active == true) ? {$addToSet : {"roles" : role}} : {$pull : {"roles" : role}},
                {upsert: false, safe : true}, function(err, doc) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    me.__select_user_roles_internal(req, {login : login, nodesc : true}, function(err, roles) {
                        if (err) {
                            me.handleError(resp, ctx, err);
                            return;
                        }
                        var present = false;
                        for (var i = 0; i < roles.length; ++i) {
                            if (roles[i][0] == role) {
                                present = roles[i][2]; //checked flag
                                break;
                            }
                        }
                        if (present && !active) { //Tryed to remove role but, other roles force it
                            var msg = me.tr("Роль %1 не снята с пользователя, поскольку, другие явно назначенные роли предполагают ее наличие.", role);
                            resp.messages.push(new sm.nsrv.Message(msg));
                        }

                        me.writeJSONObject(roles, resp, ctx);

                        if (active) {
                            sm.cms.Events.getInstance().fireDataEvent("userAssignedToRole", [login, role]);
                        } else if (!active && !present) {
                            sm.cms.Events.getInstance().fireDataEvent("roleRemovedFromUser", [login, role]);
                        }
                    });
                });
          },

          /**
           * Response: [roleId {String}, roleName {String}, assigned to user {Boolean}]
           */
          __select_user_roles : function(req, resp, ctx) {

              if (!qx.lang.Type.isString(req.params["ref"])) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }
              var me = this;
              this.__select_user_roles_internal(req, {login : req.params["ref"]}, function(err, roles) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject(roles, resp, ctx);
              })
          },

          __select_user_roles_internal : function(req, opts, cb) {

              if (opts["login"] == null) {
                  cb("Invalid options", null);
                  return;
              }
              var login = opts["login"];
              var me = this;
              var coll = sm.cms.user.UsersMgr.getColl();
              coll.findOne({login : login}, function(err, user) {
                  if (err) {
                      cb(err, null);
                      return;
                  }
                  if (!user) {
                      cb("No user: " + login, null);
                      return;
                  }
                  req.allRoles(function(err, allRoles) {
                      if (err) {
                          cb(err, null);
                          return;
                      }
                      var res = [];
                      var implicitRoles = (user.roles != null && user.roles.constructor === Array) ? user.roles : [];
                      var userRoles = me.resolveUserRoles(allRoles, implicitRoles);
                      for (var i = 0; i < allRoles.length; ++i) {
                          var rnode = allRoles[i];
                          res.push([rnode["id"],
                              (rnode["desc"] != null && !opts["nodesc"] ? rnode["desc"] : ""),
                              (userRoles.indexOf(rnode["id"]) != -1),
                              (implicitRoles.indexOf(rnode["id"]) != -1)]);
                      }
                      cb(null, res);
                  });
              });
          },

          __select_roles : function(req, resp, ctx) {
              var me = this;
              req.allRoles(function(err, allRoles) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject(allRoles, resp, ctx);
              });
          }
      },

      handlers :
      {
          /**
           * Retrieve users
           */
          "/select/users" : {
              webapp : "adm",
              handler : "__select_users"
          },

          /**
           * Retrive users count
           */
          "/select/users/count" : {
              webapp : "adm",
              handler : "__select_users_count"
          },

          /**
           * Roles for specified user
           */
          "/select/user/roles" : {
              webapp : "adm",
              handler : "__select_user_roles"
          },

          /**
           * All roles available for users
           */
          "/select/roles" : {
              webapp : "adm",
              handler : "__select_roles"
          },

          /**
           * Create new user
           */
          "/create/user" : {
              webapp : "adm",
              handler : "__create_user"
          },

          /**
           * Update existing user
           */
          "/update/user" : {
              webapp : "adm",
              handler : "__update_user"
          },

          /**
           * Update user role
           */
          "/update/user/role" : {
              webapp : "adm",
              handler : "__update_user_role"
          }

      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });

