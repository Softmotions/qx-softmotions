qx.Class.define("sm.nsrv.test.TestAssembly", {
    extend  : qx.core.Object,

    assembly :
    {
        "_webapp_" : "jazz",

        "base" : {
            "_core_" : "/jazz/asm/core_base.jz",
            "title" : "2ed14b4b2cd64707821f836361259a67",
            "content" : null,
            "content2" : "fd1873bb26b943589866b3d64258810a",
            "footer" : {"_assembly_" : "footer"}
        },

        "content" : {
            "_extends_" : "base",
            "content" : {"_irequest_" : "/jazz/asm/content", "params" : ["a", "b"]},
            "title" : "fd3425c6046d4811860517df0792df8f"
        },

        "footer" : {
            "_core_" : "/jazz/asm/core_footer.jz",
            "caption" : "fa9a6a73518a418ba726f2a6c339e398"
        }
    }
});