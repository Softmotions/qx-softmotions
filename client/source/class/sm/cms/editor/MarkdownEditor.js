/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/wiki/*)
 #asset(sm/icons/misc/help16.png)
 */

qx.Class.define("sm.cms.editor.MarkdownEditor", {
    extend : qx.ui.core.Widget,
    implement : [
        qx.ui.form.IStringForm,
        qx.ui.form.IForm
    ],
    include : [
        qx.ui.form.MForm,
        qx.ui.core.MChildrenHandling
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
        appearance :
        {
            refine : true,
            init   : "textarea-editor"
        },


        /**
         * Mongodb page ID to be edited
         */
        pageRef :
        {
            check : "String",
            nullable : false,
            init : ""
        }
    },
    construct : function(opts) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox(4));
        var ta = this.__ensureChildren();

        //todo scary textselection hacks
        if (qx.core.Environment.get("engine.name") == "mshtml") {
            var getCaret = function(el) {
                if (el == null) {
                    return 0;
                }
                var start = 0;
                var range = el.createTextRange();
                var range2 = document.selection.createRange().duplicate();
                // get the opaque string
                var range2Bookmark = range2.getBookmark();
                range.moveToBookmark(range2Bookmark);
                while (range.moveStart("character", -1) !== 0) {
                    start++
                }
                return start;
            };
            var syncSel = function() {
                var tael = ta.getContentElement().getDomElement();
                this.__lastSStart = this.__lastSEnd = getCaret(tael);
            };
            ta.addListener("keyup", syncSel, this);
            ta.addListener("focus", syncSel, this);
            ta.addListener("click", syncSel, this);
        }
    },
    members :
    {

        __lastSStart : 0,

        __lastSEnd : 0,


        __ensureChildren : function() {
            this.getChildControl("toolbar");
            return this.getChildControl("textarea");
        },

        __getTextArea : function() {
            return this.getChildControl("textarea");
        },

        setAutoSize : function(value) {
            this.__getTextArea().setAutoSize(value);
        },

        setMinimalLineHeight : function(value) {
            this.__getTextArea().setMinimalLineHeight(value);
        },

        setPlaceholder : function(value) {
            this.__getTextArea().setPlaceholder(value);
        },


        // overridden
        addListener : function(type, listener, self, capture) {
            switch (type) {
                default:
                    //todo scary hack
                    this.__ensureChildren().addListener(type, listener, self, capture);
                    break;
            }
        },

        // overridden
        setValue : function(value) {
            this.__getTextArea().setValue(value);
        },

        // overridden
        resetValue : function() {
            this.__getTextArea().resetValue();
        },

        // overridden
        getValue : function() {
            return this.__getTextArea().getValue();
        },

        //overriden
        _applyEnabled : function(value, old) {
            this.base(arguments, value, old);
            this.__getTextArea().setEnabled(value);
        },

        _createChildControlImpl : function(id) {
            var control;

            switch (id) {
                case "toolbar":
                    control = new qx.ui.toolbar.ToolBar().set({overflowHandling : true});
                    this.__createToolbarControls(control);
                    this._add(control, {flex : 0});
                    break;

                case "textarea":
                    control = new qx.ui.form.TextArea();
                    this._add(control, {flex : 1});
                    break;
            }

            return control || this.base(arguments, id);
        },

        __insHeading1 : function() {
            this.__insSurround(1, "#", this.tr("Header text"), " ");
        },

        __insHeading2 : function() {
            this.__insSurround(2, "#", this.tr("Header text"), " ");
        },

        __insHeading3 : function() {
            this.__insSurround(3, "#", this.tr("Header text"), " ");
        },

        __insBold : function() {
            this.__insSurround(1, "**", this.tr("Bold text"));
        },

        __insItalic : function() {
            this.__insSurround(1, "*", this.tr("Italics text"));
        },

        __insOL : function() {
            var val = [];
            val.push("");
            val.push("1. Один");
            val.push("1. Два");
            val.push("    1. Первый у второго");
            val.push("1. Три");
            val.push("");
            this.__insAdd(val.join("\n"));
        },

        __insUL : function() {
            var val = [];
            val.push("");
            val.push("* Один");
            val.push("* Два");
            val.push("    * Первый у второго");
            val.push("* Три");
            val.push("");
            this.__insAdd(val.join("\n"));
        },

        _getSelectionStart : function() {
            var sStart = this.__getTextArea().getTextSelectionStart();
            return (sStart == null || sStart == -1 || sStart == 0) ? this.__lastSStart : sStart;
        },

        _getSelectionEnd : function() {
            var sEnd = this.__getTextArea().getTextSelectionEnd();
            return (sEnd == null || sEnd == -1 || sEnd == 0) ? this.__lastSEnd : sEnd;
        },

        __insAdd : function(text) {
            var ta = this.__getTextArea();
            var tel = ta.getContentElement();
            var scrollY = tel.getScrollY();

            var sStart = this._getSelectionStart();
            var sEnd = this._getSelectionEnd();

            var nval = [];
            var value = ta.getValue();
            if (value == null) value = "";

            nval.push(value.substring(0, sStart));
            nval.push(text);
            nval.push(value.substring(sEnd));
            ta.setValue(nval.join(""));

            var finishPos = sStart + text.length;
            ta.setTextSelection(finishPos, finishPos);
            tel.scrollToY(scrollY);
        },

        __insSurround : function(level, pattern, ptVal, trails) {
            var ta = this.__getTextArea();
            var tel = ta.getContentElement();
            var scrollY = tel.getScrollY();

            var sStart = this._getSelectionStart();
            var sEnd = this._getSelectionEnd();
            var sText = (sStart != sEnd) ? tel.getTextSelection() : null;

            var text = ptVal ? ((sText != null && sText.length > 0) ? sText : prompt(ptVal, "")) : "";
            if (text == null) {
                return;
            }
            var value = ta.getValue();
            if (value == null) value = "";

            var hfix = pattern;
            for (var i = 1; i < level; ++i) {
                hfix += pattern;
            }
            var nval = [];
            nval.push(value.substring(0, sStart));

            nval.push(hfix);
            if (trails) {
                nval.push(trails);
            }
            nval.push(text);
            if (trails) {
                nval.push(trails);
            }
            nval.push(hfix);

            nval.push(value.substring(sEnd));
            ta.setValue(nval.join(""));

            var finishPos = sStart + text.length + 2 * hfix.length + (trails ? trails.length * 2 : 0);
            ta.setTextSelection(finishPos, finishPos);
            tel.scrollToY(scrollY);
        },

        __insPageRef : function() {
            var ta = this.__getTextArea();
            var tel = ta.getContentElement();
            var sStart = this._getSelectionStart();
            var sEnd = this._getSelectionEnd();
            var sText = (sStart != sEnd) ? tel.getTextSelection() : null;
            var value = ta.getValue();
            if (value == null) value = "";
            var scrollY = tel.getScrollY();


            var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : true, linkText : sText});

            var pageSelected = function(ev) {
                var sp = ev.getData();

                var nval = [];
                nval.push(value.substring(0, sStart));
                var pspec = "[" + sp[1] + (sp[0].indexOf("://") != -1 ? "](" : "](page:") + sp[0] + ")";
                nval.push(pspec);
                nval.push(value.substring(sEnd));
                ta.setValue(nval.join(""));

                var finishPos = sStart + pspec.length;
                ta.setTextSelection(finishPos, finishPos);
                tel.scrollToY(scrollY);

                dlg.close();
            };

            dlg.addListener("pageSelected", pageSelected, this);
            dlg.addListener("linkSelected", pageSelected, this);

            dlg.open();
        },

        __insAttachment : function() {
            var ta = this.__getTextArea();
            var tel = ta.getContentElement();
            var sStart = this._getSelectionStart();
            var sEnd = this._getSelectionEnd();
            var value = ta.getValue();
            if (value == null) value = "";
            var scrollY = tel.getScrollY();

            var dlg = new sm.cms.media.AttachDlg(this.getPageRef());
            dlg.addListener("insert", function(ev) {
                var spec = ev.getData();
                var fname = spec[0];
                var ctype = spec[1];
                var ltext = spec[2];
                var link = spec[3];
                var isImg = (ctype.indexOf("image/") == 0);
                var isMedia = false;

                var mspec = [];
                if (!isImg || (isImg && ltext != null && link == null)) {
                    isMedia = true;
                } else {
                    if (link != null) {
                        mspec.push("[");
                    }
                    mspec.push("!");
                }
                mspec.push("[");
                if (ltext != null) {
                    mspec.push(ltext);
                } else if (isMedia) {
                    mspec.push(fname);
                }
                mspec.push("](");
                if (isMedia) {
                    mspec.push("media:");
                } else {
                    mspec.push("image:");
                }
                mspec.push(this.getPageRef() + fname);
                if (!isMedia) {
                    if (ltext != null) {
                        mspec.push(" \"" + ltext + "\"");
                    }
                } else {
                    mspec.push("\"Media:" + this.getPageRef() + fname + "\"");
                }
                mspec.push(")");

                if (!isMedia && link != null) {
                    mspec.push("]");

                    mspec.push("(");
                    link = qx.lang.String.trim(link);
                    if (link.indexOf("http://") != 0 && link.indexOf("https://") != 0) {
                        link = "http://" + link;
                    }
                    mspec.push(link);
                    if (ltext != null) {
                        mspec.push(" \"" + ltext + "\"");
                    }
                    mspec.push(")");
                }
                var mspecStr = mspec.join("");

                var nval = [];
                nval.push(value.substring(0, sStart));
                nval.push(mspecStr);
                nval.push(value.substring(sEnd));

                ta.setValue(nval.join(""));

                var finishPos = sStart + mspecStr.length;
                ta.setTextSelection(finishPos, finishPos);
                tel.scrollToY(scrollY);

                dlg.close();
                //ta.focus();
                //qx.log.Logger.info("mspec=" + mspec.join(""));
            }, this);
            dlg.open();
        },


        __createToolbarControls : function(toolbar) {
            var me = this;
            var createBaseControls = function(cont, btClass, apperance) {
                var h1 = new btClass("", "sm/cms/icon/16/wiki/text_heading_1.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                h1.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Heading 1")));
                h1.addListener("execute", me.__insHeading1, me);
                cont.add(h1);
                var h2 = new btClass("", "sm/cms/icon/16/wiki/text_heading_2.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                h2.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Heading 2")));
                h2.addListener("execute", me.__insHeading2, me);
                cont.add(h2);
                var h3 = new btClass("", "sm/cms/icon/16/wiki/text_heading_3.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                h3.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Heading 3")));
                h3.addListener("execute", me.__insHeading3, me);
                cont.add(h3);
                var b = new btClass("Жирный", "sm/cms/icon/16/wiki/text_bold.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                b.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Bold")));
                b.addListener("execute", me.__insBold, me);
                cont.add(b);
                var it = new btClass("Курсив", "sm/cms/icon/16/wiki/text_italic.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                it.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Italic")));
                it.addListener("execute", me.__insItalic, me);
                cont.add(it);
                var ul = new btClass("Список", "sm/cms/icon/16/wiki/text_list_bullets.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                ul.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Bullet list")));
                ul.addListener("execute", me.__insUL, me);
                cont.add(ul);
                var ol = new btClass("Нумерованный", "sm/cms/icon/16/wiki/text_list_numbers.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                ol.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Numbered list")));
                ol.addListener("execute", me.__insOL, me);
                cont.add(ol);
                var pl = new btClass("Ссылка", "sm/cms/icon/16/wiki/link_add.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                pl.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Link to another page")));
                pl.addListener("execute", me.__insPageRef, me);
                cont.add(pl);
                var img = new btClass("Медиа", "sm/cms/icon/16/wiki/image_add.png").set(apperance ? {appearance : "textarea-editor-tbbt"} : {});
                img.setToolTip(new qx.ui.tooltip.ToolTip(me.tr("Add image|link to file")));
                img.addListener("execute", me.__insAttachment, me);
                cont.add(img);
            };

            if (!sm.lang.String.isEmpty(sm.cms.Application.APP_STATE._getStateConstant("wikiHelp"))) {
                var helpButton = new qx.ui.toolbar.Button("Help", "sm/icons/misc/help16.png");
                toolbar.add(helpButton);
                helpButton.addListener("execute", function() {
                    qx.bom.Window.open(sm.cms.Application.APP_STATE._getStateConstant("wikiHelp"));
                });
            }

            createBaseControls(toolbar, qx.ui.toolbar.Button, "textarea-editor-tbbt");

            var overflow = new qx.ui.toolbar.MenuButton("More...");
            var overflowMenu = new qx.ui.menu.Menu();
            overflow.setMenu(overflowMenu);
            createBaseControls(overflowMenu, qx.ui.menu.Button, null);
            toolbar.add(overflow);

            toolbar.addSpacer();

            toolbar.set({"show" : "icon"});
            toolbar.setOverflowIndicator(overflow);
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});