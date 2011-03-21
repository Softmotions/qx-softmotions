qx.Class.define("sm.nsrv.test.TestAssembly", {
    extend  : qx.core.Object,

    assembly :
    {
        "_webapp_" : "jazz",

        "test_base" : {
            "_core_" : "/jazz/asm/base.jz",
            "title" : "2ed14b4b2cd64707821f836361259a67",
            "arg1" : "957244b210c64aa4ab852c8c1ccadd4f"

        },

        "test_base_extends" : {
            "_extends_" : "test_base",
            "title" : "6cd22fa775f947e8a5daa17f09ba5329"
        },

        "test_base_extends2" : {
            "_extends_" : "test_base_extends",
            "title" : "307862e1ca624500a1893c09d0096ba7"
        },


        "test_asmref1" : {
            "_core_" : "/jazz/asm/asmref1.jz",
            "ref1" : {"_assembly_" : "test_base",
                "_ctxParams_" : {
                    "ctxp1" : "c0b2e5c12951412d8ac19f968ed78575",
                    "ctxp2" : "c065232c925345a8bfb9d18e0038db42"}},
            "ref2" : {"_assembly_" : "test_asmref2"}
        },

        "test_asmref2" : {
            "_extends_" : "test_asmref1",
            "ref1" : {"_assembly_" : "test_base",
                "_ctxParams_" : {
                    "ctxp1" : "9ab3f67e7a634e49b5096a195ee4d6f6",
                    "ctxp2" : "d01ab03bc8054a6eb9bc0504139ca813"}}
        },

        "test_ireq" : {
            "_core_" : "/jazz/asm/ireq.jz",
            "ireq" : {
                "_irequest_" : "/test/getRequestParams?p1=83702b502d5c46b89655ee26dffb3fe7"
            },
            "inc1" : {
                "_include_" : "include_child.jz"
            }
        },

        "test_func" : {
            "_core_" : "/jazz/asm/func.jz",
            "myfunc" : function(req, asm, cb) {
                cb("p1=" + req.params["p1"]);
            }
        }

    }
});