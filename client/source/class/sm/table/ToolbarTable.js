/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 * Таблица + тулбар
 */
qx.Class.define("sm.table.ToolbarTable", {
    extend  : qx.ui.container.Composite,
    type : "abstract",

    events :
    {
    },

    properties :
    {

        appearance :
        {
            refine : true,
            init   : "toolbar-table"
        }
    },

    construct : function() {
        this.base(arguments);
        var layout = new qx.ui.layout.VBox();
        this.setLayout(layout);
        this.getChildControl("toolbar");
    },

    members :
    {
        _table  : null,

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
            return this.getRowData(this.getTable().getSelectionModel().getAnchorSelectionIndex());
        },

        getSelectedRowIndex : function() {
            return this.getTable().getSelectionModel().getAnchorSelectionIndex();
        },

        /**
         * Возвращает значение ячейки по номеру столбца в выбранной строке
         */
        getSelectedRowCellValue : function(colInd) {
            return this.getRowCellValue(colInd, this.getTable().getSelectionModel().getAnchorSelectionIndex());
        },

        /**
         * Возвращает произвольные данные ассоциированные со строкой
         * таблицы по указанному индексу
         *
         * @param ind {int}
         */
        getRowData : function(ind) {
            if (ind < 0) {
                return null;
            }
            return this.getTable().getTableModel().getRowAssociatedData(ind);
        },

        /**
         * Возвращает значение ячейки по номеру столбца и строки
         */
        getRowCellValue : function(colInd, rowInd) {
            if (colInd < 0 || rowInd < 0) {
                return null;
            }
            return this.getTable().getTableModel().getValue(colInd, rowInd);
        },

        /**
         * Создаем запрос для загрузки таблица
         */
        _createRequest : function() {
            return null;
        },

        /**
         * Перезагружаем содержимое таблицы
         */
        _reload : function() {
            var req = this._createRequest();
            if (this._table == null) {
                var tm = this._createTableModel();
                if (req) {
                    tm.setRequest(req);
                }
                this._table = this._createTable(tm);
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
         * @param tableModel
         */
        _createTable : function(tableModel) {
            return new sm.table.Table(tableModel, tableModel.getCustom());
        },

        /**
         * Создание кнопки на тулбаре
         * @param mainPart {qx.ui.toolbar.ToolBar}
         */
        _createToolbarItems : function(toolbar) {
            throw new Error("Abstract method call");
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
