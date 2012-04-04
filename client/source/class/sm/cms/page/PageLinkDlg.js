/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.PageLinkDlg", {
    extend  : qx.ui.window.Window,

    events :
    {
        /**
         * Fired if page was selected,
         * data: [pageId, linkName, pageHierachy]
         */
        pageSelected : "qx.event.type.Data",

        /**
         * Fired if outer link was selected
         * data: [link, linkName]
         */
        linkSelected : "qx.event.type.Data",


        /**
         * data: [otherNodeId]
         */
        otherSelected : "qx.event.type.Data",


        /**
         * Fired when dialog closed
         */
        close : "qx.event.type.Event"
    },

    properties :
    {

        /**
         * Page ID will be opened in nav hierarchy during init()
         */
        ensureOpened : {
            check : "String",
            nullable : true
        }
    },

    construct : function(options) {
        this.__options = options = options || {};
        this.base(arguments, options["caption"] || this.tr("Link to page"), null);
        this.setLayout(new qx.ui.layout.VBox(5));
        this.set({
            modal         : true,
            showMinimize  : false,
            showMaximize  : true,
            allowMaximize : true,
            width : 340,
            height : 460
        });

        this.__closeCmd = new qx.ui.core.Command("Esc");
        this.__closeCmd.addListener("execute", function() {
            this.close();
        }, this);

        this.addListenerOnce("resize", function() {
            this.center();
        }, this);

        this.__navCont = new sm.cms.nav.NavResources(this.tr("Choose page or section"),
          "pages", options["qMods"]);
        this.add(this.__navCont, {flex : 1});


        //Page name form
        var form = new qx.ui.form.Form();

        if (options["includeLinkName"] == null || options["includeLinkName"] == true) {
            var lname = new qx.ui.form.TextField().set({required : options["requireLinkName"] === undefined ? true : !!options["requireLinkName"]});
            if (options.linkText != null && options.linkText != "") {
                lname.setValue(options.linkText);
            }
            form.add(lname, this.tr("Link text"));
        }

        var outLink = new qx.ui.form.TextField();
        outLink.setPlaceholder("http://");

        if (options["allowOuterLinks"] === true) {
            form.add(outLink, this.tr("Or set external link"));
            outLink.addListener("input", function() {
                ok.setEnabled((outLink.getValue() != "" && outLink.getValue() != null));
            });
        }

        var fr = new sm.ui.form.OneColumnFormRenderer(form);
        this.add(fr);

        var footer = new qx.ui.container.Composite(new qx.ui.layout.HBox(5).set({alignX : "right"}));
        var ok = new qx.ui.form.Button(options["oklabel"] ? options["oklabel"] : this.tr("Insert link"));
        ok.addListener("execute", function(ev) {
            if (!form.validate()) {
                return;
            }
            if (outLink.getValue() != "" && outLink.getValue() != null) {
                if (outLink.getValue().indexOf("://") == -1) {
                    outLink.setValue("http://" + outLink.getValue());
                }
                this.fireDataEvent("linkSelected", [outLink.getValue(), lname ? lname.getValue() : ""]); //Outer link selected
            } else if (this.__currentPage != null) {
                var hr = this.__navCont.getHierarchy(this.__currentPageNode); //obtain hierarchy
                if (hr.length > 0) {
                    hr.shift();
                }
                this.fireDataEvent("pageSelected", [this.__currentPage, lname ? lname.getValue() : this.__currentPageNode.label, hr]); //Inner page selected
            } else if (options["allowOther"] && this.__otherId != null) {
                this.fireDataEvent("otherSelected", [this.__otherId]);
            }
        }, this);
        var cancel = new qx.ui.form.Button(this.tr("Cancel"));
        cancel.addListener("execute", function(ev) {
            this.close();
        }, this);

        ok.setEnabled(false);
        footer.add(ok);
        footer.add(cancel);
        this.add(footer);

        this.__navCont.addListener("selectPage", function(ev) {
            var opts = this.__options;
            var data = ev.getData();
            if (!data[2] && !options["withNoAsm"]) { //no asm for page
                ok.setEnabled(false);
                if (lname && (opts.linkText == null || opts.linkText == "")) {
                    lname.setValue("");
                }
                this.__currentPage = null;
                return;
            }
            if (lname && (opts.linkText == null || opts.linkText == "")) {
                var label = data[1].label;
                lname.setValue(label);
            }
            ok.setEnabled(true);
            this.__currentPage = data[0];
            this.__currentPageNode = data[1];
            this.__otherId = null;
        }, this);

        this.__navCont.addListener("selectOther", function(ev) {
            var data = ev.getData();
            var opts = this.__options;
            if (!opts["allowOther"]) {
                ok.setEnabled(false);
            } else {
                ok.setEnabled(true);
            }
            if (lname && (opts.linkText == null || opts.linkText == "")) {
                lname.setValue("");
            }
            this.__currentPage = null;
            this.__currentPageNode = null;
            this.__otherId = data[0];
        }, this);
    },

    members :
    {

        __otherId : null,

        __currentPage : null,

        __currentPageNode : null,


        __navCont : null,

        __closeCmd : null,

        __options : null,

        open : function() {
            this.base(arguments);
            this.__navCont.init(this.getEnsureOpened());
        },

        __dispose : function() {
            if (this.__closeCmd) {
                this.__closeCmd.setEnabled(false);
            }
            this.__currentPage = this.__currentPageNode = this.__options = null;
            this._disposeObjects("__closeCmd", "__navCont");
        },


        close : function() {
            this.base(arguments);
            this.__dispose();
            this.fireEvent("close");
        }

    },

    destruct : function() {
        this.__dispose();
        //this._disposeObjects("__field_name");
    }
});