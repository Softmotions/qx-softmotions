/**
 * Simple event forwarding helper
 */
qx.Mixin.define("sm.event.MForwardEvent", {

    members : {

        /**
         * Forward the specified event
         * @param ev {qx.event.type.Event} The original event
         */
        forwardEvent : function(ev) {
            var clonedEvent = ev.clone();
            clonedEvent.setTarget(this);
            this.dispatchEvent(clonedEvent);
        }

    }
});