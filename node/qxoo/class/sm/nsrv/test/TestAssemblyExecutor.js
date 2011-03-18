qx.Class.define("sm.nsrv.test.TestAssemblyExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],

    construct : function() {
        this.base(arguments);
    },

    members :
    {
        __content : function(req, resp, ctx) {
            this.writeString("ad37a8eaf3bb408585a947ece6abe234", resp, ctx);
        }
    },

    handlers :
    {
        "/asm/content" : {
            webapp : "jazz",
            handler : "__content"
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});