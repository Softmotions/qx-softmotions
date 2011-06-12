/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Banner manager
 */
qx.Class.define("sm.cms.banners.BannersMgr", {

      statics : {
          /**
           * Get banner configuration by type
           *
           * @param type banner type
           */
          getBannerConfig: function(type) {
              var env = sm.app.Env.getDefault();
              var banners = env.getJSONConfig("banners");
              return banners[type] || {};
          },

          /**
           * Update banner config for specified type.
           */
          setBannerConfig: function(type, banner, notUpdateCache) {
              var env = sm.app.Env.getDefault();
              var banners = env.getJSONConfig("banners");
              if (banners[type]) {
                  if (notUpdateCache !== false) {
                      sm.cms.banners.BannersMgr.buildBannerCache(banner);
                  }
                  banners[type] = banner;
                  env.setJSONConfig("banners", banners);
              }
          },

          /**
           * Get collection of banners types:
           * [
           *  { type: <type>, name: <human name> }, ...
           * ]
           */
          getBannerTypes: function() {
              var res = [];
              var env = sm.app.Env.getDefault();
              var banners = env.getJSONConfig("banners");
              var bkeys = qx.lang.Object.getKeys(banners);
              for (var i = 0; i < bkeys.length; ++i) {
                  var bkey = bkeys[i];
                  res.push({
                        type: bkey,
                        name: banners[bkey].name || ""
                    });
              }

              return res;
          },

          /**
           * Build cache data (banners) for banner
           */
          buildBannerCache: function(banner) {
              // build banner cache object, contaned meta for fast getting random banner
              // {
              //  sum: <sum banner's weights>,
              //  items: [
              //      {
              //          image: <image link>,
              //          link: <banner url>
              //          weight: <banner weight>,
              //          order: <calculate>
              //      }
              //  ]
              // }
              // order calculates:
              // i = 0: items[i].order = 0
              // i > 0: items[i].order = items[i-1].order + items[i-1].weight
              var cache = banner.cacheData = { "sum": 0, "items": []};
              var bitems = banner.banners || [];
              for (var i = 0; i < bitems.length; ++i) {
                  var bitem = bitems[i];
                  var weight = +bitem["weight"];
                  if (weight > 0) {
                      var ritem = {
                          image: sm.cms.media.MediaFilesExecutor.getMediaLibRef(bitem["id"]),
                          link: bitem["link"] || "",
                          order: cache.sum,
                          weight: weight
                      };
                      cache.sum += weight;
                      cache.items.push(ritem);
                  }
              }
          },

          /**
           * Add banners item. Handle on mediaAdded event.
           * @param mcategoryId media category Id
           * @param mediaItem media item
           */
          addBannerItem: function(mcategoryId, mediaItem) {
              // if media catogory is "root" or media type is not leaf - skip
              if (!mcategoryId || mediaItem["type"] != 1) {
                  return;
              }

              var env = sm.app.Env.getDefault();
              var bconf = env.getJSONConfig("banners");

              var bnames = qx.lang.Object.getKeys(bconf);
              for (var i in bnames) {
                  var bname = bnames[i];
                  var banner = bconf[bname] || {};

                  if (mcategoryId == banner.category) {
                      banner.banners = banner.banners || [];
                      banner.cacheData = banner.cacheData || { "sum": 0, "items": []};

                      var bitem = {
                          id: mediaItem["_id"],
                          name: mediaItem["name"],
                          weight: 1,
                          link: ""
                      };
                      var citem = {
                          image: sm.cms.media.MediaFilesExecutor.getMediaLibRef(bitem.id),
                          link: bitem.link,
                          weight: bitem.weight,
                          order: banner.cacheData.sum
                      };
                      banner.banners.push(bitem);
                      banner.cacheData.sum += bitem.weight;
                      banner.cacheData.items.push(citem);
                  }
              }

              env.setJSONConfig("banners", bconf);
          },

          /**
           * Update banners item. Handle on mediaUpdated event.
           * Actually, update only banner's name.
           * @param mcategoryId media category Id
           * @param mediaItem media item
           */
          updateBannerItem: function(mcategoryId, mediaItem) {
              // if media catogory is "root" or media type is not leaf - skip
              if (!mcategoryId || mediaItem["type"] != 1) {
                  return;
              }

              var env = sm.app.Env.getDefault();
              var bconf = env.getJSONConfig("banners");

              var bnames = qx.lang.Object.getKeys(bconf);
              for (var i in bnames) {
                  var bname = bnames[i];
                  var banner = bconf[bname] || {};

                  if (mcategoryId == banner.category) {
                      banner.banners = banner.banners || [];
                      for (var j in banner.banners) {
                          if (mediaItem["_id"] == banner.banners[j].id) {
                              banner.banners[j].name = mediaItem["name"];
                              break;
                          }
                      }
                  }
              }

              env.setJSONConfig("banners", bconf);
          },

          /**
           * Remove banners item. Handle on mediaRemoved event.
           * @param mcategoryId media category Id
           * @param mitemId media item Id
           */
          removeBannerItem: function(mcategoryId, mitemId) {
              var env = sm.app.Env.getDefault();
              var bconf = env.getJSONConfig("banners");

              var bnames = qx.lang.Object.getKeys(bconf);
              for (var i in bnames) {
                  var bname = bnames[i];
                  var banner = bconf[bname] || {};

                  if (mcategoryId != null && mcategoryId == banner.category) {
                      banner.banners = banner.banners || [];
                      for (var j in banner.banners) {
                          if (mitemId == banner.banners[j].id) {
                              banner.banners.splice(j, 1);
                              break;
                          }
                      }

                      sm.cms.banners.BannersMgr.buildBannerCache(banner);
                  } else if (mitemId == banner.category) {
                      banner.banners = [];
                      sm.cms.banners.BannersMgr.buildBannerCache(banner);
                  }
              }

              env.setJSONConfig("banners", bconf);
          },

          /**
           * Get random banner definition by type:
           * {
           *  link: <url>,
           *  image: <image url>
           * }
           *
           * @param type banner type
           */
          getRandomBanner: function(type) {
              var banner = sm.cms.banners.BannersMgr.getBannerConfig(type);

              var data = null;
              if (banner.cacheData && banner.cacheData.items.length > 0) {
                  var rand = Math.floor(Math.random() * banner.cacheData.sum);
                  var items = banner.cacheData.items;
                  var min = 0;
                  var max = items.length - 1;
                  while (min != max) {
                      var index = Math.floor(min + (max - min + 1) / 2);
                      var item = items[index];
                      if (item.order <= rand) {
                          min = index;
                      } else {
                          max = index - 1;
                      }
                      if (item.order <= rand && (item.order + item.weight) > rand) {
                          return item;
                      }
                  }
                  return items[min];
              }

              return data;
          }
      },

      defer: function() {
      }
  });