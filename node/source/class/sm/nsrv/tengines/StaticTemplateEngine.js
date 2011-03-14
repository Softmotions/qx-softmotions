/**
 * Render template as static file
 */
qx.Class.define("sm.nsrv.tengines.StaticTemplateEngine", {
    extend  : qx.core.Object,
    implement : [sm.nsrv.ITemplateEngine],


    construct : function() {
        this.base(arguments);
        this.__fs = $$node.require("fs");
        this.__path = $$node.require("path");
        this.__util = $$node.require("util");
    },

    members :
    {

        //Nodejs fs module
        __fs : null,

        //Nodejs path module
        __path : null,

        //Nodejs util module
        __util : null,


        createTemplate : function(path, cb) {
            var notfound = (!this.__path.existsSync(path) || !this.__fs.statSync(path).isFile());
            var ext = this.__path.extname(path);
            if (ext && ext != "") {
                ext = ext.substring(1);
            } else {
                ext = null;
            }
            var ctype = sm.nsrv.HTTPUtils.getCType(ext);
            if (ctype == null) {
                ctype = sm.nsrv.HTTPUtils.getCType("bin");
            }
            var template = {"path" : path,
                "notfound" : notfound,
                "ctype" : ctype};
            cb(null, template);
        },

        mergeTemplate : function(template, req, res, ctx, headers) {
            var me = this;
            qx.lang.Object.carefullyMergeWith(headers, {
                "Content-Type": template["ctype"]
            });
            if (template["notfound"]) {
                res.sendNotFound(headers);
                return;
            }
            res.writeHead((res.statusCode || 200), headers);
            this.__util.pump(this.__fs.createReadStream(template["path"]), res, function(err) {
                if (err) {
                    qx.log.Logger.error(me, "File read error: " + template["path"]);
                    throw err;
                }
            });
        }
    },

    destruct : function() {
        this.__fs = this.__path = this.__util = null;
    }
});
