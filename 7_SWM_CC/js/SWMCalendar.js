/* 
Notes:
Collection Schedules inconsistency of use:
In GCC:  Monday 1, Tuesday 2  etc.
In the spreadSheet: Monday1,Tuesday2
When referencing PDF: monday_1, tuesday_2.

todo:  wait ...

*/
(function (window, undefined) {
   'use strict';
var GCC_SWM_CAL_LU_API = "http://gis.toronto.ca/arcgis/rest/services/primary/cot_geospatial21_mtm/MapServer/3/query?where=&text=&objectIds=&time=&geometry=<LNG>%2C<LAT>&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&relationParam=&outFields=AREA_ID%2CAREA_ATTR_ID%2CPARENT_AREA_ID%2CAREA_SHORT_CODE%2CAREA_NAME%2CAREA_DESC&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=3857&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&returnTrueCurves=false&resultOffset=&resultRecordCount=&f=pjson";
var GS_COLLECTION_SCHEDULE = 'https://docs.google.com/spreadsheets/d/1KhilmUiWocTvXGpfIARlc-rcL8rRZJUqNyozcMer_iM/pubhtml';
var LS_KEY = "SWM_CC";
var gblCollectionSchedule = null;
var WEEKS_TO_DISPLAY = 2;
var gblUserSchedule;
var gblMap;
var gblAddrLU;
var SWM_SHARE_SHELL = "http://www1.toronto.ca/city_of_toronto/solid_waste_management_services/shared_content/files/calendars/"; 
var icons = {  bluebin : "/static_files/WebApps/Waste Wizard/files/bluebin.png", 
               greenbin : "/static_files/WebApps/Waste Wizard/files/greenbin.png", 
               garbage : "/static_files/WebApps/Waste Wizard/files/garbagebin.png", 
               yardWaste : "/static_files/WebApps/Waste Wizard/files/yardwaste.png", 
               ctree : "/static_files/WebApps/Waste Wizard/files/ctree.png", 
               home: "/static_files/WebApps/Waste Wizard/files/home.png"
            };
            
/* ---- Utility functions --------------------------------------------------------------------- */
function htmlEscape(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
            

function convertQueryStringToObj() {

    var obj = {};
    var qs = window.location.search;
    var parms = qs.substr(1).split('&');   // both work. 1st is more readable.split(/[\?|\&]+/);
    for (var i =0; i <parms.length; i++) {
        if (parms[i] !=="" ) {
            var p=parms[i].split('=');
            if (p.length != 2) continue;
            obj[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    }
    return obj;
}

function convertObjToQueryString(obj) {

    var newQS = "";
    Object.keys(obj).forEach(function(key, idx, array) {
        newQS += (newQS === "" ? "?" : "&");
        newQS += key + "=" + obj[key];
    });
    return newQS;
}

function addToPushState( parms) {
    var qs = convertQueryStringToObj();
    $.each(Object.keys(parms), function(i, parm) {
        if (parms[parm] !== null) {
            qs[parm] = htmlEscape(parms[parm]);
        } else {
            delete qs[parm];
        }
    });
    var newqs = convertObjToQueryString(qs);
    var currURL = window.location.protocol + "//" + window.location.host + window.location.pathname +  newqs;
    if (history.pushState) {
        history.pushState({}, "ignored title", currURL);     
    }
}

function saveParms(parms) {
    if (typeof(Storage) !== "undefined") {
        if (parms !== null) {
            localStorage.setItem(LS_KEY,  JSON.stringify(parms));
        } else {
            localStorage.removeItem(LS_KEY);
        }
    }
}

function getParms() {
    var parms = {};
    if  (typeof(Storage) !== "undefined") {
        var ls_parms = localStorage.getItem(LS_KEY);
        if (ls_parms) {
         try{
            parms = JSON.parse(ls_parms);
            }catch(e){
                //ignore error
            }
        }
    }
    return parms;
}

/* ------------------------------------------------------------------------ */    

function displaySchedule() {
    var spreadSheetSched = gblUserSchedule.replace(/\s/g,"");
    var today = moment().startOf('day');
    var displayCnt = 0;
    var tblStr =  "";
    $.each(gblCollectionSchedule, function (i, weekSched) {
        if (weekSched.Calendar === spreadSheetSched) {
            var startDay =  moment(weekSched.WeekStarting); 

            if (startDay >= today && displayCnt < WEEKS_TO_DISPLAY) {
                var labels = "";
                displayCnt++;
                tblStr += "<p class='listinghdr'>" + moment(weekSched.WeekStarting).format('MMMM Do - dddd') + "</p>";
                tblStr += "<p>";
                if (weekSched.GreenBin !== '0') {
                    tblStr += "<img src='" + icons.greenbin + "' alt='Organic' title='Organic'>" ;
                    labels += "<span class='iconlbl'>Organic</span>";
                }
                if (weekSched.Garbage !== '0') {
                    tblStr += "<img src='" + icons.garbage + "' alt='Garbage' title='Garbage'>";
                    labels += "<span class='iconlbl'>Garbage</span>";
                }
                if (weekSched.Recycling !== '0') {
                    tblStr += "<img src='" + icons.bluebin + "' alt='Recycle' title='Recycle'>";
                    labels += "<span class='iconlbl'>Recycle</span>";
                }
                if (weekSched.YardWaste !== '0') {
                    tblStr += "<img src='" + icons.yardWaste + "' alt='Yard Waste' title='Yard Waste'>";
                    labels += "<span class='iconlbl'>Yard Waste</span>";
                }
                if (weekSched.ChristmasTree !== '0') {
                    tblStr += "<img src='" + icons.ctree + "' alt='Christmas Tree' title='Christmas Tree'>";
                    labels += "<span class='iconlbl'>Tree</span>";
                }
                tblStr += "</p>";
                 tblStr += labels;
            }   
        }
    });
    if (tblStr === "") {
        tblStr = "<p class='listingerr'>No collection schedule was found (" + gblUserSchedule + ")</p>";
        $("#colCal").hide();
    } else {
		$("#colCal").show();
        tblStr = "<p class='listingerr'>The next curbside collection for " + $("#searchLocation").val() + " is on:</p>" + tblStr;
        $("#calPDFLink").attr("href", SWM_SHARE_SHELL + gblUserSchedule.replace(/\s/g,"_").toLowerCase() + ".pdf");
        $("#calICSLink").attr("href", SWM_SHARE_SHELL + gblUserSchedule.replace(/\s/g,"_").toLowerCase() + ".ics");
    }
    $("#calendar").show();
    $("#calendarData").html(tblStr);
}
function saveSched(data) {
        gblCollectionSchedule = data;
        displaySchedule();
}
      
function matchSchedule(data) {
    gblUserSchedule = data.features[0].attributes.AREA_NAME;
	$('#calendarId').text(gblUserSchedule);
    
    if (gblCollectionSchedule === null) {
        Tabletop.init( { key: GS_COLLECTION_SCHEDULE,
                         callback: saveSched,
                         simpleSheet: true } );
    } else {
        displaySchedule();
    }
    
}

function initMap(lat, lng, address) {
    $("#map").show();
    gblMap = new google.maps.Map(document.getElementById('map-canvas'), {
        zoom: 18,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DEFAULT,position: google.maps.ControlPosition.TOP_RIGHT},
        zoomControl: true,
        draggable: false
    });
    
    var latlng =  new google.maps.LatLng(lat, lng );
    var marker = new google.maps.Marker({
        position: latlng,
        map: gblMap,
        icon: 'http://maps.google.com/mapfiles/kml/pal2/icon13.png',
        title: address
    });

    gblMap.setCenter(latlng);
}
function determineWasteCalendar(addrData) {
    initMap(addrData.lat, addrData.lng, addrData.addr);
    var gccURL = GCC_SWM_CAL_LU_API .replace("<LNG>", addrData.lng).replace("<LAT>",addrData.lat);
    var request = $.ajax({
         type: 'GET',
         url: gccURL,
         context: this,
         dataType: 'jsonp',
         success: function (data) {
            matchSchedule(data);
         },
         error: function(jqXHR, textStatus, errorThrown) {
            bootbox.alert("Sorry, we can't determine the pickup schedule at this time.");
            $("#calendar").hide();
         }
     });

}

function doSearch() {
    gblAddrLU = new AddressLookup({ matchType : 1, address : $("#searchLocation").val(), resultsDisplaySelector : "#COTAddress"});
    gblAddrLU.getAddressData();
}

function setupEvents() {
    $("#btnAddrSearch").on("click", function () {
        doSearch();        
    });
    
    $("#COTAddress").on("change",function() {       
        var addrLUData = gblAddrLU.getAddressObject();
        $("#searchLocation").val(addrLUData.key_Desc);
        var addrData = { "addr" : addrLUData.key_Desc, "lat" : addrLUData.latitude, "lng" : addrLUData.longitude};
        addToPushState( addrData  );
        saveParms(addrData);
        determineWasteCalendar(addrData);
        
    }); 
    
    $("#searchLocation").on("keypress", function(e) {
        var KeyCode = e.which || e.keyCode || 0;
        if (KeyCode === 13 || KeyCode === 9) {
            doSearch();
        }
    }); 
    

    $(".hasclear").keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    });

    $(".clearer").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
        saveParms(null);
        addToPushState( {addr : null, lat : null, lng: null});
    });
}


function initApp() {
    setupEvents();
    var qs = convertQueryStringToObj();
    var addrData = {};
    if (typeof qs.addr !== "undefined") {
        addrData = {"lat" :qs.lat, "lng" : qs.lng, "addr" : qs.addr};
    } else {
        addrData = getParms();
    }
    if (typeof addrData.addr !== "undefined" && typeof addrData.lat !== "undefined" && typeof addrData.lng !== "undefined") {
        $("#searchLocation").val(addrData.addr);
        determineWasteCalendar(addrData);
    }
}

function loadPage() {
	var strCode="";
	if (document.location.hostname.length === 0) {
        icons = {  
                bluebin : "images/bluebin.png", 
                greenbin : "images/greenbin.png", 
                garbage : "images/garbagebin.png", 
                yardWaste : "images/yardwaste.png", 
                ctree : "images/ctree.png", 
                home: "images/home.png"
        };
        strCode += '<link rel="stylesheet" href="css/SWMCalendar.css">';
        strCode += '<script type="text/javascript" src="js/bootbox.js"></script>';
        strCode += '<script type="text/javascript" src="js/tabletop.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/addressLookup.min.js"></script>';
        $("#appSWMCalCode").html(strCode);
        $("#appSWMCalDisplay").load('html/SWMCalendar.html', function() {initApp();});
	} else {  
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/SWM%20Collection%20Calendar/css/SWMCalendar.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/bootbox/bootbox.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/tabletop/tabletop.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/WebApps/SWM%20Collection%20Calendar/js/addressLookup.min.js"></script>';
        $("#appSWMCalCode").html(strCode);
        $("#appSWMCalDisplay").load('/static_files/WebApps/SWM%20Collection%20Calendar/html/SWMCalendar.html', function() {initApp();});
    }

}
$( document ).ready(function() {
    loadPage();
});
})(this);