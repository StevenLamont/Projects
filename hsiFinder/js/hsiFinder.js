/* 
  Author: Steve Lamont
  Date: 2016/10/01

  Notes:
    1) The rules should have a NOT operator.  For now, there is only one know instance where it matters (Not ODSP).  We created a special rule for it and put in special logic here.
*/
var APP_EVENT_TYPE = "hsi_service_benefit"; 
var EVENT_TYPE_APPROVE_STATUS = 'APR';
//var API_HOST = "https://was8-inter-dev.toronto.ca";
var API_HOST = "https://was-inter-qa.toronto.ca";
//Normal Situation.
//var API_HOST = "";

var gblJSONData = "";
var gblFilteredData = [];
var gblBaselineCnt = 0;
var gblMaxReportHeight = 640;

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
{"text": "AGE: Age Group 4 (60-64)", "value": "Age 60-64"},
{"text": "AGE: Age Group 5 (65+)", "value": "Age 65+"},
{"text": "FINANCIAL NEED: Yes", "value": "Financial Need"},
{"text": "FINANCIAL NEED: No", "value": "No Financial Need"},
{"text": "FINANCIAL NEED: Don't Know", "value": "Unsure Financial Need"},
{"text": "RECIPIENT: Ontario Works", "value": "OW"},
{"text": "RECIPIENT: Ontario Disability Support", "value": "ODSP"},
{"text": "RECIPIENT: NOT Ontario Disability Support", "value": "NOT ODSP"},
{"text": "RECIPIENT: Subsidized Housing/Rent", "value": "Subsidized Housing"},
{"text": "CHILDREN: All Age Groups", "value": "Has Children"},
{"text": "CHILDREN: Age Group 1 (12 and under)", "value": "Child Ages 12 and under"},
{"text": "CHILDREN: Age Group 2 (13-17)", "value": "Child Ages 13-17"},
{"text": "CHILDREN: Age Group 3 (expecting)", "value": "Expecting Child"},
{"text": "EMPLOYMENT: Looking for Work", "value": "Looking For Work"},
{"text": "EMPLOYMENT: Looking to Upgrade Skills","value": "Looking To Upgrade"},
{"text": "HOUSING: Own","value": "Home Owner"},
{"text": "HOUSING: Rent","value": "Renter"},
{"text": "HOUSING: Homeless","value": "Homeless"},
{"text": "HOUSING: None of the above","value": "None of the Above"},
{"text": "HOUSING: Risk of Eviction","value": "Eviction Risk"},
{"text": "HOUSING: Need Subsidized Housing","value": "Need Subsidized Housing"},
{"text": "HOUSING: Looking for Housing","value": "Looking for Housing"},
{"text": "HOUSING: Need Landlord Help","value": "Need Landlord Help"},
{"text": "HEALTH/HOME NEED: Medical","value": "Medical Need"},
{"text": "HEALTH/HOME NEED: Home Safety","value": "Home Safety"},
{"text": "HEALTH/HOME NEED: Home Utilities","value": "Home Utilities"},
{"text": "SPECIAL NEEDS: Yes","value": "Special Needs Yes"},
{"text": "SPECIAL NEEDS: No","value": "Special Needs No"},
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
function dynamicSort(root, property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }

    return function (a,b) {
        var result = 0;
        if (root !== "") {
            result = (a[root][property].toLowerCase() < b[root][property].toLowerCase()) ? -1 : (a[root][property].toLowerCase() > b[root][property].toLowerCase()) ? 1 : 0;
        } else {
            result = (a[property].toLowerCase() < b[property].toLowerCase()) ? -1 : (a[property].toLowerCase() > b[property].toLowerCase()) ? 1 : 0;
        }
        return result * sortOrder;
    };
}

var app = new cot_app("Service and Benefit Finder Tool");

function setTitle(step) {
    if (step[0].id !== 'step0') {
        $("#wizardTitle").html(step.attr("data-title"));
    } else {
        $("#wizardTitle").html(step.attr("data-title") + "<img src='img/finderTool.png' alt='finder tool logo' height='80px'/>");
    }
}
function prevStep() {
    var currentO = $(".step.active");
    var prev1 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) - 1).toString());
    var prev2 = $("#step" + (parseInt($(".step.active").attr('data-step'),10) - 2).toString());
    //$("#finishstep").addClass("hide");
    $("#nextstep").removeClass("hide");
    
    currentO.removeClass("active");
    prev1.addClass("active");
    $("#prevstep").attr("disabled",(prev2.length===0 ));
    $("#nextstep").attr("disabled",false);
    setTitle(prev1);
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
    setTitle(next1);
    updateProgressBar();
}
function startStep() {
    $("#finishstep").addClass("hide");
    $("#nextstep").removeClass("hide");
    $("#nextstep").attr("disabled", false);
    $("#prevstep").attr("disabled",false);
    $("#wizardSummary").addClass("hide");
    $("#wizard").removeClass("hide");
    $("#step1").addClass("active");
    setTitle($("#step1"));
    updateProgressBar();
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
    setTitle($("#step"+ stepId));
    updateProgressBar();
       

}

function addGotoStep(stepid) {

    return "<a class='pull-right' data-stepid='" + stepid + "' href=''><span class='sr-only'>change</span><i title='change' class='glyphicon glyphicon-pencil'></i></a>";

}

function finishStep() {
    setUpQuestionAnswers();
    var sHTML = "<ul>", sTemp="", arrTemp=[];
    
    //console.log("Question Values");
    $('#maincontent input:checked').each(function() {
        if (typeof $(this).data('qval') !== 'undefined') {
            questions[$(this).data('qval')] = true;
            //console.log($(this).data('qval'));
        }
    });
    
    
    //RESIDENT STATUS
    var currentStep = 1;
    sHTML += ($("#torontoresident:checked").length>0) ? "<li><span class='label'>Toronto Resident</span>: Yes" : "";
    sHTML += ($("#nottorontoresident:checked").length>0) ?"<li><span class='label'>Toronto Resident</span>: No" : "";
    sHTML += ($("#torontoresident:checked").length===0 && $("#nottorontoresident:checked").length===0) ?"<li class='unspecified'><span class='label'>Toronto Resident</span>: Unspecified" : "";
    sHTML += addGotoStep(currentStep) + "</li>" ;
    
    //AGE GROUP
    currentStep = 2;
    if ($(".filterage input:checked").length > 0) {
        sHTML += "<li><span class='label'>Age</span>: " + $(".filterage input:checked").val();
        //questions[$(".filterage input:checked").data('qval')] = true;
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Age</span>: Unspecified";
    }
    sHTML += addGotoStep(currentStep) + "</li>" ;
    
     
    //FINANCIAL NEED
    currentStep = 3;
    sHTML += ($("#financialneedyes:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: Yes" : "";
    sHTML += ($("#financialneedno:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: No" : "";
    sHTML += ($("#financialneeddontknow:checked").length>0) ? "<li><span class='label'>In Financial Need</span>: Not Sure" : "";
    sHTML += ($("#financialneeddontknow:checked").length===0 && $("#financialneedno:checked").length===0 && $("#financialneedyes:checked").length===0) ? "<li class='unspecified'><span class='label'>In Financial Need</span>: Unspecified" : "";
    sHTML += addGotoStep(currentStep) + "</li>" ;
    //SUBSIDY STATUS
    //if ($("#ow:checked").length>0) {
    //    questions["OW"] = true;
    //}
    sHTML += ($("#ow:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Ontario Works" + addGotoStep(currentStep) + "</li>" :"";
    sHTML += ($("#odsp:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Ontario Disability Support Program" + addGotoStep(currentStep) + "</li>" :"";
    sHTML += ($("#tch:checked").length>0) ? "<li><span class='label'>Recipient of</span>: Subsidized Housing/Rent Subsidy" + addGotoStep(currentStep) + "</li>" :"";
    if ($("#step3b").find("input:checked").length === 0 || $("#finNone:checked").length > 0) {
        sHTML += "<li class='noselection'><span class='label'>Financial Need Recipient</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }    
    /* Special processing -- manually set NOT ODSP */
    if ($("#odsp:checked").length === 0) {
        questions["NOT ODSP"] = true; 
    }
    
    
    //CHILDRENS AGES
    currentStep = 4;
    arrTemp = [];
    if ($("#childagerange1:checked").length>0) { arrTemp.push($("#childagerange1").val()); }
    if ($("#childagerange2:checked").length>0) { arrTemp.push($("#childagerange2").val()); }
    if ($("#childagerange3:checked").length>0) { arrTemp.push($("#childagerange3").val()); }
    
    /* special question processing. This is a one-time special occurrence */
    if (arrTemp.length > 0) {
        sHTML += "<li><span class='label'>Children's Ages</span>: " + arrTemp.join(", ") + addGotoStep(currentStep)  + "</li>";
        questions["Has Children"] = true;   
    } else {
        sHTML += "<li class='noselection'><span class='label'>Children's Ages</span>: No Selections" + addGotoStep(currentStep)  + "</li>";
    }
    
    
    //EMPLOYMENT STATUS
    currentStep = 5;

    sHTML += ($("#lookingforwork:checked").length > 0) ? "<li><span class='label'>Employment Status</span>: " + $("#lookingforwork:checked").val()  + addGotoStep(currentStep) + "</li>": "";
    sHTML += ($("#lookingtoupgrade:checked").length > 0) ? "<li><span class='label'>Employment Status</span>: " + $("#lookingtoupgrade:checked").val() + addGotoStep(currentStep) + "</li>" : "";
    sHTML += ($("#eiNone:checked").length > 0) ? "<li class='noselection'><span class='label'>Employment Status</span>: No Selections" + addGotoStep(currentStep) + "</li>" : "";
    if ($("#step5").find("input:checked").length === 0) {
        sHTML += "<li class='noselection'><span class='label'>Employment Status</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }

        
    //HOUSING STATUS
    currentStep = 6;
    if ($("input[name='housing']:checked").length > 0) {
        sHTML += "<li><span class='label'>Housing Status</span>: " + $("input[name='housing']:checked").val();
    } else {
        sHTML += "<li class='unspecified'><span class='label'>Housing Status</span>: Unspecified"; 
    }
    sHTML += addGotoStep(currentStep) + "</li>" ;
    
    sHTML += ($("#riskofeviction:checked").length > 0) ? "<li><span class='label'>Housing Status Other</span>: " + $("#riskofeviction:checked").val() +  addGotoStep(currentStep) + "</li>": "";
    sHTML += ($("#needsubsidizedhousing:checked").length > 0) ? "<li><span class='label'>Housing Status Other</span>: " + $("#needsubsidizedhousing:checked").val() +  addGotoStep(currentStep) + "</li>": "";
    sHTML += ($("#lookingforhousing:checked").length > 0) ? "<li><span class='label'>Housing Status Other</span>: " + $("#lookingforhousing:checked").val() +  addGotoStep(currentStep) + "</li>": "";
    sHTML += ($("#needlandlordhelp:checked").length > 0) ? "<li><span class='label'>Housing Status Other</span>: " + $("#needlandlordhelp:checked").val() +  addGotoStep(currentStep) + "</li>": "";
    
    if ($("#step6b").find("input:checked").length === 0 || ($("#hsNone:checked").length > 0)) {
        sHTML += "<li class='noselection'><span class='label'>Housing Status Other</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }
    
    
    //Health and Safetly Info
    currentStep = 7;
    var financialCnt = 0;
    if ($("#medicalordental:checked").length > 0) {financialCnt++; sHTML += "<li><span class='label'>Health and Home Need</span>: Medical/Dental" + addGotoStep(currentStep) + "</li>";}
    if ($("#homesafety:checked").length > 0) {financialCnt++; sHTML += "<li><span class='label'>Health and Home Need</span>: Home Safety" + addGotoStep(currentStep) + "</li>";}
    if ($("#homeutilities:checked").length > 0) {financialCnt++; sHTML += "<li><span class='label'>Health and Home Need</span>: Home Safety" + addGotoStep(currentStep) + "</li>";}
    if (financialCnt === 0 ) {
        sHTML += "<li class='noselection'><span class='label'>Health and Home Need</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }    
    
    
    //DISABILITY STATUS
    currentStep = 8;
    var disabilityCnt = 0;
    if ($("#specialneedsYes:checked").length > 0) {disabilityCnt++; sHTML += "<li><span class='label'>Disability or Special Needs</span>: Yes" + addGotoStep(currentStep) + "</li>";}
    if ($("#specialneedsNo:checked").length > 0) {disabilityCnt++; sHTML += "<li><span class='label'>Disability or Special Needs</span>: No" + addGotoStep(currentStep) + "</li>";}
    if (disabilityCnt === 0) {
        sHTML += "<li class='noselection'><span class='label'>Disability or Special Need</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }    
    //OTHER
    currentStep = 9;
    var otherCnt = 0;
    if ($("#incarcerated:checked").length > 0) {otherCnt++; sHTML += "<li>About to be or recently released from prison" + addGotoStep(currentStep) + "</li>";}
    if ($("#funeral:checked").length > 0) {otherCnt++; sHTML += "<li>In need of help to pay for funeral" + addGotoStep(currentStep) + "</li>";}
    if (otherCnt === 0) {
        sHTML += "<li class='noselection'><span class='label'>Other Information</span>: No Selections" + addGotoStep(currentStep) + "</li>";
    }
    //Add Summary
    sHTML += "</ul>";
    $("#summarydetails").html(sHTML);
    $("#wizardSummary").removeClass("hide");
    $(".step").removeClass("active");
    $("#wizard").addClass("hide");
   
    //$('.nav-tabs li').tooltip();
    //loadData(); -- SML: now done on load.
    showBaseline();
    
    // add in Test.. if some unspecified.. add message */
    if ($("#summarydetails li.unspecified").length > 0) {
        $("#unspecifiedmsg").removeClass("hide");
    } else {
        $("#unspecifiedmsg").addClass("hide");
    }

}

function updateProgressBar() {
    var totalStep = $(".step").length -1;
    var currentStep = parseInt($(".step.active").attr('data-step'),10);
    var percent = Math.round((currentStep/totalStep) * 100);
    $("#stepprogress").css('width', percent + '%');
    $("#stepprogress").attr('aria-valuenow', percent);
    console.log(Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
    if (Math.max(document.documentElement.clientWidth, window.innerWidth || 0) < 480) { 

        if (currentStep > 2) {
            $("#stepprogress").html("Step " + currentStep + " of " + totalStep);
        } else if (currentStep > 1) {
            $("#stepprogress").html(currentStep + " of " + totalStep);
        } else {
            $("#stepprogress").html(currentStep);
        }
    } else {
        $("#stepprogress").html("Step " + currentStep + " of " + totalStep);
    }
    $('#wizard :input:enabled:visible:first').focus();
    
}

function processRule(rule) {
    //Rule is an object of subrubles which we process in order.
    var expression = "";
    $.each(rule, function(i,rule) {
        //console.log(rule.op,rule.subrule);
        if (rule.op !== "") {
            expression += rule.op.toLowerCase() === "or" ? "||" : "&&";
        }
        expression += questions[rule.subrule];
    });

 
    //console.log("Rule expression", expression, eval(expression));
    
    var ret = false;
    try {
        ret = eval(expression);
    } catch (e) {
        ret = false;
    }
    return ret;
}

function showBaseline() {

    var sHTML = "";
    gblBaselineCnt = 0;
    gblFilteredData = [];
    $("#hsi_housing, #hsi_childcare,#hsi_employment, #hsi_benefit, #hsi_medical").html("");
    $.each( gblJSONData, function(i, item) {
        //console.log("title: " + item.title);
        itemSelect = false;
        if (typeof item.rules === 'undefined' || item.rules.length === 0) {
            //console.log(item.title, " No Rule");
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
            //console.log(item.title);
            $.each(item.rules, function(i, rule) {
                //console.log(rule.rule, rule.ruleStatus);
            });
            try {
                itemSelect = eval(expression);
            } catch (e) {
                itemSelect = false;
            }
        }
        if (itemSelect) {
            gblFilteredData.push(item);
            gblBaselineCnt++;
            //console.log("selecting--> " + item.title);
            sHTML = getRow(item);
            if (typeof item.category === 'string') {
                item.category = [item.category];
            }
            if ($.inArray( "Childcare", item.category ) > -1)  {$("#hsi_childcare").append(sHTML);}
            if ($.inArray( "Employment", item.category) > -1)  {$("#hsi_employment").append(sHTML);}
            if ($.inArray( "Housing", item.category ) > -1)  {$("#hsi_housing").append(sHTML);}
            if ($.inArray( "Medical", item.category ) > -1)  {$("#hsi_medical").append(sHTML);}
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
    if (gblBaselineCnt > 0 ) { $("#gotoTop").show(); } else { $("#gotoTop").hide();}
    //if ($("#app-content-top").get(0).scrollHeight <= (gblMaxReportHeight + $("#summaryfooter").get(0).scrollHeight )) 
    resetSearch();
    $("#hsi_searchresults, #hsi_searchresultscount").removeClass("hide");
    
    var x = $("#hsi_tabs")[0].getBoundingClientRect();
    var eleWidth = $("#gotoTop").width();
    $("#gotoTop").css("left", x.left + x.width - eleWidth);
    
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
            sIMG = (item.category.indexOf("Housing") > -1) ? "housing.png" : (item.category.indexOf("Childcare") > -1) ? "childcare.png" : (item.category.indexOf("Medical") > -1) ? "medical.png" : "employment.png";          
            sHTML += "<img src='img/" + sIMG + "' title ='" + item.category + "' alt='" + item.category + " icon'/>";
        sHTML += "</div>";
        sHTML += "<div class='col-xs-12 col-sm-6'>";
            sHTML += "<h3><a href='" + item.link + "' target='_blank'>" + item.title + "</a></h3>";
            sHTML += "<p>" + item.description + "</p>";
        sHTML += "</div>";
        sHTML += "<div class='col-xs-12 col-sm-4'>";
            sRLHTML = "";
            if (typeof item.relatedlinks !== 'undefined' && item.relatedlinks.length > 0) { 
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
                //sHTML += "<span title='This item is a Subsidy/Benefit' class='glyphicon glyphicon-star-empty'</span>";
                sHTML += "<img src='img/benefit.png' title ='This item is a Subsidy/Benefit' alt='Subsidy/Benefit icon'/>";
            sHTML += "</div>";
        }
    sHTML += "</div>";
    return sHTML;
}



function setUpEvents() {

    gblMaxReportHeight =  $("#app-content-top").get(0).scrollHeight;

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
    
    $("#gotoTop").on("click", function(event) {
        window.scrollTo(0, $("#hsi_tabs").offset().top);
        event.preventDefault();
    });
    
    $(window).resize(function() {
        var x = $("#hsi_tabs")[0].getBoundingClientRect();
        var eleWidth = $("#gotoTop").width();
        $("#gotoTop").css("left", x.left + x.width - eleWidth);
    }); 

    
    $(".nota").on("click", function(event) {
        var me = $(this);
        if (me.prop('checked')) {
            $.each(me.parent().parent().find(':input:checked'), function(i, item) {
                if (item.id !== me[0].id) {
                    console.log(item.id, me.id);
                    $(item).prop('checked', false);
                }
            });
        }
    });
    $(".notnota").on("click", function(event) {
        var me = $(this);
        if (me.prop('checked')) {
            $.each(me.parent().parent().find('.nota:checked'), function(i, item) {
                $(item).prop('checked', false);
            });
        }
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

function loadData() {

    var strURL = API_HOST + "/cc_sr_v1/data/" + APP_EVENT_TYPE + "_" + EVENT_TYPE_APPROVE_STATUS + "?limit=1000";
    gblJSONData = [];
    var request = $.ajax({
                url : strURL,
                type : "GET",
                timeout: 500,
                crossDomain: true, 
                dataType: 'jsonp',
                success : function(data) {
                    gblJSONData = data.sort(dynamicSort("","title"));
                },
                error: function (jqXHR, exception) {
                    appAlert("Application Error","We apologize but this application is not functioning properly. Please check again at a later date");
                    console.log(jqXHR);
                }
            });     
}


function renderCFrame() {
    app.setBreadcrumb([]);
    app.includeFormValidation=app.includePlaceholders=app.includeMultiSelect=true;
    app.render(showApp);
}
function showApp() {
    $("#maincontent").load('html/body.html #finderMain', function() {
        setUpEvents();
        $('[data-toggle="tooltip"]').tooltip({ trigger : 'hover'});
        
     });
}
$(document).ready(function() {
    setUpQuestionAnswers();
    renderCFrame();
    loadData();
   
});