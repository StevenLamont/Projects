    /*
        Factory functions in angular are expected to return an object, 
        Originally this was a factory.. changed to a service.

1) getofAppCntl would not likely be used by petar's program)
2) This assumes only one event per browser (which is reasonable.. but we could cache all events?)
3) the copied code had broadcast.. but would need to be in same app for it to be of value. so my controll would have to run from petars.
https://rclayton.silvrback.com/passing-state-via-services

*/

 (function () {
    var ecCoTEventCache = angular.module('ecCoTEventCache',['ngStorage'])
    .config(['$localStorageProvider',
        function ($localStorageProvider) {
                $localStorageProvider.setKeyPrefix('COTEventCal-');
        }])
		
    function ecCoTEventCacheService( $localStorage) {
     
        //var cache = {};
        this.putEvent = function(event, appCntl){
            $localStorage.event = event;
            if (typeof appCntl !== 'undefined') {
                $localStorage.appCntl = appCntl;
            }           
        };

        this.removeEvent = function(key){
            delete $localStorage.event;
            delete $localStorage.appCntl;
        };

        this.getEvent = function(key){
            var eventCache = {};
            eventCache.event = $localStorage.event || null;
            eventCache.appCntl = $localStorage.appCntl || null;
            return eventCache;
        };

};
 angular.module('ecCoTEventCache').service('ecCoTEventCacheService', ["$localStorage",ecCoTEventCacheService]);
}());

