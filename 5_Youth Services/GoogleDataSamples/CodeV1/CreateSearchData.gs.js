function createSearchData() {
    var searchArray = [];
    var targetFolder = DriveApp.getFolderById(YOUTH_SERVICES_ORGS_FOLDER_ID);
    var data = getFullOrgData();
    var activeOrgs = {};
    for (var i = 0; i < data.length; i++) {
        activeOrgs[data[i].fid] = true;
    }
   
    var files =targetFolder.getFiles();
    while (files.hasNext()) {
        var file = files.next();
        //var x = file.getName();
        var fileContents = file.getBlob().getDataAsString();
        var fileContents =  removeJSONP(fileContents);
        //Logger.log(fileContents);
        var jsonData = JSON.parse(fileContents);
      if (activeOrgs[jsonData.fid]) {
        /* remove fid and location -- removes 50K overall */
        var searchData = { 
                adr : jsonData.address,
                fid : jsonData.fid,
                gid : file.getId(),
                lat : jsonData.latitude,
                lng: jsonData.longitude,
                // location : jsonData.location,
                nme : jsonData.orgName,
                ph:   jsonData.phone,
                web : jsonData.web,
                tps: jsonData.topics,
                acc: jsonData.acc,
                sls : jsonData.serviceLanguages,
                ens : jsonData.eligibilityNotes                          
            }
        searchArray.push(searchData);       
      }
    }
    createFile(YOUTH_SERVICES_FOLDER_ID, ORG_SEARCH_DATA_JSON, JSONPize("srchCallBack", searchArray));
}