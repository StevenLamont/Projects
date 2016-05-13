// City of Toronto
var codeSelector = '#appCode';
var displaySelector = '#appDisplay';
var idFormSelector = "#fireComplaintForm"; //THE ID OF THE FORM
var cnt = 2;
var sentFormData = "";
var firstNameValidators = {
    row: '.right-inner-addon', // The name is placed inside a  right-inner-addon class element
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'First name must be less than 50 characters long'
      },
      regexp: {
        regexp: /^[a-z\s]+$/i,
        message: 'First name must consist of alphabetical characters and spaces only'
      },
      notEmpty: {
        message: 'First name field is required and cannot be left blank'
      }
    }
  },
  lastNameValidators = {
    row: '.right-inner-addon', // The name is placed inside a  right-inner-addon class element
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Last name must be less than 50 characters long'
      },
      regexp: {
        regexp: /^[a-z\s]+$/i,
        message: 'Last name must consist of alphabetical characters and spaces only'
      },
      notEmpty: {
        message: 'Last name field is required and cannot be left blank'
      }
    }
  },  
  emailValidators = {
    row: '.right-inner-addon', // The name is placed inside a  right-inner-addon class element
        validators: {
            emailAddress: {
                message: 'The input is not a valid email address'
            },
        }
  },
  phoneValidators = {
    row: '.right-inner-addon',
    validators: {
      phone: {
        country: 'US',
        message: 'The input is not a valid phone number'
      },
      notEmpty: {
        message: 'Phone field is required and cannot be left blank'
      }
    }
  },
  addressValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Address must be less than 50 characters long'
      },
      regexp: {
        regexp: /^[a-zA-Z0-9\-\s\.]+$/,
        message: 'Address must consist of alphabetical, number and underscore'
      }
    }
  },
witnessNameValidators = {
    row: '.right-inner-addon', // The name is placed inside a  right-inner-addon class element
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: ' Witness Name must be less than 50 characters long'
      },
      regexp: {
        regexp: /^[a-z\s]+$/i,
        message: 'Witness Name must consist of alphabetical characters and spaces only'
      }
    }
  },
  witnessPhoneValidators = {
    row: '.right-inner-addon',
    validators: {
      phone: {
        country: 'US',
        message: 'Phone is not a valid phone number'
      }
    }
  };
  
function init() {
    var strCode="";
    if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="css/fireComplaintForm.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/validator/bootstrapValidator.min.js"></script>';
        strCode += '<script src="static_files/assets/timepicker/moment-with-locales.min.js"></script>';
        strCode += '<link rel="stylesheet" href="static_files/assets/datepicker/datepicker.css">';
        strCode += '<script src="static_files/assets/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<link rel="stylesheet" href="static_files/assets/timepicker/bootstrap-timepicker.min.css">';
        strCode += '<script src="static_files/assets/timepicker/bootstrap-timepicker.min.js"></script>';
        strCode += '<script type="text/javascript" src="placeholders/placeholders.min.js"></script>';
  } else {
        strCode += '<link rel="stylesheet" href="/static_files/WebApps/Forms/Fire/css/fireComplaintForm.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
        strCode += '<script src="/static_files/assets/timepicker/moment-with-locales.min.js"></script>';
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<script src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<link rel="stylesheet" href="/static_files/assets/timepicker/bootstrap-timepicker.min.css">';
        strCode += '<script src="/static_files/assets/timepicker/bootstrap-timepicker.min.js"></script>';
        strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
  }
  $(codeSelector).html(strCode);
}
// add new row for suspects
function addRows() {
  if (cnt == 6) {
    $('#max').html('<span>If there are more witnesses involved, please include their information in the Description of your complaint above.</span>');
    $('#add-row').prop('disabled', true); // disabled button after 5th entry
  } else {
    var addRowStr = '<fieldset class="moreWitness"><legend class="sr-only">Is anyone else aware of what took place? Please include any witnesses: </legend>';   
    addRowStr += '<div class="form-group col-md-6"><label class="control-label hidden-lg" for="WitnessName' + cnt + '">Name:</label><div class="right-inner-addon"><input id="WitnessName' + cnt + '" class="form-control" type="text"  name="WitnessName' + cnt + '" value=""></div></div>';
    addRowStr += '<div class="form-group col-md-3"><label class="control-label hidden-lg" for="WitnessPhone' + cnt + '">Phone number:</label><div class="right-inner-addon"><input id="WitnessPhone' + cnt + '" class="form-control" type="text" placeholder="999-999-9999" name="WitnessPhone' + cnt + '" value="" maxlength="14"></div></div>';
    addRowStr += '<div class="form-group col-md-3"><label class="control-label hidden-lg" for="WitnessEmail' + cnt + '">Email:</label><div class="right-inner-addon"><input id="WitnessEmail' + cnt + '" class="form-control" type="text" placeholder="jsmith@example.org" name="WitnessEmail' + cnt + '" value=""></div></div>';
    addRowStr +='</fieldset>';
    $('#addRow').append(addRowStr).find('#WitnessName' + cnt).focus();
    $(idFormSelector).bootstrapValidator('addField', 'WitnessName' + cnt, witnessNameValidators);
    $(idFormSelector).bootstrapValidator('addField', 'WitnessPhone' + cnt, witnessPhoneValidators);
    $(idFormSelector).bootstrapValidator('addField', 'WitnessEmail' + cnt, emailValidators);
    cnt++;
  }
}
function removeRows() {
  if (cnt == 6) {
    $('#max').remove();
    $('#add-row').prop('disabled', false); // enabled button after removing the rows 
    $('.moreWitness').remove();
    cnt = 2;
  } else {
    $('.moreWitness').remove();
    cnt = 2;
  }
}
function clearForm() {
  removeRows();
  $(idFormSelector).data('bootstrapValidator').resetForm();
  $('#results').text('');
}
// store form value to hidden field and submit Form data 
function initForm() {
  // time picker
    $('#IncidentTime').timepicker({
        showSeconds: false,
        defaultTime: '12:00 AM',
        autoclose: true
    }).on('changeTime.timepicker', function(e) {
        //autoclose: true;
    }).focusout(function() {
       // autoclose: true;
    }).keydown(function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 9) {
            $('#IncidentTime').timepicker('hideWidget');
        }
    });
    $('#IncidentTime').focus(function() {
        $('#IncidentTime').timepicker('showWidget');
    });
    // date picker 
    $('#IncidentDate').datepicker({
        format: 'mm/dd/yyyy',
        endDate: '+0d',
        autoclose: true,
        startDate: '01/01/2001'
    }).on('changeDate', function(e) {
        //$('#' + idForm).data('bootstrapValidator').updateStatus('ContentProviderNetwork', "NOT_VALIDATED");
        $(idFormSelector).bootstrapValidator('revalidateField', 'timeFrameValidator');
        $('#IncidentDate').datepicker('hide');
        $('#IncidentDate').focus();
    }).keydown(function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if (key == 9) {
            $('#IncidentDate').datepicker('hide');
        }
    });

    $('.tframe').on('change', function() {
        $(idFormSelector).bootstrapValidator('revalidateField', 'timeFrameValidator');
    });
    // Form validation
    $(idFormSelector).bootstrapValidator({
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
            'FirstName': firstNameValidators,
            'LastName': lastNameValidators,
            'Phone': phoneValidators,
            'Address': addressValidators,
            'WitnessPhone1':  witnessPhoneValidators ,
            'WitnessName1': witnessNameValidators,
            'WitnessEmail1': emailValidators,
            TFSemployeeName: {
                validators: {
                    stringLength: {
                        min: 1,
                        max: 50,
                        message: 'Name must be less than 50 characters long'
                    },
                   // regexp: {
                   //     regexp: /^[a-z\s]+$/i,
                   //     message: 'Name must consist of alphabetical characters and spaces only'
                   // }
                }
            },
            /*
            IncidentDate: {
                validators: {
                    date: {
                    format: 'MM/DD/YYYY'
                },
                    notEmpty: {
                    message: 'Incident date field is required.'
                },
                    callback: {
                        callback: function(value, validator) {
                            var dateEntered = new Date(value);
                            var currentDate = new Date();
                            if (dateEntered == ' ') return false;
                            if (dateEntered.getTime() > currentDate.getTime()) {
                                return {
                                    valid: false,
                                    message: 'Incident Date Should be today or past date'
                                };
                            } else {
                                return true;
                            }
                        }
                    }
                }
            },
            */
            Description: {
                validators: {
                    stringLength: {
                    min: 1,
                    max: 1000,
                    message: 'Incident description field must be less than 1000 characters long'
                    },
                    notEmpty: {
                        message: 'Incident description field is required.'
                    }
                }
            },
            DesiredOutcome: {
                validators: {
                    stringLength: {
                        min: 1,
                        max: 1000,
                        message: 'Desired Outcome field must be less than 1000 characters long'
                    }
                }
            },
            Email: {
                validators: {
                    emailAddress: {
                        message: 'The input is not a valid email address'
                    },
                }
            },
            timeFrameValidator: {
                selector: '.tframe',  
                validators: {
                    callback: {
                    message: 'Either incident date or one of the time frame checkboxes must be entered.',
                    callback: function(value, validator, $field) {
                        var cnt = 0;
                        if ($("input#timeFrame1").prop("checked")) cnt++;
                        if ($("input#timeFrame2").prop("checked")) cnt++;
                        if ($("input#timeFrame3").prop("checked")) cnt++;
                        if ($("input#IncidentDate").val() > "") cnt++;

                        if (cnt === 1) {
                            // Update the status of callback validator for all fields
                            validator.updateStatus('timeFrameValidator', validator.STATUS_VALID, 'callback');
                            return true;
                        } else {
                            return false;
                        }
                        },
                    }
                }
            },  
            timeOfDayValidator: {
                selector: '.tod',  
                validators: {
                    callback: {
                    message: 'Only one of the time of day checkboxes can be selected.',
                    callback: function(value, validator, $field) {
                        var cnt = 0;
                        if ($("input#timeOfDay1").prop("checked")) cnt++;
                        if ($("input#timeOfDay2").prop("checked")) cnt++;
                        if ($("input#timeOfDay3").prop("checked")) cnt++;

                        if (cnt <  2) {
                            validator.updateStatus('timeOfDayValidator', validator.STATUS_VALID, 'callback');
                            return true;
                        } else {
                            return false;
                        }
                        },
                    }
                }
            }          }
    });
   $("input.form-control").keypress(function (e) {
        var code = e.keyCode || e.which;
        if (code === 13) { //Enter keycode
           return validateForm();
        } 
    });  
    $( idFormSelector ).submit(function( event ) {
        event.preventDefault();
    });
    
    $("#WCMForms_Name").hide(); 
    
    $("#DesiredOutcome").on('keyup', function() {
        $('#do_left').text(1000 - this.value.length);  
    });
    $("#Description").on('keyup', function() {
        $('#desc_left').text(1000 - this.value.length);  
    });
}

function  addFormInput(form, name, value) {
    var hf = document.createElement("input");
    hf.setAttribute("name", name);
    hf.setAttribute("value", value);
    form.appendChild(hf);


}

function dominoSubmit() {

    var jsonObj = {};
    jsonObj.FirstName = $("#LastName").val();
    jsonObj.LastName = $("#FirstName").val();
    jsonObj.Phone = $("#Phone").val();
    jsonObj.Email = $("#Email").val();
    jsonObj.IncidentDate = $("input#IncidentDate").val();
    //jsonObj.IncidentTime = $("input#IncidentTime").val();

    var incTimeOfDay;
    if ( $("input#timeOfDay1").prop("checked") ) {
        incTimeOfDay = "Morning";
    }
    if ( $("input#timeOfDay2").prop("checked") ) {
        incTimeOfDay = "Afternoon";
    }
    if ( $("input#timeOfDay3").prop("checked") ) {
        incTimeOfDay = "Evening";
    }
    var incDate = $("input#IncidentDate").val();
    if ( $("input#timeFrame1").prop("checked") ) {
        incDate = "Unsure";
    }
    if ( $("input#timeFrame2").prop("checked") ) { 
        incDate = "Few Days Ago";
    }
    if ( $("input#timeFrame3").prop("checked") ) {
        incDate = "Within one month";
    }
    jsonObj.IncidentTime = incTimeOfDay;
    jsonObj.TimeFrame = incDate;
    jsonObj.LocationAddress = $("#Address").val();
    jsonObj.TFSemployeeName = $("#TFSemployeeName").val();
    jsonObj.Description = $("#Description").val();
        
    var strBody = "<table><tr>";
    strBody += "<td><strong>First Name</strong></td>";
    strBody += "<td><strong>Last Name</strong></td>";
    strBody += "<td><strong>Phone</strong></td> "; 
    strBody += "<td><strong>Email</strong></td>" ;
    strBody += "<td><strong>Date incident occurred</strong></td>";
    strBody += "<td><strong>Time incident occurred</strong></td>";
    strBody += "<td><strong>Location/Address of incident if applicable</strong></td>";
    strBody += "<td><strong>Name of TFS employee(s) involved</strong></td>";
    strBody += "<td><strong>Description of complaint</strong> </td>";
    // var cnt = 0;
    $(".moreWitness").each(function( index ) {
        strBody += "<td><strong>Witness " + (index +1) + " Name</strong></td>" ;
        strBody += "<td><strong>Witness " + (index +1) + " Phone Number</strong></td>";
        strBody += "<td><strong>Witness " + (index +1) + " Email</strong></td>";

    });
    strBody += "<td><strong>Desired Outcome</strong></td>" ;
    strBody += "</tr><tr>";
    strBody += "<td>" + $("#FirstName").val() + "</td>";
    strBody += "<td>" + $("#LastName").val() + "</td>";
    strBody += "<td>" + $("#Phone").val() + "</td>";
    strBody += "<td>" + $("#Email").val() + "</td>";
    strBody += "<td>" + incDate + "</td>";
    strBody += "<td>" + incTimeOfDay + "</td>";
    strBody += "<td>" + $("#Address").val() + "</td>";
    strBody += "<td>" + $("#TFSemployeeName").val() + "</td>";
    strBody += "<td>" + $("#Description").val().replace(/(?:\r\n|\r|\n)/g, ' ') + "</td>";
    //var cnt = 0;
    
    jsonObj.Witnesses = []
    $(".moreWitness").each(function( index ) {
        var inputfields = $(this).find('input');
        var witness = inputfields[0].value;
        var witnessPhone = inputfields[1].value;
        var witnessEmail = inputfields[2].value;
        strBody += "<td>" +  witness + "</td>";
        strBody += "<td>"+ witnessPhone  + "</td>";
        strBody += "<td>"+ witnessEmail  + "</td>";
            var witness = { 'Witness' : witness, 'Phone' : witnessPhone, 'Email': witnessEmail};
            jsonObj.Witnesses.push(witness);
    });
    strBody += "<td>" + $("#DesiredOutcome").val().replace(/(?:\r\n|\r|\n)/g, ' ') + "</td>";
    strBody += "</tr></table>";
    

    jsonObj.DesiredOutcome = $("#DesiredOutcome").val();
    var jsonStr = JSON.stringify(jsonObj);
   
    var form = document.createElement("form");
    form.setAttribute("method", "post");
    form.setAttribute("name", "_Submissions");
    form.setAttribute("action", "https://wi1qa.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
    // form.setAttribute("action", "https://domdev.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
    addFormInput(form, "Subject",  "Incident " + $("input#IncidentDate").val());
    addFormInput(form, "Body", strBody);
    addFormInput(form, "Category", "Fire");
    addFormInput(form, "JSON", jsonStr);
    addFormInput(form, "WCMForms_Name", $("input#WCMForms_Name").val());
    addFormInput(form, "$$Return","[http://homer-1.inet.toronto.ca/wps/portal/contentonly?vgnextoid=4b1e1789ad233510VgnVCM10000071d60f89RCRD&vgnextchannel=23a81789ad233510VgnVCM10000071d60f89RCRD&appInstanceName=default]");
    document.body.appendChild(form);
    form.submit();
}
function drawForm() {
 // $("#appDisplay").load('/static_files/WebApps/fireEmailForm/emailForm.html', function() {
  if (document.location.hostname.length === 0) {
    $("#appDisplay").load('html/fireComplaintForm.html', function() {
        initForm();
    });
  } else {
    $("#appDisplay").load('/static_files/WebApps/Forms/Fire/html/fireComplaintForm.html', function() {
        initForm();
    });
    }
}
function validateForm() {
  $(idFormSelector).data('bootstrapValidator').validate();
}
$(document).ready(function() {
  if (document.location.protocol == "http:" && document.location.host == "www1.toronto.ca") {
    document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
  }
  init();
  drawForm();
});