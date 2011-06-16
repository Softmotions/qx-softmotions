/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Mixin.define("sm.nsrv.auth.MUserProvider", {

      members:
      {
          /**
           * Resolve user roles considering role dependencies.
           *
           * @param allRoles {Array} Array of all available roles, in same format as: IUserProvider#getRolesList
           *        @see sm.nsrv.auth.IUserProvider#getRolesList
           * @param userRoles {Array} Array of user's roles ID
           *
           * @throws Error if invalid argument was passed
           */
          resoleUserRoles: function(allRoles, userRoles) {
              if (allRoles == null || allRoles.constructor !== Array ||
                userRoles == null || userRoles.constructor !== Array) {
                  throw new Error("Invalid argruments");
              }

              var collected = {};

              var findRoleById = function(roleId) {
                  for (var i = 0; i < allRoles.length; ++i) {
                      if (allRoles[i].id == roleId) {
                          return allRoles[i];
                      }
                  }
                  return null;
              };

              var resolveRole = function(role) {
                  if (role == null) {
                      return;
                  }
                  if (collected[role.id] === undefined) {
                      collected[role.id] = role;
                      if (role.parent && role.parent.constructor === Array) {
                          role.parent.forEach(function(prole) {
                              if (typeof prole === "string" && prole != role.id) {
                                  resolveRole(findRoleById(prole));
                              }
                          });
                      }
                  }
              };

              for (var i = 0; i < userRoles.length; ++i) {
                  resolveRole(findRoleById(userRoles[i]));
              }

              return Object.keys(collected); //Array if ids of resolved roles
          }
      }
  });
