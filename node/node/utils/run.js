var cScript = null;

(function() {

    var daemon = require("daemon");
    var fs = require("fs");
    var path = require("path");
    var fsutils = require("./fsutils");

    var cAction = null;
    var cAppRoot = null;
    var cVarRoot = null;

    (function() {
        var args = process.argv;
        for (var i = 2; i < args.length; ++i) {
            var a = args[i];
            if (["start", "stop"].indexOf(a) != -1) {
                cAction = a;
            } else if ("--app" == a && args[i + 1] != null) {
                cAppRoot = path.resolve(args[i + 1]);
            } else if ("--var" == a && args[i + 1] != null) {
                cVarRoot = path.resolve(args[i + 1]);
            } else if ("--script" == a && args[i + 1] != null) {
                cScript = path.resolve(args[i + 1]);
            }
        }
    })();

    if (cScript == null) {
        console.log("Missing --script argument");
        process.exit(1);
    }

    if (!cAction) {
        return;
    }

    if (cAppRoot == null) {
        cAppRoot = __dirname;
    }

    if (cVarRoot == null) {
        cVarRoot = __dirname;
    }

    var config = {
        lockFile : path.join(cVarRoot, "daemon.pid"),
        logFile : path.join(cVarRoot, "daemon.log")
    };

    switch (cAction) {
        case "stop":
            if (!fs.existsSync(config.lockFile)) {
                console.log("Service not running");
                process.exit(0);
            }
            daemon.kill(config.lockFile, function(err) {
                if (err) {
                    console.error(err);
                }
                console.log("Service stopped");
                process.exit(0);
            });
            break;

        case "start":
            if (fs.existsSync(config.lockFile)) {
                (function() { //Checking process
                    var running = true;
                    try {
                        process.kill(parseInt(fs.readFileSync(config.lockFile)), 0);
                    } catch(e) {
                        if (e.code == "ESRCH") { //No such process
                            running = false;
                            try {
                                fs.unlinkSync(config.lockFile);
                            } catch(e) {
                            }
                        }
                    }
                    if (running) {
                        console.log("Service already running. PID: " + fs.readFileSync(config.lockFile));
                        process.exit(0);
                    }
                })();
            }
            try {
                daemon.daemonize(config.logFile, config.lockFile);
            } catch (ex) {
                console.log("Error starting daemon: " + ex);
                process.exit(1);
            }
            break;
    }

})();

//Starting
require(cScript);

console.log("Successfully started");


