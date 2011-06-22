/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.media.MediaFilesExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor],

      statics :
      {
          /**
           * Returns url for access resource from media lib.
           * @param mediaId media Id
           */
          getMediaLibRef: function(mediaId) {
              return "/exp/media/get?ref=media" + mediaId;
          }
      },

      members :
      {

          __getMongo : function() {
              return sm.app.Env.getDefault().getMongo();
          },


          __media_get_internal : function(req, resp, ctx, ref) {
              if (ref == null) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }
              var io = $$node.require("utils/io");
              var mongo = sm.app.Env.getDefault().getMongo();
              var me = this;

              mongo.openGridFile(ref, "r", null, null, function(err, gfile) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  me.writeHead(resp, ctx, 200, { "Content-Type": gfile.contentType });
                  var stream = gfile.stream(true);
                  io.responseHTTPump(stream, resp, function(err) {
                      if (err) {
                          qx.log.Logger.error(me, err);
                      }
                      ctx({"terminated" : true});
                  });
              });
          },

          __media_get : function(req, resp, ctx) {
              this.__media_get_internal(req, resp, ctx, req.params["ref"]);
          },

          __ref : function(req, resp, ctx) {

              var path = req.info.path;
              if (path.indexOf("/ref/") != 0) {
                  this.handleError(resp, ctx, "Invalid request");
                  return;
              }
              var refspec = path.substring("/ref/".length);
              var fid = null;
              if (refspec.indexOf("Image:") == 0) {
                  fid = refspec.substring("Image:".length);
              } else if (refspec.indexOf("Media:") == 0) {
                  fid = refspec.substring("Media:".length);
              }
              if (fid === null) {

                  var colInd = refspec.indexOf("://");
                  if (colInd == -1) {
                      this.handleError(resp, ctx, "Invalid request");
                      return;
                  }
                  var proto = refspec.substring(0, colInd).toLowerCase();
                  if (["http", "https", "ftp"].indexOf(proto) == -1) {
                      this.handleError(resp, ctx, "Invalid protocol: " + proto, false, true);
                      return;
                  }
                  var nlocation = proto + refspec.substring(colInd);
                  //send redirect
                  this.writeHead(resp, ctx, 301, {"Location" : decodeURIComponent(nlocation)});
                  resp.end();
                  ctx({"terminated" : true});

              } else {

                  this.__media_get_internal(req, resp, ctx, fid);
              }
          }
      },

      handlers :
      {

          /**
           * Retrieve media file
           * /media/get?ref=fec0ad4dec93a02100000000P3131024.JPG
           */
          "/media/get" : {
              webapp : "exp",
              handler : "__media_get"
          },

          /**
           * Alias for /media/get
           * /file?ref=fec0ad4dec93a02100000000P3131024.JPG
           */
          "/file" : {
              webapp : "exp",
              handler : "__media_get"
          },

          /**
           * MediaWiki refs processing
           *
           * /exp/ref/Image:ec0ad4dec93a02100000000P3131024.JPG
           * /exp/ref/Media:ec0ad4dec93a02100000000P3131024.JPG
           * /exp/ref/Http:<link path>
           * /exp/ref/Https:<link path>
           */
          "^/ref.*$" : {
              matching : "regexp",
              handler : "__ref"
          }

      }
  });
