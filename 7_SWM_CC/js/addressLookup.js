/*
This code is to validate an address using the one address repository and returning the related address info;

General Usage:

    1) Create a "result" html tag to hold the full address as found in the "one address repository".  Depending on usage, it may be hidden

    <input id="COTAddress" type="hidden" value="">

    2) in your application, create an instance (configure as needed), and call getAddressData.
    addrLU = new AddressLookup({ matchType : 1, address : $("#searchLocation").val(), resultsDisplaySelector : "#COTAddress"});
    addrLU.getAddressData();

    3) Setup an event to know the address can be determined.  Optionally get the full object returned from GCC.
       Remember, it is very likely that we popup a selection menu to the user, so there is no easy way to know when the user can actually selected something.
    $("#COTAddress").on("change",function() {
        var addrData = addrLU.getAddressObject();
        determineWasteCalendar(addrData) or somefunction
    });

Notes:
    There is some minor coded CSS in the script that hopefully dpoesn't need to change and thus this script can used without any associated css needing to be defined
The code is used:
1) The Solid Waste Management Collection Calendar lookup

If the code is enhanced, please perform a regression test.

*/
(function (window, undefined) {
   'use strict';

var AddressLookup = function (opt_options) {

    if (typeof bootbox === 'undefined') {
        alert("bootbox must be loaded before using this library");
    }
    this.options = opt_options || {};
    this.apiADDRURLPrefix = 'http://map.toronto.ca/geoservices/rest/search/rankedsearch?searchString=';
    this.searchArea =  this.options.searchArea || 1;
    this.matchType =  this.options.matchType || 1;
    this.retRowLimit =  this.options.retRowLimit || 10;
    this.projectionType =  this.options.projectionType || 1;
    this.address = this.options.address || "";
    //this.callback = this.options['callback'] || "";
    this.codeSelector = this.options.codeSelector || '#appCode';
    this.displaySelector = this.options.displaySelector || '#appDisplay';
    this.resultsDisplaySelector =  this.options.resultsDisplaySelector || '#resultsDisplay';
    this.inputSelector = this.options.inputSelector || '#searchLocation';
    this.addressObject = {};

};

AddressLookup.prototype.lookupParms = function () {
    return "&searchArea=" + this.searchArea + "&matchType=" + this.matchType + "&projectionType=" + this.projectionType + "&retRowLimit=" + this.retRowLimit;
};


AddressLookup.prototype.setAddress = function(address) {
    this.address = address;
};

//AddressLookup.prototype.setCallback = function(func) {
//    this.callback = func;
//}
AddressLookup.prototype.getAddressObject = function() {
    return this.addressObject;
};

/* interesting that the API sometimes bring back duplicates. when adding buttons, they are essentially ignore since the button as objects
*/
AddressLookup.prototype.promptUser = function(addresses) {
    var bbparms = {};
    bbparms.message = "<b>No extact address was found. Please select one of the following</b>";
    bbparms.show = true;
    bbparms.backdrop = true;
    bbparms.closeButton = true;
    bbparms.animate = true;
    bbparms.buttons = {};

    for (var i=0; i < addresses.length; i++) {
        var item = addresses[i];
        bbparms.buttons[item.key_Desc] = { className: 'btn-default addrSelect', 'data-item': item };
    }

    var avInst = this;
    var dialog = bootbox.dialog(bbparms);
    /* Add an ID to the bootstrap modal.
       Add a click handler for each button (add in the instance of the adressValidation)
    */
    dialog.on("shown.bs.modal", function() {
        dialog.attr("id", "addressLookupDiag");
        dialog.css("z-index","99001");
        var btns = dialog.find("button.addrSelect");
        btns[0].focus();
        btns.css("width","100%");
        btns.css("margin","0 0 5px 0");
        btns.on("click", $.proxy(function (evt) {
            var addr = $(evt.currentTarget).attr("data-bb-handler");
            for (var i = 0; i < addresses.length; i++) {
                if (addresses[i].key_Desc == addr ) {
                    this.addressObject = addresses[i];
                    $(this.resultsDisplaySelector).html(addr);
                    $(this.resultsDisplaySelector ).change();
                }
            }
        }, avInst)  );
         btns.on("keydown", $.proxy(function (e) {
            if (e.which === 40) {
                $(e.target).next().focus();
            }
            if (e.which === 38) {
                $(e.target).prev().focus();
            }           
            //console.log(e.which)
        }, avInst)  );
    });
};
/* should only be one exact result, but check anyway and pick last */
AddressLookup.prototype.determineAddresses = function(data) {

    var exactFound = false;
    var addresses = [];
    $.each(data.result.bestResult, function(i,res) {
        if (res.matchType === "Exact" && res.featureClass === "Address") {
        addresses.push(res);
        exactFound = true;
        }
    });
    if (!exactFound) {
        addresses =
            $.merge(( data.result.bestResult ),
            $.merge(data.result.likelyResults,
            data.result.restOfResults ));
    }
    return addresses;
};

AddressLookup.prototype.getAddressData = function( ) {
    this.results = [];
    $( this.resultsDisplaySelector ).html( "" );
    var urlStr= this.apiADDRURLPrefix + encodeURIComponent(this.address) + this.lookupParms();

    var request = $.ajax({
        type: 'GET',
        url: urlStr,
        context: this,
        dataType: 'jsonp',
        //success: function (data) {
            // this.processAddressData.call( this, data);
        //},
        error: function(jqXHR, textStatus, errorThrown) {
             this.processError.call(this,jqXHR, textStatus, errorThrown);
        }
     });
    $.when(request).done(function(data) {

        //this.determineAddresses(data);
        var addresses = this.determineAddresses(data);

        if (addresses.length ===0) {
            var dialog = bootbox.alert("No addresss information found. Please try again with Street Number and Street Name, or a Place Name. ");
            dialog.attr("id", "addressLookupDiag");
            dialog.css("z-index","99001");
        } else if (addresses.length==1) {
            this.addressObject = addresses[0];
            $(this.resultsDisplaySelector).html( addresses[0].key_Desc);
            $(this.resultsDisplaySelector ).change();
        } else {
            this.promptUser(addresses);
        }
    });
};

AddressLookup.prototype.processError = function(jqXHR, textStatus, errorThrown) {
    $( this.resultsDisplaySelector ).html( textStatus + " " + errorThrown );
};

window.AddressLookup = AddressLookup;
})(this);