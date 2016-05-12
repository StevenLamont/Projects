
// _detail.js
// @requires /health/scripts/jquery/jquery-1.7.2.min.js
//           lib/jquery-ui/js/jquery-ui-1.8.18.custom.min.js
//           dinesafe.js


// ----- DineSafe Namespace -----

window.tph = window.tph || {};
window.tph.dinesafe = window.tph.dinesafe || {};


// ----- Model -----

tph.dinesafe.detailModel = {
	
	// @properties
	
	xhr: null,
	
	// @properties - data fields
	
	address: '',
	id: '',
	inspections: [],
	minimumInspections: 0,
	name: '',
	type: '',
	
	// @methods
	
	fetch: function( id ) {
	// Get data using an establishment ID.
	// @arguments   id   String or Number. An establishment's ID.
	
		var sURL = tph.dinesafe.config.getEstablishmentDetailURL + '?callback=?&ESTABLISHMENT_ID=' + id;
			// Add parameters to the server URL.
		
		var fCallback = function( oData ) {
		// Callback function for $.getJSON(). Calls retrieve() method when data has been obtained.
		
			tph.dinesafe.detailModel.retrieve( oData );
		};
		
		if( !!this.xhr )
			this.xhr.abort();
				// Abort any previous $.getJSON() call. Prevents overlapping calls.
		
		this.xhr = $.getJSON( sURL, fCallback );
			// Get data via $.getJSON.
	},
	
	retrieve: function( oData ) {
	// Called after the data has been successfully "fetched"
	// @arguements   oData   Object. Represents an establishment.
		
		var sMunicipalType = 'MUNICIPAL';
		
		this.address = oData.address;
		this.id = oData.id;
		this.minimumInspections = oData.minimumInspections;
		this.name = oData.name;
		this.type = oData.type;
		
		this.inspections = [];
		
		for( var n = 0; n < oData.inspections.length; n++ ) {
			
			var aDateElements = oData.inspections[n].date.split( '-' );
			
			var oInspection = {
				date: new Date( ( +aDateElements[0] ), ( +aDateElements[1] ) - 1, ( +aDateElements[2] ) ),
				foodInfractions: [],
				municipalInfractions: [],
				status: oData.inspections[n].status
			};
			
			for( var k in oData.inspections[n].infractions ) {
				
				var aInfractions = oData.inspections[n].infractions[k]
				
				if( k == sMunicipalType ) {
				
					oInspection.municipalInfractions = aInfractions;
				} else {
				
					oInspection.foodInfractions.push( {
						category: k,
						details: aInfractions.sort( function( a, b ) {
						
							if ( ( +a.severity ) < ( +b.severity ) )
								return -1;

							if ( ( +a.severity ) > ( +b.severity ) )
								return 1;

							return 0;
						} )
					} );
				};
			};
			
			this.inspections.push( oInspection );
		};
	},
	
	initialize: function() { return this; }
};

// ----- View -----

tph.dinesafe.detailView = {
	
	// @properties - Templates
	
	$FoodInfractionTemplate: null,
	$InspectionTemplate: null,
	$MunicipalInfractionTemplate: null,
	$NoInspection: null,
	
	$Address: null,
	$Complaint: null,
	$Dialog: null,
	$Error: null,
	$Heading: null,
	$Info: null,
	$Inspections: null,
	$MinInspection: null,
	$Type: null,
	
	$permalink: '#permalink',
	
	// @methods
	
	showDialog: function( sId, sName, sAddress, sType, nMinimumInspections, aInspections  ) {
		
		// ----- Constant -----
		
		var aMonths = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ];
		
		// ----- Configuration -----
		
		var aStatus = [ 'Pass', 'Conditional Pass', 'Closed' ];
		var aStatusDescription = [
			'No infractions were observed under the Food Premises Regulation during an inspection.',
			'One or more significant infractions were observed under the Food Premises Regulation during an inspection.',
			'One or more crucial infractions were observed under the Food Premises Regulation that present an immediate health hazard that cannot be corrected during an inspection.'
		];
		
		var aStatusIcons = [ 'images/map/pass.png', 'images/map/conditional.png', 'images/map/close.png' ];
		
		var aSeverity = [ 'Crucial', 'Significant', 'Minor' ];
		var aSeverityDescription = [
			'Immediate health hazard|These infractions must be corrected immediately. An order to close the premises may be issued and/or immediate action must be taken to remove or eliminate the health hazard. A Closed Notice will be issued and must be posted, and other enforcement action will be taken. Crucial infractions are conditions that endanger food directly, such as contamination, time-temperature abuse or lack of safe-to-drink water or any other condition that constitutes a health hazard.',
			'Potential health hazard|These infractions must be corrected immediately and a re-inspection to check for compliance will be conducted within 24 to 48 hours. Legal action may be taken should these infractions remain outstanding. Under exceptional circumstances a re-inspection to check for compliance may be extended beyond 48 hours. Significant infractions concern food handling, preparation, storage and/or service.',
			'Minimal health risk|These Infractions must be corrected immediately. A follow-up compliance check will be conducted at the next scheduled inspection.'
		];
		
		// ----- end -----
		
		this.$Info.hide();
		this.$NoInspection.hide();
		this.$Inspections.empty();
		this.$Error.hide();
		
		
		if( sId == null || sName == null || sAddress == null || sType == null || nMinimumInspections == null ) {
		
			this.$Info.hide();
			this.$Error.show();
			
		} else {
			this.$Info.show();
			
			var sComplaintURL = tph.dinesafe.config.complaintURL + '?id=' + sId + '&name=' + escape( sName ) + '&address=' + escape( sAddress );
			
			this.$Heading.text( sName );
			
			this.$Address.empty().append( sAddress, $('<br/>'), 'Toronto, Ontario' );
			
			this.$Type.text( sType );
			
			this.$MinInspection.text( nMinimumInspections );
			
			this.$Complaint.attr( 'href', sComplaintURL );
			
			this.$permalink.hide();
			
			if( aInspections.length == 0 ) {
			
				this.$NoInspection.show();
			}
				
			this.$permalink.show();
			this.$permalink.find('input').val('http://www.toronto.ca/health/dinesafe/index.htm?show=detail&id=' + sId);
			this.$permalink.find('a').attr('href', 'mailto:?body=I would like to share a link from DineSafe for%0A%0A' + sName + ',%0A' + sAddress + '%0A%0Ahttp://www.toronto.ca/health/dinesafe/index.htm?show=detail%26id=' + sId);
			
			for( var n = 0; n < aInspections.length; n++ ) {
			
				var oInspection = aInspections[n];
				
				var aFoodInfractions = oInspection.foodInfractions;
				
				var aMunicipalInfractions = oInspection.municipalInfractions;
				
				var $inspectionResult = this.$InspectionTemplate.clone();
				
				var $description = $inspectionResult.find('p.description');
				
				$inspectionResult.removeClass( 'dialogTemplate' );
				
				$inspectionResult.find('h3 img').attr( 'src', aStatusIcons[ ( +oInspection.status ) - 1 ] );
				
				$inspectionResult.find('span.date').text( aMonths[ ( +oInspection.date.getMonth() ) ] + ' ' + ( +oInspection.date.getDate() ) + ', ' + oInspection.date.getFullYear() );
				
				$inspectionResult.find('span.status').text( aStatus[ ( +oInspection.status ) - 1 ] );
				
				if( !( +oInspection.status == 1 && aFoodInfractions.length > 0 ) )
					$description.text( aStatusDescription[ ( +oInspection.status ) - 1 ] );
				
				if( ( +oInspection.status ) != 1 )
					$description.addClass('leading');
				
				if( aFoodInfractions.length > 0 ) {
					
					var $Infraction = this.$FoodInfractionTemplate.clone();
					
					var $theading = $Infraction.find( 'thead th:first' );
					
					var $tbody = $Infraction.find( 'tbody' );
					
					$Infraction.removeClass( 'dialogTemplate' );
					
					if( ( +oInspection.status ) == 1 ) {
						$theading.css( { 'background-color' : '#7dbd87', 'color' : '#000' } );
					} else if( ( +oInspection.status ) == 3 ) {
						
						$theading.css( { 'background-color' : '#FF6850', 'color' : '#000' } );
					} else {
						//$theading.css( { 'background-color' : '#FFB139', 'color' : '#000' } );
						$theading.css( { 'background-color' : '#ffe08d', 'color' : '#000' } );
					
					}
					
					for( var n2 = 0; n2 < aFoodInfractions.length; n2++ ) {
						
						// $tbody.append( $('<tr/>').append( $('<th/>').attr( 'colspan', 4 ).text( aFoodInfractions[n2].category + ':' ) ) );
						
						$tbody.append( $('<tr/>').append( $('<th/>').attr( 'colspan', 1 ).text( aFoodInfractions[n2].category + ':' ) ).append($('<th/>'),$('<th/>'),$('<th/>')) );
						
						for( var n3 = 0; n3 < aFoodInfractions[n2].details.length; n3++ ) {
							
							var oInfractionDetail = aFoodInfractions[n2].details[n3];
							
							var sOutcome = '';
							//var sFine = '';
							
							var $action = $('<span>' + oInfractionDetail.action + '</span>');
							
							if(oInfractionDetail.action == 'Notice to Comply')
								$action.append(', assess on ', $('<span style="white-space: nowrap">re-inspection</span>'));
							
							if( oInfractionDetail.prosecutions.length > 0 ) {
								if( !!oInfractionDetail.prosecutions[0].outcome )
									sOutcome = sOutcome + oInfractionDetail.prosecutions[0].outcome;
								
								if( !!oInfractionDetail.prosecutions[0].date )
									sOutcome = sOutcome + '<br/>' + oInfractionDetail.prosecutions[0].date;
									
								if( !!oInfractionDetail.prosecutions[0].fine )
									sOutcome = sOutcome + '<br/>$' + oInfractionDetail.prosecutions[0].fine;
							};
							
							$tbody.append( 
								$('<tr/>').append(
									$('<td>').append( oInfractionDetail.details ),
									$('<td>').append(
										$('<a/>').attr( { 'href': '#', 'title': aSeverityDescription[ ( +oInfractionDetail.severity ) - 1 ] } ).append( aSeverity[ ( +oInfractionDetail.severity ) - 1 ] ).click( function( e ){
											e.preventDefault();
										} )
									),
									$('<td>').append($action),
									$('<td>').append( sOutcome )/*,
									$('<td>').append( sFine )*/
								)
							);
						};
						
					};
					
					$inspectionResult.append( $Infraction );
				
				};
				
				if( aMunicipalInfractions.length > 0 ) {
					var $Infraction = this.$MunicipalInfractionTemplate.clone();
					
					var $theading = $Infraction.find( 'thead th:first a' ).click( function( e ) { e.preventDefault; } );
					
					var $tbody = $Infraction.find( 'tbody' );
					
					$Infraction.removeClass( 'dialogTemplate' );
					
					for( var n2 = 0; n2 < aMunicipalInfractions.length; n2++ ) {
						var oInfractionDetail = aMunicipalInfractions[n2];
						
						var sOutcome = '';
						//var sFine = '';
						
						var $action = $('<span>' + oInfractionDetail.action + '</span>');
							
							if(oInfractionDetail.action == 'Notice to Comply')
								$action.append(', assess on ', $('<span style="white-space: nowrap">re-inspection</span>'));
							
						
						if( oInfractionDetail.prosecutions.length > 0 ) {
							if( !!oInfractionDetail.prosecutions[0].outcome )
								sOutcome = sOutcome + oInfractionDetail.prosecutions[0].outcome;
							
							if( !!oInfractionDetail.prosecutions[0].date )
								sOutcome = sOutcome + '<br/>' + oInfractionDetail.prosecutions[0].date;
								
							if( !!oInfractionDetail.prosecutions[0].fine )
								sOutcome = sOutcome + '<br/>$' + oInfractionDetail.prosecutions[0].fine;
						};
						
						$tbody.append( 
							$('<tr/>').append(
								$('<td>').append( oInfractionDetail.details ),
								$('<td>').append($action),
								$('<td>').append( sOutcome )/*,
								$('<td>').append( sFine )*/
							)
						);
					};
					
					$inspectionResult.append( $Infraction );
				};
				
				this.$Inspections.append( $inspectionResult );
			};
		};
		
		this.$Dialog.dialog('open');
		
		$('#dialog_mininspection').parent().children('a.cluetip').attr('title', 'Inspection Criteria|Every establishment receives a minimum of 1, 2, or 3 inspections each year depending on the specific type of establishment, the food preparation processes, volume and type of food served and other related criteria.');
		
		$('#dialog a[title]').addClass( 'cluetip' ).click( function(e){ e.preventDefault; } ).cluetip({splitTitle: '|', arrows: true, showTitle: true });
		
		if(!!$('#dialog').scrollTop())
			$('#dialog').scrollTop(1);
	},
	
	initialize: function() {
		
		this.initialize = function() { return this };
		
		this.$FoodInfractionTemplate = $( '#food_infraction_template' );
		this.$InspectionTemplate = $( '#inspection_template' );
		this.$MunicipalInfractionTemplate = $( '#municipal_infraction_template' );
		
		this.$Address = $('#dialog_address');
		this.$Complaint = $( '#dialog_complaint' );
		
		// console.log("dialog");
		
		this.$Dialog = $( '#dialog' ).dialog({
			'autoOpen' : false,
			'draggable': true,
			'height'   : 500,
			'maxWidth' : 800,
			'minWidth' : 800,
			'modal'    : true,
			'position' : 'center',
			'resizable': true,
			'width'    : 800,
			
			"close": function(event, ui) { $('html').removeClass('dialogOpen'); },
			"open" : function(event, ui) { $('html').addClass('dialogOpen'); }
		});
		
		this.$Error = $( '#error_message' );
		this.$Heading = $('#dialog h1');
		this.$Info = $( '#dialog .infowrapper' );
		this.$Inspections = $( '#inspections' );
		this.$MinInspection = $('#dialog_mininspection');
		this.$NoInspection = $( '#noinspection' );
		this.$Type = $('#dialog_type');
		
		this.$permalink = $(this.$permalink);
		
		this.$Dialog.parent().append(this.$permalink);
		
		this.$permalink.find('input').click(function(evt) {
			
			this.select();
		});
		
		var dialog_closure = this.$permalink.find('#permalink_dialog');
		
		this.$permalink.find('#permalink_trigger').click(function(evt) {
		
			dialog_closure.toggle();
		});
		
		this.$permalink.find('img').click(function(evt) {
		
			dialog_closure.hide();
		});
		
		$.fn.cluetip.defaults.cluezIndex = 2000;
	}
}