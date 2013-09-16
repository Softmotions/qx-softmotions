/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * @asset(sm/cms/icon/16/wiki/link_add.png)
 */
qx.Class.define("sm.cms.editor.UniversalEditor", {
    extend : qx.ui.container.Composite,
    implement : [
        qx.ui.form.IStringForm,
        qx.ui.form.IForm
    ],
    include : [
        qx.ui.form.MForm
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

    /**
     * @param opts {Object} Editor options
     */
    construct : function(opts) {
        qx.core.Assert.assertMap(opts, "Constructor argument: opts must be Map");
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox());

        var form = this.__form = new qx.ui.form.Form();
        var fields = opts["fields"] || {};

        var activeCheckBox = new qx.ui.form.CheckBox().set({value : !!opts["active"]});
        var activeCb = function() {
            var active = activeCheckBox.getValue();
            var items = form.getItems();
            for (var k in items) {
                if (k == "_active_") {
                    continue;
                }
                items[k].setEnabled(active);
            }
        };
        activeCheckBox.addListener("changeValue", activeCb, this);
        form.add(activeCheckBox, this.tr("Active"), null, "_active_");

        for (var fn in fields) {
            var fo = fields[fn];
            var ft = fo["type"];
            var fi = null;
            switch (ft) {
                case "textfield" :
                case "textarea" :
                    fi = (ft == "textfield") ? new qx.ui.form.TextField() : new qx.ui.form.TextArea().set({minimalLineHeight : 2});
                    if (fo["maxLength"] != null) {
                        fi.setMaxLength(fo["maxLength"]);
                    }
                    break;
                case "link" :
                    var bf = fi = new sm.ui.form.ButtonField(null, "sm/cms/icon/16/wiki/link_add.png");
                    fi.setReadOnly(true);
                    fi.addListener("execute", function(ev) {
                        var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : true, requireLinkName : true});
                        var pageSelected = function(ev) {
                            var sp = ev.getData();
                            var pspec = sp[0].indexOf("://") != -1 ? sp[0] : ("/exp/p" + sp[0]);
                            bf.setValue(pspec + "|" + sp[1]);
                            dlg.close();
                        };
                        dlg.addListener("pageSelected", pageSelected, this);
                        dlg.addListener("linkSelected", pageSelected, this);
                        dlg.open();
                    }, this);
                    break;
                default:
                    break;
            }
            if (fi == null) {
                continue;
            }
            if (qx.lang.Type.isBoolean(fo["required"])) {
                fi.setRequired(fo["required"]);
            }
            form.add(fi, fo["name"] ? fo["name"] : fn, null, fn);
        }

        activeCb();

        var fr = new sm.ui.form.FlexFormRenderer(form);
        this.add(fr, {flex : 1});
    },

    members :
    {

        __form : null,

        getValidator : function() {
            return function(value, formItem) {
                if (formItem.__form.getItems()["_active_"].getValue() == false) {
                    return true;
                }
                return formItem.__form.validate();
            }
        },

        // overridden
        setValue : function(value) {
            var items = this.__form.getItems();
            for (var k in items) {
                items[k].setValue(value != null ? value[k] : null);
            }
            this.fireDataEvent("changeValue", value);
        },

        // overridden
        resetValue : function() {
            this.setValue(null);
        },

        // overridden
        getValue : function() {
            var res = {};
            var items = this.__form.getItems();
            for (var k in items) {
                res[k] = items[k].getValue();
            }
            return res;
        }
    },

    destruct : function() {
        this._disposeObjects("__form");
    }
});

