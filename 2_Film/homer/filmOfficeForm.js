// The City of Toronto
/*

*/
var codeSelector = '#appCode';
var displaySelector = '#appDisplay';
var idForm = "filmForm"; //THE ID OF THE FORM
var schoolAddresses = {};
    schoolAddresses['Humber College'] = {ProductionCompany: 'Humber College', Address: '205 Humber College Blvd, Toronto, Ontario, M9W 5L7'};
    schoolAddresses['York University'] = {ProductionCompany: 'York University', Address:'4700 Keele st, Toronto, Ontario, M3J 1P3'};
    schoolAddresses['Ryerson University'] = {ProductionCompany: 'Ryerson University', Address:'350 Victoria st, Toronto, Ontario, M5B 2K3'};
    schoolAddresses['Seneca College'] = {ProductionCompany: 'Seneca College of Applied Arts and Technology', Address:'1750 Finch Ave East, Toronto, Ontario, M2J 2X5'};
    schoolAddresses['Centennial College'] = {ProductionCompany: 'Centennial College of Applied Arts and Technology', Address:'P.O Box 631, Station A, Scarborough, Ontario, M1K 5E9'};
    schoolAddresses['Toronto Film School'] = {ProductionCompany: 'Toronto Film School', Address:'10 Dundas st E, 7th Flr, Toronto, Ontario, M5B 2G9'};
 
var isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
 
//http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript
var formatNumber = function(val, decs, parts) {
	var retstr = val;
	var tmpVal = val.replace(/,/g,'');
	if (isNumeric(tmpVal)) {
		var re = '\\d(?=(\\d{' + (parts || 3) + '})+' + (decs > 0 ? '\\.' : '$') + ')';
		var retstr = Number(tmpVal).toFixed(Math.max(0, ~~decs)).replace(new RegExp(re, 'g'), '$&,');
		//console.log(retstr);
	}
	return retstr;
};

var projectTitleValidators = {
    row: '.right-inner-addon', // The name is placed inside a  right-inner-addon class element
    validators: {
      stringLength: {
        min: 1,
        max: 100,
        message: 'Production project title is limited to 100 characters, including spaces'
      },
      notEmpty: {
        message: 'Production project title is required'
      }
    }
  },
  BroadcastPlatformValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: 'Select at least one broadcast platform'
      },
    }
  },
  nameValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Name is limited to 50 characters, including spaces'
      },
      notEmpty: {
        message: 'Name is required'
      }
    }
  },
  nameOptValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Name is limited to 50 characters, including spaces'
      },
    }
  },
  productionManagerNameValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Production manager name is limited to 50 characters, including spaces'
      },
    }
  },
  phoneValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: "Telephone number is required"
      },
      regexp: {
        regexp: /^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
        message: 'Telephone number format is incorrect'
      }
    }
  },
   MobileValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: "Mobile number is required"
      },
      regexp: {
        regexp: /^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
        message: 'Mobile number format is incorrect'
      }
    }
  },
  phoneOptValidators = {
    row: '.right-inner-addon',
    validators: {
      regexp: {
        regexp: /^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
        /* for local number  /^[2-9]\d{2}-\d{3}-\d{4}$/,*/
        message: 'Telephone number format is incorrect'
      }
    }
  },
    MobilephoneOptValidators = {
    row: '.right-inner-addon',
    validators: {
      regexp: {
        regexp: /^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,
        /* for local number  /^[2-9]\d{2}-\d{3}-\d{4}$/,*/
        message: 'Mobile number format is incorrect'
      }
    }
  },
  addressValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 100,
        message: "Production company's address is limited to 100 characters, including spaces"
      },
      notEmpty: {
        message: "Production company's address is required"
      },
    }
  },
  companyNameValidators = {
    validators: {
      stringLength: {
        min: 1,
        max: 100,
        message: 'Production company name is limited to 100 characters, including spaces'
      },
      notEmpty: {
        message: "Production company's name is required"
      },
    }
  },
  ContentProviderValidators = {
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Content provider name length is limited to 50 characters, including spaces'
      },
    }
  },
  NetworkValidators = {
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Network name length is limited to 50 characters, including spaces'
      },
    }
  },
  EmailValidators = {
    validators: {     
      notEmpty: {
        message: 'Email address is required'
      },
      regexp: {
        regexp: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        message: 'Invalid email address. A valid email is required'
      }
    }
  },
  EmailOptValidators = {
    validators: {     
      regexp: {
        regexp: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        message: 'Invalid email address. A valid email is required'
      }
    }
  },
  ProductionTypeValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: 'Select at least one production type'
      }
    }
  },
  ProductionCountryofOriginValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: 'Select one production country of origin'
      }
    }
  },
  BudgetValidators = {
    row: '.input-group-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 15,
        message: 'Invalid total budget amount. Enter budget between 0-999999999'
      },
      notEmpty: {
        message: 'Total budget amount is required'
      },
      regexp: {
        regexp: /^[0-9.,]+$/,
        message: 'Invalid total budget amount. Enter budget between 0-999999999'
      }
    }
  },
	PostProBudgetValidators = {
    row: '.input-group-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 15,
        message: 'Invalid Post production budget amount. Enter budget between 0-999999999'
      },
      notEmpty: {
        message: 'Post production budget amount is required'
      },
      regexp: {
        regexp: /^[0-9.,]+$/,
        message: 'Invalid Post production budget amount. Enter budget between 0-999999999'
      }
    }
  },
  TorontoSpendAmountValidators = {
    row: '.input-group-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 15,
        message: 'Invalid Toronto spend amount. Enter Toronto spend budget amount between 0-999999999'
      },
      notEmpty: {
        message: 'Total Toronto spend amount is required'
      },
      regexp: {
        regexp: /^[0-9.,]+$/,
        message: 'Invalid Toronto spend amount. Enter Toronto spend budget amount between 0-999999999'
      },
     
    }
  },
  episodeValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 2,
        message: 'Enter value from 0-99'
      },
      regexp: {
        regexp: /^[0-9]+$/,
        message: 'Enter value from 0-99'
      },
      notEmpty: {
        message: "Episode's value is required"
      }
    }
  },
  studentSchoolNameValidators = {
    row: '.right-inner-addon',
    validators: {
      callback: {
        callback: function(value, validator) {
          var prodType = $("#ProductionType").val();
          if (prodType !== 'Student') {
               return true;
          } else if (value.length === 0) {
                return {
                  valid: false,
                  message: 'School name is required',
                };
          } else {
                return true;
            }
           }
      }	  
    }
  },
  songTitleValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 50,
        message: 'Song title name is limited to 50 characters, including spaces'
      },
      notEmpty: {
        message: 'Song title name is required'
      }
    }
  },
  ArtistValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 100,
        message: "Artist's name is limited to 100 characters, including spaces"
      },
      notEmpty: {
        message: 'Artist(s) name is required'
      }
    }
  },
  RecordLabelValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 100,
        message: 'Record label is limited to 100 characters, including spaces'
      },
      notEmpty: {
        message: "Record label's name is required"
      }
    }
  },
  OtherSchoolValidators = {
    row: '.right-inner-addon',
    validators: {

      callback: {
            callback: function(value, validator) {
            var school = $("#studentSchoolName").val();
            if (school !== 'Other') {
               return true;
            } 
            else if (value.length === 0) {
                return {
                  valid: false,
                  message: 'School name is required',
                };
            } else if (value.length > 50) {
                return {
                  valid: false,
                  message: 'School name is limited to 50 characters, including spaces',
                };
            } else {
                return true;
            }
           }
        }
    }
  },
    otherCountryValidators = {
    row: '.right-inner-addon',
    validators: {
      callback: {
        callback: function(value, validator) {
          var country = $("#ProductionCountryofOrigin").val();
          if (country !== 'Canada Co-Venture') {
               return true;
          } else if (value.length === 0) {
                return {
                  valid: false,
                  message: 'Other country is required',
                };
          } else {
                return true;
            }
           }
      }	  
    }
  },

  TotalNumberofCastCrewValidators = {
    row: '.right-inner-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 3,
        message: 'Enter value between 1-999'
      },
      regexp: {
        regexp: /^[0-9]+$/,
        message: 'Enter value between 1-999'
      },
      notEmpty: {
        message: 'Total number of cast and crew is required'
      },
		callback: {
            callback: function(value, validator) {
              var totalCast  = parseInt(value);              
              if (totalCast<=0) {
                return {
                  valid: false,
                  message: 'Enter value between 1-999',
                };
              } else {
                return true;
              }
            }
          }
    }
  },
  KeyCastValidators = {
    row: '.input-group-addon',
    validators: {
      stringLength: {
        min: 1,
        max: 150,
        message: 'Principal cast name is limited to 150 characters, including spaces'
      },
    }
  },
  currenciesValidators = {
    row: '.right-inner-addon',
    validators: {
      notEmpty: {
        message: 'Select one currency type for amount'
      }
    }
  },
  otherPlatformValidators = {
	  validators: {
          callback: {
            callback: function(value, validator) {
            var platform = $("#BroadcastPlatform").val();
            if (platform !== 'Other') {
               return true;
            } 
            else if (value.length === 0) {
                return {
                  valid: false,
                  message: 'Name of other broadcast platform is required',
                };
            } else if (value.length > 50) {
                return {
                  valid: false,
                  message: 'Broadcast platform name length is limited to 50 characters, including spaces',
                };
            } else {
                return true;
            }
           }
        }
      }
  }
  ;

function clearForm() {
  $('#' + idForm).data('bootstrapValidator').resetForm();
  $('#results').text('');
}

function init() {
  var strCode = '<link rel="stylesheet" href="/static_files/WebApps/Forms/Film/css/film.css">';
  strCode += '<link rel="stylesheet" href="/static_files/assets/validator/bootstrapValidator.min.css">';
  strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
  strCode += '<script type="text/javascript" src="/static_files/assets/validator/bootstrapValidator.min.js"></script>';
  strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
  strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
  strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
  strCode += '<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/jquery-ajaxtransport-xdomainrequest/1.0.1/jquery.xdomainrequest.min.js"></script>';
  strCode += '<script type="text/javascript" src="/static_files/WebApps/film/js/jquery.placeholder.min.js"></script>';
  $(codeSelector).html(strCode);
}

function initForm() {

  $('input').placeholder({
	  
    customClass: 'my-placeholder'
  });
  // date picker  
  // Preproductionstart
  $('#Preproductionstart').datepicker({
    format: 'mm/dd/yyyy',
    //  endDate: '+0d',
    autoclose: true,
    startDate: '01/01/2001'
  }).on('changeDate', function(e) {
    if ($("input#Camerastart").val() !== '') {
      $('#' + idForm).bootstrapValidator('revalidateField', 'CameraWrap');
    }
    if ($("input#CameraWrap").val() !== '') {
      $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    }
    $('#' + idForm).bootstrapValidator('revalidateField', 'Preproductionstart');
   // autoclose: true;
  }).on('focusout', function(e) {
    if ($("input#Camerastart").val() !== '') {
      $('#' + idForm).bootstrapValidator('revalidateField', 'CameraWrap');
    }
    if ($("input#CameraWrap").val() !== '') {
      $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    }
    $('#' + idForm).bootstrapValidator('revalidateField', 'Preproductionstart');
   // autoclose: true;
  }).keydown(function(e) {
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key === 9) {
      $('#Preproductionstart').datepicker('hide');
    }
  });
  // Camerastart   
  $('#Camerastart').datepicker({
    format: 'mm/dd/yyyy',
    autoclose: true,
    startDate: '01/01/2001'
  }).on('changeDate', function(e) {
    $('#' + idForm).bootstrapValidator('revalidateField', 'CameraWrap');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Preproductionstart');
   // autoclose: true;
    $('#Camerastart').datepicker('hide');
    $('#Camerastart').focus();
  }).on('focusout', function(e) {
    $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    //autoclose: true;
  }).keydown(function(e) {
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key === 9) {
      $('#Camerastart').datepicker('hide');
    }
  });
  //CameraWrap							
  $('#CameraWrap').datepicker({
    format: 'mm/dd/yyyy',
    autoclose: true,
    startDate: '01/01/2001'
  }).on('changeDate', function(e) {
    $('#' + idForm).bootstrapValidator('revalidateField', 'CameraWrap');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Preproductionstart');
    //autoclose: true;
  }).on('focusout', function(e) {
    $('#' + idForm).bootstrapValidator('revalidateField', 'CameraWrap');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Camerastart');
    $('#' + idForm).bootstrapValidator('revalidateField', 'Preproductionstart');
    //autoclose: true;
  }).keydown(function(e) {
    var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
    if (key === 9) {
      $('CameraWrap').datepicker('hide');
    }
  });
  // form validation
  $('#' + idForm).bootstrapValidator({
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
      'ProjectTitle': projectTitleValidators,
      'BroadcastPlatform': BroadcastPlatformValidators,
      'ContentProvider': ContentProviderValidators,
      'Network': NetworkValidators,
      'ProductionType': ProductionTypeValidators,
      'HowManyEpisodes': episodeValidators,
      'studentSchoolName': studentSchoolNameValidators,
      'OtherSchool': OtherSchoolValidators,
      'SongTitle': songTitleValidators,
      'Artist': ArtistValidators,
      'RecordLabel': RecordLabelValidators,
      'Phone': phoneValidators,
      'Fax': phoneOptValidators,
      'Address': addressValidators,
      'Name': nameValidators,
      'CompanyName': companyNameValidators,
      'Email': EmailOptValidators,
      'Producer': nameOptValidators,
      'Director': nameOptValidators,
      'TotalNumberofCastCrew': TotalNumberofCastCrewValidators,
      'KeyCast': KeyCastValidators,
      'PublicityContact': nameOptValidators,
      'PublicityPhone': phoneOptValidators,
      'LocationManager': nameValidators,
      'LocationManagerPhone': MobileValidators,
      'LocationManagerEmail': EmailValidators,
      'ProductionManager': productionManagerNameValidators,
      'ProductionManagerPhone': MobilephoneOptValidators,
      'ProductionManagerEmail': EmailOptValidators,
      'AssistantLocationManager': nameOptValidators,
      'AssistantLocationManagerEmail': EmailOptValidators,
      'AssistantLocationManager2Email': EmailOptValidators,
      'AssistantLocationManager2': nameOptValidators,
      'AssistantLocationManagerPhone': MobilephoneOptValidators,
      'AssistantLocationManager2Phone': MobilephoneOptValidators,
      'ProductionCountryofOrigin': ProductionCountryofOriginValidators,
      'TotalBudget': BudgetValidators,
      'TorontoSpendAmount': TorontoSpendAmountValidators,
      'PostproductionBudget': BudgetValidators,
      'postHouse': nameOptValidators,
      'OtherPlatform': otherPlatformValidators,
      'OtherCountry': otherCountryValidators,
    //  'TotalBudgetcurrencies': currenciesValidators,
     // 'TorontoSpendcurrencies': currenciesValidators,
      //'PostProductionBudgetcurrencies': currenciesValidators,
       ContentProviderNetwork: {
        selector: '.cp-or-network',  
        validators: {
          callback: {
                message: 'Content provider or network is required',
                callback: function(value, validator, $field) {
                var prodType = $("#ProductionType").val();
                if (prodType !== "Series" && prodType !== "Reality" && prodType !== "TV Movie") {
                   return true;
                }
                var isEmpty = true,
                // Get the list of fields
                $fields = validator.getFieldElements('ContentProviderNetwork');
                for (var i = 0; i < $fields.length; i++) {
                    if ($fields.eq(i).val() !== '') {
                       isEmpty = false;
                       break;
                     }
                }
                if (!isEmpty) {
                // Update the status of callback validator for all fields
                    validator.updateStatus('ContentProviderNetwork', validator.STATUS_VALID, 'callback');
                    return true;
                }

                return false;
                }
            },
        }
      },
      NameofStudio: {
        row: '.right-inner-addon',
        validators: {
          stringLength: {
            min: 1,
            max:100,
            message: 'Studio name is limited to 100 characters, including spaces'
          },
          notEmpty: {
            message: 'Studio name is required'
          }
        }
      },
      TorontoPlayingAs: {
        row: '.right-inner-addon',
        validators: {
          stringLength: {
            min: 1,
            max: 50,
            message: 'Toronto playing is limited to 50 characters, including spaces'
          },
          notEmpty: {
            message: 'Provide name of city that Toronto is playing as'
          }
        }
      },
       Preproductionstart: {
        validators: {
          date: {
            format: 'MM/DD/YYYY'
          },
          notEmpty: {
            message: 'Enter valid date'
          },    
          callback: {
            callback: function(value, validator) {
              var PreproductionstartDate  = new Date(value);
              var ssdate = $("input#Camerastart").val();
              var cameraStartDate1 = new Date(ssdate);
              // if (dateEntered == ' ') return false;
              if (PreproductionstartDate.getTime() > cameraStartDate1.getTime()) {
                return {
                  valid: false,
                  message: 'Pre-production start date must be same or before camera start date',
                };
              } else {
                return true;
              }
            }
          }           
        }
      },
      Camerastart: {
        validators: {
          date: {
            format: 'MM/DD/YYYY'
          },
          notEmpty: {
            message: 'Enter valid date'
          },
          callback: {
            callback: function(value, validator) {
              var dateEntered = new Date(value);
              var ssdate = $("input#CameraWrap").val();
              var ssdate2 = $("input#Preproductionstart").val();
              var CameraWrapDate = new Date(ssdate);
              var PreproductionstartDate2 = new Date(ssdate2);
               if (dateEntered.getTime() > CameraWrapDate.getTime()) {
                return {
                  valid: false,
                  message: 'Camera start date must be same or before camera wrap date',
                };
              }
              if (dateEntered.getTime() < PreproductionstartDate2.getTime()) {
                return {
                  valid: false,
                  message: 'Camera start date must be same or after pre-production start date',
                };
              } else {
                return true;
              }
            }
          }
        }
      },
      CameraWrap: {
        validators: {
          date: {
            format: 'MM/DD/YYYY'
          },
          notEmpty: {
            message: 'Enter valid date'
          },
          callback: {
            callback: function(value, validator) {
              var dateEntered = new Date(value);
              var sdate = $("input#Camerastart").val();
              var cameraStartDate = new Date(sdate);             
              if (dateEntered.getTime() < cameraStartDate.getTime()) {
                return {
                  valid: false,
                  message: 'Camera wrap date cannot be before camera start date',
                };
              } else {
                return true;
              }
            }
          }
        }
      },
      TotalNumberofshootingdays: {
        row: '.right-inner-addon',
        validators: {
          stringLength: {
            min: 1,
            max: 3,
            message: 'Invalid value. Enter number of days from 1-999'
          },
          regexp: {
            regexp: /^[0-9]+$/,
            message: 'Invalid value. Enter number of days from 1-999'
          },
          notEmpty: {
            message: "Total number of shooting days is required"
          },
       	callback: {
            callback: function(value, validator) {
              var shootingDays = parseInt(value);
              var shootingDaysinStudio = parseInt($('#TotalNumberofshootingdaysinStudio').val());
              var shootingDaysinToronto = parseInt($('#TotalNumberofshootingdaysinToronto').val());
              if (shootingDays <=0)  {
                return {
                  valid: false,
                  message: "Invalid value, enter number of days from 1 to 999",
                };
              } 
              if ((shootingDays < shootingDaysinStudio) || (shootingDays < shootingDaysinToronto)) {
                return {
                  valid: false,
                  message: 'Value must not be more than calendar days between camera start and camera wrap',
                };
              } else {
                return true;
              }
            }
          }
        }
      },
      TotalNumberofshootingdaysinStudio: {
        row: '.right-inner-addon',
        validators: {
          stringLength: {
            min: 1,
            max: 3,
            message: 'Enter number of days between 0-999'
          },
          regexp: {
            regexp: /^[0-9]+$/,
            message: 'Enter number of days between 0-999'
          },
          callback: {
            callback: function(value, validator) {
              var shootingDaysinStudio = parseInt(value);
              var shootingDaysinToronto = parseInt($('#TotalNumberofshootingdaysinToronto').val());
              if (shootingDaysinStudio > shootingDaysinToronto) {
                return {
                  valid: false,
                  message: 'Total number of shooting days in studio cannot be more than total number of shooting days in Toronto',
                };
              } else {
                return true;
              }
            }
          }
        }
      },
      TotalNumberofshootingdaysinToronto: {
        row: '.right-inner-addon',
        validators: {
          stringLength: {
            min: 1,
            max: 3,
            message: 'Invalid number of days provided. Enter value between 1-999'
          },
          regexp: {
            regexp: /^[0-9]+$/,
            message: 'Invalid number of days provided. Enter value between 1-999'
          },
          notEmpty: {
            message: 'Total number of shooting days in Toronto is required'
          },
          callback: {
            callback: function(value, validator) {
              var shootingDaysinToronto = parseInt(value);
              var shootingDays = parseInt($('#TotalNumberofshootingdays').val());
              var shootingDaysinStudio = parseInt($('#TotalNumberofshootingdaysinStudio').val());
              if (shootingDaysinToronto <=0) {
                return {
                  valid: false,
                  message: 'Invalid number of days provided. Enter value between 1-999',
                };
              }
              if (shootingDaysinToronto < shootingDaysinStudio) {
                return {
                  valid: false,
                  message: 'Shooting days in Toronto cannot be less than total number of shooting days in studio',
                };
              }
              if (shootingDaysinToronto > shootingDays) {
                return {
                  valid: false,
                  message: 'Shooting days in Toronto cannot be more than total number of shooting days',
                };
              } else {
                return true;
              }
            }
          }
        }
      },

    }
  }).on('change keyup  blur', '[name="TotalBudget"]', function(e) {

  }).on('blur', '.moneyField', function(e) {
	  $("#" + e.target.name).val(formatNumber($("#" + e.target.name).val(),2,3));
      $('#' + idForm).bootstrapValidator('revalidateField', e.target.name);
  }).on('change keyup  blur', '[name="TotalNumberofshootingdays"]', function(e) {
    //$('#' + idForm).bootstrapValidator('revalidateField', 'TotalNumberofshootingdaysinToronto');
    //$('#' + idForm).bootstrapValidator('revalidateField', 'TotalNumberofshootingdays');
  }).on('change keyup  blur', '[name="TotalNumberofshootingdaysinToronto"]', function(e) {
    //$('#' + idForm).bootstrapValidator('revalidateField', 'TotalNumberofshootingdaysinToronto');
  }).on('change keyup  blur', '[name="TotalNumberofshootingdaysinStudio"]', function(e) {
    $('#' + idForm).bootstrapValidator('revalidateField', 'TotalNumberofshootingdaysinStudio');
    $('#' + idForm).bootstrapValidator('revalidateField', 'TotalNumberofshootingdaysinToronto');
    var torontoTotalDays = parseInt($("input#TotalNumberofshootingdaysinToronto").val());
    var studioDays= parseInt($("input#TotalNumberofshootingdaysinStudio").val());
    if ((studioDays>0) && (torontoTotalDays>=studioDays)) {
       $(".studio").css("display", "block");
    } else {
       $(".studio").css("display", "none");
	   $("NameofStudio").val("");
	   $('#' + idForm).bootstrapValidator('revalidateField', '	NameofStudio');
    }
  });
  
   
}

function drawForm() {
  $(displaySelector).load('/static_files/WebApps/Forms/Film/html/pdfForm.html', function() {
    initForm();
  });
}

function validateForm() {
  $('#' + idForm).data('bootstrapValidator').validate();
}

/* if the user has two on and entered in fields due to selection boxes, then turned them off, we need to blank out the data and perhaps they should exist at all*/
function dominoSubmit() {
  var strBody = "<strong>Project Title:</strong> " + $("#ProjectTitle").val();
  strBody += "<br><strong>Broadcast Platform:</strong> " + $('#BroadcastPlatform').val();
  if ($('#BroadcastPlatform').val() === 'Other') {
	strBody += "<br><strong>Other Broadcast Platform:</strong> " + $("#OtherPlatform").val();
  } else {
	strBody += "<br><strong>Other Broadcast Platform:</strong> " ;
  }
  strBody += "<br><strong>Content Provider:</strong> " + $("#ContentProvider").val();
  strBody += "<br><strong>Network:</strong> " + $("#Network").val();
  strBody += "<br><strong>Production Type:</strong> " + $("#ProductionType").val();
  if ($("#ProductionType").val()== "Mini Series" || $("#ProductionType").val() == "Series" || $("#ProductionType").val() == "Reality") {
	strBody += "<br><strong>Number of Episodes:</strong> " + $("#HowManyEpisodes").val();
  } else {
	strBody += "<br><strong>Number of Episodes:</strong>";
  }
   if ($("#ProductionType").val()== "Student") {
	strBody += "<br><strong>School Name:</strong> " + $("#studentSchoolName").val();
  } else {
	strBody += "<br><strong>School Name:</strong>";
  }
  if ($("#studentSchoolName").val() === 'Other') {
	strBody += "<br><strong>Other School Name:</strong> " + $("#OtherSchool").val();
  } else {
	strBody += "<br><strong>Other School Name:</strong> ";
  }
  
  if ($("#ProductionType").val() == "Music Video") {
	strBody += "<br><strong>Song Title:</strong> " + $("#SongTitle").val();
	strBody += "<br><strong>Artist(s):</strong> " + $("#Artist").val();
	strBody += "<br><strong>Record Label(s):</strong> " + $("#RecordLabel").val();
  } else {
	strBody += "<br><strong>Song Title:</strong>";
	strBody += "<br><strong>Artist(s):</strong>";
	strBody += "<br><strong>Record Label(s):</strong>";
  }
  strBody += "<br><strong>Company Name:</strong> " + $("#CompanyName").val();
  strBody += "<br><strong>Address:</strong> " + $("#Address").val();
  strBody += "<br><strong>Telephone Number:</strong> " + $("#Phone").val();
  strBody += "<br><strong>Fax Number:</strong> " + $("#Fax").val();
  strBody += "<br><strong>Email:</strong> " + $("#Email").val();
  strBody += "<br><strong>Producer Name:</strong> " + $("#Producer ").val();
  strBody += "<br><strong>Director Name:</strong> " + $("#Director").val();
  strBody += "<br><strong>Total Number of Cast and Crew :</strong> " + $("#TotalNumberofCastCrew").val();
  strBody += "<br><strong>Principal Cast:</strong> " + $("#KeyCast").val();
  strBody += "<br><strong>Publicity Contact Name:</strong> " + $("#PublicityContact ").val();
  strBody += "<br><strong>Publicity Telephone Number:</strong> " + $("#PublicityPhone").val();
  strBody += "<br><strong>Location Manager Name:</strong> " + $("#LocationManager").val();
  strBody += "<br><strong>Location Manager Mobile Number:</strong> " + $("#LocationManagerPhone").val();
  strBody += "<br><strong>Location Manager Email:</strong> " + $("#LocationManagerEmail").val();
  strBody += "<br><strong>Assistant Location Manager Name:</strong> " + $("#AssistantLocationManager").val();
  strBody += "<br><strong>Assistant Location Manager Mobile Number:</strong> " + $("#AssistantLocationManagerPhone").val();
  strBody += "<br><strong>Assistant Location Manager Email:</strong> " + $("#AssistantLocationManagerEmail").val();
  strBody += "<br><strong>Assistant Location Manager Name:</strong> " + $("#AssistantLocationManager2").val();
  strBody += "<br><strong>Assistant Location Manager Mobile Number:</strong> " + $("#AssistantLocationManager2Phone").val();
  strBody += "<br><strong>Assistant Location Manager Email:</strong> " + $("#AssistantLocationManager2Email").val();
  strBody += "<br><strong>Production Manager Name:</strong> " + $("#ProductionManager").val();
  strBody += "<br><strong>Mobile Number:</strong> " + $("#ProductionManagerPhone").val();
  strBody += "<br><strong>Email:</strong> " + $("#ProductionManagerEmail").val();
  strBody += "<br><strong>Pre-production start:</strong> " + $("input#Preproductionstart").val();
  strBody += "<br><strong>Camera start:</strong> " + $("input#Camerastart").val();
  strBody += "<br><strong>Camera Wrap:</strong> " + $("input#CameraWrap").val();
  strBody += "<br><strong>Total Number of Shooting Days:</strong> " + $("#TotalNumberofshootingdays").val();
  strBody += "<br><strong>Total Number of Shooting Days in Toronto:</strong> " + $("#TotalNumberofshootingdaysinToronto").val();
  strBody += "<br><strong>Total Number of Shooting Days in Studio:</strong> " + $("#TotalNumberofshootingdaysinStudio").val();
  strBody += "<br><strong>Name of Studio:</strong> " + $("#NameofStudio").val();
  strBody += "<br><strong>Total Budget: </strong> " + $("#TotalBudgetcurrencies").val() + " " + $("#TotalBudget").val();
  strBody += "<br><strong>Total Budget: </strong> " + $("#TorontoSpendcurrencies").val() + " " + $("#TorontoSpendAmount").val();
  strBody += "<br><strong>Post Production Budget: </strong> " + $("#PostProductionBudgetcurrencies").val() + " " + $("#PostproductionBudget").val();
  strBody += "<br><strong>If Toronto Indicate Post House:</strong> " + $("#postHouse").val();
  strBody += "<br><strong>Production Country of Origin:</strong> " + $("#ProductionCountryofOrigin").val();
  if ($("#ProductionCountryofOrigin").val() === 'Canada Co-Venture') {
	strBody += "<br><strong>Other Country:</strong> " + $("#OtherCountry").val();
  } else {
	strBody += "<br><strong>Other Country:</strong>";
  }
  strBody += "<br><strong>Toronto Playing as:</strong> " + $("#TorontoPlayingAs").val();
  //strBody += "<br><br>" + $("#submission").val().replace(/(?:\r\n|\r|\n)/g, '<br />') + "<br><br>";
  var form = document.createElement("form");
  form.setAttribute("method", "post");
  form.setAttribute("name", "_Submissions");
  form.setAttribute("action", "https://wi1qa.toronto.ca/inter/city/wcmrep.nsf/Submissions?CreateDocument");
  var hf = document.createElement("input");
  hf.setAttribute("name", "Subject");
  hf.setAttribute("value", $("#ProjectTitle").val());
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "Body");
  hf.setAttribute("value", strBody);
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "Category");
  hf.setAttribute("value", "Film");
  form.appendChild(hf);
  hf = document.createElement("input");
  hf.setAttribute("name", "form");
  hf.setAttribute("value", "Submissions");
  hf = document.createElement("input");
  hf.setAttribute("name", "$$Return");
  hf.setAttribute("value", "[http://homer-1.inet.toronto.ca/wps/portal/contentonly?vgnextoid=d669dd604b3a2510VgnVCM10000071d60f89RCRD]");
  form.appendChild(hf);
  document.body.appendChild(form);
  form.submit();
}

function ProductionTypeSelection() {
  if ($("select#ProductionType option:selected").val() == "Mini Series" || $("select#ProductionType option:selected").val() == "Series" || $("select#ProductionType option:selected").val() == "Reality") {
    $(".episode").css("display", "block");
  } else {
    $(".episode").css("display", "none");
  }
  if (($("select#ProductionType option:selected").val()) == "Music Video") {
    $(".music").css("display", "block");
  } else {
    $(".music").css("display", "none");
  }
  if (($("select#ProductionType option:selected").val()) === "Student") {
    $(".studentRow").css("display", "block");
  } else {
    $(".studentRow").css("display", "none");

  }
  
  $('#' + idForm).data('bootstrapValidator').updateStatus('ContentProviderNetwork', "NOT_VALIDATED");
}

/* this is called from the obChange event defined in the form */
function onSchoolChange() {
	var selectedSchool = $("select#studentSchoolName option:selected").val();
  $('#' + idForm).bootstrapValidator('revalidateField', 'OtherSchool');
  if (selectedSchool == "Other") {
    $(".other").css("display", "block");
  } else {
    $(".other").css("display", "none");
	if (selectedSchool !== "") {
		$("#CompanyName").val(schoolAddresses[selectedSchool].ProductionCompany);
		$("#Address").val(schoolAddresses[selectedSchool].Address);
	}

	}
}


/* this is called from an onChange event coded in the form */
function otherplatform() {
  var platform = $("select#BroadcastPlatform option:selected").val();
  $('#' + idForm).bootstrapValidator('revalidateField', 'OtherPlatform');
  if (platform == 'Other') {
    $(".otherp").css("display", "block");
  } else {
    $(".otherp").css("display", "none");
  }
}

/* this is called from an onChange event coded in the form */
function onCountryOfOrginChange() {
  var country = $("select#ProductionCountryofOrigin option:selected").val();
  $('#' + idForm).bootstrapValidator('revalidateField', 'OtherCountry');
  if (country == 'Canada Co-Venture') {
    $(".otherCountry").css("display", "block");
  } else {
    $(".otherCountry").css("display", "none");
  }
}

$(document).ready(function() {
  if (document.location.protocol == "http:" && document.location.host == "www1.toronto.ca") {
    document.location.href = ("https" + document.location.href.substring(4, document.location.href.length));
  }
  init();
  drawForm();
});