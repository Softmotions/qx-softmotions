/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.ui.form.FlexFormRenderer", {
    extend : qx.ui.form.renderer.Single,


    construct : function(form) {
        this.base(arguments, form);
        var layout = this._getLayout();
        layout.setColumnFlex(0, 0);
        layout.setColumnFlex(1, 1);
        layout.setColumnAlign(0, "right", "top");
        layout.setColumnAlign(1, "left", "top");
        //this._setLayout(layout);
    },

    members : {

        /**
         * Set last form row be vertical flexible.
         */
        setLastRowFlexible : function() {
            this._getLayout().setRowFlex(this._row - 1, 1)
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});