/**
 * Simple qx.ui.form.Form
 * with extra features included.
 */

qx.Class.define("sm.ui.form.ExtendedForm", {
    extend : qx.ui.form.Form,

    statics : {
    },

    events : {
    },

    properties : {
    },

    construct : function() {
        this.base(arguments);
    },

    members : {

        /**
         * Save all form items values into given json `obj`.
         * Only items with provided `getValue` function are supported.
         * Every item value is saved under item form key.
         *
         * @param obj {{}} Resulted JSON object.
         * @returns {{}}
         */
        populateJSONObject : function(obj) {
            obj = obj || {};
            var items = this.getItems();
            for (var k in items) {
                var item = items[k];
                if (typeof item.getValue === "function") {
                    obj[k] = item.getValue();
                }

            }
            return obj;
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});