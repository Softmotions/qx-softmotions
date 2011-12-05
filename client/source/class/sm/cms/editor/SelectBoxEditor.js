/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.editor.SelectBoxEditor", {
    extend  : qx.ui.form.SelectBox,
    implement : [
        qx.ui.form.IStringForm
    ],

    events :
    {
        /** Fired when the value was modified */
        "changeValue" : "qx.event.type.Data"

    },

    construct : function(options) {
        this.base(arguments);
        if (qx.lang.Type.isArray(options["items"])) {
            var items = options["items"];
            for (var i = 0; i < items.length; ++i) {
                var item = items[i];
                var name = (typeof item == "string") ? item : item["name"];
                var value = (typeof item == "string") ? item : item["value"];
                this.add(new qx.ui.form.ListItem(name, null, value));
            }
        }
    },

    members :
    {

        setValue : function(value) {
            if (value == null) {
                this.resetSelection();
                this.fireDataEvent("changeValue", null);
                return;
            }
            this.setModelSelection([value]);
            this.fireDataEvent("changeValue", value);
        },

        resetValue : function() {
            this.setValue(null);
        },

        getValue : function() {
            var ms = this.getModelSelection();
            return ms && ms.length > 0 ? ms.getItem(0) : null;
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});

