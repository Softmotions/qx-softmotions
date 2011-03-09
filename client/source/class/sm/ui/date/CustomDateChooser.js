/**
 * Панель отображения даты позволяющая
 * преопределять стиль и отображение элементов
 */
qx.Class.define("sm.ui.date.CustomDateChooser", {
    extend  : qx.ui.control.DateChooser,


    properties :
    {
    },

    construct : function(date, datefield) {
        this.__customDayLabelArr = [];
        this.__datefield = datefield || null;
        this.base(arguments, date);

    },

    members :
    {

        __datefield : null,

        __customDayLabelArr : null,

        _createChildControlImpl : function(id) {
            var control;
            switch (id) {
                case "day":
                    control = new qx.ui.basic.Label();
                    control.setAllowGrowX(true);
                    control.setAllowGrowY(true);
                    control.setCursor("default");
                    control.addListener("mousedown", this._onDayClicked, this);
                    control.addListener("dblclick", this._onDayDblClicked, this);
                    control.addListener("changeValue", this._dayLabelChanged, this);
                    this.__customDayLabelArr.push(control);
                    break;
            }

            return control || this.base(arguments, id);
        },

        _dayLabelChanged : function(ev) {
            /*var label = ev.getCurrentTarget();
             var val = ev.getData();
             this.info("val=" + val);*/
        },

        showMonth : function(month, year) {
            this.base(arguments, month, year);
            if (this.__datefield.showMonth) {
                this.__datefield.showMonth(month, year);
            }
        },


        forEachDays : function(callback, thisarg) {
            for (var week = 0; week < 6; week++) {
                for (var i = 0; i < 7; i++) {
                    var label = this.__customDayLabelArr[week * 7 + i];
                    callback.call(thisarg, label, label.dateTime);
                }
            }
        }
    },


    destruct : function() {
        this.__customDayLabelArr = this.__datefield = null;
        //this._disposeObjects("__field_name");
    }

});