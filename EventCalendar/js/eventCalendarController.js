(function () {
/* SML Notes:
    issues/Notes with google maps.
    a) use config option on App, but you don't know when the libraries are loaded, so can't use constants right away
       --> hence MapAPI and MapIsReady events.
    b) within these events, if you change scope, you need to do it in a timeout or you get digest errors and the changes are not recoginized
    c) Like any google map, if you draw it in a hidden div, the height is 0 and you need to refresh it when you open the div.
        To get the map to refresh, I put a click on tab to change a scope variable, and then I watch the scope variable to see if it changes.
        (I tried many options, and this one seemed to work best)
    d) we also do not want to refresh any map that is not shown as this can mess up the map. We changed the way maps are shown and by default they are not shown.
    e) if I put an ng-click on the <li> to a function that doesn't exist yet.it causes problems or it doesn't work. so I create an empty function and update it later
    f) to you places, there is now a new authorization in the google dev console which must be authorized.
    
    
    1) As a convenience, AngularJS provides $timeout, which is like setTimeout, but automatically wraps your code in $apply by default. Use that, not this
    If you write any code that uses Ajax without $http, or listens for events without using Angular’s ng-* listeners, or sets a timeout without 
    $timeout, you should wrap your code in $scope.$apply


    Things to implement.
       
    11) when I geocode an address should I get rid of the postal code?? on <pstl< canada part as irrelvant??  It shows the user they are in the right city/country.. os leave it in.
   
    13) there is an option in showErrors to globally show bootstrap error classes. so no need to:  show-errors='{ showSuccess: true }  --check into this.
   
    14) Images: need to load image on edit.
    
    Can I make a directive that is "onOf" - have a group like showErrors.. puts ng_reguired on each item.. but uses scope of directive and not conroller to detect entry
      --> then also does an onblur for each element in the onOf after each 
      
    
*/
    //var APP_NAME = "SMLEventV1"; // this is really EventType
    //var APP_REPO = "smlrepo"; // this is really EventType
    var APP_REPO = "SMLEventDEMORepo"; // this is really EventType
    var APP_NAME = "SMLEventDemo"; // this is really EventType
    var MAP_CENTER = { lat:  43.69587827770483, lng:  -79.45175170898438 };
    var RESET_ZOOM_LEVEL = 16;  
    var MAP_TAB = 4; //step in process which contains map which requires 'special' refresh process
    var markerIcons = {'normal'   : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                       'selected' : 'http://maps.google.com/mapfiles/ms/icons/red.png'
                       };
    var polyFills = { 'normal'  : {fillColor:'#000000', strokeColor: '#000000', strokeWeight: 2},
                      'selected': {fillColor:'#FF0000', strokeColor: '#FF0000', strokeWeight: 4}
                    };
    var geocoder;        
    var gblPlacesMapMarkers = [];
    var CommonInfoWindow = null;
    
    
    function EventCalendarController( $rootScope, $scope, $log,  $state, $parse,$http, $timeout, $document, uiGmapGoogleMapApi, uiGmapIsReady, FileUploader,  ngProgressFactory,  eventCalendarCacheService,eventCalendarDataService,eventCalendarUtilService,tmpSubmitAPIService, submitAPIService, FORM_EVENTS,googleMapUtilsService)  /*ignore parms*/{
                                    
    var vm = this;  
    
    vm.MAX_TABS = 7;  // number of steps. i should probably calculate this on ready.
    
    $log.debug($state.current.data);
    vm.opMode = $state.current.data.opMode;
    vm.acceptableChars = /^[a-zA-Z0-9 \.]*$/;

    /* view related variables, with 'event' being the most important */
    vm.canDebug = true;
    vm.debug = false;
    vm.greetMe = 'Angular started';

    vm.eventDefaults = {terms : "", recId : null, category : [],    locations : [{ id: eventCalendarUtilService.guid(), type: 'marker'}] };
    vm.event = {terms : "", recId : null};
    vm.weeklyDatesIM = [];
    vm.appCntl = { tab : 1, showMap : false };
    vm.locationTabClicked = false;    
    vm.progressbar = ngProgressFactory.createInstance();

    vm.locIndex  = -1;
    vm.occurIndex = -1;
    vm.recIdInput = "";
    vm.eventCategories = eventCalendarDataService.eventCategories();
    vm.isSportsSelected = true;
    vm.costRanges = eventCalendarDataService.costRanges();
    //vm.isOtherCostRequired = false;
    vm.sportsSubcategories = eventCalendarDataService.sportsSubcategories();
    vm.availableFeatures = eventCalendarDataService.eventFeatures();    
    vm.daysOfWeek = eventCalendarDataService.daysOfWeek();
    vm.newsLetters = eventCalendarDataService.newsLetters();
    
    /* map related view variables */
    vm.selectedShape = null;
    vm.mapMarkers = [];
    vm.map = { center: { latitude:  43.69587827770483, longitude:  -79.45175170898438 }, zoom: 10};
    vm.map.options = { MapTypeId: "satellite"};  // I don't have the google libraries loaded yet.. so can't use constants.
    vm.map.mapControl = {};
    vm.searchbox = { 
        template:'searchbox.tpl.html', 
        events:{ places_changed: googlePlaces }
    };

    /* -- view function references -- */
    vm.limitSelection = eventCalendarUtilService.limitSelection;
    vm.clearSelection = eventCalendarUtilService.clearSelection;
    vm.blur = function(selector) {
        $log.debug("blur:" + selector);
        angular.element(selector).blur();
    };
    vm.setTab = setTab;
    vm.resetForm = resetForm;
    vm.addOccurrenceDateRow = addOccurrenceDateRow;
    vm.removeOccurrenceDateRow = removeOccurrenceDateRow;
    vm.addWeeklyOccurrenceRow = addWeeklyOccurrenceRow;
    vm.removeWeeklyOccurrenceRow = removeWeeklyOccurrenceRow;
    vm.frequencyChanged = frequencyChanged;
    //Because i changed relevant sections to use NG-IF over NG-Show. I don't need to worry about errors that become hidden as NG-IF removes the component from the DOM unlike show whihc hides it.
    //vm.resetFormValidation = function(){}; //resetFormValidation;
    vm.gotoHomePage = function() {
        eventCalendarCacheService.removeEvent();
        window.location.href = "http://toronto.ca";        
    };
    
    vm.beforeRenderEndDateTime =  beforeRenderEndDateTime;
    vm.beforeRenderStartDateTime =  beforeRenderStartDateTime;
    
    vm.addLocation = addLocation;
    vm.removeLocation = removeLocation;
    vm.verifyLocationAddress = verifyLocationAddress;
    vm.locationAddressChanged = function(idx) {
        vm.event.locations[idx].geoCoded = false;
        verifyLocationAddress(idx);
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
    vm.nextTab = nextTab;
    vm.prevTab = prevTab;
    vm.showTab = showTab;
    vm.updateRecord = updateRecord;
    vm.getAllRecords = getAllRecords;
    vm.getOneRecord = getOneRecord; 
    vm.editRecord = editRecord; 
    vm.returnRecord = returnRecord;
    vm.cancelEdit = function () {
        window.location.href = document.referrer;
    };   
    
    vm.toggleMap = function () {
        vm.appCntl.showMap = !vm.appCntl.showMap;
        vm.refreshMap();
    };
    

    vm.refreshMap = function(){ };//This function is completed once google api loaded but is needed now for angular binding
    vm.resetMap = resetMap;
        
    vm.drawingManagerOptions = {};    
    vm.drawingManagerControl = {};  
    
    /* we broadacast to the other datepickers that a key date has changed and thus they need to re-render their views */
    vm.eventDateChanged = function () {
        $scope.$broadcast('eventdatechange');          
    };
    
    vm.uploader  = new FileUploader({
            url: 'https://was8-inter-dev.toronto.ca/cc_sr_v1/upload/eventcal/eventcal',
            //headers:  {'Content-Type' : 'multipart/form-data'} -- don't do this,  not needed.it will create the header
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
            sweetAlert("Invalid file type.","Only image files less than 2 MB are allowed to be uploaded. \n (jpg, jpeg, png, gif)","error");
        };
    vm.uploader.onAfterAddingFile = function(fileItem) {
            $log.debug('onAfterAddingFile', fileItem);
        };
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
    vm.uploader.onSuccessItem = function(fileItem, response, status, headers) {
            $log.debug('onSuccessItem', fileItem, response, status, headers);
            $timeout(function() {
                if (!vm.event.image) {
                    vm.event.image = {};
                }
                vm.event.image.binId = response.BIN_ID[0];  //since we are only allowing 1 image upload.
            });
        };
    vm.uploader.onErrorItem = function(fileItem, response, status, headers) {
            sweetAlert("File Upload Failed","The fule upload was not successful. Please Try again!","error");
        };
    vm.uploader.onCancelItem = function(fileItem, response, status, headers) {
            $log.debug('onCancelItem', fileItem, response, status, headers);
        };
    vm.uploader.onCompleteItem = function(fileItem, response, status, headers) {
            $log.debug('onCompleteItem', fileItem, response, status, headers);
        };
    vm.uploader.onCompleteAll = function() {
            $log.debug('onCompleteAll');
     };
    $scope.$watch(angular.bind(vm, function () {
        return vm.uploader.queue.length;
    }), function (newVal) {
          if (vm.uploader.queue.length === 0 ) {
            if (vm.event.image) {
                delete vm.event.image.binId;
            }
          }
    });
    
    
    /* Once the document is ready*/
    angular.element(document).ready(function () {
        $log.debug('angular ready');
        //vm.MAX_TABS =  document.getElementsByClassName("btntitle").length;
        var eventCache = eventCalendarCacheService.getEvent();
        if (eventCache.event === null) {
            $log.debug("loading event defaults");
            angular.copy(vm.eventDefaults,vm.event);
        } else {
            $log.debug("loading event found in local storage");
            angular.copy(eventCache.event,vm.event); 
            if (eventCache.appCntl) angular.copy(eventCache.appCntl,vm.appCntl);
            vm.appCntl.opMode = $state.current.data.opMode;  //there muse be something stored to allow edit.. so ok here only.
            if ( vm.appCntl.opMode === 'update' ) {
                vm.MAX_TABS = 8;
            }
            vm.appCntl.referrer = document.referrer;
            resetViewState();           
        }   
        //displayTab(vm.appCntl.tab);

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
                var locId = eventCalendarUtilService.guid(); 
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
                    mapObject = {id: locId, type: newShape.type, coords: obj.overlay.position};
                    /* this is geoCoding by lat/lng to get address */
                    geocoder.geocode({'location':  newShape.position}, function(results, status) {
                        if (status === google.maps.GeocoderStatus.OK) {
                            mapObject.address = results[0].formatted_address;                                  
                        }
                        $timeout(function() {
                            addLocation(mapObject);
                        });
                    });
                    if (!googleMapUtilsService.isLatLngInToronto( newShape.position)) {
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
                path: googleMapUtilsService.cityPolylineCoords(),
                Geodesic: true,
                strokeWeight: 1,
                strokeColor:'#FF0000',
                fillOpacity: 0.45,
                editable: false,
                draggable: false,
            });
            cityPolyline.setMap(vm.map.mapControl.getGMap());
            
            //var cityPolygon = new google.maps.Polygon({
            //  paths: googleMapUtilsService.cityPolygon().coords,
            //  strokeWeight: 1,
            //  strokeColor:'green',
            //  fillOpacity: 0.45,
            //  editable: false,
            //  draggable: false,
            //});
            //cityPolygon.setMap(vm.map.mapControl.getGMap());
            

            $log.debug('controller ready');

        }
        //Clear the current selection when the drawing mode is changed, or when the map is clicked.
        if (!_.isEmpty(vm.drawingManagerControl)) {
            var drawingManager = vm.drawingManagerControl.getDrawingManager();    
            google.maps.event.addListener(drawingManager, 'drawingmode_changed', clearMapSelection);
        }
    });
    
    
    function resetFormValidation() {
        $scope.ecForm.$setPristine();   
        $scope.ecForm.$setUntouched();
        $scope.$broadcast('show-errors-reset');    
    }
    
    /* reset any state that can be calculated and thus was not stored */
    function resetViewState() {
        vm.eventCategories = eventCalendarUtilService.resetInputModel('name',vm.event.category, eventCalendarDataService.eventCategories());
        vm.costRanges = eventCalendarUtilService.resetInputModel('value',vm.event.costRange, eventCalendarDataService.costRanges());
        vm.newsLetters = eventCalendarUtilService.resetInputModel('value',vm.event.newsLetter, eventCalendarDataService.newsLetters());
        vm.sportsSubcategories = eventCalendarUtilService.resetInputModel('name',vm.event.sportsSubcategory, eventCalendarDataService.sportsSubcategories());
        vm.weeklyDatesIM = [];
        angular.forEach(vm.event.weeklyDates, function(weeklyDate, i) {
            vm.weeklyDatesIM.push({dayOfWeekValues :eventCalendarUtilService.resetInputModel('day',weeklyDate.weekDay, eventCalendarDataService.daysOfWeek())});
        });
        
    }
    /* note: if a field is new and in error, then the model isn't updated. The field data is not reset, so do a form reset, but this bypassing angular.   */
    function resetForm() {
        $document.find("#ecForm")[0].reset();
        vm.event.category = [];
        vm.event.costRange = [];
        vm.weeklyDatesIM = [];
        angular.copy(vm.eventDefaults,vm.event);            
        resetViewState();   
        clearPlacesMarkers();
        clearMapMarkers();
        resetFormValidation();        
        gotoTab(1);
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

    function addOccurrenceDateRow()  {
        if (typeof vm.event.dates === "undefined") {
            vm.event.dates = [];
        }
        //vm.event.frequency.dates.push({startDate : moment(vm.event.startDate).startOf('hour'), endDate :moment(vm.event.startDate).add(1,'hour').startOf('hour')});
        vm.event.dates.push({});
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
        //vm.event.weeklyDates.push( {dayOfWeekValues : daysOfWeek, weekDay : [], startTime:  moment().add(1, 'hour').startOf('hour'), endTime : moment().add(2, 'hour').startOf('hour')});
        vm.event.weeklyDates.push( {weekDay : [], startTime:  moment().add(1, 'hour').startOf('hour'), endTime : moment().add(2, 'hour').startOf('hour')});
        vm.weeklyDatesIM.push({dayOfWeekValues : daysOfWeek});
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
        }), function (newVal, oldValue) {
            vm.isSportsSelected = false;
            angular.forEach(newVal, function(item, i) {
                if (item.name === "Sports") {
                    vm.isSportsSelected = true;
                }
            });
    });
    
    /* otherCost info is required unless one of the costr values is entered (not-null);*/
    /*
    $scope.$watchCollection(angular.bind(vm, function () {
        return vm.event.cost;
        }), function (newVal, oldValue) {
            vm.isOtherCostRequired = true;
            if (newVal) {
                angular.forEach($rootScope.Utils.ObjectKeys(newVal), function(item, i) {
                    if (newVal[item] !== null) {
                        vm.isOtherCostRequired = false;
                    }
                });
            }
        
    }); 
    */
    
    function addLocation(locObj) {
        if (typeof vm.event.locations === 'undefined') {
            vm.event.locations = [];
        }
        if (typeof locObj === 'undefined') {
            vm.event.locations.push({ id: eventCalendarUtilService.guid(), type: 'marker'});
        } else {
            vm.event.locations.push(locObj);
        }
        saveState();
    }
    
    function removeLocation(rowIdx) {
        var locId = vm.event.locations[rowIdx].id;
        var markerIdx = -1;
        vm.event.locations.splice(rowIdx, 1);       
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
 
        geoCodeAddress(locAddress,function(latLng, address) {
            $timeout(function() {
                vm.event.locations[rowIdx].coords = latLng;
                vm.event.locations[rowIdx].address = address;
                vm.event.locations[rowIdx].geoCoded = true;
            });
            updateMapMarker(locId, latLng, true);
            if (!googleMapUtilsService.isLatLngInToronto( latLng)) {
                sweetAlert("Warning","Location is outside the city boundaries","warning");
            }

        });
        
        vm.resetMap();
        
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
            vm.event.startDate = moment(vm.event.startDateTime).startOf('day');
            vm.event.endDate = moment(vm.event.endDateTime).startOf('day');
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
        
        if (vm.uploader.queue.length > 0) { 

            if (!vm.event.image || _.isEmpty(vm.event.image.binId)) {
                alert('image was not properly uploaded.. work on what to do here.');
            }
        } else if (vm.event.image && _.isEmpty(vm.event.image.binId)) {
            delete vm.event.image;
        }
        
        /* geocode any addresses not already geocode. this may now be redundant */
        angular.forEach(vm.event.locations, function(location, rowIdx) {
            if (!location.geoCoded && !_.isEmpty(location.address) && location.type === google.maps.drawing.OverlayType.MARKER) {
                $log.debug("found non-geocoded address");
                location.address = "";  //This causes an error.
                //geoCodeAddress(location.address,function(latLng, address) {
                //    $timeout(function() {
                //        vm.event.locations[rowIdx].coords = latLng;
                //        vm.event.locations[rowIdx].address = address;
                //        console.log("found non-geocoded address: geocided to :" + address);
                //        vm.event.locations[rowIdx].geoCoded = true;
                //    });
                //});
            }
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
    
    //TODO:  should we upload the file on submit??
    function submit() {
        
        $scope.ecForm.$setSubmitted(); //we need to manually set this due to our buttons. Our validations rely on it.
        
        cleanInput();
        $scope.$broadcast('show-errors-check-validity');

        if ($scope.ecForm.$invalid) {
            saveState();
            focusError();
            return; 
        }

        vm.progressbar.start();
        var jsonData = { 'calEvent' : vm.event};
        
        /* in the real world, the user will not be able to edit the data after submitting, so updating the recId is not useful
            in fact we will reset the form to blanks (and clean localStorage)
        */
        submitAPIService.submit(APP_NAME, jsonData)
            .then(function(httpCall) {
                if (typeof httpCall !== 'undefined') {
                    sweetAlert("Submitted","The event was successfully submitted!","success");
                    vm.progressbar.complete();
                    $timeout(function() {
                        vm.event.recId = httpCall.EventMessageResponse.Event.EventID;
                        eventCalendarCacheService.removeEvent();
                        window.location.href = window.location.protocol + "//" + window.location.host +  window.location.pathname;
                    },2000);
                } else {
                    vm.progressbar.complete();
                    sweetAlert("Submission Failed","The event was not submitted successfully. Please Try again!","error");
                }
            }, function() {
                    vm.progressbar.complete();
                    sweetAlert("Submission Failed","The event was not submitted successfully. Please Try again!","error");
            
            });


        
    }
      
/* TODO: to be removed */
    function editRecord() {
        alert('edit');
        saveState();
        var proceed = true;
        /* This code would not be here, but in Petar's code */
        xdLocalStorage.init(    {
        /* required */
        iframeUrl:'http://city-dev.toronto.ca/_dev/sandbox/SML/EventCal/cross-domain-local-storage.html'
        }).then(function () {
            //an option function to be called once the iframe was loaded and ready for action
            console.log('Got iframe ready');
            xdLocalStorage.setItem('COTEventCal-event', JSON.stringify(vm.event), function (data) {
                    if(data.success) {
                        console.log( 'event sent on domain.');
                    } else {
                        proceed = false;
                        sweetAlert('A problem occured setting up edit on remote machine. Please try again',"error");
                    }
                });
            var remoteAppCntl = { opMode : 'update', tab : 1 };
            xdLocalStorage.setItem('COTEventCal-appCntl', JSON.stringify(remoteAppCntl), function (data) {
                    if(data.success) {
                        console.log( 'event sent on domain.');
                    } else {
                        proceed = false;
                        sweetAlert('A problem occured setting up edit on remote machine. Please try again',"error");
                    }
                });   

            if (proceed) {
                window.location.href = 'http://city-dev.toronto.ca/_dev/sandbox/SML/EventCal/Main.html';
            }
        });

    }
    
   function returnRecord() {
        alert('returning to ' + document.referrer);
        cleanInput();
        $scope.$broadcast('show-errors-check-validity');

        if ($scope.ecForm.$invalid) {
            saveState();
            focusError();
            return; 
        }  
        $rootScope.$broadcast(FORM_EVENTS.saveRecord);
               
        var ref=document.createElement('a');
        ref.href=document.referrer; //vm.appCntl.referrer
        var paths = ref.pathname.split("/").splice(1);
        paths = paths.splice(0, paths.length -1);
        var refPath = ref.protocol + "//" + ref.host + "/" + paths.join('/');
        
        var proceed = true;
        window.location.href = document.referrer;
        /*
        xdLocalStorage.init(    {
        // required
        iframeUrl: refPath  + "/cross-domain-local-storage.html"
        }).then(function () {
            //an option function to be called once the iframe was loaded and ready for action
            console.log('Got iframe ready');
            xdLocalStorage.setItem('COTEventCal-event', JSON.stringify(vm.event), function (data) {
                    if(data.success) {
                        console.log( 'event sent on domain.');
                    } else {
                        proceed = false;
                        sweetAlert('A problem occured setting up edit on remote machine. Please try again',"error");
                    }
                });
            var remoteAppCntl = { opMode : 'updateRequired', tab : 1 };
            xdLocalStorage.setItem('COTEventCal-appCntl', JSON.stringify(remoteAppCntl), function (data) {
                    if(data.success) {
                        console.log( 'event sent on domain.');
                    } else {
                        proceed = false;
                        sweetAlert('A problem occured setting up edit on remote machine. Please try again',"error");
                    }
                });     
            if (proceed) {
                window.location.href = refPath + "/Main.html";
            }
        });
        */
        
    }   
    
    /* TODO: To be removed */
    function getOneRecord() {
    
        resetForm();
        tmpSubmitAPIService.retrieve("testweb1", "toronto", APP_NAME, vm.recIdInput)
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
    }
    
    /* TODO: To be removed */
    function updateRecord() {
        //todo: this are temporary to clean old data entered with old schema, doesn'/t validatse..
        delete vm.event.eventCategories;
        delete vm.event.costRanges;
        delete vm.event.tab;
        delete vm.event.showMap;
        cleanInput();
        if ($scope.ecForm.$invalid) {
            saveState();
            focusError();
            return; 
        }       
        $rootScope.$broadcast(FORM_EVENTS.saveRecord);
        
        var jsonData = { 'calEvent' : vm.event};
        tmpSubmitAPIService.update("testweb1", "toronto", APP_NAME, vm.event.recId , jsonData);
    }

    
    /* TODO: To be removed */
    function getAllRecords() {
    
        var sHTML = "";
        angular.element("#dataTable").html("");
        sHTML ="<h2>Events</h2>";
        sHTML += "<table class='table table-striped table-bordered' style='display: block; overflow-x: auto;'><tr><th >Status</th><th >Id</th><th>Event Name</th><th >Event Description</th><th class='col-md-3'>Item</th><th >Created</th><th class='col-md-2'>Update</th></tr>";
        
        //submitAPIService.getRepoData("testweb1", "toronto", "smlrepo", APP_NAME, 0 ,100)
        tmpSubmitAPIService.getRepoData("testweb1", "toronto", APP_REPO, APP_NAME, 0 ,100)
            .then(function(httpCall) {
                //alert(httpCall.data.length);
                var sortedData = httpCall.data.sort(function(a,b) {return new Date(b.updated).getTime() - new Date(a.updated).getTime();});
                    for (var j = 0; j < sortedData.length; j++) {
                        var item = sortedData[j];
                        if (typeof item !== 'undefined') {
                            var o = JSON.parse(item.payload);
                            var stat = (item.status=="Yes") ? "Submitted" : item.status;
                            sHTML += "<tr><td>" + stat + "</td><td>" + item.id + "</td><td>"  + o.calEvent.eventName + "</td><td>" + o.calEvent.description +  "</td><td class='col-md-3'>" + JSON.stringify(item) + "</td><td>" + item.created +  "</td><td>" + item.updated + "</td></tr>";                    
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
                
                if (typeof loc.coords !== 'undefined' ) {
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
                    callback(results[0].geometry.location,results[0].formatted_address);
                } else {
                    sweetAlert("No results found");
                }
            } else {
                sweetAlert("Address verification failed","Please try another address (" + status + ")","warning");
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
                content += typeof loc.venueName != 'undefined' ? ": " + loc.venueName : "";
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
                                vm.event.locations[idx].coords = e.latLng;
                                vm.event.locations[idx].geoCoded = true;
                            });
                        }

                    });
                    if (!googleMapUtilsService.isLatLngInToronto( e.latLng)) {
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
    

    //TODO: I could use idx and latlng and update one row using this.locId.
    //It looks like this.j() returns all the coordinates for the shape..
    //http://stackoverflow.com/questions/12515748/event-after-modifying-polygon-in-google-maps-api-v3
    //but be aware that this will fire off a large amount of triggered events
    //This is the same as a polyline...
      
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
        eventCalendarCacheService.putEvent(vm.event,vm.appCntl);
    }
    
    function setTab(tab) {
        vm.appCntl.tab = tab;
        if (vm.appCntl.tab === MAP_TAB && vm.appCntl.showMap ) {
            vm.refreshMap();
            $timeout(function() {
                vm.locationTabClicked = !vm.locationTabClicked;
                $scope.$apply();
            });
        }
        
        //$timeout(function() {  /* tab hasn't changed yet, need a digest . We do this, so the tab selection class becomes seen*/
        //  var ecStep = angular.element("#ec-step"+tab);
        //  var firstField = ecStep.find('input[type!=hidden]:first');
        //  firstField.focus();
        //});
        
    }
    
    /* using ui-tabs means I don't need this anymore.it is done in an angular way with bidning.*/
    /* called from init procedure after I get the data from local storage */
    //function displayTab(tab) {
    //    $('#eventNavBar a[href="#ec-step' +  tab + '"]').tab('show');
    //}
    
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
}

    angular.module('eventCalendarApp').controller('EventCalendarController', ["$rootScope", "$scope", "$log", "$state", "$parse", "$http", '$timeout', '$document','uiGmapGoogleMapApi', 'uiGmapIsReady','FileUploader','ngProgressFactory','eventCalendarCacheService','eventCalendarDataService','eventCalendarUtilService','tmpSubmitAPIService','submitAPIService','FORM_EVENTS','googleMapUtilsService',EventCalendarController]);
}());