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

              //todo !!!!! nsu site specific code !!!!

              //If main page saved
              var isMain = (doc.attrs._main_page_ != null) && (doc.attrs._main_page_.value == true);
              if (isMain) {
                  var conf = env.getConfig();
                  conf["main_page"] = doc["_id"].toString();
                  qx.log.Logger.warn("Setting site main page to: " + conf["main_page"]);
                  env.setConfig(conf);

                  // store main page navigation to config as a default navigation data
                  var nconf = env.getJSONConfig("navigation") || {};
                  if (doc.attrs.nav_bar != null) {
                      nconf["nav_bar"] = (doc.attrs.nav_bar.ctx || {}).items || [];
                      qx.log.Logger.warn("Setting default nav_bar to: " + qx.util.Json.stringify(nconf["nav_bar"]));
                  }
                  if (doc.attrs.headlinks != null) {
                      nconf["headlinks"] = doc.attrs.headlinks.ctx || [];
                      qx.log.Logger.warn("Setting default headlinks to: " + qx.util.Json.stringify(nconf["headlinks"]));
                  }
                  env.setJSONConfig("navigation", nconf);

                  var misc = env.getJSONConfig("misc");
                  misc.main_style = (doc.attrs.style != null && doc.attrs.style.value != null ? doc.attrs.style.value : null);
                  env.setJSONConfig("misc", misc);

                  // flush _main_page_ flag for all other "main" pages
                  var ncoll = sm.cms.page.PageMgr.getColl();
                  ncoll.update({"asm" : doc.asm, "attrs._main_page_.value" : {"$exists" : true}, "_id" : {$ne : mongo.toObjectID(doc["_id"])}},
                    {$set : {"attrs._main_page_.value" : false}},
                    function(err, doc) {
                        if (err) {
                            qx.log.Logger.error("sm.cms.handlers.SavePageHandler", err);
                        }
                    });
              }

          },

          removePage : function(ev) {
              var doc = ev.getData();
              if (doc.asm == null || doc.tags == null) {
                  return;
              }
              //update tags statistic
              sm.cms.tags.TagsMgr.updateStatistic(doc.tags, []);
          }
      },

      defer : function(statics) {
          var ee = sm.cms.Events.getInstance();
          ee.addListener("pageSaved", statics.savePage);
          ee.addListener("pageRemoved", statics.removePage);
      }
  });
