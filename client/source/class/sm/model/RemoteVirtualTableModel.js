/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.model.RemoteVirtualTableModel", {
    extend : qx.ui.table.model.Remote,


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
        },

        /**
         * View specification
         */
        viewSpec : {
            check : "Object",
            nullable : true,
            init : null,
            apply : "_applyViewSpec"
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
                this.__vspec.isAsc = this.isSortAscending();
            }
        }, this);
    },

    members : {
        /**
         * Current view spec
         */
        __vspec : null,

        __cleanup : false,

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
                labels.push(cmeta[cols[i]]);
            }
            this.setColumns(labels, ids);
        },

        _applyViewSpec : function(spec) {
            if (spec == null) {
                this.__vspec = null;
                return;
            }
            this.__vspec = spec;
            this.__vspec.sortInd = this.getSortColumnIndex();
            this.__vspec.isAsc = this.isSortAscending();
            this.reloadData();
        },

        updateViewSpec : function(spec) {
            qx.core.Assert.assertMap(spec);
            if (this.__vspec) {
                qx.lang.Object.mergeWith(this.__vspec, spec, true);
            } else {
                this.__vspec = spec;
            }
            this.__vspec.sortInd = this.getSortColumnIndex();
            this.__vspec.isAsc = this.isSortAscending();
            this.reloadData();
        },

        __buildViewSpecRequest : function(url) {
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
            if (sind != -1) {
                var columnId = this.getColumnId(sind);
                if (this.__vspec["isAsc"]) {
                    req.setParameter("sortAsc", columnId)
                } else {
                    req.setParameter("sortDesc", columnId);
                }
            }
            return req;
        },

        cleanup : function() {
            this.__cleanup = true;
            try {
                this.reloadData();
            } finally {
                this.__cleanup = false;
            }
        },

        // overriden - called whenever the table requests the row count
        _loadRowCount : function() {
            if (this.__cleanup == true) {
                this._onRowCountLoaded(0);
                return;
            }
            var req = this.__buildViewSpecRequest(this.getRowcountUrl());
            if (!req) {
                return 0;
            }
            var rc = 0;
            req.addListener("finished", function() {
                this._onRowCountLoaded(rc);
            }, this);
            req.send(function(resp) {
                rc = resp.getContent();
                if (isNaN(rc)) {
                    rc = 0;
                }
            });
        },

        // overriden
        _loadRowData : function(firstRow, lastRow) {
            if (this.__cleanup == true) {
                this._onRowDataLoaded([]);
                return;
            }
            var req = this.__buildViewSpecRequest(this.getRowdataUrl());
            if (!req) {
                return;
            }
            req.setParameter("firstRow", firstRow);
            req.setParameter("lastRow", lastRow);
            req.send(function(resp) {
                var rarr = resp.getContent();
                qx.core.Assert.assertArray(rarr);
                this._onRowDataLoaded(rarr);
            }, this);
        }
    }
});

