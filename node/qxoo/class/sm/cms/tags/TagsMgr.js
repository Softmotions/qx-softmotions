/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 *
 * MongoDB model Item
 *
 * tagItem : {
 *    name : String,
 *    uses : int // count uses
 * }
 *
 */
qx.Class.define("sm.cms.tags.TagsMgr", {

      statics :
      {

          __getMongo : function() {
              return sm.app.Env.getDefault().getMongo();
          },

          getColl : function() {
              return this.__getMongo().collection("tagstat");
          },

          /**
           * Update tags statistic
           */
          updateStatistic : function(oldTags, newTags) {
              var coll = this.getColl();

              // for all tags increase uses
              var inc = function(tags) {
                  if (tags.length == 0) {
                      return;
                  }

                  // if tags isnot exist - create its!
                  coll.update({"name" : tags.pop()}, {"$inc" : {"uses" : 1}}, {"upsert" : true}, function(err) {
                      if (err) {
                          qx.log.Logger.error("sm.cms.tags.TagsMgr.updateStatistic#inc", err);
                          return;
                      }
                      inc(tags);
                  });
              };

              // decrease uses for all old tags
              coll.update({"name" : {"$in" : oldTags || []}}, {"$inc" : {"uses" : -1}}, {"upsert" : false, "multi": true}, function(err) {
                  if (err) {
                      qx.log.Logger.error("sm.cms.tags.TagsMgr.updateStatistic#dec", err);
                      return;
                  }

                  inc(newTags || []);
              });
          },

          /**
           * Getting mostly used tags
           */
          getMostlyUsedTags : function(maxCount, cb) {
              var coll = this.getColl();
              var result = null;
              coll.createQuery({"uses" : {"$gt" : 0}},
                {"limit" : maxCount, "sort" : [
                    ["uses", -1]
                ]})
                .all(function(size, items) {
                    result = items;
                })
                .exec(function(err) {
                    cb(err, result);
                });
          }
      }
  });
