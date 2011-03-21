/**
 * Application root
 *
 */
qx.Class.define("sm.app.Env", {
    extend  : qx.core.Object,

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

        getDefault : function() {
            if (!sm.app.Env.DEFAULT) {
                throw new Error("Default environment is not registered");
            }
            return sm.app.Env.DEFAULT;
        }
    },

    events :
    {

        /**
         * Fired if some json configuration changed
         * <code>
         * ev.getData(): {String} name of configuration file
         * </code>
         */
        "configChanged" : "qx.event.type.Data"
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

        this.__lfs = $$node.require("fs");
        this.__lpath = $$node.require("path");
        this.__lfsutils = $$node.require("utils/fsutils");

        this.__jsonConfigCache = {};

        var fs = this.__lfsutils.FileSeparator;
        this.__envBase = envBase + fs;
        this.setTmplDir(appBase + fs + this.getTmplDir() + fs);

        this._options = options || {};
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


        //lib refs
        __lfs : null,

        __lpath : null,

        __lfsutils : null,
        //eof lib refs



        getEnvBase : function() {
            return this.__envBase;
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
         * Return instnce of JSON config.
         * Caller must use {@link #setJSONConfig} to save modifications and
         * notify observers
         * @param name Name of config
         * @return {Object} Json config
         */
        getJSONConfig : function(name) {
            var c = this.__jsonConfigCache[name];
            if (c) {
                return c;
            }
            var fname = name + ".json";
            var cpath = this.__envBase + fname;
            if (!this.__lpath.existsSync(cpath)) {
                var tpath = this.getTmplDir() + fname;
                if (this.__lpath.existsSync(tpath)) {
                    this.setJSONConfig(name, this.__readFileJSONTemplate(tpath));
                    return this.__jsonConfigCache[name];
                } else {
                    throw new Error("Unable to load config, no template: " + tpath);
                }
            } else {
                c = this.__jsonConfigCache[name] = this.__readFileJSON(cpath);
            }
            return c;
        },

        /**
         * Update named JSON configuration and store it in file
         *
         * @param name Name of config
         * @param object Javascript to be stored in file as Json
         */
        setJSONConfig : function(name, object) {
            var me = this;
            var fname = name + ".json";
            var cpath = this.__envBase + fname;
            this.__jsonConfigCache[name] = object;
            this.__lfs.writeFile(cpath, qx.util.Json.stringify(object, true), "utf8", function() {
                me.fireDataEvent("configChanged", name);
            });
        },

        __readFileJSONTemplate : function(path) {
            var fdata = this.__lfs.readFileSync(path, "utf8");
            //todo use template engine!!!
            var data = fdata.replace("${install_path}", $$node.process.cwd());
            return qx.util.Json.parse(data);
        },

        __readFileJSON : function(path) {
            var fdata = this.__lfs.readFileSync(path, "utf8");
            return qx.util.Json.parse(fdata);
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

        close : function() {
            this.__jsonConfigCache = {};
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
        this.close();
        this.__envBase = null;
        this.__lpath = this.__lfs = this.__lfsutils = null;
    }
});