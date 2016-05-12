// _alert.js
// @requires /health/scripts/jquery/jquery-1.7.2.min.js
//           dinesafe.js


// ----- DineSafe Namespace -----

window.tph = window.tph || {};
window.tph.dinesafe = window.tph.dinesafe || {};


// ----- Model -----

tph.dinesafe.alertModel = {
// Handles fetching of alert data.

	// @properties
	
	xhr: null,	// Provides the ability to abort AJAX calls.
	
	// @properties - data field
	
	alerts: [],	// Contains all available alerts. Is populated by fetch method.
	
	// @methods
	
	fetchAlerts: function() {
	// Initiate fetching of Alert data through AJAX (JSONP).
	
		var fCallback = function( aAlerts ) { tph.dinesafe.alertModel.alertsFetched( aAlerts ); };
		var sURL = tph.dinesafe.config.alertsURL + '?callback=?&group=' + tph.dinesafe.config.dinesafeAlertGroup;
		
		if( !!this.xhr )
			this.xhr.abort();	// Abort existing AJAX call just in case.
		
		this.xhr = $.getJSON( sURL, fCallback );	// Get data through AJAX(JSONP)
	},
	
	alertsFetched: function( aAlerts ) {
	// Handles the alert data obtained through the fetchAlerts method.
		
		for( var n = 0; n < aAlerts.length; n++ )
			this.alerts.push( {
				date: aAlerts[n].date,
				description: aAlerts[n].body,
				title: aAlerts[n].title,
				url: aAlerts[n].detailsUrl,
				image: aAlerts[n].iconUrl
			} );
	},
	
	fetchFailed: function() {
	},
	
	// @method - Initialize
	
	initialize: function() {
	}
};


// ----- View -----

tph.dinesafe.alertView = {
	
	// @property
	
	$Wrapper: null,
	
	// @methods
	
	buildAlert: function( date, title, description, url, image ) {
		
		var $AlertImage = $('<img />').attr( { 'alt': '', 'height': '47', 'src': image, 'width': '53' } );
		
		var $AlertLink = $('<a />').attr( { 'href': url } ).append( $('<strong>').text( title ) );
		var $AlertDate = $('<strong />').text( date );
		var $AlertText = description ;
		var $AlertMore = $('<a />').attr( { 'href': url } ).text( 'More' );
		
		this.$Wrapper.append( $('<p />').append( $AlertImage, $AlertLink, $('<br />'), $AlertDate, ', ', $AlertText, '&nbsp;&nbsp;', $AlertMore ) );
	},
	
	// @method - Initialize
	
	initialize: function() {
		this.$Wrapper = $( '<div>' ).addClass( 'griditem span6' );
		$( '#alertPlaceholder' ).addClass( 'gridbase' ).append( this.$Wrapper );
		
		this.initialize = function() {};
	}
};


// ----- Controller -----

tph.dinesafe.alertController = {
	
	// @properties
	
	model: tph.dinesafe.alertModel,
	view: tph.dinesafe.alertView,
	
	// @methods - Function Hook
	
	hook: function() {
		
		var controller = this;
		
		( function() {
		
			var fOriginal = controller.model.alertsFetched;
			
			controller.model.alertsFetched = function( aData ) {
				
				fOriginal.apply( this, arguments );
				
				controller.view.$Wrapper.slideUp( 500 ).empty();	// Hide and empty alert wrapper
				
				// Add content to alert wrapper
				for( var n = 0; n < tph.dinesafe.alertController.model.alerts.length; n++ )
					controller.view.buildAlert(
						controller.model.alerts[n].date,
						controller.model.alerts[n].title,
						controller.model.alerts[n].description,
						controller.model.alerts[n].url,
						controller.model.alerts[n].image
					);
				
				controller.view.$Wrapper.slideDown( 500 );	// Show alert wrapper and its new content
			};
		} )();
	
	},
	
	// @method - Initialize
	
	initialize: function() {
		
		this.model.initialize();
		this.view.initialize();
		
		this.hook();
		
		this.model.fetchAlerts();
	}
};


// ----------

$( function() {
// Document.onready event handler
	
	tph.dinesafe.alertController.initialize();
} );
