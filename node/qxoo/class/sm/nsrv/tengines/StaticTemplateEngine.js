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
          this.__util = $$node.require("util");
      },

      members :
      {

          __path : null,
          __util : null,


          createTemplate : function(path, cb) {
              var me = this;
              me.__path.exists(path, function(exists) {
                  if (!exists) {
                      cb(null, {"path" : path, "notfound" : true, "ctype" : me.__getCType(path)});
                      return;
                  }
                  $$node.fs.stat(path, function(err, stat) {
                      cb(null, {"path" : path,
                            "notfound" : (err || !stat.isFile()),
                            "ctype" : me.__getCType(path)});
                  });
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
                  res.sendNotFound(headers);
                  return;
              }
              res.writeHead((res.statusCode || 200), headers);
              this.__util.pump($$node.fs.createReadStream(template["path"]), res, function(err) {
                  if (err) {
                      qx.log.Logger.error(me, "File read error: " + template["path"]);
                      throw err;
                  }
              });
          }
      },

      destruct : function() {
          this.__path = this.__util = null;
      }
  });
