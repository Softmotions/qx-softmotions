/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.news.NewsPanel", {
      extend  :  qx.ui.container.Stack,

      construct : function() {
          this.base(arguments);

          this.__ws = new sm.cms.news.NewsWorkspace();
          this.__ws.addListener("activatePanel", function() {
              this.setSelection([this.__ws]);
          }, this);
          this.add(this.__ws);


          this.__editor = new sm.cms.news.NewsEditor(this.__ws);
          this.__editor.addListener("activatePanel", function() {
              this.setSelection([this.__editor]);
          }, this);
          this.add(this.__editor);

          this.setSelection([this.__ws]);
      },

      members :
      {

          __editor : null,

          __ws : null

      },

      destruct : function() {
          this._disposeObjects("__editor", "__ws");
      }
  });

