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
            resp.messages.push(new sm.nsrv.Message("fcbd66cf179f4d0aa6aff49c55c1653a", false));
            ctx();
        },

        __jzIRequest2 : function(req, resp, ctx) {
            resp.messages.push(new sm.nsrv.Message("89a2e5e561ee4623aa70a53fc21dde48", false));
            resp.messages.push(new sm.nsrv.Message("403d89c71a7e4ad886ac4af71057596e", true));
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

        "/layout1_inc2.jz" : {
            webapp : "jazz",
            handler : "__jzIRequest2"
        }


    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});