var cot_welcomeSelector;

function loginThenCall(app, fCallback) {
	if ($.cookie("sid")==null) {
		//TURN OFF PREVIOUS CLICK AND KEYDOWN EVENTS ON LOGIN MODAL
		$("#cot_login").off('click');
		$('#loginModal input').off('keydown');
		
		//SET NEW CLICK AND KEYDOWN EVENTS TO TRIGGER THE DESIRED EVENT
		$("#cot_login").click(function () {login(fCallback);});
		$('#loginModal input').keydown( function(e) {var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;	if(key == 13) { login(app, fCallback); }});
		
		//PRESENT THE LOGIN FORM
		showLogin();
	} else {
		//IF THE COOKIE IS STILL VALID THEN CALL THE DESIRED ACTION
		fCallback();
	}
}

function initLogin(elementSelector, fCallback) {
	cot_welcomeSelector = elementSelector;
	$("#app-utility-login").load('../corev1.0/html/cot_login.html? #loginModal', function() {
		$("#cot_login").click(function () {
			login(fCallback);
		});
		$('#loginModal input').keydown( function(e) {
			var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
			if(key == 13) { login(fCallback); }
		});
		if ($.cookie("sid")==null) {
			showLogin();
		} else {
			setUserName();
			fCallback();
		}
	});
}

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
	if (sName==null || sName == 'undefined') {
		$(cot_welcomeSelector).html("<div class='welcomemsg'><a onclick='showLogin()'>Login</a></div>");
	} else {
		$(cot_welcomeSelector).html("<div class='welcomemsg'><b>User Name</b>: " + getCookie("cot_uname") + " (<a onclick='logout()'>Logout</a>)</div>" );
	}
}

function login(app, fCallback) {
	$("#loginModal").modal('hide');
	var uname = $("#username").val();
	var pw = $("#password").val();
	var url = 'https://was8-intra-dev.toronto.ca/cc_sr_admin_v1/session?app=' + app + "&user=' + uname + '&pwd=' + pw;
	$.ajax({
		url : url,
		type : "GET",
		success : function(data) {
			var date = new Date();
			date.setTime(date.getTime() + (25 * 60 * 1000));
			$.cookie("sid", data.sid, { expires: date });
			$.cookie("cot_uname", data.userID, { expires: date });
			setUserName();
			fCallback();
		},
		crossDomain: true, 
		dataType: 'jsonp',
		error: function (jqXHR, exception) {
			console.log(jqXHR);
		}
	});
}