/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Редактор баннера
 */
qx.Class.define("sm.cms.banners.BannersEditor", {
    extend  :  qx.ui.container.Composite,

    events :
    {
    },

    construct : function() {
        this.base(arguments);

        var layout = new qx.ui.layout.VBox(5);
        this._setLayout(layout);
        this.set({padding : 10});

        this.__grefs = [];
        this.__banners = {};
        this.__viewOptions = {};

        var i = -1;

        this.__grefs["name"] = new qx.ui.basic.Label("");

        // кнопка сохранить
        var save = new qx.ui.form.Button(this.tr("Сохранить"));
        save.addListener("execute", this.__saveBanner, this);
        this.__grefs["save"] = save;

        var hcont = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));

        hcont.add(this.__grefs["name"], {flex : 0});
        hcont.add(new qx.ui.core.Spacer(), {flex : 1});
        hcont.add(this.__grefs["save"], {flex : 0});

        // поле выбора категории медиа раздела
        var category = new sm.ui.form.ButtonField(null, "sm/cms/icon/16/wiki/link_add.png");
        category.setReadOnly(true);
        category.setEnabled(false);
        category.addListener("execute", this.__categoryDlgOpen, this);

        this.__grefs["category"] = category;

        this.__grefs["banners"] = this.__banners = new sm.cms.banners.BannersTable();

        this.__banners.getSelectionModel().addListener("changeSelection", this.__rowSelected, this);

        this.__infoSide = new qx.ui.container.Composite();

        var iLayout = new qx.ui.layout.Grid();
        iLayout.setSpacing(6);
        iLayout.setColumnFlex(0, 0);
        iLayout.setColumnFlex(1, 1);
        iLayout.setColumnAlign(0, "right", "top");
        this.__infoSide.setLayout(iLayout);

        this.__iPreviewBox = new qx.ui.groupbox.GroupBox(this.tr("Изображение"));
        var pLayout = new qx.ui.layout.HBox(5, "center");
        this.__iPreviewBox.setLayout(pLayout);

        this.__iPreview = new qx.ui.basic.Image();
        var hbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(0).set({alignY : "middle", alignX: "center"}));
        hbox.add(this.__iPreview);
        var scroll = new qx.ui.container.Scroll();
        scroll.add(hbox);
        this.__iPreviewBox.add(scroll, {flex: 1});


        this.add(this.__infoSide);
        this.add(this.__iPreviewBox, {flex: 1});

        this.__iPreviewBox.hide();

        // помещаем полученные элементы  на экран
        ++i;
        this.__infoSide.add(new qx.ui.basic.Label(this.tr("Расположение:")), {row : i, column : 0});
        this.__infoSide.add(hcont, {row : i, column : 1});

        ++i;
        this.__infoSide.add(new qx.ui.basic.Label(this.tr("Медиа категория:")), {row : i, column : 0});
        this.__infoSide.add(this.__grefs["category"], {row : i, column : 1});

        ++i;
        this.__infoSide.add(new qx.ui.basic.Label(this.tr("Банеры:")), {row : i, column : 0});
        this.__infoSide.add(this.__grefs["banners"], {row : i, column : 1});
    },

    members :
    {
        __viewOptions : null,

        __infoSide : null,

        __iPreview : null,

        __iPreviewBox : null,

        __grefs : null,

        __bannerType : null,

        __bannerCategory : null,

        /**
         * Вызывается при открытии кона редактирования
         * Получаем с сервера информацию о настройках выбранного банера
         */
        setBanner : function(bannerType) {
            qx.core.Assert.assertString(bannerType);
            this.__bannerType = bannerType;
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("banner.info"), "GET", "application/json");
            req.setParameter("type", bannerType, false);
            req.send(this.__loadBannerData, this);
        },

        /**
         * Обрабатываем ответ сервера с настройками банера
         */
        __loadBannerData : function(resp) {
            var bi = resp.getContent();

            var bname = this.__grefs["name"];
            bname.setValue(bi["name"] || "");

            var bcategory = this.__grefs["category"];
            bcategory.setValue(bi["_categoryPath"] || "");
            bcategory.setReadOnly(true);
            bcategory.setEnabled(true);
            this.__bannerCategory = bi["category"] || "";

            this.__banners.setBanners(bi["banners"] || []);
        },

        /**
         * Для выбранного раздела медиа ресурсов загружаем список файлов
         */
        __loadMediaList : function() {
            if (!this.__bannerCategory) {
                this.__applyBanners([]);
                return;
            }

            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("medialib.list"), "GET", "application/json");
            req.setParameter("ref", this.__bannerCategory, false);
            req.setParameter("type", 1, false);
            req.send(function(resp) {
                var files = resp.getContent();
                var obanners = this.__banners.getBannersMap();
                var banners = [];
                // для каждого файла строим мета-данные банера
                for (var i = 0; i < files.length; ++ i) {
                    var file = files[i];
                    banners.push({
                        id: file["_id"],
                        name: file["name"],
                        // пытаемся смерджить с уже существующими данными
                        description: obanners[file["_id"]] ? obanners[file["_id"]].description || "" : "",
                        weight: obanners[file["_id"]] ? obanners[file["_id"]].weight : 1,
                        link: obanners[file["_id"]] ? obanners[file["_id"]].link || "" : ""
                    });
                }
//                  обновляем таблицу с банерами
                this.__banners.setBanners(banners);
            }, this);
        },

        /**
         * Category selector dialog
         */
        __categoryDlgOpen: function(ev) {
            var dlg = new sm.cms.media.MediaLibLinkDlg({fileSelectable: false});
            dlg.addListener("branchSelected", function(ev) {
                var sp = ev.getData();
                var cname = "";
                var hr = sp[1];
                for (var i = 0; i < hr.length; ++i) {
                    cname += "/" + hr[i];
                }
                this.__grefs["category"].setValue(cname);

                this.__bannerCategory = sp[0];
                this.__loadMediaList();
                dlg.close();
            }, this);
            dlg.open();
        },

        /**
         * Fired when new banner row selected
         */
        __rowSelected : function(ev) {
            this.__iPreview.setSource(null);

            var sind = this.__banners.getSelectedRowIndex()
            if (sind >= 0) {
                var mediaRef = this.__banners.getSelectedRowData();
                if (!mediaRef) {
                    return;
                }

                var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("medialib.info"), "GET", "application/json");
                req.setParameter("ref", mediaRef, false);
                req.send(function(resp) {
                    var i = -1;
                    var pi = resp.getContent();
                    var msource = sm.cms.Application.ACT.getUrl("media.get", "ref", "media" + mediaRef);
                    if (pi["contentType"] && pi["contentType"].indexOf("image/") == 0) {
                        this.__iPreview.setSource(msource);
                        this.__iPreviewBox.show();
                    } else {
                        this.__iPreview.setSource(null);
                        this.__iPreviewBox.hide();
                    }
                }, this);
            } else {
                this.__iPreviewBox.hide();
            }
        },

        /**
         * Сохраняем настройки банера
         */
        __saveBanner: function() {
            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("banner.save"), "POST", "application/json");
            req.setParameter("type", this.__bannerType, true);
            req.setParameter("category", this.__bannerCategory, true);
            req.setParameter("banners", qx.util.Json.stringify(this.__banners.getBanners()), true);

            this.__grefs["save"].setEnabled(false);

            req.send(function(resp) {
                sm.cms.Application.alert(this.tr("Настройки банера были успешно сохранены"));
                // после сохранения обновляем информацию на странице
                this.__loadBannerData(resp);
            }, this);

            req.addListenerOnce("finished", function() {
                this.__grefs["save"].setEnabled(true);
            }, this);
        }
    },

    destruct : function() {
        this.__bannerType = this.__bannerCategory = null;
        this._disposeObjects();
    }
});