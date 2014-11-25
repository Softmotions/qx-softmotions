/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Single selection list which supports IRadioItem
 */

qx.Class.define("sm.ui.list.RadioList", {
    extend  : qx.ui.list.List,
    implement : [ qx.ui.form.IRadioItem ],


    events :
    {
        /** Fired when the item was checked or unchecked */
        "changeValue" : "qx.event.type.Data"
    },

    properties :
    {

        selectionMode :
        {
            init : "single",
            refine : true
        }
    },

    construct : function(model) {
        this.base(arguments, model || new qx.data.Array());
        this.getSelection().addListener("change", function(ev) {
            this.__setValue(this.getSelection().getLength() != 0)
        }, this);
        this.addListener("changeModel", function() {
            this.setValue(this.__selected);
        }, this);
    },

    members :
    {

        __selected : false,

        __group : null,

        __setValue : function(selected) {
            if (this.__selected == selected) {
                return;
            }
            this.__selected = selected;
            this.fireDataEvent("changeValue", this.__selected, !this.__selected);
        },

        setValue : function(value) {
            if (!value) {
                this.getSelection().removeAll();
                this.__setValue(false);
            } else {
                this._ensureSelected();
            }
        },

        _ensureSelected : function() {
            if (this.getSelection().getLength() == 0 && this.getModel().getLength() > 0) {
                this.getSelection().push(this.getModel().getItem(0));
                return this.getSelection().getItem(0);
            }
            this.__setValue(true);
            return this.getSelection().getItem(0);
        },

        getSelected : function() {
            return this.getSelection().getItem(0) || null;
        },

        getValue : function() {
            return this.__selected;
        },

        setGroup : function(value) {
            this.__group = value;
        },

        getGroup : function() {
            return this.__group;
        }

    },

    destruct : function() {
        this.__group = null;
        //this._disposeObjects("__field_name");
    }
});
