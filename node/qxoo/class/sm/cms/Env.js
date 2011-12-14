/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.Env", {
    extend  : sm.app.Env,
    type : "abstract",

    construct : function(envBase, appBase, options) {
        this.base(arguments, envBase, appBase, options);
        var mcfg = this.getJSONConfig("mongo");
        this.__mongoCfg = new sm.mongo.MongoConfig(mcfg);
    },

    members :
    {

        __mongoCfg : null,

        getMongo : function() {
            return this.__mongoCfg.getMongo();
        },

        getJServiceRequestOpts : function() {
            var conf = this.getConfig();
            if (!conf || !conf["jservice"]) {
                throw new Error("Invalid config, no 'jservice' section");
            }
            return qx.lang.Object.clone(conf["jservice"]);
        },

        //override
        close : function() {
            this.fireDataEvent("closing", this);
            if (this.__mongoCfg) {
                this.__mongoCfg.dispose();
                this.__mongoCfg = null;
            }
            this.base(arguments);
        },

        /**
         * Return assembly name for main page
         * @param ctx {Object} Request context
         */
        getMainPageAsm : function(req) {
            var mp = this.getMainPageID(req);
            return mp != null ? "p" + mp : null;
        },

        getMainPageID : function(req) {
            return this.getNavConfigProp(this.getRequestLang(req), "main_page");
        },

        getDefaultLanguage : function() {
            var nconf = this.getJSONConfig("navigation");
            var langs = nconf["langs"];
            return (langs != null && langs.length > 0) ? langs[0] : "en";
        },

        getRequestLang : function(req) {
            return (req != null && req.session != null && req.session.lang != null) ? req.session.lang : this.getDefaultLanguage();
        },


        /**
         * Get language based navigation property
         * @param lang {String?null} Language ID
         * @param prop {String} Property name
         */
        getNavConfigProp : function(lang, prop) {
            lang = lang || this.getDefaultLanguage();
            var nconf = this.getJSONConfig("navigation");
            var lroots = nconf["langRoots"] || {};
            var val;
            if (lroots[lang] != null) {
                val = lroots[lang][prop];
            }
            if (val === undefined) { //todo: it is legacy fallback
                val = nconf[prop];
            }
            return val;
        },

        /**
         * Save language based navigation property
         * @param lang {String?null} Language ID
         * @param prop {String} Property name
         * @param val {Object} Property value
         */
        setNavConfigProp : function(lang, prop, val) {
            lang = lang || this.getDefaultLanguage();
            var nconf = this.getJSONConfig("navigation");
            if (nconf["langRoots"] == null) {
                nconf["langRoots"] = {};
            }
            var lroots = nconf["langRoots"];
            if (lroots[lang] == null) {
                lroots[lang] = {};
            }
            lroots[lang][prop] = val;
        },

        /**
         * If page marked as main,
         * return language associated with this page
         * or return null
         * @param doc Mongodb page object with 'attrs' attribute fetched
         */
        getLangFromMainPage : function(doc) {
            if (doc.attrs == null || doc.attrs._main_page_ == null || (typeof doc.attrs._main_page_.value !== "string")) {
                return null;
            }
            var val = doc.attrs._main_page_.value;
            var nconf = this.getJSONConfig("navigation");
            var langs = nconf["langs"] || [];
            return langs.indexOf(val) !== -1 ? val : null;
        }
    },

    defer : function(statics) {

    },

    destruct : function() {
        this._disposeObjects("__mongoCfg");
    }
});