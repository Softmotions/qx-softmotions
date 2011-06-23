/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*
 #asset(sm/cms/icon/16/wiki/*)
 */

qx.Class.define("sm.cms.editor.wiki.WikiEditor", {
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
              this.__insSurround(1, "=", this.tr("Текст заголовка"), " ");
          },

          __insHeading2 : function() {
              this.__insSurround(2, "=", this.tr("Текст заголовка"), " ");
          },

          __insHeading3 : function() {
              this.__insSurround(3, "=", this.tr("Текст заголовка"), " ");
          },

          __insBold : function() {
              this.__insSurround(1, "'''", this.tr("Текст выделенный жирным"));
          },

          __insItalic : function() {
              this.__insSurround(1, "''", this.tr("Текст выделенный курсивом"));
          },

          __insOL : function() {
              var val = [];
              val.push("");
              val.push("# Один");
              val.push("# Два");
              val.push("## Первый у второго");
              val.push("# Три");
              val.push("");
              this.__insAdd(val.join("\n"));
          },

          __insUL : function() {
              var val = [];
              val.push("");
              val.push("* Один");
              val.push("* Два");
              val.push("** Первый у второго");
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
              var value = ta.getValue();
              if (value == null) value = "";
              var scrollY = tel.getScrollY();


              var dlg = new sm.cms.page.PageLinkDlg({allowOuterLinks : true});

              var pageSelected = function(ev) {
                  var sp = ev.getData();

                  var nval = [];
                  nval.push(value.substring(0, sStart));
                  var pspec = sp[0].indexOf("://") != -1 ? ("[[" + sp[0] + "|" + sp[1] + "]]") : ("[[page:" + sp[0] + "|" + sp[1] + "]]");
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

          __insTable : function() {
              var ta = this.__getTextArea();
              var tel = ta.getContentElement();
              var sStart = this._getSelectionStart();
              var sEnd = this._getSelectionEnd();
              var value = ta.getValue();
              if (value == null) value = "";
              var scrollY = tel.getScrollY();

              var dlg = new sm.cms.editor.wiki.TableDlg();
              dlg.addListener("insertTable", function(ev) {
                  var tm = ev.getData()[0];
                  var isWide = ev.getData()[1];
                  /*
                   {| class="table01"
                   |-
                   ! Header 1
                   ! Header 2
                   ! Header 3
                   |-
                   | row 1, cell 1
                   | row 1, cell 2
                   | row 1, cell 3
                   |-
                   | row 2, cell 1
                   | row 2, cell 2
                   | row 2, cell 3
                   |}
                   */
                  var nval = [];
                  var tspec = [];
                  tspec.push("");
                  tspec.push("{| class=" + (isWide == true ? "'tableWide'" : "'tableShort'"));
                  var cc = tm.getColumnCount();
                  var rc = tm.getRowCount();
                  for (var i = 0; i < rc; ++i) {
                      tspec.push("|-");
                      var rdata = tm.getRowData(i);
                      for (var j = 0; j < cc; ++j) {
                          var cval = (rdata != null && rdata[j] != null) ? rdata[j] : "";
                          tspec.push((i == 0 ? "! " : "| ") + cval);
                      }
                  }
                  tspec.push("|}");
                  tspec.push("");

                  var tspecStr = tspec.join("\n");

                  nval.push(value.substring(0, sStart));
                  nval.push(tspecStr);
                  nval.push(value.substring(sEnd));

                  ta.setValue(nval.join(""));

                  var finishPos = sStart + tspecStr.length;
                  ta.setTextSelection(finishPos, finishPos);
                  tel.scrollToY(scrollY);

                  dlg.close();
              }, this);

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

                  var mspec = ["[["];
                  if (!isImg || (isImg && ltext != null && link == null)) {
                      mspec.push("Media");
                      isMedia = true;
                  } else {
                      mspec.push("Image");
                  }
                  mspec.push(":");
                  mspec.push(this.getPageRef() + fname);
                  if (!isMedia) {
                      mspec.push("|");
                      mspec.push("link=");
                      if (link != null) {
                          link = qx.lang.String.trim(link);
                          if (link.indexOf("http://") != 0 && link.indexOf("https://") != 0) {
                              link = "http://" + link;
                          }
                          mspec.push(link);
                      }
                  }
                  if (ltext != null) {
                      mspec.push("|");
                      mspec.push(ltext);
                  } else if (isMedia) {
                      mspec.push("|");
                      mspec.push(fname);
                  }
                  mspec.push("]]");

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


          __insTree : function() {
              var val = [];
              val.push("");
              val.push("<tree open=\"true\">");
              val.push("- Корень");
              val.push("-- Потомок 1");
              val.push("--- Потомок третьего уровня");
              val.push("-- Потомок 2");
              val.push("</tree>");
              val.push("");
              this.__insAdd(val.join("\n"));
          },


          __insNote : function() {
              var val = [];
              val.push("");
              val.push("<note>");
              val.push("Текст заметки");
              val.push("</note>");
              val.push("");
              this.__insAdd(val.join("\n"));
          },


          __createToolbarControls : function(toolbar) {
              var h1 = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_heading_1.png").set({appearance : "textarea-editor-tbbt"});
              h1.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Заголовок первого уровня")));
              h1.addListener("execute", this.__insHeading1, this);
              toolbar.add(h1);
              var h2 = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_heading_2.png").set({appearance : "textarea-editor-tbbt"});
              h2.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Заголовок второго уровня")));
              h2.addListener("execute", this.__insHeading2, this);
              toolbar.add(h2);
              var h3 = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_heading_3.png").set({appearance : "textarea-editor-tbbt"});
              h3.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Заголовок третьего уровня")));
              h3.addListener("execute", this.__insHeading3, this);
              toolbar.add(h3);
              var b = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_bold.png").set({appearance : "textarea-editor-tbbt"});
              b.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Жирный шрифт")));
              b.addListener("execute", this.__insBold, this);
              toolbar.add(b);
              var it = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_italic.png").set({appearance : "textarea-editor-tbbt"});
              it.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Курсив")));
              it.addListener("execute", this.__insItalic, this);
              toolbar.add(it);
              var ul = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_list_bullets.png").set({appearance : "textarea-editor-tbbt"});
              ul.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Список")));
              ul.addListener("execute", this.__insUL, this);
              toolbar.add(ul);
              var ol = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/text_list_numbers.png").set({appearance : "textarea-editor-tbbt"});
              ol.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Нумерованный список")));
              ol.addListener("execute", this.__insOL, this);
              toolbar.add(ol);
              var pl = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/link_add.png").set({appearance : "textarea-editor-tbbt"});
              pl.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Ссылка на другую страницу")));
              pl.addListener("execute", this.__insPageRef, this);
              toolbar.add(pl);
              var img = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/image_add.png").set({appearance : "textarea-editor-tbbt"});
              img.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Добавить изображение|ссылку на файл")));
              img.addListener("execute", this.__insAttachment, this);
              toolbar.add(img);
              var tbl = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/table_add.png").set({appearance : "textarea-editor-tbbt"});
              tbl.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Добавить таблицу")));
              tbl.addListener("execute", this.__insTable, this);
              toolbar.add(tbl);
              var tree = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/tree_add.png").set({appearance : "textarea-editor-tbbt"});
              tree.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Добавить дерево")));
              tree.addListener("execute", this.__insTree, this);
              toolbar.add(tree);
              var note = new qx.ui.toolbar.Button("", "sm/cms/icon/16/wiki/note_add.png").set({appearance : "textarea-editor-tbbt"});
              note.setToolTip(new qx.ui.tooltip.ToolTip(this.tr("Создать заметку")));
              note.addListener("execute", this.__insNote, this);
              toolbar.add(note);
          }
      },

      destruct : function() {
          //this._disposeObjects("__field_name");
      }
  });