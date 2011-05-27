/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Mongo query
 */

qx.Class.define("sm.mongo.Query", {
      extend  : qx.core.Object,

      construct : function(collection, query, options) {
          this.base(arguments);
          this.__collection = collection;
          this.__query = query || {};
          this.__options = options || {};
          this.__callbacks = {};
      },

      members :
      {

          /**
           * Owner collection
           */
          __collection : null,

          /**
           * Query spec
           */
          __query : null,

          /**
           * Query options
           */
          __options : null,

          /**
           * Exec callbacks
           */
          __callbacks : null,

          updateQuery : function(qspec) {
              if (this.__query) {
                  qx.lang.Object.mergeWith(this.__query, qspec);
              } else {
                  this.__query = qx.lang.Object.clone(qspec);
              }
          },

          updateOptions : function(ospec) {
              if (this.__options) {
                  qx.lang.Object.mergeWith(this.__options, ospec);
              } else {
                  this.__options = qx.lang.Object.clone(ospec);
              }
          },

          getQuery : function() {
              return this.__query;
          },

          getCollection : function() {
              return this.__collection;
          },

          ///////////////////////////////////////////////////////////////////////////
          //                          Query callbacks                              //
          ///////////////////////////////////////////////////////////////////////////


          /**
           * First result
           * @param callback {function(doc)}
           */
          first  : function(callback) {
              this.__registerCallback("first", callback);
              return this;
          },

          /**
           * Last result
           * @param callback {function(index, doc)}
           */
          last  : function(callback) {
              this.__registerCallback("last", callback);
              return this;
          },

          /**
           * Iterate each document
           * @param callback {function(index, doc)}
           */
          each  : function(callback) {
              this.__registerCallback("each", callback);
              return this;
          },

          /**
           * All results
           * @param callback {function(count, docArray)}
           */
          all  : function(callback) {
              this.__registerCallback("all", callback);
              return this;
          },

          __registerCallback : function(name, callback) {
              var carr = this.__callbacks[name];
              if (!carr) {
                  carr = this.__callbacks[name] = [];
              }
              carr.push(callback);
          },

          /**
           * Executes query
           * @param callback {function(err)}
           */
          exec : function(callback) {
              if (qx.lang.Object.isEmpty(this.__callbacks)) {
                  //nothing todo
                  return this;
              }
              var me = this;
              this.__collection._applyNativeMethod("find", [
                  this.__query,
                  this.__options,
                  function(err, cursor) {
                      if (err) {
                          if (callback) {
                              callback(err);
                          }
                          me.__collection._onError(err);
                          return;
                      }
                      me.__streamRecords(cursor.streamRecords(me.__options), callback);
                  }
              ]);
          },

          findOne : function(callback) {
              this.__collection._applyNativeMethod("findOne", [
                  this.__query,
                  this.__options,
                  callback
              ]);
          },

          count : function(callback) {
              this.__collection._applyNativeMethod("count", [
                  this.__query,
                  callback
              ]);
          },

          dumpQuery : function() {
              return qx.util.Json.stringify({
                    query : this.__query,
                    options : this.__options
                });
          },

          /**
           * Fetch cursor stream
           */
          __streamRecords : function(stream, callback) {

              var me = this;
              var count = 0;
              var lastDoc = null;
              var error = null;
              var items = this.__callbacks["all"] ? [] : null;

              stream.addListener("end", function() {
                  try {
                      if (!error) {
                          if (items) {
                              me.__callRecordCallbacks("all", count, items);
                          }
                          if (lastDoc) {
                              me.__callRecordCallbacks("last", count, lastDoc);
                          }
                      }
                  } finally {
                      if (callback) {
                          callback(error);
                      }
                  }
              });

              stream.addListener("data", function(doc) {
                  lastDoc = doc;
                  if (count++ == 0) {
                      if ("$err" in doc) { //Got error document
                          error = doc["$err"];
                          me.__collection._onError(error);
                          return;
                      }
                      me.__callRecordCallbacks("first", count, doc);
                  }
                  me.__callRecordCallbacks("each", count, doc);
                  if (items) {
                      items.push(doc);
                  }
              });
          },

          __callRecordCallbacks : function(group, index, data) {
              var callbacks = this.__callbacks[group];
              if (!callbacks) {
                  return;
              }
              var first = (group == "first");
              for (var i = 0; i < callbacks.length; ++i) {
                  var cb = callbacks[i];
                  if (first) {
                      cb(data);
                  } else {
                      cb(index, data);
                  }
              }
          }

      },

      destruct : function() {
          this.__collection = this.__query =
            this.__options = this.__callbacks = null;
          //this._disposeObjects("__field_name");
      }
  });