/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/*

 */
qx.Class.define("sm.store.Json", {
    extend : qx.core.Object,


    /**
     * @param url {String|null} The url where to find the data.
     * @param delegate {Object} The delegate containing one of the methods
     *   specified in {@link qx.data.store.IStoreDelegate}.
     */
    construct : function(url, useModel, delegate) {
        this.base(arguments);

        // store the marshaler
        this._marshaler = (useModel == true || useModel === undefined) ? new sm.store.JsonMarshaler(delegate) : null;

        if (url != null) {
            this.setUrl(url);
        }
    },


    events :
    {
        /**
         * Data event fired after the model has been created. The data will be the
         * created model.
         */
        "loaded": "qx.event.type.Data"
    },


    properties :
    {
        /**
         * Property for holding the loaded model instance.
         */
        model : {
            nullable: true,
            event: "changeModel"
        },


        /**
         * The state of the request as an url. If you want to check if the request
         * did his job, use, the {@link #changeState} event and check for one of the
         * listed values.
         */
        state : {
            check : [
                "configured", "queued", "sending", "receiving",
                "completed", "aborted", "timeout", "failed"
            ],
            init : "configured",
            event : "changeState"
        },


        /**
         * The url where the request should go to.
         */
        url : {
            check: "String",
            apply: "_applyUrl",
            event: "changeUrl",
            nullable : true
        },

        /**
         * Custom HTTP Request
         */
        request : {
            check : "sm.io.Request",
            apply : "_applyRequest",
            event : "changeRequest",
            nullable : true
        }
    },


    members :
    {

        // apply function
        _applyUrl: function(value, old) {
            if (value != null) {
                this._createRequest(value);
            }
        },

        /**
         * Creates and sends a GET request with the given url. Additionally two
         * listeners will be added for the state and the completed event of the
         * request.
         *
         * @param url {String} The url for the request.
         */
        _createRequest: function(url) {
            // create the request
            var req = new sm.io.Request(
                    url, "GET", "application/json");
            this.setRequest(req);
        },

        _applyRequest: function(req) {
            req.removeListener("completed", this.__requestCompleteHandler);
            req.removeListener("changeState", this.__requestChangeStateHandler);
            req.addListener("completed", this.__requestCompleteHandler, this);
            req.addListener("changeState", this.__requestChangeStateHandler, this);
            req.send();
        },

        /**
         * Handler for the completion of the requests. It invokes the creation of
         * the needed classes and instances for the fetched data using
         * {@link qx.data.marshal.Json}.
         *
         * @param ev {qx.io.remote.Response} The event fired by the request.
         */
        __requestCompleteHandler : function(ev) {
            var data = ev.getContent();
            if (this._marshaler != null) {
                // create the class
                this._marshaler.toClass(data, true);
                // set the initial data
                this.setModel(this._marshaler.toModel(data));
            } else {
                this.setModel(data);
            }
            // fire complete event
            this.fireDataEvent("loaded", this.getModel());
        },

        __requestChangeStateHandler : function(ev) {
            this.setState(ev.getData());
        },


        /**
         * Reloads the data with the url set in the {@link #url} property.
         */
        reload: function() {
            var url = this.getUrl();
            if (url != null) {
                this._createRequest(url);
            } else {
                var req = this.getRequest();
                if (req != null) {
                    this._applyRequest(req);
                }
            }
        }
    }

});
