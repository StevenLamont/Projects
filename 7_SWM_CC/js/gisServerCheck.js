/**
 * gisServerCheck
 * I have three choices
 * 1) return the request (a promise) and the caller can determine what it needs. They use .success to get parsed JSONP
      or .then to get raw data.
      If I use .then here, I can parse out of the data and return it in the promise. 
    1b) when returning the promise.. the success and error here are irrelevant
        but they need to now how to get actually data data[Object.keys(data)[0]]
 * 2) do any async call and return the value.  callers doesn't need to know anything.
 * 3) use a $.when.. but I loose the JSONP autoparse and I have to manually parse the data, but it is technically async and the buffers the user's need to parse the obeject. (so do this)
 */

var gisServerCheck = (function () {
  "use strict";

    var exports = {};
    
    exports.getServer = getServer;
    exports.GCC_SETTINGS_SERVICE = "http://map.toronto.ca/geoservices/rest/settings/properties";
	exports.GCC_DEFAULT_PROPERTY = "COT_GEOSPATIAL_WEBM";
    
    function getServer(prop) {
        //var server = 'Unknown';   

        var request = $.ajax({
            type: 'GET',
            url: exports.GCC_SETTINGS_SERVICE + "?propertyName=" + prop,
            dataType: 'jsonp',
            //success: function (data) {
            //    server = data[Object.keys(data)[0]];
            //},
            //error: function(jqXHR, textStatus, errorThrown) {
            //   console.log("service determination failed");
            //}
        })
        .then(function(data) {
            if (data !== 'undefined') console.log("Service call failed. Check Parameter [" + prop + "]");
            return data[Object.keys(data)[0]];
        });
        return request;

    }
    return exports;
    
    
})();