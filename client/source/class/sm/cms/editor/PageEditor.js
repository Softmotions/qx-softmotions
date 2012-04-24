/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Редактор страниц
 */
qx.Class.define("sm.cms.editor.PageEditor", {
    extend  : qx.ui.container.Composite,


    statics :
    {
        PAGE_PROVIDERS : [],

        registerEditorProvider : function(provider) {
            if (provider != null && typeof provider === "function") {
                this.PAGE_PROVIDERS.push(provider);
            } else {
                qx.log.Logger.warn(this, "Provider must be: function(editorName, editorOpts){...}");
            }
        }
    },

    events :
    {
        /**
         * data: {Boolean} true if page saved for preview
         */
        "pageSaved" : "qx.event.type.Data"
    },

    properties :
    {

    },

    /**
     * Options keys:
     *
     *  tmplCategory {String?null} : Category name for page templates
     *
     * @param opts {Object?null} options keys
     */
    construct : function(opts) {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.VBox(5));

        this._opts = opts = opts || {};
        this._grefs = [];

        if (opts["tmplCategory"] != null) {
            this._tmplCategory = opts["tmplCategory"];
        } else {
            this._opts["tmplCategory"] = null;
        }

        var header = new qx.ui.container.Composite(new qx.ui.layout.VBox(5)).set({margin : 10});
        this._grefs["hdr"] = header;
        var el = this._grefs["hdr.pageName"] = new qx.ui.basic.Label("")
          .set({font : new qx.bom.Font(16, ["Verdana", "sans-serif"])}); //todo theme it!
        header.add(el);

        //Horizontal header container
        var hcont = this._grefs["hdr.hcont"] = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));

        //Select page type
        el = this._grefs["hdr.pagetype"] = new qx.ui.form.SelectBox();
        el.add(new qx.ui.form.ListItem(this.tr("Section"), null, "0"));
        el.add(new qx.ui.form.ListItem(this.tr("Page"), null, "1"));
        this._grefs["hdr.pagetype"].exclude();
        hcont.add(el, {flex : 0});

        //Select template box
        el = this._grefs["hdr.templates"] = new qx.ui.form.SelectBox();
        el.getModelSelection().addListener("change", function(ev) {
            var data = ev.getData();
            var arr = ev.getTarget();
            if (arr && arr.length > 0 && (data.type == "order")) {
                this._showInTemplate(arr.getItem(0));
            }
        }, this);
        hcont.add(el, {flex : 1});

        el = this._grefs["preview"] = new qx.ui.form.Button(this.tr("Preview"));
        el.addListener("execute", this.__previewPage, this);
        hcont.add(el, {flex : 0});

        //Save button
        el = this._grefs["save"] = new qx.ui.form.Button(this.tr("Save"));
        el.addListener("execute", function() {
            this.__savePage(function() {
                sm.cms.Application.alert(this.tr("Page has been successfully saved"));
                this.fireDataEvent("pageSaved");
            }, this);
        }, this);
        hcont.add(el, {flex : 0});

        header.add(hcont);
        this.add(header, {flex : 0});

        el = this._grefs["workspace_scroll"] = new qx.ui.container.Scroll().set({margin : 10});
        this._grefs["workspace"] = new qx.ui.container.Composite(new qx.ui.layout.Grow());
        el.add(this._grefs["workspace"]);

        this.add(el, {flex : 1});

    },

    members :
    {

        /**
         * GUI widget refs map
         */
        _grefs : null,

        /**
         * Currently loaded page info
         */
        _pageInfo : null,


        /**
         * Category for page templates
         */
        _tmplCategory : null,


        _opts : null,


        setPageInfo : function(pageInfo, opts, cb) {
            qx.core.Assert.assertObject(pageInfo);
            this._pageInfo = pageInfo;
            this._grefs["hdr.pageName"].setValue(pageInfo["name"]);
            this._loadPageTemplates(opts, cb);
            if (this._pageInfo["_amask_"].indexOf("d") != -1 && (this._pageInfo["type"] == 0 || this._pageInfo["type"] == 1)) {
                var val = "" + this._pageInfo["type"]
                this._grefs["hdr.pagetype"].setModelSelection([val]);
                this._grefs["hdr.pagetype"].show();
            } else {
                this._grefs["hdr.pagetype"].exclude();
            }
        },

        setPage : function(pageRef, opts, cb) {
            qx.core.Assert.assertString(pageRef);
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.info"), "GET", "application/json");
            req.setParameter("ref", pageRef);
            req.send(function(resp) {
                this.setPageInfo(resp.getContent(), opts, cb);
            }, this);
        },

        disposeForm : function() {
            if (this._grefs["form"]) {
                this._grefs["form"].dispose();
                this._grefs["form"] = null;
            }
        },

        _loadPageTemplates : function(opts, cb) {
            opts = opts || {};

            var tselect = this._grefs["hdr.templates"];
            var tselectItems = tselect._getItems();
            var me = this;

            var syncTSelection = function() { //Select appropriate item in templates list
                var selected = false;
                for (var i = 0; i < tselectItems.length; ++i) {
                    var tm = tselectItems[i].getModel() || {};
                    if (tm["asm"] == me._pageInfo["asm"]) {
                        tselect.setModelSelection([tm]);
                        if (tm["asm"] != null) {
                            selected = true;
                        }
                        break;
                    }
                }
                if (!selected && me._opts["pickFirstTemplate"] && tselectItems.length > 1) { //if only one element in templates list
                    tselect.setSelection([tselectItems[1]]);
                }
                if (cb) {
                    cb();
                }
            };

            if (opts["tmplCategory"] != null && opts["tmplCategory"] != this._tmplCategory) {
                this._tmplCategory = opts["tmplCategory"];
            } else if (opts["tmplCategory"] == null) { //reset to default
                this._tmplCategory = this._opts["tmplCategory"];
            }
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.templates"), "GET", "application/json");
            req.setParameter("asm", me._pageInfo["asm"], false);
            if (this._tmplCategory != null) {
                req.setParameter("category", this._tmplCategory, false);
            }
            req.send(function(resp) {
                tselect.removeAll();
                tselect.add(new qx.ui.form.ListItem(this.tr("Template does not select/page does not exist"), null, {}));
                var respTemplates = resp.getContent();
                if (qx.lang.Type.isArray(respTemplates)) {
                    for (var i = 0; i < respTemplates.length; ++i) {
                        tselect.add(new qx.ui.form.ListItem(respTemplates[i]["name"], null, respTemplates[i]));
                    }
                }
                tselectItems = tselect._getItems();
                syncTSelection();
            }, this);
        },


        _showInTemplate : function(templateItem) {
            var ws = this._grefs["workspace"];
            if (!this._pageInfo || !templateItem || !templateItem["asm"]) {
                this._grefs["preview"].setEnabled(false);
                if (this._pageInfo) {
                    delete this._pageInfo["asm"];
                }
                ws.removeAll();
                return;
            }
            ws.removeAll();
            var pageInfo = this._pageInfo;
            pageInfo["asm"] = templateItem["asm"];

            //qx.log.Logger.info("pageinfo=" + qx.lang.Json.stringify(pageInfo));

            //             {"asm":"exp.base_content",
            //             "name":"Обычная страница",
            //             "meta":{"title":{"label":"Заголовок страницы","required":true},
            //                     "name":{"label":"Заголовок","required":true, "default":"bla bla"},
            //                     "content":{"label":"Содержимое","editor":"wiki"}}}

            this.disposeForm();

            var form = this._grefs["form"] = new qx.ui.form.Form();
            var vmgr = form.getValidationManager();
            vmgr.setRequiredFieldMessage(this.tr("This field is required"));

            var publishedCb = new qx.ui.form.CheckBox();
            publishedCb.setValue(pageInfo["published"] == true);
            form.add(publishedCb, this.tr("Published"), null, "published");

            //form.addGroupHeader(this.tr("Основное"));
            if (qx.lang.Type.isObject(templateItem["meta"])) {
                var meta = templateItem["meta"];
                var index = 0;
                for (var p in meta) {
                    var mItem = meta[p];
                    if (mItem == null) {
                        continue
                    }
                    this.__setupPageAttr(form, p, mItem, pageInfo, index++);
                }
            }
            var fr = new sm.ui.form.FlexFormRenderer(form);
            ws.add(fr);

            //Enable save button
            this._grefs["save"].setEnabled(true);
            this._grefs["preview"].setEnabled(true);
        },

        __setupPageAttr : function(form, attrName, mItem, pageInfo, index) {
            var res = null;

            if (mItem.role != null && !sm.cms.Application.userInRoles(mItem.role)) { //Field access
                return;
            }

            var editor = mItem["editor"];
            var edName = qx.lang.Type.isString(editor) ? editor : (editor ? editor["name"] : null);
            var edOptions = (edName == editor || editor == null ? {} : editor);
            edOptions["attrName"] = attrName;
            edOptions["pageInfo"] = pageInfo;

            switch (edName) {
                case "wiki" :
                    res = new sm.cms.editor.wiki.WikiEditor(edOptions).set({allowGrowX : true, allowGrowY : true, autoSize : true, minimalLineHeight : 6});
                    res.setPageRef(pageInfo["_id"]); //todo remove?
                    break;
                case "checkbox" :
                    res = new qx.ui.form.CheckBox();
                    break;
                case "tags" :
                    res = new sm.cms.editor.TagsField(edOptions);
                    break;
                case "menu" :
                    res = new sm.cms.editor.MenuEditor(edOptions);
                    break;
                case "universal" :
                    res = new sm.cms.editor.UniversalEditor(edOptions);
                    break;
                case "image" :
                    res = new sm.cms.editor.ImageEditor(edOptions);
                    break;
                case "textarea" :
                    res = new sm.cms.editor.TextAreaEditor(edOptions);
                    break;
                case "textfield" :
                    res = new sm.cms.editor.TextFieldEditor(edOptions);
                    break;
                case "singleselect" :
                    res = new sm.cms.editor.SelectBoxEditor(edOptions);
                    break;
                default :
                    res = this._handleUnknownEditor(edName, edOptions);
                    break;
            }
            if (mItem.required) {
                res.setRequired(true);
            }
            form.add(res, (mItem.label ? mItem.label : ""),
              ((typeof res.getValidator === "function") ? res.getValidator() : null),
              "attr." + attrName);
            this.__setupElementValue(res, attrName, mItem, pageInfo);
            return res;
        },

        _handleUnknownEditor : function(edName, options) {
            var ppList = this.self(arguments).PAGE_PROVIDERS;
            var editor = null;
            for (var i = 0; i < ppList.length; ++i) {
                var pp = ppList[i];
                try {
                    editor = pp.call(pp, edName, options);
                } catch(e) {
                    qx.log.Logger.error(this, "Page provider throws error", e);
                }
                if (editor != null) {
                    return editor;
                }
            }
            return new sm.cms.editor.TextFieldEditor(options);
        },

        __setupElementValue : function(el, attrName, mItem, pageInfo) {
            var val = null;
            var attrs = pageInfo["attrs"];
            if (qx.lang.Type.isObject(attrs)) {
                var attrObj = attrs[attrName];
                val = attrs[attrName] ? attrObj.value : null;
            }
            if (val == null || val == undefined) {
                val = mItem["default"];
            }
            if (val != null && val != undefined && qx.lang.Type.isFunction(el.setValue)) {
                el.setValue(val);
            }
            if (mItem["placeholder"] && qx.lang.Type.isFunction(el.setPlaceholder)) {
                el.setPlaceholder(mItem["placeholder"]);
            }
            return val;
        },

        __previewPage : function() {
            if (this._pageInfo == null || this._pageInfo["_id"] == null) {
                return;
            }
            this.__savePage(function() {
                var pp = sm.cms.Application.ACT.getUrl("page.preview");
                qx.bom.Window.open(pp + this._pageInfo["_id"],
                  "Preview",
                  {}, false, false);
                this.fireDataEvent("pageSaved", true); //preview flag
            }, this);
        },

        /**
         * Сохранияем страницу с введенными параметрами
         */
        __savePage : function(cb, self) {
            var form = this._grefs["form"];
            if (!form || !form.validate()) {
                sm.cms.Application.alert(this.tr("Please complete all required fields of page template"));
                return;
            }
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.save"), "POST", "application/json");
            req.setParameter("ref", this._pageInfo["_id"], true);
            if (this._pageInfo["asm"] != null) {
                req.setParameter("asm", this._pageInfo["asm"], true);
                var items = form.getItems();
                for (var name in items) {
                    var item = items[name];
                    if (qx.lang.Type.isFunction(item.getValue)) {
                        var val = item.getValue();
                        if (val != null) {
                            if (qx.lang.Type.isString(val)) {
                                req.setParameter(name, val, true);
                            } else {
                                req.setParameter(name, qx.lang.Json.stringify(val), true);
                            }
                        }
                    }
                }
            }

            if (!this._grefs["hdr.pagetype"].isExcluded()) {
                var val = this._grefs["hdr.pagetype"].getModelSelection().getItem(0);
                req.setParameter("type", val, true);
            }
            this._grefs["save"].setEnabled(false);
            this._grefs["preview"].setEnabled(false);

            req.send(cb, self);

            req.addListenerOnce("finished", function() {
                this._grefs["save"].setEnabled(true);
                this._grefs["preview"].setEnabled(true);
            }, this);
        }
    },

    destruct : function() {
        this._pageInfo = null;
        this._disposeMap("_grefs");
        this._disposeObjects("_opts");
    }
});