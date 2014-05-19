qx.Class.define("sm.ui.tree.ExtendedVirtualTree", {
    extend : qx.ui.tree.VirtualTree,

    construct : function(model, labelPath, childProperty) {
        this.base(arguments);
    },

    members : {

    },

    destruct : function() {
        //this._disposeObjects("__field_name");                                
    }
});