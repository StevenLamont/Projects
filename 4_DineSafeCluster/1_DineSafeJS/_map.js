
/* ==================================================
 * MyInfoWindow CLASS
 * ================================================== */

var MyInfoWindow = function( map ) {

	this.setMap(map);
	
	this.$layer = $('<div/>').addClass('myInfoWin');
	this.$point = $('<div/>').addClass('myInfoWin_point');
	this.$wrapper = $('<div/>').addClass('myInfoWin_wrapper');
	this.$inner_top = $('<div/>').addClass('myInfoWin_inner_top');
	this.$inner_middle = $('<div/>').addClass('myInfoWin_inner_middle');
	this.$inner_bottom = $('<div/>').addClass('myInfoWin_inner_bottom');
	
	return true;
};

MyInfoWindow.prototype = new google.maps.OverlayView();

// PROPERTIES

MyInfoWindow.prototype.content = {
	'body'    : null,
	'controls': null,
	'position': null,
	'title'   : ''
};

MyInfoWindow.prototype.$layer        = null;
MyInfoWindow.prototype.$point        = null;
MyInfoWindow.prototype.$wrapper      = null;
MyInfoWindow.prototype.$inner_top    = null;
MyInfoWindow.prototype.$inner_middle = null;
MyInfoWindow.prototype.$inner_bottom = null;

// METHODS

MyInfoWindow.prototype.onAdd = function() {
	
	var $pane = $(this.getPanes().floatPane);
	
	$pane.append(this.$layer);
	
	var $outer = $('<div />').addClass('myInfoWin_outer');
	
	var $winClose = $('<div/>').addClass('myInfoWin_windowclose');
	
	var infowindow = this; // Closure
	
	google.maps.event.addDomListener($winClose[0], 'click', function(e) {
		e = e || window.event;
		
		try { /* IE */
		
			e.cancelBubble = true;
			
		} catch(error) { /* Others */
			
			e.stopPropagation();
			
		};
		
		infowindow.close();
	});
	
	this.$wrapper.append($outer.append($winClose, this.$inner_top, this.$inner_middle, this.$inner_bottom));
	
	google.maps.event.addDomListener($outer.get(0), 'click', function(e) {
		e = e || window.event;
		
		try { /* IE */
			
			e.cancelBubble = true;
		
		} catch(error) { /* Others */
			
			e.stopPropagation();
		
		};
	});
	
	this.$point.append(this.$wrapper);
};

MyInfoWindow.prototype.onRemove = function() {
	
	this.$layer.empty().remove();
	
};

MyInfoWindow.prototype.draw = function() {
	
	this.$layer.empty();
	
	if (!!this.content.body && !!this.content.position) {
	
		this.$layer.append(this.$point);
		
		var projection = this.getProjection();
		var location = projection.fromLatLngToDivPixel(this.content.position);
		
		this.$point.css({ 'top':location.y, 'left':location.x });

		this.$inner_top.empty().append(this.content.title);
		
		this.$inner_middle.empty().html(this.content.body);
		
		if (this.$inner_middle.children('div:first').height() > 150) {

			this.$inner_middle.children('div:first').addClass('myInfoWin_scrollable');
			
			google.maps.event.addDomListener( this.$inner_middle.children('div:first').get(0), 'mousedown', function(e) {
				e = e || window.event;
				
				try{ /* IE */
					
					e.cancelBubble = true;
				
				} catch(error) { /* Others */
					
					e.stopPropagation();
				
				};
			});
		};
		
		this.$inner_bottom.empty();
		
		if (!!this.content.controls)
			this.$inner_bottom.html(this.content.controls);
	};
};

MyInfoWindow.prototype.open = function(position, title, body, controls, total) {
	
	if(!!position && !!body) {
		
		this.close();
		
		this.content = {
			'body'    : body,
			'controls': ( controls || null ),
			'position': position,
			'title'   : ( title || '' ),
			'total'   : total || 0
		};
		
		this.draw();
		this.pan();
	};
};

MyInfoWindow.prototype.open2 = function( objPosition, strAddress, arrEstablishments, numTotal ) {
	
	if( !!objPosition ) {
	
		var self = this;
	
		var statusIcons = [ 'images/map/pass.png', 'images/map/conditional.png', 'images/map/close.png' ];
		var statusAlts = [ 'Pass', 'Conditional Pass', 'Closed' ];
		var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	
		var htmBody = $('<div>').get(0);
		var htmControls = $('<div>').get(0);
		
		var htmTitle = '';
		
		if( arrEstablishments.length > 1 ) {
			var $htmTitle = $( '<div>' ).append( $( '<strong>' ).text( strAddress ), $( '<br>' ) );
			
			if( arrEstablishments.length != numTotal ) {
				$htmTitle.append( 'Showing ', arrEstablishments.length, ' of ' );
			};
			
			$htmTitle.append( numTotal, ' establishments at this address' );
			
			htmTitle = $htmTitle.get(0);
		};
		
		this.close();
		
		for ( var numIndex = 0; numIndex < arrEstablishments.length; numIndex++ ) {
			
			var objEstablishment = arrEstablishments[ numIndex ];
			
			var $wrapper = $('<p/>');
			
			var $status = $('<img/>').attr( {
				'alt': statusAlts[ ( +objEstablishment.status ) - 1 ],
				'src': statusIcons[ ( +objEstablishment.status ) - 1 ]
			} );
			
			function openDetail() {
				
				tph.dinesafe.detailModel.fetch( this.data.establishmentID );
			};
			
			var $heading = $('<strong/>').css( { 'text-decoration':'underline', 'cursor':'pointer' } ).text( objEstablishment.name );
			
			$heading.data( 'establishmentID', objEstablishment.id );
			$heading.get(0).data = { establishmentID: objEstablishment.id };
			$heading.get(0).onclick = openDetail;
			
			var update = 'Unavailable';
			
			if( !!objEstablishment.date )
				update = months[ objEstablishment.date.getMonth() ] + ' ' +  objEstablishment.date.getDate() + ', ' + objEstablishment.date.getFullYear();
			
			$wrapper.append( $status, $heading, $('<br/>') );

			if( arrEstablishments.length == 1 )
				$wrapper.append( strAddress, $('<br/>') );
			
			$wrapper.append( 'Last inspected: ', update );
			
			if( arrEstablishments.length > 1 ) {
				
				var $inspectionDetail = $( '<span>' ).css( { 'text-decoration': 'underline', 'cursor': 'pointer' } ).text( 'Inspection Details' );
				
				$inspectionDetail.get(0).data = { establishmentID: objEstablishment.id };
				$inspectionDetail.get(0).onclick = openDetail;
				
				$wrapper.append( $( '<br>' ), $inspectionDetail );
			};
			
			$( htmBody ).append( $wrapper );
		};
		
		if( arrEstablishments.length == 1 ) {
		
			var $detailviewControl = $('<span>' ).attr( 'id', 'detailView' ).text( 'Inspection Details' );
			
			$detailviewControl.get(0).data = { establishmentID: objEstablishment.id };
			$detailviewControl.get(0).onclick = openDetail;
			
			$( htmControls ).append( $detailviewControl );
		};
		
		if( arrEstablishments.length != numTotal ) {
			
			var $searchmoreControl = $('<span>' ).attr( 'id', 'searchMore' ).text( 'Search this Address' ).click( function(e) {
			
				tph.dinesafe.search.form.clearForm();
				tph.dinesafe.search.form.$Address.val( strAddress );
				tph.dinesafe.search.form.$form.submit();
			} );
			
			$( htmControls ).append( $searchmoreControl );
		}
		
		var $streetviewControl = $('<span>' ).attr( 'id', 'streetView' ).text( 'Street View' );
		
		$streetviewControl.get(0).onclick = function(e) {
		
			var streetViewService = new google.maps.StreetViewService();

			var STREETVIEW_MAX_DISTANCE = 50;

			var latLng = objPosition;

			streetViewService.getPanoramaByLocation( latLng, STREETVIEW_MAX_DISTANCE, function ( streetViewPanoramaData, status ) {

				if ( status === google.maps.StreetViewStatus.OK) {
					
					// ok
					mapView.panorama.setPosition( streetViewPanoramaData.location.latLng );
					mapView.panorama.setPano( streetViewPanoramaData.location.pano )
					
					mapView.panorama.setPov( {
						heading: google.maps.geometry.spherical.computeHeading( streetViewPanoramaData.location.latLng, latLng ),
						zoom: 1,
						pitch: 0
					} );
	
					mapView.panorama.setVisible(true);
				} else {
	
					// no street view available in this range, or some error occurred
					alert( 'No street view available for this location' );
				};
			} );
		};

		$( htmControls ).append( $streetviewControl );
		
		this.content = {
			body: htmBody,
			controls: htmControls,
			position: objPosition,
			title: htmTitle
		};
		
		this.draw();
		this.pan();
	};
};

MyInfoWindow.prototype.close = function(param) {
		
	this.content = { 'body': null, 'controls': null, 'position': null, 'title': '' };
	this.draw();
};

MyInfoWindow.prototype.pan = function() {
	
	if (!!this.content.body && !!this.content.position) {
		
		// if we go beyond map, pan map
		var map = this.map;
		var bounds = map.getBounds();
		
		if (!bounds) return;
		
		// The degrees per pixel
		var mapDiv = map.getDiv();
		
		var mapWidth = $(mapDiv).width();
		var mapHeight = $(mapDiv).height();
		
		var boundsSpan = bounds.toSpan();
		var longSpan = boundsSpan.lng();
		var latSpan = boundsSpan.lat();
		
		var degPixelX = longSpan / mapWidth;
		var degPixelY = latSpan / mapHeight;
		
		// The bounds of the map
		var mapWestLng = bounds.getSouthWest().lng();
		var mapEastLng = bounds.getNorthEast().lng();
		var mapNorthLat = bounds.getNorthEast().lat();
		var mapSouthLat = bounds.getSouthWest().lat();
		
		// The position of the infowindow
		var position = this.content.position;
		
		var iwWestLng = position.lng() - ( ( ( this.$wrapper.width() / 2 ) + 10 ) * degPixelX );
		var iwEastLng = position.lng() + ( ( ( this.$wrapper.width() / 2 ) + 10 ) * degPixelX );
		var iwNorthLat = position.lat() + ( ( this.$wrapper.height() + 30 ) * degPixelY );
		var iwSouthLat = position.lat()
		
		// calculate center shift
		var shiftLng = (iwWestLng < mapWestLng ? mapWestLng - iwWestLng : 0) + (iwEastLng > mapEastLng ? mapEastLng - iwEastLng : 0);
		var shiftLat = (iwNorthLat > mapNorthLat ? mapNorthLat - iwNorthLat : 0) + (iwSouthLat < mapSouthLat ? mapSouthLat - iwSouthLat : 0);
		
		// The center of the map
		var center = map.getCenter();
		
		// The new map center
		var centerX = center.lng() - shiftLng;
		var centerY = center.lat() - shiftLat;
		
		// center the map to the new shifted center
		map.panTo(new google.maps.LatLng(centerY, centerX));
	};
};


/* ==================================================
 * MyInfoWindow.buildBody FUNCTION
 * ================================================== */

MyInfoWindow.buildBody = function( array_of_formatted_objects, with_address, click_handler ) {
	
	var statusIcons = [ 'images/map/pass.png', 'images/map/conditional.png', 'images/map/close.png' ];
	var statusAlts = [ 'Pass', 'Conditional Pass', 'Closed' ];
	var months = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ];
	
	var $body = $('<div />');
	
	for ( var i = 0; i < array_of_formatted_objects.length; i++ ) {
		
		var establishment = array_of_formatted_objects[i];
		
		var $wrapper = $('<p/>');
		
		var $status = $('<img/>').attr( {
				'alt': statusAlts[ establishment.status ],
				'src': statusIcons[ parseInt( establishment.status, 10 ) - 1 ]
			} );
		
		var $heading = $('<strong/>').css( { 'text-decoration':'underline', 'cursor':'pointer' } ).data( 'id', establishment.id ).text( establishment.name );
		
		var elementID = establishment.id;
		
		$heading.get(0).myid =  establishment.id;
		
		if( !!click_handler ) {
			
			google.maps.event.addDomListener( $heading.get(0), 'click', function() {
				// click_handler( $(this).data('id') );
				
				click_handler( this.myid );
			} );
		};
		
		var update;
		
		if( establishment.update == null )
			update = 'Unavailable';
		else
			update = months[ parseInt( establishment.update.substr( 5, 2 ), 10 ) - 1 ] + ' ' + parseInt( establishment.update.substr( 8, 2 ), 10 ) + ', ' + parseInt( establishment.update.substr( 0, 4 ), 10 );
		
		$wrapper.append( $status, $heading, $('<br/>') );
		
		if ( !!with_address )
			$wrapper.append( establishment.address, $('<br/>') ); 
		
		
		$wrapper.append( 'Last inspected: ', update );
		
		$body.append( $wrapper );
	};
	
	return( $body.get(0) );
};


/* ==================================================
 * mapView VIEW
 * ================================================== */

var mapView = {

	// CONFIGURATIONS

	config: {
		'center'      : new google.maps.LatLng(43.725568,-79.396845),
		'fusionTable' : tph.dinesafe.config.fusionTableId,
		'markerImages': ['images/map/marker_blue.png',
		                 'images/map/marker_pass.png',
		                 'images/map/marker_conditional.png',
		                 'images/map/marker_close.png'],
		'maxZoom'     : 15,
		'zoom'        : 11
	},
	
	// PROPERTIES
	
	canvas            : null,
	fusionTableLayer  : null,
	geocoder          : null,
	infoWindow        : null,
	map               : null,
	markers           : [],
	panorama          : null,
	zoomControl_marker: null,
	
	$loader   : $('#map-loader'),
	$ZoomInput: $('<input />').attr('type', 'text').css({ 'margin':'0 0 0 0', 'border': '1px solid #666666', 'width':'300px' }),
	
	// METHODS
	
	// Loaders
	
	hideLoader: function() { this.$loader.fadeOut(); },
	showLoader: function() { this.$loader.fadeIn(); },
	
	// Dialog
	
	hideDialog: function() {},
	showDialog: function(strMessage) {},
	
	// Fusion Table
	
	addFusionTable: function() {
		
		var this_closure = this;
		
		this.fusionTableLayer = new google.maps.FusionTablesLayer({
		
			query: {
				'select': '*',
				'from'  : this.config['fusionTable']
			},
			
			styles: [{ 'where': "'INSPECTION_STATUS_CODE' = 1", markerOptions: { iconName: 'small_green' } },
				    { 'where': "'INSPECTION_STATUS_CODE' = 2", markerOptions: { iconName: 'small_yellow' } },
				    { 'where': "'INSPECTION_STATUS_CODE' = 3", markerOptions: { iconName: 'small_red' } },
				    { 'where': "'EST_ID' = 0", markerOptions: { iconName: 'small_blue' } }],
			         
			heatmap: {
				enabled: false
			},
			
			suppressInfoWindows: true,
			
			map: this.map
		});
		
		google.maps.event.addListener(this.fusionTableLayer, 'click', function(oData) {
			
			this_closure.handleFusionTableClick(oData.row);
			
		});
		
		// Refresh Map
		
		setTimeout(function(){
			this_closure.reloadFusionTable();
		},3000);
	},
	
	reloadFusionTable: function() {
		
		// Check if its empty
		
		var this_closure = this;
		
		function cbk(oResult) {
			
			if(+oResult.rows[0][0] == 0)
				alert('The DineSafe data is being updated. Try reloading this page in 2 minutes.');
			
			this_closure.fusionTableLayer.setOptions({
				query: {
					'select': '*',
					'from'  : this_closure.config['fusionTable']
				},
				
				styles: [{ 'where': "'INSPECTION_STATUS_CODE' = 1", markerOptions: { iconName: 'small_green' } },
					    { 'where': "'INSPECTION_STATUS_CODE' = 2", markerOptions: { iconName: 'small_yellow' } },
					    { 'where': "'INSPECTION_STATUS_CODE' = 3", markerOptions: { iconName: 'small_red' } },
					    { 'where': "'EST_ID' = 0", markerOptions: { iconName: 'small_blue' } }],
				
				heatmap: {
					enabled: false
				},
				
				suppressInfoWindows: true,
				
				map: this_closure.map
			});
			
			$("img[src*='googleapis']").each(function() {
				
				$(this).attr("src", $(this).attr("src") + "&" + (new Date()).getTime());
			});
		}
		
		var strSQL = 'SELECT COUNT() FROM ' + this.config['fusionTable'];
		
		var urlFusionTableQuery = 'https://www.googleapis.com/fusiontables/v1/query?sql=' + strSQL + '&key=AIzaSyCr2jyRmcHVKnawB7NZ8BsXl2luxW6OSwI&callback=?';
		
		$.getJSON(urlFusionTableQuery, cbk);
	},
	
	// Controls
	
	addZoomControl: function() {
		
		var this_closure = this;
		
		var $zoom_control = $( '<div />' ).attr( 'id', 'zoomControl' ).addClass( 'gmnoprint custom_control_clean' ).attr( 'index', 1 );
		
		var $zoom_text = $('<div />').css( { 'padding-bottom': '2px', 'border-right': '1px solid #666666' } ).addClass( 'custom_button' ).attr( 'title', '' );
		
		var $zoom_button = $('<div />').css( { 'border-left': '0' } ).addClass( 'custom_button' ).attr( 'title', 'Zoom to Location' ).text('Go');
		
		$zoom_button.on( 'click', function(event) {
			
			event = event || window.event;
			
			try{ /* IE */
				event.cancelBubble = true;
			} catch(error) { /* Others */
				event.stopPropagation();
			};
			
			this_closure.handleZoomControlClick();
		} );
		
		this.$ZoomInput.css('color', '#666666').val('Enter Address or Intersection');
		
		this.$ZoomInput.focus(function(event) {
			
			var $this = $(this);
			
			if($this.val() == 'Enter Address or Intersection') {
				$this.val('');
				$this.css('color', '#000');
			};
		});
		
		this.$ZoomInput.blur(function(e) {
			
			var $this = $(this);
			
			if($.trim($this.val()) == '') {
				$this.val('Enter Address or Intersection');
				$this.css('color', '#666666');
			};
		});
		
		this.$ZoomInput.keyup(function(e) {
			
			e = e || window.event;
			
			try { /* IE */
				e.cancelBubble = true;
			} catch(error) { /* Others */
				e.stopPropagation();
			};
			
			if (e.keyCode == 13)
				$(this).parent().siblings(':first').trigger('click');
		} );
		
		$zoom_control.append( $zoom_text.append( this.$ZoomInput ), $zoom_button );
		
		this.map.controls[google.maps.ControlPosition.TOP_LEFT].push($zoom_control.get(0));
	},
	
	setTimeout: function() {
		
		var this_closure = this;
		
		if(!!this.timeOutObject)
			clearTimeout(this.timeOutObject);
		
		this.timeOutObject = setTimeout(function(){
			
			this_closure.timedOut();
		
		}, 5000);
	},
	
	// HOOKS
	
	handleFusionTableClick: function(oDataRow) {},
	
	mapReady: function() {},
	
	timedOut: function() {
		this.setTimeout();
	},
	
	// INITIALIZER
	
	initialize: function() {},
	
	initializeOnLoad: function() {
		
		this.initializeOnLoad = function() { return this; };
		
		var this_closure = this;
		
		var oOptions = {
			'center'   : this.config['center'],
			'mapTypeId': google.maps.MapTypeId.ROADMAP,
			'noClear'  : false,
			'zoom'     : this.config['zoom']
		};
		
		this.canvas = $('#map-canvas').get(0),
		
		this.map = new google.maps.Map(this.canvas, oOptions);
		
		google.maps.event.addListener(this.map, 'tilesloaded', function() {
			
			google.maps.event.clearListeners(this_closure.map, 'tilesloaded');
			
			this_closure.mapReady();
		});
		
		google.maps.event.addListener(this.map, 'click', function() {
			
			this_closure.infoWindow.close();
			
		});
		
		this.addFusionTable();
		
		this.geocoder = new google.maps.Geocoder();
		
		this.infoWindow = new MyInfoWindow(this.map);
		
		this.addZoomControl();
		
		this.addShowAllControl();
		
		this.addLegendControl();
		
		this.addStreetViewControl();
		
		this.setTimeout();
		
		return this.initializeOnLoad();
	}
};

( function( oView ) {

	// Google Map Controls
	
	oView.addLegendControl = function() {
	
		var $legend_control = $('<div>').addClass( 'gmnoprint custom_control maplegend' ).attr( 'index', 1 );
		
		var $legend_button = $('<div>').addClass( 'custom_button' ).attr( 'title', '' );
		
		var legend_html = '';
		legend_html = legend_html + '<p class="leading"><strong>Legend:</strong></p>';
		legend_html = legend_html + '<ul>';
		legend_html = legend_html + '<li><img alt="" src="images/map/marker_pass.png" height="17" width="17" /> Pass</li>';
		legend_html = legend_html + '<li><img alt="" src="images/map/marker_conditional.png" height="17" width="17" /> Conditional Pass</li>';
		legend_html = legend_html + '<li><img alt="" src="images/map/marker_close.png" height="17" width="17" /> Closed</li>';
		legend_html = legend_html + '<li><img alt="" src="images/map/marker_blue.png" height="17" width="17" /> Multiple Establishments</li>';
		legend_html = legend_html + '</ul>';
		
		$legend_control.append( $legend_button.html( legend_html ) );
		
		this.map.controls[ google.maps.ControlPosition.RIGHT_BOTTOM].push( $legend_control.get( 0 ) );
	};
	
	oView.addShowAllControl = function() {
		
		var $showall_control = $('<div>').addClass('gmnoprint custom_control').attr('index', 1);
		
		var $showall_button = $('<div>').addClass('custom_button').attr('title', 'Show Inspection Results').text('Reset');
		
		google.maps.event.addDomListener($showall_button.get(0), 'click', function(e) {
		
			e = e || window.event;
			
			try { /* IE */
				e.cancelBubble = true;
			} catch(error) { /* Others */
				e.stopPropagation();
			};
			
			//window.location.reload();
			
			oView.handleShowAllControlClick();
			
			oView.reloadFusionTable()
		} );
		
		$showall_control.append( $showall_button );
		
		this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push( $showall_control.get(0) );
	};
	
	oView.handleShowAllControlClick = function() {
		
		this.clearMarkers();
		
		this.$ZoomInput.val( '' ).blur();
		this.removeZoomControlMarker();
		
		this.map.setZoom( this.config.zoom );
		this.map.panTo( this.config.center );
		
		this.infoWindow.close();
		
		this.fusionTableLayer.setMap( this.map );
	};
	
	oView.handleZoomControlClick = function() {

		var geoBoundry = new google.maps.LatLngBounds( new google.maps.LatLng( 43.458297,-79.639219 ), new google.maps.LatLng( 43.855458,-79.002481 ) );
		
		this.geocoder.geocode( {
			'address': this.$ZoomInput.val() + ', Toronto, ON, Canada',
			'latLng': this.config.center,
			'bounds': geoBoundry,
			'region': 'CA'
		}, function( results, status ) {
		
			if ( status == google.maps.GeocoderStatus.OK )
				oView.handleZoomControlGeoCode( results );
			else
				oView.handleZoomControlGeoCodeFail();
		} );
	};
	
	oView.handleZoomControlGeoCode = function( results ) {
	
		this.$ZoomInput.blur();
		this.$ZoomInput.val( results[0].formatted_address );
		
		this.map.setCenter(results[0].geometry.location);
		this.map.setZoom( this.config.maxZoom );
		
		if ( !!this.zoomControl_marker )
			this.removeZoomControlMarker();
		
		this.zoomControl_marker = new google.maps.Marker( {
			animation: google.maps.Animation.DROP,
			icon: new google.maps.MarkerImage( 'images/map/marker_location.png' ),
			map: this.map,
			position: results[0].geometry.location,
			shadow: new google.maps.MarkerImage( 'images/map/marker_location_shadow.png', null, null, new google.maps.Point( 6, 14 ) )
		} );
		
		google.maps.event.addListener( this.zoomControl_marker, 'click', function() {

			var hBody = $( '<div>' ).append( $( '<p>' ).append( results[0].formatted_address ) ).get( 0 );
			var htmTitle = $( '<div>').append( $( '<strong>' ).text( 'You are here' ) );
			var oPosition = this.getPosition();
			var hControl = $( '<div>' ).append( $( '<span>' ).attr( 'id', 'removeZoomMarker' ).text( 'Remove' ).on( 'click', function( e ){
				e = e || window.event;
				try{ /* IE */ e.cancelBubble = true; } catch(error){ /* Others */ e.stopPropagation(); };
				
				oView.removeZoomControlMarker();
				oView.infoWindow.close();
			} ) ).get( 0 );
			
			oView.infoWindow.open( oPosition, htmTitle, hBody, hControl );
		} );
	};
	
	oView.handleZoomControlGeoCodeFail = function() {
		this.$ZoomInput.blur();
		
		alert('Address was not found. Press the OK button to continue.');
		
		//this.$ZoomInput.focus();
		//this.$ZoomInput.select();
	};
	
	oView.removeZoomControlMarker = function() {
		if ( !!this.zoomControl_marker ) {
			this.zoomControl_marker.setMap(null);
			this.zoomControl_marker = null;
		};
	};
	
	oView.addStreetViewControl = function() {
	
		this.panorama = this.map.getStreetView();
	
		this.panorama.set( 'enableCloseButton', false );
		
		var $street_control = $( '<div>' ).addClass( 'gmnoprint custom_control' ).attr( 'index', 1 );
		
		var $street_button = $('<div>').append( 'Close' ).addClass( 'custom_button' ).attr( 'title', 'Close Street View' );
		
		google.maps.event.addDomListener( $street_button.get(0), 'click', function(e){
				oView.panorama.setVisible( false );
			} );
		
		$street_control.append( $street_button );
			
		this.panorama.controls[ google.maps.ControlPosition.TOP_RIGHT ].push( $street_control.get(0) );
	};
	
	
	// Markers
	
	oView.addMarker = function( latlng, imageIndex, title ) {

		var markerImage = new google.maps.MarkerImage( this.config.markerImages[ imageIndex ], new google.maps.Size( 17, 17 ), new google.maps.Point( 0, 0 ), new google.maps.Point( 8, 8 ) );
			
		var oMarkerOptions = {
			icon: markerImage,
			map: this.map,
			position: latlng,
			title: title
		};
		
		var marker = new google.maps.Marker( oMarkerOptions );
		
		google.maps.event.addListener( marker, 'click', function() {
				oView.handleMarkerClick( this );
			} );
		
		this.markers.push( marker );
	};
	
	oView.handleMarkerClick = function( marker ) {};
	
	oView.clearMarkers = function() {
		
		for( var n = 0; n < this.markers.length; n++ )
			this.markers[n].setMap( null );
		
		this.markers = [];
	};
	
} )( mapView );