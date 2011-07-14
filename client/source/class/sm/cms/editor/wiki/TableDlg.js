/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.editor.wiki.TableDlg", {
    extend  : qx.ui.window.Window,

    events :
    {
        /**
         * Fired if insert table button clicked
         * data: [{@link qx.ui.table.model.Simple Table model}, isWide] of current table
         */
        "insertTable" : "qx.event.type.Data"
    },

    properties :
    {
    },

    construct : function() {
        this.base(arguments, this.tr("Вставить таблицу"));
        this.setLayout(new qx.ui.layout.Dock(5, 5));
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 520,
            height : 460
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        var header = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({alignY : "middle"}));
        this.__spCols = new qx.ui.form.Spinner(1, 2, 10);
        this.__spCols.addListener("changeValue", this._setupTable, this);
        this.__spRows = new qx.ui.form.Spinner(1, 2, 100);
        this.__spRows.addListener("changeValue", this._setupTable, this);

        header.add(new qx.ui.basic.Label("Столбцов"));
        header.add(this.__spCols);
        header.add(new qx.ui.basic.Label("Строк"));
        header.add(this.__spRows);
        this.add(header, {edge : "north"});

        this._setupTable();

        var footer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({alignX : "right"}));
        var ok = new qx.ui.form.Button(this.tr("Вставить таблицу"));
        ok.addListener("execute", function(ev) {
            this.fireDataEvent("insertTable", [this.__table.getTableModel(), wideCb.getValue()]);
        }, this);
        var cancel = new qx.ui.form.Button(this.tr("Отменить"));
        cancel.addListener("execute", function(ev) {
            this.close();
        }, this);

        footer.add(ok);
        footer.add(cancel);
        this.add(footer, {edge : "south"});

        var wideCb = new qx.ui.form.CheckBox(this.tr("Широкая таблица"));
        wideCb.setValue(true);
        this.add(wideCb, {edge : "south"});


        this.addListenerOnce("resize", function() {
            this.center();
        }, this);
    },

    members :
    {
        __spCols : null,

        __spRows : null,

        __table : null,

        __closeCmd : null,

        _setupTable : function() {

            var oldTable = this.__table;
            var oldTm = oldTable ? oldTable.getTableModel() : null;

            var tm = new qx.ui.table.model.Simple();
            var cols = [];
            var nCols = this.__spCols.getValue();
            for (var i = 0; i < nCols; ++i) {
                cols.push(new String(i + 1));
            }
            tm.setColumns(cols);
            for (var i = 0; i < nCols; ++i) {
                tm.setColumnEditable(i, true);
            }
            var rowData = [];
            var nRows = this.__spRows.getValue();
            for (var i = 0; i < nRows; ++i) {
                var oldRow = oldTm ? oldTm.getRowData(i) : null;
                var row = [];
                for (var j = 0; j < nCols; ++j) {
                    row[j] = ((oldRow && oldRow[j] != null) ? oldRow[j] : "");
                }
                rowData.push(row);
            }
            tm.setData(rowData);

            if (oldTm == null || oldTm.getColumnCount() != cols.length) { //new or changed columns count
                //Replace table if cells changed
                this.__table = new qx.ui.table.Table(tm);
                if (oldTable) {
                    this.remove(oldTable);
                }
                this.add(this.__table, {edge : "center"});
                if (oldTable) {
                    oldTable.dispose();
                }
            } else {
                this.__table.setTableModel(tm);
            }

            //todo небольшие глюки cell renderer
            var hrend = new sm.cms.editor.wiki.TableDlgCRenderer();
            for (var i = 0; i < nCols; ++i) {
                tm.setColumnSortable(i, false);
                this.__table.getTableColumnModel().setDataCellRenderer(i, hrend);
            }
        },

        open : function() {
            this.base(arguments);
        },

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__currentPage = null;
            this._disposeObjects("__closeCmd", "__table");
        },

        close : function() {
            this.base(arguments);
            this.__dispose();
        }

    },

    destruct : function() {
        this.__dispose();
        //this._disposeObjects("__field_name");
    }
});