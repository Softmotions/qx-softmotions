/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 *
 * MongoDB model Item
 *
 * navItem : {
 *    parent : dbref,
 *    refpage : dbref,      //Referenced page for news pages
 *    name : String,        //Page name
 *    mdate : Date,         //Page modification time
 *    cdate : Date,         //Page creation time
 *    popupdate : Date      //Popup date for news pages
 *    published : Boolean
 *    type : int [0 - category, 1 - page, 2 - news page]
 *    asm  : String, name of assembly on which page based
 *    tags : [tagName]
 *    attrs : {},
 *    extra : {},
 *    media : [fnames],
 *    hierarchy : [nodeIds], //parent nodes ids (with out current node id)
 *    cachedPath : String,
 *    alias : String,        //Page alias
 *    aliasFix : String      //User defined page alias, instead transliterated page name will be used
 *    creator : String       //Page creator user ID
 *    owner : String         //Page owner user ID
 *    category : String      //News category, only for news pages
 *    annotation : String    //News annotation, only for news pages
 *    visit_count : Integer  //News visit count
 *    access : {             //Access rights
 *       <mode name> : [users]
 *    }
 * }
 *
 *
 *
 */
qx.Class.define("sm.cms.page.PageMgr", {

    statics :
    {
        tr : null, //qx.locale.Manager.tr


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

        rmNode : function(req, nodeId, cb) {
            var me = this;
            this.getPageAccessMask(req, nodeId, function(err, mask) {
                if (err) {
                    cb(err);
                    return;
                }
                if (mask.indexOf("d") == -1) {
                    cb(me.tr("You don't have access to delete page"));
                    return;
                }
                var coll = me.getColl();
                coll.findOne({"_id" : coll.toObjectID(nodeId)}, function(err, doc) {
                    if (err) {
                        cb(err);
                        return;
                    }
                    if (!doc) {
                        cb("Node not found!");
                        return;
                    }
                    coll.count({"parent" : coll.toDBRef(nodeId)}, function(err, count) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        if (count > 0) {
                            cb(me.tr("This section have subpages, please remove them first"));
                            return;
                        }
                        coll.remove({"_id" : coll.toObjectID(nodeId)}, function(err) {
                            if (err) {
                                cb(err);
                                return;
                            }
                            var ee = sm.cms.Events.getInstance();
                            ee.fireDataEvent("pageRemoved", doc);
                            cb(null);
                        });
                    });
                });
            });
        },


        /**
         * Return full page alias as if page is direct child of the parent
         * @param parent
         * @param doc
         */
        getPageAliasFromParent : function(parent, doc) {
            if (doc["alias"] === "-") {
                return "-";
            }
            return (parent && parent["alias"] && parent["alias"] !== "-" ? parent["alias"] : "") + "/" + this.getPageAliasSuffix(doc)
        },

        /**
         * Return atomic alias suffix of given page.
         * Full hierarchy page alias doc['alias'] computed during page saving
         */
        getPageAliasSuffix : function(doc) {
            var suff = sm.lang.String.isEmpty(doc["aliasFix"]) ? doc["name"] : doc["aliasFix"];
            suff = this._normalizeAliasString(suff);
            if (doc.type == this.TYPE_NEWS_PAGE) {
                var cdate = doc["cdate"] ? new Date(doc["cdate"]) : new Date();
                suff = (cdate.getFullYear() + "/" + (cdate.getMonth() + 1) + "/" + cdate.getDate()) + "/" + suff;
            }
            return suff;
        },

        _normalizeAliasString : function(alias) {
            if (sm.lang.String.isEmpty(alias)) {
                return null;
            }
            alias = alias.trim();
            if (alias === "-") {
                return alias;
            }
            return sm.nsrv.HTTPUtils.toContentDisposition(alias).toLocaleLowerCase();
        },

        /**
         * Override page alias by user-defined value
         * @param page
         * @param aliasFix
         * @param cb
         */
        fixPageAlias : function(page, aliasFix, cb) {
            var me = this;
            aliasFix = this._normalizeAliasString(aliasFix);
            var coll = me.getColl();
            if (page["aliasFix"] === aliasFix) {
                cb();
                return;
            }
            page["aliasFix"] = aliasFix;
            if (aliasFix === "-") {
                page["alias"] = "-";
            } else if (aliasFix == null) {
                delete page["alias"];
                delete page["aliasFix"];
            }
            var getParent = function(pref, cb) {
                if (pref == null || pref["oid"] == null) {
                    cb(null, null)
                } else {
                    coll.findOne({"_id" : coll.toObjectID(pref["oid"])}, {"fields" : {"alias" : 1, "type" : 1, "name" : 1}}, cb);
                }
            };
            getParent(page["parent"], function(err, parent) {
                if (err) {
                    cb(err);
                    return;
                }
                if (page["alias"] === "-" && page["alias"] != aliasFix) {
                    delete page["alias"];
                }
                var alias = page["alias"] = me.getPageAliasFromParent(parent, page);
                if (alias !== "-") {
                    coll.update({"alias" : alias, "_id" : {"$ne" : coll.toObjectID(page._id)}}, {"$unset" : {"alias" : 1}}, function() {
                        me.updateNodeCachedData(page, cb);
                    });
                } else {
                    me.updateNodeCachedData(page, cb);
                }
            });
        },

        /**
         * Create new node for specified parent
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
            var me = this;
            var coll = this.getColl();
            var q = this.getChildNodesQuery(parentId);
            q.updateQuery({"name" : node.name});
            coll.findOne(q.getQuery(), function(err, doc) {
                if (err) {
                    cb(err, null);
                    return;
                }
                if (doc) {
                    cb(me.tr("Page with name: %1 already exists", node.name), null);
                    return;
                }

                doc = node;

                var save = function(parent) {
                    doc["cachedPath"] = (parent ? parent["cachedPath"] || "" : "") + "/" + doc["name"];
                    doc["alias"] = me.getPageAliasFromParent(parent, doc);
                    doc["hierarchy"] = parent ? (parent["hierarchy"] ? [].concat(parent["hierarchy"]).concat(parent["_id"]) : [parent["_id"]]) : [];
                    doc["owner"] = doc["creator"] = userId;
                    if (doc["cdate"] == null) {
                        doc["cdate"] = doc["mdate"];
                    }
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
        renameNode : function(req, nodeId, name, options, cb) {
            var me = this;
            this.getPageAccessMask(req, nodeId, function(err, mask) {
                if (err) {
                    cb(err);
                    return;
                }
                if (mask.indexOf("r") == -1) {
                    cb(me.tr("You don't have access to change page name"));
                    return;
                }
                me._updateNode(nodeId, {
                      "name": qx.lang.String.trim(name),
                      "mdate": qx.lang.Date.now()
                  },
                  options,
                  cb);
            });
        },

        /**
         * Update node
         *
         * @param nodeId {String} node id
         * @param node {pagenode} new node specification
         * @param options options for update
         *                  nameNonUnique - if true don't check node name unique
         */
        _updateNode : function(nodeId, node, options, cb) {
            var me = this;
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

                var doUpdate = function() {
                    qx.lang.Object.mergeWith(doc, node, true);
                    if (doc["cdate"] == null) {
                        doc["cdate"] = doc["mdate"];
                    }
                    coll.save(doc, !updateCache ? cb : function(err) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        me.updateNodeCachedData(doc, cb);
                    });
                };

                // check name unique if:
                //    page is not news
                //    options not specified
                //    "nameNonUnique" option is not "true"
                if (doc["type"] != me.TYPE_NEWS_PAGE && (!options || !options["nameNonUnique"])) {
                    var q = sm.cms.page.PageMgr.getChildNodesQuery(doc["parent"] ? mongo.toObjectID(doc["parent"]["oid"]) : null);
                    q.updateQuery({"name" : node["name"], "_id" : {"$ne": mongo.toObjectID(doc["_id"])}});
                    coll.findOne(q.getQuery(), function(err, cand) {
                        if (err) {
                            cb(err, null);
                            return;
                        }
                        if (cand) {
                            cb(me.tr("Page with name: %1 already exists", node.name));
                            return;
                        }
                        doUpdate();
                    });
                } else {
                    doUpdate();
                }
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
            var now = qx.lang.Date.now();
            return {
                "name" : qx.lang.String.trim(params["name"]),
                "type" : this.TYPE_CATEGORY,
                "mdate" : now,
                "cdate" : now
            };
        },

        /**
         * Build specification for page node
         */
        buildNode : function(params) {
            var now = qx.lang.Date.now();
            return {
                "name" : qx.lang.String.trim(params["name"]),
                "type" : this.TYPE_PAGE,
                "mdate" : now,
                "cdate" : now
            };
        },

        /**
         * Build specification for news node
         */
        buildNewsNode : function(params) {
            var coll = this.getColl();
            var now = qx.lang.Date.now();
            return {
                "name" : qx.lang.String.trim(params["name"]),
                "refpage" : coll.toDBRef(params["refpage"]),
                "type" : this.TYPE_NEWS_PAGE,
                "mdate" : now,
                "cdate" : now,
                "popupdate" : now
            };
        },


        ///////////////////////////////////////////////////////////////////////////
        //                            Quering                                    //
        ///////////////////////////////////////////////////////////////////////////


        getChildNodesQueryForNav : function(parentId) {
            var q = this.getChildNodesQuery(parentId);
            q.updateOptions({"fields" : {"name" : 1, "asm" : 1, "parent" : 1, "published" : 1, "type" : 1, "mdate" : 1}});
            return q;
        },


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
         *   type {String|Number|Array}:
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
            if (type != null) {
                if (type.constructor === Array && type.length > 0) {
                    qp["type"] = {"$in" : type};
                } else if (!isNaN(type)) {
                    qp["type"] = type;
                }
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
                    throw new Error("Invalid 'firstRow' or 'lastRow' in qspec: " + qx.lang.Json.stringify(qspec));
                }
                opts["skip"] = frow;
                opts["limit"] = Math.abs(lrow - frow) + 1;
            } else {
                if (qspec["limit"] != null) {
                    var limit = (typeof qspec["limit"] === "string") ? parseInt(qspec["limit"]) : qspec["limit"];
                    if (isNaN(limit)) {
                        throw new Error("Invalid 'limit' in qspec: " + qx.lang.Json.stringify(qspec));
                    }
                    opts["limit"] = limit;
                }
                if (qspec["skip"] != null) {
                    var skip = (typeof qspec["skip"] === "string") ? parseInt(qspec["skip"]) : qspec["skip"];
                    if (isNaN(skip)) {
                        throw new Error("Invalid 'skip' in qspec: " + qx.lang.Json.stringify(qspec));
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
         * Return page access mask, which is string
         * every character of it indicates specific access mode.
         *
         * Modes:
         * <ul>
         *    <li>e - edit page</li>
         *    <li>n - manage page news</li>
         *    <li>d - Can drop page</li>
         *    <li>r - Can rename page</li>
         * </ul>
         *
         *
         * @param req {Request}
         * @param pageId {String|ObjectID} Page ID
         * @param cb {function(err, accessMode)}
         */
        getPageAccessMask : function(req, pageId, _cb) {
            if (pageId == null) {
                _cb(null, "");
                return;
            }
            var me = this;
            var uid = req.getUserId();
            var coll = this.getColl();

            function pushMask(amask, toadd) {
                for (var i = 0; i < toadd.length; ++i) {
                    if (amask.indexOf(toadd.charAt(i)) == -1) {
                        amask.push(toadd.charAt(i));
                    }
                }
                return amask;
            }

            function getDoc(docId, cb) {
                coll.findOne(
                  {_id : coll.toObjectID(docId)},
                  {fields : {"owner" : 1, "creator" : 1, "access" : 1, "type" : 1, "refpage" : 1, "parent" : 1}},
                  cb);
            }

            function getDocAccess(docId, lvl, amask, cb) {
                if (docId == null) {
                    cb(null, null, amask);
                    return;
                }
                getDoc(docId, function(err, doc) {
                    if (err || doc == null) {
                        cb(err, doc, amask);
                        return;
                    }
                    if (doc["owner"] == uid) {
                        pushMask(amask, "en");
                    }
                    if (doc["creator"] == uid) {
                        pushMask(amask, "endr");
                        cb(null, null, amask);
                        return;
                    }

                    if (lvl === 0) {
                        if (req.isUserInRoles(["structure.admin"])) {
                            pushMask(amask, "endr");
                            cb(null, null, amask);
                            return;
                        }
                        if (req.isUserInRoles(["news.admin"])) {
                            pushMask(amask, "n");
                        }
                        if (doc["type"] == me.TYPE_NEWS_PAGE && doc["refpage"] && (amask.indexOf("e") == -1 || amask.indexOf("d") == -1)) { //Cheking for news page
                            if (req.isUserInRoles(["news.admin"])) { //if we news admin
                                cb(null, null, pushMask(amask, "edr"));
                                return;
                            }
                            me.getPageAccessMask(req, doc["refpage"].oid, function(err, pmask) {
                                if (err) {
                                    cb(err);
                                    return;
                                }
                                if (pmask.indexOf("n") != -1) {
                                    pushMask(amask, "edr");
                                }
                                cb(null, null, amask);
                            });
                            return;
                        }
                    }
                    var access = doc["access"] || {};
                    if (lvl === 0 || (access["recursive"] != null && access["recursive"].indexOf(uid) !== -1)) {
                        var alist = access["edit"];
                        if (alist != null && alist.indexOf(uid) != -1) {
                            pushMask(amask, "e");
                        }
                        alist = access["news"];
                        if (alist != null && alist.indexOf(uid) != -1) {
                            pushMask(amask, "n");
                        }
                        alist = access["del"];
                        if (alist != null && alist.indexOf(uid) != -1) {
                            pushMask(amask, "dr");
                        }
                    }
                    cb(null, doc, amask);
                });
            }

            var lvl = 0;
            getDocAccess(pageId, lvl, [], function(err, doc, amask) {
                if (err) {
                    _cb(err, "");
                    return;
                }
                if (doc == null || doc.parent == null || doc.parent.oid == null || amask.length === "endr".length) {
                    _cb(null, amask.join(""));
                    return;
                }
                //move up on page hierarchy
                getDocAccess(doc.parent.oid, ++lvl, amask, arguments.callee);
            });
        },

        ///////////////////////////////////////////////////////////////////////////
        //                            System                                     //
        ///////////////////////////////////////////////////////////////////////////

        /**
         * Updates node cachedPath|alias for all nodes, witch contains specified node in hierarchy
         *
         * @param node {String} modified node
         */
        updateNodeCachedData : function(node, cb) {
            var me = this;
            var mongo = this.__getMongo();
            var coll = this.getColl();
            var areg = sm.cms.page.AliasRegistry.getInstance();
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
            var update = function(cnode, parentPath, parentAlias) {
                ++iteration;
                var path = (parentPath || "") + "/" + cnode["name"]; // current path = parent path + / + current name
                var alias = (cnode["alias"] === "-") ? cnode["alias"] : ((parentAlias && parentAlias !== "-" ? parentAlias : "") + "/" + me.getPageAliasSuffix(cnode));
                var cnodeId = mongo.toObjectID(cnode["_id"]);
                coll.update({"_id" : cnodeId}, {"$set" : {"cachedPath" : path, "alias" : alias}}, function(err) {
                    if (err) {
                        gcb(err);
                        return;
                    }
                    areg.invalidateFor(cnodeId, alias);
                    coll.createQuery({"parent" : coll.toDBRef(cnodeId)}, {"fields" : {"_id" : 1, "name" : 1, "type" : 1, "cdate" : 1}})
                      .each(
                      function(index, unode) {
                          update(unode, path, alias);
                      }).exec(function(err) {
                          gcb(err);
                      });
                });
            };

            // search for parent (getting parent cached path)
            if (node["parent"]) {
                coll.findOne({"_id" : mongo.toObjectID(node["parent"]["oid"])},
                  {"fields" : {"cachedPath": 1, "alias" : 1}},
                  function(err, parent) {
                      if (err) {
                          cb(err);
                          return;
                      }
                      if (!parent) {
                          cb("Parent not found");
                          return;
                      }
                      update(node, parent["cachedPath"], parent["alias"]);
                  });
            } else {
                update(node, null, null);
            }
        }
    },

    defer : function(statics) {
        statics.tr = qx.locale.Manager.tr;
    }
});
