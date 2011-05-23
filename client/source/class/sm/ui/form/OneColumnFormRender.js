/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Renders form where labels and fields placed in single c
 */
qx.Class.define("sm.ui.form.OneColumnFormRender", {
      extend : qx.ui.form.renderer.AbstractRenderer,


      construct : function(form) {
          var layout = new qx.ui.layout.VBox(4);
          this._setLayout(layout);

          this.base(arguments, form);
      },

      members :
      {
          _buttonRow : null,

          //overriden
          addItems : function(items, names, title) {
              if (title != null) {
                  this._add(this._createHeader(title), {});
              }
              for (var i = 0; i < items.length; i++) {

                  var label = this._createLabel(names[i], items[i]);
                  this._add(label, {});

                  var item = items[i];
                  label.setBuddy(item);

                  this._add(item, {});

                  this._connectVisibility(item, label);

                  // store the names for translation
                  if (qx.core.Environment.get("qx.dynlocale")) {
                      this._names.push({name: names[i], label: label, item: items[i]});
                  }
              }
          },

          //overriden
          addButton : function(button) {
              if (this._buttonRow == null) {
                  // create button row
                  this._buttonRow = new qx.ui.container.Composite();
                  this._buttonRow.setMarginTop(5);
                  var hbox = new qx.ui.layout.HBox();
                  hbox.setAlignX("right");
                  hbox.setSpacing(5);
                  this._buttonRow.setLayout(hbox);
                  // add the button row
                  this._add(this._buttonRow, {});
              }
              // add the button
              this._buttonRow.add(button);
          },

          getLayout : function() {
              return this._getLayout();
          },

          _createLabel : function(name, item) {
              var label = new qx.ui.basic.Label(this._createLabelText(name, item));
              label.setRich(true);
              label.setMarginTop(2);
              return label;
          },

          _createLabelText : function(name, item) {
              var required = "";
              if (item.getRequired()) {
                  required = " <span style='color:red'>*</span> ";
              }
              // Create the label. Append a colon only if there's text to display.
              var colon = name.length > 0 || item.getRequired() ? " :" : "";
              return name + required + colon;
          },

          _createHeader : function(title) {
              var header = new qx.ui.basic.Label(title);
              header.setFont("bold");
              header.setMarginTop(10);
              header.setAlignX("left");
              return header;
          }

      },

      destruct : function() {
          //this._disposeObjects("__field_name");
          if (this._buttonRow) {
              this._buttonRow.removeAll();
              this._disposeObjects("_buttonRow");
          }
      }
  });

