/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.Actions", {
      extend  : sm.conn.Actions,

      construct : function() {
          this.base(arguments);
          var um = qx.util.ResourceManager.getInstance();

          //Application state
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("app.state", um.toUri("http://127.0.0.1:3001/adm/appstate"));
          } else {
              this._addAction("app.state", um.toUri("/adm/appstate"));
          }

          //Navigation tree
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("nav.resources", um.toUri("http://127.0.0.1:3001/adm/nav"));
          } else {
              this._addAction("nav.resources", um.toUri("/adm/nav"));
          }

          //Navigation item data
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("nav.resource", um.toUri("http://127.0.0.1:3001/adm/node"));
          } else {
              this._addAction("nav.resource", um.toUri("/adm/node"));
          }

          //New category
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("nav.newcat", um.toUri("http://127.0.0.1:3001/adm/newcat"));
          } else {
              this._addAction("nav.newcat", um.toUri("/adm/newcat"));
          }

          //Rename page
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("nav.rennode", um.toUri("http://127.0.0.1:3001/adm/rennode"));
          } else {
              this._addAction("nav.rennode", um.toUri("/adm/rennode"));
          }

          //Remove page
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("nav.rmnode", um.toUri("http://127.0.0.1:3001/adm/rmnode"));
          } else {
              this._addAction("nav.rmnode", um.toUri("/adm/rmnode"));
          }

          //Page info
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.info", um.toUri("http://127.0.0.1:3001/adm/page/info"));
          } else {
              this._addAction("page.info", um.toUri("/adm/page/info"));
          }

          //New page
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.new", um.toUri("http://127.0.0.1:3001/adm/page/new"));
          } else {
              this._addAction("page.new", um.toUri("/adm/page/new"));
          }

          //Page temlates
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.templates", um.toUri("http://127.0.0.1:3001/adm/page/templates"));
          } else {
              this._addAction("page.templates", um.toUri("/adm/page/templates"));
          }

          //Save page
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.save", um.toUri("http://127.0.0.1:3001/adm/page/save"));
          } else {
              this._addAction("page.save", um.toUri("/adm/page/save"));
          }

          //Media meta
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("medialib.info", um.toUri("http://127.0.0.1:3001/adm/medialib/info"));
          } else {
              this._addAction("medialib.info", um.toUri("/adm/medialib/info"));
          }

          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("medialib.list", um.toUri("http://127.0.0.1:3001/adm/medialib/list"));
          } else {
              this._addAction("medialib.list", um.toUri("/adm/medialib/list"));
          }

          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("medialib.upload", um.toUri("http://127.0.0.1:3001/adm/medialib/upload"));
          } else {
              this._addAction("medialib.upload", um.toUri("/adm/medialib/upload"));
          }

          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("medialib.remove", um.toUri("http://127.0.0.1:3001/adm/medialib/remove"));
          } else {
              this._addAction("medialib.remove", um.toUri("/adm/medialib/remove"));
          }

          //Media staff
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("media.upload", um.toUri("http://127.0.0.1:3001/adm/media/upload"));
          } else {
              this._addAction("media.upload", um.toUri("/adm/media/upload"));
          }
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("media.list", um.toUri("http://127.0.0.1:3001/adm/media/list"));
          } else {
              this._addAction("media.list", um.toUri("/adm/media/list"));
          }
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("media.remove", um.toUri("http://127.0.0.1:3001/adm/media/remove"));
          } else {
              this._addAction("media.remove", um.toUri("/adm/media/remove"));
          }
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("media.get", um.toUri("http://127.0.0.1:3001/exp/media/get"));
          } else {
              this._addAction("media.get", um.toUri("/exp/media/get"));
          }

          //Banners
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("banner.info", um.toUri("http://127.0.0.1:3001/adm/banner/info"));
          } else {
              this._addAction("banner.info", um.toUri("/adm/banner/info"));
          }
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("banner.save", um.toUri("http://127.0.0.1:3001/adm/banner/save"));
          } else {
              this._addAction("banner.save", um.toUri("/adm/banner/save"));
          }

          //News
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("news.new", um.toUri("http://127.0.0.1:3001/adm/news/new"));
          } else {
              this._addAction("news.new", um.toUri("/adm/news/new"));
          }

          //News roots for user
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("news.roots", um.toUri("http://127.0.0.1:3001/adm/news/roots"));
          } else {
              this._addAction("news.roots", um.toUri("/adm/news/roots"));
          }

          //News roots manage
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("news.roots.manage", um.toUri("http://127.0.0.1:3001/adm/news/roots/manage"));
          } else {
              this._addAction("news.roots.manage", um.toUri("/adm/news/roots/manage"));
          }

          //Page selector
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("select.pages", um.toUri("http://127.0.0.1:3001/adm/select/pages"));
          } else {
              this._addAction("select.pages", um.toUri("/adm/select/pages"));
          }

          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("select.pages.count", um.toUri("http://127.0.0.1:3001/adm/select/pages/count"));
          } else {
              this._addAction("select.pages.count", um.toUri("/adm/select/pages/count"));
          }

          //Users selector
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("select.users", um.toUri("http://127.0.0.1:3001/adm/select/users"));
          } else {
              this._addAction("select.users", um.toUri("/adm/select/users"));
          }

          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("select.users.count", um.toUri("http://127.0.0.1:3001/adm/select/users/count"));
          } else {
              this._addAction("select.users.count", um.toUri("/adm/select/users/count"));
          }

          //Create user
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("create.user", um.toUri("http://127.0.0.1:3001/adm/create/user"));
          } else {
              this._addAction("create.user", um.toUri("/adm/create/user"));
          }

          //Update user
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("update.user", um.toUri("http://127.0.0.1:3001/adm/update/user"));
          } else {
              this._addAction("update.user", um.toUri("/adm/update/user"));
          }

          //Update users role
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("update.user.role", um.toUri("http://127.0.0.1:3001/adm/update/user/role"));
          } else {
              this._addAction("update.user.role", um.toUri("/adm/update/user/role"));
          }

          //User roles
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("select.user.roles", um.toUri("http://127.0.0.1:3001/adm/select/user/roles"));
          } else {
              this._addAction("select.user.roles", um.toUri("/adm/select/user/roles"));
          }

          //Page acl
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.acl", um.toUri("http://127.0.0.1:3001/adm/page/acl"));
          } else {
              this._addAction("page.acl", um.toUri("/adm/page/acl"));
          }

          //Page acl update
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.update.acl", um.toUri("http://127.0.0.1:3001/adm/page/update/acl"));
          } else {
              this._addAction("page.update.acl", um.toUri("/adm/page/update/acl"));
          }

          //Page attribute synchronization update
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.update.attrsync", um.toUri("http://127.0.0.1:3001/adm/page/update/attrsync"));
          } else {
              this._addAction("page.update.attrsync", um.toUri("/adm/page/update/attrsync"));
          }


          //Page preview
          if (qx.core.Environment.get("sm.cms.test.urls")) {
              this._addAction("page.preview", um.toUri("http://127.0.0.1:3001/exp/pp"));
          } else {
              this._addAction("page.preview", um.toUri("/exp/pp"));
          }

      }
  });
