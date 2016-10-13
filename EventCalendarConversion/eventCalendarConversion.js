var eventHeaderJson = [];
var eventDetailJson = [];
var conversionLog = {};
var convData = {};
var convDataArray = [];

var eventCats  = {};
var eventAdmissions  = {};
var eventDates = {};
var eventMissingCost = {};
var newsletterASubcats = {};
var newsletterSSubcats = {};
var presentedBy  = {};
var LINEFEED = "\n";
var GOOGLE_KEY = 'AIzaSyBXL8BLQRlaYJAQEgGTvASronb5yKWYKRg';
 var MAP_CENTER = { lat:  43.69587827770483, lng:  -79.45175170898438 };

var APP_EVENT_TYPE = "edc_eventcal";
var gblCC_API = new CC_API({apihost: "https://was8-intra-dev.toronto.ca"});
//var geocoder = new google.maps.Geocoder(); 
var cityBounds;
    var costRanges = [ 
        { id : "1", value : "Free"},
        { id : "2", value : "$1 - $9"},
        { id : "3", value : "$10 - $19"},
        { id : "4", value : "$20 - $29"},
        { id : "5", value : "$30 - $39"},
        { id : "6", value : "$40 - $49"},
        { id : "7", value : "$50 - $59"},
        { id : "8", value : "$60 - $69"},
        { id : "9", value : "$70 - $79"},
        { id : "10", value : "$80 - $89"},
        { id : "11", value : "$90 - $99"},
        { id : "12", value : "$100+"}
        ];
var LOGDIV = $("#log");

/*
Notes:
1) not going to geocode.. it was coded with 1-address repo.. and that is good enough.


Todo:
1) need to deal with date time..merge events.
    "wDays": ["2",
    "3",
    "4",
    "5",
    "6"],s
    many are just 3 or 6  (1 based is sunday, 7 is satu -- most rec don't have this
    f8 Photography Collective Presents..an f8 Retrospective
    has 5 days as above.. and then there are 20 records. I think it was 5 days a week for 4 weeks.
    
    Images... we could just pust link.. and if they change it.. it moves to new structure. except we keep a binId, so we'd have to put in speciallu
    processing for a special "URL Link".. but then need in front end as well.
    
    
    -- in [dates].. im using startDate and endDate.. I should be consistent and be startDateTime endDateTime.
       endDate and StartDate should be "
       
       twoways to deal with errors.. leave and if they edit it, you will need tofill data.
       
       petar.. is he saving data.. images..
*/

var convCats = {
"Arts/Exhibits":"Arts/Exhibits", 
"Celebrations/Holiday":"Celebrations/Holiday",
"Charity/Cause":"Charity/Cause",
"Consumer shows":"Consumer Shows",
"Dance":"Dance",
"Environmental":"Environmental",
"Family/Children":"Family/Children",
"Farmers markets":"Farmers Markets",
"Film":"Film",
"Food/Culinary":"Food/Culinary",
"History":"History",
"Live performances":"Live Performances",
"Music":"Music",
'North York "Cultural Hotspot"':"Cultural Hotspot",
"Seminars/Workshops":"Seminars/Workshops",
"Sports":"Sports",
"Theatre":"Theatre",
"Tour":"Tour",
"Walking/Hiking":"Walking/Hiking"
};

var convNewsleterCats = {
    "PA": "Performing Arts",
    "FE": "Festival and Events",
    "SP": "Sports",
    "AH":  "Attractions/Happenings"
};

function convertObjToArray() {
    convDataArray = [];
    Object.keys(convData).forEach(function(item, idx, array) {
        convDataArray.push(convData[item]);
    });
}

function convertObjToEnhancedArray() {
    convDataArray = [];
    Object.keys(convData).forEach(function(item, idx, array) {
        convDataArray.push( {"calEvent" : convData[item] });
    });
}
function setupEvents() {
    $("#data").click(function() {
    $("<a />", {
        "download": "data.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(eventDetailJson))
        }).appendTo("body").click(function() {
            $(this).remove();
            })[0].click();
        });
    $("#convData").click(function() {
        convertObjToArray();
        $("<a />", {
        "download": "convData.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(convDataArray))
    }).appendTo("body")
        .click(function() {
        $(this).remove();
    })[0].click();
    });
    $("#enhConvData").click(function() {
        convertObjToEnhancedArray();
        $("<a />", {
        "download": "encConvData.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(convDataArray))
    }).appendTo("body")
        .click(function() {
        $(this).remove();
    })[0].click();
    }); 
    $("#logData").click(function() {
        convertObjToArray();
        $("<a />", {
        "download": "conversionLog.json",
        "href" : "data:application/json," + encodeURIComponent(JSON.stringify(conversionLog))
    }).appendTo("body")
        .click(function() {
        $(this).remove();
    })[0].click();
    }); 

    $("#getHeaders").click(function () {
        getHeaders();
    });

    $("#getHeaderTotals").click(function () {
        alert(eventHeaderJson.length + " total records");
    });
    
    $("#getDetails").click(function () {
        //alert("get details");
        getDetails();
    }); 
    
    $("#reloadData").click(function () {
        reloadData();
        
    });
    $("#dumpLog").click(function () {
        dumpLog();
    });     
    $("#transformData").click(function () {
        processDates();
        transformData();
    }); 
    $("#postData").click(function () {
        postData();
    }); 
    
      $("#processImages").click(function () {
        processImages();      
      });
    $("#postImage").click(function () {
        var event = {};
        event.eventName = "Best of the West Food Tour";
        getImage(event, "http://wx.toronto.ca/festevents.nsf/0/6D49685EA4DF4336852580340058261B/$File/BestoftheWestimage1.jpg");
    });
}

    
function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
                s4() + '-' + s4() + s4() + s4();
    }
    
    
function postData() {

    var cnt = 0;
    var waitTime = 1000;
    $.each(convData, function( index, row ) {
        waitTime += 1000;
         cnt++;
        setTimeout(function(){
            var eventcal = {};
            eventcal.calEvent = row;
            var binLoc = null;   //if there is no binId, don't try to keep files..
            if (row.image.binId) binLoc =  '/calEvent/image/binId';
            gblCC_API.submitNewRepoEntry(APP_EVENT_TYPE,  eventcal, binLoc )
           .done(function(data) {
                conversionLog[row.eventName].recId = data.id;
                convData[row.eventName].recId = data.id;
                
            })
            .fail(function(errorData) {
                conversionLog[row.eventName].errors.push("Post Failed.");
                convData[row.eventName].recId = "Post Failed";
            });
        },waitTime);
        
        //if (cnt > 2) {
        //    return false;
        //}     
    });

}
function getStats() {
    $.each(eventDetailJson, function( index, row ) {
            if (conversionLog[cleanString(row.EventName)]) {
                conversionLog[cleanString(row.EventName)].count +=1;
            
            } else {
                conversionLog[cleanString(row.EventName)] = { count: 1,  processed: false, errors : []};
            }
                
        });
            
    console.log("found " + Object.keys(conversionLog).length + " unique events");
    //alert("found " + Object.keys(conversionLog).length + " unique events");

}

function dumpLog() {
    console.log(conversionLog);
}
function convertToArrayIfNeccessary(obj) {
    
    var objArr = [];
    if (obj) {
        //if (obj.indexOf("aterfront") > 0) {
        //  console.log(obj, typeof obj);
        //  }
        if (typeof obj === 'object' && obj.length) { //already an array
           objArr = obj;
       } else {
           objArr.push(obj);
       }
    }
    return objArr;
}

/*
function geoCodeData(event) {

    var address = event.locations[0].address;
    //geocoder.geocode({'address':  address, 'bounds' : vm.map.mapControl.getGMap().getBounds()}, function(results, status) {
    geocoder.geocode({address :  address, bounds : cityBounds}, function(results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    console.log(address + " ---> " + results[0].formatted_address);
                     convData.push(event);
                    //callback(results[0].geometry.location,results[0].formatted_address);
                } else {
                    console.log("No results found");
                }
            } else {
                console.log("Address verification failed","Please try another address (" + status + ")","warning");
            }
        });

/*
$.ajax({
        type: 'GET',
        url: "https://maps.googleapis.com/maps/api/geocode/json?address=" + address + "key=" + GOOGLE_KEY,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            alert("loaded " + data.results.formatted_address);

        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
*/  
/*
}
*/


function processImages() {
    var waitTime = 1000;
    Object.keys(convData).sort().forEach(function(item, idx, array) {
        
        if (convData[item].conv.DominoImage) {
            waitTime += 1000;
            setTimeout(function(){
                //console.log("waiting");
                getImage(convData[item]);
            },waitTime);

        }
    });

}
function postImage(event, blob) {
    var form = new FormData();
    var postURL = "https://was8-inter-dev.toronto.ca/cc_sr_v1/upload/edc_eventcal/event_logo";
    form.append('file', blob, convData[event.eventName].image.fileName); //the third argument seemed to make all the difference in server code seeing the file correctly.
    $.ajax({
            url: postURL,
        type: 'post',
        data: form,
        cache: false,
        contentType: false, //required for multipart
        processData: false,  //required for multipart
        success : function(data) {
            dataObj = JSON.parse(data);
            if (dataObj.BIN_ID) {
                convData[event.eventName].image.binId = dataObj.BIN_ID[0];
            } else {
                convData[event.eventName].image.binId = dataObj.err;
            }
        },  
        error: function (xhr, exception) {
            dataObj = JSON.parse(xhr.responseText);
            convData[event.eventName].conv.fileUploadStatus = dataObj.err + " -- " + (convData[event.eventName].image.fileSize /1024/1024);
            conversionLog[event.eventName].errors.push("Image Upload Error: " + dataObj.err + " -- " + (convData[event.eventName].image.fileSize /1024/1024));
             }
    //}).done(function( data ) {
    //  dataObj = JSON.parse(data);
    //  if (dataObj.BIN_ID) {
    //      convData[event.eventName].image.binId = dataObj.BIN_ID[0];
    //  } else {
    //      convData[event.eventName].image.binId = dataObj.err;
    //  }
    //do what you want with returned data
    });

}


//http://stackoverflow.com/questions/17657184/using-jquerys-ajax-method-to-retrieve-images-as-a-blob/
function getImage(event) {
    
    var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function(){
        if (this.readyState == 4) {
            if (this.status == 200){
            //this.response is what you're looking for
            //handler(this.response);
            console.log(this.response, typeof this.response);
            //var img = document.getElementById('img');
            //var url = window.URL || window.webkitURL;
            //img.src = url.createObjectURL(this.response);
            urlParts = convData[event.eventName].conv.DominoImage.split("/"); 
            //convData[event.eventName].image = {};
            convData[event.eventName].image.fileName = urlParts[urlParts.length -1];
            convData[event.eventName].image.fileSize=  this.response.size;
            convData[event.eventName].image.fileType = this.response.type;
            postImage(event, this.response);
            
            } else {
            console.log(event.eventName);
            convData[event.eventName].conv.ImageNotFound = true;
            conversionLog[event.eventName].errors.push("Domino Image Not Found");
            
            }
        }
    };
    xhr.open('GET', event.conv.DominoImage);    //3rd of false means async.. saves us a little trouble. but ivalid for blobs..so
    xhr.responseType = 'blob';
    xhr.send();  
    
}
    
    
function cleanString(str) {

    return str.trim().replace(/’/g,"'").replace(/‘/g,"'").replace(/•/g,"-").replace(/–/g,"-").replace(/—/g,"-").replace(/”/g,'"').replace(/“/g,'"');

}
function addLocation(row,idx) {

    if (row.EventName === "Buffer Festival") {
        //console.log('x');
    }
    var locObj = {};
    locObj.id = guid();
    locObj.type = 'marker';
        var loc = convertToArrayIfNeccessary(row[idx === 0 ? "Location" : "Location_" + idx]);
        locObj.venueName = loc.join(" ");
        locObj.coords = {};
        locObj.coords.lat = row[idx === 0 ? "TXTLAT" : "txtLat_"+ idx];
        locObj.coords.lng = row[idx === 0 ? "TXTLONG" : "txtLong_"+ idx];
        locObj.coords.geoCoded = true;
        
        var ttcInfo = convertToArrayIfNeccessary(row[idx === 0 ? "TTC" : "TTC_" + idx]);
        locObj.transitInfo = cleanString(ttcInfo.join(LINEFEED));
        
        
        locObj.address = "";
        if (row[idx === 0 ? "StreetName" : "StreetName_" + idx]) {
            var stNo = row[idx === 0 ? "StreetNumber" : "StreetNumber_" + idx];
            var stName = row[idx === 0 ? "StreetName" : "StreetName_" + idx];
            var stType = row[idx === 0 ? "StreetType" : "StreetType_" + idx];
            var stDir = row[idx === 0 ? "StreetDirection" : "StreetDirection_" + idx];
            if (stNo) {
                locObj.address = stNo;
            }
            if (stName) {
                locObj.address += " " + stName;
            }
            if (stType) { 
                locObj.address += " " + stType;
            }
            if (stDir) {          
                locObj.address += " " +stDir;
            }
        } else {
        //if (row["LocationType_" + idx] === "Intersection") {
            locObj.address = row[idx === 0 ? "InterRoad1" : "InterRoad1_" + idx].trim() + " / " + row[idx === 0 ? "InterRoad1" : "InterRoad1_" + idx].trim();
        }
        // if (row.LocationType === "Multiple") {  //there are 3 or 4 with multiple locations
        //  locObj.address = row.InterRoad1.trim() + " / " + row.InterRoad2.trim();
        //}
    
        //SML: do I do anything with displayAddress?
    return locObj;
}

/*
  di I have startDate and endDate for "once" -- yes..
*/

function processDates() {
    $.each(eventDetailJson, function( index, row ) {
        var event = {};
        if (!eventDates[cleanString(row.EventName)]) {
            eventDates[cleanString(row.EventName)] = {};
        }
        var startDate = row.DateBegin;
        var startDt;
            var endDt;
            if ( row.TimeBegin) {
                startDate += " " + row.TimeBegin.replace(/ /g,"");
                startDt = moment(startDate,"YYYY-MM-DD hh:mma");
            } else {
                startDt = moment(startDate,"YYYY-MM-DD").startOf('day');
                event.missingTime = true;
            }
            
            var endDate = row.DateEnd + " " + row.TimeEnd;
            if ( row.TimeEnd) {
                endDate += " " + row.TimeEnd.replace(/ /g,"");
                endDt = moment(endDate,"YYYY-MM-DD hh:mma");
            } else {
                endDt = moment(endDate,"YYYY-MM-DD").endOf('day');
                event.missingTime = true;
            }
            event.startDateTime = startDt.toISOString();
            event.endDateTime = endDt.toISOString();
            event.startDate = moment(event.startDateTime).startOf('day').toISOString();
            event.endDate = moment(event.endDateTime).startOf('day').toISOString();     
        var rowKey = event.startDate + event.endDate;
        eventDates[cleanString(row.EventName)][rowKey] = { 'startDate' : event.startDate , 'endDate' : event.endDate, 'startDateTime' : event.startDateTime, 'endDateTime' : event.endDateTime, 'missingTime' : event.missingTime} ;
    });
    //console.log(eventDates);
}
function transformData() {
    var procCnt = 0;
    $.each(eventDetailJson, function( index, row ) {
        var event = {};
        

        event.eventName = cleanString(row.EventName);
        event.eventEmail = row.EventEmailAddress;
        event.eventWebsite = row.EventURL;
        if (row.EventPhoneNumber) {
            event.eventPhone =  row.EventPhoneNumber.replace(/-/g,"");
        }
        event.partnerType = row.Presentedby.replace(/ /g,"").toLowerCase();
        if (presentedBy[row.Presentedby]) {
                presentedBy[row.Presentedby] += 1;
            } else {
                presentedBy[row.Presentedby] = 1;
            }       
        event.partnerName = row.PresentedByOrgName;
        
        var longDesc = convertToArrayIfNeccessary(row.LongDesc);
        event.description = cleanString(longDesc.join(LINEFEED));
        event.terms = "agree";
        
        //event.expectedAvg = row.AttendanceExpected;  /* this is not required */
        event.expectedPeak = row.AttendanceExpected; /* this is required */     
        
        /* process time/dates =- need to track overall start and end date*/
        if (row.EventTimeInfo) {
            var ti = convertToArrayIfNeccessary(row.EventTimeInfo);
            event.timeInfo =  cleanString(ti.join(LINEFEED));
        }
        if (conversionLog[event.eventName].count > 1 && !conversionLog[event.eventName].processed) {
            //console.log("skip " + row.EventName);
            event.frequency = 'dates';
            event.dates = [];
            var recCnt = 0;
            var lastEndDt;
            Object.keys(eventDates[event.eventName]).sort().forEach(function(item, idx, array) {
                var dt = eventDates[event.eventName][item];
                event.dates.push({'startDateTime' : dt.startDateTime, 'endDateTime' : dt.endDateTime }); //description =""; //should I put somethibg?
                if (recCnt === 0) {
                    event.startDate = dt.startDate;
                }
                lastEndDt = dt.endDate;
                recCnt++;
                if (dt.missingTime) {
                    conversionLog[event.eventName].errors.push("Missing Time Component on Event Dates");
                }
            }); 
            event.endDate = lastEndDt;
            conversionLog[event.eventName].processed = true;  
        } else if (conversionLog[event.eventName].count > 1 && conversionLog[event.eventName].processed) {
            return true;   //skip
        } else {
            conversionLog[event.eventName].processed = true; 
            event.frequency = 'once';
            //There should only be one.....
            Object.keys(eventDates[event.eventName]).forEach(function(item, idx, array) {
                var dt = eventDates[event.eventName][item];
                event.startDateTime = dt.startDateTime;
                event.endDateTime = dt.endDateTime;
                event.startDate = dt.startDate;
                event.endDate = dt.endDate;
                if (dt.missingTime) {
                    conversionLog[event.eventName].errors.push("Missing Time Component on Event Dates");
                }
                
            });
        }
            

        procCnt++;
        

        
        if (row.Reservations && row.Reservations === "Reservations required") {
            event.reservationsRequired = "Yes";
        } else {
            event.reservationsRequired = "No";
        }

        event.features = {};
        if (row.ParkingFree) {
            event.features["Free Parking"] = true;
        }
        if (row.ParkingPaid) {
            event.features["Paid Parking"] = true;
        }       
        if (row.BikeRacks) {
            event.features["Bike Racks"] = true;
        }       
        if (row.PublicWashrooms) {
            event.features["Public Washrooms"] = true;
        }       
        if (row.FoodBeverage) {
            event.features["Onsite Food and Beverages"] = true;
        }
        event.category = [];
        var catList = convertToArrayIfNeccessary(row.CategoryList);

        $.each(catList, function( i, cat ) {
            event.category.push({'name' : convCats[cat]});
            if (eventCats[cat]) {
                eventCats[cat] += 1;
            } else {
                eventCats[cat] = 1;
            }
        });
        
        if (row.Liquor) { 
            event.alcoholServed = row.Liquor;
        } else {
            event.alcoholServed = "No";
        }
        
        if (row.AccessibleFully) {
            event.accessibility = 'full';
        } else if (row.AccessiblePartially) {
            event.accessibility = 'partial';
            event.accessibilityNotes = row.AccessiblePartially;  //If patial, accessiblity notes is required and we don't have it
        } else {
            event.accessibility = 'none';
        }
        
        event.cost = {};
        var eventCostString = "";


        if (row.AdmissionChild) {
            event.cost.child = row.AdmissionChild.replace("$","");
            if (!$.isNumeric(event.cost.child)) {
                conversionLog[event.eventName].errors.push("Child Cost is not numeric[" + event.cost.child + "]");
                if (eventCostString !== "") eventCostString += ", ";
                eventCostString += "Child: " +  row.AdmissionChild;
                
            }
        }       
        if (row.AdmissionYouth) {
            event.cost.youth = row.AdmissionYouth.replace("; ","").replace("$","");
            if (!$.isNumeric(event.cost.youth)) {
                conversionLog[event.eventName].errors.push("Youth Cost is not numeric[" + event.cost.youth + "]");
                if (eventCostString !== "") eventCostString += ", ";
                eventCostString += "Youth: " + row.AdmissionYouth;

            }
        }   
        if (row.AdmissionStudent) {
            event.cost.student = row.AdmissionStudent.replace("$","");
            if (!$.isNumeric(event.cost.student)) {
                conversionLog[event.eventName].errors.push("Student Cost is not numeric[" + event.cost.student + "]");
                if (eventCostString !== "") eventCostString += ", ";
                eventCostString += "Student: " + row.AdmissionStudent;
            }
        }       
        if (row.AdmissionAdult) {
            event.cost.adult = row.AdmissionAdult.replace("$","");
            if (!$.isNumeric(event.cost.adult)) {
                conversionLog[event.eventName].errors.push("Adult Cost is not numeric[" + event.cost.adult + "]");
                if (eventCostString !== "") eventCostString += ", ";
                eventCostString += "Adult: " + row.AdmissionAdult;
            }
        }
        if (row.AdmissionSenior) {
            event.cost.senior = row.AdmissionSenior.replace("$","");
            if (!$.isNumeric(event.cost.senior)) {
                conversionLog[event.eventName].errors.push("Senior Cost is not numeric[" + event.cost.senior + "]");
                if (eventCostString !== "") eventCostString += ", ";
                eventCostString += "Senior: " + row.AdmissionSenior;              
            }
        }       
        if (eventAdmissions[row.Admission]) {
                eventAdmissions[row.Admission] += 1;
            } else {
                eventAdmissions[row.Admission] = 1;
        }
        event.costRange = [];
        if (row.Admission) {
            event.costRange.push({"value": row.Admission});         
        } else {
            if ( !eventMissingCost[event.eventName]) {
                eventMissingCost[event.eventName] = true;
                conversionLog[event.eventName].errors.push("Missing Admission (Cost Range)");
            }
            $.each(costRanges, function( i, cat ) {
                event.costRange.push({"value": cat.value}); 
            });
              
        }
        
        event.otherCostInfo = "";
        /* if we have no-numeric individual cost info, put it in other cost info, so nothing is lost */
        if (eventCostString !== "") {
            event.otherCostInfo += eventCostString;
            delete event.cost.senior;
            delete event.cost.adult;
            delete event.cost.child;
            delete event.cost.youth;
            delete event.cost.student;
            
        }
        if (row.OtherCostInformation) {
            var ocInfo = convertToArrayIfNeccessary(row.OtherCostInformation);
            if (event.otherCostInfo !== "") {
                event.otherCostInfo += LINEFEED;
            }
            event.otherCostInfo += ocInfo.join(LINEFEED);
        }
        
        
        event.locations = [];
        if (row.LocationType === "Street") {
             event.locations.push(addLocation(row, 0));
        }
        if (row.LocationType === "Intersection") {
            event.locations.push(addLocation(row, 0));
        }
        
        /* all multiple seems to have only street addresses - so no mix/match */
        
        if (row.LocationType === "Multiple") {
           
            var numLocs = parseInt(row.NumberLocations,10);
            conversionLog[event.eventName].multipleLocations = numLocs;
            console.log("Multiple", event.eventName, numLocs);
            for (var i = 0; i < numLocs; i++) {
                event.locations.push(addLocation(row, i));
            }
        
        }
        
        event.image = {};
        event.image.description  = row.PhotoCutline;
        event.contactName = row.OrgContactName;
        event.contactTitle = row.OrgContactTitle;
        event.orgName = row.OrgName;
        event.orgType = row.OrgType;
        event.orgPhone = row.OrgContactPhone.replace(/-/g,"");
        event.orgAddress = row.OrgContactAddress.replace(/\r?\n|\r/g,"");
        event.orgEmail = row.OrgContactEMail;
        if ( row.OrgContactExt) {
            event.orgPhoneExt = row.OrgContactExt.replace("; ","").replace(/-/g,"");
        }
        if (row.OrgContactFax) {
            event.orgFax = row.OrgContactFax.replace("; ","").replace(/-/g,"");
        }
        
        event.admin = {};
        if ( row.IsFeaturedEvent === 'Yes') {
            event.admin.featuredEvent  = true;
        } else {
            event.admin.featuredEvent  = false;     
        }
        if ( row.IsNewsletterEvent === 'Yes') {
            event.admin.includeInNewsletter  = true;
        } else {
            event.admin.includeInNewsletter  = false;       
        }   
        event.admin.newsletterCategory = [];
        event.admin.newsletterSubcategory = [];
        event.admin.newsletterCategory.push ( {"value"  : convNewsleterCats[row.EventCategory]});
        if (row.EventCategory === "AH") {
            event.admin.newsletterSubcategory.push ( {"value"  : row.AttractionsSubCategory});
             if (newsletterASubcats[row.AttractionsSubCategory]) {
                newsletterASubcats[row.AttractionsSubCategory] += 1;
            } else {
                newsletterASubcats[row.AttractionsSubCategory] = 1;
            }
            
        }
        if (row.EventCategory === "SP") {
            event.admin.newsletterSubcategory.push ( {"value"  : row.SportsSubCategory});
             if (newsletterSSubcats[row.SportsSubCategory]) {
                newsletterSSubcats[row.SportsSubCategory] += 1;
            } else {
                newsletterSSubcats[row.SportsSubCategory] = 1;
            }
        }
        
        event.admin.reviewerComments = "";
        if (row.EditorComments) event.admin.reviewerComments += row.EditorComments;
        if (row.AdminComments) {
            event.admin.reviewerComments += event.admin.reviewerComments.length > 0 ? "\n" + row.AdminComments : row.AdminComments;
        }  

        event.conv = {};
        if (row.attNames) {
            event.conv.DominoImage = "//wx.toronto.ca/"  + row.DBPath + "/0/" + row.DocLinkHandle + "/$File/" + row.attNames;
        }
        
        
        convData[event.eventName] = event;
        
        //if (event.conv.DominoImage) {
        //    getImage(event, event.conv.DominoImage)
       // }
        /* lets not geocode addresses.  We have valid lat/long and the address might not convert well.. and I'm having limit problems.*/
        //geoCodeData(event);
       
    });

   // setTimeout(function(){
    console.log("Processed " + procCnt + " records");
    LOGDIV.append("<p>processed " + procCnt + " records</p>");
    console.log(eventCats);
    console.log(eventAdmissions);
    console.log(eventMissingCost);
    console.log(presentedBy);
    console.log(newsletterASubcats);
    console.log(newsletterSSubcats);
   // },10000);
}
function reloadData() {

    var baseURL = "data.json";
    $.ajax({
        type: 'GET',
        url: "data.json",
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            eventDetailJson = data;
            console.log("loaded " + data.length + " detail records");
            LOGDIV.append("<p>loaded " + data.length + " detail records</p>");
            getStats();

        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });

}

function getDetails() {
    var deferreds = [];
    $.each(eventHeaderJson, function( index, row ) {
        var req = getDetail(row["@unid"]);
        deferreds.push(req);
    });
    $.when.apply($, deferreds).done( function () {
         LOGDIV.append("<p>read " + eventDetailJson.length + " detail records</p>");
		 getStats();
    });
}

function getDetail(recId) {
    //var baseURL = "https://wistg.toronto.ca/inter/edc/festevents.nsf/api/data/documents/unid/";
    var baseURL = "https://dom01d.toronto.ca/inter/edc/festevents.nsf/api/data/documents/unid/";
    var url = baseURL + recId;
    var request = $.ajax({
        type: 'GET',
        url: url,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            eventDetailJson.push(data);
            

        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    return request;
}

function getHeaders() {
        /* this actually quit at about 1100 */
        var deferreds = [];
        for (var i=0; i < 20; i++) {
            var req = getRec(i * 100,100);
            deferreds.push(req);
        }
    $.when.apply($, deferreds).done( function () {
         LOGDIV.append("<p>read " + eventHeaderJson.length + " header records</p>");


    });
}
/* of course this wont get the rows in order */
function getRec(start, end) {

    //var baseURL = "https://wistg.toronto.ca/inter/edc/festevents.nsf/api/data/collections/name/export?start=<start>&count=100";
    var baseURL = "http://dom01d.toronto.ca/inter/edc/festevents.nsf/api/data/collections/name/export?start=<start>&count=100"
    var url = baseURL.replace('<start>',start);
    var request = $.ajax({
        type: 'GET',
        url: url,
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            console.log("Start: " + start + " - found " + data.length + " rows");
            $.each(data, function( index, row ) {
                eventHeaderJson.push(row);
          });

        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
        }
    });
    return request;
}

$( document ).ready(function() {

    //cityBounds = new google.maps.LatLngBounds();
   // var to = new google.maps.LatLng(MAP_CENTER.lat, MAP_CENTER.lng);
   // cityBounds.extend(to);
    LOGDIV = $("#log");
    
        setupEvents();
});