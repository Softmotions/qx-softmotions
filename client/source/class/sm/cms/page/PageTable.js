/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.PageTable", {
    extend  : qx.ui.table.Table,

    construct : function(useColumns) {

        var tm = new sm.model.RemoteVirtualTableModel({
            "name" : this.tr("Название"),
            "mdate" : this.tr("Изменена"),
            "published" : this.tr("Опубликована"),
            "template" : this.tr("Шаблон"),
            "refpage" : this.tr("Связана с"),
            "type" : this.tr("Тип"),
            "visit_count" : this.tr("Посетило")
        })
          .set({
            "useColumns" : useColumns || ["name", "mdate", "template"],
            "rowdataUrl" : sm.cms.Application.ACT.getUrl("select.pages"),
            "rowcountUrl" : sm.cms.Application.ACT.getUrl("select.pages.count")
        });

        var custom = {
            tableColumnModel : function(obj) {
                return new qx.ui.table.columnmodel.Resize(obj);
            }
        };
        this.base(arguments, tm, custom);

        var rr = new sm.table.renderer.CustomRowRenderer();
        rr.setBgColorInterceptor(qx.lang.Function.bind(function(rowInfo) {
            //var srd = this.getRowData(rowInfo.row);
            //{"name":"превед","mdate":"1305713460311","published":true,"asm":"exp.news.item","refpage":"3b93d34dbd17f35900000000","type":2}
            var rdata = rowInfo.rowData;
            if ((rdata && rdata["published"] == false) || (rdata && rdata["template"] == null)) {
                return "gray";
            } else {
                return "white";
            }
        }, this));
        this.setDataRowRenderer(rr);

        var tcm = this.getTableColumnModel();
        var cInd = tm.getColumnIndexById("mdate");
        if (cInd != null) {
            tcm.setDataCellRenderer(cInd, new sm.table.renderer.DateTimeCellRenderer());
        }
        cInd = tm.getColumnIndexById("visit_count");
        if (cInd != null) {
            tcm.getBehavior().setWidth(cInd, 80);
        }
    },

    members :
    {

        getSelectedPageInd : function() {
            return this.getSelectionModel().getAnchorSelectionIndex();
        },

        getSelectedPage : function() {
            var sind = this.getSelectedPageInd();
            return sind != -1 ? this.getTableModel().getRowData(sind) : null;
        },

        cleanup : function() {
            this.getTableModel().cleanup();
        }

    }
});
