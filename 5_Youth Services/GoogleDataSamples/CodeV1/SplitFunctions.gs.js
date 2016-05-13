
/* remove properties we wont use to make eventually retrieval smaller in size */
function cleanDetails(orgData) {
  
    delete orgData.publications;
    delete orgData.recordOwner;
    delete orgData.copyright;
    delete orgData.copyrightLink;
    delete orgData.updateLink;
  
    return orgData;
}

function getFullOrgData() {
    var targetFolder = DriveApp.getFolderById(YOUTH_SERVICES_FOLDER_ID);
    var fi = targetFolder.getFilesByName(ORG_DATA_JSON);
    var file = null;
    while (fi.hasNext()) {
        file = fi.next();
    }

    var fileContents = file.getBlob().getDataAsString();
    var jsonData = JSON.parse(fileContents);
     return jsonData;
}
function splitOrgDataFile(startIdx, endIdx ) {
 
    var jsonData = getFullOrgData();
    for (var i = 0; i < jsonData.length; i++) {
        if (i >= startIdx && i <= endIdx) {
      
            var orgData = cleanDetails(jsonData[i])
            createFile(YOUTH_SERVICES_ORGS_FOLDER_ID,jsonData[i].fid + ".json", JSONPize("odetCallBack",orgData));
            //Logger.log(i);
        }
    }
}

function determineUsedLanguages() {
  var jsonData = getFullOrgData();
   getUsedLanguages(jsonData);
}