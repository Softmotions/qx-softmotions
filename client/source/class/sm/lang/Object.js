/**
 * Object utils
 */
qx.Class.define("sm.lang.Object", {
    statics : {
        /**
         * Clone only direct object properties
         * @param obj {Object?} object to clone
         */
        shallowClone : function(obj) {
            if (obj == null) {
                return obj;
            }
            return qx.lang.Object.clone(obj);
        },

        /**
         * Deep object clone
         * @param obj {Object?} object to clone
         */
        deepClone : function(obj) {
            if (obj == null) {
                return obj;
            }
            return JSON.parse(JSON.stringify(obj));
        }
    }
});