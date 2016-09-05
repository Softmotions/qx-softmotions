/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 Модель для загрузки json форматированных данных
 в таблицу.

 Пример данных:
 {
 "title" : "группа 8722",
 "columns" : [
 {"title" : "№", "id" : "number", "width" : 35, "flex" : 0, "sortable" : false},
 {"title" : "ФИО", "id" : "fio", "width" : "4*"},
 {"title" : "Email", "id" : "email",  "width" : "3*"},
 {"title" : "Телефон", "id" : "phone", "width" : "1*"},
 {"title" : "Примечание", "id" : "note", "width" : "2*", "visible" : false}],
 "items" : [
 [[1, "Адаманский Антон Валентинович",  "adamansky@gmail.com", "336-44-01", ""], <ассоциированные со строкой данные>],
 [[2, "Акулова Наталья Владимировна",  "", "", ""],  <ассоциированные со строкой данные>],
 ]}
 */

qx.Class.define("sm.model.JsonTableModel", {
    extend: qx.ui.table.model.Simple,

    construct: function () {
        this.base(arguments);
        this._columnsInitiated = false;
    },

    properties: {
        /**
         * Whether to clear sorting on reload
         */
        clearSortingOnReload: {
            check: "Boolean",
            init: true
        }
    },

    members: {

        _columnsInitiated: false,

        __custom: null,

        reset: function () {
            this._columnsInitiated = false;
            this.__custom = null;
        },

        setJsonData: function (data) {
            this._applyJsonData(data);
        },

        _applyJsonData: function (data) {
            if (data == null) {
                qx.log.Logger.warn(this, "No data found in json model");
                return;
            }
            var colsSpec = null;
            if (this._columnsInitiated == false) {
                colsSpec = data["columns"];
                if (!colsSpec || !Array.isArray(colsSpec)) {
                    qx.log.Logger.warn(this, "No columns found or invalid columns type in json data");
                    return;
                }
                var columns = [];
                var columnsData = [];
                for (var i = 0; i < colsSpec.length; ++i) {
                    var cs = colsSpec[i];
                    columns[i] = cs["title"];
                    columnsData[i] = cs["id"] ? cs["id"] : String(i);
                }
                this.setColumns(columns, columnsData);
                var tcm = new sm.model.JsonTableColumnModel(colsSpec);
                this.__custom = {
                    tableColumnModel: function (obj) {
                        return tcm;
                    }
                };
                this._columnsInitiated = true;
            }

            var items = data["items"];
            if (!items || !Array.isArray(items)) {
                qx.log.Logger.warn(this, "No data found or invalid columns type in json data");
                return;
            }
            var ditems = new Array(items.length);
            for (var i = 0; i < items.length; ++i) {
                var rData = null;
                var rArr = items[i];
                if (rArr.length == 2 && Array.isArray(rArr[0])) {
                    rData = rArr[1];
                    rArr = rArr[0];
                }
                ditems[i] = rArr;
                ditems[i].rowData = rData;
            }
            this.setData(ditems, this.getClearSortingOnReload());
        },

        getRowAssociatedData: function (rowIndex) {
            var data = this.getData();
            var row = data[rowIndex];
            return (row != null && row.rowData != undefined) ? row.rowData : null;
        },

        getCustom: function () {
            return this.__custom;
        }
    },

    destruct: function () {
        this.__custom = null;
    }
});