/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

qx.Theme.define("sm.cms.theme.Decoration", {
    extend : qx.theme.simple.Decoration,
    decorations :
    {
        "shadow-popup" : {
            decorator: qx.ui.decoration.Uniform,
            style :
            {
                width : 0,
                color : "button-border"
            }
        }
    }
});