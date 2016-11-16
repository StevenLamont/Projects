'use strict';

angular.module('ngCoTNotify',[])
  .factory('CoTNotifyService', ['$rootScope', function($rootScope) {
    return {
      subscribe: function(scope, callback) {
        var handler = $rootScope.$on('notifying-service-event', callback);
        scope.$on('$destroy', function(){
          //console.log("Unregistering listener");
          handler();
        });
      },

      notify: function(args) {
        //console.log("Notifying...",args);
        $rootScope.$emit('notifying-service-event', args);
      }
    };
}]);
