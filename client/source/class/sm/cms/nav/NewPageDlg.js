/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.nav.NewPageDlg", {
      extend : sm.cms.nav.BaseNavPopup,

      /**
       * @param pnode Parent node in navigation tree
       */
      construct : function(pnode) {
          this.base(arguments);
          this.__pnode = pnode;
      },

      members :
      {
          __pnode : null,

          _configureForm : function() {
              var page = new qx.ui.form.TextField().set({allowGrowY : true, maxLength : 64, required : true});
              page.addListener("keypress", function(ev) {
                  if (ev.getKeyIdentifier() == "Enter") {
                      this.save();
                  }
              }, this);
              this._form.add(page, this.tr("Страница"), null, "name");
              page.focus();
          },

          _save : function() {
              var res = {};
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.new"), "GET", "application/json");
              var fitems = this._form.getItems();
              req.setParameter("name", fitems["name"].getValue());
              req.setParameter("parent", this.__pnode.$$data);
              req.send(function(resp) {
                  var rdata = resp.getContent();
                  this.fireDataEvent("completed", rdata);
              }, this);
          }
      },

      destruct : function() {

      }
  });