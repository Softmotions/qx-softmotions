/**
 * Ideology similar to Mozilla XUL broadcasters.
 */
qx.Class.define("sm.event.Broadcaster", {


    statics : {

        /**
         * Spec is JSON object describes set of
         * broadcasted event properties.
         * Eg.
         *   <pre>
         *       {
         *         labe : "title",
         *         enabled : false
         *       }
         *   </pre>
         * @param spec
         */
        create : function(spec) {
            var m = qx.data.marshal.Json.createModel(spec, true);
            var b = {
                attach : function(obj, prop, oprop, opts) {
                    oprop = oprop || prop;
                    m.bind(prop, obj, oprop, opts);
                    return obj;
                },
                destruct : function() {
                    m.removeAllBindings();
                    m = null;
                }
            };
            for (var k in m) {
                if (b[k] == undefined) {
                    b[k] = m[k];
                }
            }
            return b;
        }
    }
});