/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.table.renderer.DateTimeCellRenderer", {
      extend : qx.ui.table.cellrenderer.Default,

      construct : function() {
          this.base(arguments);
          this.setUseAutoAlign(false);
      },

      members :
      {

          // overridden
          _formatValue : function(cellInfo) {
              if (cellInfo.value != null && (typeof cellInfo.value == "number")) {
                  return qx.util.format.DateFormat.getDateTimeInstance().format(new Date(cellInfo.value));
              }
              return this.base(arguments, cellInfo);
          }

      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });

