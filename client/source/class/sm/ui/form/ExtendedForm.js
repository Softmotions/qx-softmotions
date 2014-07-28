/**
 * Simple qx.ui.form.Form
 * with extra features included.
 */

qx.Class.define("sm.ui.form.ExtendedForm", {
    extend : qx.ui.form.Form,

    construct : function() {
        this.base(arguments);
    },

    members : {

        /**
         * Save all form items values into given json `obj`.
         * Only items with provided `getValue` function are supported.
         * Every item value is saved under item form key.
         *
         * @param obj {Object?} Resulted JSON object.
         * @param asStrings {Boolean?false} Populate form values as strings
         * @param notNulls {Boolean?false} Save only not null values
         * @returns {Object}
         */
        populateJSONObject : function(obj, asStrings, notNulls) {
            obj = obj || {};
            var items = this.getItems();
            for (var k in items) {
                var item = items[k];
                var val;
                if (typeof item.getValue === "function") {
                    val = item.getValue();
                } else if (typeof item.getModelSelection === "function") {
                    var ms = item.getModelSelection();
                    if (ms && ms.length === 1) {
                        val = ms.getItem(0);
                    }
                } else {
                    continue;
                }
                if (val != null && asStrings) {
                    val = val.toString();
                }
                if (val == null && notNulls) {
                    continue;
                }
                obj[k] = val;

            }
            return obj;
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});