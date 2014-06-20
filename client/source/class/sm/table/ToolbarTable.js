/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 * Таблица + тулбар
 */
qx.Class.define("sm.table.ToolbarTable", {
    extend : qx.ui.container.Composite,
    type : "abstract",

    events : {

        /**
         * Fired when inner table instance initialized
         */
        "tableInitialized" : "qx.event.type.Event"
    },

    properties : {

        appearance : {
            refine : true,
            init : "toolbar-table"
        }
    },

    construct : function() {
        this.base(arguments);
        var layout = new qx.ui.layout.VBox();
        this.setLayout(layout);
        this._initPrecedingWidgets();
        this.getChildControl("toolbar");
    },

    members : {
        _table : null,

        getTable : function() {
            return this._table;
        },

        getTableModel : function() {
            return this.getTable().getTableModel();
        },

        getSelectionModel : function() {
            return this.getTable().getSelectionModel();
        },

        /**
         * Возвращает произвольные данные ассоциированные с выбранной строкой
         * таблицы
         */
        getSelectedRowData : function() {
            var t = this.getTable();
            return t != null ? this.getRowData(this.getTable().getSelectionModel().getAnchorSelectionIndex()) : null;
        },

        getSelectedRowIndex : function() {
            var t = this.getTable();
            return t != null ? t.getSelectionModel().getAnchorSelectionIndex() : -1;
        },

        getRowCount : function() {
            return this.getTableModel().getRowCount();
        },

        /**
         * Возвращает значение ячейки по номеру столбца в выбранной строке
         */
        getSelectedRowCellValue : function(colInd) {
            var t = this.getTable();
            return t != null ? this.getCellValue(this.getTable().getSelectionModel().getAnchorSelectionIndex(), colInd) : null;
        },

        /**
         * Возвращает произвольные данные ассоциированные со строкой
         * таблицы по указанному индексу
         *
         * @param ind {int}
         */
        getRowData : function(ind) {
            if (ind < 0 || this.getTable() == null) {
                return null;
            }
            return this.getTable().getTableModel().getRowAssociatedData(ind);
        },

        /**
         * Возвращает значение ячейки по номеру столбца и строки
         * @deprecated
         */
        getRowCellValue : function(colInd, rowInd) {
            if (colInd < 0 || rowInd < 0 || this.getTable() == null) {
                return null;
            }
            return this.getTable().getTableModel().getValue(colInd, rowInd);
        },

        getCellValue : function(rowIndex, columnIndex) {
            return this.getTable().getTableModel().getValue(columnIndex, rowIndex);
        },


        setCellValue : function(rowIndex, columnIndex, value) {
            this.getTable().getTableModel().setValue(columnIndex, rowIndex, value);
        },

        /**
         * Get selection ranges
         */
        getSelectionRanges : function() {
            var t = this.getTable();
            return t != null ? t.getSelectionRanges() : [];
        },

        /**
         * Создаем запрос для загрузки таблица
         */
        _createRequest : function(data) {
            return null;
        },

        /**
         * Для наследников имеется возможность
         * добавления дополнительных
         * widget-ов перед toolbar элементом и таблицей
         */
        _initPrecedingWidgets : function() {

        },

        /**
         * Перезагружаем содержимое таблицы
         */
        _reload : function(data) {
            var req = this._createRequest(data);
            if (this._table == null) {
                var tm = this._createTableModel();
                if (req) {
                    tm.setRequest(req);
                }
                this._table = this._createTable(tm);
                this.fireEvent("tableInitialized");
                this.add(this._table, {flex : 1})
            } else {
                if (this._table.isEditing()) {
                    this._table.stopEditing();
                }
                this._table.getSelectionModel().resetSelection();
                if (req) {
                    var tm = this._table.getTableModel();
                    tm.setRequest(req);
                }
            }
        },

        /**
         * Создание экземпляра талицы как widget-та
         * @param tableModel {qx.ui.table.ITableModel ? null}
         */
        _createTable : function(tableModel) {
            return new sm.table.Table(tableModel, tableModel.getCustom());
        },

        /**
         * Создание кнопки на тулбаре
         * @param toolbar {qx.ui.toolbar.ToolBar}
         */
        _createToolbarItems : function(toolbar) {
            return toolbar;
        },

        _createTableModel : function() {
            return new sm.model.JsonRequestTableModel();
        },

        _createChildControlImpl : function(id) {
            var control;
            switch (id) {
                case "toolbar":
                    control = new qx.ui.toolbar.ToolBar();
                    this._createToolbarItems(control);
                    this.add(control);
                    break;
            }
            return control || this.base(arguments, id);
        }
    },

    destruct : function() {
        this._disposeObjects("_table");
    }
});
