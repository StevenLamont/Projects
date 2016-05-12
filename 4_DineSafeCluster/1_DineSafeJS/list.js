
tph.dinesafe.config = tph.dinesafe.config || {}; // DineSafe Config Namespace

tph.dinesafe.config.dataTableInitialConfig = {
	
	aoColumnDefs: [ {
		bSortable: false,
		aTargets: [ 2 ]
	}, {
		asSorting: [ "desc", "asc" ],
		aTargets: [ 0 ]
	} ],
	
	bDestroy: true,
	
	bProcessing: true,
	
	bFilter: false,
	
	sDom: '<"datatable_top"r<"datatable_right"il>>t<"datatable_bottom"p>',
	
	sPaginationType: 'full_numbers',
	
	oLanguage: {
		sEmptyTable: 'No Establishment found, check search options and try again',
		sLengthMenu: 'Show _MENU_ per page ',
		oPaginate: {
			sFirst: '&lt;&lt;',
			sPrevious: '&lt;',
			sNext: '&gt;',
			sLast: '&gt;&gt;'
		}
	}
};

tph.dinesafe.config.dataTableServerConfigExt = {
		
	bServerSide: true,
	sAjaxSource: tph.dinesafe.config.dataTableEstablishmentsURL + '?callback=?'
};

tph.dinesafe.config.statusIcons = [ 'images/map/pass.png', 'images/map/conditional.png', 'images/map/close.png' ];
tph.dinesafe.config.listToggleOptions = [ 'Show Establishment List', 'Hide Establishment List' ];

var listView = {};

( function( oView ) {
	
	/*
	var config = {
		
		statusIcons: [ 'images/map/pass.png', 'images/map/conditional.png', 'images/map/close.png' ],
		toggleOptions: [ 'Show list', 'Hide list' ]
	}
	*/
	
	oView.$heading = $('#establishmentlist h3');
	oView.$table = $('#searchresulttable').dataTable( tph.dinesafe.config.dataTableInitialConfig );
	
	oView.$toggle = $('<a />').attr( 'href', '#' ).addClass('toggle').text( tph.dinesafe.config.listToggleOptions[0] );
	oView.$toggleTarget = $( '#searchresult' );
	
	oView.$bottomLoader = $('<img>').addClass( 'bottomLoader' ).attr( 'src', 'images/ajaxloader_ongrey.gif' ),

	oView.initialize = function() {
		
		this.addToggle();
	};
	
	// Toggle
	
	oView.addToggle = function() {
		
		this.$toggle.on( 'click', function( e ){
			e.preventDefault();
			oView.handleToggle();
		} );	
		$('#establishmentlist').append( this.$toggle );
	};
	
	oView.handleToggle = function() {
	
		if( this.$toggleTarget.is(':visible') )
			this.toggleClose();
		else
			this.toggleOpen();
	};
	
	oView.toggleClose = function() {
		this.$toggle.text( tph.dinesafe.config.listToggleOptions[ 0 ] );
		this.$toggleTarget.slideUp( 500 );
	};
	
	oView.toggleOpen = function() {
		this.$toggle.text( tph.dinesafe.config.listToggleOptions[ 1 ] );
		this.$toggleTarget.slideDown( 500 );
	};
	
	// Data Table
	
	oView.setDataTable = function() {
	
		var finalDataTableOptions = $.extend( tph.dinesafe.config.dataTableInitialConfig, tph.dinesafe.config.dataTableServerConfigExt, {
		
			sAjaxSource: tph.dinesafe.config.dataTableEstablishmentsURL + '?callback=?' + '&status=1,2,3',
		
			fnDrawCallback: function( oSettings ){ oView.handleDataTableDraw( oSettings ); },
			
			fnInfoCallback: function( oSettings, iStart, iEnd, iMax, iTotal, sPre ) {
				
				oView.$bottomLoader.hide();
				
				if( iTotal == 0 ) {
					
					alert( 'No Establishments were found'); //, try a different search.' );
				};
				
				if( iTotal == iMax )
					return iStart +' to ' + iEnd + ' of ' + iTotal + ' | ';
					
				else
					return iStart +' to ' + iEnd + ' of ' + iTotal + ' (filtered from ' + iMax + ') | ';
			},
			
			fnRowCallback: function( nRow, aData, iDisplayIndex ) {
				
				$('td:eq(0)', nRow ).addClass('statuscolumn').html( $('<img/>').attr('src', tph.dinesafe.config.statusIcons[ parseInt( aData[0], 10 ) - 1 ] ) );
				
				$('td:eq(1)', nRow ).wrapInner( $('<a />').css( { 'cursor':'pointer', 'text-decoration': 'underline' } ).data( 'position', new google.maps.LatLng( parseFloat( aData[5], 10 ), parseFloat( aData[6], 10 ) ) ).on( 'click', function( e ) {
					
					oView.handleDataTableClick( $(this).data( 'position' ), { 'id': aData[4], 'name': aData[1], 'address': aData[2], 'status': parseInt( aData[0] ), 'update': aData[7] } );
				} ) );			
			},
			
			fnServerData: function( sUrl, aoData, fnCallback, oSettings ) {
				
				if ( oView.$bottomLoader.parent().length == 0 ) {
					$( '.datatable_bottom' ).append( oView.$bottomLoader );
				};
				
				oView.$bottomLoader.show();
				
				/*
				if( !!oSettings.jqXHR )
					oSettings.jqXHR.abort();
				*/
				
				oSettings.jqXHR = $.ajax( {
					'url': sUrl,
					'data': aoData,
					'success': function( data, textStatus, jqXHR ) {
						oView.dataTableReady( data, textStatus, jqXHR );
						fnCallback( data, textStatus, jqXHR )
					},
					'dataType': 'jsonp',
					'cache': false
				} );
			}
		} );
		
		this.$table.dataTable( finalDataTableOptions );
		this.$table.fnSort( [ [ 1, 'asc' ] ] );
	};
	
	oView.handleDataTableClick = function( position, data ) {};
	
	oView.handleDataTableDraw = function( oSettings ) {
		if( oSettings.sAjaxSource != tph.dinesafe.config.dataTableEstablishmentsURL + '?callback=?' ) {
			oView.toggleOpen();
		};
	};
	
	oView.searchDataTable = function( param ) {
	
		param = param || '&' + tph.dinesafe.formView.generateParam();
		
		this.showLoader();
		
		var oSettings = this.$table.fnSettings();
		oSettings.sAjaxSource = tph.dinesafe.config.dataTableEstablishmentsURL + '?callback=?' + param;
		
		this.$table.fnDraw();
		this.$table.fnSort( [ [ 1, 'asc' ] ] );
	};
	
	oView.dataTableReady = function( data, textStatus, jqXHR ) {};
	
	// Loader
	
	oView.showLoader = function() { this.$heading.empty().append( $('<img>').attr( 'src', 'images/ajaxloader_ongrey.gif' ),' Loading Establishment List...'); };
	
	oView.hideLoader = function() {
		oSettings = this.$table.fnSettings();
		this.$heading.empty().text( ( ( oSettings._iRecordsTotal > 0 ) ? oSettings._iRecordsDisplay : 'No' ) +' Establishment' + ( ( oSettings._iRecordsTotal > 1 ) ? 's ' : ' ' ) + 'Found');
	};

} )( listView );