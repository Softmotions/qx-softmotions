/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Menu editor
 */
qx.Class.define("sm.cms.editor.MenuEditor", {
      extend : qx.ui.container.Composite,
      implement : [
          qx.ui.form.IStringForm,
          qx.ui.form.IForm
      ],
      include : [
          qx.ui.form.MForm
      ],

      events :
      {
          /** Fired when the value was modified */
          "changeValue" : "qx.event.type.Data",

          /** Fired when the enabled state was modified */
          "changeEnabled" : "qx.event.type.Data",

          /** Fired when the valid state was modified */
          "changeValid" : "qx.event.type.Data",

          /** Fired when the invalidMessage was modified */
          "changeInvalidMessage" : "qx.event.type.Data",

          /** Fired when the required was modified */
          "changeRequired" : "qx.event.type.Data"
      },

      properties :
      {
      },

      /**
       * Create menu editor window
       * @param options
       *          "main" - if not <code>true</code> adds checkbox for override default menu by local page menu
       */
      construct : function(options) {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox());

          this.__options = options = options || {};

          var view = this.__form = this.__mtable = new sm.cms.editor.MenuTable();

          if (!options["main"]) {
              var form = this.__form = new qx.ui.form.Form();

              var activeCheckBox = this.__active = new qx.ui.form.CheckBox().set({value : !!options["main"]});
              var activeCb = function() {
                  var active = activeCheckBox.getValue();
                  var items = form.getItems();
                  for (var k in items) {
                      if (k == "_active_") {
                          continue;
                      }
                      if (active) {
                          items[k].setEnabled(true);
                          items[k].show();
                      } else {
                          items[k].setEnabled(false);
                          items[k].exclude();
                      }

                  }
              };
              activeCheckBox.addListener("changeValue", activeCb, this);
              form.add(activeCheckBox, this.tr("переопределить"), null, "_active_");

              form.add(this.__mtable, this.tr("настройки"), null, "_menu_");

              view = new sm.cms.util.FlexFormRenderer(form);

              activeCb();
          }

          this.add(view, {flex : 1});
      },

      members :
      {
          __options: null,
          __active : null,
          __mtable  : null,

          ///////////////////////////////////////////////////////////////////////////
          //                            StringForm stuff                           //
          ///////////////////////////////////////////////////////////////////////////


          // overridden
          setValue : function(value) {
              value = value || {};
              if (!qx.lang.Type.isObject(value)) {
                  qx.log.Logger.error(this, "Value is not object", value);
                  value = {};
              }

              value.items = value.items || [];
              if (!qx.lang.Type.isArray(value.items)) {
                  qx.log.Logger.error(this, "Value items is not array", value.items);
                  value.items = [];
              }
              this.__mtable.setValue(value.items);

              value.active = value.active || !!this.__options["main"];
              if (this.__active) {
                  this.__active.setValue(value.active);
              }

              this.fireDataEvent("changeValue", value);
          },

          // overridden
          resetValue : function() {
              this.setValue({});
          },

          // overridden
          getValue : function() {
              return {
                  active: !!this.__options["main"] || this.__active && this.__active.getValue(),
                  items: this.__mtable.getValue()
              };
          }
      },

      destruct : function() {
          this._disposeObjects("__options", "__form");
      }
  });

