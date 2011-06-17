/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 *
 * MongoDB model Item
 *
 * mediaItem : {
 *    parent : dbref
 *    name : String,
 *    type : int [0 - category, 1 - resource]
 * }
 *
 */
qx.Class.define("sm.cms.media.MediaMgr", {

      statics : {
          __getMongo : function() {
              return sm.app.Env.getDefault().getMongo();
          },

          getColl : function() {
              return this.__getMongo().collection("mediatree");
          },

          fetchNodeById : function(nodeId, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              coll.findOne({"_id" : mongo.toObjectID(nodeId)}, cb);
          },

          /**
           * Fetch media node hierarchy by node id. Returns array with node items.
           * @param nodeId media id
           */
          fetchHierarchyNodeById : function(nodeId, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              var res = [];

              var addHierarchy = function(nId) {
                  coll.findOne({"_id" : mongo.toObjectID(nId)}, function(err, doc) {
                      if (err) {
                          cb(err, null);
                          return;
                      }
                      if (!doc) {
                          cb(null, res);
                          return;
                      }
                      res.unshift(doc);

                      if (!doc["parent"]) {
                          cb(null, res);
                      } else {
                          addHierarchy(doc["parent"]["oid"]);
                      }
                  });
              };

              addHierarchy(nodeId);
          },


          /**
           * Get node by path
           * @param path {Array} path array with names
           * @param fields {Object?null} Mongodb fields specification
           * @param cb {function(err, {Object} nodde)}
           */
          fetchNodeByNamePath : function(path, fields, cb) {
              if (path.constructor !== Array || path.length == 0) {
                  cb("Invalid path argument", null);
                  return;
              }
              var coll = this.getColl();
              var cind = 0;
              var fetchLvl = function(ind, parent) {
                  var name = path[ind];
                  var qs = {
                      name : name,
                      parent : (parent != null) ? coll.toDBRef(parent["_id"]) : {$exists : false}};
                  coll.findOne(qs, {fields : fields}, function(err, doc) {
                      if (err) {
                          cb(err, null);
                          return;
                      }
                      if (++cind == path.length || doc == null) {
                          cb(null, doc);
                          return;
                      }
                      fetchLvl(cind, doc);
                  });
              };
              fetchLvl(cind, null);
          },

          /**
           * Remove node.
           * Fired event sm.cms.Events#mediaRemoved
           */
          rmNode : function(req, nodeId, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              coll.findOne({"_id" : mongo.toObjectID(nodeId)}, function(err, doc) {
                  if (err) {
                      cb(err);
                      return;
                  }
                  if (!doc) {
                      cb("Node not found");
                      return;
                  }

                  // check name unique
                  var parentId = doc["parent"] ? mongo.toObjectID(doc["parent"]["oid"]) : null;
                  coll.remove(doc, function(err) {
                      if (!err) {
                          sm.cms.Events.getInstance().fireDataEvent("mediaRemoved", [parentId, nodeId]);
                      }
                      cb(err);
                  });
              });
          },

          /**
           * Create new media node for specified parent
           *
           * @param userId {String} userId creates node
           * @param parentId {String} parent node id
           * @param node {Map} node specification
           */
          createNodeForParent : function(userId, parentId, node, cb) {
              if (qx.core.Environment.get("app.debug")) {
                  qx.core.Assert.assertString(node.name);
                  qx.core.Assert.assertNumber(node.type);
              }
              var coll = this.getColl();
              var q = this.getChildNodesQuery(parentId);
              q.updateQuery({"name" : node.name});
              coll.findOne(q.getQuery(), function(err, doc) {
                  if (err) {
                      cb(err, null);
                      return;
                  }
                  if (doc) {
                      cb("Элемент с именем: '" + node.name + "' уже существует", null);
                      return;
                  }

                  doc = node;
                  if (parentId) {
                      doc["parent"] = coll.toDBRef(parentId);
                  } else {
                      delete doc["parent"];
                  }
                  doc["mdate"] = node["mdate"];
                  coll.save(doc, function(err, doc) {
                      if (!err) {
                          sm.cms.Events.getInstance().fireDataEvent("mediaAdded", [parentId, doc]);
                      }
                      cb(err, doc);
                  });
              });
          },

          /**
           * Rename node
           */
          renameNode : function(req, nodeId, name, cb) {
              this._updateNode(nodeId, {
                    "name": qx.lang.String.trim(name),
                    "mdate": qx.lang.Date.now()
                }, cb);
          },

          /**
           * Update node item.
           * Fired event sm.cms.Events#mediaUpdated
           */
          _updateNode : function(nodeId, node, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              coll.findOne({"_id" : mongo.toObjectID(nodeId)}, function(err, doc) {
                  if (err) {
                      cb(err, null);
                      return;
                  }
                  if (!doc) {
                      cb("Node not found", null);
                      return;
                  }

                  // check name unique
                  var parentId = doc["parent"] ? mongo.toObjectID(doc["parent"]["oid"]) : null;
                  var q = sm.cms.media.MediaMgr.getChildNodesQuery(parentId);
                  q.updateQuery({"name": node["name"], "_id": {"$ne": mongo.toObjectID(doc["_id"])}});
                  coll.findOne(q.getQuery(), function(err, cand) {
                      if (err) {
                          cb(err, null);
                          return;
                      }
                      if (cand) {
                          cb("Элемент с именем: '" + node.name + "' уже существует", null);
                          return;
                      }
                      qx.lang.Object.mergeWith(doc, node, true);
                      coll.save(doc, function(err, status) {
                          if (!err && status) {
                              sm.cms.Events.getInstance().fireDataEvent("mediaUpdated", [parentId, doc]);
                          }
                          cb(err, status);
                      });
                  });
              });
          },

          /**
           * Prepare query for fetch child nodes
           */
          getChildNodesQuery : function(parentId) {
              var navcoll = this.getColl();
              var q;
              if (parentId == null) {
                  q = {"parent" : {"$exists" : false}}; //only root nodes
              } else {
                  q = {"parent" : navcoll.toDBRef(parentId)}; //childs
              }
              return navcoll.createQuery(q, {"sort":[
                    ["name", 1]
                ]});
          },

          buildRootNavItem: function(path, label) {
              return {
                  "id" : path + ".root",
                  "cont" : true,
                  "label" : label.toString(),
                  "opened" : true
              };
          },

          buildNavItem: function(path, doc) {
              return {
                  "id" : path + "." + doc["_id"],
                  "cont" : doc["type"] == 0,
                  "label" : doc["name"],
                  "opened" : false
              };
          },

          buildCategoryNode: function(params) {
              return {
                  "name" : qx.lang.String.trim(params["name"]),
                  "type" : 0,
                  "cdate" : qx.lang.Date.now(),
                  "mdate" : qx.lang.Date.now()
              };
          },

          buildNode: function(params) {
              return {
                  "name" : qx.lang.String.trim(params["name"]),
                  "contentType" : params["type"] || "",
                  "type" : 1,
                  "cdate" : qx.lang.Date.now(),
                  "mdate" : qx.lang.Date.now()
              };
          }
      }
  });
