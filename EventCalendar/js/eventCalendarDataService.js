/*
    This service provides all the lookup data for dropdowns. Currently they are hard coded values but it is possible
    that many of the values could be stored somewhere, especially the event categories
*/

(function () {
    'use strict';
    var eventCalendarDataService = function() {
    

    
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
    var eventCategoryData = eventCategoriesUnSort.sort(dynamicSort("","name")); 
	
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

    var newsLetterData = [ 
        { id : "1", value : "e-Guide"},
        { id : "2", value : "WBEY eNewsletter"},
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
        eventCategories:  _eventCategories,
        sportsSubcategories:  _sportsSubcategories,
        eventFeatures:  _eventFeatures,
        costRanges : _costRanges,
        cityDistricts : _cityDistricts,
        daysOfWeek : _daysOfWeek,
        newsLetters:  _newsLetters
    };
    return service;
    


    function _eventCategories() { 
        return angular.copy(eventCategoryData); 
    }
    function _sportsSubcategories() { 
        return angular.copy(sportsSubcategoryData); 
    }	
    function _eventFeatures() { 
        return angular.copy(eventFeatureData); 
    }   
    function _cityDistricts() {       
        return angular.copy(cityDistricts);
    }   
    function _costRanges() {       
        return angular.copy(costRanges);
    }
    function _daysOfWeek() {       
        return angular.copy(daysOfWeek);
    }   
    function _newsLetters() {       
        return angular.copy(newsLetterData);
    }   

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

    angular.module('eventCalendarApp').factory('eventCalendarDataService', eventCalendarDataService);

}());