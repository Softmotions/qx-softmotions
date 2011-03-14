/**
 * Interface for generic template engine
 */
qx.Interface.define("sm.nsrv.ITemplateEngine", {

    members :
    {
        /**
         * Create template object for path
         * @param path
         * @return {Object} Template object
         */
        createTemplate : function(path, cb) {
            this.assertString(path, "Template path shoud be specified");
            this.assertFunction(cb);
        },

        /**
         * Performs template merging
         * @param template
         * @param output
         */
        mergeTemplate : function(template, req, res, ctx, headers) {
            this.assertObject(template);
            this.assertObject(res);
        }
    }
});