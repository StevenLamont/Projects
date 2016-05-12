// _form.js
// @requires /health/scripts/jquery/jquery-1.7.2.min.js
//           dinesafe.js


// ----- DineSafe Namespace -----

window.tph = window.tph || {};
window.tph.dinesafe = window.tph.dinesafe || {};


tph.dinesafe.formView = {

	$form: $( 'form#searchoptions' ),
	
	$Name: $( 'input#estname' ),
	$Address: $( 'input#estaddress' ),
	$Types: $( 'input.esttype' ),
	$Status: $( 'input.eststatus' ),
	$StatusPast: $( 'input#checkInspectionHistory' ),
	$StartDate: $( 'input#estdatestart' ),
	$EndDate: $( 'input#estdateend' ),
	$Ward: $( '#estward' ),
	
	$toggle: $('<a />').attr( 'href', '#' ).addClass('toggle'),
	//$toggle: $('<a />').addClass('toggle'),
	$toggleTarget: $( '#advanceoptions' ),
		
	initialize: function() {
	
		this.setForm();
		this.addToggle();
	}
};

( function( oView ) {
	
	var config = {
		toggleOptions: [ 'More Search Options', 'Fewer Search Options' ]
	}
	
	// Toggle
	
	oView.addToggle = function() {
		
		this.$toggle.on( 'click', function( e ){
			e.preventDefault();
			oView.handleToggle();
		} );	
		
		$('#searchoptions').append( this.$toggle.text( config.toggleOptions[0] ) );
	};
	
	oView.handleToggle = function() {
	
		if( this.$toggleTarget.is(':visible') )
			this.toggleClose();
		else
			this.toggleOpen();
	};
	
	oView.toggleClose = function() {
		this.$toggle.text( config.toggleOptions[ 0 ] );
		this.$toggleTarget.slideUp( 500 );
	};
	
	oView.toggleOpen = function() {
		this.$toggle.text( config.toggleOptions[ 1 ] );
		this.$toggleTarget.slideDown( 500 );
	};
	
	// Form
	
	oView.clearForm = function() {

		this.$Name.val( '' );
		this.$Address.val( '' );
		
		this.$Types.attr( 'checked', 'checked' );
		
		this.$Status.attr( 'checked', 'checked' );
		this.$StatusPast.removeAttr( 'checked' );
		
		this.$StartDate.val('').blur();
		this.$EndDate.val('').blur();
		
		this.$Ward.val( '' );
		
		$( '#advanceoptions > ul > li > input[type="checkbox"]' ).attr( 'checked', 'checked' ).each( function( nIndex ){ this.indeterminate = false; } );
	};
	
	oView.setDropDowns = function() {
		/*
		$('#advanceoptions ul > li').mouseover( function( e ) {
		
			$(this).css('z-index',3).children('ul').show();
			
		} ).mouseout( function( e ) { 
		
			$(this).css('z-index',1).children('ul').hide();
			
		} );
		*/
		
		$('#advanceoptions ul > li').each(function(index) {
			
			this.onmouseover = function(e) {
				e = e || window.event;
				if( isMouseLeaveOrEnter( e, this ) )
					$(this).css('z-index',2).children('ul').show();
			};

			this.onmouseout = function(e) {
				e = e || window.event;
				if( isMouseLeaveOrEnter( e, this ) )
					$(this).css('z-index',1).children('ul').hide();
			};
		});
		
		
		$('#advanceoptions ul input[type="checkbox"]').click( function( e ) {
			if( !!( $(this).closest('ul').closest('li').children('input[type="checkbox"]').length ) ) {
				var $container = $(this).closest('ul');
				var total_siblings = $container.find('input[type="checkbox"]').length;
				var total_checked = $container.find('input[type="checkbox"]:checked').length;
				
				var $topcheckbox = $container.closest('li').children('input[type="checkbox"]');
				
				if( total_checked == 0 )
					$topcheckbox.removeAttr('checked').get(0).indeterminate = false;
				
				else if( ( total_siblings - total_checked ) == 0 )
					$topcheckbox.attr( {  'checked': 'checked' } ).get(0).indeterminate = false;
				
				else
					$topcheckbox.attr( {  'checked': 'checked' } ).get(0).indeterminate = true;
			} else {
			
				var $subCheckBoxes = $(this).siblings('ul').find('input[type="checkbox"]');
		
				if( $(this).is(':checked') )
					$subCheckBoxes.attr('checked','checked');

				else
					$subCheckBoxes.removeAttr('checked');
			};
		} );
	};
	
	oView.setForm = function() {
		
		function dateFocus( event ) {
			
			var $this = $(this);
			
			if( $.trim( $this.val() ) == 'MM/DD/YYYY' ) {
				$this.val( '' );
				$this.css( 'color', '#000' );
			};
		};
		
		function dateBlur( event ) {
			
			var $this = $(this);
			
			if( $.trim( $this.val() ) == '' ) {
				$this.val( 'MM/DD/YYYY' );
				$this.css( 'color', '#666666' );
			};
		};
		
		$.datepicker.setDefaults( {
			maxDate: '+0D',
			// minDate: '-2Y',
			onClose: function( dateText, inst ) {
				$( this ).css( 'color', '#000' );
				$( this ).blur();
			}
		} );
		
		this.$StartDate.datepicker().focus( dateFocus ).blur( dateBlur );
		this.$EndDate.datepicker().focus( dateFocus ).blur( dateBlur );
		
		this.clearForm();
		
		this.$StartDate.data( 'emptyValue', this.$StartDate.val() );
		this.$EndDate.data( 'emptyValue', this.$EndDate.val() );
		
		this.$form.on( 'submit', function( e ){
			e.preventDefault();

			oView.handleFormSubmit();
		} );
		
		$( 'input[type="reset"]' ).on( 'click', function( e ){ e.preventDefault(); oView.clearForm(); } );
		
		this.setDropDowns();
	};
		
	oView.handleFormSubmit = function() {
	};
	
	// other
	
	oView.generateParam = function() {
		var sReturnValue = '';
		
		sReturnValue = sReturnValue + 'name=' + escape( this.$Name.val() );
		sReturnValue = sReturnValue + '&address=' + escape( this.$Address.val() );
		
		if (this.$Types.filter(':checked').length != this.$Types.length)
			sReturnValue = sReturnValue + '&type=' + this.$Types.filter( ':checked' ).map( function(i,n){ return $(n).val(); }).get();
		
		sReturnValue = sReturnValue + '&status=' + this.$Status.filter( ':checked' ).map( function(i,n){ return $(n).val(); }).get();
		
		sReturnValue = sReturnValue + '&checkInspectionHistory=' + ( ( this.$StatusPast.is( ':checked' ) ) ? this.$StatusPast.val() : '' );
		
		sReturnValue = sReturnValue + '&from='
		
		if( this.$StartDate.val() != this.$StartDate.data( 'emptyValue' ) )
			sReturnValue = sReturnValue + escape( $.trim( this.$StartDate.val() ) );
		
		sReturnValue = sReturnValue + '&to='
		
		if( this.$EndDate.val() != this.$EndDate.data( 'emptyValue' ) )
			sReturnValue = sReturnValue + escape( $.trim( this.$EndDate.val() ) );
		
		sReturnValue = sReturnValue + '&ward=' + this.$Ward.val();
		
		return sReturnValue;
	};
	
	oView.isEmpty = function(){
		var rJustSpace = /^\s*$/;
		
		var bIsEmptyName = rJustSpace.test( this.$Name.val() );
		
		var bIsEmptyAddress = rJustSpace.test( this.$Address.val() );
		
		return ( bIsEmptyName && bIsEmptyAddress && this.isAdvanceEmpty() );
	};
	
	oView.isAdvanceEmpty = function(){
		var rJustSpace = /^\s*$/;
		
		var bIsEmptyType = ( ( this.$Types.filter( ':checked' ).length == 0 ) || ( this.$Types.filter( ':checked' ).length == this.$Types.length ) );
			
		//var bIsEmptyStatus = ( ( this.$Status.filter( ':checked' ).length == 0 ) || ( this.$Status.filter( ':checked' ).length == this.$Status.length ) );
		var bIsEmptyStatus = ( this.$Status.filter( ':checked' ).length == this.$Status.length );
		
		var bIsEmptyStatusPast = !this.$StatusPast.is(':checked');
		
		var bIsEmptyFromDate = ( rJustSpace.test( this.$StartDate.val() ) || ( this.$StartDate.val() == this.$StartDate.data( 'emptyValue' ) ) );
				
		var bIsEmptyToDate = ( rJustSpace.test( this.$EndDate.val() ) || ( this.$EndDate.val() == this.$EndDate.data( 'emptyValue' ) ) );
		
		var bIsEmptyWard = rJustSpace.test( this.$Ward.val() );
		
		return ( bIsEmptyType && bIsEmptyStatus && bIsEmptyStatusPast && bIsEmptyFromDate && bIsEmptyToDate && bIsEmptyWard );
	};
	
} )( tph.dinesafe.formView );