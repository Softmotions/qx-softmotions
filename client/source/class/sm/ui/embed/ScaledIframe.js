/**
 * Iframe with support of scaling.
 */
qx.Class.define("sm.ui.embed.ScaledIframe", {
    extend : qx.ui.embed.Iframe,

    statics : {
    },

    events : {
    },

    properties : {

        /**
         * Scale iframe content to display 100% of actual resource width.
         */
        fitWidth : {
            check : "Boolean",
            init : false,
            nullable : false,
            apply : "__applyFitWidth"
        }
    },

    construct : function(source) {
        this.base(arguments, source);

        /*qx.event.Registration.removeListener(document.body, "pointerdown", this.block, this, true);
         qx.event.Registration.removeListener(document.body, "pointerup", this.release, this, true);
         qx.event.Registration.removeListener(document.body, "losecapture", this.release, this, true);
         this.release();*/

        this.setScrollbar("auto");
        this.addListener("resize", this.__syncScale, this);
        this.addListener("load", this.__onload, this);
    },

    members : {

        __originalSz : null,

        __currentRatio : null,

        __applyFitWidth : function() {
            this.__onload();
        },

        __onload : function() {
            if (!this.getFitWidth()) {
                return;
            }
            this.__originalSz = null;
            var iframeDom = this._getIframeElement().getDomElement();
            if (iframeDom == null || iframeDom.contentDocument.documentElement == null) {
                return;
            }
            this.__originalSz = this._getIframeSize();
            this.__syncScale();
        },

        __syncScale : function() {
            if (!this.getFitWidth()) {
                return;
            }
            if (this.__originalSz == null) {
                return;
            }
            var iframeDom = this._getIframeElement().getDomElement();
            var iframeDoc = (iframeDom != null) ? iframeDom.contentDocument.documentElement : null;
            if (iframeDoc == null) {
                return;
            }
            var paneSz = this.getInnerSize();
            var szRatio = paneSz.width / this.__originalSz.width;
            if (szRatio > 1.0) {
                szRatio = 1.0;
            }
            this._scale(iframeDoc, szRatio);
        },

        _scale : function(el, ratio) {
            if (this.__currentRatio === ratio) {
                return;
            }
            var scale = "scale(" + ratio + ")";
            var origin = "top left";
            qx.core.Environment.select("engine.name", {
                "gecko" : function() {
                    el.style.MozTransform = scale;
                    el.style.MozTransformOrigin = origin;
                },
                "webkit" : function() {
                    el.style.webkitTransform = scale;
                    el.style.webkitTransformOrigin = origin;
                },
                "mshtml" : function() {
                    el.style.msTransform = scale;
                    el.style.msTransformOrigin = origin;
                },
                "opera" : function() {
                    el.style.webkitTransform = scale;
                    el.style.webkitTransformOrigin = origin;
                    el.style.oTransform = scale;
                    el.style.oTransformOrigin = origin;
                },
                "default" : function() {
                    el.style.transform = scale;
                    el.style.transformOrigin = origin;
                }
            })();
            this.__currentRatio = ratio;
        },

        _getIframeSize : function() {
            try {
                var win = this._getIframeElement().getWindow();
                var sz = {
                    width : qx.bom.Document.getWidth(win),
                    height : qx.bom.Document.getHeight(win)
                };
                sz.width += 30; //todo duty hack
                return sz;
            } catch (e) {
                return null;
            }
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});