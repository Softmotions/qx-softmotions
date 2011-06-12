/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.youtube.AbstractYouTubeExecutor", {
      extend  : qx.core.Object,
      type : "abstract",

      construct : function() {
          this.base(arguments);
          // init youtube videos updating
          var cfg = sm.app.Env.getDefault().getJSONConfig("youtube");
          setInterval(sm.cms.youtube.AbstractYouTubeExecutor.updateYouTubeCache,
            cfg["updateTimeout"] || 86400000); // default timeout - 1 day
          sm.cms.youtube.AbstractYouTubeExecutor.updateYouTubeCache();
      },

      statics :
      {
          /**
           * Update youtube entries cache
           */
          updateYouTubeCache : function() {
              var me = this;

              var vireg = /v=([0-9a-z_-]+)[&$]/i; // regexp for getting videoId from player url

              var env = sm.app.Env.getDefault();
              var cfg = env.getJSONConfig("youtube");

              var utimeout = cfg["updateTimeout"] || 86400000;
              var lastupdate = cfg["lastUpdate"] || 0;
              // check last update
              if (Date.now() < lastupdate + utimeout / 2) {
                  qx.log.Logger.debug(this, "skip updating cache");
                  return;
              }

              var limit = cfg["queryLimit"] || 32;
              var watchUrlTemplate = cfg["watchUrlTemplate"] || "";
              var embeddedUrlTemplate = cfg["embeddedUrlTemplate"] || "";

              // connect settings in config:
              //  - youtube.connect:
              //    - host          youtube host
              //    - port          youtube port
              //    - method        http method
              //    - pathTemplate  query template, replacement items: ${user}, ${start}, ${limit}
              if (!cfg["connect"]) {
                  qx.log.Logger.error(me, "Invalid youtube config, no 'connect' section");
                  return;
              }
              var http = $$node.require("http");

              var entries = [];
              var fetchEntries = function(start, limit) {
                  // prepare query
                  var ropts = qx.lang.Object.clone(cfg["connect"]);
                  ropts["path"] = (ropts["pathTemplate"] || "")
                    .replace("${user}", cfg["user"])
                    .replace("${start}", start)
                    .replace("${limit}", limit);
                  delete ropts["pathTemplate"];

                  var data = "";
                  var req = http.request(ropts, function(res) {
                      if (res.statusCode != 200) {
                          qx.log.Logger.error(me, "Invalid response, status=" + res.statusCode);
                          return;
                      }
                      res.setEncoding("UTF-8");
                      res.on("data", function (body) {
                          data += body;
                      });
                      res.on("end", function() {
                          // parse response to JSON
                          var ytdata = qx.util.Json.parse(data);
                          if (!ytdata) {
                              qx.log.Logger.error(me, "Invalid response data");
                              return;
                          }

                          // youtube json data (http://code.google.com/intl/ru/apis/youtube/developers_guide_protocol.html#Understanding_Video_Entries)
                          var tentries = ytdata.feed.entry || [];
                          for (var i = 0; i < tentries.length; i++) {
                              var entry = tentries[i];
                              var title = entry.title.$t;
                              var description = tentries[i].media$group.media$description.$t;
                              var thumbnailUrl = tentries[i].media$group.media$thumbnail[0].url;
                              var playerUrl = tentries[i].media$group.media$player[0].url;

                              var vi = playerUrl.match(vireg);
                              if (!vi || vi.length < 2) {
                                  qx.log.Logger.warn(me, "Error getting video Id from player url", playerUrl);
                                  continue;
                              }

                              var id = vi[1];

                              entries.push(
                                {
                                    id: id,
                                    title : title,
                                    description : description,
                                    thumb : sm.cms.youtube.AbstractYouTubeExecutor.__uriEscape(thumbnailUrl),
                                    url : watchUrlTemplate.replace("${videoId}", id),
                                    embedded : embeddedUrlTemplate.replace("${videoId}", id)
                                }
                              );
                          }

                          // check fetch all video definitions
                          if (start + limit < ytdata.feed.openSearch$totalResults.$t) {
                              fetchEntries(start + limit, limit);
                          } else {
                              cfg["lastUpdate"] = Date.now();
                              cfg["entries"] = entries;
                              env.setJSONConfig("youtube", cfg);
                              qx.log.Logger.debug(me, "Fetched videos: " + entries.length);
                          }
                      });
                  });
                  req.on("error", function(err) {
                      qx.log.Logger.error(me, err);
                  });
                  req.end();
              };

              // start fetching
              fetchEntries(1, limit);
          },

          /**
           * simple escape uri:
           */
          __uriEscape : function(uri) {
              return uri.replace("&", "&amp;");
          }
      },

      members :
      {
          /**
           * Prepare random youtube element definition
           */
          _youtube : function(req, resp, ctx) {
              var env = sm.app.Env.getDefault();
              var cfg = env.getJSONConfig("youtube");
              // get random video from cache
              var entries = cfg["entries"];
              if (entries.length > 0) {
                  var index = Math.floor(Math.random() * entries.length);
                  ctx["ytItem"] = entries[index];
              }
              ctx();
          }
      }
  });