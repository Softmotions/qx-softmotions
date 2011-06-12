/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 *
 * MongoDB model Item
 *
 * navItem : {
 *    parent : dbref
 *    name : String,
 *    mdate : Date,
 *    published : Boolean
 *    type : int [0 - category, 1 - page, 2 - news page]
 *    asm  : String, name of assembly on which page based
 *    tags : [tagName]
 *    attrs : {},
 *    extra : {},
 *    media : [fnames],
 *    hierarchy : [nodeIds], // parent nodes ids (with out current node id)
 *    cachedPath : String,
 *    owner : String //Page owner
 *    category : String //News category, only for news pages
 *    annotation : String //News annotation, only for news pages
 *    access : {     //Access rights
 *       <mode name> : [users]
 *    }
 * }
 *
 */
qx.Class.define("sm.cms.page.PageMgr", {

      statics :
      {

          TYPE_CATEGORY : 0,

          TYPE_PAGE : 1,

          TYPE_NEWS_PAGE : 2,



          __getMongo : function() {
              return sm.app.Env.getDefault().getMongo();
          },

          getColl : function() {
              return this.__getMongo().collection("navtree");
          },

          fetchNodeById : function(nodeId, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              coll.findOne({"_id" : mongo.toObjectID(nodeId)}, cb);
          },

          rmNode : function(nodeId, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();
              coll.findOne({"_id" : mongo.toObjectID(nodeId)}, function(err, doc) {
                  if (err) {
                      cb(err);
                      return;
                  }
                  if (!doc) {
                      cb("Node not found!");
                      return;
                  }

                  coll.remove(doc, function(err) {
                      if (err) {
                          cb(err);
                          return;
                      }
                      var ee = sm.cms.Events.getInstance();
                      ee.fireDataEvent("pageRemoved", doc);

                      cb(null);
                  });
              });
          },

          /**
           * Create new node for specified parent
           *
           * @param parentId {String} parent node id
           * @param node {pagenode} node specification
           */
          createNodeForParent : function(parentId, node, cb) {
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
                      // todo translate
                      cb("Страница с именем: '" + node.name + "' уже существует", null);
                      return;
                  }

                  doc = node;

                  var save = function(parent) {
                      doc["cachedPath"] = (parent ? parent["cachedPath"] || "" : "") + "/" + doc["name"];
                      doc["hierarchy"] = parent ? (parent["hierarchy"] ? [].concat(parent["hierarchy"]).concat(parent["_id"]) : [parent["_id"]]) : [];
                      coll.save(doc, cb);
                  };

                  if (parentId) {
                      doc["parent"] = coll.toDBRef(parentId);
                      sm.cms.page.PageMgr.fetchNodeById(parentId, function(err, parent) {
                          if (err) {
                              cb(err, null);
                              return;
                          }
                          if (!parent) {
                              cb("Parent node not found", null);
                              return;
                          }
                          save(parent);
                      });
                  } else {
                      delete doc["parent"];
                      save(null);
                  }
              });
          },

          /**
           * Rename specified node
           *
           * @param nodeId {String} node id
           * @param name {String} new node name
           */
          renameNode : function(nodeId, name, cb) {
              sm.cms.page.PageMgr.updateNode(nodeId,
                {
                    "name": qx.lang.String.trim(name),
                    "mdate": qx.lang.Date.now()
                },
                cb);
          },

          /**
           * Update node
           *
           * @param nodeId {String} node id
           * @param node {pagenode} new node specification
           */
          updateNode : function(nodeId, node, cb) {
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

                  var updateCache = doc["name"] != node["name"];
                  // пытаемся найти в текущем разделе ноду с новым именем. если её нет - сохраняем
                  var q = sm.cms.page.PageMgr.getChildNodesQuery(doc["parent"] ? mongo.toObjectID(doc["parent"]["oid"]) : null);
                  q.updateQuery({"name": node["name"], "_id": {"$ne": mongo.toObjectID(doc["_id"])}});
                  coll.findOne(q.getQuery(), function(err, cand) {
                      if (err) {
                          cb(err, null);
                          return;
                      }
                      if (cand) {
                          // todo translate
                          cb("Страница с именем: '" + node.name + "' уже существует", null);
                          return;
                      }
                      qx.lang.Object.mergeWith(doc, node, true);
                      coll.save(doc, !updateCache ? cb : function(err) {
                          if (err) {
                              cb(err);
                              return;
                          }
                          sm.cms.page.PageMgr.__updateNodeCachedPath(doc, cb);
                      });
                  });
              });
          },

          /**
           * Generate root level navigation item
           *
           * @param path {String} navigation path prefix
           * @param label {String} navigation item label
           */
          buildRootNavItem : function(path, label) {
              return {
                  "id" : path + ".root",
                  "cont" : true,
                  "label" : label.toString(),
                  "opened" : true,
                  "asm" : null
              };
          },

          /**
           * Generate navigation item for specified node
           *
           * @param path {String} navigation path prefix
           * @param doc {pagenode} node
           */
          buildNavItem : function(path, doc) {
              return {
                  "id" : path + "." + doc["_id"],
                  "cont" : doc["type"] == this.TYPE_CATEGORY,
                  "label" : doc["name"],
                  "opened" : false,
                  "asm": doc["asm"]
              };
          },

          /**
           * Build specification for category node
           */
          buildCategoryNode : function(params) {
              return {
                  "name" : qx.lang.String.trim(params["name"]),
                  "type" : this.TYPE_CATEGORY,
                  "mdate" : qx.lang.Date.now()
              };
          },

          /**
           * Build specification for page node
           */
          buildNode : function(params) {
              return {
                  "name" : qx.lang.String.trim(params["name"]),
                  "type" : this.TYPE_PAGE,
                  "mdate" : qx.lang.Date.now()
              };
          },

          /**
           * Build specification for news node
           */
          buildNewsNode : function(params) {
              var coll = this.getColl();
              return {
                  "name" : qx.lang.String.trim(params["name"]),
                  "refpage" : coll.toDBRef(params["refpage"]),
                  "type" : this.TYPE_NEWS_PAGE,
                  "mdate" : qx.lang.Date.now()
              };
          },


          ///////////////////////////////////////////////////////////////////////////
          //                            Quering                                    //
          ///////////////////////////////////////////////////////////////////////////


          /**
           * Returns query for fetch child node with specified parent
           *
           * @param parentId {String} Parent node id or <code>null</code>
           */
          getChildNodesQuery : function(parentId) {
              var navcoll = this.getColl();
              var q;
              if (parentId == null) { //only root nodes
                  q = {"parent" : {"$exists" : false},
                      "type" : {"$in" : [this.TYPE_CATEGORY, this.TYPE_PAGE]}};
              } else {
                  q = {"parent" : navcoll.toDBRef(parentId)}; //childs
              }
              return navcoll.createQuery(q, {"sort":[
                    ["name", 1]
                ]});
          },


          /**
           * params:
           * <code>
           *   type :
           *   refpage :
           *
           *   stext :
           *      or
           *   name :
           *
           *   sdate :
           *   edate :
           *
           *   published:
           *   categories:
           *
           *   sortAsc :
           *
           *   firstRow :
           *   lastRow :
           *
           *      or
           *
           *   limit :
           *   skip :
           * </code>
           *
           * @param qspec {Object}
           * @param fields {Object?null}
           * @throws Error if qspec is incorrect
           */
          getPagesSearchQuery : function(qspec, fields) {

              var coll = this.getColl();
              var qp = {};
              var opts = {
                  sort : []
              };

              var type = (typeof qspec["type"] === "string") ? parseInt(qspec["type"]) : qspec["type"];
              if (!isNaN(type)) {
                  qp["type"] = type;
              }
              if (qspec["refpage"] != null) {
                  qp["refpage"] = coll.toDBRef(qspec["refpage"]);
              }
              if (!sm.lang.String.isEmpty(qspec["stext"])) { //Name pattern as regexp
                  //todo hardcoded language
                  var stemmer = $$node.require("utils/snowball").russianStemmer; //get token stemmer
                  var stext = qspec["stext"].trim().toLowerCase();
                  var srcArr = stext.split(/\s/);
                  var inArr = [];  //todo introduce helpers
                  for (var i = 0; i < srcArr.length; ++i) {
                      stemmer.setCurrent(srcArr[i]);
                      stemmer.stem();
                      var curr = stemmer.getCurrent();
                      if (!curr || curr.length < 3) {
                          continue;
                      }
                      inArr.push(curr);
                  }
                  qp["keywords"] = {$all : inArr};
              } else if (!sm.lang.String.isEmpty(qspec["name"])) { //Or simple name
                  qp["name"] = qspec["name"];
              }
              if (qspec["published"] != null) {
                  qp["published"] = (typeof qspec["published"] === "string") ? ("true" == qspec["published"]) : qspec["published"];
              }

              //Date ranges
              try {
                  var df = sm.cms.util.DateTimeHelper.DDMMYYYY_FMT;
                  var sdate = null;
                  if (qspec["sdate"] != null && qspec["sdate"] != "") { //from modification date
                      sdate = qspec["sdate"];
                      sdate = (typeof sdate === "string") ? df.parse(sdate) : new Date(sdate);
                      sdate = sdate.getTime();
                  }
                  var edate = null;
                  if (qspec["edate"] != null && qspec["edate"] != "") { //from modification date
                      edate = qspec["edate"];
                      edate = (typeof edate === "string") ? df.parse(edate) : new Date(edate);
                      edate = edate.getTime();
                  }
                  if (sdate && edate) {
                      qp["$where"] = coll.toCode("this.mdate >= sdate && this.mdate <= edate", {
                            "sdate" : sdate,
                            "edate" : edate
                        });
                  } else if (sdate) {
                      qp["mdate"] = {$gte : sdate};
                  } else if (edate) {
                      qp["mdate"] = {$lte : edate};
                  }
              } catch(err) {
                  qx.log.Logger.error(this, err);
                  //noop on dates
              }


              var cats = qspec["categories"];
              if (cats != null && cats.constructor === Array && cats.length > 0) {
                  qp["category"] = {$in : qspec["categories"]};
              }
              if (qspec["sortAsc"] != null) {
                  opts["sort"].push([qspec["sortAsc"], 1]);
              }
              if (qspec["sortDesc"] != null) {
                  opts["sort"].push([qspec["sortDesc"], -1]);
              }

              if (opts["sort"].length == 0) {
                  opts["sort"].push(["mdate", -1]);
              }

              if (qspec["firstRow"] != null) {
                  var frow = (typeof qspec["firstRow"] === "string") ? parseInt(qspec["firstRow"]) : qspec["firstRow"];
                  var lrow = (typeof qspec["lastRow"] === "string") ? parseInt(qspec["lastRow"]) : qspec["lastRow"];
                  if (isNaN(frow) || isNaN(lrow)) {
                      throw new Error("Invalid 'firstRow' or 'lastRow' in qspec: " + qx.util.Json.stringify(qspec));
                  }
                  opts["skip"] = frow;
                  opts["limit"] = Math.abs(lrow - frow) + 1;
              } else {
                  if (qspec["limit"] != null) {
                      var limit = (typeof qspec["limit"] === "string") ? parseInt(qspec["limit"]) : qspec["limit"];
                      if (isNaN(limit)) {
                          throw new Error("Invalid 'limit' in qspec: " + qx.util.Json.stringify(qspec));
                      }
                      opts["limit"] = limit;
                  }
                  if (qspec["skip"] != null) {
                      var skip = (typeof qspec["skip"] === "string") ? parseInt(qspec["skip"]) : qspec["skip"];
                      if (isNaN(skip)) {
                          throw new Error("Invalid 'skip' in qspec: " + qx.util.Json.stringify(qspec));
                      }
                      opts["skip"] = skip;
                  }
              }
              opts["fields"] = fields || {
                  "_id" : 1,
                  "name" : 1,
                  "mdate" : 1,
                  "published" : 1
              };

              return coll.createQuery(qp, opts);
          },


          ///////////////////////////////////////////////////////////////////////////
          //                             Security                                  //
          ///////////////////////////////////////////////////////////////////////////


          /**
           * List of pages user(userId) have access with specified mode (modes)
           * @param userId {String} User id
           * @param modes {String|Array} Access modes
           */
          getAcessPagesQuery : function(userId, modes) {
              if (typeof modes === "string") {
                  modes = [modes];
              }
              var q = {
                  $or : [
                      {owner : userId}
                  ]
              };
              var access = {};
              var coll = this.getColl();
              for (var i = 0; i < modes.length; ++i) {
                  if (i == 0) {
                      q["$or"].push(access);
                  }
                  access["access." + modes[i]] = userId;
              }
              return coll.createQuery(q);
          },

          /**
           * Return true if action is allowed for page document
           * @param action {String} Must be either 'edit' or 'news'
           * @param pageId {String} Page ID
           * @param req Request
           */
          isPageActionAllowed :  function(action, pageId, req, cb) {
              qx.core.Assert.assertInArray(action, ["edit", "news"]);

              var me = this;
              var checkAccess = function(doc) {
                  if (req.isUserInRoles(["admin"])) {
                      cb(null, true);
                      return;
                  }
                  if (action == "edit" && req.isUserInRoles(["structure.admin"])) {
                      cb(null, true);
                      return;
                  }
                  if (action == "news" && req.isUserInRoles(["news.admin"])) {
                      cb(null, true);
                      return;
                  }
                  var uid = req.getUserId();
                  if (doc["owner"] == uid) {
                      cb(null, true);
                      return;
                  }
                  var access = doc["access"] || {};
                  var alist = access[action] || [];
                  if (alist.indexOf(uid) != -1) {
                      cb(null, true);
                      return;
                  }

                  //if we want to edit news page
                  if (action == "edit" && doc["type"] == me.TYPE_NEWS_PAGE && doc["refpage"]) {
                      var ref = doc["refpage"];
                      me.isPageActionAllowed("news", ref.oid, req, cb);
                      return;
                  }

                  cb(null, false);
              };


              var coll = this.getColl();
              coll.findOne({_id : coll.toObjectID(pageId)},
                {fields : {"owner" : 1, "access" : 1, "type" : 1, "refpage" : 1}},
                function(err, doc) {
                    if (err) {
                        cb(err, false);
                        return;
                    }
                    checkAccess(doc);
                });

          },


          ///////////////////////////////////////////////////////////////////////////
          //                            System                                     //
          ///////////////////////////////////////////////////////////////////////////

          /**
           * Updates node cachedPath for all nodes, witch contains specified node in hierarchy
           *
           * @param node {String} modified node
           */
          __updateNodeCachedPath: function(node, cb) {
              var mongo = this.__getMongo();
              var coll = this.getColl();

              var iteration = 0;
              var errors = [];
              var gcb = function(err) {
                  if (err) {
                      errors.push(err);
                  }
                  if (--iteration == 0) {
                      cb(errors.length > 0 ? errors : null);
                  }
              };

              // recursion for updating cached path
              var update = function(cnode, parentPath) {
                  ++iteration;
                  var path = (parentPath || "") + "/" + cnode["name"]; // current path = parent path + / + current name
                  var cnodeId = mongo.toObjectID(cnode["_id"]);
                  coll.update({"_id" : cnodeId}, {"$set" : {"cachedPath" : path}}, function(err) {
                      if (err) {
                          gcb(err);
                          return;
                      }

                      coll.createQuery({"parent" : coll.toDBRef(cnodeId)}, {"fields" : {"_id" : 1, "name" : 1}})
                        .each(function(index, unode) {
                            update(unode, path);
                        })
                        .exec(function(err) {
                            gcb(err);
                        });
                  });
              };

              // search for parent (getting parent cached path)
              if (node["parent"]) {
                  coll.findOne({"_id": mongo.toObjectID(node["parent"]["oid"])},
                    {"fields":{"cachedPath": 1}},
                    function(err, parent) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        if (!parent) {
                            cb("Parent not found");
                            return;
                        }
                        update(node, parent["cachedPath"]);
                    });

              } else {
                  update(node, "");
              }
          }
      }
  });
