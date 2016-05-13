/* 
Notes
   1) each URL has a token, It is the same for all.
   2) There is a 6 minute execution limit.. 
   3) Writing files to google drive is time conuming.
   
   4) We can CALL and get all Topcis and all related Business objects..but we will run out if time if we try to write 1200+ files.
   
   5) Seperate processes to take the master file and create individual files..
   6) Once all the individual files existsm  , we can generate the search data (we need the google Id of the individual files)
   
   You can have muiltiple scripts within a project. and each script seems to know the other scripts.
   I'm not sure how they resolve duplicate function names..(so don't do it)
*/

var TOPIC_CONFIG_SPREADSHEET = 'YouthServices211Topics';
var TOPIC_DESCRIPTIONS_JSON = "YS_TopicDescriptions.json";
var ORG_DATA_JSON = "YS_OrgData.json";
var ORG_SEARCH_DATA_JSON = "YS_OrgSearchData.json";

var TOPIC_211_URL = "http://testapi.findhelp.ca/services/rest/v1/topic/json?authToken=TSTcitytor&appRegion=Toronto%20%28City%29&startIndex=0&pageLimit=1000"
var ORG_DETAIL_211_URL  = "http://testapi.findhelp.ca/services/rest/v1/orginfo/JSON?authToken=TSTcitytor&fid=";

//https://drive.google.com/folderview?id=0B-j2Y49nfiw2NHc1NndTcXViRTQ&usp=sharing

var YOUTH_SERVICES_FOLDER_ID = "0B-j2Y49nfiw2bm5LR1FtQmx5aUk";
    //"0B-j2Y49nfiw2NHc1NndTcXViRTQ";
//var youthServicesFolder = "0B-j2Y49nfiw2bm5LR1FtQmx5aUk";

//https://drive.google.com/folderview?id=0B-j2Y49nfiw2emlJbm52aDRuZVE&usp=sharing
var YOUTH_SERVICES_ORGS_FOLDER_ID = "0B-j2Y49nfiw2UDVYcjhRREQ0TFU";
    //"0B-j2Y49nfiw2emlJbm52aDRuZVE";
//var youthServicesOrgs = "0B-j2Y49nfiw2UDVYcjhRREQ0TFU";

var startTopicIdx = 16;
var endTopicIdx = 25;
var saveTopicList = true;   //for debug purposes only.
/*
var topics = [
'YAP001','YAP009','YAP010','YAP011','YAP013','YAP014','YAP015','YAP016','YAP017','YAP018','YAP019',
'YAP020','YAP021','YAP022','YAP023','YAP024','YAP025','YAP028','YAP029','YAP030','YAP031','YAP032','YAP033','YAP034',
'YAP035','YAP036','YAP037','YAP038','YAP039','YAP040','YAP041','YAP042','YAP043','YAP044','YAP045','YAP046','YAP047',
'YAP049','YAP050','YAP052','YAP053','YAP054','YAP055','YAP056','YAP057','YAP058','YAP059','YAP060','YAP062','YAP063',
'YAP064','YAP065','YAP066','YAP067','YAP069','YAP070','YAP072','YAP073','YAP074','YAP075','YAP076','YAP077','YAP078',
'YAP079','YAP080','YAP081','YAP082','YAP083','YAP084','YAP085','YAP086','YAP087','YAP088','YAP091','YAP092','YAP093',
'YAP094','YAP095','YAP096','YAP097','YAP071','YAP061','YAP068','YAP089','YAP090'
]
*/
var gblTopicDescriptions = [];
var gblTopicDescs = {};
var orgArray = [];
var orgFullDataArray = [];


function loadTopicConfig() {
  var topicConfig = {};
  var sortVals = [];
  var fi = DriveApp.getFilesByName( TOPIC_CONFIG_SPREADSHEET );
  var file = fi.next();
  var spreadsheet = SpreadsheetApp.open(file);
  var sheet = spreadsheet.getSheets()[0];
  var range = sheet.getDataRange();

  var values = range.getValues();
  for(n=1; n < values.length; ++n){
    topicConfig[values[n][1]] = { 'topicId' : values[n][1], 'sortOrder' : values[n][0], 'parent' : values[n][3], 'is211Topic' : values[n][2], 'tooltip' : values[n][5], 'desc' : values[n][4]};
    sortVals.push(values[n][0]);
  }

  //This code counts the suboptions for each item (if applicable). Maybe should just be counting the parents.
  var subOpts = 0;
  Object.keys(topicConfig).forEach(function(topicId, idx, array) {    
    var tc = topicConfig[topicId];
   // Logger.log(tc);
    var maxRange = 0;
    subOpts = 0;
    if (tc.sortOrder % 100 === 0) {
      maxRange = 100;
    } else if (tc.sortOrder % 10 === 0) {
      maxRange = 10;
    } else {
      maxRange = 0;
    }
    //Logger.log(tc.sortOrder + " " + maxRange + " " + (tc.sortOrder % 100));
    for (var i = 0 ; i < sortVals.length; i++) {
      if ( sortVals[i] > tc.sortOrder &&
           sortVals[i] < tc.sortOrder + maxRange ) {
        subOpts++;
      }
    }
   topicConfig[topicId].options = subOpts;

  });
  
  /* this should be recursize, but only two levels - loop twice
  Find all 3 level items (no suboptions) and add them to the 2nd level.
  */
  Object.keys(topicConfig).forEach(function(topicId, idx, array) {    
    var tc = topicConfig[topicId];
    if (tc.options === 0) {
      if (tc.parent !== "") 
        if (!topicConfig[tc.parent].children) {
          topicConfig[tc.parent].children = [];
          topicConfig[tc.parent].children.push(tc);
        } else {
          topicConfig[tc.parent].children.push(tc);
        }
      }
  
     
    });

  Object.keys(topicConfig).forEach(function(topicId, idx, array) {    
    var tc = topicConfig[topicId];
    if (tc.parent !== ""  && tc.options > 0) {
        if (!topicConfig[tc.parent].children) {
          topicConfig[tc.parent].children = [];
          topicConfig[tc.parent].children.push(tc);
        } else {
          topicConfig[tc.parent].children.push(tc);
        }
      }
  
     
    });
  return topicConfig;
}

function getTopic(topicID) {
    var strURL = TOPIC_211_URL + "&query=" + topicID  ; 
    var status = UrlFetchApp.fetch(strURL);
    var jsonData = JSON.parse(status.getContentText("UTF-8"));
    return jsonData;
}

function get211Topics(topics) {
  var retData = {};

  //for(var i=1; i < topics.length; ++i){
  Object.keys(topics).forEach(function(topicId, idx, array) {      
    var topic = topics[topicId];
    if (topic.is211Topic === "Y") {
      var jsonData = getTopic(topic.topicId)
      retData[topicId] = jsonData;
      topic.numResults = jsonData.numResults;
      topic.searchTerm = jsonData.searchTerm;
    } 
    gblTopicDescriptions.push(topic);
    gblTopicDescs[topicId] = topic;
  });
  return retData;
}

/*
loop through all topics and their orgs and determine a unique set of orgs .
If a org is from a Topic that has a parent and that parent is a 'fake' topic, add in the fake parent topic.
*/
function getUniqueOrgs(allTopicData) {
  var allOrgs = {};
  
  Object.keys(allTopicData).forEach(function(topicId, idx, array) {
    
      //Logger.log(topicId);
      var topicConfig =  gblTopicDescs[topicId];
      //Logger.log(JSON.stringify(topicConfig));
      var parentTopicConfig = "";
      var isParent211Topic = "Y"
      if (typeof topicConfig.parent !== "undefined" && topicConfig.parent !== "") {
         parentTopicConfig = gblTopicDescs[topicConfig.parent];
         //Logger.log("Parent:" + JSON.stringify(parentTopicConfig));
         isParent211Topic = parentTopicConfig.is211Topic;
      }

    for ( j = 0 ; j <  allTopicData[topicId].data.length ; j++) {
      var org = allTopicData[topicId].data[j];
      //Logger.log(org.fid);
      var topicIds = topicId;
      if (isParent211Topic === 'N') {
        topicIds = parentTopicConfig.topicId + "," + topicIds;
      }
      if (allOrgs[org.fid]) {
        allOrgs[org.fid].topics += "," + topicIds;
      } else {
        org.topics = topicIds;
        allOrgs[org.fid] = org;
      }
    }
  });
  
  return allOrgs;
}

/* remove unwanted propoerties to minimize size */
function cleanOrgData(org) {
  
    var newOrg = org; 
    delete org.language;
    delete org.orgId;
    return org;
}


function get211Org(fid) {
    var strURL = ORG_DETAIL_211_URL + fid; 
    var status = UrlFetchApp.fetch(strURL);
    var jsonData = JSON.parse(status.getContentText("UTF-8"));
    return jsonData;
}

function getDetailOrgData(orgs) {
  
    Object.keys(orgs).forEach(function(fid, idx, array) {
      
        var jsonData = get211Org(fid);
        var fname =  jsonData.fid + ".json";
        var org = orgs[fid];
        org = cleanOrgData(org);
        org.serviceLanguages = jsonData.serviceLanguages;
        var acc = ""
        var accDesc = ""
        if (typeof jsonData.accessibility !== 'undefined') {
            accDesc = jsonData.accessibility;
        }
        if (accDesc.indexOf("Fully Accessible") > -1)    { 
            acc = "F";       
        } else if (accDesc.indexOf("Not Accessible") > -1 || 
                   accDesc.indexOf("Unknown") > -1 || 
                   accDesc.indexOf("Not Applicable") > -1 ||
                   accDesc === "") {                  
            acc = "N";
        } else {
            acc = "P";
        } 
                                                                     
        //org.accessibility = jsonData.accessibility;
        org.acc = acc;
    
        jsonData.acc = org.acc;
        jsonData.topics = org.topics
    
        orgFullDataArray.push(jsonData);
        orgArray.push(org);
    });
    return;
}

/* Generally, we want to update files so the google fileId doesn't change 
   We shouldn't need to set permissions, since we plan to put the files in a folder with
   view permissions,so we don't to save processing cycles 
*/
function createFile(folder, fName, data) {
  
    var targetFolder = DriveApp.getFolderById(folder);
    var fi = targetFolder.getFilesByName(fName);
    var file = null;
    while (fi.hasNext()) {
        file = fi.next();
        file.setContent(data);
    }

    if (file === null) {
        file = targetFolder.createFile(fName, data);
        // file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    }
    return file;
}


/* data we read via AJAX will have to be JSONP due to CORS. Maybe there is a function for this.... 
   We're hardcoding jsonCallBack...all callbacks will be 12 chars by convention -- maybe clean this up.
*/
function removeJSONP(inStr) {
 
    //var jsonData = inStr.replace('jsonCallBack("','');
    var jsonData = inStr.substring(13,inStr.length -2);
    //var jsonData = jsonData.replace(/\\"/g,'"');
    //var jsonData = jsonData.replace(/\\"/g,'"'); //twice because of http:// references
    return jsonData;
}

function JSONPize(callback, jsonData) {
  
    return callback + "(" + JSON.stringify(jsonData) + ");"; 
}
  






/* Here we create data for filters used in the UI and create data for the next ETL processes */
function createCoreData() {  
  
    //var targetFolder = DriveApp.getFolderById(myPublicFolder);
    var topicsConfig = loadTopicConfig();
    //This gets the approx 85 topics defined in the google spreadsheet
    var topicData = get211Topics(topicsConfig);
    createFile(YOUTH_SERVICES_FOLDER_ID, TOPIC_DESCRIPTIONS_JSON, JSONPize('TopxCallBack', gblTopicDescriptions));

    //for the unique org, go back to 211 and get the detail record for each
    var orgData = getUniqueOrgs(topicData);
    getDetailOrgData(orgData);
 
  
    /* this file to be used later in splitting proccess. */
    var file = createFile(YOUTH_SERVICES_FOLDER_ID, ORG_DATA_JSON, JSON.stringify(orgFullDataArray) );
    
    //createFile(YOUTH_SERVICES_FOLDER_ID, "TMPorgdata.json" , JSONPize('TopxCallBack', orgData));

}
