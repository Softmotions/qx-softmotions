/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.handlers.BannerMediaHandler", {

    statics :
    {

        /**
         * Handle "mediaAdded" event. Add new item for banners.
         */
        mediaAdded : function(ev) {
            var data = ev.getData();
            sm.cms.banners.BannersMgr.addBannerItem(data[0], data[1])
        },

        /**
         * Handle "mediaUpdated" event. Update banner item (actually, rename item).
         */
        mediaUpdated : function(ev) {
            var data = ev.getData();
            sm.cms.banners.BannersMgr.updateBannerItem(data[0], data[1])
        },

        /**
         * Handle "mediaRemoved" event. Remove item for banners.
         */
        mediaRemoved : function(ev) {
            var data = ev.getData();
            sm.cms.banners.BannersMgr.removeBannerItem(data[0], data[1])
        }
    },

    defer : function(statics) {
        var ee = sm.cms.Events.getInstance();
        ee.addListener("mediaAdded", statics.mediaAdded);
        ee.addListener("mediaUpdated", statics.mediaUpdated);
        ee.addListener("mediaRemoved", statics.mediaRemoved);
    }
});
