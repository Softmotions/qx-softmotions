/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Progress popu-up
 */
qx.Class.define("sm.ui.progress.ProgressPopup", {
      extend  : qx.ui.groupbox.GroupBox,
      type : "singleton",

      statics :
      {
      },

      events :
      {
          /**
           * Event fired when widget is shown
           */
          "show" : "qx.event.type.Event",

          /**
           * Event fired when widget is hidden
           */
          "hide"  : "qx.event.type.Event",


          /**
           * When user pressed cancel button
           */
          "cancel" : "qx.event.type.Event"
      },

      properties :
      {

          // overridden
          focusable : {
              refine : true,
              init : true
          },

          /**
           * If true show cancel button
           */
          cancel : {
              check : "Boolean",
              init : false,
              apply : "__applyCancel"
          },

          /**
           * If this progressbar is determined or undetermined
           *
           * todo only undetermined bahaviour
           */
          "determined" : {
              check : "Boolean",
              init : false
          },

          "appearance" : {
              init : "sm-progress-popup",
              refine : true
          }
      },

      construct : function() {
          this.base(arguments);

          this.__lsnrs = [];
          this.setLayout(new qx.ui.layout.HBox(10).set({alignY : "middle"}));
          this.set({
                "visibility" : "hidden"
            });

          //we should be above all windows
          var root = qx.core.Init.getApplication().getRoot();

          /*
           * make it a focus root
           */
          qx.ui.core.FocusHandler.getInstance().addRoot(this);
          root.add(this);

          //Init indicator
          this.getChildControl("indicator");

          /*
           * resize event
           */
          this.getApplicationRoot().addListener("resize", function(e) {
              var bounds = this.getBounds();
              this.set({
                    marginTop: Math.round((qx.bom.Document.getHeight() - bounds.height) / 2),
                    marginLeft : Math.round((qx.bom.Document.getWidth() - bounds.width) / 2)
                });
          }, this);

          /*
           * appear event
           */
          this.addListener("appear", function(e) {
              var bounds = this.getBounds();
              this.set({
                    marginTop: Math.round((qx.bom.Document.getHeight() - bounds.height) / 2),
                    marginLeft : Math.round((qx.bom.Document.getWidth() - bounds.width) / 2)
                });
          }, this);
      },

      members :
      {
          __previousFocus : null,

          __cancelBt : null,

          __lsnrs : null,


          setEnabledCancel : function(val) {
              if (this.__cancelBt) {
                  this.__cancelBt.setEnabled(val);
              }
          },

          //overriden
          addListener : function(type, listener, self, capture) {
              var id = this.base(arguments, type, listener, self, capture);
              this.__lsnrs.push(id);
              return id;
          },


          //overriden
          addListenerOnce : function(type, listener, self, capture) {
              var id = this.base(arguments, type, listener, self, capture);
              this.__lsnrs.push(id);
              return id;
          },


          show : function() {
              var root = this.getApplicationRoot();

              var maxWindowZIndex = 1E5;
              var windows = root.getWindows();
              for (var i = 0; i < windows.length; i++) {
                  var zIndex = windows[i].getZIndex();
                  maxWindowZIndex = Math.max(maxWindowZIndex, zIndex);
              }
              this.setZIndex(maxWindowZIndex + 1);

              root.blockContent(this.getZIndex() - 1);
              this.setVisibility("visible");
              this.__previousFocus = qx.ui.core.FocusHandler.getInstance().getActiveWidget();
              this.focus();
              this.fireEvent("show");
          },

          hide : function(reset) {
              if (reset == null) {
                  reset = true;
              }
              if (!this.isVisible()) {
                  return;
              }
              this.setVisibility("hidden");
              this.getApplicationRoot().unblockContent();
              if (this.__previousFocus) {
                  try {
                      this.__previousFocus.focus();
                  } catch(e) {
                  }
                  this.__previousFocus = null;
              }
              this.fireEvent("hide");
              if (reset == true) {
                  this.reset();
              }
          },

          /**
           * Reset state of progress-popup to default values
           */
          reset : function() {
              for (var i = 0; i < this.__lsnrs.length; ++i) {
                  var lid = this.__lsnrs[i];
                  this.removeListenerById(lid);
              }
              this.__lsnrs = [];
              this.setCancel(false);
              this.setEnabledCancel(true);
              this.setLegend("");
          },

          __applyCancel : function(val) {
              if (val) {
                  if (!this.__cancelBt) {
                      this.__cancelBt = new qx.ui.form.Button(this.tr("Cancel"));
                      this.__cancelBt.addListener("execute", function(e) {
                          this.fireEvent("cancel");
                      }, this);
                      this.add(this.__cancelBt);
                  }
                  if (!this.__cancelBt.isVisible()) {
                      this.__cancelBt.show();
                  }
              } else if (this.__cancelBt) {
                  this.__cancelBt.exclude();
              }
          },

          _createChildControlImpl : function(id, hash) {
              var control;
              switch (id) {
                  case "indicator" : //options popup
                      control = new qx.ui.basic.Image();
                      this.add(control);
                      break;
              }
              return control || this.base(arguments, id);
          }
      },

      destruct : function() {
          var root = qx.core.Init.getApplication().getRoot();
          qx.ui.core.FocusHandler.getInstance().removeRoot(this);
          root.remove(this);
          this.__previousFocus = this.__lsnrs = null;
          this._disposeObjects("__cancelBt");
      }
  });