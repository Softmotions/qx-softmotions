/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Application root
 *
 */
qx.Class.define("sm.app.Env", {
    extend  : qx.core.Object,
    type : "abstract",

    statics :
    {
        /**
         * Default env instance
         */
        DEFAULT : null,

        /**
         * Register default env instance
         */
        registerDefault : function(env) {
            sm.app.Env.DEFAULT = env;
        },

        getDefault : function(nofail) {
            if (!nofail && !sm.app.Env.DEFAULT) {
                throw new Error("Default environment is not registered");
            }
            return sm.app.Env.DEFAULT || null;
        },


        getDefaultConfig : function() {
            return sm.app.Env.getDefault().getConfig();
        }

    },

    events :
    {

        /**
         * Fired if some json configuration changed
         * <code>
         * ev.getData(): [{String} name of config, {Object} newConfig, {Object} oldConfig]
         * </code>
         */
        "configChanged" : "qx.event.type.Data",

        /**
         * Fired if environment is going to be
         * <code>
         * ev.getData(): this
         * </code>
         */
        "closing" : "qx.event.type.Data",

        /**
         * Fired if environment is closed
         * <code>
         * ev.getData(): this
         * </code>
         */
        "closed" : "qx.event.type.Data",

        /**
         * Env is opened
         */
        "opened" : "qx.event.type.Data",

        /**
         * Fired when env opened and all initables completed
         */
        "published" : "qx.event.type.Data"
    },

    properties :
    {

        appName : {
            check : "String",
            init : "Application",
            nullable : false
        },

        envSubdirs : {
            check : "Array",
            init : [],
            nullable : false
        },

        /**
         * Template dir relative to appBase
         */
        tmplDir : {
            check : "String",
            init : "tmpl",
            nullable : false
        }
    },


    construct : function(envBase, appBase, options) {
        this.base(arguments);

        qx.core.Assert.assertString(envBase);
        qx.core.Assert.assertString(appBase);

        this.__initables = [];

        this.__lpath = $$node.require("path");
        this.__lfsutils = $$node.require("utils/fsutils");

        this.__jsonConfigCache = {};

        var fs = this.__lfsutils.FileSeparator;

        appBase = appBase.trim();
        envBase = envBase.trim();

        this.__envBase = (!qx.lang.String.endsWith(envBase, fs)) ? envBase + fs : envBase;
        this.__appBase = (!qx.lang.String.endsWith(appBase, fs)) ? appBase + fs : appBase;

        this.setTmplDir(this.__appBase + this.getTmplDir() + fs);

        this._options = options || {};

        if (this._options["default"]) { //Register as default env
            qx.log.Logger.info(this, "Registered: '" + this.classname + "' as default app environment");
            sm.app.Env.registerDefault(this);
        }

        var me = this;
        //Init initables after env opened
        me.addListenerOnce("opened", function() {
            me.__initInitables(function() {
                me.fireDataEvent("published", me);
            });
        });

        this._openEnv(!!this._options["create"]);
    },

    members :
    {
        /**
         * Env options
         */
        _options : null,

        /**
         * Config cache search
         */
        __jsonConfigCache : null,


        __envBase : null,

        __appBase : null,


        //lib refs
        __lpath : null,

        __lfsutils : null,
        //eof lib refs

        /**
         * List of initables
         * @see sm.app.IInitable
         */
        __initables : null,


        getAppBase : function() {
            return this.__appBase;
        },

        getEnvBase : function() {
            return this.__envBase;
        },

        getEnvSubdir : function(dirName) {
            return this.__envBase + dirName + this.__lfsutils.FileSeparator;
        },

        /**
         * Returns env configuration
         */
        getConfig : function() {
            return this.getJSONConfig("config");
        },

        setConfig : function(config) {
            this.setJSONConfig("config", config);
        },


        /**
         * Return instance of JSON config.
         * Caller must use {@link #setJSONConfig} to save modifications and
         * notify observers
         * @param name{String} Name of config
         * @param notCheckTemplate{Boolean?false} If true do not try to load template file
         * @param refresh {Boolean?false} If true config cache will be invalidated and confgig file will be loaded again
         * @return {Object} Json config
         */
        getJSONConfig : function(name, notCheckTemplate, refresh) {
            var c = this.__jsonConfigCache[name];
            if (c && !refresh) {
                return c;
            }
            var fname = name + ".json";
            var cpath = this.__envBase + fname;
            if (!this.__lpath.existsSync(cpath)) {
                var tpath = this.getTmplDir() + fname;
                if (this.__lpath.existsSync(tpath)) {
                    this.setJSONConfig(name, this._readFileJSONTemplate(tpath), null, true);
                    return this.__jsonConfigCache[name];
                } else if (!notCheckTemplate) {
                    throw new Error("Unable to load config, no template: " + tpath);
                } else {
                    return null;
                }
            } else {
                c = this.__jsonConfigCache[name] = this._readFileJSON(cpath);
            }
            return c;
        },

        /**
         * Load content of JSON config template
         * @param name {String} Config name
         * @param cb {function(err, coobject)?null} If provided this function will be async
         */
        getJSONConfigTemplate : function(name, cb) {
            return this._readFileJSONTemplate(this.getTmplDir() + name + ".json", cb);
        },

        /**
         * Save named JSON configuration and store it in file
         *
         * @param name Name of config
         * @param object {Object?} Javascript to be stored in file as Json.
         *                         If object is null, current config state will be saved
         * @param cb {function?null} Optional callback
         */
        setJSONConfig : function(name, object, cb, nofire) {
            var me = this;
            var fname = name + ".json";
            var cpath = this.__envBase + fname;
            var oldConfig = this.__jsonConfigCache[name];
            var newConfig = this.__jsonConfigCache[name] = ((object != null) ? object : this.__jsonConfigCache[name]);
            this.__lfsutils.writeFileLock(cpath, JSON.stringify(newConfig), "utf8", function(err) {
                if (!nofire) {
                    me.fireDataEvent("configChanged", [name, newConfig, oldConfig]);
                }
                if (err) {
                    qx.log.Logger.error(me, "setJSONConfig", err);
                }
                if (cb != null) {
                    cb(err);
                }
            });
        },

        /**
         * Update(merge) named JSON configuration
         *
         * @param name
         * @param object
         * @param cb
         */
        updateJSONConfig : function(name, object, cb) {
            var cfg = this.getJSONConfig(name);
            if (object != null) {
                qx.lang.Object.mergeWith(cfg, object, true);
            }
            this.setJSONConfig(name, cfg, cb);
        },

        clearJSONConfigCache : function(name) {
            delete this.__jsonConfigCache[name];
        },

        _readFileJSONTemplate : function(path, cb) {
            var me = this;
            var processFdata = function(fdata) {
                //todo use template engine!!!
                var appBase = me.getAppBase();
                //remove trailing slash
                var installPath = appBase.substring(0, appBase.length - 1);
                var data = fdata.replace(/\$\{install_path\}/g, installPath);
                return JSON.parse(data);
            };
            if (cb) {
                this.__lfsutils.readFileLock(path, "utf8", function(err, fdata) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    var res;
                    try {
                        res = processFdata(fdata);
                    } catch(e) {
                        cb(e);
                        return;
                    }
                    cb(null, res);
                });
            } else {
                return processFdata(this.__lfsutils.readFileLockSync(path, "utf8"));
            }
        },

        _readFileJSON : function(path) {
            var fdata = this.__lfsutils.readFileLockSync(path, "utf8");
            try {
                return JSON.parse(fdata);
            } catch(e) {
                qx.log.Logger.error(this, path, e.toString());
                throw e;
            }
        },

        /**
         * Open environment
         */
        _openEnv : function(create) {

            qx.log.Logger.info(this, this.getAppName(), "Env root dir:" + this.__envBase);
            qx.log.Logger.info(this, this.getAppName(), "Templates dir: " + this.getTmplDir());

            //env root checking
            if (!this.__lpath.existsSync(this.__envBase)) {
                if (!create) {
                    throw new Error(this.getAppName() + " Env dir: " + this.__envBase + " does not exists");
                } else {
                    qx.log.Logger.warn(this, this.getAppName(), "Creating env: " + this.__envBase);
                    this.__lfsutils.mkdirsSync(this.__envBase);
                }
            }

            var edirs = this.getEnvSubdirs();
            for (var i = 0; i < edirs.length; ++i) {
                var ed = this.__envBase + edirs[i];
                if (!this.__lpath.existsSync(ed)) {
                    this.__lfsutils.mkdirsSync(ed);
                }
            }
        },


        __initInitables : function(cb) {
            if (this._options["initables"] === false) { //Initables not enabled
                cb();
                return;
            }
            this._disposeArray("__initables");
            this.__initables = [];
            var c = 0;
            for (var k in qx.Bootstrap.$$registry) {
                var clazz = qx.Bootstrap.$$registry[k];
                if (!clazz || !clazz.prototype) {
                    continue;
                }
                if (qx.Bootstrap.hasInterface(clazz, sm.app.IInitable)) {
                    if (c++ === 0) {
                        qx.log.Logger.info("Initables:");
                    }
                    try {
                        var it = new clazz();
                        this.__initables.push(it);
                    } catch(e) {
                        qx.log.Logger.error(this, e);
                    }
                }
            }

            this.__initables.sort(function(i1, i2) {
                var fcn1 = i1.constructor.classname || "";
                var fcn2 = i2.constructor.classname || "";
                var cn1 = fcn1.lastIndexOf(".") !== -1 ? fcn1.substring(fcn1.lastIndexOf(".") + 1) : fcn1;
                var cn2 = fcn2.lastIndexOf(".") !== -1 ? fcn2.substring(fcn2.lastIndexOf(".") + 1) : fcn2;
                return cn1.localeCompare(cn2);

            });


            var me = this;
            var async = $$node.require("async");
            var tasks = [];
            this.__initables.forEach(function(it) {
                tasks.push(function(_cb) {
                    var iname = "\t" + it.constructor.classname + "[" + it.$$hash + "]";
                    qx.log.Logger.info(iname);
                    try {
                        it.init(me, function(err) {
                            if (err) {
                                qx.log.Logger.error(me, iname, err);
                            }
                            _cb(err);
                        });
                    } catch(e) {
                        qx.log.Logger.error(me, iname, e);
                        _cb(e);
                    }
                });
            }, this);

            setTimeout(function() {
                async.series(tasks, function(err) {
                    if (cb) {
                        cb(err);
                    }
                });
            }, 100); //todo duty hack, take timeout to startup mongodb staff
        },

        close : function() {
            this.__jsonConfigCache = {};
            this._disposeArray("__initables");
            this.fireDataEvent("closed", this);
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
        this.close();
        this.__envBase = this.__appBase = null;
        this.__lpath = this.__lfsutils = null;
        this.__initables = null;
    }
});