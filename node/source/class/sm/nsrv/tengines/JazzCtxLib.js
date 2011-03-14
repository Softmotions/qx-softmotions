qx.Class.define("sm.nsrv.tengines.JazzCtxLib", {
    statics :
    {
        ctype : function(headers, ctype, cb) {
            if (ctype) {
                headers["Content-Type"] = ctype;
            }
            cb();
        },

        
        include : function(te, ctx, path, cb) {
            var me = this;
            if (!qx.lang.Type.isString(path)) {
                qx.log.Logger.error(this, "Invalid path=" + path);
                cb("");
                return;
            }
            if (path.length > 0 && path.charAt(0) != '/') {
                path = '/' + path;
            }
            var req = ctx["__req__"];
            var res = ctx["__res__"];
            var headers = ctx["__headers__"];
            path = req.info.webapp["docRoot"] + path;
            te.createTemplate(path, function(err, template) {
                if (err) {
                    qx.log.Logger.error(me, err);
                    cb("");
                    return;
                }
                te.mergeTemplateInternal(template, req, res, ctx, headers, function(nf, data) {
                    if (nf) {
                        qx.log.Logger.warn(me, "Resource: '" + path + "' not found");
                        cb("");
                        return;
                    }
                    cb(data);
                });
            });
        }
    }
});