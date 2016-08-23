/**
 * @fileoverview 
 * Map operates in two way.  the map is loaded with KML layers generated at google in a google drive account using google script
 * If a search is performed, the KMLLayer is removed and mapMarkers of the search are added.. This is slower ..
 */
/*

alt tag on img -- not all done.. is done in modal..
               
DIneSafe Difference
1) Body Safe doesn't page per say.. it does it by alpha.. so we don't know total records. IT IS HARD CODE AT 5000.. COULD (1) depends on paging..
2) There is no historical/history select.. 
3) search can only be done with "apply".. send flag to redraw map then?
4) not specifying parameters is not same as selecting all.

Notes:  Seems to be a bug in clusterer.. if you hit reset map twice in a row.. the re-clustering doesn't seem to work

2) Out paging is actually 1- based.. so check intoi the code on this.
     
*/
 (function (window, undefined) {
   'use strict';
   
var randKey =  (new Date()).valueOf();
var KML_MASTER = 'https://docs.google.com/uc?id=0B-j2Y49nfiw2MGY3X190bGVsV2c&rand=' + randKey;  //Can't use just "//" here..
var DETAIL_URL = "//app.toronto.ca/opendata/tphir/pss_insp_details.json?v=1&callback=?&est_id=";
var DATA_URL = '//app.toronto.ca/opendata/tphir/pss_est_list.json?v=1';
var SEARCH_URL = "//app.toronto.ca/opendata/tphir/pss_est_map.json?v=1&callback=?";
var ALPHA_COUNT_URL = '//app.toronto.ca/opendata/tphir/pss_est_initial_count.json?v=1&callback=?';

var SERVICE_TYPE_URL = '//app.toronto.ca/opendata/tphir/pss_srvc_types.json?v=1&callback=?';
var STATUS_URL = '//app.toronto.ca/opendata/tphir/pss_est_status.json?v=1&callback=?';

var gblTotalEstablishments;
var gblStatusData;
var gblTypeData;

var gblRowsPerPage = 10;
var gblNextPage = 0;
var gblCurrentAlphaPage = '0';
var ALPHA_PAGING_METHOD = 'Alpha';
var NUMERIC_PAGING_METHOD = 'Num';
var gblPagingMethod = ALPHA_PAGING_METHOD;

var CommonInfoWindow = new google.maps.InfoWindow();
var statusIcons = { 
            "PASS" : { large: "/static_files/WebApps/Health/safe/images/pass_large.png", medium: "/static_files/WebApps/Health/safe/images/pass_small.png",small: "/static_files/WebApps/Health/safe/images/pass_circle.gif"},
            "COND" : { large: "/static_files/WebApps/Health/safe/images/conditional_large.png", medium: "/static_files/WebApps/Health/safe/images/conditional_small.png",small: "/static_files/WebApps/Health/safe/images/conditional_circle.gif"},
            "FAIL" : { large: "/static_files/WebApps/Health/safe/images/closed_large.png", medium: "/static_files/WebApps/Health/safe/images/closed_small.png",small: "/static_files/WebApps/Health/safe/images/closed_circle.gif"}
            };
/*
var markerImages = { 
            'multi': {icon: '/static_files/WebApps/images/marker_dot_multi.png', value : 4},
            'PASS' : {icon: '/static_files/WebApps/images/marker_dot_pass.png', value : 1},
            'COND' : {icon: '/static_files/WebApps/images/marker_dot_conditional.png', value : 2},
            'FAIL' : {icon: '/static_files/WebApps/images/marker_dot_closed.png', value : 3}
            };
*/
var markerImages = { 
            'multi': {icon: '/static_files/WebApps/Health/safe/images/s_multi.png', value : 4},
            'PASS' : {icon: '/static_files/WebApps/Health/safe/images/s_pass.png', value : 1},
            'COND' : {icon: '/static_files/WebApps/Health/safe/images/s_conditional.png', value : 2},
            'FAIL' : {icon: '/static_files/WebApps/Health/safe/images/s_closed.png', value : 3}
            };
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
var gblEstIdMap;
var gblFacDataCnt;
//We need to send all the default parameters (all the types, and statuses).. 
var gblDefaultAllSearchParms;


/*----------------------------------------------------------------------------------*/
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



function resetAdvancedFilters() {
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
    //$("#dateFrom").val("");
    //$("#dateTo").val("");
    //$("#wardFilter").val("0");
    //$("#wardFilter").multiselect('refresh');
    //$("#incHistory").prop('checked', false);
}


function resetFilters() {
    CommonInfoWindow.close();   
    resetAdvancedFilters();
    $(".searchString").each(function( index ) { 
        $(this).val("");
		$(this).next('.clearer').hide();
    });

}

//This api use "." not comma as parameter seperators
function decodeMultSelection(domId) {
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
    //if ($("#incHistory").prop('checked')) {
    //     searchURLAdd += "&checkInspectionHistory=true";
    //     search = true;
    //}
    
    /* this isn't working, but leave in for now API missing it.*/
    //var dateFrom = $("#dateFrom").val(); 
    //var dateTo = $("#dateTo").val();
    //if (dateFrom !== "") {
    //    searchURLAdd += "&earliest=" + moment(dateFrom).format(TPH_API_DATE_FORMAT);
    //    search = true;
    //}    
    //if (dateTo !== "") {
    //    searchURLAdd += "&latest=" + moment(dateTo).format(TPH_API_DATE_FORMAT);
    //    search = true;
    //}
 
    return { filtersApplied: search, urlParms: searchURLAdd};
}


/* Map Related Functions ---------------------------------------------------------------------------------*/

//Details are for establishments. Infractions and actions are single strings (unlike dine safe
//look for fine and converiuonDate. can be multiple record per date.
function reorgDetails (data) {
    
    var estData = {};
    estData.estId = data[0].estId;
    estData.estName = data[0].estName;
    estData.estStatusCd = data.estStatusCd;//TODO.. fix this when api is fixed
    estData.address = data[0].addressFull;
    estData.services = {};
    $.each(data, function(i, item) {
        if (!estData.services[item.serviceTypeDesc]) {
            estData.services[item.serviceTypeDesc] = {
                inspections : {}
            };
        }
        
        var insObj = {date: item.inspectionDate, status: item.inspectionStatusText, statusCd : item.inspectionStatusCd,infractions : []};
        if (!estData.services[item.serviceTypeDesc].inspections[item.inspectionDate]) {
            estData.services[item.serviceTypeDesc].inspections[item.inspectionDate] = insObj;
        } 
        //estData.services[item.serviceTypeDesc].inspections[item.inspectionDate] = insObj;
        /* for passed items.. all of these will be null */
        if (item.infractionTypeDesc !== null) {
            estData.services[item.serviceTypeDesc].inspections[item.inspectionDate].infractions.push( {
                infraction: item.infractionTypeDesc,
                action: item.actionDesc,
                amountFined: item.amountFined,
                outcome: item.outcome,
                convictionDate: item.convictionDate
            });
        }
       // estData.services[item.serviceTypeDesc].inspections.push( {
       //     date : item.inspectionDate,
       //     status : item.inspectionStatusText,
       //     statusCd : item.inspectionStatusCd,
       //     infraction: item.infractionTypeDesc,
       ///     action: item.actionDesc,
       //     amountFined: item.amountFined,
        ///    outcome: item.outcome,
        //    convictionDate: item.convictionDate
            
       // });
    });
 
    return estData;
}

/* do we want background colors of red. and yellow for infractions -- see ddinesage)*/

function setupDetailsModal(data) {
    var estData = reorgDetails(data);

    $("#estName").text(estData.estName);
    $("#estAddress").text(estData.address);
    $("#imgStatus").attr("src", statusIcons[estData.estStatusCd].large) ;
    var insStr = "";
    var inscnt = 0;
    $.each(estData.services, function(serviceType, service) {
        insStr += "<h3>" + serviceType + "</h3>"; 
        $.each(service.inspections, function(i, inspection) {
            inscnt++;
            insStr += "<div class='row'><div class='col-md-11 col-md-offset-1'>";
            insStr += "<img src='" + statusIcons[inspection.statusCd].small + "' alt='" + inspection.status + "'>";
            insStr += "Inspection  Date: " +  inspection.date + " (" + inspection.status + ")";
            if (inspection.infractions.length > 0) {
                insStr += "<a class='detaiLink' href='#inspection_" + inscnt + "' data-toggle='collapse'>Infractions</a></div>";
                insStr += "<div id='inspection_" + inscnt + "' class='infractionDetails  collapse'>";
            }
            $.each(inspection.infractions, function(i, infraction) {
                insStr += "<div class='row'><div class='col-md-10 col-md-offset-2'>";
                insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Description: </span>" + infraction.infraction + "</div>";
                insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Action: </span>" + infraction.action + "</div>";
                if (infraction.convictionDate !== null) {
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Outcome Date: </span>" + infraction.convictionDate + "</div>";
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Outcome: </span>" + infraction.outcome + "</div>";
                    insStr += "<div class='col-md-12'><span class='modalFieldLabel'>Amount Fined: </span>" + infraction.amountFined + "</div>";
                
                }
                insStr += "</div></div>";  //infreaction row.
            });           
            insStr += "</div>"; //end of infraction detail
            insStr += "</div></div>"; //finish row
            
        });
    });
    $("#inspections").html(insStr);

}

function showInspectionDetails (estId) {

    var url = DETAIL_URL  + estId;
    $.ajax({
        type: 'GET',
        url: url,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
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

/* TODO: unlike DIneSaFE.. There is no lastInspection on the general API feed used in KML -- maybe get it added for consistency
Why do anything special for multi.. put address first regardless.
*/

function createInfoWindow(KMLEvent_latLng, infoData) {
    CommonInfoWindow.close();
    //$("#map-loader").hide();

    var content = "<div class='content infoDiv'>";
    if (infoData.establishments.length > 1) {
        content += "<div class='row infoRow'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
        content += "<div class='row infoRow infoHeader'><div class='col-md-12'>" + infoData.establishments.length + " establishments at this address</div></div>";
    } else {
        content += "<div class='row infoRow infoHeader'><div class='col-md-12'><span class='infoImportant'>" + infoData.address + "</span></div></div>";
            
    }
    for (var i = 0; i < infoData.establishments.length; i++) {
        content += "<div class='row infoRow'><div class='col-md-12'><img src='" + statusIcons[infoData.establishments[i].status].medium + "'>&nbsp;&nbsp;<span class='infoImportant orgLink'><a href='#' data-id='" + infoData.establishments[i].estId + "'>" + infoData.establishments[i].name + "</a></span></div></div>";
        }
    content += "<div class='row infoRow'><div class='col-md-12'><a  class='svLink' href='#' data-latlng='" + KMLEvent_latLng + "'><img src='" + STREET_VIEW_ICON + "' alt='StreetView'></a></div></div>";
        
    //}  
    content += "</div>";    
    CommonInfoWindow.setOptions({ "position": KMLEvent_latLng,
        "pixelOffset": 0,  //KMLEvent.pixelOffset,
        "content": content}); //KMLEvent.featureData.infoWindowHtml.replace(/ target="_blank"/ig, "") });
    CommonInfoWindow.open(gblMap);
}

function mergeLocations(data) { /*ignore parms*/
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
            lon: ( +data[n].lon ),
            latlng: ( +data[n].lat ) + "," +  ( +data[n].lon )
            };

        if( !locations[ oData.latlng ] )
            locations[ oData.latlng ] = {
                address: oData.address,
                lat: oData.lat,
                //latlng: oData.latlng,
                lon: oData.lon,
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

function clearMarkers(markers) { /*ignore parms*/
    for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(null);
    }
    markers = [];
}

function plotMarkers(data) { /*ignore parms*/
    var bounds = new google.maps.LatLngBounds();
    var locations = mergeLocations(data);
    gblMapMarkers = [];
    Object.keys(locations).forEach(function(key, idx, array) {      
        
        var location = locations[key];
        var latlng = new google.maps.LatLng( location.lat, location.lon );
        bounds.extend(latlng);  
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
    gblMarkerCluster = new MarkerClusterer(gblMap, gblMapMarkers, { title : 'locations', averageCenter : true, ignoreHidden: true , minimumClusterSize : 2, imagePath : CLUSTER_IMAGES , maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH});//,{
    shellCluster('hide');
        
    if (data.length > 0) {
        gblMap.fitBounds(bounds);
    }
    
    $("#mapLoader").modal('hide');
}

function toggleKMLLayer() {
    gblKMLLayer.setMap( gblKMLLayer.getMap() ? null : gblMap );
}

/* do I want to actually merge locations? if i do, the the cluster show location and not establishment counts 
but when I plot markers on the search, I actually use those markers, so we need to merge the locations.
*/
function plotMarkerShells(data) { /*ignore parms*/
    gblMapMarkerShells = [];
    var locations = mergeLocations(data);
    Object.keys(locations).forEach(function(key, idx, array) {
    //for( var i = 0; i < data.length; i++ ) {
        //var location = data[i];         
        var location = locations[key];
        var latlng = new google.maps.LatLng( location.lat, location.lon );
        var imageVal = 1;
        var imageIndex = "PASS";
        for (var i = 0; i < location.establishments.length; i++){
            if (markerImages[location.establishments[i].status].value > imageVal) {
                imageVal = markerImages[location.establishments[i].status].value;
                imageIndex = location.establishments[i].status;
            }
        }
                
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            icon: markerImages[imageIndex].icon
            });
        gblMapMarkerShells.push(marker);
    });
    //}
     if ( gblShellCluster ) {
        gblShellCluster.clearMarkers();
     }
    gblShellCluster = new MarkerClusterer(gblMap, gblMapMarkerShells, { title : 'locations', averageCenter : true,ignoreHidden: true , minimumClusterSize : 1, imagePath :  CLUSTER_IMAGES, maxZoom : CLUSTER_TO_KML_ZOOM_SWITCH });//,{
    // We create them, but hide them and they will show on the correct zoom level
    shellCluster('hide');

}
function loadShellMarkerData() {
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
            bootbox.alert("An error has occured. Please try again.");
            console.log(xhr.status);
            console.log(thrownError);
        }
    }); 
}

//This URL is smaller than the other data URL and we don't page with it, so it gets more data.
function redrawMap() {

    var searchURLAdd = determineSearchParms();
    $("#mapLoader").modal('show');
    gblMapSrc = 'Markers';
    gblKMLLayer.setMap( null );
    clearMarkers(gblMapMarkers);
    var url = SEARCH_URL + searchURLAdd.urlParms + "&row_start=0&row_count=10000";
    //console.log(url);
    $.ajax({
        type: 'GET',
        url: url,
        crossDomain: true,
        cache: true,
        dataType: 'jsonp',
        success: function (data) {
            plotMarkers(data);
            },
        error: function (xhr, ajaxOptions, thrownError) {
            $("#mapLoader").modal('hide');
            bootbox.alert("An error has occured. Please try again.");
            console.log(xhr.status);
            console.log(thrownError);
            }
        }); 
    
}

function resetMapToKML() {
    if (gblMapSrc != 'KML') {
        clearMarkers(gblMapMarkers);
        markerCluster('hide');        
        gblKMLLayer.setMap(  gblMap );
        gblMapSrc = 'KML';
        //gblMap.setZoom(gblMap.getZoom());
        resetMap();
        setTotalDisplay(gblTotalEstablishments);
    }
}
function resetMap() {
    gblMap.setZoom(RESET_ZOOM_LEVEL);
    gblMap.setCenter(MAP_CENTER);
    CommonInfoWindow.close();
    clearMarkers(gblPlacesMarkers);
    $("#map-input").val("");
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
        //console.log("repaint:" + cluster);
        cluster.repaint();
        google.maps.event.trigger(gblMap,'resize');
    }
}
/**
 * loadKmlLayer()
 */
function loadKmlLayer() {
    gblKMLLayer = new google.maps.KmlLayer(KML_MASTER, {
    suppressInfoWindows: true,
    preserveViewport: true,
//     pane: "floatPane",
    map: gblMap
  });
  
  gblKMLLayer.set('preserveViewport', true); 
  google.maps.event.addListener(gblKMLLayer, 'click', function(event) {
    //console.log(event.featureData.info_window_html);
    var locData = $.parseJSON(event.featureData.info_window_html);
    createInfoWindow(event.latLng, locData);   
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
        //console.log("Zoom Event:" + gblMap.getZoom() + " " + gblPagingMethod);
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
    
    var resetBTN = document.getElementById('resetMap');
    resetBTN.onclick = function () { resetMap();};
    gblMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(resetBTN);
    
    setupMapSearchBox();    
        
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

/* listing related functions --------------------------------------------------------- */


/*This for paging when searching... and when "ShowListingOnMap"
  The funky key on the facData is for easy sorting.
*/

function savePageData( data) { /*ignore parms*/
    
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
                estStatusText: item.estStatusText,
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
    var searchUrl = DATA_URL + srch.urlParms + "&row_start=" + gblNextPage + "&row_count=9999";
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
            setTotalDisplay(gblFacDataCnt);
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
/* if we are an alphalisting, go to the back end to get data
    if we are numeric, data should have been read into memory already
*/

function generateAlphaPage() {
    var srch = determineSearchParms();
    $("#listLoader").modal('show');
    var searchUrl = DATA_URL + srch.urlParms + "&row_start=0&row_count=99999&facility_name_initial=" + gblCurrentAlphaPage;
    $.ajax({
        type: 'GET',
        url: searchUrl  ,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            savePageData(data);
            loadListView(gblFacData);
            },
        error: function (xhr, ajaxOptions, thrownError) {
            $("#listLoader").modal('hide');
            bootbox.alert("An error has occured. Please try again.");
            console.log(xhr.status);
            console.log(thrownError);
            }
        });
}

function generateNumericPage() {
    
    var endRow = gblNextPage + gblRowsPerPage - 1;
    var pageData = {};
    var rowcnt=0;
    Object.keys(gblFacData).forEach(function(key, idx, array) {
        if (rowcnt >= gblNextPage  && rowcnt <= endRow) {
            pageData[key] = gblFacData[key];
        }
        rowcnt++;
    });
 
    setPageStatus(gblNextPage, endRow, gblFacDataCnt);
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


function showLinkOnMap(estId, lat,lng) {

    showInspectionDetails(estId);
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
    window.scrollTo(0, $("#map-wrapper").offset().top);

}

function loadListView(facData) {

    var strRows = "";

    var listingBody = $("#safetable").find("tbody");
    Object.keys(facData).forEach(function(key, idx, array) {
        var facility = facData[key];
    
        strRows += "<tr id='dinerow" + idx + "'>";
        //onclick='showLinkOnMap("+ facility.estId + "," + facility.lat + "," + facility.lon + ")
        strRows += "<td class='col-md-5'><table class='serviceNameTbl'><tbody><tr><td><img class='liStatusIcon' src='" + statusIcons[facility.estStatusCd].large + "' alt='" + facility.estStatusText + "'></td><td><a class='mapLink' href='#' data-id = '" + facility.estId + "' data-lat='" + facility.lat + "' data-lng='" + facility.lon + "'>" + facility.estName + "</a></td></tr></tbody></table></td>" ;
        strRows += "<td class='col-md-3'>" + facility.addressFull + "</td>" ;
        strRows += "<td class='col-md-4'><table class='serviceTbl'><tbody>";
        
        $.each(facility.services, function(sidx, service) {
            strRows +=  "<tr><td><img src='" + statusIcons[service.status].small + "' alt='" + service.statusText + "'>" + service.serviceTypeDesc + "</td><td class='liServiceStatusText'>" + service.statusText + "</td></tr>" ;
        });
        strRows += "</tbody></table></td></tr>";
    });
    
    strRows = (strRows ==="") ? "<tr><td colspan='4' class='NoData'>No Establishment found, check search options and try again</td></tr>" : strRows;
    listingBody.html(strRows); //.trigger('update');
    $("#listLoader").modal('hide');

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

//If the user hasn't selected anything.. then don't do search per say..do alpha-0
function doSearch() {
    $("#listLoader").modal('show');
    var srch = determineSearchParms();
    if (srch.urlParms === gblDefaultAllSearchParms.urlParms) { 
        showAlphaPage('0');
    } else {
        /* set paging here, in-case map draws first and the zoom level changes */
        gblNextPage = 0;
        setPagingMode(NUMERIC_PAGING_METHOD);
        getSearchData(srch);
        redrawMap();
    }
}

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
    }); 
}

function setUpEvents() {
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
        gblNextPage = ((num  -1 ) * gblRowsPerPage);
        generatePageListing();
    });
    
    $("#pageSize").multiselect({
        onChange: function(option, checked, select) {
            gblRowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            gblNextPage = 0;
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
    }); 
    
     $("#maincontent").on("click",".available a", function() {
        //$("#alphaPagination").children('li').removeClass('active');
        //$(this).parent().addClass('active');
        showAlphaPage($(this).text().substring(0,1));
        return false;
    });
    $("#maincontent").on("click",".unavailable a", function(e) {
         e.preventDefault();
        return false;
    });     
    
    $("#maincontent").on("click","span.orgLink a", function() {
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

function showAlphaPage(alpha) {
    var charCode = alpha.charCodeAt(0);
    var alphaPages = $("#alphaPagination");
    alphaPages.children('li').removeClass('active');
    if (charCode >= 65 && charCode <= 90) {
        alphaPages.children('li').eq(charCode - 64).addClass('active');
    } else {
        alphaPages.children('li').eq(0).addClass('active');
    }
    //$(this).parent().addClass('active');
    setPagingMode(ALPHA_PAGING_METHOD,alpha);
    generatePageListing();
}

function processAlphaCounts(data) {

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
            if (count === 0) {
                alphaPages.children('li').eq(charCode - 64).addClass('unavailable').addClass('disabled');
            }
        } else {
            numberTotal = numberTotal + count;
        }
    }        
    if (numberTotal > 0) {
        alphaPages.children('li').eq(0).addClass('available').find('.found').html(numberTotal);
        foundStartIdx = "0";
    } else {
        alphaPages.children('li').eq(0).addClass('unavailable').addClass('disabled');
    }
    setTotalDisplay(total);     
    gblTotalEstablishments = total;
    showAlphaPage(foundStartIdx);
}

function setTotalDisplay(total) {
    if (total == 1) {
        $("#srchResults").html(total + ' Establishment Found');
    } else {
        $("#srchResults").html(total + ' Establishments Found');
    }
}
function determineAlphaCounts() {
   $.ajax({
        type: 'GET',
        url: ALPHA_COUNT_URL + gblDefaultAllSearchParms.urlParms,
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

/* after we set up ther filters, we get the listing data here since the listing routine looks at existing search parms*/
function setupFilters() {

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
    
    
    //$('.input-daterange').datepicker({
    //        todayBtn: true,
    //        forceParse: false,
    //        autoclose: true,
    //        format: 'yyyy-mm-dd',  /* what is the city standard*/
    //        date: new Date(),
    //        todayHighlight: true,
    //        endDate:"0d"
    //}); 
    
    $.when.apply(null, promises).done(function(){
        initFilter( $("#serviceTypeFilter"), gblTypeData, "serviceTypeCode", "serviceTypeDesc");
        initFilter( $("#statusFilter"), gblStatusData, "estStatusCd", "estStatusDesc");
        
        
        gblDefaultAllSearchParms = determineSearchParms();
        $("#listLoader").modal('show'); //show we are actually getting the listing as we are initializing.
        determineAlphaCounts();
   });    
   
}

function initApp() {

    $("#mapLoader").modal('show');
    initMap();
    loadShellMarkerData(); //the url here is bad. we need a more effiecient one.
    setupFilters();
    setUpEvents();
    $(window).trigger("resize");      

}

function loadPage() {
    var strCode="";
    if (document.location.hostname.length === 0) {
        statusIcons = { 
            "PASS" : { large: "images/map/pass_large.png", medium: "images/map/pass_small.png",small: "images/map/pass_circle.gif"},
            "COND" : { large: "images/map/conditional_large.png", medium: "images/map/conditional_small.png",small: "images/map/conditional_circle.gif"},
            "FAIL" : { large: "images/map/closed_large.png", medium: "images/map/closed_small.png",small: "images/map/closed_circle.gif"}
            };
        markerImages = { 
            'multi': {icon: 'images/map/multi_marker.png', value : 4},
            'PASS' : {icon:'images/map/pass_marker.png', value : 1},
            'COND' : {icon:'images/map/conditional_marker.png', value : 2},
            'FAIL' : {icon:'images/map/closed_marker.png', value : 3}
            };
        CLUSTER_IMAGES = 'images/mc';           
        STREET_VIEW_ICON ='images/map/streetView.png';
        strCode += '<link rel="stylesheet" href="datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        strCode += '<link rel="stylesheet" href="css/bodySafe.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript"  src="js/bootbox.min.js"></script>';     
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += ' <script type="text/javascript" src="js/markerclusterer.min.js"></script>';     
        
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('html/bodySafeListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/safe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/BodySafe/css/bodySafe.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/placeholders.jquery.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/bootbox/bootbox.min.js"></script>';        
        strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
        strCode += ' <script type="text/javascript" src="/static_files/assets/GMap/markerclusterer.min.js"></script>';
        
        $("#appCodeMap").html(strCode);
        $("#appDisplayMap").load('/static_files/WebApps/Health/BodySafe/html/bodySafeListing.html', function() {initApp();});
    }

}
$( document ).ready(function() {

    loadPage();
});

})(this);