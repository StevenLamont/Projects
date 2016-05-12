var dineSafeComment = {
    /* we 'namespace' this due to conflict with complaints form which is similar'*/
    codeSelector : '#appCodeComments',
    displaySelector : '#appDisplayComments',
    formSelector : "#commentForm",
    maxCommentString : 1200,

    addFormInput : function (form, name, value) {
        var hf = document.createElement("input");
        hf.setAttribute("name", name);
        hf.setAttribute("value", value);
        form.appendChild(hf);
},
/* if the user has two on and entered in fields due to selection boxes, then turned them off, we need to blank out the data and perhaps they should exist at all*/
    dominoSubmit : function () {
    
        var jsonObj = {};
        jsonObj.Comment = $("#comSubmission").val();
        jsonObj.Name = $("#comSubmitterName").val();
        jsonObj.Email =  $("#comEmail").val();
        jsonObj.Phone = $("#comPhoneNumber").val();
        var jsonStr = JSON.stringify(jsonObj);
    
        var strBody = "<strong>Comments</strong> " + "<br>" + $("#comSubmission").val().replace(/(?:\r\n|\r|\n)/g, '<br>');
        strBody += "<br><strong>Name</strong> " + $("#comSubmitterName").val();
        strBody += "<br><strong>Email</strong> " + $("#comEmail").val();
        strBody += "<br><strong>Phone</strong> " + $("#comPhoneNumber").val();
        //strBody += "<br><br>" + $("#comSubmission").val().replace(/(?:\r\n|\r|\n)/g, '<br />') + "<br><br>";

        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("name", "_Submissions");
        form.setAttribute("action", "https://wi1qa.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
        //form.setAttribute("action", "https://domdev.toronto.ca/intra/city/wcmrep.nsf/Submissions?CreateDocument");
        
        dineSafeComment.addFormInput(form, "Subject",  "DineSafe Comment");
        dineSafeComment.addFormInput(form, "Body",  strBody);
        dineSafeComment.addFormInput(form, "Category",  "DineSafeComment");
        dineSafeComment.addFormInput(form, "JSON", jsonStr);
        dineSafeComment.addFormInput(form, "WCMForms_Name", $("input#comWCMForms_Name").val());
        dineSafeComment.addFormInput(form, "$$Return","[http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=d669dd604b3a2510VgnVCM10000071d60f89RCRD]");
        document.body.appendChild(form);
        form.submit();
    },

    setCharsLeft : function (cCount) {
        $('#comCountMessage').text( (dineSafeComment.maxCommentString - cCount) + " Characters Left");  
    },

    setupEvents :function () {
    
    //$("#commentLink").click(function (e) {
    //  $('#modalComment').modal('show');
    //});

    /* we can't do thos because of the textarea 
   $(".form-control").keypress(function (e) {
        var code = e.keyCode || e.which;
        if(code == 13) { //Enter keycode
           return validateForm();
        } 
    });
    */
    
  $( dineSafeComment.formSelector ).submit(function( event ) {
    //alert('preventing submit');
     event.preventDefault();
   });  
    
     $("#comSubmitBtn").click(function (e) {
        dineSafeComment.validateForm();
     });
     $("#comClearBtn").click(function (e) {
        $(dineSafeComment.formSelector).data('bootstrapValidator').resetForm();
        $(this).closest('form').find("input[type=text], textarea").val("");
        dineSafeComment.setCharsLeft(0);
     });
     
    $("#comSubmission").on('keyup', function() {
       dineSafeComment.setCharsLeft(this.value.length);
    });  
    

},

initForm: function() {
    //$('#modalComment').modal('show');//just for quicktestiong
    $(dineSafeComment.formSelector).bootstrapValidator({
    //excluded: [':hidden', ':not(:visible)'],
        feedbackIcons: {
            valid: 'glyphicon glyphicon-ok',
            invalid: 'glyphicon glyphicon-remove',
            validating: 'glyphicon glyphicon-refresh'
        },
        onSuccess: function(e) {
            dineSafeComment.dominoSubmit();
        },
        onError: function(e) {
            $($(".has-error input, .has-error select")[0]).focus();
        },
        fields: {   
            comSubmission: {
                row: '.right-inner-addon',
                message: 'Comments are required and limited to ' + dineSafeComment.maxCommentString + ' characters, including spaces',
                validators: {
                    stringLength: {
                    min: 1,
                    max: dineSafeComment.maxCommentString
                    },
                    notEmpty: {
                    }
                }   
            },
            comEmail: {
                validators: {
                    emailAddress: {
                        message: 'The value is not a valid email address'
                    }
                }
            },
            comPhoneNumber: {
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
     
    dineSafeComment.setCharsLeft(0);
    $("#comWCMForms_Name").hide(); //Hide honeypot
    dineSafeComment.setupEvents();
    $('#modalComment').modal('show');
},

drawForm: function() {
    if (document.location.hostname.length === 0) {
        $(dineSafeComment.displaySelector).load('html/commentForm.html', function() {
            dineSafeComment.initForm();
        }) ;
    } else {
        $(dineSafeComment.displaySelector).load('/static_files/WebApps/Health/DineSafe/html/commentForm.html', function() {
            dineSafeComment.initForm();
        }) ;
    }
},

validateForm: function() {
    dineSafeComment.initForm();
    $(dineSafeComment.formSelector).data('bootstrapValidator').validate();
},

/* getscript is async which causes some problems */
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
   var scriptArr = [];
   if (document.location.hostname.length === 0) {
   
        scriptArr = [
                        {type: 'link', src :'css/dineSafe.css'} ,
                        {type: 'link', src :'static_files/assets/validator/bootstrapValidator.min.css'} ,
                        {type: 'script', src :'static_files/assets/validator/bootstrapValidator.min.js'} ,
                        {type: 'script', src :'Static_files/assets/placeholders/placeholders.min.js'}
                    ];
    } else {

        scriptArr = [
    
                        {type: 'link', src :'/static_files/WebApps/Health/DineSafe/css/dineSafe.css'} ,
                        {type: 'link', src :'/static_files/assets/validator/bootstrapValidator.min.css'} ,
                        {type: 'script', src :'/static_files/assets/validator/bootstrapValidator.min.js'} ,
                        {type: 'script', src :'/placeholders/placeholders.min.js'}
                    ];
    }   

    var notLoaded =  dineSafeComment.checkLoaded(scriptArr);
    for (var i=0; i < notLoaded.length; i++) {
        if (notLoaded[i].type === 'script') {
            strCode += '<script type="text/javascript" src="' + notLoaded[i].src + '">';
        } else {
            strCode += '<link rel="stylesheet" href="' + notLoaded[i].src + '">';
        }
    }
    $(dineSafeComment.codeSelector).html(strCode);
    dineSafeComment.drawForm();
}

};

//http://stackoverflow.com/questions/11803215/how-to-include-multiple-js-files-using-jquery-getscript-method
$.getMultiScripts = function(arr, path) {
    var _arr = $.map(arr, function(scr) {
        return $.getScript( (path||"") + scr.src );
    });

    _arr.push($.Deferred(function( deferred ){
        $( deferred.resolve );
    }));

    return $.when.apply($, _arr);
};

$(document).ready(function() {
    if (document.location.protocol == "http:" && document.location.host == "www1.toronto.ca") {
        document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
    }
    //dineSafeComment.init();
    $("#commentLink").click(function (e) {
        dineSafeComment.init();
    });
 

});