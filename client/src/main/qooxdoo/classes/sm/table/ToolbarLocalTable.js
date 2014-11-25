/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.table.ToolbarLocalTable", {
    extend : sm.table.ToolbarTable,


    construct : function() {
        this.base(arguments);

    },

    members : {

        removeSelected : function() {
            var tm = this._table.getTableModel();
            if (tm == null) {
                return;
            }
            var data = tm.getData();
            var sel = [];
            this._table.getSelectionModel().iterateSelection(function(ind) {
                if (data[ind] != null) {
                    sel.push(data[ind]);
                }
            });
            var ndata = tm.getData().filter(function(item) {
                return (sel.indexOf(item) === -1);
            });
            tm.setData(ndata);
        },


        //overriden
        _createTableModel : function() {
            return new sm.model.JsonTableModel();
        },

        //overriden
        _reload : function(data) {
            var tm = null;
            if (this._table == null) {
                tm = this._createTableModel();
                this._setJsonTableData(tm, data);
                this._table = this._createTable(tm);
                this.add(this._table, {flex : 1})
            } else {
                tm = this._table.getTableModel();
                if (this._table.isEditing()) {
                    this._table.stopEditing();
                }
                this._table.getSelectionModel().resetSelection();
                this._setJsonTableData(tm, data);
            }
        },

        _setJsonTableData : function(tm, data) {
            throw new Error("Abstract method call");
        }

    }

});

