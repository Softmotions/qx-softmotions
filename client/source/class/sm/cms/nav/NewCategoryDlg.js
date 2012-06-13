/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Диалог создания нового раздела сайта
 */
qx.Class.define("sm.cms.nav.NewCategoryDlg", {
    extend : sm.cms.nav.BaseNavPopup,

    /**
     * @param pnode Parent node in navigation tree
     */
    construct : function(pnode) {
        this.base(arguments);
        this.__pnode = pnode;
    },

    members :
    {

        __pnode : null,

        _configureForm : function() {
            var category = new qx.ui.form.TextField().set({allowGrowY : true, maxLength : 64, required : true});
            category.addListener("keypress", function(ev) {
                if (ev.getKeyIdentifier() == "Enter") {
                    this.save();
                }
            }, this);
            this._form.add(category, this.tr("Section"), null, "name");
            category.focus();
        },

        _save : function() {
            var res = {};
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("nav.newcat"), "GET", "application/json");
            var fitems = this._form.getItems();
            req.setParameter("name", fitems["name"].getValue());
            req.setParameter("parent", this.__pnode.$$data);
            req.send(function(resp) {
                var rdata = resp.getContent();
                this.fireDataEvent("completed", rdata);
            }, this);
        }
    },

    destruct : function() {
        this.__pnode = null;
    }
});