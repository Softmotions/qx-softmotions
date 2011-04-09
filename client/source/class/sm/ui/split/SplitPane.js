/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.ui.split.SplitPane", {
    extend  : qx.ui.splitpane.Pane,

    statics :
    {
    },

    events :
    {

    },

    properties :
    {
        "collapse" : {
            check : ["after", "before"],
            nullable : true,
            init : null
        }
    },

    construct : function(orientation, collapse) {
        this.base(arguments, orientation);
        if (collapse) {
            this.setCollapse(collapse);
        }
        var blocker = this.getBlocker();
        //blocker.setStyle("border-style", "solid");
        var splitter = this.getChildControl("splitter");
        this.__blockeref = blocker;
        this.__knob = splitter.getChildControl("knob");
        if (this.getCollapse()) {
            this.__knob.addState(this.getCollapse());
        }
        blocker.addListener("mouseover", this.__checkKnob, this);
        blocker.addListener("mousemove", this.__checkKnob, this);
        blocker.addListener("mousedown", this.__checkKnob, this);
        blocker.addListener("mouseout", this.__mouseOut, this);
        blocker.addListener("losecapture", this.__loseCapture, this);
        blocker.addListener("click", this.__clickBlocker, this);
    },

    members :
    {

        __isHor : null,

        __knob : null,

        __blockeref : null,

        __initCollapseEv : null,

        _applyOrientation : function(value, old) {
            this.base(arguments, value, old);
            this.__isHor = (value === "horizontal");
        },

        __clickBlocker : function(ev) {
            if (!this.__knob.hasState("mouseover")) {
                return;
            }
            //knob clicked
            this.__collapse(ev);
        },


        __collapse : function(ev) {
            var collapse = this.getCollapse();
            if (!collapse) {
                return;
            }
            var mev = null;
            if (this.__initCollapseEv) {
                mev = this.__initCollapseEv;
                this.__initCollapseEv = null;
            } else {
                this.__initCollapseEv = ev.clone();
                var cloc = this.getContainerLocation();
                var left = (this.__isHor && collapse == "after") ? cloc.right : cloc.left;
                var top = (!this.__isHor && collapse == "after") ? cloc.bottom : cloc.top;
                mev = {
                    getDocumentLeft : function() {
                        return left;
                    },
                    getDocumentTop : function() {
                        return top;
                    },
                    stop : function() {
                    }
                };
            }
            this._onMouseDown(ev);
            var icev = this.__initCollapseEv;
            this._onMouseMove(mev);
            this.__initCollapseEv = icev;
            this._onMouseUp(mev);
            this.__mouseOut(mev);
        },

        __mouseOut : function(ev) {
            this.__knob.removeState("mouseover");
            var cstyle = this.__blockeref.getStyle("cursor");
            if (cstyle != "col-resize" && cstyle != "row-resize") {
                if (this.__isHor) {
                    this.__blockeref.setStyle("cursor", "col-resize");
                } else {
                    this.__blockeref.setStyle("cursor", "row-resize");
                }
            }
        },

        __loseCapture : function() {
            var collapse = this.getCollapse();
            if (!collapse) {
                return;
            }
            var splitter = this.getChildControl("splitter");
            var splitterElem = splitter.getContainerElement().getDomElement();
            var splitterLoc = qx.bom.element.Location.getPosition(splitterElem);
            var collapsed = false;
            var minForCollapsed = 10;
            if (this.__isHor) {
                if (collapse == "after") {
                    collapsed = (Math.abs(splitterLoc.right) <= minForCollapsed);
                } else {
                    collapsed = (Math.abs(splitterLoc.left) <= minForCollapsed);
                }
            } else {
                if (collapse == "after") {
                    collapsed = (Math.abs(splitterLoc.bottom) <= minForCollapsed);
                } else {
                    collapsed = (Math.abs(splitterLoc.top) <= minForCollapsed);
                }
            }
            if (collapsed) {
                this.__knob.addState("collapsed");
            } else {
                this.__knob.removeState("collapsed");
            }
        },

        _onMouseMove : function(ev) {
            this.base(arguments, ev);
            if (this._isActiveDragSession()) {
                this.__initCollapseEv = null;
            }
        },

        __checkKnob : function(ev) {
            if (!this.getCollapse() || this.__knob.hasState("mouseover")) {
                return;
            }
            var kloc = this.__knob.getContainerLocation();
            if (this.__isHor) {
                var etop = ev.getDocumentTop();
                if (etop >= kloc.top && etop <= kloc.bottom) {
                    this.__blockeref.setStyle("cursor", "pointer");
                    this.__knob.addState("mouseover");
                }
            } else {
                var eleft = ev.getDocumentLeft();
                if (eleft >= kloc.left && eleft <= kloc.right) {
                    this.__blockeref.setStyle("cursor", "pointer");
                    this.__knob.addState("mouseover");
                }
            }

        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});