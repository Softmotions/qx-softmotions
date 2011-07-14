/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.cms.editor.wiki.TableDlgCRenderer", {
    extend : qx.ui.table.cellrenderer.Conditional,

    members :
    {
        _getCellStyle : function(cellInfo) {
            if (cellInfo.row == 0) { //First row is the header
                return "font-weight:bold;";
            } else {
                return this.base(arguments, cellInfo);
            }
        }
    }
});

