/**
 * Render jazz (https://github.com/shinetech/jazz) templates
 */
qx.Class.define("sm.nsrv.tengines.JazzTemplateEngine", {
    extend  : qx.core.Object,
    implement : [sm.nsrv.ITemplateEngine],


    construct : function() {
        this.base(arguments);
        this.__fs = $$node.require("fs");
        this.__path = $$node.require("path");
        this.__util = $$node.require("util");
        this.__jazz = $$node.require("jazz");
        //temlate cache
        this.__tcache = {};
    },

    members :
    {
        /**
         * Templates cache
         */
        __tcache : null,

        __fs : null,
        __path : null,
        __util : null,
        __jazz : null,

        createTemplate : function(path) {
            var exists = this.__path.existsSync(path);
            var stat = exists ? this.__fs.statSync(path) : null;
            if (!exists || !stat.isFile()) {
                return {"path" : path,
                    "notfound" : true};
            }

            //checking the cache
            var cached = this.__tcache[path];
            if (cached) {
                if (cached.mtime != stat.mtime.getTime() || cached.fsize != stat.size) {
                    if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                        qx.log.Logger.debug(this, "Invalidate cache: " + path);
                    }
                    cached = null;
                    delete this.__tcache[path];
                }
                if (cached) {
                    if (qx.core.Variant.isSet("sm.nsrv.debug", "on")) {
                        qx.log.Logger.debug(this, "Cached template fetched: " + path);
                    }
                    return cached;
                }
            }

            var fdata = this.__fs.readFileSync(path, "utf8");
            var jazzTemplate = this.__jazz.compile(fdata);

            var template = {"path" : path,
                "mtime" : stat.mtime.getTime(),
                "fsize" : stat.size,
                "jazz" : jazzTemplate};

            this.__tcache[path] = template;
            return template;
        },

        mergeTemplate : function(template, res, ctx, headers) {
            var tjazz = template["jazz"];
            if (!tjazz || template["notfound"]) {
                res.sendNotFound(headers);
                return;
            }
            ctx["__ctype__"] = function(ctype, cb) {
                if (ctype) {
                    headers["Content-Type"] = ctype;
                }
                cb();
            };
            tjazz.eval(ctx, function(data) {
                res.writeHead((res.statusCode || 200), headers);
                res.end(data);
            });
        }
    },

    destruct : function() {
        this.__fs = this.__util = this.__jazz = this.__path = this.__tcache = null;
    }
});
