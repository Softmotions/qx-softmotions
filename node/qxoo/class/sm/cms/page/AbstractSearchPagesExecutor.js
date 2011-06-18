/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.AbstractSearchPagesExecutor", {
      extend  : qx.core.Object,
      include : [sm.nsrv.MExecutor],

      members :
      {

          __page_search : function(req, resp, ctx) {

              var me = this;
              var pmgr = sm.cms.page.PageMgr;

              var pageIndex = req.params["pageIndex"];
              var pageSize = req.params["pageSize"];


              ctx();
          }

      },

      handlers :
      {
          "res/page/search_page.jz" : {
              webapp : "exp",
              handler : "__page_search"
          }
      }
  });
