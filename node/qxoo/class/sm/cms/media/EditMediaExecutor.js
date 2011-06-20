/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.media.EditMediaExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

      members :
      {
          __info : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["ref"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var mediaId = req.params["ref"];
              var me = this;

              var coll = sm.cms.media.MediaMgr.getColl();
              var q = {"_id" : coll.toObjectID(mediaId)};
              var opts = {};

              coll.findOne(q, opts, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeJSONObject(doc || {}, resp, ctx);
              });
          },

          __list : function(req, resp, ctx) {
              var mediaId = req.params["ref"] || "root";
              var me = this;

              var res = [];
              var q = sm.cms.media.MediaMgr.getChildNodesQuery(mediaId == "root" ? null : mediaId);
              if (!!req.params["type"]) {
                  q.updateQuery({"type" : +req.params["type"]});
              }
              q.each(
                function(index, doc) {
                    res.push(doc);
                }).exec(function() {
                    me.writeJSONObject(res, resp, ctx);
                });
          },

          __upload : function(req, resp, ctx) {
              if (req.params["parent"] == null) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }

              var me = this;

              var async = $$node.require("async");

              var parentId = req.params["parent"];
              if (parentId.indexOf("media.") == 0) {
                  parentId = parentId.substring("media.".length);
              } else {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }
              var removed = [];  //Files to be removed

              var env = sm.app.Env.getDefault();
              var mongo = env.getMongo();
              var constraints = env.getConfig()["constrains"] || {"maxUploadFileSize" : 10 * 1024};
              var errors = [];

              var finish = function() {
                  var res = {
                      errors : errors
                  };
                  try {
                      me.writeString(JSON.stringify(res), resp, ctx);
                  } finally {
                      //Perform cleanup
                      for (var i = 0; i < removed.length; ++i) {
                          $$node.fs.unlink(removed[i], function(err) {
                              if (err) {
                                  qx.log.Logger.error(me, "Unable to remove file", err);
                              }
                          });
                      }
                  }
              };

              var writeMF = function(fmeta, cb) {
                  mongo.openGridFile(fmeta["gfname"], "w", fmeta["type"], null, function(err, gf) {
                      if (err) {
                          cb(err);
                          return;
                      }
                      gf.writeFile(fmeta["path"], function(err) {
                          if (err) {
                              cb(err);
                              return;
                          }
                          gf.close(cb);
                      });
                  });
              };

              //Save function
              var saveMf = function(fmeta, cb) {
                  removed.push(fmeta["path"]);

                  if (fmeta.type == null || fmeta.type == "") {
                      cb();
                      return;
                  }
                  if (fmeta.size > constraints["maxUploadFileSize"]) {
                      var mb = Math.floor((constraints["maxUploadFileSize"] / 1024 / 1024));
                      errors.push("Для '" + fmeta["name"] + "' превышен максимальный размер загружаемого файла: " + mb + "Мб");
                      cb();
                      return;
                  }

                  var node = sm.cms.media.MediaMgr.buildNode(fmeta);

                  sm.cms.media.MediaMgr.createNodeForParent(req.getUserId(),
                    parentId == "root" ? undefined : parentId,
                    node, function(err, doc) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        fmeta["gfname"] = "media" + doc["_id"];
                        writeMF(fmeta, cb);
                    });
              };

              //Perform async save for each file
              async.forEach(qx.lang.Object.getValues(req.form.files), qx.lang.Function.bind(saveMf, this), function(err) {
                  if (err) {
                      qx.log.Logger.error(me, err);
                  }
                  //Update pageinfo with saved media
                  finish();
              });
          },

          __remove : function(req, resp, ctx) {
              if (req.params["ref"] == null) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }

              var me = this;
              var env = sm.app.Env.getDefault();
              var ref = req.params["ref"];
              if (ref.indexOf("media.") == 0) {
                  ref = ref.substring("media.".length);
              } else {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }

              var mongo = env.getMongo();
              var gstore = mongo.gridStore();

              gstore.unlink(mongo.getDB(), "media" + ref, {}, function(err) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  sm.cms.media.MediaMgr.rmNode(req, ref, function(err) {
                      if (err) {
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      me.writeJSONObject({}, resp, ctx);
                  })
              });
          }
      },

      handlers :
      {
          //Мета-информация о медиа ресурсе
          "/medialib/info" : {
              webapp : "adm",
              handler : "__info"
          },

          //Список медиа ресурсов
          "/medialib/list" : {
              webapp : "adm",
              handler : "__list"
          },

          //добавление медиа ресурса
          "/medialib/upload" : {
              webapp : "adm",
              handler : "__upload"
          },

          //удаление медиа ресурса
          "/medialib/remove" : {
              webapp : "adm",
              handler : "__remove"
          }
      }
  });