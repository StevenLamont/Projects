(function () {
/* Author: Steve Lamont
   Date: 2016/10/01

   SML Notes:
    issues/Notes with google maps.
    a) use config option on App, but you don't know when the libraries are loaded, so can't use constants right away
       --> hence MapAPI and MapIsReady events.
    b) within these events, if you change scope, you need to do it in a timeout or you get digest errors and the changes are not recoginized
    c) Like any google map, if you draw it in a hidden div, the height is 0 and you need to refresh it when you open the div.
        To get the map to refresh, I put a click on tab to change a scope variable, and then I watch the scope variable to see if it changes.
        (I tried many options, and this one seemed to work best)
    d) we also do not want to refresh any map that is not shown as this can mess up the map. We changed the way maps are shown and by default they are not shown.
    e) if I put an ng-click on the <li> to a function that doesn't exist yet.it causes problems or it doesn't work. so I create an empty function and update it later
    f) to use places, there is now a new authorization in the google dev console which must be authorized.
    
    
    1) As a convenience, AngularJS provides $timeout, which is like setTimeout, but automatically wraps your code in $apply by default. Use that, not this
    If you write any code that uses Ajax without $http, or listens for events without using Angular’s ng-* listeners, or sets a timeout without 
    $timeout, you should wrap your code in $scope.$apply


    Image Processing.
    1) If we reload an event from localstorage and there is a binId, the user will not know this and the image thumbnail will not be there. There is really nothing we can do. The code acutally blanks out any image info.  
    2) When we edit the event (an administrator) will have a session, so we can retrieve the image form the database. We will have a download button for the user to see the image.
      
    4) http://stackoverflow.com/questions/9155136/chrome-file-upload-bug-on-change-event-wont-be-executed-twice-with-the-same-fi
      
    Dates:
        I didn't put an edit on the start time and end time of weekly event because an event might start at 9:pm and end at 1:00AM. 
        
    General Notes:
        Ad blocker uOrigin was blocking idcsMultiTrack 
        
    Sanitize: I created a santize directive.. but it was for every keystroke which causes problems on backspaces. (and maybe slow)
        I end up creating a "onChange" event.  This isn't the best and rhe way I pass parms is kludgy
        The other option is to sanitize on submission when validating fields.
        Ideally I need a directive that fires after the model is updated and changes the model value.

    When using 'update' mode, you could be on an "intra" site and use the cc_sr_admin_v1 apis
             while in public submission mode we should on the "inter" site and use cc_sr_v1 apis.
    
*/
    var API_PATH = "cc_sr_admin_v1";
    //localhost
    //var API_HOST = "https://was-inter-qa.toronto.ca";
    //API_HOST = "https://was8-inter-dev.toronto.ca";
    var API_HOST = "https://was8-intra-dev.toronto.ca";
    var APP_REPO = "dev_eventcal"; // this is really EventType
    var APP_NAME = "dev_eventcal"; // this is really EventType
    //normal
    //var API_HOST = ""; 
    //var APP_REPO = "edc_eventcal"; // this is really EventType
    //var APP_NAME = "edc_eventcal"; // this is really EventType
    
    
    
    var MAP_CENTER = { lat:  43.69587827770483, lng:  -79.45175170898438 };
    var RESET_ZOOM_LEVEL = 16;  
    var MAP_TAB = 4; //step in process which contains map which requires 'special' refresh process
    var markerIcons = {'normal'   : '//maps.google.com/mapfiles/ms/icons/blue-dot.png',
                       'selected' : '//maps.google.com/mapfiles/ms/icons/red.png'
                       };
    var polyFills = { 'normal'  : {fillColor:'#000000', strokeColor: '#000000', strokeWeight: 2},
                      'selected': {fillColor:'#FF0000', strokeColor: '#FF0000', strokeWeight: 4}
                    };
    var geocoder;        
    var gblPlacesMapMarkers = [];
    var CommonInfoWindow = null;
    
    
    function EventCalendarController( $rootScope, $scope, $sanitize, $sce, $log,  $state, $parse,$http, $timeout, $document, uiGmapGoogleMapApi, uiGmapIsReady, FileUploader,  ngProgressFactory, ecCoTEventCacheService, ecCoTDataService, ecCoTUtilService, tmpSubmitAPIService, CoTSubmitAPIService, CoTGoogleMapUtilsService, CoTSession, CoTUserRoles, CoTNotifyService)  /*ignore parms*/{
                                    
    var vm = this;
    vm.roles = CoTSession.userRoles; // need to know all the roles for this user
    vm.admin = CoTUserRoles.getUserRoles().admin; // need to know what the admin role is called for this application
    vm.approver = CoTUserRoles.getUserRoles().approver; // need to know what the approver role is called for this application
    vm.editor = CoTUserRoles.getUserRoles().editor; // need to know what the editor role is called for this application

    vm.MAX_TABS = 7;  // number of steps. i should probably calculate this on ready.
    
    $log.debug($state.current.data);
    vm.opMode = $state.current.data.opMode;
    vm.acceptableChars = /^[a-zA-Z0-9 \.]*$/;

    /* view related variables, with 'event' being the most important */
    vm.canDebug = true;
    vm.debug = false;
    vm.recIdInput = "";
    vm.userId = "";
    vm.pw= "";
    vm.appRepo = APP_REPO;

    vm.eventDefaults = {terms : "", recId : null, category : [], locations : [{ id: ecCoTUtilService.guid(), type: 'marker'}], admin : { newsletterCategory : [], newsletterSubcategory : [], includeInNewsletter : false, featuredEvent :false}};
    vm.event = {terms : "", recId : null};
    vm.weeklyDatesIM = [];
    vm.appCntl = { tab : 1, showMap : false };
    vm.locationTabClicked = false;    
    vm.progressbar = ngProgressFactory.createInstance();
    
    vm.newImageInUse = false;
    vm.imageURL = "";
    vm.locIndex  = -1;
    vm.occurIndex = -1;
    vm.showSubmit = false;

    vm.terms = function(response) {
        vm.event.terms = response;
        if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms:' + response);
        focusFirstElementInTab();
    };
    vm.isSportsSelected = true;
    vm.newsletterSubCatRequired = false;
    ecCoTDataService.eventFeatures().then(function(data) {
        vm.availableFeatures = data; 
    });

    ecCoTDataService.helpText().then(function(data) {
        vm.helpText = data; 
    });
     
    vm.daysOfWeek = ecCoTDataService.daysOfWeek();
    
    /* map related view variables */
    vm.selectedShape = null;
    vm.mapMarkers = [];
    vm.map = { center: { latitude:  43.69587827770483, longitude:  -79.45175170898438 }, zoom: 10};
    vm.map.options = { MapTypeId: "satellite"};  // I don't have the google libraries loaded yet.. so can't use constants.
    vm.map.mapControl = {};
    vm.searchbox = { 
        template:'ngCoT/shared/searchbox.tpl.html', 
        events:{ places_changed: googlePlaces }
    };

    /* -- view function references -- */
    vm.limitSelection = ecCoTUtilService.limitSelection;
    vm.clearSelection = ecCoTUtilService.clearSelection;
    vm.blur = function(selector) {
        $log.debug("blur:" + selector);
        angular.element(selector).blur();
    };
    vm.sanitize = sanitize;
    vm.setTab = setTab;
    vm.resetForm = resetForm;
    vm.addOccurrenceDateRow = addOccurrenceDateRow;
    vm.removeOccurrenceDateRow = removeOccurrenceDateRow;
    vm.addWeeklyOccurrenceRow = addWeeklyOccurrenceRow;
    vm.removeWeeklyOccurrenceRow = removeWeeklyOccurrenceRow;
    vm.frequencyChanged = frequencyChanged;
    //Because i changed relevant sections to use NG-IF over NG-Show. I don't need to worry about errors that become hidden as NG-IF removes the component from the DOM unlike ng-show which hides it.
    vm.gotoHomePage = function() {
        ecCoTEventCacheService.removeEvent();
        window.location.href = "http://toronto.ca";        
    };
    
    vm.beforeRenderEndDateTime =  beforeRenderEndDateTime;
    vm.beforeRenderStartDateTime =  beforeRenderStartDateTime;
    
    vm.addLocation = addLocation;
    vm.removeLocation = removeLocation;
    vm.locationNameChanged = function(idx) { CommonInfoWindow.close();};
    vm.verifyLocationAddress = verifyLocationAddress;
    vm.locationAddressChanged = function(idx) {
        vm.event.locations[idx].geoCoded = false;
        verifyLocationAddress(idx);
    };
    vm.displayAddressIndChanged = function(idx) {
        if ( !vm.event.locations[idx].displayAddressInd) {
            delete vm.event.locations[idx].displayAddress;
        }
    };
    vm.deleteSelectedShape = deleteSelectedShape;
    vm.PSIEntered = function() {
        if (!_.isEmpty(vm.event.eventEmail) ||
            !_.isEmpty(vm.event.eventPhone) ||
            !_.isEmpty(vm.event.eventWebsite)) {
            return false;
        } else {
            return true;
        } 
    };
        
    vm.submit = submit;
    vm.preview = preview;

    vm.nextTab = nextTab;
    vm.prevTab = prevTab;
    vm.showTab = showTab;
    vm.updateRecord = updateRecord;
    vm.approveRecord = approveRecord;
    vm.getAllRecords = getAllRecords;
    vm.getOneRecord = getOneRecord; 
    vm.returnRecord = returnRecord;
    vm.cancelEdit = function () {
       if (vm.appCntl.callerState) {
            $state.go(vm.appCntl.callerState);
        }
    };   
    
    vm.toggleMap = function () {
        vm.appCntl.showMap = !vm.appCntl.showMap;
        vm.refreshMap();
    };
    

    vm.refreshMap = function(){ };//This function is completed once google api loaded but is needed now for angular binding
    vm.resetMap = resetMap;
        
    vm.drawingManagerOptions = {};    
    vm.drawingManagerControl = {};  
    
    /* we broadacast to the other datepickers that a key date has changed and thus they need to re-render their views 
       problem: If we debounce in the model-options, it messes the formmaters. *check this
       if we don't debounce, this calls on each keystroke.. and we have too many events.
       we can't blur because the control isn't moving to the next field. (i changed the html so that tabbing is working better)
    
        onChange on the picker is ok.. as the change comes in all at once.
        
        If the person uses the picker after manually setting the date, we need to blur as well.
    */
    vm.eventDateChanged = function (fromDt, toDt) {
        $scope.$broadcast('eventdatechange');          
    };
    
    vm.eventDateBlur = eventDateBlur;
    vm.eventOccurDateBlur = eventOccurDateBlur;
    
    /* Once the document is ready*/
    angular.element(document).ready(function () {
    
        
        $log.debug('angular ready');
        //vm.MAX_TABS =  document.getElementsByClassName("btntitle").length;
        var eventCache = ecCoTEventCacheService.getEvent();
        if (eventCache.event === null) {
            $log.debug("loading event defaults");
            angular.copy(vm.eventDefaults,vm.event);
            setupUploader();
            resetViewState();
        } else {
            $log.debug("loading event found in local storage");
            angular.copy(eventCache.event,vm.event); 
            if (eventCache.appCntl) angular.copy(eventCache.appCntl,vm.appCntl);
            vm.appCntl.opMode = $state.current.data.opMode;  //there must be something stored to allow edit.. so ok here only.            
            if ( vm.appCntl.opMode ) {
                if (vm.appCntl.opMode == 'update') {
                    vm.MAX_TABS = 8;
                }
            }
            vm.appCntl.referrer = document.referrer;
            setupUploader();
            resetViewState();           
        } 
        
        focusFirstElementInTab();

        //http://stackoverflow.com/questions/24078535/angularjs-controller-as-syntax-and-watch
        //With 'controller as', need to change how watch works. watch for thre locationTab to be click and if so, refresh the map.
        //Is this needed anymore?
        $scope.$watch(angular.bind(vm, function () {
            return vm.locationTabClicked;
        }), function (newVal) {
            $log.debug("locationTabClicked: " + vm.locationTabClicked);
            vm.refreshMap();
            $timeout(function () {
                vm.refreshMap();
            });
        });
    
        $scope.$watchCollection(angular.bind(vm, function () {
            return vm.event.category;
        }), function (newVal, oldVal) {
            vm.isSportsSelected = false;
            angular.forEach(newVal, function(item, i) {
                if (item.name === "Sports") {
                    vm.isSportsSelected = true;
                }
            });
        });
    
        /* 1) we want the subcategory cache to load before we start watching to avoid IO, so delay the watch a little
           2) a watch turns out to be better than an on-click event because of reloading data.
        */
        $timeout(function () {
            $scope.$watchCollection(angular.bind(vm, function () {
                return vm.event.admin.newsletterCategory;
            }), function (newVal, oldVal) {
                if (newVal > 0 && oldVal > 0 && newVal[0].value === oldVal[0].value) {
                    $log.debug("subcat watch - no Category change, skip:" + newVal[0].value);
                    return;
                }
                vm.newsletterSubCatRequired = false;
                angular.forEach(newVal, function(item, i) {
                    $log.debug("reload subcat" + item.value);
                    if (item.value === "Attractions/Happenings" || item.value === "Sports" ) {
                        vm.newsletterSubCatRequired = true;
                        $timeout(function () {
                            ecCoTDataService.newsletterSubcategories(item.value).then(function(data) {
                                vm.newsletterSubcategories = data;
                            });
                        });
                    }
                });
            }); 
        },200);        
    });
        
    /* Once the google map apis have loaded we can complete creating functions */    
    uiGmapGoogleMapApi.then(function (maps) {
        
        //http://stackoverflow.com/questions/12729122/angularjs-prevent-error-digest-already-in-progress-when-calling-scope-apply
        //Because angular didn't initiate this, it won't know about it, so wrap it in a timeout and scope variable changes will be noted
        $timeout(function() {
        
            var polyOptions = {
                    strokeWeight: 0,
                    fillOpacity: 0.45,
                    editable: true,
                    draggable: true
                };
            vm.map.options = { 
                MapTypeId: maps.MapTypeId.ROADMAP,
                mapTypeControlOptions: {
                    style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                    position: google.maps.ControlPosition.TOP_RIGHT
                }                       
            }; //TODO: I did this for kicks to see it work, but this should be in config items.
            
            vm.mapControl = {position: google.maps.ControlPosition.TOP_RIGHT};
            //this options are actually the defaults, but we may change them
            vm.drawingManagerOptions = {
                drawingMode: null,   
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [
                        google.maps.drawing.OverlayType.MARKER,
                        //google.maps.drawing.OverlayType.CIRCLE,
                        google.maps.drawing.OverlayType.POLYGON,
                        google.maps.drawing.OverlayType.POLYLINE
                        //google.maps.drawing.OverlayType.RECTANGLE
                        ]
                    },
                markerOptions: {icon: markerIcons.selected, draggable: true},        

                polylineOptions: {
                        editable: true,
                        draggable: true
                },
                rectangleOptions: polyOptions,
                polygonOptions: polyOptions                
            };

        }); //end of timeout.
        
        vm.drawingManagerEvents = {
            /*
            polygoncomplete: function(drawingManager, eventName, scope, args) { 
            },
            */
            //Overlay is called form all objects.  What to do with circles?
            //I can add custom properties here.. which can them be used to delete.
            overlaycomplete : function(drawingManager,eventName, scope, args){
            
                var obj = args[0];
                var newShape = obj.overlay;
                var locId = ecCoTUtilService.guid(); 
                newShape.label = 1;

                newShape.locId = locId;      //add custom field to overlay for our use
                vm.mapMarkers.push(newShape);                    
                newShape.type = obj.type;
            
                drawingManager.setDrawingMode(null); //turn off drawing mode after each marker,polygon etc.
                
                //rectangles do not have path.  you need to get bounds.
                if (newShape.type === google.maps.drawing.OverlayType.POLYGON) {
                    addPolygonEvents(newShape);
                    setSelection(newShape);
                } else if (newShape.type === google.maps.drawing.OverlayType.POLYLINE) {
                    addPolylineEvents(newShape);
                    setSelection(newShape);
                } else {                
                    addMarkerEvents(newShape);
                    setSelection(newShape);
                }           
                //TODO: once we clarify what shapes we will alow, this code could move up..
                if (newShape.type === google.maps.drawing.OverlayType.MARKER) {
                    mapObject = {id: locId, type: newShape.type, coords: obj.overlay.position.toJSON()};
                    /* this is geoCoding by lat/lng to get address */
                    geocoder.geocode({'location':  newShape.position}, function(results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            mapObject.address = results[0].formatted_address;    
                            mapObject.geoCoded = true;
                        }
                        $timeout(function() {
                            addLocation(mapObject);
                        });
                    });
                    if (!CoTGoogleMapUtilsService.isLatLngInToronto( newShape.position)) {
                        sweetAlert("Warning","Location is outside the city boundaries","warning");
                    }
            
                } else {
                    $log.debug(newShape.getPath().getArray());
                    var path = newShape.getPath();
                    var mapObject = {id: locId, type: obj.type, coords: [], address: newShape.type};
                    for (var i = 0 ; i < path.length ; i++) {
                        mapObject.coords.push({lat: path.getAt(i).lat(), lng: path.getAt(i).lng() });
                    }
                    addLocation(mapObject);
                }
    
            } 
        };  
        
        geocoder = new google.maps.Geocoder(); 
        CommonInfoWindow = new google.maps.InfoWindow();
      
    });

    /* once the google map is ready add in as needed   */
    uiGmapIsReady.promise().then(function (maps) {
    
       //set the search box to bias to toronto (map center)
        if (!_.isEmpty(vm.map.mapControl)) {
            google.maps.event.addListener(vm.map.mapControl.getGMap(),'bounds_changed', function() {
                var searchBox = new google.maps.places.SearchBox(angular.element("#mapSearchBox")[0]);
                searchBox.setBounds(vm.map.mapControl.getGMap().getBounds());
            });     

            google.maps.event.addListener(vm.map.mapControl.getGMap(), 'click', clearMapSelection);

            /* refresh map redraws the map, whereas resetMap centers and fixes the data */
            vm.refreshMap = function(){
                if (vm.appCntl.showMap  && vm.appCntl.tab === MAP_TAB) {
                    $log.debug("refreshMap()");
                    $timeout(function() {
                        google.maps.event.trigger(vm.map.mapControl.getGMap(), 'resize');
                        vm.map.mapControl.refresh();
                        vm.resetMap();
                    });
                }
            };            

            resetMapData();
            
            var cityPolyline = new google.maps.Polyline({
                path: CoTGoogleMapUtilsService.cityPolylineCoords(),
                Geodesic: true,
                strokeWeight: 1,
                strokeColor:'#FF0000',
                fillOpacity: 0.45,
                editable: false,
                draggable: false
            });
            cityPolyline.setMap(vm.map.mapControl.getGMap());

            $log.debug('controller ready');
            

        }
        //Clear the current selection when the drawing mode is changed, or when the map is clicked.
        if (!_.isEmpty(vm.drawingManagerControl)) {
            var drawingManager = vm.drawingManagerControl.getDrawingManager();    
            google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearMapSelection);
        }
        
        
    });
    
    function dataURItoBlob(dataURI) {
    // convert base64/URLEncoded data component to raw binary data held in a string
        var byteString;
        if (dataURI.split(',')[0].indexOf('base64') >= 0)
            byteString = atob(dataURI.split(',')[1]);
        else
            byteString = unescape(dataURI.split(',')[1]);

        // separate out the mime component
        var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to a typed array
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        return new Blob([ia], {type:mimeString});
}
    
    
    //http://stackoverflow.com/questions/13198131/how-to-save-a-html5-canvas-as-image-on-a-server
    //http://stackoverflow.com/questions/25390598/append-called-on-an-object-that-does-not-implement-interface-formdata
    //https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL
    /* There will be only one canvase element on the screen from the thumbnail */
    function thumbnailUpload() {
    
        var canvas = angular.element( document.querySelector( 'canvas' ) )[0];  
        var dataURL = canvas.toDataURL();
        var blob = dataURItoBlob(dataURL);
        var fd = new FormData();
        var thumbNailFileNameArr = vm.event.image.fileName.split('.');
        thumbNailFileNameArr.pop(); //.join('.') + ".png";
        var thumbNailFileName = thumbNailFileNameArr.join('.') + "_th.png";
        fd.append("file", blob, thumbNailFileName);
        CoTSubmitAPIService.uploadAttachment(getApiHost(), APP_NAME,'event_logo',fd)
            .then(function(response) {
                if ( response.hasOwnProperty("BIN_ID")) {
                    if (!vm.event.thumbImage) {
                        vm.event.thumbImage = {};
                    }
                    vm.event.thumbImage.fileName =  thumbNailFileName;  
                    vm.event.thumbImage.fileSize =  blob.size;  
                    vm.event.thumbImage.fileType =  blob.type;  
                    vm.event.thumbImage.binId = response.BIN_ID[0];  
                    if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','ThumbNail Upload Successful');
                } else {
                    if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','ThumbNail Upload Failed');
                    sweetAlert("File Upload Failure","The file upload was successful but the generated thumbnail failed. Please remove the image and try again!","error"); 
                }
            }, function(response){
                if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','ThumbNail API Upload Failed');
                sweetAlert("File Upload Failure","The file upload was successful but the generated thumbnail failed. Please remove the image and try again!","error"); 
            });        
    }
    
    function setupUploader() {
    
        var uploadURL = getApiHostPath() + "/upload/" + APP_NAME + "/event_logo";

        vm.uploader  = new FileUploader({
            url: uploadURL,
            autoUpload: true,
            queueLimit: 1
        });

        //TODO: Clean up these events once fully implemented and removed unneeded.
        vm.uploader.filters.push(
            { name: 'imageFilter',
                fn: function(item /*{File|FileLikeObject}*/, options) {
                    var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                    return '|jpg|png|jpeg|gif|'.indexOf(type) !== -1;
                }
            },
            { name: 'sizeFilter',
                fn : function (item /*{File|FileLikeObject}*/, options) {
                    return item.size/1024/1024 < 2;
                }
            }
        );
        /*  There is no "remove" event.. so I created a watch on the queue length   */
        vm.uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/, filter, options) {
            sweetAlert("Invalid file.","The image must be: \n jpg, jpeg, png, gif and under 2 MB in size","error"); 
        };
        vm.uploader.onAfterAddingFile = function(fileItem) {
            $log.debug('onAfterAddingFile', fileItem);
            if (!vm.event.image) {
            vm.event.image = {};
            }
            vm.event.image.fileName =  fileItem.file.name;  //since we are only allowing 1 image upload.
            vm.event.image.fileSize =  fileItem.file.size;  //since we are only allowing 1 image upload.
            vm.event.image.fileType =  fileItem.file.type;  //since we are only allowing 1 image upload.
            vm.newImageInUse = true;
        };
        /*
        vm.uploader.onAfterAddingAll = function(addedFileItems) {
            $log.debug('onAfterAddingAll', addedFileItems);
        };
        vm.uploader.onBeforeUploadItem = function(item) {
            $log.debug('onBeforeUploadItem', item);
        };
        vm.uploader.onProgressItem = function(fileItem, progress) {
            $log.debug('onProgressItem', fileItem, progress);
        };
        vm.uploader.onProgressAll = function(progress) {
            $log.debug('onProgressAll', progress);
        };
    */
        vm.uploader.onSuccessItem = function(fileItem, response, status, headers) {
            $log.debug('onSuccessItem', fileItem, response, status, headers);
            if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Image Upload Successful');
                $timeout(function() {
                    if (!vm.event.image) {
                        vm.event.image = {};
                    }
                    if ( response.hasOwnProperty("BIN_ID")) {
                        vm.event.image.binId = response.BIN_ID[0];  //since we are only allowing 1 image upload.
                    } else {
                        sweetAlert("File Upload Failed","The file upload was not successful. Please try again!","error");
                    }
                });
                thumbnailUpload();
            };
        
        vm.uploader.onErrorItem = function(fileItem, response, status, headers) {
            if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Image Upload Failed');
                sweetAlert("File Upload Failed","The file upload was not successful. Please Try again!","error");
        };
        /*
        vm.uploader.onCancelItem = function(fileItem, response, status, headers) {
            $log.debug('onCancelItem', fileItem, response, status, headers);
        };
        vm.uploader.onCompleteItem = function(fileItem, response, status, headers) {
            $log.debug('onCompleteItem', fileItem, response, status, headers);
        };
        vm.uploader.onCompleteAll = function() {
            $log.debug('onCompleteAll');
        };
        */
        $scope.$watch(angular.bind(vm, function () {
            return vm.uploader.queue.length;
        }), function (newVal) {
            if (vm.uploader.queue.length === 0 ) {
                vm.newImageInUse = false;
                if (vm.event.image) {
                    delete vm.event.image.binId;
                    delete vm.event.image.fileName;
                    delete vm.event.image.fileSize;
                    delete vm.event.image.fileType;
                    delete vm.event.image.url;                
                }
                if (vm.event.thumbImage) {
                    delete vm.event.thumbImage.binId;
                    delete vm.event.thumbImage.fileName;
                    delete vm.event.thumbImage.fileSize;
                    delete vm.event.thumbImage.fileType;
                    delete vm.event.thumbImage.url;
                }
                //http://stackoverflow.com/questions/9155136/chrome-file-upload-bug-on-change-event-wont-be-executed-twice-with-the-same-fi
                $('input[type="file"]').val(null);
            }
        });
    }
    
    function resetFormValidation() {
        $scope.ecForm.$setPristine();   
        $scope.ecForm.$setUntouched();
        $scope.$broadcast('show-errors-reset');    
    }
    
    function reloadImage() {
        var fileItems = [];
        var fileItem = new FileUploader.FileItem(vm.uploader, {
                dateModified: 'today',
                size: vm.event.image.fileSize,
                type: vm.event.image.fileType,
                name: vm.event.image.fileName
            });

        fileItem.progress = 100;
        fileItem.isUploaded = true;
        fileItem.isSuccess = true;

        fileItems.push(fileItem);
        vm.uploader.queue.push(fileItem);
        vm.uploader.onAfterAddingFile(fileItem);

        vm.uploader.onAfterAddingAll(fileItems);
        vm.uploader._render();
        vm.newImageInUse = false; /* to counteract the fake loading */
        

    }
    /* reset any state that can be calculated and thus was not stored */
    function resetViewState() {
        ecCoTDataService.eventCategories().then(function (data) {
            vm.eventCategories = ecCoTUtilService.resetInputModel('name',vm.event.category, data);
            vm.limitSelection( "", vm.eventCategories, vm.event.category, 3 ); // ideally this is needed, but how this is implemented is bad as the "3" is configured in the HTML
        });
        
        ecCoTDataService.eventThemes().then(function (data) {
            vm.eventThemes = ecCoTUtilService.resetInputModel('name',vm.event.theme, data);
        });     
        
        if (vm.event.admin) {
            var newsCat = "";
            ecCoTDataService.newsletterCategories().then(function (data) {
                vm.newsletterCategories = ecCoTUtilService.resetInputModel('value',vm.event.admin.newsletterCategory, data);
                
                //setNewletterSubcategories();
                if (vm.event.admin.newsletterCategory && vm.event.admin.newsletterCategory.length > 0) {
                    var selectedValue = vm.event.admin.newsletterCategory[0].value;
                    if (selectedValue === "Attractions/Happenings" || selectedValue === "Sports" ) {
                      vm.newsletterSubCatRequired = true;
                    }
                    if (selectedValue) {
                        $log.debug("load newsltter SubCat: " + selectedValue);
                        ecCoTDataService.newsletterSubcategories(selectedValue).then(function(data) {
                            vm.newsletterSubcategories = ecCoTUtilService.resetInputModel('value',vm.event.admin.newsletterSubcategory, data);
                        });
                   }   
                } else {
                    ecCoTDataService.newsletterSubcategories("").then(function(data) {
                            vm.newsletterSubcategories = data;
                    });
                }
                
            });

        }
        //vm.sportsSubcategories = ecCoTUtilService.resetInputModel('name',vm.event.sportsSubcategory, ecCoTDataService.sportsSubcategories());
        ecCoTDataService.sportsSubcategories().then(function (data) {
            vm.sportsSubcategories = ecCoTUtilService.resetInputModel('name',vm.event.sportsSubcategory, data);
        });
        vm.weeklyDatesIM = [];
        angular.forEach(vm.event.weeklyDates, function(weeklyDate, i) {
            vm.weeklyDatesIM.push({dayOfWeekValues :ecCoTUtilService.resetInputModel('day',weeklyDate.weekDay, ecCoTDataService.daysOfWeek())});
        });
        vm.uploader.clearQueue();
        /* if the user has uploaded a file, got a binId and then refreshed his browser..we can't get this image since we need a session id, so ignore it */
        if (vm.event.image && vm.event.image.binId && vm.appCntl.opMode === 'update') {
            reloadImage();
        }
        if (vm.event.image && vm.event.image.binId) {
            //the preview of image only seems to work on "inter" site.. possible bug?
            //vm.imageURL = (vm.appCntl.opMode == 'update' ? getApiHost() + "/cc_sr_v1" : getApiHost() + "/cc_sr_v1") + "/upload/" + APP_NAME + "/" + vm.event.image.binId + "?sid=" + vm.appCntl.sid;
            vm.imageURL = getApiHostPath()  + "/upload/" + APP_NAME + "/" + vm.event.image.binId + "?sid=" + vm.appCntl.sid;
        }
        if (vm.appCntl.tab === 7) vm.showSubmit = true;
    }
    /* note: if a field is new and in error, then the model isn't updated. The field data is not reset, so do a form reset, but this bypassing angular.   */
    function resetForm() {
        sweetAlert({
            title: "Are you sure?",
            text: "This will clear the entire form and return it to its initial state!",
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#5cb85c",
            confirmButtonText: "Yes, clear all data!",
            closeOnConfirm: true}, 
            function(){ 
                $document.find("#ecForm")[0].reset();
                vm.event.category = [];
                vm.event.costRange = [];
                vm.weeklyDatesIM = [];
                vm.showSubmit = false;
                angular.copy(vm.eventDefaults,vm.event);            
                resetViewState();   
                clearPlacesMarkers();
                clearMapMarkers();
                resetFormValidation();   
        
                gotoTab(1);
            });
        
    }
    
    /* polygons can have more than one path, but probably not in our case. each path has serveral lat/lng points. 
       reset map, cleans up the map and recenters it.
    */
    function resetMap() {
        /* we want to center the map based on the markers, but if there is only one marker, we don't want to go too low */
        if (vm.appCntl.showMap && vm.appCntl.tab === MAP_TAB) {
            $log.debug("do reset map");
            if (vm.mapMarkers.length > 0) {
                var bounds = new google.maps.LatLngBounds();
                for (var i=0; i < vm.mapMarkers.length; i++) {
                    if (vm.mapMarkers[i].type === google.maps.drawing.OverlayType.MARKER ) {
                        bounds.extend(vm.mapMarkers[i].position);
                    } else if (vm.mapMarkers[i].type === google.maps.drawing.OverlayType.POLYGON )  {
                        vm.mapMarkers[i].getPaths().forEach(function(path, index){
                            path.getArray().forEach(function(latLng, index){
                                bounds.extend(latLng);    //path.locId = newShape.locId; //put our locId on the path, so we can use it to move datapoints.
                            });                        });
                    } else if (vm.mapMarkers[i].type === google.maps.drawing.OverlayType.POLYLINE) {
                        vm.mapMarkers[i].getPath().forEach(function(latLng, index){
                            bounds.extend(latLng);    //path.locId = newShape.locId; //put our locId on the path, so we can use it to move datapoints.
                        });
                    }
                }
                vm.map.mapControl.getGMap().fitBounds(bounds);  
                var zoom = vm.map.mapControl.getGMap().getZoom();
                $log.debug(zoom);
                if (zoom > RESET_ZOOM_LEVEL) {
                    zoom = RESET_ZOOM_LEVEL;

                }
                vm.map.mapControl.getGMap().setZoom(zoom);
                $log.debug(zoom);
            } else {
                $log.debug('no markers - center on toronto');
                vm.map.mapControl.getGMap().setZoom(10);
                vm.map.mapControl.getGMap().setCenter(MAP_CENTER);      
            }
        
            CommonInfoWindow.close();
        }
    }
    
    function setNewletterSubcategories() {
        vm.newsletterSubCatRequired = false;
        if (vm.event.admin.newsletterCategory) {
            var selectedValue = vm.event.admin.newsletterCategory[0].value;
            if (selectedValue === "Attractions/Happenings" || selectedValue === "Sports" ) {
                vm.newsletterSubCatRequired = true;
                $timeout(function () {
                    ecCoTDataService.newsletterSubcategories(selectedValue).then(function(data) {
                        vm.newsletterSubcategories = data;
                    });
                });
            }
        }
    }

    function addOccurrenceDateRow()  {
        if (typeof vm.event.dates === "undefined") {
            vm.event.dates = [];
        }
        //vm.event.frequency.dates.push({startDate : moment(vm.event.startDate).startOf('hour'), endDate :moment(vm.event.startDate).add(1,'hour').startOf('hour')});
        vm.event.dates.push({});
        $timeout(function() {
            $("#ecForm").find("#occurDesc-" + (vm.event.dates.length -1)).focus();
        },300);      
        saveState();
    }
    
    function removeOccurrenceDateRow(rowId)  {
        vm.event.dates.splice(rowId, 1);   
    }
    
    //(1) you have to bind input-model to a property of the object from the collection you are ng-repeating on, hence the copy.
    //(2) we maintain a parallel array for the input models
    function addWeeklyOccurrenceRow()  {
        if (typeof vm.event.weeklyDates === "undefined") {
            vm.event.weeklyDates = [];
            vm.weeklyDatesIM = [];
        }
        var daysOfWeek = [];
        angular.copy( vm.daysOfWeek,  daysOfWeek);
        vm.event.weeklyDates.push( {weekDay : [], startTime:  moment().add(1, 'hour').startOf('hour'), endTime : moment().add(2, 'hour').startOf('hour')});
        vm.weeklyDatesIM.push({dayOfWeekValues : daysOfWeek});
        
        $timeout(function() {
            $("#ecForm").find("#weeklyDesc-" + (vm.event.weeklyDates.length -1)).focus();
        },300);  

 }
    
    function removeWeeklyOccurrenceRow(rowId)  {
        vm.event.weeklyDates.splice(rowId, 1);   
    }
    
    function frequencyChanged() {
        if (vm.event.frequency == 'dates' && (typeof vm.event.dates == 'undefined' || vm.event.dates.length === 0)) {
            addOccurrenceDateRow();
        }
        if (vm.event.frequency == 'weekly' && (typeof vm.event.weeklyDates == 'undefined' || vm.event.weeklyDates.length === 0)) {
            addWeeklyOccurrenceRow();
        }
    }
       
    function addLocation(locObj) {
        if (typeof vm.event.locations === 'undefined') {
            vm.event.locations = [];
        }
        if (typeof locObj === 'undefined') {
            vm.event.locations.push({ id: ecCoTUtilService.guid(), type: 'marker'});
        } else {
            vm.event.locations.push(locObj);
        }
        $timeout(function() {
            $("#ecForm").find("#locationName-" + (vm.event.locations.length -1)).focus();
        },300);
        saveState();
    }
    
    function removeLocation(rowIdx) {
    
        CommonInfoWindow.close();
        var locId = vm.event.locations[rowIdx].id;
        vm.event.locations.splice(rowIdx, 1);   
        var markerIdx = -1;
        
        angular.forEach(vm.mapMarkers, function(item, i) {
            if (item.locId === locId ) {
                item.setMap(null);
                item.locId = -1;
                markerIdx = i;
            }
        });
        if (markerIdx > -1) {
            vm.mapMarkers.splice(markerIdx, 1); 
        }
    }  
    
    /* when we update a marker (changing text) we resetMap the map, but we also call this when reload from state and there may be many, so we could be resetting too frquenctly.
       added a flag to the routine and refresh based on indicator). 
    */
    function updateMapMarker(locId, latLng, resetMapInd) {
        var found = false;
        
        for (var i=0; i < vm.mapMarkers.length; i++) {
            if (vm.mapMarkers[i].locId === locId) {
                vm.mapMarkers[i].setPosition(latLng);
                found = true;
            }
        }
        if (!found) {
            var marker = new google.maps.Marker({
                position: latLng,
                locId: locId,
                draggable: true,
                map: vm.map.mapControl.getGMap(),
                icon: markerIcons.normal,
                type: 'marker'
            });
            addMarkerEvents(marker);
            vm.mapMarkers.push(marker);
        }
        if (resetMapInd)  resetMap();
        
    
    }
    function verifyLocationAddress(rowIdx) {
        
        var locAddress = vm.event.locations[rowIdx].address;
        if (_.isEmpty(locAddress)) return;
        var locId = vm.event.locations[rowIdx].id;
 
        geoCodeAddress(locAddress,function(latLng, address, status) {
            $timeout(function() {
				if (latLng !== null) {
					vm.event.locations[rowIdx].coords = latLng.toJSON();
					vm.event.locations[rowIdx].address = address;
					vm.event.locations[rowIdx].geoCoded = status;
					if (vm.event.locations[rowIdx].coords !== null) {
						updateMapMarker(locId, latLng, true);
						if (!CoTGoogleMapUtilsService.isLatLngInToronto( latLng)) {
							sweetAlert("Warning","Location is outside the city boundaries","warning");
						}
					}
				}
            });
            

        });
        
        vm.resetMap();
        
    }
 
    /* check fields that can't be done easily in the form */
    function crossValidations() {
        /* geocode any addresses not already geocode. this may now be redundant */
        angular.forEach(vm.event.locations, function(location, rowIdx) {
            if (!location.geoCoded && !_.isEmpty(location.address) && location.type === google.maps.drawing.OverlayType.MARKER) {
                $log.debug("found non-geocoded address");
                location.address = null;  //This forces an error.
            }
        });
    }
    
    /* this function removes optional data that is no longer valid based on the last data the user entered */
    function cleanInput() {
        if (vm.event.partnerType === 'None') {
            delete vm.event.partnerName;
        }
        if (vm.event.frequency == 'once') {
            delete vm.event.startDate;
            delete vm.event.endDate;
            delete vm.event.dates;  
            delete vm.event.weeklyDates; 
            
        } else if (vm.event.frequency == 'dates') {
            delete vm.event.weeklyDates; 
            delete vm.event.startDateTime;
            delete vm.event.endDateTime;
            if (typeof vm.event.dates == 'undefined' || vm.event.dates.length === 0) {
                addOccurrenceDateRow();
            }
        } else if (vm.event.frequency == 'weekly') {
            delete vm.event.dates; 
            delete vm.event.startDateTime;
            delete vm.event.endDateTime;
            if (typeof vm.event.weeklyDates == 'undefined' || vm.event.weeklyDates.length === 0) {
                addWeeklyOccurrenceRow();
            }
        }
        
        if (vm.event.freeEvent === 'Yes') {
            delete vm.event.cost;
        }
        if (!vm.isSportsSelected) {
            delete vm.event.sportsSubcategory;
        }        
        if (vm.event.orgType !== 'Other') {
            delete vm.event.orgTypeOther;
        }
        
        /* make sure there is at least one location, this will then get caught in validations */
        if (vm.event.locations.length === 0) {
            addLocation();
        }
        
        if (vm.event.admin.newsletterCategory && vm.event.admin.newsletterCategory.length > 0 ) {
            if (vm.event.admin.newsletterCategory[0].value !== "Attractions/Happenings" && vm.event.admin.newsletterCategory[0].value !== "Sports" ) {
                vm.event.admin.newsletterSubcategory = [];
            } 

        }
        if (vm.uploader.queue.length > 0) { 
            if (!vm.event.image || _.isEmpty(vm.event.image.binId)) {
                sweetAlert("Image Problem","The event image was not properly uploaded. Either upload the image or remove it.");
                $scope.ecForm.$setValidity("badImage", false);
            } else {
                $scope.ecForm.$setValidity("badImage", true);
            }
        } else if (vm.event.image && _.isEmpty(vm.event.image.binId)) {
            delete vm.event.image;
        }       

        
    }
    
    /* 1: we want a startDate and EndDate on all records for searching in front-end 
        for weekly and single occurrence events, we don't populate a [dates] array in the code, but
        we need a consistent set of dates for the front-end, so we calculate them here
    */
    function setCalculatedFields() {
        if (vm.event.frequency == 'once') {
            vm.event.startDate = moment(vm.event.startDateTime).startOf('day');
            if (vm.event.endDateTime) {
                vm.event.endDate = moment(vm.event.endDateTime).startOf('day');
            } else {
                vm.event.endDate = vm.event.startDate;
            }
			
			vm.event.dates = [];
			var dateObj = {};
			if (vm.event.allDay) {
                vm.event.startDateTime = moment(vm.event.startDateTime).startOf('day');
				if (vm.event.endDateTime) {
					vm.event.endDateTime = moment(vm.event.endDateTime).startOf('day');
				}
				dateObj.allDay = vm.event.allDay;
            }           
            dateObj.startDateTime = vm.event.startDateTime;
			dateObj.endDateTime = vm.event.endDateTime;
            vm.event.dates.push(dateObj );
        }
        
        if (vm.event.frequency == 'weekly') {
            vm.event.dates = [];
            angular.forEach(vm.event.weeklyDates, function(day, idx) {
                var dt = moment(vm.event.startDate);
                var startTime = moment(day.startTime);
                var endTime = moment(day.endTime);
                var numDays = moment(vm.event.endDate).diff(dt, 'days') + 1;                
                for (i=0; i<numDays;i++){
                    //console.log(dt.format('dddd'), day.weekDay[0].day);
                    if (day.weekDay[0] && dt.format('dddd') === day.weekDay[0].day) {
                        //console.log(dt.day());
                        var dtStartTime = moment(dt);
                        dtStartTime = dtStartTime.add(startTime.hour(), 'hours');
                        dtStartTime = dtStartTime.add(startTime.minute(), 'minutes');
                        var dtEndTime = moment(dt);
                        dtEndTime = dtEndTime.add(endTime.hour(), 'hours');
                        dtEndTime = dtEndTime.add(endTime.minute(), 'minutes');
                        
                        //console.log(dtStartTime.format("YYYY-MM-DD HH:mm"), dtEndTime.format("YYYY-MM-DD HH:mm"));
                        var dtObj = {  'startDateTime' : dtStartTime, 'endDateTime' : dtEndTime};
                    
                        vm.event.dates.push( dtObj);
                        }
                    dt = dt.add(1, 'days');
                }
                
            
            });
        }       
        
        vm.event.categoryString = "";
        angular.forEach(vm.event.category, function(cat, i) {
            vm.event.categoryString += (vm.event.categoryString.length > 0 ? "," : "") + cat.name;
        });
        /* really only one theme but you never know ... */
        vm.event.themeString = "";
        angular.forEach(vm.event.theme, function(theme, i) {
            vm.event.themeString += (vm.event.themeString.length > 0 ? "," : "") + theme.name;
        });     

    }
    
    /* this focuses the form to the 1st error. It needs to deal with tabs. */
    function focusError() {
        var ecform =angular.element(document.querySelector('#ecForm'));
        var firstInvalid = angular.element(ecform.find('.ng-invalid')[0]);
        if (firstInvalid) {
            if (vm.debug) {
                if (typeof firstInvalid.attr("id") === 'undefined') {
                  sweetAlert("Validation Error",firstInvalid.attr('name'));
                } else {
                    sweetAlert("Validation Error",firstInvalid.attr('id'));
                }
            }
                        
            var errorTab = firstInvalid.closest('.panel-body');
            var tab = errorTab.attr('id').replace('ec-step','');
            ecform.find('.tab-pane').removeClass("active").removeClass("in");
            angular.element("#buttonbar").find("li").removeClass("active");
            var newTab = firstInvalid.closest('.tab-pane');
            newTab.addClass("active").addClass("in");
            //--displayTab(tab); If I used displayTab, the focus won't work 100%
            firstInvalid[0].focus();
            vm.appCntl.tab = parseInt(tab,10);
            
            }
    }
    
    function resetPreviewFocus() {
        $('#previewBtn').focus();
    }
    
    /* not used */
    function sanatizeObject(obj) {
        console.log(obj && obj.constructor);
        for (var key in obj) {
            console.log(key, typeof obj[key]  );
            if (vm.event[key] !== null && typeof obj[key] !== 'object') {
                console.log(obj[key], $sanitize(obj[key]),obj[key] &&  obj[key].constructor);
                obj[key] = $sanitize(obj[key]);
            } else {
                
                sanatizeObject(vm.event[key]);
            }
        }
    }
    /* Do I need to peform validation first? TBD.. I assume not but the data may be sparse. We do need calculated fields
    This take what is the thumbnail vs the actual image
    */
    function preview() {
    
        setCalculatedFields();

        var calEvent = { 'calEvent' : vm.event };
        if (vm.newImageInUse) {
            var canvas = angular.element( document.querySelector( 'canvas' ) )[0];  
            var dataURL = canvas.toDataURL();
            fecEventHelper.displayEvent(calEvent, { imgSrc: dataURL, onHidden:resetPreviewFocus });
        } else if (vm.event.image && vm.event.image.binId) {
            fecEventHelper.displayEvent(calEvent, { imgSrc: vm.imageURL, onHidden:resetPreviewFocus } );
        } else {
            fecEventHelper.displayEvent(calEvent, {onHidden:resetPreviewFocus});
        }
    }
    
    /* this is obscure. If the user is sitting in the location field, enters an invalid address, doesn't tab or have address validated, but hits
      the submit button, then the geocoding which needs a timeout to update the vm doesn't finish in time and an event can be submitted with a bad locaiton 
      This delay in the submission prevents this.
      */
    function submit() {
        $timeout(function() {
            realSubmit(); 
        },500);
    }
    function realSubmit() {
        
        $scope.ecForm.$setSubmitted(); //we need to manually set this due to our buttons. Our validations rely on it.
        
        cleanInput();
        crossValidations();
        $scope.$broadcast('show-errors-check-validity');

        if ($scope.ecForm.$invalid) {
            saveState();
            focusError();
            if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Submission Validation Failed');
            return; 
        }

        setCalculatedFields();
        vm.progressbar.start();
        var jsonData = { 'calEvent' : vm.event};
        
        /* in the end, the user will not be able to edit the data after submitting, so updating the recId is not useful
            in fact we will reset the form to blanks (and clean localStorage).
            The 'marking' of the attachment to 'keep' was recently added to the URL. 
        */
        var binLoc = null;   //if there is no binId, don't try to keep files..
        if (vm.event.image && vm.event.image.binId) binLoc =  '/calEvent/image/binId';
        if (vm.event.thumbImage && vm.event.thumbImage.binId) binLoc +=  ',/calEvent/thumbImage/binId';
        CoTSubmitAPIService.submit(getApiHost(), APP_NAME, jsonData, binLoc)
            .then(function(httpCall) {
                if (typeof httpCall !== 'undefined') {
                    sweetAlert("Submitted","The event was successfully submitted!\nIf your event meets the criteria, your submission will be posted within two weeks.","success");
                    vm.progressbar.complete();
                    $timeout(function() {
                        vm.event.recId = httpCall.id;
                        ecCoTEventCacheService.removeEvent();
                        if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Successful Submission');
                        window.location.href = window.location.protocol + "//" + window.location.host +  window.location.pathname;
                    },4000);
                } else {
                    vm.progressbar.complete();
                    if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Submission API Failed');
                    sweetAlert("Submission Failed","The event was not submitted successfully. Please Try again!","error");
                }
            }, function() {
                    vm.progressbar.complete();
                    if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Submission API Failed');
                    sweetAlert("Submission Failed","The event was not submitted successfully. Please Try again!","error");
            
            });
    }

    // PL - added status parameter here to communicate back to the admin interface which action button was clicked
    //    - use a common service (ngCoTNotifyService) to exchange info between eventCalendarApp and eventCal modules
    //      (fixes performance issue & prevents memory leak)
    function returnRecord(status) {
      console.log('validating, then returning to ' + document.referrer);
      cleanInput();
      $scope.$broadcast('show-errors-check-validity');

      if ($scope.ecForm.$invalid) {
        saveState();
        focusError();
        if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Admin Update Validation Failed');
        return;
      }
      setCalculatedFields();

      var proceed = true;
      saveState();
      console.log("EventCalendarController broadcasting event-updated.");

      vm.appCntl.status = status;
      if (status == 'APR') {
        if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type', 'Approve Selected');
      }
      if (status == 'REJ') {
        if (typeof dcsMultiTrack !== 'undefined') dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type', 'Reject Selected');
      }   
      CoTNotifyService.notify(status);
    }
   
    
    /* TODO: To be removed */
    function getOneRecord() {
    
        resetForm();
        tmpSubmitAPIService.login(APP_NAME,vm.userId, vm.pw)
        .then(function(data) {
            vm.appCntl.sid = data.sid;
            tmpSubmitAPIService.retrieve(vm.userId, vm.pw, APP_NAME, vm.recIdInput)
            .then(function(request) {
                $timeout(function() {                   
                    var o = JSON.parse(request.data.payload);
                    vm.event = o.calEvent;
                    vm.event.recId = request.data.id;
                    resetMapData(); 
                    resetViewState();
                    gotoTab(1);
                });                
            })
            .then(function(data, status, headers, config) {
                console.log(data);
            });
        });
     
    }
    
    /* TODO: To be removed */
    function updateRecord() {
        //todo: this are temporary to clean old data entered with old schema, doesn'/t validatse..
        cleanInput();
        crossValidations();
        $scope.$broadcast('show-errors-check-validity');        
        if ($scope.ecForm.$invalid) {
            saveState();
            focusError();
            return; 
        }       
        setCalculatedFields();
        saveState();
        var jsonData = { 'calEvent' : vm.event};
        resetFormValidation(); //again to be removed.. but if you save a record you should surf away
        tmpSubmitAPIService.update(vm.userId, vm.pw, APP_NAME, vm.event.recId , jsonData)
        .then(function() {
            
            window.location.reload(true);
        });
    }
    
    /* TODO: To be removed */   
    function approveRecord() {

        tmpSubmitAPIService.approve(vm.userId, vm.pw, APP_NAME, vm.event.recId);
    }

    
    /* TODO: To be removed */
    function getAllRecords() {
    
        var sHTML = "";
        angular.element("#dataTable").html("");
        sHTML ="<h2>Events</h2>";
        sHTML += "<table class='table table-striped table-bordered' style='display: block; overflow-x: auto;'><tr><th >Status</th><th >Id</th><th>Event Name</th><th >Event Description</th><th class='col-md-3'>Item</th><th >Created</th><th class='col-md-2'>Update</th></tr>";
        
        //submitAPIService.getRepoData("testweb1", "toronto", "smlrepo", APP_NAME, 0 ,100)
        tmpSubmitAPIService.getRepoData(vm.userId, vm.pw, APP_REPO, APP_NAME, 0 ,2000)
            .then(function(httpCall) {
                //alert(httpCall.data.length);
                var sortedData = httpCall.data.sort(function(a,b) {return new Date(b.updated).getTime() - new Date(a.updated).getTime();});
                    for (var j = 0; j < sortedData.length; j++) {
                        var item = sortedData[j];
                        if (typeof item !== 'undefined') {
                            var o = JSON.parse(item.payload);
                            if (o.calEvent) {
                                var stat = (item.status=="Yes") ? "Submitted" : item.status;
                                sHTML += "<tr><td>" + stat + "</td><td>" + item.id + "</td><td>"  + o.calEvent.eventName + "</td><td>" + o.calEvent.description +  "</td><td class='col-md-3'>" + JSON.stringify(item) + "</td><td>" + item.created +  "</td><td>" + item.updated + "</td></tr>";                    
                            } else {
                                console.log(item.id, item.payload);
                            }
                        }
                    }
                    sHTML += "</table>";
                    $("#dataTable").html(sHTML);                    
                })
            .then(function (jqXHR, exception) {
                console.log(jqXHR);
        });    
    }
    
    function updateMapPolygon(location) {

        // Construct the polygon.
        var polygon = new google.maps.Polygon({
            paths: location.coords,
            /*these we from above.. clean and make these global */
            strokeWeight: 0,
            fillOpacity: 0.45,
            editable: true,
            draggable: true,
            type: 'polygon',
            locId: location.id
        });
        polygon.setMap(vm.map.mapControl.getGMap());
        addPolygonEvents(polygon);
        vm.mapMarkers.push(polygon);

    }
    function updateMapPolyline(location) {

        var polyline = new google.maps.Polyline({
            path: location.coords,
            Geodesic: true,
            strokeWeight: 2,
            fillOpacity: 0.45,
            strokeOpacity: 0.8,
            editable: true,
            draggable: true,          
            type: 'polyline',
            locId: location.id
        });
        polyline.setMap(vm.map.mapControl.getGMap());
        addPolylineEvents(polyline);
        vm.mapMarkers.push(polyline);  

    }   


    function resetMapData() {
        angular.forEach(vm.mapMarkers, function(marker, i) {
            marker.setMap(null);
        });
        vm.mapMarkers = [];
        angular.forEach(vm.event.locations, function(loc, i) {
            if (loc.type === google.maps.drawing.OverlayType.MARKER) {
                
                if (typeof loc.coords !== 'undefined' && loc.coords !== null) {
                    var latlng = new google.maps.LatLng( loc.coords.lat, loc.coords.lng );
                    updateMapMarker(loc.id, latlng, false);
                }
            } else if (loc.type === 'polygon' ){
                updateMapPolygon(loc);
            } else {
                updateMapPolyline(loc);
            }
        });
        resetMap();

    
    }

    /* ----------------internal Functions ----------------------- */
    function googlePlaces(searchBox) {
        $log.debug('places');
        clearPlacesMarkers();
        var places = searchBox.getPlaces();
    
        if (places.length === 0) {
            return;
        }
        var bounds = vm.map.mapControl.getGMap().getBounds();  // new google.maps.LatLngBounds();
         places.forEach(function(place) {
            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
           
        gblPlacesMapMarkers.push(new google.maps.Marker({
                map: vm.map.mapControl.getGMap(),
                icon:"images/centre.png",
                title: place.name,
                position: place.geometry.location
            }));
            
            

        });
        vm.map.mapControl.getGMap().fitBounds(bounds);
    }   
    
    function clearPlacesMarkers(){ 
        gblPlacesMapMarkers.forEach(function(marker) {
            marker.setMap(null);
        });
        gblPlacesMapMarkers = [];
    }   

    function clearMapMarkers(){ 
        vm.mapMarkers.forEach(function(marker) {
            marker.setMap(null);
        });
        vm.mapMarkers = [];
    } 

    function clearMapSelection () {
        
        var shapeType;
        if (vm.selectedShape) {    
            shapeType = typeof vm.selectedShape.type === 'undefined' ? google.maps.drawing.OverlayType.MARKER : vm.selectedShape.type;        
            if (shapeType !== google.maps.drawing.OverlayType.MARKER) {
                vm.selectedShape.setEditable(false);
            }
                    
            $timeout(function() {
                vm.selectedShape = null;
            });
            for (var i=0; i < vm.mapMarkers.length; i++) {
                shapeType = typeof vm.mapMarkers[i].type === 'undefined' ? google.maps.drawing.OverlayType.MARKER : vm.mapMarkers[i].type;
                if (shapeType === google.maps.drawing.OverlayType.MARKER) {
                    vm.mapMarkers[i].setIcon(markerIcons.normal);
                } else {
                    vm.mapMarkers[i].setOptions(polyFills.normal);
                }
            }
        }
    }

    /* if I create a marker through code and not drawing it on map, then there is no shape.type */
    function setSelection (shape) {
        clearMapSelection();
        clearPlacesMarkers();       
        var shapeType = typeof shape.type === 'undefined' ? google.maps.drawing.OverlayType.MARKER : shape.type;
        if (shapeType !== google.maps.drawing.OverlayType.MARKER) {
            shape.setEditable(true);
            shape.setOptions(polyFills.selected);
        } else {
            for (var i = 0; i < vm.mapMarkers.length; i++) {
                shapeType = typeof vm.mapMarkers[i].type === 'undefined' ? google.maps.drawing.OverlayType.MARKER : vm.mapMarkers[i].type;
                if (shapeType === google.maps.drawing.OverlayType.MARKER) {
                    vm.mapMarkers[i].setIcon(markerIcons.normal);
                }
            }
            shape.setIcon(markerIcons.selected);
                    
        }
        $timeout(function() {
            vm.selectedShape = shape;
        });
    }

    
    function deleteSelectedShape() {
        if (vm.selectedShape) {
            CommonInfoWindow.close();
            vm.selectedShape.setMap(null);
            var keyLoc = null;
            var eventLocId = vm.selectedShape.locId;
            if (vm.event.locations.length === 1) {
               $timeout(function() {
                    vm.event.locations = [];
               });
               return;
                        
            }
            //find location instance to delete.
            $timeout(function() {
                 
                angular.forEach( vm.event.locations, function(loc, i) {
                    if (loc.id === eventLocId) {
                        keyLoc = i;
                    }   
                });
                if (keyLoc > -1) { 
                    removeLocation(keyLoc);     
                }
                vm.selectedShape = null;
            });
        }
    }
    
    /* this geocodes address text */
    function geoCodeAddress (address, callback) {
        geocoder.geocode({'address':  address, 'bounds' : vm.map.mapControl.getGMap().getBounds()}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    callback(results[0].geometry.location,results[0].formatted_address, true);
                } else {
                    callback(null, null,false);
                    sweetAlert("Address verification failed","No results found");
                }
            } else {
                sweetAlert("Address verification failed","Please try another address (" + status + ")","warning");
                callback(null, null, false);
            }
        });
    }   
    
    /* show location of marker on a hover */
    function infoWindowMouseEvent(shape) {
        var shapeLocId = this.locId;
        var shapeType = this.type;
        var content = "";
        angular.forEach(vm.event.locations, function(loc, i) {
            if (loc.id ===  shapeLocId ) {
                content = "<b>Location " + (i +1) + "</b>";
                content += typeof loc.locationName != 'undefined' ? ": " + loc.locationName : "";
                content += typeof loc.address != 'undefined' ? "<br>" + loc.address : "";
            }
        });
        var pOff = new google.maps.Size(0, -6);
        if (shapeType === google.maps.drawing.OverlayType.MARKER) {
            pOff = new google.maps.Size(0, -30);
        } 
        CommonInfoWindow.setOptions(
            { "position": shape.latLng,
              "pixelOffset": pOff,
              "content": content});
        CommonInfoWindow.close();
        CommonInfoWindow.open( vm.map.mapControl.getGMap());
        // $timeout(function() {
        //  CommonInfoWindow.close();
        // },600);
    }
    
    function geoCodeCallback(results, status) {
    
    }
    function addMarkerEvents(newShape) {
        google.maps.event.addListener(newShape,'mouseover',infoWindowMouseEvent) ;
        google.maps.event.addListener(newShape, 'click', function (e) {
            setSelection(newShape);
        });
        google.maps.event.addListener(newShape, 'dragend', function (e) {
            CommonInfoWindow.close();
            var locId = this.locId;
            for (var i=0; i < vm.event.locations.length; i++) {
                if (vm.event.locations[i].id === locId) {
                    var idx = i;
                    //the scope here was bad...I used a callback: http://stackoverflow.com/questions/2993563/how-do-i-return-a-variable-from-google-maps-javascript-geocoder-callback
                    geocoder.geocode({'location':  e.latLng }, function(results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            $timeout(function() {
                                vm.event.locations[idx].address = results[0].formatted_address;   
                                vm.event.locations[idx].coords = e.latLng.toJSON();
                                vm.event.locations[idx].geoCoded = true;
                            });
                        }

                    });
                    if (!CoTGoogleMapUtilsService.isLatLngInToronto( e.latLng)) {
                        sweetAlert("Warning","Location is outside the city boundaries","warning");
                    }
                }  
            }
        });
    }
        
    function updatePolyLineCoords(idx, latLng) {
        var locId = this.locId;
        var newCoords = this.getArray();
        $timeout(function() {
            angular.forEach(vm.event.locations, function(loc, i) {
                if (loc.id ===  locId) {
                    loc.coords = newCoords;
                }
            });
        });
    
    }
    function addPolylineEvents(newShape) {
        
        google.maps.event.addListener(newShape, 'click', function (e) {
            setSelection(newShape);
        });
         
        newShape.getPath().locId = newShape.locId; 
        //google.maps.event.addListener(newShape, "dragend", updatePolyLineCoords) ;
        google.maps.event.addListener(newShape.getPath(), "insert_at", updatePolyLineCoords);
        google.maps.event.addListener(newShape.getPath(), "remove_at", updatePolyLineCoords);
        google.maps.event.addListener(newShape.getPath(), "set_at", updatePolyLineCoords);    
        google.maps.event.addListener(newShape,'mouseover',infoWindowMouseEvent) ;

    }
    
     function updatePolygonCoords(idx, latLng) {
     
        var locId = this.locId;
        var newCoords = this.getArray();
        $timeout(function() {
            angular.forEach(vm.event.locations, function(loc, i) {
                if (loc.id ===  locId) {
                    loc.coords = newCoords;
                }
            });
        });     
     
     }
    function addPolygonEvents(newShape) {
        google.maps.event.addListener(newShape, 'click', function (e) {
            setSelection(newShape);
        }); 
        google.maps.event.addListener(newShape,'mouseover',infoWindowMouseEvent) ;
        /* If you drag a polygon, you will get a lot of set_at events, so no need to specifically trap it.
           (btw: the event signature is different)
           Apparently you can: (a) on dragstart, turn off all set_at events, (b) turn them back on at gradend (and grab co-ords)
         */     
        //google.maps.event.addListener(newShape, "dragend",  updatePolygonCoords) ;
        newShape.getPaths().forEach(function(path, index){
            path.locId = newShape.locId; //put our locId on the path, so we can use it to move datapoints.
            google.maps.event.addListener(path, 'insert_at', updatePolygonCoords);
            google.maps.event.addListener(path, 'remove_at', updatePolygonCoords);
            google.maps.event.addListener(path, 'set_at', updatePolygonCoords);
        });  

            

    }

    /* we want reasonable dates: no past, no > 3 years, from Date < to Date */
    function eventDateBlur(fromfld, fromDt, tofld, toDt) {
        //console.log('blur:' , fromfld,fromDt, tofld,toDt);
        var today = moment().startOf('day');   

        if (typeof fromDt !== 'undefined') {
            if (today.diff(moment(fromDt), 'days') > 0) {
                $scope.ecForm[fromfld].$setValidity("pastdate", false);
            } else {
                $scope.ecForm[fromfld].$setValidity("pastdate", true);
            }
            if (moment(fromDt).diff(today, 'years') > 2) {             
                $scope.ecForm[fromfld].$setValidity("futuredate", false);
            } else {
                $scope.ecForm[fromfld].$setValidity("futuredate", true);
            }
        }
        if (typeof toDt !== 'undefined') {      
            if (today.diff(moment(toDt), 'days') > -1) {
                $scope.ecForm[tofld].$setValidity("pastdate", false);
            } else {
                $scope.ecForm[tofld].$setValidity("pastdate", true);
            }
            if ( moment(toDt).diff(today, 'years') > 2) {
                $scope.ecForm[tofld].$setValidity("futuredate", false);
            } else {
                $scope.ecForm[tofld].$setValidity("futuredate", true);
            }
            
        } 
        
        if (typeof fromDt !== 'undefined' && typeof toDt !== 'undefined' && moment(fromDt) > moment(toDt)) {
            $scope.ecForm[fromfld].$setValidity("baddate", false);
            $scope.ecForm[tofld].$setValidity("baddate",false);
        } else {
            $scope.ecForm[fromfld].$setValidity("baddate", true);
            $scope.ecForm[tofld].$setValidity("baddate",true); 
        }
        $scope.$broadcast('eventdatechange');   
    }

    function eventOccurDateBlur(startfld, startDtTime, endfld, endDtTime, eventStartDt, eventEndDt) {
    
        console.log('blur:' , startfld, startDtTime, endfld, endDtTime, eventStartDt, eventEndDt);
        if (typeof startDtTime !== 'undefined' && typeof endDtTime !== 'undefined' && moment(startDtTime) > moment(endDtTime).endOf('day')) {
            $scope.ecForm[startfld].$setValidity("badoccurdate1", false);
            $scope.ecForm[endfld].$setValidity("badoccurdate1",false);
        } else {
            $scope.ecForm[startfld].$setValidity("badoccurdate1", true);
            $scope.ecForm[endfld].$setValidity("badoccurdate1",true);         
            
        }
        if (typeof startDtTime !== 'undefined'  && (moment(startDtTime) < moment(eventStartDt).startOf('day') ||  moment(startDtTime) > moment(eventEndDt).endOf('day')   ) ) {
            $scope.ecForm[startfld].$setValidity("badoccurdate2", false);
        } else {
            $scope.ecForm[startfld].$setValidity("badoccurdate2", true);     
        }
        if (typeof endDtTime !== 'undefined'  && (moment(endDtTime) > moment(eventEndDt).endOf('day')  ||  moment(endDtTime) < moment(eventStartDt).startOf('day')   ) ) {
            $scope.ecForm[endfld].$setValidity("badoccurdate2", false);
        } else {
            $scope.ecForm[endfld].$setValidity("badoccurdate2", true);       
        }

        
        $scope.$broadcast('eventdatechange');   
    }   


    
    //TODO: Problem.. The before render kicks in on each view of the dateppicker. since each start and end time are shown initially, they are both wide open
    // only when you click on month view does it reduce.. But the RenderOn event can be used to re-render related dropdowns after a date is changed.
    /* Big Kludge
        the dates for the month view of dec, jan, feb, march were coming in 1 hours less (DST issues probably?) .. so I fixed these manually.
        we want to use the startOday of the parentStart and endOfDay of the parent EndStart to get full 24 hrs.
        the dates[i] are 1st day of each year, 1 day of each month, 1 hour of day, etc depending on the view.
    
    */
    function beforeRenderStartDateTime($view, $dates, $leftDate, $upDate, $rightDate, where, enddt, parentStartDt, parentEndDt) {
        $log.debug(where + " " + $view + " Parent Start:" + (typeof parentStartDt === 'undefined' ? "blank" : moment( parentStartDt).format("YYYYMMDD HH:mm")) + 
                                          " Parent end:" + (typeof parentEndDt === 'undefined' ? "blank" : moment( parentEndDt).format("YYYYMMDD HH:mm ")) + 
                                          " end date:" + (typeof enddt === 'undefined' ? "blank" : moment( enddt).format("YYYYMMDD HH:mm")));
        
        var endDate = moment("20990101","YYYYMMDD");
        var startDate = moment("19700101","YYYYMMDD");
        if (enddt) {
            if ($view === 'hour' || $view === 'minute') {
                 endDate = moment(enddt);
            } else {
                 endDate = moment(enddt).endOf('day');
            }
            //endDate = moment(enddt);  //.endOf('day'); 
        }
        if (parentEndDt) {
            var parentEndDate = moment(parentEndDt).endOf('day');//.add(1, 'day'); //.subtract(1, 'minute');
            if (parentEndDate.valueOf() < endDate.valueOf()) {
                endDate = parentEndDate;    
            }           
        }
       
        /* if there is a master start date, this must be greater than it */
        if (parentStartDt) {
            startDate = moment(parentStartDt).startOf('day'); //.subtract(1, $view);//.add(1, 'hour');
        }
        for (var i = 0; i < $dates.length; i++) {
            //This is the DST fix.
            if ( $view !== 'hour' && $view !== 'minute' && moment($dates[i].localDateValue()).format("HH:mm") === "23:00") {
                $dates[i].utcDateValue = moment($dates[i].utcDateValue).add(1, 'hour');
            }
            if ( moment($dates[i].localDateValue()).startOf($view)  <= endDate.startOf($view)  &&  moment($dates[i].localDateValue()).startOf($view)  >= startDate.startOf($view)   )  {
                $dates[i].selectable = true;
                    $log.debug("start:" + moment($dates[i].localDateValue()).format("YYYYMMDD HH:mm") + ' - allowed between( ' + moment(startDate.valueOf()).format("YYYYMMDD HH:mm") + " & " + moment(endDate.valueOf()).format("YYYYMMDD HH:mm")+ ')');
            } else {
                $dates[i].selectable = false;
                    $log.debug("start:" + moment($dates[i].localDateValue()).format("YYYYMMDD HH:mm") + ' - not allowed ' + moment(startDate.valueOf()).format("YYYYMMDD HH:mm") + " & " + moment(endDate.valueOf()).format("YYYYMMDD HH:mm")+ ')');
            }
        }
    
    }


    /* on some validation */
    function beforeRenderEndDateTime($view, $dates, $leftDate, $upDate, $rightDate, where,startdt, parentStartDt, parentEndDt) {
        //console.log("render end " + $view);
        //console.log(where + " " + $view + " Parent Start:" + (typeof parentStartDt === 'undefined' ? "blank" : moment( parentStartDt).format("YYYYMMDD HH:mm"))  + 
        //                                  " Parent end:" + (typeof parentEndDt === 'undefined' ? "blank" : moment( parentEndDt).format("YYYYMMDD HH:mm")) + 
        //                                  " Start date:" + (typeof startdt === 'undefined' ? "blank" : moment( startdt).format("YYYYMMDD HH:mm")));
        var endDate = moment("20990101","YYYYMMDD");
        var startDate = moment("19700101","YYYYMMDD");
        if (startdt) {
            if ($view === 'hour' || $view === 'minute') {
                startDate = moment(startdt);
            } else {
                startDate = moment(startdt).startOf('day');
            }
        }
        if (parentStartDt) {
            var parentStartDate = moment(parentStartDt).startOf('day'); //.subtract(1, $view);//.add(1, 'hour');
            if (parentStartDate.valueOf() >= startDate.valueOf()) {
                startDate = parentStartDate;    
            }           
        }   
        if (parentEndDt) {
            endDate = moment(parentEndDt).endOf('day');  //.add(1, $view);//.subtract(1, 'hour');
        }
        for (var i = 0; i < $dates.length; i++) {
            if ( $view !== 'hour' && $view !== 'minute' && moment($dates[i].localDateValue()).format("HH:mm") === "23:00") {
                $dates[i].utcDateValue = moment($dates[i].utcDateValue).add(1, 'hour');
            }
            if ( moment($dates[i].localDateValue()).startOf($view) <= endDate.startOf($view) &&  moment($dates[i].localDateValue()).startOf($view) >= startDate.startOf($view)  )  {
                $dates[i].selectable = true;
        //        console.log("end: " + moment($dates[i].localDateValue()).format("YYYYMMDD HH:mm") + ' - allowed between( ' + moment(startDate.valueOf()).format("YYYYMMDD HH:mm") + " & " + moment(endDate.valueOf()).format("YYYYMMDD HH:mm") + ')');
            } else {
                $dates[i].selectable = false;
        //        console.log("end: " + moment($dates[i].localDateValue()).format("YYYYMMDD HH:mm") + ' -not allowed between( ' + moment(startDate.valueOf()).format("YYYYMMDD HH:mm") + " & " + moment(endDate.valueOf()).format("YYYYMMDD HH:mm") + ')');
            }
        }       
    }
    
    
    function saveState() { 
        ecCoTEventCacheService.putEvent(vm.event,vm.appCntl);
    }
    
    function setTab(tab) {
        vm.appCntl.tab = tab;
        if (tab === 7) {vm.showSubmit = true;}
        if (vm.appCntl.tab === MAP_TAB && vm.appCntl.showMap ) {
            vm.refreshMap();
            $timeout(function() {
                vm.locationTabClicked = !vm.locationTabClicked;
                $scope.$apply();
            });
        }
        focusFirstElementInTab();
    }
    
    function focusFirstElementInTab() {
        $timeout(function () {
            $('#ecForm :input:enabled:visible:first').focus();
        });
    }
    /* showTab is called from UI so no need to manually display tab */
    function showTab(tab) {
        
        setTab(tab);
        saveState(); 
    }
    /* use code to go to a tab, ie. not from ui clicks */
    function gotoTab(tab) {
        //displayTab(tab);
        setTab(tab);
        saveState();     
    }
    
    function nextTab(){
        var nTab = vm.appCntl.tab + 1;
        if (nTab <= vm.MAX_TABS) {
            gotoTab( nTab );            
        }
    }
    
    function prevTab(){
        var pTab = vm.appCntl.tab - 1;
        if (pTab > 0) {
            gotoTab( pTab );
        }
    }
    
	/* if the field is in error, then value is undefined */
    function sanitize(objName) {
        var objProps = objName.split('.');
        if (objProps.length == 1) {
            if (vm[objProps[0]])  vm[objProps[0]] = $sanitize(vm[objProps[0]]);
        } else if (objProps.length == 2) {
            if (vm[objProps[0]][objProps[1]]) vm[objProps[0]][objProps[1]] = $sanitize(vm[objProps[0]][objProps[1]]);
        } else if (objProps.length == 3) {
            if ( vm[objProps[0]][objProps[1]][objProps[2]]) vm[objProps[0]][objProps[1]][objProps[2]] = $sanitize(vm[objProps[0]][objProps[1]][objProps[2]]);
        
        
        } else if (objProps.length == 4) {
            if (vm[objProps[0]][objProps[1]][objProps[2]][objProps[3]]) vm[objProps[0]][objProps[1]][objProps[2]][objProps[3]] = $sanitize(vm[objProps[0]][objProps[1]][objProps[2]][objProps[3]]);
        
        }

    }
    
    /* This function is here for testing purposes */
    function getApiHost() {
        var ret = API_HOST;
        if (ret === "") {
            //ret = window.location.protocol + "//" + window.location.host + ":" + window.location.port;
            ret = "//" + window.location.host + ":" + window.location.port;
        }

        return ret;
    }
    
    //If internet app we need to remove _admin check "inter" in 
    function getApiHostPath() {
        var ret = getApiHost();
        if (ret.indexOf("inter") > -1 ||  window.location.host === "secure.toronto.ca") {
            ret += "/" + API_PATH.replace("_admin","");
        } else {
            ret += "/" + API_PATH;
        }
        return ret;
    }
}

    angular.module('eventCalendarApp').controller('EventCalendarController', ["$rootScope", "$scope", "$sanitize", "$sce","$log", "$state", "$parse", "$http", '$timeout', '$document','uiGmapGoogleMapApi', 'uiGmapIsReady','FileUploader','ngProgressFactory','ecCoTEventCacheService','ecCoTDataService','ecCoTUtilService','tmpSubmitAPIService','CoTSubmitAPIService','CoTGoogleMapUtilsService','CoTSession','CoTUserRoles','CoTNotifyService',EventCalendarController]);
}());