/**
 * Extended table selection model.
 */
qx.Class.define("sm.table.selection.ExtendedSelectionModel", {
    extend: qx.ui.table.selection.Model,

    construct: function () {
        this.base(arguments);
    },

    events: {
        "changeActualSelection": "qx.event.type.Event"
    },

    members: {

        skipNextSelectionEventCnt: 0,

        __lastFromIndex: null,

        __lastToIndex: null,

        setSelectionInterval: function (fromIndex, toIndex) {
            if (this.__lastFromIndex == fromIndex && this.__lastToIndex == toIndex) {
                return;
            }
            this.base(arguments, fromIndex, toIndex);
            this.__lastFromIndex = fromIndex;
            this.__lastToIndex = toIndex;
        },

        _fireChangeSelection: function () {
            if (this.hasBatchMode()) {
                this.base(arguments);
            } else {
                this.fireEvent("changeSelection");
                if (this.skipNextSelectionEventCnt > 0) {
                    this.skipNextSelectionEventCnt--;
                } else {
                    if (this.hasListener("changeActualSelection")) {
                        this.fireEvent("changeActualSelection");
                    }
                }
            }
        }
    },

    destruct: function () {
        this.__lastFromIndex = null;
        this.__lastToIndex = null;
    }
});

