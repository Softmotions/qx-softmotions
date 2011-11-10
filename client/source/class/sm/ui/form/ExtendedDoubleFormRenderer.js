/**
 * Allows single form element in full row
 * via item option: {fullRow : true}
 */
qx.Class.define("sm.ui.form.ExtendedDoubleFormRenderer", {
    extend  : qx.ui.form.renderer.Double,

    construct : function(form) {
        this.base(arguments, form);
    },

    members :
    {

        addItems : function(items, names, title, options) {
            // add the header
            if (title != null) {
                this._add(
                        this._createHeader(title), {row: this._row, column: 0, colSpan: 4}
                );
                this._row++;
            }

            // add the items
            for (var i = 0, j = 0; i < items.length; i++,j++) {
                var label = this._createLabel(names[i], items[i]);
                this._add(label, {row: this._row, column: (j * 2) % 4});
                var item = items[i];
                label.setBuddy(item);

                this._connectVisibility(item, label);

                if (options[i] && options[i]["fullRow"]) {
                    this._add(item, {row: this._row, column: ((j * 2) % 4) + 1, colSpan : 3});
                    this._row++;
                    j += 1;
                } else {
                    this._add(item, {row: this._row, column: ((j * 2) % 4) + 1});
                    if (j % 2 == 1) {
                        this._row++;
                    }
                }

                // store the names for translation
                if (qx.core.Environment.get("qx.dynlocale")) {
                    this._names.push({name: names[i], label: label, item: items[i]});
                }
            }

            if (j % 2 == 1) {
                this._row++;
            }
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});