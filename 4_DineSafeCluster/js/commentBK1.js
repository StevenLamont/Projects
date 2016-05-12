var codeSelector = '#appCodeComments';
var displaySelector = '#appDisplayComments';
var maxCommentString = 1200;

/* if the user has two on and entered in fields due to selection boxes, then turned them off, we need to blank out the data and perhaps they should exist at all*/
function dominoSubmit() {
  var strBody = "<strong>Name" + $("#commentatorName").val();
  strBody += "<br><strong>Comments</strong> " + $("#submission").val();
  strBody += "<br><br>" + $("#submission").val().replace(/(?:\r\n|\r|\n)/g, '<br />') + "<br><br>";

  var form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("name", "_Submissions");
  form.setAttribute("action", "https://wi1qa.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
  var hf = document.createElement("input");
  hf.setAttribute("name", "Subject");
  hf.setAttribute("value", "DineSafe Comment");
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "Body");
  hf.setAttribute("value", strBody);
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "Category");
  hf.setAttribute("value", "DineSafeComment");
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "form");
  hf.setAttribute("value", "Submissions");
  hf = document.createElement("input");
  hf.setAttribute("name", "WCMForms_Name");
  hf.setAttribute("value", $("input#WCMForms_Name").val());
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "$$Return");
  //TODO: This is wrong ans is the production film one
  hf.setAttribute("value", "[http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=d669dd604b3a2510VgnVCM10000071d60f89RCRD]");
  form.appendChild(hf);
  document.body.appendChild(form);
  form.submit();
}

function setCharsLeft(cCount) {
    $('#count_message').text( (maxCommentString - cCount) + " Characters Left");  
}
function  setupEvents() {

    $("#commentLink").click(function (e) {
       $('#modalComment').modal('show');
    });

    /* we can't do thos because of the textarea 
   $(".form-control").keypress(function (e) {
        var code = e.keyCode || e.which;
        if(code == 13) { //Enter keycode
           return validateForm();
        } 
    });
    */
    
  $( "#commentForm" ).submit(function( event ) {
    alert('preventing submit');
     event.preventDefault();
   });  
    
     $("#submitBtn").click(function (e) {
        validateForm();
     });
     $("#clearBtn").click(function (e) {
        $("#commentForm").data('bootstrapValidator').resetForm();
        $(this).closest('form').find("input[type=text], textarea").val("");
        setCharsLeft(0);
     });
     
    $("#submission").on('keyup', function() {
       setCharsLeft(this.value.length);
    });  
    

}

function initForm() {
    //$('#modalComment').modal('show');//just for quicktestiong
    $("#commentForm").bootstrapValidator({
    //excluded: [':hidden', ':not(:visible)'],
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        onSuccess: function(e) {
            dominoSubmit();
        },
        onError: function(e) {
            $($(".has-error input, .has-error select")[0]).focus();
        },
        fields: {   
            submission: {
                row: '.right-inner-addon',
                message: 'Comments are required and limited to ' + maxCommentString + ' characters, including spaces',
                validators: {
                    stringLength: {
                    min: 1,
                    max: maxCommentString,
                    },
                    notEmpty: {
                    }
                }   
            },
            email: {
                validators: {
                    emailAddress: {
                        message: 'The value is not a valid email address'
                    },
                }
            },
            phoneNumber: {
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
     
    setCharsLeft(0);
    $("#WCMForms_Name").hide(); //Hide honeypot
    setupEvents();
}
function drawForm() {

    if (document.location.hostname.length === 0) {
        $(displaySelector).load('html/commentForm.html', function() {
            initForm();
        }) ;
    } else {
        $(displaySelector).load('/static_files/WebApps/Health/DineSafe/html/commentForm.html', function() {
            initForm();
        }) ;
    }
}

function validateForm() {
    initForm();
    $('#commentForm').data('bootstrapValidator').validate();
}



function init() {
   var strCode="";
   if (document.location.hostname.length === 0) {
    strCode = '<link rel="stylesheet" href="css/dineSafe.css">';
    strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';
    strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';
    strCode += '<script type="text/javascript" src="static_files/assets/placeholders/placeholders.min.js"></script>';
} else {
    strCode = '<link rel="stylesheet" href="/static_files/WebApps/Health/DineSafe/css/dineSafe.css">';
    strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
    strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
    strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';

}   
    $(codeSelector).html(strCode);
    drawForm();
    
}


$(document).ready(function() {
  if (document.location.protocol == "http:" && document.location.host == "www1.toronto.ca") {
    document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
  }
  init();


});