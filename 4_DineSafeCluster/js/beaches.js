/*
 Beach Map - 2016/04/28
 
 todo: year dropup -- make it current year at bottom
   I assume it shows the ucrrent year by default and then gets data for that year
   
 Links on legend-- should goto paragraphs on descriotiin page.. Id pu tin anchors..
 http://help.typepad.com/anchor-tags.html
 
 googlr directions??it's harder than you think..
*/
 (function (window, undefined) {
   'use strict';
//var DATA_URL = 'http://was8-inter-dev.toronto.ca/opendata/tbwq/beaches.json?v=1.0&callback=?';  //'http://app.toronto.ca/tpha/beaches/jsonHistory.html?date=2015-9-6';
var DATA_URL = 'http://was8-inter-dev.toronto.ca/opendata/tbwq/beaches.json?callback=?';  //'http://app.toronto.ca/tpha/beaches/jsonHistory.html?date=2015-9-6';
var BEACH_HISTORY = "http://was8-inter-dev.toronto.ca/opendata/tbwq/beaches.json?v=2.0&callback=?&beachid=<BID>&publishyear=<YEAR>";
var BEACH_URL = 'http://was8-inter-dev.toronto.ca/opendata/tbwq/beaches.json?callback=?&beachid=<BID>'; 
var BEACH_YEAR_LOOKUP = "http://was8-inter-dev.toronto.ca/opendata/tbwq/years.json?v=2.0&callback=?&beachid=<BID>";
var DAILY_BEACH_HISTORY = "http://was8-inter-dev.toronto.ca/opendata/tbwq/beaches.json?v=2.0&callback=?&publishdate=<YYYY-MM-DD>";
var OFF_SEASON_CHECK = 'http://was8-inter-dev.toronto.ca/opendata/tbwq/season.json?v=2.0&callback=?';
var gblBeachJSON;
var gblBeachId;
//var TPH_API_DATE_FORMAT = "MM/DD/YYYY";
var DISPLAY_DATE_FORMAT = "MMMM DD, YYYY";
var CommonInfoWindow = new google.maps.InfoWindow();

var markerImages = {
    'UNSAFE' : { url : 'http://maps.google.com/mapfiles/ms/icons/red.png', labelOrigin: new google.maps.Point(16, 9) },
    'SAFE' : { url : 'http://maps.google.com/mapfiles/ms/icons/green.png',  labelOrigin: new google.maps.Point(16, 9) },
    'BlueBeach' : { url : 'http://app.toronto.ca/tpha/images/blueflag_small.png' }
};

 var statusImages = { "UNSAFE" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statusunsafe_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_unsafe_medium.gif"},
                      "SAFE" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statussafe_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_safe_medium.gif"},
                      "NO_DATA" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statusnodata_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_nodata_medium.gif"},
                      "UNTESTED" : {large: "/static_files/WebApps/Health/SwimSafe/images/beaches_statusnodata_l.gif", medium : "/static_files/WebApps/Health/SwimSafe/images/beaches_nodata_medium.gif"}
                    };
var gblMap;
var gblMapMarkers = [];
var MAP_CENTER = new google.maps.LatLng(43.711134, -79.377145);
 
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

//TODO: if we get sumamry .. have a hover which display cuirrent info.. 
// At this point. out retreived data has one report in the data.
function plotMarkers() {
   
    var bounds = new google.maps.LatLngBounds();
    var legendStr = "<li class='first='><ol class='col-md-6'>";
    var beachcnt = 0;
    for( var i = 0; i < gblBeachJSON.length; i++ ) {
        var beach = gblBeachJSON[i];
        beachcnt++;
        //console.log(beachcnt + " " + beach.reports[0].statusCd);
        legendStr += "<li id='" + beach.id + "'>";
        if (beach.isBlueFlag) {
            legendStr += '<img width="18" height="18" class="bbicon" src="' + markerImages.BlueBeach.url + '" alt="">';
            legendStr += '</span><img width="18" height="18" class="beachStatus" src="' + markerImages[beach.reports[0].statusCd].url + '" alt="">';
        } else {    
            legendStr += '</span><img width="18" height="18" class="noBBBeachStatus" src="' + markerImages[beach.reports[0].statusCd].url + '" alt="">';
        }
        //legendStr +=  '<a href="beach/1.html"><img width="20" height="31" style="border: 0;" id="beach_pin_A" src="/tpha/images/beaches_unsafe_pin.gif" alt=""></a>';
        legendStr +=  beach.areaCd + ' <a class="beachLink" href="#">' +  beach.name + '</a>';

        legendStr += '</li>';
       var latlng = new google.maps.LatLng( +beach.lat, +beach.lng );
                    
        var marker = new google.maps.Marker({
            position: latlng,
            map: gblMap,
            id: beach.id,
            ecoli: beach.reports[0].ecoli,
            advisory: beach.reports[0].advisory,
            label: { text : beach.areaCd,
                    fontWeight: '900'
                    },
            icon : {
                url: markerImages[beach.reports[0].statusCd].url,
                labelOrigin: new google.maps.Point(20,14),
                scaledSize: new google.maps.Size(40, 40)
            },           
            title: beach.name
        });
        bounds.extend(marker.getPosition());
        
        marker.addListener('mouseover', function () {
            var content = "<div class='infoDiv'>";
            content += "<div class='row'><div class='col-md-12 infoHdr'>" +  this.title + "</div></div>";
            content += "<div class='row'><div class='col-md-12'><span class='infoHdr'>Last E. coli count: </span> " + this.ecoli + "</div></div>";
            content += "<div class='row'><div class='col-md-12'><span class='infoHdr'>Advisory: </span> " +  this.advisory  + "</div></div>";
			
            CommonInfoWindow.setOptions(
                {   "position": this.position,
                    "maxWidth" : "125",
                    "pixelOffset":new google.maps.Size(0, -32),
                    "content": content
                });
            CommonInfoWindow.open(gblMap);
        });
        marker.addListener('mouseout', function () {
             CommonInfoWindow.close();
        });
        marker.addListener('click', function () {
            gotoDetailPage(this.id);
        });

        gblMapMarkers.push(marker);
        if (beachcnt % 6 === 0) {
            legendStr += "</ol></li><li><ol class='col-md-6'>";
        }
        gblMap.fitBounds(bounds);
    }
    legendStr += '</ol></li>';
    $("#list_of_beaches").html(legendStr).trigger('update');
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




function generateHistoryListing(data) {
    var strRows = "";
           
    var hdrRow = "<div class='row listHdrRow'>";
        hdrRow += "<div class='col-md-2'>Sample Date</div>";
        hdrRow += "<div class='col-md-2'>E. coli Level</div>";
        hdrRow += "<div class='col-md-8'>Swimming Conditions</div>";
        hdrRow += "</div>";    
    $.each(data[0].reports, function(i, item) {
        var eCnt = (typeof item.ecoli === "undefined" || item.ecoli === null || item.statusCd =='UNTESTED') ? "--" : item.ecoli;
        strRows += "<div class='row'>";
        strRows += "<div class='col-md-2'>" + moment(item.sampled).format(DISPLAY_DATE_FORMAT)  + "</div>";
        strRows += "<div class='col-md-2'>" + eCnt + "</div>";
        if (statusImages[item.statusCd]) {
            strRows += "<div class='col-md-8'><img src='" + statusImages[item.statusCd].medium + "' alt='" + item.statusCd + "'>&nbsp;&nbsp;" + item.advisory + "</div>";
        } else {
            strRows += "<div class='col-md-8'>" + item.stastusCd + item.advisory + "</div>";
            
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
    $.ajax({
        type: 'GET',
        url: BEACH_HISTORY.replace("<YEAR>",year).replace("<BID>",gblBeachId),
        crossDomain: true,
        cache: true,
        dataType: 'json',
        success: function (data) {
            generateHistoryListing(data);
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}

function populateYearLookup(years) {

    var yearsDesc = years.sort(function(a, b){return a-b;});
    var yearFilter = $("#yearFilter");
    $.each(yearsDesc, function(i,item) {
        yearFilter.append( '<option  value="' + item + '">' + item + '</option>' );
    });
    yearFilter.multiselect({
        
        maxHeight: '400',
        dropUp: true,
         //buttonContainer: '<div class="btn-group yearfilter" />',
        onChange: function(option, checked, select) {
            getBeachHistory(option.val());
        }
    });
    //I think the drop up calc in mult-select is not right
    var items = yearFilter.find("option").size();
    yearFilter.next().find("ul").css({
        'max-height': items * 60 + 'px',    //5 * 60
        'margin-top': "-" + ((items * 60) -195) + 'px'  //30 less
    }); 
}
function populateDetails(data) {

    var beachData = data[0];
    $("#statusImage").attr("src",statusImages[beachData.reports[0].statusCd].large);
    $("#beachName").text(beachData.areaCd + " - " +  beachData.name);
    $("#beachAddress").text(beachData.address);
    $("#sampleDate").text(moment(beachData.reports[0].sampled).format(DISPLAY_DATE_FORMAT));
    $("#postedDate").text(moment(beachData.reports[0].published).format(DISPLAY_DATE_FORMAT));
    $("#ecolicount").text(beachData.reports[0].ecoli);
    $("#advisory").text(beachData.reports[0].advisory);
    if (beachData.isBlueFlag) {
        $("#blueFlag").show();
    } else {
        $("#blueFlag").hide();
    }
    $("#beachMapImage").attr("src",beachData.imageSrc);

    var strURL =  BEACH_YEAR_LOOKUP.replace("<BID>",gblBeachId);
    $.ajax({
        type: 'GET',
        url: strURL,
        crossDomain: true,
        cache: true,
        dataType: 'json',
        success: function (data) {
            populateYearLookup(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
        }
    });
    

}

function initApp() {

	var strURL = DATA_URL;
    $.ajax({
        type: 'GET',
        url: strURL,
		//jsonpCallback : 'CALLBACK',
        crossDomain: true,
        cache: true,
        dataType: 'json',
        success: function (data) {
                gblBeachJSON = data.sort(dynamicSort("","areaCD"));
                $("#reportDate").text(moment(gblBeachJSON[0].reports[0].published).format(DISPLAY_DATE_FORMAT));
                setupMap();
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}


function initDetailApp() {

    var strURL =  BEACH_URL.replace("<BID>",gblBeachId);
    $.ajax({
        type: 'GET',
        url: strURL,
        cache: true,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
                populateDetails(data);
            },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
    
}

/* -- Daily Historical Data Functions -------------------------------
I could blank out calendar rows by using Days Lookup, so user doesn't select a bad day..but that is expensive
*/
function generateDailyHistory(data) {

    var strRows ="";
    var historyData = data.sort(dynamicSort("","AREAcD"));   
    $.each(historyData , function(i, item) {
        //var eCnt = (typeof item.BWQR_BEACH_ECOLI_COUNT === "undefined") ? "--" : item.BWQR_BEACH_ECOLI_COUNT;
        var eCnt = ( item.reports.length === 0 || typeof item.reports[0].ecoli === "undefined" || item.reports[0].ecoli === null || item.reports[0].statusCd =='UNTESTED') ? "--" : item.reports[0].ecoli;
        strRows += "<div class='row'>";
        strRows += "<div class='col-md-3'>" + item.name  + "</div>";
        strRows += "<div class='col-md-1'>" + eCnt + "</div>";
        if (item.reports.length === 0) {
            strRows += "<div class='col-md-7 nodata'>No data found</div></div>";
        
        } else if (statusImages[item.reports[0].statusCd]) {
            strRows += "<div class='col-md-7'><img src='" + statusImages[item.reports[0].statusCd].medium + "' alt='" + item.reports[0].statusCd + "'>&nbsp;&nbsp;" + item.reports[0].advisory + "</div>";
        } else {
            strRows += "<div class='col-md-7'>" + item.reports[0].statusCd + "&nbsp;&nbsp;" + item.reports[0].advisory + "</div>";
            
        }
        strRows += "</div>";
    });
    if (strRows === "") {
         strRows += "<div class='row'><div class='col-md-12 nodata'>No data found</div></div>";
    }

        
    $("#dailyHistoryRows").html(strRows);
}
function getHistoryData(date) {

 var strURL = DAILY_BEACH_HISTORY.replace("<YYYY-MM-DD>",date);
   $.ajax({
        type: 'GET',
        url: strURL,
        crossDomain: true,
        cache: true,
        dataType: 'json',
        success: function (data) {
            generateDailyHistory(data);
        },
        error: function (xhr, ajaxOptions, thrownError) {
               console.log(xhr.status);
               console.log(thrownError);
            }
    });
}
function initHistoryApp() {

    $('#historyDate').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true
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
        strCode += '<link rel="stylesheet" href="datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';        
        strCode += '<link rel="stylesheet" href="css/safe.css">';
        strCode += '<link rel="stylesheet" href="css/beaches.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';  
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';        
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
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
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
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
        statusImages = { "UNSAFE" : {large: "images/beaches_statusunsafe_l.gif", medium: "images/beaches_unsafe_medium.gif"},
                         "SAFE" : {large:"images/beaches_statussafe_l.gif", medium: "images/beaches_safe_medium.gif"},
                         "NO_DATA" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"},
                         "UNTESTED" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"}
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

function loadDetailPage() {
    var strCode = defineAppCode();
    $("#appCodeMap").html(strCode);
     if (document.location.hostname.length === 0) {
        statusImages = { "UNSAFE" : {large: "images/beaches_statusunsafe_l.gif", medium: "images/beaches_unsafe_medium.gif"},
                         "SAFE" : {large:"images/beaches_statussafe_l.gif", medium: "images/beaches_safe_medium.gif"},
                         "NO_DATA" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"},
                         "UNTESTED" : {large:"images/beaches_statusnodata_l.gif", medium: "images/beaches_nodata_medium.gif"}
                         };
        $("#appDisplayMap").load('html/beachDetail.html', function() {initDetailApp();});
    } else {
        /* in WCM, we stay in the same page, but lets hide the "teaser above" . Kinda hooky*/
         var prevTeaser = $("#appDisplayMap").parents("section").parent().prev().find("section");
        if (prevTeaser.find("H1").text() === "Toronto Beaches Water Quality") {
            prevTeaser.hide();
        }
        $("#appDisplayMap").load('/static_files/WebApps/Health/SwimSafe/html/beachDetail.html', function() {initDetailApp();});
    
    }

}


$( document ).ready(function() {
    var qshistory = $.QueryString.history;
    gblBeachId = $.QueryString.beach;
     if (qshistory) {
        loadHistoryPage();
    } else if (gblBeachId) {
        loadDetailPage();
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

})(this);