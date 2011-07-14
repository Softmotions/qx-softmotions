/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.EditPageExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor, qx.locale.MTranslation],

      members :
      {
          /**
           * Create new page
           */
          __newpage : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["name"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              if (!qx.lang.Type.isString(req.params["parent"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var parent = req.params["parent"];
              if (parent.indexOf("pages.") != 0) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              parent = parent.substring("pages.".length);//+ dot symbol
              if (parent == "root") {
                  parent = null;
              }

              var node = sm.cms.page.PageMgr.buildNode(req.params);
              var me = this;
              sm.cms.page.PageMgr.createNodeForParent(req.getUserId(), parent, node, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  var res = [];
                  res.push(sm.cms.page.PageMgr.buildNavItem("pages", doc));
                  me.writeJSONObject(res, resp, ctx);
              });
          },


          /**
           * Is current user allowed to use assembly with specified id (asmId)
           *
           * @param req {Request}
           * @param asmId {String}
           * @return true If current user is allowed to use asm with asmId
           */
          _isAllowedAsm : function(req, asmId) {
              if (asmId == "" || asmId == null) {
                  return req.isUserInRoles(["template:*"]);
              }
              return req.isUserInRoles(["template:*", "template:" + asmId]);
          },


          /**
           * Response available page templates
           */
          __templates : function(req, resp, ctx) {
              var me = this;
              var res = [];

              var category = req.params["category"];

              var amap = ctx._vhost_engine_.getBuiltInAssemblyMap();
              var asms = [];
              for (var an in amap) {
                  var asm = amap[an];
                  if ((typeof asm["name"]) !== "string" || asm["name"].length == 0 ||
                    !this._isAllowedAsm(req, asm["_name_"])) {
                      continue;
                  }
                  if ((category != null && asm["_category_"] != category) ||
                    (category == null && asm["_category_"] != null)) {
                      continue;
                  }
                  asms.push(asm);
              }

              var pageAsm = req.params["asm"]; //Add assembly
              if (pageAsm != null && pageAsm != "") {
                  var inList = false;
                  for (var i = 0; i < asms.length; ++i) {
                      if (asms[i]["_name_"] == pageAsm) {
                          inList = true;
                          break;
                      }
                  }
                  if (!inList) {
                      //Page assembly is not in allowed list, add it manually,
                      //farther security checks will be during page saving
                      var asm = amap[pageAsm];
                      if (asm && typeof asm["name"] === "string" && asm["name"].length > 0) {
                          asms.push(asm);
                      }
                  }
              }

              var c = asms.length;
              if (c == 0) {
                  this.writeJSONObject(res, resp, ctx);
                  return;
              }
              var saveMeta = function(asm) {
                  me.__asmMeta(asm, ctx, function(err, meta) {
                      --c;
                      res.push({
                            "asm"  : asm["_name_"],
                            "name" : asm["name"],
                            "meta" : meta
                        });
                      if (c == 0) {
                          res.sort(function(a, b) {
                              return a["name"].localeCompare(b["name"]);
                          });
                          me.writeJSONObject(res, resp, ctx);
                      }
                  });
              };
              for (var i = 0; i < asms.length; ++i) {
                  saveMeta(asms[i]);
              }
          },

          /**
           * Return metainfo for assembly
           *
           * @param asm{String|Object} if String it will iterpret as assembly name
           * @param ctx{Object} Web exec context
           */
          __asmMeta : function(asm, ctx, cb) {
              var me = this;
              var fr = function(err, asmObj) {
                  if (err) {
                      qx.log.Logger.error(me, err);
                      cb(null, {});
                      return;
                  }
                  var meta = {};
                  var metaArr = [];
                  var esm = asmObj;
                  while (esm) {
                      if (esm["_meta_"]) {
                          metaArr.push(esm["_meta_"]);
                      }
                      esm = esm["_extends_"];
                  }
                  for (var i = metaArr.length - 1; i >= 0; --i) {
                      qx.lang.Object.mergeWith(meta, metaArr[i], true);
                  }
                  cb(null, meta);
              };
              if ((typeof asm) === "string") {
                  ctx._vhost_engine_.loadAssembly(asm, fr);
              } else {
                  fr(null, asm);
              }
          },

          __info : function(req, resp, ctx) {
              if (!qx.lang.Type.isString(req.params["ref"])) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var uid = req.getUserId();
              var pageId = req.params["ref"];
              var me = this;

              var pmgr = sm.cms.page.PageMgr;
              var coll = pmgr.getColl();
              var q = {"_id" : coll.toObjectID(pageId)};
              var opts = {};

              var fields = opts["fields"] = {};

              //Exclude fields params
              var exclude = req.params["exclude"];
              if (qx.lang.Type.isString(exclude)) {
                  exclude = [exclude];
              }
              if (qx.lang.Type.isArray(exclude)) {
                  for (var i = 0; i < exclude.length; ++i) {
                      fields[exclude[i]] = 0;
                  }
                  fields["keywords"] = 0; //exclude keywords
              }

              //Include fields params
              var include = req.params["include"];
              if (qx.lang.Type.isString(include)) {
                  include = [include];
              }
              if (qx.lang.Type.isArray(include)) {
                  for (var i = 0; i < include.length; ++i) {
                      fields[include[i]] = 1;
                  }
              }

              var iexExists = false;
              for (var k in fields) {
                  iexExists = true;
                  break;
              }
              if (!iexExists) { //no include|exclude, exclude by default:
                  fields["keywords"] = 0;
              }

              coll.findOne(q, opts, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  var res = doc ? doc : {};

                  var finish = function() {
                      pmgr.getPageAccessMask(req, pageId, function(err, amask) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          res["_amask_"] = amask;
                          delete res["access"]; //Always disable access-map field

                          if (doc["asm"] && req.params["_news_"]) { //Want to get news options
                              ctx._vhost_engine_.loadAssembly(doc["asm"], function(err, asm) {
                                  if (err) {
                                      me.handleError(resp, ctx, err);
                                      return;
                                  }
                                  res["_news_"] = asm["_news_"];
                                  me.writeJSONObject(res, resp, ctx);
                              });
                          } else {
                              me.writeJSONObject(res, resp, ctx);
                          }
                      });
                  };

                  if (!doc["asm"] || !doc["attrs"]) {
                      delete doc["attrs"]; //no asm -> no attrs
                      finish();
                      return;
                  }

                  me.__asmMeta(doc["asm"], ctx, function(err, meta) {
                      if (err || !meta) {
                          finish();
                          return;
                      }

                      sm.cms.page.AttrSubscriptionMgr.getAllSubscriptions(doc["_id"], function(err, subscriptions) {
                          if (err) {
                              finish();
                              return;
                          }

                          doc["_subscriptions"] = subscriptions;

                          //Process page attributes
                          var attrs = doc["attrs"];
                          var loadTasks = [];

                          for (var an in attrs) {
                              var av = attrs[an];
                              var attrMeta = meta[an];
                              if (!attrMeta) {
                                  delete attrs[an];
                                  continue;
                              }

                              var loadAs = attrMeta["loadAs"];
                              if (av != null && av["value"] != null && (loadAs == null || loadAs === "value")) { //already have value
                                  continue;
                              }
                              if ((typeof attrMeta["loadAs"]) === "function") {
                                  loadAs = attrMeta["loadAs"];
                              } else {
                                  loadAs = sm.cms.asm.AttrConverter.loadCtxVal; //assume ctx val todo?
                              }
                              loadTasks.push([an, loadAs]);
                          }

                          //Use custom loaders to get attr value
                          if (loadTasks.length == 0) {
                              finish();
                          } else {
                              var tc = loadTasks.length;
                              for (var i = 0; i < loadTasks.length; ++i) {
                                  var an = loadTasks[i][0];
                                  var loadFunc = loadTasks[i][1];
                                  loadFunc(an, attrs[an], doc, function(err, val) {
                                      if (err) {
                                          delete attrs[an];
                                      } else {
                                          attrs[an] = {"value" : val};
                                      }
                                      if (--tc == 0) {
                                          finish();
                                      }
                                  });
                              }
                          }
                      });
                  });
              });
          },

          __save : function(req, resp, ctx) {
              var me = this;
              if (qx.core.Environment.get("app.debug")) {
                  for (var pn in req.params) {
                      qx.log.Logger.debug(this, "save: req param " + pn + "=" + req.params[pn]);
                  }
              }
              var ref = req.params["ref"];
              if (!qx.lang.Type.isString(ref)) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var pmgr = sm.cms.page.PageMgr;
              var coll = pmgr.getColl();
              ref = coll.toObjectID(ref);
              coll.findOne({_id : ref}, function(err, doc) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (!doc) {
                      me.handleError(resp, ctx, "No such page, _id=" + ref);
                      return;
                  }

                  var oldAsm = doc["asm"];
                  doc["published"] = (req.params["published"] == "true");
                  if (qx.lang.Type.isString(req.params["asm"])) {
                      doc["asm"] = req.params["asm"];
                  } else {
                      delete doc["asm"];
                  }
                  doc["mdate"] = qx.lang.Date.now();

                  if (doc["owner"] == null) {
                      var userId = req.getUserId();
                      if (userId != null) {
                          doc["owner"] = userId;
                      }
                  }

                  var errCount = 0;
                  var finish = function() {
                      pmgr.getPageAccessMask(req, doc["_id"], function(err, mask) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          if (mask.indexOf("e") == -1) {
                              me.handleError(resp, ctx,
                                me.tr("У вас недостаточно прав для редактирования страницы"),
                                false, true);
                              return;
                          }

                          var doSave = function() {
                              me.__setupPageKeywords(doc);

                              //perform update
                              coll.update({_id : ref}, doc, function(err, ret) {
                                  if (err) {
                                      me.handleError(resp, ctx, err);
                                      return;
                                  }
                                  if (errCount > 0) {
                                      me.handleError(resp, ctx, me.tr("При сохранении страницы произошли ошибки"));
                                      return;
                                  }
                                  try {
                                      me.writeJSONObject({}, resp, ctx);
                                  } finally {
                                      var ee = sm.cms.Events.getInstance();
                                      ee.fireDataEvent("pageSaved", doc);
                                  }
                              });
                          };

                          if (oldAsm != doc["asm"]) { //Changed document asm, so check access rights
                              if ((oldAsm != null && !me._isAllowedAsm(req, oldAsm)) || !me._isAllowedAsm(req, doc["asm"])) {
                                  me.handleError(resp, ctx,
                                    me.tr("У вас недостаточно прав для сохранения страницы в выбранном шаблоне"),
                                    false, true);
                                  return;
                              }

                              // check all subscriptions
                              me.__check_subscriptions(doc["_id"], oldAsm, doc["asm"], ctx, function(err) {
                                  if (err) {
                                      me.handleError(resp, ctx, err);
                                      return;
                                  }

                                  doSave();
                              });
                          } else {
                              doSave();
                          }

                      });
                  };
                  if (doc["asm"] == null) { //Removed assembly ref
                      finish();
                      return;
                  }
                  //Load document assembly
                  ctx._vhost_engine_.loadAssembly(doc["asm"], function(err, asm) {
                      if (err) {
                          qx.log.Logger.error(me, err);
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      var attrs = doc["attrs"] = doc["attrs"] || {};
                      //Save attribute values
                      var anames = [];
                      for (var pn in req.params) {
                          var pv = req.params[pn];
                          if (pn.indexOf("attr.") == 0) {
                              anames.push([pn.substring("attr.".length), pv]);
                          }
                      }
                      var ac = anames.length;
                      if (ac == 0) {
                          finish();
                      } else {
                          for (var i = 0; i < anames.length; ++i) {
                              me.__setupAttrValue(doc, attrs, anames[i][0], anames[i][1], asm, ctx, function(err) {
                                  if (err) {
                                      errCount++;
                                  }
                                  if (--ac == 0) {
                                      finish();
                                  }
                              });
                          }
                      }
                  });
              });
          },


          /**
           * Update page keywords for full-text search
           * @param page
           */
          __setupPageKeywords : function(page) {
              //todo language hardcoded
              var stemmer = $$node.require("utils/snowball").russianStemmer; //get token stemmer
              var keysMap = {};
              var chunksBuff = [];
              var spRE = /[\s\-]/;
              if (typeof page.name === "string") {
                  chunksBuff = chunksBuff.concat(page.name.split(spRE));
              }
              if (page.attrs != null && page.attrs.name != null && (typeof page.attrs.name.value === "string")) {
                  chunksBuff = chunksBuff.concat(page.attrs.name.value.split(spRE));
              }
              if (typeof page.category === "string") { //if news
                  chunksBuff = chunksBuff.concat(page.category.split(spRE));
              }
              if (typeof page.annotation === "string") { //if news
                  chunksBuff = chunksBuff.concat(page.annotation.split(spRE));
              }
              if (page.tags != null && page.tags.constructor === Array) {
                  chunksBuff = chunksBuff.concat(page.tags);
              }
              for (var i = 0; i < chunksBuff.length; ++i) {
                  var chunk = chunksBuff[i];
                  chunk = chunk.replace(/[\.,;:"'\?!]/g, "");
                  stemmer.setCurrent(chunk);
                  stemmer.stem();
                  var stemmed = stemmer.getCurrent();
                  //qx.log.Logger.info("stemmed=" + stemmed);
                  if (!stemmed || stemmed.length < 3) {
                      continue;
                  }
                  stemmed = stemmed.toLowerCase();
                  if (keysMap[stemmed] != null) {
                      continue;
                  }
                  keysMap[stemmed] = true;
              }
              var pk = page["keywords"] = [];
              for (var k in keysMap) {
                  pk.push(k);
              }
          },

          __setupAttrValue : function(page, attrs, attrName, rawValue, asm, ctx, cb) {
              this.__asmMeta(asm, ctx, function(err, asmMeta) {
                  if (err || !asmMeta || !asmMeta[attrName]) {
                      cb();
                      return;
                  }
                  var attrMeta = asmMeta[attrName];
                  var atype = (typeof asm[attrName]);
                  if (rawValue != null) {
                      if (atype == "boolean") {
                          rawValue = (rawValue == "true");
                      } else if (atype == "number") {
                          rawValue = parseInt(rawValue);
                      }
                  }
                  var saveAs = attrMeta["saveAs"];
                  if (!saveAs) {
                      saveAs = (asm[attrName] == null ||
                        atype === "string" ||
                        atype === "boolean" ||
                        atype === "number") ? "value" : "ctx";
                  }
                  if ((typeof saveAs) === "function") {
                      try {
                          saveAs(rawValue, attrName, attrMeta, asm, page, function(err, val) {
                              if (!err && val !== undefined) {
                                  attrs[attrName] = val;
                              }
                              cb(err);
                          });
                      } catch(e) {
                          qx.log.Logger.error(this, "Error to call attribute converter, asm: " + asm["_name_"] +
                            ", attr: " + attrName, e);
                      }
                  } else if ("value" == saveAs || "json" == saveAs) {
                      if ((typeof rawValue) === "string" && "json" == saveAs) {
                          try {
                              rawValue = JSON.parse(rawValue);
                          } catch(e) {
                              qx.log.Logger.error(this, "Failed to parse as json object. asm: " + asm["_name_"] +
                                ", attr: " + attrName + ", attrValue: " + rawValue, e);
                          }
                      }
                      attrs[attrName] = {"value" : rawValue};
                      cb();
                  } else if ("ctx" == saveAs) {
                      if ((typeof rawValue) === "string") {
                          try {
                              attrs[attrName] = {"ctx" : JSON.parse(rawValue)};
                          } catch(e) {
                              qx.log.Logger.error(this, "Failed to parse as json object. asm: " + asm["_name_"] +
                                ", attr: " + attrName + ", attrValue: " + rawValue, e);
                          }
                      } else {
                          attrs[attrName] = {"ctx" : rawValue};
                      }
                      cb();
                  }
              });
          },


          /**
           * Fetch page access list
           * resp:
           * <code>
           *    [
           *        [login, name, email, ["owner", "edit", "news", etc]],
           *        [login, name, email, ["edit", "news", etc]],
           *    ]
           * </code>
           */
          __page_acl : function(req, resp, ctx) {
              var ref = req.params["ref"];
              if (!qx.lang.Type.isString(ref)) {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var me = this;
              var res = [];

              var coll = sm.cms.page.PageMgr.getColl();

              coll.findOne({_id : coll.toObjectID(ref)}, {fields : {owner : 1, creator : 1, access : 1}},
                function(err, doc) {

                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    if (doc == null) {
                        me.writeMessage(resp, ctx, "Invalid request", true);
                        return;
                    }

                    var userRefs = {};
                    if (doc["owner"] != null) {
                        userRefs[doc["owner"]] = ["owner"];
                    }

                    if (doc["creator"] != null) {
                        var creator = doc["creator"];
                        if (userRefs[creator]) {
                            userRefs[creator].push("creator");
                        } else {
                            userRefs[creator] = ["creator"];
                        }
                    }

                    if (doc["access"]) {
                        var access = doc["access"];
                        for (var k in access) {
                            var alist = access[k];
                            for (var i = 0; i < alist.length; ++i) {
                                var login = alist[i];
                                if (!userRefs[login]) {
                                    userRefs[login] = [k];
                                } else {
                                    userRefs[login].push(k);
                                }
                            }
                        }
                    }
                    var userRefsArr = [];
                    for (var k in userRefs) {
                        userRefsArr.push(k);
                    }

                    var ucoll = sm.cms.user.UsersMgr.getColl();
                    var uq = ucoll.createQuery({login : {$in : userRefsArr}}, {fields : {login : 1, name : 1, email : 1}});
                    uq.each(
                      function(index, user) {
                          var uref = userRefs[user.login];
                          if (uref) {
                              res.push([user.login, user.name, user.email, uref]);
                          }
                      }).exec(function(err) {
                          if (err) {
                              me.handleError(resp, ctx, err);
                              return;
                          }
                          me.writeJSONObject(res, resp, ctx);
                      });
                });
          },

          /**
           * Update page access list
           */
          __page_update_acl : function(req, resp, ctx) {

              var ref = req.params["ref"];
              var uid = req.params["uid"];
              var role = req.params["role"];

              if (ref == null || uid == null || role == null || (role.charAt(0) != '+' && role.charAt(0) != '-')) {
                  qx.log.Logger.warn(this, "__page_update_acl()", "Invalid params", qx.util.Json.stringify(req.params));
                  throw new sm.nsrv.Message("Invalid request", true);
              }
              var sign = role.charAt(0);
              role = role.substring(1);

              var me = this;
              var coll = sm.cms.page.PageMgr.getColl();

              coll.findOne({_id : coll.toObjectID(ref)}, {fields : {owner : 1, creator : 1, access : 1}},
                function(err, doc) {
                    if (err) {
                        me.handleError(resp, ctx, err);
                        return;
                    }
                    if (doc == null) {
                        me.writeMessage(resp, ctx, "Invalid request", true);
                        return;
                    }
                    //check access rights
                    var userId = req.getUserId();

                    if ((doc.creator != userId) && !req.isUserInRoles(["users.admin", "structure.admin"])) {
                        me.handleError(resp, ctx, me.tr("Недостаточно прав доступа для смены владельца страницы"), false, true);
                        return;
                    }

                    var updateSpec = {$set : {}};
                    if (role == "owner") {
                        updateSpec["$set"]["owner"] = uid;
                    } else {
                        var access = doc["access"] || {};
                        if (role == "*" && sign == "-") { //remove all access roles from user
                            for (var k in access) {
                                if (qx.lang.Type.isArray(access[k])) {
                                    qx.lang.Array.remove(access[k], uid);
                                }
                            }
                        } else { //modify specific access
                            var ulist = access[role];
                            if (!qx.lang.Type.isArray(ulist)) {
                                access[role] = [];
                            }
                            if (sign == "+" && access[role].indexOf(uid) == -1) {
                                access[role].push(uid);
                            } else if (sign == "-") {
                                qx.lang.Array.remove(access[role], uid);
                            }
                        }
                        updateSpec["$set"]["access"] = access;
                    }
                    coll.update({_id : coll.toObjectID(ref)}, updateSpec, {safe : true}, function(err) {
                        if (err) {
                            me.handleError(resp, ctx, err);
                            return;
                        }
                        me.writeJSONObject({}, resp, ctx);
                    });
                }
              );
          },

          /**
           * Update (enable/disable) attribute synchronization
           */
          __page_update_sync : function(req, resp, ctx) {
              var me = this;

              var ref = req.params["ref"];
              var attribute = req.params["attribute"];
              if (!qx.lang.Type.isString(ref) || !qx.lang.Type.isString(attribute) || ref == "" || attribute == "") {
                  throw new sm.nsrv.Message("Invalid request", true);
              }

              var enable = req.params["enable"];

              if (enable == "true") {
                  var parent = req.params["parent"];
                  if (!qx.lang.Type.isString(parent) || parent == "") {
                      throw new sm.nsrv.Message("Invalid request", true);
                  }

                  // load page asm names
                  var asms = {};
                  var pcoll = sm.cms.page.PageMgr.getColl();
                  pcoll.createQuery({_id: {$in: [pcoll.toObjectID(ref), pcoll.toObjectID(parent)]}}, {fields: {_id: 1, asm: 1}})
                    .each(function(index, item) {
                        asms[item["_id"]] = item["asm"];
                    })
                    .exec(function(err) {
                        if (err) {
                            me.handleError(resp, ctx, err);
                            return;
                        }

                        if (!asms[ref] || !asms[parent]) {
                            me.writeJSONObject({state: false}, resp, ctx);
                            return;
                        }

                        // check subscription allow
                        me.__check_subscription_allow(asms[ref], asms[parent], attribute, ctx, function(state) {
                            if (!state) {
                                me.writeJSONObject({state: false}, resp, ctx);
                                return;
                            }

                            // add subscription
                            sm.cms.page.AttrSubscriptionMgr.addSubscription(parent, ref, attribute, function(err) {
                                if (err) {
                                    me.handleError(resp, ctx, err);
                                    return;
                                }
                                // one time synchronization
                                sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriber(ref, attribute, function(err) {
                                    if (err) {
                                        me.handleError(resp, ctx, err);
                                        return;
                                    }
                                    me.writeJSONObject({state: true}, resp, ctx);
                                });
                            });
                        });
                    });
              } else {
                  sm.cms.page.AttrSubscriptionMgr.removeSubscription(ref, attribute, function(err) {
                      if (err) {
                          me.handleError(resp, ctx, err);
                          return;
                      }
                      me.writeJSONObject({state: true}, resp, ctx);
                  });
              }
          },

          /**
           * Check allow subscription: check equals for attribute editors in asm meta definition
           */
          __check_subscription_allow: function(lasm, sasm, attrName, ctx, cb) {
              var me = this;

              if (lasm == null || sasm == null) {
                  cb(false);
                  return;
              }

              if (lasm == sasm) {
                  cb(true);
                  return;
              }

              // load first asm
              me.__asmMeta(lasm, ctx, function(err, lasmMeta) {
                  if (err || !lasmMeta || !lasmMeta[attrName]) {
                      cb(false);
                      return;
                  }
                  var lattrMeta = lasmMeta[attrName] || {};
                  var leditor = lattrMeta["editor"];
                  var ledName = qx.lang.Type.isString(leditor) ? leditor : (leditor ? leditor["name"] : null);

                  // load second asm
                  me.__asmMeta(sasm, ctx, function(err, sasmMeta) {
                      if (err || !sasmMeta || !sasmMeta[attrName]) {
                          cb(false);
                          return;
                      }

                      var sattrMeta = sasmMeta[attrName] || {};
                      var seditor = sattrMeta["editor"];
                      var sedName = qx.lang.Type.isString(seditor) ? seditor : (seditor ? seditor["name"] : null);

                      cb(ledName === sedName);
                  });
              });
          },

          /**
           * check page subscriptions
           */
          __check_subscriptions: function(ref, oasm, nasm, ctx, cb) {
              var me = this;

              if (oasm == nasm) {
                  cb();
                  return;
              }

              var oeNames = {};
              var neNames = {};

              var doCheck = function() {
                  // load all subscriptions for page
                  sm.cms.page.AttrSubscriptionMgr.getAllSubscriptions(ref, function(err, subscriptions) {
                      if (err) {
                          cb(err);
                          return;
                      }

                      // load all subscribers for page
                      sm.cms.page.AttrSubscriptionMgr.getSubscribers(ref, function(err, subsribers) {
                          if (err) {
                              cb(err);
                              return;
                          }

                          var attributeNames;
                          var index;

                          // unsubscribe pages for all attributes, which editors (old & new) not equal
                          var unsubscribe1 = function(err) {
                              if (err) {
                                  cb(err);
                                  return;
                              }

                              if (++index >= attributeNames.length) {
                                  cb();
                                  return;
                              }

                              // check editors equal
                              var attributeName = attributeNames[index];
                              if (!oeNames[attributeName] || !neNames[attributeName] || oeNames[attributeName] !== neNames[attributeName]) {
                                  qx.log.Logger.debug("Remove subscribers, page: " + ref + ", attribute: " + attributeName);
                                  sm.cms.page.AttrSubscriptionMgr.removeSubscribers(ref, attributeName, unsubscribe1);
                              } else {
                                  unsubscribe1();
                              }
                          };


                          // remove subscriptions for all attributes, which editors (old & new) not equal
                          var unsubscribe2 = function(err) {
                              if (err) {
                                  cb(err);
                                  return;
                              }

                              if (++index >= attributeNames.length) {
                                  attributeNames = qx.lang.Object.getKeys(subsribers);
                                  index = -1;
                                  unsubscribe1();
                                  return;
                              }

                              // check editors equal
                              var attributeName = attributeNames[index];
                              if (!oeNames[attributeName] || !neNames[attributeName] || oeNames[attributeName] !== neNames[attributeName]) {
                                  qx.log.Logger.debug("Remove subscription, page: " + ref + ", attribute: " + attributeName);
                                  sm.cms.page.AttrSubscriptionMgr.removeSubscription(ref, attributeName, unsubscribe2);
                              } else {
                                  unsubscribe2();
                              }
                          };

                          attributeNames = qx.lang.Object.getKeys(subscriptions);
                          index = -1;
                          unsubscribe2();
                      });
                  });
              };

              if (oasm != null && oasm != "") {
                  // load old asm
                  me.__asmMeta(oasm, ctx, function(err, oasmMeta) {
                      if (err) {
                          cb(err);
                          return;
                      }

                      if (!oasmMeta) {
                          doCheck();
                          return;
                      }

                      // build editor names cache
                      var oamNames = qx.lang.Object.getKeys(oasmMeta);
                      for (var i = 0; i < oamNames.length; ++i) {
                          var oaName = oamNames[i];
                          var oaMeta = oasmMeta[oaName] || {};
                          var oeditor = oaMeta["editor"];
                          oeNames[oaName] = qx.lang.Type.isString(oeditor) ? oeditor : (oeditor ? oeditor["name"] : null);
                      }

                      if (nasm != null && nasm != "") {
                          // load new asm
                          me.__asmMeta(nasm, ctx, function(err, nasmMeta) {
                              if (err) {
                                  cb(err);
                                  return;
                              }

                              if (!nasmMeta) {
                                  doCheck();
                                  return;
                              }

                              // build editor names cache
                              var namNames = qx.lang.Object.getKeys(nasmMeta);
                              for (var i = 0; i < namNames.length; ++i) {
                                  var naName = namNames[i];
                                  var naMeta = nasmMeta[naName] || {};
                                  var neditor = naMeta["editor"];
                                  neNames[naName] = qx.lang.Type.isString(neditor) ? neditor : (neditor ? neditor["name"] : null);
                              }

                              doCheck();
                          });
                      } else {
                          doCheck();
                      }
                  });
              } else {
                  doCheck();
              }
          }
      },

      handlers :
      {
          //Create new page or category
          "/page/new" : {
              webapp : "adm",
              handler : "__newpage"
          },

          //Available page templates
          "/page/templates" : {
              webapp : "adm",
              handler : "__templates"
          },

          //Page meta-info
          "/page/info" : {
              webapp : "adm",
              handler : "__info"
          },

          //Save edited page
          "/page/save" : {
              webapp : "adm",
              handler : "__save"
          },

          //Page access list info
          "/page/acl" : {
              webapp : "adm",
              handler :"__page_acl"
          },

          //Update page access list
          "/page/update/acl" : {
              webapp : "adm",
              handler :"__page_update_acl"
          },

          "/page/update/attrsync" : {
              webapp : "adm",
              handler : "__page_update_sync"
          }
      }
  });