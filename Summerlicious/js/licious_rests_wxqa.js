var myLatLng,map;
var arrMarkers= new Array();
var jsonRestData, jsonEventData, jsonReservationData;
var strKey;

//function jsonEventsCallBack(data) {
//	jsonEventData = data;
//	if (jsonRestData != null) {drawDetail(strKey);}
//

function jsonRestaurantsCallBack(data) {
	if (strKey!=null) {
		//DRAW DETAIL
		jsonRestData = data;
		drawDetail(strKey);
		//if (jsonEventData != null) {drawDetail(strKey);}
	} else {
		//DRAW LIST
		var strRows = "";
		$.each(data.restaurants, function(i, item) {
			strRows += "<tr id='liciouslisttablerow" + i + "'>";
						strRows += "<td>";
						strRows += "<div>";
							strRows += '<div class="col-xs-12 col-sm-10 col-sm-push-2">';

								strRows += '<div class="restaurantname">';
									strRows += '<h3 class="lic_restname">';
										strRows += '<a data-toggle="tooltip" data-placement="bottom" title="View the Summerlicious menu for '+item["lic_restName"]+'" href="/wps/portal/contentonly?vgnextoid=96d57b7d9a805510VgnVCM100000d85e0f89RCRD&key=' + item["lic_documentID"] + '">';
											strRows += item["lic_restName"];
										strRows += '</a>';
									strRows += '</h3>';

									strRows += '<div class="lic_hotel">' + item["lic_hotel"] + '</div>';
								strRows += '</div>';

								strRows += '<div class="row">';
									strRows += '<div class="col-xs-12 col-sm-7">';
										strRows += '<div class="lic_address">' + item["lic_address"];
										strRows += (item["lic_additionaladdress"]=="") ? '':', ' + item["lic_additionaladdress"];
										strRows += '</div>';
										strRows += '<div class="lic_phone">' + item["lic_phone"] + '</div>';
										strRows += '<div class="lic_neighbourhood">' + item["lic_neighbourhood"].join(', ') + '</div>';

										strRows += '<div style="height: 0px; overflow: hidden;">';
											strRows += item["lic_search_name"];
											strRows += (item["lic_veggie"]=="Yes") ? '<span>vegetarianoffered</span>' : '';
											strRows += (item["lic_vegan"]=="Yes") ? '<span>veganoffered</span>' : '';
											strRows += (item["lic_local"]=="Yes") ? '<span>localfood</span>' : '';
											strRows += (item["lic_accessible"]=="Yes") ? '<span>accessible</span>' : '';
										strRows += '</div>';

										strRows += '<p class="icons">';
											strRows += (item["lic_veggie"]=="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Vegetarian<br/>three-course<br/>menu option<br/>available at <br/>'+item["lic_restName"]+'" class="icon" alt="'+item["lic_restName"]+' Vegetarian option Icon" src="/static_files/WebApps/images/veggieicon.png" />' : '';
											strRows += (item["lic_vegan"]=="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Vegan<br/>three-course<br/>menu option<br/>available at <br/>'+item["lic_restName"]+'" class="icon" alt="'+item["lic_restName"]+' Vegan option Icon" src="/static_files/WebApps/images/veganicon.png" />' : '';
											strRows += (item["lic_local"]=="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="Locally sourced<br/>menu option<br/>available at <br/>'+item["lic_restName"]+'" class="icon" alt="Local Meals Offered Icon for '+item["lic_restName"]+'" src="/static_files/WebApps/images/localicon.png" />' : '';
											strRows += (item["lic_accessible"]=="Yes") ? '<img data-toggle="tooltip" data-placement="bottom" title="'+item["lic_restName"]+' Accessible<br/>restaurant" class="icon" alt="'+item["lic_restName"]+ 'Restaurant Accessible Icon" src="/static_files/WebApps/images/fullyaccessibleicon.png" />' : '';
										strRows += '</p>';

										strRows += '<div style="display: none;">';
										var arrCuisine = item["lic_cuisine"];
										for (i=0; i < arrCuisine.length; i++) {
										strRows += "Cuisine:" + arrCuisine[i];
										}
										strRows += item["lic_lunchmenu"] + item["lic_dinnermenu"];
										strRows += '</div>';
										
									strRows += '</div>';

									strRows += '<div class="col-xs-12 col-sm-5">';
										strRows += '<div>';
											strRows += (item["lic_lunch"]=="Yes") ? '<span>' + item["lic_lunchprice"] + '</span>' : '';
											strRows += (item["lic_lunch"]=="Yes" && item["lic_dinner"]=="Yes") ? ' | ' : '';
											strRows += (item["lic_dinner"]=="Yes") ? '<span>' + item["lic_dinnerprice"] + '</span>' : '';
											strRows += '<div>' + item["lic_cuisine"].join(', ') + '</div>';
										strRows += '</div>';
									strRows += '</div>';

								strRows += '</div><!--end row-->';
							strRows += '</div><!--end col-sm-10-->';

							strRows += '<div class="hidden-xs col-sm-2 col-sm-pull-10">';
								strRows += '<a href="/wps/portal/contentonly?vgnextoid=96d57b7d9a805510VgnVCM100000d85e0f89RCRD&key=' + item["lic_documentID"] + '">';
									strRows += '<img  data-toggle="tooltip" data-placement="bottom" title="View the Winterlicious menu for '+item["lic_restName"]+'" alt="Image of the' + item["lic_restName"] + '" class="restImg img-responsive img-thumbnail" src="' + item["lic_imagelink"] + '" />';
								strRows += '</a>';
							strRows += '</div>';

						strRows += '</div>';
				strRows +="</td></tr>";
		});
		strRows = '<thead><tr><th id="filterText" class="filter-match" data-placeholder="Search Summerlicious Restaurant Names or Your Favourite Menu Items">Summerlicious Prix Fixe Restaurant List</th></tr></thead><tbody>' + strRows + '</tbody>';
	
		$("#liciouslisttable").html(strRows);
		$('.icons img').tooltip({html: true});
		$( "#maincontent select" ).change(function() {updateFilter();});

		var strSearch = "";
		if ($.type($.QueryString["cs"])!="undefined") {$("#filterCuisine").val($.QueryString["cs"]);}
		if ($.type($.QueryString["nbh"])!="undefined") {$("#filterNeighbourhood").val($.QueryString["nbh"]);}
		if ($.type($.QueryString["lpa"])!="undefined") {$("#LunchPriceA").prop('checked', true);}
		if ($.type($.QueryString["lpb"])!="undefined") {$("#LunchPriceB").prop('checked', true);}
		if ($.type($.QueryString["lpc"])!="undefined") {$("#LunchPriceC").prop('checked', true);}
		if ($.type($.QueryString["dpa"])!="undefined") {$("#DinnerPriceA").prop('checked', true);}
		if ($.type($.QueryString["dpb"])!="undefined") {$("#DinnerPriceB").prop('checked', true);}
		if ($.type($.QueryString["dpc"])!="undefined") {$("#DinnerPriceC").prop('checked', true);}
		if ($.type($.QueryString["acc"])!="undefined") {$("#filterAccessible").prop('checked', true);}
		if ($.type($.QueryString["veg"])!="undefined") {$("#filterVeggie").prop('checked', true);}
		if ($.type($.QueryString["vegan"])!="undefined") {$("#filterVegan").prop('checked', true);}
		if ($.type($.QueryString["loc"])!="undefined") {$("#filterLocal").prop('checked', true);}

		var cols=[];
		cols[0] = strSearch;
		initTableSorter("liciouslisttable");
		updateFilter();
	}
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
	      filter_hideFilters : false,
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
 var strQP = document.location.href;
 strQP = strQP.substring(strQP.indexOf("contentonly"), strQP.indexOf("CRD") + 3);
 strQP2 = strQP;
 var numPrice = 0;
 
 if ($("#filterCuisine").val()!="All Cuisines") {filterArray.push("Cuisine:" + $("#filterCuisine").val()); strQP += "&cs=" + $("#filterCuisine").val();}
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

 if (strQP == strQP2) {$("#resetFilters").css("display", "none");} else {$("#resetFilters").css("display", "");}
 var blnPrice = false;

 for (var i=0; i<filterArray.length; i++) {
   if (filterArray[i].substring(3,8) != "Lunch" && filterArray[i].substring(3,9) != "Dinner" && blnPrice && numPrice >1) {blnPrice = false; strFilter += ")";}
   if (i > 0 && blnPrice) {strFilter += "|"}
   if (i > 0 && !blnPrice) {strFilter += " && "}
   if ((filterArray[i].substring(3,8) == "Lunch" || filterArray[i].substring(3,9) == "Dinner") && !blnPrice && filterArray.length>0 && numPrice >1) {blnPrice = true; strFilter += "(";}

   strFilter += filterArray[i];
 }

 if (blnPrice) {strFilter += ")";}
 stateObj.searchstring= strFilter;
 if ($.isFunction(history.pushState)) {
	 history.pushState(stateObj, "Building Details", strQP);
 }
var cols=[];
cols[0] = strFilter;
$("#liciouslisttable").trigger('search', [cols]);
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
		strHTML += (item["lic_lunchoption"]!="")? "<div>" : "";
		strHTML += (item["lic_lunchoption"]=="")? '' : '<span><strong>Lunch</strong>: ' + item["lic_lunchoption"] + ' today</span>';
		strHTML += (item["lic_lunchoption"]!="")? "</div>" : "";

		strHTML += (item["lic_dinneroption"]!="")? "<div>" : "";
		strHTML += (item["lic_dinneroption"]=="")? '' : '<span><strong>Dinner</strong>: ' + item["lic_dinneroption"] + ' today</span>';
		strHTML += (item["lic_dinneroption"]!="")? "</div>" : "";

		strHTML += '<p><span>Call ' + item["lic_reserveline"] + " to book your table.</span>";
		strHTML += '<div><small><em>Date posted by restaurant: ' + item["lic_datetime"] + '</em></small></div>';
		
	});
					
	$("#reservationLink").html(strHTML);
}

function drawDetail(strID) {
	var strHTML="";
	$.each(jsonRestData.restaurants, function(i, item) {
		if (item["lic_documentID"]== strID) {
			strHTML += '<div style="" class="row liciousdetail">';
				strHTML += '<div class="col-xs-12 col-sm-8">';
					strHTML += '<h1 class="col-xs-12 lic_restname">' + item["lic_restName"] + '</h1>';
					strHTML += (item["lic_hotel"]=="") ? "" : '<p class="lic_hotel">' + item["lic_hotel"] + '</p>';
					strHTML += '<p class="addresssection"><span class="lic_address">' + item["lic_address"] + '</span>';
					strHTML += (item["lic_additionaladdress"]=="") ? '':', ' + item["lic_additionaladdress"];
					strHTML += '<span class="lic_address" cotlabel="map">	(<a title="map" href="http://maps.google.com?q='+ item["lic_address"] + ' Toronto Ontario" target="_blank">map</a>)</span></p>';
					strHTML += '<p class="lic_phone">' + item["lic_phone"] + '</p>';
					strHTML += '<p class="lic_neighbourhood">' + item["lic_neighbourhood"].join(', ') + '</p>';
					strHTML += '<p class="icons">';
					strHTML += (item["lic_veggie"]=="Yes") ? '<img class="icon lic_veggie" title="" data-original-title="Vegetarian three-course menu option available at '+item["lic_restName"]+'" alt="'+item["lic_restName"]+' Vegetarian Option Icon" src="/static_files/WebApps/images/veggieicon.png">' : '';
					strHTML += (item["lic_vegan"]=="Yes") ? '<img class="icon lic_vegan" title="" data-original-title="Vegan three-course menu option available '+item["lic_restName"]+'" alt="' +item["lic_restName"]+ 'Vegan Option Icon" src="/static_files/WebApps/images/veganicon.png">' : '';
					strHTML += (item["lic_local"]=="Yes") ? '<img class="icon lic_local" alt="Local Meals Offered Icon for '+item["lic_restName"]+'" src="/static_files/WebApps/images/localicon.png" title="" data-original-title="Locally sourced menu option available at '+item["lic_restName"]+'">' : '';
					strHTML += (item["lic_accessible"]=="Yes") ? '<img class="icon lic_accessible" title="" alt="'+item["lic_restName"]+' Accessible Icon" src="/static_files/WebApps/images/fullyaccessibleicon.png" data-original-title="'+item["lic_restName"]+' Accessible restaurant">' : '';
					strHTML += '</p>';
					
					strHTML += '<div class="sitelinks">';
					strHTML += (item["lic_url"]=="") ? "": '<span class="lic_www"><a title="Website" href="' + item["lic_url"] + '" target="_blank">Website</a></span>';
					strHTML += (item["lic_twit"]=="") ? "": '<span class="lic_twit"><a title="Twitter" href="' + item["lic_twit"] + '" target="_blank">Twitter</a></span>';
					strHTML += (item["lic_instagram"]=="") ? "": '<span class="lic_instagram"><a title="Instagram site" href="' + item["lic_instagram"] + '" target="_blank">Instagram</a></span>';
					strHTML += (item["lic_fb"]=="") ? "": '<span class="lic_fb"><a title="Facebook" href="' + item["lic_fb"] + '" target="_blank">Facebook</a></span>';
					strHTML += (item["lic_youtube"]=="") ? "": '<span class="lic_fb"><a title="Youtube site" href="' + item["lic_youtube"] + '" target="_blank">Youtube</a></span>';
					strHTML += '</div>';
					
					
					strHTML += '<p class="lic_profile">' + item["lic_profile"].join('<br>') + '</p>';
					strHTML += '<p><span><strong>Cuisine: </strong></span><span class="lic_cuisine">' + item["lic_cuisine"].join(', ') + '</span></p>';
					
															
					strHTML += '<div id="reservationLink"></div>';
										
					strHTML += '<div class="sitelinks">';
					strHTML += (item["lic_lunchlink"]=="" && item["lic_dinnerlink"]=="") ? "": '<br><p><strong>Reserve online</strong> for seatings between July 8 and 24, 2016:</p><img src="/static_files/WebApps/images/fork.png"> &nbsp;';
					strHTML += (item["lic_lunchlink"]=="") ? "": '<span class="lic_lunchlink"><a title="Reserve Lunch" href="' + item["lic_lunchlink"] + '" target="_blank">Reserve Lunch</a></span>';
					strHTML += (item["lic_dinnerlink"]=="") ? "": '<span class="lic_dinnerlink"><a title="Reserve Dinner" href="' + item["lic_dinnerlink"] + '" target="_blank">Reserve Dinner</a></span>';
					strHTML += (item["lic_lunchlink"]=="" && item["lic_dinnerlink"]=="") ? "": '<br>';
					strHTML += '</div>';
					
					strHTML += '<img class="visible-xs img-thumbnail detail-right lic_imagelink" src="' + item["lic_imagelink"] + '" alt="Image of the restaurant ' + item["lic_restName"] + '">';
					
					var smCol = (item["lic_lunch"]=="Yes" && item["lic_dinner"]=="Yes") ? "col-sm-6" : "col-sm-12";

					if (item["lic_lunch"]=="Yes") {
						strHTML += '<div class="lic_lunch col-xs-12 ' + smCol + '">';
						strHTML += '<div class="menu_heading"><p class="lic_lunchprice">' + item["lic_lunchprice"] + '</p>';
						strHTML += '<p class="lic_lunch">Plus taxes and gratuity</p></div>';
						strHTML += '<p>' + item["lic_lunchmenu"].join('<br>') + '</p></div>';
					}
					if (item["lic_dinner"]=="Yes") {
						strHTML += '<div class="lic_dinner col-xs-12 ' + smCol + '">';
						strHTML += '<div class="menu_heading"><p class="lic_dinnerprice">' + item["lic_dinnerprice"] + '</p>';
						strHTML += '<p class="lic_dinner">Plus taxes and gratuity</p></div>';
						strHTML += '<p>' + item["lic_dinnermenu"].join('<br>') + '</p></div>';
					}
			
				strHTML += '</div>';

			strHTML += '<div class="col-xs-12 col-sm-4"><img class="hidden-xs img-thumbnail detail-right lic_imagelink" src="' + item["lic_imagelink"] + '" alt="Image of the restaurant ' + item["lic_restName"] + '">';			
				strHTML += '<div style="margin: auto;"><input id="searchTextField" type="text" size="50">';
					strHTML += '<div style="height: 300px; width: 100%; position: relative; overflow: hidden; -webkit-transform: translateZ(0px); background-color: rgb(229, 227, 223);  margin-top: 10px; margin-bottom: 5px; " id="map-canvas" class="hidden-xs">';
					strHTML += '</div>';
					strHTML += '<div class="hidden-xs">';
			        strHTML += '<img src="/static_files/WebApps/images/markerblue.png"/> Culinary Events ' + ' <img src="/static_files/WebApps/images/markergreen.png"/> Prix Fixe Restaurants';
			        strHTML += '</div><br>';
					strHTML += '<div class="mapoption active"><div><a class="ttcplanner"' + ' href=' + '"http://tripplanner.ttc.ca/hiwire?EndDetail=' + item["lic_address"] + '"' + ' target="_blank"'+ '>TTC Trip Planner</a></div></div>';
					
					
			strHTML += '</div></div>';
		
			
			strHTML += '<div class="col-xs-12">';
				strHTML += '<div class="disclaimer alert alert-info">';
					strHTML += '<p><small>Prices listed are per person. Beverages, taxes and gratuity are additional. Some restrictions apply. Lunch and Dinner menus include starter, entrée and dessert.</small></p><br>';
					strHTML += '<p><small>Restaurant operating hours vary. Lunch menu start and end times vary per restaurant. Some restaurants offer only a brunch menu on weekends and do not participate in the Summericious/Winterlicious lunch promotion. Contact individual restaurants for details.</small></p><br>';
					strHTML += '<p><strong><small>Online Reservations</small></strong></p>';
					strHTML += "<p><small>The City of Toronto is not involved in the online reservation of restaurants. For those restaurants participating in the online reservation program, you will see a Reserve Lunch and/or Reserve Dinner link on the first day reservations are accepted. When you click these links you are leaving the City's website. Any information you provide to make the reservation is not collected by the City of Toronto.</small></p><br>";
					strHTML += "<p><small><strong>Today's Reservations</strong> details are populated by the restaurants participating in the Prix Fixe promotion. Information was accurate at the time of posting. Please contact the restaurants directly for more information and to reserve a table.</small></p>";
				strHTML += '</div>';
			strHTML += '</div>';
			return false;
		}
	});

	$(strHTML).insertAfter($( "#tabNavigation" ));
	
	//var strURL = "http://wx.toronto.ca/inter/se/restaurants.nsf/ReservationListJSON.xsp&key=" + strID;
	//$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});
	
	//SET UP DETAIL MAP
	myLatLng = new google.maps.LatLng(43.721459,-79.373903);
	var mapOptions = {zoom: 16,center: myLatLng,mapTypeId: google.maps.MapTypeId.ROADMAP,mapTypeControl: true,
	mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,position: google.maps.ControlPosition.TOP_RIGHT},
	panControl:false,zoomControl: true,zoomControlOptions: {style: google.maps.ZoomControlStyle.SMALL,position: google.maps.ControlPosition.RIGHT_BOTTOM},
	streetViewControl: true,streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}}
	map = new google.maps.Map(document.getElementById('map-canvas'),mapOptions);
	var marker;
	var buttonUI = document.createElement('button');
	buttonUI.id = "resetMap";
	buttonUI.className = "resetMap";
	buttonUI.innerHTML = "Reset Map";
	buttonUI.onclick = function () { resetMap();};
	map.controls[google.maps.ControlPosition.RIGHT_TOP].push(buttonUI);
	controlUI = document.createElement('div');
	controlUI.id = "mapinfobox";
	controlUI.className = "infoBox";
  	map.controls[google.maps.ControlPosition.TOP_LEFT].push(controlUI);
	//**********************



	//ADD MARKERS TO MAP
	$.each(jsonRestData.restaurants, function(i, item) {
		myLatLng = new google.maps.LatLng(item["lic_lat"],item["lic_lng"]);
		marker = new google.maps.Marker({
			id: "mapmarker" + i,
			type: "restaurant",
			icon: '/static_files/WebApps/images/markergreen.png',
			position: myLatLng,
			map: map,
			name: item["lic_restName"],
			summary: item["lic_profile"].join('<br>'),
			addsummary : item["lic_address"],
			neighbourhood : item["lic_neighbourhood"].join(', '),
			phone : item["lic_phone"],
			cuisine : item["lic_cuisine"].join(', '),
			unid: item["lic_documentID"],
			lunchprice : item["lic_lunchprice"],
			dinnerprice : item["lic_dinnerprice"]
		});
		marker.setZIndex(277000000);
		if (item["lic_documentID"] == strID) {
			map.setCenter(myLatLng);
			marker.setZIndex(299000001);
			marker.setIcon('/static_files/WebApps/images/markergreen_sel.png');
		}
		arrMarkers.push(marker);
		google.maps.event.addDomListener(marker, 'click', function (){createInfoBox(this);});
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

$( document ).ready(function() {
	strKey = $.QueryString["key"];
	var strURL = "http://wxqa.toronto.ca/inter/se/restaurants.nsf/SummerRestaurantListJSONP.xsp";
	//var strURL = "https://was-inter-qa.toronto.ca/cc_sr_v1/data/SummerRestaurantListJSON/0?callback=jsonRestaurantsCallBack";
	$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});	
		
    //strURL = "http://wxqa.toronto.ca/inter/se/restaurants.nsf/SummerCulinaryListJSON.xsp";
   // $.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});

});

