/*
This code is to validate an address using the one address repository and returning the related address info;

 var validator = new addressLookup({parms})
   var address = validator.validate(address);
*/
var AddressLookup = function (opt_options) {
    
    if (typeof bootbox === 'undefined') {
        alert("bootbox must be loaded before using this library")
    }
    this.options = opt_options || {};
    this.wcmURLPrefix = 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=';
    this.apiADDRURLPrefix = 'http://map.toronto.ca/geoservices/rest/search/rankedsearch?searchString=';
    this.searchArea =  this.options['searchArea'] || 1;
    this.matchType =  this.options['matchType'] || 1;
    this.retRowLimit =  this.options['retRowLimit'] || 1;
    this.projectionType =  this.options['projectionType'] || 1;
    this.address = this.options['address'] || "";
	this.callback = this.options['callback'] || "";;
    //this.apiADDRURLSuffix = '&searchArea=1&matchType=1&projectionType=1&retRowLimit=10';
    this.results = [];
    this.codeSelector = this.options['codeSelector'] || '#appCode';
    this.displaySelector = this.options['displaySelector'] || '#appDisplay';
    this.resultsDisplaySelector =  this.options['resultsDisplaySelector'] || '#resultsDisplay';
    this.inputSelector = this.options['inputSelector'] || '#searchLocation';
	this.addressObject = {}
	//var that = this
	//$("#button").click($.proxy(function () {
    // //use original 'this'
 //},this));
 //addrSelect
//	$(document).on("hidden.bs.modal", ".bootbox.modal", $.proxy(function (evt) {
//		alert('XXX');
//		$( this ).off( evt );
//	}, this));
	

	//$( "table" ).delegate( "td", "click", function() {
	/*
	$("#addressLookupDiag").on("click","button",  $.proxy(function (evt) {
	//$(".addrSelect").on("click", $.proxy(function () {
		alert('click');
		$( this ).off( evt );
	}, this));
	*/
}

AddressLookup.prototype.listen_to = function(obj, prop, handler) {
    var current_setter = obj["set_" + prop];
    var old_val = obj["get_" + prop]();
    obj["set_" + prop] = function(val) { 
		current_setter.apply(obj, [old_val, val]); 
		handler(val);
		}
}
AddressLookup.prototype.lookUpParms = function () {
    return "&searchArea=" + this.searchArea + "&matchType=" + this.matchType + "&projectionType=" + this.projectionType + "&retRowLimit=" + this.retRowLimit; 
}
    
   
AddressLookup.prototype.init = function () {
    var strCode = '<link rel="stylesheet" href="/static_files/WebApps/Location Lookup/files/locationlookup.css">';
    $( this.codeSelector ).html( strCode );
} 
AddressLookup.prototype.drawForm = function () {
    $( this.displaySelector ).html( "<div class='form-group form-box'> <label for='searchLocation' class='control-label'>Search by Location or Place: </label></span><input type='text' id='searchLocation' class='form-control' placeholder='Type in Address or Place Name'></input><div class='row'><button class='btn btn-primary pull-right btn-wl' id='action-button' onclick='kk.getData()'>Location Lookup</button></div></div>  <div id='resultsDisplay' class='clear'></div>");    
    $('#searchLocation').keydown( function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { kk.getData(); }
    });  
}

AddressLookup.prototype.setAddress = function(address) {
    this.address = address;
}

AddressLookup.prototype.setCallback = function(func) {
    this.callback = func;
}
AddressLookup.prototype.getAddressObject = function() {
    return this.addressObject;
}

AddressLookup.prototype.call1 = function(self,adrObj) {
    this.addressObject = adrObj;  //$(evt.currentTarget).attr("data-bb-handler");
	this.callback.call();
}
AddressLookup.prototype.getAddressData = function( ) {
    this.results = [];
    $( this.resultsDisplaySelector ).html( "" );    
    var urlStr= this.apiADDRURLPrefix + encodeURIComponent(this.address) + this.lookUpParms();
    
    var request = $.ajax({
         type: 'GET',
         url: urlStr,
         context: this,
         dataType: 'json',
         error: function(jqXHR, textStatus, errorThrown) {
             this.processError.call(this,jqXHR, textStatus, errorThrown);
         },
         dataType: 'jsonp',
         success: function (data) {
            // this.processAddressData.call( this, data);
         }         
     });
    $.when(request).done(function(data,status,state){
           this.addresses = 
        $.merge(( data.result['bestResult'] ),
        $.merge(data.result['likelyResults'],
        data.result['restOfResults'] ));

     if (this.addresses.length==0)
         {
            bootbox.alert("No addresss information found. Please try again with Street Number and Street Name, or a Place Name. ");
             this.results.length=0;
             this.drawResults();
        }
    var key_Desc, ward, wardno, wardUrl;
    this.countprocessed = 0;
    this.countrequired = this.addresses.length;
    var o = this;
    bbparms = {};
    bbparms.message = "<b>No extact address was found. Please select one of the following</b>";
    bbparms.show = true;
    bbparms.backdrop = true,
    bbparms.closeButton = true;
    bbparms.animate = true;
    bbparms.buttons = {};
    
	var self = this;
	for (var i=0; i < this.addresses.length; i++) {
			var item = this.addresses[i];
			//* I need to fix this. I can't seem to get "This" to properly be in this.
			// Evt = click event, this ==  the bootbox modal.
			//So this is fudged to looks for a special known "hiddenInput"
			var cb = $.proxy(function(evt) {
				//this.addressObject.set_a("x");
				$(this.resultsDisplaySelector).html($(evt.currentTarget).attr("data-bb-handler"));
				$(this.resultsDisplaySelector ).change();
			}, this);
	       bbparms.buttons[item.key_Desc] = { className: 'btn-default addrSelect', 'data-item': item,    callback : cb
			   
		   }
 	
		
	}
   // $.each(this.addresses, function (i, item) {
    //    bbparms.buttons[item.key_Desc] = { className: 'btn-default addrSelect', callback :function() { this.address = item; this.callback.call(); console.log(item)}}
   // });
   var avInst = this;
   var dialog = bootbox.dialog(bbparms);
	//Add an ID to the bootstrap modal for  handling events
	// Add a click handler for each button,, and add in the instance of the adressValidation
	dialog.on("shown.bs.modal", function() {
		dialog.attr("id", "addressLookupDiag");
		dialog.find("button.addrSelect").on("click", $.proxy(function (evt) {
		   alert($(evt.currentTarget).attr("data-bb-handler"));
		   for (var i = 0; i < this.addresses.length; i++) {
			if (this.addresses[i].key_Desc == $(evt.currentTarget).attr("data-bb-handler")) {
				//$.extend( true, this.addressObject, this.addresses[i]);
				this.addressObject = this.addresses[i];
				console.log(this.addressObject);
			}
		   }
		   }, avInst)  );
	});
    });
}
AddressLookup.prototype.getData = function( ) {
    this.results = [];
    $( this.resultsDisplaySelector ).html( "" );    
     var urlStr= this.apiADDRURLPrefix + encodeURIComponent(this.address) + this.lookUpParms();
    
     $.ajax({
         type: 'GET',
         url: urlStr,
         context: this,
         dataType: 'json',
         error: function(jqXHR, textStatus, errorThrown) {
             this.processError.call(this,jqXHR, textStatus, errorThrown);
         },
         dataType: 'jsonp',
         success: function (data) {
             this.processAddressData.call( this, data);
         }         
     });
    
}
 
 /* if we get more than one results.. so a midal and let user se3lect*/
AddressLookup.prototype.processAddressData = function(data) {
 
    this.addresses = 
        $.merge(( data.result['bestResult'] ),
        $.merge(data.result['likelyResults'],
        data.result['restOfResults'] ));

     if (this.addresses.length==0)
         {
            bootbox.alert("No addresss information found. Please try again with Street Number and Street Name, or a Place Name. ");
             this.results.length=0;
             this.drawResults();
        }
    var key_Desc, ward, wardno, wardUrl;
    this.countprocessed = 0;
    this.countrequired = this.addresses.length;
    var o = this;
    bbparms = {};
    bbparms.message = "More than one address was found, please select one of the following";
    bbparms.show = true;
    bbparms.backdrop = true,
    bbparms.closeButton = true;
    bbparms.animate = true;
    bbparms.buttons = {};
    
    $.each(this.addresses, function (i, item) {
        bbparms.buttons[item.key_Desc] = { className: 'btn-default addrSelect', callback :function() { 
		this.addressObject = item; 
		console.log(item)}}
    });
    bootbox.dialog(bbparms);
}
 
        
AddressLookup.prototype.drawResults = function() {
    var strHTML = "";
    this.results = this.results.sort(SortByScore);
    
    if (this.results.length==0  )    {
        $( this.resultsDisplaySelector ).html( "<p class='found'><b>No Result Found. </b>Please try again with <i>Street Number</i> and <i>Street Name</i>, or a <i>Place Name</i>. </p><hr>" );        
    } else  {
        $( this.resultsDisplaySelector ).html( "<p  class='found'>"+ this.results.length +" Results Found</p><hr>" );
    }
    $.each( this.results, function (i, item) {
        strHTML += '<section class="locationresult">';
            strHTML += '<div class="address">' + item.address + '</div>';
            strHTML += '<ul><li><div class="ward"> Ward: <a title="Open the ward profile page" href="' + item.wardlink + '">' + item.ward + '</a></div></li>';
            strHTML += '<li><div class="neighbourhood"> Neighbourhood: <a title="open the neighbourhood profile page" href="' + item.neighbourhoodlink + '">' + item.neighbourhood + '</a>  </div></li></ul>';
        strHTML += '</section>' ;
    })
    $( this.resultsDisplaySelector ).append( strHTML ); 
}

AddressLookup.prototype.processError = function(jqXHR, textStatus, errorThrown) {
    $( this.resultsDisplaySelector ).html( textStatus + " " + errorThrown );
}
 
function SortByScore(a, b) {
      return b.score - a.score;
}


 
 