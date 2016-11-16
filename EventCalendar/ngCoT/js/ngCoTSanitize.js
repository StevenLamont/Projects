 (function () {  
    'use strict';
    /**
    * The ng-CoT-Sanitize directive
    * @author: Steve Lamont
    * @version: 0.1.0, 2016-10-04
    * http://stackoverflow.com/questions/31656190/why-do-ng-bind-html-and-sanitize-produce-different-results
	* This would kick in on every key change, so bad in some sense when backspace over changed <
	* ideally this is kicked off after the field has changed. but then I had a hard time updating controller value. (field value no problem)
	* http://stackoverflow.com/questions/18249677/how-to-update-angularjs-model-from-directive-linking-function
    */

      var santizeApp = angular.module('ngCoTSanitize',[])        
		.directive('cotSanitize', ['$sanitize', '$parse', '$sce',
			function($sanitize, $parse, $sce) {
				return {
					restrict: 'A',
					replace: true,
					scope: true,
					require: 'ngModel',
					link: function(scope, element, attrs, ngModelCtrl) {
						//This updates the field value after the model has been updated. (see: ng-change src code)
						//ngModelCtrl.$viewChangeListeners.push(function() {
						//	element.val($sanitize(element.val()));
						//});
						
						/* ATTEMPT 2
						scope.$watch(attrs.ngModel, function (newValue, oldValue) {
							if(newValue != oldValue) {
								element.val($sanitize(element.val()));
								//console.log('value changed, new value is: ' + newValue + " " +  oldValue );
								//attrs.ngModel = $sanitize(newValue);
								//console.log('value changed, new value is: ' + newValue + " " +  oldValue );
							}
						});
						*/
						scope.$watch(attrs.ngModel, function (newValue, oldValue) {
							ngModelCtrl.$setViewValue($sanitize(element.val()));
							ngModelCtrl.$render();
						});
						
					}
				};
			}
		]);
}());
