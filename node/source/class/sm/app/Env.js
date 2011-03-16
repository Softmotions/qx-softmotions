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
            sm.app.DEFAULT = env;
        },

        getDefault : function() {
            if (!sm.app.DEFAULT) {
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
            init : "Application"
        },

        /**
         * Environment root relative to envBase
         */
        envDir : {
            check : "String",
            init : ".softmotions"
        },

        envSubdirs : {
            check : "Array",
            init : []
        },

        /**
         * Template dir relative to appBase
         */
        tmplDir : {
            check : "String",
            init : "tmpl"
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
        this.setEnvDir(envBase + fs + this.getEnvDir() + fs);
        this.setTmplDir(appBase + fs + this.getTmplDir() + fs);

        this.__options = options || {};
        this._openEnv(!!this.__options["create"]);

    },

    members :
    {

        /**
         * sm.mongo.Mongo
         */
        __mongo : null,

        /**
         * Env options
         */
        __options : null,


        /**
         * Config cache search
         */
        __jsonConfigCache : null,


        //lib refs
        __lfs : null,

        __lpath : null,

        __lfsutils : null,
        //eof lib refs


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
            var cpath = this.__envRoot + fname;
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
            var fname = name + ".json";
            var cpath = this.__envRoot + fname;
            this.__jsonConfigCache[name] = object;
            //todo async?
            this.__lfs.writeFileSync(cpath, qx.util.Json.stringify(object, true), "utf8");
            this.fireDataEvent("configChanged", name);
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

            var er = this.getEnvDir();

            qx.log.Logger.info("Env root dir: " + er);
            qx.log.Logger.info("Templates dir: " + this.getTmplDir());

            
            //env root checking
            if (!this.__lpath.existsSync(er)) {
                if (!create) {
                    throw new Error(this.getAppName() + " environment: " + er + " does not exists");
                } else {
                    qx.log.Logger.info("Creating new " + this.getAppName() + " environment: " + er);
                    this.__lfsutils.mkdirsSync(er);
                    

                }
            }
            this._configChanged();
            this.addListener("configChanged", function(ev) {
                if (ev.getData() == "config") {
                    qx.log.Logger.warn("Synchronizing with changed configuration (config.json)");
                    this._configChanged();
                }
            }, this);
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});