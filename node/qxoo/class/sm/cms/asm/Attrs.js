/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */
qx.Class.define("sm.cms.asm.Attrs", {
    extend  : qx.core.Object,

    statics :
    {
        getPageCtxAttrVal : function(page, attrName) {
            if (page != null &&
                    page.attrs != null &&
                    page.attrs[attrName] != null) {
                return page.attrs[attrName].ctx;
            }
            return null;
        },

        getPageValueAttrVal : function(page, attrName) {
            if (page != null &&
                    page.attrs != null &&
                    page.attrs[attrName] != null) {
                return page.attrs[attrName].value;
            }
            return null;
        }
    }
});
