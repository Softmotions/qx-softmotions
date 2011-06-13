/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Interface for generic template engine
 */
qx.Interface.define("sm.nsrv.ITemplateEngine", {

      members :
      {


          /**
           * Return array of file extension applicable
           * for this template renderer
           * @return {Array|String}
           */
          getExtensions : function () {

          },


          /**
           * Create template object for path
           * @param path
           * @return {Object} Template object
           */
          createTemplate : function(path, cb) {
              this.assertString(path, "Template path shoud be specified");
              this.assertFunction(cb);
          },

          /**
           * Performs template merging
           * @param {sm.nsrv.VHostEngine} VHost engine
           * @param {Object} Template object created in {@link #createTemplate()}
           * @param {Request} Http request
           * @param {Response} Http response
           * @param {Map} Request context
           * @param {Map} Http request headers
           */
          mergeTemplate : function(vhe, template, req, res, ctx, headers) {
              this.assertObject(vhe);
              this.assertObject(template);
              this.assertObject(req);
              this.assertObject(res);
          }
      }
  });