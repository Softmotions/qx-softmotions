/**
 * Static helper functions for  Numbers
 */

qx.Class.define("sm.lang.Number", {

    statics: {

        isNumber: function (value) {
            var x;
            if (isNaN(value)) {
                return false;
            }
            x = parseFloat(value);
            return (x | 0) === x;
        }
    }

});