/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Улучшенная qooxdoo таблица
 */

qx.Class.define("sm.table.Table", {
    extend : qx.ui.table.Table,

    /**
     * @param useContentMenu {Boolean}  deprecated!
     */
    construct : function(tableModel, custom, useContentMenu) {
        if (useContentMenu) {  //deprecated
            qx.log.Logger.error("Using of 'useContentMenu' argument in 'sm.table.Table' is deprecated! Stack: " +
                    qx.dev.StackTrace.getStackTrace().join("\n"));
            qx.Class.include(qx.ui.table.Table, qx.ui.table.MTableContextMenu);
        }
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

        /**
         * Swap keyboard focus to table with auto selection focused or first row
         */
        handleFocus : function() {
            if (this.getTableModel().getRowCount() > 0) {
                var focusedCol = this.getFocusedColumn() == null ? 0 : this.getFocusedColumn();
                var focusedRow = this.getFocusedRow() == null ? 0 : this.getFocusedRow();
                this.setFocusedCell(focusedCol, focusedRow, true);
                this.getSelectionModel().setSelectionInterval(focusedRow, focusedRow);
                this.focus();
            }
        },

        resetSelection : function() {
            this.resetCellFocus();
            this.getSelectionModel().resetSelection();
        },

        /**
         * Associated rowData via JsonTableModel
         * @param ind {Integer}
         */
        getRowData : function(ind) {
            return ind < 0 ? null : this.getTableModel().getRowAssociatedData(ind);
        },

        getSelectedRowData : function() {
            return this.getRowData(this.getSelectionModel().getAnchorSelectionIndex());
        },


        /**
         * Row data as getTableModel().getRowData(ind);
         */
        getRowData2 : function(ind) {
            return ind < 0 ? null : this.getTableModel().getRowData(ind);
        },

        /**
         * Fist selected row data as getTableModel().getRowData(ind) at first anchor selection index
         */
        getSelectedRowData2 : function() {
            return this.getRowData2(this.getSelectionModel().getAnchorSelectionIndex());
        },

        updateRowStyles : function(onlyRow) {
            var scrollerArr = this._getPaneScrollerArr();
            for (var i = 0; i < scrollerArr.length; i++) {
                scrollerArr[i].getTablePane()._updateRowStyles(onlyRow);
            }
        },

        selectSingleRow : function(ind) {
            var rc = this.getTableModel().getRowCount();
            if (ind >= 0 && ind < rc) {
                this.getSelectionModel().setSelectionInterval(ind, ind);
            }
        },

        /**
         * Get selection ranges
         */
        getSelectionRanges : function() {
            var sranges = [];
            var lastInd = -1;
            var sr = null;
            this.getSelectionModel().iterateSelection(function(ind) {
                if (lastInd + 1 != ind && sr) {
                    sranges.push(sr);
                    sr = null;
                }
                if (!sr) {
                    sr = [];
                    sr[0] = ind;
                }
                sr[1] = ind;
                lastInd = ind;
            }, this);

            if (sr) {
                sranges.push(sr);
            }

            return sranges;
        }


        //paneUpdated

    }
});