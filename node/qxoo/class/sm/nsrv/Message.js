/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Message exception
 */
qx.Class.define("sm.nsrv.Message", {

    extend : sm.lang.BaseError,

    /**
     * @param message {String} Comment passed to the assertion call
     * @param error {Boolean?}
     */
    construct : function(message, error) {
        sm.lang.BaseError.call(this, new Error(message));
        this.__error = !!error;
    },

    members :
    {
        __error : false,

        /**
         * If this message exception is error
         */
        isError : function() {
            return this.__error;
        }
    }
});