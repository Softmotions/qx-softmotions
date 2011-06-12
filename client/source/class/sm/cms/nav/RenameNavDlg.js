/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Диалог создания нового раздела сайта
 */
qx.Class.define("sm.cms.nav.RenameNavDlg", {
      extend : sm.cms.nav.BaseNavPopup,

      /**
       * @param pnode Parent node in navigation tree
       */
      construct : function(pnode) {
          this.__pnode = pnode;
          this.base(arguments);
      },

      members :
      {

          __pnode : null,

          _configureForm : function() {
              var name = new qx.ui.form.TextField().set({allowGrowY : true, maxLength : 64, required : true});
              name.addListener("keypress", function(ev) {
                  if (ev.getKeyIdentifier() == "Enter") {
                      this.save();
                  }
              }, this);
              this._form.add(name, this.tr("Новое имя"), null, "name");
              name.focus();
              name.setValue(this.__pnode.label);
          },

          _save : function() {
              var res = {};
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.rennode"), "GET", "application/json");
              var fitems = this._form.getItems();
              req.setParameter("ref", this.__pnode.$$data);
              req.setParameter("name", fitems["name"].getValue());
              req.send(function(resp) {
                  var rdata = resp.getContent();
                  this.fireDataEvent("completed", rdata);
              }, this);
          }
      },

      destruct : function() {
          this.__pnode = null;
      }
  });