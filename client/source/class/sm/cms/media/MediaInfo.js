/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.media.MediaInfo", {
    extend  :  qx.ui.container.Composite,

    events :
    {

        /**
         * User clicked button to edit media
         * data: [mediaId]
         */
        "editMedia" : "qx.event.type.Data"
    },

    construct : function() {
        this.base(arguments);

        var layout = new qx.ui.layout.VBox(5);
        this._setLayout(layout);

        this.__infoSide = new qx.ui.container.Composite();

        var iLayout = new qx.ui.layout.Grid();
        iLayout.setSpacing(6);
        iLayout.setColumnFlex(0, 0);
        iLayout.setColumnFlex(1, 0);
        iLayout.setColumnAlign(0, "right", "top");
        this.__infoSide.setLayout(iLayout);

        this.__iPreviewBox = new qx.ui.groupbox.GroupBox(this.tr("Image"));
        var pLayout = new qx.ui.layout.HBox(5, "center");
        this.__iPreviewBox.setLayout(pLayout);

        this.__iPreview = new qx.ui.basic.Image();
        var scroll = new qx.ui.container.Scroll();
        scroll.add(this.__iPreview);
        this.__iPreviewBox.add(scroll, {flex: 1});


        this.add(this.__infoSide);
        this.add(this.__iPreviewBox, {flex: 1});

        this.__iPreviewBox.hide();

        this.set({padding : 10});
    },

    members :
    {
        __infoSide : null,

        __iPreviewBox : null,

        setMedia : function(mediaRef) {
            qx.core.Assert.assertString(mediaRef);
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("medialib.info"), "GET", "application/json");
            req.setParameter("ref", mediaRef, false);
            req.send(function(resp) {
                var i = -1;
                var pi = resp.getContent();
                this._disposeArray(this.__infoSide.removeAll());

                ++i;
                this.__infoSide.add(new qx.ui.basic.Label(this.tr("Name") + ":").set({font : "bold"}), {row : i, column : 0});
                this.__infoSide.add(new qx.ui.basic.Label(pi["name"] ? pi["name"] : ""), {row : i, column : 1});

                ++i;
                var cdate = isNaN(pi["cdate"]) ? "" : new Date(parseInt(pi["cdate"])).toLocaleString();
                this.__infoSide.add(new qx.ui.basic.Label(this.tr("Created:")).set({font : "bold"}), {row : i, column : 0});
                this.__infoSide.add(new qx.ui.basic.Label(cdate), {row : i, column : 1});

                ++i;
                var mdate = isNaN(pi["mdate"]) ? "" : new Date(parseInt(pi["mdate"])).toLocaleString();
                this.__infoSide.add(new qx.ui.basic.Label(this.tr("Changed") + ":").set({font : "bold"}), {row : i, column : 0});
                this.__infoSide.add(new qx.ui.basic.Label(mdate), {row : i, column : 1});

                var msource = sm.cms.Application.ACT.getUrl("media.get", "ref", "media" + mediaRef);
                if (pi["type"] == 1) {
                    ++i;
                    var download = new qx.ui.form.Button(this.tr("Download"));
                    download.addListener("execute", function(event) {
                        qx.bom.Window.open(msource, "Download_window", {width : 500, height : 400, status : "no", toolbar : "no" ,menubar : "no"});
                    }, this);
                    this.__infoSide.add(download, {row : i, column : 1});
                }

                if (pi["contentType"] && pi["contentType"].indexOf("image/") == 0) {
                    this.__iPreview.setSource(msource);
                    this.__iPreviewBox.show();
                } else {
                    this.__iPreview.setSource(null);
                    this.__iPreviewBox.hide();
                }
            }, this);
        }
    },

    destruct : function() {
        this._disposeObjects();
    }
});
