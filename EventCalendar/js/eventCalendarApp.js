(function () {   
    var eventCalendarApp = angular.module('eventCalendarApp',
        ['ui.router','ngMessages','isteven-multi-select','ui.bootstrap.showErrors','ui.bootstrap', 'ui.dateTimeInput','ui.bootstrap.datetimepicker',
         'uiGmapgoogle-maps','ui.utils.masks','ngStorage','oitozero.ngSweetAlert','angularFileUpload','ngProgress','eventCalendarCache','ngCoTForms','ngCoTSubmit', 'ngCoTThumb','ngCoTGoogleMapUtils','ngLogin'])
        .config(['uiGmapGoogleMapApiProvider', function(GoogleMapApiProviders) {
                GoogleMapApiProviders.configure({
                //v: '3.17',
                libraries: 'drawing,places,geometry',
                 /*key: 'AIzaSyA9Io-J9gljYer98DORl5JwTgP-T9_H5GM'  -- cot doesn;'t wqork with localhost */
                key: 'AIzaSyBXL8BLQRlaYJAQEgGTvASronb5yKWYKRg '
            });
            }])
        //http://solutionoptimist.com/2013/10/07/enhance-angularjs-logging-using-decorators/
        .config(['$logProvider', function ($logProvider) {
             $logProvider.debugEnabled(false);
        }])
  ;		
  
eventCalendarApp.run(['$rootScope','$log',
  function($rootScope, $log) {
  
  // angular.forEach(['$stateChangeError', '$stateChangeStart', '$stateChangeSuccess', '$stateNotFound', '$stateChangeCancel'],
  //          function (event) {
  //              $rootScope.$on(event, function () {
  //                  console.log(event + ':');
  //                  console.log(arguments);
  //              });
  //          }
  //          );
            
    /*
    $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams) {
        console.log('going to', toState.name, 'from', fromState.name);
    });
    */
    // see what's going on when the route tries to change
    /*
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
      // next is an object that is the route that we are starting to go to
      // current is an object that is the route where we are currently
      var currentPath = "";
      if (current) currentPath = current.originalPath;
      var nextPath = next.originalPath;

      $log.debug('Starting to leave %s to go to %s', currentPath, nextPath);
    });
    $rootScope.$on('$locationChangeStart', function(event, newUrl, oldUrl) {
      // both newUrl and oldUrl are strings
      $log.debug('loc:Starting to leave %s to go to %s', oldUrl, newUrl);
    });  
    */
	$rootScope.Utils = {
		ObjectKeys : Object.keys
	}
  }
  
  //http://stackoverflow.com/questions/25299436/unable-to-call-object-keys-in-angularjs
 
]);

}());