/**
 * Softmotions commons widgets apperance.
 *
 * @asset(qx/icon/${qx.icontheme}/16/actions/edit-clear.png)
 * @asset(sm/icons/16/cross-script.png)
 * @asset(sm/icons/misc/progress-indicator.gif)
 */
qx.Theme.define("sm.Appearance", {

    appearances: {


        //------------------ Button field widget (sm.ui.form.ButtonField)

        "sm-jointed-button": {
            alias: "atom",
            style: function (states) {
                var decorator = "button-box";
                if (states.disabled) {
                    decorator = "button-box";
                } else if (states.hovered && !states.pressed && !states.checked) {
                    decorator = "button-box-hovered";
                } else if (states.hovered && (states.pressed || states.checked)) {
                    decorator = "button-box-pressed-hovered";
                } else if (states.pressed || states.checked) {
                    decorator = "button-box-pressed";
                }
                // set the right left and right decorators
                if (states.left) {
                    decorator += "-left";
                } else if (states.right) {
                    decorator += "-right";
                } else if (states.middle) {
                    decorator += "-middle";
                }
                // set the margin
                var margin = [0, 0];
                if (states.left || states.middle || states.right) {
                    margin = [0, 0];
                }
                return {
                    cursor: states.disabled ? undefined : "pointer",
                    decorator: decorator,
                    margin: margin,
                    padding: [3, 5]
                };
            }
        },

        "sm-bt-field": {},

        "sm-bt-field/button": {
            include: "sm-jointed-button",
            style: function (states) {
                return {}
            }
        },

        "sm-bt-field/reset": {
            include: "sm-jointed-button",
            style: function (states) {
                return {
                    icon: "sm/icons/16/cross-script.png"
                }
            }
        },

        "sm-bt-field/extra": {
            include: "sm-jointed-button",
            style: function (states) {
                return {
                }
            }
        },

        "sm-bt-field/text": {
            include: "textfield",
            alias: "textfield",
            style: function (states) {
                return {}
            }
        },

        "sm-message": "window",

        "sm-message/checkbox": "checkbox",

        "sm-message/image": "image",

        "sm-message/button": "button",

        //------------------ Search field widget (sm.ui.form.SearchField)

        "sm-search-field": {
            style: function (states) {
                var decorator;
                var padding;
                if (states.disabled) {
                    decorator = "inset";
                    padding = [2, 3];
                } else if (states.invalid) {
                    decorator = "border-invalid";
                    padding = [1, 2];
                } else if (states.focused) {
                    decorator = "focused-inset";
                    padding = [1, 2];
                } else {
                    decorator = "inset";
                    padding = [2, 3];
                }
                return {
                    decorator: decorator,
                    padding: padding,
                    margin: [0, 0, 2, 0],
                    backgroundColor: states.disabled ? "background-disabled" : undefined
                };
            }
        },

        "sm-search-field/options": {
            include: "atom",
            alias: "atom",
            style: function (states) {
                return {
                    padding: [0, 0, 0, 4]
                }
            }
        },

        "sm-search-field/text": {
            include: "textfield",
            style: function (states) {
                return {
                    padding: [2, 3],
                    decorator: null
                }
            }
        },

        "sm-search-field/clear": {
            include: "atom",
            alias: "atom",
            style: function (states) {
                return {
                    icon: "icon/16/actions/edit-clear.png",
                    padding: [0, 0, 0, 0]
                }
            }
        },

        //------------------ Progress popup (sm.ui.progress.ProgressPopup)

        "sm-progress-popup/legend": {
            alias: "atom",
            style: function (states) {
                return {
                    padding: [1, 0, 1, 4],
                    textColor: states.invalid ? "invalid" : "text-title",
                    font: "bold",
                    "decorator": "background-pane"
                };
            }
        },

        "sm-progress-popup/frame": {
            style: function (states) {
                return {
                    padding: 12,
                    "decorator": "background-pane"
                };
            }
        },

        "sm-progress-popup/indicator": {
            include: "image",
            style: function (states) {
                return {
                    source: "sm/icons/misc/progress-indicator.gif"
                }
            }
        },


        //---------------- Toolbar table (sm.table.ToolbarTable)

        "toolbar-table": "widget",

        "toolbar-table/toolbar": "toolbar",

        "toolbar-table/part": {
            include: "toolbar/part",
            alias: "toolbar/part",
            style: function (states) {
                return {
                    margin: [0, 0, 0, 0]
                }
            }
        },

        "toolbar-table-button": {
            alias: "toolbar-button",
            include: "toolbar-button",
            style: function (states) {
                return {
                    margin: 0
                };
            }
        },


        "toolbar-table-menubutton": {
            alias: "toolbar-menubutton",
            include: "toolbar-menubutton",
            style: function (states) {
                return {
                    margin: 0
                };
            }
        }
    }

});