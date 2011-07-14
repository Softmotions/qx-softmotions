/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * User specific routines
 */
qx.Class.define("sm.cms.user.UsersMgr", {
    extend  : qx.core.Object,

    statics :
    {

        __getMongo : function() {
            return sm.app.Env.getDefault().getMongo();
        },

        getColl : function() {
            return this.__getMongo().collection("users");
        },

        /**
         * Update stored user properties
         * @param {String} uid User id (login)
         * @param props {Map} Key-val properties
         * @param cb {function(err)} Callback
         */
        updateUserProperties : function(uid, props, cb) {
            var me = this;
            var async = $$node.require("async");
            var tasks = [];
            for (var k in props) {
                tasks.push([k, props[k]]);
            }
            async.forEach(tasks, function(task, cb) {
                me.updateUserProperty(uid, task[0], task[1], cb);
            }, cb);
        },

        /**
         * Update stored user property
         * @param uid {String} uid User id (login)
         * @param pname {String} property name
         * @param pval {Object} property value
         * @param cb {function(err)} Callback
         */
        updateUserProperty : function(uid, pname, pval, cb) {
            var ucoll = this.getColl();
            var setObj = {};
            setObj["props." + pname] = pval;

            ucoll.update({login : uid}, {$set : setObj}, {safe : true}, function(err) {
                cb(err);
            });
        },


        /**
         * Removes user property
         * @param uid {String} uid User id (login)
         * @param pname {String} property name
         * @param cb {function(err)} Callback
         */
        removeUserProperty : function(uid, pname, cb) {
            var ucoll = this.getColl();
            var setObj = {};
            setObj["props." + pname] = 1;

            ucoll.update({login : uid}, {$unset : setObj}, {safe : true}, function(err) {
                cb(err);
            });
        },

        /**
         * Fetch user property
         * @param uid {String} uid User id (login)
         * @param pname {String} property name
         * @param callback cb {function(err, pvalue)} Callback function. pvalue: fetched property value
         */
        userProperty : function(uid, pname, callback) {
            var ucoll = this.getColl();
            var fields = {};
            fields["props." + pname] = 1;
            ucoll.findOne({login : uid}, {fields : fields}, function(err, doc) {
                if (err || doc == null) {
                    callback(err);
                    return;
                }
                var props = doc["props"];
                callback(null, props ? props[pname] : null);
            });
        }
    }

});