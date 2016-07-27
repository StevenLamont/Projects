//AUTHOR: ROB WILLIAMS
var strAPIHost= "https://secure.toronto.ca/cc_api/svcaccount_v1/UtilityAccount";  //THE API URL
var idForm = "utilityForm"; //THE ID OF THE FORM
var idUtilityBill = "utilityInfo"; //THE ID OF THE UTILITY BILL DIV ELEMENT
var idAccountNo = "accountnum"; //THE ID OF THE ACCOUNT NUMBER INPUT CONTROL
var idLastName = "lastname"; //THE ID OF THE LAST NAME INPUT CONTROL
var idPostalCode = "postalcode"; //THE ID OF THE POSTAL CODE INPUT CONTROL
var idPaymentMethod = "paymentmethod"; //THE ID OF THE PAYMENT METHOD SELECT CONTROL
var idFormButton = "singlebutton"; //THE ID OF THE FORM SUBMIT BUTTON
var idUtilityAnchor = "topofutilityaccount"; //THE BOOKMARK ANCHOR THAT REPRESENTS THE START OF THE UTILITY BILL
var legalAgree = false;

function showTermsAndConditions() {
	$("#appDisplay").load('/static_files/WebApps/Utility%20Lookup/utilitylookup.html #termsandconditions');
}

function validateForm() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Utility Account Lookup');
	$('#' + idForm).data('bootstrapValidator').validate();
}

//***************************************************
//SET THE FORM VALIDATION UPON THE JQUERY READY EVENT
function initApp() {
	$.support.cors = true;

    $('#' + idForm).bootstrapValidator({
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',invalid: 'glyphicon glyphicon-remove',
            //submitButtons: '#' + idFormButton,
            validating: 'glyphicon glyphicon-refresh'
        },
		
        //DISPLAY THE UTILITY BILL UPON SUCCESSFUL FORM SUBMISSION
        onSuccess: function(e) {displayUtility();},
		onError: function(e) {
				$($(".has-error input, .has-error select")[0]).focus();
		},
        fields: {accountnum: {message: 'Please enter the full utility account number (#########-#########-0#).  This number can be found on the top right corner of your utility bill.',
                validators: {notEmpty: {message: 'The utility account number is required and cannot be left blank'},
                    regexp: {regexp: /(^(\d{9})[-](\d{9})[-][0](\d{1})$)|(^(\d{9})(\d{9})[0](\d{1})$)/,                  
                    message: 'The utility account number must be in the format #########-#########-0# (with or without dashes)'}}},
            lastname: {message: 'Please enter the last name on the utility account.',
              validators: {notEmpty: {message: 'The last name field is required and cannot be left blank'}}},
            paymentmethod: {message: 'Please select your last payment method for the utility account.',
              validators: {notEmpty: {message: 'The last payment method must be specified'}}},
            postalcode: {message: 'Please enter the postal code for the property on the utility account.',
               validators: {
				   //notEmpty: {message: 'The property postal code field is required and cannot be left blank'},
                   regexp: {regexp: /^[ABCEGHJKLMNPRSTVXYZabcdefghijklmnopqrstuvwxyz]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$/,
                   message: 'The postal code must be in a format of A#A #A#'}}}}})


	//ENSURE THAT THE ENTER KEY WILL TRIGGER THE LOOKUP WHEN THE USER IS FOCUSSED ON AN INPUT BOX
	$('input').keydown( function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { validateForm(); }
    });
}

function showApp() {
	var strP = Math.random().toString(36).substring(7);
	$("#appDisplay").load('/static_files/WebApps/Utility%20Lookup/utilitylookup.html?rnd=' + strP + ' #utilitylookupapplication', function() {initApp();});
}


function utilityAgree() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Agree');
	document.cookie = "utilityagreement=agree; path=/";
	document.cookie = "waterterms=agree; path=/";
	showApp();
}

function utilityDisagree() {
	dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','0','WT.conv_type','Terms and Conditions Disagree');
	document.location.href="/wps/portal/contentonly?vgnextoid=f554fc2beecb1410VgnVCM10000071d60f89RCRD";
}

//********************************************************************
//PRESENT A GENERIC ERROR MESSAGE TO THE USER
function failPost() {
    $("#serviceModalLabel").html("Lookup Failed");
    $("#serviceModalBody").html("The utility lookup function is currently not working.  Please try back later.");
    $("#serviceModal").modal();
    $("#" + idUtilityBill).addClass("hide");
}

function timeout() {
    $("#serviceModalLabel").html("Timeout");
    $("#serviceModalBody").html("The utility lookup function took to long to process your request.  Please try back later.");
    $("#serviceModal").modal();
    $("#" + idUtilityBill).addClass("hide");
}

//********************************************************************
//ONCE THE FIRST REST API REQUEST IS MADE, PROCESS THE RESULTS AND
//MAKE THE SECOND REQUEST TO GET THE UTILITY BILL INFORMATION
function processToken(data, b) {
    if (data["validateResponse"]["status"] == "FAILURE") {
		//IF THE RESPONSE CONTAINS AN ERROR PRESENT IT TO THE USER IN A MODAL POPUP
        $("#serviceModalLabel").html("Lookup Failed");
        $("#serviceModalBody").html(data["validateResponse"]["errorMessage"]);
        $("#serviceModal").modal();
        $("#" + idUtilityBill).addClass("hide");
		dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Account Validation Error');
    } else {
		//PERFORM THE SECOND RESP API CALL
        var aNum = $("#accountnum").val();
		if (aNum.length==20) {aNum = aNum.substring(0,9) + "-" + aNum.substring(9,18) + "-" + aNum.substring(18,20);}
        var strURL = strAPIHost + "/" + aNum + "?callback=jsonpCallback";
		var date = new Date();
		date.setTime(date.getTime() + (20 * 60 * 1000));
		document.cookie = "idmasvcaccountapi=" + data["validateResponse"]["refToken"] + ";expires="+ new Date(date.getTime() - date.getTimezoneOffset()).toUTCString() + ";Domain=.toronto.ca;Path=/";
		document.cookie = "accountnum=" + aNum + ";expires="+ new Date(date.getTime() - date.getTimezoneOffset()).toUTCString() + ";Domain=.toronto.ca;Path=/";
		$.ajax({type: 'GET',url: strURL,dataType: 'jsonp'});
    }
}

function IEProcessToken() {
	processToken(jQuery.parseJSON(xdr.responseText), "");
}
//********************************************************************
//THIS FUNCTION TAKES THE SUBMITTED FIELDS, CREATES A REST API REQUEST
//AND THEN PRESENTS THE USERS UTILITY BILL ON SCREEN
function displayUtility() {
	jQuery.support.cors = true;
	//DISPLAY A LOADING ICON TO LET THE USER KNOW THE APPLICATION IS RUNNING
	$("#" + idUtilityBill).html ("<div style='text-align: center;'><img alt='loading animation image' title='Please wait while the utility bill information is retrieved.' src='/static_files/assets/images/preload.gif'> Please wait while the utility bill information is retrieved.</div>");
	$("#" + idUtilityBill).removeClass("hide");
	scrollToAnchor(idUtilityAnchor);

	//GRAB THE ENTERED VARIABLE ON THE CURRENT WEB PAGE
	var aNum = $("#" + idAccountNo).val();
	var sNum = aNum.substring(0, 9);
	var lName = $("#" + idLastName ).val();
	var pCode = $("#" + idPostalCode).val();
	var pMethod = $("#" + idPaymentMethod).val();
	var strData = "";

	if (aNum.length==20) {aNum = aNum.substring(0,9) + "-" + aNum.substring(9,18) + "-" + aNum.substring(18,20);}

	//CREATE THE JSON REQUEST DATA STRING
	strData += '{"accountType": "UtilityAccount","accountNumber": "' + aNum  + '",';
	strData += '"QAList": [{"question":"SERVICE_NUMBER","answer": "' + sNum + '"},';
	strData += '{"question": "LAST_NAME","answer": "' + lName + '"}, ';
	strData += '{"question": "POSTAL_CODE","answer": "' + pCode + '"}, ';
	strData += '{"question": "LAST_PAYMENT_METHOD","answer": "' + pMethod + '"}]}';

	//MAKE A POST TO THE REST API SERVICE
	var strURL = strAPIHost + "/validate";

	var browser = navigator.userAgent;
	var IEversion = 99; //Give a default value for non-IE browsers

	if (browser.indexOf("MSIE") > 1) { //Detects if IE
		IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));
	}
	if (IEversion < 10) {
		xdr = new XDomainRequest();
		if (xdr) {
			xdr.onerror = failPost;
			xdr.ontimeout = timeout;
			xdr.onload = IEProcessToken;
			xdr.timeout = 10000;
			xdr.open('POST',strURL + '?validateRequest=' + encodeURIComponent(strData));
			xdr.send();
		} else {
			failpost();
		}
	} else {
		$.ajax({
			type: 'POST',
			url: strURL,
			crossDomain: true,
			dataType: 'json',
			data: 'validateRequest=' + strData,
			success: function (data) {
				processToken(data);
			},
			error: function (jqXHR, textStatus, errorThrown) {
			   failPost();
			}
		});
	}
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
	    var strAccountNo = $("#" + idAccountNo).val();

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
			strHTML += '<div id="mywatertoronto"><a class="btnbs btn-primary" title="View your water use" href="/wps/portal/contentonly?vgnextoid=8e0705351d881510VgnVCM10000071d60f89RCRD"><p class="title">MyWaterToronto</p><p>View your water consumption</p></a></div>'; 				
			strHTML += '</div>';	
			
		strHTML += '</div>';
		$("#" + idUtilityBill).html(strHTML);
		$("#" + idUtilityBill).removeClass("hide");

		//SCROLL TO THE START OF THE UTILITY BILL
    	scrollToAnchor(idUtilityAnchor);
	} else {
		failPost();
	}
}

function scrollToAnchor(aid){
    var aTag = $("a[name='"+ aid +"']");
    $('html,body').animate({scrollTop: aTag.offset().top},'slow');
}

function formatDate(strDate) {
	var arrMM = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	var yyyy = strDate.substring(0,4);
	var mm = strDate.substring(5,7);
	var dd = parseInt(strDate.substring(8,10));
	var strNew = dd + "-" + arrMM[parseInt(mm) - 1] + "-" + yyyy;
	return strNew;
}

$(document).ready(function() {
	if (document.location.protocol=="http:" && document.location.host=="www1.toronto.ca") {
		document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
	}
	var strCode="";
	strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
	strCode += '<link rel="stylesheet" href="/static_files/WebApps/Utility%20Lookup/utilitylookup.css">';
	strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
	strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
	strCode += '<script type="text/javascript" src="/static_files/assets/js/jquery.xdomainrequest.min.js"></script>';
	$("#appCode").html(strCode);
	if (getCookie("utilityagreement")!= "agree") {showTermsAndConditions();} else {showApp();}
})