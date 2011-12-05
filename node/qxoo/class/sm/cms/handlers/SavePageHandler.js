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

            //update tags statistic
            if (doc.tags != null && doc.attrs.tags != null) {
                sm.cms.tags.TagsMgr.updateStatistic(doc.attrs.tags["value"], doc.tags);
            }

            //If main page saved
            var mainLang = env.getLangFromMainPage(doc);
            if (mainLang) {
                this._updateMain(doc, mainLang);
            }

            sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriptions(doc["_id"]);
        },

        _updateMain : function(doc, lang) {
            var env = sm.app.Env.getDefault();
            qx.log.Logger.warn(this, "Setting LANG ROOT: " + lang + " MAIN_PAGE to: " + doc._id.toString());
            env.setNavConfigProp(lang, "main_page", doc._id.toString());
            // flush _main_page_ flag for all other "main" pages for this language
            var ncoll = sm.cms.page.PageMgr.getColl();
            ncoll.update({"asm" : doc.asm, "attrs._main_page_.value" : {"$eq" : lang}, "_id" : {"$ne" : ncoll.toObjectID(doc["_id"])}},
              {"$unset" : {"attrs._main_page_" : 1}},
              function(err, doc) {
                  if (err) {
                      qx.log.Logger.error(this, "sm.cms.handlers.SavePageHandler", err);
                  }
              });
            env.setJSONConfig("navigation");
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
