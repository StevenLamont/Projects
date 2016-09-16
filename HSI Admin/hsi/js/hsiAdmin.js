//AUTHOR: ROB WILLIAMS/Steve Lamont
/* login in cot_login is too hard coded.. not using it yet.. maybe this is an easyt switch.

1) I add welcome to app_header.it probably should be in the template

2) A session by default is 30 minutues which is more than enough for this app. If the user try to edit a record and didn't update in 30 minutes, they will get an error.
   I currently do not allow them to re-login and continue. They need to start again.  We may need to re-visit this, but for this app, it isn't too bad. To fix properly'
   -- I would need to add logic to handle the a re-login vs an app init

 3) I'm using bootbox for alert.. but maybe sweetalert is better. (sweetalert requires an extra css file)
 
 4) If the user goes away over night.. the code tells them their session has expired.. I need a better way to clear the cookie when they leave if they don't logout.. but how?
  --> setCookie/getCookie are COT bootstrapCustomization functions. These cookies expire after 1 day.  
  --> maybe we should use sessionStorage so it goes away if the browser window is shutdown.
  --> For now we will treat this as a non-issue. 

  5) There is no webtrends tracking in here.. I assume it is not needed.
  

  
  ToDo:  the "success" of cot_form wasn't working for me.. but try again.. Now that I prevented default on submit, it may work as expected.

*/
var app = new cot_app("Human Services Integration - Administration Site");
var globalRuleNo;
var oRule = {};
var oSubRules = [];
var gblCC_API = new CC_API({apihost: "https://was8-intra-dev.toronto.ca"});

var APP_EVENT_TYPE = "HSI_Services_Benefits"; // this is really EventType
var APP_REPO_NAME = "HSI_Services_Benefits"; // this is the repo defined for the EventType (currently the same as eventType)
var gblRepoData;
var gblCurrentRowId = 0;
var gblCurrentListId = 0;

/* this rules array should be identical to the one in the finder app */
var rules = [
{"text": "Select Rule...", "value": ""},
{"text": "RESIDENT: Toronto Resident", "value": "Resident"},
{"text": "RESIDENT: Toronto Non-Resident", "value": "Non-Resident"},
{"text": "AGE: Age Group 1 (0-17)", "value": "Age 0-17"},
{"text": "AGE: Age Group 2 (18-29)", "value": "Age 18-29"},
{"text": "AGE: Age Group 3 (30-59)", "value": "Age 30-59"},
{"text": "AGE: Age Group 4 (60-65)", "value": "Age 60-65"},
{"text": "AGE: Age Group 5 (65+)", "value": "Age 65+"},
{"text": "LANGUAGE: English Preferred", "value": "English"},
{"text": "LANGUAGE: French Preferred", "value": "French"},
{"text": "FINANCIAL NEED: Yes", "value": "Financial Need"},
{"text": "FINANCIAL NEED: No", "value": "No Financial Need"},
{"text": "FINANCIAL NEED: Don't Know", "value": "Unsure Financial Need"},
{"text": "RECIPIENT: Ontario Works", "value": "OW"},
{"text": "RECIPIENT: Ontario Disability Support", "value": "ODSP"},
{"text": "RECIPIENT: Child Care Fee Subsidy", "value": "Child Care Fee Subsidy"},
{"text": "RECIPIENT: Subsidized Housing/Rent", "value": "Subsidized Housing"},
{"text": "RECIPIENT: Housing Allowance", "value": "Housing Allowance"},
{"text": "RECIPIENT: National Child Benefit Supplement", "value": "Child Beneift Supplement"},
{"text": "RECIPIENT: Employment Insurance", "value": "EI"},
{"text": "SCHOOL: Full-Time", "value": "FT Student"},
{"text": "SCHOOL: Part-Time", "value": "PT Student"},
{"text": "CHILDREN: All Age Groups", "value": "Has Children"},
{"text": "CHILDREN: Age Group 1 (0-2)", "value": "Child Ages 0-2"},
{"text": "CHILDREN: Age Group 2 (3-4)", "value": "Child Ages 3-4"},
{"text": "CHILDREN: Age Group 3 (5-6)", "value": "Child Ages 5-6"},
{"text": "CHILDREN: Age Group 4 (7-10)", "value": "Child Ages 7-10"},
{"text": "CHILDREN: Age Group 5 (11-12)", "value": "Child Ages 11-12"},
{"text": "CHILDREN: Age Group 6 (13-16)", "value": "Child Ages 13-16"},
{"text": "CHILDREN: Age Group 7 (17-18)", "value": "Child Ages 17-18"},
{"text": "EMPLOYMENT: Full-Time", "value": "Employed FT"},
{"text": "EMPLOYMENT: Part-Time", "value": "Employed PT"},
{"text": "EMPLOYMENT: Unemployed", "value": "Unemployed"},
{"text": "EMPLOYMENT: Retired", "value": "Retired"},
{"text": "EMPLOYMENT: Maternity", "value": "Mat-Leave"},
{"text": "EMPLOYMENT: Looking for Work", "value": "Looking-for-work"},
{"text": "EMPLOYMENT: Looking to Upgrade Skills","value": "Looking-to-upgrade"},
{"text": "INCOME: Range 1 (0 - 20K)","value": "Income 0-20K"},
{"text": "INCOME: Range 2 (20K - 50K)","value": "Income 20K-50K"},
{"text": "INCOME: Range 3 (50K - 80K)","value": "Income 50K-80K"},
{"text": "INCOME: Range 4 (80K - 100K)","value": "Income 80K-100K"},
{"text": "INCOME: Range 5 (100K +)","value": "Income 100K+"},
{"text": "HOUSING: Own","value": "Home Owner"},
{"text": "HOUSING: Rent","value": "Renter"},
{"text": "HOUSING: Homeless","value": "Homeless"},
{"text": "HOUSING: Risk of Eviction","value": "Eviction Risk"},
{"text": "HOUSING: Risk of Foreclosure","value": "Foreclosure Risk"},
{"text": "HOUSING: Looking for Housing","value": "Looking for Housing"},
{"text": "HEALTH NEED: Dental","value": "Dental Need"},
{"text": "HEALTH NEED: Medical","value": "Medical Need"},
{"text": "HEALTH NEED: Eye Care","value": "Eye Care Need"},
{"text": "HEALTH NEED: Assistive Device","value": "Assistive Device Need"},
{"text": "HEALTH NEED: Medication","value": "Medication Need"},
{"text": "HEALTH NEED: Special Diet","value": "Dietary Need"},
{"text": "HEALTH NEED: Pregnancy Care","value": "Pregnancy Care Need"},
{"text": "DISABILITY: Disability","value": "Disability"},
{"text": "DISABILITY: Mental Health Issue","value": "Mental Health"},
{"text": "DISABILITY: Addiction Issue","value": "Addiction"},
{"text": "OTHER: Domestic Violence","value": "Domestic Violence"},
{"text": "OTHER: Terminally Ill","value": "Terminally Ill"},
{"text": "OTHER: Conviction","value": "Conviction Issue"},
{"text": "OTHER: Funeral Cost","value": "Funeral Cost"}
];

/* Utility Functions */

function ApiAlert(errorData) {
    appAlert(errorData.type,errorData.error);
    if (errorData.expiredSession) {
        setTimeout(logout, 2000);
    }

}
function appAlert(title, msg) {

    bootbox.dialog({ title:  title , message: msg,buttons: { success: { label: "OK", className: "btn-success" }}});
}


/* Logging In-Out */
function showLogin() {
    $("#loginModal").modal();
}

function logout() {
    $.removeCookie('sid', { path: '/' });
    $.removeCookie('cot_uname', { path: '/' });
    location.reload();  
}
function setUserName() {
    var sName = getCookie("cot_uname");
    if (sName===null || sName == 'undefined') {
        $("#welcomemsg").html("<a onclick='showLogin()'>Login</a>");
    } else {
        $("#welcomemsg").html("<b>User Name</b>: " + getCookie("cot_uname") + " (<a onclick='logout()'>Logout</a>)" );
    }
}

function login() {

    $("#loginModal").modal('hide');
    var uname = $("#username").val();
    var pw = $("#password").val();
    
    gblCC_API.repoLogin(APP_EVENT_TYPE, uname, pw)
        .done(function(data) {
            if (getCookie('sid') !== null) {
                populatePage();
            }
        })
        .fail(function(errorData) { ApiAlert(errorData);});
}

/* application functions */
function updateCacheData(eventId, newData) {

    var payload = JSON.stringify(newData);
    $.each(gblRepoData, function(i, data) {
        if (data.id === eventId) {
            gblRepoData[i].payload = payload;
        }
    });
    //It is possible the title of the item changed, so update the listing
    var listEle = $("#hsilist div.listentry:eq(" + gblCurrentListId + ")").children().first();
    listEle.html(newData.title);
    showList(); // Return the user to the list.

}

function populatePage() {
    $("#app-content-top").load('html/hsi.html  #hsiadmin', function () {
        showExistingData();
        setUserName();
    });
}



function validateAndSubmitForm() {

    //dcsMultiTrack('WT.dl','31','WT.ti','','WT.conv','1','WT.conv_type','Utility Account Lookup', 'DCS.dcsaut', getCookie('cot_uname'));
    var valid = $('#hsi-form').data('bootstrapValidator').validate();
    console.log(valid.isValid());
    if (valid.isValid()) {
        submitData();
    }
}


function showExistingData() {
    var sHTML = "";
    var listId = 0;
    //gblCC_API.getRepoData(APP_EVENT_TYPE, APP_REPO_NAME , 'Yes', 0 ,100)
    gblCC_API.getRepoData(APP_EVENT_TYPE, null , 'Yes', 0 ,100)
        .done(function( repoData) {
            $.each(repoData, function(i, entry) {
                var row = JSON.parse(entry.payload);
                sHTML += '<div class="row listentry" data-listid="' + listId + '">';
                sHTML += '<div class="col-xs-12 col-sm-6 col-md-8">';
                sHTML += row.title;
                sHTML += '</div>';
                sHTML += '<div class="col-xs-12 col-sm-3 col-md-2"><button data-id="' + entry.id + '" class="btn btn-info editbtn"><span class="glyphicon glyphicon-edit"></span> Edit</button></div>';
                sHTML += '<div class="col-xs-12 col-sm-3 col-md-2"><button data-id="' + entry.id + '" class="btn btn-danger deletebtn"><span class="glyphicon glyphicon-remove"></span> Remove</button></div>';
                sHTML += '</div>';      
                listId++;
            });
            $("#hsilist").append(sHTML);
        })
        .fail(function(errorData) {
            ApiAlert(errorData);
        }); 
}


function setupEvents() {
    //$('input').keydown( function(e) {
    $("#hsiadmin").on("keydown", 'input', function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { validateAndSubmitForm(); }
    });
    $("#loginModal").on("keydown","input#username, input#password", function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { login(); }
    });
     $("#maincontent").on('submit','#hsi-form',function(event){
        console.log("Form Submission stoped.");
        event.preventDefault() ;
    }); 
    
    $("#maincontent").on("click","button.editbtn", function() {
        var dataId = $(this).data('id');
        var dataListId = $(this).parent().parent().data('listid');
        $.each(gblRepoData, function(i, data) {
            if (data.id === dataId) {
                showForm( dataId,  dataListId, JSON.parse(data.payload));
            }
        });
    });
    $("#maincontent").on("click","button.deletebtn", function() {
        var dataId = $(this).data('id');
        gblCC_API.updateRepoEntryStatus(APP_EVENT_TYPE, dataId, "DEL")
            .done(function(error) { location.reload(); })
            .fail( function( errorData ) {
                ApiAlert(errorData);
            });
    
    }); 
    
    $("#maincontent").on("click", "button#addNewServiceBenefit", function() {
        showForm(0,0, "");
    }); 
    
    $("#maincontent").on("click","a#submitBtn",function() {
        validateAndSubmitForm();
    }); 
    $("#maincontent").on("click","a#cancelBtn",function() {
        showList();
    }); 
}


/* there is not an easy way to get the form data
    I should probably just hard code every item.
    
    TODO: attempt to create a generic getFormsData.
    1) get map of input to type.
    2) based on type.. use jquery to get data and add to an object.
    
    3) for arrays/grids.. it is up to user to reformat the data (for now)
    
    
 */
    /* I think the following 3 code pieces could be in cotForm. 
     I think the checkbox code in cotForm may not be optimal and my form doesn't use checkboxes  so take it FWIW as it is not well tested.
     
     This code create a formItems object to track the type of input found in the form. Related radio button will all have the same name and will be represented once.
     It then populates formObj with relevant data.
    */
	
function getCOTFormItems(formId) {

   var formItems = {};
    $('#' + formId + ' input').each(function() {
        formItems[$(this).attr('name')] = {'type': $(this).attr('type'), 'name' : $(this).attr('name'), 'tag' : 'input'};
    });
    $('#' + formId + ' select').each(function() {
        formItems[$(this).attr('name')]  = {'type': 'select', 'name' : $(this).attr('name'), 'tag' : 'select'};
    }); 
    $('#' + formId + ' textarea').each(function() {
        formItems[$(this).attr('name')]  = {'type': 'textarea', 'name' : $(this).attr('name'), 'tag' : 'textarea'};
    }); 
    
    return formItems;

}
function extractCOTFormData(formItems) {


    var formObj = {};  
	$.each(formItems, function(i, item) {	
		if (item.type !== 'radio' && item.type !== 'checkbox' ) {
			formObj[item.name] = $(item.tag + '[name="' + item.name + '"]').val();
		} else if (item.type == 'checkbox') {
			formObj[item.name] =  $(item.tag + '[name="' + item.name + '"]')[0].checked; 
		} else {
			formObj[item.name] = $("input:checked[name='" +item.name + "']").val(); 
		}
	});
    console.log(formObj);   
    return formObj;

}
function getCOTFormData(formId) {
	var formItems = getCOTFormItems(formId);
	var formObj = extractCOTFormData(formItems);
	return formObj;
}

/*
function getCOTFormDataOld(formId) {
    var formObj = {};    
    var formItems = {};
    $('#' + formId + ' input').each(function() {
        var item = $(this);
        formItems[$(this).attr('name')] = {'type': item.attr('type'), 'name' : item.attr('name')};
        if ( item.attr('type') !== 'radio'  &&  item.attr('type') !== 'checkbox') {
            formObj[$(this).attr('name')] = $(this).val();
        } else if (item.attr('type') === 'checkbox') {
            formObj[$(this).attr('name')] =  $(this)[0].checked; 
        }
    });
    $('#' + formId + ' select').each(function() {
        formItems[$(this).attr('name')]  = {'type': 'select', 'name' : $(this).attr('name')};
        formObj[$(this).attr('name')] = $(this).val();
    }); 
    $('#' + formId + ' textarea').each(function() {
        formItems[$(this).attr('name')]  = {'type': 'textarea', 'name' : $(this).attr('name')};
        formObj[$(this).attr('name')] = $(this).val();
    }); 
    
    // for radio button, we need to find the checked one.
    $.each(formItems, function(i, item) {
        if (item.type === 'radio') {
            formObj[item.name] = $("input:checked[name='" +item.name + "']").val(); 
        }
    });
    $.each(formItems, function(i, item) {
        console.log(item.type, item.name);
    
    });
    console.log(formObj);   
    return formObj;

}  
*/ 
    /* need input that are not radio/checkboxes */
    
    /*
    $('#hsi-form input:not([type=radio], [type=checkbox], [name^="rltitle"], [name^="rllink"] )').each(function() {
        console.log($(this).attr('name'),$(this).val());
        formObj[$(this).attr('name')] = $(this).val();
    });
    $('#hsi-form input:checked').each(function() {
        console.log($(this).attr('name'),$(this).val());
        formObj[$(this).attr('name')] = $(this).val();
    }); 
    
    $('#hsi-form textarea').each(function() {
        console.log($(this).attr('name'),$(this).val());
        formObj[$(this).attr('name')] = $(this).val();
    });
    */
    
    
    
    /* ignore condition selects since they are part of rules */
    
    /*
    $('#hsi-form select:not([name^="condition"])').each(function() {
        console.log($(this).attr('name'),$(this).val());
        formObj[$(this).attr('name')] = $(this).val();
    }); 
    
    var relLink = {};
     $('#hsi-form [name^="rltitle"], [name^="rllink"] ').each(function() {
        var rl = $(this).attr('name').split("-");
        var idx = rl[1];
        if (typeof relLink[rl[1]] === 'undefined') {
            relLink[rl[1]] = { "title" : "", "link" : ""};      
        }
        var propName = rl[0].replace("rl","").toLowerCase();
        relLink[rl[1]][propName] = $(this).val();
     
     });
    console.log(relLink);
    var relatedlinks = [];
    $.each(relLink, function(i, link) {
        if (link.title !== "" && link.link !== "") {
            relatedlinks.push(link);
        }
    });
    formObj. relatedlinks =  relatedlinks;
    //We get the subrules from the array and not the subform, since it is gone
    //oSubRule[0] should be undefined. A rule.rule may be underfined if it was cleared.
    var rules = [];
    $.each(oSubRules, function (i, rule) {
        if (typeof rule !== 'undefined' && rule.length > 0 ) {
            var rObj = { "op" : "", "rule" : rule };
            if (i > 1) {
                rObj.op = $('#hsi-form select[name="condition' + i + '"]').val();
            }
            rules.push(rObj);
            console.log(rule);
        }
    });
    formObj.rules = rules;
    /*
    var condName = "";
    $('#hsi-form p[id^="rule"').each(function(idx, ele) {
        ruleObj = {};
        condName = $('select[name="condition' + (idx+1) + '"]').val();
        ruleObj.op = (idx === 0 ? "" :condName );
        ruleObj.rule = $(this).text();
        console.log(ruleObj);
    });
    */
    // $("#" + Object.keys(jsonData)[i]).val(jsonData[Object.keys(jsonData)[i]]);


function getFormData() {

    var rawFormData  = getCOTFormData('hsi-form');
    var formData = {};
    var relLink = {};    

    Object.keys(rawFormData).forEach(function(key, i, array) {
        //skip condition fields as they are part of rules.
        if(key.indexOf('condition') > -1  ) {
            return true;
        }
        /* for related link items, parse and create objects from them */
        if (key.indexOf('rltitle') > -1 ||  key.indexOf('rllink') > -1) {
            var rl = key.split("-");
            var idx = rl[1];
            if (typeof relLink[rl[1]] === 'undefined') {
                relLink[rl[1]] = { "title" : "", "link" : ""};      
            }
            var propName = rl[0].replace("rl","").toLowerCase();
            relLink[rl[1]][propName] =rawFormData[key];
        } else {
			/* for regular input fields, copy data */
            formData[key] = rawFormData[key];
        }
        console.log(key, rawFormData[key]);
        
    });
	
    var relatedlinks = [];
    $.each(relLink, function(i, link) {
        if (link.title !== "" && link.link !== "") {
            relatedlinks.push(link);
        }
    });
    formData.relatedlinks =  relatedlinks;
    
    //We get the subrules from the array and not the subform, since it is gone and this is easier.
    //oSubRule[0] should actually be undefined. A rule.rule may be underfined if it was cleared.
    var rules = [];
    $.each(oSubRules, function (i, rule) {
        if (typeof rule !== 'undefined' && rule.length > 0 ) {
            var rObj = { "op" : "", "rule" : rule };
            if (i > 1) {
                rObj.op = $('#hsi-form select[name="condition' + i + '"]').val();
            }
            rules.push(rObj);
            console.log(rule);
        }
    });
    formData.rules = rules; 
    console.log(formData);  
    return formData;
}
function submitData() {
    formData = getFormData();
    if (gblCurrentRowId !== 0) {
        gblCC_API.updateRepoEntry( APP_EVENT_TYPE, gblCurrentRowId, formData)
            .done(function(data) {
				appAlert("success","The update was successful");
                updateCacheData(gblCurrentRowId, formData);
            })
            .fail(function(errorData) {
                ApiAlert(errorData);

            });
        
    } else {
        gblCC_API.submitNewRepoEntry(formData)
        .done(function(data) {
             location.reload(); //Reload form to see data removed
        })
        .fail(function(errorData) {
            ApiAlert(errorData);

        });
    }

}


function showList() {
    $("#hsi-form").addClass('hide');
    $("#hsilist").removeClass('hide');
}

/* this is another function that could be in CotForms. [checkbox logic not fully tested!*/
function putCOTFormData(formId, jsonData) {
	var formItems = getCOTFormItems(formId);
    
    if (jsonData !== "") {
		Object.keys(jsonData).forEach(function(key, i, array) {
			if (typeof formItems[key] === 'undefined') {
				return true; //we have data that is not stored in the form..
			}
			if ( formItems[key].type !== 'radio' && formItems[key].type !== 'checkbox' ) {
				$(formItems[key].tag + "[name='" + key + "']").val(jsonData[key]);
			} else if (formItems[key].type === 'radio') {
				$("input[name='" + key + "'][value='" + jsonData[key] + "']").prop("checked", true);
			 } else if (formItems[key].type === 'checkbox') {
				$("input[name='" + key + "']").prop("checked", jsonData[key]);
			 }
        });  
    }
    

}
function showForm(rowId, listId, jsonData) {
    gblCurrentRowId = rowId;
    gblCurrentListId = listId;
    $("#hsi-form").remove(); //SML.. remove or show/hide/populate.. but don't keep adding new forms.
    var formTitle = "New Service/Benefit";
    if (rowId !== 0 && jsonData !== "") {
        formTitle = "Update: " + jsonData.title;
    }
    $("#hsilist").addClass('hide');
    var strP = Math.random().toString(36).substring(7);
        //"success" : submitData(), -- don;'t do this..I think this is being triggered on a 'add row in grid
    var f = new cot_form({
        "id":"hsi-form",
        "title": formTitle
        });
    var s0 = f.addSection(new cot_section({
        "id":"hsi-tombstone",
        "title":"Service/Benefit Details"
    }));
    s0.addRow(new cot_row([
        {"id":"title","title":"Title", "required": true}
    ]));
    s0.addRow(new cot_row([
        {"id":"link","title":"URL", "required": true, "validationtype": "URL"}
    ]));
    s0.addRow(new cot_row([
          {"id":"type","title":"Type", "required": false, "type": "radio", "value": "service", "choices": [{"value": "service", "text": "Service"}, {"value": "benefit", "text": "Benefit"}],"orientation":"horizontal"}
    ]));
    s0.addRow(new cot_row([
          {"id":"chk","title":"chkTest", "required": false, "type": "checkbox", "value": "checked", "choices": [{"value": "service", "text": "Service"},{"value": "service2", "text": "Service2"}]}
    ]));    
    s0.addRow(new cot_row([
          {"id":"chk2","title":"chkTest2", "required": false, "type": "checkbox", "value": "checked", "choices": [{"value": "service3", "text": "Service"}]}
    ]));    
    s0.addRow(new cot_row([
        {"id":"category","title":"Category", "required": true, "type": "dropdown", "class": "col-md-12", 
        "choices": [{"text": "Childcare"},{"text": "Employment"},{"text": "Housing"}]}
    ]));    
    s0.addRow(new cot_row([
        {"id":"keywords","title":"Keywords", "required": true,posthelptext : "Enter a list of comma seperated words that a user might use when searching for this title"}
    ]));    
    s0.addRow(new cot_row([
        {"id":"description","title":"Description", "required": true, "type": "textarea"}
    ]));
    
    
    s0.addGrid(new cot_grid({
        "add":true,
        "id" : "relLinks",
        "title" :'Related Links',
        "headers":[{"title":"Title"},{"title":"URL"}], 
        "fields" :[{"id":"rltitle","title":"Title"},{"id":"rllink","title":"URL", "validationtype": "URL"}]
    }));
    var s1 = f.addSection(new cot_section({
        "id":"hsi-rules",
        "title":"Service/Benefit Rules"
    }));
    s1.addRow(new cot_row([
        {"id":"rule1","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-8 col-sm-offset-4 col-md-offset-2", "type": "static", "value": "Not Set"},
        {"id":"edit1", "type": "html", "html" : "<a onclick='showRuleModal(1);' class=' rulebtn btn btn-info'>Edit</a>", "class": "col-xs-12 col-sm-2 col-md-1"},
        {"id":"clear1", "type": "html", "html" : "<a onclick='clearRule(1);' class=' rulebtn btn btn-danger'>Clear</a>", "class": "col-xs-12 col-sm-2 col-md-1"}        
    ]));
    s1.addRow(new cot_row([
        {"id":"condition2","title":"Condition 2","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}]},
        {"id":"rule2","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-8","type": "static", "value": "Not Set"},
        {"id":"edit2", "type": "html", "html" : "<a onclick='showRuleModal(2);' class=' rulebtn btn btn-info'>Edit</a>", "class": "col-xs-12 col-sm-2 col-md-1"},
        {"id":"clear2", "type": "html", "html" : "<a onclick='clearRule(2);' class=' rulebtn btn btn-danger'>Clear</a>", "class": "col-xs-12 col-sm-2 col-md-1"}        
    ]));
    s1.addRow(new cot_row([
        {"id":"condition3","title":"Condition 2","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}]},
        {"id":"rule3","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-8","type": "static", "value": "Not Set"},
        {"id":"edit3", "type": "html", "html" : "<a onclick='showRuleModal(3);' class=' rulebtn btn btn-info'>Edit</a>", "class": "col-xs-12 col-sm-2 col-md-1"},
        {"id":"clear3", "type": "html", "html" : "<a onclick='clearRule(3);' class=' rulebtn btn btn-danger'>Clear</a>", "class": "col-xs-12 col-sm-2 col-md-1"}        
    ]));
    s1.addRow(new cot_row([
        {"id":"condition4","title":"Condition 2","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}]},
        {"id":"rule4","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-8","type": "static", "value": "Not Set"},
        {"id":"edit4", "type": "html", "html" : "<a onclick='showRuleModal(4);' class=' rulebtn btn btn-info'>Edit</a>", "class": "col-xs-12 col-sm-2 col-md-1"},
        {"id":"clear4", "type": "html", "html" : "<a onclick='clearRule(4);' class=' rulebtn btn btn-danger'>Clear</a>", "class": "col-xs-12 col-sm-2 col-md-1"}        
    ]));
    s1.addRow(new cot_row([
        {"id":"condition5","title":"Condition 2","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}]},
        {"id":"rule5","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-8","type": "static", "value": "Not Set"},
        {"id":"edit5", "type": "html", "html" : "<a onclick='showRuleModal(5);' class=' rulebtn btn btn-info'>Edit</a>", "class": "col-xs-12 col-sm-2 col-md-1"},
        {"id":"clear5", "type": "html", "html" : "<a onclick='clearRule(5);' class=' rulebtn btn btn-danger'>Clear</a>", "class": "col-xs-12 col-sm-2 col-md-1"}        
    ]));
    var s2 = f.addSection(new cot_section({
        "id":"hsi-submit",
        "class": "submitsection"
    }));
    s2.addRow(new cot_row([
        {"id":"submit","type": "html", "html": "<a id='cancelBtn' class='btn btn-danger'>Cancel</a><a id='submitBtn' class='btn btn-success'>Submit</a>"}
    ]));
    //f.success=this.successxx;
    f.render({"target":"#app-content-top"});
    
	putCOTFormData('hsi-form', jsonData);
    
	//Rules and related links are different than single fields, so special processing is required
    //By Default, one row will exist in the grid, add neccessary rows before filling
    var addBtn = $( "#relLinks" ).find("button");
    if (typeof jsonData.relatedlinks !== 'undefined') {
        for (var j = 1; j < jsonData.relatedlinks.length; j++) {
             addBtn.trigger( "click" );
        }
        $.each(jsonData.relatedlinks, function(i, rl) {
            var listIdx = i + 1;
            $("#rltitle-" + listIdx).val(rl.title);
            $("#rllink-" + listIdx).val(rl.link);   
        });     
    }
    
    /* we need to set the oRule objects with the rules for this title for when we go into modal form */
    oSubRules = [];
    oRule = {};
    if (typeof jsonData.rules !== 'undefined') {
        $.each(jsonData.rules, function(i, rule) {
            var globalRuleNo = i+1;
            oRule[globalRuleNo] = {};
            oSubRules[globalRuleNo] = [];
            $.each(rule.rule, function(j, subrule) {
                var idx = j+1;
                oRule[globalRuleNo]["subrule" + idx] = subrule.subrule;
                var robj = { "op" : "", "subrule" : subrule.subrule };
                if (idx > 1) {
                    oRule[globalRuleNo]["subcondition" + idx] = subrule.op;
                    robj.op = subrule.op;
                }
                oSubRules[globalRuleNo].push(robj);
            });
            if ( globalRuleNo > 1) {
                $("select[name='condition" + globalRuleNo + "']").val(rule.op);
            }
            $("#rule" + globalRuleNo).html(createRuleText(oRule[globalRuleNo].subrule1,oRule[globalRuleNo].subcondition2,oRule[globalRuleNo].subrule2,oRule[globalRuleNo].subcondition3,oRule[globalRuleNo].subrule3,oRule[globalRuleNo].subcondition4,oRule[globalRuleNo].subrule4,oRule[globalRuleNo].subcondition5,oRule[globalRuleNo].subrule5) );
        });
    }
    
}

function successxx() {
    alert("xx");
}
function showRuleModal(ruleNo) {
    globalRuleNo = ruleNo;
    $("#ruleModal").modal();
}

function createRuleText(r1, c2, r2, c3, r3, c4, r4, c5, r5) {
    var ruletxt = "";
    ruletxt =  "<b>" + r1 + "</b>";
    ruletxt += (typeof r2 !== "undefined" && r2 !=="") ? " " + c2 + " <b>" + r2 + "</b>" : "";
    ruletxt += (typeof r3 !== "undefined" && r3 !=="") ? " " + c3 + " <b>" + r3 + "</b>" : "";
    ruletxt += (typeof r4 !== "undefined" && r4 !=="") ? " " + c4 + " <b>" + r4 + "</b>" : "";
    ruletxt += (typeof r5 !== "undefined" && r5 !=="") ? " " + c5 + " <b>" + r5 + "</b>" : "";
    return ruletxt;
}

/* TODO:  I'm using some of rob's original code to display rules (oRule concept) but also use my different version and maintain both. I should need both
    In really, Robs has a hardcoded 5 rules.  We sava and retrieve an array of any amount of rules.

  */
function saveRule() {

    var r1 = $("select[name='subrule1']").val();
    var r2 = $("select[name='subrule2']").val();
    var r3 = $("select[name='subrule3']").val();
    var r4 = $("select[name='subrule4']").val();
    var r5 = $("select[name='subrule5']").val();
    var c2 = $("select[name='subcondition2']").val();
    var c3 = $("select[name='subcondition3']").val();
    var c4 = $("select[name='subcondition4']").val();
    var c5 = $("select[name='subcondition5']").val();

    $("#rule" + globalRuleNo).html(createRuleText(r1, c2, r2, c3, r3, c4, r4, c5, r5));
    $("#ruleModal").modal('hide');
    
    oRule[globalRuleNo] = {};
    oRule[globalRuleNo].subrule1 = r1;
    oRule[globalRuleNo].subrule2 = r2;
    oRule[globalRuleNo].subrule3 = r3;
    oRule[globalRuleNo].subrule4 = r4;
    oRule[globalRuleNo].subrule5 = r5;
    oRule[globalRuleNo].subcondition2 = c2;
    oRule[globalRuleNo].subcondition3 = c3;
    oRule[globalRuleNo].subcondition4 = c4;
    oRule[globalRuleNo].subcondition5 = c5;
    
    oSubRules[globalRuleNo] = [];
    if (typeof r1 !== "undefined" && r1 !=="") {
        oSubRules[globalRuleNo].push({ "op" :"", "subrule" : r1 });
    }
    if (typeof r2 !== "undefined" && r2 !=="") {
        oSubRules[globalRuleNo].push({ "op" :c2, "subrule" : r2 });
    }
    if (typeof r3 !== "undefined" && r3 !=="") {
        oSubRules[globalRuleNo].push({ "op" :c3, "subrule" : r3 });
    }
    if (typeof r4 !== "undefined" && r4 !=="") {
        oSubRules[globalRuleNo].push({ "op" :c4, "subrule" : r4 });
    }
    if (typeof r5 !== "undefined" && r5 !=="") {
        oSubRules[globalRuleNo].push({ "op" :c5, "subrule" : r5 });
    }
    
}



function showRuleForm() {
    var r1 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subrule1 : "";
    var r2 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subrule2 : "";
    var c2 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subcondition2 : "";
    var r3 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subrule3 : "";
    var c3 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subcondition3 : "";
    var r4 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subrule4 : "";
    var c4 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subcondition4 : "";
    var r5 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subrule5 : "";
    var c5 = (typeof oRule[globalRuleNo]!=='undefined') ? oRule[globalRuleNo].subcondition5 : "";

    $("#ruleModalBody").html("");
    var f = new cot_form({
        "id":"fh-ruleform"
        //"title":"Service/Benefit Rule Generator"
        });
    var s1 = f.addSection(new cot_section({
        "id":"hsi-rules",
        "title":"Service/Benefit Rules"
    }));
    s1.addRow(new cot_row([
        {"id":"subrule1","title":"Rule 1", "class": "col-xs-12 col-sm-6 col-md-10 col-sm-offset-4 col-md-offset-2", "type": "dropdown", "choices": rules, "value": r1}  
    ]));
    s1.addRow(new cot_row([
        {"id":"subcondition2","title":"Condition","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}], "value": c2},
        {"id":"subrule2","title":"Rule", "class": "col-xs-12 col-sm-6 col-md-10","type": "dropdown", "choices": rules, "value": r2} 
    ]));
    s1.addRow(new cot_row([
        {"id":"subcondition3","title":"Condition","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}], "value": c3},
        {"id":"subrule3","title":"Rule", "class": "col-xs-12 col-sm-6 col-md-10","type": "dropdown", "choices": rules, "value": r3} 
    ]));
    s1.addRow(new cot_row([
        {"id":"subcondition4","title":"Condition","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}], "value": c4},
        {"id":"subrule4","title":"Rule", "class": "col-xs-12 col-sm-6 col-md-10","type": "dropdown", "choices": rules, "value": r4} 
    ]));
    s1.addRow(new cot_row([
        {"id":"subcondition5","title":"Condition","type": "dropdown", "class": "col-xs-12 col-sm-4 col-md-2", "choices": [{"text": "AND"},{"text": "OR"}], "value": c5},
        {"id":"subrule5","title":"Rule", "class": "col-xs-12 col-sm-6 col-md-10","type": "dropdown", "choices": rules, "value": r5} 
    ]));

    f.render({"target":"#ruleModalBody"});
}

function clearRule(ruleNo) {
    $("#rule" + ruleNo).html("Not Set");
    oRule[ruleNo] = {};
    oSubRules[ruleNo] = [];
}

function scrollToAnchor(aid){
    var aTag = $("a[name='"+ aid +"']");
    $('html,body').animate({scrollTop: aTag.offset().top},'slow');
}

function initApp() {

    if (getCookie('sid') === null || getCookie('sid') == 'undefined') {
        showLogin();
    } else {
        populatePage();
    }
    setupEvents();
}

function showApp() {
   
   //The welcome 'section/div' is not currently added n the main header,  add it. We want to see the "login" stuff as the user may fail auth and need to try again.
    $("#app-header").append( $('<section class="container">').load('html/hsi.html #welcomemsg', function () {
        setUserName();
    }));
    $("#app-content-bottom").load('html/hsi.html #hsimodals', function () {
        $('#ruleModal').on('shown.bs.modal', function () {
            showRuleForm();
        });
        initApp();
    }); 
}

function renderCFrame() {
    app.setBreadcrumb([]);
    app.includeFormValidation=app.includePlaceholders=true;
    app.render(showApp);
}

$(document).ready(function() {
    renderCFrame();
    
});