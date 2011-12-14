/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Mixin.define("sm.cms.page.MPageMixin", {

    members :
    {
        /**
         * Show page helper method.
         * @param req
         * @param resp
         * @param ctx
         * @param pid {String} Mongodb page ID
         * @param preview {Boolean?false} we are in preview mode
         */
        _pageInternal : function(req, resp, ctx, pid, preview) {
            if (!/^\w{24}$/.test(pid)) { //mongodb ID
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var me = this;
            var coll = sm.cms.page.PageMgr.getColl();
            coll.findOne({"_id" : coll.toObjectID(pid)}, {fields : {"access" : 0, "media" : 0}},
              function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (!doc || (!preview && !doc.published)) { //Page not published
                      resp.sendNotFound();
                      return;
                  }
                  ctx["_ctx_"] = ctx;
                  ctx["_req_"] = req;
                  ctx["_res_"] = resp;

                  sm.cms.Events.getInstance().fireDataEvent("pageShowing", [doc, ctx]);

                  var ctxParams = {};
                  var asmName = "p" + pid;
                  var vhe = ctx._vhost_engine_;
                  var te = vhe.getTemplateEngineForExt("jz");
                  qx.core.Assert.assert(te != null, "Missing template engine for jz files");

                  //Load assembly
                  sm.nsrv.tengines.JazzCtxLib.assemblyExt(vhe, te, ctx, asmName, req.params, ctxParams, null, function(err, data) {
                      if (err) {
                          me.handleError(resp, ctx, err, true);
                          return;
                      }
                      var ctype = sm.nsrv.HTTPUtils.selectForUserAgent(
                        { "default" : "application/xhtml+xml; charset=UTF-8",
                            "MSIE 7" : "text/html; charset=UTF-8",
                            "MSIE 8" : "text/html; charset=UTF-8"}, req.headers);
                      me.writeHead(resp, ctx, 200, { "Content-Type": ctype });
                      resp.end(data);
                  });
              });
        },


        /**
         * Setup session.lang for current language which derived from:
         *  * accept-language headers
         *  * session.language key
         *  * default language for site in config.json
         *
         *  config.json:
         *  {
         *      "langs" : ["ru", "en"], //Default language will be first element
         *      "subsites" : {
         *          "en" : { //Start page for en lang
         *              "id" : "837fff4dc460a94d00000000",
         *          },
         *          "ru" : { //Start page for ru lang
         *              "id" : "e68bf74daa6d3b2c13000000",
         *              "name" : "Russian" //optional page name
         *          }
         *      }
         *  }
         *
         *
         * @param req
         * @param resp
         * @param ctx
         */
        _setupSessionLang : function(req, resp, ctx) {
            var session = req.session || {};
            var langs = [];
            if (req.params["lang"] != null) {
                langs.push(req.params["lang"]);
            }
            if (session["lang"] != null) {
                langs.push(session["lang"]);
            }
            var httpLangs = req.headers["accept-language"];
            if (httpLangs) {
                httpLangs.split(",").forEach(function(lang) {
                    langs.push(lang.split(";", 1)[0].toLowerCase());
                });
            }
            var env = sm.app.Env.getDefault();
            var defLang = env.getDefaultLanguage();
            langs.push(defLang);
            for (var i = 0, l = langs.length; i < l; ++i) {
                var lang = langs[i];
                if (lang === defLang) {
                    session["lang"] = lang;
                    break;
                }
                var mp = env.getNavConfigProp(lang, "main_page");
                if (mp != null) { //Main page for this language exists
                    session["lang"] = lang;
                    break;
                }
            }
            ctx();
        }
    }
});