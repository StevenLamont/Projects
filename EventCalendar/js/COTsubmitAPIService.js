/*
  
*/

(function () {
    //var strURL = "http://was8-inter-dev.toronto.ca/cc_sr_v1/submit/" + pathVars + '?format=jsonp&callback=JSON_CALLBACK&json={"calEvent": ' + JSON.stringify($scope.event) + "}" + "&sid=" + getCookie('sid');

    //var SUBMIT_URL = "http://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?callback=JSON_CALLBACK&json=";
    //var SUBMIT_URL = "http://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?format=jsonp&callback=JSON_CALLBACK&json=";
    var SUBMIT_URL_ANGULAR = "http://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?callback=angularcallbacks_0&json=";
    var UPDATE_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/<eventType>/<eventId>?sid=<sid>&json=";
    var RETRIEVE_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/<eventType>/<eventId>?sid=<sid>";
    var GET_REPO_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/<eventType>?sid=<sid>&json=" ; 
                       //https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/<eventType>/<eventId>?sid=<sid>";
    var AUTH_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/session?app=<eventType>&user=<userName>&pwd=<password>";
    
    //var AUTH_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/session?user=<userName>&pwd=<password>";
    
    var gblSID;
    
    function angularcallbacks_0(data) {
        console.log(data);
    
    }
	
	/* it's bad to put a alert here.. the defered isn't returning the error */
    var submitAPIService = function ($http, $q) {
    
        var service = {
            submit: _submit,
            login: _login,
            update:_update,
            retrieve: _retrieve,
            getRepoData : _getRepoData
        };
        return service;

        /* it doesn't make sense to create a JSONP Post 
            the API docs says POST but it doesn't work and needs to be a get
            because of CORS, needs to be JSONP
        */
        function _submit(eventType, jsonData) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL.replace('<eventType>',eventType) + JSON.stringify(jsonData);
            // note change for jsonp The $http.jsonp will replace the JSON_CALLBACK in url with the angular.callbacks.{{callbackId}} automatically. For some reason, it failed to do so in your case. 
            
            //{
            //      method: 'GET',                              
                    //headers: {
                    //  'Content-type': 'application/json'
                    //},
            //      url : strURL
            //  })  
            
            
            $.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',              
                timeout: 10000,
                success : function(data) {
					console.log('success');
                    deferred.resolve(data);
                },
                error: function (xhr, exception) {
					sweetAlert("An error has occured. Please try again");
					deferred.reject(xhr);
                },
				/*
                complete: function(xhr, ajaxOptions, thrownError) {
					console.log('complete');
                    console.log(xhr);
                    if (xhr.status !== 200) {
                        //bootbox.alert("An error has occured. Please try again.");
                    }
                }
				*/
            });
         return deferred.promise;        
        
        /*
        var strURL = SUBMIT_URL_ANGULAR.replace('<eventType>',eventType) + JSON.stringify(jsonData);
          $http( {
            method: 'JSONP',
            url : strURL
            }) 
                .success(function(data){
                    console.log(data);
                    alert('The event was successfully submitted!');
                })
                .error(function(data, status, headers, config) {
                   console.log(status);
                });
                */
        }

        
        function _update(userName, password, eventType, eventId, jsonData) {
   
            _login(eventType, userName, password);
            var payloadStr= JSON.stringify(jsonData);
            var update = {};
            update.payload = payloadStr;
            var strURL = UPDATE_URL.replace("<eventType>",eventType).replace("<eventId>",eventId).replace("<sid>",gblSID) + JSON.stringify(update);
            $http.get(strURL)
                .success(function(data){
                    console.log(data);
                })
            .error(function(data, status, headers, config) {
                  console.log(data);
            });     
   
        }

        /*
        notes: when you logon and set a cookie, you are not suppoosed to need to put &sid. -- test this and it doesn't seem to work
        TODO: look at the api, do I need eventType?
        */
        function _login(eventType, userName, password) {

            //var uname = userid;
            //var pw = password;
            var deferred = $q.defer();
            var strURL= AUTH_URL.replace("<eventType>",eventType).replace("<userName>", userName).replace("<password>",password);
            var request = $http.get( strURL)
                .success(function(data) {
                    //setCookie('sid',data.sid);
                    gblSID = data.sid;
                    deferred.resolve(data);
                })
                .error(function(data, status, headers, config) {
                  console.log(data);
                }); 
            return deferred.promise;        

        };
        
        function _retrieve(userName, password,eventType, eventId) {
    
            var recId = $("#dataId").val();
            var deferred = $q.defer();
            _login(eventType, userName, password).then(function() {
                var strURL = RETRIEVE_URL.replace("<eventType>", eventType).replace("<eventId>", eventId).replace("<sid>",gblSID);
                deferred.resolve($http.get(strURL));            
            });
            return deferred.promise;
 
            /*
                .success(function(data) {

                    console.log(data);
                })
            .error(function(data, status, headers, config) {
                  console.log(data);
            }); 
            */
        /*
        $.ajax({
        url : "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/" + APP_NAME + "/" + recId + "/?sid=" + getCookie('sid'),
        type : "GET",
        success : function(data) {
            var o = JSON.parse(data.payload);
            $scope.$apply(function() {
                $scope.event = o.calEvent;
                $scope.event.recId = data.id;
            });
            //$("#eventName").val(o.calEvent.eventName);
                
            //$("#longDesc").val(o.calEvent.longDesc);
            //sHTML ="<h2>Events</h2>";
            //sHTML += "<table class='table table-striped table-bordered'><tr><th>Status</th><th>Event Name</th><th>Event Description</th></tr>";
            //$.each(data, function(i, item) {
                
        //      var stat = (item.status=="Yes") ? "Submitted" : item.status;
        //      sHTML += "<tr><td>" + stat + "</td><td>" + o.field + "</td><td>" + o.field2+ "</td></tr>";
            //});
            //sHTML += "</table>";
            //$("#retrieveExample").html(sHTML);
        },
        crossDomain: true, 
        dataType: 'jsonp',
        error: function (jqXHR, exception) {
            console.log(jqXHR);
        }
    });
    */
};
        
        /* notes:
        1) If I don't put a repo, then I can get multiple records for the same eventType. I think 1 for my repo, and one for eventrepo.
        */
        function _getRepoData(userName, password, repo, eventType, start, limit) {
    
            var deferred = $q.defer();
            _login(eventType, userName, password).then(function() {
                var parms = {};
               // parms.repo = repo;
                parms.limit = limit;  // has to be an integer
                parms.start = start;
                var strURL = GET_REPO_URL.replace("<eventType>",eventType).replace("<sid>",gblSID) + JSON.stringify(parms);
                deferred.resolve($http( { method: 'GET', url : strURL, cache: false}));             
                });
            return deferred.promise;
            
            /*
            strURL
            sHTML ="<h2>Events</h2>";
            sHTML += "<table class='table table-striped table-bordered' style='display: block; overflow-x: auto;'><tr><th >Status</th><th >Id</th><th>Event Name</th><th >Event Description</th><th class='col-md-3'>Item</th><th >Created</th><th class='col-md-2'>Update</th></tr>";
            // for (var i = 1; i < 100; i++) {
            var request = $.ajax({
                url : "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/retrieve/eventrepo/" + APP_NAME + "?sid=" + getCookie('sid') + "&json=" + JSON.stringify(parms),
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',
                success : function(data) {
                for (var j = 1; j < data.length; j++) {
                    var item = data[j];
                    if (typeof item !== 'undefined') {
                        var o = JSON.parse(item.payload);
                        var stat = (item.status=="Yes") ? "Submitted" : item.status;
                        sHTML += "<tr><td>" + stat + "</td><td>" + item.id + "</td><td>"  + o.calEvent.eventName + "</td><td>" + o.calEvent.longDesc+  "</td><td class='col-md-3'>" + JSON.stringify(item) + "</td><td>" + item.created +  "</td><td>" + item.updated + "</td></tr>";                    
                    }
                }
                sHTML += "</table>";
                $("#dataTable").html(sHTML);                    
            },
            error: function (jqXHR, exception) {
                console.log(jqXHR);
            }
        });

        */
    
        };




    }

    angular.module('eventCalendarApp').factory('tmpSubmitAPIService', ["$http","$q",  submitAPIService]);

}());