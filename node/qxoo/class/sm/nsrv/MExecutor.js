/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Mixin of common routines for NKServer executors
 */
qx.Mixin.define("sm.nsrv.MExecutor", {

      members :
      {
          /**
           * Writes resp headers. Headers specified by argument
           * merged with headers presented in resp object
           *
           * @param resp {Object} Http response
           * @param scode {Integer} Http status code
           * @param headers Headers to be merged
           */
          writeHead : function(resp, ctx, scode, headers) {
              if (scode) {
                  resp.statusCode = scode;
              }
              //Save messages and errors into headers
              ctx.collectMessageHeaders();
              return sm.nsrv.HTTPUtils.writeHead(resp, resp.statusCode, headers);
          },

          /**
           * Response completely with JSON object
           */
          writeJSONObject : function(jsonObj, resp, ctx) {
              this.writeHead(resp, ctx, 200, { "Content-Type": "application/json" });
              resp.end(JSON.stringify(jsonObj));
              ctx({"terminated" : true});
          },

          /**
           * Response completely with string data
           */
          writeString : function(data, resp, ctx, ctype) {
              this.writeHead(resp, ctx, 200, { "Content-Type": ctype ? ctype : "text/plain" });
              resp.end(data);
              ctx({"terminated" : true});
          },

          /**
           * Write message to the response headers
           */
          writeMessage : function(resp, ctx, msg, isErr, ctype, data) {
              resp.messages.push(new sm.nsrv.Message(msg, !!isErr));
              this.writeHead(resp, ctx, null, { "Content-Type": ctype ? ctype : "text/plain" });
              resp.end(data ? data : "");
              ctx({"terminated" : true});
          },

          /**
           * Handle error, write error to the response headers
           *
           * @param resp {HTTP Response}
           * @param ctx  {Object} Request context
           * @param err  {Object|String|LocalizedString?null} Error object
           * @param hide {Boolean?false} If true: do not inform user about this error
           * @param syshide {Boolean?true} If true: do not log this error
           */
          handleError : function(resp, ctx, err, hide, syshide) {
              if (err instanceof qx.locale.LocalizedString) {
                  err = err.toString();
              }
              if (err != null && !syshide) {
                  qx.log.Logger.error(this, err);
              }
              this.writeMessage(resp, ctx, (hide || err == null) ? "Ошибка" : err.toString(), true);
          },

          /**
           * Return default env
           */
          getDefaultEnv : function() {
              return sm.app.Env.getDefault();
          },

          _doNotRecreateMe : function(val) {
              this.$$notrecreate = !!val;
          }
      }
  });