angular.module('eventCalendarApp')
    .config(['$stateProvider','$urlRouterProvider','$locationProvider',  function($stateProvider, $urlRouterProvider,$locationProvider) {
        
        $urlRouterProvider.otherwise(function($injector) {
            var $state = $injector.get('$state');
            $state.go('main');
            //$injector.invoke(['$state','$timeout', function($state,$timeout) {
            //  $timeout(function(){
            //      $state.go('main');
            //  });
            //)]);
        });
        
        /* in IE11, using url '/' will cause a loop.. so use url: '' 
           /edit is only needed by admin module and then this config won't be used, so If I want to test edit mode, I can do it in Chrome
        */
        $stateProvider
            .state('main', {
                url: '',
                templateUrl: 'html/eventForm.html',
                data : { 'opMode': 'new'}
            })
            /* this could be removed..this path is only needed in the admin tool to get to edit mode. */
            .state('edit', {
                url: '/edit',
                templateUrl: 'html/eventForm.html',
                data : { opMode: 'update'}
            });
    }]);

