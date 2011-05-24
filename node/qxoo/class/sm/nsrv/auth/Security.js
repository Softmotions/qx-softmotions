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
              return (this.getUser(req) != null);
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
           * Получение списка ролей текущего пользователя
           * @return массив ролей, если пользователь аутентифицирован, [] (пустой массив) в противном случае
           */
          getRoles: function(req) {
              return (this.getUser(req) || {}).roles || [];
          },

          /**
           * Проверка наличия всех указанных ролей у пользователя
           */
          hasRoles: function(req, roles) {
              if (qx.lang.Type.isString(roles)) {
                  roles = [ roles ];
              }

              var uroles = this.getRoles(req);
              return roles.every(function(role) {
                  return uroles.some(function(userRole) {
                      return role == userRole;
                  });
              });
          },

          /**
           * Проверка наличия хотя бы одной из указанных ролей у пользователя
           */
          inRoles: function(req, roles) {
              if (qx.lang.Type.isString(roles)) {
                  roles = [ roles ];
              }

              var uroles = this.getRoles(req);
              return roles.some(function(role) {
                  return uroles.some(function(userRole) {
                      return role == userRole;
                  });
              });
          }
      },

      destruct: function() {
          this.__user_key = null;
      }
  });