var daemon = require("daemon");
var fs = require("fs");
var path = require("path");
var fsutils = require("./fsutils");

var args = process.argv;

var cAction = null;
var cAppRoot = null;
var cVarRoot = null;
var cScript = null;


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

if (cAppRoot == null) {
    cAppRoot = __dirname;
}

if (cVarRoot == null) {
    cVarRoot = __dirname;
}


if (cAction) {

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
            console.log("Service stopped");
            try {
                process.kill(parseInt(fs.readFileSync(config.lockFile)));
            } catch(e) {
                console.log("No process killed");
            } finally {
                try {
                    fs.unlinkSync(config.lockFile);
                } catch(e) {
                }
            }
            process.exit(0);
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
            var fd = fs.openSync(config.logFile, 'w+');
            try {
                var pid = daemon.start(fd);
                daemon.lock(config.lockFile);
            } catch (ex) {
                console.log("Error starting daemon: " + ex);
                process.exit(1);
            }
            break;
    }
}

//Starting
require(cScript);

console.log("Successfully started");


