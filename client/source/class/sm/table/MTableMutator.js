/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */


/**
 * Mutates qx.ui.table.model.Simple table data,
 * Owner class must have:
 *
 * getTableModel(),
 * getSelectionModel()
 *
 * methods
 */
qx.Mixin.define("sm.table.MTableMutator", {

      members :
      {

          addRow : function(rowData, rowSpec, dataSpec) {
              var tm = this.getTableModel();
              var data = tm.getData();
              var found = false;
              for (var i = 0; i < data.length; ++i) {
                  var di = data[i];
                  if ((typeof rowData) == "function") {
                      if (rowData(di.rowData) == true) {
                          found = true;
                          data[i] = qx.lang.Array.clone(rowSpec);
                          data[i].rowData = dataSpec != null ? dataSpec : di.rowData;
                          break;
                      }
                  } else {
                      if (di.rowData == rowData) {
                          found = true;
                          data[i] = qx.lang.Array.clone(rowSpec);
                          data[i].rowData = dataSpec != null ? dataSpec : di.rowData;
                          break;
                      }
                  }
              }
              if (!found) {
                  var di = qx.lang.Array.clone(rowSpec);
                  di.rowData = ((dataSpec != null || (typeof rowData) == "function") ? dataSpec : rowData);
                  data.push(di);
              }
              tm.setData(data);
          },

          removeRow : function(rowData) {
              var tm = this.getTableModel();
              var data = tm.getData();
              var ind = -1;
              for (var i = 0; i < data.length; ++i) {
                  var di = data[i];
                  if ((typeof rowData) == "function") {
                      if (rowData(di.rowData) == true) {
                          ind = i;
                          break;
                      }
                  } else {
                      if (di.rowData == rowData) {
                          ind = i;
                          break;
                      }
                  }
              }
              this.removeRowByIndex(ind);
          },

          removeRowByIndex : function(ind) {
              var tm = this.getTableModel();
              tm.removeRows(ind, 1);
          },

          moveRow : function(rowData, direction, moveSelection) {
              if (direction != -1 && direction != 1) {
                  throw new Error("Direction argument must be either: -1 or 1");
              }
              var tm = this.getTableModel();
              var data = tm.getData();
              var ind = -1;
              for (var i = 0; i < data.length; ++i) {
                  if ((typeof rowData) == "function") {
                      if (rowData(data[i].rowData) == true) {
                          ind = i;
                          break;
                      }
                  } else {
                      if (data[i].rowData == rowData) {
                          ind = i;
                          break;
                      }
                  }
              }
              this.moveRowByIndex(ind, direction, moveSelection);
          },

          moveRowByIndex : function(ind, direction, moveSelection) {
              if (direction != -1 && direction != 1) {
                  throw new Error("Direction argument must be either: -1 or 1");
              }
              var tm = this.getTableModel();
              var data = tm.getData();
              //trivial case
              if (ind == null || ind == -1) {
                  return;
              }
              //trivial case
              if (direction == 1 && ind == data.length - 1) {
                  return;
              }
              //trivial case
              if (direction == -1 && ind == 0) {
                  return;
              }
              var tmp = data[ind + direction];
              data[ind + direction] = data[ind];
              data[ind] = tmp;
              tm.setData(data);

              if (moveSelection) {
                  var sm = this.getSelectionModel();
                  sm.setSelectionInterval(ind + direction, ind + direction);
              }
          }
      }
  });

