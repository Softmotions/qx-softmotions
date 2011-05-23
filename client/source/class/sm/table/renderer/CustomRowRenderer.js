/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * CustomRowRenderer
 */
qx.Class.define("sm.table.renderer.CustomRowRenderer", {
      extend : qx.core.Object,
      implement : qx.ui.table.IRowRenderer,

      /*
       *****************************************************************************
       CONSTRUCTOR
       *****************************************************************************
       */

      construct : function() {
          this.base(arguments);

          this.__fontStyleString = "";
          this.__fontStyleString = {};

          this.__colors = {};

          // link to font theme
          this._renderFont(qx.theme.manager.Font.getInstance().resolve("default"));

          // link to color theme
          var colorMgr = qx.theme.manager.Color.getInstance();
          this.__colors.bgcolFocusedSelected = colorMgr.resolve("table-row-background-focused-selected");
          this.__colors.bgcolFocused = colorMgr.resolve("table-row-background-focused");
          this.__colors.bgcolSelected = colorMgr.resolve("table-row-background-selected");
          this.__colors.bgcolEven = colorMgr.resolve("table-row-background-even");
          this.__colors.bgcolOdd = colorMgr.resolve("table-row-background-odd");
          this.__colors.colSelected = colorMgr.resolve("table-row-selected");
          this.__colors.colNormal = colorMgr.resolve("table-row");
          this.__colors.horLine = colorMgr.resolve("table-row-line");
      },




      /*
       *****************************************************************************
       PROPERTIES
       *****************************************************************************
       */

      properties :
      {
          /** Whether the focused row should be highlighted. */
          highlightFocusRow :
          {
              check : "Boolean",
              init : true
          },

          bgColorInterceptor  :
          {
              check : "Function",
              nullable : true
          }

      },



      /*
       *****************************************************************************
       MEMBERS
       *****************************************************************************
       */

      members :
      {
          __colors : null,
          __fontStyle : null,
          __fontStyleString : null,


          /**
           * the sum of the vertical insets. This is needed to compute the box model
           * independent size
           */
          _insetY : 1, // borderBottom

          /**
           * Render the new font and update the table pane content
           * to reflect the font change.
           *
           * @param font {qx.bom.Font} The font to use for the table row
           */
          _renderFont : function(font) {
              if (font) {
                  this.__fontStyle = font.getStyles();
                  this.__fontStyleString = qx.bom.element.Style.compile(this.__fontStyle);
                  this.__fontStyleString = this.__fontStyleString.replace(/"/g, "'");
              }
              else {
                  this.__fontStyleString = "";
                  this.__fontStyle = qx.bom.Font.getDefaultStyles();
              }
          },


          __getBgColor : function(rowInfo) {
              var i = this.getBgColorInterceptor();
              var color = null;
              if (i != null) {
                  color = i(rowInfo);
              }
              if (color == null) {
                  color = (rowInfo.row % 2 == 0) ? this.__colors.bgcolEven : this.__colors.bgcolOdd;
              }
              return color;
          },


          // interface implementation
          updateDataRowElement : function(rowInfo, rowElem) {
              var fontStyle = this.__fontStyle;
              var style = rowElem.style;

              // set font styles
              qx.bom.element.Style.setStyles(rowElem, fontStyle);

              if (rowInfo.focusedRow && this.getHighlightFocusRow()) {
                  style.backgroundColor = rowInfo.selected ? this.__colors.bgcolFocusedSelected : this.__colors.bgcolFocused;
              }
              else {
                  if (rowInfo.selected) {
                      style.backgroundColor = this.__colors.bgcolSelected;
                  }
                  else {
                      style.backgroundColor = this.__getBgColor(rowInfo);
                  }
              }

              style.color = rowInfo.selected ? this.__colors.colSelected : this.__colors.colNormal;
              style.borderBottom = "1px solid " + this.__colors.horLine;
          },


          /**
           * Get the row's height CSS style taking the box model into account
           *
           * @param height {Integer} The row's (border-box) height in pixel
           */
          getRowHeightStyle : function(height) {
              if (qx.core.Environment.get("css.boxmodel") == "content") {
                  height -= this._insetY;
              }

              return "height:" + height + "px;";
          },


          // interface implementation
          createRowStyle : function(rowInfo) {
              var rowStyle = [];
              rowStyle.push(";");
              rowStyle.push(this.__fontStyleString);
              rowStyle.push("background-color:");

              if (rowInfo.focusedRow && this.getHighlightFocusRow()) {
                  rowStyle.push(rowInfo.selected ? this.__colors.bgcolFocusedSelected : this.__colors.bgcolFocused);
              }
              else {
                  if (rowInfo.selected) {
                      rowStyle.push(this.__colors.bgcolSelected);
                  }
                  else {
                      rowStyle.push(this.__getBgColor(rowInfo));
                  }
              }

              rowStyle.push(';color:');
              rowStyle.push(rowInfo.selected ? this.__colors.colSelected : this.__colors.colNormal);

              rowStyle.push(';border-bottom: 1px solid ', this.__colors.horLine);

              return rowStyle.join("");
          },


          getRowClass : function(rowInfo) {
              return "";
          },

          /**
           * Add extra attributes to each row.
           *
           * @param rowInfo {Object}
           *   The following members are available in rowInfo:
           *   <dl>
           *     <dt>table {qx.ui.table.Table}</dt>
           *     <dd>The table object</dd>
           *
           *     <dt>styleHeight {Integer}</dt>
           *     <dd>The height of this (and every) row</dd>
           *
           *     <dt>row {Integer}</dt>
           *     <dd>The number of the row being added</dd>
           *
           *     <dt>selected {Boolean}</dt>
           *     <dd>Whether the row being added is currently selected</dd>
           *
           *     <dt>focusedRow {Boolean}</dt>
           *     <dd>Whether the row being added is currently focused</dd>
           *
           *     <dt>rowData {Array}</dt>
           *     <dd>The array row from the data model of the row being added</dd>
           *   </dl>
           *
           * @return {String}
           *   Any additional attributes and their values that should be added to the
           *   div tag for the row.
           */
          getRowAttributes : function(rowInfo) {
              return "";
          }
      },




      /*
       *****************************************************************************
       DESTRUCTOR
       *****************************************************************************
       */

      destruct : function() {
          this.__colors = this.__fontStyle = this.__fontStyleString = null;
      }
  });