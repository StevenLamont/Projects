/*
 ngCoTSubmit.
 Uses jquery. There were issues with angular post. The angular fix is working in dev/qa but won't be in prod for a while.
 
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
    //var SUBMIT_URL_ANGULAR = "https://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>?callback=JSON_CALLBACK&json=";  
    var SUBMIT_URL_ANGULAR = "https://was8-inter-dev.toronto.ca/cc_sr_v1/submit/<eventType>";  
    var cotSubmit = angular.module('ngCoTSubmit',[]);
    
    cotSubmit.factory('submitAPIService', ["$http","$q", function($http, $q)  {
        
         var service = {
            submit: _submitPost,
            //submit: _submitAngular,
            //submit: _submit,      
        };
        return service;
        
        function _submit(eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL.replace('<eventType>',eventType) + encodeURIComponent(JSON.stringify(jsonData));
            if (keepFiles) {
                strURL += "&keepFiles=" + keepFiles;            
            }           
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
                }
           });
         return deferred.promise;   
            
        }
        
        function _submitPost(eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL.replace('<eventType>',eventType).replace("?callback=","").replace('&json=',"");
            if (keepFiles) {
                strURL += "&keepFiles=" + keepFiles;            
            }   
			var d=JSON.stringify(jsonData);			
            $.ajax({
                url :  strURL,
                type : "POST",
                //data: JSON.stringify(jsonData),
				data: {json:(d)},
                //crossDomain: true, 
                dataType: 'json',      
                cache: false,               
                timeout: 10000,
                success : function(data) {
                    deferred.resolve(data);
                },
                error: function (xhr, exception) {
                    deferred.resolve(xhr);
                }
           });
         return deferred.promise;   
            
        }       
        //TODO: this kludge to replace & with _ is temporary as there is a bug in the API - .replace(/\&/g,"_")
        //The adding of keepfiles could perhaps be better incorprated. For calEventm there is only only attachment.
        function _submitAngular(eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = SUBMIT_URL_ANGULAR.replace('<eventType>',eventType);// + JSON.stringify(jsonData);//encodeURIComponent(JSON.stringify(jsonData));
            //if (keepFiles) {
            //  strURL += "&keepFiles=" + keepFiles;            
            //}
			var d=JSON.stringify(jsonData);
            $http( {
                method: 'POST',
                url : strURL,
				data: {json:(d)},
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
				}
                }) 
                .success(function(data){
                    deferred.resolve(data);
                    console.log(data);
                })
                .error(function(data, status, headers, config) {
                   deferred.resolve(data);
                });
            return deferred.promise; 
        }
        

        
        
        
}]);
}());