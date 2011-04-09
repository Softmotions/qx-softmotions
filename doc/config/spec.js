config = [
    //List of VHost engine specs:

    {  //VHostEngine:

        vhosts : ["127.0.0.1"], //List of virtual hosts
        defaultWebapp : "test",  //ID of default webapp
        webapps : [
            //List of available webapplications
            {
                id : "test",
                context : "/test",
                docRoot : cwd + "/nksrv/webapps/test1",
                handlerDefaults : {
                    methods : ["get", "post"]
                }
            }
        ]
    },

    //Another vhost engibe
    {

    }
];