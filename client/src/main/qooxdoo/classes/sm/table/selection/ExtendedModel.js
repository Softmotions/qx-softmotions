/*
 * Copyright (c) 2017. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Улучшенный qooxdoo селектор
 */

qx.Class.define("sm.table.selection.ExtendedModel", {
    extend : qx.ui.table.selection.Model,
    
    construct : function () {
        this.base(arguments);
    },

    events: {
        /** Fired when the selection has changed. 
         * DATA: {
         *      "prev" : [Integer] previous anchor selection index
         *      "cur" : [Integer] current anchor selection index
         * }
         */
        "changeSingleSelection" : "qx.event.type.Data"
    },

    members: {

        __prevSelectedIndex : null,

        _fireChangeSelection : function () {
            this.base(arguments);

            if (this.hasBatchMode()) {
                // In batch mode, remember event but do not throw (yet)
                this.__hadChangeEventInBatchMode = true;
            } else {
                var curSelectionIndex = this.getAnchorSelectionIndex();
                this.fireDataEvent("changeSingleSelection", {prev: this.__prevSelectedIndex, cur: curSelectionIndex});
                this.__prevSelectedIndex = curSelectionIndex;
            }
        }
    },
    
    destruct: function () {
        this.__prevSelectedIndex = null;
    }
});
    
