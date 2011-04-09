/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

config = [
    //List of VHost engine specs:

    {  //VHostEngine:

        vhosts : ["127.0.0.1"], //List of virtual hosts
        defaultWebapp : "test",  //ID of default webapp
        webapps : [
            //List of available web applications
            {
                id : "test",
                context : "/test",
                docRoot : cwd + "/nksrv/webapps/test1",
                handlerDefaults : { //default hadlers parameters
                    methods : ["GET", "POST"] //allowed HTTP methods to execute handler
                }
            },
            //another one
            {
                id : "test12",
                context : "/test12",
                docRoot : cwd + "/nksrv/webapps/test1"
            },
            {
                id : "jazz",
                context : "/jazz",
                docRoot : cwd + "/nksrv/webapps/jazz"
            }
        ],
        errorOptions : {
            showErrorMsg : false,    //Return errors in response body, see "Error handling section"
            messagesInHeaders : true //Return errors in http resp headers, see "Error handling section"
        },
        formdiableOptions : { //options for formidable nodejs module (https://github.com/felixge/node-formidable)
            keepExtensions : true,
            uploadDir : "/tmp",
            maxFieldsSize :  2 * 1024 * 1024 //2MB
        }
    },

    //Another vhost engibe
    {

    }
];