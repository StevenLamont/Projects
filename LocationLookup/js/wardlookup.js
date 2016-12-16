var WardLookup = function () {
	this.wcmURLPrefix = '//www1.toronto.ca/wps/portal/contentonly?vgnextoid=';
	this.apiWARDURLPrefix = '//map.toronto.ca/geoservices/rest/search/rankedsearch?searchString=';
	this.apiWARDURLSuffix = '&searchArea=1&matchType=1&projectionType=1&retRowLimit=10';
	this.results = [];
	this.wardGUIDS = {
1: 'd8b9be4436161410VgnVCM10000071d60f89RCRD', 
2: 'abd9be4436161410VgnVCM10000071d60f89RCRD',
3: '991abe4436161410VgnVCM10000071d60f89RCRD',
4: '833abe4436161410VgnVCM10000071d60f89RCRD',
5: '434abe4436161410VgnVCM10000071d60f89RCRD',
6: '664abe4436161410VgnVCM10000071d60f89RCRD',
7: '884abe4436161410VgnVCM10000071d60f89RCRD',
8: 'aa4abe4436161410VgnVCM10000071d60f89RCRD',
9: 'fc4abe4436161410VgnVCM10000071d60f89RCRD',
10: 'fab9be4436161410VgnVCM10000071d60f89RCRD',
11: '1db9be4436161410VgnVCM10000071d60f89RCRD',
12: '3fb9be4436161410VgnVCM10000071d60f89RCRD',
13: '51c9be4436161410VgnVCM10000071d60f89RCRD',
14: '73c9be4436161410VgnVCM10000071d60f89RCRD',
15: '95c9be4436161410VgnVCM10000071d60f89RCRD',
16: 'b7c9be4436161410VgnVCM10000071d60f89RCRD',
17: 'eac9be4436161410VgnVCM10000071d60f89RCRD',
18: '64d9be4436161410VgnVCM10000071d60f89RCRD',
19: '08d9be4436161410VgnVCM10000071d60f89RCRD',
20: 'cdd9be4436161410VgnVCM10000071d60f89RCRD',
21: '71e9be4436161410VgnVCM10000071d60f89RCRD',
22: '88e9be4436161410VgnVCM10000071d60f89RCRD',
23: 'abf9be4436161410VgnVCM10000071d60f89RCRD',
24: '9ff9be4436161410VgnVCM10000071d60f89RCRD',
25: 'e50abe4436161410VgnVCM10000071d60f89RCRD',
26: '980abe4436161410VgnVCM10000071d60f89RCRD',
27: '4d0abe4436161410VgnVCM10000071d60f89RCRD',
28: '511abe4436161410VgnVCM10000071d60f89RCRD',
29: 'f51abe4436161410VgnVCM10000071d60f89RCRD',
30: '3d1abe4436161410VgnVCM10000071d60f89RCRD',
31: '9f1abe4436161410VgnVCM10000071d60f89RCRD',
32: 'b12abe4436161410VgnVCM10000071d60f89RCRD',
33: 'f32abe4436161410VgnVCM10000071d60f89RCRD',
34: '162abe4436161410VgnVCM10000071d60f89RCRD',
35: '382abe4436161410VgnVCM10000071d60f89RCRD',
36: '5a2abe4436161410VgnVCM10000071d60f89RCRD',
37: '7c2abe4436161410VgnVCM10000071d60f89RCRD',
38: '9e2abe4436161410VgnVCM10000071d60f89RCRD',
39: 'd03abe4436161410VgnVCM10000071d60f89RCRD',
40: '473abe4436161410VgnVCM10000071d60f89RCRD',
41: '693abe4436161410VgnVCM10000071d60f89RCRD',
42: 'ab3abe4436161410VgnVCM10000071d60f89RCRD',
43: 'ed3abe4436161410VgnVCM10000071d60f89RCRD',
44: '004abe4436161410VgnVCM10000071d60f89RCRD'
};
	 
	this.codeSelector = '#appCode';
	this.displaySelector = '#appDisplay';
	this.resultsDisplaySelector = '#resultsDisplay';
	this.inputSelector = '#searchLocation';
}

WardLookup.prototype.init = function () {
	var strCode = '<link rel="stylesheet" href="/static_files/WebApps/Location Lookup/files/locationlookup.css">';
	$( this.codeSelector ).html( strCode );
} 
WardLookup.prototype.drawForm = function () {
	$( this.displaySelector ).html( "<div class='form-group'> <label for='searchLocation' class='control-label wardlb'>Search by Address or Place: </label><input type='text' id='searchLocation' class='form-control searchwl' placeholder='Type in Address or Place Name'></input><button class='btn btn-primary btn-wl' id='action-button' onclick='wl.setCookie()'>Ward Lookup</button></div>  <div id='resultsDisplay' class='clear'></div>");	
	$('#searchLocation').keydown( function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { wl.setCookie(); }
    });	 
	if (getCookie('nlookup')!="" && getCookie('nlookup') != null) { $("#searchLocation").val( decodeURIComponent(getCookie('nlookup')) ); this.getData(); }
}
 		
WardLookup.prototype.setCookie = function() {
	var strCookie = encodeURIComponent($( this.inputSelector ).val());
	document.cookie = "nlookup=" + strCookie + "; path=/";
	this.getData();
}

WardLookup.prototype.getData = function( ) {
	this.results = [];
	$( this.resultsDisplaySelector ).html( "" );	
     var urlStr= this.apiWARDURLPrefix + getCookie('nlookup') +  this.apiWARDURLSuffix;
     $.ajax({
         type: 'GET',
         url: urlStr,
		 ll: this,
         dataType: 'json',
         error: function(jqXHR, textStatus, errorThrown) {
             this.ll.processError.call(this.ll,jqXHR, textStatus, errorThrown);
         },
         dataType: 'jsonp',
         success: function (data) {
             this.ll.processWardData.call(this.ll, data);
         }         
     });
}
 
WardLookup.prototype.processWardData = function(data) {
 
	this.wards = 
					$.merge(( data.result['bestResult'] ),
					$.merge(data.result['likelyResults'],
					data.result['restOfResults'] ));

	 if (this.wards.length==0)
		 {
			 this.results.length=0;
			 this.drawResults();
		}
	var key_Desc, ward, wardno, wardUrl;
	this.countprocessed = 0;
	this.countrequired = this.wards.length;
	var obj = this;
    $.each(this.wards, function (i, item) {
		obj.countprocessed++;
	var o = {};
	o.address = item.key_Desc;
	o.score = item.score;
	o.ward = item.detail;
	o.wardlink = (item.detail.match(/\((\d+)\)/)!=null) ? obj.wcmURLPrefix + obj.wardGUIDS[parseInt(item.detail.match(/\((\d+)\)/)[1])] : "";
	 if (o.wardlink != "" ) {obj.results.push(o);}
	if (obj.countprocessed == obj.countrequired) {obj.drawResults();}	
 
	});
}
 
WardLookup.prototype.drawResults = function() {
	var strHTML = ""; strTmp = "";
	this.results = this.results.sort(SortByScore);
	
	if (this.results.length==0  )	 {
		$( this.resultsDisplaySelector ).html( "<p class='found'><b>No Result Found. </b>Please try again with <i>Street Number</i> and <i>Street Name</i>, or a <i>Place Name</i>. </p><hr>" );		
	} else	{
		$( this.resultsDisplaySelector ).html( "<p  class='found'>"+ this.results.length +" Results Found</p><hr>" );
	}
	$.each( this.results, function (i, item) {
		strHTML += '<section class="locationresult">';
			strHTML += '<div class="address">' + item.address + '</div>';
			strTmp = item.ward.substring(item.ward.indexOf("(") + 1, item.ward.indexOf( ")" )) + " - " + item.ward.substring(0, item.ward.indexOf(" ("));
			strHTML += '<ul><li><div class="ward"> Ward: <a title="Open the ward profile page" href="' + item.wardlink + '">' + strTmp + '</a></div></li></ul>';
 
		strHTML += '</section>' ;
	})
	$( this.resultsDisplaySelector ).append( strHTML );	
}

WardLookup.prototype.processError = function(jqXHR, textStatus, errorThrown) {
	$( this.resultsDisplaySelector ).html( textStatus + " " + errorThrown );
}
 
function SortByScore(a, b) {
      return b.score - a.score;
}

 
 