/*
 ngCoTSubmit.
 Uses jquery. There were issues with angular post.
 
 Call service:
        submitAPIService.submit(APP_NAME, jsonData)
            .then(function(httpCall) {
                //code here as desired per needs,
                sweetAlert("Submitted","The event was successfully submitted!","success");
                vm.progressbar.complete();
                $timeout(function() {
                    vm.event.recId = httpCall.EventMessageResponse.Event.EventID;
                    eventCalendarCacheService.removeEvent();
                    window.location.href = window.location.protocol + "//" + window.location.host +  window.location.pathname;
                },2000);
            }, function() {
                  sweetAlert("Submission Failed","The event was not submitted. Please Try again.!","error");            
            });

            
 
 
 */

 (function () {
    var SUBMIT_URL = "https://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?callback=?&json=";
    var SUBMIT_URL_ANGULAR = "https://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?callback=JSON_CALLBACK&json=";  
    var cotSubmit = angular.module('ngCoTSubmit',[]);
    
    cotSubmit.factory('submitAPIService', ["$http","$q", function($http, $q)  {
        
         var service = {
            submit: _submitAngular,

        };
        return service;
        
        function _submit(eventType, jsonData) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL.replace('<eventType>',eventType) + encodeURIComponent(JSON.stringify(jsonData));
            $.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',              
                timeout: 10000,
                success : function(data) {
                    deferred.resolve(data);
                },
                error: function (xhr, exception) {
                    deferred.resolve(xhr);
                },
           });
         return deferred.promise;   
            
        }
        
        //TODO: this kludge to replace & with _ is temporary as there is a bug in the API
        function _submitAngular(eventType, jsonData) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL_ANGULAR.replace('<eventType>',eventType) + encodeURIComponent(JSON.stringify(jsonData).replace(/\&/g,"_"));
            $http( {
                method: 'JSONP',
                url : strURL
                }) 
                .success(function(data){
                    deferred.resolve(data);
                    console.log(data);
                    //alert('The event was successfully submitted!');
                })
                .error(function(data, status, headers, config) {
                   deferred.resolve(data);
                });
            return deferred.promise; 
        }
        
        
}])
}());