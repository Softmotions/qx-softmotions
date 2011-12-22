qx.Class.define("sm.nsrv.NKServerEvents", {
    extend  : qx.core.Object,
    type : "singleton",

    events :
    {
        /**
         * Data: sm.nsrv.NKServer
         */
        "started" : "qx.event.type.Data",

        /**
         * Data: sm.nsrv.NKServer
         */
        "goingshutdown" : "qx.event.type.Data",

        /**
         * Fired if VHostEngine was configured
         * Data: [sm.nsrv.VHostEngine, sm.nsrv.NKServer]
         */
        "configuredVHE" : "qx.event.type.Data"
    }
});