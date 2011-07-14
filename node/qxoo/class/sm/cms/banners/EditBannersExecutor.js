/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Edit banner
 */
qx.Class.define("sm.cms.banners.EditBannersExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

    members :
    {
        /**
         * Get banner configuration by type
         * @param banner for internal use.
         *        If <code>banner</code> not specified get banner settings from config.
         */
        __info : function(req, resp, ctx, banner) {
            if (banner == null) {
                if (!qx.lang.Type.isString(req.params["type"])) {
                    throw new sm.nsrv.Message("Invalid request", true);
                }
                var type = req.params["type"];

                banner = sm.cms.banners.BannersMgr.getBannerConfig(type);
            }

            var me = this;
            var res = {};
            res["name"] = banner["name"] || "";
            res["banners"] = banner["banners"] || [];
            if (banner["category"]) {
                // get media directory full path
                sm.cms.media.MediaMgr.fetchHierarchyNodeById(banner["category"], function(err, hr) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    var path = "";
                    for (var i = 0; i < hr.length; ++i) {
                        path += "/" + hr[i].name;
                    }
                    res["category"] = banner["category"];
                    res["_categoryPath"] = path;

                    me.writeJSONObject(res, resp, ctx);
                });
            } else {
                me.writeJSONObject(res, resp, ctx);
            }
        },

        /**
         * Save banner configuration
         */
        __save : function(req, resp, ctx) {
            if (!qx.lang.Type.isString(req.params["type"])) {
                throw new sm.nsrv.Message("Invalid request", true);
            }
            var type = req.params["type"];
            var banner = sm.cms.banners.BannersMgr.getBannerConfig(type);
            if (!banner) {
                throw new sm.nsrv.Message("Invalid request", true);
            }

            var bitems = [];
            try {
                bitems = JSON.parse(req.params["banners"]);
            } catch(e) {
                qx.log.Logger.error(this, "Failed to parse as json object: " + req.params["banners"], e);
            }

            banner.category = req.params["category"];
            banner.banners = bitems;

            sm.cms.banners.BannersMgr.setBannerConfig(type, banner);

            this.__info(req, resp, ctx, banner);
        }
    },

    handlers :
    {
        //Мета-информация о баннере
        "/banner/info" : {
            webapp : "adm",
            handler : "__info"
        },

        //Сохранение настроек баннера
        "/banner/save" : {
            webapp : "adm",
            handler : "__save"
        }
    }
});