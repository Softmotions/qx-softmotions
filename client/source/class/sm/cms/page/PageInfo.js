/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.page.PageInfo", {
      extend : qx.ui.core.Widget,
      include : [qx.ui.core.MChildrenHandling],

      events :
      {

          /**
           * User clicked button to edit page
           * data: [pageId]
           */
          "editPage" : "qx.event.type.Data"
      },

      construct : function() {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox(4));

          ///////////////////////////////////////////////////////////////////////////
          //                          Summary container                            //
          ///////////////////////////////////////////////////////////////////////////

          var il = new qx.ui.layout.Grid();
          il.setSpacing(6);
          il.setColumnFlex(0, 0);
          il.setColumnFlex(1, 0);
          il.setColumnAlign(0, "right", "top");
          var ic = this.__infoContainer = new qx.ui.container.Composite(il);

          var grefs = this.__grefs = {};

          ic.add(new qx.ui.basic.Label(this.tr("Название:")).set({font : "bold"}), {row : 0, column : 0});
          grefs["nameLabel"] = new qx.ui.basic.Label("");
          ic.add(grefs["nameLabel"], {row : 0, column : 1});

          ic.add(new qx.ui.basic.Label(this.tr("Изменена:")).set({font : "bold"}), {row : 1, column : 0});
          grefs["changedLabel"] = new qx.ui.basic.Label("");
          ic.add(grefs["changedLabel"], {row : 1, column : 1});

          grefs["statusAtom"] = new qx.ui.basic.Atom().set({
                rich : true,
                decorator : "main",
                padding : 5,
                allowGrowY: false
            });
          ic.add(grefs["statusAtom"], {row : 2, column : 0, colSpan: 2});

          var cRow = new qx.ui.container.Composite(new qx.ui.layout.HBox(4));

          grefs["editButton"] = new qx.ui.form.Button().set({allowGrowX : false, allowGrowY : false});
          grefs["editButton"].addListener("execute", this._editPage, this);
          cRow.add(grefs["editButton"]);

          grefs["viewButton"] = new qx.ui.form.Button(this.tr("Просмотр"));
          grefs["viewButton"].addListener("execute", this._viewPage, this);
          cRow.add(grefs["viewButton"]);

          ic.add(cRow, {row : 3, column : 1});

          this.set({padding : 10});
          this._add(ic);

          ///////////////////////////////////////////////////////////////////////////
          //                         Page access table                             //
          ///////////////////////////////////////////////////////////////////////////

          var at = this.__accessTable = new sm.cms.page.PageAccessTable();
          this._add(at, {flex : 1});
      },

      members :
      {

          __grefs : null,

          __infoContainer : null,

          __accessTable : null,

          __pageInfo : null,


          setPage : function(pageRef) {
              qx.core.Assert.assertString(pageRef);
              var req = new sm.io.Request(sm.cms.Application.ACT.getUrl("page.info"), "GET", "application/json");
              req.setParameter("ref", pageRef, false);
              req.setParameter("exclude", ["attrs", "extra"], false);

              req.send(function(resp) {
                  this.__pageInfo = resp.getContent();
                  this._initInfo();
                  this._initPageAccess();
                  this.setEditEnabled(true);
              }, this);
          },

          _initInfo : function() {
              var grefs = this.__grefs;
              var pi = this.__pageInfo;

              grefs["nameLabel"].setValue(pi["name"] ? pi["name"] : "");
              grefs["changedLabel"].setValue(isNaN(pi["mdate"]) ? "" : new Date(parseInt(pi["mdate"])).toLocaleString());

              var status = grefs["statusAtom"];

              if (pi["asm"] != null) {
                  status.setLabel(pi["published"] ? this.tr("Эта страница может быть отображена") : this.tr("Эта страница не опубликована"));
                  status.setBackgroundColor(pi["published"] ? "#C0FFC0" : "#FFFFBF");
                  status.show();

                  grefs["editButton"].setLabel(this.tr("Редактировать"));
                  if (!pi["_editable_"]) {
                      grefs["editButton"].exclude();
                  } else {
                      grefs["editButton"].show();
                  }
                  grefs["viewButton"].show();
              } else {
                  status.exclude();
                  grefs["editButton"].setLabel(this.tr("Создать страницу"));
                  grefs["editButton"].show();
                  grefs["viewButton"].exclude();
              }
          },

          _initPageAccess : function() {

              var pi = this.__pageInfo;
              var at = this.__accessTable;
              var apps = sm.cms.Application.APP_STATE;

              if (pi["asm"] == null ||
                (apps.getUserId() != pi["owner"] && !apps.userInRoles(["structure.admin", "users.admin"]))) {
                  at.hide();
                  return;
              }
              at.setPage(pi["_id"]);
              at.show();
          },

          _editPage : function() {
              if (this.__pageInfo != null) {
                  this.fireDataEvent("editPage", [this.__pageInfo["_id"]]);
              }
          },

          _viewPage : function() {
              if (this.__pageInfo != null) {
                  var pp = sm.cms.Application.ACT.getUrl("page.preview");
                  qx.bom.Window.open(pp + this.__pageInfo["_id"],
                    this.tr("Предпросмотр").toString() + " " + this.__pageInfo["name"],
                    {}, false, false);
              }
          },

          setEditEnabled : function(val) {
              this.__grefs["editButton"].setEnabled(val);
          }
      },

      destruct : function() {
          this.__infoContainer = this.__grefs = this.__pageInfo = this.__accessTable = null;
      }
  });
