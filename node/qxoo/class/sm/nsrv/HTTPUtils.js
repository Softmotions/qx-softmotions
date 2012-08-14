/*
 * Copyright (c) 2011. Softmotions Ltd. (softmotions.com)
 * All Rights Reserved.
 */

/**
 * Various request utils
 */
qx.Class.define("sm.nsrv.HTTPUtils", {
    extend  : qx.core.Object,

    statics :
    {


        /**
         * Convert file name to the content disposition header value
         * format
         * @param fname {String}
         */
        toContentDisposition : function(fname) {
            fname = sm.lang.String.translitRussian(fname);
            return fname ? fname.replace(/[^a-zA-z0-9\-]/g, '_') : null;
        },

        /**
         * List of browser supported ISO 639 alpha-2 language codes
         * @param req Http request
         */
        getAlpha2LangCodes : function(req) {
            var codes = [];
            var httpLangs = req.headers["accept-language"];
            if (httpLangs) {
                httpLangs.split(",").forEach(function(lang) {
                    var lng = lang.split(";", 1)[0].split("-", 1)[0].toLowerCase();
                    if (codes.indexOf(lng) === -1) {
                        codes.push(lng);
                    }
                });
            }
            return codes;
        },


        /**
         * Returns true if request is form submit (file upload) request
         * @param req Nodejs request
         */
        isFormRequest : function(req) {
            return req.body === undefined
                    && (req.method === "POST"
                    || req.method === "PUT")
                    && (req.headers["content-type"]
                    && (req.headers["content-type"].indexOf("multipart/form-data") >= 0
                    || req.headers["content-type"].indexOf("urlencoded") >= 0));
        },


        /**
         * Get mime type for specified file extension.
         * Returns __null__ if no mime type for this extension
         * @param ext {String}
         */
        getCType : function(ext) {
            var ctype = ext ? sm.nsrv.HTTPUtils.__mtypes[ext] : null;
            return ctype ? ctype : null;
        },


        /**
         * Writes resp headers. Headers specified by argument
         * merged with headers presented in resp object
         *
         * @param resp {Object} Http response
         * @param scode {Integer} Http status code
         * @param headers Headers to be merged
         */
        writeHead : function(resp, scode, headers) {
            if (!scode) {
                scode = 200;
            }
            if (resp.headers == null) {
                resp.headers = {};
            }
            if (headers != null) {
                qx.lang.Object.mergeWith(resp.headers, headers);
            }
            resp.writeHead(scode, resp.headers);
        },


        selectForUserAgent : function(map, rheaders) {
            var userAgent = rheaders["user-agent"];
            if (userAgent != null) {
                for (var k in map) {
                    if (k === "default") {
                        continue;
                    }
                    if (userAgent.indexOf(k) != -1) {
                        return map[k];
                    }
                }
            }
            return map["default"];
        }
    },

    defer : function(statics) {

        //Init mime types mapping
        statics.__mtypes = {
            "abs" : "audio/x-mpeg",
            "ai" : "application/postscript",
            "aif" : "audio/x-aiff",
            "aifc" : "audio/x-aiff",
            "aiff" : "audio/x-aiff",
            "aim" : "application/x-aim",
            "art" : "image/x-jg",
            "asf" : "video/x-ms-asf",
            "asx" : "video/x-ms-asf",
            "au" : "audio/basic",
            "avi" : "video/x-msvideo",
            "avx" : "video/x-rad-screenplay",
            "bcpio" : "application/x-bcpio",
            "bin" : "application/octet-stream",
            "bmp" : "image/bmp",
            "body" : "text/html",
            "cdf" : "application/x-cdf",
            "cer" : "application/x-x509-ca-cert",
            "class" : "application/java",
            "cpio" : "application/x-cpio",
            "csh" : "application/x-csh",
            "css" : "text/css",
            "dib" : "image/bmp",
            "dtd" : "application/xml-dtd",
            "dv" : "video/x-dv",
            "dvi" : "application/x-dvi",
            "eps" : "application/postscript",
            "etx" : "text/x-setext",
            "exe" : "application/octet-stream",
            "gif" : "image/gif",
            "gtar" : "application/x-gtar",
            "gz" : "application/x-gzip",
            "hdf" : "application/x-hdf",
            "htc" : "text/x-component",
            "htm" : "text/html",
            "html" : "text/html",
            "hqx" : "application/mac-binhex40",
            "ief" : "image/ief",
            "jad" : "text/vnd.sun.j2me.app-descriptor",
            "jar" : "application/java-archive",
            "java" : "text/plain",
            "jnlp" : "application/x-java-jnlp-file",
            "jpe" : "image/jpeg",
            "jpeg" : "image/jpeg",
            "jpg" : "image/jpeg",
            "js" : "text/javascript",
            "json" : "application/json",
            "jsf" : "text/plain",
            "jspf" : "text/plain",
            "kar" : "audio/x-midi",
            "latex" : "application/x-latex",
            "m3u" : "audio/x-mpegurl",
            "mac" : "image/x-macpaint",
            "man" : "application/x-troff-man",
            "mathml" : "application/mathml+xml",
            "me" : "application/x-troff-me",
            "mid" : "audio/x-midi",
            "midi" : "audio/x-midi",
            "mif" : "application/x-mif",
            "mov" : "video/quicktime",
            "movie" : "video/x-sgi-movie",
            "mp1" : "audio/x-mpeg",
            "mp2" : "audio/x-mpeg",
            "mp3" : "audio/x-mpeg",
            "mp4" : "video/mp4",
            "mpa" : "audio/x-mpeg",
            "mpe" : "video/mpeg",
            "mpeg" : "video/mpeg",
            "mpega" : "audio/x-mpeg",
            "mpg" : "video/mpeg",
            "mpv2" : "video/mpeg2",
            "ms" : "application/x-wais-source",
            "nc" : "application/x-netcdf",
            "oda" : "application/oda",
            "odb" : "application/vnd.oasis.opendocument.database",
            "odc" : "application/vnd.oasis.opendocument.chart",
            "odf" : "application/vnd.oasis.opendocument.formula",
            "odg" : "application/vnd.oasis.opendocument.graphics",
            "odi" : "application/vnd.oasis.opendocument.image",
            "odm" : "application/vnd.oasis.opendocument.text-master",
            "odp" : "application/vnd.oasis.opendocument.presentation",
            "ods" : "application/vnd.oasis.opendocument.spreadsheet",
            "odt" : "application/vnd.oasis.opendocument.text",
            "ogg" : "application/ogg",
            "otg" : "application/vnd.oasis.opendocument.graphics-template",
            "oth" : "application/vnd.oasis.opendocument.text-web",
            "otp" : "application/vnd.oasis.opendocument.presentation-template",
            "ots" : "application/vnd.oasis.opendocument.spreadsheet-template",
            "ott" : "application/vnd.oasis.opendocument.text-template",
            "pbm" : "image/x-portable-bitmap",
            "pct" : "image/pict",
            "pdf" : "application/pdf",
            "pgm" : "image/x-portable-graymap",
            "pic" : "image/pict",
            "pict" : "image/pict",
            "pls" : "audio/x-scpls",
            "png" : "image/png",
            "pnm" : "image/x-portable-anymap",
            "pnt" : "image/x-macpaint",
            "ppm" : "image/x-portable-pixmap",
            "ps" : "application/postscript",
            "psd" : "image/x-photoshop",
            "qt" : "video/quicktime",
            "qti" : "image/x-quicktime",
            "qtif" : "image/x-quicktime",
            "ras" : "image/x-cmu-raster",
            "rdf" : "application/rdf+xml",
            "rgb" : "image/x-rgb",
            "rm" : "application/vnd.rn-realmedia",
            "roff" : "application/x-troff",
            "rtf" : "application/rtf",
            "rtx" : "text/richtext",
            "sh" : "application/x-sh",
            "shar" : "application/x-shar",
            "smf" : "audio/x-midi",
            "sit" : "application/x-stuffit",
            "snd" : "audio/basic",
            "src" : "application/x-wais-source",
            "sv4cpio" : "application/x-sv4cpio",
            "sv4crc" : "application/x-sv4crc",
            "swf" : "application/x-shockwave-flash",
            "t" : "application/x-troff",
            "tar" : "application/x-tar",
            "tcl" : "application/x-tcl",
            "tex" : "application/x-tex",
            "texi" : "application/x-texinfo",
            "texinfo" : "application/x-texinfo",
            "tif" : "image/tiff",
            "tiff" : "image/tiff",
            "tr" : "application/x-troff",
            "tsv" : "text/tab-separated-values",
            "txt" : "text/plain",
            "ulw" : "audio/basic",
            "ustar" : "application/x-ustar",
            "vxml" : "application/voicexml+xml",
            "xbm" : "image/x-xbitmap",
            "xht" : "application/xhtml+xml",
            "xhtml" : "application/xhtml+xml",
            "xml" : "application/xml",
            "xpm" : "image/x-xpixmap",
            "xsl" : "application/xml",
            "xslt" : "application/xslt+xml",
            "xul" : "application/vnd.mozilla.xul+xml",
            "xwd" : "image/x-xwindowdump",
            "wav" : "audio/x-wav",
            "svg" : "image/svg+xml",
            "svgz" : "image/svg+xml",
            "vsd" : "application/x-visio",
            "wbmp" : "image/vnd.wap.wbmp",
            "wml" : "text/vnd.wap.wml",
            "wmlc" : "application/vnd.wap.wmlc",
            "wmls" : "text/vnd.wap.wmlscript",
            "wmlscriptc" : "application/vnd.wap.wmlscriptc",
            "wmv" : "video/x-ms-wmv",
            "wrl" : "x-world/x-vrml",
            "Z" : "application/x-compress",
            "z" : "application/x-compress",
            "zip" : "application/zip",
            "xls" : "application/vnd.ms-excel",
            "doc" : "application/vnd.ms-word",
            "ppt" : "application/vnd.ms-powerpoint",
            "jz"  : "text/plain",
            "jazz"  : "text/plain"
        }
    }
});
