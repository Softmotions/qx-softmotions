/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Mongodb access layer
 */
qx.Class.define("sm.mongo.Mongo", {
      extend  : qx.core.Object,

      statics :
      {
      },

      events :
      {
          /**
           * Fired if mongodb opened
           */
          opened : "qx.event.type.Event",

          /**
           * Fired if mongodb closed
           */
          closed : "qx.event.type.Event",

          /**
           * Fired if got error
           */
          error : "qx.event.type.Data"
      },

      properties :
      {
      },

      /**
       * Construct new mongo manager instance
       *
       * @param dbname {String}
       * @param host   {String}
       * @param port   {Integer?}
       * @param options {Object?}
       */
      construct : function(dbname, host, port, options) {
          this.base(arguments);
          this.__cinfo = {"dbname" : dbname, "host" : host, "port" : port, "options" : options};
          this._lib_mongo = $$node.require("mongodb");
          if (!qx.lang.Type.isObject(this.__cinfo["options"])) {
              this.__cinfo["options"] = {};
          }
          if (!this.__cinfo["port"]) {
              this.__cinfo["port"] = this._lib_mongo.Connection.DEFAULT_PORT;
          }
          this.__collections = {};

          this.addListener("opened", function() {
              for (var k in this.__collections) {
                  this.__bindCollection(k);
              }
          }, this);

          this.addListener("closed", function() {
              for (var k in this.__collections) {
                  this.__collections[k]._wrapNativeCollection(null);
              }
          }, this);
      },

      members :
      {


          /**
           * Native mongo lib
           */
          _lib_mongo : null,

          /**
           * Connection info
           */
          __cinfo : null,

          /**
           * Database instance
           */
          __db : null,


          /**
           * Instances of @{link sm.mongo.Collection}
           */
          __collections : null,


          /**
           * Fires error event
           * @param err
           * @param msg
           */
          _onError : function(err, msg) {
              this.fireDataEvent("error", [err, msg]);
          },

          /**
           * Returns true if Mongo is connected
           */
          isConnected : function() {
              return (this.__db ? this.__db.state == "connected" : false);
          },

          getConnectInfo : function() {
              return this.__cinfo;
          },

          getDB : function() {
              return this.__db;
          },

          dereference : function(dbref, cb) {
              return this.__db.dereference(dbref, cb);
          },


          /**
           * Code constructor
           */
          toCode : function(code, scope) {
              return new this.__db.bson_serializer.Code(code, scope);
          },

          toDBRef : function(namespace, oid, db) {
              return new this.__db.bson_serializer.DBRef(namespace, this.toObjectID(oid), db);
          },

          toObjectID : function(oid) {
              if (this._lib_mongo.BSONNative && (oid instanceof this._lib_mongo.BSONNative.ObjectID)) {
                  return oid;
              } else if (this._lib_mongo.BSONPure && (oid instanceof this._lib_mongo.BSONPure.ObjectID)) {
                  return oid;
              } else {
                  return new this.__db.bson_serializer.ObjectID(oid);
              }
          },

          /**
           * Open mongodb connection
           */
          open : function(callback) {
              if (this.isConnected()) {
                  try {
                      if (callback) {
                          callback(new Error("Connection already opened"));
                      }
                  } finally {
                      me._onError(new Error("Connection already opened"));
                  }
                  return; //already opened
              }
              var me = this;
              this.__db = new this._lib_mongo.Db(this.__cinfo["dbname"],
                new this._lib_mongo.Server(this.__cinfo["host"],
                  this.__cinfo["port"],
                  this.__cinfo["options"]),
                {native_parser : !!this.__cinfo["options"]["native_parser"]});
              this.__db.open(function(err) {
                  if (err) {
                      me._onError(err, "Error opening mongodb connection, connect spec: " +
                        qx.util.Json.stringify(me.__cinfo));
                  } else {
                      me.fireEvent("opened");
                  }
                  if (callback) {
                      callback(err, me);
                  }
              });
          },


          /**
           * Open GridFS file
           *
           * @param fname{String}
           * @param mode {String} Set the mode for this file. Available modes:
           *     <ul>
           *       <li>"r" - read only. This is the default mode.</li>
           *       <li>"w" - write in truncate mode. Existing data will be overwriten</li>
           *       <li>"w+" - write in edit mode.</li>
           *     </ul>
           * @param ctype {String} file content type
           * @param cb {function(?Error, ?GridStore)}
           */
          openGridFile : function(fname, mode, ctype, metadata, cb) {
              var gfile = new this._lib_mongo
                .GridStore(this.getDB(), fname, mode, {content_type : ctype, metadata : metadata});
              gfile.open(cb);
          },


          /**
           * Return instance of gridfs files meta collection
           * Internal structure:
           *        <pre><code>
           *        {
           *          '_id' : , // {number} id for this file
           *          'filename' : , // {string} name for this file
           *          'contentType' : , // {string} mime type for this file
           *          'length' : , // {number} size of this file?
           *          'chunksize' : , // {number} chunk size used by this file
           *          'uploadDate' : , // {Date}
           *          'aliases' : , // {array of string}
           *          'metadata' : , // {string}
           *        }
           *        </code></pre>
           */
          gridFilesCollection : function() {
              return this.collection(this._lib_mongo.GridStore.DEFAULT_ROOT_COLLECTION + ".files");
          },


          /**
           * Return GridStore instance
           */
          gridStore : function() {
              return this._lib_mongo.GridStore;
          },


          /**
           * Closes connection to mongo server
           */
          close : function() {
              if (!this.isConnected()) {
                  return;
              }
              this.__db.close();
              //todo hack?!
              this.__db.state = "notConnected";
              this.fireEvent("closed");
          },


          /**
           * Operate with collection
           * @param name Collection name
           * @return {sm.mongo.Collection} collection object
           */
          collection : function(name) {
              var coll = this.__collections[name];
              if (coll) {
                  return coll;
              } else {
                  coll = new sm.mongo.Collection(this, name);
                  this.__collections[name] = coll;
                  this.__bindCollection(name);
              }
              return coll;
          },

          /**
           * Bind collections to its native equivalent
           * @param name {String} collection name
           */
          __bindCollection : function(name) {
              var coll = this.__collections[name];
              if (!coll) {
                  return;
              }
              var me = this;
              if (this.isConnected()) {
                  this.__db.collection(name, function(err, ncoll) {
                      if (err) {
                          me.__collections[name] = null;
                          me._onError(err, "Unable to get collection: " + name);
                      } else {
                          coll._wrapNativeCollection(ncoll);
                      }
                  });
              }
          }
      },

      destruct : function() {
          if (this.isConnected()) {
              this.close();
          }
          this._disposeMap(this.__collections);
          this.__cinfo = this.__db = this._lib_mongo = null;
      }
  });