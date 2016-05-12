/**
 * @fileoverview 
 * Map operates in two way.  the map is loaded with KML layers generated at google in a google drive account using google script
 * If a search is performed, the KMLLayer is removed and mapMarkers of the search are added.. This is slower ..
 */
/*
 Dinesafe API:  must specificy status otherwise get records with no status
                type, wards etc are optional.

todo: put images in google as well for speed?
do I have access to a place mark fro  google maps, so I can turn off quickly.--can't access individual placemarks in KML on have click event.
put in last update in header of map. -- may not need this.. that mnight be for fusion tables..maybe need to replicate via google??
--> can I get a placemark by id... and not after a click.. and therefor store info in a fake placemark?

alt tag on img -- not all done.. is done in modal..

sorting via back-end is not implemented.. need better understanding of API.. but do we really need it?
*/
/*
&iDisplayStart=0&iDisplayLength=10";
               "&sEcho=3&iColumns=4&sColumns=&iDisplayStart=30&iDisplayLength=10&mDataProp_0=0&mDataProp_1=1&mDataProp_2=2&mDataProp_3=3&iSortingCols=1" + 
               "&iSortCol_0=1&sSortDir_0=asc&bSortable_0=true&bSortable_1=true&bSortable_2=false&bSortable_3=true&_=1455642029930"
               
               The REdrawMap function seems to call the same AJAX call as listing.. tcheck into thos -- actually API is different..but still check
			   
look at submit in modal.. i have aclick event.. this is bad.			  

bug?:  if I filters.. does it redraw map on every pag operation? 
*/
 
var KML_MASTER = 'https://docs.google.com/uc?id=0B-j2Y49nfiw2dGU2d0pHS2xERm8&rand=' + randKey; 
var DETAIL_URL = "https://secure.toronto.ca/dinesafe/getEstablishmentDetails.json?callback=?&ESTABLISHMENT_ID=";
var DATA_URL = "https://secure.toronto.ca/dinesafe/dataTableEstablishments.json?callback=?";
//var SEARCH_URL = 'http://was8-inter-dev.toronto.ca/cc_sr_v1/data/tph_dinesafe?limit=20000';
var SEARCH_URL = 'https://secure.toronto.ca/dinesafe/searchEstablishments.json?callback=?&status=1,2,3';

//var SEARCH_URL =  'https://drive.google.com/uc?id=0B-j2Y49nfiw2TjRTNkhGN1ctV1k';

var rowsPerPage = 10;
var nextRow = 0;
var TPH_API_DATE_FORMAT = "MM/DD/YYYY";
var DISPLAY_DATE_FORMAT = "MMMM DD, YYYY";
/*
  var CommonInfoWindow = new google.maps.InfoWindow({"minWidth": 500});
*/
var CommonInfoWindow = new google.maps.InfoWindow();
var selectedEstablishmentData = [];

var  statusIcons = { "0" : "images/map/blank.png",
                           "1" : {large:  "/static_files/WebApps/Health/safe/images/pass_large.png", medium:  "/static_files/WebApps/Health/safe/images/pass_small.png", small:  "/static_files/WebApps/images/marker_dot_pass.png"},
                           "2" : {large:  "/static_files/WebApps/Health/safe/images/conditional_large.png", medium:  "/static_files/WebApps/Health/safe/images/conditional_small.png", small:  "/static_files/WebApps/images/marker_dot_conditional.png"},
                           "3" : {large:  "/static_files/WebApps/Health/safe/images/close_large.png", medium:  "/static_files/WebApps/Health/safe/images/close_small.png", small:  "/static_files/WebApps/images/marker_dot_close.png"}
                        };
  
  
var statusIconsAlt = ["no 0 status","pass","pass conditional","close"];
var markerImages = {'0' : '/static_files/WebApps/images/marker_dot_multi.png',
                    '1' : '/static_files/WebApps/images/marker_dot_pass.png',
                    '2' : '/static_files/WebApps/images/marker_dot_conditional.png',
					'3' : '/static_files/WebApps/images/marker_dot_close.png'};                       

var streetViewIcon ='/static_files/WebApps/Health/DineSafe/images/map/streetView.png';
var inspectionsIcon ='/static_files/WebApps/Health/DineSafe/images/map/inspections.png';
 var gblMap;
//var gblOtherMap = new google.maps.Map(document.getElementById('mapOther'));
var mapSrc = "KML";
var kmlLayer;
var gblSearchData;
var gblMarkerCluster;
var gblShellCluster;
var gblMapMarkers = [];
var gblMapMarkerShells = [];
var gblPlacesMarkers = [];
var torontoCenter = new google.maps.LatLng(43.69666,-79.39274);
var randKey =  (new Date()).valueOf();
var gblFilteredData = false;

//clean up map/src references in code and make them really be global.
//https://drive.google.com/file/d/0B-j2Y49nfiw2dGU2d0pHS2xERm8/view?usp=sharing
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
	CommonInfoWindow.close();
    resetAdvancedFilters();
    $(".searchString").each(function( index ) { 
        $(this).val("");
    });

}


function decodeMultSelection(domId) {
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

function mergeLocations(data) {
    var locations = {};
        
    for( var n = 0; n < data.length; n++ ) {
            
        var oData = {
            id: data[n].id,
            name: data[n].name,
            address: data[n].address,
            status: data[n].status,
            lastInspected: data[n].lastInspectionDate || null,
            lat: ( +data[n].latitude ),
            latlng: new google.maps.LatLng( data[n].latitude, data[n].longitude ),
            lng: ( +data[n].longitude )
            };
            
        if( !locations[ oData.latlng.toString() ] )
            locations[ oData.latlng.toString() ] = {
                address: oData.address,
                establishments: [],
                lat: oData.lat,
                latlng: oData.latlng,
                lng: oData.lng
                };
                
            locations[ oData.latlng.toString() ].establishments.push( {
                id: oData.id,
                name: oData.name,
                status: oData.status,
                lastInspected: oData.lastInspected
            } );
        }
    return locations;
    
}

function clearMarkers(markers) {
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function plotMarkers(data) {
    console.log('total data' + data.length);
    gblMapMarkers = [];
    var locations = mergeLocations(data);
    Object.keys(locations).forEach(function(key, idx, array) {
    //for( var i = 0; i < data.length; i++ ) {
        //var location = data[i];         
        var location = locations[key];
        var latlng = new google.maps.LatLng( location.lat, location.lng );
        //var latlng = location.latlng;
        var imageIndex  = ( location.establishments.length > 1 ) ? 0 : parseInt( location.establishments[0].status, 10 );
        //var eIds = "[";
        //for (var j =0; j < location.establishments.length; j++) {
        // eIds +='{ "id": ' + location.establishments[j].id + '},';
        //}
        //eIds = eIds.slice(0, -1) + "]";
        var title = ( location.establishments.length > 1 ) ? location.establishments.length + ' Establishments' : location.establishments[0].name;
                
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
           // estIds : eIds,
            location : location,
            icon: markerImages[imageIndex],
            title: title
        });
        marker.addListener('click', function () {
            //var establishmentids = $.parseJSON(this.estIds);
            //processInfoWindow(establishmentids, this.position);
            //locData = this.location;
            createInfoWindow2(this.position , this.location);
            
            //alert(this.estIds);
        });

        gblMapMarkers.push(marker);
        //map.addMarker( latlng, imageIndex, title );
    });
    //  }
    if ( gblMarkerCluster ) {
        gblMarkerCluster.clearMarkers();
    }
    gblMarkerCluster = new MarkerClusterer(gblMap, gblMapMarkers, { ignoreHidden: true , minimumClusterSize : 5, imagePath : '/static_files/WebApps/Health/DineSafe/images/m'});//,{
	//Clear shells
	setCluster(gblShellCluster, gblMapMarkerShells,'hide');
  //gblMarkerCluster.setMaxZoom(14);
      $("#map-loader").hide();
}

function toggleKMLLayer() {
    kmlLayer.setMap( kmlLayer.getMap() ? null : gblMap );
}

function plotMarkerShells(data) {
    gblMapMarkerShells = [];
    var locations = mergeLocations(data);
    Object.keys(locations).forEach(function(key, idx, array) {
    //for( var i = 0; i < data.length; i++ ) {
        //var location = data[i];         
        var location = locations[key];
        var latlng = new google.maps.LatLng( location.lat, location.lng );
        var imageIndex  = ( location.establishments.length > 1 ) ? 0 : parseInt( location.establishments[0].status, 10 );
                
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            icon: markerImages[imageIndex]
        });
        gblMapMarkerShells.push(marker);
        //map.addMarker( latlng, imageIndex, title );
    });
    //  }
     if ( gblShellCluster ) {
        gblShellCluster.clearMarkers();
     }
    gblShellCluster = new MarkerClusterer(gblMap, gblMapMarkerShells, { ignoreHidden: true , minimumClusterSize : 1, imagePath : '/static_files/WebApps/Health/DineSafe/images/m'});//,{
    setCluster(gblShellCluster, gblMapMarkerShells,'hide');

    //gblMarkerCluster.setMaxZoom(14);
      $("#map-loader").hide();

}
function loadSearchData() {
	$.ajax({
        type: 'GET',
        url: SEARCH_URL ,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            plotMarkerShells(data)
        },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
        }
    }); 
}
function redrawMap(searchURLAdd) {
    //alert('redraw map');
    $("#map-loader").show();
    mapSrc = 'Markers';
    kmlLayer.setMap( null );
    clearMarkers(gblMapMarkers);
    $.ajax({
        type: 'GET',
        url: SEARCH_URL  + searchURLAdd,
        crossDomain: true,
        dataType: 'jsonp',
        //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
            plotMarkers(data);
            $("#map-loader").hide();
                //setPageStatus(nextRow, endRow, data.iTotalRecords);
                //loadListView(data);
                //alert('x');
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        }); 
    
}

function resetMapToKML() {
    if (mapSrc != 'KML') {
       // $("#map-loader").show();
        clearMarkers(gblMapMarkers);
		setCluster(gblMarkerCluster, gblMapMarkers, 'hide');
        //kmlLayer.setMap(  gblMap );
        mapSrc = 'KML';
		gblMap.setZoom(gblMap.getZoom());
    }
    //
}

function processSearchData(data) {

    //TODO: save this data in a structure simuilar to what is in KML.
    
    gblSearchData = {};
    for (var i =0; i < data.length; i++) {
        var oData = { status: data[i][0],
                  name: data[i][1],
                  address: data[i][2],
                  type: data[i][3],
                  establishments : [],
                  estId: data[i][4],
                  lat: data[i][5],
                  lng: data[i][6],
                  lastInspected: data[i][7]
            };
        oData.establishments.push({id: data[i][4],
                                    name: data[i][1],
                                    status: data[i][0],
                                    lastInspected: data[i][7]});
        gblSearchData[oData.estId] = oData;
    }
    
    loadListView(data);
    
}
function generateListing() {

    gblFilteredData = false;
    var searchURLAdd ="";
    var endRow = nextRow + rowsPerPage - 1;
    var srchEst = $("#estSearch").val();
    var srchAddr = $("#addrSearch").val();

    var searchUrl = DATA_URL + "&iDisplayStart=" + nextRow + "&iDisplayLength=" + rowsPerPage;

    var statuses = decodeMultSelection("#statusFilter");
    if (statuses !== 'ALL') {
        searchURLAdd += "&status=" + statuses;
        gblFilteredData = true;
    } else {
        searchURLAdd += "&status=1,2,3";
    }
    if (srchEst !== "") { 
        searchURLAdd  += "&name=" + srchEst;
        gblFilteredData = true;
    }
    if (srchAddr !== "") { 
        searchURLAdd += "&address=" + srchAddr;
        gblFilteredData = true;
    }
    var types = decodeMultSelection("#estTypeFilter");
    if (types !== 'ALL') { 
        searchURLAdd += "&type=" + types;
        gblFilteredData = true;
    }
    var wards = $("#wardFilter").val();
    if (wards !== '0') { 
        searchURLAdd += "&ward=" + wards;
        gblFilteredData = true;
    }
    if ($("#incHistory").prop('checked')) {
         searchURLAdd += "&checkInspectionHistory=true";
        gblFilteredData = true;
    }
    var dateFrom = $("#dateFrom").val(); 
    var dateTo = $("#dateTo").val();
    if (dateFrom !== "") {
        searchURLAdd += "&from=" + moment(dateFrom).format(TPH_API_DATE_FORMAT);
        gblFilteredData = true;
    }    
    if (dateTo !== "") {
        searchURLAdd += "&to=" + moment(dateTo).format(TPH_API_DATE_FORMAT);
        gblFilteredData = true;
    }

    $.ajax({
        type: 'GET',
        url: searchUrl + searchURLAdd,
        crossDomain: true,
        dataType: 'jsonp',
        //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
                setPageStatus(nextRow, endRow, data.iTotalRecords);
                processSearchData(data.aaData);                
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        });
  
    if (gblFilteredData) {        
        redrawMap(searchURLAdd);
    } else {
        
        resetMapToKML();    
    }
    
    
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

function showLinkOnMap(estId, lat,lng) {

    var panorama = gblMap.getStreetView();
    if(panorama.getVisible() ) {
        panorama.setVisible(false);
    }
    var latLng = new google.maps.LatLng(lat,lng);
    gblMap.setZoom( 13 );
    gblMap.setCenter( latLng );
    
    
   // estArr = [];
   // estArr.push({ "id" : estId});
    
    createInfoWindow2(latLng, gblSearchData[estId] );
    //processInfoWindow(estArr, latLng);

}

function loadListView(jsonData) {

    var strRows = "";
    
    $.each(jsonData, function(i, item) {
        strRows += "<tr id='dinerow" + i + "'>";
        strRows += "<td style='text-align:center' class='col-md-1'><img src='" + statusIcons[item[0]].large + "'></td>";
        strRows += "<td class='col-md-5'><a href='#' onclick='showLinkOnMap("+ item[4] + "," + item[5] + "," + item[6] + ")'>" + item[1] + "</a></td>" ;
        strRows += "<td class='col-md-3'>" + item[2] + "</td>" ;
        strRows += "<td class='col-md-3'>" + item[3] + "</td>" ;
        strRows += "</tr>";
    });
    
    strRows = (strRows ==="") ? "<tr><td colspan='4'>No Establishment found, check search options and try again</td></tr>" : strRows;
    $("#dinetable").find("tbody").html(strRows).trigger('update');
    var $table = $("#dineTable").tablesorter(
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

function reorgInfractions (inspection) {
    
    var sMunicipalType = 'MUNICIPAL';
    var dateElements = inspection.date.split( '-' );
            
    var inspectObj = {
        date: new Date( ( +dateElements[0] ), ( +dateElements[1] ) - 1, ( +dateElements[2] ) ),
        foodInfractions: [],
        municipalInfractions: [],
        status: inspection.status
    };
            
    for( var i in inspection.infractions ) {
                
        var infractions = inspection.infractions[i];                
        if( i == sMunicipalType ) {                
            inspectObj.municipalInfractions = infractions;
        } else {                
            inspectObj.foodInfractions.push( {
                category: i,
                details: infractions.sort( function( a, b ) {       
                    if ( ( +a.severity ) < ( +b.severity ) )
                        return -1;
                    if ( ( +a.severity ) > ( +b.severity ) )
                        return 1;

                    return 0;
                } )
            } );
        }
    }
    return inspectObj;
    
}
function popInfractionTable(inspection) {
    //Prosecutions is always an array of 1..with an object of 3 elements.

    var severityList = [ 'Crucial', 'Significant', 'Minor' ];
        
    var tblStr = "";
    if (inspection.foodInfractions.length > 0) {
        tblStr += "<div class='table-responsive'><table class='table table-bordered'>";
        tblStr += "<thead><tr><th class='FPRI" + inspection.status + "' colspan='4'>Food Premises Regulation Infractions</th></tr>";
        tblStr += "<tr><th>Category</th><th>Severity</th><th>Action</th><th>Outcome</th></tr></thead>";
        tblStr += "<tbody>";
        for( var j = 0; j < inspection.foodInfractions.length; j++ ) {
            tblStr += "<tr><td colspan='4' class='infractionCat'>" + inspection.foodInfractions[j].category + "</td></tr>";
            for (var k = 0; k < inspection.foodInfractions[j].details.length; k++) {
                tblStr += "<tr><td>" + inspection.foodInfractions[j].details[k].details + "</td>";
                tblStr += "<td><span class='inSeverity" + inspection.foodInfractions[j].details[k].severity + "'>" + severityList[inspection.foodInfractions[j].details[k].severity -1] + "<span></td>"; 
                tblStr += "<td>" + inspection.foodInfractions[j].details[k].action+ "</td>"; 
                if( inspection.foodInfractions[j].details[k].prosecutions.length > 0 ) {
                    tblStr += "<td>";
                    if( !!inspection.foodInfractions[j].details[k].prosecutions[0].outcome ) {
                        tblStr += inspection.foodInfractions[j].details[k].prosecutions[0].outcome;
                    }
                    if( !!inspection.foodInfractions[j].details[k].prosecutions[0].date ) {
                        tblStr += '<br/>' + inspection.foodInfractions[j].details[k].prosecutions[0].date;
                    }
                    if( !!inspection.foodInfractions[j].details[k].prosecutions[0].fine ) {
                        tblStr += '<br/>$' + inspection.foodInfractions[j].details[k].prosecutions[0].fine;
                    }
                    tblStr += "</td>";
                } else {
                    tblStr += "<td></td>";
                }
                tblStr += "</tr>";
            }
        }
        tblStr += "</tbody></table></div>";
    }

    if (inspection.municipalInfractions.length > 0) {
        tblStr += "<div class='table-responsive'><table class='table table-bordered'>";
        tblStr += "<thead><tr><th class='munInfCat' colspan='3'><span class='munInf'>Municipal Code Infractions</span></th></tr><tr><th>Category</th><th>Action</th><th>Outcome</th></tr></thead>";
        tblStr += "<tbody>";
        for( var i = 0; i < inspection.municipalInfractions.length; i++ ) {
                tblStr += "<tr><td>" + inspection.municipalInfractions[i].details + "</td>"; 
                tblStr += "<td>" + inspection.municipalInfractions[i].action+ "</td>";
                tblStr += "<td>" + inspection.municipalInfractions[i].prosecutions+ "</td>";
                tblStr += "</tr>";
        }
        tblStr += "</tbody></table></div>";
    }
  
   return tblStr;
    
}

function  setupDetailsModal(data) {
    var statusDescription = [
        'No infractions were observed under the Food Premises Regulation during an inspection.',
        'One or more significant infractions were observed under the Food Premises Regulation during an inspection.',
        'One or more crucial infractions were observed under the Food Premises Regulation that present an immediate health hazard that cannot be corrected during an inspection.'
        ];
    var severityDescription = [
        'Immediate health hazard|These infractions must be corrected immediately. An order to close the premises may be issued and/or immediate action must be taken to remove or eliminate the health hazard. A Closed Notice will be issued and must be posted, and other enforcement action will be taken. Crucial infractions are conditions that endanger food directly, such as contamination, time-temperature abuse or lack of safe-to-drink water or any other condition that constitutes a health hazard.',
        'Potential health hazard|These infractions must be corrected immediately and a re-inspection to check for compliance will be conducted within 24 to 48 hours. Legal action may be taken should these infractions remain outstanding. Under exceptional circumstances a re-inspection to check for compliance may be extended beyond 48 hours. Significant infractions concern food handling, preparation, storage and/or service.',
        'Minimal health risk|These Infractions must be corrected immediately. A follow-up compliance check will be conducted at the next scheduled inspection.'
        ];
    $("#estName").text(data.name);
    $("#estAddress").text(data.address);
    $("#estType").text(data.type);
    $("#minInspection").text(data.minimumInspections);
    var numInspTT = "<h3>Inspection Criteria</h3>" + "<div>Every establishment receives a minimum of 1, 2, or 3 inspections each year depending on the specific type of establishment, the food preparation processes, volume and type of food served and other related criteria.</div>";
    $("#numInspTT").tooltip({ placement : 'bottom', html : true, title :numInspTT});
    var insStr = "";
    for (var i=0; i < data.inspections.length; i++) {
        insStr += "<div id='ins_" + i + "' class=''>"; 
        insStr += "<h3 class='leading'>";
        insStr += "<img src='" + statusIcons[data.inspections[i].status].small + "' alt='" + statusIconsAlt[data.inspections[i].status] + "'>" ;
        insStr += "<span class='date'> " +moment(data.inspections[i].date).format(DISPLAY_DATE_FORMAT) + " - </span>";
        if (data.inspections[i].status === 1) { 
            insStr += "<span class='inspectionStatus'>Pass</span></h3>";
        } else if (data.inspections[i].status === 2) { 
            insStr += "<span class='inspectionStatus'>Conditional Pass</span></h3>";
        } else  if (data.inspections[i].status === 3) { 
            insStr += "<span class='inspectionStatus'>Closed</span></h3>";
        }
        
        var inspection = reorgInfractions (data.inspections[i]);
        if( !( +inspection.status == 1 && inspection.foodInfractions.length > 0 ) ) {
              insStr += "<p class='description'>" + statusDescription [ ( +inspection.status ) - 1 ] + "</p>";
        }
        insStr += popInfractionTable(inspection);
        insStr += "</div>";
    }
    $("#inspections").html(insStr);
    
    for (var j=0; j < severityDescription.length; j++) {
        var items = severityDescription[j].split('|');
        var tt = "<h3>" + items[0] + "</h3>" + "<div>" + items[1] + "</div>";
        $(".inSeverity"+ (j+1)).tooltip({ placement : 'bottom', html : true, title :tt});
    }
    var t2 = "<h3>No Health Hazard</h3>" + "<div>It should be noted that while the majority of infractions pertain to the requirements under the food premisses regulation, there are some infractions that pertain to the requirements under municipal by-laws. In such cases, the infraction severity does not apply.<div>";
    $(".munInf").tooltip({ placement : 'bottom', html : true, title :t2});

    
    $("#submitComplaintId").click(function () {
        dineSafeComplaint.init();
    });
}

function createInfoWindow2(KMLEvent_latLng, infoData) {
    CommonInfoWindow.close();
     $("#map-loader").hide();

    var content = "<div class='content infoDiv'>";
    if (infoData.establishments.length === 1) {
        content += "<div class='row infoRow'>" ; 
        content += "<div class='col-md-12'><img src='" + statusIcons[infoData.establishments[0].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant'><a href='#' data-id='" + infoData.establishments[0].estId + "'onclick='showInspectionDetails("+ infoData.establishments[0].estId + ")'>" + infoData.establishments[0].name + "</a></span></div>";
        content += "</div>";
        content += "<div class='row infoRow'><div class='col-md-offset-1 col-md-11'>" + infoData.address + "</div></div>";
        content += "<div class='row infoRow'><div class='col-md-offset-1 col-md-11'>Last Inspected: " + moment(infoData.lastInspected).format(DISPLAY_DATE_FORMAT) + "</div></div>";
        //content += "<div class='row infoRow'><div class='col-md-offset-1 col-md-11 infoFooter'><a href='#' onclick='showInspectionDetails("+ infoData.establishments[0].id + ")'><img src='" + inspectionsIcon + "' alt='Inspection Details'></a>";
        content += "<a class='svLink' ref='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div></div>";
    } else {
        //content += "<div class='row infoRow'>" ;
        content += "<div class='row infoRow'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
        content += "<div class='row infoRow infoHeader'><div class='col-md-12'>" + infoData.establishments.length + " establishments at this address</div></div>";
        for (var i = 0; i < infoData.establishments.length; i++) {
           
            if (infoData.establishments[i].lastInspected) {
                content += "<div class='row infoRow'><div class='col-md-12'><img src='" + statusIcons[infoData.establishments[i].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant'><a onclick='showInspectionDetails(" + infoData.establishments[i].estId + ")' href='#'>" + infoData.establishments[i].name + "</a></span></div></div>";
                content += "<div class='row infoRow'><div class='col-md-offset-1  col-md-12'>Last Inspected: " + moment(infoData.establishments[i].lastInspected).format(DISPLAY_DATE_FORMAT);
                //content += "<a class='pull-right' style='margin-left: 10px;' href='#' data-id='" + infoData.establishments[i].id + "' onclick='showInspectionDetails(" + infoData.establishments[i].id + ")'><img class='insIcon' src='" + inspectionsIcon + "' alt='Inspection Details'></a></div></div>";
                content += "</div></div>";
            } else {
                content += "<div class='row infoRow'><div class='col-md-12'><img src='" + statusIcons[0].medium + "'><span class='infoImportant'><a onclick='showInspectionDetails(" + infoData.establishments[i].id + ")' href='#'>" + infoData.establishments[i].name + "</span></a></div></div>";
            }
            //content += "</div></div>";
        }
        content += "<div class='row infoRow'><div class='col-md-10'><a class='svLink' href='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div></div>";
        
    }  
    content += "</div>";    
    CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
        "pixelOffset": 0,  //KMLEvent.pixelOffset,
        "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
    CommonInfoWindow.open(gblMap);
}
/* 
pixel offset seems to default to -8.. but erhy.. 0 seems to be fine
really only need latlng for this and not the event.
You can double click on a single entity..and with timing make it look like 2 
*/
function createInfoWindow(KMLEvent_latLng, selectedEstablishmentData, total) {

    CommonInfoWindow.close();
     $("#map-loader").hide();
    //TODO: selectedEstablishmentData is an array and maybe should be a global object and keyed on ID.. 
    var content = "";
    if (selectedEstablishmentData.length === 1) {

        if (selectedEstablishmentData[0].inspections.length > 0) {
            content = "<div class='infoCol1'><img src='" + statusIcons[selectedEstablishmentData[0].inspections[0].status].medium + "'></div>" ; 
        }
        content += "<div class='infoCol2'><span class='infoImportant'><a href='#' onclick='showInspectionDetails("+ selectedEstablishmentData[0].id + ")'>" + selectedEstablishmentData[0].name + "</a></span><br>";
        content += selectedEstablishmentData[0].address + "<br>";
        content += "Last Inspected: " + ( selectedEstablishmentData[0].inspections.length > 0 ? moment(selectedEstablishmentData[0].inspections[0].date).format(DISPLAY_DATE_FORMAT) : "")+ "</div>";
        content += "<div class='infoFooter'><a href='#' onclick='showInspectionDetails("+ selectedEstablishmentData[0].id + ")'><img src='" + inspectionsIcon + "' alt='Inspection Details'></a>";
        content += "<a class='svLink' ref='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div>";
    } else {
        
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

/*here need list of IDs.*/
function processInfoWindow(establishmentids, KMLEvent_latLng) {
    //var establishmentids = $.parseJSON(KMLEvent.featureData.info_window_html);
    //console.log(KMLEvent.featureData.info_window_html);
    $("#map-loader").show();
    var promises=[];    
    
    console.log(establishmentids);
    selectedEstablishmentData = [];
    for (var i =0; i < establishmentids.length; i++) {
        var url = DETAIL_URL  + establishmentids[i].id;
        console.log(url);
        var request = $.ajax({
            type: 'GET',
            url: url,
            crossDomain: true,
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
    var url = DETAIL_URL  + estId;
    console.log(url);
    var request = $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        dataType: 'jsonp',
            //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
            setupDetailsModal(data);
            $('#inspectionDetails').modal('show');
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    //var data = "";
    //for (var i=0; i < selectedEstablishmentData.length; i++) {
    //    if (selectedEstablishmentData[i].id === estId) {
    //        data = selectedEstablishmentData[i];
    //        setupDetailsModal(data);
    //    }
    //}
}
/**
 * Adds a KMLLayer based on the URL passed. Clicking on a marker
 * results in the balloon content being loaded into the right-hand div.
 */
function loadKmlLayer() {
    kmlLayer = new google.maps.KmlLayer(KML_MASTER, {
    suppressInfoWindows: true,
    preserveViewport: true,
//     pane: "floatPane",
    map: gblMap
  });
  
  kmlLayer.set('preserveViewport', true); 
  google.maps.event.addListener(kmlLayer, 'click', function(event) {
    console.log(event.featureData.info_window_html);
     $("#map-loader").show();
    //var establishmentids = $.parseJSON(event.featureData.info_window_html);
    //processInfoWindow(establishmentids, event.latLng);
    if (event.featureData.status==="ZERO_RESULTS") {
		alert('zero results');
	}
    var locData = $.parseJSON(event.featureData.info_window_html);
    createInfoWindow2(event.latLng, locData);
    //event.preventDefault();
  });
  
    google.maps.event.addListener(kmlLayer, 'status_changed', function () {
    if (kmlLayer.getStatus() == google.maps.KmlLayerStatus.OK) {
       $("#map-loader").hide();
    }
    else { alert('kmlLayer load failed');  }
});  
}

function doSearch() {
    nextRow = 0;
    $('#numberPageSelection').bootpag({page: 1});
    generateListing();
}

function setupFilters() {
   $("#estTypeFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,    
        buttonWidth: '100%',        
        enableCollapsibleOptGroups: true
    }); 
    $("#statusFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,  
        buttonWidth: '100%'            
    }); 
    $("#wardFilter").multiselect({
        includeSelectAllOption: true,
        buttonWidth: '100%'            
    }); 
    $('.input-daterange').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true
    });         
    
}
function setUpEvents() {
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
  //      buttonWidth: '75px',
  //      buttonClass: 'pull-right',
        onChange: function(option, checked, select) {
            rowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            nextRow = 0;
            generateListing();
        }
    });
 //   $("#pageSize").next().css( {"float" : "right"});
 // $("#pageSize").next().find("button").css( "height", "32px" );
 
    
    $(".hasclear").keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    });
    $(".clearer").hide($(this).prev('input').val());
    $(".clearer").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
        //showListing();
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
        generateListing();
    }); 
    
}
function resetMap() {
    gblMap.setZoom(11);
    gblMap.setCenter(torontoCenter);
    CommonInfoWindow.close();
    clearMarkers(gblPlacesMarkers);
    $("#map-input").val("");
    
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

        // Clear out the old markers.
        gblPlacesMarkers.forEach(function(marker) {
            marker.setMap(null);
        });
        gblPlacesMarkers = [];

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
        gblMap.setZoom(14);
    });
}
function setCluster(cluster, markers, flag) {
	if (typeof cluster === "undefined") return;
    var visibility = true;
    if (flag === 'hide') { visibility = false;}
    for (var i = 0; i < markers.length; i++) {
        markers[i].setVisible( visibility);
    }
    if (cluster ) {
        cluster.repaint();
    }
}

function initMap() {
    gblMap = new google.maps.Map(document.getElementById('map-canvas'), {
        center: torontoCenter,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
        zoomControl: true
    });
    gblMap.addListener('zoom_changed', function() {
		 console.log("setnull" + gblMap.getZoom());
        $("#zoom").text(gblMap.getZoom());
		if (gblFilteredData) {
			 setCluster(gblShellCluster, gblMapMarkerShells, 'hide');			
		} else if(gblMap.getZoom() > 14) {
            kmlLayer.setMap(  gblMap );
			setCluster(gblShellCluster, gblMapMarkerShells, 'hide');
            setCluster(gblMarkerCluster, gblMapMarkers, 'hide');
            
            //if (gblMarkerCluster && gblMarkerCluster.getMap() !== null) {
            //  console.log("setnull" + gblMap.getZoom());
            //      gblMarkerCluster.setMap(null);
        
            //}
        } else {
            kmlLayer.setMap(  null );
            setCluster(gblShellCluster, gblMapMarkerShells,'show');
        }
      //alert('Zoom: ' + gblMap.getZoom());
    });
    //  google.maps.event.addListenerOnce(map, 'tilesloaded', function(){
    //  alert('map loadedw');
    //  });
    //})
    loadKmlLayer();
    gblMap.setZoom(15);
    
    var resetBTN = document.getElementById('resetMap');
    resetBTN.onclick = function () { resetMap();};
    gblMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(resetBTN);
    
    setupMapSearchBox();    
        
    gblMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        document.getElementById('legend'));   

    //TODO: Keep this in? you might be able to determine a phone and zoom to user's location.. navigator has some attributes.. user-agent etc.
    if(navigator.geolocation) {
        //browserSupportFlag = true;
        navigator.geolocation.getCurrentPosition(function(position) {
            var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
            gblMap.setCenter(initialLocation);
            gblMap.setZoom(15);
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


function initApp() {

    $("#map-loader").show();

    initMap();
    loadSearchData();  //sets up markers shells
    setupFilters();
    setUpEvents();
    generateListing();
      
    var $table = $('table').tablesorter();
}

/* we load all css/js for all 3 forms here*/
function loadPage() {
    var strCode="";
   if (document.location.hostname.length === 0) {
       statusIcons = { "0" : "images/map/blank.png",
                           "1" : {large:  "images/map/pass_large.png", medium:  "images/map/pass_small.png", small:  "images/map/marker_dot_pass.png"},
                           "2" : {large:  "images/map/conditional_large.png", medium:  "images/map/conditional_small.png", small:  "images/map/marker_dot_conditional.png"},
                           "3" : {large:  "images/map/close_large.png", medium:  "images/map/close_small.png", small:  "images/map/marker_dot_closed.png"}
                        };
        markerImages = { "0" : 'images/map/marker_multi.png',
                         "1" : 'images/map/marker_pass.png',
                         "2" : 'images/map/marker_conditional.png',
                         "3" : 'images/map/marker_close.png'
        };
        streetViewIcon ='images/map/streetView.png';
        inspectionsIcon ='images/map/inspections.png';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode = '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/dineSafe.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.widgets.js"></script>';
       // strCode += '<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += ' <script type="text/javascript" src="js/markerclusterer.min.js"></script>';
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('html/dineSafeListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode = '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/DineSafe/css/dineSafe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/DineSafe/css/dineSafe.css">';
        
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        //strCode += '<script type="text/javascript" src="//maps.googleapis.com/maps/api/js?v=3&libraries=places"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
        strCode += ' <script type="text/javascript" src="/static_files/WebApps/Health/DineSafe/js/markerclusterer.min.js"></script>';
        
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('/static_files/WebApps/Health/DineSafe/html/dineSafeListing.html', function() {initApp();});
        //$("#appDisplayMap").load('/4_DineSafe/html/dineSafeListing.html', function() {initApp();});
    }

}
$( document ).ready(function() {
    loadPage();
});