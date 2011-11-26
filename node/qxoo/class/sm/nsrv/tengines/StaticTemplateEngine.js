/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Render template as static file
 */
qx.Class.define("sm.nsrv.tengines.StaticTemplateEngine", {
    extend  : qx.core.Object,
    implement : [sm.nsrv.ITemplateEngine],


    construct : function() {
        this.base(arguments);
        this.__path = $$node.require("path");
        this.__io = $$node.require("utils/io");
    },

    properties :
    {
        "extensions" : {
            check : "String",
            init : "*"
        }
    },

    members :
    {

        __path : null,
        __util : null,


        createTemplate : function(path, cb) {
            var me = this;
            $$node.fs.open(path, "r", null, function(err, fd) {
                if (err) {
                    cb(null, {"path" : path, "notfound" : true, "ctype" : me.__getCType(path)});
                    return;
                }
                cb(null, {"path" : path,
                    "fd" : fd,
                    "notfound" : false,
                    "ctype" : me.__getCType(path)});

            });
        },

        __getCType : function(path) {
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
            return ctype;
        },

        mergeTemplate : function(vhe, template, req, res, ctx, headers) {
            var me = this;
            qx.lang.Object.carefullyMergeWith(headers, {
                "Content-Type": template["ctype"]
            });
            if (template["notfound"]) {
                headers["Content-Type"] = "text/plain";
                res.sendNotFound(headers);
                return;
            }
            res.writeHead((res.statusCode || 200), headers);
            var rs = $$node.fs.createReadStream(template["path"], {fd : template["fd"]});
            $$node.process.nextTick(function() { //small hack =)
                rs.emit("open", rs.fd);
                rs.resume();
                rs = null;
            });
            this.__io.responseHTTPump(rs, res, function(err) {
                if (err) {
                    qx.log.Logger.warn(me, "File pumping error: " + template["path"], err);
                }
            });
        }
    },

    destruct : function() {
        this.__path = this.__util = null;
    }
});
