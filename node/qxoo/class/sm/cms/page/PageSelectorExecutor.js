/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Query frontend for site pages
 */
qx.Class.define("sm.cms.page.PageSelectorExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

      members :
      {

          __select_pages : function(req, resp, ctx) {
              var amap = ctx._vhost_engine_.getBuiltInAssemblyMap();
              var me = this;
              var q = this.__build_basic_pages_query(req.params);
              var rarr = [];
              q.each(
                function(index, doc) {
                    var asm = amap[doc["asm"]];
                    var item = {
                        "name" : doc["name"],
                        "mdate" : doc["mdate"] ? doc["mdate"].toNumber() : null,
                        "published" :  doc["published"],
                        "template" : asm ? asm["name"] : null,
                        "refpage" : doc["refpage"] ? doc["refpage"]["oid"] : null,
                        "type" : doc["type"],
                        "id" : doc["_id"]
                    };
                    rarr.push(item);
                }).exec(function(err) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    me.writeJSONObject(rarr, resp, ctx);
                });
          },

          __select_pages_count : function(req, resp, ctx) {
              var me = this;
              var q = this.__build_basic_pages_query(req.params);
              q.count(function(err, count) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject(count, resp, ctx);
              });
          },

          __build_basic_pages_query : function(params) {
              var pmgr = sm.cms.page.PageMgr;
              var q = null;
              try {
                  q = pmgr.getPagesSearchQuery(params, {
                        "_id" : 1,
                        "name" : 1,
                        "mdate" : 1,
                        "published" : 1,
                        "asm" : 1,
                        "type" : 1,
                        "refpage" : 1
                    });
              } catch(e) {
                  qx.log.Logger.error(this, e);
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              //qx.log.Logger.info("q=" + q.dumpQuery());
              return q;
          }
      },

      handlers :
      {

          /**
           * Retrieve pages
           */
          "/select/pages" : {
              webapp : "adm",
              handler : "__select_pages"
          },


          /**
           * Retrive pages count
           */
          "/select/pages/count" : {
              webapp : "adm",
              handler : "__select_pages_count"
          }
      }

  });

