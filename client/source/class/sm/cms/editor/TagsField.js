/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Tags field.
 * Rendered as simple text field, but value is a array.
 * Tags devided by /[,;]/.
 */
qx.Class.define("sm.cms.editor.TagsField", {
      extend : qx.ui.form.TextField,

      construct : function(options) {
          this.base(arguments);
          options = options || {};
          this._maxCount = options["maxCount"] || 10;
          this._maxLength = options["maxLength"] || 15;
          this._default = options["default"];
          if (options["placeholder"]) {
              this.setPlaceholder(options["placeholder"]);
          }
      },

      members :
      {

          _default : null,
          _maxCount : null,
          _maxLength : null,

          // overridden
          setValue : function(value) {
              if (value == null || value == "" || value.length == 0) {
                  value = this._default;
              }
              if (qx.lang.Type.isString(value)) {
                  this.base(arguments, value);
              } else if (qx.lang.Type.isArray(value)) {
                  this.base(arguments, value.join("; "));
              }
          },

          // overridden
          getValue : function() {
              var value = this.base(arguments) || "";
              var cache = {};
              var result = [];
              var items = value.split(/[,;]/);
              for (var i = 0; i < items.length; ++i) {
                  var item = items[i].trim();
                  if (item != "" && !cache[item]) {
                      result.push(item);
                      cache[item] = true;
                  }
              }
              return result;
          },

          getValidator : function() {
              var me = this;
              return function(value, formItem) {
                  if (value.length > me._maxCount) {
                      throw new qx.core.ValidationError("Validation Error", me.tr("Первышенно максимальное количество элементов: ") + me._maxCount);
                  }
                  for (var i = 0; i < value.length; ++i) {
                      if (value[i].length > me._maxLength) {
                          throw new qx.core.ValidationError("Validation Error", me.tr("Первышенна максимальная длина элемента: ") + me._maxLength);
                      }
                  }
                  return true;
              };
          }
      },

      destruct : function() {
          this._maxCount = this._maxLength = this._default = null;
      }
  });

