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
          var layout = new qx.ui.layout.Grid();
          layout.setSpacing(6);
          layout.setColumnFlex(0, 0);
          layout.setColumnFlex(1, 1);
          layout.setColumnAlign(0, "right", "top");
          this._setLayout(layout);
          this.set({padding : 10});

          this.__grefs = [];
          this.__banners = {};

          var i = -1;

          this.__grefs["name"] = new qx.ui.basic.Label("");

          // поле выбора категории медиа раздела
          var category = new sm.ui.form.ButtonField(null, "sm/cms/icon/16/wiki/link_add.png");
          category.setReadOnly(true);
          category.setEnabled(false);
          category.addListener("execute", function(ev) {
              var dlg = new sm.cms.media.MediaLibLinkDlg({fileSelectable: false});
              var categorySelected = function(ev) {
                  var sp = ev.getData();
                  var cname = "";
                  var hr = sp[1];
                  for (var i = 0; i < hr.length; ++i) {
                      cname += "/" + hr[i];
                  }
                  category.setValue(cname);

                  this.__bannerCategory = sp[0];
                  this.__loadMediaList();
                  dlg.close();
              };
              dlg.addListener("branchSelected", categorySelected, this);
              dlg.open();
          }, this);

          this.__grefs["category"] = category;

          // инициализируем таблицу с банерами
          var tm = new sm.model.JsonTableModel();
          var tce = new sm.model.TextFieldCellEditor();
          tce.getValidationFunction = function() {
              return function(value, oldValue) {
                  return value < 0 ? oldValue : value;
              }
          };
          this.__setJsonTableData(tm, []);
          var banners = new sm.table.Table(tm, tm.getCustom()).set({
                "statusBarVisible" : false,
                "showCellFocusIndicator" : false});
          banners.getTableColumnModel().setCellEditorFactory(1, tce);
          banners.addListener("dataEdited", this.__dataEdited, this);
          banners.setContextMenuHandler(0, this.__bannersCtxMenuHandler, this);
          banners.setContextMenuHandler(1, this.__bannersCtxMenuHandler, this);
          banners.setContextMenuHandler(2, this.__bannersCtxMenuHandler, this);

          this.__grefs["banners"] = banners;


          // кнопка сохранить
          var hcont = new qx.ui.container.Composite(new qx.ui.layout.HBox(5));

          var save = new qx.ui.form.Button(this.tr("Сохранить"));
          save.addListener("execute", this.__saveBanner, this);
          hcont.add(new qx.ui.core.Spacer(), {flex : 1});
          hcont.add(save, {flex : 0});

          this.__grefs["save"] = save;


          // помещаем полученные элементы  на экран
          ++i;
          this.add(new qx.ui.basic.Label(this.tr("Расположение:")), {row : i, column : 0});
          this.add(this.__grefs["name"], {row : i, column : 1});

          ++i;
          this.add(new qx.ui.basic.Label(this.tr("Медиа категория:")), {row : i, column : 0});
          this.add(this.__grefs["category"], {row : i, column : 1});

          ++i;
          this.add(new qx.ui.basic.Label(this.tr("Банеры:")), {row : i, column : 0});
          this.add(this.__grefs["banners"], {row : i, column : 1});

          ++i;
          this.add(hcont, {row : i, column : 1});
      },

      members :
      {

          __grefs : null,

          __banners : null,

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
           * Context menu
           */
          __bannersCtxMenuHandler : function(col, row, table, dataModel, contextMenu) {
              var bid = dataModel.getRowAssociatedData(row);
              if (!bid) {
                  return false;
              }
              var bt;
              var me = this;

              bt = new qx.ui.menu.Button(this.tr("Ссылка"));
              bt.addListener("execute", function(ev) {
                  var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : true, includeLinkName : false});
                  var pageSelected = function(ev) {
                      var sp = ev.getData();
                      var pspec = sp[0].indexOf("://") != -1 ? sp[0] : ("/exp/p" + sp[0]);
                      var rows = dataModel.getData();
                      rows[row][2] = pspec;
                      dataModel.setData(rows);

                      me.__banners[bid].link = pspec;

                      dlg.close();
                  };
                  dlg.addListener("pageSelected", pageSelected, this);
                  dlg.addListener("linkSelected", pageSelected, this);
                  dlg.open();
              }, this);
              contextMenu.add(bt);

              return true;
          },

          /**
           * Обрабатываем ответ сервера с настройками банера
           */
          __loadBannerData : function(resp) {
              var bi = this.__bannerInfo = resp.getContent();

              var bname = this.__grefs["name"];
              bname.setValue(bi["name"] || "");

              var bcategory = this.__grefs["category"];
              bcategory.setValue(bi["_categoryPath"] || "");
              bcategory.setReadOnly(true);
              bcategory.setEnabled(true);
              this.__bannerCategory = bi["category"] || "";

              this.__applyBanners(bi["banners"] || []);
          },

          /**
           * Генерируем строки данных для таблицы, на основе мета-данных банера
           */
          __applyBanners : function(banners) {
              var btable = this.__grefs["banners"];
              var tm = btable.getTableModel();
              if (btable.isEditing()) {
                  btable.stopEditing();
              }
              btable.getSelectionModel().resetSelection();

              var items = [];
              this.__banners = {};
              for (var i = 0; i < banners.length; ++i) {
                  var banner = banners[i];
                  this.__banners[banner.id] = banner;
                  items.push([
                      [banner.name, banner.weight, banner.link],
                      banner.id
                  ]);
              }

              this.__setJsonTableData(tm, items);
          },

          /**
           * Генерация данных таблицы, на основе переданных элементов
           */
          __setJsonTableData : function(tm, banners) {
              var data = {
                  "title" : "",
                  "columns" : [
                      {
                          "title" : this.tr("Название").toString(),
                          "id" : "name",
                          "sortable" : true,
                          "width" : "1*"
                      },
                      {
                          "title" : this.tr("Вес").toString(),
                          "id" : "weight",
                          "sortable" : true,
                          "width" : "1*",
                          "type" : "number",
                          "editable" : true
                      },
                      {
                          "title" : this.tr("Ссылка").toString(),
                          "id" : "link",
                          "sortable" : true,
                          "width" : "1*"
                      }
                  ],
                  "items" : banners
              };
              tm.setJsonData(data);
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
                  var banners = [];
                  // для каждого файла строим мета-данные банера
                  for (var i = 0; i < files.length; ++ i) {
                      var file = files[i];
                      banners.push({
                            id: file["_id"],
                            name: file["name"],
                            // пытаемся смерджить с уже существующими данными
                            weight: this.__banners[file["_id"]] ? this.__banners[file["_id"]].weight : 1,
                            link: this.__banners[file["_id"]] ? this.__banners[file["_id"]].link || "" : ""
                        });
                  }
                  // обновляем таблицу с банерами
                  this.__applyBanners(banners)
              }, this);
          },

          /**
           * Обработчик события об изменении данных в таблице
           */
          __dataEdited : function(ev) {
              var edata = ev.getData();
              if (edata.col != 1) {
                  return;
              }

              var bid = this.__grefs["banners"].getTableModel().getRowAssociatedData(edata.row);
              this.__banners[bid].weight = +edata.value;
          },

          /**
           * Сохраняем настройки банера
           */
          __saveBanner: function() {
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("banner.save"), "POST", "application/json");
              req.setParameter("type", this.__bannerType, true);
              req.setParameter("category", this.__bannerCategory, true);
              req.setParameter("banners", qx.util.Json.stringify(qx.lang.Object.getValues(this.__banners)), true);

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
          this.__banners = null;
          this._disposeMap("__grefs");
      }
  });