var allTopicData = {};
var allOrgs = {};
var allOrgDetails = {};

function saveTopicData() {
    
}

function  getAllData () {
    
    var topics = [
'YAP001',
'YAP009',
'YAP010',
'YAP011',
'YAP013',
'YAP014',
'YAP015',
'YAP016',
'YAP017',
'YAP018',
'YAP019',
'YAP020',
'YAP021',
'YAP022',
'YAP023',
'YAP024',
'YAP025',
'YAP028',
'YAP029',
'YAP030',
'YAP031',
'YAP032',
'YAP033',
'YAP034',
'YAP035',
'YAP036',
'YAP037',
'YAP038',
'YAP039',
'YAP040',
'YAP041',
'YAP042',
'YAP043',
'YAP044',
'YAP045',
'YAP046',
'YAP047',
'YAP049',
'YAP050',
'YAP052',
'YAP053',
'YAP054',
'YAP055',
'YAP056',
'YAP057',
'YAP058',
'YAP059',
'YAP060',
'YAP062',
'YAP063',
'YAP064',
'YAP065',
'YAP066',
'YAP067',
'YAP069',
'YAP070',
'YAP072',
'YAP073',
'YAP074',
'YAP075',
'YAP076',
'YAP077',
'YAP078',
'YAP079',
'YAP080',
'YAP081',
'YAP082',
'YAP083',
'YAP084',
'YAP085',
'YAP086',
'YAP087',
'YAP088',
'YAP091',
'YAP092',
'YAP093',
'YAP094',
'YAP095',
'YAP096',
'YAP097',
'YAP071',
'YAP061',
'YAP068',
'YAP089',
'YAP090']


    var topicURL = "http://testapi.findhelp.ca/services/rest/v1/topic/json?authToken=TSTcitytor&appRegion=Toronto%20%28City%29";
    var promises=[];
    for (var i = 0; i < topics.length; i++) {
        
        (function (i) {
   
            var strURL = topicURL + "&query=" + topics[i]  + "&startIndex=1&pageLimit=1000" ; 

            var request = $.ajax({
                type: 'GET',
                url: strURL,
                contentType: "application/json; charset=utf-8",
                crossDomain: true, //If you wish to force a crossDomain request (such as JSONP) on the same domain, set the value of crossDomain to true. This allows, for example, server-side redirection to another domain. (version 
                dataType: 'json',
                success: function (data) {
                    allTopicData[topics[i]] = data;
                },
                error: function (xhr, ajaxOptions, thrownError) {
                   console.log(xhr.status);
                  console.log(thrownError);
                }
            });
            promises.push( request);
        })(i);          
        //
        
    }
    
  
    $.when.apply(null, promises).done(function(){
        Object.keys(allTopicData).forEach(function(key, idx, array) {
            console.log(key + " " + allTopicData[key].searchTerm + " - results: " + allTopicData[key].data.length);
            for (var j=0 ; j <  allTopicData[key].data.length ; j ++) {
                var org = allTopicData[key].data[j];
                allOrgs[org.fid] = org;
                
            }

            });
		console.log("total org records: " + Object.keys(allOrgs).length);
		getDetails();
		//download(JSON.stringify(allOrgs),"AllOrgs.json","txt");
  });    
    
}

function getDetails() {
	
	var masterURL = "http://testapi.findhelp.ca/services/rest/v1/orginfo/JSON?authToken=TSTcitytor&fid=";
	var promises=[];
	Object.keys(allOrgs).forEach(function(key, idx, array) {
		(function (key) {
			var strURL = masterURL + allOrgs[key].fid; 
			var request = $.ajax({
                type: 'GET',
                url: strURL,
                contentType: "application/json; charset=utf-8",
                crossDomain: true, //If you wish to force a crossDomain request (such as JSONP) on the same domain, set the value of crossDomain to true. This allows, for example, server-side redirection to another domain. (version 
                dataType: 'json',
                success: function (data) {
                    allOrgDetails[key] = data;
                },
                error: function (xhr, ajaxOptions, thrownError) {
                   console.log(xhr.status);
                  console.log(thrownError);
                }
            });
            promises.push( request);

		})(key);
    });
	
	$.when.apply(null, promises).done(function(){
		alert('done');
		download(JSON.stringify(allOrgDetails),"AllOrgDetails.json","txt");
	});	
}

function download(text, name, type) {
  var a = document.getElementById("a");
  var file = new Blob([text], {type: type});
  a.href = URL.createObjectURL(file);
  a.download = name;
}

$( document ).ready(function() {

   getAllData();


});

//}());