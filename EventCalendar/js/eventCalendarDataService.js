/*
    This service provides all the lookup data for dropdowns.
	1) Currently they are hard coded values but it is possible that many of the values could be stored somewhere, especially the event categories
	2) We moved the data for WCM in the short term, but this creates JSONP problems.. we temporarly use jquery to get data as angular is having problems with the fake jsonp
*/

(function () {
    'use strict';
    var eventCalendarDataService = function($http, $q) {
    

    
    var eventCategoriesUnSort = [ 
       /* { id : "1", name : "Arts/Exhibit", disabledInd : false},*/
        { id : "1", name : "Arts/Exhibit"},
        { id : "2", name : "Cultural Hotspot"},
        { id : "3", name : "Family/Children"},
        { id : "4", name : "History"},
        { id : "5", name : "Sports"},
        { id : "6", name : "Celebrations/Holiday"},
        { id : "7", name : "Cycling"},
        { id : "8", name : "Farmers Markets"},
        { id : "9", name : "Live Performances"},
        { id : "10", name : "Theatre"},
        { id : "11", name : "Charity/Cause"},
        { id : "12", name : "Dance"},
        { id : "13", name : "Film"},
        { id : "14", name : "Music"},
        { id : "15", name : "Walking/Hiking"},
        { id : "16", name : "Consumer Shows"},
        { id : "17", name : "Environmental"},
        { id : "18", name : "Food/Culinary"},
        { id : "19", name : "Seminars/Workshops"},
        { id : "20", name : "Tour"}
        ]; 
    //var eventCategoryData = eventCategoriesUnSort.sort(dynamicSort("","name")); 
	var eventCategoryData = [];
	var sportsSubcategoryData = [ 
		{ id : "1", name : "Baseball"},
		{ id : "2", name : "Basketball"},
		{ id : "3", name : "Football"},
		{ id : "4", name : "Hockey"},
		{ id : "5", name : "Lacross"},
		{ id : "6", name : "Soccer"},
		{ id : "7", name : "Other"},
	];

    var eventFeatureData = [ 
        { id : "Free Parking", name : "Free Parking"},
        { id : "Paid Parking", name : "Paid Parking"},
        { id : "Bike Racks", name : "Bike Racks"},
        { id : "Public Washrooms", name : "Public Washrooms"},
        { id : "Onsite Food and Beverages", name : "Onsite Food and Beverages"},
        ]; 
    
    var costRanges = [ 
        /*{ id : "", value : "None Selected"},*/
        { id : "1", value : "Free"},
        { id : "2", value : "$1 - $9"},
        { id : "3", value : "$10 - $19"},
        { id : "4", value : "$20 - $29"},
        { id : "5", value : "$30 - $39"},
        { id : "6", value : "$40 - $49"},
        { id : "7", value : "$50 - $59"},
        { id : "8", value : "$60 - $69"},
        { id : "9", value : "$70 - $79"},
        { id : "10", value : "$80 - $89"},
        { id : "11", value : "$90 - $99"},
        { id : "12", value : "$100+"}
        ];   

    var newsLetterCategories = [ 
        { id : "1", value : "Festival and Events"},
        { id : "2", value : "Attractions/Happenings"},
        { id : "3", value : "Performing Arts"},
        { id : "4", value : "Sports"},
        ];
		
	var newsLetterSubcategories = [
	    { id : "1", category: "Attractions/Happenings", value : "Aga Khan Museum"},
        { id : "2", category: "Attractions/Happenings", value : "Air Canada Centre"},
        { id : "3", category: "Attractions/Happenings", value : "Art Galley of Ontatio"},
        { id : "4", category: "Attractions/Happenings", value : "Bata Show Museum"},
        { id : "21", category: "Sports", value : "GTARollergirls"},
        { id : "22", category: "Sports", value : "Other"},
	];
	
    var monthlyWeekDay = [
        { value : "First"},
        { value : "Second"},
        { value : "Third"},
        { value : "Fourth"},
        { value : "Last"}
        ];
    var daysOfWeek = [
        { day : "Monday"},
        { day : "Tuesday"},
        { day : "Wednesday"},
        { day : "Thursday"},
        { day : "Friday"},
        { day : "Saturday"},
        { day : "Sunday"}
        ];      
    var frequencyDuration = [ 
        { value : 1},
        { value : 2},
        { value : 3},
        { value : 4},
        { value : 5},
        { value : 6},
        { value : 7}
        ];
    var daysOfMonth = [ 
        ];       
    for (var i = 1; i <= 31; i++) {
        daysOfMonth.push({value: i});
    }

	var eventCategoriesCache;
	var eventSportsCategoriesCache;
	var eventFeaturesCache;
	var costRangeCache;
	var newsletterCategoriesCache;
	var newsletterSubcategoriesCache;
	 
	 
    var cityDistricts = [ 
        { id: 'cityWide' , title : 'City Wide'},
        { id: 'downtown' , title : 'Downtown'},
        { id: 'centralEast' , title : 'Central East'},
        { id: 'centralWest' , title : 'Central West'},
        { id: 'northEast' , title : 'Northeast'},
        { id: 'northWest' , title : 'Northwest'},
        { id: 'southEast' , title : 'Southeast'},
        { id: 'southWest' , title : 'Southwest'},
        ];

    var service = {
        eventCategories: _eventCategories,
        sportsSubcategories:  _sportsSubcategories,
        eventFeatures:  _eventFeatures,
        costRanges : _costRanges,
        cityDistricts : _cityDistricts,
        daysOfWeek : _daysOfWeek,
        newsletterCategories:  _newsletterCategories,
        newsletterSubcategories:  _newsletterSubcategories
    };
    return service;
    
    function _eventCategories() { 
		var deferred = $q.defer();
		if( eventCategoriesCache ) {
            deferred.resolve(angular.copy(eventCategoriesCache));
        }
		//var strURL = "http://homer-1.inet.toronto.ca/static_files/WebApps/EventsCalendar/data/EventCategories.json?callback=JSON_CALLBACK";
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/EventCategories.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks0', // match what I faked in json data
                success : function(data) {
					eventCategoriesCache = data.sort(dynamicSort("","name"));
					deferred.resolve(angular.copy(eventCategoriesCache));
                },
                error: function (xhr, exception) {
					console.log("eventCategories retreival error");
                },
		   });		
		
		/*
		var params = {
            callback: 'JSON_CALLBACK',
			}
		$http({ url : strURL,
				method: 'JSONP',
				})
        .success(function(data) {
			eventCategoriesCache = data.sort(dynamicSort("","name"));
			deferred.resolve(angular.copy(eventCategoriesCache));
        })				
		.error(function(data, status, headers, config) {
				console.log("eventCategories retreival error" + status);
		}); 
*/		
		return deferred.promise; 
    }
	

	
    function _sportsSubcategories() { 
		var deferred = $q.defer();
		if( eventSportsCategoriesCache ) {
            deferred.resolve(angular.copy(eventSportsCategoriesCache));
        }	
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/EventSportsCategories.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks1',
                success : function(data) {
					eventSportsCategoriesCache = data.sort(dynamicSort("","name"));
					deferred.resolve(angular.copy(eventSportsCategoriesCache));
                },
                error: function (xhr, exception) {
					console.log("event Sport Categories retreival error");
                },
		   });		
		/*
		$http({ url : strURL,
				method: 'JSONP',
				})
        .success(function(data) {
			eventSportsCategoriesCache = data.sort(dynamicSort("","name"));
			deferred.resolve(angular.copy(eventSportsCategoriesCache));
        })				
		.error(function(data, status, headers, config) {
				console.log("eventSportsCategories retreival error" + status);
		});    
		*/
		
		return deferred.promise;
    }	
    function _eventFeatures() { 
		var deferred = $q.defer(); 
		if( eventFeaturesCache ) {
            deferred.resolve(angular.copy(eventFeaturesCache));
        }
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/EventFeatures.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks5', // match what I faked in json data
                success : function(data) {
					eventFeaturesCache = data;
					deferred.resolve(angular.copy(eventFeaturesCache));
                },
                error: function (xhr, exception) {
					console.log("eventFeaturesCache retreival error");
                },
		   })		
		return deferred.promise;
    }   
    function _cityDistricts() {       
        return angular.copy(cityDistricts);
    }   
    function _costRanges() {  
		var deferred = $q.defer(); 
		if( costRangeCache ) {
            deferred.resolve(angular.copy(costRangeCache));
        }
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/CostRanges.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks2', // match what I faked in json data
                success : function(data) {
					costRangeCache = data.sort(dynamicSort("","name"));
					deferred.resolve(angular.copy(costRangeCache));
                },
                error: function (xhr, exception) {
					console.log("cost Range retreival error");
                },
		   })		
		return deferred.promise;
    }
    function _daysOfWeek() {       
        return angular.copy(daysOfWeek);
    }   
    function _newsletterCategories() {       
       	var deferred = $q.defer();
		if( newsletterCategoriesCache ) {
            deferred.resolve(angular.copy(newsletterCategoriesCache));
        }	
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/NewsletterCategories.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks3',
                success : function(data) {
					newsletterCategoriesCache = data.sort(dynamicSort("","name"));
					deferred.resolve(angular.copy(newsletterCategoriesCache));
                },
                error: function (xhr, exception) {
					console.log("event Sport Categories retreival error");
                },
		   });		
		
		return deferred.promise;
    }   
	
	function filterCategory(cat) {
		var ret = [];
		angular.forEach(newsletterSubcategoriesCache, function(item, i) {
			var subCat = item;
			if (item.category === cat) {
				ret.push(subCat);
			}
		}); 
		return ret;
	}
	function _newsletterSubcategories(cat) {
	    var deferred = $q.defer();
		if (newsletterSubcategoriesCache ) {
            deferred.resolve(filterCategory(cat));
        } else {
		var strURL = "//www1.toronto.ca/static_files/WebApps/EventsCalendar/data/NewsletterSubcategories.json";
		$.ajax({
                url :  strURL,
                type : "GET",
                crossDomain: true, 
				async: false,
				cache: false,
                dataType: 'jsonp',  //need jsonp for cors
				jsonpCallback : 'angularcallbacks4',
                success : function(data) {
					newsletterSubcategoriesCache = data.sort(dynamicSort("","value"));
					deferred.resolve(filterCategory(cat));
                },
                error: function (xhr, exception) {
					console.log("newsletter sub categories retreival error");
                },
		   });	
		 }
		return deferred.promise;
	
	}
	/*
    function _newsletterSubcategories(cat) {    
		//alert(cat);
		var ret = [];
		angular.forEach(newsLetterSubcategories, function(item, i) {
			var subCat = item;
			if (item.category === cat) {
				ret.push(subCat);
			}
		});
        return ret; //angular.copy(newsLetterSubcategories);
    } 
	*/
	
    function dynamicSort(root, property) {
        var sortOrder = 1;
        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }

        return function (a,b) {
            var result = 0;
            if (root !== "") {
                result = (a[root][property] < b[root][property]) ? -1 : (a[root][property] > b[root][property]) ? 1 : 0;
            } else {
                result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            }
            return result * sortOrder;
            };
        } 

    };

    angular.module('eventCalendarApp').factory('eventCalendarDataService', ["$http","$q",eventCalendarDataService]);

}());