qx.Class.define("sm.nsrv.test.TestJazzLibsExecutor", {
    extend  : qx.core.Object,
    include : [sm.nsrv.MExecutor],


    construct : function() {
        this.base(arguments);
    },

    members :
    {
        __jzInclude : function(req, resp, ctx) {
            ctx({path : "include_main.jz"});
        }

    },

    handlers : {

        "/jzInclude" : {
            webapp : "jazz",
            handler : "__jzInclude"
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});