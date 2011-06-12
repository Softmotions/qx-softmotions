/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

// todo: configure urls
qx.Class.define("sm.cms.auth.AuthExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor],

      members :
      {
          __index : function(req, resp, ctx) {
              ctx(null);
          },

          __exp_loginform : function(req, resp, ctx) {
              if (req.isAuthenticated()) {
                  if (req.headers['refferer']) {
                      this.writeHead(resp, ctx, 302, {"Location": req.headers['referer']});
                      resp.end();
                      ctx({"terminated" : true});
                  } else {
                      ctx({"path": '/index.jz'});
                  }
              } else {
                  ctx({"path": '/login.jz'});
              }
          },

          __adm_loginaction: function(req, resp, ctx) {
              this.writeHead(resp, ctx, 302, {"Location": "/adm/index.html"});
              resp.end();
              ctx({"terminated" : true});
          },

          __logout : function(req, resp, ctx) {
              this.writeHead(resp, ctx, 302, {"Location": "/exp/index.jz"});
              resp.end();
              ctx({"terminated" : true});
          }
      },

      handlers :
      {
          // index.html - необходима проверка security
          "/index.html" : {
              webapp : "adm",
              handler : "__index"
          },

          //Login form
          "/login.jz" : {
              webapp : "exp",
              handler : "__exp_loginform"
          },

          //Login action (fake)
          "/login" : {
              webapp : "adm",
              handler : "__adm_loginaction"
          },

          //Logout form
          "/logout" : {
              webapp : "adm",
              handler : "__logout",
              logout: true
          }
      }
  });