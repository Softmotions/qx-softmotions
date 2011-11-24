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
     *      <code>actionParameter</code>    - имя параметра запроса, содержащего название действия. По умолчанию <code>"action"</code>
     *      <code>action</code>             - название действия авторизации. По умолчанию <code>"login"</code>
     *      <code>loginParameter</code>     - имя параметра запроса, содержащего логин. По умолчанию <code>"login"</code>
     *      <code>passwordParameter</code>  - имя параметра запроса, содержащего пароль. По умолчанию <code>"password"</code>
     *      <code>ignoreFailure<code>       - следует ли игнорировать необходимость авторизации, то есть доступ неавторизованных пользователй к ресурсу.
     *                                        По умолчанию <code>false</code>
     * @param userProvider  менеджер пользователей
     * @param securityStore хранилице авторизованных пользователей
     */
    construct: function(options, userProvider, securityStore) {
        options = options || {};
        this.base(arguments, options, userProvider, securityStore);

        this.__cookies = $$node.require("cookies");
        this.__formUrl = options.formUrl;
        if (!this.__formUrl) {
            throw new Error("formUrl parameter must be provided");
        }
        this.__actionParameter = options["actionParameter"] || "action";
        this.__actionName = options["action"] || "login";
        this.__loginParameter = options["loginParameter"] || "login";
        this.__passwordParameter = options["passwordParameter"] || "password";
        this.__saveUrlKey = options["saveUrlKey"] || "fb411864d4fa48499ae84e77e6c5c119";
        this.__pageOnSuccess = options["pageOnSuccess"] || null;
        if (options.rememberMe) {
            var rmi = options.rememberMe;
            var rmb = this.__remember = {};
            rmb.parameter = rmi["parameterName"] || "rememberMe";
            rmb.value = rmi["parameterValue"] || "true";
            rmb.secret = rmi["secret"] || "a59324da04984a888bb986cda221646c";
            rmb.cookie = rmi["cookieName"] || "38a101c662b84f218870ab0784705b67";
            rmb.validFor = rmi["validFor"] || 1814400000; // 21 days
        }
    },

    members:
    {
        __formUrl: null,
        __actionParameter: null,
        __actionName: null,
        __loginParameter: null,
        __passwordParameter: null,
        __pageOnSuccess : null,
        __remember: null,
        __cookies: null,
        __saveUrlKey : null,

        authenticate: function(req, res, cb) {
            if (this._securityStore.isAuthenticated(req)) {
                this.success(req, res, cb);
                return;
            }
            var me = this;
            var doAuth = function() {
                if (me._securityStore.isAuthenticated(req)) {
                    me.success(req, res, cb);
                    return;
                }
                if (req.params[me.__actionParameter] && me.__actionName == req.params[me.__actionParameter]) {
                    var login = req.params[me.__loginParameter];
                    var password = req.params[me.__passwordParameter];
                    me._userProvider.login(login, password,
                            function(err, user) {
                                if (!err && user) {
                                    me.login(req, res, user, cb);
                                } else {
                                    me.failure(req, res, cb);
                                }
                            }
                    );
                } else if (req.info.pathname == me.__formUrl) {
                    me.success(req, res, cb);
                } else {
                    me.failure(req, res, cb);
                }
            };
            if (this.__remember) {
                this.__tryAutoLogin(req, doAuth);
            } else {
                doAuth();
            }
        },

        __tryAutoLogin: function(req, cb) {
            var me = this;
            var cookies = new this.__cookies(req);
            var token = cookies.get(this.__remember.cookie);
            if (!token) {
                cb();
                return;
            }
            for (var i = 0; i < token.length % 4; i++) {
                token = token + "=";
            }
            var parts = new $$node.Buffer(token, "base64").toString().split(/:/);
            if (parts[1] < new Date()) {
                cb();
                return;
            }
            this._userProvider.getAuthInfo(parts[0], function(err, user) {
                if (!err && user && user.user) {
                    var hash = me.__hash(user.login, parts[1], me.__remember.secret);
                    if (hash === parts[2]) {
                        me._securityStore.setUser(req, user.user)
                    }
                    cb();
                }
            });
        },

        login: function(req, res, user, cb) {
            var me = this;
            if (this.__remember != null && req.params[this.__remember.parameter] == this.__remember.value) {
                (function() {
                    var cookies = new me.__cookies(req, res);
                    var validTo = +new Date() + (me.__remember.validFor || 0);
                    var hash = me.__hash(user.login, validTo, me.__remember.secret);
                    var token = new $$node.Buffer(user.login + ":" + validTo + ":" + hash).toString("base64");
                    while (token[token.length - 1] === "=") {
                        token = token.substring(0, token.length - 1);
                    }
                    cookies.set(me.__remember.cookie, token, {expires : new Date(validTo)});
                })();
            }
            var savedUrl = (req.session != null) ? req.session[me.__saveUrlKey] : null;
            if (savedUrl == null) {
                savedUrl = me.__pageOnSuccess;
            }
            this.base(arguments, req, res, user, function(err) {
                cb(err, savedUrl);
            });
        },

        logout: function(req, res, cb) {
            if (this.__remember != null) {
                var cookies = new this.__cookies(req, res);
                cookies.set(this.__remember.cookie);
            }
            if (req.session != null && req.session[this.__saveUrlKey] != null) {
                delete req.session[this.__saveUrlKey];
                req.session.save();
            }
            this.base(arguments, req, res, cb);
        },

        commence: function(req, res, err) {
            if (req.session != null &&
                    req.info.href != null &&
                    req.info.pathname != this.__formUrl) {
                req.session[this.__saveUrlKey] = req.info.href; //Save original url
                req.session.save();
            }
            res.sendSCode(302, { "Location" : this.__formUrl });
        },

        success: function(req, res, cb) {
            if (req.info.pathname != this.__formUrl &&
                    req.session != null &&
                    req.session[this.__saveUrlKey] != null) {
                delete req.session[this.__saveUrlKey];
                req.session.save();
            }
            cb();
        },

        __hash: function(user, validTo, secret) {
            var crypto = $$node.require("crypto");
            // TODO: надо что-нить хитрое встаивить в серединку хэша.
            return crypto.createHash("md5")
                    .update(user + ":" + validTo + ":" + secret)
                    .digest("hex");
        }
    },

    destruct: function() {
        this.base(arguments);
        this.__formUrl = this.__remember = this.__saveUrlKey = null;
        this.__actionParameter = this.__actionName = this.__loginParameter = this.__passwordParameter = null;
        this.__cookies = this.__pageOnSuccess = null;
    }
});