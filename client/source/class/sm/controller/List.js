/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Расширенный контроллер списка,
 * учитывать в модели данных выбранные (selected) элементы
 */

qx.Class.define("sm.controller.List", {
      extend  : qx.data.controller.List,

      properties :
      {
          selectPath :
          {
              check: "String",
              /*apply: "_applyLabelPath",*/
              nullable: true
          }
      },

      construct : function(model, target, labelPath, selectPath) {
          this.base(arguments, model, target, labelPath);
          if (selectPath != null) {
              this.setSelectPath(selectPath);
          }
      },



      members :
      {
          _applyModel: function(value, old) {
              this.base(arguments, value, old);
              var spath = this.getSelectPath();
              var model = this.getModel();
              if (spath == null || model == null) {
                  return;
              }
              model.forEach(function(m) {
                  if (m.getSelected && m.getSelected() == true) {
                      this.getSelection().push(m);
                  }
              }, this);
          }
      }
  });