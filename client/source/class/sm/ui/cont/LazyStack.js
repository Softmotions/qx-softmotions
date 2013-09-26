/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Analog of qx.ui.container.Stack
 */
qx.Class.define("sm.ui.cont.LazyStack", {
    extend : qx.ui.core.Widget,
    include : [
        qx.ui.core.MChildrenHandling
    ],

    construct : function() {
        this.base(arguments);
        this._setLayout(new qx.ui.layout.Grow());
        this.__slots = {};
        this.__slotids = [];
    },

    members :
    {
        /**
         * Widget slots
         */
        __slots : null,

        /**
         * Ordered list or identifier of registered widgets
         */
        __slotids : null,

        /**
         * Currently active slot
         */
        __active : null,

        /**
         * Register widget in this stack.
         *
         * @param id {String} Unique id of widget
         * @param factoryFunc {function} Factory function(id, opts) used to create widget instance.
         * @param opts {Map?null} Options. Keys: cache {Boolean?true} whenever to cache
         * created widget for subsequent accesses
         * @param self {Object?factoryFunc} Self object for factoryFunc
         */
        registerWidget : function(id, factoryFunc, opts, self) {
            qx.core.Assert.assertFunction(factoryFunc);
            this.__slots[id] = {
                id : id,
                factory : factoryFunc,
                opts : opts || {},
                self : self || factoryFunc,
                cached : null
            };
            this.__slotids.push(id);
            if (!this.__active) {
                this.showWidget(id);
            }
        },

        /**
         * Return array of widget ids
         */
        getWidgetIds : function() {
            return [].concat(this.__slotids);
        },

        getWidgetCount : function() {
            return this.__slotids.length;
        },

        /**
         * Show widget with given id on top of the stack
         * @param id {String} widget id
         */
        showWidget : function(id) {
            var slot = this.__slots[id];
            if (!slot) {
                throw new Error("Widget with id: '" + id + "' not registered");
            }
            if (this.__active) {
                if (slot.cached == this.__active.cached) { //this widget active already
                    return slot.cached;
                }
                this.__active.cached.hide();
            }
            this.getWidget(id, true);
            this.__active = slot;
            slot.cached.show();
            return slot.cached;
        },


        isActiveWidget : function(id) {
            return (this.__slots[id] && this.__slots[id] === this.__active);
        },

        getActiveWidgetId : function() {
            return this.__active ? this.__active["id"] : null;
        },

        getNextWidgetId : function() {
            return this.__slotids[this.getActiveWidgetPosition() + 1];
        },

        getPrevWidgetId : function() {
            return this.__slotids[this.getActiveWidgetPosition() - 1];
        },

        getActiveWidgetPosition : function() {
            var wid = this.getActiveWidgetId();
            return wid != null ? this.__slotids.indexOf(wid) : -1;
        },

        isRegisteredWidget : function(id) {
            return !!this.__slots[id];
        },

        /**
         * Return widget registered with specified id
         * @param id {String} Widget id
         * @param create {Boolean?false} If true widget instance will be created
         * @return {Widget|null}
         */
        getWidget : function(id, create) {
            var slot = this.__slots[id];
            if (!slot) {
                if (create) {
                    throw new Error("Widget with id: '" + id + "' not registered");
                }
                return null;
            }
            if (slot.cached || !create) {
                return slot.cached;
            }
            var widget = slot.factory.call(slot.self, id, slot.opts);
            qx.core.Assert.assertObject(widget, "Factory function returns invalid widget");
            this._add(widget);
            slot.cached = widget;
            widget.hide();
            return widget;
        }
    },

    destruct : function() {
        this.__slots = null;
        this.__slotids = null;
        this.__active = false;
    }
});