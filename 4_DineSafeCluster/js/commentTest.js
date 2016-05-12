var dineSafeComment={codeSelector:'#appCodeComments',displaySelector:'#appDisplayComments',formSelector:"#commentForm",maxCommentString:1200,dominoSubmit:function(){var strBody="<strong>Comments</strong> "+"<br>"+$("#comSubmission").val().replace(/(?:\r\n|\r|\n)/g,'<br>');strBody+="<br><strong>Name</strong> "+$("#comSubmitterName").val();strBody+="<br><strong>Email</strong> "+$("#comEmail").val();strBody+="<br><strong>Phone</strong> "+$("#comPhoneNumber").val();var form=document.createElement("form");form.setAttribute("method","post");form.setAttribute("name","_Submissions");form.setAttribute("action","https://domdev.toronto.ca/intra/city/wcmrep.nsf/Submissions?CreateDocument");var hf=document.createElement("input");hf.setAttribute("name","Subject");hf.setAttribute("value","DineSafe Comment");form.appendChild(hf);hf=document.createElement("input");hf.setAttribute("name","Body");hf.setAttribute("value",strBody);form.appendChild(hf);hf=document.createElement("input");hf.setAttribute("name","Category");hf.setAttribute("value","Black History");form.appendChild(hf);hf=document.createElement("input");hf.setAttribute("name","JSON");hf.setAttribute("value","{'subject':'DineSafe Comment', 'email': 'sml@s.com'}");form.appendChild(hf);hf=document.createElement("input");hf.setAttribute("name","WCMForms_Name");hf.setAttribute("value",$("input#comWCMForms_Name").val());form.appendChild(hf);hf=document.createElement("input");hf.setAttribute("name","$$Return");hf.setAttribute("value","[http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=d669dd604b3a2510VgnVCM10000071d60f89RCRD]");form.appendChild(hf);document.body.appendChild(form);form.submit();},setCharsLeft:function(cCount){$('#comCountMessage').text((dineSafeComment.maxCommentString-cCount)+" Characters Left");},setupEvents:function(){$(dineSafeComment.formSelector).submit(function(event){event.preventDefault();});$("#comSubmitBtn").click(function(e){dineSafeComment.validateForm();});$("#comClearBtn").click(function(e){$(dineSafeComment.formSelector).data('bootstrapValidator').resetForm();$(this).closest('form').find("input[type=text], textarea").val("");dineSafeComment.setCharsLeft(0);});$("#comSubmission").on('keyup',function(){dineSafeComment.setCharsLeft(this.value.length);});},initForm:function(){$(dineSafeComment.formSelector).bootstrapValidator({feedbackIcons:{valid:'glyphicon glyphicon-ok',invalid:'glyphicon glyphicon-remove',validating:'glyphicon glyphicon-refresh'},onSuccess:function(e){dineSafeComment.dominoSubmit();},onError:function(e){$($(".has-error input, .has-error select")[0]).focus();},fields:{comSubmission:{row:'.right-inner-addon',message:'Comments are required and limited to '+dineSafeComment.maxCommentString+' characters, including spaces',validators:{stringLength:{min:1,max:dineSafeComment.maxCommentString},notEmpty:{}}},comEmail:{validators:{emailAddress:{message:'The value is not a valid email address'}}},comPhoneNumber:{row:'.right-inner-addon',validators:{regexp:{regexp:/^[\s()+-]*([0-9][\s()+-]*){10,25}(?:[\-\.\ \\\/]?(?:#|ext\.?|extension|x)[\-\.\ \\\/]?(\d+))?$/i,message:'Telephone number format is incorrect'}}}}});dineSafeComment.setCharsLeft(0);$("#comWCMForms_Name").hide();dineSafeComment.setupEvents();$('#modalComment').modal('show');},drawForm:function(){if(document.location.hostname.length===0){$(dineSafeComment.displaySelector).load('html/commentForm.html',function(){dineSafeComment.initForm();});}else{$(dineSafeComment.displaySelector).load('/static_files/WebApps/Health/DineSafe/html/commentForm.html',function(){dineSafeComment.initForm();});}},validateForm:function(){dineSafeComment.initForm();$(dineSafeComment.formSelector).data('bootstrapValidator').validate();},checkLoaded:function(srcArr){var notLoaded=[];for(var i=0;i<srcArr.length;i++){var checkAttr=(srcArr[i].type==="script"?"src":"href");var len=$(srcArr[i].type).filter(function(){return($(this).attr(checkAttr)==srcArr[i].src);}).length;if(len===0){notLoaded.push(srcArr[i]);}else{console.log(srcArr[i].src+" already loaded");}}
return notLoaded;},init:function(){var strCode="";var scriptArr=[];if(document.location.hostname.length===0){scriptArr=[{type:'link',src:'css/dineSafe.css'},{type:'link',src:'static_files/assets/validator/bootstrapValidator.min.css'},{type:'script',src:'static_files/assets/validator/bootstrapValidator.min.js'},{type:'script',src:'Static_files/assets/placeholders/placeholders.min.js'}];}else{scriptArr=[{type:'link',src:'/static_files/WebApps/Health/DineSafe/css/dineSafe.css'},{type:'link',src:'/static_files/assets/validator/bootstrapValidator.min.css'},{type:'script',src:'/static_files/assets/validator/bootstrapValidator.min.js'},{type:'script',src:'/placeholders/placeholders.min.js'}];}
var notLoaded=dineSafeComment.checkLoaded(scriptArr);for(var i=0;i<notLoaded.length;i++){if(notLoaded[i].type==='script'){strCode+='<script type="text/javascript" src="'+notLoaded[i].src+'">';}else{strCode+='<link rel="stylesheet" href="'+notLoaded[i].src+'">';}}
$(dineSafeComment.codeSelector).html(strCode);dineSafeComment.drawForm();}};$.getMultiScripts=function(arr,path){var _arr=$.map(arr,function(scr){return $.getScript((path||"")+scr.src);});_arr.push($.Deferred(function(deferred){$(deferred.resolve);}));return $.when.apply($,_arr);};$(document).ready(function(){if(document.location.protocol=="http:"&&document.location.host=="www1.toronto.ca"){document.location.href=("https"+document.location.href.substring(4,document.location.href.length));}
$("#commentLink").click(function(e){dineSafeComment.init();});});