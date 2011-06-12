/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.tags.AbstractTagCloudExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor],
      type : "abstract",


      statics :
      {
          MAX_TAGCLOUD_SIZE : 25,
          TAGCLOUD_PAGE_SIZE : 50
      },

      members :
      {
          /**
           * Load pages list by tag name
           */
          _load_tag_pages : function(tag, pageIndex, pageSize, cb) {
              var coll = sm.cms.page.PageMgr.getColl();

              pageIndex = Math.max(1, pageIndex || 1);
              pageSize = Math.max(0, pageSize || sm.cms.tags.AbstractTagCloudExecutor.TAGCLOUD_PAGE_SIZE);

              // data: {
              //   tag: string          - tag name
              //   pageSize: int        - page size
              //   count: int           - all elements count for specified tag
              //   pages: int           - all pages count
              //   prevPage: int|null   - previos page index
              //   prevPages: []        - <n> previos pages
              //   pageIndex: int       - current page index
              //   nextPage: int|null   - next page index
              //   nextPages: []        - <n> next pages
              //   items: []            - selected "page" items
              // }
              //

              var tagcloud = {
                  tag: tag,
                  pageSize: pageSize,
                  upageSize: pageSize != sm.cms.tags.AbstractTagCloudExecutor.TAGCLOUD_PAGE_SIZE,
                  prevPage: pageSize > 0 && pageIndex > 1 ? pageIndex - 1 : null,
                  prevPages: [],
                  pageIndex: pageIndex,
                  nextPage: null,
                  nextPages: []
              };

              // 3 previos pages
              for (var i = Math.max(1, pageIndex - 3); i < pageIndex; ++i) {
                  tagcloud.prevPages.push(i);
              }

              var q = {"tags" : tag, "published" : true};
              var opt = {
                  fields: {_id: 1, name: 1, tags: 1, cachedPath: 1},
                  sort: [
                      ["mdate", -1]
                  ]
              };
              if (pageSize != 0) {
                  opt.skip = (pageIndex - 1) * pageSize;
                  opt.limit = pageSize;
              }

              coll.createQuery(q)
                .count(function(err, count) {
                    if (err) {
                        cb(err, null);
                        return;
                    }
                    tagcloud.count = count;
                    tagcloud.pages = pageSize > 0 ? Math.ceil(count / pageSize) : 1;
                    tagcloud.nextPage = pageIndex < tagcloud.pages ? pageIndex + 1 : null;
                    // 3 next pages
                    for (var i = pageIndex + 1; i <= tagcloud.pages && i <= tagcloud.pageIndex + 3; ++i) {
                        tagcloud.nextPages.push(i);
                    }

                    // getting all pages with specified tag

                    coll.createQuery(q, opt)
                      .all(
                      function(size, items) {
                          tagcloud.items = items;
                      }).exec(function(err) {
                          if (err) {
                              cb(err);
                              return;
                          }
                          cb(null, tagcloud);
                      });
                });
          },

          /**
           * Load tad cloud
           */
          _get_tagcloud : function(req, resp, ctx) {
              var me = this;
              // getting mostly used tags
              sm.cms.tags.TagsMgr.getMostlyUsedTags(sm.cms.tags.AbstractTagCloudExecutor.MAX_TAGCLOUD_SIZE, function(err, items) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }
                  if (!items || items.length == 0) {
                      ctx();
                      return;
                  }

                  var tagdefs = ctx["tagcloud"] = [];

                  // build tags weights
                  var max = items[0].uses;
                  var min = items[items.length - 1].uses;
                  var dw = Math.max(max - min, 1);

                  for (var i = 0; i < items.length; ++i) {
                      var item = items[i];
                      tagdefs.push(
                        {
                            name : item.name,
                            ref : encodeURIComponent(item.name),
                            weight : 15 - Math.floor(10 * (max - item.uses) / dw), // normalize weights
                            order : Math.random() // for randomize items :)
                        }
                      );
                  }

                  tagdefs.sort(function(i1, i2) {
                      return i1.order - i2.order;
                  });

                  ctx();
              });
          },


          /**
           * List pages by tag
           */
          _list_tag_pages : function(req, resp, ctx) {
              var me = this;
              var ref = req.params.ref;
              if (!ref) {
                  me.handleError(resp, ctx, "Invalid request", false, true);
                  return;
              }

              this._load_tag_pages(ref, req.params.pageIndex, req.params.pageSize, function(err, tagcloud) {
                  if (err) {
                      me.handleError(resp, ctx, err);
                      return;
                  }

                  ctx["params"] = {"tagcloud" : tagcloud};
                  ctx();
              });
          }
      }
  });

