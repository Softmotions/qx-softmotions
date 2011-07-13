/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Menu editor
 */
qx.Class.define("sm.cms.editor.MenuEditor", {
      extend : qx.ui.container.Composite,
      implement : [
          qx.ui.form.IStringForm,
          qx.ui.form.IForm
      ],
      include : [
          qx.ui.form.MForm
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
      },

      /**
       * Create menu editor window
       * @param options
       *          "main" - if not <code>true</code> adds checkbox for override default menu by local page menu
       */
      construct : function(options) {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox());

          this.__options = options = options || {};
          var subscriptions = options["pageInfo"]["_subscriptions"] || {};

          var synchronize = subscriptions[options["attrName"]];
          var view = this.__form = this.__mtable =
            new sm.cms.editor.MenuTable({
                  "allowOuterLinks" : !!options["allowOuterLinks"],
                  "synchronizable" : !!options["synchronizable"],
                  "synchronizeCallback" : qx.lang.Function.bind(this.__manageSync, this),
                  "pageInfo" : options["pageInfo"]
              });

          if (synchronize) {
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.info"), "POST", "application/json");
              req.setParameter("ref", synchronize);
              req.setParameter("include", ["cachedPath"], false);
              req.setAsynchronous(false);
              req.send(function(resp){
                  this.__mtable.setSynchronize(true, resp.getContent());
              }, this);
          }

          this.__allowOuterLinks = !!options["allowOuterLinks"];
          if (!options["main"]) {
              var form = this.__form = new qx.ui.form.Form();

              var activeCheckBox = this.__active = new qx.ui.form.CheckBox().set({value : !!options["main"]});
              var activeCb = function() {
                  var active = activeCheckBox.getValue();
                  var items = form.getItems();
                  for (var k in items) {
                      if (k == "_active_") {
                          continue;
                      }
                      if (active) {
                          items[k].setEnabled(true);
                          items[k].show();
                      } else {
                          items[k].setEnabled(false);
                          items[k].exclude();
                      }

                  }
              };
              activeCheckBox.addListener("changeValue", activeCb, this);
              form.add(activeCheckBox, this.tr("переопределить"), null, "_active_");

              form.add(this.__mtable, this.tr("настройки"), null, "_menu_");

              view = new sm.cms.util.FlexFormRenderer(form);

              activeCb();
          }

          this.add(view, {flex : 1});
      },

      members :
      {
          __options: null,
          __active : null,
          __mtable  : null,

          __manageSync: function(enable) {
              if (enable) {
                  var dlg = new sm.cms.page.PageLinkDlg({
                        "oklabel": this.tr("Выбрать"),
                        "requireLinkName": false,
                        "allowOuterLinks" : false
                    });
                  dlg.addListener("pageSelected", function(ev) {
                      var data = ev.getData();
                      if (this.__options.pageInfo && this.__options.pageInfo["_id"] == data[0]) {
                          sm.cms.Application.alert(this.tr("Нельзя синхронизовывать с тойже страницей!"));
                          return;
                      }

                      this.__mtable.setEnabled(false);
                      var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.update.attrsync"), "POST", "application/json");
                      req.setParameter("ref", this.__options["pageInfo"]["_id"]);
                      req.setParameter("enable", true);
                      req.setParameter("attribute", this.__options["attrName"]);
                      req.setParameter("parent", data[0]);
                      req.send(function(resp) {
                          var state = resp.getContent();
                          if (!state || !state.state) {
                              sm.cms.Application.alert(this.tr("Невозможно синхронизоваться с выбранной страницей!"));
                              return;
                          }

                          this.__mtable.setEnabled(true);

                          var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.info"), "POST", "application/json");
                          req.setParameter("ref", this.__options["pageInfo"]["_id"]);
                          req.setParameter("include", ["asm", "attrs."+this.__options["attrName"], "cachedPath"], false);
                          req.send(function(resp){
                              var pdata = resp.getContent();

                              // TODO: it is hack =(
                              var attr = pdata["attrs"][this.__options["attrName"]];

                              this.setValue(attr ? attr.value : {});
                              this.__mtable.setSynchronize(true, {cachedPath: "/" + data[2].join("/")});

                              dlg.close();
                          }, this);
                      }, this);
                  }, this);
                  dlg.open();
              } else {
                  sm.cms.Application.confirm(this.tr("Вы действительно хотите отключить синхронизацию?"),
                    qx.lang.Function.bind(function(res) {
                        if (res) {
                            this.__mtable.setEnabled(false);
                            var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.update.attrsync"), "POST", "application/json");
                            req.setParameter("ref", this.__options["pageInfo"]["_id"]);
                            req.setParameter("enable", false);
                            req.setParameter("attribute", this.__options["attrName"]);
                            req.send(function(resp) {
                                this.__mtable.setEnabled(true);
                                this.__mtable.setSynchronize(false);
                            }, this);
                        }
                    }, this)
                  );
              }

          },

          ///////////////////////////////////////////////////////////////////////////
          //                            StringForm stuff                           //
          ///////////////////////////////////////////////////////////////////////////


          // overridden
          setValue : function(value) {
              value = value || {};
              if (!qx.lang.Type.isObject(value)) {
                  qx.log.Logger.error(this, "Value is not object", value);
                  value = {};
              }

              value.items = value.items || [];
              if (!qx.lang.Type.isArray(value.items)) {
                  qx.log.Logger.error(this, "Value items is not array", value.items);
                  value.items = [];
              }
              this.__mtable.setValue(value.items);

              value.active = value.active || !!this.__options["main"];
              if (this.__active) {
                  this.__active.setValue(value.active);
              }

              this.fireDataEvent("changeValue", value);
          },

          // overridden
          resetValue : function() {
              this.setValue({});
          },

          // overridden
          getValue : function() {
              return {
                  active: !!this.__options["main"] || this.__active && this.__active.getValue(),
                  items: this.__mtable.getValue()
              };
          }
      },

      destruct : function() {
          this._disposeObjects("__options", "__form");
      }
  });

