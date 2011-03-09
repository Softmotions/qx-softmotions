/**
 * Mixin of common routines for NKServer executors
 */
qx.Mixin.define("sm.nsrv.MExecutor", {

    members :
    {
        /**
         * Writes resp headers. Headers specified by argument
         * merged with headers presented in resp object
         *
         * @param resp {Object} Http response
         * @param scode {Integer} Http status code
         * @param headers Headers to be merged
         */
        writeHead : function(resp, ctx, scode, headers) {
            if (scode) {
                resp.statusCode = scode;
            }
            //Save messages and errors into headers
            ctx.collectMessageHeaders();
            return sm.nsrv.HTTPUtils.writeHead(resp, resp.statusCode, headers);
        },

        /**
         * Completely response with JSON object
         */
        writeJSONObject : function(jsonObj, resp, ctx) {
            this.writeHead(resp, ctx, 200, { "Content-Type": "application/json" });
            resp.end(JSON.stringify(jsonObj));
            ctx({"terminated" : true});
        }
    }
});