qx.Mixin.define("sm.ui.form.MStringForm", {
    include : [
        qx.ui.form.MForm
    ],

    events : {
        /** Fired when the value was modified */
        "changeValue" : "qx.event.type.Data",

        /** Fired when the enabled state was modified */
        "changeEnabled" : "qx.event.type.Data",

        /** Fired when the valid state was modified */
        "changeValid" : "qx.event.type.Data",

        /** Fired when the invalidMessage was modified */
        "changeInvalidMessage" : "qx.event.type.Data",

        /** Fired when the required was modified */
        "changeRequired" : "qx.event.type.Data"
    },

    properties : {

        "value" : {
            check : "String",
            nullable : true,
            inheritable : true,
            event : "changeValue"
        }
    },

    members : {
    }
});