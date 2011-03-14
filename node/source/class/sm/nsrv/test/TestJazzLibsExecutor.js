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
        },

        __jzInner : function(req, resp, ctx) {

        }

    },

    handlers : {

        "/jzInclude" : {
            webapp : "jazz",
            handler : "__jzInclude"
        },

        "$layout1_inc1.jz" : {
            webapp : "jazz",
            handler : "__jzInner"
        }


    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});