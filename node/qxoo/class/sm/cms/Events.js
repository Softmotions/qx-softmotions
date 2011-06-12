/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Event emitter for engine events
 */
qx.Class.define("sm.cms.Events", {
      extend  : qx.core.Object,
      type : "singleton",

      events :
      {
          /**
           * Fired when page saved
           * Data: JSON page document (Mongodb 'navtree' collection)
           */
          "pageSaved" : "qx.event.type.Data",

          /**
           * Fired when page removed
           * Data: JSON removed page document (Mongodb 'navtree' collection)
           */
          "pageRemoved" : "qx.event.type.Data",

          // media events
          /**
           * Fired when new media item saved.
           * Data: [parentId, mediaNode(MongoDb 'mediatree' collection item)]
           */
          "mediaAdded" : "qx.event.type.Data",

          /**
           * Fired when media item updated (renamed).
           * Data: [parentId, mediaNode(MongoDb 'mediatree' collection item)]
           */
          "mediaUpdated" : "qx.event.type.Data",

          /**
           * Fired when new media item removed.
           * Data: [parentId, mediaId]
           */
          "mediaRemoved" : "qx.event.type.Data",


          /**
           * data: [user login, role id]
           */
          "userAssignedToRole" : "qx.event.type.Data",

          /**
           * data: [user login, role id]
           */
          "roleRemovedFromUser" : "qx.event.type.Data"
      },

      members :
      {

      }
  });

