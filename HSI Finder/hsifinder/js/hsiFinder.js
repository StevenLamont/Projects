/*
 1) no reason to not load data right away, since we can do it while the person is doing the survey. All Filtering/Rules applied will occur after the fact.
 
 2) For now we will get data from the eventRepo, but we will get if from the aggregator where no security is needed.
 
 3) The rules should have a NOT operator.  For now, there is only one know instance where it matters (Not ODSP).  We created a special rule for it and put in special logic here.
*/
var gblJSONData = "";
var gblFilteredData = [];
var APP_EVENT_TYPE = "HSI_Services_Benefits"; 
var EVENT_TYPE_APPROVE_STATUS = 'APR';
var API_HOST = "https://was8-inter-dev.toronto.ca";
//var APP_REPO_NAME = "HSI_Services_Benefits";
//var gblCC_API = new CC_API({timeout : 1000, apihost: API_HOST});

var filters = {};
var gblBaselineCnt = 0;

/* I want this rules array to be the same for both admin and finder tools 
  It needs to be an array of objects to be compatible with rob's tools.
  Each rule value should be found in a data-qval in the html/body.html unless it is specially coded.
  */
var gblRules = [
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
{"text": "RECIPIENT: NOT Ontario Disability Support", "value": "NOT ODSP"},
{"text": "RECIPIENT: Child Care Fee Subsidy", "value": "Child Care Fee Subsidy"},
{"text": "RECIPIENT: Subsidized Housing/Rent", "value": "Subsidized Housing"},
{"text": "RECIPIENT: Housing Allowance", "value": "Housing Allowance"},
{"text": "RECIPIENT: National Child Benefit Supplement", "value": "Child Beneift Supplement"},
{"text": "RECIPIENT: Employment Insurance", "value": "EI"},
{"text": "SCHOOL: Full-Time", "value": "FT Student"},
{"text": "SCHOOL: Part-Time", "value": "PT Student"},
{"text": "SCHOOL: Not In School", "value": "Not Student"},
{"text": "CHILDREN: All Age Groups", "value": "Has Children"},
{"text": "CHILDREN: Age Group 1 (0-2)", "value": "Child Ages 0-2"},
{"text": "CHILDREN: Age Group 2 (3-4)", "value": "Child Ages 3-4"},
{"text": "CHILDREN: Age Group 3 (5-6)", "value": "Child Ages 5-6"},
{"text": "CHILDREN: Age Group 4 (7-10)", "value": "Child Ages 7-10"},
{"text": "CHILDREN: Age Group 5 (11-12)", "value": "Child Ages 11-12"},
{"text": "CHILDREN: Age Group 6 (13-16)", "value": "Child Ages 13-16"},
{"text": "CHILDREN: Age Group 7 (17-18)", "value": "Child Ages 17-18"},
{"text": "CHILDREN: Age Group 8 (expecting)", "value": "Expecting Child"},
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
{"text": "HOUSING: Housed Rent Free","value": "Rent Free"},
{"text": "HOUSING: Risk of Eviction","value": "Eviction Risk"},
{"text": "HOUSING: Risk of Foreclosure","value": "Foreclosure Risk"},
{"text": "HOUSING: Looking for Housing","value": "Looking for Housing"},
{"text": "HEALTH NEED: Medical","value": "Medical Need"},
{"text": "HEALTH NEED: Home Safety","value": "Home Safety"},
{"text": "DISABILITY: Disability","value": "Disability"},
{"text": "DISABILITY: Mental Health Issue","value": "Mental Health"},
{"text": "DISABILITY: Addiction Issue","value": "Addiction"},
{"text": "OTHER: Domestic Violence","value": "Domestic Violence"},
{"text": "OTHER: Terminally Ill","value": "Terminally Ill"},
{"text": "OTHER: Conviction","value": "Conviction Issue"},
{"text": "OTHER: Funeral Cost","value": "Funeral Cost"}
];

var questions = {};
function ApiAlert(errorData) {
    appAlert(errorData.type,errorData.error);
}
function appAlert(title, msg) {

    bootbox.dialog({ title:  title , message: msg,buttons: { success: { label: "OK", className: "btn-success" }}});
}


var app = new cot_app("Service and Benefit Finder Tool");
function prevStep() {
    var currentO = $(".step.active");
    var prev1 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) - 1).toString());
    var prev2 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) - 2).toString());
    $("#finishstep").addClass("hide");
    $("#nextstep").removeClass("hide");
    
    currentO.removeClass("active");
    prev1.addClass("active");
    $("#prevstep").attr("disabled",(prev2.length===0));
    $("#nextstep").attr("disabled",false);
    $("#wizardTitle").html(prev1.attr("data-title"));
    updateProgressBar();
}

function nextStep() {
    var currentO = $(".step.active");
    var next1 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) + 1).toString());
    var next2 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) + 2).toString());
    $("#nextstep").attr("disabled",(next2.length===0));
    if (next2.length===0) {
        $("#nextstep").addClass("hide");
        $("#finishstep").removeClass("hide");
        
    }
    currentO.removeClass("active");
    next1.addClass("active");
    $("#prevstep").attr("disabled",false);
    $("#wizardTitle").html(next1.attr("data-title"));
    updateProgressBar();
}
function startStep() {
    $("#finishstep").addClass("hide");
    $("#nextstep").removeClass("hide");
    $("#nextstep").attr("disabled", false);
    $("#prevstep").attr("disabled",true);
    $("#wizardSummary").addClass("hide");
    $("#wizard").removeClass("hide");
    $("#step1").addClass("active");
    $("#wizardTitle").html($("#step1").attr("data-title"));
    updateProgressBar();
}

function addGotoStep(stepid) {

    return "<a class='pull-right' data-stepid='" + stepid + "' href=''> <i title='change' class='glyphicon glyphicon-pencil'></i><span></span></a>";

}

function finishStep() {
    setUpQuestionAnswers();
    var sHTML = "<ul>", sTemp="", arrTemp=[];
    
    console.log("Question Values");
    $('#maincontent input:checked').each(function() {
        if (typeof $(this).data('qval') !== 'undefined') {
            questions[$(this).data('qval')] = true;
            console.log($(this).data('qval'));
        }
    });
    
    //RESIDENT STATUS
    sHTML += ($("#torontoresident:checked").length>0) ? "<li><span class='label'>Toronto Resident</span>: Yes" : "";
    sHTML += ($("#nottorontoresident:checked").length>0) ?"<li><span class='label'>Toronto Resident</span>: No" : "";
    sHTML += ($("#torontoresident:checked").length===0 && $("#nottorontoresident:checked").length===0) ?"<li class='unspecified'><span class='label'>Toronto Resident</span>: Unspecified" : "";
    sHTML += addGotoStep(1) + "</li>" ;
    
    //AGE GROUP
    if ($(".filterage input:checked").length > 0) {
        sHTML += "<li><span class='label'>Age</span>: " + $(".filterage input:checked").val();
        //questions[$(".filterage input:checked").data('qval')] = true;
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Age</span>: Unspecified";
    }
    sHTML += addGotoStep(2) + "</li>" ;
    
    //LANGUAGE
    if ($(".filterlanguage input:checked").length > 0) {
        sTemp = ($(".filterlanguage input:checked").val() == "Other") ? $("#languageOtherText").val() : $(".filterlanguage input:checked").val();
        sHTML += "<li><span class='label'>Primary Language</span>: " + sTemp;
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Primary Language</span>: Unspecified";
    }
    sHTML += addGotoStep(3) + "</li>" ;
     
    //FINANCIAL NEED
    sHTML += ($("#financialneedyes:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: Yes" : "";
    sHTML += ($("#financialneedno:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: No" : "";
    sHTML += ($("#financialneeddontknow:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: Not Sure" : "";
    sHTML += ($("#financialneeddontknow:checked").length===0 && $("#financialneedno:checked").length===0 && $("#financialneedyes:checked").length===0) ? "<li class='unspecified'><span class='label'>In Financial Need</span>: Unspecified" : "";
    sHTML += addGotoStep(4) + "</li>" ;
    //SUBSIDY STATUS
    //if ($("#ow:checked").length>0) {
    //    questions["OW"] = true;
    //}
    sHTML += ($("#ow:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Ontario Works" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#odsp:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Ontario Disability Support Program" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#ccfs:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Childcare Fee Subsidy" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#tch:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Subsidized Housing/Rent Subsidy" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#ha:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Housing Allowance" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#ncbs:checked").length>0) ? "<li><span class='label'>Recipient of</span>: National Child Benefit Subsidy" + addGotoStep(4) + "</li>" :"";
    sHTML += ($("#ei:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Employment Insurance" + addGotoStep(4) + "</li>" :"";
    
    /* Special processing -- manually set NOT ODSP */
    if ($("#odsp:checked").length === 0) {
        questions["NOT ODSP"] = true; 
    }
    
    
    //STUDENT STATUS
    var sSchool = "<li class='unspecified'><span class='label'>Student Status</span>: Unspecified";
    sSchool = ($("#fulltimeschool:checked").length>0) ? "<li><span class='label'>Student Status</span>: Full-time" : sSchool;
    sSchool = ($("#parttimeschool:checked").length>0) ? "<li><span class='label'>Student Status</span>: Part-time" : sSchool;
    sSchool = ($("#notinschool:checked").length>0) ? "<li><span class='label'>Student Status</span>: Not In School" : sSchool;
    sHTML += sSchool;
    sHTML += addGotoStep(5) + "</li>" ;
    
    //CHILDRENS AGES
    arrTemp = [];
    if ($("#childagerange1:checked").length>0) { arrTemp.push($("#childagerange1").val()); }
    if ($("#childagerange2:checked").length>0) { arrTemp.push($("#childagerange2").val()); }
    if ($("#childagerange3:checked").length>0) { arrTemp.push($("#childagerange3").val()); }
    if ($("#childagerange4:checked").length>0) { arrTemp.push($("#childagerange4").val()); }
    if ($("#childagerange5:checked").length>0) { arrTemp.push($("#childagerange5").val()); }
    if ($("#childagerange6:checked").length>0) { arrTemp.push($("#childagerange6").val()); }
    if ($("#childagerange7:checked").length>0) { arrTemp.push($("#childagerange7").val()); }
    if ($("#childagerange8:checked").length>0) { arrTemp.push($("#childagerange8").val()); }
    
    /* special question processing. This is a one-time special occurrence */
    if (arrTemp.length > 0) {
        sHTML += "<li><span class='label'>Children's Ages</span>: " + arrTemp.join(", ") + addGotoStep(6)  + "</li>";
        questions["Has Children"] = true;   
    } else {
        sHTML += "<li class='noselection'><span class='label'>Children's Ages</span>: No Selections" + addGotoStep(6)  + "</li>";
    }
    
    
    //EMPLOYMENT STATUS
    if ($("input[name='employment']:checked").length > 0) {
        sHTML += "<li><span class='label'>Employment Status</span>: " + $("input[name='employment']:checked").val();
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Employment Status</span>: Unspecified";
    }
    sHTML += addGotoStep(7) + "</li>" ;
    sHTML += ($("#lookingforwork:checked").length > 0) ? "<li><span class='label'>Employment Status</span>: " + $("#lookingforwork:checked").val()  + addGotoStep(7) + "</li>": "";
    sHTML += ($("#lookingtoupgrade:checked").length > 0) ? "<li><span class='label'>Employment Status</span>: " + $("#lookingtoupgrade:checked").val() + addGotoStep(7) + "</li>" : "";
    
    //INCOME RANGE
    if ($("input[name='salrange']:checked").length > 0) {
        sHTML += "<li><span class='label'>Income Range</span>: " + $("input[name='salrange']:checked").val();
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Income Range</span>: Unspecified";
    }
    sHTML += addGotoStep(8) + "</li>" ;
    
    //HOUSING STATUS
    if ($("input[name='housing']:checked").length > 0) {
        sHTML += "<li><span class='label'>Housing Status</span>: " + $("input[name='housing']:checked").val();
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Housing Status</span>: Unspecified"; 
    }
    sHTML += addGotoStep(9) + "</li>" ;
    sHTML += ($("#riskofeviction:checked").length > 0) ? "<li><span class='label'>Housing Status</span>: " + $("#riskofeviction:checked").val() +  addGotoStep(9) + "</li>": "";
    sHTML += ($("#riskofforeclosure:checked").length > 0) ? "<li><span class='label'>Housing Status</span>: " + $("#riskofforeclosure:checked").val() +  addGotoStep(9) + "</li>": "";
    sHTML += ($("#lookingforhousing:checked").length > 0) ? "<li><span class='label'>Housing Status</span>: " + $("#lookingforhousing:checked").val() +  addGotoStep(9) + "</li>": "";
    
    //Financial COSTS
    var financialCnt = 0;
    if ($("#medicalordental:checked").length > 0) {financialCnt++; sHTML += "<li><span class='label'>Financial Need</span>: Medical/Dental" + addGotoStep(10) + "</li>";}
    if ($("#homesafety:checked").length > 0) {financialCnt++; sHTML += "<li><span class='label'>Financial Need</span>: Home Safety" + addGotoStep(10) + "</li>";}
    if (financialCnt === 0) {
        sHTML += "<li class='noselection'><span class='label'>Hosuehold Need Information</span>: No Selections" + addGotoStep(10) + "</li>";
    }    
    
    //DISABILITY STATUS
    var disabilityCnt = 0;
    if ($("#disabled:checked").length > 0) {disabilityCnt++; sHTML += "<li>Household member with disability or special need" + addGotoStep(11) + "</li>";}
    if ($("#mentalhealth:checked").length > 0) {disabilityCnt++; sHTML += "<li>Household member with mental health issue" + addGotoStep(11) + "</li>";}
    if ($("#addiction:checked").length > 0) {disabilityCnt++; sHTML += "<li>Household member with an Addiction" + addGotoStep(11) + "</li>";}
    if (disabilityCnt === 0) {
        sHTML += "<li class='noselection'><span class='label'>Disability Information</span>: No Selections" + addGotoStep(11) + "</li>";
    }    
    //OTHER
    var otherCnt = 0;
    if ($("#domesticviolence:checked").length > 0) {otherCnt++; sHTML += "<li>Domestic violence in household" + addGotoStep(12) + "</li>";}
    if ($("#terminal:checked").length > 0) {otherCnt++; sHTML += "<li>Terminally ill" + addGotoStep(12) + "</li>";}
    if ($("#incarcerated:checked").length > 0) {otherCnt++; sHTML += "<li>About to be or recently released from prison" + addGotoStep(12) + "</li>";}
    if ($("#funeral:checked").length > 0) {otherCnt++; sHTML += "<li>In need of help to pay for funeral" + addGotoStep(12) + "</li>";}
    if (otherCnt === 0) {
        sHTML += "<li class='noselection'><span class='label'>Other Information</span>: No Selections" + addGotoStep(12) + "</li>";
    }
    //Add Summary
    sHTML += "</ul>";
    $("#summarydetails").html(sHTML);
    $("#wizardSummary").removeClass("hide");
    $(".step").removeClass("active");
    $("#wizard").addClass("hide");
    $('[data-toggle="tooltip"]').tooltip();
    //$('.nav-tabs li').tooltip();
    //loadData(); -- SML: now done on load.
    showBaseline();
    
    // add in Test.. if some unspecified.. add message */
    if ($("#summarydetails li.unspecified").length > 0) {
        $("#unspecifiedmsg").removeClass("hide");
    } else {
        $("#unspecifiedmsg").addClass("hide");
    }
    //setTimeout( function() {
    //  $('#editSettings').tooltip('show');
    //  }, 1000);
    //setTimeout( function() {
    //  $('#editSettings').tooltip('hide');
    //  }, 5000);

}

function updateProgressBar() {
    var totalStep = $(".step").length;
    var currentStep = parseInt($(".step.active").attr('data-step'),10);
    var percent = Math.round((currentStep/totalStep) * 100);
    $("#stepprogress").css('width', percent + '%');
    $("#stepprogress").attr('aria-valuenow', percent);
    $("#stepprogress").html("Step " + currentStep + " of " + totalStep);
}

/*
function loadFilters() {
    filters = {};
    $.each($(".filter input[type='checkbox']:checked"), function(i, item) {
        filters[$(item).val()] = true;
    });
}
*/
//"rules": [{"op": "", "rule": "Age 0-18 OR Age 19-29 AND OW"}, {"op": "OR", "rule": "Age 19-29 AND OW"},{"op": "AND", "rule": "Age 0-18 AND OW"}]
// this is A or B AND C  which is (A or (B && C))  which is true or false and true
//ANDs before ORsrule
    
//  [Object { rule="Resident",  op=""}, Object { op="AND",  rule="Age 18-29"}, Object { op="OR",  rule="Age 60-65"}]
    
    

function processRule(rule) {
    //Rule is an object of subrubles which we process in order.
    var expression = "";
    $.each(rule, function(i,rule) {
        console.log(rule.op,rule.subrule);
        if (rule.op !== "") {
            expression += rule.op.toLowerCase() === "or" ? "||" : "&&";
        }
        expression += questions[rule.subrule];
    });

 
    //console.log("Rule expression", expression, eval(expression));
    return eval(expression);
}

function showBaseline() {
    console.log("starting baseline");
    var sHTML = "";
    gblBaselineCnt = 0;
    gblFilteredData = [];
    $("#hsi_housing, #hsi_childcare,#hsi_employment, #hsi_benefit").html("");
    $.each( gblJSONData, function(i, item) {
        itemSelect = false;
        if (typeof item.rules === 'undefined' || item.rules.length === 0) {
            console.log(item.title, " No Rule");
            itemSelect = true;
        } else {
            /* evaulate each individual rule and get a result */
            $.each(item.rules, function(i, rule) {
                rule.ruleStatus = processRule(rule.rule);
            });
            var expression = "";
            $.each(item.rules, function(i, rule) {
                expression += (rule.op === "AND" ? "&&" : "");
                expression += (rule.op === "OR" ? "||" : "");
                expression += rule.ruleStatus;
            });
            console.log(item.title);
            $.each(item.rules, function(i, rule) {
                console.log(rule.rule, rule.ruleStatus);
            });
            console.log(expression, eval(expression));
            itemSelect = eval(expression);
        }
        if (itemSelect) {
            gblFilteredData.push(item);
            gblBaselineCnt++;
            console.log("selecting--> " + item.title);
            sHTML = getRow(item);
            if (item.category=="Housing") {$("#hsi_housing").append(sHTML);}
            if (item.category=="Childcare") {$("#hsi_childcare").append(sHTML);}
            if (item.category=="Employment") {$("#hsi_employment").append(sHTML);}
            if (item.category=="Medical") {$("#hsi_medical").append(sHTML);}
            if ((item.type||"") === 'benefit') {$("#hsi_benefit").append(sHTML);}
        }
    });
    
    /* these tabs are in order. Hide the empty one and make first one with data active */
    var activeFound = false;
    $.each(["#hsi_benefit","#hsi_childcare","#hsi_employment","#hsi_housing","#hsi_medical"], function(i, id) {
        if ($(id).html().length === 0) {
            $('li[href="' + id + '"]').addClass('hide');
        } else {
            $(id).removeClass('active in');
            $('li[href="' + id + '"]').removeClass('active');
            $('li[href="' + id + '"]').removeClass('hide');
            if (!activeFound) {
                activeFound = true;
                $(id).addClass('active in');
                $('li[href="' + id + '"]').addClass('active');
            }
        }
    });
    $("#hsi_searchresultscount").html(gblBaselineCnt + " Results Found.");
    resetSearch();
    $("#hsi_searchresults, #hsi_searchresultscount, #hsi_searchreset").removeClass("hide");
}

function searchResults() {
    if ($("#hsi_searchtext").val()==="") {
       resetSearch();
       return true;
    }
    var sText = $("#hsi_searchtext").val();
    var intCount = 0;
    $("#hsi_tabs").addClass("hide");
    $("#hsi_searchresults").html("");
    $.each(gblFilteredData, function(i, item) {
        if( JSON.stringify(item).toLowerCase().indexOf(sText.toLowerCase()) >= 0) {
            $("#hsi_searchresults").append(getRow(item));
            intCount++;
        }
    });
    $("#hsi_searchresultscount").html(intCount + " Results Found for '" + sText + "'");
    $("#hsi_searchresults, #hsi_searchresultscount, #hsi_searchreset").removeClass("hide");
}

function resetSearch() {
    $("#hsi_searchresults").html("");
    $("#hsi_searchresults, #hsi_searchreset").addClass("hide");
    $("#hsi_searchtext").val("");
    $("#hsi_tabs").removeClass("hide");
    $("#hsi_searchresultscount").html(gblBaselineCnt + " Results Found.");
}


function getRow(item) {
    var sHTML = "";
    sHTML += "<div class='searchRecord row'>";
        sHTML += "<div class='hidden-xs col-sm-1 categoryicon'>";
            //sHTML += "<p>" + item.category + "</p>";
            sIMG = (item.category=="Housing") ? "housing.png" : (item.category=="Childcare") ? "childcare.png" : "employment.png";
            sHTML += "<img src='img/" + sIMG + "' title ='" + item.category + "' alt='" + item.category + " icon'/>";
        sHTML += "</div>";
        sHTML += "<div class='col-xs-12 col-sm-6'>";
            sHTML += "<h3><a href='" + item.link + "' target='_blank'>" + item.title + "</a></h3>";
            sHTML += "<p>" + item.description + "</p>";
        sHTML += "</div>";
        sHTML += "<div class='col-xs-12 col-sm-4'>";
            sRLHTML = "";
            if (typeof item.relatedlinks !== 'undefined' && item.relatedlinks.length > 0) { //SM<L should need to check this.. bir for now
                $.each(item.relatedlinks, function(r, rlitem) {
                    sRLHTML = (r ===0) ? "<h4>Related Links</h4><ul>" : sRLHTML;
                    sRLHTML += "<li><a href='" + rlitem.link + "' target='_blank' >" + rlitem.title + "</a></li>";
                });
            }
            sRLHTML += (sRLHTML!=="") ? "</ul>" : "";
        sHTML += sRLHTML;
        sHTML += "</div>";
        if ((item.type||"") === "benefit") {
            sHTML += "<div class='hidden-xs col-sm-1 subsidyicon'>";
                sHTML += "<span title='This item is a Subsidy/Benefit' class='glyphicon glyphicon-star-empty'</span>";
            sHTML += "</div>";
        }
    sHTML += "</div>";
    return sHTML;
}

function goToStep(stepId){
    $("#nextstep").removeClass("hide");
    $("#nextstep").attr("disabled", false);
    if (stepId === 1) {
        $("#prevstep").attr("disabled",true);
    } else {
        $("#prevstep").attr("disabled",false);
    }
    $("#wizardSummary").addClass("hide");
    $("#wizard").removeClass("hide");
    $("#step" + stepId).addClass("active");
    $("#wizardTitle").html($("#step"+ stepId).attr("data-title"));
    updateProgressBar();
       

}

function setUpEvents() {

    $("#wizardSummary").on("keydown","#hsi_searchtext",function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { searchResults(); }
        if(key == 27) { resetSearch(); }
    });
    
    $("#summarydetails").on("click","li a", function(event) {
        var stepId = $(this).data("stepid");
        goToStep(stepId);
        event.preventDefault();
    });
   $("#summarydetails").on("click","li", function(event) {
        var stepId = $(this).find('a').data("stepid");
        goToStep(stepId);
        event.preventDefault();
    }); 
}

/* assume all the answers to the questions are false */
function setUpQuestionAnswers() {
    $.each(gblRules, function(i, rule) {
        if (rule.value !== "") {
            questions[rule.value] = false;
        }
    });

}

/* SML ToDO: change this to the aggregator */
function loadData() {

    var strURL = API_HOST + "/cc_sr_v1/data/" + APP_EVENT_TYPE + "_" + EVENT_TYPE_APPROVE_STATUS;
    gblJSONData = [];
    var request = $.ajax({
                url : strURL,
                type : "GET",
                timeout: 500,
                crossDomain: true, 
                dataType: 'jsonp',
                success : function(data) {
                    gblJSONData = data;
                },
                error: function (jqXHR, exception) {
                    appAlert("Application Error","We apologize but this application is not functioning properly. Please check again at a later date");
                    console.log(jqXHR);
                }
            });     
}

/*
function loadData() {

    gblJSONData = [];
    gblCC_API.repoLogin(APP_EVENT_TYPE, "testweb1", "toronto")
        .done(function() {
            //gblCC_API.getRepoData(APP_EVENT_TYPE, APP_REPO_NAME , 'Yes', 0 ,100)
            gblCC_API.getRepoData(APP_EVENT_TYPE, null,gblCC_API_APPROVE_STATUS,1,1000)
                .done(function( repoData) {
                    $.each(repoData, function(i, entry) {
                        gblJSONData.push(JSON.parse(entry.payload));
                    });
                    if ( gblJSONData.length === 0 ) {  //shouldn't need to do this, but in case APIs successfully returns 0 rows.
                        appAlert("Application Error","We apologize but this application is not functioning properly. Please check again at a later date");
                    }
                    gblJSONData.sort(function(a, b){
                        var titleA=a.title.toLowerCase(), titleB=b.title.toLowerCase();
                        if (titleA < titleB) return -1;
                        if (titleA > titleB) return 1;
                        return 0;
                    });                     
                })
                .fail(function(errorData) {
                        ApiAlert(errorData);
                });         
        })
        .fail(function(errorData) { 
            appAlert("Application Error","We apologize but this application is not functioning properly. Please check again at a later date");
        });
}
*/

function renderCFrame() {
    app.setBreadcrumb([]);
    app.includeFormValidation=app.includePlaceholders=app.includeMultiSelect=true;
    app.render(showApp);
}
function showApp() {
    $("#app-content-left").load('html/body.html #maincontent', function() {
        setUpEvents();
     });
}
$(document).ready(function() {
    setUpQuestionAnswers();
    renderCFrame();
    loadData();
   
});