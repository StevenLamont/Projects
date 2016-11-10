/*
 ngCoTSubmit.
 Uses jquery. There were issues with angular post. The angular fix is working in dev/qa but won't be in prod for a while.
 This is most likely used on the public/inter sites but a check is performed to make sure.
 
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
    var SUBMIT_URL = "/cc_sr_admin_v1/submit/<eventType>?callback=?&json=";
    //var SUBMIT_URL_ANGULAR = "/cc_sr_admin_v1/submit/<eventType>?callback=JSON_CALLBACK&json=";  
    var SUBMIT_URL_ANGULAR = "/cc_sr_admin_v1/submit/<eventType>";  
    var ATTACHMENT_UPLOAD_URL = "/cc_sr_admin_v1/upload/<eventType>/<uploadDesc>";
    var cotSubmit = angular.module('ngCoTSubmit',[]);
    
    cotSubmit.factory('CoTSubmitAPIService', ["$http","$q", function($http, $q)  {
        
         var service = {
            uploadAttachment: _uploadAttachment,
            submit: _submitPost
            //submit: _submitAngular,
            //submit: _submit,      
        };
        return service;
        
        function _submit(apiHost, eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = apiHost + SUBMIT_URL.replace('<eventType>',eventType) + encodeURIComponent(JSON.stringify(jsonData));
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
        
        function _submitPost(apiHost, eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = checkURL(apiHost + SUBMIT_URL.replace('<eventType>',eventType).replace("?callback=","").replace('&json=',""));
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
        //The adding of keepfiles could perhaps be better incorprated. For calEventm there is only only attachment.
        function _submitAngular(apiHost, eventType, jsonData, keepFiles) {
            var deferred = $q.defer();
            var strURL = apiHost + SUBMIT_URL_ANGULAR.replace('<eventType>',eventType);// + JSON.stringify(jsonData);//encodeURIComponent(JSON.stringify(jsonData));
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
        

        /* 
        
        This function expect a formData element
        
        var canvas = angular.element( document.querySelector( 'canvas' ) )[0];  
        var dataURL = canvas.toDataURL();
        var blob = dataURItoBlob(dataURL);
        var fd = new FormData();
        var thumbNailFileNameArr = vm.event.image.fileName.split('.');;
        thumbNailFileNameArr.pop(); //.join('.') + ".png";
        var thumbNailFileName = "th_" + thumbNailFileNameArr.join('.') + ".png";
        fd.append("file", blob, thumbNailFileName);
        */
        function _uploadAttachment(apiHost, eventType, uploadDesc, formData) {
            var deferred = $q.defer();
            var strURL = checkURL(apiHost + ATTACHMENT_UPLOAD_URL.replace('<eventType>',eventType).replace('<uploadDesc>',uploadDesc));

            $.ajax({
                type: "POST",
                url: strURL,
                dataType: 'json',
                processData: false,
                contentType: false,
                data: formData
            }).success(function(response) {
                deferred.resolve(response);
            }).error(function(response) {
                deferred.resolve(response);
            });
            
             return deferred.promise; 
        
        }
        
        function checkURL(url) {
            if (url.indexOf("inter") > -1 ||  window.location.host === "secure.toronto.ca") {
                return url.replace("_admin","");
            } else {
                return url;
            }
        
        }
        
        
}]);
}());