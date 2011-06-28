/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Mongo collection
 */
qx.Class.define("sm.mongo.Collection", {
      extend  : qx.core.Object,

      events :
      {
      },

      properties :
      {
      },

      construct : function(mongo, name) {
          this.base(arguments);
          this.__name = name;
          this.__mongo = mongo;
          this.__callQueue = [];
      },

      members :
      {
          /**
           * Name of collection
           */
          __name : null,

          /**
           * Owner mongo instance
           */
          __mongo : null,


          /**
           * Native mongodb collection
           */
          __nativeCollection : null,

          /**
           * Native collection call queue
           */
          __callQueue : null,

          getMongo : function() {
              return this.__mongo;
          },

          getName : function() {
              return this.__name;
          },

          toCode : function(code, scope) {
              return this.__mongo.toCode(code, scope);
          },

          toDBRef : function(oid, db) {
              return this.__mongo.toDBRef(this.__name, oid, db);
          },

          toObjectID : function(oid) {
              return this.__mongo.toObjectID(oid);
          },


          /**
           * Drop the collection
           *
           * Async
           */
          drop : function(callback) {
              this._applyNativeMethod("drop", arguments);
          },

          /**
           * Insert-or-update
           *
           * Async?
           */
          save : function(doc, options, callback) {
              this._applyNativeMethod("save", arguments);
          },

          /**
           * Update
           *
           * Async?
           */
          update : function(spec, document, options, callback) {
              this._applyNativeMethod("update", arguments);
          },

          /**
           * Insert
           *
           * Synchronous
           */
          insert : function(docs, options, callback) {
              this._applyNativeMethod("insert", arguments);
          },


          /**
           * Remove elements from collection
           *
           * Async
           */
          remove : function(selector, options, callback) {
              this._applyNativeMethod("remove", arguments);
          },


          /**
           * Count collection elements
           *
           * Async
           */
          count : function(query, callback) {
              this._applyNativeMethod("count", arguments);
          },


          /**
           * Distinct elements in collection
           */
          distinct : function(key, query, callback) {
              this._applyNativeMethod("distinct", arguments);
          },


          /**
           * Group
           */
          group : function(keys, condition, initial, reduce, command, callback) {
              this._applyNativeMethod("group", arguments);
          },

          /**
           * Query collection
           *
           * Async
           */
          createQuery : function (query, options) {
              return new sm.mongo.Query(this, query, options);
          },


          /**
           * Find one
           */
          findOne : function(queryObject, options, callback) {
              this._applyNativeMethod("findOne", arguments);
          },

          ensureIndex : function(spec, options, callback) {

              //todo
              //todo Ensure index didnt work with mongodb-native 0.8.1 !!!
              //todo

              var me = this;
              var indexes = [];
              var fieldHash = {};
              spec.forEach(function(indexArray) {
                  var indexArrayFinal = indexArray;
                  if (indexArrayFinal.length == 1) indexArrayFinal[1] = 1;
                  fieldHash[indexArrayFinal[0]] = indexArrayFinal[1];
                  indexes.push(indexArrayFinal[0] + "_" + indexArrayFinal[1]);
              });
              // Generate the index name
              var indexName = indexes.join("_");
              var icoll = this.__mongo.collection("system.indexes");
              var indData = null;
              icoll.createQuery({"name" : indexName}).first(
                function(data) {
                    indData = data;
                }).exec(function(err) {
                    if (err || indData) {
                        if (callback) {
                            callback(err, false);
                        }
                        return;
                    }
                    me._applyNativeMethod("createIndex", [spec, options, function(err) {
                        if (callback) {
                            callback(err, true);
                        }
                    }]);
                });
          },

          indexInformation : function(callback) {
              this._applyNativeMethod("indexInformation", arguments);
          },

          getNative : function() {
              return this.__nativeCollection;
          },


          _applyNativeMethod : function(name, args) {
              if (this.__nativeCollection) {
                  return this.__nativeCollection[name].apply(this.__nativeCollection, args);
              } else {
                  //todo check for __callQueue size
                  this.__callQueue.push([name, args]);
              }
          },

          _wrapNativeCollection : function(ncoll) {
              this.__nativeCollection = ncoll;
              if (this.__nativeCollection) {
                  //Apply queued calls
                  var c;
                  while (c = this.__callQueue.shift()) {
                      this.__nativeCollection[c[0]].apply(this.__nativeCollection, c[1]);
                  }
              } else {
                  //todo cleanup?
              }
          },

          /**
           * Error handler
           */
          _onError : function(err, msg) {
              this.__mongo._onError(err, msg);
          }
      },

      destruct : function() {
          this.__name = this.__nativeCollection = this.__mongo = this.__callQueue = null;
      }
  });