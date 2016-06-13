/* Notes:
1) Culinary events are basically commented out. The entire code needs to re-visited once re-instated.
*/
(function (window, undefined) {
   'use strict';
   
var gblMainMapInfoBox;
var gblDetailMapInfoBox;
var myLatLng,map;
/* two maps, two sets of array Markers */
var gblMainMapMarkers = [];
var gblDetailMapMarkers = [];
//var jsonRestData, jsonEventData, jsonReservationData;
//var detailGUID="c2f64dc89f674510VgnVCM10000020ff0f89RCRD";
var DATA_URL = "http://www1.toronto.ca/static_files/WebApps/Summerlicious/restaurant.json?callback=?";
var gblCurrentTab = "";
var gblRestData;
var gblFilteredRestData = [];
var gblCurrentUNID;
var gblURLParms = {};

var mapMarkers = { 
    restaurant : '/static_files/WebApps/images/markergreen.png',
    restaurant_selected : '/static_files/WebApps/images/markergreen_sel.png',
    culinary : '/static_files/WebApps/images/markerblue.png',
    culinary_selected : '/static_files/WebApps/images/markerblue_sel.png'
};
var icons = {  
    veg : '/static_files/WebApps/images/veggieicon.png',
    vegan : '/static_files/WebApps/images/veganicon.png',
    local : '/static_files/WebApps/images/localicon.png',
    acc : '/static_files/WebApps/images/fullyaccessibleicon.png'
};

/* Utility functions */

function printModal(modalId) {
    var win=window.open();
    var ss = document.styleSheets;

    win.document.write('<html><head><title>' + document.title + '</title>');
    for (var i = 0, max = ss.length; i < max; i++) {
		if (ss[i].href !== null) {
			win.document.write('<link rel="stylesheet" type="text/css" href="' + ss[i].href + '">');
		// else  if( ss[i].addRule ){
		//	win.document.addRule(selector, rule);
		//} else if( ss[i].insertRule ){
        //win.document.insertRule(selector + ' { ' + rule + ' }', ss[i].cssRules.length);
		}
    }
    win.document.write('</head><body>');
    win.document.write('<div id="maincontent"  class="container">');
    win.document.write($("#" + modalId).html());
    win.document.write('</div></body></html>');
    win.document.close();
    win.focus();
    setTimeout(function() {
           win.print();
           win.close();
       }, 50);

    
    
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
    if (tDiv.find('.btn.active').attr('id') !== tab) {
        tDiv.find('.btn').toggleClass('active');
        tDiv.find('.btn').toggleClass('btn-primary');
        tDiv.find('.btn').toggleClass('btn-default');
    }
    gblCurrentTab = tab;
    if (tab === "tabMap") {
        $("#liciousmap").show();
        $("#tabMap").parent().addClass('active');
        $("#liciouslisttable").hide();
        $("#tabList").parent().removeClass('active');
        //Actually redraw map in case selection was changed
        licMapInit();
        //var z =  map.getZoom(); //force a redraw
        //map.setZoom(z);
    } else {
        $("#liciousmap").hide();
        $("#tabMap").parent().removeClass('active');
        $("#liciouslisttable").show();
        $("#tabList").parent().addClass('active');

    }
}

function setupEvents() {

  $('.btn-toggle').on("click", function() {

        $(this).find('.btn').toggleClass('active');  
    
        if ($(this).find('.btn-primary').size()>0) {
            $(this).find('.btn').toggleClass('btn-primary');
        }
        if ($(this).find('.btn-danger').size()>0) {
            $(this).find('.btn').toggleClass('btn-danger');
        }
        if ($(this).find('.btn-success').size()>0) {
            $(this).find('.btn').toggleClass('btn-success');
        }
        if ($(this).find('.btn-info').size()>0) {
            $(this).find('.btn').toggleClass('btn-info');
        }
    
        $(this).find('.btn').toggleClass('btn-default');
        switchToTab($(this).find('.btn.active').prop("id"));
       
    });
    
    $("#maincontent").on("click",".showdetail", function() {
        drawDetail($(this).data("unid"));
    });
    
    /* we need for the modal to be open before we draw the map */
    $('#detailModal').on('shown.bs.modal', function () {
        drawDetailMap();
        addthis.toolbox('.addthis_toolbox');
        addthis.counter('.addthis_counter'); // this re-drawns the counter-- which is the "share" button
    });

    $("#detailModal").on('hidden.bs.modal', function () {
        closeDetailWindow();
        //TODO: print stuff
        //$("#liciousContent").show();
            
        return false;
    });
    
    $( "#maincontent").find("select" ).change(function() {updateFilter();});
    $( ".chkBox" ).change(function() {updateFilter();});
    
    $("#detailPrint").on("click", function(event) {
        printModal("detailModal");
       // printElement(document.getElementById("detailModal"));
        //window.print();

        /*
        var modalId = $(event.target).closest('.modal').attr('id');
        $('body').css('visibility', 'hidden');
        $('html').css('max-height',$("#" + modalId).height());
        $("#" + modalId).css('visibility', 'visible');
        $('#' + modalId).removeClass('modal');
        $("#" + modalId).print();
        $('body').css('visibility', 'visible');
        $('#' + modalId).addClass('modal');
        */

 


            //Works with Chome, Firefox, IE, Safari
        //Get the HTML of div
        /*
        var title = document.title;
        var divElements = document.getElementById('printme').innerHTML;
        var printWindow = window.open("", "_blank", "");
        //open the window
        printWindow.document.open();
        //write the html to the new window, link to css file
        printWindow.document.write('<html><head><title>' + title + '</title><link rel="stylesheet" type="text/css" href="/Css/site-print.css"></head><body>');
        printWindow.document.write(divElements);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        //The Timeout is ONLY to make Safari work, but it still works with FF, IE & Chrome.
        setTimeout(function() {
            printWindow.print();
            printWindow.close();
        }, 100);
        */
    
   
    });
    
    $("#resetFilters").on("click", function() {
        resetFilters();
    });
    
    /* AddThis doesn't work well when it is on the page twice, this makes sure we use the current URL in social media */
     addthis.addEventListener('addthis.menu.open', function(event){
        event.data.share.title = gblLiciousConfig.season;
        event.data.share.url = window.location.href
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
    addText.innerHTML = "<div class='mapclose'><a href='javascript:mapClose();'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a></div>";
    addText.innerHTML += "<div class='titleText'><style='font-weight:bold;'>" + m.name + "</div>";
    addText.innerHTML += "<div class='map sumText'>"+ m.addsummary + "</br>" + m.phone + "<br /><br />";
    if (m.type=="restaurant") {
        addText.innerHTML += m.cuisine + "<br/>" + strPrice + "<br/>";
        
        addText.innerHTML += "<a class='showdetail' title='More information' href='#' data-unid='" + m.unid + "'>More Information</a></div>";
    } else {
        addText.innerHTML += (m.adultprice==="") ? "" : "Adults: " + m.adultprice + "<br/>";
        addText.innerHTML += (m.kidprice==="") ? "" : "Kids: " + m.kidprice + "<br/>";
        addText.innerHTML += "<a title='More information' href='/wps/portal/contentonly?vgnextoid=87fc3b35b23f0510VgnVCM10000071d60f89RCRD&key=" + m.unid + "'>More Information</a></div>";
    }
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

function resetMap(markers) {
    mapClose();
    var strKey = gblURLParms.key;

    if (strKey!==null)
    {
        map.setZoom(14);
    } else {
        var defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(43.589344,-79.631653),new google.maps.LatLng(43.809756,-79.232025));
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

/* mo1,mo2,mo3 are radio buttons to show culinary event, resutrants or both, nbotr used currently */
function licMapInit() {

    gblMainMapMarkers = [];

    var myLatLng = new google.maps.LatLng(43.699223,-79.394098);
    var mapOptions = {
    zoom: 11,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
    panControl:false,zoomControl: true,
    zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}};

    map = new google.maps.Map(document.getElementById('liciousmap'),mapOptions);

    var marker;
    gblMainMapInfoBox = document.createElement('div');
    gblMainMapInfoBox.id = "mapinfobox";
    gblMainMapInfoBox.className = "infoBox";
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(gblMainMapInfoBox);

    var buttonUI = document.createElement('button');
    buttonUI.id = "resetMap";
    buttonUI.className = "resetMap";
    buttonUI.innerHTML = "Reset Map";
    buttonUI.onclick = function () { resetMap(gblMainMapMarkers);};
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);

    var index;
    if (!$("#mapOption3").is(":checked")) {
        $.each(gblFilteredRestData.restaurants, function(i, item) {
            index = i;
            myLatLng = new google.maps.LatLng(item.lic_lat,item.lic_lng);
            marker = new google.maps.Marker({
                id: "mapmarker" + index,
                type: "restaurant",
                icon: mapMarkers.restaurant,
                position: myLatLng,
                map: map,
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

            google.maps.event.addDomListener(marker, 'click', function (){
            createInfoBox(this,gblMainMapInfoBox, gblMainMapMarkers);});
        });
    }

/*
    if (!$("#mapOption2").is(":checked")) {
        if (qsCS=="" && qsNBH=="" && qsLPA=="FALSE" && qsLPB=="FALSE" && qsLPC=="FALSE" && qsDPA=="FALSE" && qsDPB=="FALSE" && qsDPC=="FALSE" && qsACC=="" && qsVEG=="" && qsVEGAN=="" && qsLOC=="") {
            $.each(jsonEventData.culinary, function(i, item) {
                    index += i;
                    myLatLng = new google.maps.LatLng(item["lic_lat"],item["lic_lng"]);
                    marker = new google.maps.Marker({
                        id: "mapmarker" + index,
                        type: "event",
                        icon: '/static_files/WebApps/images/markerblue.png',
                        position: myLatLng,
                        map: map,
                        name: item["lic_eventName"],
                        summary: item["lic_desc"],
                        addsummary : item["lic_address"],
                        neighbourhood : item["lic_additionaladdress"],
                        phone : item["lic_phone"],
                        cuisine : "",
                        unid: item["lic_documentID"],
                        adultprice : item["lic_adultticketprice"],
                        kidprice : item["lic_kidticketprice"]});
                    marker.setZIndex(277000001);

                    arrMarkers.push(marker);

                    google.maps.event.addDomListener(marker, 'click', function (){
                        createInfoBox(this);});
            });
        }
    }
*/
}

/* Listing Functions */
function drawListing() {

    var strRows = "";
    $.each(gblRestData.restaurants, function(i, item) {
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
    strRows = '<thead><tr><th id="filterText" class="filter-match" data-placeholder="Search ' + gblLiciousConfig.season + ' Restaurant Names or Your Favourite Menu Items">' + gblLiciousConfig.season + ' Prix Fixe Restaurant List</th></tr></thead><tbody>' + strRows + '</tbody>';
    
    $("#liciouslisttable").html(strRows);
    $('.icons img').tooltip({html: true});

    var strSearch = "";
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
    var cols=[];
    cols[0] = strSearch;
    initTableSorter("liciouslisttable");
    updateFilter();    
}

function initTableSorter(tableID) {
    var $table = $("#" + tableID).tablesorter({
        theme: 'blue',
        widthFixed : false,
        widgets: ["filter"],
        widgetOptions : {
        filter_columnFilters: true,
          filter_cssFilter   : '',
          filter_childRows   : false,
          filter_ignoreCase  : true,
          filter_reset : '.reset',
          filter_searchDelay : 300,
          filter_startsWith  : false,
          filter_hideFilters : false
          }
      });
    $.tablesorter.filter.bindSearch( $table, $('.search') );
}

function updateFilter() {
    var filterArray = [];
    var strFilter="";
    var stateObj = {};
    var numPrice = 0;
 
    var qsCS = "", qsNBH = "";
    var fc = $("#filterCuisine");
    var fn  = $("#filterNeighbourhood");
    var facc = $("#filterAccessible");
    var fveg = $("#filterVeggie");
    var fvegan = $("#filterVegan");
    var floc = $("#filterLocal");

    if (fc.length > 0) {qsCS =  (fc.val()!="All Cuisines") ? fc.val() :"";}
    if (fn.length > 0) {qsNBH = (fn.val()!="All Neighbourhoods") ? fn.val() : "";}
    var qsLPA = ($("#LunchPriceA").is(':checked')) ? "$18 Lunch" : "FALSE";
    var qsLPB = ($("#LunchPriceB").is(':checked')) ? "$23 Lunch" : "FALSE";
    var qsLPC = ($("#LunchPriceC").is(':checked')) ? "$28 Lunch" : "FALSE";
    var qsDPA = ($("#DinnerPriceA").is(':checked')) ? "$28 Dinner" : "FALSE";
    var qsDPB = ($("#DinnerPriceB").is(':checked')) ? "$38 Dinner" : "FALSE";
    var qsDPC = ($("#DinnerPriceC").is(':checked')) ? "$48 Dinner" : "FALSE";
    var qsACC = (facc.is(':checked')) ? "Yes" : "";
    var qsVEG = ( fveg .is(':checked')) ? "Yes" : "";
    var qsVEGAN = (fvegan.is(':checked')) ? "Yes" : "";
    var qsLOC = (floc.is(':checked')) ? "Yes" : "";
 
    if (fc.val()!="All Cuisines") {filterArray.push("Cuisine:" + fc.val()); addQueryStringParm('cs',fc.val());} else {removeQueryStringParm('cs');}
    if (fn.val()!="All Neighbourhoods") {filterArray.push(fn.val());addQueryStringParm('nbh',fn.val());} else {removeQueryStringParm('nbh');}
    if (qsLPA !== 'FALSE') {filterArray.push("18 Lunch");addQueryStringParm('lpa','yes');numPrice++;} else {removeQueryStringParm('lpa');}
    if (qsLPB !== 'FALSE') {filterArray.push("23 Lunch");addQueryStringParm('lpb','yes');numPrice++;} else {removeQueryStringParm('lpb');}
    if (qsLPC !== 'FALSE') {filterArray.push("28 Lunch");addQueryStringParm('lpc','yes');numPrice++;} else {removeQueryStringParm('lpc');}
    if (qsDPA !== 'FALSE') {filterArray.push("28 Dinner");addQueryStringParm('dpa','yes');numPrice++;} else {removeQueryStringParm('dpa');}
    if (qsDPB !== 'FALSE') {filterArray.push("38 Dinner");addQueryStringParm('dpb','yes');numPrice++;} else {removeQueryStringParm('dpb');}
    if (qsDPC !== 'FALSE') {filterArray.push("48 Dinner");addQueryStringParm('dpc','yes');numPrice++;} else {removeQueryStringParm('dpc');}
    if (qsACC !== "") {filterArray.push("accessible");addQueryStringParm("acc",facc.val());} else {removeQueryStringParm('acc');}
    if (qsVEG !== "") {filterArray.push("vegetarianoffered");addQueryStringParm("veg", fveg.val());} else {removeQueryStringParm('veg');}
    if (qsVEGAN !== "") {filterArray.push("veganoffered");addQueryStringParm("vegan", fvegan.val());} else {removeQueryStringParm('vegan');}
    if (qsLOC !== "") {filterArray.push("localfood");addQueryStringParm("loc", floc.val());} else {removeQueryStringParm('loc');}

    var urlParmsLength = Object.keys(gblURLParms).length;
    if ($.type(gblURLParms.appInstanceName) !== 'undefined') { urlParmsLength--;}
    if ($.type(gblURLParms.vgnextoid) !== 'undefined') { urlParmsLength--;}
    if (urlParmsLength === 0) {$("#resetFilters").css("visibility", "hidden");} else {$("#resetFilters").css("visibility", "visible");}
    var blnPrice = false;

    for (var i=0; i<filterArray.length; i++) {
        if (filterArray[i].substring(3,8) != "Lunch" && filterArray[i].substring(3,9) != "Dinner" && blnPrice && numPrice >1) {blnPrice = false; strFilter += ")";}
        if (i > 0 && blnPrice) {strFilter += "|";}
        if (i > 0 && !blnPrice) {strFilter += " && ";}
        if ((filterArray[i].substring(3,8) == "Lunch" || filterArray[i].substring(3,9) == "Dinner") && !blnPrice && filterArray.length>0 && numPrice >1) {blnPrice = true; strFilter += "(";}

        strFilter += filterArray[i];
    }

    if (blnPrice) {strFilter += ")";}
    stateObj.searchstring= strFilter;

    var cols=[];
    cols[0] = strFilter;
    $("#liciouslisttable").trigger('search', [cols]);

    if (qsCS!=="" || qsNBH!=="" || qsLPA!=="FALSE" || qsLPB!=="FALSE" || qsLPC!=="FALSE" || qsDPA!=="FALSE" || qsDPB!=="FALSE" || qsDPC!=="FALSE" || qsACC!=="" || qsVEG!=="" || qsVEGAN!=="" || qsLOC!=="") {
        $("#mapOption1, #mapOption2, #mapOption3")[1].checked = true;
        $("#mapOption1, #mapOption2,#mapOption3").button("refresh");
        $("#mo1").removeClass("active");
        $("#mo2").addClass("active");
        $("#mo3").removeClass("active");
    }

    gblFilteredRestData = {};
    gblFilteredRestData.restaurants = [];
    var skipItem = false;
    for (var i = 0; i < gblRestData.restaurants.length; i++) {
        var item = gblRestData.restaurants[i]
        skipItem = false;
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
          gblFilteredRestData.restaurants.push(item);
        }
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
    updateFilter();
}


function jsonReservationsCallBack(data) {

    var strHTML = "";   
    $.each(data.reservations, function(i, item) {
        strHTML += "<br>";
        strHTML += "<p><strong>Today's Reservation Availability:</strong></p>";
        strHTML += (item.lic_lunchoption!=="")? "<div>" : "";
        strHTML += (item.lic_lunchoption==="")? '' : '<span><strong>Lunch</strong>: ' + item.lic_lunchoption + ' today</span>';
        strHTML += (item.lic_lunchoption!=="")? "</div>" : "";

        strHTML += (item.lic_dinneroption!=="")? "<div>" : "";
        strHTML += (item.lic_dinneroption==="")? '' : '<span><strong>Dinner</strong>: ' + item.lic_dinneroption + ' today</span>';
        strHTML += (item.lic_dinneroption!=="")? "</div>" : "";

        strHTML += '<p><span>Call ' + item.lic_reserveline + " to book your table.</span>";
        strHTML += '<div><small><em>Date posted by restaurant: ' + item.lic_datetime + '</em></small></div>';
        
    });
                    
    $("#reservationLink").html(strHTML);
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
                    strHTML += (item.lic_twit==="") ? "": '<span class="lic_twit hidden-print"><a title="Twitter" href="' + item.lic_twit + '" target="_blank">Twitter</a></span>';
                    strHTML += (item.lic_instagram==="") ? "": '<span class="lic_instagram hidden-print "><a title="Instagram site" href="' + item.lic_instagram + '" target="_blank">Instagram</a></span>';
                    strHTML += (item.lic_fb==="") ? "": '<span class="lic_fb hidden-print"><a title="Facebook" href="' + item.lic_fb + '" target="_blank">Facebook</a></span>';
                    strHTML += (item.lic_youtube==="") ? "": '<span class="lic_fb hidden-print"><a title="Youtube site" href="' + item.lic_youtube + '" target="_blank">Youtube</a></span>';
                    strHTML += '</div>';
                    
                    
                    strHTML += '<p class="lic_profile">' + item.lic_profile.join('<br>') + '</p>';
                    strHTML += '<p><span><strong>Cuisine: </strong></span><span class="lic_cuisine">' + item.lic_cuisine.join(', ') + '</span></p>';
                    
                                                            
                    strHTML += '<div id="reservationLink"></div>';
                                        
                    strHTML += '<div class="sitelinks">';
                    strHTML += (item.lic_lunchlink==="" && item.lic_dinnerlink==="") ? "": '<br><p><strong>Reserve online</strong> for seatings between July 8 and 24, 2016:</p><img src="/static_files/WebApps/images/fork.png"> &nbsp;';
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
                    strHTML += '<div class="mapoption active"><div class="hidden-print"><a class="ttcplanner"' + ' href=' + '"http://tripplanner.ttc.ca/hiwire?EndDetail=' + item.lic_address + '"' + ' target="_blank"'+ '>TTC Trip Planner</a></div></div>';
                    
                    
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
    //var strURL = "http://wx.toronto.ca/inter/se/restaurants.nsf/ReservationListJSON.xsp&key=" + strID;
    //$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});
    
    //SET UP DETAIL MAP
    myLatLng = new google.maps.LatLng(43.721459,-79.373903);
    var mapOptions = {zoom: 16,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
    panControl:false,zoomControl: true,zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}};
    map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
    var marker;
    var buttonUI = document.createElement('button');
    buttonUI.id = "resetMap";
    buttonUI.className = "resetMap hidden-print";
    buttonUI.innerHTML = "Reset Map";
    buttonUI.onclick = function () { resetMap(gblDetailMapMarkers);};
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);
    gblDetailMapInfoBox = document.createElement('div');
    gblDetailMapInfoBox.id = "mapinfobox";
    gblDetailMapInfoBox.className = "infoBox";
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(gblDetailMapInfoBox);
    //**********************
    $.each(gblFilteredRestData.restaurants, function(i, item) {
        myLatLng = new google.maps.LatLng(item.lic_lat,item.lic_lng);
        marker = new google.maps.Marker({
            id: "mapmarker" + i,
            type: "restaurant",
            icon: mapMarkers.restaurant,
            position: myLatLng,
            map: map,
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
            map.setCenter(myLatLng);
            marker.setZIndex(299000001);
            marker.setIcon(mapMarkers.restaurant_selected);
        }
        gblDetailMapMarkers.push(marker);
        google.maps.event.addDomListener(marker, 'click', function (){
            createInfoBox(this,gblDetailMapInfoBox, gblDetailMapMarkers);
            });
    });

    /*$.each(jsonEventData.culinary, function(i, item) {
        myLatLng = new google.maps.LatLng(item["lic_lat"],item["lic_lng"]);
        marker = new google.maps.Marker({
            id: "mapmarker" + (1000+i),
            type: "event",
            icon: '/static_files/WebApps/images/markerblue.png',
            position: myLatLng,
            map: map,
            name: item["lic_eventName"],
            summary: item["lic_desc"],
            addsummary : item["lic_address"],
            neighbourhood : item["lic_additionaladdress"],
            phone : item["lic_phone"],
            cuisine : "",
            unid: item["lic_documentID"],
            adultprice : item["lic_adultticketprice"],
            kidprice : item["lic_kidticketprice"]
        });
        marker.setZIndex(277000001);
        arrMarkers.push(marker);
        google.maps.event.addDomListener(marker, 'click', function (){createInfoBox(this);});
    });
*/
    $('.icons img').tooltip({html: true, placement: "right"});
}

function closeDetailWindow() {

    removeQueryStringParm("key");
    $('body').removeClass('modal-open'); //bug is bootstrap?

}

function initApp() {

    setupEvents();
    $.ajax({
        type: 'GET',
        url: DATA_URL ,
        dataType: 'jsonp',
        jsonpCallback: 'jsonRestaurantsCallBack',
        contentType: "application/json",
        success: function (data) {
            gblRestData = data;
            gblFilteredRestData = data;
            drawListing();
            if ($.type(gblURLParms.key) !== 'undefined') {
                drawDetail(gblURLParms.key);
            }
            if (gblLiciousConfig.StartTab !== 'tabMap') {
                switchToTab("tabList");
            }
        }
    });
    //$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});  
        
    //strURL = "http://wxqa.toronto.ca/inter/se/restaurants.nsf/SummerCulinaryListJSON.xsp";
   // $.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});


}

function loadMainPage() {
    var strCode="";
    var htmlLoad = "";
   
    if (document.location.hostname.length === 0 || document.location.hostname === 'localhost') {
        mapMarkers = { 
            restaurant : 'static_files/WebApps/images/markergreen.png',
            restaurant_selected : 'static_files/WebApps/images/markergreen_sel.png',
            culinary : 'static_files/WebApps/images/markerblue.png',
            culinary_selected : 'static_files/WebApps/images/markerblue_sel.png'
        };
        icons = {  
            veg : 'static_files/WebApps/images/veggieicon.png',
            vegan : 'static_files/WebApps/images/veganicon.png',
            local : 'static_files/WebApps/images/localicon.png',
            acc : 'static_files/WebApps/images/fullyaccessibleicon.png'
        };      
        strCode += '<link rel="stylesheet" href="tablesorter/css/theme.blue.css">';     
        strCode += '<link rel="stylesheet" href="css/licious.css">';        
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        htmlLoad = 'html/RestaurantList.html';
    } else {
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';        
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Summerlicious/css/licious.css">';        
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';        
        htmlLoad = '/static_files/WebApps/Summerlicious/html/RestaurantList.html';
    }
    $("#appCode").html(strCode);
    $("#appDisplay").load(htmlLoad, function() { initApp();});
}

$( document ).ready(function() {
    gblURLParms = convertQueryStringToObj();
    loadMainPage();
});
})(this);