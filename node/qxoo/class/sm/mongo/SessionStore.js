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
        var ims = parseInt(options["cleanupInterval"]);
        if (!isNaN(ims)) {
            qx.log.Logger.info(this, "Setup sessions cleanup interval: " + ims + " ms");
            this.__cleanupInterval = setInterval(this.__cleanup.bind(this), ims);
        }
    },

    members :
    {
        __coll : null,

        __cleanupInterval : null,

        __cleanup : function() {
            var cdate = +new Date();
            this.__coll.remove({"expires" : {$lt : cdate}});
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
            this.__coll.drop(function() {
                if (cb) {
                    cb();
                }
            });
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
        var p = '_' + '_proto__'; // to prevent qooxdoo from mangling the name
        sm.mongo.SessionStore.prototype[p] = statics.__STORE.prototype;
    }
});