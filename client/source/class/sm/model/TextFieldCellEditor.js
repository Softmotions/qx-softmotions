/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.model.TextFieldCellEditor", {
      extend  : qx.ui.table.celleditor.TextField,

      construct : function() {
          this.base(arguments);
      },

      members :
      {

          //overriden
          getCellEditorValue : function(cellEditor) {
              var val = this.base(arguments, cellEditor);
              if (typeof cellEditor.originalValue == "number") {
                  if (isNaN(val)) {
                      val = 0;
                  }
              }
              return val;
          }
      }
  });