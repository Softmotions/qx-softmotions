/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Message exception
 */
qx.Class.define("sm.nsrv.Message", {

    extend : Error,

    /**
     * @param message {String} Comment passed to the assertion call
     * @param error {Boolean?}
     */
    construct : function(message, error) {
        this.message = message;
        this.__error = !!error;
        if (this.__error) {
            var inst = Error.call(this, message);
            if (inst.stack) {
                this.stack = inst.stack;
            }
            if (inst.stacktrace) {
                this.stacktrace = inst.stacktrace;
            }
        }
    },

    members : {
        __error : false,

        /**
         * If this message exception is error
         */
        isError : function() {
            return this.__error;
        },

        getStackTrace : function() {
            return this.stacktrace || this.stack;
        },

        toString : function() {
            return this.message;
        }
    }
});

