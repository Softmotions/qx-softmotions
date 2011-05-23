/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Улучшенная qooxdoo таблица
 */

qx.Class.define("sm.table.Table", {
      extend  : qx.ui.table.Table,

      construct : function(tableModel, custom) {
          this.base(arguments, tableModel, custom);
      },

      members : {
          __preventEditNextLine : null,

          setPreventEditNextLine : function(val) {
              this.__preventEditNextLine = val;
          },

          _onKeyPress : function(evt) {
              var identifier = evt.getKeyIdentifier();
              if (this.__preventEditNextLine && this.isEditing() && evt.getModifiers() == 0 && 'Enter' == identifier) {
                  this.stopEditing();
                  return;
              }

              this.base(arguments, evt);
          },

          getRowData : function(ind) {
              if (ind < 0) {
                  return null;
              }
              return this.getTableModel().getRowAssociatedData(ind);
          },

          getSelectedRowData : function() {
              return this.getRowData(this.getSelectionModel().getAnchorSelectionIndex());
          }
      }
  });