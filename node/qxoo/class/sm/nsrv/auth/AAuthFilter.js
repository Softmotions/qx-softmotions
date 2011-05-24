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
          this._userProvider = userProvider;
          if (!this._userProvider) {
              throw new Error('UserProvider must be provided');
          }

          this._securityStore = securityStore;
          if (!this._securityStore) {
              throw new Error('SecurityStore must be provided');
          }

          this._ignoreFailure = !!options["ignoreFailure"];
      },

      members:
      {
          _userProvider: null,
          _securityStore: null,
          _ignoreFailure: false,

          login: function(request, response, user, callback) {
              this._securityStore.setUser(request, user);
              this.success(request, response, callback);
          },

          logout: function(request, response, callback) {
              this._securityStore.setUser(request, null);
              callback();
          },

          success: function(request, response, callback) {
              callback();
          },

          failure: function(request, response, callback) {
              if (!this._ignoreFailure) {
                  this.commence(request, response, null);
              } else {
                  callback();
              }
          }
      },

      destruct: function() {
          this._userProvider = this._securityStore = null;
      }
  });
