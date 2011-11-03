/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 * Code is based on https://github.com/kcbanner/connect-mongo/blob/master/lib/connect-mongo.js
 */
qx.Class.define("sm.mongo.SessionStore", {
      extend  : qx.core.Object,

      statics : {
          __Store : null
      },

      construct : function(options) {
          options = options || {};
          sm.mongo.SessionStore.__Store.call(this, options);
          var mongo = options.mongo;
          this.__coll = mongo.collection(options.collection);
      },

      members : {
          __coll : null,

          get : function(sid, callback) {
              var me = this;
              me.__coll.findOne({_id: sid}, function(err, session) {
                  try {
                      if (err) {
                          callback(err, null);
                      } else {
                          if (session) {
                              if (!session.expires || new Date < session.expires) {
                                  callback(null, JSON.parse(session.session));
                              } else {
                                  me.destroy(sid, callback);
                              }
                          } else {
                              callback();
                          }
                      }
                  } catch(e) {
                      callback(e);
                  }
              });
          },

          set : function(sid, session, callback) {
              var me = this;
              try {
                  var s = {_id: sid, session: JSON.stringify(session)};

                  if (session && session.cookie && session.cookie._expires) {
                      s.expires = new Date(session.cookie._expires);
                  }

                  this.__coll.update({_id: sid}, s, {upsert: true, safe: true}, function(err, data) {
                      if (err) {
                          callback && callback(err);
                      } else {
                          callback && callback(null);
                      }
                  });
              } catch(e) {
                  callback && callback(e);
              }
          },

          destroy : function(sid, callback) {
              this.__coll.remove({_id: sid}, function() {
                  callback && callback();
              });
          },

          length : function(callback) {
              this.__coll.count({}, function(err, count) {
                  if (err) {
                      callback && callback(err);
                  } else {
                      callback && callback(null, count);
                  }
              });
          },

          clear : function(callback) {
              this.__coll.drop(function() {
                  callback && callback();
              });
          }
      },

      defer : function(statics) {
          statics.__Store = $$node.require('connect').session.Store;
          // poor man's way to inherit qooxdoo class from non-qooxdoo one...
          var p = '_' + '_proto__'; // to prevent qooxdoo from mangling the name
          sm.mongo.SessionStore.prototype[p] = statics.__Store.prototype;
      }
  }
);