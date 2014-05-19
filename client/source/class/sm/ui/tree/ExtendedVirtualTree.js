qx.Class.define("sm.ui.tree.ExtendedVirtualTree", {
    extend : qx.ui.tree.VirtualTree,

    construct : function(model, labelPath, childProperty) {
        this.base(arguments, model, labelPath, childProperty);
    },

    members : {

        findCachedNodeByPath : function(path, labelProperty) {
            labelProperty = "get" + qx.lang.String.firstUp(labelProperty || "label");
            if (typeof path === "string") {
                path = path.split("/");
            }
            if (path.length === 0) {
                return this.getModel();
            }
            var lt = this.getLookupTable();
            for (var i = 0, l = lt.length; i < l; ++i) {
                var j = path.length;
                var item = lt.getItem(i);
                var parent = item;
                while (j > 0 && parent != null) {
                    if (parent[labelProperty]() == path[--j]) {
                        parent = this.getParent(parent);
                        if (j === 0) {
                            return item;
                        }
                    } else {
                        break;
                    }
                }
            }
            return null;
        }
    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});