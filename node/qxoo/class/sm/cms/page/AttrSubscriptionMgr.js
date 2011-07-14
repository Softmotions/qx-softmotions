/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 *
 * MongoDB model Item
 *
 * navItem : {
 *   parent: string - parent node Id,
 *   subscriber: string - subscribers node Ids
 *   attribute: string - ctx value to synchronize
 * }
 *
 */
qx.Class.define("sm.cms.page.AttrSubscriptionMgr", {

    statics :
    {
        __getMongo : function() {
            return sm.app.Env.getDefault().getMongo();
        },

        getColl : function() {
            return this.__getMongo().collection("attrsubscr");
        },

        getPageColl: function() {
            return sm.cms.page.PageMgr.getColl();
        },

        /**
         * Update parent for specified subscription (subscriper and attribute)
         */
        addSubscription: function(parentId, subscriberId, attribute, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.update({"subscriber": pcoll.toObjectID(subscriberId), "attribute": attribute}, {"$set": {"parent": pcoll.toObjectID(parentId)}}, {"upsert" : true}, cb);
        },

        /**
         * Remove subscription for subscriber and attribute
         */
        removeSubscription: function(subscriberId, attribute, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.remove({"subscriber": pcoll.toObjectID(subscriberId), "attribute": attribute}, cb);
        },

        /**
         * Remove all subscription for subscriber
         */
        removeAllSubscriptions: function(subscriberId, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.remove({"subscriber": pcoll.toObjectID(subscriberId)}, cb);
        },

        /**
         * Remove subscribers for specified node and attribute
         */
        removeSubscribers: function(nodeId, attribute, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.remove({"parent": pcoll.toObjectID(nodeId), "attribute": attribute}, cb);
        },

        /**
         * Remove all subscribers for specified node
         */
        removeAllSubscribers: function(nodeId, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.remove({"parent": pcoll.toObjectID(nodeId)}, cb);
        },

        /**
         * Getting subscription for specified subscriber and attribute
         */
        getSubscription: function(nodeId, attribute, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            coll.findOne({"subscriber": pcoll.toObjectID(nodeId), "attribute": attribute}, {"fields": {"parent": 1}}, function(err, item) {
                if (err) {
                    cb(err, null);
                    return;
                }

                cb(null, item["parent"]);
            });
        },

        /**
         * Getting all subscriptions for specified subscriber.
         * Result map:
         *  {
         *        attribute: parentId
         *  }
         */
        getAllSubscriptions: function(nodeId, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            var subscribes = {};

            coll.createQuery({"subscriber": pcoll.toObjectID(nodeId)}, {"fields": {"parent": 1, "attribute": 1}})
                    .each(function(index, item) {
                        subscribes[item["attribute"]] = item["parent"];
                    })
                    .exec(function(err) {
                        if (err) {
                            cb(err, null);
                            return;
                        }

                        cb(null, subscribes);
                    });
        },

        /**
         * Getting map of subscribers for specified node
         * Result map:
         *  {
         *      attribute: [subscriberIds],
         *      ...
         *  }
         */
        getSubscribers: function(nodeId, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            var subscribers = {};

            coll.createQuery({"parent": pcoll.toObjectID(nodeId)}, {"fields": {"subscriber": 1, "attribute": 1}})
                    .each(function(index, item) {
                        (subscribers[item["attribute"]] = subscribers[item["attribute"]] || []).push(item["subscriber"])
                    })
                    .exec(function(err) {
                        if (err) {
                            cb(err, null);
                            return;
                        }

                        cb(null, subscribers);
                    });
        },

        /**
         * Synchronize subscriber attribute
         */
        synchronizeSubscriber: function(subscriberId, attribute, cb) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            this.getSubscription(subscriberId, attribute, function(err, parentId) {
                if (err) {
                    cb(err);
                    return;
                }

                var fields = {};
                fields["attrs." + attribute] = 1;

                pcoll.findOne({"_id": pcoll.toObjectID(parentId)}, {"fields": fields}, function(err, parent) {
                    if (err) {
                        cb(err);
                        return;
                    }

                    if (!parent) {
                        cb("Page not found");
                        return;
                    }

                    var doSet = {};
                    doSet["attrs." + attribute] = parent["attrs"][attribute];

                    pcoll.update({"_id": pcoll.toObjectID(subscriberId)}, {"$set" : doSet}, {upsert: false}, cb);
                });
            });
        },

        /**
         * Synchronize all subscribers attributes for specified node
         */
        synchronizeSubscriptions: function(nodeId) {
            var coll = this.getColl();
            var pcoll = this.getPageColl();

            this.getSubscribers(nodeId, function(err, subscriptions) {
                if (err) {
                    qx.log.Logger.error("sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriptions#loadSubscriptions", err);
                    return;
                }

                var attributeNames = qx.lang.Object.getKeys(subscriptions);

                if (attributeNames.length == 0) {
                    return;
                }

                var fields = {};
                for (var i = 0; i < attributeNames.length; ++i) {
                    fields["attrs." + attributeNames[i]] = 1;
                }

                pcoll.findOne({"_id": pcoll.toObjectID(nodeId)}, {"fields": fields}, function(err, parent) {
                    if (err || !parent || !parent["attrs"]) {
                        qx.log.Logger.error("sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriptions#loadParent", err);
                        return;
                    }

                    var j = 0;
                    var update = function(err) {
                        if (err) {
                            qx.log.Logger.error("sm.cms.page.AttrSubscriptionMgr.synchronizeSubscriptions#update", err);
                            return;
                        }
                        if (j >= attributeNames.length) {
                            return;
                        }

                        var attributeName = attributeNames[j++];

                        var doSet = {};
                        doSet["attrs." + attributeName] = parent["attrs"][attributeName];

                        pcoll.update({"_id": {"$in": subscriptions[attributeName]}}, {"$set" : doSet}, {upsert: false, multi: true}, update);
                    };

                    update();
                });
            });
        }
    }
});
