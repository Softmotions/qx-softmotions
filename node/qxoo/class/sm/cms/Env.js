/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.Env", {
    extend  : sm.app.Env,

    construct : function(envBase, appBase, options) {
        this.base(arguments, envBase, appBase, options);
        var cfg = this.getConfig();
        var mcfg = this.getJSONConfig("mongo");
        this.__mongoCfg = new sm.mongo.MongoConfig(mcfg);
        //Reference to the main_page assembly
        sm.cms.Env.__defineGetter__("MAIN_PAGE_ASM", function() {
            return cfg.main_page != null ? "p" + cfg.main_page : null;
        });
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
        }

    },

    defer : function(statics) {

    },

    destruct : function() {
        this._disposeObjects("__mongoCfg");
    }
});