/**
 * Static helper functions for JS arrays
 */

qx.Class.define("sm.lang.Array", {

    statics: {

        /**
         * Return last element stored in the given array.
         * @param array {Array}
         * @param defVal {Object} Default value if element is not accessible (zero size array)
         * @returns {*}
         */
        lastElement: function (array, defVal) {
            return (!Array.isArray(array) || array.length == 0) ? defVal : array[array.length - 1];
        },

        /**
         * Fast and easy solution see: http://stackoverflow.com/a/29018745
         *
         * Binary search in JavaScript.
         * Returns the index of of the element in a sorted array or -1
         * Parameters:
         * @param ar {Array} - A sorted array
         * @param el {Object} - An element to search for
         * @param cmpFn {Function} - A comparator function. The function takes two arguments: (a, b) and returns:
         *        a negative number  if a is less than b;
         *        0 if a is equal to b;
         *        a positive number of a is greater than b.
         * The array may contain duplicate elements. If there are more than one equal elements in the array,
         * the returned value can be the index of any one of the equal elements.
         */
        binarySearch: function (ar, el, cmpFn) {
            var m = 0,
                n = ar.length - 1;
            while (m <= n) {
                var k = (n + m) >> 1;
                var cmp = cmpFn(el, ar[k]);
                if (cmp > 0) {
                    m = k + 1;
                } else if (cmp < 0) {
                    n = k - 1;
                } else {
                    return k;
                }
            }
            return -1;
        },

        /**
         * Binary search in JavaScript.
         * Returns the index of of the element in a sorted array or (-n-1) where n is the insertion point for the new element.
         * Parameters:
         * @param ar {Array} - A sorted array
         * @param el {Object} - An element to search for
         */
        binaryStringSearch: function (ar, el) {
            return sm.lang.Array.binarySearch(ar, el, function (e1, e2) {
                if (e1 == null) {
                    return e2 == null ? 0 : -1;
                } else if (e2 == null) {
                    return 1;
                } else {
                    return e1.localeCompare(e2);
                }
            })
        }
    }
});