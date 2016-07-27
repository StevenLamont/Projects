//*************************************  START APP CLASS  ***************************************************

var App = function() {
	this.requireSSL = true;
	this.js = { 'validator': true, 'datepicker' : true, 'placeholders' : true, 'xdomain' : true, 'interfaceLoaded' : false };
	this.hourly = {'single': 'Hour', 'plural': 'Hourly', 'contextsingle' : 'Day', 'contextplural' : 'Days', 'contextplurally' : 'Daily', 'viewMode' : 'days', 'datepickformat': 'MMM DD, YYYY', 'chartformat' : 'ha', 'xaxis' : 'Hour of Day'};
	this.daily = {'single': 'Day', 'plural': 'Daily', 'contextsingle' : 'Month', 'contextplural' : 'Months', 'contextplurally' : 'Monthly', 'viewMode' : 'months', 'datepickformat': 'MMM YYYY', 'chartformat' : 'MMM dd', 'xaxis' : 'Day of Month'};
	this.weekly = {'single': 'Week', 'plural': 'Weekly', 'contextsingle' : 'Month', 'contextplural' : 'Months', 'contextplurally' : 'Monthly', 'viewMode' : 'months', 'datepickformat': 'MMM YYYY', 'chartformat' : 'MMM dd', 'xaxis' : 'Week of Month'};
	this.monthly = {'single': 'Month', 'plural': 'Monthly', 'contextsingle' : 'Year', 'contextplural' : 'Years', 'contextplurally' : 'Yearly', 'viewMode' : 'years', 'datepickformat': 'YYYY', 'chartformat' : 'MMM', 'xaxis' : 'Month of Year'};
	this.yearly = {'single': 'Year', 'plural': 'Yearly', 'contextsingle' : 'Decade', 'contextplural' : 'Decades', 'contextplurally' : 'Yearly', 'viewMode' : 'years', 'datepickformat': 'YYYY', 'chartformat' : 'YYYY', 'xaxis' : 'Year'};
	this.monthnames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	this.graphLoaded = $.Deferred();
	this.context = "daily";
	this.apiHost = 'https://secure.toronto.ca/cc_api/svcaccount_v1/WaterAccount';
	this.baseCSS = '/static_files/WebApps/Water%20Use/files/wateruse.css';
	this.baseCSSIE = '/static_files/WebApps/Water%20Use/files/wateruseie.css';
	this.htmlfile = '/static_files/WebApps/Water%20Use/files/wateruse.html';
	this.selectors = { 'code': '#appCode', 'display' : '#appDisplay', 'form' : '#verification', 'displayhtml' : '#waterusedisplay', 'terms' : '#termsandconditions', 'termsDisagree' : '#termsandconditionsdisagree', "verification": "#verification", "modal" : "#wuModal", "modalLabel" : "#wuModalLabel", "modalBody" : "#wuModalBody", "chart" : "waterchart", "chartdisplay": "#waterchartdisplay", "table" : "watertable", "tabledisplay" : "#watertabledisplay", "chartimage" : "#chartpng", "datecontext" : "#datecontextinput"};
	this.cookie = { 'terms' : 'waterterms', 'api' : 'idmasvcaccountapi', 'account' : 'accountnum' };
	this.axis = { 'wateruse' : true, 'temp' : true, 'precip' : true};
};
App.prototype.loadJSandCSS = function () {
	var strCode="";
	strCode += (this.baseCSS) ? '<link rel="stylesheet" href="' + this.baseCSS + '">' : '';
	strCode += (this.baseCSSIE) ? '<!--[if lt IE 10]><link rel="stylesheet" href="' + this.baseCSSIE + '"><![endif]-->' : '';
	strCode += (this.js.validator) ? '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css"><script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>' : '';
	strCode += (this.js.datepicker) ? '<link rel="stylesheet" href="/static_files/assets/datepicker/bootstrap-datetimepicker.css"><script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script><script type="text/javascript" src="/static_files/assets/datepicker/bootstrap-datetimepicker.js"></script>' : '';
	strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
	strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
	strCode += (this.js.placeholders) ? '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>' : '';
	strCode += (this.js.xdomain) ? '<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/jquery-ajaxtransport-xdomainrequest/1.0.1/jquery.xdomainrequest.min.js"></script>' : '';
	$(this.selectors.code).html(strCode);
}
App.prototype.sslSwitch = function() {
	if (this.requireSSL) {
		if (document.location.protocol=="http:" && document.location.host=="www1.toronto.ca") {
			document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
		}
	}
}
App.prototype.start = function() {
	this.sslSwitch();
	this.loadJSandCSS();
	if (getCookie(this.cookie.terms) != "agree") {
		this.showSection(this.selectors.terms);
	} else {
		if (getCookie(this.cookie.api)==null || getCookie(this.cookie.account) == null) {
			this.showSection(this.selectors.verification, this.initVerification);
		} else {
			this.loadDataSets();
		}
	}
}
App.prototype.accountLookup = function() {
	document.cookie = this.cookie.api + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
	document.cookie = this.cookie.account + '=; expires=Thu, 01-Jan-70 00:00:01 GMT;';
	app = new App();
	app.graphLoaded.resolve(true);
	this.showSection(this.selectors.verification, this.initVerification);
}
App.prototype.showSection = function(sSection, fCallback) {
	if (fCallback) {
		$(this.selectors.display).load(this.htmlfile + ' ' + sSection, function() {fCallback.call(app);});
	} else {
		$(this.selectors.display).load(this.htmlfile + ' ' + sSection);
	}
}


//TERMS AND AGREEMENTS
App.prototype.termsAgree = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Agree');
	document.cookie = "waterterms=agree; path=/";
	this.showSection(this.selectors.verification, this.initVerification);
}
App.prototype.termsDisagree = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Disagree');
	$(this.selectors.display).load(this.htmlfile + ' ' + this.selectors.termsDisagree);
}


//VALIDATION
//accountnum: {message: 'Please enter the full utility account number (#########-#########-0#).  This number can be found on the top right corner of your utility bill.',
//			validators: {notEmpty: {message: 'The utility account number is required and cannot be left blank'},regexp: {regexp: /(^(\d{9})[-](\d{9})[-][0](\d{1})$)|(^(\d{9})(\d{9})[0](\d{1})$)/,message: 'The utility account number must be in the format #########-#########-0#'}}},
App.prototype.initVerification = function() {
	removeCookie( this.cookie.api );
	removeCookie( this.cookie.account );
	this.interfaceLoaded = false;
	delete this.accountdetails;
	delete this.consumption;
	delete this.weather;
	delete this.consumptionloaded;
	delete this.weatherloaded;
	delete this.chart;
	delete this.table;
	this.context = "daily";
	$(this.selectors.form).bootstrapValidator({
	feedbackIcons: {valid: 'glyphicon glyphicon-ok',invalid: 'glyphicon glyphicon-remove',validating: 'glyphicon glyphicon-refresh'},
	onSuccess: function(e) {
		app.prevalidate();
	},
	onError: function(e) {
				$($(".has-error input, .has-error select")[0]).focus();
	},
	fields: {accountnum: {message: 'Please enter the account number (#########).  This number can be found on the top right corner of your utility bill.',
					validators: {notEmpty: {message: 'The account number is required and cannot be left blank'},
                    regexp: {regexp: /(^(\d{9})$)/,                  
						message: 'The account number must be in the format ######### (9 digits)'}}},
				clientnum: {message: 'Please enter the client number (#########-0#).  This number can be found on the top right corner of your utility bill.',
					validators: {notEmpty: {message: 'The client number is required and cannot be left blank'},
                    regexp: {regexp: /(^(\d{9})[-| ][0](\d{1})$)|(^(\d{9})[0](\d{1})$)/,                  
						message: 'The client number must be in the format ######### 0# (with or without the space)'}}},
		lastname: {message: 'Please enter the last name on the utility account.',
		  validators: {notEmpty: {message: 'The last name field is required and cannot be left blank'}}},
		paymentmethod: {message: 'Please select your last payment method for the utility account.',
		  validators: {notEmpty: {message: 'The last payment method must be specified'}}},
		postalcode: {message: 'Please enter the postal code for the property on the utility account.',
		   validators: {regexp: {regexp: /^[ABCEGHJKLMNPRSTVXYZabcdefghijklmnopqrstuvwxyz]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$/,message: 'The postal code must be in a format of A#A #A#'}}}}})
	$('input').keydown( function(e) { var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0; if(key == 13) { app.validateForm(); } });
}
App.prototype.validateForm = function () {
	$( this.selectors.form ).data('bootstrapValidator').validate();
}
App.prototype.prevalidate = function() {
	$( this.selectors.display + " article").addClass("hide");
	$( "#loadingmsg").removeClass("hide");
	//var aNum = $("#accountnum").val();
	//if (aNum.length==20) {aNum = aNum.substring(0,9) + "-" + aNum.substring(9,18) + "-" + aNum.substring(18,20);}
	//var sNum = aNum.substring(0, 9);
	aNum = getFullAcctNumber();
	var lName = $("#lastname").val();
	lName = lName.replace(/[^a-z0-9 ]+/gi, "");
	var pCode = $("#postalcode").val();
	var pMethod = $("#paymentmethod").val();
	pCode = (pCode.length==6) ? pCode.substring(0,3) + " " + pCode.substring(3,6) : pCode;
	var strData = '{"API_OP":"VALIDATE","ACCOUNT_NUMBER":"' + aNum + '","LAST_NAME":"' + lName + '"';
	strData += (pCode.length>0)? ' ,"POSTAL_CODE":"' + pCode + '"' : '';
	//strData += ' ,"POSTAL_CODE":"' + pCode + '"';
	strData += ',"LAST_PAYMENT_METHOD":"' + pMethod + '"}';
	var oJSON = JSON.parse(strData);
	strData = "json=" + JSON.stringify(oJSON);
	this.validateURLData = strData;
	this.accountnumber = aNum;
	this.validate();
}


//ERROR HANDLING
App.prototype.displayError = function (strTitle, strBody) {
	$(this.selectors.display + " #loadingmsg").addClass("hide");
	$(this.selectors.display + " article").removeClass("hide");
	$(this.selectors.modalLabel).html(strTitle); 
	$(this.selectors.modalBody).html(strBody); 
	$(this.selectors.modal).modal();
}
App.prototype.api_error = function(jqXHR, textStatus, errorThrown) {
	this.displayError("SYSTEM ERROR", textStatus + " " + errorThrown);
}

App.prototype.cannotLoadData = function() {
		$("#appDisplay").html("<h1>MyWaterToronto</h1><p>The MyWaterToronto application is unable to display information for this account at this time.</p><br><p>For specific inquiries regarding your utility account or bill, please contact 311.</p><ul><li>Outside city limits: 416-392-CITY (2489)</li><li>TTY customers only: 416-338-0TTY (0889)</li><li>Email: <a href='mailto:311@toronto.ca'>311@toronto.ca</a></li></ul>");
}

//MAIN LOGIC
App.prototype.loadDataSets = function() {

	//IF ACCOUNTDETAILS HAS NOT BEEN LOADED THEN CALL IT
	if ( !this.accountdetails ) { this.getAccountDetails(); return;}
	
	if (this.accountdetails.premiseList[0].meterList.length == 0) {
		this.cannotLoadData();
		return;
	}
	
	if ( this.accountdetailsloaded.state() == "resolved") {
		//IF CONSUMPTION HAS NOT BEEN LOADED AND ACCOUNTDETAILS HAS BEEN LOADED THEN CALL IT
		if ( !this.consumption && !this.consumptionloaded ) { 
			this.getConsumption(); 
			return; 
		}

		//IF GROUPCONSUMPTION HAS NOT BEEN LOADED AND ACCOUNTDETAILS HAS BEEN LOADED THEN CALL IT
		//if ( !this.groupconsumption && !this.groupconsumptionloaded ) { this.getGroupConsumption(); return; }
		
		//IF WEATHER HAS NOT BEEN LOADED AND ACCOUNTDETAILS HAS BEEN LOADED THEN CALL IT
		if ( !this.weather && !this.weatherloaded ) { this.getWeather(); return; }
		
		//IF EVERYTHING IS RESOLVED THEN DRAW INTERFACE
		if ( this.accountdetailsloaded.state() == "resolved" && this.consumptionloaded.state() == "resolved" && this.weatherloaded.state() == "resolved" && this.consumption) {
			this.loadInterface();
		}
	}
	
}
App.prototype.loadInterface = function() {
	if (this.interfaceLoaded) {
		this.drawInterface.call(this);
	} else {
		this.showSection.call(this, this.selectors.displayhtml, this.drawInterface);
	}
}
App.prototype.drawInterface = function() {

	var ml = this.accountdetails.premiseList[0].meterList;
	if (ml[this.selectedMeter].intervalMins == "360") {$($("#datecontextinput option")[0]).css("display", "none");} else {$($("#datecontextinput option")[0]).css("display", ""); $($("#datecontextinput option")[0]).text("Hourly");}
	$('#chartOptions').multiselect( {onChange: function(option, checked, select) {app.chartOptions(option, checked, select)}, enableHTML: true, buttonText: function(options, select) { return '<span class="glyphicon glyphicon-cog"></span> Chart Options';} });
	$( "#wuTitle" ).html( this[this.context].plural + " Water Use" );
	$( "#daterangelabel" ).html( 'Select ' + this[this.context].contextsingle );
	$( "#wuAccountNo" ).html( this.accountdetails.formattedaccountno);	
	$( "#wuAddress" ).html( this.accountdetails.premiseList[0].address);
	$( "#wuFirstRead" ).html( ml[this.selectedMeter].firstReadDate );
	$( "#wuLastRead" ).html( ml[this.selectedMeter].lastReadDate );
	if ( !this.interfaceLoaded ) {
		$( '#daterangeinput' ).datetimepicker( {viewMode: this[this.context].viewMode, format: this[this.context].datepickformat, minDate: new Date(ml[this.selectedMeter].firstReadDate), maxDate: new Date(ml[this.selectedMeter].lastReadDate), defaultDate: new Date(ml[this.selectedMeter].lastReadDate), widgetPositioning: {vertical: 'bottom'}});
		$( "#daterangeinput" ).on("dp.change", function (e) { 
			app.dateSelect(e) 
		});
	} else {
		$( '#daterangeinput' ).data("DateTimePicker").viewMode( this[this.context].viewMode );
		$( '#daterangeinput' ).data("DateTimePicker").format( this[this.context].datepickformat );
		$( '#daterangeinput' ).data("DateTimePicker").minDate(new Date(1990,1,1));
		$( '#daterangeinput' ).data("DateTimePicker").maxDate(new Date(2090,1,1));
		$( '#daterangeinput' ).data("DateTimePicker").minDate( new Date(ml[this.selectedMeter].firstReadDate) );
		$( '#daterangeinput' ).data("DateTimePicker").maxDate( new Date(ml[this.selectedMeter].lastReadDate) );
		if (this.selectedDate) {
			$( '#daterangeinput' ).data("DateTimePicker").date( this.selectedDate );
		} else {
			$( '#daterangeinput' ).data("DateTimePicker").date( new Date(ml[this.selectedMeter].lastReadDate) );
		}
	}
	
	if (ml.length==1) {
		$( "#wuMeter" ).html( ml[this.selectedMeter].meterNumber + " - " + ml[this.selectedMeter].meterClass);
		$( "#wuMeterMulti" ).addClass("hide");
		$( "#wuMeterSingle" ).removeClass("hide");
	} else {
		var strMeterSelect = "<select id='wuMeterSelect' class='form-control' onchange='app.meterSelect()'>";
		for (var mcount=0; mcount < ml.length; mcount++) {
			strMeterSelect += '<option';
			strMeterSelect += (mcount==this.selectedMeter) ? ' selected' : '';
			strMeterSelect +=' value="' + ml[mcount].miu + '">' + ml[mcount].meterNumber + " - " + ml[mcount].meterClass + '</option>';
		}
		strMeterSelect += "</select>";
		$( "#wuMeters" ).html(strMeterSelect);
		$( "#wuMeterSingle" ).addClass("hide");
		$( "#wuMeterMulti" ).removeClass("hide");
	}
	
	$( ".usagesummary h3" ).html("For " + $('#daterangeinput').data('date'));
	$( "#wuUserTotalLabel" ).html("My " + this[this.context].contextplurally + " Total");
	$( "#wuUserAverageLabel" ).html("My " + this[this.context].plural + " Average");
	if (this.consumption.resultCode==500) {
		$( "#waterchartdisplay, #watertabledisplay" ).addClass("hide");
		$( "#noconsumptionfound" ).removeClass("hide");
		return;
	} else {
		$( "#waterchartdisplay, #watertabledisplay" ).removeClass("hide");
		$( "#noconsumptionfound" ).addClass("hide");
	}
	if (!this.consumption) { return; }
	if ( this.consumption.summary.consumptionTotal != null ) { $( "#wuUserTotal" ).html(numberWithCommas(this.consumption.summary.consumptionTotal.toFixed(2)) + " m<sup>3</sup> (cubic meters)"); } else { $( "#wuUserTotal" ).html( "Not Available" ); }
	if ( this.consumption.summary.consumptionAvg != null ) { $( "#wuUserAverage" ).html(numberWithCommas(this.consumption.summary.consumptionAvg.toFixed(2)) + " m<sup>3</sup> (cubic meters)"); } else { $( "#wuUserAverage" ).html( "Not Available" ); }

	//if ( this.groupconsumption.consumptionAvg != null ) { $( "#wuCityAverage" ).html(numberWithCommas(this.groupconsumption.consumptionAvg.toFixed(2)) + " m<sup>3</sup>"); } else { $( "#wuCityAverage" ).html( "Not Available" ); }
	if ( this.graphLoaded.state() == "resolved" ) { 
		this.createGraph();
	} else {
		$.when( this.graphLoaded ).done(function ( x ) {
			app.createGraph();
		});
	}
	this.interfaceLoaded = true;
}


//API CALLS
App.prototype.validate = function() {
	var api = new API(this, 'validate', this.validate_success, this.api_error);
	api.data = this.validateURLData;
	api.POST();
}
App.prototype.getAccountDetails = function() {
	this.accountdetailsloaded = $.Deferred();
	delete this.consumptionloaded;
	var api = new API(this, 'accountdetails', this.accountdetails_success, this.api_error);
	api.dataType = 'jsonp';
	api.url = api.url + "?json=" + encodeURIComponent('{"API_OP":"ACCOUNTDETAILS","ACCOUNT_NUMBER":"' + getCookie(this.cookie.account) + '"}')
	api.GET();
}
App.prototype.getConsumption = function() {
	this.consumptionloaded = $.Deferred();
	var strMIU = this.accountdetails.premiseList[0].meterList[this.selectedMeter].miu;
	var api = new API(this, "consumption", this.consumption_success, this.api_error);
	api.dataType = 'jsonp';
	api.url = api.url + "?json=" + encodeURIComponent('{"API_OP":"CONSUMPTION","ACCOUNT_NUMBER":"' + this.accountdetails.formattedaccountno + '", "MIU_ID": "' + strMIU + '", "START_DATE": "' + this.getMinDate() + '", "END_DATE": "' + this.getMaxDate() + '", "INTERVAL_TYPE" : "' + app[app.context].single + '"}');
	api.GET();
}
App.prototype.getGroupConsumption = function (strMG) {
	this.groupconsumptionloaded = $.Deferred();
	var strMG;
	$.each(this.accountdetails.premiseList[0].meterList[0].meterGroupList, function(i,mglItem) {
		if (mglItem.meterGroupDesc.toLowerCase().indexOf("whole city")>=0) {strMG = mglItem.meterGroupId;};
	});
	var api = new API(this, "groupconsumption", this.groupconsumption_success, this.api_error);
	api.dataType = 'jsonp';
	api.url = api.url + "?json=" + encodeURIComponent('{"API_OP":"GROUPCONSUMPTION","ACCOUNT_NUMBER":"' + this.accountdetails.formattedaccountno + '", "METERGROUP_ID": "' + strMG + '", "START_DATE": "' + this.getMinDate() + '", "END_DATE": "' + this.getMaxDate() + '", "INTERVAL_TYPE" : "' + app[app.context].single + '"}');
	api.GET();
}
App.prototype.getWeather = function() {
	this.weatherloaded = $.Deferred();
	var api = new API(this, "weatherdata", this.weather_success, this.api_error);
	api.dataType = 'jsonp';
	api.url = api.url + "?json=" + encodeURIComponent('{"API_OP":"WEATHERDATA","ACCOUNT_NUMBER":"' + this.accountdetails.formattedaccountno + '", "START_DATE": "' + this.getMinDate() + '", "END_DATE": "' + this.getMaxDate() + '", "INTERVAL_TYPE" : "' + app[app.context].single + '"}');
	api.GET();
}


//GRAPH
App.prototype.initGraph = function() {
	app.graphLoaded.resolve(true);
}
App.prototype.createGraph = function() {
	var oSeries = {}, oAxes = {};
	
	var dt = new google.visualization.DataTable();
	dt.addColumn('datetime', this[this.context].xaxis);
	dt.addColumn('number', 'Water Use (m³)');
	if ( this.axis.wateruse ) {
		oSeries[parseInt(Object.keys(oSeries).length)] = {targetAxisIndex:0, color: '#0099FF'};
		oAxes[Object.keys(oAxes).length] = { color: '#0099FF', title: 'Cubic Meters (m³)'};
	}
	
	if ( this.axis.temp && this.context != "hourly" ) { 
		oSeries[Object.keys(oSeries).length] = {type: "line", targetAxisIndex:1, color: 'red', pointShape: 'circle', pointSize: 5};
		oAxes[Object.keys(oAxes).length] = { gridlines : {count: 0 }};
		dt.addColumn('number', 'Outside Temperature (°C)'); 
	}
	
	if ( this.axis.precip && this.context != "hourly" ) { 
		oSeries[Object.keys(oSeries).length] = {type: "line", targetAxisIndex:2, color: 'blue', pointShape: 'circle', pointSize: 5};
		oAxes[Object.keys(oAxes).length] = { gridlines : {count: 0 }};
		dt.addColumn('number', 'Precipitation (mm)'); 
	}

	var chartoptions = {	
		title: this[this.context].plural + ' Water Use for ' + $('#daterangeinput').data('date'), 
		animation: {duration: 1000, easing: 'linear' },
		seriesType: "bars", 
		series: oSeries, 
		height: 400, 
		hAxis: 	{ title: this[this.context].xaxis, format: this[this.context].chartformat }, 
		vAxes: 	oAxes};
	var tableoptions = {	title: this[this.context].plural + ' Water Use for ' + $('#daterangeinput').data('date'), showRowNumber: false, width: '100%', height: '100%'};

	var arrRows = [], arrRow= [], tmpDate, tmpToDate, fDate;
	var o = this;
	$.each(this.consumption.summary.intervalList, function(i,ilItem) {
		tmpDate = textToDate(ilItem.intStartDate);
		tmpToDate = textToDate(ilItem["intStartDate"]).addDays(6);
		switch(o.context) {
			case 'hourly':
				fDate = (tmpDate.getHours() > 12) ? (tmpDate.getHours() - 12).toString() + " p.m." : (tmpDate.getHours()).toString() + " a.m.";
				break;
			case 'daily':
				fDate = o.monthnames[tmpDate.getMonth()] + " " + tmpDate.getDate();
				break;
			case 'weekly':
				fDate = "Week of " + o.monthnames[tmpDate.getMonth()] + " " + tmpDate.getDate() + " to " + o.monthnames[tmpToDate.getMonth()] + " " + tmpToDate.getDate();
				break;
			case 'monthly':
				fDate = o.monthnames[tmpDate.getMonth()];
				break;
			default:
				
		}
		arrRow = [];
		arrRow.push({v: tmpDate, f: fDate});
		if (o.axis.wateruse) {
			arrRow.push({v: ilItem["intConsumptionTotal"], f: numberWithCommas(ilItem["intConsumptionTotal"])});
		}
		if ( o.axis.temp && o.context != "hourly" ) {
			if ( o.weather.intervalList[i] != null ) { 
				if ( o.weather.intervalList[i].intHighTemp != null ) { 
					arrRow.push({v: o.weather.intervalList[i].intHighTemp, f: o.weather.intervalList[i].intHighTemp.toFixed(2) + " C"}); 
				} else {
					arrRow.push({v: null}); 
				}
			} else {
				arrRow.push({v: null}); 
			}
		}
		if ( o.axis.precip && o.context != "hourly" ) {
			if ( o.weather.intervalList[i] != null ) { 
				if ( o.weather.intervalList[i].intPrecip != null ) {
					arrRow.push({v: o.weather.intervalList[i].intPrecip, f: o.weather.intervalList[i].intPrecip.toFixed(2) + " mm"}); 
				} else {
					arrRow.push({v: null}); 
				}
			} else {
				arrRow.push({v: null}); 
			}
		}
		arrRows.push(arrRow);
	});
	
	
	dt.addRows(arrRows);
	this.dt = dt;
	if (!this.chart) {this.chart = new google.visualization.ComboChart(document.getElementById(o.selectors.chart)); google.visualization.events.addListener(this.chart, 'dblclick', function (e) { app.graphClick(e); }) }
	if (!this.table) {this.table = new google.visualization.Table(document.getElementById(o.selectors.table)); google.visualization.events.addListener(this.table, 'select', function (e) { app.tableClick(e); })}
	this.chart.draw(dt, google.charts.Bar.convertOptions(chartoptions));	
	this.table.draw(dt, tableoptions);
	
	$( "#chartTitle" ).html( this[this.context].plural + ' Water Use Chart' );
	$( "#tableTitle" ).html( this[this.context].plural + ' Water Use Data' );
	$( "#chartSubtitle, #tableSubtitle"  ).html( 'For ' + $('#daterangeinput').data('date') );
	this.setGraphButtons();
	$( this.selectors.chartimage ).html("<img src='" + this.chart.getImageURI() + "'/>");
	this.activateGraph();
}
App.prototype.setGraphButtons = function() {
	var dtPrev = new Date($("#daterangeinput").data("DateTimePicker").date());
	var dtNext = new Date($("#daterangeinput").data("DateTimePicker").date());
	switch (this[this.context].contextsingle) {
		case "Day":
			dtPrev.setDate( dtPrev.getDate() - 1 );
			dtNext.setDate( dtNext.getDate() + 1 );
			break;
		case "Month":
			dtPrev.setMonth( dtPrev.getMonth() - 1 );
			dtNext.setMonth( dtNext.getMonth() + 1 );
			break;
		case "Year":
			dtPrev.setFullYear( dtPrev.getFullYear() - 1 );
			dtNext.setFullYear( dtNext.getFullYear() + 1 );
			dtNext.setMonth( 0 );
			break;
	}
	if (dtPrev < new Date($("#daterangeinput").data("DateTimePicker").minDate())) { 
		$( "#prevPeriod" ).prop('disabled', true); 
		//$( "#waterchartdisplay .prev" ).attr('title', 'The earliest ' + this[this.context].contextsingle.toLowerCase() + ' for this water account has been reached.');
		$( "#waterchartdisplay .prev" ).attr('data-original-title', 'The earliest ' + this[this.context].contextsingle.toLowerCase() + ' for this water account has been reached.');
	} else { 
		$( "#prevPeriod" ).prop('disabled', false); 
		//$( "#waterchartdisplay .prev" ).attr( 'title', 'Display water use for the previous ' + this[this.context].contextsingle.toLowerCase());
		$( "#waterchartdisplay .prev" ).attr( 'data-original-title', 'Display water use for the previous ' + this[this.context].contextsingle.toLowerCase());
	}
	if (dtNext > new Date($("#daterangeinput").data("DateTimePicker").maxDate())) { 
		$( "#nextPeriod" ).prop('disabled', true); 
		//$( "#waterchartdisplay .next" ).attr('title', 'The latest ' + this[this.context].contextsingle.toLowerCase() + ' for this water account has been reached.');
		$( "#waterchartdisplay .next" ).attr('data-original-title', 'The latest ' + this[this.context].contextsingle.toLowerCase() + ' for this water account has been reached.');
	} else { 
		$( "#nextPeriod" ).prop('disabled', false); 
		//$( "#waterchartdisplay .next" ).attr( 'title', 'Display water use for the next ' + this[this.context].contextsingle.toLowerCase());
		$( "#waterchartdisplay .next" ).attr( 'data-original-title', 'Display water use for the next ' + this[this.context].contextsingle.toLowerCase());
	}
	var is_touch_device = ("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch;
	if (!is_touch_device) {
		$("#appDisplay .popoverbs").popover({trigger: 'hover'});
		$("#appDisplay .multiselect.dropdown-toggle").popover({trigger: 'hover', placement: 'top'});
	}
	$("#appDisplay .multiselect.dropdown-toggle").attr('data-original-title', 'Show or hide different indexes on the chart');
}
App.prototype.chartOptions = function(option, checked, select) {
	app.axis[option.val()] = checked;
	app.createGraph();
}
App.prototype.dataTableToCSV = function () {
	
    var dt_cols = this.dt.getNumberOfColumns();
    var dt_rows = this.dt.getNumberOfRows();
    var csv_cols = [];
    var csv_out;
    
    for (var i=0; i<dt_cols; i++) {
        csv_cols.push(this.dt.getColumnLabel(i).replace(/,/g,""));
    }
    
    csv_out = csv_cols.join(",")+"\r\n";
    for (i=0; i<dt_rows; i++) {
        var raw_col = [];
        for (var j=0; j<dt_cols; j++) {
            raw_col.push(this.dt.getFormattedValue(i, j, 'label').replace(/,/g,""));
        }
        csv_out += raw_col.join(",")+"\r\n";
    }
    return csv_out;
}
App.prototype.downloadCSV = function() {
	var csv_out = this.dataTableToCSV();
			
	var browser = navigator.userAgent;
	var IEversion = 99;
	if (browser.indexOf("MSIE") > 1) {IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}
	if (IEversion < 10) {
		alert("You are using an old version of Internet Explorer that does not allow for file export.  As an alternative, please copy and paste the table below into excel or use a more up to date browser.")
	} else {
		var blob = new Blob([csv_out], {type: 'text/csv;charset=utf-8'});
		var url  = window.URL || window.webkitURL;
		var link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
		link.href = url.createObjectURL(blob);
		link.download = "Water Use " + $("#tableSubtitle").html() + ".csv"; 
		var event = document.createEvent("MouseEvents");
		event.initEvent("click", true, false);
		link.dispatchEvent(event); 
	}
}
App.prototype.deactivateGraph = function() {
	$( this.selectors.chartdisplay ).addClass( "loading" );
}
App.prototype.activateGraph = function() {
	$( this.selectors.chartdisplay ).removeClass( "loading" );
}


//SUCCESS API CALLS
App.prototype.validate_success = function(data) {
	if (data["validateResponse"]["status"]=="FAILURE") {
		dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Account Validation Error');
		this.displayError("Lookup Failed", data["validateResponse"]["errorMessage"]);
    } else {
		dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Account Validation Success');
		var date = new Date();
		date.setTime(date.getTime() + (20 * 60 * 1000));
		document.cookie = this.cookie.api + "=" + data["validateResponse"]["refToken"] + ";expires="+ new Date(date.getTime() - date.getTimezoneOffset()).toUTCString() + ";Domain=.toronto.ca;Path=/";
		document.cookie = this.cookie.account + "=" + this.accountnumber + ";expires="+ new Date(date.getTime() - date.getTimezoneOffset()).toUTCString() + ";Domain=.toronto.ca;Path=/";
		this.loadDataSets();
	}
}
App.prototype.accountdetails_success = function(data) {
	if (data) {
		if (data.resultCode==200) { 
			this.accountdetails = data;
			
			var ml = this.accountdetails.premiseList[0].meterList;
			var o = this;
			var arrDelete = [];
			
			//DELETE ALL METERS THAT HAVE NO READING DATE
			$.each(ml, function(i,mlItem) {
				if(mlItem.lastReadDate=="2014-12-31") {
				
				}
			
				if (mlItem.firstReadDate==null) {
					arrDelete.push(i);
				}
				if(mlItem.firstReadDate=="2014-12-31") {
					mlItem.firstReadDate="2015-01-01";
				}
			});
			for (var mcount=0; mcount < arrDelete.length; mcount++) {
				o.accountdetails.premiseList[0].meterList.splice(arrDelete[mcount] - mcount, 1);
			}
			//*******************************************
			
			this.accountdetailsloaded.resolve( true );
			this.accountdetails.formattedaccountno = this.accountdetails.account.substring(0,9) + "-" + this.accountdetails.account.substring(9,18) + "-" + this.accountdetails.account.substring(18,20);
			var ml = data.premiseList[0].meterList;
			var arrClassPriority = {'MASTER' : 700, 'DEDUCT' : 600, 'COMPOUNDHIGH' : 500, 'COMPOUNDLOW' : 400, 'COMPOUNDMAIN' : 300, 'NORMAL' : 200, 'INVALID' : 100 };
			ml.sort(function(a, b){	return arrClassPriority[a.meterClass] - arrClassPriority[b.meterClass];})
			this.accountdetails.premiseList[0].meterList = ml;
			this.selectedMeter = 0;

			if (this.context == "hourly") {
				this.axis.temp = false;
				this.axis.precip = false;
			}
			this.loadDataSets();
		} else {
			this.displayError("Account Details Lookup Error", data.validateResponse.errorMessage);
		}	
	} else {
		this.displayError("Account Details Lookup Error", "The system could not find your account details.  Please call 311 to find out information for this account.");
	}
}
App.prototype.groupconsumption_success = function(data) {
	if (data) {
		this.groupconsumption = data;
		this.groupconsumptionloaded.resolve( true );
	} else {
		this.groupconsumption = "Not Available";
	}	
	this.loadDataSets();
}
App.prototype.consumption_success = function(data) {
	if (data) {
		this.consumption = data;
		this.consumptionloaded.resolve( true );
		this.loadDataSets();	
	} else {
		this.displayError("Water Consumption Lookup Error", "The system could not find your water consumption details.  Please call 311 to find out information for this account.");
	}	
}
App.prototype.weather_success = function(data) {
	if (data) {
		this.weather = data;
		this.weatherloaded.resolve( true );
		this.loadDataSets();	
	} else {
		this.weather = "Not Available";
	}	
}


//DATE UTILS
App.prototype.getMinDate = function getMinDate() {
	var sDate;
	if (this.selectedDate) {
		var dt = this.selectedDate;
		var YY = dt.getFullYear().toString();
		var MM = (dt.getMonth() < 9) ? "0" + (dt.getMonth()+ 1).toString() : (dt.getMonth()+ 1).toString().toString();
		var DD = (dt.getDate() < 10) ? "0" + dt.getDate().toString() : dt.getDate().toString();
		sDate = YY + "-" + MM + "-" + DD;
	} else {
		var dt = new Date(this.accountdetails.premiseList[0].meterList[this.selectedMeter].lastReadDate);
		var YY = dt.getFullYear().toString();
		var MM = (dt.getMonth() < 9) ? "0" + (dt.getMonth()+ 1).toString() : (dt.getMonth()+ 1).toString().toString();
		var DD = (dt.getDate() < 10) ? "0" + dt.getDate().toString() : dt.getDate().toString();
		sDate = YY + "-" + MM + "-" + DD;
	}
	var sDay = (this.context == "hourly") ? sDate.substring(8,10) : "01";
	var sMonth = (this.context != "monthly") ? sDate.substring(5,7) : "01";
	var sYear =  sDate.substring(0,4)
	return sDate.substring(0,4) + "-" + sMonth + "-" + sDay;
}
App.prototype.getMaxDate = function() {
	var sDate;
	if (this.selectedDate) {
		var dt = this.selectedDate;
		var YY = dt.getFullYear().toString();
		var MM = (dt.getMonth() < 9) ? "0" + (dt.getMonth()+ 1).toString().toString() : (dt.getMonth()+ 1).toString().toString();
		var DD = (dt.getDate() < 10) ? "0" + dt.getDate().toString() : dt.getDate().toString();
		sDate = YY + "-" + MM + "-" + DD;
	} else {
		var dt = new Date(this.accountdetails.premiseList[0].meterList[this.selectedMeter].lastReadDate);
		var YY = dt.getFullYear().toString();
		var MM = (dt.getMonth() < 9) ? "0" + (dt.getMonth()+ 1).toString() : (dt.getMonth()+ 1).toString();
		var DD = (dt.getDate() < 10) ? "0" + dt.getDate().toString() : dt.getDate().toString();
		sDate = YY + "-" + MM + "-" + DD;
	}
	var sDay, sMonth, sYear, nMonth;
	var arrMonth = [" ", "31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"];
	if (this.context == "hourly") {
		sDay = sDate.substring(8,10);
		sMonth = sDate.substring(5,7);
		sYear =  sDate.substring(0,4);
	}
	if (this.context == "daily" || this.context == "weekly") {
		sMonth = sDate.substring(5,7);
		sYear =  sDate.substring(0,4);
		sDay = arrMonth[parseInt(sMonth)];
	}
	if (this.context == "monthly") {
		sMonth = "12";
		sYear =  sDate.substring(0,4);
		sDay = "31";
	}
	return sYear + "-" + sMonth + "-" + sDay;
}
App.prototype.getDate = function(sDate) {
	var sDay = (this.context == "hourly") ? sDate.substring(8,10) : "01";
	var sMonth = (this.context != "monthly") ? sDate.substring(5,7) : "01";
	var sYear =  sDate.substring(0,4)
	//return sMonth + "/" + sDay + "/" + sDate.substring(0,4);
	return new Date(parseInt(sDate.substring(0,4)), parseInt(sMonth) - 1, parseInt(sDay));
}



//USER INTERACTION
App.prototype.meterSelect = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Multiple Meter Selection');
	this.selectedMeter = $("#wuMeterSelect")[0].selectedIndex;
	if (this.accountdetails.premiseList[0].meterList[this.selectedMeter].intervalMins == "360") { $($("#datecontextinput option")[0]).text("Six Hour – Consumption") } else { $($("#datecontextinput option")[0]).text("Hourly"); }
	
	delete this.consumption;
	//delete this.groupconsumption;
	delete this.weather;
	delete this.consumptionloaded;
	delete this.weatherloaded;
	//delete this.groupconsumptionloaded;
	this.getConsumption();
}
App.prototype.previousPeriod = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Graph Previous Period');
	var arrMonth = ["31","31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30"];
	var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
	switch (this[this.context].contextsingle) {
		case "Day":
			dt.setDate( dt.getDate() - 1 );
			break;
		case "Month":
			dt.setDate( dt.getDate() - parseInt(arrMonth[dt.getMonth()]) );
			break;
		case "Year":
			dt.setFullYear( dt.getFullYear() - 1 );
			break;
	}
	app.selectedDate = dt;
	$("#daterangeinput").data("DateTimePicker").date(dt);
}
App.prototype.nextPeriod = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Graph Next Period');
	var arrMonth = ["31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"];
	var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
	switch (this[this.context].contextsingle) {
		case "Day":
			dt.setDate( dt.getDate() + 1 );
			break;
		case "Month":
			dt.setDate( dt.getDate() + parseInt(arrMonth[dt.getMonth()]) );
			break;
		case "Year":
			dt.setFullYear( dt.getFullYear() + 1 );
			dt.setMonth( 0 );
			break;
	}
	app.selectedDate = dt;
	$("#daterangeinput").data("DateTimePicker").date(dt);
}
App.prototype.dateSelect = function (e) {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','Date Selection');
	this.deactivateGraph();
	app.selectedDate = new Date(e.date);
	delete app.consumption;
	//delete app.groupconsumption;
	delete app.weather;
	delete app.consumptionloaded;
	delete app.weatherloaded;
	//delete app.groupconsumptionloaded;
	if (getCookie(this.cookie.api)==null || getCookie(this.cookie.account) == null) {
		this.showSection(this.selectors.verification, this.initVerification);
	} else {
		this.loadDataSets();
	}
	if ( $("#daterangeinput").is(":focus") ) { $( "#daterange button" ).focus();}
	scrollToSection("waterchartdisplay");
}
App.prototype.setContext = function() {
	this.context = $( this.selectors.datecontext ).val().toLowerCase();
	switch ( app.context ) {
		case "monthly" :	
			$("#daterangebtn").attr("data-original-title", "Select a new year to view your water use for.");
			break;
		case "weekly" :		
			$("#daterangebtn").attr("data-original-title", "Select a new month to view your water use for.");
			break;
		case "daily" :	
			$("#daterangebtn").attr("data-original-title", "Select a new month to view your water use for.");
			break;
		case "hourly":		
			$("#daterangebtn").attr("data-original-title", "Select a new day to view your water use for.");
			break;
	}
	delete app.selectedDate;
	this.refreshChart();
	scrollToSection("waterchartdisplay");
}
App.prototype.graphClick = function(e) {
	var r, c;
	if (app.chart.getSelection().length == 1) {
		r = app.chart.getSelection()[0].row;
		c = app.chart.getSelection()[0].column;
		var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
		switch ( app.context ) {
			case "monthly" :
				dt = new Date( dt.setMonth( r ) );
				app.context = "weekly";
				$( "#datecontextinput" ).val("Weekly");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', false);
				break;
			case "weekly" :
				app.context = "daily";
				$( "#datecontextinput" ).val("Daily");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', false);
				break;
			case "daily" :
				dt = new Date( dt.setDate( r + 1) );
				app.context = "hourly";
				$( "#datecontextinput" ).val("Hourly");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', true);
				break
		}
		app.selectedDate = dt;
		app.refreshChart();
	}
}
App.prototype.tableClick = function(e) {
	var r, c;
	if (app.table.getSelection().length == 1) {
		r = app.table.getSelection()[0].row;
		c = app.table.getSelection()[0].column;
		if (!this.consumption.summary.intervalList[ r ].intConsumptionTotal) {return;}
		var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
		switch ( app.context ) {
			case "monthly" :
				dt = new Date( dt.setMonth( r ) );
				app.context = "weekly";
				$( "#datecontextinput" ).val("Weekly");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', false);
				break;
			case "weekly" :
				app.context = "daily";
				$( "#datecontextinput" ).val("Daily");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', false);
				break;
			case "daily" :
				dt = new Date( dt.setDate( r + 1) );
				app.context = "hourly";
				$( "#datecontextinput" ).val("Hourly");
				$( "#chartzoomout" ).prop('disabled', false);
				$( "#chartzoomin" ).prop('disabled', true);
				break
		}
		app.selectedDate = dt;
		app.refreshChart();
	}
}
App.prototype.zoomIn = function() {
	var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
	switch ( app.context ) {
		case "hourly" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', true);
			break;
		case "monthly" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', false);
			$( "#datecontextinput" ).val("Weekly");
			app.context = "weekly";
			break;
		case "weekly" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', false);
			$( "#datecontextinput" ).val("Daily");
			app.context = "daily";
			break;
		case "daily" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', true);
			$( "#datecontextinput" ).val("Hourly");
			app.context = "hourly";
			break
	}
	app.selectedDate = dt;
	$( ".popover" ).removeClass( "in" ); 
	app.refreshChart();
}
App.prototype.zoomOut = function() {
	var dt = new Date($("#daterangeinput").data("DateTimePicker").date());
	switch ( app.context ) {
		case "monthly" :
			$( "#chartzoomout" ).prop('disabled', true);
			$( "#chartzoomin" ).prop('disabled', false);
			break;
		case "hourly" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', false);
			$( "#datecontextinput" ).val("Daily");
			app.context = "daily";
			break;
		case "weekly" :
			$( "#chartzoomout" ).prop('disabled', true);
			$( "#chartzoomin" ).prop('disabled', false);
			$( "#datecontextinput" ).val("Monthly");
			app.context = "monthly";
			break;
		case "daily" :
			$( "#chartzoomout" ).prop('disabled', false);
			$( "#chartzoomin" ).prop('disabled', false);
			$( "#datecontextinput" ).val("Weekly");
			app.context = "weekly";
			break
	}
	app.selectedDate = dt;
	$( ".popover" ).removeClass( "in" ); 
	app.refreshChart();
}
App.prototype.refreshChart = function() {
	delete app.consumption;
	//delete app.groupconsumption;
	delete app.weather;
	delete app.consumptionloaded;
	delete app.weatherloaded;
	//delete app.groupconsumptionloaded;
	if (getCookie(this.cookie.api)==null || getCookie(this.cookie.account) == null) {
		this.showSection(this.selectors.verification, this.initVerification);
	} else {
		this.loadDataSets();
	}
}
App.prototype.viewStatement = function() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','2','WT.conv_type','View Statement');
	$(app.selectors.modalLabel).html( 'Utility Account Statement' ); 
	$(app.selectors.modalBody).html( '<div id="utilitystatement"><div id="loadingmsg">Loading<br/><img src="/static_files/assets/images/loading.gif" alt="Loading animation"/></div></div>' ); 
	$(app.selectors.modal).modal();
	
	var aNum = $("#accountnum").val();
	var strURL = "https://secure.toronto.ca/cc_api/svcaccount_v1/UtilityAccount/" + getCookie(this.cookie.account) + "?callback=jsonpCallback";
	$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});	 
}
//*************************************  END APP CLASS  ***************************************************


//*************************************  START API CLASS  ***************************************************
var API = function(app, sOperation, fSuccess, fError) {
	this.contentType = 'application/x-www-form-urlencoded';
	this.url = app.apiHost + '/' + sOperation;
	this.fsuccess = fSuccess,
	this.ferror = fError;
	this.crossDomain = true;
	this.dataType = "json";
	this.app = app;
}
API.prototype.GET = function() {
	$.ajax({
		type: 'GET',
		api: this,
		url: this.url,
		dataType: this.dataType,
		success: function (data) {
			this.api.fsuccess.call(this.api.app, data)
		},
		error: function (jqXHR, textStatus, errorThrown) {
			this.api.ferror.call(this.api.app, jqXHR, textStatus, errorThrown)
		}
	});
}
API.prototype.POST = function() {
	$.support.cors = true;
	var browser = navigator.userAgent;
	var IEversion = 99;
	if (browser.indexOf("MSIE") > 1) {IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}
	if (IEversion < 10) {
		xdr = new XDomainRequest();
		xdr.api = this;
		if (xdr) {
			xdr.onerror = function () {
				alert("error");
			};
			xdr.ontimeout = function () {
				alert("timeout");
			};
			xdr.onload = function () {
				this.api.fsuccess.call(this.api.app, JSON.parse(xdr.responseText));
			};
			xdr.timeout = 10000;
			xdr.open( 'POST', this.url + "?json=" + encodeURIComponent( this.data.substring(5, this.data.length) ) );
			xdr.send();
		} else {
			failpost();
		}
	} else {
		$.ajax({
			type:'POST', 
			api: this,
			contentType: this.contentType,
			url: this.url, 
			crossDomain: this.crossDomain,
			dataType: this.dataType,
			data: this.data,
			success: function (data) {
			this.api.fsuccess.call(this.api.app, data)
			},
			error: function (jqXHR, textStatus, errorThrown) {
				this.api.ferror.call(this.api.app, jqXHR, textStatus, errorThrown)
			}
		})
	}
}
//*************************************  END API CLASS  ***************************************************


//*************************************  START RUN  *******************************************************
var app = new App();
$(document).ready(function() {
	//TEMP CODE TO MAKE SURE IE9 TESTING GOES OK
	var browser = navigator.userAgent;
	var IEversion = 99;
	if (browser.indexOf("MSIE") > 1) {IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}

	app.start();
	$( window ).resize(function() {
		if (this.dt) {
			app.createGraph();
		}
	});
});
google.load('visualization', '1', {packages: ['corechart', 'bar', 'table']});
google.setOnLoadCallback(app.initGraph);
//*************************************  END RUN  *******************************************************



//*************************************  START UILITIES  *******************************************************
Date.prototype.addDays = function(days){
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
function numberWithCommas(x) {
	if (x==null) {return "";}
	x = parseFloat(x).toFixed(3);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function scrollToSection(aid){
    var aTag = $("section[id='"+ aid +"']");
    $('html,body').animate({scrollTop: aTag.offset().top - 65},'slow');
}
function textToDate(strDt) {
	var YY = parseInt(strDt.substring(0,4));
	var MM = parseInt(strDt.substring(5,7)) - 1;
	var DD = parseInt(strDt.substring(8,10));
	var HR = parseInt(strDt.substring(11,13));
	var MIN = parseInt(strDt.substring(14,16));
	var SEC = parseInt(strDt.substring(17,19));
	return new Date(YY, MM, DD,HR,MIN,SEC,0);
}
function removeCookie( key ) {
	document.cookie = key + "=null;expires=Thu, 01 Jan 1970 00:00:01 GMT;Domain=.toronto.ca;Path=/";
}
//*************************************  END UILITIES  *******************************************************
function loadAccount(strAccNo, strLastName, strPostal, strMethod) {
	$( "#accountnum" ).val( strAccNo );
	$( "#lastname" ).val( strLastName );
	$( "#postalcode" ).val( strPostal );
	$( "#paymentmethod" ).val( strMethod );
}

function getFullAcctNumber() {
	var aNum = $("#accountnum").val();
	var cNum = $("#clientnum").val().replace(' ','-');
	if (cNum.length==11) {cNum = cNum.substring(0,9) + "-" + cNum.substring(9,11);}
	return aNum + "-" + cNum;
}

//********************************************************************
//AFTER THE SECOND REST API CALL, PAINT THE UTILITY BILL ON THE WEB PAGE
function jsonpCallback(data) {

	if (data.ServiceAccount != null) {
		var item = data.ServiceAccount[0];
		var strHTML = "";

		//GET THE ADDRESS
	    var strAddress = "";
	    $.each(item.AccountServiceLocations.Address, function(i,add) {
			var strUnit = "";
			strUnit += (add.UnitNumber.trim() !="" && add.UnitNumber!=" ") ? add.UnitNumber : "";
			strUnit += (add.UnitDesignator.trim() !="" && add.UnitDesignator!=" ") ? add.UnitDesignator : "";
			strAddress += (strUnit.trim() =="") ? "" : strUnit + "-";
			strAddress += (add.Number!="") ? add.Number : "";
			strAddress += (add.StreetName!="") ? add.StreetName + " " : "";
			strAddress += (add.StreetTypeABBRV!="") ? add.StreetTypeABBRV + " " : "";
			strAddress += (add.StreetDirectionABBRV!="") ? add.StreetDirectionABBRV + " " : "";
		});

		//GET THE ACCOUNT NUMBER
	    var strAccountNo = getCookie(app.cookie.account);

		//GET THE OWNER
	    var strOwnerName="";
	    strOwnerName += (item.AccountParty[0].Party.PersonalName.FirstName == null) ? "" : item.AccountParty[0].Party.PersonalName.FirstName + " ";
	    strOwnerName += (item.AccountParty[0].Party.PersonalName.LastName == null) ? "" : item.AccountParty[0].Party.PersonalName.LastName;
		strOwnerName = (strOwnerName == "" && item.AccountParty[0].Party.BusinessName != null) ? item.AccountParty[0].Party.BusinessName : strOwnerName;


	    //GET THE ATTRIBUTES
	    var strAmountDue;
	    var strAmountDueIfEarly = "N/A";
	    var strDueDate = "&nbsp;";
	    var strPrevBillDate = "&nbsp;", strPrevBilling = "&nbsp;", strPrevPaymentDate = "&nbsp;", strPaymentAmount = "&nbsp;", strEarlyPayment = "&nbsp;";
	    var strBillFreq = "Not Available", strPreAuth = "No", strAgentAgree = "No", strEPost = "No";
	    var intBillNotSched = false;
        $.each(item.Attribute, function(i,att) {
			switch (att.AttributeGroup) {
			case "AGENT":
				strAgentAgree = (att.body=="Y") ? "Yes" : "No";
				break;
			case "EPOST_ENROL":
				strEPost = (att.body=="Y") ? "Yes" : "No";
				break;
			case "EARLY_PAYMENT_DISCOUNT":
				strEarlyPayment = att.body;
				break;
			case "AMOUNT_DUE_PRIOR_DUEDATE":
				strAmountDueIfEarly = att.body;
			case "TOTAL_AMOUNT_DUE":
				strTotalNowDue = att.body;
				break;
			case "LAST_BILL_AMOUNT":
				strPrevBilling = att.body;
				break;
			case "PAYMENT_PROGRAM":
				strPreAuth = (att.body=="") ? "N/A" : att.body;
				break;
			case "BILLING_FREQUENCY":
				strBillFreq = att.body;
				break;
			case "BILL_DUE_DATE":
				strDueDate = formatDate(att.body);
				break;
			case "LAST_BILL_DATE":
				strPrevBillDate = formatDate(att.body);
				break;
			case "LAST_PAYMENT_DATE":
				strPrevPaymentDate = formatDate(att.body);
				break;
			case "AMOUNT_DUE":
				strAmountDue = att.body;
				break;
			case "LAST_PAYMENT":
				strPaymentAmount = att.body;
				break;
			}
		});

		strAmountDue = (intBillNotSched) ? "" : strAmountDue;
		strEarlyPayment = (intBillNotSched) ? "" : strEarlyPayment;

		if (strTotalNowDue=="$0.00" || strTotalNowDue.substring(0,1) =="-") {
			intBillNotSched= true;
			strPrevBillDate = strDueDate;
			strPrevBilling = strAmountDue;
		}
        
		strHTML += '<div class="utilityInfo">';
		strHTML += '<div class="row">';
			strHTML += '<div class="blackLine"></div>';
			//UTILITY ACCOUNT DETAIL SECTION
			strHTML += '<div class="col-xs-12 col-sm-12 col-md-6 floatLeft">';	
				strHTML += '<h2><span>Utility Account Details</span></h2>';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Account Number' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strAccountNo + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Property Address' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strAddress + '</div>';
				strHTML += '</div>';	
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Owner/Agent Name' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strOwnerName + '</div>';
			strHTML += '</div>';				
	
			//BILLING PAYMENT DETAIL SECTION		
			strHTML += '<div class="col-xs-12 col-sm-12 col-md-6 floatRight">';	
				strHTML += '<h2><span>Previous Billing/Payment Details</span></h2>';
				if (intBillNotSched) {
						strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Previous Due Date</div>';
					} else {
						strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Previous Bill Date</div>';
				}
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strPrevBillDate + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Previous Billing</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strPrevBilling + '</div>';
				strHTML += '</div>';	
				
				if (intBillNotSched) {				
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Last Payment Received</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strPrevPaymentDate + '</div>';
					strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Early Payment Discount</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strEarlyPayment + '</div>';	
					strHTML += '</div>';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Amount due if payment received prior to due date</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strAmountDueIfEarly + '</div>';						
				}
				
				if (!intBillNotSched) {
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Last Payment Received</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strPrevPaymentDate + '</div>';
				}
				strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Payment Amount</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strPaymentAmount + '</div>';
				strHTML += '</div>';
					
			strHTML += '</div>';

			//BILLING PREFERENCES SECTION
			strHTML += '<div class="col-xs-12 col-sm-12 col-md-6 floatLeft">';	
				strHTML += '<h2><span>Billing Preferences</span></h2>';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Billing Frequency' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strBillFreq +'</div>';
				strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Pre-authorized Payments' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strPreAuth + '</div>';
				strHTML += '</div>';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'Agent Agreement' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strAgentAgree + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
				strHTML += '<div class="col-xs-12 col-sm-8 col-md-6 textBold">' + 'ePost Electronic Billing' + '</div>';
				strHTML += '<div class="col-xs-12 col-sm-4 col-md-6 space">' + strEPost + '</div>';
				strHTML += '</div>';
			strHTML += '</div>';
			
			//CURRENT BILLING SECTION
			strHTML += '<div class="col-xs-12 col-sm-12 col-md-6 floatRight">';	
				strHTML += '<h2><span class="redSquare">Current Billing</span></h2>';
				//ADD LOGIC TO PRINT OUT THE DUE DATE OR BILLING NOT YET SCHEDULED MESSAGE
				if (intBillNotSched) {
					strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 textRed">Billing Not Yet Scheduled</div>';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold red">Total amount due now</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 red space">' + strTotalNowDue + '</div>';
				} else {
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Due Date</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strDueDate + '</div>';
					strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Amount Billed</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strAmountDue + '</div>';
					strHTML += '</div>';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Early Payment Discount</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strEarlyPayment + '</div>';
					strHTML += '<div class="col-xs-12 col-sm-12 col-md-12 grayBG">';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold">Amount due if payment received prior to due date</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 space">' + strAmountDueIfEarly + '</div>';
					strHTML += '</div>';
					strHTML += '<div class="col-xs-12 col-sm-8 col-md-8 textBold red">Total amount due now</div>';
					strHTML += '<div class="col-xs-12 col-sm-4 col-md-4 red space">' + strTotalNowDue + '</div>';	
					strHTML += '<div id="makepayment"><a class="btnbs btn-primary" title="Make a payment" href="/wps/portal/contentonly?vgnextoid=86662f4dd9a6e410VgnVCM10000071d60f89RCRD&amp;vgnextchannel=01b755ab0e9b1410VgnVCM10000071d60f89RCRD">Make a Payment Online</a></div>';
				}				
			strHTML += '</div>';	
			
		strHTML += '</div>';
		strHTML += '</div>';
		$( '#utilitystatement' ).html( strHTML );
	} else {
		$( '#utilitystatement' ).html( "<h2>Error</h2><p>Please refresh your web browser and try again.</p>" );
	}
}

function formatDate(strDate) {
	var arrMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var yyyy = strDate.substring(0,4);
	var mm = strDate.substring(5,7);
	var dd = parseInt(strDate.substring(8,10));
	var strNew = arrMM[parseInt(mm) - 1] + " " + dd + " " + yyyy;
	return strNew;
}