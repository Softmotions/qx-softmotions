/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(qx/icon/${qx.icontheme}/16/actions/list-add.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/list-remove.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/go-up.png)
 #asset(qx/icon/${qx.icontheme}/16/actions/go-down.png)
 */

/**
 * Menu editor table
 */
qx.Class.define("sm.cms.editor.MenuTable", {
    extend : sm.table.ToolbarLocalTable,
    implement : [
        qx.ui.form.IStringForm,
        qx.ui.form.IForm
    ],
    include : [
        qx.ui.form.MForm,
        qx.ui.core.MChildrenHandling,
        sm.table.MTableMutator
    ],

    events :
    {
        /** Fired when the value was modified */
        "changeValue" : "qx.event.type.Data",

        /** Fired when the enabled state was modified */
        "changeEnabled" : "qx.event.type.Data",

        /** Fired when the valid state was modified */
        "changeValid" : "qx.event.type.Data",

        /** Fired when the invalidMessage was modified */
        "changeInvalidMessage" : "qx.event.type.Data",

        /** Fired when the required was modified */
        "changeRequired" : "qx.event.type.Data"
    },

    properties :
    {
    },

    construct : function(options) {

        this.__options = options || {};
        this.__toolbar_items = [];

        this.base(arguments);

        this.set({allowGrowX : true, allowGrowY : false, height : 170});

        for (var i = 0; i < this.__toolbar_items.length; ++i) {
            this.__doItemEnabled(this.__toolbar_items[i], false);
        }

        this._reload([]);
    },

    members :
    {

        __options : null,

        __synchronize : null,
        __synchronizeInfo : null,

        /**
         * List of widgets and its enabled rules
         */
        __toolbar_items : null,

        ///////////////////////////////////////////////////////////////////////////
        //                         sm.table.ToolbarTable                         //
        ///////////////////////////////////////////////////////////////////////////

        _createToolbarItems : function(toolbar) {
            var mainPart = new qx.ui.toolbar.Part();
            toolbar.add(mainPart);

            var mb = new qx.ui.toolbar.Button(this.tr("New link"), "icon/16/actions/list-add.png");
            mb.addListener("execute", function(e) {
                this.__manageLink();
            }, this);
            this.__toolbar_items.push({
                item: mb,
                activeOnItem: false,
                inactiveOnSync: true
            });

            mainPart.add(mb);

            mainPart.addSeparator();

            mb = new qx.ui.toolbar.Button(this.tr("Delete"), "icon/16/actions/list-remove.png");
            mb.addListener("execute", function(e) {
                this.removeRowByIndex(this.getSelectedRowIndex());
            }, this);
            this.__toolbar_items.push({
                item: mb,
                activeOnItem: true,
                inactiveOnSync: true
            });
            mainPart.add(mb);

            mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-up.png");
            mb.addListener("execute", function(ev) {
                var ind = this.getSelectedRowIndex();
                this.moveRowByIndex(ind, -1, true);
            }, this);
            this.__toolbar_items.push({
                item: mb,
                activeOnItem: true,
                inactiveOnSync: true
            });
            mainPart.add(mb);

            mb = new qx.ui.toolbar.Button(null, "icon/16/actions/go-down.png");
            mb.addListener("execute", function(ev) {
                var ind = this.getSelectedRowIndex();
                this.moveRowByIndex(ind, 1, true);
            }, this);
            this.__toolbar_items.push({
                item: mb,
                activeOnItem: true,
                inactiveOnSync: true
            });
            mainPart.add(mb);

            if (this.__options["synchronizable"]) {
                mb = new qx.ui.toolbar.Separator().set({width: 25});
                mainPart.add(mb);

                mb = new qx.ui.basic.Label("Синхронизация: ").set({alignY: "middle", marginRight: 5});
                mainPart.add(mb);

                mb = new qx.ui.toolbar.Button(this.tr("Enable")/*, "icon/16/actions/go-down.png"*/);
                mb.addListener("execute", function(ev) {
                    this.__manageSync(true);
                }, this);
                this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: false,
                    inactiveOnSync: true
                });
                mainPart.add(mb);

                mb = new qx.ui.toolbar.Button(this.tr("Disable")/*, "icon/16/actions/go-down.png"*/);
                mb.addListener("execute", function(ev) {
                    this.__manageSync(false);
                }, this);
                this.__toolbar_items.push({
                    item: mb,
                    activeOnItem: false,
                    activeOnSync: true
                });
                mainPart.add(mb);
            }

            return toolbar;
        },

        //overriden
        _createTable : function(tm) {
            var table = new sm.table.Table(tm, tm.getCustom());
            table.set({showCellFocusIndicator : false,
                statusBarVisible : !!this.__options["synchronizable"],
                focusCellOnMouseMove : false});

            var smodel = table.getSelectionModel();
            smodel.addListener("changeSelection", function(ev) {
                var scount = smodel.getSelectedCount();
                for (var i = 0; i < this.__toolbar_items.length; ++i) {
                    this.__doItemEnabled(this.__toolbar_items[i], scount > 0);
                }
            }, this);

            return table;
        },

        //overriden
        _setJsonTableData : function(tm, items) {
            var data = {
                "title" : "",
                "columns" : [
                    {
                        "title" : this.tr("Name").toString(),
                        "id" : "name",
                        "sortable" : false,
                        "width" : "1*"
                    },
                    {
                        "title" : this.tr("Link").toString(),
                        "id" : "link",
                        "sortable" : false,
                        "width" : "1*"
                    }
                ],
                "items" : items
            };
            tm.setJsonData(data);
        },

        ///////////////////////////////////////////////////////////////////////////
        //                               Impl                                    //
        ///////////////////////////////////////////////////////////////////////////

        // apply enabled rule for item
        __doItemEnabled: function(item, onItem) {
            item.item.setEnabled(
                    (!item.activeOnItem || onItem) &&
                            (!item.inactiveOnSync || !this.__synchronize) &&
                            (!item.activeOnSync || !!this.__synchronize)
            );
        },

        __applyEditorEnabled: function() {
            var table = this.getTable();

            if (this.__options["synchronizable"] && this.__synchronize) {
                table.setEnabled(false);
                table.setAdditionalStatusBarText(", " + this.tr("synchronize with %1", this.__synchronizeInfo["cachedPath"] || "").toString());
            } else {
                table.setEnabled(true);
                table.setAdditionalStatusBarText("");
            }

            for (var i = 0; i < this.__toolbar_items.length; ++i) {
                this.__doItemEnabled(this.__toolbar_items[i], false);
            }
        },

        // add new menu link
        __manageLink : function() {
            var dlg = new sm.cms.page.PageLinkDlg({
                "requireLinkName": true,
                "allowOuterLinks" : this.__options["allowOuterLinks"]
            });
            dlg.addListener("pageSelected", function(ev) {
                var data = ev.getData();
                var ldata = {
                    "name" : data[1],
                    "link" : "/exp/p" + data[0]
                };
                this.addRow(function(odata) {
                    return (odata["name"] == ldata["name"])
                }, [ldata["name"], ldata["link"]], ldata);

                dlg.close();
            }, this);
            dlg.addListener("linkSelected", function(ev) {
                var data = ev.getData();
                var ldata = {
                    "name" : data[1],
                    "link" : data[0]
                };
                this.addRow(function(odata) {
                    return (odata["name"] == ldata["name"])
                }, [ldata["name"], ldata["link"]], ldata);

                dlg.close();
            }, this);
            dlg.open();
        },

        // enable menu synchronization
        __manageSync : function(enable) {
            if (this.__options["synchronizeCallback"]) {
                this.__options["synchronizeCallback"](enable);
            }
        },

        setSynchronize: function(isSynch, syncInfo) {
            this.__synchronize = !!isSynch;
            this.__synchronizeInfo = isSynch ? syncInfo || {} : {};

            this.__applyEditorEnabled();
        },

        ///////////////////////////////////////////////////////////////////////////
        //                            StringForm stuff                           //
        ///////////////////////////////////////////////////////////////////////////


        // overridden
        setValue : function(value) {
            if (value == null) {
                value = [];
            }
            if (!qx.lang.Type.isArray(value)) {
                qx.log.Logger.error(this, "Value is not array ", value);
                value = [];
            }
            var tdata = [];
            for (var i = 0; i < value.length; ++i) {
                var name = value[i]["name"];
                var link = value[i]["link"];
                if (name == null || link == null) {
                    continue;
                }
                var rdata = [name, link];
                rdata.rowData = value[i];
                tdata.push(rdata);
            }

            var tm = this.getTableModel();
            tm.setData(tdata);

            this.__applyEditorEnabled();

            this.fireDataEvent("changeValue", value);
        },

        // overridden
        resetValue : function() {
            this.setValue([]);
        },

        // overridden
        getValue : function() {
            var obj = [];
            var tdata = this.getTableModel().getData();
            for (var i = 0; i < tdata.length; ++i) {
                obj.push(tdata[i].rowData);
            }
            return obj;
        }
    },

    destruct : function() {
        this.__toolbar_items = this.__options = null;
        this.__synchronize = this.__synchronizeInfo = null;
    }
});

