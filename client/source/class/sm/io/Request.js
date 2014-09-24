/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Удаленный HTTP запрос
 */

qx.Class.define("sm.io.Request", {
    extend : qx.io.remote.Request,
    include : [qx.locale.MTranslation],

    statics : {
        __ALERT_WND : null,

        LOGIN_ACTION : function() {
            alert(qx.locale.Manager.tr("Your user session expired! Please login again"));
            window.location.reload(true);
        }
    },

    events : {
        /**
         * Fired if request has finished
         * regardless its state
         *
         * data: error or null
         */
        "finished" : "qx.event.type.Data",

        /**
         * Error condition including `abort`, `cancel`, `fail`
         */
        "error" : "qx.event.type.Data"
    },

    properties : {

        /**
         * Если true то Request показывает
         * ошибки HTTP запроса
         */
        showMessages : {
            nullable : false,
            check : "Boolean",
            init : true
        },

        /**
         * Кастомное отображение ошибок запроса.
         * Функция вида: function(isError, messages), где
         *  - isError - являются ли сообщения ошибками (boolean)
         *  - messages - сообщения указанного типа (string[])
         */
        messageHandler : {
            nullable : true,
            check : "Function",
            init : null
        }
    },


    /**
     * @param vUrl {String}
     *   Target url to issue the request to.
     *
     * @param vMethod {String}
     *   Determines http method (GET, POST, PUT, etc.) to use. See "method" property
     *   for valid values and default value.
     *
     * @param vResponseType {String}
     *   The mime type of the response. Default is text/plain.
     */
    construct : function(vUrl, vMethod, vResponseType) {
        this.base(arguments, vUrl, vMethod, vResponseType);
        this.setTimeout(20000);
    },

    members : {

        __onsuccess : null,
        __self : null,


        /**
         * Send request
         *
         * @param onsuccess {Function} oncomplete callback function
         * @param self {Object ? null} reference to the 'this' variable inside the callback
         */
        send : function(onsuccess, self) {
            if (onsuccess) {
                this.__onsuccess = onsuccess;
                this.__self = (self) ? self : onsuccess;
            }
            this.base(arguments);
        },

        setRequestContentType : function(ctype) {
            if (ctype != null) {
                this.setRequestHeader("Content-Type", ctype);
            } else {
                this.removeRequestHeader("Content-Type");
            }
        },

        _onaborted : function(e) {
            this.fireDataEvent("finished", e);
            if (this.hasListener("error")) {
               this.fireDataEvent("error", e);
            }
            this.base(arguments, e);
        },

        _ontimeout : function(e) {
            this.fireDataEvent("finished", e);
            if (this.hasListener("error")) {
                this.fireDataEvent("error", e);
            }
            this.base(arguments, e);
        },

        _onfailed : function(e) {
            this.fireDataEvent("finished", e);
            if (this.hasListener("error")) {
                this.fireDataEvent("error", e);
            }
            var err = this.__checkMessages(e);
            if (err === "abort") {
                this.dispose();
                return;
            }
            if (this.getShowMessages() == true) {
                if (!err) {
                    var cerr = this.tr("Connection error with address");
                    this.__addMessages(this.tr("Connection error"),
                            [cerr + ":<br/>" + this.getUrl()]);
                }
            }
            this.base(arguments, e);
        },

        _oncompleted : function(e) {
            try {
                var err = this.__checkMessages(e);
                if (err === "abort") {
                    this.dispose();
                    return;
                }
                if (err == false && this.__onsuccess != null) {
                    this.__onsuccess.call(this.__self, e);
                }
            } finally {
                this.fireDataEvent("finished", err == false ? null : e);
            }
            this.base(arguments, e);
        },

        /**
         *
         * @param resp {qx.io.remote.Response}alert
         * @return {Boolean|String} True если пришло сообщение об ошибке
         */
        __checkMessages : function(resp) {
            var headers = resp.getResponseHeaders();
            if (headers == null) {
                return false;
            }
            if (headers["X-Softmotions-Login"]) {
                if (typeof sm.io.Request.LOGIN_ACTION === "function") {
                    sm.io.Request.LOGIN_ACTION();
                }
                return "abort";
            }
            if (this.getShowMessages() == false) {
                return false;
            }
            var errors = [];
            var msgs = [];
            var eh = "X-Softmotions-Err";
            for (var i = 0; headers[eh + i] != undefined; ++i) {
                errors[errors.length] = "*" + decodeURIComponent(headers[eh + i].replace(/\+/g, ' '));
            }
            eh = "X-Softmotions-Msg";
            for (var i = 0; headers[eh + i] != undefined; ++i) {
                msgs[msgs.length] = "*" + decodeURIComponent(headers[eh + i].replace(/\+/g, ' '));
            }
            if (errors.length > 0) {
                this.__addMessages(true, errors);
            }
            if (msgs.length > 0) {
                this.__addMessages(false, msgs);
            }
            return (errors.length > 0);
        },

        __addMessages : function(isError, msgs) {
            if (this.getMessageHandler()) {
                this.getMessageHandler().call(this, isError, msgs);
                return;
            }

            var awnd = sm.io.Request.__ALERT_WND;
            if (awnd == null) {
                awnd = sm.io.Request.__ALERT_WND = new sm.alert.AlertMessages(this.tr("System messages"));
                awnd.addListener("close", function() {
                    sm.io.Request.__ALERT_WND = null;
                }, this);
            }
            var caption = isError ? this.tr("Errors") : this.tr("Messages");
            awnd.addMessages(caption, msgs);
            if (!awnd.isVisible()) {
                awnd.open();
            } else {
                awnd.ensureOnTop();
            }
        }
    },

    destruct : function() {
        this.setMessageHandler(null);
        this.__onsuccess = this.__self = null;
    }
});