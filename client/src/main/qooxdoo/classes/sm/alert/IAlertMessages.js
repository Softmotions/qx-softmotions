/**
 * Abstract alert messages implementation.
 */

qx.Interface.define("sm.alert.IAlertMessages", {

    events: {
        "close": "qx.event.type.Event"
    },

    members: {

        addMessages: function (caption, messages, isError) {
            this.assertTrue(messages == null || Array.isArray(messages));
        },

        activate: function (isNotification) {
        }
    }
});