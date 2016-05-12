var dineSafeComplaint = {
    codeSelector : '#appCodeComplaint',
    displaySelector : '#appDisplayComplaint',
    formSelector : "#complaintForm",
    maxCommentString : 1200,

     addFormInput : function (form, name, value) {
        var hf = document.createElement("input");
        hf.setAttribute("name", name);
        hf.setAttribute("value", value);
        form.appendChild(hf);
    },
/* if the user has two on and entered in fields due to selection boxes, then turned them off, we need to blank out the data and perhaps they should exist at all*/
dominoSubmit: function() {

    var jsonObj = {};
    jsonObj.EstablishmentName = $("#cmpEstName").val();
    jsonObj.EstablishmentAddress =  $("#cmpEstAddr").val();
    jsonObj.Comment = $("#cmpSubmission").val();
    jsonObj.Name = $("#cmpSubmitterName").val();
    jsonObj.Email =  $("#cmpEmail").val();
    jsonObj.Phone = $("#cmpPhoneNumber").val();
    var jsonStr = JSON.stringify(jsonObj);
    

    var strBody = "<strong>Establishment Name</strong>" + $("#cmpEstName").val();
    strBody += "<br><strong>Establishment Address</strong> " + $("#cmpEstAddr").val();
    strBody += "<br><strong>Name</strong> " + $("#cmpSubmitterName").val();
    strBody += "<br><strong>Email</strong> " + $("#cmpEmail").val();
    strBody += "<br><strong>Phone</strong> " + $("#cmpPhoneNumber").val();
    strBody += "<br><strong>Comments</strong> ";
    strBody += "<br>" + $("#cmpSubmission").val().replace(/(?:\r\n|\r|\n)/g, '<br />');

    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("name", "_Submissions");
    form.setAttribute("action", "https://wi1qa.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
  
    dineSafeComplaint.addFormInput(form, "Subject",  "DineSafe Complaint");
    dineSafeComplaint.addFormInput(form, "Body",  strBody);
    dineSafeComplaint.addFormInput(form, "Category",  "DineSafeComplaint");
    dineSafeComplaint.addFormInput(form, "JSON", jsonStr);
    dineSafeComplaint.addFormInput(form, "WCMForms_Name", $("input#cmpWCMForms_Name").val());
    dineSafeComplaint.addFormInput(form, "$$Return","[http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=d669dd604b3a2510VgnVCM10000071d60f89RCRD]");
    document.body.appendChild(form);
    form.submit();
},

setCharsLeft : function(cCount) {
    $('#cmpCntMsg').text( (dineSafeComplaint.maxCommentString - cCount) + " Characters Left");  
},
setupEvents : function() {

    //$("#complaintLink").click(function (e) {
    //   $('#modalComplaint').modal('show');
    //});

    /* we can't do thos because of the textarea 
    $(".form-control").keypress(function (e) {
        var code = e.keyCode || e.which;
        if(code == 13) { //Enter keycode
           return validateForm();
        } 
    });
    */
    
    $( dineSafeComplaint.formSelector ).submit(function( event ) {
        alert('preventing submitxx');
         e.stopPropagation();
    });  
    
    $("#cmpSubmitBtn").click(function (e) {
        dineSafeComplaint.validateForm();
     });
     $("#cmpClearBtn").click(function (e) {
        $(dineSafeComplaint.formSelector).data('bootstrapValidator').resetForm();
        $(this).closest('form').find("input[type=text], textarea").val("");
        dineSafeComplaint.setCharsLeft(0);
     });
     
    $("#cmpSubmission").on('keyup', function() {
        dineSafeComplaint.setCharsLeft(this.value.length);
    });  
    
    /* use shown and not show so we have the element */
    $('#modalComplaint').on('shown.bs.modal', function(e) {
        /* if inspection details open, default data from it */
        if (($("#inspectionDetails").data('bs.modal') || {}).isShown) {
            $('#cmpEstName').val($('#estName').html());
            $('#cmpEstAddr').val($('#estAddress').html());
        }
    });
    
    $('#modalComplaint').modal('show');
},

initForm : function() {
    //$('#modalComment').modal('show');//just for quicktestiong
    $(dineSafeComplaint.formSelector).bootstrapValidator({
    //excluded: [':hidden', ':not(:visible)'],
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        onSuccess: function(e) {
            dineSafeComplaint.dominoSubmit();
        },
        onError: function(e) {
            $($(".has-error input, .has-error select")[0]).focus();
        },
        fields: {   
            cmpSubmission: {
                row: '.right-inner-addon',
                message: 'Comments are required and limited to ' + dineSafeComplaint.maxCommentString + ' characters, including spaces',
                validators: {
                    stringLength: {
                    min: 1,
                    max: dineSafeComplaint.maxCommentString,
                    },
                    notEmpty: {
                    }
                }   
            },
            cmpEmail: {
                validators: {
                    emailAddress: {
                        message: 'The value is not a valid email address'
                    },
                }
            },
            cmpPhoneNumber: {
                row: '.right-inner-addon',
                validators: {
                    regexp: {
                        regexp: /^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
                        message: 'Telephone number format is incorrect'
                    }
                }           
            }
        }
     });
     
    dineSafeComplaint.setCharsLeft(0);
    $("#cmpWCMForms_Name").hide(); //Hide honeypot
    dineSafeComplaint.setupEvents();
},
drawForm : function() {

    if (document.location.hostname.length === 0) {
        $(dineSafeComplaint.displaySelector).load('html/complaintForm.html', function() {
            dineSafeComplaint.initForm();
        }) ;
    } else {
        $(dineSafeComplaint.displaySelector).load('/static_files/WebApps/Health/DineSafe/html/complaintForm.html', function() {
            dineSafeComplaint.initForm();
        }) ;
    }
},

validateForm: function()  {
    dineSafeComplaint.initForm();
    $(dineSafeComplaint.formSelector).data('bootstrapValidator').validate();
},

checkLoaded: function(srcArr) {

    var notLoaded = [];
    for (var i = 0; i < srcArr.length; i++) {
        var checkAttr = (srcArr[i].type === "script" ? "src" : "href");
        var len = $(srcArr[i].type).filter(function () {
            return ($(this).attr(checkAttr) == srcArr[i].src);
        }).length;
        if (len === 0) {
            notLoaded.push(srcArr[i]);
        } else {
            console.log(srcArr[i].src + " already loaded");
        }
    }
    return notLoaded;
},
/* Note: css/js is already loaded in the main dineSafe.js*/
init : function() {
   var strCode="";
   if (document.location.hostname.length === 0) {
          var scriptArr = [
                        {type: 'link', src :'css/dineSafe.css'} ,
                        {type: 'link', src :'static_files/assets/validator/bootstrapValidator.min.css'} ,
                        {type: 'script', src :'static_files/assets/validator/bootstrapValidator.min.js'} ,
                        {type: 'script', src :'Static_files/assets/placeholders/placeholders.min.js'}
                    ];
 
   
} else {
       var scriptArr = [
    
                        {type: 'link', src :'/static_files/WebApps/Health/DineSafe/css/dineSafe.css'} ,
                        {type: 'link', src :'/static_files/assets/validator/bootstrapValidator.min.css'} ,
                        {type: 'script', src :'/static_files/assets/validator/bootstrapValidator.min.js'} ,
                        {type: 'script', src :'/placeholders/placeholders.min.js'}
                    ];

}   
    var notLoaded =  dineSafeComplaint.checkLoaded(scriptArr);
    for (var i=0; i < notLoaded.length; i++) {
        if (notLoaded[i].type === 'script') {
            strCode += '<script type="text/javascript" src="' + notLoaded[i].src + '">';
        } else {
            strCode += '<link rel="stylesheet" href="' + notLoaded[i].src + '">';
        }
    }
    $(dineSafeComplaint.codeSelector).html(strCode);
    dineSafeComplaint.drawForm();
    
}
}

$(document).ready(function() {
    if (document.location.protocol == "http:" && document.location.host == "www1.toronto.ca") {
        document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
    }
  
    $("#complaintLink").click(function (e) {
        dineSafeComplaint.init();
    });
 

});