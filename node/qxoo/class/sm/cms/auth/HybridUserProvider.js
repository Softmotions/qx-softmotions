/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 User provider: users stored in mongodb collection, roles stored as json config
 in the following format:
 *<code>
 *  {
 *      "roles" : [
 *          ["Role ID1, "Role title1", ["parent1", "parent2"]],
 *          ["Role ID2, "Role title2"],
 *          ["Role ID3, "Role title3", ["parent1"]]
 *      ]
 *  }
 *</code>
 */
qx.Class.define("sm.cms.auth.HybridUserProvider", {
    extend  : sm.cms.auth.MongoUserProvider,

    construct : function(options) {
        this.base(arguments, options);
        this.__rolesConfig = options["rolesConfig"] || "security";
    },

    members :
    {
        __rolesConfig : null,

        //overriden
        getRolesList: function(callback) {
            var env = sm.app.Env.getDefault();
            var sconf = env.getJSONConfig(this.__rolesConfig);
            var roles = [];
            if (sconf["roles"]) {
                var qxtype = qx.lang.Type;
                var sroles = sconf["roles"];
                for (var i = 0; i < sroles.length; ++i) {
                    var r = sroles[i];
                    if (qxtype.isArray(r) && qxtype.isString(r[0])) {
                        roles.push({id : r[0], parent : qxtype.isArray(r[2]) ? r[2] : null, desc : r[1]});
                    }
                }
            }
            callback(null, roles);
        }
    },

    destruct : function() {
        this.__rolesConfig = null;
    }
});

