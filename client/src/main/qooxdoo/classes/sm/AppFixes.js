/**
 * Apply app wide platform fixes.
 */
qx.Class.define("sm.AppFixes", {

    statics: {

        applyPlatformFixes: function () {
            // Location of UI based on `navigator.languages[0]` instead of `navigator.language`
            // todo review it for IE/EDGE
            var browser = qx.core.Environment.get("browser.name");
            if (browser !== "ie" && browser !== "edge") { // Fix locale
                navigator.userLanguage = navigator.languages[0] || navigator.language || "";
                var locale = navigator.userLanguage;
                var ind = locale.indexOf("-");
                if (ind !== -1) {
                    locale = locale.substr(0, ind);
                }
                qx.locale.Manager.getInstance().setLocale(locale);
            }

            document.onkeydown = function (e) {
                e = e || window.event;
                if (e.ctrlKey) {
                    var c = e.which || e.keyCode;
                    switch (c) {
                        case 83: // Block Ctrl+S
                        case 87: // Block Ctrl+W
                            e.preventDefault();
                            e.stopPropagation();
                            break;
                    }
                }
            };
        }
    }
});