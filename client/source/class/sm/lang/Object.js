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
        },


        /**
         * Creates new object instance for specified qooxdoo class instance.
         *
         * @param constructor {Object} Qooxdoo class instance
         * @param args {Array?null} Optional constructor arguments.
         * @returns new Instance of constructed object.
         */
        newInstance : function(constructor, args) {
            function F() {
                return constructor.apply(this, args);
            }

            F.prototype = constructor.prototype;
            return new F();
        },


        /**
         * Scan available global qxoodoo classes,
         * calls `cb` callback with single class argument;
         *
         * @param cb {Function} Class acceptor callback with single class argument.
         * @param self {Object?null} Optional self context for  `cb`
         */
        forEachClass : function(cb, self) {
            for (var k in qx.Bootstrap.$$registry) {
                var clazz = qx.Bootstrap.$$registry[k];
                if (!clazz || !clazz.prototype) {
                    continue;
                }
                cb.call(self, clazz);
            }
        }
    }
});