var CC_API = function (opt_options) {

/* 1) do I resolve errors, or just do an alert..
      I reject the deferred and the calling program, can trap with a fail() if desired. I've commnented out the alerts and they should be removed.

    2) The assumption is that the app logs the user In and that a cookie contains the SID.
       We don't do any idle session processing.  When we do an update/delete we re-check the session.  If it is no longer there, the attempt is rejected.
       
       Perhaps we could have an option that is slightly different.  When the user logs in, we validate them, then save the userid/password.
       On every update/delete we could call and create a new session, so the user is never timed out in a session and then the session is alive as long the browser is alive.
       In this case we would pass userid/password as parms to the functions
    
    3) We are not fully using options here.. we pass a timeout parm, but I could pass the EventType as an Option, 
          and then use it instead of passing them in call patterns but perhaps you'll hit multiple event types.    
    
    4) any failure should return back an object of {type: xxx, error: yyy, expiredSession : true}  where expiredSession is a special case.
    
    
    Notes: I can trap a '500' error on a post, but I can't seem to get to work on a GET. These APIs use mostly GETs 
	
	5) I could make this such that all NProgress call are conditional on them being loaded.. (if you used this lib strictly for retrieval, then there is no need for nProgress)
*/
    
    if (typeof NProgress === 'undefined') {
        alert("NProgress must be loaded before using this library");
    }
    this.options = opt_options || {};
    this.stdTimeout =  this.options.timeout || 5000;
    this.API_HOST = this.options.apihost || "";
    this.AUTH_URL = this.API_HOST + "/cc_sr_admin_v1/session"; // ?app=<eventType>&user=<userName>&pwd=<password>";
    
    this.GET_REPO_URL = this.API_HOST + "/cc_sr_admin_v1/retrieve/eventrepo/<eventType>?callback=?&sid=<sid>&json=" ; 
    //Documentation says we could update via this.. (but not a status update).  But this never seems to work (use with POST")
    //this.UPDATE_URL = "https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/submit/<eventType>/<eventId>?sid=<sid>&json=";
    this.UPDATE_URL = this.API_HOST + "/cc_sr_admin_v1/retrieve/eventrepo/<eventType>/<eventId>?callback=?&sid=<sid>&json=";
    this.SUBMIT_URL = this.API_HOST + "cc_sr_v1/submit/<eventType>?callback=?&json=";
    NProgress.configure({ showSpinner: false });

};

//CC_API.prototype.appAlert = function(title, msg) {
//
//    bootbox.dialog({ title:  title , message: msg,buttons: { success: { label: "OK", className: "btn-success" }}});
//};
CC_API.prototype.repoLogin = function(eventType, userName, password) {

    var deferred = $.Deferred();    
    var strURL= this.AUTH_URL + "?app=" + eventType + "&user=" + userName + "&pwd=" + password;
    var request = $.ajax({
                url : strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',
                timeout: this.stdTimeout,
                success : function(data) {
                    if (typeof data.sid !== 'undefined') {
                        setCookie('sid',data.sid);
                        setCookie('cot_uname',data.userID);
                        deferred.resolve(data);
                    } else {
                       // CC_API.prototype.appAlert("Login Error",data.error);
                        deferred.reject({'type': "Login Error", error:data.error} );
                    }
                },
                error: function (jqXHR, exception) {
                    //CC_API.prototype.appAlert("Login Error","A common component API service has failed. Please try again at another time.");
                    deferred.reject({'type': "Login Error", error:"A common component API service has failed. Please try again at another time."});
                    console.log(jqXHR);
                }
    });         
    return deferred;        
};

CC_API.prototype.checkSession = function() {
    console.log('checkSession');
    var deferredC = $.Deferred();    
    var strURL= this.AUTH_URL + "/" + getCookie('sid');
    var request = $.ajax({
                url : strURL,
                type : "GET",
                crossDomain: true, 
                timeout: this.stdTimeout,
                dataType: 'jsonp',
                thisObj: this,
                success : function(data) {
                    console.log('checkSession Success');
                    if (typeof data.error !== 'undefined') {

                        if (data.error === 'no_such_session') {
                            //CC_API.prototype.appAlert("Session Problem","Your session has timed out.");
                            deferredC.reject({'type': "Session Problem", error:"Your session has timed out.", expiredSession : true});
                        } else {
                            //CC_API.prototype.appAlert("Error",data.error);
                            deferredC.reject({'type': "Session Problem", error: data.error});
                        }

                    } else {
                        deferredC.resolve(this.thisObj,data);             
                    }
                },
                error: function (jqXHR, exception) {
                    console.log('checkSession Error');
                    //CC_API.prototype.appAlert("Session Check Error","A common component API service has failed. Please try again at another time.");
                    deferredC.reject({'type': "Session Check Error", error:"A common component API service has failed. Please try again at another time."});
                    console.log(jqXHR);
                }
    });         
    return deferredC;        
};
   
/*   
function getRepoData(userName, password, repo, eventType, start, limit) {
    
    var deferred =  $.Deferred();
    repoLogin(eventType, userName, password).done(function() {
        var parms = {};
               // parms.repo = repo;
        parms.limit = limit;  // has to be an integer
        parms.start = start;
        parms.status = 'Yes';
        var strURL = GET_REPO_URL.replace("<eventType>",eventType).replace("<sid>",gblSID) + JSON.stringify(parms);
        var request = $.ajax({
                url : strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',
                success : function(data) {
                    gblRepoData = data;
                    deferred.resolve(data);
                },
            error: function (jqXHR, exception) {
                console.log(jqXHR);
            }
        });     
    });
    return deferred;
    
}
*/
CC_API.prototype.getRepoData = function(eventType, repo, status, start, limit) {
    var deferred = $.Deferred();   
    this.checkSession().done(function(thisObj) {
        var parms = {};
        if (typeof repo !== 'undefined' && repo !== null) { parms.repo = repo; }
        if (typeof status !== 'undefined' &&  status !== null) {parms.status = status;}
        if (typeof limit !== 'undefined' &&  limit !== null) {parms.limit = parseInt(limit,10);}  // has to be an integer        
        if (typeof start !== 'undefined' &&  start !== null) { parms.start = parseInt(start,10);} // has to be an integer        
        
        var strURL = thisObj.GET_REPO_URL.replace("<eventType>",eventType).replace("<sid>",getCookie('sid')) + JSON.stringify(parms);
        var request = $.ajax({
                url : strURL,
                type : "GET",
                timeout: this.stdTimeout,
                crossDomain: true, 
                dataType: 'jsonp',
                success : function(data) {
                    gblRepoData = data;
                    deferred.resolve(data);
                },
                error: function (jqXHR, exception) {
                    //CC_API.prototype.appAlert("Data Retreival Error","A common component API service has failed. Please try again at another time.");
                    deferred.reject({'type': "Data Retreival Error", error:"A common component API service has failed. Please try again at another time."});
                    console.log(jqXHR);
                }
            });     
        })
        .fail(function(error) {
            deferred.reject(error);
        });
    return deferred;
};

CC_API.prototype.updateRepoEntry = function(eventType, eventId, jsonData) {
    NProgress.start();
    var deferred = $.Deferred();          
    this.checkSession()
        .done(function(thisObj) {  
            var payloadStr= JSON.stringify(jsonData);
            var update = {};
            update.payload = payloadStr;
            //update = jsonData; if using POST and /submit login.. then I wouldn't need payload
            var strURL = thisObj.UPDATE_URL.replace("<eventType>",eventType).replace("<eventId>",eventId).replace("<sid>",getCookie('sid')) + encodeURIComponent(JSON.stringify(update));
            var request = $.ajax({
                url : strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',     
                timeout: this.stdTimeout,
                success: function(data){
                    NProgress.done();
                    console.log(data);
                    deferred.resolve(data);
                    
                },
                error: function (jqXHR, exception) {
					 NProgress.done();
                    //CC_API.prototype.appAlert("Updated Failed.","A common component API service has failed. Please try again at another time.");
                    deferred.reject({'type': "Updated Failed.", error:"A common component API service has failed. Please try again at another time."});
                    console.log(jqXHR);
                }
        })
        .fail(function(error) {
            deferred.reject(error);
        });
    });
    return deferred;
};

/* if I go a post (and no JSONP) then I can trap a 500 error */
CC_API.prototype.updateRepoEntryStatus = function(eventType, eventId, status) {
    NProgress.start();
    console.log("delete " + eventId);
    var deferredUS = $.Deferred();
    this.checkSession()
        .done(function(thisObj) {  
            var update = {};
            update.status = status;
            var strURL = thisObj.UPDATE_URL.replace("<eventType>",eventType).replace("<eventId>",eventId).replace("<sid>",getCookie('sid')) + encodeURIComponent(JSON.stringify(update));
            var request = $.ajax({
                url : strURL,
                type : "GET",
                crossDomain: true, 
                timeout: this.stdTimeout,
                dataType: 'jsonp',              
                success: function(data){
                    NProgress.done();
                    console.log(data);
                    deferredUS.resolve(data);
                },
                error: function (jqXHR, exception) {
                    NProgress.done();
                    deferredUS.reject({'type': "Delete Failed.", error:"A common component API service has failed. Please try again at another time."});
                   // CC_API.prototype.appAlert("Delete Failed.","A common component API service has failed. Please try again at another time.");
                    console.log(jqXHR);
                }
                });
            request.fail(function() {
                    alert('500 fail');  //only works on a post
                });
            })
        .fail(function(error) {
            deferredUS.reject(error);
        });         
    return  deferredUS; 
};

CC_API.prototype.submitNewRepoEntry = function(jsonData) {
    NProgress.start();
    var deferred = $.Deferred();
    var strURL = this.SUBMIT_URL.replace('<eventType>',APP_EVENT_TYPE) + encodeURIComponent(JSON.stringify(jsonData));
    
    var request = $.ajax({
        url :  strURL,
        type : "GET",
        crossDomain: true, 
        dataType: 'jsonp',              
        timeout: this.stdTimeout,
        success : function(data) {
            NProgress.done();
            deferred.resolve(data);
        },
        error: function (jqXHR, exception) {
            NProgress.done();
            //CC_API.prototype.appAlert("Submission Failed.","A common component API service has failed. Please try again at another time.");
            deferred.reject({'type': "Submission Failed", error:"A common component API service has failed. Please try again at another time."});
        }
    });
    return deferred;   
};