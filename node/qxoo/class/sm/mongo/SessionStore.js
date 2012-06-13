/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * MongoDB session store
 */
qx.Class.define("sm.mongo.SessionStore", {
    extend  : qx.core.Object,

    statics :
    {
        //Connect store
        __STORE : null
    },

    /**
     * MongoDB session store
     * @param options {Object} extra options for session store
     */
    construct : function(options) {
        options = options || {};
        sm.mongo.SessionStore.__STORE.call(this, options);
        this.__coll = sm.app.Env.getDefault().getMongo().collection(options["collection"] || "sessions");
        this.__maxIdle = parseInt(options["maxIdle"]);
        if (isNaN(this.__maxIdle)) {
            this.__maxIdle = 0;
        }
        var ims = parseInt(options["cleanupInterval"]);
        if (!isNaN(ims)) {
            qx.log.Logger.info(this, "Setup sessions cleanup interval: " + ims + " ms");
            this.__cleanupInterval = setInterval(this.__cleanup.bind(this), ims);
            this.__cleanup();
        }
    },

    members :
    {
        __coll : null,

        __cleanupInterval : null, //Frequency of calling session cleanup routine (period in ms)

        __maxIdle : 0, //Max session idle iterval (ms)

        __cleanup : function() {
            var cdate = +new Date();
            this.__coll.remove({"expires" : {$lt : cdate}});
            if (this.__maxIdle > 0) {
                this.__coll.remove({"la" : {$lte : (cdate - this.__maxIdle)}});
            }
        },

        get : function(sid, cb) {
            var me = this;
            this.__coll.findOne({_id: sid}, function(err, sess) {
                if (err || sess == null) {
                    cb(err, null);
                    return;
                }
                var cdate = +new Date();
                if (sess.expires == null || cdate < sess.expires) {
                    try {
                        cb(null, JSON.parse(sess.session));
                    } catch(e) {
                        qx.log.Logger.error(me, e);
                        cb(e);
                    }
                } else {
                    me.destroy(sid, cb);
                }
            });
        },

        set : function(sid, sess, cb) {
            try {
                var s = {_id: sid, session: JSON.stringify(sess)};
            } catch(e) {
                if (cb) {
                    cb(e);
                }
                return;
            }
            if (sess != null && sess.cookie != null && sess.cookie._expires != null) {
                s.expires = +new Date(sess.cookie._expires);
            }
            if (sess != null && sess.lastAccess != null) {
                s.la = sess.lastAccess;
            }
            this.__coll.update({_id: sid}, s, {upsert: true, safe: true}, function(err, data) {
                if (cb) {
                    cb(err);
                }
            });
        },

        destroy : function(sid, cb) {
            this.__coll.remove({_id: sid}, function() {
                if (cb) {
                    cb();
                }
            });
        },

        length : function(cb) {
            this.__coll.count({}, function(err, count) {
                if (cb) {
                    cb(err, count);
                }
            });
        },

        clear : function(cb) {
            this.__coll.drhop(function() {
                if (cb) {
                    cb();
                }
            });
        },

        all : function(fn) {
            //qx.log.Logger.("");
            if (fn) {
                fn([]);
            }
        }
    },

    destruct : function() {
        if (this.__cleanupInterval) {
            try {
                clearInterval(this.__cleanupInterval);
            } catch(e) {
                qx.log.Logger.warn(this, e);
            } finally {
                this.__cleanupInterval = null;
            }
        }
    },

    defer : function(statics) {
        statics.__STORE = $$node.require("connect").session.Store;
        // poor man's way to inherit qooxdoo class from non-qooxdoo one...
        sm.mongo.SessionStore.prototype.__proto__ = statics.__STORE.prototype;
    }
});