angular.module('eventCalendarApp')
    .config(['$stateProvider','$urlRouterProvider',  function($stateProvider, $urlRouterProvider) {
      
		//$urlRouterProvider.otherwise('/');

		$urlRouterProvider.otherwise(function($injector) {
			console.log('goto main');
			$injector.invoke(['$state','$timeout', function($state,$timeout) {
				$timeout(function(){
					$state.go('main');
				});
			}]);
		});
		
		$stateProvider
			.state('main', {
				url: '/',
				templateUrl: 'html/eventForm.html',
				data : { 'opMode': 'new'}
			})
			/* this will be removed..this only appears in Petars app to bridge to mine in edit mode. */
			.state('edit', {
				url: '/edit',
				templateUrl: 'html/eventForm.html',
				data : { opMode: 'update'}
			});
	}]);

