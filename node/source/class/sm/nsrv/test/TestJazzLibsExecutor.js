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

        __jzIRequest : function(req, resp, ctx) {
            ctx["irp"] = req.form.fields["irp"];
            ctx["irpq"] = req.form.fields["irpq"];
            ctx();
        },

        __jzIRequest2 : function(req, resp, ctx) {
            qx.log.Logger.info("__jzIRequest2!!!");
            ctx();
        }

    },

    handlers : {

        "/jzInclude" : {
            webapp : "jazz",
            handler : "__jzInclude"
        },

        "/layout1_inc1.jz" : {
            webapp : "jazz",
            handler : "__jzIRequest"
        },

        "/layout2.jz" : {
            webapp : "jazz",
            handler : "__jzIRequest2"
        }


    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});