/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.model.RemoteVirtualTableModel", {
    extend : qx.ui.table.model.Remote,


    events : {
        /**
         *  Fired if current viewSpec changed
         */
        viewSpecChanged : "qx.event.type.Data",


        /**
         * Fired if rows data loaded
         */
        "rowsDataLoaded": "qx.event.type.Event"
    },

    properties : {
        /**
         * Row count request url name
         */
        rowcountUrl : {
            check : "String",
            init : null
        },

        /**
         * Row data request url name
         */
        rowdataUrl : {
            check : "String",
            init : null
        },


        rowdataFn : {
            check : "Function",
            init : null,
            apply : ""
        },

        rowcountFn : {
            check : "Function",
            init : null
        },

        /**
         * Columns metainfo
         */
        columnsMeta : {
            check : "Object",
            init : {}
        },

        /**
         * List of included columns
         */
        useColumns : {
            nullable : false,
            apply : "_applyUseColumns"
        }
    },


    construct : function(colsMeta, useCols) {
        this.base(arguments);

        qx.core.Assert.assertMap(colsMeta, "colsMeta constructor argument must be specified");
        this.setColumnsMeta(colsMeta);

        if (useCols) {
            this.setUseColumns(useCols);
        }

        this.addListener("metaDataChanged", function() {
            if (this.__vspec) {
                this.__vspec.sortInd = this.getSortColumnIndex();
                this.__vspec.sortCol = this.getColumnId(this.__vspec.sortInd);
                this.__vspec.isAsc = this.isSortAscending();
                if (this.hasListener("viewSpecChanged")) {
                    this.fireDataEvent("viewSpecChanged", this.__vspec);
                }
            }
        }, this);
    },

    members : {
        /**
         * Current view spec
         */
        __vspec : null,

        __constVspec : null,

        __cleanup : false,


        getConstViewSpec : function() {
            return this.__constVspec;
        },

        setConstViewSpec : function(cvs, noupdate, table) {
            this.__constVspec = cvs;
            if (!noupdate) {
                this.updateViewSpec(cvs || {}, table);
            }
        },

        getViewSpec : function() {
            return this.__vspec;
        },

        setViewSpec : function(spec, table) {
            var nspec = {};
            if (this.__constVspec != null) {
                qx.Bootstrap.objectMergeWith(nspec, this.__constVspec, false);
            }
            if (spec != null) {
                qx.Bootstrap.objectMergeWith(nspec, spec, false);
            }
            this.__vspec = nspec;
            this.__vspec.sortInd = this.getSortColumnIndex();
            this.__vspec.sortCol = this.getColumnId(this.__vspec.sortInd);
            this.__vspec.isAsc = this.isSortAscending();
            this.reloadData(table);
            if (this.hasListener("viewSpecChanged")) {
                this.fireDataEvent("viewSpecChanged", this.__vspec);
            }
        },

        updateViewSpec : function(spec, table) {
            qx.core.Assert.assertMap(spec);
            var nspec = {};
            if (this.__constVspec != null) {
                qx.Bootstrap.objectMergeWith(nspec, this.__constVspec, false);
            }
            this.__vspec = this.__vspec || {};
            qx.Bootstrap.objectMergeWith(this.__vspec, spec, true);
            qx.Bootstrap.objectMergeWith(nspec, this.__vspec, false);
            this.__vspec = nspec;
            this.__vspec.sortInd = this.getSortColumnIndex();
            this.__vspec.sortCol = this.getColumnId(this.__vspec.sortInd);
            this.__vspec.isAsc = this.isSortAscending();
            this.reloadData(table);
            if (this.hasListener("viewSpecChanged")) {
                this.fireDataEvent("viewSpecChanged", this.__vspec);
            }
        },

        /**
         * Extended reload data function.
         * If table is defined and resetSelection is true - call reset selection on table after `rowsDataLoaded` event
         *
         * @param table {Object}
         * @param resetSelection {Boolean?true}
         */
        reloadData : function (table, resetSelection) {
            this.base(arguments);
            resetSelection = (resetSelection === undefined) ? true : resetSelection;
            if (table !== undefined && resetSelection) {
                table.getTableModel().addListenerOnce("rowsDataLoaded", table.getSelectionModel().resetSelection);
            }
        },

        /**
         * Update a cached table rows with data produced
         * by `filterFun` function.
         * This function accepts (ind, rowdata)  arguments.
         * If `filterFun` returns not nullable value it will be used to override
         * the corresponding data model attached to the row and table column values
         * will be updated accourdingly.
         *
         * @param filterFun {Function} Filter function, signature: (ind, rowdata)
         * @param self {Object?null} This object for the filter function/
         */
        updateCachedRows : function(filterFun, self) {
            this.iterateCachedRows(function(ind, rowdata) {
                var res = filterFun.call(self, ind, rowdata);
                if (res != null) {
                    qx.Bootstrap.objectMergeWith(rowdata, res, true);
                    Object.keys(res).forEach(function(k) {
                        var cind = this.getColumnIndexById(k);
                        if (cind != null) {
                            this.setValue(cind, ind, res[k]);
                        }
                    }, this);
                    return rowdata;
                }
            }, this);
        },

        cleanup : function() {
            this.__cleanup = true;
            try {
                this.reloadData();
            } finally {
                this.__cleanup = false;
            }
        },

        _checkIncludedColumns : function(val) {
            if (!qx.lang.Type.isArray(val)) {
                return false;
            }
            var cmeta = this.getColumnsMeta();
            for (var i = 0; i < val.length; ++i) {
                if (cmeta[val[i]] === undefined) {
                    return false;
                }
            }
            return true;
        },

        _applyUseColumns : function(cols) {
            qx.core.Assert.assertTrue(this._checkIncludedColumns(cols), "Invalid 'useColumns' property value");
            var cmeta = this.getColumnsMeta();
            var labels = [];
            var ids = [];
            for (var i = 0; i < cols.length; ++i) {
                ids.push(cols[i]);
                var c = cmeta[cols[i]];
                labels.push((typeof c["title"] === "string") ? c["title"] : String(c));
            }
            this.setColumns(labels, ids);
        },


        _buildViewSpecRequest : function(url) {
            if (url == null || !qx.lang.Type.isObject(this.__vspec)) {
                return null;
            }
            var req = new sm.io.Request(url, "GET", "application/json");
            for (var k in this.__vspec) {
                if (k === "sortInd" || k === "isAsc") {
                    continue;
                }
                if (this.__vspec[k] != null) {
                    req.setParameter(k, this.__vspec[k], false);
                }
            }
            var sind = this.__vspec["sortInd"];
            if (sind != -1 &&
                    (this.__vspec["sortAsc"] == null && this.__vspec["sortDesc"] == null)) {
                var columnId = this.getColumnId(sind);
                if (this.__vspec["isAsc"]) {
                    req.setParameter("sortAsc", columnId)
                } else {
                    req.setParameter("sortDesc", columnId);
                }
            }
            return req;
        },

        _loadRowCount : function() {
            if (this.__vspec == null) {
                this._onRowCountLoaded(0);
                return;
            }
            if (this.getRowcountUrl() != null) {
                return this._loadRowCountUrl();
            } else if (this.getRowcountFn() != null) {
                return this.getRowcountFn().call(this);
            } else {
                var msg = "You must set either 'rowcountUrl' or 'rowcountFn' model properties";
                qx.log.Logger.error(msg);
                throw new Error(msg);
            }
        },

        _loadRowData : function(firstRow, lastRow) {
            if (this.getRowdataUrl() != null) {
                return this._loadRowDataUrl(firstRow, lastRow);
            } else if (this.getRowdataFn() != null) {
                return this.getRowdataFn().call(this, firstRow, lastRow);
            } else {
                var msg = "You must set either 'rowdataUrl' or 'rowdataFn' model properties";
                qx.log.Logger.error(msg);
                throw new Error(msg);
            }
        },


        // overriden - called whenever the table requests the row count
        _loadRowCountUrl : function() {
            if (this.__cleanup == true) {
                this._onRowCountLoaded(0);
                this.fireEvent("rowsDataLoaded");
                return;
            }
            var req = this._buildViewSpecRequest(this.getRowcountUrl());
            if (!req) {
                return 0;
            }
            var rc = 0;
            req.addListener("finished", function() {
                this._onRowCountLoaded(rc);
                if (rc == 0) {
                    this.fireEvent("rowsDataLoaded");
                }
            }, this);
            req.send(function(resp) {
                rc = resp.getContent();
                if (isNaN(rc)) {
                    rc = 0;
                }
            });
        },

        // overriden
        _loadRowDataUrl : function(firstRow, lastRow) {
            if (this.__cleanup == true) {
                this._onRowDataLoaded([]);
                this.fireEvent("rowsDataLoaded");
                return;
            }
            var req = this._buildViewSpecRequest(this.getRowdataUrl());
            if (!req) {
                return;
            }
            req.setParameter("firstRow", firstRow);
            req.setParameter("lastRow", lastRow);
            req.send(function(resp) {
                var rarr = resp.getContent();
                qx.core.Assert.assertArray(rarr);
                this._onRowDataLoaded(rarr);
                this.fireEvent("rowsDataLoaded");
            }, this);
        }
    }
});

