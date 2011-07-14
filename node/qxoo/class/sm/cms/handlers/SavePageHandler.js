/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.handlers.SavePageHandler", {

      statics :
      {

          savePage : function(ev) {
              var doc = ev.getData();
              if (doc.asm == null || doc.attrs == null) {
                  return;
              }
              var env = sm.app.Env.getDefault();
              var mongo = env.getMongo();

              //update tags statistic
              if (doc.tags != null && doc.attrs.tags != null) {
                  sm.cms.tags.TagsMgr.updateStatistic(doc.attrs.tags["value"], doc.tags);
              }

              //If main page saved
              var isMain = (doc.attrs._main_page_ != null) && (doc.attrs._main_page_.value == true);
              if (isMain) {
                  var conf = env.getConfig();
                  conf["main_page"] = doc["_id"].toString();
                  qx.log.Logger.warn(this, "Setting site main page to: " + conf["main_page"]);
                  env.setConfig(conf);

                  // flush _main_page_ flag for all other "main" pages
                  var ncoll = sm.cms.page.PageMgr.getColl();
                  ncoll.update({"asm" : doc.asm, "attrs._main_page_.value" : {"$exists" : true}, "_id" : {$ne : mongo.toObjectID(doc["_id"])}},
                    {$set : {"attrs._main_page_.value" : false}},
                    function(err, doc) {
                        if (err) {
                            qx.log.Logger.error(this, "sm.cms.handlers.SavePageHandler", err);
                        }
                    });
              }

              sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriptions(doc["_id"]);
          },

          removePage : function(ev) {
              var doc = ev.getData();

              //remove all subscriptions with this page
              sm.cms.page.AttrSubscriptionMgr.removeAllSubscriptions(doc["_id"], function(err) {
                  if (err) {
                      qx.log.Logger.error("sm.cms.handlers.SavePageHandler#removeAllSubscriptions", err);
                  }
              });
              sm.cms.page.AttrSubscriptionMgr.removeAllSubscribers(doc["_id"], function(err) {
                  if (err) {
                      qx.log.Logger.error("sm.cms.handlers.SavePageHandler#removeSubscribers", err);
                  }
              });


              if (doc.asm == null || doc.tags == null) {
                  return;
              }
              //update tags statistic
              sm.cms.tags.TagsMgr.updateStatistic(doc.tags, []);
          }
      },

      defer : function(statics) {
          var ee = sm.cms.Events.getInstance();
          ee.addListener("pageSaved", statics.savePage, sm.cms.handlers.SavePageHandler);
          ee.addListener("pageRemoved", statics.removePage, sm.cms.handlers.SavePageHandler);
      }
  });
