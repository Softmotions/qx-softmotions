qx.Class.define("sm.model.JsonTableColumnModel", {
    extend  : qx.ui.table.columnmodel.Resize,

    construct : function(colsSpec) {
        this.base(arguments, colsSpec);
        this._colsSpec = colsSpec;
    },

    members : {

        _colsSpec : null,

        _inited : false,


        init : function(numColumns, table) {

            if (this._inited == true) {
                return;
            } else {
                this._inited = true;
            }

            var scb = new qx.ui.table.columnmodel.resizebehavior.Default();
            this.setBehavior(scb);

            // Call our superclass
            this.base(arguments, numColumns, table);

            for (var i = 0; i < this._colsSpec.length; ++i) {
                var cs = this._colsSpec[i];
                if (cs["width"] != undefined) {
                    scb.setWidth(i, cs["width"], cs["flex"]);
                }
                if (cs["maxWidth"] != undefined) {
                    scb.setMaxWidth(i, cs["maxWidth"]);
                }
                if (cs["minWidth"] != undefined) {
                    scb.setMinWidth(i, cs["minWidth"]);
                }
                var type = cs["type"];
                switch (type) {
                    case "html":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Html());
                        break;
                    case "image":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Image());
                        break;
                    case "number":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Number());
                        break;
                    case "boolean":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Boolean());
                        break;
                    case "date":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Date());
                        break;
                    case "password":
                        this.setDataCellRenderer(i, new qx.ui.table.cellrenderer.Password());
                        break;
                }

                if (cs["editable"] == true) {
                    switch (type) {
                        case "boolean":
                            this.setCellEditorFactory(i, new sm.model.SingleClickCBCellEditor());
                            break;
                        default:
                            this.setCellEditorFactory(i, new sm.model.TextFieldCellEditor());

                    }
                    var tmodel = table.getTableModel();
                    tmodel.setColumnEditable(i, true);
                }

                if (cs["tooltip"] != undefined) {
                    this.setHeaderCellRenderer(i, new qx.ui.table.headerrenderer.Icon("", cs["tooltip"]));
                }

            }
        }
    },

    destruct : function() {
        this._inited = false;
        this._colsSpec = null;
    }
});