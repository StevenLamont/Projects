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

todo: THERE ARE api for the filters.. so use them.. hard coded for now.

listing is showing 3 for musiz.. which is the service level.. is that too much data?

1) In KML - have location data plus history..ASSUMING it doesn't take too much procerssing time.

2) When I redraw map.. get search data..and draw icons.. if the details are there, call detail API and fill in missing details (don't want to do this up front for all redrawn icon)
3) When I ckick on a listing.. same as 2

I'm taking addresses and creating facilities from them...
so after I reorg addresses.. i need to re-reog them to be facility based. or habve a second API made.. we want it bioth by address and facility names (we sort by facility name in the listing)

Note!!! because search includes the seching of history (history not included int he search API..) all searches are done in the back end..???

4) We really need to split "generate Listing" from search..   on thge filter changes we want to filter data and generate listing.. if we hit thre page events, we really want to generatr listing.

5) orioginakl screen ward was one only.. will it be same in new API
6) since I have the lookup data and no hard codes. I could get rid of my multi-select decode stuff..if I wanted.,by why bother..

Unlike DienSafe/BodySafe.. the current swimsagfe gets the details when the user clicks on the map icon. When they do history is there because of it.
--> we can still maintain the current thought and only get the details when I need to (on a history click)

*/
 
 //http://app.toronto.ca/opendata/tphir/ir_detail.json?addr_id=1459&program_area_cd=POOL&callback=jQuery1102034163563068867353_1460734896348
var DETAIL_URL = "http://app.toronto.ca/opendata/tphir/ir_detail.json?callback=?&program_area_cd=POOL&addr_id=";
var DATA_URL = 'http://app.toronto.ca/tphsearch/search.json?pa=POOL&callback=?&type=OUTDOOR_POOL%2CINDOOR_POOL%2COUTDOOR_SPA%2CINDOOR_SPA&access=PUBLIC%2CSCHOOL%2CRESTRICTED';
var FACILITY_TYPES_URL = "http://www.toronto.ca/health/swimsafe/scripts/type.json?callback=?";
var LOOKUP_DATA_URL = "http://was8-inter-dev.toronto.ca/opendata/ir/irps_lookup.json?v=1.0&callback=?";

var gblFacilityJSON;
var gblAddressData;
var gblFacilities;
var gblFilteredFacilities;
var gblFilteredAddresses;
var gblFacilityData;
//var searchEstURL =  'http://app.toronto.ca/tphsearch/search.json?pa=POOL&callback=?';
var rowsPerPage = 10;
var nextRow = 0;
var TPH_API_DATE_FORMAT = "MM/DD/YYYY";
var DISPLAY_DATE_FORMAT = "MMMM DD, YYYY";
/*
  var CommonInfoWindow = new google.maps.InfoWindow({"minWidth": 500});
*/
var CommonInfoWindow = new google.maps.InfoWindow();
var selectedEstablishmentData = [];

var statusIcons = { "0" : "images/map/blank.png",
                           'SATISFACTORY' : {large:  "/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/images/marker_dot_pass.png", alt : "Satisfactory"},
                           'REINSPECTION' : {large:  "i/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/images/marker_dot_pass.png", alt : "Reinspection" },
                           'DEFICIENCIES' : {large:  "/static_files/WebApps/Health/safe/images/onditional_large.png", medium:  "/static_files/WebApps/Health/safe/images/conditional_small.png", small:  "/static_files/WebApps/images/marker_dot_conditional.png", alt : "Deficiencies"},
                           'CLOSED' : {large:  "i/static_files/WebApps/Health/safe/images/closed_large.png", medium:  "/static_files/WebApps/Health/safe/images/closed_small.png", small:  "/static_files/WebApps/images/marker_dot_closed.png", alt : "Closed"}
                        };


var markerImages = {
    'SATISFACTORY' : '/static_files/WebApps/images/marker_dot_pass.png',
    'REINSPECTION' : '/static_files/WebApps/images/marker_dot_pass.png',
    'DEFICIENCIES' : '/static_files/WebApps/images/marker_dot_conditional.png',
    'CLOSED'       : '/static_files/WebApps/images/marker_dot_closed.png',
    'multi'        : '/static_files/WebApps/images/marker_dot_multi.png'
};
var streetViewIcon ='/static_files/WebApps/Health/safe/images/streetView.png';
var inspectionsIcon ='/static_files/WebApps/Health/DineSafe/images/map/inspections.png';

var gblMap;
var gblKMLLayer;
var randKey =  (new Date()).valueOf();
var KML_MASTER = 'https://drive.google.com/uc?id=0B-j2Y49nfiw2YkNxYUY5WXdwRVU&rand='+ randKey;
//'https://drive.google.com/uc?id=0B-j2Y49nfiw2YkNxYUY5WXdwRVU&rand='+ randKey;
//'http://was8-inter-dev.toronto.ca/opendata/ir/irps_query_inspections.kml?v=1.0'
//'https://docs.google.com/uc?id=0B-j2Y49nfiw2cVNsUURIM3RnQmM&rand=' + randKey;
var mapSrc = "KML";
var gblMapMarkers = [];
var torontoCenter = new google.maps.LatLng(43.69666,-79.39274);

//https://drive.google.com/file/d/0B-j2Y49nfiw2eDVWRjRBVTVUMkE/view?usp=sharing

/* our numbering is zero based, so increment for display purposes */
function setPageStatus( start, end, totalRows) {
    $("#RowStart").html(start +1);
    if (end > totalRows) { 
    $("#RowEnd").html(totalRows);
    } else {
        $("#RowEnd").html(end + 1);
    }
    $("#TotalRows").html(totalRows);
    var numPages = Math.ceil(totalRows / rowsPerPage);
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
    var wardFilter = $("#wardFilter");
    wardFilter.val("0");
    wardFilter.multiselect('refresh');
    $("#incHistory").prop('checked', false);
}


function resetFilters() {
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
            str += (i>0) ? "," : "";
            str += item;
        });
    }
    return str;
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
function mergeLocations(locData) {
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
    
}


function clearMarkers() {
    for (var i = 0; i < gblMapMarkers.length; i++) {
        gblMapMarkers[i].setMap(null);
    }
    gblMapMarkers = [];
}

function plotMarkers(data) {
    //var locations = mergeLocations(data);
    //for( var k in locations ) {
    Object.keys(gblFilteredAddresses).forEach(function(aid, idx, array) {
        //for (var i = 0; i < gblFilteredAddresses; i++) {
        //    var location = gblFilteredAddresses[i];
        var location = gblFilteredAddresses[aid];       
            var latLng = new google.maps.LatLng(location.lat,location.lng);                    
            
            //TODO: fix this.var iconSrc  = markerImages[location.establishments[0].status];
            var iconSrc  = markerImages[location.status];
            if ( location.servicesCnt > 1 ) iconSrc = markerImages.multi;
            var title = ( location.servicesCnt > 1 ) ? location.servicesCnt + ' Facilities' : location.facilityName;
                
        /* not sure why this is needed, but kml points, seems to be slightly different than this method */
        var markerImage = new google.maps.MarkerImage(iconSrc,
            new google.maps.Size(80, 80), //size
            new google.maps.Point(0, 0), //origin point
            new google.maps.Point(8, 8)); // offset point
        var marker = new google.maps.Marker({
            position: latLng,
            map: gblMap,
            location : location,
            id:  aid,
            icon: markerImage,
            title: title
        });
        marker.addListener('click', function () {
            //var estArr = [];
            //estArr.push({ "id" : this.id});
            //processInfoWindow(estArr, this.position);
            createInfoWindow2(this.position, gblFacilityData[this.id]);
        });

        gblMapMarkers.push(marker);
        //map.addMarker( latlng, imageIndex, title );
    });
}

function toggleKMLLayer() {
    gblKMLLayer.setMap( gblKMLLayer.getMap() ? null : gblMap );
}
function redrawMap(filteredData) {
    //alert('redraw map');
    $("#map-loader").show();
    mapSrc = 'Markers';
    gblKMLLayer.setMap( null );
    clearMarkers();
    plotMarkers(filteredData);
    
}

function resetMapToKML() {
    if (mapSrc != 'KML') {
        $("#map-loader").show();
        clearMarkers();
        gblKMLLayer.setMap( gblMap );
        mapSrc = 'KML'; 
    }
    //
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
    gblFacilities = [];
     Object.keys(gblFacilityData).forEach(function(id, idx, array) {
        gblFacilityData[id].services = gblFacilityData[id].services.sort(dynamicSort("","name"));
        gblFacilities.push(gblFacilityData[id]);
     });
     
     gblFacilities = gblFacilities.sort(dynamicSort("","name"));
}

/* this may be named to reflect a JSON call if we do bak-end filtering */
function filterData() {
    var search = false;
    var searchURLAdd ="";
    var srchEst = $("#estSearch").val();
    var srchAddr = $("#addrSearch").val();

    var selectedFacTypes = decodeMultiSelect("#facTypeFilter");
    if (selectedFacTypes !== 'ALL') {
        search = true;
    } 
    if (srchEst !== "") { 
        search = true;
    }
    if (srchAddr !== "") { 
        search = true;
    }
    var selectedAccs = decodeMultiSelect("#accFilter");
    if (selectedAccs !== 'ALL') { 
        search = true;
    }
    
    var selectedStatuses = decodeMultiSelect("#statusFilter");
    if (selectedStatuses !== 'ALL') { 
        search = true;
    }
    
    var selectedWards =  decodeMultiSelect("#wardFilter");
    if (selectedWards !== 'ALL') { 
        search = true;
    }
    //var wards = $("#wardFilter").val();
    /*if (wards !== '0') { 
        searchURLAdd += "&ward=" + wards;
        search = true;
    }
    */
    if ($("#incHistory").prop('checked')) {
         searchURLAdd += "&checkInspectionHistory=true";
         search = true;
    }
    var dateFrom = $("#dateFrom").val(); 
    var dateTo = $("#dateTo").val();
    if (dateFrom !== "") {
        searchURLAdd += "&from=" + moment(dateFrom).format(TPH_API_DATE_FORMAT);
        search = true;
    }    
    if (dateTo !== "") {
        searchURLAdd += "&to=" + moment(dateTo).format(TPH_API_DATE_FORMAT);
        search = true;
    }

    gblFilteredFacilities = [];
    gblFilteredAddresses = {};

    var rowcnt = 0;
    //Object.keys(gblFacilityData).forEach(function(id, idx, array) {
    //gblfacilities is sorted by name
    $.each(gblFacilities, function(i, item) {
        var showItem;
        var facility = gblFacilities[i];
        var listFacility = $.extend({}, facility);
        //var listFacility = facility;
        listFacility.services = [];
        showItem = (facility.address.toLowerCase().indexOf(srchAddr.toLowerCase()) > -1);
        if (showItem) {
            for (var j = 0; j < facility.services.length; j++) {
                var hasService = true;
                if (hasService) hasService = multiSelectFilter(selectedFacTypes,facility.services[j].type,",");
                if (hasService) hasService = multiSelectFilter(selectedAccs,facility.services[j].access,",");
                if (hasService) hasService = multiSelectFilter(selectedStatuses,facility.services[j].status,",");
                if (hasService) {
                    listFacility.services.push(facility.services[j]);
                }
            }
        } else {
            showItem = false;
        }
        
        if (showItem && listFacility.services.length > 0) {
            gblFilteredFacilities.push(listFacility);
            if (!gblFilteredAddresses[listFacility.aid]) {
                gblFilteredAddresses[listFacility.aid] = {};
                gblFilteredAddresses[listFacility.aid].lat = listFacility.lat;
                gblFilteredAddresses[listFacility.aid].lng = listFacility.lng;
                gblFilteredAddresses[listFacility.aid].servicesCnt = 0;
                gblFilteredAddresses[listFacility.aid].status = listFacility.services[0].status;
                gblFilteredAddresses[listFacility.aid].facilityName = listFacility.facilityName;
            }
            if (listFacility.services) {
                gblFilteredAddresses[listFacility.aid].servicesCnt += listFacility.services.length;
            }
            rowcnt++;
        }               
    });
    
    if (search) {
        //TODOL: fix this..
        redrawMap(gblFilteredFacilities);
    } else {
        
        resetMapToKML();    
    }
    $("#map-loader").hide();
 
}

//TODO: I haven't finished this.. lets reorg the data and save it in an object.
//Thge structure will be the same as that in the KML except.. history will be missing.
// won't use memory if history i called...  we then need to use API 
function generateListing() {
    
    var endRow = nextRow + rowsPerPage - 1;
    var rowcnt = 0;
    var pageData = [];
    $.each(gblFilteredFacilities, function(i, item) {
    if (rowcnt >= nextRow && rowcnt <= endRow) {
        pageData.push(gblFilteredFacilities[i]);
    }
     rowcnt++;
    });
    setPageStatus(nextRow, endRow, rowcnt);
    loadListView(pageData);
    
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
            // no street view available in this range, or some error occurred
            alert( 'No street view available for this location' );
        }
    });
    
}

function showLinkOnMap(aid, lat, lng) {

    var panorama = gblMap.getStreetView();
    if(panorama.getVisible() ) {
        panorama.setVisible(false);
    }
    var latLng = new google.maps.LatLng(lat, lng);
    gblMap.setZoom( 13 );
    gblMap.setCenter( latLng );
    
    
    
    //var estArr = [];
    //estArr.push({ "id" : estId});
    //processInfoWindow(estArr, latLng);
    
    createInfoWindow2(latLng, gblFacilityData[aid]);
    $("#map-canvas").scrollTop(0);

}

//TODO: add data-id etc to and simple showOnMap
function loadListView(dataRows) {

    var strRows = "";
    
    $.each(dataRows, function(i, item) {
        var iconSrc;
        strRows += "<tr id='swimrow" + i + "'>";
        strRows += "<td class='col-md-4'>";
        strRows += "<span class='facRow'><a class='mapLink' href='#' data-id='" +  item.aid + "' data-lat='"  + item.lat + "' data-lng='" + item.lng + "'>" + item.facilityName + "</a></span></td>";
        strRows += "<td class='col-md-3'>" + item.address + "</td>" ;
        strRows += "<td class='col-md-5'><table class='serviceTbl'><tbody>";
        $.each(item.services, function(j, service) {
            iconSrc = statusIcons[service.status].small;
            strRows += "<tr><td><img class='lstIcon' src='" + iconSrc + "'>" +  service.serviceName + "</td><td>" + service.access.toProperCase() + "</td></tr>";
        });
        strRows += "</tbody></table></td></tr>" ;
    });
    
    strRows = (strRows ==="") ? "<tr><td class='noData' colspan='4'>No Facilities found. Please check search options and try again</td></tr>" : strRows;
    $("#listingTable").find("tbody").html(strRows).trigger('update');
    var $table = $("#listingTable").tablesorter(
        {theme: 'blue',     
        widthFixed : false,    
        widgets: ["filter"],       
        widgetOptions : {   filter_columnFilters: true,       
                filter_cssFilter   : '',          
                filter_childRows   : false,       
                filter_ignoreCase  : true,        
                filter_reset : '.reset',          
                filter_searchDelay : 300,         
                filter_startsWith  : false,       
                filter_hideFilters : false        }   
        });

}


function regOrgAddressData(selectedEstablishmentData) {
    var addrData = {};
    addrData.addressId = selectedEstablishmentData[0]["address-id"];
    addrData.addressFull = selectedEstablishmentData[0]["address-full"];
    addrData.facilityName = selectedEstablishmentData[0]["facility-name"];
    
    addrData.facilities = {};
//  addrData.facilityId = selectedEstablishmentData[0]["facility-id"];
    //addrData.facilityName = selectedEstablishmentData[0]["facility-name"];
    $.each(selectedEstablishmentData, function(i,item) {
        if (addrData.facilityName !== item["facility-name"]) {
            console.log('facilityName changed'); // i saw one example so fdar of this.. slight typo.
        }
        if (!addrData.facilities[item["facility-id"]]) {
            addrData.facilities[item["facility-id"]] = { facilityName : item["facility-name"], services : {}};
            addrData.facilities[item["facility-id"]].services[item["service-id"]] = { serviceName : item["service-name"] , serviceTypeCode : item["service-type-code"], inspections : []};
            addrData.facilities[item["facility-id"]].services[item["service-id"]].inspections.push ( {date : [item["inspection-date"]] , status : item["inspection-status-code"]} );
        } else {
            if (!addrData.facilities[item["facility-id"]].services[item["service-id"]]) {
                addrData.facilities[item["facility-id"]].services[item["service-id"]] = { serviceName : item["service-name"] , serviceTypeCode : item["service-type-code"], inspections : []};
            } 
            
            addrData.facilities[item["facility-id"]].services[item["service-id"]].inspections.push ( {date : [item["inspection-date"]] , status : item["inspection-status-code"]} );

        }
        
        
    });
    return addrData;
}

function createInfoWindow2(KMLEvent_latLng, locData) {
   CommonInfoWindow.close();
    $("#map-loader").hide();
    var facAccess = locData.services[0].access;
    var content = "";
    content += "<div id='infoContent' class='content infoDiv'>";
    content += "<div class='row infoHeaderRow'><div class='col-md-12'>" + locData.facilityName + "</div></div>";
    content += "<div class='row '><div class='col-md-12'>" + locData.address + "</div></div>";
    //content += "<div class='row infoAccess'><div class='col-md-12'>" + facAccess + "</div></div>";

    content += "<div class='InfoServiceDiv'>";
    for (var i = 0; i < locData.services.length; i++) {
        if (locData.services[0].access !== facAccess) {
            alert('not all accesses are the same');
        }
        /* with service Type and status we lookup Icon and create alt text */
        content += "<div class='row'>";
        content += "    <div class='col-md-3'>" + "<img src='" + statusIcons[locData.services[i].status].medium +"'" + "alt='" + locData.services[i].status + "'>" + "</div>";
        content += "    <div class='col-md-9'  style='padding-left:5px;'>";
        content += "        <div class='row'>";
        content += "            <div class='col-md-12'><a class='expandHistory' href=''>" + locData.services[i].serviceName + "</a> (" + locData.services[i].access.toProperCase() + ")" + "</div>";     
        content += "         </div>";
        content += "        <div class='row'>";
        content += "            <div class='col-md-12'>Last Inspected: " + moment(new Date(locData.services[i].lastInspectionTimestamp)).format(DISPLAY_DATE_FORMAT) + "</div>";     
        content += "         </div>";
        content += "    </div>";
        content += "</div>";
        //content += "<div class='col-md-12' >" + "<img class='infoIcon' src='" + statusIcons[locData.services[i].status].medium +"'" + "alt='" + locData.services[i].status + "'>";
   
        //content += "<a class='expandHistory' href=''>" + locData.services[i].serviceName + "</a></div><span class='insDate'>Last Inspected: ";        
        //content += moment(new Date(locData.services[i].lastInspectionTimestamp)).format(DISPLAY_DATE_FORMAT);
        //content += "</span></div>";
        //content += "</div>";
        /*
        content += "<div class='row'>";
        content += "    <div class='col-md-3' style='padding-right:0'>" + "<img src='" + statusIcons[locData.services[i].status].medium +"'" + "alt='" + locData.services[i].status + "'>" + "</div>";
        content += "    <div class='col-md-9'>";
        content += "        <div class='row'>";
        content += "            <div class='col-md-5'><a class='expandHistory' href=''>" + locData.services[i].serviceName + "</a></div>";        
        content += "            <div class='col-md-7'>" +moment(new Date(locData.services[i].lastInspectionTimestamp)).format(DISPLAY_DATE_FORMAT)+ "</div>";
        content += "        </div>";
        content += "    </div>";
        content += "</div>";
        */
    }
    content += "</div>";  //Close InfoServiceDiv
    content += "<div class='row'><div class='col-md-12'><a class='svLink' href='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div></div>";
    content += "</div>";  //Close InfoDiv
    CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
        "pixelOffset": 0,  //KMLEvent.pixelOffset,
        "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
    CommonInfoWindow.open(gblMap);
}
function createInfoWindow(KMLEvent_latLng, selectedEstablishmentData) {

    CommonInfoWindow.close();
     $("#map-loader").hide();
    var content = "";

    if (selectedEstablishmentData.length === 1) {

        var addrInspections = regOrgAddressData(selectedEstablishmentData[0]);
        content += "<div class='content infoDiv'>";
        content += "<div class='row addressRow'><div class='col-md-12'>" + addrInspections.addressFull + "</div></div>";
        Object.keys(addrInspections.facilities).forEach(function(facilityId, idx, array) {
            content += "<div class='row infoRow'><div class='col-md-12'>" + addrInspections.facilities[facilityId].facilityName + "</div></div>";
            Object.keys(addrInspections.facilities[facilityId].services).forEach(function(serviceId, idx, array) {
                var inspects = addrInspections.facilities[facilityId].services[serviceId].inspections.sort(dynamicSort("","-date"));
                var insDate = ""+inspects[0].date;
                content += "<div class='row serviceRow'><div class='col-md-12'>" + addrInspections.facilities[facilityId].services[serviceId].serviceName + 
                " Inspected:" + moment(insDate.substring(0,10)).format(DISPLAY_DATE_FORMAT) + " - " + inspects[0].status + "</div></div>";
                var x=1;
            });
        });
        content += "</div>";
        
    
    // content = "<div class='infoCol1'><img src='" + statusIcons[selectedEstablishmentData[0].inspections[0].status].icon + "'></div>" ; 
    //    if (addrInspections.length > 0) {
    //        content = "<div class='infoCol1'><img src='" + statusIcons[selectedEstablishmentData[0].inspections[0].status].icon + "'></div>" ; 
    //    }
    //    content += "<div class='infoCol2'><span class='infoImportant'><a href='#' onclick='showInspectionDetails("+ selectedEstablishmentData[0].id + ")'>" + selectedEstablishmentData[0].name + "</a></span><br>";
    //    content += selectedEstablishmentData[0].address + "<br>";
    //    content += "Last Inspected: " + ( selectedEstablishmentData[0].inspections.length > 0 ? moment(selectedEstablishmentData[0].inspections[0].date).format(DISPLAY_DATE_FORMAT) : "")+ "</div>";
    //    content += "<div class='infoFooter'><a href='#' onclick='showInspectionDetails("+ selectedEstablishmentData[0].id + ")'><img src='" + inspectionsIcon + "' alt='Inspection Details'></a>";
    //    content += "<a class='svLink' ref='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div>";
    } else {
        alert('found one with more one establishments' + selectedEstablishmentData[0].addressId);
        content = "<div class='infoHeader'><span class='infoImportant'>" + selectedEstablishmentData[0].address + "</span><br>" + selectedEstablishmentData.length + " establishments at this address</div>";
        for (var i = 0; i < selectedEstablishmentData.length; i++) {
            content += "<div class='infoMultiRow'>";
            if (selectedEstablishmentData[i].inspections.length > 0) {
                content += "<div class='infoCol1'><img src='" + statusIcons[selectedEstablishmentData[i].inspections[0].status].medium + "'></div>";
                content += "<div class='infoCol2'><span class='infoImportant'><a onclick='showInspectionDetails(" + selectedEstablishmentData[i].id + ")' href='#'>" + selectedEstablishmentData[i].name + "</a></span>";
                content += "<br>Last Inspected: " + (selectedEstablishmentData[i].inspections.length > 0 ? moment(selectedEstablishmentData[i].inspections[0].date).format(DISPLAY_DATE_FORMAT) : "") + " ";
                content += "<a style='margin-left: 10px;' href='#' onclick='showInspectionDetails(" + selectedEstablishmentData[i].id + ")'><img src='" + inspectionsIcon + "' alt='Inspection Details'></a>";
            } else {
                content += "<div class='infoCol1'><img src='" + statusIcons[0].medium + "'></div>";
                content += "<div class='infoCol2'><span class='infoImportant'><a onclick='showInspectionDetails(" + selectedEstablishmentData[i].id + ")' href='#'>" + selectedEstablishmentData[i].name + "</span></a>";
            }
            content += "</div></div>";
        }
        content += "<a class='svLink' href='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div>";
        
    }   
    //if (KMLEvent.featureData && KMLEvent.featureData.description) {
        CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
            "pixelOffset": 0,  //KMLEvent.pixelOffset,
            "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
        CommonInfoWindow.open(gblMap);
    //}
}

/*here need list of IDs.
Unlike dinesafe, swimsafe can select via addressId..  - we should get doneSafe to do the same.
For now still process as array, but will only every be one in the arayy.. no this wont work.

http://stackoverflow.com/questions/2749560/why-does-jquery-ajax-add-a-parameter-to-the-urlhttp://stackoverflow.com/questions/2749560/why-does-jquery-ajax-add-a-parameter-to-the-url
had to use cache: false..

*/
function processInfoWindow(establishmentids, KMLEvent_latLng) {
    //var establishmentids = $.parseJSON(KMLEvent.featureData.info_window_html);
    //console.log(KMLEvent.featureData.info_window_html);
    $("#map-loader").show();
    var promises=[];    
    
    console.log(establishmentids);
    selectedEstablishmentData = [];
    for (var i =0; i < establishmentids.length; i++) {
        var url = DETAIL_URL  + establishmentids[i].id + " ";
        console.log(url);
        var request = $.ajax({
            type: 'GET',
            url: url,
            contentType: "application/json",
            cache: true,
            //crossDomain: true,
            dataType: 'jsonp',
            //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
            success: function (data) {
                selectedEstablishmentData.push(data);
                //createInfoWindow(KMLEvent_latLng, selectedEstablishmentData, establishmentids.length);
            },
            error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        });
        promises.push( request);
   }
   
   $.when.apply(null, promises).done(function(){
        createInfoWindow(KMLEvent_latLng, selectedEstablishmentData, establishmentids.length); 
   });
}
    
function showInspectionDetails (estId) {

    var data = "";
    for (var i=0; i < selectedEstablishmentData.length; i++) {
        if (selectedEstablishmentData[i].id === estId) {
            data = selectedEstablishmentData[i];
            setupDetailsModal(data);
        }
    }
    $('#inspectionDetails').modal('show');
}

function processInfoWindow2() {

}


function doSearch() {
    nextRow = 0;
    $('#numberPageSelection').bootpag({page: 1});
    filterData();
    generateListing();
}

/* we apply filters.. don't do auto update - onChange..*/
function initFilter(filter, data, keyfld, valuefld) {
    
    //var facTypeFilter = $( "#facTypeFilter" );
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

function initFilters(data) {

    //var facTypes = data.types;
    initFilter( $("#facTypeFilter"), data.types, "code", "display");
    initFilter( $("#accFilter"), data.accessvalues, "code", "display");
    initFilter( $("#statusFilter"), data.statusvalues, "code", "display");
    initFilter( $("#wardFilter"), data.citywards, "id", "display");
}
function setupFilters() {

    $.support.cors = true;
    $.ajax({
        type: 'GET',
        url: LOOKUP_DATA_URL,
        //jsonpCallback: 'callback',
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
    //loadFacilityTypes();
   

        /*
        
            $("#statusFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,  
        buttonWidth: '100%'          
    });  
    $("#facTypeFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,  
        buttonWidth: '100%',
        onChange: function(option, checked, select) {
            generateListing();
        }
    }); 

    $("#accFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,  
        buttonWidth: '100%',
        onChange: function(option, checked, select) {
            filterData();
            generateListing();
        }
    }); 
    $("#wardFilter").multiselect({
        includeSelectAllOption: true,
        buttonWidth: '100%'            
    }); 
        */
    $('.input-daterange').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true
    });     

    
}
function setupEvents() {
    $('#numberPageSelection').bootpag({
        total: rowsPerPage,
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
        //var startRow = (num - 1)* rowsPerPage + 1;
        //var endRow = startRow  + rowsPerPage - 1;
        nextRow = ((num  -1 ) * rowsPerPage);
        generateListing();
    });
    
    $("#pageSize").multiselect({
       // buttonWidth: '75px',
        //buttonClass: 'pull-right',
        onChange: function(option, checked, select) {
            rowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            nextRow = 0;
            generateListing();
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
        filterData();
        generateListing();
    });
    $("#searchBtn").click(function() {
        doSearch();
    });
    $(".searchString").keypress(function(e) {
        var KeyCode = e.which || e.keyCode || 0;
        if (KeyCode === 13 || KeyCode === 9) {
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
        filterData();
        generateListing();
    }); 
    
    $("#maincontent").on("click", "#infoContent .expandHistory",function() {
       alert('expand/close hiostior2y');
       return false;
    });
    
    $("#maincontent").on("click","a.mapLink", function() {
        showLinkOnMap($(this).attr("data-id"), $(this).attr("data-lat"), $(this).attr("data-lng"));
        //return false;
    });     
    
}
function resetMap() {
    gblMap.setZoom(11);
    gblMap.setCenter(torontoCenter);
    CommonInfoWindow.close();
    
}

/*
 function handleNoGeolocation(errorFlag) {
    if (errorFlag === true) {
      alert("Geolocation service failed.");
      var initialLocation = newyork;
    } else {
      alert("Your browser doesn't support geolocation. We've placed you in Siberia.");
      initialLocation = siberia;
    }
    gblMap.setCenter(initialLocation);
  }
*/

function setupMapSearchBox() {
    var input = document.getElementById('map-input');
    var searchBox = new google.maps.places.SearchBox(input);
    gblMap.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
    // Bias the SearchBox results towards current map's viewport.
    gblMap.addListener('bounds_changed', function() {
        searchBox.setBounds(gblMap.getBounds());
    });

    var markers = [];
    // Listen for the event fired when the user selects a prediction and retrieve
    // more details for that place.
    searchBox.addListener('places_changed', function() {
        var places = searchBox.getPlaces();

        if (places.length === 0) {
            return;
        }

        // Clear out the old markers.
        markers.forEach(function(marker) {
            marker.setMap(null);
        });
        markers = [];

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
            markers.push(new google.maps.Marker({
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
        gblMap.setZoom(14);
    });
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
     $("#map-loader").show();
    var locData = $.parseJSON(event.featureData.info_window_html);
        //var estArr = [];
        //estArr.push({ "id" :event.featureData.id});
        
        //processInfoWindow(estArr, event.latLng);
        createInfoWindow2(event.latLng,locData);
    //event.preventDefault();
  });
  
    google.maps.event.addListener(gblKMLLayer, 'status_changed', function () {
    if (gblKMLLayer.getStatus() == google.maps.KmlLayerStatus.OK) {
       $("#map-loader").hide();
    }
    else { alert('kmlLayer load failed');  }
});  
}

function initMap() {
    gblMap = new google.maps.Map(document.getElementById('map-canvas'), {
        center: torontoCenter,
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
        zoomControl: true
    });
    //google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
    //  alert('map loaded');
    //  google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
    //  alert('map loadedw');
    //  });
    //})
    loadKmlLayer();
    gblMap.setZoom(11);
    setupMapSearchBox();
    
    var resetBTN = document.getElementById('resetMap');
    resetBTN.onclick = function () { resetMap();};
    gblMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(resetBTN);
    
    $("#resetMap").css( {"right" : "8px"});
        
    gblMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        document.getElementById('legend'));   

    //TODO: Keep this in? you might be able to determine a phone and zoom to user's location.. navigator has some attributes.. user-agent etc.
    if(navigator.geolocation) {
        //var browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            gblMap.setCenter(initialLocation);
            gblMap.setZoom(13);
            }, function() {
                //handleNoGeolocation(browserSupportFlag);
        });
    }
    // Browser doesn't support Geolocation
    //else {
    //  browserSupportFlag = false;
    //  handleNoGeolocation(browserSupportFlag);
    //}

}

function loadFacilityData() {
    $.ajax({
        type: 'GET',
        url: DATA_URL,
        crossDomain: true,
        dataType: 'jsonp',
        //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
                gblFacilityJSON = data;
                reorgAddressData();
                filterData();
                generateListing();
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}
function initApp() {

    $("#map-loader").show();
    initMap();
    loadFacilityData();
    setupFilters();
    setupEvents();
   
      
    var $table = $('table').tablesorter();
}

/* we load all css/js for all 3 forms here*/
function loadPage() {
    var strCode="";
   if (document.location.hostname.length === 0) {
      statusIcons = { "0" : "images/map/blank.png",
                           'SATISFACTORY' : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/marker_dot_pass.png", alt : "Satisfactory"},
                           'REINSPECTION' : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/marker_dot_pass.png", alt : "Reinspection" },
                           'DEFICIENCIES' : {large:  "images/map/conditional_large.png", medium:  "images/map/conditional_small.png", small:  "images/map/marker_dot_conditional.png", alt : "Deficiencies"},
                           'CLOSED' : {large:  "images/map/closed_large.png", medium:  "images/map/closed_small.png", small:  "images/map/marker_dot_closed.png", alt : "Closed"}
                        };
   
        markerImages = {
        'SATISFACTORY' : 'images/map/marker_dot_pass.png',
        'REINSPECTION' : 'images/map/marker_dot_pass.png',
        'DEFICIENCIES' : 'images/map/marker_dot_conditional.png',
        'CLOSED'       : 'images/map/marker_dot_closed.png',
        'multi'        : 'images/map/marker_dot_multi.png'
        };
        streetViewIcon ='images/map/streetView.png';
        strCode += '<link rel="stylesheet" href="static_files/assets/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        strCode += '<link rel="stylesheet" href="css/swimSafe.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('html/swimSafeListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/safe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/SwimSafe/css/swimSafe.css">';        
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/swimSafeListing.html', function() {initApp();});
        //$("#appDisplayMap").load('/4_DineSafe/html/dineSafeListing.html', function() {initApp();});
    }

}
$( document ).ready(function() {
    loadPage();
});

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};