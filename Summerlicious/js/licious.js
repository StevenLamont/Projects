var controlUI;
(function($) {
    $.QueryString = (function(a) {
        if (a == "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'))
})(jQuery);


function createInfoBox(m) {
	var strPrice = m.lunchprice;
	if (m.lunchprice=="") {strPrice = m.dinnerprice;}
	if (m.lunchprice != "" && m.dinnerprice != "") {strPrice = m.lunchprice + " | " + m.dinnerprice;}

	var addText = document.createElement('div');
	addText.id = "mapinfoboxdata";
	addText.className = "map addText";
	addText.innerHTML = "<div class='mapclose'><a href='javascript:mapClose();'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</a></div>"
	addText.innerHTML += "<div class='titleText'><font style='font-weight:bold;'>" + m.name + "</div>";
	addText.innerHTML += "<div class='map sumText'>"+ m.addsummary + "</br>" + m.phone + "<br /><br />";
	if (m.type=="restaurant") {
		addText.innerHTML += m.cuisine + "<br/>" + strPrice + "<br/>";
		addText.innerHTML += "<a title='More information' href='/wps/portal/contentonly?vgnextoid=4b3d0ed14079d410VgnVCM10000071d60f89RCRD&key=" + m.unid + "'>More Information</a></div>";
	} else {
		addText.innerHTML += (m.adultprice=="") ? "" : "Adults: " + m.adultprice + "<br/>";
		addText.innerHTML += (m.kidprice=="") ? "" : "Kids: " + m.kidprice + "<br/>";
		addText.innerHTML += "<a title='More information' href='/wps/portal/contentonly?vgnextoid=87fc3b35b23f0510VgnVCM10000071d60f89RCRD&key=" + m.unid + "'>More Information</a></div>";
	}


  	controlUI.innerHTML = addText.outerHTML;

	if (arrMarkers.length > 0) {
	for (var i=0;i<arrMarkers.length;i++) {
		$("#mapmarker" + i + "row").removeClass("highlight");
		if (arrMarkers[i].type=="restaurant") {
			arrMarkers[i].setIcon('/static_files/WebApps/images/markergreen.png');
			arrMarkers[i].setZIndex(200000000);
		} else {
			arrMarkers[i].setIcon('/static_files/WebApps/images/markerblue.png');
			arrMarkers[i].setZIndex(200000001);
		}

	}
	$("#" + m.id + "row").addClass("highlight");
	}

	m.setAnimation(google.maps.Animation.BOUNCE);
	setTimeout(function(){ m.setAnimation(null); }, 750);
	if (m.type=="restaurant") {
	  	m.setIcon('/static_files/WebApps/images/markergreen_sel.png');
 	} else {
		m.setIcon('/static_files/WebApps/images/markerblue_sel.png');
 	}
	m.setZIndex(288000001);
	var latLng = m.getPosition();
}

function resetMap() {
 	mapClose();
	var strKey = $.QueryString["key"];

	if (strKey!=null)
	{
		map.setZoom(14);
	} else {
		var defaultBounds = new google.maps.LatLngBounds(new google.maps.LatLng(43.589344,-79.631653),new google.maps.LatLng(43.809756,-79.232025));
		map.fitBounds(defaultBounds);
		map.setZoom(11);
	}

	for (var i=0;i<arrMarkers.length;i++) {
		if (arrMarkers[i].type=="restaurant") {
			arrMarkers[i].setIcon('/static_files/WebApps/images/markergreen.png');
			arrMarkers[i].setZIndex(276000000);
		} else {
			arrMarkers[i].setIcon('/static_files/WebApps/images/markerblue.png');
			arrMarkers[i].setZIndex(277000000);
		}
		if (arrMarkers[i].unid == strKey) {
			map.setCenter(arrMarkers[i].position);
			arrMarkers[i].setZIndex(277000001);
			arrMarkers[i].setIcon('/static_files/WebApps/images/markergreen_sel.png');
		}
	}
}

function mapClose() {
	$('#mapinfoboxdata').remove();
}

String.prototype.replaceAll = function(str1, str2, ignore)
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}