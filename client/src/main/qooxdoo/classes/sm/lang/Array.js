/**
 * Static helper functions for JS arrays
 */

qx.Class.define("sm.lang.Array", {

    statics : {

        /**
         * Return last element stored in the given array.
         * @param array {Array}
         * @param defVal {Object} Default value if element is not accessible (zero size array)
         * @returns {*}
         */
        lastElement : function(array, defVal) {
            return (!Array.isArray(array) || array.length == 0) ? defVal : array[array.length - 1];
        }
    }
});