/*
 Beach Map - 2016/04/28
 
 todo: year dropup -- make it current year at bottom
   I assume it shows the ucrrent year by default and then gets data for that year
   
 Links on legend-- should goto paragraphs on descriotiin page.. Id pu tin anchors..
 http://help.typepad.com/anchor-tags.html
 
 googlr directions??it's harder than you think..
*/
 
var detailURL = "http://app.toronto.ca/opendata/tphir/ir_detail.json?callback=?&program_area_cd=POOL&addr_id=";
var DATA_URL = 'http://app.toronto.ca/tpha/beaches/jsonHistory.html?date=2015-9-6';
var BEACH_GUID = '276b2887f2514510VgnVCM10000071d60f89RCRD';
var BEACH_HISTORY = "http://app.toronto.ca/tpha/beach/jsonOneYearHistory.html?beachId=1&year=";
var BEACH_URL = 'http://app.toronto.ca/tpha/beaches/jsonHistory.html?date=2015-9-6';
var DAILY_BEACH_HISTORY = "http://app.toronto.ca/tpha/beaches/jsonHistory.html?date=";
var gblBeachJSON;
var TPH_API_DATE_FORMAT = "MM/DD/YYYY";
var DISPLAY_DATE_FORMAT = "MMMM DD, YYYY";
/*
  var CommonInfoWindow = new google.maps.InfoWindow({"minWidth": 500});
*/
var CommonInfoWindow = new google.maps.InfoWindow();
var selectedEstablishmentData = [];


var markerImages = {
    'Unsafe' : { url : 'http://maps.google.com/mapfiles/ms/icons/red.png', labelOrigin: new google.maps.Point(16, 9) },
    'Safe' : { url : 'http://maps.google.com/mapfiles/ms/icons/green.png',  labelOrigin: new google.maps.Point(16, 9) },
    'BlueBeach' : { url : 'http://app.toronto.ca/tpha/images/blueflag_small.png' }
};

 var statusImages = { "Unsafe" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statusunsafe_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_unsafe_medium.gif"},
                      "Safe" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statussafe_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_safe_medium.gif"},
                      "No data" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statusnodata_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_nodata_medium.gif"}
                    };
var streetViewIcon ='/static_files/WebApps/Health/DineSafe/images/map/streetView.png';
var inspectionsIcon ='/static_files/WebApps/Health/DineSafe/images/map/inspections.png';

var gblMap;
var gblMapMarkers = [];
var MAP_CENTER = new google.maps.LatLng(43.711134, -79.377145);
var randKey =  (new Date()).valueOf();
//https://drive.google.com/file/d/0B-j2Y49nfiw2eDVWRjRBVTVUMkE/view?usp=sharing

 
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

function clearMarkers() {
    for (var i = 0; i < gblMapMarkers.length; i++) {
        gblMapMarkers[i].setMap(null);
    }
    gblMapMarkers = [];
}

//TODO: if we get sumamry .. have a hover which display cuirrent info.. 
function plotMarkers() {
   
    var bounds = new google.maps.LatLngBounds();
    var legendStr = "<li class='first='><ol class='col-md-4'>";
    var beachcnt = 0;
    for( var i = 0; i < gblBeachJSON.length; i++ ) {
        var beach = gblBeachJSON[i];
        beachcnt++;
        console.log(beachcnt + " " + beach.BWQR_BEACH_STATUS_NAME);
        legendStr += "<li id='" + beach.id + "'>";
        if (beach.BWQR_BEACH_BLUE_FLAG_INDICATOR_SMALL) {
            legendStr += '<img width="18" height="18" class="bbicon" src="' + markerImages.BlueBeach.url + '" alt="">';
            legendStr += '</span><img width="18" height="18" class="beachStatus" src="' + markerImages[beach.BWQR_BEACH_STATUS_NAME].url + '" alt="">';
        } else {    
            legendStr += '</span><img width="18" height="18" class="noBBBeachStatus" src="' + markerImages[beach.BWQR_BEACH_STATUS_NAME].url + '" alt="">';
        }
        //legendStr +=  '<a href="beach/1.html"><img width="20" height="31" style="border: 0;" id="beach_pin_A" src="/tpha/images/beaches_unsafe_pin.gif" alt=""></a>';
        legendStr +=  beach.BWQR_BEACH_LETTER + ' <a class="beachLink" href="#">' +  beach.BWQR_BEACH_NAME + '</a>';

        legendStr += '</li>';
       var latlng = new google.maps.LatLng( +beach.BWQR_BEACH_LATITUDE, +beach.BWQR_BEACH_LONGITUDE );
                    
        var title = beach.BWQR_BEACH_NAME;

        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            id: beach.id,
            label: { text : beach.BWQR_BEACH_LETTER,
                    fontWeight: '900'
                    },
            icon : {
                url: markerImages[beach.BWQR_BEACH_STATUS_NAME].url,
               labelOrigin: new google.maps.Point(20,14),
                scaledSize: new google.maps.Size(40, 40)
            },           
            title: beach.BWQR_BEACH_NAME
        });
        bounds.extend(marker.getPosition());
        marker.addListener('click', function () {
            gotoDetailPage(this.id);
        });
        
        marker.addListener('mouseover', function () {
            var content = "<div class='infoDiv'>";
            content += "<div class='row'><div class='col-md-12 infoHdr'>" +  this.title + "</div></div>";
            content += "<div class='row'><div class='col-md-12'><span class='infoHdr'>Last E. coli count: </span> " +  "xxx" + "</div></div>";
            content += "<div class='row'><div class='col-md-12'><span class='infoHdr'>Advisory: </span> " +  "xxx" + "</div></div>";
            CommonInfoWindow.setOptions(
                {   "position": this.position,
                    //"maxWidth" : width / 2,
                    "pixelOffset":new google.maps.Size(0, -32),
                    "content": content});
            CommonInfoWindow.open(gblMap);
        });
        marker.addListener('mouseout', function () {
             CommonInfoWindow.close();
        });
        

        gblMapMarkers.push(marker);
        if (beachcnt % 4 === 0) {
            legendStr += "</ol></li><li><ol class='col-md-4'>";
        }
        gblMap.fitBounds(bounds);
    }
    legendStr += '</ol></li>';
    $("#list_of_beaches").html(legendStr).trigger('update');
}


function resetMap() {
    gblMap.setZoom(11);
    gblMap.setCenter(MAP_CENTER);
    CommonInfoWindow.close();
    
}

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

function gotoDetailPage(id) {
    var urlAdd = '?beach=' + id;
    var href;
    if (document.location.hostname.length === 0) {
        href = window.location.href + urlAdd;
    } else {
        href = window.location.href + urlAdd.replace("?","&");
        //href = '/wps/portal/contentonly?vgnextoid=' +  urlAdd;
    }
    window.location.href = href;
}
function setupEvents() {

    $(".beachLink").on("click",function() {
        var id = $(this).closest("li").attr("id");
        gotoDetailPage(id);
        return false; //to cancel the link
    
    });
}
function setupMap() {
    gblMap = new google.maps.Map(document.getElementById('map-canvas'), {
        center: MAP_CENTER,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        //disableDefaultUI: true,

        mapTypeControl: true,
        //mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
        zoomControl: true
        //tilt: 30
    });

    setupMapSearchBox();
    plotMarkers();
    setupEvents();
}


function initApp() {

    $.ajax({
        type: 'GET',
        url: DATA_URL,
        crossDomain: true,
        //contentType: "application/json",
        //cache: true,
        dataType: 'json',
        success: function (data) {
                gblBeachJSON = data.sort(dynamicSort("","BWQR_BEACH_LETTER"));
                setupMap();
                $("#reportDate").text(moment(gblBeachJSON[0].BWQR_BEACH_DATA_COLLECTION_DATE).format(DISPLAY_DATE_FORMAT));
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}

function generateHistoryListing(data) {
    var strRows = "";
           
    var hdrRow = "<div class='row listHdrRow'>";
        hdrRow += "<div class='col-md-2'>Sample Date</div>";
        hdrRow += "<div class='col-md-2'>E. coli Level</div>";
        hdrRow += "<div class='col-md-8'>Swimming Conditions</div>";
        hdrRow += "</div>";    
    $.each(data, function(i, item) {
        var eCnt = (typeof item.BWQR_BEACH_ECOLI_COUNT === "undefined") ? "--" : item.BWQR_BEACH_ECOLI_COUNT;
        strRows += "<div class='row'>";
        strRows += "<div class='col-md-2'>" + moment(item.BWQR_BEACH_DATA_COLLECTION_DATE).format(DISPLAY_DATE_FORMAT)  + "</div>";
        strRows += "<div class='col-md-2'>" + eCnt + "</div>";
        if (statusImages[item.BWQR_BEACH_STATUS_NAME]) {
            strRows += "<div class='col-md-8'><img src='" + statusImages[item.BWQR_BEACH_STATUS_NAME].medium + "' alt='" + item.BWQR_BEACH_STATUS_NAME + "'>&nbsp;&nbsp;" + item.BWQR_BEACH_ADVISORY + "</div>";
        } else {
            strRows += "<div class='col-md-8'>" + item.BWQR_BEACH_STATUS_NAME + item.BWQR_BEACH_ADVISORY + "</div>";
            
        }
        strRows += "</div>";
    });
    if (strRows === "") {
         strRows += "<div class='row'><div class='col-md-12 nodata'>No data found</div></div>";
    }

        
    $("#historyRow").html(hdrRow + strRows);
}

function getBeachHistory(year) {
    if (year === '0000') {
        $("#historyRow").html("");
        return;
    }
    //alert(year);
    $.ajax({
        type: 'GET',
        url: BEACH_HISTORY + year,
        crossDomain: true,
        //contentType: "application/json",
        //cache: true,
        dataType: 'json',
        success: function (data) {
            generateHistoryListing(data)
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}
function populateDetails(beachId, data) {

    var beachData;
    //TODO: This loop is temporary
     $.each(data, function(i, item) {
        if (item.id === beachId) {
            beachData = item;
        }
     });

    $("#statusImage").attr("src",statusImages[beachData.BWQR_BEACH_STATUS_NAME].large);
    $("#beachName").text(beachData.BWQR_BEACH_LETTER + " - " +  beachData.BWQR_BEACH_NAME);
    $("#beachAddress").text(beachData.BWQR_BEACH_DESCRIPTION);
    $("#sampleDate").text(moment(beachData.BWQR_BEACH_DATA_COLLECTION_DATE).format(DISPLAY_DATE_FORMAT));
    $("#postedDate").text(moment(beachData.BWQR_BEACH_PUBLISH_ON).format(DISPLAY_DATE_FORMAT));
    $("#ecolicount").text(beachData.BWQR_BEACH_ECOLI_COUNT);
    $("#advisory").text(beachData.BWQR_BEACH_ADVISORY);
    $("#alert").text(beachData.BWQR_BEACH_ALERT_MESSAGE);
    if (beachData.BWQR_BEACH_BLUE_FLAG_INDICATOR_SMALL) {
        $("#blueFlag").show();
    } else {
        $("#blueFlag").hide();
    }
    $("#beachMapImage").attr("src",beachData.BWQR_BEACH_MAP);

    var yearFilter = $("#yearFilter");
    yearFilter.multiselect({
        
         maxHeight: '400',
         dropUp: true,
         //buttonContainer: '<div class="btn-group yearfilter" />',
         onChange: function(option, checked, select) {
           getBeachHistory(option.val())
        }
    });
    //I think the drop up calc in mult-select is not right
    var items = yearFilter.find("option").size();
    yearFilter.next().find("ul").css({
        'max-height': items * 60 + 'px',    //5 * 60
        'margin-top': "-" + ((items * 60) -30) + 'px'  //30 less
    });
    

}
function initDetailApp(qsbeach) {

    $.ajax({
        type: 'GET',
        url: BEACH_URL,
        crossDomain: true,
        //contentType: "application/json",
        //cache: true,
        dataType: 'json',
        success: function (data) {
            //TODO: fix this when get proper URL.
                var json = data.sort(dynamicSort("","BWQR_BEACH_LETTER"));
                populateDetails(qsbeach,json);
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}

/* -- Daily Historical Data Functions -------------------------------*/
function generateDailyHistory(data) {

	var strRows ="";
	historyData = data.sort(dynamicSort("","BWQR_BEACH_LETTER"));	
	$.each(historyData , function(i, item) {
        var eCnt = (typeof item.BWQR_BEACH_ECOLI_COUNT === "undefined") ? "--" : item.BWQR_BEACH_ECOLI_COUNT;
        strRows += "<div class='row'>";
        strRows += "<div class='col-md-3'>" + item.BWQR_BEACH_NAME  + "</div>";
        strRows += "<div class='col-md-1'>" + eCnt + "</div>";
        if (statusImages[item.BWQR_BEACH_STATUS_NAME]) {
            strRows += "<div class='col-md-7'><img src='" + statusImages[item.BWQR_BEACH_STATUS_NAME].medium + "' alt='" + item.BWQR_BEACH_STATUS_NAME + "'>&nbsp;&nbsp;" + item.BWQR_BEACH_ADVISORY + "</div>";
        } else {
            strRows += "<div class='col-md-7'>" + item.BWQR_BEACH_STATUS_NAME + item.BWQR_BEACH_ADVISORY + "</div>";
            
        }
        strRows += "</div>";
    });
    if (strRows === "") {
         strRows += "<div class='row'><div class='col-md-12 nodata'>No data found</div></div>";
    }

        
    $("#dailyHistoryRows").html(strRows);
}
function getHistoryData(date) {

   $.ajax({
        type: 'GET',
        url: DAILY_BEACH_HISTORY + date,
        crossDomain: true,
        //contentType: "application/json",
        //cache: true,
        dataType: 'json',
        success: function (data) {
			generateDailyHistory(data)
        },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
}
function initHistoryApp(qsbeach) {

	$('#historyDate').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true,
    });  

	$('.datepicker').datepicker()
		.on('changeDate', function(e) {
				getHistoryData(e.target.value);
			});

 
    
}


//TODO: clean up whaT LIBRARIES are actually used.
function defineAppCode() {
    var strCode="";
    if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        strCode += '<link rel="stylesheet" href="css/beaches.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
       // strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.js"></script>';
       // strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.widgets.js"></script>';
       // strCode += '<script type="text/javascript" src="https://maps.googleapis.com/maps/api/js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        //strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';

   } else {  
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/safe/css/safe.css">';
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Health/SwimSafe/css/beaches.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        //strCode += '<script type="text/javascript" src="//maps.googleapis.com/maps/api/js?v=3&libraries=places"></script>';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/static_files/assets/pagination/jquery.bootpag.min.js"></script>';
    }
    return strCode;

}
/* we load all css/js for all 3 forms here*/
function loadPage() {
    var strCode = defineAppCode();
    $("#appCodeMap").html(strCode);
     if (document.location.hostname.length === 0) {
     
        $("#appDisplayMap").load('html/beaches.html', function() {initApp();});
    } else {
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/beaches.html', function() {initApp();});
    }

}

function loadHistoryPage() {
    var strCode = defineAppCode();
    $("#appCodeMap").html(strCode);
     if (document.location.hostname.length === 0) {
        statusImages = { "Unsafe" : {large: "images/beaches_statusunsafe_l.gif", medium: "images/beaches_unsafe_medium.gif"},
                         "Safe" : {large:"images/beaches_statussafe_l.gif", medium: "images/beaches_safe_medium.gif"},
                         "No data" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"}
                         };
        $("#appDisplayMap").load('html/beachHistory.html', function() {initHistoryApp();});
    } else {
        /* in WCM, we stay in the same page, but lets hide the "teaser above" . Kinda hooky*/
         var prevTeaser = $("#appDisplayMap").parents("section").parent().prev().find("section");
        if (prevTeaser.find("H1").text() === "Toronto Beaches Water Quality") {
            prevTeaser.hide();
        }
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/beachHistory.html', function() {initHistoryApp();});
    
    }

}

function loadDetailPage(qsbeach) {
    var strCode = defineAppCode();
    $("#appCodeMap").html(strCode);
     if (document.location.hostname.length === 0) {
        statusImages = { "Unsafe" : {large: "images/beaches_statusunsafe_l.gif", medium: "images/beaches_unsafe_medium.gif"},
                         "Safe" : {large:"images/beaches_statussafe_l.gif", medium: "images/beaches_safe_medium.gif"},
                         "No data" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"}
                         };
        $("#appDisplayMap").load('html/beachDetail.html', function() {initDetailApp(qsbeach);});
    } else {
        /* in WCM, we stay in the same page, but lets hide the "teaser above" . Kinda hooky*/
         var prevTeaser = $("#appDisplayMap").parents("section").parent().prev().find("section");
        if (prevTeaser.find("H1").text() === "Toronto Beaches Water Quality") {
            prevTeaser.hide();
        }
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/beachDetail.html', function() {initDetailApp(qsbeach);});
    
    }

}


$( document ).ready(function() {
	var qshistory = $.QueryString.history;
	var qsbeach = $.QueryString.beach;
     if (qshistory) {
        loadHistoryPage()
    } else if (qsbeach) {
        loadDetailPage(qsbeach)
    } else {
        loadPage();
    }
});

(function($) {
    $.QueryString = (function(a) {
        if (a === "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));
})(jQuery);