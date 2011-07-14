/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Theme.define("sm.cms.theme.Appearance", {
    extend : qx.theme.simple.Appearance,
    appearances :
    {
        "table": {
            style : function() {
                return {
                    decorator : "main"
                }
            }
        },

        "textarea-editor" : {
            style : function(states) {
                return {
                }
            }
        },

        "textarea-editor/toolbar" : {
            include : "toolbar",
            alias : "toolbar",
            style : function(states) {
                return {

                }
            }
        },

        "textarea-editor/textarea" : {
            include : "textarea",
            alias : "textarea",
            style : function(states) {
                return {
                    maxHeight : 300
                }
            }
        },

        "textarea-editor-tbbt" : {
            include : "toolbar-button",
            alias : "toolbar-button",
            style : function(states) {
                return {
                    width : 30
                }
            }
        },

        "toolbar-table" : {

        },
        "toolbar-table/toolbar" : "toolbar",




        "sm-bt-field" : {
        },

        "sm-bt-field/button" : {
            include : "button",
            alias : "button",
            style : function(states) {
                return {

                }
            }
        },

        "sm-bt-field/text" : {
            include : "textfield",
            alias : "textfield",
            style : function(states) {
                return {

                }
            }
        },

        "image-editor" : {
            style : function(states) {
                var decorator;
                var padding;

                if (states.invalid) {
                    decorator = "border-invalid";
                    padding = [2, 2, 2, 2];
                }
                return {
                    padding : padding,
                    decorator : decorator,
                    backgroundColor : states.disabled ? "background-disabled" : "white"
                };
            }
        }

    }
});