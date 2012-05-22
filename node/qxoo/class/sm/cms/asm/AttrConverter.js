/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.asm.AttrConverter", {
    statics :
    {
        /**
         * Load attribute value if attribute stored in page context
         */
        loadCtxVal : function(attrName, attrVal, page, cb) {
            var val = (attrVal != null && attrVal["ctx"] != null ? attrVal["ctx"] : {});
            cb(null, val);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                           Direct page props                           //
        ///////////////////////////////////////////////////////////////////////////


        /**
         * Save attribute as direct page property
         */
        savePageProperty : function(opts, cb) {
            opts.page[opts.attrName] = opts.attrVal;
            cb(null, null);
        },

        /**
         * Load attribute as direct page property
         */
        loadPageProperty : function(attrName, attrVal, page, cb) {
            cb(null, page[attrName]);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                               Tags                                    //
        ///////////////////////////////////////////////////////////////////////////

        saveTagsVal : function(opts, cb) {
            var value = {};
            var tags;
            var page = opts.page;
            value["value"] = page["tags"] || [];
            var attrVal = opts.attrVal;
            try {
                page["tags"] = JSON.parse(attrVal) || [];
            } catch(e) {
                qx.log.Logger.error(this, "Failed to parse as json object. asm: " + opts.asm["_name_"] +
                  ", attr: " + opts.attrName + ", attrValue: " + attrVal, e);
            }
            cb(null, value);
        },

        loadTagsVal : function(attrName, attrVal, page, cb) {
            cb(null, page["tags"] || []);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                             Wiki                                      //
        ///////////////////////////////////////////////////////////////////////////

        saveWikiVal : function(opts, cb) {
            var http = $$node.require("http");
            var env = sm.app.Env.getDefault();
            var ropts = env.getJServiceRequestOpts();
            ropts["path"] = "/wiki";
            ropts["method"] = "POST";
            var me = this;
            var html = [];
            var attrVal = opts.attrVal;
            var page = opts.page;
            var attrName = opts.attrName;
            var req = http.request(ropts, function(res) {
                if (res.statusCode != 200) {
                    var msg = "Invalid response, status=" + res.statusCode;
                    qx.log.Logger.error(me, "sm.cms.asm.AttrConverter.saveWikiVal", msg);
                    cb(msg, null);
                    return;
                }
                res.setEncoding("UTF-8");
                res.on("data", function (chunk) {
                    html.push(chunk);
                });
                res.on("end", function() {
                    var extra = page["extra"];
                    if (!extra) {
                        extra = page["extra"] = {};
                    }
                    extra[attrName] = attrVal;
                    cb(null, {"ctx" : {"html" : html.join("")}});
                });
            });
            req.on("error", function(err) {
                qx.log.Logger.error(me, "sm.cms.asm.AttrConverter.saveWikiVal", err);
                cb(err, null);
            });
            req.write(attrVal);
            req.end();
        },

        loadWikiVal : function(attrName, attrVal, page, cb) {
            cb(null, page["extra"] && page["extra"][attrName] ? page["extra"][attrName] : "");
        },

        ///////////////////////////////////////////////////////////////////////////
        //                                Markdown                                //
        ///////////////////////////////////////////////////////////////////////////

        saveMarkdownVal: function(opts, cb) {
            var marked = $$node.require("marked");
            var attrVal = opts.attrVal;
            var page = opts.page;
            var attrName = opts.attrName;
            var closedTags= ["img", "br", "hr", "area", "base", "col", "frame", "input", "link", "meta", "param"];

            var markdown = attrVal.replace(/\(page:/gi, "(/exp/p");
            markdown = markdown.replace(/\(image:/gi, "(/exp/file?ref=");
            markdown = markdown.replace(/\(media:/gi, "(/exp/ref/Media:");
            var xhtml = marked(markdown);
            for (var key in closedTags) {
                xhtml = xhtml.replace(new RegExp("(<" + closedTags[key]+".*?)(?:/?)(>)","gi"), "$1 /$2");
            }
            xhtml = "<div>" + xhtml + "</div>";
            page["extra"]={}
            page["extra"]["content"] = attrVal;
            cb(null, {"ctx" : { "html" : xhtml}});
        },


        ///////////////////////////////////////////////////////////////////////////
        //                             Editor                                   //
        ///////////////////////////////////////////////////////////////////////////

        saveEditorVal : function(opts, cb) {
            var conf = sm.app.Env.getDefault().getConfig();
            switch (conf["editor"]) {
                case "wiki" :
                    sm.cms.asm.AttrConverter.saveWikiVal(opts, cb);
                    break;
                case "markdown" :
                default :
                    sm.cms.asm.AttrConverter.saveMarkdownVal(opts, cb);
                    break;
            }
        },

        loadEditorVal : function(attrName, attrVal, page, cb) {
            cb(null, page["extra"] && page["extra"][attrName] ? page["extra"][attrName] : "");
        },

        ///////////////////////////////////////////////////////////////////////////
        //                                Aliases                                //
        ///////////////////////////////////////////////////////////////////////////

        saveAliasFixVal : function(opts, cb) {
            var page = opts["page"];
            var aliasFix = opts.attrVal;
            sm.cms.page.PageMgr.fixPageAlias(page, aliasFix, function(err) {
                if (err) {
                    cb(err);
                    return;
                }
                cb(null, aliasFix);
            });
        },

        loadAliasFixVal : function(attrName, attrVal, page, cb) {
            cb(null, page[attrName]);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                                  MISC                                 //
        ///////////////////////////////////////////////////////////////////////////

        /**
         * Update sort order if user wants it to be on top again
         */
        popupNewsOnTop : function(opts, cb) {
            if (opts.attrVal || opts.page["popupdate"] == null) {
                opts.page["popupdate"] = +new Date();
            }
            cb(null);
        }
    }
});