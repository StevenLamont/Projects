(function (window, undefined) {
   'use strict';
   
var gblMainMapInfoBox;
var gblDetailMapInfoBox;
var myLatLng,gblMainMap,gblDetailMap;
var gblOMS;  //spiderfying object
/* two maps, two sets of array Markers */
var gblMainMapMarkers = [];
var gblDetailMapMarkers = [];
var gblReservationData = [];                       
var gblReservationDataSortedByTime = [];
var gblReservationDataSortedByName = [];
var gblCurrentTab = "";
var gblRestData;
var gblFilteredRestaurantData = [];
var gblFilteredRestaurantImages = {};
var gblCurrentUNID;
var gblURLParms = {};
var gblCurScroll = 0;

var mapMarkers = { 
    restaurant : '/static_files/WebApps/images/markerblue.png',
    restaurant_selected : '/static_files/WebApps/images/markerblue_sel.png',
};
var icons = {  
    veg : '/static_files/WebApps/images/veggieicon.png',
    vegan : '/static_files/WebApps/images/veganicon.png',
    local : '/static_files/WebApps/images/localicon.png',
    acc : '/static_files/WebApps/images/fullyaccessibleicon.png'
};

/* Utility functions */

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

function removeQueryStringParm(parm) {

    if (gblURLParms[parm]) {
       delete gblURLParms[parm];
    
        var newqs  =  convertObjToQueryString(gblURLParms);
        var currURL = window.location.protocol + "//" + window.location.host + window.location.pathname +  newqs;
        if (history.pushState) {
            history.pushState({}, "ignored title", currURL);     
        }  
    }
}
function addQueryStringParm(parm, value) {

    gblURLParms[parm] = value;
    var newqs  =  convertObjToQueryString(gblURLParms);
    var currURL = window.location.protocol + "//" + window.location.host + window.location.pathname +  newqs;
    if (history.pushState) {
       history.pushState({}, "ignored title", currURL); 
    }
}  

function switchToTab(tab) {
    var tDiv = $('#tabToggle');
    gblCurrentTab = tab;
    $("#tabMap").removeClass('btn-primary');
    $("#tabMap").removeClass('btn-default');
    $("#tabList").removeClass('btn-primary');
    $("#tabList").removeClass('btn-default');
    $("#tabRev").removeClass('btn-primary');
    $("#tabRev").removeClass('btn-default');


    if (tab === "tabMap") {     
        $("#reservationtable").hide();
        $("#tabRev").removeClass('active');
        $("#liciouslisttable").hide();
        $("#tabList").removeClass('active');

        $("#liciousmap").show();
        $("#tabMap").addClass('active');
        $("#tabMap").addClass('btn-primary');
        addQueryStringParm("view","tabMap");
        //Actually redraw map in case selection was changed
        licMapInit();
        //var z =  map.getZoom(); //force a redraw
        //map.setZoom(z);
    } else if (tab === "tabList") {
        $("#liciousmap").hide();
        $("#tabMap").removeClass('active');
        $("#tabRev").removeClass('active');     
        $("#reservationtable").hide();
        
        $("#liciouslisttable").show();
        $("#tabList").addClass('active');
        $("#tabList").addClass('btn-primary');
        addQueryStringParm("view","tabList");

    } else {  /* tabRev */
        $("#liciousmap").hide();
        $("#tabMap").removeClass('active');
        $("#liciouslisttable").hide();
        $("#tabList").removeClass('active');
        $("#tabRev").addClass('active');
        $("#tabRev").addClass('btn-primary');
        $("#reservationtable").show();
        addQueryStringParm("view","tabRev");
    }
        
}

function setupEvents() {

	$('.btn-toggle .pageToggleBtn').on("click", function() {
        switchToTab($(this).prop("id"));
    });
    
    $("#maincontent").on("click",".showdetail", function() {
        gblCurScroll = $(window).scrollTop();
        drawDetail($(this).data("unid"));
		sendToQuantServ();		
    });
    
    /* we need the modal to be open before we draw the map */
    $('#detailModal').on('shown.bs.modal', function () {
        $(window).scrollTop(gblCurScroll);
        $("#liciousContent").addClass("hidden-print");
		$("#headerText").html(gblLiciousConfig.season);
        drawDetailMap();
        if (typeof addthis !== "undefined") {
            addthis.toolbox('.addthis_toolbox');
            addthis.counter('.addthis_counter'); // this re-drawns the counter-- which is the "share" button
            }
    });

    $("#detailModal").on('hidden.bs.modal', function () {
        $("#liciousContent").removeClass("hidden-print");
        closeDetailWindow();
        return false;
    });
    
    $( "#maincontent").find("select" ).change(function() {filterData();});
    $( ".chkBox" ).change(function() {filterData();});        
    $("#resetFilters").on("click", function() { resetFilters();});
    
    $("#maincontent").on("click", ".mapclose", function() {
        mapClose();
        return false;
    });
    
    /* AddThis doesn't work well when it is on the page twice, this makes sure we use the current URL in social media */
    if (typeof addthis !== "undefined") {
        addthis.addEventListener('addthis.menu.open', function(event){
            event.data.share.title = gblLiciousConfig.season;
            event.data.share.url = window.location.href;
        });
    }
    
    $("#searchBtn").on("click", function() {
        filterData();
    });

    $("#searchString").on("keypress", function(e) {
        var KeyCode = e.which || e.keyCode || 0;
        if (KeyCode === 13 || KeyCode === 9) {
            filterData();
        }
    }); 
    
    $(".hasclear").keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    }); 
    $(".clearer").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
        filterData();
    }); 
    $("#maincontent").on("click",".quantclick", function() {
		sendToQuantServ();
    }); 	
}

/* -- Map Functions */
function createInfoBox(m, infoBox, markers ) {
    var strPrice = m.lunchprice;
    if (m.lunchprice==="") {strPrice = m.dinnerprice;}
    if (m.lunchprice !== "" && m.dinnerprice !== "") {strPrice = m.lunchprice + " | " + m.dinnerprice;}

    var addText = document.createElement('div');
    addText.id = "mapinfoboxdata";
    addText.className = "map addText";
    addText.innerHTML = "<div class='mapclose'><a href='#'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a></div>";
    addText.innerHTML += "<div class='titleText'><a class='showdetail' title='More information' href='#' data-unid='" + m.unid + "'>" + m.name + "</a></div>";
    addText.innerHTML += "<div class='map sumText'>"+ m.addsummary + "</br>" + m.phone + "</div><br />";
	addText.innerHTML += "<div>" + m.cuisine + "<br/>" + strPrice + "</div>";
	
    infoBox.innerHTML = addText.outerHTML;

    if (markers.length > 0) {
    for (var i=0;i< markers.length;i++) {
        $("#mapmarker" + i + "row").removeClass("highlight");
        if (markers[i].type=="restaurant") {
            markers[i].setIcon(mapMarkers.restaurant);
            markers[i].setZIndex(200000000);
        } else {
            markers[i].setIcon(mapMarkers.culinary);
            markers[i].setZIndex(200000001);
        }

    }
    $("#" + m.id + "row").addClass("highlight");
    }

    m.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function(){ m.setAnimation(null); }, 750);
    if (m.type=="restaurant") {
        m.setIcon(mapMarkers.restaurant_selected);
    } else {
        m.setIcon(mapMarkers.culinary_selected);
    }
    m.setZIndex(288000001);
}

function resetMap(map, markers) {
    mapClose();
    var strKey = gblURLParms.key;

    if (typeof gblURLParms.key !== 'undefined')
    {
        map.setZoom(14);
    } else {
        //var defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(43.589344,-79.631653),new google.maps.LatLng(43.809756,-79.232025));
		var defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(43.699223,-79.394098));
        map.fitBounds(defaultBounds);
        map.setZoom(11);
    }

    for (var i=0;i<markers.length;i++) {
        if (markers[i].type=="restaurant") {
            markers[i].setIcon(mapMarkers.restaurant);
            markers[i].setZIndex(276000000);
        } else {
            markers[i].setIcon(mapMarkers.culinary);
            markers[i].setZIndex(277000000);
        }
        if (markers[i].unid == strKey) {
            map.setCenter(markers[i].position);
            markers[i].setZIndex(277000001);
            markers[i].setIcon(mapMarkers.restaurant_selected);
        }
    }
}

function mapClose() {
    $('#mapinfoboxdata').remove();
}

function licMapInit() {

    gblMainMapMarkers = [];

    var myLatLng = new google.maps.LatLng(43.699223,-79.394098);
    var mapOptions = {
    zoom: 11,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
    panControl:false,zoomControl: true,
    zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}};

    gblMainMap = new google.maps.Map(document.getElementById('liciousmap'),mapOptions);

    var marker;
    gblMainMapInfoBox = document.createElement('div');
    gblMainMapInfoBox.id = "mapinfobox";
    gblMainMapInfoBox.className = "infoBox";
    gblMainMap.controls[google.maps.ControlPosition.TOP_LEFT].push(gblMainMapInfoBox);

    var buttonUI = document.createElement('button');
    buttonUI.id = "resetMap";
    buttonUI.className = "resetMap";
    buttonUI.innerHTML = "Reset Map";
    buttonUI.onclick = function () { resetMap(gblMainMap,gblMainMapMarkers);};
    gblMainMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);
    
    gblOMS = new OverlappingMarkerSpiderfier(gblMainMap, {keepSpiderfied : true, legWeight : 3,markersWontMove : true, markersWontHide : true,nearbyDistance  :10});

    var index;
    $.each(gblFilteredRestaurantData, function(i, item) {
        index = i;
        myLatLng = new google.maps.LatLng(item.lic_lat,item.lic_lng);
        marker = new google.maps.Marker({
                id: "mapmarker" + index,
                type: "restaurant",
                icon: mapMarkers.restaurant,
                position: myLatLng,
                map: gblMainMap,
                name: item.lic_restName,
                summary: item.lic_profile,
                addsummary : item.lic_address,
                neighbourhood : item.lic_neighbourhood.join(', '),
                phone : item.lic_phone,
                cuisine : item.lic_cuisine.join(', '),
                unid: item.lic_documentID,
                lunchprice : item.lic_lunchprice,
                dinnerprice : item.lic_dinnerprice});
        marker.setZIndex(277000000);
        gblMainMapMarkers.push(marker);
        gblOMS.addMarker(marker);

        // google.maps.event.addDomListener(marker, 'click', function (){
        //  createInfoBox(this,gblMainMapInfoBox, gblMainMapMarkers);
        //});
        gblOMS.addListener('click', function(marker, event) { 
           createInfoBox(marker,gblMainMapInfoBox, gblMainMapMarkers);
        });

    });
	if("geolocation" in navigator && jQuery.browser.mobile === true) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
			gblMainMap.setCenter(initialLocation);
            gblMainMap.setZoom(13);
            }, function() {
                //handleNoGeolocation(browserSupportFlag);
        });
    }		

}

/* Listing Functions */
function drawRestaurantListing() {

    var strRows = "";
    $.each(gblFilteredRestaurantData, function(i, item) {
        strRows += "<tr id='liciouslisttablerow" + i + "'>";
        strRows += "<td>";
        strRows += "<div>";
        strRows += '<div class="col-xs-12 col-sm-10 col-sm-push-2">';
        strRows += '<div class="restaurantname">';
        strRows += '<h3 class="lic_restname">';
        strRows += '<a href="#" class="showdetail" data-toggle="tooltip" data-placement="bottom" title="View the ' + gblLiciousConfig.season + ' menu for '+item.lic_restName+'" data-unid="' + item.lic_documentID + '">';
        strRows += item.lic_restName;
        strRows += '</a>';
        strRows += '</h3>';

        strRows += '<div class="lic_hotel">' + item.lic_hotel + '</div>';
        strRows += '</div>';
        strRows += '<div class="row">';
        strRows += '<div class="col-xs-12 col-sm-7">';
        strRows += '<div class="lic_address">' + item.lic_address;
        strRows += (item.lic_additionaladdress==="") ? '':', ' + item.lic_additionaladdress;
        strRows += '</div>';
        strRows += '<div class="lic_phone">' + item.lic_phone + '</div>';
        strRows += '<div class="lic_neighbourhood">' + item.lic_neighbourhood.join(', ') + '</div>';
        strRows += '<div style="height: 0; overflow: hidden;">';
        strRows += item.lic_search_name;
        strRows += (item.lic_veggie=="Yes") ? '<span>vegetarianoffered</span>' : '';
        strRows += (item.lic_vegan=="Yes") ? '<span>veganoffered</span>' : '';
        strRows += (item.lic_local=="Yes") ? '<span>localfood</span>' : '';
        strRows += (item.lic_accessible=="Yes") ? '<span>accessible</span>' : '';
        strRows += '</div>';

        strRows += '<p class="icons">';
        strRows += (item.lic_veggie=="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Vegetarian<br/>three-course<br/>menu option<br/>available at <br/>'+item.lic_restName+'" class="icon" alt="'+item.lic_restName+' Vegetarian option Icon" src="' + icons.veg + '" />' : '';
        strRows += (item.lic_vegan==="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Vegan<br/>three-course<br/>menu option<br/>available at <br/>'+item.lic_restName+'" class="icon" alt="'+item.lic_restName+' Vegan option Icon" src="' + icons.vegan +'" />' : '';
        strRows += (item.lic_local==="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Locally sourced<br/>menu option<br/>available at <br/>'+item.lic_restName+'" class="icon" alt="Local Meals Offered Icon for '+item.lic_restName+'" src="' + icons.local + '" />' : '';
        strRows += (item.lic_accessible==="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="'+item.lic_restName+' Accessible<br/>restaurant" class="icon" alt="'+item.lic_restName+ 'Restaurant Accessible Icon" src="' + icons.acc + '" />' : '';
        strRows += '</p>';

        strRows += '<div style="display: none;">';
        var arrCuisine = item.lic_cuisine;
        for (i=0; i < arrCuisine.length; i++) {
            strRows += "Cuisine:" + arrCuisine[i];
        }
        strRows += item.lic_lunchmenu + item.lic_dinnermenu;
        strRows += '</div>';
                                        
        strRows += '</div>';

        strRows += '<div class="col-xs-12 col-sm-5">';
        strRows += '<div>';
        strRows += (item.lic_lunch=="Yes") ? '<span>' + item.lic_lunchprice + '</span>' : '';
        strRows += (item.lic_lunch=="Yes" && item.lic_dinner=="Yes") ? ' | ' : '';
        strRows += (item.lic_dinner=="Yes") ? '<span>' + item.lic_dinnerprice + '</span>' : '';
        strRows += '<div>' + item.lic_cuisine.join(', ') + '</div>';
        strRows += '</div>';
        strRows += '</div>';

        strRows += '</div><!--end row-->';
        strRows += '</div><!--end col-sm-10-->';

        strRows += '<div class="hidden-xs col-sm-2 col-sm-pull-10">';
        //strRows += '<a href="/wps/portal/contentonly?vgnextoid=' + detailGUID + '&key=' + item["lic_documentID"] + '">';
        strRows += '<a href="#" class="showdetail" data-unid="' + item.lic_documentID + '">';
        strRows += '<img  data-toggle="tooltip" data-placement="bottom" title="View the ' + gblLiciousConfig.season + ' menu for '+item.lic_restName+'" alt="Image of the' + item.lic_restName + '" class="restImg img-responsive img-thumbnail" src="' + item.lic_imagelink + '" />';
        strRows += '</a>';
        strRows += '</div>';

        strRows += '</div>';
        strRows +="</td></tr>";
    });
    
    if (strRows === "") {
        strRows += "<tr id='liciouslisttablerow0' ><td class='col-md-12'>No restaurants found</td></tr>";
    }
    strRows = '<thead><tr><th  class="filter-match" >' + gblLiciousConfig.season + ' Prix Fixe Restaurant List</th></tr></thead><tbody>' + strRows + '</tbody>';
    
    $("#liciouslisttable").html(strRows);
    $('.icons img').tooltip({html: true});

    var strSearch = "";


}

function restoreFilters() {

    gblURLParms = convertQueryStringToObj();
    if ($.type(gblURLParms.cs)!="undefined") {$("#filterCuisine").val(gblURLParms.cs);}
    if ($.type(gblURLParms.nbh)!="undefined") {$("#filterNeighbourhood").val(gblURLParms.nbh);}
    if ($.type(gblURLParms.lpa)!="undefined") {$("#LunchPriceA").prop('checked', true);}
    if ($.type(gblURLParms.lpb)!="undefined") {$("#LunchPriceB").prop('checked', true);}
    if ($.type(gblURLParms.lpc)!="undefined") {$("#LunchPriceC").prop('checked', true);}
    if ($.type(gblURLParms.dpa)!="undefined") {$("#DinnerPriceA").prop('checked', true);}
    if ($.type(gblURLParms.dpb)!="undefined") {$("#DinnerPriceB").prop('checked', true);}
    if ($.type(gblURLParms.dpc)!="undefined") {$("#DinnerPriceC").prop('checked', true);}
    if ($.type(gblURLParms.acc)!="undefined") {$("#filterAccessible").prop('checked', true);}
    if ($.type(gblURLParms.veg)!="undefined") {$("#filterVeggie").prop('checked', true);}
    if ($.type(gblURLParms.vegan)!="undefined") {$("#filterVegan").prop('checked', true);}
    if ($.type(gblURLParms.loc)!="undefined") {$("#filterLocal").prop('checked', true);}
    if ($.type(gblURLParms.ss)!="undefined") {$("#searchString").val(gblURLParms.ss);}

}

function filterData() {
    var numPrice = 0;
    
    var searchStr = $("#searchString").val();
 
    var qsCS = "", qsNBH = "";
    var fc = $("#filterCuisine");
    var fn  = $("#filterNeighbourhood");
    var facc = $("#filterAccessible");
    var fveg = $("#filterVeggie");
    var fvegan = $("#filterVegan");
    var floc = $("#filterLocal");

    if (fc.length > 0) {qsCS =  (fc.val()!="All Cuisines") ? fc.val() :"";}
    if (fn.length > 0) {qsNBH = (fn.val()!="All Neighbourhoods") ? fn.val() : "";}
    var qsLPA = ($("#LunchPriceA").is(':checked')) ? gblLiciousConfig.lunchPriceA + " Lunch" : "FALSE";
    var qsLPB = ($("#LunchPriceB").is(':checked')) ? gblLiciousConfig.lunchPriceB + " Lunch" : "FALSE";
    var qsLPC = ($("#LunchPriceC").is(':checked')) ? gblLiciousConfig.lunchPriceC + " Lunch" : "FALSE";
    var qsDPA = ($("#DinnerPriceA").is(':checked')) ? gblLiciousConfig.dinnerPriceA + " Dinner" : "FALSE";
    var qsDPB = ($("#DinnerPriceB").is(':checked')) ? gblLiciousConfig.dinnerPriceB + " Dinner" : "FALSE";
    var qsDPC = ($("#DinnerPriceC").is(':checked')) ? gblLiciousConfig.dinnerPriceC + " Dinner" : "FALSE";
    var qsACC = (facc.is(':checked')) ? "Yes" : "";
    var qsVEG = ( fveg .is(':checked')) ? "Yes" : "";
    var qsVEGAN = (fvegan.is(':checked')) ? "Yes" : "";
    var qsLOC = (floc.is(':checked')) ? "Yes" : "";
 
    if (fc.val()!="All Cuisines") {addQueryStringParm('cs',fc.val());} else {removeQueryStringParm('cs');}
    if (fn.val()!="All Neighbourhoods") {addQueryStringParm('nbh',fn.val());} else {removeQueryStringParm('nbh');}
    if (qsLPA !== 'FALSE') {addQueryStringParm('lpa','yes');numPrice++;} else {removeQueryStringParm('lpa');}
    if (qsLPB !== 'FALSE') {addQueryStringParm('lpb','yes');numPrice++;} else {removeQueryStringParm('lpb');}
    if (qsLPC !== 'FALSE') {addQueryStringParm('lpc','yes');numPrice++;} else {removeQueryStringParm('lpc');}
    if (qsDPA !== 'FALSE') {addQueryStringParm('dpa','yes');numPrice++;} else {removeQueryStringParm('dpa');}
    if (qsDPB !== 'FALSE') {addQueryStringParm('dpb','yes');numPrice++;} else {removeQueryStringParm('dpb');}
    if (qsDPC !== 'FALSE') {addQueryStringParm('dpc','yes');numPrice++;} else {removeQueryStringParm('dpc');}
    if (qsACC !== "") {addQueryStringParm("acc",facc.val());} else {removeQueryStringParm('acc');}
    if (qsVEG !== "") {addQueryStringParm("veg", fveg.val());} else {removeQueryStringParm('veg');}
    if (qsVEGAN !== "") {addQueryStringParm("vegan", fvegan.val());} else {removeQueryStringParm('vegan');}
    if (qsLOC !== "") {addQueryStringParm("loc", floc.val());} else {removeQueryStringParm('loc');}
    
    if (searchStr.length > 0) {addQueryStringParm("ss", searchStr); } else {removeQueryStringParm('ss'); }

    var urlParmsLength = Object.keys(gblURLParms).length;
    if ($.type(gblURLParms.appInstanceName) !== 'undefined') { urlParmsLength--;}
    if ($.type(gblURLParms.vgnextoid) !== 'undefined') { urlParmsLength--;}
    if ($.type(gblURLParms.view) !== 'undefined') { urlParmsLength--;}
    if (urlParmsLength === 0) {$("#resetFilters").css("visibility", "hidden");} else {$("#resetFilters").css("visibility", "visible");}
    var blnPrice = false;

	gblFilteredRestaurantImages = {};
    gblFilteredRestaurantData = [];
    var skipItem = false;
    for (var i = 0; i < gblRestData.restaurants.length; i++) {
        var item = gblRestData.restaurants[i];
        skipItem = false;
        if (JSON.stringify(item).toLowerCase().indexOf($("#searchString").val().toLowerCase()) === -1) {
            skipItem = true;
        }
        if (qsVEG!=="" && item.lic_veggie!==qsVEG) { skipItem = true;}
        if (qsVEGAN!=="" && item.lic_vegan!=qsVEGAN){ skipItem = true;}
        if (qsLOC!=="" && item.lic_local!=qsLOC){ skipItem = true;}
        if (qsACC!=="" && item.lic_accessible!=qsACC) { skipItem = true;}
        if (qsCS!=="" &&item.lic_cuisine.indexOf(qsCS) === -1) { skipItem = true;}
        if (qsNBH!=="" && item.lic_neighbourhood.indexOf(qsNBH) === -1) { skipItem = true;}
        if  ((qsLPA==="FALSE"&&qsLPB==="FALSE"&&qsLPC==="FALSE"&&qsDPA==="FALSE"&&qsDPB==="FALSE"&&qsDPC==="FALSE") ||
             (qsLPA!=="FALSE" && item.lic_lunchprice.indexOf(qsLPA) > -1) ||
             (qsLPB!=="FALSE" && item.lic_lunchprice.indexOf(qsLPB) > -1) ||
             (qsLPC!=="FALSE" && item.lic_lunchprice.indexOf(qsLPC) > -1) ||
             (qsDPA!=="FALSE" && item.lic_dinnerprice.indexOf(qsDPA) > -1) ||
             (qsDPB!=="FALSE" && item.lic_dinnerprice.indexOf(qsDPB) > -1) ||
             (qsDPC!=="FALSE" && item.lic_dinnerprice.indexOf(qsDPC) > -1)) {} else { skipItem = true;}
                
        if (!skipItem) {
          gblFilteredRestaurantData.push(item);
		  gblFilteredRestaurantImages[item.lic_documentID] = item.lic_imagelink;
        }
    }
    drawRestaurantListing();
	if (gblLiciousConfig.showReservationTab) {
		drawReservationListing();
	}
    licMapInit();
}

function resetFilters() {
    $("#filterCuisine").val("All Cuisines");
    $("#filterNeighbourhood").val("All Neighbourhoods");
    $("#LunchPriceA").prop('checked', false);
    $("#LunchPriceB").prop('checked', false);
    $("#LunchPriceC").prop('checked', false);
    $("#DinnerPriceA").prop('checked', false);
    $("#DinnerPriceB").prop('checked', false);
    $("#DinnerPriceC").prop('checked', false);
    $("#filterAccessible").prop('checked', false);
    $("#filterVeggie").prop('checked', false);
    $("#filterVegan").prop('checked', false);
    $("#filterLocal").prop('checked', false);
    $("#searchString").val('');
    filterData();
}

//Note: documentId is a domino id and not a restuarantId, so match via address
//There can be multiple records per restaurant, se need to report them all
function addInCurrentReservations(address, restName, restaurantId) {

    var strHTML = "";   
    var cnt = 0;
    var resLine ="";
    $.each(gblReservationDataSortedByTime, function(i, item) {
        
        //if (item.lic_address === address && item.lic_restname === restName) {
        if (item.lic_restaurantid === restaurantId) {
            strHTML += "<br>";
            if (cnt === 0) {
                strHTML += "<p><strong>Today's Reservation Availability:</strong></p>";
                resLine = item.lic_reserveline;
            }
            strHTML += (item.lic_lunchoption!=="")? "<div>" : "";
            strHTML += (item.lic_lunchoption==="")? '' : '<span><strong>Lunch</strong>: ' + item.lic_lunchoption + ' today</span>';
            strHTML += (item.lic_lunchoption!=="")? "</div>" : "";

            strHTML += (item.lic_dinneroption!=="")? "<div>" : "";
            strHTML += (item.lic_dinneroption==="")? '' : '<span><strong>Dinner</strong>: ' + item.lic_dinneroption + ' today</span>';
            strHTML += (item.lic_dinneroption!=="")? "</div>" : "";
            strHTML += '<div><small><em>Date posted by restaurant: ' + item.lic_datetime + '</em></small></div>';

            cnt++;
        }
        
    });
    if (cnt > 0) {
        strHTML += '<p><span>Call ' + resLine + " to book your table.</span>";
    }
    return  strHTML;    
}

function drawDetail(strID) {
    gblCurrentUNID = strID;
    addQueryStringParm("key",strID);
   
    var strHTML="";
    $.each(gblRestData.restaurants, function(i, item) {
        if (item.lic_documentID== gblCurrentUNID) {
            strHTML += '<div style="" class="row liciousdetail">';
                strHTML += '<div class="col-xs-12 col-sm-8">';
                    strHTML += '<h1 class="col-xs-12 lic_restname">' + item.lic_restName + '</h1>';
                    strHTML += (item.lic_hotel==="") ? "" : '<p class="lic_hotel">' + item.lic_hotel + '</p>';
                    strHTML += '<p class="addresssection"><span class="lic_address">' + item.lic_address + '</span>';
                    strHTML += (item.lic_additionaladdress==="") ? '':', ' + item.lic_additionaladdress;
                    strHTML += '<span class="lic_address hidden-print" cotlabel="map">   (<a title="map" href="http://maps.google.com?q='+ item.lic_address + ' Toronto Ontario" target="_blank">map</a>)</span></p>';
                    strHTML += '<p class="lic_phone">' + item.lic_phone + '</p>';
                    strHTML += '<p class="lic_neighbourhood">' + item.lic_neighbourhood.join(', ') + '</p>';
                    strHTML += '<p class="icons">';
                    strHTML += (item.lic_veggie=="Yes") ? '<img class="icon lic_veggie" title="" data-original-title="Vegetarian three-course menu option available at '+item.lic_restName+'" alt="'+item.lic_restName+' Vegetarian Option Icon" src="' + icons.veg + '">' : '';
                    strHTML += (item.lic_vegan=="Yes") ? '<img class="icon lic_vegan" title="" data-original-title="Vegan three-course menu option available '+item.lic_restName+'" alt="' +item.lic_restName+ 'Vegan Option Icon" src="' + icons.vegan + '">' : '';
                    strHTML += (item.lic_local=="Yes") ? '<img class="icon lic_local" alt="Local Meals Offered Icon for '+item.lic_restName+'" src="' + icons.local + '" title="" data-original-title="Locally sourced menu option available at '+item.lic_restName+'">' : '';
                    strHTML += (item.lic_accessible=="Yes") ? '<img class="icon lic_accessible" title="" alt="'+item.lic_restName+' Accessible Icon" src="' + icons.acc + '" data-original-title="'+item.lic_restName+' Accessible restaurant">' : '';
                    strHTML += '</p>';
                    
                    strHTML += '<div class="sitelinks">';
                    strHTML += (item.lic_url==="") ? "": '<span class="lic_www hidden-print"><a title="Website" href="' + item.lic_url + '" target="_blank">Website</a></span>';
                    strHTML += (item.lic_twit===""|| item.lic_twit==="http://twitter.com/" || item.lic_twit==="https://twitter.com/") ? "": '<span class="lic_twit hidden-print"><a title="Twitter" href="' + item.lic_twit + '" target="_blank">Twitter</a></span>';
                    strHTML += (item.lic_instagram===""|| item.lic_instagram==="http://instagram.com/"|| item.lic_instagram==="https://instagram.com/" ) ? "": '<span class="lic_instagram hidden-print "><a title="Instagram site" href="' + item.lic_instagram + '" target="_blank">Instagram</a></span>';
                    strHTML += (item.lic_fb==="" || item.lic_fb==="http://www.facebook.com/"|| item.lic_fb==="https://www.facebook.com/") ? "": '<span class="lic_fb hidden-print"><a title="Facebook" href="' + item.lic_fb + '" target="_blank">Facebook</a></span>';
                    //strHTML += (item.lic_youtube==="") ? "": '<span class="lic_fb hidden-print"><a title="Youtube site" href="' + item.lic_youtube + '" target="_blank">Youtube</a></span>';
                    strHTML += '</div>';
                    
                    
                    strHTML += '<p class="lic_profile">' + item.lic_profile.join('<br>') + '</p>';
                    strHTML += '<p><span><strong>Cuisine: </strong></span><span class="lic_cuisine">' + item.lic_cuisine.join(', ') + '</span></p>';
                    
                                                            
                    strHTML += '<div id="reservationLink"></div>';
                    strHTML += addInCurrentReservations(item.lic_address, item.lic_restName, item.lic_documentID);
                                        
                    strHTML += '<div class="sitelinks">';
                    strHTML += (item.lic_lunchlink==="" && item.lic_dinnerlink==="") ? "": '<br><p><strong>' + 'Reserve online</strong>  for seatings between ' + gblLiciousConfig.dateReservation + '</p><img src="/static_files/WebApps/images/fork.png"> &nbsp;';
                    strHTML += (item.lic_lunchlink==="") ? "": '<span class="lic_lunchlink"><a title="Reserve Lunch" href="' + item.lic_lunchlink + '" target="_blank">Reserve Lunch</a></span>';
                    strHTML += (item.lic_dinnerlink==="") ? "": '<span class="lic_dinnerlink"><a title="Reserve Dinner" href="' + item.lic_dinnerlink + '" target="_blank">Reserve Dinner</a></span>';
                    strHTML += (item.lic_lunchlink==="" && item.lic_dinnerlink==="") ? "": '<br>';
                    strHTML += '</div>';
                    
                    strHTML += '<img class="visible-xs img-thumbnail detail-right lic_imagelink" src="' + item.lic_imagelink + '" alt="Image of the restaurant ' + item.lic_restName + '">';
                    
                    var smCol = (item.lic_lunch=="Yes" && item.lic_dinner=="Yes") ? "col-sm-6" : "col-sm-12";

                    if (item.lic_lunch=="Yes") {
                        strHTML += '<div class="lic_lunch col-xs-12 ' + smCol + '">';
                        strHTML += '<div class="menu_heading"><p class="lic_lunchprice">' + item.lic_lunchprice + '</p>';
                        strHTML += '<p class="lic_lunch">Plus taxes and gratuity</p></div>';
                        strHTML += '<p>' + item.lic_lunchmenu.join('<br>') + '</p></div>';
                    }
                    if (item.lic_dinner=="Yes") {
                        strHTML += '<div class="lic_dinner col-xs-12 ' + smCol + '">';
                        strHTML += '<div class="menu_heading"><p class="lic_dinnerprice">' + item.lic_dinnerprice + '</p>';
                        strHTML += '<p class="lic_dinner">Plus taxes and gratuity</p></div>';
                        strHTML += '<p>' + item.lic_dinnermenu.join('<br>') + '</p></div>';
                    }
            
                strHTML += '</div>';

            strHTML += '<div class="col-xs-12 col-sm-4"><img class="hidden-xs img-thumbnail detail-right lic_imagelink" src="' + item.lic_imagelink + '" alt="Image of the restaurant ' + item.lic_restName + '">';           
                strHTML += '<div style="margin: auto;"><input id="searchTextField" type="text" size="50">';
                    strHTML += '<div style="height: 300px; width: 100%; position: relative; overflow: hidden; -webkit-transform: translateZ(0px); background-color: rgb(229, 227, 223);  margin-top: 10px; margin-bottom: 5px; " id="map-canvas" class="hidden-xs">';
                    strHTML += '</div>';
                    strHTML += '<div class="hidden-xs">';
                    
                    //strHTML += '<img src="' + mapMarkers.culinary + '"/> Culinary Events ' + ' <img src="' + mapMarkers.restaurant + '""/> Prix Fixe Restaurants';
                    strHTML += '</div><br>';
                    strHTML += '<div class="mapoption active"><div class="hidden-print"><a class="ttcplanner"' + ' href=' + '"http://maps.google.ca?daddr=' + item.lic_address + '"' + ' target="_blank"'+ '>Get Directions</a></div></div>';
                    
                    
            strHTML += '</div></div>';
        
            
            strHTML += '<div class="col-xs-12">';
                strHTML += '<div class="disclaimer alert alert-info">';
                    strHTML += '<p><small>Prices listed are per person. Beverages, taxes and gratuity are additional. Some restrictions apply. Lunch and Dinner menus include starter, entrée and dessert.</small></p><br>';
                    strHTML += '<p><small>Restaurant operating hours vary. Lunch menu start and end times vary per restaurant. Some restaurants offer only a brunch menu on weekends and do not participate in the ' + gblLiciousConfig.season + ' lunch promotion. Contact individual restaurants for details.</small></p><br>';
                    strHTML += '<p><strong><small>Online Reservations</small></strong></p>';
                    strHTML += "<p><small>The City of Toronto is not involved in the online reservation of restaurants. For those restaurants participating in the online reservation program, you will see a Reserve Lunch and/or Reserve Dinner link on the first day reservations are accepted. When you click these links you are leaving the City's website. Any information you provide to make the reservation is not collected by the City of Toronto.</small></p><br>";
                    strHTML += "<p><small><strong>Today's Reservations</strong> details are populated by the restaurants participating in the Prix Fixe promotion. Information was accurate at the time of posting. Please contact the restaurants directly for more information and to reserve a table.</small></p>";
                strHTML += '</div>';
            strHTML += '</div>';
            return false;
        }
    });

    $( "#modalBody" ).html(strHTML);
    //Show Modal before drawing map. If modal is already open, just redraw map. User can click on map icon in modal.
    if ($("#detailModal").hasClass('in')) {
        drawDetailMap();
    } else {
        $("#detailModal").modal('show');
    }
    
} 

function drawDetailMap() {
    //SET UP DETAIL MAP
    myLatLng = new google.maps.LatLng(43.721459,-79.373903);
    var mapOptions = {zoom: 14,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
    panControl:false,zoomControl: true,zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}};
    gblDetailMap = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
    var marker;
    var buttonUI = document.createElement('button');
    buttonUI.id = "resetMap";
    buttonUI.className = "resetMap hidden-print";
    buttonUI.innerHTML = "Reset Map";
    buttonUI.onclick = function () { resetMap(gblDetailMap, gblDetailMapMarkers);};
    gblDetailMap.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);
    gblDetailMapInfoBox = document.createElement('div');
    gblDetailMapInfoBox.id = "mapinfobox";
    gblDetailMapInfoBox.className = "infoBox";
    gblDetailMap.controls[google.maps.ControlPosition.TOP_LEFT].push(gblDetailMapInfoBox);
    //**********************
    $.each(gblFilteredRestaurantData, function(i, item) {
        myLatLng = new google.maps.LatLng(item.lic_lat,item.lic_lng);
        marker = new google.maps.Marker({
            id: "mapmarker" + i,
            type: "restaurant",
            icon: mapMarkers.restaurant,
            position: myLatLng,
            map: gblDetailMap,
            name: item.lic_restName,
            summary: item.lic_profile.join('<br>'),
            addsummary : item.lic_address,
            neighbourhood : item.lic_neighbourhood.join(', '),
            phone : item.lic_phone,
            cuisine : item.lic_cuisine.join(', '),
            unid: item.lic_documentID,
            lunchprice : item.lic_lunchprice,
            dinnerprice : item.lic_dinnerprice
        });
        marker.setZIndex(277000000);
        if (item.lic_documentID == gblCurrentUNID) {
            gblDetailMap.setCenter(myLatLng);
            marker.setZIndex(299000001);
            marker.setIcon(mapMarkers.restaurant_selected);
        }
        gblDetailMapMarkers.push(marker);
        google.maps.event.addDomListener(marker, 'click', function (){
            createInfoBox(this,gblDetailMapInfoBox, gblDetailMapMarkers);
            });
    });

    $('.icons img').tooltip({html: true, placement: "right"});
}

function closeDetailWindow() {

    removeQueryStringParm("key");
    $('body').removeClass('modal-open'); //bug is bootstrap?

}
function sortByName(a, b) {
    var A = a.lic_restName.toLowerCase();
	var B = b.lic_restName.toLowerCase();
	if (A > B) {
            return 1;
    }
    if (A < B) {
		return -1;
    }
    return 0
}
function getRestaurants() {
    var request = $.ajax({
        type: 'GET',
        url: gblLiciousConfig.restaurantURL ,
        dataType: 'jsonp',
        jsonpCallback: 'jsonRestaurantsCallBack',
        contentType: "application/json",
        success: function (data) {
			//gblRestData = {};
            //gblRestData.restaurants = data; //SML do Ineed this
			gblRestData = data;			
            gblFilteredRestaurantData = data.restaurants.sort(sortByName);
        }
    });
	return request;
}

/* want descending */
function sortReservations(a, b) {
    return new Date(b.lic_datetime).getTime() - new Date(a.lic_datetime).getTime();
}
function sortByTime(a, b) {
	if (a.lic_restname.toLowerCase() > b.lic_restname.toLowerCase()) {
            return 1;
    }
    if (a.lic_restname.toLowerCase() < b.lic_restname.toLowerCase()) {
		return -1;
    }
    return 0
}
function getReservations() {
	var request = $.ajax({
			type: 'GET',
			url: gblLiciousConfig.reservationURL ,
			dataType: 'jsonp',
			jsonpCallback: 'jsonReservationsCallBack',
			contentType: "application/json",
			success: function (data) {
				gblReservationData = data;   
				gblReservationDataSortedByTime = data.reservations.sort(sortReservations);
				gblReservationDataSortedByName = data.reservations.sort(sortByTime);
			}
	}); 
	return request;
}
function drawReservationListing() {
	

    var strRows = "";
    if (gblReservationDataSortedByName.length===0) {
        strRows = "<tr><td>At this time no restaurants have submitted reservation availability details. Visit this page often to see new postings.</td></tr>";
    } else {
    $.each(gblReservationDataSortedByName, function(i, item) {
		if (!gblFilteredRestaurantImages[item.lic_restaurantid]) { //skip restaurants not in filtered data
			return true;
		}
        strRows += "<tr id='liciousrevlisttablerow" + i + "'>";
                strRows += "<td>";
                strRows += "<div>";
					strRows += '<div class="col-xs-12 col-sm-10 col-sm-push-2">';
                        strRows += '<div class="restaurantname">';
                            strRows += '<h3 class="lic_restname">';
							strRows += '<a href="#" class="showdetail" data-toggle="tooltip" data-placement="bottom" title="View the ' + gblLiciousConfig.season + ' menu for '+item.lic_restName+'" data-unid="' + item.lic_restaurantid + '">';
							strRows += item.lic_restname;
							strRows += '</a>';
                            strRows += '</h3>';
                            strRows += (item.lic_lunchoption!=="")? "<div>" : "";
                            strRows += (item.lic_lunchoption==="")? '' : '<span><strong>Lunch</strong>: ' + item.lic_lunchoption + ' today</span>';
                            strRows += (item.lic_lunchoption!=="")? "</div>" : "";
                            strRows += (item.lic_dinneroption!=="")? "<div>" : "";
                            strRows += (item.lic_dinneroption==="")? '' : '<span><strong>Dinner</strong>: ' + item.lic_dinneroption + ' today</span>';
                            strRows += (item.lic_dinneroption!=="")? "</div>" : "";
                            strRows += '<p><span>Call ' + item.lic_reserveline + " to book your table. </span>";
                            strRows += (item.lic_lunchlink==="") ? "": '<span class="lic_lunchlink"><a class="quantclick" title="Reserve Lunch" href="' + item.lic_lunchlink + '" target="_blank">Reserve Lunch</a></span>&nbsp;&nbsp;';
                            strRows += (item.lic_dinnerlink==="") ? "": '<span class="lic_dinnerlink"><a class="quantclick" title="Reserve Dinner" href="' + item.lic_dinnerlink + '" target="_blank">Reserve Dinner</a></span></p>';
                            strRows += '<p><small><em>Date posted: ' + item.lic_datetime + '</em></small></p>';
                            
                        strRows += '</div>';
                    strRows += '</div>';
					
					// add in image
					strRows += '<div class="hidden-xs col-sm-2 col-sm-pull-10">';
					strRows += '<a href="#" class="showdetail" data-unid="' + item.lic_restaurantid + '">';
					strRows += '<img  data-toggle="tooltip" data-placement="bottom" title="View the ' + gblLiciousConfig.season + ' menu for '+item.lic_restname+'" alt="Image of the' + item.lic_restname + '" class="restImg img-responsive img-thumbnail" src="' + gblFilteredRestaurantImages[item.lic_restaurantid] + '" />';
					strRows += '</a>';
					strRows += '</div>';
					// end add in image
                strRows += '</div>';
            strRows +="</td></tr>";
    });}
	if (strRows === "") {
        strRows += "<tr id='liciouslisttablerow0' ><td class='col-md-12'>No restaurants found</td></tr>";
    }

    strRows = '<thead><tr><th  class="filter-match">Today\'s Reservations</th></tr></thead><tbody>' + strRows + '</tbody>';
    $("#reservationtable").html(strRows);

    
}



function setUpFilters() {
    var filter = $("#filterCuisine");
    $.each(gblLiciousConfig.cuisines, function(i, item) {
        filter.append("<option>" + item + "</option");
    });
	
    var filter = $("#filterNeighbourhood");
    $.each(gblLiciousConfig.neighbourhoods, function(i, item) {
        filter.append("<option>" + item + "</option");
    });	
    $("#lblLunchPriceA").text(gblLiciousConfig.lunchPriceA);
    $("#lblLunchPriceB").text(gblLiciousConfig.lunchPriceB);
    $("#lblLunchPriceC").text(gblLiciousConfig.lunchPriceC);
    $("#lblDinnerPriceA").text(gblLiciousConfig.dinnerPriceA);
    $("#lblDinnerPriceB").text(gblLiciousConfig.dinnerPriceB);
    $("#lblDinnerPriceC").text(gblLiciousConfig.dinnerPriceC);
	
	if (!gblLiciousConfig.showReservationTab) {
		$("#tabRev").hide();
	}
}

/* _qevents will be in the global scope */
function sendToQuantServ() {
	if (_qevents) {
		_qevents.push({qacct:"p-E4hpL7mL2PFtu",event:"refresh",labels:"_fp.event.Winterlicious Restaurant Button"});
	}
}

function initApp() {

	setUpFilters();
    restoreFilters();
	var dataPromises = [];
	dataPromises.push(getRestaurants());
	if (gblLiciousConfig.showReservationTab) {
		dataPromises.push(getReservations());
	}
	
	$.when.apply($, dataPromises).done(function() {
		filterData();
        if ($.type(gblURLParms.key) !== 'undefined') {
            drawDetail(gblURLParms.key);
        }
        var startTab = gblLiciousConfig.StartTab;
        if ($.type(gblURLParms.view) !== 'undefined') {
            startTab = gblURLParms.view;
        }
		
		if (!gblLiciousConfig.showReservationTab && startTab === 'tabRev') {
			startTab = 'tabList';
		}
        switchToTab(startTab);	
		});

    
    setupEvents();
	$("#searchString").focus();
	$("#searchString").trigger( "keyup" );
	$("#searchString").attr("placeholder", gblLiciousConfig.seasonSearch);	
}

function loadMainPage() {
    var strCode="";
    var htmlLoad = "";
   
    if (document.location.hostname.length === 0 || document.location.hostname === 'localhost') {
        mapMarkers = { 
            restaurant : 'static_files/WebApps/images/markerblue.png',
            restaurant_selected : 'static_files/WebApps/images/markerblue_sel.png'
        };
        icons = {  
            veg : 'static_files/WebApps/images/veggieicon.png',
            vegan : 'static_files/WebApps/images/veganicon.png',
            local : 'static_files/WebApps/images/localicon.png',
            acc : 'static_files/WebApps/images/fullyaccessibleicon.png'
        };      
        strCode += '<link rel="stylesheet" href="css/licious.css">';        
        strCode += '<script type="text/javascript" src="js/oms.min.js"></script>';     
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        htmlLoad = 'html/licious.html';
    } else {
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Licious/css/licious.css">';        
        strCode += '<script type="text/javascript" src="/static_files/assets/oms/oms.min.js"></script>';        
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/placeholders.jquery.min.js"></script>';        
        htmlLoad = '/static_files/WebApps/Licious/html/licious.html';
    }
    $("#appCode").html(strCode);
    $("#appDisplay").load(htmlLoad, function() { initApp();});
}
  
$( document ).ready(function() {
    loadMainPage();
});
})(this);