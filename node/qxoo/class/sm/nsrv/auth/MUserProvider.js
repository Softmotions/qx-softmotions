/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Mixin.define("sm.nsrv.auth.MUserProvider", {

    members:
    {
        getUserRoles: function(roles, userRoles) {
            var result = [];

            var trole;
            var troleId;
            var troles = [];
            troles = troles.concat(userRoles || []);
            while (troleId = troles.pop()) {
                if (trole = roles[troleId]) {
                    result.push(trole.id);
                    troles = trole.parent ? troles.concat(trole.parent) : troles;
                }
            }

            return result;
        }
    }
});
