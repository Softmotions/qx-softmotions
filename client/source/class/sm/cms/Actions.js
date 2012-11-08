/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.Actions", {
    extend  : sm.conn.Actions,

    construct : function() {
        this.base(arguments);

        var base = this._getBase();

        var um = qx.util.ResourceManager.getInstance();

        //Application state
        this._addAction("app.state", um.toUri(base + "/adm/appstate"));

        //Navigation tree
        this._addAction("nav.resources", um.toUri(base + "/adm/nav"));

        //Navigation item data
        this._addAction("nav.resource", um.toUri(base + "/adm/node"));

        //New category
        this._addAction("nav.newcat", um.toUri(base + "/adm/newcat"));

        //Rename page
        this._addAction("nav.rennode", um.toUri(base + "/adm/rennode"));

        //Remove page
        this._addAction("nav.rmnode", um.toUri(base + "/adm/rmnode"));

        //Page info
        this._addAction("page.info", um.toUri(base + "/adm/page/info"));

        //New page
        this._addAction("page.new", um.toUri(base + "/adm/page/new"));

        //Page temlates
        this._addAction("page.templates", um.toUri(base + "/adm/page/templates"));

        //Save page
        this._addAction("page.save", um.toUri(base + "/adm/page/save"));

        //Media meta
        this._addAction("medialib.info", um.toUri(base + "/adm/medialib/info"));

        this._addAction("medialib.list", um.toUri(base + "/adm/medialib/list"));

        this._addAction("medialib.upload", um.toUri(base + "/adm/medialib/upload"));

        this._addAction("medialib.remove", um.toUri(base + "/adm/medialib/remove"));

        //Media staff
        this._addAction("media.upload", um.toUri(base + "/adm/media/upload"));

        this._addAction("media.list", um.toUri(base + "/adm/media/list"));

        this._addAction("media.remove", um.toUri(base + "/adm/media/remove"));

        this._addAction("media.get", um.toUri(base + "/exp/media/get"));

        //Banners
        this._addAction("banner.info", um.toUri(base + "/adm/banner/info"));

        this._addAction("banner.save", um.toUri(base + "/adm/banner/save"));

        //News
        this._addAction("news.new", um.toUri(base + "/adm/news/new"));

        //News roots for user
        this._addAction("news.roots", um.toUri(base + "/adm/news/roots"));

        //News roots manage
        this._addAction("news.roots.manage", um.toUri(base + "/adm/news/roots/manage"));

        //Page selector
        this._addAction("select.pages", um.toUri(base + "/adm/select/pages"));

        this._addAction("select.pages.count", um.toUri(base + "/adm/select/pages/count"));

        //Users selector
        this._addAction("select.users", um.toUri(base + "/adm/select/users"));

        this._addAction("select.users.count", um.toUri(base + "/adm/select/users/count"));

        //Create user
        this._addAction("create.user", um.toUri(base + "/adm/create/user"));

        //Update user
        this._addAction("update.user", um.toUri(base + "/adm/update/user"));

        //Update users role
        this._addAction("update.user.role", um.toUri(base + "/adm/update/user/role"));

        //User roles
        this._addAction("select.user.roles", um.toUri(base + "/adm/select/user/roles"));

        //Page acl
        this._addAction("page.acl", um.toUri(base + "/adm/page/acl"));

        //Page acl update
        this._addAction("page.update.acl", um.toUri(base + "/adm/page/update/acl"));

        //Page attribute synchronization update
        this._addAction("page.update.attrsync", um.toUri(base + "/adm/page/update/attrsync"));

        //Page preview
        this._addAction("page.preview", um.toUri(base + "/exp/pp"));

        //Page move
        this._addAction("page.move", um.toUri(base + "/adm/page/move"));

    },

    members :
    {
        _getBase : function() {
            if (qx.core.Environment.get("sm.cms.base")) {
                return qx.core.Environment.get("sm.cms.base");
            } else if (qx.core.Environment.get("sm.cms.test.urls")) {
                return "http://127.0.0.1:3001";
            }

            return "";
        }
    }
});
