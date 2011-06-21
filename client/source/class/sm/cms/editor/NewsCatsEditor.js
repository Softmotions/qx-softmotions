/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * News options editor
 */
qx.Class.define("sm.cms.editor.NewsCatsEditor", {
      extend : sm.cms.editor.TagsField,

      construct : function(options) {
          if (!options["maxCount"] === undefined) {
              options["maxCount"] = 20;
          }
          if (options["maxLength"] === undefined) {
              options["maxLength"] = 20;
          }
          this.base(arguments, options);
      },

      members :
      {

          getValidator : function() {
              var me = this;
              return function(value, formItem) {
                  if (value.length > me._maxCount) {
                      throw new qx.core.ValidationError("Validation Error", me.tr("Первышенно максимальное количество категорий: ") + me.__maxCount);
                  }
                  for (var i = 0; i < value.length; ++i) {
                      if (value[i].length > me._maxLength) {
                          throw new qx.core.ValidationError("Validation Error", me.tr("Первышенна максимальная длина категорий: ") + me.__maxLength);
                      }
                  }
                  return true;
              };
          }
      }
  });