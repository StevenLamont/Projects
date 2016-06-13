
var map;
var arrMarkers= new Array();
var jsonRestData, jsonEventData;

function licMapInit() {
	var myLatLng = new google.maps.LatLng(43.699223,-79.394098);
  	var mapOptions = {
    zoom: 11,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
    mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
    panControl:false,zoomControl: true,
    zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
    streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}}

	map = new google.maps.Map(document.getElementById('liciousmap'),mapOptions);

	var qsMarker = $.QueryString["key"];
	var qsCS = "", qsNBH = "";
	if ($("#filterCuisine").length > 0) {qsCS =  ($("#filterCuisine").val()!="All Cuisines") ? $("#filterCuisine").val() :"";}
	if ($("#filterNeighbourhood").length > 0) {qsNBH = ($("#filterNeighbourhood").val()!="All Neighbourhoods") ? $("#filterNeighbourhood").val() : "";}
	var qsLPA = ($("#LunchPriceA").is(':checked')) ? "$18 Lunch" : "FALSE";
	var qsLPB = ($("#LunchPriceB").is(':checked')) ? "$23 Lunch" : "FALSE";
	var qsLPC = ($("#LunchPriceC").is(':checked')) ? "$28 Lunch" : "FALSE";
	var qsDPA = ($("#DinnerPriceA").is(':checked')) ? "$28 Dinner" : "FALSE";
	var qsDPB = ($("#DinnerPriceB").is(':checked')) ? "$38 Dinner" : "FALSE";
	var qsDPC = ($("#DinnerPriceC").is(':checked')) ? "$48 Dinner" : "FALSE";
	var qsACC = ($("#filterAccessible").is(':checked')) ? "Yes" : "";
	var qsVEG = ($("#filterVeggie").is(':checked')) ? "Yes" : "";
	var qsVEGAN = ($("#filterVegan").is(':checked')) ? "Yes" : "";
	var qsLOC = ($("#filterLocal").is(':checked')) ? "Yes" : "";

	if (qsCS!="" || qsNBH!="" || qsLPA!="FALSE" || qsLPB!="FALSE" || qsLPC!="FALSE" || qsDPA!="FALSE" || qsDPB!="FALSE" || qsDPC!="FALSE" || qsACC!="" || qsVEG!="" || qsVEGAN!="" || qsLOC!="") {
		$("#mapOption1, #mapOption2, #mapOption3")[1].checked = true;
    	$("#mapOption1, #mapOption2,#mapOption3").button("refresh");
    	$("#mo1").removeClass("active");
    	$("#mo2").addClass("active");
    	$("#mo3").removeClass("active");
	}



  	var marker;
  	controlUI = document.createElement('div');
  	controlUI.id = "mapinfobox";
  	controlUI.className = "infoBox";
  	map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlUI);

	var buttonUI = document.createElement('button');
	buttonUI.id = "resetMap";
	buttonUI.className = "resetMap";
	buttonUI.innerHTML = "Reset Map";
	buttonUI.onclick = function () { resetMap();};
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);

	var index;
	if (!$("#mapOption3").is(":checked")) {
		$.each(jsonRestData.restaurants, function(i, item) {
			index = i;

			if ((qsVEG==""||item["lic_veggie"]=="Yes")&&(qsVEGAN==""||item["lic_vegan"]=="Yes")&&(qsLOC==""||item["lic_local"]=="Yes")&&(qsACC==""||item["lic_accessible"]=="Yes")&&(qsCS==""||item["lic_cuisine"].indexOf(qsCS)>=0)&&(qsNBH==""||item["lic_neighbourhood"].indexOf(qsNBH)>=0) && ((qsLPA=="FALSE"&&qsLPB=="FALSE"&&qsLPC=="FALSE")||(item["lic_lunchprice"].indexOf(qsLPA)>=0||item["lic_lunchprice"].indexOf(qsLPB)>=0||item["lic_lunchprice"].indexOf(qsLPC)>=0))&&((qsDPA=="FALSE"&&qsDPB=="FALSE"&&qsDPC=="FALSE")||(item["lic_dinnerprice"].indexOf(qsDPA)>=0||item["lic_dinnerprice"].indexOf(qsDPB)>=0||item["lic_dinnerprice"].indexOf(qsDPC)>=0)))
			{
				myLatLng = new google.maps.LatLng(item["lic_lat"],item["lic_lng"]);
				marker = new google.maps.Marker({
					id: "mapmarker" + index,
					type: "restaurant",
					icon: '/static_files/WebApps/images/markergreen.png',
					position: myLatLng,
					map: map,
					name: item["lic_restName"],
					summary: item["lic_profile"],
					addsummary : item["lic_address"],
					neighbourhood : item["lic_neighbourhood"].join(', '),
					phone : item["lic_phone"],
					cuisine : item["lic_cuisine"].join(', '),
					unid: item["lic_documentID"],
					lunchprice : item["lic_lunchprice"],
					dinnerprice : item["lic_dinnerprice"]});
				marker.setZIndex(277000000);
				arrMarkers.push(marker);

				google.maps.event.addDomListener(marker, 'click', function (){
					createInfoBox(this);});
			}
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

function resetFilterClick() {
		$("#mapOption1, #mapOption2, #mapOption3")[0].checked = true;
    	$("#mapOption1, #mapOption2,#mapOption3").button("refresh");
    	$("#mo1").addClass("active");
    	$("#mo2").removeClass("active");
    	$("#mo3").removeClass("active");
    	resetFilters();
}


function updateFilter() {
    if ($("#mapOption1").is(":checked")) {$("#mo1").addClass("active");$("#mo2").removeClass("active");$("#mo3").removeClass("active");}
    if ($("#mapOption2").is(":checked")) {$("#mo1").removeClass("active");$("#mo2").addClass("active");$("#mo3").removeClass("active");}
    if ($("#mapOption3").is(":checked")) {$("#mo1").removeClass("active");$("#mo2").removeClass("active");$("#mo3").addClass("active");}

	var filterArray = [];
	var strFilter="";
	var stateObj = {};
	var strQP = "";
	var numPrice = 0;

 if ($("#filterCuisine").val()!="All Cuisines") {filterArray.push($("#filterCuisine").val()); strQP += "&cs=" + $("#filterCuisine").val();}
 if ($("#filterNeighbourhood").val()!="All Neighbourhoods") {filterArray.push($("#filterNeighbourhood").val());strQP += "&nbh=" + $("#filterNeighbourhood").val();}
 if ($("#LunchPriceA").is(':checked')) {filterArray.push("18 Lunch");strQP += "&lpa=yes";numPrice++;}
 if ($("#LunchPriceB").is(':checked')) {filterArray.push("23 Lunch");strQP += "&lpb=yes";numPrice++;}
 if ($("#LunchPriceC").is(':checked')) {filterArray.push("28 Lunch");strQP += "&lpc=yes";numPrice++;}
 if ($("#DinnerPriceA").is(':checked')) {filterArray.push("28 Dinner");strQP += "&dpa=yes";numPrice++;}
 if ($("#DinnerPriceB").is(':checked')) {filterArray.push("38 Dinner");strQP += "&dpb=yes";numPrice++;}
 if ($("#DinnerPriceC").is(':checked')) {filterArray.push("48 Dinner");strQP += "&dpc=yes";numPrice++;}
 if ($("#filterAccessible").is(':checked')) {filterArray.push("accessible");strQP += "&acc=" + $("#filterAccessible").val();}
 if ($("#filterVeggie").is(':checked')) {filterArray.push("vegetarianoffered");strQP += "&veg=" + $("#filterVeggie").val();}
 if ($("#filterVegan").is(':checked')) {filterArray.push("veganoffered");strQP += "&vegan=" + $("#filterVegan").val();}
 if ($("#filterLocal").is(':checked')) {filterArray.push("localfood");strQP += "&loc=" + $("#filterLocal").val();}

 if (strQP == "") {
	 $("#resetFilters").css("display", "none");
 } else {
	 $("#resetFilters").css("display", "");
 }

 if ($.isFunction(history.pushState)) {
	var strHREF = document.location.href;
 	strHREF = strHREF.substring(strHREF.indexOf("contentonly"), strHREF.indexOf("CRD") + 3);
	history.pushState(stateObj, "Restaurant Listing", strHREF + strQP);
 }
 licMapInit();
}

function initQS() {
	var showReset=false;
	if ($.type($.QueryString["cs"])!="undefined") {$("#filterCuisine").val($.QueryString["cs"]);showReset=true;}
	if ($.type($.QueryString["nbh"])!="undefined") {$("#filterNeighbourhood").val($.QueryString["nbh"]);showReset=true;}
	if ($.type($.QueryString["lpa"])!="undefined") {$("#LunchPriceA").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["lpb"])!="undefined") {$("#LunchPriceB").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["lpc"])!="undefined") {$("#LunchPriceC").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["dpa"])!="undefined") {$("#DinnerPriceA").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["dpb"])!="undefined") {$("#DinnerPriceB").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["dpc"])!="undefined") {$("#DinnerPriceC").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["acc"])!="undefined") {$("#filterAccessible").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["veg"])!="undefined") {$("#filterVeggie").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["vegan"])!="undefined") {$("#filterVegan").prop('checked', true);showReset=true;}
	if ($.type($.QueryString["loc"])!="undefined") {$("#filterLocal").prop('checked', true);showReset=true;}
	if (showReset==true) {
		$("#resetFilters").css("display", "");
	}
	licMapInit();
}

function jsonRestaurantsCallBack(data) {
	jsonRestData = data;
	if (jsonEventData!=null) initQS();
}

function jsonEventsCallBack(data) {
	jsonEventData = data;
	if (jsonRestData!=null) initQS();
}

$(document).ready(function() {
	$( "#maincontent select" ).change(function() {updateFilter();});
	$( "#mapOption1,#mapOption2,#mapOption3 " ).change(function() {updateFilter();});
	$( "#mapOption1,#mapOption3 " ).mousedown(function() {resetFilters();});

	initQS();

});