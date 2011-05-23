/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Text field with:
 *   1. clear icon
 *   2. search menu popup
 */
qx.Class.define("sm.ui.form.SearchField", {
      extend : qx.ui.core.Widget,
      implement : [
          qx.ui.form.IStringForm,
          qx.ui.form.IForm
      ],
      include : [
          qx.ui.form.MForm,
          qx.ui.core.MChildrenHandling
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
          "changeRequired" : "qx.event.type.Data",

          /** Execute search, press ENTER key */
          "execute" : "qx.event.type.Event",

          /** Clears search box */
          "clear" : "qx.event.type.Event"
      },

      properties :
      {
          appearance : {
              init : "sm-search-field",
              refine : true
          },

          focusable : {
              refine : true,
              init : true
          }
      },

      construct : function(labels, ids) {
          qx.core.Assert.assertArray(labels);
          qx.core.Assert.assertArray(ids);
          this.__menu = new qx.ui.menu.Menu();

          var sgroup = new qx.ui.form.RadioGroup();
          for (var i = 0; i < labels.length; ++i) {
              var label = labels[i];
              qx.core.Assert.assertString(label);
              var rb = new qx.ui.menu.RadioButton(label).set({"group" : sgroup, value : (i == 0)});
              if (ids[i] != null && ids[i] != undefined) {
                  rb.$mh$id = ids[i];
              }
              this.__menu.add(rb);
          }

          this.base(arguments);
          this._setLayout(new qx.ui.layout.HBox().set({alignY : "middle"}));
          this.getChildControl("options");
          this.getChildControl("text");
          this.getChildControl("clear");
      },

      members :
      {

          __menu : null,

          // overridden
          addListener : function(type, listener, self, capture) {
              switch (type) {
                  case "execute":
                  case "clear":
                      this.base(arguments, type, listener, self, capture);
                      break;
                  default:
                      //todo scary hack
                      this.getChildControl("options");
                      this.getChildControl("text").addListener(type, listener, self, capture);
                      this.getChildControl("clear");
                      break;
              }
          },

          // overridden
          setValue : function(value) {
              this.getChildControl("text").setValue(value);
          },

          // overridden
          resetValue : function() {
              this.getChildControl("text").resetValue();
          },

          // overridden
          getValue : function() {
              return this.getChildControl("text").getValue();
          },

          /**
           * Return label of selected value of
           */
          getSelectedMenuIdVal : function() {
              var sarr = this.getChildControl("options").getMenu().getSelectables();
              for (var i = 0; i < sarr.length; ++i) {
                  var rb = sarr[i];
                  if (rb.getValue() == true) {
                      return rb.$mh$id;
                  }
              }
              return null;
          },

          _createChildControlImpl : function(id, hash) {
              var control;
              switch (id) {
                  case "options" : //options popup
                      control = new qx.ui.form.MenuButton(null, null, this.__menu);
                      this._add(control);
                      break;
                  case "text" : //text field
                      control = new qx.ui.form.TextField();
                      control.addListener("focusin", function(ev) {
                          this.addState("focused");
                      }, this);
                      control.addListener("focusout", function(ev) {
                          this.removeState("focused");
                      }, this);
                      control.setPlaceholder(this.tr("Search") + "...");
                      var valueWatch = function(ev) {
                          var hide = (control.getValue() == "");
                          var clear = this.getChildControl("clear");
                          if (hide && clear.isVisible()) {
                              clear.hide();
                              this.fireEvent("clear");
                          } else if (!hide && !clear.isVisible()) {
                              clear.show();
                          }
                      };
                      control.addListener("input", valueWatch, this);
                      control.addListener("changeValue", valueWatch, this);
                      control.addListener("keydown", function(ev) {
                          if (ev.getKeyCode() == 13) {
                              ev.stop();
                              this.fireEvent("execute");
                          }
                      }, this);


                      this._add(control);
                      break;
                  case "clear" : //clear icon
                      control = new qx.ui.basic.Atom();
                      this._add(control);
                      control.hide();
                      control.addListener("click", function(ev) {
                          this.setValue("");
                          this.fireEvent("clear");
                      }, this);
                      break;
              }
              return control || this.base(arguments, id);
          },


          //overriden
          _applyEnabled : function(value, old) {
              this.base(arguments, value, old);
              this.getChildControl("text").setEnabled(value);
          }
      },

      destruct : function() {
          this._disposeObjects("__menu");
      }
  });