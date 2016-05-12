
/**
 * Represents Establishments Search Result
 *
 * @domain model
 *
 * @properties()
 *      xhr           XMLHttpRequest     Use to abort AJAX call when needed.
 *
 * @properties( FIELDS )
 *      locations     Object             Represents unique locations holding 1 or more establishments information.
 *      parameter     String             Store search parameters for other use.
 *
 * @methods( INITIALIZE )
 *      initialize()           Does nothing.
 *      initializeOnLoad()     Does nothing.
 *
 * @methods( DATA FETCHER )
 *      fetchData( String )       Aborts previous AJAX call and perform another one using jQuery.getJSON().
 *      dataRetrieve( Array )     Populates the locations property.
 */

tph.dinesafe.establishments = {
	
	/* PROPERTIES */
	
	xhr: null,
	
	/* PROPERTIES - FIELDS */
	
	locations: {},
	parameter: '',
	
	/* METHODS - INITIALIZE */
	
	initialize: function() {},
	
	initializeOnLoad: function() {},
	
	/* METHODS - DATA FETCHER */
	
	fetchData: function( sSearchParam ) {
		
		var fCallback = function( aData ) {

			tph.dinesafe.establishments.dataRetrieve( aData );
		};
		
		var sURL = tph.dinesafe.config.searchEstablishmentsURL + '?callback=?';
		
		if( !!this.xhr )
			this.xhr.abort();
		
		this.parameter = ( sSearchParam.length > 0 ) ? '&' + sSearchParam : '';
		
		this.xhr = $.getJSON(  sURL + this.parameter, fCallback );
	},
	
	dataRetrieve: function( aData ) {
		
		
		this.locations = {};
		
		for( var n = 0; n < aData.length; n++ ) {
			
			var oData = {
				id: aData[n].id,
				name: aData[n].name,
				address: aData[n].address,
				status: aData[n].status,
				lastInspected: aData[n].lastInspectionDate || null,
				lat: ( +aData[n].latitude ),
				latlng: new google.maps.LatLng( aData[n].latitude, aData[n].longitude ),
				lng: ( +aData[n].longitude )
			};
			
			if( !this.locations[ oData.latlng.toString() ] )
				this.locations[ oData.latlng.toString() ] = {
					address: oData.address,
					establishments: [],
					lat: oData.lat,
					latlng: oData.latlng,
					lng: oData.lng
				};
				
			this.locations[ oData.latlng.toString() ].establishments.push( {
				id: aData[n].id,
				name: aData[n].name,
				status: aData[n].status,
				lastInspected: aData[n].lastInspectionDate
			} );
		};
	}
};

tph.dinesafe.pageModel = {

	lastUpdatedDate: null,
	xhr: null,
	
	/* METHOD - INITIALIZE */
	
	initialize: function() {},
	
	/* METHOD - DATA */
	
	fetchDate: function() {
		
		var fCallback = function( oData ) {
		
			tph.dinesafe.pageModel.dateRetrieve( oData );
		};
		
		var sURL = tph.dinesafe.config.lastUpdatedDateURL + '?callback=?';
		
		if( !!this.xhr )
			this.xhr.abort();
		
		this.xhr = $.getJSON(  sURL, fCallback );
	},
	
	dateRetrieve: function( oData ) {
		
		if( !!oData.lastUpdateDate && oData.lastUpdateDate.length > 0 ) {
			var aDateParts = oData.lastUpdateDate.split('-');
			this.lastUpdatedDate = new Date( ( +aDateParts[0] ), ( +aDateParts[1] ) - 1, ( +aDateParts[2] ) );
		}
		
		if( !!oData.maxMarkers && oData.maxMarkers > 0 )
			tph.dinesafe.config.maximumInfoWindowEstablishment = oData.maxMarkers;
	}
};

tph.dinesafe.pageView = {
	
	/* PROPERTIES */
	
	$datePlaceholder: null,
	
	/* METHOD - INITIALIZE */
	
	initialize: function() {
	
		this.$datePlaceholder = $( '#lastUpdatedDate' );
	},
	
	/* METHOD - SET & GET */
	
	setDatePlaceholder: function( dValue ) {

		var aMonths = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
		
		if( !!dValue )
			this.$datePlaceholder.text( '(Last Updated: ' + aMonths[ ( +dValue.getMonth() ) ] + ' ' + ( +dValue.getDate() ) + ', ' + dValue.getFullYear() + ')' );
	}
};


/**
 * Controls all interactions between data and web page display
 *
 * @domain controller
 *
 * @properties( MODEL )
 *      detailData
 *      establishments
 *
 * @properties( VIEW )
 *      detail
 *      form
 *      list
 *      map
 */

tph.dinesafe.search = {

	/* PROPERTIES - MODEL */
	
	detailData: tph.dinesafe.detailModel,
	establishments: tph.dinesafe.establishments,
	pageData: tph.dinesafe.pageModel,
	
	/* PROPERTIES - VIEW */
	
	detail: tph.dinesafe.detailView,
	form: tph.dinesafe.formView,
	list: listView,
	map: mapView,
	page: tph.dinesafe.pageView,
	
	/* METHODS - HOOKS */
	
	hookDetailData: function()  {
		
		var oController = this;
	
		// Hook this.detailData.retrieve()
	
		( function() {
			
			var fOriginal = oController.detailData.retrieve;
			
			oController.detailData.retrieve = function( oData ) {
				
				// Run original
				fOriginal.apply( this, arguments );
				
				oController.detail.showDialog( this.id, this.name, this.address, this.type, this.minimumInspections, this.inspections  );
			};
			
		} )();
	},
	
	hookEstablishments: function() {
	
		var oController = this;
	
		// Hook this.establishments.dataRetrieve()
	
		( function() {
			
			var fOriginal = oController.establishments.dataRetrieve;
			
			oController.establishments.dataRetrieve = function( aData ) {
				
				// Run original function
				fOriginal.apply( this, arguments );
				
				oController.map.fusionTableLayer.setMap( null );
				oController.map.clearMarkers();
				
				for( var k in oController.establishments.locations ) {
					
					var location = oController.establishments.locations[k];
					
					var latlng = location.latlng
					var imageIndex  = ( location.establishments.length > 1 ) ? 0 : parseInt( location.establishments[0].status, 10 );
					var title = ( location.establishments.length > 1 ) ? location.establishments.length + ' Establishments' : location.establishments[0].name;
					
					oController.map.addMarker( latlng, imageIndex, title );
				};
				
				oController.list.searchDataTable( oController.establishments.parameter );
				
				oController.map.hideLoader();
			};
		} )();
	},
	
	hookForm: function() {
		var oController = this;
		
		( function() {
			var fOriginal = oController.form.handleFormSubmit;
		
			oController.form.handleFormSubmit = function() {
			
				oController.map.infoWindow.close();
				
				// Run original
				fOriginal.apply( this, arguments );
				
				if( oController.form.isEmpty() ) {
					oController.map.clearMarkers();
					oController.map.fusionTableLayer.setMap( oController.map.map );
					oController.list.showLoader();
					oController.list.searchDataTable( );
				} else {
				
					if( !oController.form.isAdvanceEmpty() )
						oController.form.toggleOpen();
				
					oController.map.showLoader();
					oController.list.showLoader();
					oController.establishments.fetchData( oController.form.generateParam() );
				};
			};
		} )();	
	
	},
	
	hookList: function() {},
	
	hookMap: function() {
	
		var oController = this;
		
		( function() {
			
			var fOriginal = oController.map.handleMarkerClick;
			
			oController.map.handleMarkerClick = function( marker ) {
				
				var controls = $( '<p>' );
				
				// Run original
				fOriginal.apply( this, arguments );
				
				var objPosition = marker.getPosition();
				
				var location = oController.establishments.locations[ objPosition.toString() ];
				
				if( !location.infoWindowParam ) {
					
					location.infoWindowParam = {
						position: objPosition,
						address: location.address,
						establishments: [],
						total: location.establishments.length
					};
					
					for( var numIndex = 0; ( numIndex < tph.dinesafe.config.maximumInfoWindowEstablishment ) && ( numIndex < location.establishments.length ); numIndex++  ) {
						
						var date = null;
						
						if( !!location.establishments[ numIndex ].lastInspected ) {
							var arrDateParts = location.establishments[ numIndex ].lastInspected.split( '-' );
							date = new Date( +arrDateParts[0], +arrDateParts[1] - 1, +arrDateParts[2] ); 
						};
						
						var objEstablishment = {
							date: date,
							id: location.establishments[ numIndex ].id,
							name: location.establishments[ numIndex ].name,
							status: +location.establishments[ numIndex ].status
						};
						
						location.infoWindowParam.establishments.push( objEstablishment );
					};
				};
				
				oController.map.infoWindow.open2( location.infoWindowParam.position, location.infoWindowParam.address, location.infoWindowParam.establishments, location.infoWindowParam.total );
			};
		} )();
		
		// Hook map.handleShowAllControlClick
		
		( function() {

			var fOriginal = oController.map.handleShowAllControlClick;
			
			oController.map.handleShowAllControlClick = function() {

				oController.form.clearForm();
	
				// Run original
				fOriginal.apply( this, arguments );
	
				oController.list.searchDataTable( '' );
				oController.map.hideLoader();
			};
		} )();

		( function() {

			var fOriginal = oController.map.mapReady;
			
			oController.map.mapReady = function() {

				// Run original
				fOriginal.apply( oController.map, arguments );
				
				oController.list.setDataTable();
				oController.map.hideLoader();
			};
		} )();

		( function() {

			var fOriginal = oController.map.handleFusionTableClick;
			
			oController.map.handleFusionTableClick = function( objData ) {
				
				if (objData.LATITUDE.value.length == 0 || objData.LONGITUDE.value.length == 0) {
					
					alert('The DineSafe data is being updated. Try reloading this page in 2 minutes.');
					
				} else {
					
					var objPosition = new google.maps.LatLng( +objData.LATITUDE.value, +objData.LONGITUDE.value );
					
					var strAddress = objData.ADDRESS.value;
					
					var arrEstablishments = [];
					
					var numTotal = ( +objData.EST_COUNT.value ) || 1;
					
					fOriginal.apply( this, arguments );
					
					if( $.trim( objData.EST_NAMES.value.length ) > 0 ) {
						
						var arrRecords = objData.EST_NAMES.value.split( '|' );
						var objIdCheck = {};
						
						for( var numRecordIndex = 0; numRecordIndex < arrRecords.length; numRecordIndex++ ) {
						
							if( arrRecords[ numRecordIndex ].length > 0 ) {
							
								var arrFields = arrRecords[ numRecordIndex ].split( '^' );
								
								var datLastInspection = null;
								
								if( $.trim( arrFields[ 3 ] ).length > 0 ) {
									
									var arrDateParts = $.trim( arrFields[ 3 ] ).split( '-' );
									
									datLastInspection = new Date( +arrDateParts[ 0 ], arrDateParts[ 1 ] - 1, arrDateParts[ 2 ] );
								};
								
								if( !objIdCheck[ arrFields[0] ] ) {
									
									objIdCheck[ arrFields[0] ] = true;
									
									arrEstablishments.push( {
										date: datLastInspection,
										id: arrFields[0],
										name: arrFields[2],
										status: +arrFields[4]
									} );
								}
							};
						};
					
					} else {
					
						var datLastInspection = null;
						
						if( !!objData.LAST_INSPECTION_DATE && ( $.trim( objData.LAST_INSPECTION_DATE.value ).length > 0 ) ) {
							
							var arrDateParts = $.trim( objData.LAST_INSPECTION_DATE.value ).split( '-' );
							
							datLastInspection = new Date( +arrDateParts[ 0 ], +arrDateParts[ 1 ] - 1, +arrDateParts[ 2 ] );
							
						};
						
						arrEstablishments.push( {
							date: datLastInspection,
							id: objData.DS_EST_ID.value,
							name: objData.EST_NAME.value,
							status: +objData.INSPECTION_STATUS_CODE.value
						} );
					};
					
					oController.map.infoWindow.open2( objPosition, strAddress, arrEstablishments, numTotal );
				}
			};
		} )();
	},
	
	hookPageData: function() {
		
		var oController = this;
		
		// Hook this.pageData.retrieveDate()
		
		( function() {
			
			var fOriginal = oController.pageData.dateRetrieve;
			
			oController.pageData.dateRetrieve = function() {
				
				// Run original function
				fOriginal.apply( this, arguments );
				
				oController.page.setDatePlaceholder( this.lastUpdatedDate )
			};
		} )();
	}
	
};

( function( oController ) {
	function showDetail( id ) {
		oController.detailData.fetch( id );
	};
	
	function list_handleDataTableDraw_hook() {
	
		var fOriginal = oController.list.handleDataTableDraw;
		oController.list.handleDataTableDraw = function( oSettings ) {
			
			// Run original
			fOriginal.apply( oController.map, arguments );
			
			oController.map.hideLoader();
			oController.list.hideLoader();
		};
	};
	
	function list_handleDataTableClick_hook() {
		
		
		var fOriginal = oController.list.handleDataTableClick;
		
		oController.list.handleDataTableClick = function( latlng, data ) {
			
			// Run original
			fOriginal.apply( oController.map, arguments );
			
			if( oController.map.panorama.getVisible() )
				oController.map.panorama.setVisible(false);
			
			oController.map.map.setZoom( 17 );
			oController.map.map.setCenter( latlng );
			
			var date = null;
			
			if( data.update && data.update.length > 0 ) {
				var dateParts = data.update.split( '-' );
				date = new Date( +dateParts[0], +dateParts[1] - 1, +dateParts[2] );
			};
			
			oController.map.infoWindow.open2( latlng, data.address, [ { date: date, id: data.id, name: data.name, status: +data.status } ], 1 );
			
			window.location = "#inspectionResult";
		};
	};
	
	oController.initialize = function() {
		
		this.hookDetailData();
		this.hookEstablishments();
		this.hookForm();
		this.hookMap();
		this.hookList();
		this.hookPageData();
		
		this.establishments.initialize();
		this.form.initialize();
		this.map.initialize();
		this.list.initialize();
		this.detail.initialize();
		this.detailData.initialize();
		this.pageData.initialize();
		this.page.initialize();
		
		this.list.showLoader();
		
		list_handleDataTableDraw_hook();
		list_handleDataTableClick_hook();
		
		this.pageData.fetchDate();
	};
	
	oController.initializeOnLoad = function() {
		
		this.map.showLoader();
		this.map.initializeOnLoad();
	};
	
} )( tph.dinesafe.search );

/* -------------------------------------------------------------------------------- */

$( function(){

	tph.dinesafe.search.initialize();
	
} );

google.maps.event.addDomListener( window, 'load', tph.dinesafe.search.initializeOnLoad() );