/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.test.TestQooxdooClass1", {
    extend  : qx.core.Object,

    statics :
    {
    },

    events :
    {
        "changeTest" : "qx.event.type.Data",
        "changeTest2" : "qx.event.type.Data"
    },

    properties :
    {

        test : {
            check : "Integer",
            init : 0,
            apply : "__applyTest",
            event : "changeTest"
        },

        boundedTest : {
            check : "Integer"
        }
    },

    construct : function() {
        this.base(arguments);
    },

    members :
    {
        __applyTest : function(val) {
            this.fireDataEvent("changeTest2", val + 1);
        }

    },

    destruct : function() {
        //this._disposeObjects("__field_name");
    }
});
