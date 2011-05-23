/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Алерт
 */
qx.Class.define("sm.alert.AlertMessages", {
      extend : qx.ui.window.Window,

      events :
      {
      },

      properties :
      {
      },

      construct : function(caption) {
          this.base(arguments, caption);
          this.setLayout(new qx.ui.layout.VBox(10));
          this.set({
                modal         : true,
                showMinimize  : false,
                showMaximize  : false,
                allowMaximize : false,
                width : 390
            });

          this.__messages = {};
          this.__container = new qx.ui.container.Composite(new qx.ui.layout.VBox());
          this.add(this.__container);
          var cancel = new qx.ui.form.Button(this.tr("Close"));
          this.add(cancel);
          cancel.addListener("execute", function() {
              this.close();
          }, this);
          this.addListenerOnce("resize", function() {
              this.center();
              cancel.focus();
          }, this);
      },

      members :
      {

          __container : null,

          __messages : null,

          ensureOnTop : function() {
              var root = qx.core.Init.getApplication().getRoot();
              var maxWindowZIndex = this.getZIndex();
              var windows = root.getWindows();
              for (var i = 0; i < windows.length; i++) {
                  if (windows[i] != this) {
                      var zIndex = windows[i].getZIndex();
                      maxWindowZIndex = Math.max(maxWindowZIndex, zIndex);
                  }
              }
              var me = this;
              me.setZIndex(maxWindowZIndex + 1);
          },

          open : function() {
              this.base(arguments);
              this.ensureOnTop();
          },


          addMessages : function(caption, messages) {
              if (!messages || messages.length == 0) {
                  return;
              }
              var msgs = this.__messages[caption];
              if (msgs == null) {
                  msgs = new qx.ui.groupbox.GroupBox(caption);
                  msgs.setLayout(new qx.ui.layout.VBox());
                  this.__container.add(msgs);
                  this.__messages[caption] = msgs;
              }
              for (var i = 0; i < messages.length; ++i) {
                  var blb = new qx.ui.basic.Label(messages[i]).set({rich:true});
                  msgs.add(blb);
              }
          }
      },

      destruct : function() {
          this.__messages = null;
          this._disposeObjects("__container");
      }
  });