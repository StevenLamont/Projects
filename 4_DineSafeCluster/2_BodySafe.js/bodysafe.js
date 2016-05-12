
// --------------------------------------------------------------------------------
// MARK: Helpers
// --------------------------------------------------------------------------------

var c = window.console || { log: function() {} };

function trimHTMLString(htmlString) {
	return htmlString.replace(/>\s+/g, '>').replace(/\s+<\\/g, '<\\').replace(/\s+/g, ' ');
}

function pad(num, size) {
	
	var s = num+"";
	
	while (s.length < size) {
		s = "0" + s;
	}
	
	return s;
}

function getScript(src) {
	document.write('<' + 'script src="' + src + '"><' + '/script>');
}


// --------------------------------------------------------------------------------
// MARK: BodySafe Project
// --------------------------------------------------------------------------------

window.bodysafe = window.bodysafe || {}

bodysafe.markerIcons = { 
	'black' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_black.png',
	'blue'  : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_blue.png',
	'green' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_green.png',
	'grey'  : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_grey.png',
	'red'   : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_red.png',
	'yellow': '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_pin_yellow.png'
};

bodysafe.mapEstablishmentStatusIcon = { 
	'black' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_popup_black.png',
	'green' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_popup_green.png',
	'grey'  : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_popup_grey.png',
	'red'   : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_popup_red.png',
	'yellow': '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_popup_yellow.png'
};

bodysafe.circleStatusIcon = {
	'green' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_circle_green.gif',
	'yellow': '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_circle_yellow.gif',
	'red'   : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_circle_red.gif'
}

bodysafe.squareStatusIcon = {
	'green' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_notice_green.png',
	'yellow': '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_notice_yellow.png',
	'red'   : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_notice_red.png',
	'black' : '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_notice_black.png'
};

bodysafe.loadingIcon = '/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_loading.gif';


// --------------------------------------------------------------------------------
// MARK: Form Module
// --------------------------------------------------------------------------------

bodysafe.form = bodysafe.form || {};

bodysafe.form.$html = null;

// MARK:  Callback

bodysafe.form.afterReset = [];
bodysafe.form.afterSubmit = [];

// MARK:  Action

// MARK:   Reset

bodysafe.form.reset = function() {
	
	var self = this;
	
	self.$html.trigger('reset');
	
	self.$html.find('.error').slideUp();
	
	var $serviceTypesInput = self.$html.find('#establishmentServiceType');
	$serviceTypesInput.find('option').not(':selected').each(function() {
		$(this).prop('selected', true);
	})
	$serviceTypesInput.multiselect('refresh');
	
	var $statusInput = self.$html.find('#inspectionStatus');
	$statusInput.find('option').not(':selected').each(function() {
		$(this).prop('selected', true);
	})
	$statusInput.multiselect('refresh');
	
	// Call Callback
	for (var i = 0; i < self.afterReset.length; i++) {
		self.afterReset[i]();
	}
}

// MARK:   Submit

bodysafe.form.submit = function() {
	
	var self = this;
	
	var serviceTypes = '';
	var $serviceTypesInput = self.$html.find('#establishmentServiceType');
	
	if (!!$serviceTypesInput.val()) {
		serviceTypes = $.trim($serviceTypesInput.val().join('.'));
	}
	
	if (serviceTypes == '') {
		$serviceTypesInput.parent().next('.error').slideDown();
	} else {
		$serviceTypesInput.parent().next('.error').slideUp();
	}
	
	var status = '';
	var $statusInput = self.$html.find('#inspectionStatus');
	
	if (!!$statusInput.val()) {
		status = $.trim($statusInput.val().join('.'));
	}
	
	if (status == '') {
		$statusInput.parent().next('.error').slideDown();
	} else {
		$statusInput.parent().next('.error').slideUp();
	}
	
	var replaceRegExp = /[^\s-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_]/g;

	var replaceFunc = function(match, offset, string) {
		return '.' + pad(match.charCodeAt(0), 3);
	}
	
	var name = '';
	name = $.trim(self.$html.find('#establishmentName').val().replace(/\s+/g, ' ').replace(replaceRegExp, replaceFunc));

	var address = '';
	address = $.trim(self.$html.find('#establishmentAddress').val().replace(/\s+/g, ' ').replace(replaceRegExp, replaceFunc));
	
	// Call Event Handler
	for (var i = 0; i < self.afterSubmit.length; i++) {
		self.afterSubmit[i](name, address, serviceTypes, status);
	}
};

// MARK:  Initializer

bodysafe.form.init = function($placeholder) {
	
	var self = this;
	
	// MARK:   Append CSS
	
	var styles = '<style>\
			#establishmentSearch p {\
				padding: 0 0 10px 0;\
			}\
			\
			\
			#establishmentSearch .error {\
				color: #f00;\
				margin-top: 0;\
				display: none;\
			}\
			\
			label[for="establishmentName"],\
			label[for="establishmentAddress"],\
			label[for="establishmentServiceType"],\
			label[for="inspectionStatus"] {\
				min-width: 125px;\
			}\
			\
			#establishmentSearchButton {\
				text-align: center;\
			}\
			\
			#establishmentSearchButton input {\
				width: 150px;\
			}\
			\
			.multiselect-container.dropdown-menu a {\
				text-decoration: none;\
			}\
			\
			.multiselect-container.dropdown-menu label {\
				font-weight: normal;\
				margin-bottom: 0;\
				display: block;\
				min-height: 0px;\
				padding-left: 7px;\
				margin-top: 3px;\
				margin-bottom: 3px;\
				vertical-align: middle;\
			}\
			\
			.multiselect-container.dropdown-menu > li > a {\
				display: block;\
				padding: 3px 20px;\
				clear: both;\
				font-weight: normal;\
				line-height: 1.428571429;\
				color: #333;\
				white-space: nowrap;\
			}\
		</style>';
	
	$('head').append(trimHTMLString(styles));
	
	// MARK:   Append HTML
	
	var html = '\<form id="establishmentSearch">\
			<h2 role="heading" aria-level="2">Search for an Establishment</h2>\
			\
			<div class="row">\
				<div class="col-xs-12 col-sm-6">\
					<p class="input-group">\
						<label for="establishmentName" class="input-group-addon">Name</label>\
						<input type="text" class="form-control" id="establishmentName" placeholder="Establishment Name">\
					</p>\
				</div>\
				<div class="col-xs-12 col-sm-6">\
					<p class="input-group">\
						<label for="establishmentAddress" class="input-group-addon">Address</label>\
						<input type="text" class="form-control" id="establishmentAddress" placeholder="Establishment Address">\
					</p>\
				</div>\
			</div>\
			\
			<div class="row">\
				<div class="col-xs-12 col-sm-6">\
					<p class="input-group">\
						<label for="establishmentServiceType" class="input-group-addon">Service Type</label>\
						<select multiple="multiple" class="form-control" id="establishmentServiceType"></select>\
					</p>\
					<p class="error">You will need to select at least 1 service type to continue your search.</p>\
				</div>\
				<div class="col-xs-12 col-sm-6">\
					<p class="input-group">\
						<label for="inspectionStatus" class="input-group-addon">Status</label>\
						<select multiple="multiple" class="form-control" id="inspectionStatus"></select>\
					</p>\
					<p class="error">You will need to select at least 1 status to continue your search.</p>\
				</div>\
			</div>\
			\
			<div class="row">\
				<div class="col-xs-12">\
					<p id="establishmentSearchButton">\
						<input class="btn btn-default" type="reset">\
						<input class="btn btn-primary" type="submit" value="Apply">\
					</p>\
				</div>\
			</div>\
		</form>';
	
	self.$html = $(html);
	
	$placeholder.append(self.$html);
	
	// MARK:   Events
	
	// MARK:    Form
	
	self.$html.submit(function(e) {
		e.preventDefault();
	});
	
	// MARK:    Submit Button
	
	var $submit = self.$html.find('input[type="submit"]');
	
	$submit.click(function(e) {
		
		e.preventDefault();
		self.submit();
	});
	
	// MARK:    Reset Button
	
	var $reset = self.$html.find('input[type="reset"]');
	
	$reset.click(function(e) {
		
		e.preventDefault();
		self.reset();
	});
	
	// MARK:   Document Ready
	
	$(function() {
		
		// Service Type
	
		var $establishmentServiceType = self.$html.find('#establishmentServiceType');
	
		$establishmentServiceType.multiselect({
			allSelectedText: 'All',
			selectAllValue: 'ALL',
			includeSelectAllOption: true,
			nonSelectedText: 'Select Service Type',
			numberDisplayed: 2,
			onChange: function(option, checked, select) {}
		});
	
		$establishmentServiceType.next('.btn-group').addClass('form-control').css('padding', '0').find('.multiselect').addClass('form-control').css('margin', '-1px 0');
	
		$.ajax('//app.toronto.ca/opendata/tphir/pss_srvc_types.json?v=1&callback=?', 
			{
				cache: true,
				dataType: 'jsonp',
				success: function (data, textStatus, jqXHR) {
				
					$establishmentServiceType.append(Mustache.render('{{#data}}<option value="{{serviceTypeCode}}" selected>{{serviceTypeDesc}}</option>{{/data}}', { data: data })).multiselect('rebuild');
					
				},
				timeout: 30000
			}
		);
	
		// Status
	
		var $inspectionStatus = self.$html.find('#inspectionStatus');
	
		$inspectionStatus.multiselect({
			allSelectedText: 'All',
			selectAllValue: 'ALL',
			includeSelectAllOption: true,
			nonSelectedText: 'Select Status',
			numberDisplayed: 2,
			onChange: function(option, checked, select) {}
		});
	
		$inspectionStatus.next('.btn-group').addClass('form-control').css('padding', '0').find('.multiselect').addClass('form-control').css('margin', '-1px 0');
	
		$.ajax('//app.toronto.ca/opendata/tphir/pss_est_status.json?v=1&callback=?', 
			{
				cache: true,
				dataType: 'jsonp',
				success: function (data, textStatus, jqXHR) {
				
					$inspectionStatus.append(Mustache.render('{{#data}}<option value="{{estStatusCd}}" selected>{{estStatusDesc}}</option>{{/data}}', { data: data })).multiselect('rebuild');
				
				},
				timeout: 30000
			}
		);
	});
}


// --------------------------------------------------------------------------------
// MARK: Google Map
// --------------------------------------------------------------------------------

bodysafe.googleMap = bodysafe.googleMap || {};

bodysafe.googleMap.$html = null;
bodysafe.googleMap.$mapcover = null;

bodysafe.googleMap.torontoCentre = null;
bodysafe.googleMap.defaultZoom = 11;

bodysafe.googleMap.map = null;
bodysafe.googleMap.infowindow = null;


// MARK:  Callback

bodysafe.googleMap.showEstablishment = [];
bodysafe.googleMap.showAllLocation = [];


// MARK:  Action

// MARK:   Reset

bodysafe.googleMap.reset = function(fullReset) {
	
	var self = this;
	
	fullReset = fullReset || false;
	
	if (!!self.xhr) {
		self.xhr.abort();
	}
	
	self.infowindow.close();
	
	for (var i = 0; i < self.markers.length; i++) {
		self.markers[i].setMap(null);
	}
	
	self.markers = [];
	
	self.$html.find('#loadBG').fadeOut();
	
	if (fullReset) {
		
		var $heading = self.$html.find('h2');
		$heading.html('Map Result');
		
		self.map.setCenter(self);
		self.map.setZoom(self.defaultZoom);
	}
}

// MARK:   Find

bodysafe.googleMap.xhr = null;

bodysafe.googleMap.markers = [];

bodysafe.googleMap.find = function(name, address, type, status) {
	
	var self = this;
	
	self.reset(false);
	
	if ($.trim(type) == '' || $.trim(status) == '') {
		return;
	}
	
	// Variables
	
	var mapData = {};
	
	var mapBounds = new google.maps.LatLngBounds();
	
	// Set Heading
	
	var $heading = self.$html.find('h2');
	
	$heading.html('<img alt="" src="' + bodysafe.loadingIcon + '" height="16" width="16"> Searching...');
	
	self.$html.find('#loadBG').fadeIn();
	
	// MARK:    finding()
	
	function finding(page, pageCount) {
		
		if (!!self.xhr) {
			self.xhr.abort();
		}
		
		var urlTemplate = 'http://app.toronto.ca/opendata/tphir/pss_est_map.json?v=1&callback=?&service_type_cd={{service_type_cd}}&facility_status_cd={{facility_status_cd}}&f1={{f1}}&f2={{f2}}&f3={{f3}}&f4={{f4}}&f5={{f5}}&f6={{f6}}&a1={{a1}}&a2={{a2}}&a3={{a3}}&a4={{a4}}&a5={{a5}}&a6={{a6}}&row_start={{page}}&row_count={{pageCount}}';
		
		var searchEstablishmentNameWords = name.split(' ');
		var searchEstablishmentAddressWords = address.split(' ');
		
		var url = Mustache.render(urlTemplate, {
			'f1'       : (!!searchEstablishmentNameWords[0]) ? searchEstablishmentNameWords[0] : null,
			'f2'       : (!!searchEstablishmentNameWords[1]) ? searchEstablishmentNameWords[1] : null,
			'f3'       : (!!searchEstablishmentNameWords[2]) ? searchEstablishmentNameWords[2] : null,
			'f4'       : (!!searchEstablishmentNameWords[3]) ? searchEstablishmentNameWords[3] : null,
			'f5'       : (!!searchEstablishmentNameWords[4]) ? searchEstablishmentNameWords[4] : null,
			'f6'       : (!!searchEstablishmentNameWords[5]) ? searchEstablishmentNameWords[5] : null,
			'a1'       : (!!searchEstablishmentAddressWords[0]) ? searchEstablishmentAddressWords[0] : null,
			'a2'       : (!!searchEstablishmentAddressWords[1]) ? searchEstablishmentAddressWords[1] : null,
			'a3'       : (!!searchEstablishmentAddressWords[2]) ? searchEstablishmentAddressWords[2] : null,
			'a4'       : (!!searchEstablishmentAddressWords[3]) ? searchEstablishmentAddressWords[3] : null,
			'a5'       : (!!searchEstablishmentAddressWords[4]) ? searchEstablishmentAddressWords[4] : null,
			'a6'       : (!!searchEstablishmentAddressWords[5]) ? searchEstablishmentAddressWords[5] : null,
			'page'     : page,
			'pageCount': pageCount,
			'service_type_cd'   : type,
			'facility_status_cd': status
		});
		
		self.xhr = $.ajax(url,
			{
				cache: true,
				complete: function(jqXHR, textStatus) {},
				dataType: 'jsonp',
				error: function (jqXHR, textStatus, err) {},
				fail: function (jqXHR, textStatus, err) {},
				success: function (data, textStatus, jqXHR) {
					
					if (data.length > 0) {
						found(data);
						finding(page + pageCount, pageCount);
					} else {
						done();
					}
				},
				timeout: 30000
			}
		);
	}
	
	// MARK:    found()
	
	function found(data) {
		
		$heading.html('<img alt="" src="' + bodysafe.loadingIcon + '" height="16" width="16"> Loading...');
		
		for (var i = 0; i < data.length; i++) {
			
			var addressId     = data[i]['addressId'];
			var addressMain   = data[i]['addressMain'];
			var addressPostal = data[i]['addressPostal'];
			var addressUnit   = data[i]['addressUnit'];
			var estId         = data[i]['estId'];
			var estName       = data[i]['estName'];
			var estStatusCd   = data[i]['estStatusCd'];
			var estStatusColor= data[i]['estStatusColor'];
			var estStatusText = data[i]['estStatusText'];
			var facCount      = data[i]['facCount'];
			var lat           = data[i]['lat'];
			var lon           = data[i]['lon'];
			var rowNum        = data[i]['rowNum'];
			
			var key = lat + '_' + lon;
			
			if (!mapData[key]) {
				
				var address = (facCount > 1 || !addressUnit) ? (addressMain + ', ' + addressPostal) : (addressMain + ', ' + addressUnit + ', ' + addressPostal)
				
				mapData[key] = {
					address: address,
					establishments: []
				};
				
				var icon = (facCount > 1) ? bodysafe.markerIcons['blue'] : bodysafe.markerIcons[estStatusColor];
				
				var markerOptions = {
					icon    : icon,
					map     : self.map,
					position: { lat: + lat, lng: + lon },
					title   : address
				}
			
				var marker = new google.maps.Marker(markerOptions);
				
				(function(marker, data) {
					google.maps.event.addListener(marker, 'click', function() {
						
						var template = '\
							<div class="markerInfo">\
								<p><strong>{{address}}</strong></p>\
								<ul>\
									{{#establishments}}\
									<li>\
										<img alt="{{statusText}}" src="{{icon}}" height="{{iconHeight}}" width="44">\
										<a href="#">{{name}}</a>\
									</li>\
									{{/establishments}}\
								</ul>\
							</div>';
						
						
						var html = Mustache.render(template, data)
						
						var $html = $(html);
						
						$html.find('a').each(function(index, element) {
							
							$(element).click(function(e) {
								e.preventDefault();
								// bodysafe.details.find(data.establishments[index].estId);
								
								for (var i = 0; i < self.showEstablishment.length; i++) {
									self.showEstablishment[i](data.establishments[index].estId);
								}
							});
							
						});
						
						self.infowindow.setContent($html[0]);
						self.infowindow.open(self.map, marker);
					});
				
					mapBounds.extend(marker.getPosition());
				
					self.markers.push(marker);
				})(marker, mapData[key]);
				
			}
			
			// Add Establishments
			
			mapData[key]['establishments'].push({
				estId     : estId,
				icon      : bodysafe.mapEstablishmentStatusIcon[estStatusColor],
				iconHeight: (estStatusColor == 'black') ? 24 : 13,
				name      : estName,
				statusText: estStatusText
			});
		}
	}
	
	// MARK:    done()
	
	function done() {
		
		if (self.markers.length == 1) {
			$heading.html(self.markers.length + ' Addresse Found');
		} else {
			$heading.html(self.markers.length + ' Addresses Found');
		}
		
		if (self.markers.length > 0) {
			self.map.fitBounds(mapBounds);
		} else {
			self.map.setCenter(self.torontoCentre);
			self.map.setZoom(self.defaultZoom);
		}
		
		self.$html.find('#loadBG').fadeOut();
	}
	
	finding(1, 5000);
	
};

bodysafe.googleMap.hideMapCover = function() {
	if (this.$mapcover.is(':visible')) {
		this.$mapcover.fadeOut();
	}
};

bodysafe.googleMap.showMapCover = function() {
	if (!this.$mapcover.is(':visible')) {
		this.$mapcover.fadeIn();
	}
};

// MARK:  Initializer

bodysafe.googleMap.init = function($placeholder) {
	
	var self = this;
	
	// MARK:   Append CSS
	
	var styles = '<style>\
		\
		#maincontent img[src*="//maps.gstatic.com/mapfiles/api-3/images/"] {\
			max-width: none;\
		}\
		\
		#mapCanvas {\
			background-color: #eee;\
			height: 350px;\
		}\
		\
		#mapCanvas div {\
			word-wrap:normal !important;\
		}\
		\
		#maincontent .markerInfo p {\
			font-weight: bold;\
			margin-bottom: 10px;\
		}\
		\
		#maincontent .markerInfo ul {\
			list-style: none;\
			margin: 0;\
			padding: 0;\
		}\
		\
		#maincontent .markerInfo ul li {\
			clear: both;\
			padding-left: 50px;\
		}\
		\
		#maincontent .markerInfo ul li img {\
			float: left; \
			margin-left: -50px;\
		}\
		\
		#mapLegend {\
			background-color: #fff;\
			background-color: rgba(255, 255, 255, 0.90);\
			color: #000;\
			margin: 5px;\
			border: 1px solid #bbb;\
		}\
		\
		#mapLegend h3 {\
			border-bottom: 1px solid #bbb;\
			margin: 0;\
			padding: 5px;\
			text-align: center;\
			background-color: #f5f5f5;\
		}\
		\
		#mapLegend ul {\
			list-style: none;\
			padding: 5px;\
			margin: 0;\
		}\
		\
		#mapLegend ul li {\
			clear: both;\
			margin: 5px 0 5px 0;\
			padding: 1px 5px 0 26px;\
		}\
		\
		#mapLegend ul li img {\
			float: left;\
			margin-left: -21px;\
			margin-top: -1px;\
		}\
		\
		#loadBG {\
			position: absolute;\
			top: 5px;\
			left: 50%;\
			display: none;\
		}\
		\
		#loadBG div {\
			background-color: #fff;\
			background-color: rgba(255, 255, 255, 0.90);\
			color: #000;\
			border: 1px solid #bbb;\
			text-align: center;\
			padding: 25px 0;\
			position: absolute;\
			top: 0;\
			left: -100px;\
			width: 200px;\
			font-weight: bold;\
		}\
		\
		#mapcover {\
			background-color: rgba(255, 255, 255, 0.75);\
			bottom: 0;\
			left: 0;\
			position: absolute;\
			right: 0;\
			top:0;\
		}\
		\
		#mapcover > div {\
			width: 225px;\
			margin: 0 auto;\
			padding-top: 20px;\
		}\
		\
		#mapcover > div > div {\
		}\
		\
		#mapcover > div > div > div {\
			padding: 20px 10px;\
			text-align: center;\
		}\
		\
		#mapcover > div > div > header {\
			background-color: #4e4e4e;\
			text-align: center;\
			padding: 10px;\
			color: #fff;\
		}\
		</style>';
	
	$('head').append(trimHTMLString(styles));
	
	// MARK:   Append HTML
	
	var html = '<div class="panel panel-default" id="mapPane">\
			<div class="panel-heading">\
				<h2 role="heading" aria-level="2" class="panel-title">Map Result</h2>\
			</div>\
			\
			<div id="mapWrapper" style="position: relative;">\
				<div id="mapCanvas"></div>\
				<div id="loadBG">\
					<div>\
						<img alt="" src="/City Of Toronto/Toronto Public Health/TPH Web Services/BodySafe/images/bodysafe_loading.gif" height="16" width="16"> &nbsp;\
						Loading...\
					</div>\
				</div>\
				<div id="mapcover">\
					<div>\
						<div>\
							<div style="padding: 0;">\
								<button class="btn btn-primary" style="width: 100%; font-size: 18px; padding: 11px 12px;"><strong>Quick Start:</strong><br>Show All Locations</button>\
							</div>\
						</div>\
					</div>\
				</div>\
			</div>\
		</div>';
	
	/*
	<header>\
								<h2>Quick Start</h2>\
							</header>\
	*/
	
	self.$html = $(html);
	self.$mapcover = self.$html.find('#mapcover');
	
	self.$mapcover.find('button').click(function(e) {
		e.preventDefault();
		for (var i = 0; i < self.showAllLocation.length; i++) {
			self.showAllLocation[i]();
		}
		//self.hideMapCover();
	});
	
	$placeholder.append(self.$html);
	
	$(function() {
		
		self.torontoCentre = new google.maps.LatLng(43.721459, -79.373903);
	
		// Google Map Info Window
	
		self.infowindow = new google.maps.InfoWindow();
	
		// Google Map
	
		var mapOptions = {
			center: self.torontoCentre,
			mapTypeControl: true,
			mapTypeControlOptions: {
				position: google.maps.ControlPosition.TOP_RIGHT,
				style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
			},
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			panControl: false,
			rotateControl: false,
			streetViewControl: true,
			streetViewControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM
			},
			zoom: self.defaultZoom,
			zoomControl: true,
			zoomControlOptions: {
				position: google.maps.ControlPosition.RIGHT_BOTTOM,
				style: google.maps.ZoomControlStyle.SMALL
			}
		};

		var mapCanvas = self.$html.find('#mapCanvas')[0];
	
		self.map = new google.maps.Map(mapCanvas, mapOptions);
		
		self.map.addListener('click', function() {
			self.infowindow.close();
		});
	
		// Map Legend
	
		var mapLegend = [
			{
				name: 'Pass',
				icon: bodysafe.markerIcons['green']
			},
			{
				name: 'Condional<br>Pass',
				icon: bodysafe.markerIcons['yellow']
			},
			{
				name: 'Closed',
				icon: bodysafe.markerIcons['red']
			},
			{
				name: 'Multiple<br>Establish-<br>ments',
				icon: bodysafe.markerIcons['blue']
			}
		]

		var legendHtmlString = '\
			<div id="mapLegend" title="Status Legend">\
				<h3>Legend</h3>\
				<ul>\
					{{#items}}\
					<li><img src="{{icon}}"> {{&name}}</li>\
					{{/items}}\
				</ul>\
			</div>';

		$mapLegend = $(Mustache.render(trimHTMLString(legendHtmlString), { items: mapLegend }));

		self.map.controls[google.maps.ControlPosition.TOP_LEFT].push($mapLegend[0]);
	});
}


// --------------------------------------------------------------------------------
// MARK: Result
// --------------------------------------------------------------------------------

bodysafe.results = bodysafe.results || {};

// MARK:  append()

bodysafe.results.$html = null;

bodysafe.results.append = function($placeholder) {
	
	// HTML
	
	var html = '<div class="panel panel-default" id="resultPane">\
			<div class="panel-heading">\
				<h2 role="heading" aria-level="2" class="panel-title">Search Result</h2>\
			</div>\
			\
			<h3 class="sr-only">Result</h3>\
			\
			<ul id="resultTabs" class="nav nav-tabs">\
				<li role="presentation"><a href="#">0-9<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">A<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">B<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">C<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">D<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">E<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">F<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">G<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">H<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">I<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">J<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">K<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">L<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">M<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">N<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">O<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">P<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">Q<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">R<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">S<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">T<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">U<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">V<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">W<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">X<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">Y<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
				<li role="presentation"><a href="#">Z<span> <span class="sr-only">(</span><span class="found">0</span><span class="sr-only"> Establishment(s) Found)</span></span></a></li>\
			</ul>\
			\
			<h3 class="sr-only">Result</h3>\
			\
			<div class="table-responsive">\
				<table id="resultTable" class="table">\
					<colgroup>\
						<col>\
						<col width="20%">\
						<col width="20%">\
						<col width="20%">\
					</colgroup>\
					<thead>\
						<tr>\
							<th>Establishment</th>\
							<th>Services</th>\
							<th>Status</th>\
							<th>Address</th>\
						</tr>\
					</thead>\
					<tbody>\
					</tbody>\
				</table>\
			</div>\
		</div>';
		/*
		<tr>\
							<th colspan="4"></th>\
						</tr>\
						*/
	
	this.$html = $(html);
	
	$placeholder.append(this.$html);
	
	this.list.append(this.$html.find('#resultTable'));
	
	// CSS
	
	var styles = '<style>\
			#maincontent ul.nav-tabs#resultTabs {\
				border-bottom: 2px solid #346488;\
				padding: 0 0 0 10px;\
			}\
			\
			.nav#resultTabs > li > a {\
				padding: 10px 8px;\
				margin-top: 8px;\
			}\
			\
			.nav#resultTabs > li > a > span { display: none; }\
			\
			.nav-tabs#resultTabs > li.available > a, .nav-tabs#resultTabs > li.available > a:hover, .nav-tabs#resultTabs > li.available > a:focus {\
				color: #000;\
				background-color: #efefef;\
				border: 1px solid #efefef;\
			}\
			\
			.nav-tabs#resultTabs > li.active > a, .nav-tabs#resultTabs > li.active > a:hover, .nav-tabs#resultTabs > li.active > a:focus {\
				color: #fff;\
				background-color: #346488;\
				border: 1px solid #346488;\
			}\
			\
			.nav-tabs#resultTabs > li.active > a > span, .nav-tabs#resultTabs > li.active > a:hover > span, .nav-tabs#resultTabs > li.active > a:focus > span,\
			.nav-tabs#resultTabs > li.available > a > span, .nav-tabs#resultTabs > li.available > a:hover > span, .nav-tabs#resultTabs > li.available > a:focus > span {\
				display: block;\
				position: absolute;\
				top: -3px;\
				right: -2px;\
				background-color: #fef6d3;\
				color: #000;\
				font-size: 10px;\
				line-height: 10px;\
				padding: 0 1px;\
				border: 1px solid #c2c2c2;\
				border-radius: 3px;\
			}\
			\
			#maincontent #resultTable {\
				margin-top: 0;\
			}\
			\
			#maincontent table#resultTable tr {\
				border: 0;\
			}\
			\
			#maincontent #resultTable th {\
				background-color: #f5f5f5;\
				border-color: #fff;\
				border-style: solid;\
				border-width: 2px 0 2px 2px;\
			}\
			\
			#maincontent #resultTable th:first-child {\
				border-left-width: 0;\
			}\
		</style>';
	
	$('head').append(trimHTMLString(styles));
}

// MARK:  whenReady()

bodysafe.results.whenReady = function() {
	
	var $resultTabs = this.$html.find('#resultTabs');
	
	$resultTabs.click(function(e) {
		
		e.preventDefault();
		
		var $element = $(e.target);
		
		if ($element.is('a')) {
			
			$resultTabs.find('.active').removeClass('active');
			$element.parent().addClass('active');
			
			bodysafe.results.list.find($element.parent().index());
		}
	});
	
};

// MARK:  reset()

bodysafe.results.reset = function(fullReset) {
	
	fullReset = fullReset || false;
	
	if (!!this.xhr) {
		this.xhr.abort();
	}
	
	var $resultTabs = this.$html.find('#resultTabs');
	
	$resultTabs.find('.available').removeClass('available');
	$resultTabs.find('.active').removeClass('active');
	$resultTabs.find('.found').html('0');
	
	this.list.findName    = null;
	this.list.findAddress = null;
	this.list.findType    = null;
	this.list.findStatus  = null;
	
	this.list.reset(fullReset);
	
	if (fullReset) {
		
		this.$html.find('h2').html('Search Result');
		
	}
}

// MARK:  find()

bodysafe.results.xhr = null;

bodysafe.results.find = function(name, address, type, status) {
	
	var self = this;
	
	if (!!self.xhr) {
		self.xhr.abort();
	}
	
	self.reset(false);
	
	if ($.trim(type) == '' || $.trim(status) == '') {
		return;
	}
	
	var $resultTabs = this.$html.find('#resultTabs');
	
	self.$html.find('h2').html('<img alt="" src="' + bodysafe.loadingIcon + '" height="16" width="16"> Searching...');
	
	// MARK:   finding()
	
	function finding() {
		
		if (!!self.xhr) {
			self.xhr.abort();
		}
		
		var searchEstablishmentNameWords = name.split(' ');
		var searchEstablishmentAddressWords = address.split(' ');
		
		var urlTemplate = 'http://app.toronto.ca/opendata/tphir/pss_est_initial_count.json?v=1&callback=?&service_type_cd={{service_type_cd}}&facility_status_cd={{facility_status_cd}}&f1={{f1}}&f2={{f2}}&f3={{f3}}&f4={{f4}}&f5={{f5}}&f6={{f6}}&a1={{a1}}&a2={{a2}}&a3={{a3}}&a4={{a4}}&a5={{a5}}&a6={{a6}}';
		
		var url = Mustache.render(urlTemplate, {
			'a1' : searchEstablishmentAddressWords[0],
			'a2' : searchEstablishmentAddressWords[1],
			'a3' : searchEstablishmentAddressWords[2],
			'a4' : searchEstablishmentAddressWords[3],
			'a5' : searchEstablishmentAddressWords[4],
			'a6' : searchEstablishmentAddressWords[5],
			'f1' : searchEstablishmentNameWords[0],
			'f2' : searchEstablishmentNameWords[1],
			'f3' : searchEstablishmentNameWords[2],
			'f4' : searchEstablishmentNameWords[3],
			'f5' : searchEstablishmentNameWords[4],
			'f6' : searchEstablishmentNameWords[5],
			'facility_status_cd': status,
			'service_type_cd'   : type
		});
		
		self.xhr = $.ajax(
			url, 
			{
				cache: true,
				complete: function(jqXHR, textStatus) {},
				dataType: 'jsonp',
				error: function (jqXHR, textStatus, err) {},
				fail: function (jqXHR, textStatus, err) {},
				success: function (data, textStatus, jqXHR) {
					
					done(data);
					
				},
				timeout: 30000
			}
		);
		
	}
	
	// MARK:   done()
	
	function done(data) {
		
		self.list.findName = name;
		self.list.findAddress = address;
		self.list.findType = type;
		self.list.findStatus = status;
		
		if (data.length == 0) {
			self.$html.find('h2').html('0 Establishments Found');
			return;
		}
		
		var total = 0;
		var numberTotal = 0;
		
		for (var i = 0; i < data.length; i++) {
			
			var count        = data[i]['count'];
			var fnameInitial = data[i]['fnameInitial'];
			
			var charCode     = fnameInitial.charCodeAt(0);
			
			total = total + count;
			
			if (charCode >= 65 && charCode <= 90) {
				$resultTabs.children('li').eq(charCode - 64).addClass('available').find('.found').html(count);
			} else {
				numberTotal = numberTotal + count;
			}
		}
		
		if (numberTotal > 0) {
			$resultTabs.children('li').eq(0).addClass('available').find('.found').html(numberTotal);
		}
		
		if (total == 1) {
			self.$html.find('h2').html(total + ' Establishment Found');
		} else {
			self.$html.find('h2').html(total + ' Establishments Found');
		}
		
		var event = $.Event('click', {
			target: $resultTabs.children('li.available').eq(0).children('a')[0]
		});
		
		$resultTabs.trigger(event);
	}
	
	finding();
};


// --------------------------------------------------------------------------------
// MARK: Result List
// --------------------------------------------------------------------------------

bodysafe.results.list = bodysafe.results.list || {};

// MARK:  append()

bodysafe.results.list.$html = null;

bodysafe.results.list.append = function($placeholder) {
	this.$html = $placeholder;
}

// MARK:  reset()

bodysafe.results.list.reset = function(fullReset) {
	
	fullReset = fullReset || false;
	
	if (!!this.xhr) {
		this.xhr.abort();
	}
	
	this.$html.find('tbody').empty();
	
	if (fullReset) {
		/*
		var $heading = this.$html.find('h2');
		$heading.html('Map Result');
		*/
	}
}

// MARK:  find()

bodysafe.results.list.xhr = null;

bodysafe.results.list.findName    = null;
bodysafe.results.list.findAddress = null;
bodysafe.results.list.findType    = null;
bodysafe.results.list.findStatus  = null;

bodysafe.results.list.find = function(tabIndex) {
	
	var self = this;
	
	self.reset(false);
	
	/*
	if ($.trim(this.findName) == '' && $.trim(this.findAddress) == '' && $.trim(this.findType) == '' && $.trim(this.findStatus) == '') {
		bodysafe.results.reset();
		return;
	}
	*/
	
	if (this.findName == null && this.findAddress == null && this.findType == null && this.findStatus == null) {
		bodysafe.results.reset();
		return;
	}
	
	// MARK:   finding()
	
	function finding(page, pageCount) {
		
		if (!!self.xhr) {
			self.xhr.abort();
		}
		
		var urlTemplate = 'http://app.toronto.ca/opendata/tphir/pss_est_list.json?v=1&callback=?&service_type_cd={{service_type_cd}}&facility_status_cd={{facility_status_cd}}&facility_name_initial={{tab}}&f1={{f1}}&f2={{f2}}&f3={{f3}}&f4={{f4}}&f5={{f5}}&f6={{f6}}&a1={{a1}}&a2={{a2}}&a3={{a3}}&a4={{a4}}&a5={{a5}}&a6={{a6}}&row_start={{page}}&row_count={{pageCount}}';
		
		var searchEstablishmentNameWords = self.findName.split(' ');
		var searchEstablishmentAddressWords = self.findAddress.split(' ');
		
		var tab =  (tabIndex == 0) ? '0' : String.fromCharCode(65 + tabIndex - 1);
		
		var url = Mustache.render(urlTemplate, {
			'f1'       : (!!searchEstablishmentNameWords[0]) ? searchEstablishmentNameWords[0] : null,
			'f2'       : (!!searchEstablishmentNameWords[1]) ? searchEstablishmentNameWords[1] : null,
			'f3'       : (!!searchEstablishmentNameWords[2]) ? searchEstablishmentNameWords[2] : null,
			'f4'       : (!!searchEstablishmentNameWords[3]) ? searchEstablishmentNameWords[3] : null,
			'f5'       : (!!searchEstablishmentNameWords[4]) ? searchEstablishmentNameWords[4] : null,
			'f6'       : (!!searchEstablishmentNameWords[5]) ? searchEstablishmentNameWords[5] : null,
			'a1'       : (!!searchEstablishmentAddressWords[0]) ? searchEstablishmentAddressWords[0] : null,
			'a2'       : (!!searchEstablishmentAddressWords[1]) ? searchEstablishmentAddressWords[1] : null,
			'a3'       : (!!searchEstablishmentAddressWords[2]) ? searchEstablishmentAddressWords[2] : null,
			'a4'       : (!!searchEstablishmentAddressWords[3]) ? searchEstablishmentAddressWords[3] : null,
			'a5'       : (!!searchEstablishmentAddressWords[4]) ? searchEstablishmentAddressWords[4] : null,
			'a6'       : (!!searchEstablishmentAddressWords[5]) ? searchEstablishmentAddressWords[5] : null,
			'tab'      : tab,
			'page'     : page,
			'pageCount': pageCount,
			'service_type_cd'   : self.findType,
			'facility_status_cd': self.findStatus
		});
		
		self.xhr = $.ajax(url,
			{
				cache: true,
				complete: function(jqXHR, textStatus) {},
				dataType: 'jsonp',
				error: function (jqXHR, textStatus, err) {},
				fail: function (jqXHR, textStatus, err) {},
				success: function (data, textStatus, jqXHR) {
					
					if (data.length > 0) {
						found(data);
						finding(page + pageCount, pageCount);
					} else {
						done();
					}
				},
				timeout: 30000
			}
		);
	}
	
	// MARK:   found()
	
	function found(data) {
		
		nestedData = {}
	
		for (var i = 0; i < data.length; i++) {
		
			var row      = i;
			var dataItem = data[row];
		
			var estId                 = dataItem['estId'];
			var estName               = dataItem['estName'];
			var addressId             = dataItem['addressId'];
			var addressFull           = dataItem['addressFull'];
			var estStatusCd           = dataItem['estStatusCd'];
			var estStatusText         = dataItem['estStatusText'];
			var estStatusColor        = dataItem['estStatusColor'];
			var lat                   = dataItem['lat'];
			var lon                   = dataItem['lon'];
			var serviceId             = dataItem['serviceId'];
			var serviceTypeCd         = dataItem['serviceTypeCd'];
			var serviceTypeDesc       = dataItem['serviceTypeDesc'];
			var inspectionId          = dataItem['inspectionId'];
			var inspectionDate        = dataItem['inspectionDate'];
			var inspectionStatusText  = dataItem['inspectionStatusText'];
			var inspectionStatusColor = dataItem['inspectionStatusColor'];
			var groupGRN              = dataItem['groupGRN'];
			var groupGCNT             = dataItem['groupGCNT'];
			var groupRN               = dataItem['groupRN'];
		
			if (!nestedData[estId]) {
				nestedData[estId] = {
					row           : row,
					estId         : estId,
					estName       : estName,
					addressId     : addressId,
					addressFull   : addressFull,
					estStatusCd   : estStatusCd,
					estStatusText : estStatusText,
					estStatusColor: estStatusColor,
					lat           : lat,
					lon           : lon,
					services      : []
				}
			}
		
			nestedData[estId].services.push({
				serviceId            : serviceId,
				serviceTypeCd        : serviceTypeCd,
				serviceTypeDesc      : serviceTypeDesc,
				inspectionId         : inspectionId,
				inspectionDate       : inspectionDate,
				inspectionStatusText : inspectionStatusText,
				inspectionStatusColor: inspectionStatusColor
			});
		}
	
		var finalNestedData = []
		for (var k in nestedData) {
		
			var element = nestedData[k];
		
			element.services.sort(function(a, b) {
				if (a.row > b.row)
					return 1;
		
				if (b.row > a.row)
					return -1;
		
				return 0;
			});
		
			finalNestedData.push(element);
		}
	
		finalNestedData.sort(function(a, b) {
			if (a.estName > b.estName)
				return 1;
		
			if (b.estName > a.estName)
				return -1;
		
			return 0;
		});
	
	
		var template = '\
			\
			{{#row1}}\
			<tr>\
				<td rowspan="{{colspan}}" style="padding-left: 45px;">\
					{{#facilityIcon}}\
						<img alt="{{estStatusText}}" src="{{.}}" height="39" width="30" style="float: left; margin-left: -40px;">\
					{{/facilityIcon}}\
					<a href="#">{{estName}}</a>\
				</td>\
				<td style="padding-left: 20px;">{{#icon}}<img src="{{.}}" height="15" width="15" style="float: left; margin-left: -20px; margin-top: 3px;">{{/icon}} {{serviceTypeDesc}}</td>\
				<td>{{inspectionStatus}}</td>\
				<td rowspan="{{colspan}}">{{addressFull}}</td>\
			</tr>\
			{{/row1}}\
			{{#row2}}\
			<tr>\
				<td style="padding-left: 20px;">{{#icon}}<img alt="" src="{{.}}" height="15" width="15" style="float: left; margin-left: -20px; margin-top: 3px;">{{/icon}} {{serviceTypeDesc}}</td>\
				<td>{{inspectionStatus}}</td>\
			</tr>\
			{{/row2}}\
			\
		';
	
		for (var i = 0; i < finalNestedData.length; i++) {
		
			var facilityIcon;
		
			facilityIcon = bodysafe.squareStatusIcon[finalNestedData[i].estStatusColor];
		
			var icon = bodysafe.circleStatusIcon[finalNestedData[i].services[0].inspectionStatusColor];
		
			var value = {
				'row1': {
					'facilityIcon'    : facilityIcon,
					'colspan'         : finalNestedData[i]['services'].length,
					'estName'         : finalNestedData[i]['estName'],
					'estId'           : finalNestedData[i]['estId'],
					'icon'            : icon,
					'serviceTypeDesc' : finalNestedData[i]['services'][0]['serviceTypeDesc'],
					'inspectionStatus': finalNestedData[i]['services'][0]['inspectionStatusText'],
					'addressFull'     : finalNestedData[i]['addressFull'],
					'estStatusText'   : finalNestedData[i]['estStatusText']
				}
			};
		
			for (var k = 1; k < finalNestedData[i]['services'].length; k++) {
			
				if (!value['row2']) {
					value['row2'] = [];
				}
			
				var icon = bodysafe.circleStatusIcon[finalNestedData[i].services[k].inspectionStatusColor];
			
				value['row2'].push({
					'icon': icon,
					'serviceTypeDesc': finalNestedData[i]['services'][k]['serviceTypeDesc'],
					'inspectionStatus': finalNestedData[i]['services'][k]['inspectionStatusText']
				});
			}
		
			var html = Mustache.render(template, value);
		
			var $html = $(html);
			
			(function($link, data) {
			
				$link.click(function(e) {
					
					e.preventDefault();
					bodysafe.details.find(data['estId']);
				});
			
			})($html.find('a'), finalNestedData[i]);
			
			self.$html.find('tbody').append($html);
		
		}
	}
	
	// MARK:   done()
	
	function done() {}
	
	finding(1, 100);
	
}


// --------------------------------------------------------------------------------
// MARK: Details
// --------------------------------------------------------------------------------

bodysafe.details = bodysafe.results.details || {}

// MARK:  append()

bodysafe.details.$html = null;

bodysafe.details.append = function($placeholder) {
	
	// HTML
	
	/*
	var html = '\
		<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
			<div class="modal-dialog">\
				<div class="modal-content">\
					<div class="modal-header">\
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
						<div id="myModalLabel">Establishment Details</div>\
					</div>\
					<div class="modal-body">\
					</div>\
					<div class="modal-complaint">\
						<iframe id="complaintForm" style="width: 100%; height: 500px; border: 0;" src=""></iframe>\
					</div>\
					<div class="modal-footer">\
						<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>\
					</div>\
				</div>\
			</div>\
		</div>';
	*/
	
	var html = '\
		<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\
			<div class="modal-dialog">\
				<div class="modal-content">\
					<div class="modal-header">\
						<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>\
						<div id="myModalLabel">Establishment Details</div>\
					</div>\
					<div class="modal-body">\
					</div>\
					<div class="modal-footer">\
						<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>\
					</div>\
				</div>\
			</div>\
		</div>';
	
	this.$html = $(html);
	
	$placeholder.append(this.$html);
	
	// CSS
	
	var styles = '\
		<style>\
			#myModalLabel {\
				padding-left: 40px;\
				overflow: hidden;\
			}\
			\
			#myModalLabel div div{\
				float: left;\
			}\
			\
			#myModalLabel img {\
				float: left;\
				margin-left: -40px;\
			}\
			\
			#myModalLabel h2 {\
				margin-top: 0;\
				margin-bottom: 5px;\
			}\
			\
			#myModalLabel div button {\
				float: left;\
				margin-left: 20px;\
			}\
			\
			#myModalLabel h4 {\
				margin: 0;\
				font-weight: normal;\
			}\
			\
			#maincontent .modal-body > ul {\
				margin-left: 0;\
				padding-left: 0;\
				list-style: none;\
			}\
			\
			#maincontent .modal-body > ul > li > strong {\
				font-size: 1.28571429em;\
			}\
			\
			#maincontent .modal-body > ul > li > ul {\
				margin-bottom: 14px;\
				list-style: none;\
				margin-left: 0;\
				padding-left: 32px;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li {\
				margin-top: 5px;\
				margin-bottom: 5px;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > div {\
				list-style: none;\
				padding-left: 40px;\
				margin-left: 0;\
				font-size: 0.92857143em;\
				margin-top: 3px;\
				margin-bottom: 3px;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li:first-child > div {\
				display: none;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > div > a:before {\
				content: "—";\
				float: left;\
				margin-left: -20px;\
				text-decoration: none;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > ul {\
				list-style: none;\
				padding-left: 40px;\
				margin-left: 0;\
				font-size: 0.92857143em;\
				display: none;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li:first-child > ul {\
				display: block;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > ul > li {\
				margin-top: 3px;\
				margin-bottom: 3px;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > ul > li strong:before {\
				content: "—";\
				float: left;\
				margin-left: -20px;\
			}\
			\
			#maincontent .modal-body > ul > li > ul > li > ul > li > ul {\
				list-style: none;\
				padding-left: 15px;\
			}\
			\
			.modal-footer {\
				margin-top: 0;\
			}\
		</style>';
	
	$('head').append(trimHTMLString(styles));
}

// MARK:  whenReady()

bodysafe.details.whenReady = function() {
};

// MARK:  find()

bodysafe.details.xhr = null;

bodysafe.details.find = function(id) {
	
	var self = this;
	
	if (!!self.xhr) {
		self.xhr.abort();
	}
	
	// MARK:   finding()
	
	function finding() {
		
		var urlTemplate = 'http://app.toronto.ca/opendata/tphir/pss_insp_details.json?v=1&callback=?&est_id={{estId}}';
	
		var url = Mustache.render(urlTemplate, {
			estId: id
		});
		
		self.xhr = $.ajax(url, {
			cache: true,
			complete: function(jqXHR, textStatus ){},
			dataType: 'json',
			error: function(jqXHR, textStatus, errorThrown) {},
			success: function (data, textStatus, jqXHR ) {
				
				done(data);
				
			}
		});
	}
	
	// MARK:   done()
	
	function done(data) {
		
		if ( data.length == 0) {
			alert ("No data for this establishment. Check again later.");
			return;
		}
		
		var detailData = null;
		
		for (var i = 0; i < data.length; i++) {
			var element = data[i];
			var row                   = i;
			var actionDesc            = data[i]['actionDesc'];
			var addressFull           = data[i]['addressFull'];
			var addressId             = data[i]['addressId'];
			var amountFined           = data[i]['amountFined'];
			var convictionDate        = data[i]['convictionDate'];
			var estId                 = data[i]['estId'];
			var estName               = data[i]['estName'];
			var estStatusColor        = data[i]['estStatusColor'];
			var estStatusText         = data[i]['estStatusText'];
			var infractionCat         = data[i]['infractionCat'];
			var infractionId          = data[i]['infractionId'];
			var infractionTypeCd      = data[i]['infractionTypeCd'];
			var infractionTypeDesc    = data[i]['infractionTypeDesc'];
			var inspectionDate        = data[i]['inspectionDate'];
			var inspectionId          = data[i]['inspectionId'];
			var inspectionStatus      = data[i]['inspectionStatus'];
			var inspectionStatusCd    = data[i]['inspectionStatusCd'];
			var inspectionStatusColor = data[i]['inspectionStatusColor'];
			var inspectionStatusText  = data[i]['inspectionStatusText'];
			var lat                   = data[i]['lat'];
			var lon                   = data[i]['lon'];
			var outcome               = data[i]['outcome'];
			var prosecutionId         = data[i]['prosecutionId'];
			var serviceId             = data[i]['serviceId'];
			var serviceTypeCd         = data[i]['serviceTypeCd'];
			var serviceTypeDesc       = data[i]['serviceTypeDesc'];
			
			if (!detailData) {
				detailData = {
					estId         : estId,
					estName       : estName,
					addressId     : addressId,
					addressFull   : addressFull,
					estStatusText : estStatusText,
					estStatusText : estStatusText,
					estStatusColor: estStatusColor,
					lat           : lat,
					lon           : lon,
					services      : [],
					services_temp : {}
				}
			}
		
			if (!detailData.services_temp[serviceId]) {
				detailData.services_temp[serviceId] = {
					row             : row,
					serviceId       : serviceId,
					serviceTypeCd   : serviceTypeCd,
					serviceTypeDesc : serviceTypeDesc,
					inspections     : [],
					inspections_temp: {}
				}
			}
		
			if (!!inspectionId) {
				if (!detailData.services_temp[serviceId].inspections_temp[inspectionId]) {
					detailData.services_temp[serviceId].inspections_temp[inspectionId] = {
						row                  : row,
						inspectionId         : inspectionId,
						inspectionDate       : inspectionDate,
						inspectionStatus     : inspectionStatus,
						inspectionStatusCd   : inspectionStatusCd,
						inspectionStatusText : inspectionStatusText,
						inspectionStatusColor: inspectionStatusColor,
						inspectionStatusIcon : bodysafe.circleStatusIcon[inspectionStatusColor],
						infractions          : [],
						infractions_temp     : {}
					}
				}
			
				if (!!infractionId) {
					if (!detailData.services_temp[serviceId].inspections_temp[inspectionId].infractions_temp[infractionId]) {
						detailData.services_temp[serviceId].inspections_temp[inspectionId].infractions_temp[infractionId] = {
							row               : row,
							infractionId      : infractionId,
							infractionTypeCd  : infractionTypeCd,
							infractionTypeDesc: infractionTypeDesc,
							infractionCat     : infractionCat,
							actionDesc        : actionDesc,
							prosecutions      : []
						}
					}
				
					if (!!prosecutionId) {
						detailData.services_temp[serviceId].inspections_temp[inspectionId].infractions_temp[infractionId].prosecutions.push({
							prosecutionId : prosecutionId,
							amountFined   : amountFined,
							convictionDate: convictionDate,
							outcome       : outcome
						});
					}
				}
			}
		}
		
		for (var k in detailData.services_temp) {
			var service = detailData.services_temp[k];
		
		
			for (var l in service.inspections_temp) {
				var inspection = service.inspections_temp[l]
			
				for (var m in inspection.infractions_temp) {
					var infraction = inspection.infractions_temp[m];
					inspection.infractions.push(infraction);
				}
			
				inspection.hasInfraction = (inspection.infractions.length == 1);
				inspection.hasInfractions = (inspection.infractions.length > 1);
			
				delete inspection.infractions_temp;
			
				inspection.infractions.sort(function(a, b) {
					if (a.row > b.row)
						return 1;
		
					if (b.row > a.row)
						return -1;
		
					return 0;
				})
			
				service.inspections.push(inspection);
			}
		
			delete service.inspections_temp;
		
			service.inspections.sort(function(a, b) {
				if (a.row > b.row)
					return 1;
	
				if (b.row > a.row)
					return -1;
	
				return 0;
			})
		
			detailData.services.push(service);
		}
	
		delete detailData.services_temp;
		
		detailData.services.sort(function(a, b) {
			if (a.row > b.row)
				return 1;

			if (b.row > a.row)
				return -1;

			return 0;
		});
		
		// ---
		
		var templateHeader = '\
			<div>\
				<div>\
					<img src="{{estStatusIcon}}" width="30" height="39" border="0" alt="{{facilityStatus}}">\
					<h2>{{estName}}</h2>\
					<h4\>{{addressFull}}</h4>\
				</div>\
			</div>';
	
		detailData.estStatusIcon = bodysafe.squareStatusIcon[detailData.estStatusColor];
	
		var templateBody = '\
			<ul>\
				{{#services}}\
					<li>\
						<strong>{{serviceTypeDesc}}</strong>\
						<ul class="modal_inspection_icons modal_inspections">\
							{{#inspections}}\
								<li>\
									<img alt="{{inspectionStatusText}}" src="{{inspectionStatusIcon}}" height="20" width="20">\
									Inspection {{inspectionDate}} | Status: {{inspectionStatusText}}\
									{{#hasInfraction}}<div><a href="#">Show infraction</a></div>{{/hasInfraction}}\
									{{#hasInfractions}}<div><a href="#">Show infractions</a></div>{{/hasInfractions}}\
									<ul>\
										{{#infractions}}\
											<li>\
												<strong>Infraction</strong><br>\
												<!-- Type: {{infractionTypeDesc}}<br> -->\
												Description: {{infractionTypeDesc}}<br>\
												Action: {{actionDesc}}\
													<ul>\
														{{#prosecutions}}\
															<li>\
																<strong>Prosecution</strong><br>\
																Outcome Date: {{convictionDate}}<br>\
																Outcome: {{outcome}}<br />\
																Amount Fined: ${{amountFined}}\
															</li>\
														{{/prosecutions}}\
													</ul>\
											</li>\
										{{/infractions}}\
									</ul>\
								</li>\
							{{/inspections}}\
						</ul>\
					</li>\
				{{/services}}\
			</ul>';
	
		// var templateComplaint = '<iframe id="complaintForm" style="width: 100%; height: 500px; border: 0; overflow-x: hidden;" src="http://172.21.78.91:9080/BodySafe/pssComplaints.do?compEstName={{estName}}&compEstAddress={{addressFull}}"></iframe>';
	
		tempComplaintURL = 'http://172.21.78.91:9080/BodySafe/pssComplaints.do?compEstName={{estName}}&compEstAddress={{addressFull}}';
		complaintURL = Mustache.render(tempComplaintURL, detailData);
	
		var $header = $(Mustache.render(templateHeader, detailData));
		
		/*
		$header.find('button').first().click(function(e) {
		
			e.preventDefault();
		
			if (!$(element).is(":visible")) {
			
				var $iframe = self.$html.find('.modal-complaint').find('iframe');
				$iframe.attr('src', complaintURL);
			}
		
			self.$html.find('.modal-body').first().slideToggle();
			self.$html.find('.modal-complaint').first().slideToggle();
		
			$(this).hide();
		});
		*/
		
		var $body = $(Mustache.render(templateBody, detailData));
	
		$body.find('div a').click(function(e) {
		
			e.preventDefault();
			$(this).slideUp();
			$(this).parent().parent().find('ul').slideDown();
		})
	
		// var $complaint = $(Mustache.render(templateComplaint, detailData));
	
		self.$html.find('#myModalLabel').first().empty().append($header);
		self.$html.find('.modal-body').first().empty().append($body).show();
	
		//$dialog.find('.modal-complaint').first().empty().append($complaint).hide();
		self.$html.find('.modal-complaint').first().hide();
	
		self.$html.modal();
	}
	
	finding();
};


// --------------------------------------------------------------------------------
// MARK: EXECUTION
// --------------------------------------------------------------------------------

var $placeholder = $('#bodysafe');

// MARK:  Dependencies

// Bootstrap Multiselect JavaScript
getScript('/static_files/assets/multiselect/bootstrap-multiselect.js');

// Bootstrap Multiselect CSS
$('head').append('<link href="/static_files/assets/multiselect/bootstrap-multiselect.css" rel="stylesheet" type="text/css" media="all">');

// Google Map JavaScript
getScript('https://maps.googleapis.com/maps/api/js');
	
// Mustache JavaScript
getScript('//cdnjs.cloudflare.com/ajax/libs/mustache.js/0.8.1/mustache.min.js');

// MARK:  Form Initializer

bodysafe.form.init($placeholder);

bodysafe.form.afterReset.push(function() {
	bodysafe.googleMap.reset(true);
	bodysafe.results.reset(true);
	
	bodysafe.googleMap.showMapCover();
});


bodysafe.form.afterSubmit.push(function(name, address, type, status) {
	
	if (type == '' || status == '') {
		return
	}
	
	bodysafe.googleMap.find(name, address, type, status);
	bodysafe.results.find(name, address, type, status);
	
	bodysafe.googleMap.hideMapCover();
});


// MARK:  GoogleMap Initializer

bodysafe.googleMap.init($placeholder);

bodysafe.googleMap.showEstablishment.push(function(estId) {
	bodysafe.details.find(estId);
});

bodysafe.googleMap.showAllLocation.push(function() {
	bodysafe.googleMap.hideMapCover();
	bodysafe.form.reset();
	bodysafe.form.submit();
});


bodysafe.results.append($placeholder);
bodysafe.details.append($placeholder);

// MARK:  Document Ready

$(function() {
	
	// bodysafe.googleMap.whenReady();
	bodysafe.results.whenReady();
	bodysafe.details.whenReady();
	
});