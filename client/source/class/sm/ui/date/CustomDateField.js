/**
 * Настраиваемое поле выбора даты
 */
qx.Class.define("sm.ui.date.CustomDateField", {
    extend  : qx.ui.form.DateField,

    construct : function() {
        this.base(arguments);
    },

    events :
    {
        /**
         * Событие при смене месяца
         */
        "showMonth" : "qx.event.type.Data"
    },

    members :
    {

        // overridden
        _createChildControlImpl : function(id) {
            var control;
            switch (id) {
                case "list":
                    control = new sm.ui.date.CustomDateChooser(null, this);
                    control.setFocusable(false);
                    control.setKeepFocus(true);
                    control.addListener("execute", this._onChangeDate, this);
                    break;
            }
            return control || this.base(arguments, id);
        },


        forEachDays : function(callback, thisarg) {
            var dchooser = this.getChildControl("list");
            dchooser.forEachDays(callback, thisarg);
        },


        /**
         *  Вызывается при смене месяца из sm.ui.date.CustomDateChooser
         */
        showMonth : function(month, year) {
            var data = {
                "month" : month,
                "year" : year
            }
            this.fireDataEvent("showMonth", data);
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});