/*** Services for authenticating and authorizing users in AngularJS
* @author Petar Lalovic <petar.lalovic@toronto.ca>
* @version v1.0.0
* @link https://github.com/CityofToronto/ng-login.git
* @license MIT
*/
(function() {
'use strict';

angular.module('ngCoTLogin', ['CoTLogin.loginoptions', 'CoTLogin.userroles', 'CoTLogin.sessionservice', 'CoTLogin.loginservice'])
  .constant('AUTH_EVENTS', {
    loginSuccess : 'auth-login-success',
    loginFailed : 'auth-login-failed',
    logoutSuccess : 'auth-logout-success',
    sessionTimeout : 'auth-session-timeout',
    notAuthenticated : 'auth-not-authenticated',
    notAuthorized : 'auth-not-authorized'
  })
  // from authInterceptor.js and https://github.com/witoldsz/angular-http-auth/blob/gh-pages/lib/http-auth-interceptor.js
  .config(['$httpProvider', function($httpProvider) {
    var interceptor = ['$rootScope', '$q', 'AUTH_EVENTS', function($rootScope, $q, AUTH_EVENTS) {
      return {
        responseError : function(response) {
          $rootScope.$broadcast({
            401 : AUTH_EVENTS.notAuthenticated,
            403 : AUTH_EVENTS.notAuthorized,
            419 : AUTH_EVENTS.sessionTimeout,
            440 : AUTH_EVENTS.sessionTimeout
          }[response.status], response);
          return $q.reject(response);
        }
      };
    }];
    $httpProvider.interceptors.push(interceptor);    
  }]);

angular.module('CoTLogin.loginoptions', [])
  .provider('CoTLoginOptions', function() {
    var options = {
      endpoint : 'http://localhost:8080',
      app : 'app'
    };

    this.setOptions = function(value) {
      options = value;
    };

    this.getLoginOptions = function() {
      return options;
    }

    this.$get = function() {
      var svc = {
        getLoginOptions: function() {
          return options;
        }
      };
      return svc;
    };
});

angular.module('CoTLogin.userroles', [])
  .provider('CoTUserRoles', function() {
    var options = {
      all : '*',
      admin : 'admin',
      editor : 'editor',
      guest : 'guest'
    };

    this.setOptions = function(value) {
      options = value;
    };

    this.getUserRoles = function() {
      return options;
    }

    this.$get = function() {
      var svc = {
        getUserRoles: function() {
          return options;
        }
      };
      return svc;
    };
});

angular.module('CoTLogin.sessionservice', [])
  .service('CoTSession', function() {
    var sessSvc = this;
    
    sessSvc.create = function(user) {
      this.user = user;
      this.sessionId = user.sid;
      this.userRoles = user.cotUser.groupMemberships;
    };
    sessSvc.destroy = function() {
      this.user = null;
      this.sessionId = null;
      this.userRoles = null;
      console.log("Session destroyed.");
    };
    return sessSvc;
});

angular.module('CoTLogin.loginservice', [])
  .service('CoTLoginService', ['$http', '$rootScope', '$window', 'CoTSession', 'AUTH_EVENTS', 'CoTLoginOptions', function($http, $rootScope, $window, CoTSession, AUTH_EVENTS, CoTLoginOptions) {
    var loginService = {};

    var options = CoTLoginOptions.getLoginOptions();
    
    var config = {
      headers : {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8;'
      }
    };
    
    var setEndpoint = loginService.endpoint = function(value) {
      options.endpoint = value;
    };

    var setApp = loginService.app = function(value) {
      options.app = value;
    };

    var setOptions = loginService.options = function(value) {
      options = value;
    };

    loginService.login = function(user, success, error) {
      var data = $.param({
        user: user.username,
        pwd: user.password,
        app: options.app
      });

      $http.post(options.endpoint, data, config)
        .then(
          function(response) {
            if (response.data.error) {
              $rootScope.$broadcast(AUTH_EVENTS.loginFailed);
              error("The system could not log you in. Please check your username/password and try again.");
            } else {
              if (response.data) {
                try {
                  // Currently the response from the Login API call returns the User Info as well as the Session ID
                  // Set the Session object and sessionStorage to be available in the case of browser refresh
                  $window.sessionStorage[options.app+"_userInfo"] = JSON.stringify(response.data);
                  $window.sessionStorage[options.app+"_sessionId"] = response.data.sid;
                  loginService.createSession(response.data);
                  $rootScope.currentUser = response.data;
                  $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
                  success(response.data);
                } catch (exception) {
                  $rootScope.$broadcast(AUTH_EVENTS.loginFailed)
                  error("The system encountered an unexpected error. Please try again later.");
                }
              } else {
                $rootScope.$broadcast(AUTH_EVENTS.loginFailed)
                error("The system encountered an unexpected error. Please try again later.");
              }
            }
          },
          function(errResponse) {
            $rootScope.$broadcast(AUTH_EVENTS.loginFailed)
            error("The system is currently unavailable. Please try again later.");
          }
        );
    };

    loginService.checkSession = function(success, error) {
      var sessionId;
      if ($window.sessionStorage[options.app+"_userInfo"]) {
        sessionId = $window.sessionStorage[options.app+"_sessionId"];
      }
      if (!sessionId) {
        return false;
      } else {
        return $http.get(options.endpoint+'/'+sessionId)
        .then(
          // Currently the response from the Check Session API call only returns the User Info (it does not include the Session ID -- this has been identified as a bug)
          function(response) {
            success(response, sessionId);
          },
          function(errResponse) {
            error(errResponse);
          }
        );
      } 
    };

    loginService.createSession = function(data) {
      CoTSession.create(data);
    };

    //check if the user is authenticated
    loginService.isAuthenticated = function() {
      var response = loginService.checkSession(function(response, sessionId) {
        if (response.data) {
          try {
            // Set the Session object and sessionStorage to thwart tampering and to be available in the case of browser refresh
            $window.sessionStorage[options.app+"_userInfo"] = JSON.stringify(response.data);
            $window.sessionStorage[options.app+"_sessionId"] = sessionId;
            // Since the response is missing the Session ID, we need to add it in ourselves by using the value from Session Storage
            var aResponse = response.data;
            aResponse.sid = sessionId;
            loginService.createSession(aResponse);
            $rootScope.currentUser = aResponse;
            return true;
          } catch (exception) {
            return false;
          }
        } else {
          return false;
        }
      }, function(errResponse) {
        return false;
      });
      return response;
    };
    
    // Check if the user is authorized to access the next state
    // This function can be also used on element level
    // e.g. <p ng-if="isAuthorized(authorizedRoles)">Admin content</p>
    loginService.isAuthorized = function(authorizedRoles) {
      if (!angular.isArray(authorizedRoles)) {
        authorizedRoles = [authorizedRoles];
      }
      try {
        var newArr = JSON.parse($window.sessionStorage[options.app+"_userInfo"]).cotUser.groupMemberships.filter(function(n) {
          return authorizedRoles.indexOf(n) != -1;
        });
      } catch (exception) {
        $rootScope.$broadcast(AUTH_EVENTS.notAuthorized)
      }
      return newArr.length > 0;
    };
    
    // log out the user, clear Session Storage, destroy the session, and broadcast the logoutSuccess event if login dialog needs to be shown immediately
    loginService.logout = function(showLogin) {
      $window.sessionStorage.removeItem(options.app+"_userInfo");
      $window.sessionStorage.removeItem(options.app+"_sessionId");
      CoTSession.destroy();
      if (showLogin) {
        $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
      }
    };

    return loginService;
}]);

})();
