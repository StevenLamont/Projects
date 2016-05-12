function updateMasterKML( urlDL ) {
  var kml = "";
  kml+= '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Document>';
  for (i in urlDL){
     kml += '<NetworkLink><Url><href>https://drive.google.com/uc?id=' + urlDL[ i ] + '</href></Url><refreshMode>onInterval</refreshMode><refreshInterval>30</refreshInterval></NetworkLink>'
  }
  kml += '</Document></kml>';
  var fi = DriveApp.getFilesByName( 'master.kml' );
  var file = fi.next();
  file.setContent( kml );
}


function matchLocations(aData) {
 
  var locs = {};
        
        for( var n = 0; n < aData.length; n++ ) {
            
            var oData = {
                id: aData[n].id,
                name: aData[n].name,
                address: aData[n].address,
                status: aData[n].status,
                lastInspected: aData[n].lastInspectionDate || null,
                lat: ( +aData[n].latitude ),
                lng: ( +aData[n].longitude ),
                latlng: ( +aData[n].latitude ) + "," +  ( +aData[n].longitude )
            };

                        //latlng: new google.maps.LatLng( aData[n].latitude, aData[n].longitude ),

            if( !locs[ oData.latlng ] )
                 locs[ oData.latlng ] = {
                    address: oData.address,
                    establishments: [],
                    lat: oData.lat,
                    latlng: oData.latlng,
                    lng: oData.lng
                };
                
            locs[ oData.latlng ].establishments.push( {
                id: aData[n].id,
                name: aData[n].name,
                status: aData[n].status,
                lastInspected: aData[n].lastInspectionDate
            } );
        };
  
   return locs;
}


function getDineData() {
  //need tp switch to this, then consolidate locations:  https://secure.toronto.ca/dinesafe/searchEstablishments.json?status=1,2,3
  //var url_getstatus = 'https://secure.toronto.ca/dinesafe/dataTableEstablishments.json?status=1,2,3&iDisplayStart=1&iDisplayLength=20000';
  var url_getstatus = 'https://secure.toronto.ca/dinesafe/searchEstablishments.json?status=1,2,3';
  var status = UrlFetchApp.fetch(url_getstatus);
  return JSON.parse(status.getContentText("UTF-8"));
}

function getKMLHeader() {
  var ballonStyle = '<BalloonStyle><text>$[somedata]</text></BalloonStyle>'
  var kml = '<?xml version="1.0" encoding="UTF-8"?><kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2"><Document>';
  kml += '<Style id="a"><IconStyle><Icon><href>http://www.toronto.ca/health/dinesafe/images/map/marker_pass.png</href></Icon></IconStyle>' + ballonStyle + '</Style>';
  kml += '<Style id="b"><IconStyle><Icon><href>http://www.toronto.ca/health/dinesafe/images/map/marker_conditional.png</href></Icon></IconStyle>' + ballonStyle + '</Style>';
  kml += '<Style id="c"><IconStyle><Icon><href>http://www.toronto.ca/health/dinesafe/images/map/marker_close.png</href></Icon></IconStyle>' + ballonStyle + '</Style>';
  kml += '<Style id="d"><IconStyle><Icon><href>http://www.toronto.ca/health/dinesafe/images/map/marker_blue.png</href></Icon></IconStyle>' + ballonStyle + '</Style>';
  
  return kml;
}

function createFile(fName, kml) {
  var fi = DriveApp.getFilesByName(fName + ".kml");
  var file = fi.next();
  file.setContent(kml);
  var zip = Utilities.zip([file.getBlob()], fName + ".kmz");
  var fzip = DriveApp.createFile(zip);
  fzip.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return fzip;
}

function escapeXMLElement(string) {
  if (string && string.length > 0) {
  return string.replace(/^\s\s*/, "").replace(/\s\s*$/, "").replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&apos;').replace(/>/g,'&gt;').replace(/</g,'&lt;');
  } else {
    return string
  }
  
  
}
function createKMZ() {  
  var arrStatus = ["", "#a", "#b", "#c", "#d"];
  
  var dineData = getDineData();
  var locations = matchLocations(dineData);
  var kml1 = [], kml2 = [], kml3 = [], kml4 = [], style;
  var kmlhead = getKMLHeader();
  
  
  
  //kml1.push(kmlhead);
  //kml2.push(kmlhead);
  //kml3.push(kmlhead);
  //kml4.push(kmlhead);
  var cnt =0;
  
  var keys = Object.keys(locations);
  var totalLocs = keys.length;
  
  var kmlArray = [];
  var totalKML = Math.floor(totalLocs / 1000) + 1;
  for (var i = 0; i < totalKML; i++) {
    kmlArray.push([]);
    kmlArray[i].push(kmlhead);
  }
  
  var id = 0;
  var status = "0";
  var name = "multi";
  
  for (var i =0; i < totalLocs; i++) {
    var location = locations[keys[i]];
    var extData = "[";
    for (var j =0; j < location.establishments.length; j++) {
         extData +='{ "id": ' + location.establishments[j].id + '},';
    }
    extData = extData.slice(0, -1) + "]";
    if ( location.establishments.length === 1) { 
       status = location.establishments[0].status;
       id = location.establishments[0].id;
       name = location.establishments[0].name;
    } else {
      id = location.establishments[0].id; //pick one id. can't be zero or causes problems as many zeros.
      status = 4;        
      name = "multi";
    }
      var style = "";
      switch (status) {
          case 1:
            style = "#a";
            break;
        case 2:
            style = "#b";
            break;
        case 3:
            style = "#c";
            break;
        case 4:
            style = "#d";
            break;          
        default:
            style = "";
            break;
      }
      var kmlFile =  Math.floor(i / 1000);
       kmlArray[kmlFile].push(
            '<Placemark id="' + id + '"><styleUrl>' + style + '</styleUrl>' +
            '<Name>' + id + '</Name><description>'  + escapeXMLElement(name) + '</description>' +
            '<ExtendedData><Data name="somedata"><value>' + extData + '</value></Data>  </ExtendedData>' +
            '<Point><coordinates>' + location.lng  + ',' +  location.lat + '</coordinates></Point></Placemark>' );
            
  }
  
    var urlDL = [];
  for (var i = 0; i < totalKML; i++) {
     kmlArray[i].push('</Document></kml>');
     filea = createFile("DineSafe" + i, kmlArray[0].join(""));
     urlDL.push( filea.getId() );
  }
//  kml1.push( '</Document></kml>' );
//  kml2.push( '</Document></kml>' );
//  kml3.push( '</Document></kml>' );
//   kml4.push( '</Document></kml>' );
  //TODO Fix this.. make it generic
 // var filea1 = createFile("DineSafe1", kmlArray[0].join(""));
 // var filea2 = createFile("DineSafe2",  kmlArray[1].join(""));
 // var filea3 = createFile("DineSafe3",  kmlArray[2].join(""));
 // var filea4 = createFile("DineSafe4",  kmlArray[3].join(""));
  
 // var urlDL = [];
 // urlDL.push( filea1.getId() );
 //urlDL.push( filea2.getId() );
 // urlDL.push( filea3.getId() );
 // urlDL.push( filea4.getId() );
  
  updateMasterKML( urlDL ); 
}
