/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.model.CalendarCellEditor", {

    extend : qx.core.Object,
    implement : qx.ui.table.ICellEditorFactory,


    members :
    {

        //overriden
        createCellEditor : function(cellInfo) {
            var chooser =  new qx.ui.control.DateChooser();
            var oldval = cellInfo.value;
            if (oldval) {
                chooser.setValue(oldval);
            }

            var popup = new qx.ui.popup.Popup(new qx.ui.layout.Basic());
            popup.set({
                autoHide: true,
                position: "bottom-right"
            });
            popup.add(chooser);

            var editor = new qx.ui.container.Composite(new qx.ui.layout.HBox());

            editor['$$chooser'] = chooser;
            editor.set({
                focusable: true
            });

            editor.addListener("appear", function() {
                popup.placeToWidget(editor, true);
                popup.show();
            });

            chooser.addListener("changeValue", function(e) {
                qx.log.Logger.warn(e.getData());
            });

            // propagate focus
            editor.addListener("focus", function() {
                chooser.focus();
            });

            // propagate active state
            editor.addListener("activate", function() {
                chooser.activate();
            });

            return editor;
        },

        getCellEditorValue : function(cellEditor) {
            return cellEditor['$$chooser'].getValue();
        }
    }
});