/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.cms.page.PageSelector", {
      extend : qx.ui.core.Widget,
      include : [qx.ui.core.MChildrenHandling],

      events :
      {

          /**
           * Event fired if page was selected/deselected
           *
           * data: var item = {
           *        "name" : {String} Page name,
           *        "mdate" : {Number} Modify datetime,
           *        "published" : {Boolean} is published,
           *        "template" : {String} page assembly name,
           *        "refpage" : {String} Id of referenced page
           *        "type" : {Integer} doc["type"]
           *};
           * or null if selection cleared
           */
          "pageSelected" : "qx.event.type.Data"

      },

      properties :
      {

          constViewSpec : {
              check : "Object",
              nullable : true
          }
      },

      construct : function(constViewSpec) {
          this.base(arguments);
          this._setLayout(new qx.ui.layout.VBox(4));

          var sbox = new qx.ui.container.Composite(new qx.ui.layout.HBox(4).set({alignY : "middle"})).set({padding : [5, 5, 0, 5] });
          sbox.add(new qx.ui.basic.Label(this.tr("Поиск")));

          var stext = this.__stext = new qx.ui.form.TextField().set({maxLength : 64});
          stext.addListener("keydown", function(ev) {
              if (ev.getKeyCode() == 13) {
                  ev.stop();
                  this.__search();
              }
          }, this);
          sbox.add(stext, {flex : 1});

          var sbut = new qx.ui.form.Button(this.tr("Искать"));
          sbut.addListener("execute", this.__search, this);
          sbox.add(sbut);
          this._add(sbox);

          var pt = this.__table = new sm.cms.page.PageTable().set({
                "statusBarVisible" : false,
                "showCellFocusIndicator" : false});

          pt.getSelectionModel().addListener("changeSelection", function(ev) {
              var page = this.getSelectedPage();
              this.fireDataEvent("pageSelected", page ? page : null);
          }, this);

          this._add(pt, {flex : 1});

          if (constViewSpec) {
              this.setConstViewSpec(constViewSpec);
          }
      },

      members :
      {

          __table : null,

          __stext : null,

          setViewSpec : function(vspec) {
              this.__table.getTableModel().setViewSpec(this.__createViewSpec(vspec));
          },

          updateViewSpec : function(vspec) {
              this.__table.getTableModel().updateViewSpec(this.__createViewSpec(vspec));
          },

          getTable : function() {
              return this.__table;
          },

          getSelectedPageInd : function() {
              return this.__table.getSelectedPageInd();
          },

          getSelectedPage : function() {
              return this.__table.getSelectedPage();
          },

          cleanup : function() {
              this.__table.cleanup();
          },

          getSearchField : function() {
              return this.__stext;
          },

          _applyEnabled : function(val) {
              this.base(arguments);
              var children = this._getChildren();
              for (var i = 0; i < children.length; ++i) {
                  children[i].setEnabled(val);
              }
          },

          /**
           * Perform pages search
           */
          __search : function() {
              this.__table.resetSelection();
              var val = this.__stext.getValue();
              var vspec = (val != null && val != "" ? {stext : val} : {});
              this.setViewSpec(this.__createViewSpec(vspec));
          },

          __createViewSpec : function(vspec) {
              if (this.getConstViewSpec() == null) {
                  return vspec;
              }
              var nspec = {};
              qx.lang.Object.carefullyMergeWith(nspec, this.getConstViewSpec());
              qx.lang.Object.carefullyMergeWith(nspec, vspec);
              return nspec;
          }
      },

      destruct : function() {
          this.__table = this.__stext = null;
          //this._disposeObjects("__field_name");
      }
  });
