/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
/**
 * Реализация фильтра авторизации, для авторизации c использованием формы
 */
qx.Class.define("sm.nsrv.auth.FormAuthFilter", {
      extend    : sm.nsrv.auth.AAuthFilter,
      implement : [sm.nsrv.auth.IAuthFilter],

      /**
       * @param options Опции фильтра:
       *      <code>formUrl</code>            - адрес формы авторизации. Обязательный.
       *      <code>actionParameter</code>    - имя параметра запроса, содержащего название действия. По умолчанию <code>'action'</code>
       *      <code>action</code>             - название действия авторизации. По умолчанию <code>'login'</code>
       *      <code>loginParameter</code>     - имя параметра запроса, содержащего логин. По умолчанию <code>'login'</code>
       *      <code>passwordParameter</code>  - имя параметра запроса, содержащего пароль. По умолчанию <code>'password'</code>
       *      <code>ignoreFailure<code>       - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
       *                                        По умолчанию <code>false</code>
       * @param userProvider  менеджер пользователей
       * @param securityStore хранилице авторизованных пользователей
       */
      construct: function(options, userProvider, securityStore) {
          options = options || {};
          this.base(arguments, options, userProvider, securityStore);

          this.__cookies = $$node.require('cookies');
          this.__crypto = $$node.require('crypto');

          this.__formUrl = options.formUrl;
          if (!this.__formUrl) {
              throw new Error('FormUrl must be provided');
          }

          this.__actionParameter = options.actionParameter || 'action';
          this.__actionName = options.action || 'login';
          this.__loginParameter = options.loginParameter || 'login';
          this.__passwordParameter = options.passwordParameter || 'password';
          if (options.rememberMe) {
              this.__remember = {};
              this.__remember.parameter = options.rememberMe.parameterName || 'rememberMe';
              this.__remember.value = options.rememberMe.parameterValue || 'true';
              this.__remember.secret = options.rememberMe.secret || '_nkserver_formAuth_remember_secrect_';
              this.__remember.cookie = options.rememberMe.cookieName || 'nkserver_remember';
              this.__remember.validFor = options.rememberMe.validFor || 1814400000; // 21 days
          }
      },

      members:
      {
          __formUrl: null,
          __actionParameter: null,
          __actionName: null,
          __loginParameter: null,
          __passwordParameter: null,
          __remember: null,
          __cookies: null,

          authenticate: function(request, response, callback) {
              var doAuth = (function(me) {
                  return function() {
                      if (me.__securityStore.isAuthenticated(request)) {
                          me.success(request, response, callback);
                      } else if (request.params[me.__actionParameter] && me.__actionName == request.params[me.__actionParameter]) {
                          var login = request.params[me.__loginParameter];
                          var password = request.params[me.__passwordParameter];
                          me.__userProvider.login(login, password, (function(scope) {
                              return function(err, user) {
                                  if (!err && user) {
                                      scope.login(request, response, user, callback);
                                  } else {
                                      scope.failure(request, response, callback);
                                  }
                              }
                          })(me));
                      } else if (request.info.pathname == me.__formUrl) {
                          me.success(request, response, callback);
                      } else {
                          me.failure(request, response, callback);
                      }
                  }
              })(this);

              if (this.__remember) {
                  this.__tryAutoLogin(request, doAuth);
              } else {
                  doAuth();
              }

          },

          __tryAutoLogin: function(request, callback) {
              var cookies = new this.__cookies(request);
              var token = cookies.get(this.__remember.cookie);
              if (!token) {
                  callback();
                  return;
              }

              for (var i = 0; i < token.length % 4; i++) {
                  token = token + '=';
              }

              var parts = new $$node.Buffer(token, 'base64').toString().split(/:/);
              if (parts[1] >= new Date()) {
                  this.__userProvider.getAuthInfo(parts[0], (function(scope) {
                      return function(err, user) {
                          if (!err && user && user.user) {
                              var hash = scope.__hash(user.login, parts[1], scope.__remember.secret);
                              if (hash === parts[2]) {
                                  scope.__securityStore.setUser(request, user.user)
                              }
                              callback();
                          }
                      };
                  })(this));
              } else {
                  callback();
              }
          },

          login: function(request, response, user, callback) {
              if (this.__remember && request.params[this.__remember.parameter] == this.__remember.value) {
                  var cookies = new this.__cookies(request, response);

                  var validTo = +new Date() + this.__remember.validFor;
                  var hash = this.__hash(user.login, validTo, this.__remember.secret);
                  var token = new $$node.Buffer(user.login + ':' + validTo + ':' + hash).toString('base64');
                  while (token[token.length - 1] === '=') {
                      token = token.substring(0, token.length - 1);
                  }

                  cookies.set(this.__remember.cookie, token, {expires : new Date(validTo)});
              }

              this.base(arguments, request, response, user, callback);
          },

          logout: function(request, response, callback) {
              if (this.__remember) {
                  var cookies = new this.__cookies(request, response);
                  cookies.set(this.__remember.cookie);
              }

              this.base(arguments, request, response, callback);
          },

          commence: function(request, response, error) {
              response.sendSCode(302, { 'Location' : this.__formUrl });
          },

          __hash: function(user, validTo, secret) {
              // TODO: надо что-нить хитрое встаивить в серединку хэша.
              return this.__crypto
                .createHash('md5')
                .update(user + ':' + ':' + validTo + ':' + secret)
                .digest('hex');
          }
      },

      destruct: function() {
          this.base(arguments);
          this.__formUrl = null;
          this.__actionParameter = this.__actionName = this.__loginParameter = this.__passwordParameter = null;
          this.__crypto = this.__cookies = null;
          this._disposeObjects('__remember');
      }
  });