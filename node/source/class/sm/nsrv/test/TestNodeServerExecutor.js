qx.Class.define("sm.nsrv.test.TestNodeServerExecutor", {
    extend  : qx.core.Object,

    statics :
    {
    },

    events :
    {
    },

    construct : function() {
        this.base(arguments);

    },

    members :
    {

        /**
         * Very simple hello
         */
        __sayHello : function(req, resp, ctx) {
            //qx.log.Logger.info("__sayHello called");
            ctx({path : "hello.txt"});
        },

        /**
         * Control response exclusive
         */
        __sayHelloTerminated : function(req, res, ctx) {
            //qx.log.Logger.info("__sayHelloTerminated called");
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Hello fc19de52aa91464db407fdec55c2ef34");
            ctx({"terminated" : true});
        },

        /**
         * Use template generation
         */
        __sayHelloJazz : function(req, resp, ctx) {
            //qx.log.Logger.info("__sayHelloJazz called");
            ctx["message"] = "c791ad827f0c4fd7a40775f2e6be78ad";
            ctx({path : "hello.jz"});
        },

        /**
         * Test message as exception error
         */
        __sayHelloExceptionMsgErr : function(req, resp, ctx) {
            //qx.log.Logger.info("__sayHelloExceptionMsgErr called");
            throw new sm.nsrv.Message("2d4d8b9777d04f61bd6db858d451bf58", true);
        },

        /**
         * Test message as exception
         */
        __sayHelloExceptionMsg : function(req, resp, ctx) {
            //qx.log.Logger.info("__sayHelloExceptionMsg called");
            throw new sm.nsrv.Message("3a8e5bbf192d4411b3c565950a801827", false);
        },

        /**
         * Many messages
         */
        __sayHelloMsg : function(req, resp, ctx) {
            resp.messages.push(new sm.nsrv.Message("5ed95d81226f44e9b354947c97858a1d", false));
            resp.messages.push(new sm.nsrv.Message("4c863c40782848f1857dadaa446b6939", true));
            resp.messages.push(new sm.nsrv.Message("d270951c630245349fae393b3abdf818", false));
            resp.messages.push(new sm.nsrv.Message("3dc029e5c667459d849bd44187f0dcd2", true));
            ctx({path : "hello.txt"});
        },

        /**
         * Test GET request params
         */
        __requestParams : function(req, resp, ctx) {
            //qx.log.Logger.info("fields=" + qx.util.Json.stringify(req.params));
            var params = [];
            for (var k in req.params) {
                params.push({
                    "name" : k,
                    "val" : req.params[k]
                });
            }
            ctx["params"] = params;
            ctx({path : "params.jz"});
        }
    },

    handlers : {

        "/sayHello   sayHello2 sayHello3/" : {
            webapp : "test",
            handler : "__sayHello"
        },

        "/sayHelloTerminated" : {
            webapp : "test",
            handler : "__sayHelloTerminated"
        },

        "/sayHelloJazz" : {
            webapp : "test",
            handler : "__sayHelloJazz"
        },

        "/sayHelloExceptionMsgErr" : {
            webapp : "test",
            handler : "__sayHelloExceptionMsgErr"
        },

        "/sayHelloExceptionMsg" : {
            webapp : "test",
            handler : "__sayHelloExceptionMsg"
        },

        "/sayHelloMsg" : {
            webapp : "test",
            handler : "__sayHelloMsg"
        },

        "/getRequestParams /postRequestParams" : {
            webapp : "test",
            handler: "__requestParams"
        },



        ///////////////////////////////////////////////////////////////////////////
        //                           another virtual host                        //
        ///////////////////////////////////////////////////////////////////////////


        "/sayHello" : {
            webapp : "test2",
            handler : "__sayHello"
        }


    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});