//var strAPIHost= "https://secure.toronto.ca/cc_api/svcaccount_v1/UtilityAccount";
//var strAPIHost= "http://was8-inter-dev.toronto.ca/cc_api/svcaccount_v1/WaterAccount";
//var strAPIHost= "http://was8-inter-dev.toronto.ca/cc_api/svcaccount_v1/UtilityAccount";
var strAPIHost= "https://was-inter-qa.toronto.ca/cc_api/svcaccount_v1/WaterAccount";
var Account, Interface;
var arrClassPriority = new Object;
arrClassPriority['COMPOUNDMAIN'] = 100;
arrClassPriority['COMPOUNDLOW'] = 200;
var blnGraphLoaded = false;
var arrMM = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function showTermsAndConditions() {
	$("#appDisplay").load('/static_files/WebApps/Water%20Use/files/wateruse.html #termsandconditions');
}
function termsAgreement(btnFlag) {
	if (btnFlag == 1) {
		dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Agree');
		showVerificationScreen();
		document.cookie = "waterterms=agree; path=/";
	} else {
		dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Disagree');
		$("#appDisplay").load('/static_files/WebApps/Water%20Use/files/wateruse.html #termsandconditionsdisagree');
	}
}
function showVerificationScreen(blnFirstTime) {
	$("#appDisplay").load('/static_files/WebApps/Water%20Use/files/wateruse.html #utilitylookupapplication', function() {initVerificationScreen(blnFirstTime);});
}
function validateForm() {
	$('#wateruseVerificationForm').data('bootstrapValidator').validate();
}
function initVerificationScreen(blnFirstTime) {
		if (!blnFirstTime) {
				$("#APIError").html("Your session has timed out.  Please re-enter your account details in order to revalidate your credentials.");
				$("#APIError").removeClass("hide");
		} else {
				$("#APIError").addClass("hide");
		}
	    $('#wateruseVerificationForm').bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        onSuccess: function(e) {displayWaterUse();},
        fields: {accountnum: {message: 'Please enter the full utility account number (#########-#########-0#).  This number can be found on the top right corner of your utility bill.',
                validators: {notEmpty: {message: 'The utility account number is required and cannot be left blank'},
                    regexp: {regexp: /^(\d{9})[-](\d{9})[-][0](\d{1})$/,
                    message: 'The utility account number must be in the format #########-#########-0#'}}},
            lastname: {message: 'Please enter the last name on the utility account.',
              validators: {notEmpty: {message: 'The last name field is required and cannot be left blank'}}},
            paymentmethod: {message: 'Please select your last payment method for the utility account.',
              validators: {notEmpty: {message: 'The last payment method must be specified'}}},
            postalcode: {message: 'Please enter the postal code for the property on the utility account.',
               validators: {
                   regexp: {regexp: /^[ABCEGHJKLMNPRSTVXYZabcdefghijklmnopqrstuvwxyz]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$/,
                   message: 'The postal code must be in a format of A#A #A#'}}}}})
	$('input').keydown( function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { validateForm(); }
    });
}
function displayWaterUse() {
	$.support.cors = true;
	//GRAB THE ENTERD VARIABLE ON THE CURRENT WEB PAGE
	var aNum = $("#accountnum").val();
	var sNum = aNum.substring(0, 9);
	var lName = $("#lastname").val();
	var pCode = $("#postalcode").val();
	pCode = (pCode.length==6) ? pCode.substring(0,3) + " " + pCode.substring(3,6) : pCode;
	var pMethod = $("#paymentmethod").val();	
	var strData = '{"API_OP":"VALIDATE","ACCOUNT_NUMBER":"' + aNum + '","LAST_NAME":"' + lName + '"'
	strData += (pCode.length>0)? ' ,"POSTAL_CODE":"' + pCode + '"' : '';
	strData += ',"LAST_PAYMENT_METHOD":"' + pMethod + '"}';
	var oJSON = JSON.parse(strData);
	strData = "json=" + JSON.stringify(oJSON);
	
	//MAKE A POST TO THE REST API SERVICE
	var strURL = strAPIHost + "/validate";
	var browser = navigator.userAgent;
	var IEversion = 99; //Give a default value for non-IE browsers
	if (browser.indexOf("MSIE") > 1) {IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}
	if (IEversion < 10) {
	strURL = strURL + "?" + strData;
    $.ajax({
		type: 'POST', 
		contentType:'application/x-www-form-urlencoded', 
		url: strURL,
		success: function (data) {processToken(data);},
		error: function (jqXHR, textStatus, errorThrown) { displayError("Lookup Failed", "The utility lookup function is currently not working.  Please try back later.");}
    });
	} else {
		$.ajax({
			type:'POST', 
			contentType:"application/x-www-form-urlencoded",
			url: strURL, 
			crossDomain: true,
			dataType:"json",
			data:strData,
			success:function (data) {processToken(data);},
			error:function (jqXHR, textStatus, errorThrown) { displayError("Lookup Failed", "The utility lookup function is currently not working.  Please try back later.");}
		});
	}
}
function displayError(strTitle, strBody) {
	$("#serviceModalLabel").html(strTitle); $("#serviceModalBody").html(strBody); $("#serviceModal").modal();
}
function processToken(data, b) {
	if (data["validateResponse"]["status"]=="FAILURE") {
		displayError("Lookup Failed", data["validateResponse"]["errorMessage"]);
    } else {
		var date = new Date();
		date.setTime(date.getTime() + (30 * 60 * 1000));
		document.cookie = "idmasvcaccountapi=" + data["validateResponse"]["refToken"] + ";expires="+ date.toUTCString() + ";Domain=.toronto.ca;Path=/";
		document.cookie = "accountnum=" + $("#accountnum").val() + ";expires="+ date.toUTCString() + ";Domain=.toronto.ca;Path=/";	 
		getAccountDetails();
	}
}
//*****************************************************************************************************************************
//ACCOUNT DETAILS API
function getAccountDetails() {
	var strJSON = "json=" + encodeURIComponent('{"API_OP":"ACCOUNTDETAILS","ACCOUNT_NUMBER":"' + getCookie("accountnum") + '"}');
	var strURL = strAPIHost + "/accountdetails?" + strJSON;	
	$.ajax({type: 'GET',url: strURL,dataType: 'jsonp',
		success: function (data) {processAccountDetails(data);},
		error: function (jqXHR, textStatus, errorThrown) { displayError("Account Lookup Failed", "The utility lookup function is currently not working.  Please try back later.");}
	});
}
function processAccountDetails(data) {
	if (data["validateResponse"]!=null) {
		showVerificationScreen(false);
	} else {
		$("#appDisplay").load('/static_files/WebApps/Water%20Use/files/wateruse.html #waterusedisplay', function() {drawAccountDetails(data);});	
	}
}
//******************************************************************************************************************************


//*****************************************************************************************************************************
//GET CONSUMPTION API
//consumption?json={"API_OP":"CONSUMPTION","ACCOUNT_NUMBER":"«water account»","MIU_ID":"«miu»","START_DATE":"«start date»","END_DATE":"«end date»","INTERVAL_TYPE":"«interval type»"}
function getConsumption() {
	var mIndex = ($("#wuMeterMulti").hasClass("hide")) ? 0 : $("#wuMeterSelect")[0].selectedIndex;
	var ml = Account["Premise"][0]["meterList"][mIndex];
	var strMIU = ml["miu"];
	var strJSON = "json=" + encodeURIComponent('{"API_OP":"CONSUMPTION","ACCOUNT_NUMBER":"' + getCookie("accountnum") + '", "MIU_ID": "' + strMIU + '", "START_DATE": "' + Interface["MinDate"] + '", "END_DATE": "' + Interface["MaxDate"] + '", "INTERVAL_TYPE" : "' + Interface["PeriodType"] + '"}');
	var strURL = strAPIHost + "/consumption?" + strJSON;	
	$.ajax({type: 'GET',url: strURL,dataType: 'jsonp',
		success: function (data) {processConsumption(data);},
		error: function (jqXHR, textStatus, errorThrown) { displayError("Consumption Lookup Failed", "The utility lookup function is currently not working.  Please try back later.");}
	});
}
function processConsumption(data) {
	$(".usagesummary h2").html("Usage Summary for " + $('#daterangeinput').data('date'));
	$("#wuUserTotalLabel").html("My " + Interface["PeriodContext"] + " Total");
	$("#wuUserAverageLabel").html("My " + Interface["Interval"] + " Average");
	$("#wuUserTotal").html(numberWithCommas(data["summary"]["consumptionTotal"].toFixed(2)) + " m<sup>3</sup>");
	$("#wuUserAverage").html(numberWithCommas(data["summary"]["consumptionAvg"].toFixed(2)) + " m<sup>3</sup>");
	drawGraph(data);
}
function drawGraph(data) {
	var dt = new google.visualization.DataTable();
	var arrRows = [], arrRow= [];
	var tmpDate, tmpToDate, fDate;
	var options = [];
	switch(Interface["Interval"].toLowerCase()) {
		case "hourly":
			dt.addColumn('datetime', 'Hour of Day');
			dt.addColumn('number', 'Water Use (m^3)');	
			$.each(data["summary"]["intervalList"], function(i,ilItem) {
				tmpDate = new Date(ilItem["intStartDate"]);
				fDate = (tmpDate.getHours() > 12) ? (tmpDate.getHours() - 12).toString() + " p.m." : (tmpDate.getHours()).toString() + " a.m.";
				arrRow = [];
				arrRow.push({v: tmpDate, f: fDate});
				arrRow.push({v: ilItem["intConsumptionTotal"], f: numberWithCommas(ilItem["intConsumptionTotal"])});
				arrRows.push(arrRow);
			});
			dt.addRows(arrRows);
			options = {
				chart: {
					title: 'Hourly Water Use',
					subtitle: 'For ' + $('#daterangeinput').data('date')
				},
				height: 400,
				hAxis: {title: 'Hour of Day', format: 'ha'},
				vAxis: {title: 'Cubic Meters'}
			};
			break;
		case "daily":
			dt.addColumn('date', 'Day of Month');
			dt.addColumn('number', 'Water Use (m^3)');	
			$.each(data["summary"]["intervalList"], function(i,ilItem) {
				tmpDate = new Date(ilItem["intStartDate"]);
				fDate = arrMM[tmpDate.getMonth()] + " " + tmpDate.getDate();
				arrRow = [];
				arrRow.push({v: tmpDate, f: fDate});
				arrRow.push({v: ilItem["intConsumptionTotal"], f: numberWithCommas(ilItem["intConsumptionTotal"])});
				arrRows.push(arrRow);
			});
			dt.addRows(arrRows);
			options = {
				chart: {
					title: 'Daily Water Use',
					subtitle: 'For ' + $('#daterangeinput').data('date')
				},
				height: 400,
				hAxis: {title: 'Day of Month', format: 'MMM dd'},
				vAxis: {title: 'Cubic Meters'}
			};
			break;
		case "weekly":
			dt.addColumn('date', 'Week of Month');
			dt.addColumn('number', 'Water Use (m^3)');	
			$.each(data["summary"]["intervalList"], function(i,ilItem) {
				tmpDate = new Date(ilItem["intStartDate"]);
				tmpToDate = new Date(ilItem["intStartDate"]).addDays(6);
				fDate = "Week of " + arrMM[tmpDate.getMonth()] + " " + tmpDate.getDate();
				fDate += " to " + arrMM[tmpToDate.getMonth()] + " " + tmpToDate.getDate()
				arrRow = [];
				arrRow.push({v: tmpDate, f: fDate});
				arrRow.push({v: ilItem["intConsumptionTotal"], f: numberWithCommas(ilItem["intConsumptionTotal"])});
				arrRows.push(arrRow);
			});
			dt.addRows(arrRows);
			
			options = {
				chart: {
					title: 'Weekly Water Use',
					subtitle: 'For ' + $('#daterangeinput').data('date')
				},
				height: 400,
				hAxis: {title: 'Week of Month', format: 'MMM dd'},
				vAxis: {title: 'Cubic Meters'}
			};
			break;
		case "monthly":
			dt.addColumn('date', 'Month of Year');
			dt.addColumn('number', 'Water Use (m^3)');	
			$.each(data["summary"]["intervalList"], function(i,ilItem) {
				tmpDate = new Date(ilItem["intStartDate"]);
				fDate = arrMM[tmpDate.getMonth()];
				arrRow = [];
				arrRow.push({v: tmpDate, f: fDate});
				arrRow.push({v: ilItem["intConsumptionTotal"], f: numberWithCommas(ilItem["intConsumptionTotal"])});
				arrRows.push(arrRow);
			});
			dt.addRows(arrRows);
			options = {
				chart: {
					title: 'Monthly Water Use',
					subtitle: 'For ' + $('#daterangeinput').data('date')
				},
				height: 400,
				hAxis: {title: 'Month of Year', format: 'MMM'},
				vAxis: {title: 'Cubic Meters'}
			};
			break;
		default:
	}
	$.when( blnGraphLoaded ).then(function ( x ) {
		//var chart = new google.visualization.ComboChart(document.getElementById('waterchart'));
		//var chart = new google.charts.Combo(document.getElementById('waterchart'));
		var chart = new google.charts.Bar(document.getElementById('waterchart'));
		chart.draw(dt, google.charts.Bar.convertOptions(options));
		//var chart = new google.visualization.ColumnChart(document.getElementById('waterchart'));
		//chart.draw(dt, options);
	});
}
//******************************************************************************************************************************

//*****************************************************************************************************************************
//GET GROUP CONSUMPTION API
//groupconsumption?json={"API_OP":"GROUPCONSUMPTION","ACCOUNT_NUMBER":"«water account»","METERGROUP_ID":"«meterGroupId»","START_DATE":"«start date»","END_DATE":"«end date»","INTERVAL_TYPE":"«interval type»"}
function getGroupConsumption(strMG) {
	var strJSON = "json=" + encodeURIComponent('{"API_OP":"GROUPCONSUMPTION","ACCOUNT_NUMBER":"' + getCookie("accountnum") + '", "METERGROUP_ID": "' + strMG + '", "START_DATE": "' + Interface["MinDate"] + '", "END_DATE": "' + Interface["MaxDate"] + '", "INTERVAL_TYPE" : "' + Interface["PeriodType"] + '"}');
	var strURL = strAPIHost + "/consumption?" + strJSON;	
	$.ajax({type: 'GET',url: strURL,dataType: 'jsonp',
		success: function (data) {processGroupConsumption(data);},
		error: function (jqXHR, textStatus, errorThrown) { displayError("Consumption Lookup Failed", "The utility lookup function is currently not working.  Please try back later.");}
	});
}
function processGroupConsumption(data) {
	$("#wuCityAverageLabel").html("City " + Interface["Interval"] + " Average");
	if (data["Summary"]==null) {
		$("#wuCityAverage").html("Not Available");
	} else {
		$("#wuCityAverage").html(numberWithCommas(data["summary"]["consumptionAvg"].toFixed(2)) + " m<sup>3</sup>");
	}
}
//******************************************************************************************************************************


function drawAccountDetails(data) {
	var strMeterSelect = "";
	//LOAD THE ACCOUNT OBJECT
	Account = new Object;
	Account["Number"] = data["account"];
	Account["Premise"] = [];
	$.each(data["premiseList"], function(i,plItem) {Account["Premise"][i] = plItem;	});
	
	//SET THE OTHER REQUIRED VARIABLES
	Interface = new Object;
	Interface["Interval"] = $("#tabNavigation nav ul li.active").text().split(" ")[0];
	switch(Interface["Interval"].toLowerCase()) {
		case "hourly":
			Interface["SelectDateRangeLabel"] = "Select Day: ";
			Interface["PeriodType"] = "Hour";
			Interface["PeriodContext"] = "Daily";
			break;
		case "daily":
			Interface["SelectDateRangeLabel"] = "Select Month: ";
			Interface["PeriodType"] = "Day";
			Interface["PeriodContext"] = "Monthly";
			break;
		case "weekly":
			Interface["SelectDateRangeLabel"] = "Select Year: ";
			Interface["PeriodType"] = "Week";
			Interface["PeriodContext"] = "Yearly";
			break;
		case "monthly":
			Interface["SelectDateRangeLabel"] = "Select Year: ";
			Interface["PeriodType"] = "Month";
			Interface["PeriodContext"] = "Yearly";
			break;
		default:
			Interface["SelectDateRangeLabel"] = "Select Year: ";
			Interface["PeriodType"] = "Month";
			Interface["PeriodContext"] = "Yearly";
			
	}
	
	//DRAW THE SCREEN
	var strAddress = "";
	$("#wuTitle").html(Interface["Interval"] + " Water Use");
	$("#daterangelabel").html(Interface["SelectDateRangeLabel"]);
	$("#wuAccountNo").html(Account["Number"]);	
	$("#wuAddress").html(Account["Premise"][0]["address"]);
	
	var ml = Account["Premise"][0]["meterList"];
	if (ml.length==1) {
		$("#wuMeter").html(ml[0]["meterNumber"] + " - Installed on: " + ml[0]["meterInstallDate"]);
		$("#wuMeterMulti").addClass("hide");
		$("#wuMeterSingle").removeClass("hide");
	} else {
		ml.sort(function(a, b){
				return arrClassPriority[a["meterClass"]] - arrClassPriority[b["meterClass"]];
		})
		strMeterSelect += "<select id='wuMeterSelect' class='form-control' onchange='setDateLimits();'>";
		for (var mcount=0; mcount < ml.length; mcount++) {
			strMeterSelect += '<option value="' + ml[mcount]["miu"] + '">' + ml[mcount]["miu"] + " - Installed on: " + ml[mcount]["meterInstallDate"] + '</option>';
		}
		strMeterSelect += "</select>";
		$("#wuMeters").html(strMeterSelect);
		$("#wuMeterSingle").addClass("hide");
		$("#wuMeterMulti").removeClass("hide");
	}	
	setDateLimits();
	$.each(ml[0]["meterGroupList"], function(i,mglItem) {
		if (mglItem["meterGroupDesc"].toLowerCase().indexOf("whole city")>=0) {getGroupConsumption(mglItem["meterGroupId"]);};
	});
	
}
function setDateLimits() {
	var mIndex = ($("#wuMeterMulti").hasClass("hide")) ? 0 : $("#wuMeterSelect")[0].selectedIndex;
	var o = Account["Premise"][0]["meterList"][mIndex];
	switch(Interface["Interval"].toLowerCase()) {
		case "hourly":
			$('#daterangeinput').datetimepicker({viewMode: 'days',format: 'MMM DD, YYYY', minDate: getDate(o["firstReadDate"], "day"), maxDate: getDate(o["lastReadDate"], "day"), defaultDate: getDate(o["lastReadDate"], "day"), widgetPositioning: {vertical: 'bottom'}});
			Interface["MinDate"] = getMinDate(o["lastReadDate"], "day");
			Interface["MaxDate"] = getMaxDate(o["lastReadDate"], "day");
			break;
		case "daily":
			$('#daterangeinput').datetimepicker({viewMode: 'months',format: 'MMM YYYY', minDate: getDate(o["firstReadDate"], "month"), maxDate: getDate(o["lastReadDate"], "month"), defaultDate: getDate(o["lastReadDate"], "month"), widgetPositioning: {vertical: 'bottom'}});
			Interface["MinDate"] = getMinDate(o["lastReadDate"], "month");
			Interface["MaxDate"] = getMaxDate(o["lastReadDate"], "month");
			break;
		case "weekly":
			$('#daterangeinput').datetimepicker({viewMode: 'months',format: 'MMM YYYY', minDate: getDate(o["firstReadDate"], "month"), maxDate: getDate(o["lastReadDate"], "month"), defaultDate: getDate(o["lastReadDate"], "month"), widgetPositioning: {vertical: 'bottom'}});
			Interface["MinDate"] = getMinDate(o["lastReadDate"], "month");
			Interface["MaxDate"] = getMaxDate(o["lastReadDate"], "month");
			break;
		default:
			$('#daterangeinput').datetimepicker({viewMode: 'years',format: 'YYYY', minDate: getDate(o["firstReadDate"], "year"), maxDate: getDate(o["lastReadDate"], "year"), defaultDate: getDate(o["lastReadDate"], "year"), widgetPositioning: {vertical: 'bottom'}});
			Interface["MinDate"] = getMinDate(o["lastReadDate"], "year");
			Interface["MaxDate"] = getMaxDate(o["lastReadDate"], "year");
	}
	 $("#daterangeinput").on("dp.change", function (e) {
		var dt = e.date.toDate()
		var YY = dt.getFullYear().toString();
		var MM = (dt.getMonth() < 10) ? "0" + dt.getMonth().toString() : dt.getMonth().toString();
		var DD = (dt.getDate() < 10) ? "0" + dt.getDate().toString() : dt.getDate().toString();
		var p = (Interface["PeriodType"]=="Hour") ? "day" : (Interface["PeriodType"]=="Day" || Interface["PeriodType"]=="Week") ? "month" : "year";
		Interface["MinDate"] = getMinDate(YY + "-" + MM + "-" + DD, p);
		Interface["MaxDate"] = getMaxDate(YY + "-" + MM + "-" + DD, p);
        getConsumption();
     });
	getConsumption();
}
function getMaxDate(sDate, sPeriod) {
	var sDay, sMonth, sYear, nMonth;
	var arrMonth = [" ", "31", "28", "31", "30", "31", "30", "31", "31", "30", "31", "30", "31"];
	if (sPeriod=="day") {
		sDay = sDate.substring(8,10);
		sMonth = sDate.substring(5,7);
		sYear =  sDate.substring(0,4);
	}
	if (sPeriod=="month") {
		sMonth = sDate.substring(5,7);
		sYear =  sDate.substring(0,4);
		sDay = arrMonth[parseInt(sMonth)];
	}
	if (sPeriod=="year") {
		sMonth = "12";
		sYear =  sDate.substring(0,4);
		sDay = "31";
	}
	
	return sYear + "-" + sMonth + "-" + sDay;
}
function getMinDate(sDate, sPeriod) {
	var sDay = (sPeriod=="day") ? sDate.substring(8,10) : "01";
	var sMonth = (sPeriod!="year") ? sDate.substring(5,7) : "01";
	var sYear =  sDate.substring(0,4)
	return sDate.substring(0,4) + "-" + sMonth + "-" + sDay;
}
function getDate(sDate, sPeriod) {
	var sDay = (sPeriod=="day") ? sDate.substring(8,10) : "01";
	var sMonth = (sPeriod!="year") ? sDate.substring(5,7) : "01";
	var sYear =  sDate.substring(0,4)
	return sMonth + "/" + sDay + "/" + sDate.substring(0,4);
}
function numberWithCommas(x) {
	if (x==null) {return "";}
	x = parseFloat(x).toFixed(2);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}
function initGraph() {
	blnGraphLoaded= true;
}
Date.prototype.addDays = function(days)
{
    var dat = new Date(this.valueOf());
    dat.setDate(dat.getDate() + days);
    return dat;
}
$(document).ready(function() {
	if (document.location.protocol=="http:" && document.location.host=="www1.toronto.ca") {
		document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
	}
	var strCode="";
	strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
	strCode += '<link rel="stylesheet" href="/static_files/WebApps/Water Use/files/wateruse.css">';
	
	strCode += '<link rel="stylesheet" href="/static_files/assets/datepicker/bootstrap-datetimepicker.css">';
	strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
	strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/bootstrap-datetimepicker.js"></script>';
	
	strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
	
	strCode += '<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/jquery-ajaxtransport-xdomainrequest/1.0.1/jquery.xdomainrequest.min.js"></script>';
	strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';

	
	$("#appCode").html(strCode);
	if (getCookie("waterterms")!= "agree") {
		showTermsAndConditions();
	} else {
		if (getCookie("idmasvcaccountapi")==null || getCookie("accountnum")==null) {
			showVerificationScreen(true);
		} else {
			getAccountDetails();
		}
	}
});