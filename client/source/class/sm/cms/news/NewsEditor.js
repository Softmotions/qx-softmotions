/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.news.NewsEditor", {
    extend  : sm.cms.editor.PageEditor,

    events :
    {
        /**
         * If this panel wants to be active
         */
        "activatePanel" : "qx.event.type.Event"
    },

    /**
     * @param ws {sm.cms.news.NewsWorkspace}
     */
    construct : function(ws) {
        this.base(arguments, {tmplCategory : "news", "pickFirstTemplate" : true});
        var complete = new qx.ui.form.Button(this.tr("Cancel"));
        complete.addListener("execute", function() {
            sm.cms.Application.confirm(this.tr("Going to management news page will destroy all unsaved changes! Continue?"), function(res) {
                if (res) {
                    this.disposeForm();
                    ws.fireEvent("activatePanel");
                }
            }, this);
        }, this);
        this._grefs["save"].setLabel(this.tr("Save and close"));
        this._grefs["hdr.hcont"].add(complete);
        this.addListener("pageSaved", function(ev) {
            var preview = ev.getData();
            if (!preview) {
                this.disposeForm();
                ws.fireEvent("activatePanel");
            }
        });
        ws.addListener("newNews", this.__newnews, this);
        ws.addListener("editNews", this.__editnews, this);
    },

    members :
    {

        __newsCats : null,


        setPageInfo : function(pageInfo, opts, cb, callBase) {
            opts = opts || {};
            var me = this;
            if (callBase == true) {
                this.base(arguments, pageInfo, opts, cb);
                return;
            }
            if (pageInfo == null) {
                this.__newsCats = [];
            }
            if (pageInfo != null && pageInfo["refpage"] != null && pageInfo["refpage"]["$id"]) {
                var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.info"), "GET", "application/json");
                req.setParameter("ref", pageInfo["refpage"]["$id"], false);
                req.setParameter("include", ["asm", "attrs.newscats"], false);
                req.setParameter("_news_", true, false);
                req.send(function(resp) {
                    me.__newsCats = [];
                    var res = resp.getContent();
                    if (res && res["_news_"]) {
                        opts["tmplCategory"] = res["_news_"]["news_pages_category"];
                    }
                    if (res && res["attrs"] && res["attrs"]["newscats"]) {
                        var ncats = res["attrs"]["newscats"];
                        if (qx.lang.Type.isArray(ncats.value)) {
                            me.__newsCats = [].concat(ncats.value);
                            me.__newsCats.sort();
                        }
                    }
                    me.setPageInfo(pageInfo, opts, cb, true);
                })
            } else {
                me.setPageInfo(pageInfo, opts, cb, true);
            }
        },


        _handleUnknownEditor : function(edName, options) {
            if (edName == "newsCategory") {
                var copts = options ? qx.lang.Object.clone(options) : {};
                /*copts["items"] = [
                 {"name" : this.tr("Категория не выбрана").toString(), "value" : ""}
                 ].concat(this.__newsCats);*/
                copts["items"] = this.__newsCats;

                return new sm.cms.editor.SelectBoxEditor(copts);
            }
            return this.base(arguments, edName, options);
        },

        /**
         * Edit existing news
         */
        __editnews : function(ev) {
            var me = this;
            var pid = ev.getData();
            this.setPage(pid, {}, function() {
                me.fireEvent("activatePanel");
            });
        },

        /**
         * Creating new news
         */
        __newnews : function(ev) {
            var me = this;
            var data = ev.getData();
            var name = data[0];
            var refpage = data[1];
            qx.core.Assert.assertString(name);
            qx.core.Assert.assertString(refpage);

            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("news.new",
              "name", name,
              "refpage", refpage),
              "GET", "application/json");
            req.send(function(resp) {
                var doc = resp.getContent();
                this.setPage(doc["_id"], {}, function() {
                    me.fireEvent("activatePanel");
                });
            }, this);
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});

