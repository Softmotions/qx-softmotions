qx.Class.define("sm.StandaloneApplication", {
    extend: qx.application.Standalone,
    include: [qx.locale.MTranslation],

    defer: function (statics) {
        sm.AppFixes.applyPlatformFixes();
    }
});