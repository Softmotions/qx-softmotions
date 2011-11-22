/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Class.define("sm.lang.DoubleLinkedList", {
    extend  : qx.core.Object,

    members : {
        __head : null,
        __tail : null,

        add : function(element) {
            var head = this.__head;
            if (head) {
                element.__prev = head;
                element.__next = null;
                head.__next = element;
                this.__head = element;
            } else {
                // the list was empty
                this.__head = element;
                this.__tail = element;
                element.__prev = null;
                element.__next = null;
            }
        },

        del : function(element) {
            if (!this.__head) throw new Error("can't delete from empty list");
            if (!this.__tail) throw new Error("can't delete from empty list");
            if (this.__head == this.__tail) {
                // only 1 element in the list
                this.__head = null;
                this.__tail = null;
            } else if (this.__head == element) {
                var newHead = element.__prev;
                newHead.__next = null;
                this.__head = newHead;
            } else if (this.__tail == element) {
                var newTail = element.__next;
                newTail.__prev = null;
                this.__tail = newTail;
            } else {
                var next = element.__next;
                var prev = element.__prev;
                next.__prev = prev;
                prev.__next = next;
            }
        },

        getTail : function() {
            return this.__tail;
        }
    }
});