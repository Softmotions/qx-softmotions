/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Редактор баннера
 */
qx.Class.define("sm.cms.banners.BannersTable", {
    extend : sm.table.ToolbarLocalTable,
    include : [
        qx.ui.core.MChildrenHandling,
        sm.table.MTableMutator
    ],

    events :
    {
    },

    construct : function(options) {
        this.__options = options || {};
        this.__active_on_item = [];
        this.__banners = {};

        this.base(arguments);

        this._reload([]);

        this.set({allowGrowX : true, allowGrowY : false, height : 270});

        var table = this.getTable();

        table.addListener("dataEdited", this.__dataEdited, this);
        table.setContextMenuHandler(0, this.__bannersCtxMenuHandler, this);
        table.setContextMenuHandler(1, this.__bannersCtxMenuHandler, this);
        table.setContextMenuHandler(2, this.__bannersCtxMenuHandler, this);
        table.setContextMenuHandler(3, this.__bannersCtxMenuHandler, this);
        var caption = ", " + (this.__options.viewHidden ? this.tr("inactive are shown") : this.tr("inactive are hidden"));
        table.setAdditionalStatusBarText(caption);

        for (var i = 0; i < this.__active_on_item.length; ++i) {
            var item = this.__active_on_item[i];
            item.item.setEnabled(false);
        }
    },

    members : {
        __options : null,

        /**
         * List of widgets active on selected element
         */
        __active_on_item : null,

        getBanners: function() {
            return qx.lang.Object.getValues(this.__banners);
        },

        getBannersMap: function() {
            return this.__banners;
        },

        setBanners: function(banners) {
            this.__banners = {};
            for (var i = 0; i < banners.length; ++i) {
                var banner = banners[i];
                this.__banners[banner.id] = banner;
            }

            this.__refresh();
        },

        //overriden
        _createTable : function(tm) {
            var table = new sm.table.Table(tm, tm.getCustom());
            table.set({showCellFocusIndicator : false,
                statusBarVisible : true,
                focusCellOnMouseMove : false});

            var smodel = table.getSelectionModel();
            smodel.addListener("changeSelection", function(ev) {
                var scount = smodel.getSelectedCount();
                for (var i = 0; i < this.__active_on_item.length; ++i) {
                    var item = this.__active_on_item[i];
                    item.item.setEnabled(scount > 0 && (!item.checker || item.checker(this.getSelectedRowData())));
                }
            }, this);

            var cmodel = table.getTableColumnModel();

            // проверка описания
            var tce = new sm.model.TextFieldCellEditor();
            tce.getValidationFunction = function() {
                return function(value, oldValue) {
                    return value == null || value.length > 64 ? oldValue : value;
                }
            };

            cmodel.setCellEditorFactory(1, tce);

            // проверка веса
            tce = new sm.model.TextFieldCellEditor();
            tce.getValidationFunction = function() {
                return function(value, oldValue) {
                    return value == null || !value.match(/^\d+$/) || parseInt(value) < 0 ? oldValue : value;
                }
            };

            cmodel.setCellEditorFactory(2, tce);

            // календарик
            tce = new sm.model.CalendarCellEditor();
            cmodel.setCellEditorFactory(4, tce);
            cmodel.setDataCellRenderer(4, new qx.ui.table.cellrenderer.Date().set({
                dateFormat: new qx.util.format.DateFormat("dd.MM.yyyy")
            }));

            var rr = new sm.table.renderer.CustomRowRenderer();
            rr.setBgColorInterceptor(qx.lang.Function.bind(function(rowInfo) {
                var rdata = this.getRowData(rowInfo.row);
                if (rdata && this.__banners[rdata] && this.__banners[rdata].weight == 0) {
                    return "gray";
                } else {
                    return "white";
                }
            }, this));
            table.setDataRowRenderer(rr);

            return table;
        },

        //overriden
        _createToolbarItems: function(toolbar) {
            var me = this;
            var mainPart = new qx.ui.toolbar.Part();
            toolbar.add(mainPart);

            var caption = this.__options.viewHidden ? this.tr("Hide inactive") : this.tr("Show inactive");
            var shb = new qx.ui.toolbar.Button(caption);
            shb.addListener("execute", function(e) {
                this.__options.viewHidden = !this.__options.viewHidden;
                this.__refresh();
                caption = this.__options.viewHidden ? this.tr("Hide inactive") : this.tr("Show inactive");
                shb.setLabel(caption);
                caption = ", " + (this.__options.viewHidden ? this.tr("inactive are shown") : this.tr("inactive are hidden"));
                this.getTable().setAdditionalStatusBarText(caption);
            }, this);
            mainPart.add(shb);

            var mb = new qx.ui.toolbar.Separator();
            mainPart.add(mb);

            mb = new qx.ui.toolbar.Button(this.tr("Link"), "sm/cms/icon/16/wiki/link_add.png");
            mb.addListener("execute", function(e) {
                var bid = this.getSelectedRowData();
                if (!bid) {
                    return false;
                }
                this.__manageLink(bid);
            }, this);
            this.__active_on_item.push({item: mb});
            mainPart.add(mb);

            mb = new qx.ui.toolbar.Button(this.tr("Turn on"), "icon/16/actions/list-add.png");
            mb.addListener("execute", function(e) {
                var bid = this.getSelectedRowData();
                if (!bid) {
                    return false;
                }
                this.__banners[bid].weight = 1;
                this.__refresh();
            }, this);
            this.__active_on_item.push({item: mb, checker: function(bid) {
                return bid && me.__banners[bid].weight == 0;
            }});
            mainPart.add(mb);

            mb = new qx.ui.toolbar.Button(this.tr("Turn off"), "icon/16/actions/list-remove.png");
            mb.addListener("execute", function(e) {
                var bid = this.getSelectedRowData();
                if (!bid) {
                    return false;
                }
                this.__banners[bid].weight = 0;
                this.__refresh();
            }, this);
            this.__active_on_item.push({item: mb, checker: function(bid) {
                return bid && me.__banners[bid].weight != 0;
            }});
            mainPart.add(mb);

            return toolbar;
        },

        //overriden
        _setJsonTableData : function(tm, banners) {
            var data = {
                "title" : "",
                "columns" : [
                    {
                        "title" : this.tr("Name").toString(),
                        "id" : "name",
                        "sortable" : true,
                        "width" : "2*"
                    },
                    {
                        "title" : this.tr("Description").toString(),
                        "id" : "description",
                        "sortable" : true,
                        "width" : "5*",
                        "type" : "string",
                        "editable" : true
                    },
                    {
                        "title" : this.tr("Weight").toString(),
                        "id" : "weight",
                        "sortable" : true,
                        "width" : "1*",
                        "type" : "number",
                        "editable" : true
                    },
                    {
                        "title" : this.tr("Link").toString(),
                        "id" : "link",
                        "sortable" : true,
                        "width" : "5*"
                    },
                    {
                        "title" : this.tr("Termination date").toString(),
                        "id" : "enddate",
                        "sortable" : true,
                        "width" : "1*",
                        "editable" : true
                    }
                ],
                "items" : banners
            };
            tm.setJsonData(data);
        },

        /**
         * Refresh banner rows
         */
        __refresh: function() {
            var items = [];
            var banners = qx.lang.Object.getValues(this.__banners);
            for (var i = 0; i < banners.length; ++i) {
                var banner = banners[i];
                if (banner.weight > 0 || this.__options.viewHidden) {
                    items.push([
                        [banner.name, banner.description, banner.weight, banner.link, banner.enddate && new Date(banner.enddate)],
                        banner.id
                    ]);
                }
            }

            this._reload(items);
        },

        /**
         * Context menu
         */
        __bannersCtxMenuHandler : function(col, row, table, dataModel, contextMenu) {
            var bid = dataModel.getRowAssociatedData(row);
            if (!bid) {
                return false;
            }
            var bt;

            bt = new qx.ui.menu.Button(this.tr("Link"));
            bt.addListener("execute", function(ev) {
                this.__manageLink(bid);
            }, this);
            contextMenu.add(bt);

            if (this.__banners[bid].weight > 0) {
                bt = new qx.ui.menu.Button(this.tr("Turn off"));
                bt.addListener("execute", function(ev) {
                    this.__banners[bid].weight = 0;
                    this.__refresh();
                }, this);
            } else {
                bt = new qx.ui.menu.Button(this.tr("Turn on"));
                bt.addListener("execute", function(ev) {
                    this.__banners[bid].weight = 1;
                    this.__refresh();
                }, this);
            }
            contextMenu.add(bt);

            if (this.__banners[bid].enddate) {
                bt = new qx.ui.menu.Button(this.tr("Unset termination date"));
                bt.addListener("execute", function(ev) {
                    this.__banners[bid].enddate = 0;
                    this.__refresh();
                }, this);
                contextMenu.add(bt);
            }

            return true;
        },

        /**
         * Обработчик события об изменении данных в таблице
         */
        __dataEdited : function(ev) {
            var edata = ev.getData();
            var bid = this.getRowData(edata.row);
            if (edata.col == 1) {
                this.__banners[bid].description = edata.value;
            } else if (edata.col == 2) {
                this.__banners[bid].weight = parseInt(edata.value);
            } else if (edata.col == 4) {
                this.__banners[bid].enddate = +edata.value;
            }
        },

        __manageLink: function(bid) {
            var dataModel = this.getTableModel();
            var row = this.getSelectedRowIndex();

            var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : true, includeLinkName : false});
            var pageSelected = function(ev) {
                var sp = ev.getData();
                var pspec = sp[0].indexOf("://") != -1 ? sp[0] : ("/exp/p" + sp[0]);
                var rows = dataModel.getData();
                rows[row][3] = pspec;
                dataModel.setData(rows);

                this.__banners[bid].link = pspec;

                dlg.close();
            };
            dlg.addListener("pageSelected", pageSelected, this);
            dlg.addListener("linkSelected", pageSelected, this);
            dlg.open();
        }
    },

    destruct : function() {
        this.__active_on_item = this.__options = this.__banners = null;
    }
});