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
               
DIneSafe Difference
1) Body Safe doesn't page per say.. it does it by alpha.. so we don't know total records. IT IS HARD CODE AT 5000.. COULD (1) depends on paging..
2) There is no historical/history select.. 
3) search can only be done with "apply".. send flag to redraw map then?
4) not specifying parameters is not same as selecting all.

Notes:  Seems to be a bug in clusterer.. if you hit reset map twice in a row.. the re-clustering doesn't seem to work
     
*/
 
var randKey =  (new Date()).valueOf();
var KML_MASTER = 'https://docs.google.com/uc?id=0B-j2Y49nfiw2MGY3X190bGVsV2c&rand=' + randKey;
var DETAIL_URL = "http://app.toronto.ca/opendata/tphir/pss_insp_details.json?v=1&callback=?&est_id=";
var DATA_URL = 'http://app.toronto.ca/opendata/tphir/pss_est_list.json?v=1';
var SEARCH_URL = "http://app.toronto.ca/opendata/tphir/pss_est_map.json?v=1&callback=?";
var ALPHA_COUNT_URL = 'http://app.toronto.ca/opendata/tphir/pss_est_initial_count.json?v=1&callback=?';

// http://app.toronto.ca/opendata/tphir/pss_est_list.json?v=1&callback=?&service_type_cd=7018.7016.7023.7019.7020.7022.7017.7024&facility_status_cd=PASS.COND.FAIL&facility_name_initial=
//var SEARCH_URL = 'http://app.toronto.ca/opendata/tphir/pss_est_list.json?v=1&callback=?&service_type_cd=7018.7016.7023.7019.7020.7022.7017.7024&facility_status_cd=PASS.COND.FAIL&facility_name_initial=';
var SERVICE_TYPE_URL = 'http://app.toronto.ca/opendata/tphir/pss_srvc_types.json?v=1&callback=?';
var STATUS_URL = 'http://app.toronto.ca/opendata/tphir/pss_est_status.json?v=1&callback=?';
var gblStatusData;
var gblTypeData;

var rowsPerPage = 10;
var nextRow = 0;
var gblCurrentAlphaPage = '0';
var ALPHA_PAGING_METHOD = 'Alpha';
var NUMERIC_PAGING_METHOD = 'Num';
var gblPagingMethod = ALPHA_PAGING_METHOD;

var CommonInfoWindow = new google.maps.InfoWindow();
var statusIcons = { 
            "PASS" : { large: "/static_files/WebApps/Health/safe/images/pass_large.png", medium: "/static_files/WebApps/Health/safe/images/pass_small.png",small: "/static_files/WebApps/images/marker_dot_pass.png"},
            "COND" : { large: "/static_files/WebApps/Health/safe/images/conditional_large.png", medium: "/static_files/WebApps/Health/safe/images/conditional_small.png",small: "/static_files/WebApps/images/marker_dot_pass.png"},
            "FAIL" : { large: "/static_files/WebApps/Health/safe/images/close_large.png", medium: "/static_files/WebApps/Health/safe/images/close_small.png",small: "/static_files/WebApps/images/marker_dot_close.png"}
            };
markerImages = { 
            'multi': {icon: '/static_files/WebApps/images/marker_dot_multi.png', value : 4},
            'PASS' : {icon: 'static_files/WebApps/images/marker_dot_pass.png', value : 1},
            'COND' : {icon: '/static_files/WebApps/images/marker_dot_conditional.png', value : 2},
            'FAIL' : {icon: '/static_files/WebApps/images/marker_dot_close.png', value : 3}
            };
var CLUSTER_IMAGES = '/static_files/WebApps/images/mc';
var streetViewIcon ='/static_files/WebApps/Health/safe/images/streetView.png';
var inspectionsIcon ='/static_files/WebApps/Health/safe/images/inspections.png';

var TPH_API_DATE_FORMAT = "MM/DD/YYYY";
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
var gblFilteredFacilities;
var gblFacData;
var gblEstIdMap;
var gblFacDataCnt;
//We need to send all the default parameters (all the types, and statuses).. 
var gblDefaultAllSearchParms;
var gblNeedToRedrawMap = false; //TODO - get rid of this?


/*----------------------------------------------------------------------------------*/
function switchToStreetView(objPosition) {
    console.log('switchToStreetView(objPosition) ' + objPosition );

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
//clean up map/src references in code and make them really be global.
//https://drive.google.com/file/d/0B-j2Y49nfiw2dGU2d0pHS2xERm8/view?usp=sharing
/* our numbering is zero based, so increment for display purposes */
function setPageStatus( start, end, totalRows) {
    console.log('setPageStatus( start, end, totalRows) ' + start +  ' - ' +  end +  ' - ' +  totalRows );
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
    console.log('resetAdvancedFilters() ');
   $(".filterSelect").each(function( index ) {
       var ms = $("#" + this.id);
        ms.multiselect('selectAll',false);
        ms.multiselect('refresh');
        //if(this.id !== null && this.selectedOptions.length != this.options.length) {
        //  for (i = 0; i < this.options.length; i++) {
        //      this.options[i].selected = true;
        //  }
        //}
    }); 
    $("#dateFrom").val("");
    $("#dateTo").val("");
    //$("#wardFilter").val("0");
    //$("#wardFilter").multiselect('refresh');
    $("#incHistory").prop('checked', false);
}


function resetFilters() {
    console.log('resetFilters() ');
    CommonInfoWindow.close();   
    resetAdvancedFilters();
    $(".searchString").each(function( index ) { 
        this.value="";
    });

}

//This api use "." not comma as parameter seperators
function decodeMultSelection(domId) {
    console.log('decodeMultSelection(domId) ' + domId );
    var str = "";
    //if ($(domId).prop('options') &&  $(domId).prop('selectedOptions') && $(domId).prop('options').length === $(domId).prop('selectedOptions').length) {
    //    str = "ALL";
    //} else if ($(domId).val() !== null) {
        $.each($(domId).val(), function(i,item) {
            str += (i>0) ? "." : "";
            str += item;
        });
    //}
    return str;
}

function determineSearchParms() {
    console.log('determineSearchParms() ');
 
    var search = false;
    var searchURLAdd ="";
    var srchEst = $("#estSearch").val();
    var srchAddr = $("#addrSearch").val();

    var statuses = decodeMultSelection("#statusFilter");
    if (statuses !== 'ALL') {
        searchURLAdd += "&facility_status_cd=" + statuses;
        search = true;
    } else {
        //searchURLAdd += "&status=1,2,3";
    }
    if (srchEst !== "") { 
        var fparms =  srchEst.split(" ");
        for (var j = 1; j <= fparms.length; j++) {
            searchURLAdd  += "&f" + j + "=" + fparms[j -1].replace(/[^A-Za-z 0-9]*/g, '');
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
    var types = decodeMultSelection("#serviceTypeFilter");
    if (types !== 'ALL') { 
        searchURLAdd += "&service_type_cd=" + types;
        search = true;
    }
    //var wards = $("#wardFilter").val();
    //if (wards !== '0') { 
    //    searchURLAdd += "&ward=" + wards;
    //    search = true;
    //}
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
 
    return { filtersApplied: search, urlParms: searchURLAdd};
}


/* Map Related Functions ---------------------------------------------------------------------------------*/

//Details are for establishments. Infractions and actions are single strings (unlike dine safe
//look for fine and converiuonDate
function reorgDetails (data) {
    console.log('reorgDetails (data) ' + data );
    
    var estData = {};
    estData.estId = data[0].estId;
    estData.estName = data[0].estName;
    estData.estStatusCd = data.estStatusCd;//TODO.. fix this when api si fixed
    estData.address = data[0].addressFull;
    estData.services = {};
    $.each(data, function(i, item) {
        if (!estData.services[item.serviceTypeDesc]) {
            estData.services[item.serviceTypeDesc] = {
                inspections : []
            };
        }
        estData.services[item.serviceTypeDesc].inspections.push( {
            date : item.inspectionDate,
            status : item.inspectionStatusText,
            statusCd : item.inspectionStatusCd,
            infraction: item.infractionTypeDesc,
            action: item.actionDesc,
            amountFined: item.amountFined,
            outcome: item.outcome,
            convictionDate: item.convictionDate
            
        });
    });
 
    return estData;
}

/* do we want bacgroudn colors of red. and yellow for infractions -- see ddinesage)*/

function  setupDetailsModal(data) {
    console.log(' setupDetailsModal(data) ' + data );
    var estData = reorgDetails(data);

    $("#estName").text(estData.estName);
    $("#estAddress").text(estData.address);
    $("#imgStatus").attr("src", statusIcons[estData.estStatusCd].large) ;
    var insStr = "";
    var inscnt = 0;
    $.each(estData.services, function(serviceType, service) {
        insStr += "<h3>" + serviceType + "</h3>"; 
        $.each(service.inspections, function(i, inspection) {
            insStr += "<div class='row'><div class='col-md-11 col-md-offset-1'>";
            insStr += "<img src='" + statusIcons[inspection.statusCd].small + "' alt='" + inspection.status + "'>";
            insStr += "Inspection  Date: " +  inspection.date + " (" + inspection.status + ")";
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
            insStr += "</div></div>"; //finish row
            
        });
    });
    //statusIcons
      $("#inspections").html(insStr);

}

function showInspectionDetails (estId) {
    console.log('showInspectionDetails (estId) ' + estId );

  var url = DETAIL_URL  + estId;
    console.log(url);
    $.ajax({
        type: 'GET',
        url: url,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
            //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
            if (data.length !== 0) {  // if length is zero, then service is down, or a problem exist.. don't try to create modal
                //TODO: tHIS IS BECAUSE OF BUG IN detail feed
                data.estStatusCd = "PASS";
                if (data[0].estStatusColor === "yellow") data.estStatusCd = "COND";
                if (data[0].estStatusColor === "red") data.estStatusCd = "FAIL";
                setupDetailsModal(data);
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

/* TODO: unlike DIneSaFE.. There is no lastInspection on the general API feed used in KML -- maybe get it added for consistency*/

function createInfoWindow(KMLEvent_latLng, infoData) {
    console.log('createInfoWindow(KMLEvent_latLng, infoData) ' + KMLEvent_latLng +  ' - ' +  infoData );
    CommonInfoWindow.close();
    //$("#map-loader").hide();

    var content = "<div class='content infoDiv'>";
    //if (infoData.establishments.length === 1) {
    //    content += "<div class='row infoRow'>" ; 
    //    content += "<div class='col-md-12'><img src='" + statusIcons[infoData.establishments[0].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant'><a href='#' data-id='" + infoData.establishments[0].estId + "'onclick='showInspectionDetails("+ infoData.establishments[0].estId + ")'>" + infoData.establishments[0].name + "</a></span></div>";
    //    content += "</div>";
    //    content += "<div class='row infoRow'><div class='col-md-offset-1 col-md-12'>" + infoData.address + "</div></div>";
    //    content += "<a class='svLink' ref='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div></div>";
    //} else {
        //content += "<div class='row infoRow'>" ;
        content += "<div class='row infoRow'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
        if (infoData.establishments.length > 1) {
            content += "<div class='row infoRow infoHeader'><div class='col-md-12'>" + infoData.establishments.length + " establishments at this address</div></div>";
        }
        for (var i = 0; i < infoData.establishments.length; i++) {
            content += "<div class='row infoRow'><div class='col-md-12'><img src='" + statusIcons[infoData.establishments[i].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant'><a onclick='showInspectionDetails(" + infoData.establishments[i].estId + ")' href='#'>" + infoData.establishments[i].name + "</a></span></div></div>";
        }
        content += "<div class='row infoRow'><div class='col-md-10'><a class='svLink' href='#' onclick='switchToStreetView(\"" + KMLEvent_latLng + "\")'><img src='" + streetViewIcon + "' alt='StreetView'></a></div></div>";
        
    //}  
    content += "</div>";    
    CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
        "pixelOffset": 0,  //KMLEvent.pixelOffset,
        "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
    CommonInfoWindow.open(gblMap);
}

function mergeLocations(data) {
    console.log('mergeLocations(data) ' + data );
    var locations = {};
        
      for( var n = 0; n < data.length; n++ ) {
    
        var adr = data[n].addressMain ;
        adr += (data[n].addressUnit !== 'null') ? "" : data[n].addressUnit;
    
        var oData = {
            estId: data[n].estId,
            name: data[n].estName,
            address: adr,
            //lastInspected: aData[n].lastInspectionDate || null,
            lat: ( +data[n].lat ),
            lng: ( +data[n].lon ),
            latlng: ( +data[n].lat ) + "," +  ( +data[n].lon )
            };

        if( !locations[ oData.latlng ] )
            locations[ oData.latlng ] = {
                address: oData.address,
                lat: oData.lat,
                //latlng: oData.latlng,
                lng: oData.lng,
                establishments: []
        };
                
        locations[ oData.latlng ].establishments.push( {
            estId: oData.estId,
            name: data[n].estName,
            status: data[n].estStatusCd
            } );
  }
  
    return locations;
    
}

function clearMarkers(markers) {
    console.log('clearMarkers(markers) ' + markers );
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}


function plotMarkers(data) {
    console.log('plotMarkers(data) ' + data );
    //console.log("plotMarkers")
    var locations = mergeLocations(data);
    gblMapMarkers = [];
    Object.keys(locations).forEach(function(key, idx, array) {
                    
        var location = locations[key];
                    
        var latlng = new google.maps.LatLng( location.lat, location.lng );
        var imageVal = 1;
        var imageIndex = "PASS";
        for (var i = 0; i < location.establishments.length; i++){
            if (markerImages[location.establishments[i].status].value > imageVal) {
                imageVal = markerImages[location.establishments[i].status].value;
                imageIndex = location.establishments[i].status;
            }
        }
        if ( location.establishments.length > 1 ) {
            imageIndex = "multi";
        }
        var title = ( location.establishments.length > 1 ) ? location.establishments.length + ' Establishments' : location.establishments[0].name;
                
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            location: location,
            icon: markerImages[imageIndex].icon,
            title: title
        });
        marker.addListener('click', function () {
            var locData = this.location;
            createInfoWindow(this.position , locData);
        });

        gblMapMarkers.push(marker);
        });
   if ( gblMarkerCluster ) {
        gblMarkerCluster.clearMarkers();
    }
    gblMarkerCluster = new MarkerClusterer(gblMap, gblMapMarkers, { ignoreHidden: true , minimumClusterSize : 2, imagePath : CLUSTER_IMAGES , maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH});//,{
    shellCluster('hide');
        
    gblNeedToRedrawMap = false;
	console.log('plot marker finsihed -seting zoomn level to 11');
    gblMap.setZoom(RESET_ZOOM_LEVEL);
    
    $("#mapLoader").modal('hide');
}

function toggleKMLLayer() {
    console.log('toggleKMLLayer() ');
    //console.log("toggleKMLLayer")
    gblKMLLayer.setMap( gblKMLLayer.getMap() ? null : gblMap );
}

function plotMarkerShells(data) {
    console.log('plotMarkerShells(data) ' + data );
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
    gblShellCluster = new MarkerClusterer(gblMap, gblMapMarkerShells, { ignoreHidden: true , minimumClusterSize : 1, imagePath :  CLUSTER_IMAGES, maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH });//,{
    // We create them, but hide them and they wil show on the correct zoom level
	shellCluster('hide');

}
function loadSearchData() {
    console.log('loadSearchData() ');
    var url = SEARCH_URL + "&row_start=0&row_count=10000";
    $.ajax({
        type: 'GET',
        url: url,
        cache: true,
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

//This URL is smaller than the other data URL and we don't page with it, so it gets more data.
function redrawMap() {
    console.log('redrawMap() ');

    var searchURLAdd = determineSearchParms();
    //alert('redraw map');
    //$("#map-loader").show();
    $("#mapLoader").modal('show');
    gblMapSrc = 'Markers';
    gblKMLLayer.setMap( null );
    clearMarkers(gblMapMarkers);
    var url = SEARCH_URL + searchURLAdd.urlParms + "&row_start=0&row_count=10000";
    console.log(url);
    $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        cache: true,
        dataType: 'jsonp',
        //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
            plotMarkers(data);
            //$("#map-loader").hide();
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        }); 
    
}

function resetMapToKML() {
    console.log('resetMapToKML() ');
    if (gblMapSrc != 'KML') {
        clearMarkers(gblMapMarkers);
        markerCluster('hide');        
        gblKMLLayer.setMap(  gblMap );
        gblMapSrc = 'KML';
        gblMap.setZoom(gblMap.getZoom());
    }
    //
}
function resetMap() {
    console.log('resetMap() ');
    gblMap.setZoom(RESET_ZOOM_LEVEL);
    gblMap.setCenter(MAP_CENTER);
    CommonInfoWindow.close();
    clearMarkers(gblPlacesMarkers);
    $("#map-input").val("");
    
}

function shellCluster(showHide) {
    console.log('shellCluster(showHide) ' + showHide );
	console.log("shellcluster" + showHide);
    setCluster(gblShellCluster, gblMapMarkerShells,showHide);  
}
function markerCluster(showHide) {
    console.log('markerCluster(showHide) ' + showHide );
    console.log("markercluster" + showHide);
    setCluster(gblMarkerCluster, gblMapMarkers, showHide);    
}


function setCluster(cluster, markers, flag) {
    console.log('setCluster(cluster, markers, flag) ' + cluster +  ' - ' +  markers +  ' - ' +  flag );
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
/**
 * loadKmlLayer()
 */
function loadKmlLayer() {
    console.log('loadKmlLayer() ');
    console.log("loadKmlLayer");
    gblKMLLayer = new google.maps.KmlLayer(KML_MASTER, {
    suppressInfoWindows: true,
    preserveViewport: true,
//     pane: "floatPane",
    map: gblMap
  });
  
  gblKMLLayer.set('preserveViewport', true); 
  google.maps.event.addListener(gblKMLLayer, 'click', function(event) {
    //console.log(event.featureData.info_window_html);
    // $("#map-loader").show();
    var locData = $.parseJSON(event.featureData.info_window_html);
    createInfoWindow(event.latLng, locData);   
    //event.preventDefault();
  });
  
    google.maps.event.addListener(gblKMLLayer, 'status_changed', function () {
    if (gblKMLLayer.getStatus() == google.maps.KmlLayerStatus.OK) {
       $("#mapLoader").modal('hide');
       //$("#map-loader").hide();
    }
    else { alert('kmlLayer load failed');  }
});  
}
function setupMapSearchBox() {
    console.log('setupMapSearchBox() ');
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
    console.log('initMap() ');
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
            //setCluster(gblShellCluster, gblMapMarkerShells, 'hide');           
        } else if(gblMap.getZoom() >= CLUSTER_TO_KML_ZOOM_SWITCH) {
            gblKMLLayer.setMap(  gblMap );
            markerCluster('hide');
            shellCluster('hide');
            //setCluster(gblShellCluster, gblMapMarkerShells, 'hide');
            //setCluster(gblMarkerCluster, gblMapMarkers, 'hide');            
        } else {
            gblKMLLayer.setMap(  null );
            shellCluster('show');
            //setCluster(gblShellCluster, gblMapMarkerShells,'show');
        }
        CommonInfoWindow.close();
    });
    loadKmlLayer();
    
    var resetBTN = document.getElementById('resetMap');
    resetBTN.onclick = function () { resetMap();};
    gblMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(resetBTN);
    
    setupMapSearchBox();    
        
    gblMap.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        document.getElementById('legend'));   

    //TODO: Keep this in? you might be able to determine a phone and zoom to user's location.. navigator has some attributes.. user-agent etc.
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

/* listing related functions --------------------------------------------------------- */


/*This for paging when searching... and when "ShowListingOnMap"
  The funky key on the facData is for easy sorting.
*/

function savePageData( data) {
    console.log('savePageData( data) ' + data );
    
    gblFacData = {};
    gblEstIdMap = {};
    var facCnt = 0;
    
    $.each(data, function(i, item) {
        var objKey = item.estName + item.estId;
        if (!gblFacData[objKey]) {
            facCnt++;
            gblFacData[objKey] = { 
                estId : item.estId,
                lat: item.lat,
                lon : item.lon,
                addressFull: item.addressFull,
                estName: item.estName,
                estStatusCd: item.estStatusCd,
                services : []
            };           
        }
        //TODO: feed is missing inspection code.. so fake it for now.
        var  insStatus = "PASS";
        if (item.inspectionStatusText === 'Conditional') insStatus = "COND";
        if (item.inspectionStatusText === 'Closed') insStatus = "FAIL";
        gblFacData[objKey].services.push( {serviceTypeDesc : item.serviceTypeDesc, status: insStatus, statusText: item.inspectionStatusText});
        gblEstIdMap[item.estId] = objKey;
    });
    gblFacDataCnt = facCnt;
 
    
}

/* when you get the search data, also do a pagelisting which is needed but must wait for the data */
function getSearchData(srch) {
    console.log('getSearchData(srch) ' + srch );
    //var srch = determineSearchParms();
    var searchUrl = DATA_URL + srch.urlParms + "&row_start=" + nextRow + "&row_count=9999";//+ rowsPerPage;
    $.ajax({
        type: 'GET',
        url: searchUrl  ,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            savePageData(data);
            nextRow = 0;
            $('#numberPageSelection').bootpag({page: 1});
           
            generatePageListing();
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        });
    
}
/* if we are an alphalisting, go to the back end to get data
    if we are numeric, data should have been read into memory already
*/

function getAlphaPage(srch) {
    console.log('getAlphaPage(srch) ' + srch );
    $("#listLoader").modal('show');
    var searchUrl = DATA_URL + srch.urlParms + "&row_start=0&row_count=99999&facility_name_initial=" + gblCurrentAlphaPage;
    $.ajax({
        type: 'GET',
        url: searchUrl  ,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        //beforeSend: function(xhr){ xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);},
        success: function (data) {
            savePageData(data);
            loadListView(gblFacData);
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
        });
}

function getNumericPage() {
    console.log('getNumericPage() ');
    
    var endRow = nextRow + rowsPerPage - 1;
    var pageData = {};
    var rowcnt=0;
    Object.keys(gblFacData).forEach(function(key, idx, array) {
        if (rowcnt >= nextRow  && rowcnt <= endRow) {
            pageData[key] = gblFacData[key];
        }
        rowcnt++;
    });
 
    setPageStatus(nextRow, endRow, gblFacDataCnt);
    loadListView(pageData);
}
function generatePageListing() {
    console.log('generatePageListing() ');
    
    //$("#list-loader").show();
    
    CommonInfoWindow.close();
    gblFilteredFacilities = [];
   // var endRow = nextRow + rowsPerPage - 1;
    
    var srch = determineSearchParms();
    
    if (gblPagingMethod === ALPHA_PAGING_METHOD) {
       getAlphaPage(srch);
       resetMapToKML();   
    } else {        
        getNumericPage();
    }
}


function showLinkOnMap(estId, lat,lng) {
    console.log('showLinkOnMap(estId, lat,lng) ' + estId +  ' - ' +  lat +  ' - ' + lng );

    var panorama = gblMap.getStreetView();
    if(panorama.getVisible() ) {
        panorama.setVisible(false);
    }
    var latLng = new google.maps.LatLng(lat,lng);
    gblMap.setZoom(CLUSTER_TO_KML_ZOOM_SWITCH + 1);
    gblMap.setCenter( latLng );
    
    var estData = gblFacData[gblEstIdMap[estId]];
    estData.establishments = [{estId : estData.estId, name: estData.estName, status : estData.estStatusCd}];
    estData.address = estData.addressFull;
    createInfoWindow(latLng, estData ); 

}

/* so technically we are not get a pageisze of facilities, but a pagiesiz of services.. due to the api) */
function loadListView(facData) {
    console.log('loadListView(facData) ' + facData );

    var strRows = "";

    var listingBody = $("#safetable").find("tbody");
    //listingBody.html("");
     Object.keys(facData).forEach(function(key, idx, array) {
        var facility = facData[key];
    
        strRows += "<tr id='dinerow" + idx + "'>";
        //strRows += "<td style='text-align:center' class='col-md-1'></td>";
        strRows += "<td class='col-md-5'><img class='liStatusIcon' src='" + statusIcons[facility.estStatusCd].large + "'><a href='#' onclick='showLinkOnMap("+ facility.estId + "," + facility.lat + "," + facility.lon + ")'>" + facility.estName + "</a></td>" ;
        strRows += "<td class='col-md-4'>" + facility.addressFull + "</td>" ;
        strRows += "<td class='col-md-3'><table class='serviceTbl'><tbody>";
        
        $.each(facility.services, function(sidx, service) {

            //strRows +=  "<tr><td><img class='liStatusIcon' src='" + statusIcons[service.status].small + "' alt='" + service.statusText + "'>" + service.serviceTypeDesc + "</td></tr>" ;
            strRows +=  "<tr><td><img src='" + statusIcons[service.status].small + "'>" + service.serviceTypeDesc + "</td><td class='liServiceStatusText'>" + service.statusText + "</td></tr>" ;
        });
        strRows += "</tbody></table></td></tr>";
        //$("#safetable tbody").append(strRows);
    });
    
    strRows = (strRows ==="") ? "<tr><td colspan='4' class='NoData'>No Establishment found, check search options and try again</td></tr>" : strRows;
    listingBody.html(strRows); //.trigger('update');
    //$("#list-loader").hide();
    $("#listLoader").modal('hide');
/*  
    var $table = $("#safetable").tablesorter(
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
        */
}

function setPaging(mode, startLetter) {
    console.log('setPaging(mode, startLetter) ' + mode +  ' - ' +  startLetter );
	//var oldMode = gblPagingMethod;
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
		//if (mode !== oldMode) {
		//	shellCluster('show');
		//	markerCluster('hide');
		//}
    }
}

//If the user hasn't selected anythiung.. then don't do search per say..do alpha-0
function doSearch() {
    console.log('doSearch() ');
    console.log("DoSearch");
    $("#listLoader").modal('show');
    var srch = determineSearchParms();
    if (srch.urlParms ===gblDefaultAllSearchParms.urlParms) { 
        showAlphaPage('0');
    } else {
		/* set paging here, in-case map draws first */
        gblNeedToRedrawMap = true;
        setPaging(NUMERIC_PAGING_METHOD);
        getSearchData(srch);
		redrawMap();
    }
    /*
    gblNeedToRedrawMap = true;
    nextRow = 0;
    setPaging('Numeric');
    $('#numberPageSelection').bootpag({page: 1});
    generatePageListing();
    */
}

function initFilter(filter, data, keyfld, valuefld) {
    console.log('initFilter(filter, data, keyfld, valuefld) ' + filter +  ' - ' +  data +  ' - ' +  keyfld +  ' - ' +  valuefld );
    
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

function setUpEvents() {
    console.log('setUpEvents() ');
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
        generatePageListing();
    });
    
    $("#pageSize").multiselect({
        onChange: function(option, checked, select) {
            rowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            nextRow = 0;
            generatePageListing();
        }
    });
 
    
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
        showAlphaPage('0');
    }); 
    
     $("#maincontent").on("click",".available a", function() {
        showAlphaPage($(this).text().substring(0,1));
        return false;
    });
}

function showAlphaPage(alpha) {
    console.log('showAlphaPage(alpha) ' + alpha );
    setPaging(ALPHA_PAGING_METHOD,alpha);
    generatePageListing();
}

function processAlphaCounts(data) {
    console.log('processAlphaCounts(data) ' + data );

    var alphaPages = $("#alphaPagination");
    var total = 0;
    var numberTotal = 0;
    var foundStartIdx = "";

        
    for (var i = 0; i < data.length; i++) {
        var count        = data[i].count;
        var fnameInitial = data[i].fnameInitial;    
        var charCode     = fnameInitial.charCodeAt(0);
        total = total + count;
        if (total > 0 && foundStartIdx === "") {
            foundStartIdx = fnameInitial;
        }
            
        if (charCode >= 65 && charCode <= 90) {
            alphaPages.children('li').eq(charCode - 64).addClass('available').find('.found').html(count);
        } else {
            numberTotal = numberTotal + count;
        }
    }        
    if (numberTotal > 0) {
        alphaPages.children('li').eq(0).addClass('available').find('.found').html(numberTotal);
        foundStartIdx = "0";
    }
        
    if (total == 1) {
        $("#srchResults").html(total + ' Establishment Found');
    } else {
        $("#srchResults").html(total + ' Establishments Found');
    }
    showAlphaPage(foundStartIdx);
}
function determineAlphaCounts() {
    console.log('determineAlphaCounts() ');
    var srch = determineSearchParms();
    console.log(srch.urlParms);
   $.ajax({
        type: 'GET',
        url: ALPHA_COUNT_URL + srch.urlParms,
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

/* after we set up ther filters, we get the listing data since the listing routing looks at existing search parms*/
function setupFilters() {
    console.log('setupFilters() ');

    var promises=[];    
    var request1 = $.ajax({
        type: 'GET',
        url: SERVICE_TYPE_URL,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            gblTypeData = data;
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    promises.push( request1);
    var request2 = $.ajax({
        type: 'GET',
        url: STATUS_URL,
        cache: true,
        sync: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            gblStatusData = data;
           
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    promises.push( request2);

    //$("#wardFilter").multiselect({
    //    includeSelectAllOption: true,
    //    buttonWidth: '100%'            
    //}); 
    $('.input-daterange').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true
    }); 
    
    $.when.apply(null, promises).done(function(){
        initFilter( $("#serviceTypeFilter"), gblTypeData, "serviceTypeCode", "serviceTypeDesc");
        initFilter( $("#statusFilter"), gblStatusData, "estStatusCd", "estStatusDesc");
        
        
        gblDefaultAllSearchParms = determineSearchParms();
        $("#listLoader").modal('show'); //show we are actually getting the listing as we are initializing.
        determineAlphaCounts();
   });    
   
}

function initApp() {
    console.log('initApp() ');

    $("#mapLoader").modal('show');
    //$("#map-loader").show();
    initMap();
    loadSearchData(); //the url here is bad. we need a more effiecient one.
    setupFilters();
    setUpEvents();
      
    //var $table = $('table').tablesorter();
}

/* we load all css/js for all 3 forms here*/
function loadPage() {
    console.log('loadPage() ');
    var strCode="";
    if (document.location.hostname.length === 0) {
        statusIcons = { 
            "PASS" : { large: "images/map/pass_large.png", medium: "images/map/pass_small.png",small: "images/map/marker_pass.png"},
            "COND" : { large: "images/map/conditional_large.png", medium: "images/map/conditional_small.png",small: "images/map/marker_conditional.png"},
            "FAIL" : { large: "images/map/close_large.png", medium: "images/map/close_small.png",small: "images/map/marker_close.png"}
            };
        markerImages = { 
            'multi': {icon: 'images/map/marker_multi.png', value : 4},
            'PASS' : {icon:'images/map/marker_pass.png', value : 1},
            'COND' : {icon:'images/map/marker_conditional.png', value : 2},
            'FAIL' : {icon:'images/map/marker_close.png', value : 3}
            };
        CLUSTER_IMAGES = 'images/mc';           
        streetViewIcon ='images/map/streetView.png';
        inspectionsIcon ='images/map/inspections.png';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        //strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';
        //strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        //strCode = '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        //strCode += '<link rel="stylesheet" href="css/dineSafe.css">';
        strCode += '<link rel="stylesheet" href="css/bodySafe.css">';
        //strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += ' <script type="text/javascript" src="js/markerclusterer.min.js"></script>';     
        //strCode += ' <script type="text/javascript" src="js/bootstrap-waitingfor.min.js"></script>';     
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('html/bodySafeListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        //strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        //strCode = '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        //strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/dineSafe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/safe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/BodySafe/css/bodySafe.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        //strCode += '<script type="text/javascript" src="//maps.googleapis.com/maps/api/js?v=3&libraries=places"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/placeholders.jquery.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
        strCode += ' <script type="text/javascript" src="/static_files/assets/GMap/markerclusterer.min.js"></script>';
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('/static_files/WebApps/Health/BodySafe/html/bodySafeListing.html', function() {initApp();});
        //$("#appDisplayMap").load('/4_DineSafe/html/dineSafeListing.html', function() {initApp();});
    }

}
$( document ).ready(function() {

    loadPage();
});

