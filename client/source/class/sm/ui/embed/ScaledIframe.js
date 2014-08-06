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
        this.setDecorator("main");
    },

    members : {

        __originalSz : null,

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
            var iframeDoc = iframeDom.contentDocument.documentElement;
            var paneSz = this.getInnerSize();
            var originalSz = this.__originalSz = this._getIframeSize();
            var szRatio = (paneSz.width / originalSz.width);
            if (szRatio < 1.0) {
                var scale = "scale(" + szRatio + ")";
                var origin = "top left";
                qx.core.Environment.select("engine.name", {
                    "gecko" : function() {
                        iframeDoc.style.MozTransform = scale;
                        iframeDoc.style.MozTransformOrigin = origin;
                    },
                    "webkit" : function() {
                        iframeDoc.style.webkitTransform = scale;
                        iframeDoc.style.webkitTransformOrigin = origin;
                    },
                    "mshtml" : function() {
                        iframeDoc.style.msTransform = scale;
                        iframeDoc.style.msTransformOrigin = origin;
                    },
                    "opera" : function() {
                        iframeDoc.style.webkitTransform = scale;
                        iframeDoc.style.webkitTransformOrigin = origin;
                        iframeDoc.style.oTransform = scale;
                        iframeDoc.style.oTransformOrigin = origin;
                    },
                    "default" : function() {
                        iframeDoc.style.transform = scale;
                        iframeDoc.style.transformOrigin = origin;
                    }
                })();
            }
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
            var scale = "scale(" + szRatio + ")";
            var origin = "top left";
            qx.core.Environment.select("engine.name", {

                "gecko" : function() {
                    iframeDoc.style.MozTransform = scale;
                    iframeDoc.style.MozTransformOrigin = origin;
                },

                "webkit" : function() {
                    iframeDoc.style.webkitTransform = scale;
                    iframeDoc.style.webkitTransformOrigin = origin;
                },

                "opera" : function() {
                    iframeDoc.style.webkitTransform = scale;
                    iframeDoc.style.webkitTransformOrigin = origin;
                    iframeDoc.style.oTransform = scale;
                    iframeDoc.style.oTransformOrigin = origin;
                },

                "default" : function() {
                    iframeDoc.style.zoom = szRatio;
                }

            })();

        },

        _getIframeSize : function() {
            try {
                var win = this._getIframeElement().getWindow();
                return {
                    width : qx.bom.Document.getWidth(win),
                    height : qx.bom.Document.getHeight(win)
                };
            } catch (e) {
                return null;
            }
        },

        _createBlockerElement : function() {
            var el = new qx.html.Blocker();
            el.setStyles({
                "zIndex" : 1e8,
                "display" : "block"
            });

            return el;
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});