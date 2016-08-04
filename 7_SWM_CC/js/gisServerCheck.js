/** 
 * Author: Steve Lamont
 * gisServerCheck
 */

var gisServerCheck = (function () {
  "use strict";

    var exports = {};
    
    exports.getServer = getServer;
    exports.GCC_SETTINGS_SERVICE = "//map.toronto.ca/geoservices/rest/settings/properties";
    exports.GCC_DEFAULT_PROPERTY = "COT_GEOSPATIAL_WEBM";
    
    function getServer(prop) {

        var request = $.ajax({
            type: 'GET',
            url: exports.GCC_SETTINGS_SERVICE + "?propertyName=" + prop,
            dataType: 'jsonp',
            timeout: 2500,
            //success: function (data) {
            //    server = data[Object.keys(data)[0]];
            //},
            //error: function(jqXHR, textStatus, errorThrown) {
            //   console.log("service determination failed");
            //}
        })
        .then(function(data) {
            var server = ""
            if (data === 'undefined') 
            {
                console.log("Service call failed. Check Parameter [" + prop + "]") 
            } else {            
                server = data[Object.keys(data)[0]];
                if (document.location.protocol === 'https:') {
                    server  = server.replace("http://","https://");
                }
            }
            return server;
        });
        return request;

    }
    return exports;
    
    
})();