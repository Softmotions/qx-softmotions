/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Drag slider based on splitpane tech
 */
qx.Class.define("sm.ui.split.SplitSliderPane", {
    extend  : qx.ui.indicator.ProgressBar,


    events:
    {
        /**
         * Fired when user set value of this pane manually by mouse.
         * data: {Integer} new value
         */
        seek: "qx.event.type.Data"
    },


    construct : function() {
        this.base(arguments, 0, 100000);
        this.addListener("mouseover", this._onMouseOver);
        this.addListener("mouseout", this._onMouseOut);
        this.addListener("mousedown", this._onMouseDown);
    },

    members :
    {

        _ign_setval : false,

        _onMouseOver : function(e) {
            this.addState("hovered");
        },

        _onMouseOut : function(e) {
            this._ign_setval = false;
            this.removeState("hovered");
        },

        _onMouseDown : function(e) {
            this._ign_setval = true;
            var eXLocation = e.getDocumentLeft();
            var el = this.getContentElement().getDomElement();
            var elLocation = qx.bom.element.Location.get(el);
            var len = (elLocation.right - elLocation.left);
            var lenPos = (eXLocation - elLocation.left);
            var val = this.getMaximum() * (lenPos / len);
            if (lenPos < 2) {
                val = 0;
            }
            if (len - lenPos <= 2) {
                val = this.getMaximum();
            }
            this.setValue(val, true);
            this.fireDataEvent("seek", val)
        },

        setValue : function(val, force) {
            if (!this._ign_setval || force) {
                this.base(arguments, val);
            }
        }

    },

    destruct : function() {
        this._ign_setval = false;
        //this._disposeObjects("__field_name");
    }
});