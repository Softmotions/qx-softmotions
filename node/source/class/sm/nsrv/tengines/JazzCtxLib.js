qx.Class.define("sm.nsrv.tengines.JazzCtxLib", {
    statics :
    {
        ctype : function(headers, ctype, cb) {
            if (ctype) {
                headers["Content-Type"] = ctype;
            }
            cb();
        },

        include : function(te, req, path, cb) {
            if (!qx.lang.Type.isString(path)) {
                qx.log.Logger.error(this, "Invalid path=" + path);
                return "";
            }
            if (path.length > 0 && path.charAt(0) != '/') {
                path = '/' + path;
            }
            path = req.info.webapp["docRoot"] + path;
            cb("include path=" + path);
        }
    }
});