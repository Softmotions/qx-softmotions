qx.Class.define("sm.model.SingleClickCBCellEditor", {

    extend : qx.core.Object,
    implement : qx.ui.table.ICellEditorFactory,


    members :
    {

        //overriden
        createCellEditor : function(cellInfo) {
            var editor = new qx.ui.container.Composite(new qx.ui.layout.HBox().set({
                alignX: "center",
                alignY: "middle"
            })).set({
                focusable: true
            });

            var checkbox = new qx.ui.form.CheckBox().set({
                value: !cellInfo.value
            });
            editor.add(checkbox);

            // propagate focus
            editor.addListener("focus", function() {
                checkbox.focus();
            });

            // propagate active state
            editor.addListener("activate", function() {
                checkbox.activate();
            });

            return editor;
        },

        getCellEditorValue : function(cellEditor) {
            return cellEditor.getChildren()[0].getValue();
        }
    }
});