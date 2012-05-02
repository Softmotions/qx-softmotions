/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.AppStateExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    members :
    {

        __appstate : function(req, resp, ctx) {

            if (req.params["_NSTATE"] != null) {
                this.__save_state_properties(req, resp, ctx, req.params["_NSTATE"]);
                return;
            } else if (req.params["_NSTATE_PROPERTY"] != null) {
                this.__save_state_property(req, resp, req.params["_NSTATE_PROPERTY"], req.params["_NSTATE_PROPERTY_VAL"]);
                return;
            }

            var env = sm.app.Env.getDefault();
            var conf = env.getConfig();
            var uid = req.getUserId();
            var state = {
                appName : env.getAppName(),
                sessionId : req.sessionID,
                userId : uid,
                userLogin : uid,
                helpSite : conf["helpSite"],
                wikiHelp : conf["wikiHelp"],
                editor : conf["editor"],
                userFullName : "",
                userNickname : uid,
                properties : {}
            };
            if (qx.core.Environment.get("sm.nsrv.security.suppress") == true) {
                var sconf = env.getJSONConfig("security");
                var roles = [];
                if (sconf["roles"]) {
                    var sroles = sconf["roles"];
                    for (var i = 0; i < sroles.length; ++i) {
                        roles.push(sroles[i][0]);
                    }
                }
                state["roles"] = roles;
            } else {
                state["roles"] = req.getUserRoles();
            }

            this.writeJSONObject(state, resp, ctx);
        },

        __save_state_properties : function(req, resp, ctx, state) {
            var uid = req.getUserId();
            if (uid == null) {
                this.handleError(resp, ctx, "User must be authenticated");
                return;
            }
            if (!qx.lang.Type.isString(state)) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var propObj = null;
            try {
                propObj = JSON.parse(state);
            } catch(e) {
                this.handleError(resp, ctx, e);
                return;
            }
            if (!qx.lang.Type.isObject(propObj)) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var me = this;
            sm.cms.user.UsersMgr.updateUserProperties(uid, propObj, function(err) {
                if (err) {
                    me.handleError(resp, ctx, err);
                    return;
                }
                me.writeJSONObject(null, resp, ctx);
            });
        },

        __save_state_property : function(req, resp, ctx, pname, pval) {
            var uid = req.getUserId();
            if (uid == null) {
                this.handleError(resp, ctx, "User must be authenticated");
                return;
            }
            if (!qx.lang.Type.isString(pname) || !qx.lang.Type.isString(pval)) {
                this.handleError(resp, ctx, "Invalid request");
                return;
            }
            var propObj = null;
            try {
                propObj = JSON.parse(pval);
            } catch(e) {
                this.handleError(resp, ctx, e);
                return;
            }
            var me = this;
            sm.cms.user.UsersMgr.updateUserProperty(uid, pname, propObj, function(err) {
                if (err) {
                    me.handleError(resp, ctx, err);
                    return;
                }
                me.writeJSONObject(null, resp, ctx);
            });
        }
    },

    handlers :
    {
        //Application state
        "/appstate" : {
            webapp : "adm",
            handler : "__appstate"
        }
    }
});