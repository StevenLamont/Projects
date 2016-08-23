/**
 * @fileoverview 
 * Map operates in two way.  the map is loaded with KML layers generated at google in a google drive account using google script
 * If a search is performed, the KMLLayer is removed and mapMarkers of the search are added.. This is slower ..
 */
/*
 swimsafe API:  
 The id in the DATA_URL matches the serviceId in the detailURL, bit the detail URL returns data via addressId.
*/
/*
Differences from DineSafe -- only one API to get data, there is no paging parameters and with the current total of a little over 1000 places, it is approx. 500-K
--> so here we put all the data into an array and search off it.

listing is showing 3 for musiz.. which is the service level.. is that too much data?

1) In KML - have location data plus history..ASSUMING it doesn't take too much procerssing time.

2) When I redraw map.. get search data..and draw icons.. if the details are there, call detail API and fill in missing details (don't want to do this up front for all redrawn icon)
3) When I ckick on a listing.. same as 2

I'm taking addresses and creating facilities from them...
so after I reorg addresses.. i need to re-reog them to be facility based. or habve a second API made.. we want it bioth by address and facility names (we sort by facility name in the listing)

Note!!! because search includes the seching of history (history not included int he search API..) all searches are done in the back end..???

4) We really need to split "generate Listing" from search..   on thge filter changes we want to filter data and generate listing.. if we hit thre page events, we really want to generatr listing.

6) since I have the lookup data and no hard codes. I could get rid of my multi-select decode stuff..if I wanted.,by why bother..

Unlike DienSafe/BodySafe.. the current swimsagfe gets the details when the user clicks on the map icon. When they do history is there because of it.
--> we can still maintain the current thought and only get the details when I need to (on a history click)

For new API:
//TODO: we should be able to get details for the facility via facility Id.. so change detail URL accordingly.
//There is no facility status.. we could calculate one .. but we expect one to be there.

The FacilityAPI needs services for the listing..
--> bascially it is the servicesAPI for content.. but FACILITY ID driven.. don't need the AddressStuff


psuedo Issue: I have a marker with 2 faciltiies: Rieveria Condinium and The Riveria.
--> if I click on a KML map markers.. I both both facilities and show it in info window.
--> if I click on "R" listing.. then click on the listing link.. The dot on the map is "multi", but I only show the Riveria Condominium one since I don't ahve the other one.
I wonder if there is a way to "force a KML click event" from code.

==> still need to put in proper.. check if no real search donbe.. so use KML.

todo:

If I click resetMao twice in a row.. cluster disappears.
decode multiselect, probablt doesn'yt wotk in ie11. check.
Markers in google.. reference pnes at TPH for now iuntil there are standardized.(but they are not published yet)
Circle icons.. the ones on body safe are a little bigger.. lengend on body safe


*/
var randKey =  (new Date()).valueOf();
var DETAIL_URL = "http://was8-inter-dev.toronto.ca/opendata/tphir/irps_query_inspections.json?v=1.0&callback=?&fid=";
var DATA_URL = '//was8-inter-dev.toronto.ca/opendata/tphir/irps_query_services.json?v=1.0&callback=?';
var ALPHA_COUNT_URL = '//was8-inter-dev.toronto.ca/opendata/tphir/irps_query_atoz.json?v=1.0&callback=?'; 
var SEARCH_URL = '//was8-inter-dev.toronto.ca/opendata/tphir/irps_query_services.json?v=1.0&callback=?';

var LOOKUP_DATA_URL = "//was8-inter-dev.toronto.ca/opendata/tphir/irps_lookup.json?v=1.0&callback=?";
//var LOOKUP_DATA_URL = "https://drive.google.com/uc?id=0B-j2Y49nfiw2SDE5SDhCY3A1MnM&callback=?";

var KML_MASTER = 'https://docs.google.com/uc?id=0B-j2Y49nfiw2cVNsUURIM3RnQmM&rand=' + randKey;
//'https://drive.google.com/uc?id=0B-j2Y49nfiw2YkNxYUY5WXdwRVU&rand='+ randKey;
//var KML_MASTER = 'http://app.toronto.ca/opendata/tphir/irps_query_inspections_full.kml?v=1.0';
//http://was8-inter-dev.toronto.ca/opendata/ir/irps_query_inspections.kml?v=1.0';
//var KML_MASTER = 'https://docs.google.com/uc?id=0B-j2Y49nfiw2VElOcF9fa2xKTk0&rand=' + randKey;

var gblTotalFacilities;
var gblFacilityJSON;
var gblAddressData;
var gblFacilities;
//var gblFilteredFacilities;
//var gblFilteredAddresses;
var gblFacilityData;
var gblRowsPerPage = 10;
var gblNextPage = 0;
var gblCurrentAlphaPage = '0';
var ALPHA_PAGING_METHOD = 'Alpha';
var NUMERIC_PAGING_METHOD = 'Num';
var gblPagingMethod = ALPHA_PAGING_METHOD;


/*
  var CommonInfoWindow = new google.maps.InfoWindow({"minWidth": 500});
*/
var CommonInfoWindow = new google.maps.InfoWindow();
//var selectedEstablishmentData = [];
//todo: UNKNOWN... WHAT TO DO...
var statusIcons = { "0" : "images/map/blank.png",
 //                          'SATISFACTORY' : {large:  "/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/images/marker_dot_pass.png", alt : "Satisfactory"},
 //                          'REINSPECTION' : {large:  "/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/images/marker_dot_pass.png", alt : "Reinspection" },
 //                          'DEFICIENCIES' : {large:  "/static_files/WebApps/Health/safe/images/conditional_large.png", medium:  "/static_files/WebApps/Health/safe/images/conditional_small.png", small:  "/static_files/WebApps/images/marker_dot_conditional.png", alt : "Deficiencies"},
                           'PASS' : {large:  "/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/Health/safe/images/pass_circle.gif", alt : "Pass"},
                           'CONDITIONAL_PASS' : {large:  "/static_files/WebApps/Health/safe/images/conditional_large.png", medium:  "/static_files/WebApps/Health/safe/images/conditional_small.png", small:  "/static_files/WebApps/Health/safe/images/conditional_circle.gif", alt : "Conditional Pass" },
                           'CLOSED' : {large:  "/static_files/WebApps/Health/safe/images/closed_large.png", medium:  "/static_files/WebApps/Health/safe/images/closed_small.png", small:  "/static_files/WebApps/Health/safe/images/closed_circle.gif", alt : "Closed"},
                           'UNKNOWN' : {large:  "/static_files/WebApps/Health/safe/images/closed_large.png", medium:  "/static_files/WebApps/Health/safe/images/closed_small.png", small:  "/static_files/WebApps/Health/safe/images/closed_circle.gif", alt : "Closed"}
                        };
//TODO: i most of these went away
var markerImages = {
 //       'SATISFACTORY'  : {icon: '/static_files/WebApps/images/marker_dot_pass.png', value : 1},
 //       'REINSPECTION'  : {icon: '/static_files/WebApps/images/marker_dot_pass.png', value : 1},
 //       'DEFICIENCIES'  : {icon: '/static_files/WebApps/images/marker_dot_conditional.png', value : 2},
        'CLOSED'        : {icon: '/static_files/WebApps/Health/safe/images/s_closed.png', value : 3},
        'multi'         : {icon: '/static_files/WebApps/Health/safe/images/s_multi.png', value : 4},
        'PASS'          : {icon: '/static_files/WebApps/Health/safe/images/s_pass.png', value : 1},
        'CONDITIONAL_PASS' : {icon: '/static_files/WebApps/Health/safe/images/s_conditional.png', value : 2},
        'UNKNOWN' : {icon: '/static_files/WebApps/Health/safe/images/s_closed.png', value : 2}
        };
/*
        'CLOSED'        : {icon: '/static_files/WebApps/images/marker_dot_closed.png', value : 3},
        'multi'         : {icon: '/static_files/WebApps/images/marker_dot_multi.png', value : 4},
        'PASS'          : {icon: '/static_files/WebApps/images/marker_dot_pass.png', value : 1},
        'CONDITIONAL_PASS' : {icon: '/static_files/WebApps/images/marker_dot_pass.png', value : 2},
        'UNKNOWN' : {icon: '/static_files/WebApps/images/marker_dot_closed.png', value : 2}
*/

var CLUSTER_IMAGES = '/static_files/WebApps/images/mc';
var STREET_VIEW_ICON ='/static_files/WebApps/Health/safe/images/streetView.png';

var TPH_API_DATE_FORMAT = "YYYY-MM-DD";
var DISPLAY_DATE_FORMAT = "MMMM DD, YYYY";
var CLUSTER_TO_KML_ZOOM_SWITCH = 15;
var RESET_ZOOM_LEVEL = 11;
var MAP_CENTER = new google.maps.LatLng(43.69666,-79.39274);
var gblMap;
var gblMapSrc = "KML";
var gblKMLLayer;
var gblMarkerCluster;
var gblShellCluster;
var gblMapMarkers = [];
var gblMapMarkerShells = [];
var gblPlacesMarkers = [];
var gblFacData;

var gblFacIdMap;


/*----------------------------------------------------------------------------------*/
function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// I needed the opposite function today, so adding here too:
function htmlUnescape(value){
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

function switchToStreetView(objPosition) {

    var panorama = gblMap.getStreetView();
    var ll = objPosition.replace("(","").replace(")","").split(",");
    var streetViewService = new google.maps.StreetViewService();
    var STREETVIEW_MAX_DISTANCE = 50;
    var latLng = new google.maps.LatLng(ll[0],ll[1]);

    streetViewService.getPanoramaByLocation( latLng, STREETVIEW_MAX_DISTANCE, function ( streetViewPanoramaData, status ) {

        if ( status === google.maps.StreetViewStatus.OK) {               
            panorama.setPosition( streetViewPanoramaData.location.latLng );
            panorama.setPano( streetViewPanoramaData.location.pano );                    
            panorama.setPov( {
                heading: google.maps.geometry.spherical.computeHeading( streetViewPanoramaData.location.latLng, latLng ),
                zoom: 1,
                pitch: 0
            } );
            panorama.setVisible(true);
        } else {
            bootbox.alert("No street view available for this location");
        }
    });
    
}

/* our numbering is zero based, so increment for display purposes */
function setPageStatus( start, end, totalRows) {
   
    if (end > totalRows) { 
        $("#RowEnd").html(totalRows);
    } else {
        $("#RowEnd").html(end + 1);
    }
    $("#TotalRows").html(totalRows);
    var numPages = Math.ceil(totalRows / gblRowsPerPage);
    if ( numPages === 0) {
        numPages = 1;
        $("#RowStart").html(0);
    } else {
        $("#RowStart").html(start +1);
    }
    
    $('#numberPageSelection').bootpag({
        total: numPages
    }); 
}
function selectFilter(filterStr, itemStr) {
    if ( filterStr === 'ALL') return true;
    if (typeof itemStr === 'undefined') return false;

    var retbool = false;
    if ( filterStr.length > 0 && filterStr.toLowerCase().indexOf(itemStr.toLowerCase()) > -1) {
        retbool = true;
    }
    return retbool;
}
function multiSelectFilter(filterStr, itemStr, itemSep) {
    if ( filterStr === 'ALL') return true;
    if (typeof itemStr === 'undefined') return false;
    if (itemStr === '') return false;

    var itemArr  = itemStr.split(itemSep);
    var retbool = false;
    $.each(itemArr, function(i, item) {
        retbool = selectFilter(filterStr, item.trim());
        if (retbool === true) {
            return false;
        }
    });
    return retbool;
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
function resetAdvancedFilters() {
   $(".filterSelect").each(function( index ) {

        $(this).multiselect('selectAll',false);
        $(this).multiselect('refresh');
        //if(this.id !== null && this.selectedOptions.length != this.options.length) {
        //  for (i = 0; i < this.options.length; i++) {
        //      this.options[i].selected = true;
        //  }
        //}
    }); 
    $("#dateFrom").val("");
    $("#dateTo").val("");
   // var wardFilter = $("#wardFilter");
   // wardFilter.val("0");
   // wardFilter.multiselect('refresh');
    $("#incHistory").prop('checked', false);
}


function resetFilters() {
    CommonInfoWindow.close(); 
    resetAdvancedFilters();
    $(".searchString").each(function( index ) { 
        $(this).val("");
    });

}


function decodeMultiSelect(domId) {
    var str = "";
    if ($(domId).prop('options') &&  $(domId).prop('selectedOptions') && $(domId).prop('options').length === $(domId).prop('selectedOptions').length) {
        str = "ALL";
    } else if ($(domId).val() !== null) {
        $.each($(domId).val(), function(i,item) {
            str += (i>0) ? "." : "";
            str += item;
        });
    }
    return str;
}

function getStatusIcon(statusCd, size) {
    if  (typeof statusCd === 'undefined') return "";
    if (statusIcons[statusCd]) {
        return statusIcons[statusCd][size];
    } else {
        return statusCd;
    }

}


/* -------------------------------------------------------------------------------------------*/

/* LIke google code, this is specific to each app. In SwimSafe I can use "AddressId" instead of lat/lng if desired.
"aid": 2,
    "address": "100 ROWENA DR, M3A 1P9",
    "id": 2,
    "type": "satisfactory",
    "status": "SATISFACTORY",
    "serviceName": "Outdoor Pool",
    "serviceType": "OUTDOOR_POOL",
    "access": "RESTRICTED",
    "addressId": 2,
    "facilityName": "100 ROWENA",
    "zoom": 0,
    "lat": 43.7517238195,
    "lng": -79.3143707442,
    "ward": 34,
    "inspectionTimestamp": 1440388800000
    */
function mergeLocations(locData) {
   var locations = {};
        
  for( var n = 0; n < locData.length; n++ ) {
            
    var oData = {
      id: locData[n].id,
      addressId : locData[n].addressId,
      facilities : locData[n].facilities,
      address: locData[n].address,
      status: locData[n].status,
      lat: ( +locData[n].lat ),
      lng: ( +locData[n].lng ),
      latlng: ( +locData[n].lat ) + "," +  ( +locData[n].lng )
    };

    if( !locations[ oData.latlng ] ) {
         locations[ oData.latlng ] = 
           {
             aid: oData.addressId,
             address: oData.address,
             facilities: oData.facilities,
             lat: oData.lat,
             lng: oData.lng
         };
    } else {
           locations[ oData.latlng ].facilities = locations[ oData.latlng ].facilities.concat(oData.facilities);
         }
                
  }
  
   return locations;

/*

    var locations = {};
        
    for( var n = 0; n < locData.length; n++ ) {
            
        var loc = {
            id: locData[n].id,
            addressId: locData[n].addressId,
            name: locData[n].facilityName,
            address: locData[n].address,
            status: locData[n].status,
            lastInspected: locData[n].inspectionTimestamp || null,
            lat: ( +locData[n].lat ),
            lng: ( +locData[n].lng ),
            latlng: new google.maps.LatLng( +locData[n].lat, +locData[n].lng )
            };
            
        if( !locations[ loc.latlng.toString() ] )
            locations[ loc.latlng.toString() ] = 
                {
                address: loc.address,
                addressId : loc.addressId,
                establishments: [], //TODO: htis should be called failities
                lat: loc.lat,
                latlng: loc.latlng,
                lng: loc.lng
                };
                
            locations[ loc.latlng.toString() ].establishments.push( {
                id: loc.id,
                addressId : loc.addressId,
                name: loc.name,
                status: loc.status,
                lastInspected: loc.inspectionTimestamp
            } );
        }
    return locations;
   */
}


function clearMarkers(markers) { /*ignore parms*/
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function plotMarkers() {
    var locations = mergeLocations( gblFacDataArray);
    gblMapMarkers = [];
    //for( var k in locations ) {
    Object.keys(locations).forEach(function(fid, idx, array) {
        //for (var i = 0; i < gblFilteredAddresses; i++) {
        //    var location = gblFilteredAddresses[i];
        var location = locations[fid];       
        var latLng = new google.maps.LatLng(location.lat,location.lng);                    
            
         //TODO: fix this.var iconSrc  = markerImages[location.establishments[0].status];
        var iconSrc  = markerImages[location.facilities[0].facilityStatusCd].icon;
        if ( location.facilities.length > 1 ) iconSrc = markerImages.multi.icon;
        var title = ( location.facilities.length  > 1 ) ? location.facilities.length + ' Facilities' : location.facilities[0].facilityName;
                
        /* not sure why this is needed, but kml points, seems to be slightly different than this method */
        var markerImage = new google.maps.MarkerImage(iconSrc,
            new google.maps.Size(80, 80), //size
            new google.maps.Point(0, 0), //origin point
            new google.maps.Point(8, 8)); // offset point
        var marker = new google.maps.Marker({
            position: latLng,
            map: gblMap,
            location : location,
            id:  location.facilities[0].fid,
            icon: markerImage,
            title: title
        });
        marker.addListener('click', function () {
            createInfoWindow(this.position, this.location);
        });

        gblMapMarkers.push(marker);
        //map.addMarker( latlng, imageIndex, title );
    });
   if ( gblMarkerCluster ) {
        gblMarkerCluster.clearMarkers();
    }
    gblMarkerCluster = new MarkerClusterer(gblMap, gblMapMarkers, { title : 'locations', averageCenter : true, ignoreHidden: true , minimumClusterSize : 2, imagePath : CLUSTER_IMAGES , maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH});//,{
    shellCluster('hide');
        
   // console.log('plot marker finsihed -seting zoomn level to 11');
    gblMap.setZoom(RESET_ZOOM_LEVEL);
    $("#mapLoader").modal('hide');
    
}


/* do I want to actually merge locations? if i do, the the cluster show location and not establishment counts 
but when I plot markers on the search, I actually use those markers, so we need to merge the locations.
*/
function plotMarkerShells(data) { /*ignore parms*/
    gblMapMarkerShells = [];
    var icon;
    var locations = mergeLocations(data);
    //var locations = data;
    Object.keys(locations).forEach(function(key, idx, array) {
    //for( var i = 0; i < data.length; i++ ) {
        //var location = data[i];         
        var location = locations[key];
        var latlng = new google.maps.LatLng( location.lat, location.lng );
        var imageVal = 1;
        var imageIndex = "SATISFACTORY";
        var facCnt = 0;
        Object.keys(location.facilities).forEach(function(key, idx, array) {
            facCnt++;
            var facility = location.facilities[key];
            imageIndex = facility.facilityStatusCd;
            /* we now have the facilities status so don't need to check each service and can delete value from object.
            for (var i = 0; i < fac.services.length; i++){
                if (markerImages[fac.services[i].status].value > imageVal) {
                    imageVal = markerImages[fac.services[i].status].value;
                    imageIndex = fac.services[i].status;
            }
            
            }
            */
        });
        if (facCnt > 1) {
            imageIndex = 'multi';
        }
                
        if (markerImages[imageIndex]) {
            icon = markerImages[imageIndex].icon;
        } else {
            icon = "";
            console.log("missing: " + imageIndex); //here missing isn't so bad since they are for the clusters
        }
            
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            icon: icon
            });
        gblMapMarkerShells.push(marker);
    });
    //}
     if ( gblShellCluster ) {
        gblShellCluster.clearMarkers();
     }
     

    gblShellCluster = new MarkerClusterer(gblMap, gblMapMarkerShells, { title : 'locations', averageCenter : true,ignoreHidden: true , minimumClusterSize : 1,  imagePath :  CLUSTER_IMAGES, maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH });//,{
    // We create them, but hide them and they will show on the correct zoom level
    shellCluster('hide');

}
function loadShellMarkerData() {
    var url = SEARCH_URL;
    $.ajax({
        type: 'GET',
        url: url,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            plotMarkerShells(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            bootbox.alert("An error has occured. Please try again.");
            console.log(xhr.status);
            console.log(thrownError);
        }
    }); 
}

function redrawMap() {
    $("#mapLoader").modal('show');
    gblMapSrc = 'Markers';
    gblKMLLayer.setMap( null );
    clearMarkers(gblMapMarkers);
    plotMarkers();
    
}

function resetMapToKML() {
    if (gblMapSrc != 'KML') {
        clearMarkers(gblMapMarkers);
        markerCluster('hide');        
        gblKMLLayer.setMap(  gblMap );
        gblMapSrc = 'KML';
        //gblMap.setZoom(gblMap.getZoom());
        resetMap();
        setTotalDisplay(gblTotalFacilities);
    }
}


/* LIke google code, this is specific to each app. In SwimSafe I can use "AddressId" instead of lat/lng if desired.
"aid": 2,
    "address": "100 ROWENA DR, M3A 1P9",
    "id": 2,
    "type": "satisfactory",
    "status": "SATISFACTORY",
    "serviceName": "Outdoor Pool",
    "serviceType": "OUTDOOR_POOL",
    "access": "RESTRICTED",
    "addressId": 2,
    "facilityName": "100 ROWENA",
    "zoom": 0,
    "lat": 43.7517238195,
    "lng": -79.3143707442,
    "ward": 34,
    "inspectionTimestamp": 1440388800000
    */
    
/* there are multiple facilities at a location and multiple services at a facility 
3800 YONGE ST is one example buit there is 2 addressId
I think there is 1 id per record.. it is unique for all.. so useless.
121 Mcahan has 4 facilitynames.. and 1 service per... but they all have the same address id

gblAddress should be keyed on ADDRESSiD AND FACILITY NAME

Is access facility or service level??? it appears to be be service level.. I found one example.
id on record is probably faciclityId -- no its service ID.

We want address data to re-draw map
We want facilityData for listings
*/

function reorgAddressData() {
    gblAddressData = {};
    gblFacilityData = {};
    $.each(gblFacilityJSON, function(i, item) {
        if (typeof item.facilityName === "undefined") return true;  //skip bad data
        if (!gblAddressData[item.aid]) {
            gblAddressData[item.aid] = {aid : item.aid, address: item.address, lat: item.lat, lng : item.lng, ward: item.ward , facilities : {}};
        }
        //if (!gblFacilityData[item.facilityName]) {
        if (!gblFacilityData[item.aid]) {
            gblFacilityData[item.aid] = {id : item.id, aid: item.aid, address: item.address, lat: item.lat, lng : item.lng, ward: item.ward , facilityName: item.facilityName, services : []};
        }       
        if (!gblAddressData[item.aid].facilities[item.facilityName]) {
            gblAddressData[item.aid].facilities[item.facilityName] =  { name: item.facilityName, services : [] } ;          
        }
        var service = { serviceType: item.serviceType, serviceName: item.serviceName, access: item.access, status : item.status , lastInspectionTimestamp : item.inspectionTimestamp};
        gblAddressData[item.aid].facilities[item.facilityName].services.push(service);
        gblFacilityData[item.aid].services.push(service);
     });
    
    /*
     Object.keys(gblAddressData).forEach(function(aid, idx, array) {
        if(gblAddressData[aid].facilityNames.length > 1 ) {
            //console.log(gblAddressData[aid].address + " has " +gblAddressData[aid].facilityNames.length + " facs");
        }
        var facName= gblAddressData[aid].facilityNames[0];
        for (var i = 0 ; i < gblAddressData[aid].facilityNames.length; i++) {
            if ( gblAddressData[aid].facilityNames[i] !== facName) {
                console.log("*** multiple fac names" + gblAddressData[aid].address);
            }
        }   
        if(gblAddressData[aid].serviceTypes.length > 1 ) {
          //  console.log(gblAddressData[aid].address + " has " +  gblAddressData[aid].serviceTypes.length  + " services");
        }       
     });
    */
    //Note we are sorting serices for each facilities, then sorting facilities..
    gblFacilities = [];
     Object.keys(gblFacilityData).forEach(function(id, idx, array) {
        gblFacilityData[id].services = gblFacilityData[id].services.sort(dynamicSort("","name"));
        gblFacilities.push(gblFacilityData[id]);
     });
     
     gblFacilities = gblFacilities.sort(dynamicSort("","name"));
}

function determineSearchParms() {
    var search = false;
    var searchURLAdd ="";
    var srchEst = $("#estSearch").val();
    var srchAddr = $("#addrSearch").val();
    
    if (srchEst !== "") { 
        var fparms =  srchEst.split(" ");
        for (var j = 1; j <= fparms.length; j++) {
            searchURLAdd  += "&n" + j + "=" + fparms[j -1].replace(/[^A-Za-z 0-9]*/g, '');
        }
        search = true;
    }
    if (srchAddr !== "") { 
       var aparms = srchAddr.split(" ");
        for (var i = 1; i <= aparms.length; i++) {
            searchURLAdd  += "&a" + i + "=" + aparms[i -1].replace(/[^A-Za-z 0-9]*/g, '');
        }
        search = true;
    }

    var selectedSvcTypes = decodeMultiSelect("#svcTypeFilter");
    if (selectedSvcTypes !== 'ALL') {
        search = true;
        searchURLAdd += "&type=" + selectedSvcTypes;
    }
    
    var selectedAccs = decodeMultiSelect("#accFilter");
    if (selectedAccs !== 'ALL') { 
        search = true;
        searchURLAdd += "&access=" + selectedAccs;
    }
    
    var selectedStatuses = decodeMultiSelect("#statusFilter");
    if (selectedStatuses !== 'ALL') { 
        search = true;
        searchURLAdd += "&status=" + selectedStatuses;
    }
    
    var selectedWards =  decodeMultiSelect("#wardFilter");
    if (selectedWards !== 'ALL') { 
        search = true;
        searchURLAdd += "&wards=" + selectedWards;
    }
    //var wards = $("#wardFilter").val();
    /*if (wards !== '0') { 
        searchURLAdd += "&ward=" + wards;
        search = true;
    }
    */
    if ($("#incHistory").prop('checked')) {
         searchURLAdd += "&includepast=Y";
         search = true;
    }
    var dateFrom = $("#dateFrom").val(); 
    var dateTo = $("#dateTo").val();
    if (dateFrom !== "") {
        searchURLAdd += "&earliest=" + moment(dateFrom).format(TPH_API_DATE_FORMAT);
        search = true;
    }    
    if (dateTo !== "") {
        searchURLAdd += "&latest=" + moment(dateTo).format(TPH_API_DATE_FORMAT);
        search = true;
    }
    
    return { filtersApplied: search, urlParms: searchURLAdd};

}
/* This for paging when searching... and when "ShowListingOnMap" (so it is called from AlphaPaging
  The funky key on the facData is for easy sorting.  We then need to maintain a map from Fid to this key.
  
  Even though the DATA_URL is for services..it gets the data by facilities.
  The top level is by location/addressISD
*/

function savePageData( data) { /*ignore parms*/
    
    gblFacData = {};
    gblFacDataArray = [];
    gblFacIdMap = {};
    var facCnt = 0;
    /* each item will have 1 facility in an array */
    $.each(data, function(i, item) {
        var address = {};
        var facility = item.facilities[0];
        address.address = item.address;
        address.lat = item.lat;
        address.lng = item.lng;
        address.facilities = [];
        address.facilities = address.facilities.concat(item.facilities);
        var objKey = facility.facilityName + facility.facilityId;
        if (!gblFacData[objKey]) {
            facCnt++;
            gblFacData[objKey] = address;
        }
        gblFacIdMap[facility.facilityId] = objKey;
    });
    gblFacDataCnt = facCnt;
    
    /* lets make facDataArray an array of facilities */
    Object.keys(gblFacData).forEach(function(key, idx, array) {
         $.each(gblFacData[key].facilities, function(i, facility) {
            var address =  $.extend({}, gblFacData[key]);
            address.facilities = [];
            address.facilities.push(facility);
            gblFacDataArray.push(address);
         });
     });
    
    
}

/* when you get the search data, also do a pagelisting which is needed but must wait for the data */
function getSearchData(srch) {
    var searchUrl = DATA_URL + srch.urlParms + "&orderby=FACILITY_NAME";   // + "&row_start=" + gblNextPage + "&row_count=9999";
    $.ajax({
        type: 'GET',
        url: searchUrl  ,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            savePageData(data);
            gblNextPage = 0;
            $('#numberPageSelection').bootpag({page: 1});
            redrawMap();
            setTotalDisplay(data.length);
            generatePageListing();
            },
        error: function (xhr, ajaxOptions, thrownError) {
			$("#listLoader").modal('hide');
            bootbox.alert("An error has occured. Please try again.");       
            console.log(xhr.status);
            console.log(thrownError);
            }
        });
    
}


function generateAlphaPage() {

    var srch = determineSearchParms();
    $("#listLoader").modal('show');
    var searchUrl = DATA_URL + srch.urlParms + "&orderby=FACILITY_NAME&az=" + gblCurrentAlphaPage;
    $.ajax({
        type: 'GET',
        url: searchUrl  ,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            savePageData(data);
            loadListView(gblFacDataArray);
            },
        error: function (xhr, ajaxOptions, thrownError) {
            $("#listLoader").modal('hide');
            bootbox.alert("An error has occured. Please try again.");       
            console.log(xhr.status);
            console.log(thrownError);
            }
        });
/*      
    var pageData = [];
    $.each(gblFacilities, function(i, item) {
        if (item.facilityName.substr(0,1) === gblCurrentAlphaPage) {
            pageData.push(item);
        }
    });
    loadListView(pageData);
   */
}
//TODO: I haven't finished this.. lets reorg the data and save it in an object.
//The structure will be the same as that in the KML except.. history will be missing.
// won't use memory if history i called...  we then need to use API 
function generateNumericPage() {
    
    var endRow = gblNextPage + gblRowsPerPage - 1;
    var rowcnt = 0;
    var pageData = {};
    //Object.keys(gblFacData).forEach(function(key, idx, array) {
     $.each(gblFacDataArray, function(i, item) {
      if (rowcnt >= gblNextPage  && rowcnt <= endRow) {
            pageData[i] = item;
        }
        rowcnt++;
    });
    setPageStatus(gblNextPage, endRow, rowcnt);
    loadListView(pageData);
    
}

function generatePageListing() {
    
    CommonInfoWindow.close();
    if (gblPagingMethod === ALPHA_PAGING_METHOD) {
       generateAlphaPage();
       resetMapToKML();   
    } else {        
        generateNumericPage();
    }
}

function showLinkOnMap(fid, lat, lng) {

    showInspectionDetails(fid);
    var panorama = gblMap.getStreetView();
    if(panorama.getVisible() ) {
        panorama.setVisible(false);
    }
    var latLng = new google.maps.LatLng(lat, lng);
    gblMap.setZoom( CLUSTER_TO_KML_ZOOM_SWITCH + 1 );
    gblMap.setCenter( latLng );
    
    createInfoWindow(latLng,gblFacData[gblFacIdMap[fid]]);
    window.scrollTo(0, $("#map-wrapper").offset().top);


}

function setPagingMode(mode, startLetter) {
    gblPagingMethod = mode;
    if (mode === NUMERIC_PAGING_METHOD) {
        $("#alphaPaging").hide();
        $("#numPagination").show(); 
    } else {
        $("#alphaPaging").show();
        $("#numPagination").hide();
        if (startLetter) {
            gblCurrentAlphaPage = startLetter;        
        }
    }
}

function loadListView(dataRows) {

    var strRows = "";
    
    $.each(dataRows, function(i, item) {
        var iconSrc;
        var facility = item.facilities[0];
        strRows += "<tr id='swimrow" + i + "'>";
        strRows += "<td class='col-md-4'>";
        strRows += "<div class='facRow'><table class='serviceNameTbl'><tbody><tr><td><img class='liStatusIcon' src='" + getStatusIcon(facility.facilityStatusCd,"large") + "' alt='" + facility.facilityStatus + "'></td><td><a class='mapLink' href='#' data-id='" +  facility.facilityId + "' data-lat='"  + item.lat + "' data-lng='" + item.lng + "'>" + facility.facilityName + "</a></td></tr></tbody></table></div></td>";
        strRows += "<td class='col-md-3'>" + item.address + "</td>" ;
        strRows += "<td class='col-md-5'><table class='serviceTbl'><tbody>";
        $.each(facility.services, function(j, service) {
            iconSrc = getStatusIcon(service.latestInspectionStatusCd,"small");
            strRows += "<tr><td><img class='lstIcon' alt='" + service.latestInspectionStatusCd + "' src='" + iconSrc + "'>" +  service.serviceName + "</td><td>" + service.accessTypeCd.toProperCase() + "</td></tr>";
        });
        strRows += "</tbody></table></td></tr>" ;
    });
    
    strRows = (strRows ==="") ? "<tr><td class='noData' colspan='4'>No Facilities found. Please check search options and try again</td></tr>" : strRows;
    $("#safetable").find("tbody").html(strRows);//
    $("#listLoader").modal('hide');
}



//TODO: we should be able to get details for the facility via facility Id.. so change detail URL accordingly.
/* Here we show the facility status and if they click they see the individual service statuses */
function createInfoWindow(KMLEvent_latLng, infoData) {
    CommonInfoWindow.close();

    var content = "<div id='infoContent' class='content infoDiv'>";
        if (infoData.facilities.length > 1) {
            content += "<div class='row infoRow'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
            content += "<div class='row infoRow infoHeader'><div class='col-md-12'>" + infoData.facilities.length + " facilities at this address</div></div>";
        } else {
            content += "<div class='row infoRow infoHeader'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
            
        }
        for (var i = 0; i < infoData.facilities.length; i++) {
            //onclick='showInspectionDetails(" + infoData.establishments[i].estId + ")'
        //content += "<div class='row infoRow'><div class='col-md-12'><img src='" + statusIcons[infoData.facilities[i].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant orgLink'><a href='#' data-id='" + infoData.facilities[i].facilityId + "'>" + infoData.facilities[i].facilityName + "</a></span></div></div>";
        content += "<div class='row infoRow'><div class='col-md-12'><img src='" + getStatusIcon(infoData.facilities[i].facilityStatusCd,"medium") + "'>&nbsp;&nbsp;<span class='infoImportant'><a class='srvHistory' href='#' data-id='" + infoData.facilities[i].facilityId + "' data-facilityName='" + infoData.facilities[i].facilityName + "' data-servicename='"  + "'>" + infoData.facilities[i].facilityName + "</a></span></div></div>";
        }
        content += "<div class='row infoRow'><div class='col-md-12'><a  class='svLink' href='#' data-latlng='" + KMLEvent_latLng + "'><img src='" + STREET_VIEW_ICON + "' alt='StreetView'></a></div></div>";
        
    //}  
    content += "</div>";    
    CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
        "pixelOffset": 0,  //KMLEvent.pixelOffset,
        "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
    CommonInfoWindow.open(gblMap);
}


//TODO: VERIDFTY i'M NOW GETTING VIA FID. //, fId, facName, serviceName) {
function setupDetailsModal(addrData) {            
    //var estData = reorgDetails(data);
    var fac;
    var srv;
    var adrData = addrData[0];
    var facility = adrData.facilities[0];
    /*
    $.each(adrData.facilities, function(idx, facility) {
        if (facility.facilityName === facName) {
            fac = facility;
        }
        $.each(facility.services, function(sidx, service) {
            if (service.serviceName === serviceName)
                {
                srv = service;
                }
        });
    });
    */
    $("#estName").text(facility.facilityName);
    $("#estAddress").text(adrData.address);
    $("#imgStatus").attr("src", getStatusIcon(facility.facilityStatusCd,"large")) ;
    var insStr = "";
    var inscnt = 0;
//    insStr += "<h3>" + srv.serviceName + "</h3>"; 
//    var inspections = srv.inspections.sort(dynamicSort("","-inspectionDate"));
    $.each(facility.services, function(serviceType, service) {
        insStr += "<h3>" + service.serviceName + "</h3>"; 
        var inspections = service.inspections.sort(dynamicSort("","-inspectionDate"));
        $.each(inspections, function(i, inspection) {
            insStr += "<div class='row'><div class='col-md-11 col-md-offset-1'>";
            insStr += "<img src='" + getStatusIcon(inspection.inspectionStatusCd,"small") + "' alt='" + inspection.inspectionStatus + "'>";
            insStr += "Inspection  Date: " +  moment(inspection.inspectionDate).format(DISPLAY_DATE_FORMAT) + " (" + inspection.inspectionStatus + ")";
        /*
        if (inspection.infraction !== null) {
                inscnt++;
                
                insStr += "<a class='detaiLink' href='#infraction_" + inscnt + "' data-toggle='collapse'>Details</a></div>";
                insStr += "<div id='infraction_" + inscnt + "' class='infractionDetails  collapse'>";
                insStr += "<div class='row'><div class='col-md-10 col-md-offset-2'>";
                insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Description: </span>" + inspection.infraction + "</div>";
                insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Action: </span>" + inspection.action + "</div>";
                if (inspection.convictionDate !== null) {
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Outcome Date: </span>" + inspection.convictionDate + "</div>";
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Outcome: </span>" + inspection.outcome + "</div>";
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Amount Fined: </span>" + inspection.amountFined + "</div>";
                
                }
                insStr += "</div></div></div>";
                            
            } else {
                insStr += "</div>";
            }
            */
            insStr += "</div></div>"; //finish row
            
        });
    });
    $("#inspections").html(insStr);

}
/* For now we will use the addressId and search via facility name.. eventually this is sid driven? */
function showInspectionDetails (fId) {

   var url = DETAIL_URL  + fId;
    console.log(url);
    $.ajax({
        type: 'GET',
        url: url,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            if (data.length !== 0) {  // if length is zero, then service is down, or a problem exist.. don't try to create modal
                setupDetailsModal(data);  //, fId, facName, serviceName);
                $('#inspectionDetails').modal('show');
            } else {
                console.log("detail failed for: " + url);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
  
}


function doSearch() {
    $("#listLoader").modal('show');
    var srch = determineSearchParms();
    gblNextPage = 0;
    $('#numberPageSelection').bootpag({page: 1});
    setPagingMode(NUMERIC_PAGING_METHOD);
    getSearchData(srch);
    //generatePageListing();
}

function setupEvents() {
    $('#numberPageSelection').bootpag({
        total: gblRowsPerPage,
        page: 1,
        maxVisible: 5,
        leaps: true,
        firstLastUse: true,
        first: '←',
        last: '→',
        wrapClass: 'pagination',
        activeClass: 'active',
        disabledClass: 'disabled',
        nextClass: 'next',
        prevClass: 'prev',
        lastClass: 'last',
        firstClass: 'first'
    }).on("page", function(event, num){
        //var startRow = (num - 1)* gblRowsPerPage + 1;
        //var endRow = startRow  + gblRowsPerPage - 1;
        gblNextPage = ((num  -1 ) * gblRowsPerPage);
        generatePageListing();
    });
    
    $("#pageSize").multiselect({
       // buttonWidth: '75px',
        //buttonClass: 'pull-right',
        onChange: function(option, checked, select) {
            gblRowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            gblNextPage = 0;
            generatePageListing();
        }
    });
    //$("#pageSize").next().css( {"float" : "right"});
 // $("#pageSize").next().find("button").css( "height", "32px" );
 
    
    $(".hasclear").keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    });
    $(".clearer").hide($(this).prev('input').val());
    $(".clearer").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
    });
    $("#searchBtn").click(function() {
        doSearch();
    });
    $(".searchString").keypress(function(e) {
        var KeyCode = e.which || e.keyCode || 0;
        if (KeyCode === 13) {
            doSearch();
        }
    });
    
    $("#advSearchApplyBtn").on("click",function() {
        $('#modalSearch').modal('hide');
        doSearch();
    }); 
    
    $("#resetAdvSearchBtn").on("click",function() {
        resetAdvancedFilters();

    }); 
    $("#resetBtn").on("click",function() {
        resetFilters();
         showAlphaPage('0');
        //filterData();
        //generatePageListing();
    }); 
    
    $("#maincontent").on("click",".available a", function(e) {
        //$("#alphaPagination").children('li').removeClass('active');
        //$(this).parent().addClass('active');
        showAlphaPage($(this).text().substring(0,1));
        return false;
    });    
    $("#maincontent").on("click",".unavailable a", function(e) {
        e.preventDefault();
        return false;
    });  
    
    $("#maincontent").on("click", "#infoContent .srvHistory",function() {
       showInspectionDetails($(this).attr("data-id"));
       return false;
    });
    $("#maincontent").on("click","div a.svLink", function() {
        switchToStreetView($(this).attr("data-latlng"));
        return false;
    });    
    $("#maincontent").on("click","a.mapLink", function() {
        showLinkOnMap($(this).attr("data-id"), $(this).attr("data-lat"), $(this).attr("data-lng"));
        return false;
    });     
    $("#gotoListingTop").click(function () {
        window.scrollTo(0, $("#safetable").offset().top);
        return false;
    });
	
    $(window).resize(function() {
        var x = $("#appDisplayMap")[0].getBoundingClientRect();
        var eleWidth = $("#gotoListingTop").width();
        $("#gotoListingTop").css("left", x.left + x.width - eleWidth);
    });	
    
}
function resetMap() {
    gblMap.setZoom(RESET_ZOOM_LEVEL);
    gblMap.setCenter(MAP_CENTER);
    CommonInfoWindow.close();
    clearMarkers(gblPlacesMarkers);
    $("#map-input").val("");
     google.maps.event.trigger(gblMap,'resize');
    
}


function shellCluster(showHide) {
    setCluster(gblShellCluster, gblMapMarkerShells,showHide);  
}
function markerCluster(showHide) {
    setCluster(gblMarkerCluster, gblMapMarkers, showHide);    
}

function setCluster(cluster, markers, flag) { /*ignore parms*/
    if (typeof cluster === "undefined") return;
    var visibility = true;
    if (flag === 'hide') { visibility = false;}
    for (var i = 0; i < markers.length; i++) {
        markers[i].setVisible( visibility);
    }
    if (cluster ) {
        console.log("repaint:" + cluster);
        cluster.repaint();
        google.maps.event.trigger(gblMap,'resize');
    }
}

function loadKmlLayer() {
    gblKMLLayer = new google.maps.KmlLayer(KML_MASTER, {
    suppressInfoWindows: true,
    preserveViewport: true,
//     pane: "floatPane",
    map: gblMap
  });
  
  /* in the KML Layer, we put the addressId as the id and then put in estId in the extended data -- which we don't really use*/
  gblKMLLayer.set('preserveViewport', true); 
  google.maps.event.addListener(gblKMLLayer, 'click', function(event) {
    //console.log(event.featureData.info_window_html);
 
    var locData = $.parseJSON(event.featureData.info_window_html);
        createInfoWindow(event.latLng,locData);
    //event.preventDefault();
  });
  
    google.maps.event.addListener(gblKMLLayer, 'status_changed', function () {
    if (gblKMLLayer.getStatus() == google.maps.KmlLayerStatus.OK) {
        $("#mapLoader").modal('hide');
    } else {
        $("#mapLoader").modal('hide');
        bootbox.alert("Map failed to load, please refresh the browser to try again.");
    }
});  
}
function setupMapSearchBox() {
    var input = document.getElementById('map-input');
    var searchBox = new google.maps.places.SearchBox(input);
    gblMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // Bias the SearchBox results towards current map's viewport.
    gblMap.addListener('bounds_changed', function() {
        searchBox.setBounds(gblMap.getBounds());
    });

    gblPlacesMarkers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            return;
        }
        clearMarkers(gblPlacesMarkers);

        // For each place, get the icon, name and location.
        var bounds = new google.maps.LatLngBounds();
        places.forEach(function(place) {
            var icon = {
                url: place.icon,
                size: new google.maps.Size(71, 71),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(17, 34),
                scaledSize: new google.maps.Size(25, 25)
            };

            // Create a marker for each place.
            gblPlacesMarkers.push(new google.maps.Marker({
                map: gblMap,
                icon: icon,
                title: place.name,
                position: place.geometry.location
            }));

            if (place.geometry.viewport) {
                // Only geocodes have viewport.
                bounds.union(place.geometry.viewport);
            } else {
                bounds.extend(place.geometry.location);
            }
        });
        gblMap.fitBounds(bounds);
        gblMap.setZoom(CLUSTER_TO_KML_ZOOM_SWITCH);
    });
}

function initMap() {
    gblMap = new google.maps.Map(document.getElementById('map-canvas'), {
        center: MAP_CENTER,
        zoom: CLUSTER_TO_KML_ZOOM_SWITCH,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
        zoomControl: true
    });
    gblMap.addListener('zoom_changed', function() {
         console.log("Zoom Event:" + gblMap.getZoom() + " " + gblPagingMethod);
        //If searching, then using generated markers, otherwise using shell markers or KML
        if (gblPagingMethod === NUMERIC_PAGING_METHOD) {
            shellCluster('hide');
        } else if(gblMap.getZoom() >= CLUSTER_TO_KML_ZOOM_SWITCH) {
            gblKMLLayer.setMap(  gblMap );
            markerCluster('hide');
            shellCluster('hide');
        } else {
            gblKMLLayer.setMap(  null );
            shellCluster('show');
        }
        CommonInfoWindow.close();
    });
    loadKmlLayer();
    setupMapSearchBox();
    
    var resetBTN = document.getElementById('resetMap');
    resetBTN.onclick = function () { resetMap();};
    gblMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(resetBTN);
    
    gblMap.controls[google.maps.ControlPosition.BOTTOM].push(
        document.getElementById('legend'));   

    if(navigator.geolocation) {
        //var browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            gblMap.setCenter(initialLocation);
            gblMap.setZoom(CLUSTER_TO_KML_ZOOM_SWITCH);
            }, function() {
                //handleNoGeolocation(browserSupportFlag);
        });
    }
}

//SML: not used!
function loadFacilityData() {
    $.ajax({
        type: 'GET',
        url: DATA_URL,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
                $("#listLoader").modal('show'); 
                gblFacilityJSON = data;
                reorgAddressData();
                loadShellMarkerData(); // for now will replace with API and put in proper place.
                processAlphaCounts();// TODO: WILL move later?!
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}

function showAlphaPage(alpha) {
    var charCode = alpha.charCodeAt(0);
    var alphaPages = $("#alphaPagination");
    alphaPages.children('li').removeClass('active');
    if (charCode >= 65 && charCode <= 90) {
        alphaPages.children('li').eq(charCode - 64).addClass('active');
    } else {
        alphaPages.children('li').eq(0).addClass('active');
    }
    setPagingMode(ALPHA_PAGING_METHOD,alpha);
    generatePageListing();
}

function processAlphaCounts(data) {
     
    var alphaPages = $("#alphaPagination");
    var total = 0;
    var numberTotal = 0;
    var foundStartIdx = "";

    Object.keys(data).forEach(function(id, idx, array) {
        var count        = data[id];
        var fnameInitial = id;    
        var charCode     = fnameInitial.charCodeAt(0);
        total = total + count;
        if (count > 0) {
            alphaPages.children('li').eq(charCode - 64).addClass('available').find('.found').html(count);
        }
        if (id === '0' && count > 0) {
            alphaPages.children('li').eq(0).addClass('available').find('.found').html(count);
        }
        if (count === 0) {
            alphaPages.children('li').eq(charCode - 64).addClass('unavailable').addClass('disabled');
        }
        if (id === '0' && count === 0) {
            alphaPages.children('li').eq(0).addClass('unavailable').addClass('disabled');
        }
        if (total > 0 && foundStartIdx === "") {
            foundStartIdx = fnameInitial;
        }
    });

    setTotalDisplay(total);
    gblTotalFacilities = total;
    showAlphaPage("0");
}

function setTotalDisplay(total) {
    if (total == 1) {
        $("#srchResults").html(total + ' Facilities Found');
    } else {
        $("#srchResults").html(total + ' Facilities Found');
    }
}
function determineAlphaCounts() {

   $.ajax({
        type: 'GET',
        url: ALPHA_COUNT_URL, 
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            processAlphaCounts(data);

            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        });
}
/* we apply filters.. don't do auto update - onChange..*/
function initFilter(filter, data, keyfld, valuefld) {
    
    var optStr = "";
    $.each(data, function(i, item) {
        optStr += '<option  selected="selected" value="' + item[keyfld] + '">' + item[valuefld] + '</option>';
    });
    filter.append(optStr);
    filter.multiselect({
            includeSelectAllOption: true,
            numberDisplayed: 1,    
            buttonWidth: '100%'
       // enableCollapsibleOptGroups: true
    }); 
}

/*
function loadFacilityTypes() {

    $.support.cors = true;
    $.ajax({
        type: 'GET',
        url: FACILITY_TYPES_URL,
        jsonpCallback: 'callback',
        //contentType: "application/json",
        dataType: 'jsonp',
        success: function (data) {
          initFacilityFilter(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
}
*/

function initFilters(data) {

    initFilter( $("#svcTypeFilter"), data.serviceTypes, "value", "display");
    initFilter( $("#accFilter"), data.accessTypes, "value", "display");
    initFilter( $("#statusFilter"), data.statusTypes, "value", "display");
    initFilter( $("#wardFilter"), data.cityWards, "value", "display");
}
function setupFilters() {

    $.support.cors = true;
    $.ajax({
        type: 'GET',
        url: LOOKUP_DATA_URL,
        jsonpCallback: 'callback',
        //contentType: "application/json",
        dataType: 'jsonp',
        cache: true,
        success: function (data) {
          initFilters(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });

    $('.input-daterange').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true,
            endDate:"0d"
    });   

    determineAlphaCounts();
    

}

function initApp() {

    $("#mapLoader").modal('show');
    initMap();  
    //loadFacilityData();
     loadShellMarkerData(); //the url here is bad. we need a more effiecient one.
    setupFilters();
    setupEvents();
   $(window).trigger("resize");


}

/* we load all css/js for all 3 forms here*/
function loadPage() {
    var strCode="";
   if (document.location.hostname.length === 0) {
      statusIcons = { "0" : "images/map/blank.png",
                           'SATISFACTORY' : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/marker_dot_pass.png", alt : "Satisfactory"},
                           'REINSPECTION' : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/marker_dot_pass.png", alt : "Reinspection" },
                           'DEFICIENCIES' : {large:  "images/map/conditional_large.png", medium:  "images/map/conditional_small.png", small:  "images/map/marker_dot_conditional.png", alt : "Deficiencies"},
                           'PASS' : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/pass_circle.gif", alt : "Pass"},
                           'CONDITIONAL_PASS' : {large:  "images/map/conditional_large.png", medium:  "images/map/conditional_small.png", small:  "images/map/conditional_circle.gif", alt : "Conditional Pass" },
                           'CLOSED' : {large:  "images/map/closed_large.png", medium:  "images/map/closed_small.png", small:  "images/map/closed_circle.gif", alt : "Closed"},
                           'UNKNOWN' : {large:  "images/map/closed_large.png", medium:  "images/map/closed_small.png", small:  "images/map/closed_cirlce.gif", alt : "Closed"}
                        };
   
        markerImages = {
        'SATISFACTORY' : {icon: 'images/map/marker_dot_pass.png', value : 1},
        'REINSPECTION' : {icon: 'images/map/marker_dot_pass.png', value : 1},
        'DEFICIENCIES' : {icon: 'images/map/marker_dot_conditional.png', value : 2},
        'CLOSED'       : {icon: 'images/map/m1.png', value : 3},
        'multi'        : {icon: 'images/map/m6.png', value : 4},
        'PASS' : {icon: 'images/map/m2.png', value : 1},
        'CONDITIONAL_PASS' : {icon: 'images/map/m3.png', value : 2},
        'UNKNOWN'       : {icon: 'images/map/m1.png', value : 3}
        };

        CLUSTER_IMAGES = 'images/mc';           
        STREET_VIEW_ICON ='images/map/streetView.png';
        strCode += '<link rel="stylesheet" href="static_files/assets/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        strCode += '<link rel="stylesheet" href="css/swimSafe.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript"  src="js/bootbox.min.js"></script>';             
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += ' <script type="text/javascript" src="js/markerclusterer.min.js"></script>';  
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('html/swimSafeListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/safe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/SwimSafe/css/swimSafe.css">';        
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/bootbox/bootbox.min.js"></script>';        
        strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/placeholders.jquery.min.js"></script>';
        strCode += ' <script type="text/javascript" src="/static_files/assets/GMap/markerclusterer.min.js"></script>';
 
        
        
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/swimSafeListing.html', function() {initApp();});
    }

}
$( document ).ready(function() {
    loadPage();
});

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};