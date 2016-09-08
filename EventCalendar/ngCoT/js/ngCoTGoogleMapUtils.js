/*
 ngCoTGoogleMapUtils.
 
I took the polyline from: https://www.google.com/maps/d/viewer?mid=1uclm6-D3MSanesned1rQCnzJtws&hl=en_US
We should get an official one from scott webv.

The polygon, is simply the polyline with a couple of points in thw water to complete the polygon. it is not perfectly along the water's edge on the assumption
there is no address there.  Google seems to gecode water points close to their closest land spot.

Warning: make sure google maps is loaded before using functions.
 
 */

 (function () {


var COTPolylineCoords =  [ 
        {'lng' : -79.543462,'lat' : 43.581168},
        {'lng' : -79.544706,'lat' : 43.581355},
        {'lng' : -79.544964,'lat' : 43.584316},
        {'lng' : -79.548826,'lat' : 43.586297},
        {'lng' : -79.546552,'lat' : 43.588737},
        {'lng' : -79.548054,'lat' : 43.59009},
        {'lng' : -79.549427,'lat' : 43.590649},
        {'lng' : -79.549513,'lat' : 43.59189200000001},
        {'lng' : -79.548569,'lat' : 43.593074},
        {'lng' : -79.548483,'lat' : 43.59475200000001},
        {'lng' : -79.54917,'lat' : 43.595187},
        {'lng' : -79.553289,'lat' : 43.595374},
        {'lng' : -79.553976,'lat' : 43.595933},
        {'lng' : -79.553719,'lat' : 43.5973},
        {'lng' : -79.553375,'lat' : 43.598481},
        {'lng' : -79.554663,'lat' : 43.59929},
        {'lng' : -79.555693,'lat' : 43.600035},
        {'lng' : -79.556293,'lat' : 43.602397},
        {'lng' : -79.558182,'lat' : 43.603516},
        {'lng' : -79.559641,'lat' : 43.605381},
        {'lng' : -79.564447,'lat' : 43.606934},
        {'lng' : -79.564533,'lat' : 43.608177},
        {'lng' : -79.566422,'lat' : 43.608674},
        {'lng' : -79.567366,'lat' : 43.60998},
        {'lng' : -79.566593,'lat' : 43.610725},
        {'lng' : -79.564104,'lat' : 43.612652},
        {'lng' : -79.564877,'lat' : 43.613335},
        {'lng' : -79.567451,'lat' : 43.613522},
        {'lng' : -79.568739,'lat' : 43.614019},
        {'lng' : -79.567623,'lat' : 43.616691},
        {'lng' : -79.566765,'lat' : 43.617437},
        {'lng' : -79.566593,'lat' : 43.618369},
        {'lng' : -79.567022,'lat' : 43.620668},
        {'lng' : -79.566679,'lat' : 43.620978},
        {'lng' : -79.565563,'lat' : 43.621165},
        {'lng' : -79.566078,'lat' : 43.622594},
        {'lng' : -79.56539200000002,'lat' : 43.624271},
        {'lng' : -79.564533,'lat' : 43.624458},
        {'lng' : -79.563675,'lat' : 43.624706},
        {'lng' : -79.563847,'lat' : 43.627378},
        {'lng' : -79.564877,'lat' : 43.628061},
        {'lng' : -79.567366,'lat' : 43.62793700000001},
        {'lng' : -79.567966,'lat' : 43.626881},
        {'lng' : -79.56934,'lat' : 43.626819},
        {'lng' : -79.573288,'lat' : 43.626073},
        {'lng' : -79.574747,'lat' : 43.625328},
        {'lng' : -79.577236,'lat' : 43.626135},
        {'lng' : -79.580154,'lat' : 43.626943000000004},
        {'lng' : -79.580927,'lat' : 43.627875},
        {'lng' : -79.582987,'lat' : 43.627999},
        {'lng' : -79.584188,'lat' : 43.628496},
        {'lng' : -79.585562,'lat' : 43.628776},
        {'lng' : -79.585948,'lat' : 43.629428},
        {'lng' : -79.585133,'lat' : 43.631292},
        {'lng' : -79.585218,'lat' : 43.632348},
        {'lng' : -79.585476,'lat' : 43.63309300000001},
        {'lng' : -79.585476,'lat' : 43.634274},
        {'lng' : -79.585733,'lat' : 43.63495700000001},
        {'lng' : -79.585304,'lat' : 43.636945},
        {'lng' : -79.585648,'lat' : 43.637628},
        {'lng' : -79.58787900000002,'lat' : 43.641044},
        {'lng' : -79.588566,'lat' : 43.643032},
        {'lng' : -79.591312,'lat' : 43.644399},
        {'lng' : -79.592171,'lat' : 43.644585},
        {'lng' : -79.596205,'lat' : 43.643156},
        {'lng' : -79.598351,'lat' : 43.643281},
        {'lng' : -79.601526,'lat' : 43.644026},
        {'lng' : -79.602728,'lat' : 43.644709},
        {'lng' : -79.604788,'lat' : 43.64415},
        {'lng' : -79.605732,'lat' : 43.644647},
        {'lng' : -79.607534,'lat' : 43.644958},
        {'lng' : -79.608736,'lat' : 43.646386},
        {'lng' : -79.589338,'lat' : 43.663774},
        {'lng' : -79.588909,'lat' : 43.664519},
        {'lng' : -79.593544,'lat' : 43.67228},
        {'lng' : -79.604702,'lat' : 43.692639},
        {'lng' : -79.61989400000002,'lat' : 43.717768},
        {'lng' : -79.635344,'lat' : 43.743631},
        {'lng' : -79.639206,'lat' : 43.749769},
        {'lng' : -79.63191,'lat' : 43.751443},
        {'lng' : -79.595432,'lat' : 43.759441},
        {'lng' : -79.572945,'lat' : 43.764648},
        {'lng' : -79.486771,'lat' : 43.783117},
        {'lng' : -79.364033,'lat' : 43.810128},
        {'lng' : -79.305496,'lat' : 43.824001},
        {'lng' : -79.254684,'lat' : 43.835641},
        {'lng' : -79.188423,'lat' : 43.850746},
        {'lng' : -79.170141,'lat' : 43.855388},
        {'lng' : -79.159327,'lat' : 43.831369},
        {'lng' : -79.156108,'lat' : 43.823288000000005},
        {'lng' : -79.154048,'lat' : 43.819201},
        {'lng' : -79.151216,'lat' : 43.814092},
        {'lng' : -79.149156,'lat' : 43.812389},
        {'lng' : -79.148169,'lat' : 43.812327},
        {'lng' : -79.145937,'lat' : 43.810809},
        {'lng' : -79.145851,'lat' : 43.809973},
        {'lng' : -79.14422,'lat' : 43.810004},
        {'lng' : -79.143105,'lat' : 43.809973},
        {'lng' : -79.142547,'lat' : 43.80954},
        {'lng' : -79.142118,'lat' : 43.809354},
        {'lng' : -79.141603,'lat' : 43.809385},
        {'lng' : -79.140701,'lat' : 43.808703},
        {'lng' : -79.140401,'lat' : 43.808332},
        {'lng' : -79.139628,'lat' : 43.808363},
        {'lng' : -79.138813,'lat' : 43.808301},
        {'lng' : -79.138083,'lat' : 43.807805},
        {'lng' : -79.137912,'lat' : 43.807403},
        {'lng' : -79.13731100000001,'lat' : 43.807867},
        {'lng' : -79.13671,'lat' : 43.807588},
        {'lng' : -79.136195,'lat' : 43.808146},
        {'lng' : -79.135551,'lat' : 43.808022},
        {'lng' : -79.134221,'lat' : 43.806845},
        {'lng' : -79.133792,'lat' : 43.806226},
        {'lng' : -79.134264,'lat' : 43.805018},
        {'lng' : -79.133964,'lat' : 43.804089},
        {'lng' : -79.133449,'lat' : 43.803221},
        {'lng' : -79.13362,'lat' : 43.802385},
        {'lng' : -79.135337,'lat' : 43.801084},
        {'lng' : -79.134994,'lat' : 43.800805000000004},
        {'lng' : -79.131646,'lat' : 43.80192},
        {'lng' : -79.130573,'lat' : 43.801859},
        {'lng' : -79.127784,'lat' : 43.800403},
        {'lng' : -79.125681,'lat' : 43.800527},
        {'lng' : -79.124093,'lat' : 43.799257},
        {'lng' : -79.124136,'lat' : 43.797987000000006},
        {'lng' : -79.123621,'lat' : 43.797367},
        {'lng' : -79.121819,'lat' : 43.79777000000001},
        {'lng' : -79.120789,'lat' : 43.796995},
        {'lng' : -79.119802,'lat' : 43.79603500000001},
        {'lng' : -79.119973,'lat' : 43.795571},
        {'lng' : -79.120917,'lat' : 43.795292},
        {'lng' : -79.120746,'lat' : 43.794889},
        {'lng' : -79.11963,'lat' : 43.795044},
        {'lng' : -79.118686,'lat' : 43.795013},
        {'lng' : -79.118085,'lat' : 43.794641},
        {'lng' : -79.117312,'lat' : 43.794641},
        {'lng' : -79.11654,'lat' : 43.795044},
        {'lng' : -79.115553,'lat' : 43.795168},
        {'lng' : -79.115167,'lat' : 43.79492},
        {'lng' : -79.114866,'lat' : 43.794703}  
    ];
	
	var COTPolygonCoords = angular.copy(COTPolylineCoords);
	COTPolygonCoords.push(        
		{ "lng": -79.11627159179687, "lat": 43.78155945891168 },
        { "lng": -79.30719134374999, "lat": 43.61350610044077 }
	);
	
    var cotGoogleMapUtils = angular.module('ngCoTGoogleMapUtils',[]);
    
    cotGoogleMapUtils.factory('googleMapUtilsService', ["$http","$q", function($http, $q)  {
        
         var service = {
            cityPolylineCoords: _cityPolylineCoords,
            cityPolygon: _cityPolygon,
			isLatLngInToronto: _isLatLngInToronto,
        };
        return service;
        
        function _cityPolylineCoords() {
            return COTPolylineCoords;               
        }
        function _cityPolygon() {
            return COTPolygon;               
        }	

		function _isLatLngInToronto(latLng) {
			var COTPolygon = new google.maps.Polygon({paths: COTPolygonCoords});
			return google.maps.geometry.poly.containsLocation(latLng, COTPolygon) ? true : false;				
		}
        
    }])
}());