/**
 * Various validation functions
 */
qx.Class.define("sm.util.Validate", {

    statics :
    {

        /**
         * Checks for IP v4/v6 or for simple hostname
         */
        check_IPv4_IPv6_Hostname : function(value, formItem, errorMessage) {
            errorMessage = errorMessage || qx.locale.Manager.tr("'%1' is not an IP or hostname.", (value || ""));
            var ipRe = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
            var hnRe = /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9\-]*[A-Za-z0-9])$/;
            var ipv6Re = /(\A([0-9a-f]{1,4}:){1,1}(:[0-9a-f]{1,4}){1,6}\Z)|(\A([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}\Z)|(\A([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}\Z)|(\A([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}\Z)|(\A([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}\Z)|(\A([0-9a-f]{1,4}:){1,6}(:[0-9a-f]{1,4}){1,1}\Z)|(\A(([0-9a-f]{1,4}:){1,7}|:):\Z)|(\A:(:[0-9a-f]{1,4}){1,7}\Z)|(\A((([0-9a-f]{1,4}:){6})(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3})\Z)|(\A(([0-9a-f]{1,4}:){5}[0-9a-f]{1,4}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3})\Z)|(\A([0-9a-f]{1,4}:){5}:[0-9a-f]{1,4}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A([0-9a-f]{1,4}:){1,1}(:[0-9a-f]{1,4}){1,4}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,3}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,2}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,1}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A(([0-9a-f]{1,4}:){1,5}|:):(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)|(\A:(:[0-9a-f]{1,4}){1,5}:(25[0-5]|2[0-4]\d|[0-1]?\d?\d)(\.(25[0-5]|2[0-4]\d|[0-1]?\d?\d)){3}\Z)/;
            if (ipRe.test(value) === false && hnRe.test(value) === false && ipv6Re.test(value) === false) {
                throw new qx.core.ValidationError("Validation Error", errorMessage);
            }
        },

        IPv4_IPv6_Hostname : function(errorMessage) {
            return function(value) {
                return sm.util.Validate.check_IPv4_IPv6_Hostname(value, null, errorMessage);
            }
        },


        /**
         * Checks if value can be a number
         */
        checkCanBeNumber : function(value, formItem, errorMessage) {
            errorMessage = errorMessage || qx.locale.Manager.tr("%1 is not a number.", (value || ""));
            if (typeof value === "number") {
                return;
            }
            if (isNaN(parseInt(value))) {
                throw new qx.core.ValidationError("Validation Error", errorMessage);
            }
        },

        canBeNumber : function(errorMessage) {
            return function(value) {
                return sm.util.Validate.checkCanBeNumber(value, null, errorMessage);
            }
        },


        /**
         * Check if value is not empty
         * @param value
         * @param formItem
         * @param errorMessage
         */
        checkNotEmpty : function(value, formItem, errorMessage) {
            errorMessage = errorMessage || qx.locale.Manager.tr("Field cannot be empty.");
            if (sm.lang.String.isEmpty(value)) {
                throw new qx.core.ValidationError("Validation Error", errorMessage);
            }
        },

        notEmpty : function(errorMessage) {
            return function(value) {
                return sm.util.Validate.checkNotEmpty(value, null, errorMessage);
            }
        },


        /**
         * Invalidate item
         * @param errorMessage
         */
        setInvalid : function(errorMessage) {
            return function(value) {
                throw new qx.core.ValidationError("Validation Error", errorMessage || this.tr("Invalid"));
            }
        }
    }
});