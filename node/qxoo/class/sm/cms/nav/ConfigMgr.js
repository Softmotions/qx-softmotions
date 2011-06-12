/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Config nav-manager
 */
qx.Class.define("sm.cms.nav.ConfigMgr", {

      statics : {

          /**
           * Get level items
           */
          getChildNavItems : function(path, parentId) {
              //TODO: do it configurable?
              var res = [];
              if (parentId == "root") {
                  res.push(sm.cms.nav.ConfigMgr.__buildNavItem(path, "banners", true, "Банеры"));
              } else if (parentId == "banners") {
                  var banners = sm.cms.banners.BannersMgr.getBannerTypes();
                  for (var i = 0; i < banners.length; ++i) {
                      var banner = banners[i];
                      res.push(sm.cms.nav.ConfigMgr.__buildNavItem(path + "." + parentId, banner.type, false, banner.name));
                  }
              }

              return res;
          },

          buildRootNavItem : function(path, label) {
              return {
                  "id" : path + ".root",
                  "cont" : true,
                  "label" : label.toString(),
                  "opened" : true
              };
          },
          __buildNavItem : function(path, id, isCont, label) {
              return {
                  "id" : path + "." + id,
                  "cont" : !!isCont,
                  "label" : label,
                  "opened" : false
              };
          }
      }
  });
