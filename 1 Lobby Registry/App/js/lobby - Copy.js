/*

TODO:  we don't highlight details pages...
check filtersapplied and character mapping to I saw someing in financial contributors
--in privsatr funding i get the alpha check in the listing parts as well as the data part.. I think was was an error but verofy
POH search... Name for Sure..
paging on POH and other convert to numberic doesn't work...it pages based on higher number and not SMs
POHName partially working.. but is still incorrect.

POHType multiselect -> not implemented..


pdf generation notice.. needs to be inmplemented...maybe (it does go to another page)


sm16307 -- REGISTRANT IS AN INHOUSE LOBBYIST AND IN COMM IS SENIOR OFFICER

--> lobbyist filter is wrong..woth regards to senior officer and lobbyist F

Still need to keep beneficiary list.. as records are dupicated so they can be alphaticalized

==> can i standardized re-use filter logic per report?

do we need a MAP and have S1, B1, F1 for each segment. so we have a special option to retrieve the map anf then use throughout
-->have return have a special "total" records item.. and with paing: rowNo, Count.
--> need orderBy - basically replicate the agreator stuff.

because I use inpitgroup-adds on  and a fixed width, they don't stack when smaller.
maybe fake from-control-label to look like add-on

Need to do the switch from alpha to number once filtering is on
The reset of the multi-selects is not changeing the text of the dropdown even though it is selected all of them
put in bootstrap validation for type misdmatche4s.. and maybe more.

==> regular search is not included in filtersapplies/reset logic etc.. page numebrs
==> total rows is off a litle bit for paging. chgeck roudning
I lost feedback on regular search.. find it..

Adv Search Validator:
1) if beneficary, then must select Consultant.


Data NOtes:
1) if you have beneficiaries, then there does not seem to be more than one lobyist..>
--> filter out 

Todo: rename JSONData to SMObjs?/


search:  on full name.. how to do it.



If you register a in-house consultant and add a senior office but that officer is not assigned to rhe SM, then he doesn't show up as a
select in the senior office listing. Is this intentional?

A CLient is a beneficary
what is the other beneficairies??? and is the lookup..

search:   use OR for the highlight when adding two space values in bar.. use AND for the folter

put in "X" filter reset... see rob's example (chart pagte)

Fitlerall -- check for unhidden columns and for seach do search automatically.
for filter do filters autoatically.


self invoking mess this up.. check into why?. stuff in global where should be?

on the filter selects.. I could trap the 'All selected' event.. then ignore filter on data. this way any item not of the hard coded values still passes.
*/
//(function () {
//   'use strict';

var detailArticleGUID = 'aa89f7cc2dfe2510VgnVCM10000020ff0f89RCRD';
var detailChannelGUID = '97a9f7cc2dfe2510VgnVCM10000020ff0f89RCRD';
var listGUID = 'd488c8b94c1d2510VgnVCM10000020ff0f89RCRD';
var detailTeaserGUID = '97a9f7cc2dfe2510VgnVCM10000020ff0f89RCRD';

var rowsPerPage = 10;
var nextRow=1;
var initialLoad = true;
var jsonData;
var totalJSONRows = 0;
var searchTerm;
var LobbyistList = {}; 
var LobbyistListArray = []; 
var BeneficiaryList = {}; 
var BeneficiaryArray = []; 
var GovFundingList = {}; 
var GovFundingArray = []; 
var BusOrgClientList = {}; 
var BusOrgClientArray = []; 
var POHNameList = {}; 
var POHNameArray = [];
var PrivateFundingList = {}; 
var PrivateFundingArray = []; 

var currentAlpha = "A";
var alphaMap = {};
var selectedReport = 'SMRpt';
var filtersAreApplied = false;
var CommSortOrder = {"Member of Council" : 1, "Staff of Member of Council": 2, "Member of Local Board" : 3,
                     "Staff of Member of Local Board" : 4, "Employee of Local Board" : 5, 
                     "Member of Advisory Board": 6, "Employee of the City" :7};

//var LobbyistListCnt = {};

var POHArray = [];
var rptColumnHdrs = { SMLLobbyist: {header : 'Lobbyist', size : '*'},
                    SMLGovAgency: {header : 'Gov Agency', size : '*'},
                    SMLPrivateFunding: {header : 'Fin Contributors', size : '*'},
                    SMLFunding: {header : 'Fin Contributor', size : '*'},
                    SMLBeneficiary: {header : 'Beneficiary', size : '*'},
                    SMLLobbyistType: {header : 'Lobbyist Type', size : '*'},
                    SMLBusOrg: {header : 'Bus/Org', size : '*'},
                    SMLBusOrgClient: {header : 'Bus/Org/Client', size : '*'},
                    SMLLobbyistNames: {header : 'Lobbyist Name(s)', size : 100},
                    SMLClient: {header : 'Client', size : '*'},
                    SMLPOHOfficeName: {header : 'Office', size : '*'},
                    SMLPOHName: {header : 'POH', size : '*'},
                    SMLPOHPosition: {header : 'Position', size : '*'},
                    SMLPOHPosType: {header : 'Pos/Type', size : '*'},
                    SMLSubjectMatter: {header : 'Subject Matter', size : '*'},
                    SMLStatus: {header : 'Status', size : '*'},
                    SMLInitFileDate: {header : 'Init Filing Date', size : '*'},
                    SMLSubjectMatterNo: {header : 'Subject Matter No', size : '*'},
                    SMLLobRegNo: {header : 'Lobbyist Reg No.', size : '*'},
                    SMLCommDate: {header : 'Comm. Date', size : '*'},
                    
                    };

var rptColumns = { 

    'BenRpt'  : {Idx: 'A', DataSource : "BeneficiaryArray",
                Cols :  [
                        {column: 'SMLBeneficiary', class: '', style: 'width: 20%', label: 'Beneficiary'},
                        {column: 'SMLBusOrg', class: '', style: 'width: 20%', label: 'Business/Org'},
                        {column: 'SMLLobbyistNames', class: '', style: 'width: 20%', label: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', class: '', style: 'width: 10%', label: 'Lobbyist Type'},                                     
                        {column: 'SMLPrivateFunding', class: '', style: 'width: 20%', label: 'Financial Contributors'},
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },
    'SMRpt'   : {Idx: 'N', DataSource : "jsonData",
                Cols :  [
                        {column: 'SMLLobbyistNames', class: '', style: 'width: 25%', label: 'Lobbyist Name(s)'},
                        {column: 'SMLBusOrg', class: '', style: 'width: 25%', label: 'Business/Org'},
                        {column: 'SMLSubjectMatter', class: '', style: 'width: 24%', label: 'Subject Matter'},
                        {column: 'SMLStatus', class: '', style: 'width: 6%', label: 'Status'},
                        {column: 'SMLInitFileDate', class: '', style: 'width: 10%', label: 'Initial Filing Date'},
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },
    'LobbyRpt': {Idx: 'A', DataSource : "LobbyistListArray",
                Cols : [
                        {column: 'SMLLobbyist', class: '', style: 'width: 15%', label: 'Lobbyist Name'},
                        {column: 'SMLLobbyistType', class: '', style: 'width: 9%', label: 'Lobbyist Type'},
                        {column: 'SMLBusOrg', class: '', style: 'width: 18%', label: 'Business/Org'},
                        {column: 'SMLClient', class: '', style: 'width: 18%', label: 'Client'},
                        {column: 'SMLSubjectMatter', class: '', style: 'width: 20%', label: 'Subject Matter'},
                        /*{column: 'SMLStatus', class: 'col-md-1', label: 'Status'},*/
                        {column: 'SMLLobRegNo', class: '', style: 'width: 10%', label: 'Lobbyist<br />Reg No.'},
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },
    'BusOrgClientRpt' : {Idx: 'A', DataSource : "BusOrgArray",
                Cols :  [
                        {column: 'SMLBusOrgClient', class: '', style: 'width: 20%', label: 'Business/Org/Client'},
                        {column: 'SMLLobbyistNames', class: '', style: 'width: 20%', label: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', class: '', style: 'width: 10%', label: 'Lobbyist Type'},                                                                             
                        {column: 'SMLBeneficiary', class: '', style: 'width: 20%', label: 'Beneficiary'},
                        {column: 'SMLPrivateFunding', class: '', style: 'width: 20%', label: 'Financial Contributors'},
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },
    'GovRpt'  : {Idx: 'A', DataSource : "GovFundingArray",
                Cols :  [
                        {column: 'SMLGovAgency', class: 'col-md-3', style: '', label: 'Gov. Agency'},
                        {column: 'SMLLobbyistNames', class: 'col-md-2', style: '', label: 'Lobbyist Name(s)'},
                        {column: 'SMLSubjectMatter', class: 'col-md-2', style: '', label: 'Subject Matter'},
                        {column: 'SMLStatus', class: 'col-md-1', style: '', label: 'Status'},      
                        {column: 'SMLInitFileDate', class: 'col-md-1', style: '', label: 'Initial Filing Date'},
                        {column: 'SMLSubjectMatterNo', class: 'col-md-1', style: '', label: 'Subject Matter No.'},                                     
                        ]
                },
    'FinRpt'  : {Idx: 'A', DataSource : "PrivateFundingArray",
                Cols :  [
                        {column: 'SMLFunding', class: '', style: 'width: 20%', label: 'Financial Contributor'},
                        {column: 'SMLBusOrg', class: '', style: 'width: 20%', label: 'Business/Org'},
                        {column: 'SMLLobbyistNames', class: '', style: 'width: 20%', label: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', class: '', style: 'width: 10%', label: 'Lobbyist Type'},                                                                                                                     
                        {column: 'SMLBeneficiary', class: '', style: 'width: 12%', label: 'Beneficiary'},
                        {column: 'SMLStatus', class: '', style: 'width: 8%', label: 'Status'},                                      
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },

    'POHCommRpt' : {Idx: 'N', DataSource : "POHArray",
                Cols :  [
                        {column: 'SMLPOHName', class: 'col-md-1', style: '', label: 'POH Name'},
                        {column: 'SMLPOHPosType', class: 'col-md-1', style: '', label: 'POH Pos/Type'},
                        {column: 'SMLSubjectMatter', class: 'col-md-2', style: '', label: 'Subject Matter'},
                        {column: 'SMLLobbyist', class: 'col-md-2', style: '', label: 'Lobbyist'},
                        {column: 'SMLCommDate', class: 'col-md-1', style: '', label: 'Comm Date'},
                        {column: 'SMLMethod', class: 'col-md-1', style: '', label: 'Method'},
                        {column: 'SMLMeetingReq', class: 'col-md-1', style: '', label: 'Request a Meeting?'},                                      
                        {column: 'SMLMeetingReqRes', class: 'col-md-1', style: '', label: 'Result of <br>Meeting Request?'},                                       
                        {column: 'SMLComReqDate', class: 'col-md-1', style: '', label: 'Date of Request'},                                     
                        {column: 'SMLSubjectMatterNo', class: 'col-md-1', style: '', label: 'Subject Matter No.'},                                     
                        ]
                },

    'POHNameRpt' : {Idx: 'A', DataSource : "POHNameArray",
                Cols :  [
                        {column: 'SMLPOHName', class: '', style: 'width: 15%', label: 'POH Name'},
                        {column: 'SMLPOHPosType', class: '', style: 'width: 23%', label: 'POH Pos/Type'},
                        {column: 'SMLSubjectMatter', class: '', style: 'width: 22%', label: 'Subject Matter'},
                        {column: 'SMLLobbyistNames', class: '', style: 'width: 22%', label: 'Lobbyist Name(s)'},
                        {column: 'SMLStatus', class: '', style: 'width: 8%', label: 'Status'},
                        {column: 'SMLSubjectMatterNo', class: '', style: 'width: 10%', label: 'Subject Matter No.'},                                     
                        ]
                },

    };

function showHideColumns() {

    //var rptName = $("#reportFilter").val();
    var rptCols = rptColumns[selectedReport].Cols;
    Object.keys(rptCols).forEach(function(key, idx, array) {
        if (rptCols[key]) {
            $("#"+key).show();
        } else {
            $("#"+key).hide();
        }
    });
}

function writeListingHeaders() {
    var rptCols = rptColumns[selectedReport].Cols;
    var tblHdr= "<tr id='SubjectMatterListingHdr'>";
    for (var i = 0; i < rptCols.length; i++) {
        tblHdr += "<th class='" + rptCols[i].class + "' id='" + rptCols[i].column + "'>" +
                "<label  class='colHdr control-label'>" + rptCols[i].label + "</label> </th>";
    }

    tblHdr += "</tr>";
       $("#lobbytable thead").html(tblHdr).trigger('update');
    
}
function getHighLightFilterOptions() {
    var searchStr = $('#searchString').val();
    var hfOpts = {searchStr : [],
                         searchRegex : []};
    if (searchStr.length > 0) {
        var words = searchStr.split(' ');
        for (i = 0; i < words.length; i++) {
            hfOpts.searchStr.push(words[i]);
            //console.log("word" + words[i]);
            hfOpts.searchRegex.push(new RegExp("(.*?)(" + words[i] + ")(.*)", "ig"));
        }
    }
    
    hfOpts.RegNoSearch = $("#regNoSearch").val();
    hfOpts.LobbyistNameSearch = $("#lobbyistNameSearch").val();
    hfOpts.LobbyistTypes =  decodeMultSelection("#lobbyistTypeFilter"); 
    //hfOpts.SMTypes = decodeMultSelection("#typeFilter");
    hfOpts.SMStatuses = decodeMultSelection("#statusFilter");
    hfOpts.SMSearch = $("#subjectMatterFilter").val();
    hfOpts.ClientSearch = $("#clientSearch").val();
    hfOpts.BeneficiarySearch = $("#beneficiarySearch").val();
    hfOpts.GovAgencySearch = $("#govAgencySearch").val();
    hfOpts.FinancialContributorSearch = $("#financialContributorSearch").val();
    hfOpts.POHSearch = $("#pohSearch").val();
    hfOpts.GrassRootsChk = ($("#grassRootsInd").is(":checked")) ? true : false;
    hfOpts.CommitteeChk = ($("#committeeInd").is(":checked")) ? true : false;
    hfOpts.DateFrom = moment($("#dateFrom").val()); 
    hfOpts.DateTo = moment($("#dateTo").val()); 
    hfOpts.POHNameSearch = $("#pohNameSearch").val();
    hfOpts.POHPositionSearch = $("#pohPositionSearch").val();
    hfOpts.POHOfficeSearch = $("#pohOfficeSearch").val();
    hfOpts.POHTypes =  decodeMultSelection("#pohTypeFilter"); 
    
    hfOpts.BusOrgNameSearch = $("#busOrgNameSearch").val();
    
    hfOpts.startIdx = nextRow;
    hfOpts.endIdx = nextRow + rowsPerPage; 
    
    return hfOpts;
}
function highlightSearch(string, hfOpts){
    if (hfOpts.searchRegex.length === 0) return string;

    var retStr = string;

    for (i = 0; i < hfOpts.searchRegex.length; i++) {
        var regStr = retStr;
        retStr = "";
        while (match = hfOpts.searchRegex[i].exec(regStr) ) {
                retStr += match[1] + '<span class="searchHighlight">'+ match[2] + '</span>';
                regStr = match[3];
        }
        retStr += regStr;
        }
    return retStr;
}
/* we want the filter to be an "AND" operations 
TODO: THE STRINGIFY IS REALLY EXPENSE. OR MAYBE THE INDEXOF ...OR MAYBE IT WAS DEBIG MODE
*/
function filterSearch(item, hfOpts) {
    if (hfOpts.searchStr.length === 0) return true;
    var retBool = true;
    var checkString = JSON.stringify(item).toLowerCase();
    for (var i = 0; i < hfOpts.searchStr.length; i++) {
        if(checkString.indexOf(hfOpts.searchStr[i].toLowerCase()) === -1) {
            retBool = false;
            break;
        }
    }
    return retBool;
}

/* this will be a query, that we will sort by name and display the 1st 100 */
/* all the lobyist work for the same Firm look for a record that is not parent,subsoidary, other
 the lobbyist type is in-house, voluntary or consultant.. regardless . DOn't look at communications level for type.
*/
function loadLobbyists() {
    if (LobbyistListArray.length > 0) {
        setAlphaMap(LobbyistListArray, 'LastName');
        return;
    }
    obbyistList = {}; //maybe an array here worksa...
    LobbyistListArray = []; //maybe an array here works..

    var lobbyistName ="";
    var lobbyistTypes = {};
    $.each(jsonData, function(i, item) {
        var firms = [];
        var firmName = "";
        var firmTradeName ="";
        var SMPushed = false;
        if (item.SM.Firms) {
           firms = convertToArrayIfNeccessary(item.SM.Firms.Firm);
        }
        $.each(firms, function(i, firm) {
            if (firm.Type !== 'Parent' && firm.Type !== 'Subsidiary' && firm.Type !== 'Other') {
               firmName = firm.Name;
               firmTradeName = firm.TradeName;
               return false;
            }
        });

        
        if (item.SM.Communications) {
            var comms = [];
            comms = convertToArrayIfNeccessary(item.SM.Communications.Communication);
            $.each(comms, function(j, comm) {
                if(comm.LobbyistFirstName || comm.LobbyistLastName) {
                    if (comm.LobbyistType.length > 0 && !lobbyistTypes[comm.LobbyistType]) {
                       lobbyistTypes[comm.LobbyistType] = true;
                    }
                    lobbyistName = comm.LobbyistLastName + ", " + comm.LobbyistFirstName;
                    
                    lobbyistKey = comm.LobbyistLastName + ", " + comm.LobbyistFirstName + "," + firmName + "," + firmTradeName; // this is for sorting purposes
                    lobbyistName = lobbyistName.trim();
                    if (lobbyistName.length > 0) {
                        if (!LobbyistList[lobbyistKey]) {
                           //Why am I'n not just throwing comm on this...
                           LobbyistList[lobbyistKey] = {LobbyistNumber: comm.LobbyistNumber, LobbyistName: comm.LobbyistFirstName + " " + comm.LobbyistLastName, FirstName : comm.LobbyistFirstName, LastName: comm.LobbyistLastName, Type: item.SM.Type, Firm: firmName, FirmTradeName: firmTradeName, SMs : []};
                           LobbyistList[lobbyistKey].SMs.push(item.SM);
                            SMPushed = true;
                        } else {
                           var found = false;
                           $.each( LobbyistList[lobbyistKey].SMs, function(j, lSM) {
                               if (lSM.SMNumber === item.SM.SMNumber) {
                                   found = true;
                                   return false;
                               }
                           });
                            if (!found) {
                                LobbyistList[lobbyistKey].SMs.push(item.SM);
                                 SMPushed = true;
                            }
                        }
                    }
                }
            });
        }
        //***Do this last, communi wil show Srt. Officer 1st... If "in-house, then registran should be "Sr. Officer", so we should add it.
        if (item.SM.Registrant) {
            lobbyistName = item.SM.Registrant.LastName + ", " + item.SM.Registrant.FirstName;
            lobbyistKey = item.SM.Registrant.LastName + ", " + item.SM.Registrant.FirstName + "," + firmName + "," + firmTradeName;
            //lobbyistNames = lobbyistName + ", ";
            //Do I need first, last, full???
           
            //So this is bad since it uses only names,, should be Firm and Trade Name as well.
            //ToDO: I should merge Firm/Trade name into Bus/Org here so I don't need to repeat later.
            var lobType = item.SM.Type; //'Sr. Officer';
            //if (item.SM.Type === 'Voluntary' || item.SM.Type === 'Consultant') {
            //    lobType = 'Consultant'
            //}
            if (!LobbyistList[lobbyistKey]) {           
                LobbyistList[lobbyistKey] = {LobbyistNumber: item.SM.Registrant.RegistrationNUmberWithSoNum, LobbyistName: item.SM.Registrant.FirstName + " " + 
                             item.SM.Registrant.LastName, FirstName : item.SM.Registrant.FirstName, 
                             LastName: item.SM.Registrant.LastName, Type: lobType, Firm: firmName, FirmTradeName: firmTradeName, SMs : []};
                LobbyistList[lobbyistKey].SMs.push(item.SM);
            } else if (!SMPushed) {
               LobbyistList[lobbyistKey].SMs.push(item.SM);
            }
        }       
        
    });

    Object.keys(LobbyistList).sort().forEach(function(key, idx, array) {
       LobbyistListArray.push(LobbyistList[key]);
    });
    LobbyistList = {};//release some space


  setAlphaMap(LobbyistListArray, 'LastName');

}


/* ignore clients.. should also include Firms that are "other" */
function loadBeneficiaries() {
    if ( BeneficiaryArray.length > 0) {
        setAlphaMap(BeneficiaryArray,"BeneficiaryName");
        return;
    }
    BeneficiaryList = {}; //maybe an array here worksa...
    BeneficiaryArray = []; //maybe an array here works..


    $.each(jsonData, function(i, item) {
        var bens = [];
        var benName = "";
        var benTradeName="";
        if (item.SM.Beneficiaries) {
           bens = convertToArrayIfNeccessary(item.SM.Beneficiaries.BENEFICIARY);
        }
        $.each(bens, function(i, ben) {
            if (ben.Type !== 'Client') {
                benName = ben.Name;
                benName += (ben.TradeName.trim().length > 0) ?' / ' + ben.TradeName : "";
                benTradeName = ben.TradeName;
                if (!BeneficiaryList[benName]) {
                    BeneficiaryList[benName] = {BeneficiaryName: benName, SMs : []};
                }
                BeneficiaryList[benName].SMs.push(item.SM);
            }
        });
    });


    Object.keys(BeneficiaryList).sort().forEach(function(key, idx, array) {
       BeneficiaryArray.push(BeneficiaryList[key]);


    });
    BeneficiaryList = {};//release some space

    setAlphaMap(BeneficiaryArray,"BeneficiaryName");
    
}


function loadPOHNames() {

    if (POHNameArray.length > 0) {
        setAlphaMap(POHNameArray,"POHName");
        return;
    }
    POHNameList = {}; //maybe an array here worksa...
    POHNameArray = []; //maybe an array here works..
    POHSMTracker = {};

    //$.each(jsonData, function(i, item) {
    for (var i = 0; i < jsonData.length; i++) {
        var item = jsonData[i];
        var comms = [];
        var pohName = "";
        var pohPosType ="";
        if (item.SM.Communications) {
           comms = convertToArrayIfNeccessary(item.SM.Communications.Communication);
        }
        for (var j = 1;  j < comms.length; j++) {
            var comm = comms[j];
        //$.each(comms, function(i, comm) {
            if (comm.POH_Name !== "") {
                pohName  = comm.POH_Name +  comm.POH_Position;
                pohPosType = comm.POH_Position;
                if ( comm.POH_Type !== "") {
                    if (pohPosType !== "") { pohPosType += " / " + comm.POH_Type;} else {pohPosType += comm.POH_Type;}
                }
                if (!POHNameList[ pohName]) {
                    POHNameList[ pohName] = {POHName: comm.POH_Name, POHPosition : comm.POH_Position,POHPosType : pohPosType , SMs : []};
                }
                if (!POHSMTracker[pohName + item.SM.SMNumber]) {
                    POHSMTracker[pohName + item.SM.SMNumber] = true;
                    POHNameList[pohName].SMs.push(item.SM);
                }
            }
        }// );
    }//);


    Object.keys(POHNameList).sort().forEach(function(key, idx, array) {
       POHNameArray.push(POHNameList[key]);


    });
    POHNameList = {};//release some space

     setAlphaMap(POHNameArray,"POHName");
    
}

/* check for client via beneficiaries.. etc */
function loadBusOrgClients() {
    if ( BusOrgClientArray.length > 0) {
        setAlphaMap(BusOrgClientArray,"BusOrgName");
        return;
    }
    BusOrgClientList = {}; //maybe an array here worksa...
    BusOrgClientArray = []; //maybe an array here works..


    $.each(jsonData, function(i, item) {
        var busorgs = [];
        var bens = [];
        var firmName = "";
        if (item.SM.Firms) {
           busorgs = convertToArrayIfNeccessary(item.SM.Firms.Firm);
        }
        if (item.SM.Beneficiaries) {
           bens = convertToArrayIfNeccessary(item.SM.Beneficiaries.BENEFICIARY);
        }
        $.each(busorgs, function(i, busorg) {
            if (busorg.Name !== "") {
                firmName  = busorg.Name;
                firmName  += (busorg.TradeName !== "" ? " / " + busorg.TradeName : "");
                
                if (!BusOrgClientList[firmName]) {
                    BusOrgClientList[firmName] = {BusOrgClientName:firmName, SMs : []};
                }
                BusOrgClientList[firmName].SMs.push(item.SM);
            }
        });
        $.each(bens, function(i, ben) {
            if (ben.Type === "Client") {
                firmName  = ben.Name;
                firmName  += (ben.TradeName !== "" ? " / " + ben.TradeName : "");
                
                if (!BusOrgClientList[firmName]) {
                    BusOrgClientList[firmName] = {BusOrgClientName:firmName, SMs : []};
                }
                BusOrgClientList[firmName].SMs.push(item.SM);
            }
        });    
    });


    Object.keys(BusOrgClientList).sort().forEach(function(key, idx, array) {
       BusOrgClientArray.push(BusOrgClientList[key]);


    });
    BusOrgClientList = {};//release some space

    setAlphaMap(BusOrgClientArray,"BusOrgClientName");
    
}



/* this wil be removed int he end */
function loadGovFunding() {

    GovFundingList = {}; 
    GovFundingArray = [];


    $.each(jsonData, function(i, item) {
        var govs = [];
        var govName = "";
        var govProgram="";
        if (item.SM.Gmtfundings) {
           govs = convertToArrayIfNeccessary(item.SM.Gmtfundings.Gmtfunding);
        }
        $.each(govs, function(i, gov) {
            govName = gov.GMTName;
            govName += (gov.Program.trim().length > 0) ?' / ' + gov.Program : "";
            if (!GovFundingList[govName]) {
                GovFundingList[govName] = {GovName: govName, SMs : []};
            }
            GovFundingList[govName].SMs.push(item.SM);
        });
    });


    Object.keys(GovFundingList).sort().forEach(function(key, idx, array) {
       GovFundingArray.push(GovFundingList[key]);


    });
    GovFundingList = {};//release some space
   
    setAlphaMap(GovFundingArray,"GovName");   


}

/* this wil be removed int he end */
function loadPrivateFunding() {
    if ( PrivateFundingArray.length > 0) {
        setAlphaMap(PrivateFundingArray,"FundingName");
        return;
    }
    PrivateFundingList = {}; 
    PrivateFundingArray = []; 


    $.each(jsonData, function(i, item) {
        var pfs = [];
        var pfFunding = "";
        if (item.SM.Privatefundings) {
           pfs = convertToArrayIfNeccessary(item.SM.Privatefundings.Privatefunding);
        }
        $.each(pfs, function(i, pf) {
            pfFunding = pf.Funding;
            pfFunding += (pf.Contact.length > 0) ?' / ' + pf.Contact : "";
            if (!PrivateFundingList[pfFunding]) {
                PrivateFundingList[pfFunding] = {FundingName: pfFunding, SMs : []};
            }
            PrivateFundingList[pfFunding].SMs.push(item.SM);
        });
    });


    Object.keys(PrivateFundingList).sort().forEach(function(key, idx, array) {
       PrivateFundingArray.push(PrivateFundingList[key]);
    });
    PrivateFundingList = {};//release some space
   
    setAlphaMap(PrivateFundingArray,"FundingName");   
}

function splitSubjectMatters(smStr) {
    var sms = smStr.split(/[,;]/);
    return sms;
}



/* not needed with bloodhound http://twitter.github.io/typeahead.js/examples/
var subjectMatterMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substringRegex;

    // an array that will be populated with substring matches
    matches = [];

    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');

    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        matches.push(str);
      }
    });

    cb(matches);
  };
};
*/

//This should be an AJAX call, but that it from current file for now
function loadSubjectMatters() {
    var sms = {};
    $.each(jsonData, function(i, item) {
        var itemSMs = splitSubjectMatters(item.SM.SubjectMatter);
        for ( i = 0; i < itemSMs.length; i++ ) {
             if (itemSMs[i].trim().length > 0 && !sms[itemSMs[i].trim()]) {
                sms[itemSMs[i].trim()] = true;
            }
        }
    });
    var options = '';
    var smArray = [];
    Object.keys(sms).sort().forEach(function(val, idx, array) {
        options += '<option value="'  + val + '" selected="selected">' + val + '</option>';
        smArray.push(val);
        });

    var smLookup = new Bloodhound({
        datumTokenizer: Bloodhound.tokenizers.whitespace,
        queryTokenizer: Bloodhound.tokenizers.whitespace,
        local: smArray
        });

        $('#subjectMatterFilter').typeahead({
            hint: true,
            highlight: true,
            minLength: 1,

        },
        {
            name: 'matters',
            source: smLookup,
            limit: 50
        });

}

/*
function resetsearch ( oSearch ) {
    $( "#searchreset" ).addClass( 'hide' );
    $( oSearch ).val("");
}
*/

function dynamicSort(root, property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    
    return function (a,b) {
        var result = 0;
        if (root !== "") {
            result = (a[root][property] < b[root][property]) ? -1 : (a[root][property] > b[root][property]) ? 1 : 0;
        } else {
            result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        }
        return result * sortOrder;
    };
}


//TODO -- maybe use *ALL* or something no one will type in a search
function decodeMultSelection(domId) {
    var str = "";
    if ($(domId).prop('options') &&  $(domId).prop('selectedOptions') && $(domId).prop('options').length === $(domId).prop('selectedOptions').length) {
        str = "ALL";
    } else if ($(domId).val() !== null) {
        $.each($(domId).val(), function(i,item) {
            str += (i>0) ? "," : "";
            str += item;
        });
    }
    return str;
}


//function filterLobbyistType(selectedTypes, itemType) {
//    var retbool = false;
//    //if (selectedTypes.length === 0) retbool = true;
//    if (selectedTypes.indexOf(itemType) > -1) retbool = true;
//    return retbool;
//}


function columnFilter(searchStr, itemStr) {
    var retbool = false;
    if (searchStr.length === 0 || itemStr.toLowerCase().indexOf(searchStr.toLowerCase()) > -1) {
        retbool = true;
    }
    return retbool;
}

function dateRangeFilter(dateFrom, dateTo, itemStr) {
     var retbool = false;
    item = moment(itemStr);
    if (isNaN(dateFrom) && isNaN(dateTo)) {
        retbool = true;
    } else if (isNaN(dateFrom)  && item <=  dateTo) {
        retbool = true;
    } else if (isNaN(dateTo)  && item >=  dateFrom) {
        retbool = true;
    } else if ( item >=  dateFrom && item <=  dateTo ) {
        retbool = true;
    }
    return retbool;
} 

function selectFilter(filterStr, itemStr) {
    var retbool = false;
    if ( filterStr === 'ALL' || (filterStr.length > 0 && filterStr.toLowerCase().indexOf(itemStr.toLowerCase()) > -1)) {
        retbool = true;
    }
    return retbool;
}

function filterLobbyistType(selectedLobbyistTypes, SM) {

    var retbool = false;
    if (selectedLobbyistTypes === 'ALL') retbool = true;
    if (SM.Type === 'Voluntary' || SM.Type === 'Consultant' ) {
       if (selectedLobbyistTypes.indexOf('Consultant') > -1) {
        retbool = true; 
       }
    } else {
        if (SM.Communications) {
            var comms = [];
            comms = convertToArrayIfNeccessary(SM.Communications.Communication);
            $.each(comms, function(j, comm) {
                if(selectedLobbyistTypes.indexOf(comm.LobbyistType) > -1) {
                    retbool = true; 
                    }
            });
        }
        if (SM.Registrant && selectedLobbyistTypes.indexOf('Sr. Officer') > -1) {
            retbool = true; 
        }
    }
    
    return retbool;
}

/* if SM Type = in-house, registrant is Sr. LobbyIst 
   if SM Type = voluntary, registrant is Voluntary Lobyist
   if SM Type = Consultant, registrant is Consulant Lobyist
   
*/
function mergeLobbyistNames (SM) {
    var lobbyistNames = "";
    var lobbyistName = "";
    //TODO: need a hash... fix for case sensistive, ignore column/attribute names?
    //https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify  could create a long list of words to replace
    //do a loop at each object and look at value..but then subobjects and recursion etc.
    // IE7 and lower is not something that you should use.  doesn't support JSON.stroingfy
    //DO registrants last.. if in COmminucation, they type may be "Sr. Officer'
    var uniqueLobbyists = {};

    if (SM.Registrant) {
       lobbyistName = "<b>" + SM.Registrant.FirstName + " " + SM.Registrant.LastName + "</b>";
       lobbyistNames = lobbyistName + ", ";
       uniqueLobbyists[lobbyistName] = true;
    }
    if (SM.Communications) {
        var comms =[];
        comms = convertToArrayIfNeccessary(SM.Communications.Communication);

        $.each(comms, function(j, comm) {
            if(comm.LobbyistFirstName || comm.LobbyistLastName) {
                lobbyistName =  (comm.LobbyistType === 'Sr. Officer') ? "<b>" + comm.LobbyistFirstName + " " + comm.LobbyistLastName + "</b>" : comm.LobbyistFirstName + " " + comm.LobbyistLastName;
                //var lobbyistName = comm.LobbyistFirstName + " " + comm.LobbyistLastName;
                if (!uniqueLobbyists[lobbyistName]) {
                    lobbyistNames += comm.LobbyistFirstName + " " + comm.LobbyistLastName + ", ";
                    uniqueLobbyists[lobbyistName] = true;
                }
            }
        });
        }
    lobbyistNames = lobbyistNames.substring(0, lobbyistNames.length - 2);
    return lobbyistNames;

}

function getSMClient(SMObj) {
    var bens = [];
    var clientName = "";
    if (SMObj.Beneficiaries) {
       bens = convertToArrayIfNeccessary(SMObj.Beneficiaries.BENEFICIARY);
    }
    $.each(bens, function(i, item) {
        if (item.Type === 'Client') {
            clientName = item.Name;
            return false;
        }
    });
    return (typeof clientName === 'undefined') ? "" : clientName;
}

function getSMBusOrg(SMObj) {
    var firms = [];
    var firmName = "";
    var firmTradeName ="";
    if (SMObj.Firms) {
        firms = convertToArrayIfNeccessary(SMObj.Firms.Firm);
    }
    $.each(firms, function(i, firm) {
        if (firm.Type !== 'Parent' && firm.Type !== 'Subsidiary' && firm.Type !== 'Other') {
            firmName = firm.Name;
            firmTradeName = firm.TradeName;
            return false;
        }
    });
    
    return firmName +  ((firmTradeName.trim().length > 0) ? ' / ' + firmTradeName : "");
}

//SML: Beneficiaries are also Firms that not Organizatoons...parent/subsidaries/other
function getSMBeneficiaries(SMObj) {
    var bens = [];
    var benNames = "";
    if (SMObj.Beneficiaries) {
        bens = convertToArrayIfNeccessary(SMObj.Beneficiaries.BENEFICIARY);
    }
    $.each(bens, function(i, ben) {
        if (ben.Type !== 'Client') {    //&& firm.Type !== 'Subsidiary' && firm.Type !== 'Other') {
            benNames += ben.Name;
            benNames +=  (ben.TradeName !== "" ? " / " + ben.TradeName : "") + ", ";
        }
    });
    benNames = benNames.substring(0,benNames.length - 2);
    return benNames;
}

function getSMFunding(SMObj) {
    var pfs = [];
    var pfNames = "";
    if (SMObj.Privatefundings) {
        pfs = convertToArrayIfNeccessary(SMObj.Privatefundings.Privatefunding);
    }
    $.each(pfs, function(i, pf) {
       // if (firm.Type !== 'Parent' && firm.Type !== 'Subsidiary' && firm.Type !== 'Other') {
            pfNames += pf.Funding + ", ";
            //pfNames +=  (pf.Contact != "" ? " / " + pf.Contact : "") + ",<br>";
            //return false;
        //}
    });
    pfNames = pfNames.substring(0,pfNames.length - 2);
    return pfNames;
}


function showSM(SMNumber) {
    /*
    $.each(jsonData, function(i, item) {
        if (item.SM.SMNumber === SMNumber) {
             var SMData = JSON.stringify(item.SM);
             //$("#smdata").html("<textarea style='width:100%; height:500px;background-color:Azure' class='dialog'>" + JSON.stringify(JSON.parse(SMData),null,4) + "</textarea>");
             //$("#modalData").modal('show');
             
            if (document.location.hostname.length === 0) {
                window.location.href = "Main.html?SM=" + SMNumber;// + "&jsonData=" + SMData.replace(/&/g,"");
            } else {

                window.location.href = '/wps/portal/contentonly?vgnextoid=' +  detailTeaserGUID + '&SM=' + SMNumber;
            }
        }
    });
    */
    
    var href = "";
    
    if (document.location.hostname.length === 0) {
        href = "Main.html?SM=" + SMNumber;
    } else {
        href = '/wps/portal/contentonly?vgnextoid=' +  detailTeaserGUID + '&SM=' + SMNumber;
    }
    href += ($('#searchString').val() !== "" ? "&searchStr=" + $('#searchString').val() :"");
    window.location.href = href;
    return false; //to cancel the link
}

function showLR(SMNumber, LRNumber) {
    
    var href = "";
    if (document.location.hostname.length === 0) {
        href = 'Main.html?SM=' + SMNumber + '&LR=' + LRNumber;
    } else {
       href = '/wps/portal/contentonly?vgnextoid=' +  detailTeaserGUID + '&SM=' + SMNumber + '&LR=' + LRNumber;
    }
    href += ($('#searchString').val() !== "" ? "&searchStr=" + $('#searchString').val() :"");
    window.location.href = href;
    return false; //to cancel the link
}


/* The Json data have properties that consist of 1 object or an array of objects, This will make sure we always deal with arrays */
function convertToArrayIfNeccessary(obj) {
    var objArr = [];
    if (obj) {
        if (obj.length) { //already an array
           objArr = obj;
       } else {
           objArr.push(obj);
       }
    }
    return objArr;
}
 
function filterGovAgency(searchStr,SMObj) {
    if (searchStr.length === 0 ) return true;
    var retbool = false;
    var govFunding = [];
    if (SMObj.Gmtfundings) {
       govFunding = convertToArrayIfNeccessary(SMObj.Gmtfundings.Gmtfunding);
    }
    $.each(govFunding, function(i, item) {
        if (item.GMTName.toLowerCase().indexOf(searchStr.toLowerCase()) > -1 || 
            item.Program.toLowerCase().indexOf(searchStr.toLowerCase()) > -1 ){
            retbool = true;
            return false;
        }
    });
    return retbool;

}

function filterBeneficary(searchStr,SMObj) {
    if (searchStr.length === 0 ) return true;
    var retbool = false;
    var bens = [];
    if (SMObj.Beneficiaries) {
       bens = convertToArrayIfNeccessary(SMObj.Beneficiaries.BENEFICIARY);
    }
    $.each(bens, function(i, item) {
        if (item.Name.toLowerCase().indexOf(searchStr.toLowerCase()) > -1 || 
            item.TradeName.toLowerCase().indexOf(searchStr.toLowerCase()) > -1 ){
            retbool = true;
            return false;
        }
    });
    return retbool;
}

function filterCommunication(searchStr,SMObj, property) {
    if (searchStr.length === 0 ) return true;
    var retbool = false;
    var comms = [];
    if (SMObj.Communications) {
       comms = convertToArrayIfNeccessary(SMObj.Communications.Communication);
    }
    for (var i = 0, len = comms.length; i < len; i++) {
    //$.each(comms, function(i, item) {
        var item = comms[i];
        if (item[property].toLowerCase().indexOf(searchStr.toLowerCase()) > -1) {
            retbool = true;
            break;
        }
    }//);
    return retbool;

}

/* as an alternative to these special filters.. i could create getFunding.. concat all together and do an IndexOf this,
Do check all 4 items??? am I doing it for others?
i got numbers in one record... so do the "" trick to make sure the data is strings.. do this weverywhere..
*/
function filterFunding(searchStr,SMObj) {
    if (searchStr.length === 0 ) return true;
    var retbool = false;
    var pfs = [];
    if (SMObj.Privatefundings) {
       pfs = convertToArrayIfNeccessary(SMObj.Privatefundings.Privatefunding);
    }
    $.each(pfs, function(i, item) {
        if (("" +item.Funding).toLowerCase().indexOf(searchStr.toLowerCase()) > -1 || 
            ("" +item.Contact).toLowerCase().indexOf(searchStr.toLowerCase()) > -1 ||
            ("" +item.AgentContact).toLowerCase().indexOf(searchStr.toLowerCase()) > -1 ||
            ("" +item.Agent).toLowerCase().indexOf(searchStr.toLowerCase()) > -1 ){
            retbool = true;
            return false;
        }
    });
    return retbool;

}


function resetFilters() {
    $(".columnSearch").each(function( index ) { 
        this.value="";
    });
    $(".columnCheckBox").each(function( index ) { 
        this.checked = false;
    }); 
    $(".columnSelect").each(function( index ) { 
        $("#" + this.id).multiselect('selectAll',false);
        $("#" + this.id).multiselect('refresh');
     }); 
    $("#searchString").val("");
    $("#searchBtn").show();
    $("#advSearchBtnGroup").show();
    $("#advSearchString").hide();
    $("#searchString").prop( "disabled", false );
    $("#searchString").show();  
    filtersApplied(); //to Reset tooltips
}

function toTitleCase(str) {
    var ret = str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
    return ret.split(/(?=[A-Z])/).join(' ');
}

function filtersApplied() {
    var retbool = false;
    var filterText = "";
    $(".columnSearch").each(function( index ) { 
        if(this.id !== null && this.value !== null && this.value.length > 0) {
            filterText += toTitleCase(this.id.replace('Search','').replace('Filter','')) + " : " + this.value + "<br>";
            retbool = true;
            //return false;
        }
    });
    $(".columnCheckBox").each(function( index ) { 
        if(this.id !== null && this.checked) {
            filterText += toTitleCase(this.id.replace('Ind','')) + " : " + this.checked  + "<br>";
            retbool = true;
            //return false;
        }
    }); 
    $(".columnSelect").each(function( index ) { 
        if(this.id !== null && this.selectedOptions && this.selectedOptions.length != this.options.length) {
            filterText += toTitleCase(this.id).replace('Filter','') + " : ";
            for (i = 0; i < this.selectedOptions.length; i++) {
                filterText += this.selectedOptions[i].value + ", ";
            }
            filterText =filterText.slice(0,-2);
            filterText += "<br>";
            retbool = true;
        }
    });     
    
   $(".datepicker").each(function( index ) { 
        if(this.id !== null && this.value.length > 0) {
            filterText += toTitleCase(this.id) + " : " + this.value + "<br>";
            retbool = true;
        }
    });     
    
    
    if ($("#searchString").val().length > 0) {
        retbool = true;
        $("#advSearchBtnGroup").hide();
    } else {
        $("#advSearchBtnGroup").show();
    }
   // console.log("filtersapplied?" + retbool + " " + filterText);
    $("#advSearchString").val(filterText.replace(/<br>/g," ; ").slice(0,-3));
    $("#lrServiceBar").tooltip('hide')
          .attr('data-original-title', filterText)
          .tooltip('fixTitle')
          .tooltip('show');
          
         
    if (retbool) {
        $("#advSearchResetGroup").show();
    } else {
        $("#advSearchResetGroup").hide();
    }
    return retbool;     
}

function resetAlphaMap() {
    alphaMap = {};
    var alphabet = "1ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (var i = 0; i < alphabet.length; i++) {
        alphaMap[alphabet[i]] = false;
    }
}

function setAlphaMap(SMData, keyCol) {
    
    if (filtersApplied()) {
        $("#alphaPagination").hide();
    } else {
        $("#alphaPagination").show();
        resetAlphaMap();
        for (var i = 0; i < SMData.length; i++) {
            var alphaKey = SMData[i][keyCol].charAt(0);
            if (alphaKey.match(/[a-z]/i)) {
                alphaMap[alphaKey.toUpperCase()] = true;
            } else {
                alphaMap["1"] = true;
            }
        }
        var firstLetter = false;
        Object.keys(alphaMap).forEach(function(key, idx, array) {
            if (alphaMap[key]) {
                if (!firstLetter) {
                    firstLetter = true;
                    currentAlpha= (key === "1") ? "#" : key;
                }
                $("#alpha-" + key ).removeClass("disabled");
            } else {
                $("#alpha-" + key ).addClass("disabled");
            }
        });
    }
}

/* any item.xxxx properties are assumed to be there in their context, these are the summarized grouped values 
if you add columns to the report indiscrimately, it may not work.
We re-filter because child rows may need to be filtered out.. although this doesn't apply to the basic SM report
*/
function listDetailRow(item, SM, rowNum, hfOpts) {
    
    var strRows = "";
    //var hfOpts = getHighLightFilterOptions();
    var rptCols = rptColumns[selectedReport].Cols;
    var lobbyistNames = mergeLobbyistNames(SM);
    var client = getSMClient(SM);
    var busOrg = getSMBusOrg(SM);
    var bens = getSMBeneficiaries(SM);
    var privateFunding = getSMFunding(SM);
    showItem = true;
    var rowId = "lrRow" + rowNum;

    if (showItem) showItem = filterSearch(SM, hfOpts);

    if (showItem) showItem = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
    if (showItem) showItem = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
            //if (showItem) showItem = filterLobbyistType(hfOpts.LobbyistTypes, SM);
    if (showItem) showItem = selectFilter(hfOpts.LobbyistTypes,SM.Type);
    if (showItem) showItem = selectFilter(hfOpts.SMStatuses,SM.Status);
    if (showItem) showItem = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
    if (showItem) showItem = columnFilter(hfOpts.ClientSearch,client);
    if (showItem) showItem = filterBeneficary(hfOpts.BeneficiarySearch,SM);
    if (showItem) showItem = filterGovAgency(hfOpts.GovAgencySearch,SM);
    if (showItem) showItem = filterFunding(hfOpts.FinancialContributorSearch,SM);      
    if (showItem) showItem = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");  
    if (showItem) showItem = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");  
    if (showItem) showItem = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office");  
    if (showItem && hfOpts.CommitteeChk && !SM.Meetings) showItem = false;
    if (showItem && hfOpts.GrassRootsChk && !SM.Grassroots) showItem = false;
    if (showItem) showItem = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);

    if (showItem) {       

        strRows += '<tr id="' + rowId + '">';  
                
        for (var i = 0; i < rptCols.length; i++) {
            if (rptCols[i].column === "SMLLobbyist") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(item.LastName + ", " + item.FirstName,hfOpts) + '</td>';
            }
            if (rptCols[i].column === "SMLBeneficiary") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(bens, hfOpts) + '</td>';
            }               

            if (rptCols[i].column === "SMLLobbyistNames") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' +  highlightSearch(lobbyistNames,hfOpts) + "</td>";
            }

            if (rptCols[i].column === "SMLLobbyistType") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + SM.Type + '</td>';
            }
            if (rptCols[i].column === "SMLClient") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(client, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLBusOrg") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(busOrg, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLBusOrgClient") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(item.BusOrgClientName, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLFunding") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' +highlightSearch(item.FundingName, hfOpts) + '</td>';
            }
            if (rptCols[i].column === "SMLPrivateFunding") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(privateFunding, hfOpts) + '</td>';
            }                    
            if (rptCols[i].column === "SMLSubjectMatter") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(SM.SubjectMatter.replace(';','; '), hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLStatus") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(SM.Status, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLInitFileDate") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(SM.InitialApprovalDate, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLSubjectMatterNo") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + '<button onclick="showSM(\'' + SM.SMNumber + '\')" >' +  highlightSearch(SM.SMNumber,hfOpts) + '</button></td>';
            }
            if (rptCols[i].column === "SMLLobRegNo") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + '<button onclick="showLR(\'' + SM.SMNumber + '\',\'' + item.LobbyistNumber + '\')" >' + highlightSearch(item.LobbyistNumber, hfOpts) + "</td>";
            }
            if (rptCols[i].column === "SMLPOHName") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' + highlightSearch(item.POHName ,hfOpts) + '</td>';
            }
            if (rptCols[i].column === "SMLPOHPosition") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' +highlightSearch(item.POHPosition ,hfOpts) + '</td>';
            }
            if (rptCols[i].column === "SMLPOHPosType") {
                strRows += '<td class="' + rptCols[i].class + '" style="' + rptCols[i].style + '">' +highlightSearch(item.POHPosType ,hfOpts) + '</td>';
            }
        }
        strRows +="</tr>";
    }
    return strRows;
}
function updatePageTable(strRows) {
    if (strRows === "") {
       strRows += "<tr id='nowRows'><td colspan='25'>No Rows Selected</td></tr>"; // + "' onmouseover='highlightMarker(this);'>";
    }
    $("#lobbytable tbody").html(strRows).trigger('update');
    $("#loader").hide();
}

function generatePOHListing() {
    var tblStr = "<tr><td colspan='10'>some of the data in this report is not in the data extract</td></tr>";
    $("#lobbytable tbody").html(tblStr).trigger('update');
    $("#loader").hide();
}
function getPageLobbyData(pagingType) {
    
    totalJSONRows = 0;
    var SMData = [];
    var strRows = "";
    var showItem = true;
    var showParent = true;
    var showReset = false;
    var rowCnt = 0;
    var rowId = "";
    var lobbyistName = "";
    var hfOpts = getHighLightFilterOptions();

    //$.each(LobbyistListArray, function(i, item) {
    for (var i = 0, len = LobbyistListArray.length; i < len; i++) {
        var item = LobbyistListArray[i];
        showParent = true;
        rowId = "loobyregistryrow" + rowCnt;
        if (showParent) showParent = filterSearch(item, hfOpts);
        //This filter is of the type we determine when loading
        if (showParent) showParent = selectFilter(hfOpts.LobbyistTypes,item.Type);
        /* TODO: would you ever search of 1st name.. do we need two boxes and if so remove or do soemthing with name in lobhylist.*/
        //if (showParent) showParent = columnFilter(strLobbyistNameSearch,item.LastName);
        var hasSubItems = false;
        if (showParent) { /*SML: we need predetermine if we need to show item */

            //$.each(item.SMs, function(i, SM) {
            for (var j = 0, smLen = item.SMs.length; j < smLen; j++) {
                var SM = item.SMs[j];
                var lobbyistNames = mergeLobbyistNames(SM);
                var client = getSMClient(SM);
                var subItemPass = true;
                //if (subItemPass) subItemPass = filterSearch(SM, hfOpts);
                if (subItemPass) subItemPass = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
                if (subItemPass) subItemPass = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
                if (subItemPass) subItemPass = selectFilter(hfOpts.LobbyistTypes,SM.Type);
                //if (subItemPass) subItemPass = selectFilter(hfOpts.SMTypes,SM.Type);
                if (subItemPass) subItemPass = selectFilter(hfOpts.SMStatuses,SM.Status);
                if (subItemPass) subItemPass = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
                if (subItemPass) subItemPass = columnFilter(hfOpts.ClientSearch,client);
                if (subItemPass) subItemPass = filterBeneficary(hfOpts.BeneficiarySearch,SM);
                if (subItemPass) subItemPass = filterGovAgency(hfOpts.GovAgencySearch,SM);
                if (subItemPass) subItemPass = filterFunding(hfOpts.FinancialContributorSearch,SM);           
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");                                
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");                                
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office");                                
                if (subItemPass && hfOpts.CommitteeChk && !SM.Meetings) subItemPass = false;
                if (subItemPass && hfOpts.GrassRootsChk && !SM.Grassroots) subItemPass = false;
                //if (subItemPass) subItemPass = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);
                

                if (subItemPass) {
                    hasSubItems = true;
                    break;
                }
            }//);
        }
        
        if (pagingType ==='A') {
            if (item.LastName.charAt(0).toUpperCase() !== currentAlpha) showParent = false;
        }

        if (showParent && hasSubItems) {
            totalJSONRows++;
            if (pagingType === 'A' || (pagingType === 'N' && totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx)) {
                SMData.push(item);
            }
        }
        
    }//);

    return SMData;
}


function generateLobbyistListing(SMData) {
    var strRows = "";
    var dataFound = false;
    var hfOpts = getHighLightFilterOptions();
    for (var i = 0, itemLen = SMData.length; i < itemLen; i++) {
        var item = SMData[i];
        for (var j = 0, len = item.SMs.length; j < len; j++) {
            strRows += listDetailRow(item, item.SMs[j],  i, hfOpts);
        }
    }
    
    updatePageTable(strRows);

}


function generateNoDataListing() {

    strRows = "<tr id='nowRows'><td colspan='25'>No Rows Selected</td></tr>"; 
    $("#lobbytable tbody").html(strRows).trigger('update');
    $("#PageStatus").hide();
}


/* the goal is to replace these with AJAX calls and skip needing to use filter logic to eliminat records*/

function getPageBenData(pagingType) {
    totalJSONRows = 0;
    var showParent = true;
    var SMData = [];
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();

    $.each(BeneficiaryArray, function(i, item) {
        showParent = true;
        if (showParent) showParent = filterSearch(item, hfOpts);
        if (showParent) showParent = columnFilter(hfOpts.BeneficiarySearch,item.BeneficiaryName);       
        //add ben search.. if (showParent) showParent = columnFilter(strLobbyistNameSearch,item.LastName);
        var hasSubItems = false;
        if (showParent) { /*SML: we need predetermine if we need to show item */

            $.each(item.SMs, function(i, SM) {
            
                var lobbyistNames = mergeLobbyistNames(SM);
                var client = getSMClient(SM);
                var subItemPass = true;
                if (subItemPass) subItemPass = filterSearch(SM, hfOpts);
                if (subItemPass) subItemPass = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
                if (subItemPass) subItemPass = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
                //if (subItemPass) subItemPass = filterLobbyistType(hfOpts.LobbyistTypes,SM);
                if (subItemPass) subItemPass = selectFilter(hfOpts.LobbyistTypes,SM.Type);
                if (subItemPass) subItemPass = selectFilter(hfOpts.SMStatuses,SM.Status);
                if (subItemPass) subItemPass = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
                if (subItemPass) subItemPass = columnFilter(hfOpts.ClientSearch,client);
                if (subItemPass) subItemPass = filterBeneficary(hfOpts.BeneficiarySearch,SM);
                if (subItemPass) subItemPass = filterGovAgency(hfOpts.GovAgencySearch,SM);
                if (subItemPass) subItemPass = filterFunding(hfOpts.FinancialContributorSearch,SM);      
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");                
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");  
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office"); 
                if (subItemPass && hfOpts.CommitteeChk && !SM.Meetings) subItemPass = false;
                if (subItemPass && hfOpts.GrassRootsChk && !SM.Grassroots) subItemPass = false;
                if (subItemPass) subItemPass = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);               
                if (subItemPass) {
                    hasSubItems = true;
                    return false;
                }
            });
        }

        if (pagingType ==='A') {
            if (item.BeneficiaryName.charAt(0).toUpperCase().match(/[a-z]/i) && item.BeneficiaryName.charAt(0).toUpperCase() !== currentAlpha) showParent = false;
            if (!item.BeneficiaryName.charAt(0).toUpperCase().match(/[a-z]/i) && "#" !== currentAlpha) showParent = false;
        }

        if (showParent && hasSubItems) {
            totalJSONRows++;
            if (pagingType === 'A' || (pagingType === 'N' && totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx)) {
                SMData.push(item);
            }
        }
     });

     

     return SMData;


}

/* Can I do this generically..look for columns that are shown.. problems is the "key" fields to show..*/
function generateBenListing(SMData) {
    var showItem = true;
    var strRows = "";
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();
    $.each(SMData, function(i, item) {
        rowCnt++;
        for (i = 0, len = item.SMs.length; i < len; i++) {
            var SM = item.SMs[i];
            strRows += listDetailRow(item, SM,  rowCnt, hfOpts);
        }
    });
    
    updatePageTable(strRows);

}

function getPagePOHNameData(pagingType) {
    totalJSONRows = 0;
    var subItemTotal = 0;
    var showParent = true;
    var SMData = [];
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();

    $.each(POHNameArray, function(i, item) {
        showParent = true;
        //rowId = "loobyregistryrow" + rowCnt;
        if (showParent) showParent = filterSearch(item, hfOpts);
        if (showParent) showParent = columnFilter(hfOpts.POHNameSearch,item.POHName);       
        var hasSubItems = false;
        if (showParent) { 

            subItemTotal = 0;
            $.each(item.SMs, function(i, SM) {
            
                var lobbyistNames = mergeLobbyistNames(SM);
                var client = getSMClient(SM);
                var subItemPass = true;
                if (subItemPass) subItemPass = filterSearch(SM, hfOpts);
                if (subItemPass) subItemPass = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
                if (subItemPass) subItemPass = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
                //if (subItemPass) subItemPass = filterLobbyistType(hfOpts.LobbyistTypes,SM);
                if (subItemPass) subItemPass = selectFilter(hfOpts.LobbyistTypes,SM.Type);
                if (subItemPass) subItemPass = selectFilter(hfOpts.SMStatuses,SM.Status);
                if (subItemPass) subItemPass = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
                if (subItemPass) subItemPass = columnFilter(hfOpts.ClientSearch,client);
                if (subItemPass) subItemPass = filterBeneficary(hfOpts.BeneficiarySearch,SM);
                if (subItemPass) subItemPass = filterGovAgency(hfOpts.GovAgencySearch,SM);
                if (subItemPass) subItemPass = filterFunding(hfOpts.FinancialContributorSearch,SM);     
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");                                
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office");                
                if (subItemPass && hfOpts.CommitteeChk && !SM.Meetings) subItemPass = false;
                if (subItemPass && hfOpts.GrassRootsChk && !SM.Grassroots) subItemPass = false;
                if (subItemPass) subItemPass = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);               
                if (subItemPass) {
                    hasSubItems = true;
                    subItemTotal++;
                    
                    
                    return false;
                }
            });
        }

        if (pagingType ==='A') {
            if (item.POHName.charAt(0).toUpperCase().match(/[a-z]/i) && item.POHName.charAt(0).toUpperCase() !== currentAlpha) showParent = false;
            if (!item.POHName.charAt(0).toUpperCase().match(/[a-z]/i) && "#" !== currentAlpha) showParent = false;
        }

        if (showParent && hasSubItems) {
            totalJSONRows = totalJSONRows + subItemTotal;
            if (pagingType === 'A' || (pagingType === 'N' && totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx)) {
                SMData.push(item);
            }
        }
     });

     return SMData;
}


function generatePOHNameListing(SMData) {
    var strRows = "";
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();
    $.each(SMData, function(idx, item) {
        rowCnt++;
        for (var i = 0, len = item.SMs.length; i < len; i++) {
            var SM = item.SMs[i];
            strRows += listDetailRow(item, SM,  rowCnt, hfOpts);
        }
    });
   updatePageTable(strRows);

}

function getPageBusOrgClientData(pagingType) {
    totalJSONRows = 0;
    var showParent = true;
    var SMData = [];
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();

    //TODO: the array is in config.. can i reference it?
    
    $.each(BusOrgClientArray, function(i, item) {
        showParent = true;
        //rowId = "loobyregistryrow" + rowCnt;
        if (showParent) showParent = filterSearch(item, hfOpts);
        if (showParent) showParent = columnFilter(hfOpts.BusOrgNameSearch,item.BusOrgName);       
        //add ben search.. if (showParent) showParent = columnFilter(strLobbyistNameSearch,item.LastName);
        var hasSubItems = false;
        if (showParent) { /*SML: we need predetermine if we need to show item */

            $.each(item.SMs, function(i, SM) {
            
                var lobbyistNames = mergeLobbyistNames(SM);
                var client = getSMClient(SM);
                var subItemPass = true;
                if (subItemPass) subItemPass = filterSearch(SM, hfOpts);
                if (subItemPass) subItemPass = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
                if (subItemPass) subItemPass = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
                //if (subItemPass) subItemPass = filterLobbyistType(hfOpts.LobbyistTypes,SM);
                if (subItemPass) subItemPass = selectFilter(hfOpts.LobbyistTypes,SM.Type);
                if (subItemPass) subItemPass = selectFilter(hfOpts.SMStatuses,SM.Status);
                if (subItemPass) subItemPass = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
                if (subItemPass) subItemPass = columnFilter(hfOpts.ClientSearch,client);
                if (subItemPass) subItemPass = filterBeneficary(hfOpts.BeneficiarySearch,SM);
                if (subItemPass) subItemPass = filterGovAgency(hfOpts.GovAgencySearch,SM);
                if (subItemPass) subItemPass = filterFunding(hfOpts.FinancialContributorSearch,SM);      
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");  
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");    
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office");                
                if (subItemPass && hfOpts.CommitteeChk && !SM.Meetings) subItemPass = false;
                if (subItemPass && hfOpts.GrassRootsChk && !SM.Grassroots) subItemPass = false;
                if (subItemPass) subItemPass = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);               
                if (subItemPass) {
                    hasSubItems = true;
                    return false;
                }
            });
        }

        if (pagingType ==='A') {
            if (item.BusOrgClientName.charAt(0).toUpperCase().match(/[a-z]/i) && item.BusOrgClientName.charAt(0).toUpperCase() !== currentAlpha) showParent = false;
            if (!item.BusOrgClientName.charAt(0).toUpperCase().match(/[a-z]/i) && "#" !== currentAlpha) showParent = false;
        }

        if (showParent && hasSubItems) {
            totalJSONRows++;
            if (pagingType === 'A' || (pagingType === 'N' && totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx)) {
                SMData.push(item);
            }
        }
     });

     return SMData;
}


function generateBusOrgClientListing(SMData) {
    var strRows = "";
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();
    $.each(SMData, function(i, item) {
        rowCnt++;
        for (i = 0, len = item.SMs.length; i < len; i++) {
            var SM = item.SMs[i];
            strRows += listDetailRow(item, SM,  rowCnt, hfOpts);
        }
    });
    updatePageTable(strRows);

}

function getPagePrivateFundingSMData(pagingType) {

    totalJSONRows = 0;
    var showItem = true;

    var SMData = [];
    var hfOpts = getHighLightFilterOptions();

    $.each(PrivateFundingArray, function(i, item) {
        showParent = true;
        //rowId = "loobyregistryrow" + rowCnt;
        if (showParent) showParent = filterSearch(item, hfOpts);
        
        //--> This is what we show, so if search hits other 2 fields, not shown here.. but that is ok
        //if (showItem) showItem = filterFunding(hfOpts.FinancialContributorSearch,SM);
        if (showParent) showParent = columnFilter(hfOpts.FinancialContributorSearch,item.FundingName);
        
        //add ben search.. if (showParent) showParent = columnFilter(strLobbyistNameSearch,item.LastName);
        var hasSubItems = false;
        if (showParent) { /*SML: we need predetermine if we need to show item */

            $.each(item.SMs, function(i, SM) {

                var lobbyistNames = mergeLobbyistNames(SM);
                var client = getSMClient(SM);
                var subItemPass = true;
                if (subItemPass) subItemPass = filterSearch(SM, hfOpts);
                if (subItemPass) subItemPass = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
                if (subItemPass) subItemPass = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
                //if (subItemPass) subItemPass = filterLobbyistType(hfOpts.LobbyistTypes, SM);
                if (subItemPass) subItemPass = selectFilter(hfOpts.LobbyistTypes,SM.Type);
                if (subItemPass) subItemPass = selectFilter(hfOpts.SMStatuses,SM.Status);
                if (subItemPass) subItemPass = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
                if (subItemPass) subItemPass = columnFilter(hfOpts.ClientSearch,client);
                if (subItemPass) subItemPass = filterBeneficary(hfOpts.BeneficiarySearch,SM);
                if (subItemPass) subItemPass = filterGovAgency(hfOpts.GovAgencySearch,SM);
                if (showItem) showItem = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");              
                if (showItem) showItem = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");  
                if (subItemPass) subItemPass = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office"); 
                if (subItemPass && hfOpts.CommitteeChk && !SM.Meetings) subItemPass = false;
                if (subItemPass && hfOpts.GrassRootsChk && !SM.Grassroots) subItemPass = false;
                if (subItemPass) subItemPass = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);
                


                if (subItemPass) {
                    hasSubItems = true;
                    return false;
                }
            });
        }
        if (pagingType ==='A') {
            if (item.FundingName.charAt(0).match(/[a-z]/i) && item.FundingName.charAt(0) !== currentAlpha) showParent = false;
            if (!item.FundingName.charAt(0).match(/[a-z]/i) && "#" !== currentAlpha) showParent = false;
        }

        if (showParent && hasSubItems) {
            totalJSONRows++;
            if (pagingType === 'A' || (pagingType === 'N' && totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx)) {
                SMData.push(item);
            }
        }
     });
     
    return SMData;

}

function generatePrivateFundingListing(SMData) {
    var hfOpts = getHighLightFilterOptions();
   var showItem = true;
    var strRows = "";
    var rowCnt = 0;
    var rowId = 0;
    var filteredData = filtersApplied();
    $.each(SMData, function(i, item) {
        showItem = true;
        //if (!filteredData) {
        //    if (item.FundingName.charAt(0).match(/[a-z]/i) && item.FundingName.charAt(0) !== currentAlpha) showItem = false;
        //    if (!item.FundingName.charAt(0).match(/[a-z]/i) && "#" !== currentAlpha) showItem = false;
        //}
        //if (!showItem) {
        //    return true;
        //}
        rowCnt++;

        for (i = 0, len = item.SMs.length; i < len; i++) {
            strRows += listDetailRow(item, item.SMs[i],  rowCnt, hfOpts);
        }
        
    });
    updatePageTable(strRows);

}

function getPageSMData() {

    totalJSONRows = 0;
    var showItem = true;

    var SMData = [];
    var hfOpts = getHighLightFilterOptions();
 
    //Loop through records and select which ones to show
    $.each(jsonData, function(i, item) {

        var SM = item.SM;
        
        var lobbyistNames = mergeLobbyistNames(SM);
        var client = getSMClient(SM);

        showItem = true;

        if (showItem) showItem = filterSearch(SM, hfOpts);

        if (showItem) showItem = columnFilter(hfOpts.RegNoSearch,SM.SMNumber);
        if (showItem) showItem = columnFilter(hfOpts.LobbyistNameSearch,lobbyistNames);
        //if (showItem) showItem = filterLobbyistType(hfOpts.LobbyistTypes, SM);
        if (showItem) showItem = selectFilter(hfOpts.LobbyistTypes,SM.Type);
        if (showItem) showItem = selectFilter(hfOpts.SMStatuses,SM.Status);
        if (showItem) showItem = columnFilter(hfOpts.SMSearch,SM.SubjectMatter);
        if (showItem) showItem = columnFilter(hfOpts.ClientSearch,client);
        if (showItem) showItem = filterBeneficary(hfOpts.BeneficiarySearch,SM);
        if (showItem) showItem = filterGovAgency(hfOpts.GovAgencySearch,SM);
        if (showItem) showItem = filterFunding(hfOpts.FinancialContributorSearch,SM);
        if (showItem) showItem = filterCommunication(hfOpts.POHNameSearch,SM, "POH_Name");
        if (showItem) showItem = filterCommunication(hfOpts.POHPositionSearch,SM, "POH_Position");  
        if (showItem) showItem = filterCommunication(hfOpts.POHOfficeSearch,SM, "POH_Office");         
        
        if (showItem) showItem = dateRangeFilter(hfOpts.DateFrom, hfOpts.DateTo, SM.InitialApprovalDate);
        
        
        if (showItem && hfOpts.CommitteeChk && !SM.Meetings) showItem = false;
        if (showItem && hfOpts.GrassRootsChk && !SM.Grassroots) showItem = false;

         //FOr this demo we need to know total rows.. so keep looping after we don't need data.
        if (showItem){
            totalJSONRows++;
            if (totalJSONRows >= hfOpts.startIdx && totalJSONRows < hfOpts.endIdx) {
                SMData.push(SM);
            }
        }
     });

     return SMData;

}


function generateSMListing(SMData) {
    var strRows = "";
    var rowCnt = 0;
    var hfOpts = getHighLightFilterOptions();
    $.each(SMData, function(item, SM) {
        rowCnt++;
        strRows += listDetailRow(item, SM,  rowCnt, hfOpts);

    });
    updatePageTable(strRows);
}


(function($) {
    $.QueryString = (function(a) {
        if (a === "") return {};
        var b = {};
        for (var i = 0; i < a.length; ++i)
        {
            var p=a[i].split('=');
            if (p.length != 2) continue;
            b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
        return b;
    })(window.location.search.substr(1).split('&'));
})(jQuery);


function setUpSearchFilters() {
    $("#statusFilter").multiselect({
            onChange: function(option, checked, select) {
            },
            onSelectAll: function(option, checked, select) {
            }
   });
   
 //   $("#subjectMatterFilter").on('blur',function(e) {
 //      });

 //   $('#subjectMatterFilter').bind('typeahead:selected', function(obj, datum, name) {
 //            //showListing();
 //   });  
    
/* The type on the SM record is not relevant
   $("#typeFilter").multiselect({
        includeSelectAllOption: true,
        //allSelectedText: 'All',
 //       onChange: function(option, checked, select) {
 //           //showListing();
 //       },
 //        onSelectAll: function(option, checked, select) {
 //            if (!initialLoad) {
 //               //showListing();
 //            }
 //       }
    });     
 */
 
   $("#pohTypeFilter").multiselect({
        includeSelectAllOption: true,
        numberDisplayed: 1,        
    }); 

    $("#lobbyistTypeFilter").multiselect({
        includeSelectAllOption: true,
        //allSelectedText: 'All',
//    onChange: function(option, checked, select) {
//        //showListing();
//    },
//    onSelectAll: function(option, checked, select) {
//        if (!initialLoad) {
//            //showListing();
//        }
//    }
   });
    
    //  loadSMTypes();
}

function setUpEvents() {

    $("#searchBtn").click(function() {
    if ($("#searchString").val().length === 0) {
        $("#advSearchBtnGroup").show();
    } else {
        $("#advSearchBtnGroup").hide();
    }
    showListing();
        
    });

   $("#pageSize").multiselect({
        buttonWidth: '55px',
        buttonClass: 'pull-right',
        onChange: function(option, checked, select) {
            rowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            nextRow = 1;
            showListing();
        },
        });
    $("#pageSize").next().css( {"margin-top" : "-8px"});
    $("#pageSize").next().find("button").css( "height", "25px" );
    //$("#pageSize").next().addClass( "allPagination" );

    
   // $("#reportFilter").change(function(e) {
   //     initListing();
   //    showListing();
   //    });
    $("#searchString").keypress(function(e) {
        

        var KeyCode = e.which || e.keyCode || 0;
        if (KeyCode === 13 || KeyCode === 9) {
            showListing();
        }

        
    });

    /* we no longer want the enter/tab/blue to do a listing. they must hit search.
    $(".columnSearch").on('blur',function(e) {
          showListing();
    });
    $(".columnSearch").keypress(function(e) {
       var KeyCode = e.which || e.keyCode || 0;
       if (KeyCode === 13 || KeyCode === 9) {
          showListing();
       }
       });
    */
    
    $('.input-daterange').datepicker({
            todayBtn: true,
            forceParse: false,
            autoclose: true,
            format: 'yyyy-mm-dd',  /* what is the city standard*/
            date: new Date(),
            todayHighlight: true
    });
    $(".hasclear").keyup(function () {
        var t = $(this);
        t.next('span').toggle(Boolean(t.val()));
    });
    $(".hastaclear").keyup(function () {
        var t = $(this);
        t.parent().next('span').toggle(Boolean(t.val()));
    });
    $(".clearer").hide($(this).prev('input').val());
    $(".clearerta").hide($(this).prev('input').val());

    $(".clearer").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
        //showListing();
    });
    
    $("#searchStringClear").click(function () {
        $(this).prev('input').val('').focus();
        $(this).hide();
        $("#advSearchBtnGroup").show();
        showListing();
    });
    
    
    //Of course this assumes only one type ahead..
    $(".clearerta").click(function () {
        $('.typeahead').typeahead('val', '');
        $(this).hide();
       // showListing();
    });

    $('#numberPageSelection').bootpag({
        total: rowsPerPage,
        page: 1,
        maxVisible: 5,
        leaps: true,
        firstLastUse: true,
        first: '←',
        last: '→',
        wrapClass: 'pagination',
        activeClass: 'active',
        disabledClass: 'disabled',
        nextClass: 'next',
        prevClass: 'prev',
        lastClass: 'last',
        firstClass: 'first'
    }).on("page", function(event, num){
        //console.log(num);
        nextRow = ((num  -1 ) * rowsPerPage) + 1;
        //console.log(nextRow);
        showListing();
        $("#PageNo").html(num);
    });

    $(".alphaIdx").click(function (e) {
        currentAlpha = e.target.innerHTML;
        showListing();
        return false;
    });

    $(".lrCats").on("click",function() {
        selectedReport = this.id;
        nextRow = 1;
        $('#numberPageSelection').bootpag({page: 1});
        $("#PageNo").html("1");
        initListing();
        showListing();
    });
    
    $("#advSearchApplyBtn").on("click",function() {
        $('#modalSearch').modal('hide');
        if (filtersApplied()) {
            $("#searchString").val("");
            //$("#searchString").prop( "disabled", true );
            $("#searchString").hide();
            $("#searchBtn").hide();
            $("#advSearchString").show();
            
        }
        initListing();
        showListing();
    });
    
    
    $("#resetAdvSearchBtn").on("click",function() {
        resetFilters();

    });
    
    $("#resetBtn").on("click",function() {
        resetFilters();
        showListing();
    });

    
    $('#lrServiceBar').tooltip();   
}

function jsonEventsCallBack(data) {
    jsonData = data.sort(dynamicSort("SM","-SMNumber"));
    /*
    for(var i = jsonData.length - 1; i >= 0; i--) {
    if(i > 500) {
       jsonData.splice(i, 1);
    }
    }
    */
    loadSubjectMatters();
    setUpSearchFilters();
    setUpEvents();
    initListing();
    showListing();
    initialLoad = false;
}

/* this is really a bad name and should be initApp as you are doing more than getting the jason data*/
function initApp() {

    //SML: note sure of why IEversion is needed.. doesn't jQuery do this...and the call is the same anyway.
    if (document.location.host!="www1.toronto.ca") {
        $.support.cors = true;
        var browser = navigator.userAgent;
        var IEversion = 99; //Give a default value for non-IE browsers
        var strURL = "/City Of Toronto/Sandbox/Steve/LobbyRegistry2/disclosure_active.json" ; //SM10376_closed.json"; //disclosure_active.json";
        if (document.location.hostname.length === 0) {
            strURL = "disclosure_active.json";
        }
        if (browser.indexOf("MSIE") > 1) { IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}
        if (IEversion < 13) {
                $.ajax({
                        type: 'GET',
                        url: strURL,
                        crossDomain: true,
                        dataType: 'json',
                        success: function (data) {
                                jsonEventsCallBack(data);
                        },
                         error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                        }
                });
        } else {
                $.ajax({
                        type: 'GET',
                        url: strURL,
                        crossDomain: true,
                        dataType: 'json',
                        success: function (data) {
                                jsonEventsCallBack (data);
                        },
                         error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                        }
                });
        }
    } else {
           $.getJSON( "disclosure_active.json", function( data ) {jsonEventsCallBack(data);});
    }


}

function initListing() {
    $('#numPagination').hide();
    $('#alphaPagination').hide();
    currentAlpha = 'A';
    nextRow = 1;
     switch (selectedReport) {
     case 'LobbyRpt':
        loadLobbyists();
        break;
     case 'BenRpt':
         loadBeneficiaries();
        break;
    case 'SMRpt':
         break;     
    case 'POHOffRpt':
         break;     
    case 'POHNameRpt':
        loadPOHNames();
         break;  
    case 'BusOrgClientRpt':
        loadBusOrgClients();
         break;          
    case 'GovRpt':
        loadGovFunding();
        break;              
    case 'FinRpt':
        loadPrivateFunding();
        break;              
    }
    
    if (rptColumns[selectedReport].Idx === 'A') {
        $('#alphaPagination').show();
        $("#PageStatus").hide();
    } else {
        $('#numPagination').show();
        $("#PageStatus").show();
    }

}
function turnOnAlphaNumericPaging() {
    $("#numPagination").hide();
    $("#PageStatus").hide();
    $("#alphaPagination").show();
}
function turnOnNumericPaging() {
    $("#numPagination").show();
    $("#PageStatus").show();
    $("#alphaPagination").hide();
    var numPages = 0;
    if (totalJSONRows > 0) {
        numPages = Math.ceil(totalJSONRows / rowsPerPage);
        $('#numberPageSelection').bootpag({
            total: numPages,
        });
        $("#PageStatus").show();
    } else {
        $('#numberPageSelection').bootpag({
            total: 1,
        });
        $("#PageStatus").hide();
    }
    $("#NoPages").html(numPages)     ;
    $("#TotalRows").html(totalJSONRows)  ;
    $("#PageNo").html("1");
}
function showListing() {
    $("#loader").show();
    var pagingType = rptColumns[selectedReport].Idx;
    if (filtersApplied() && rptColumns[selectedReport].Idx === 'A') {
        pagingType = 'N';
    } 
    
    var SMData = [];
    showHideColumns(); //move this code into this routine
    writeListingHeaders();
    switch (selectedReport) {
    case 'LobbyRpt':
        SMData = getPageLobbyData(pagingType);
        //console.log(SMData.length + ":" + totalJSONRows );
        generateLobbyistListing(SMData);
        break;
    case 'BenRpt':
        SMData = getPageBenData(pagingType);
        //console.log(SMData.length + ":" + totalJSONRows );
        generateBenListing(SMData);
        break;
   case 'SMRpt':
         //here we get a page of data
        SMData = getPageSMData(pagingType);
       // console.log(SMData.length + ":" + totalJSONRows );
        
        if (totalJSONRows > 0) {
            var numPages = Math.ceil(totalJSONRows / rowsPerPage);
            $('#numberPageSelection').bootpag({
                total: numPages,
            });

            generateSMListing(SMData);
        } else {
            generateNoDataListing();
        }
        break;
   case 'POHCommRpt':
         //here we get a page of data
       // SMData = getPageSMData(pagingType);
       // console.log(SMData.length + ":" + totalJSONRows );
        //var numPages = Math.ceil(totalJSONRows / rowsPerPage);
        // $('#numberPageSelection').bootpag({
        //    total: numPages,
        // });

        generatePOHListing();
        break; 
   case 'POHNameRpt':
        SMData = getPagePOHNameData(pagingType);         
        generatePOHNameListing(SMData);
        break; 
  case 'BusOrgClientRpt':
        SMData = getPageBusOrgClientData(pagingType);  
        generateBusOrgClientListing(SMData);
        break;      
  case 'GovRpt':
         //here we get a page of data
        SMData = getPageGovFundingSMData(pagingType);
        //console.log(SMData.length + ":" + totalJSONRows );
        generateGovFundingListing(SMData);
        break;  
   case 'FinRpt':
         //here we get a page of data
        SMData = getPagePrivateFundingSMData(pagingType);//SMData = getPagePrivateFundingSMData();
        //console.log(SMData.length + ":" + totalJSONRows );
        generatePrivateFundingListing(SMData);
        
        break;  
    default:
        alert('not implemented yet');
    }

    if (pagingType === 'N') {
        turnOnNumericPaging();
    } else {
        turnOnAlphaNumericPaging();
    }   
    
    
}

function getLobbyistData(LastName, FirstName) {
    var strRows = "";
    var hfOpts = getHighLightFilterOptions();

    $.each(jsonData, function(i, item) {
        if (item.SM.Communications) {
            $.each(item.SM.Communications.Communication, function(j, comm) {
                if (comm.LobbyistFirstName === FirstName &&  comm.LobbyistLastName === LastName) {
                    strRows += generateSMReportRow(i, item,  hfOpts);
                    return false; //breaks loop
                }
            });
        }
    });
    return strRows;
}

function columnWidths() {
    var rptCols = rptColumns[selectedReport].Cols;
    var widths = [];
//    widths.push(50);
    
    for (var i = 0; i < rptCols.length; i++) {
        widths.push(rptColumnHdrs[rptCols[i].column].size);
    }
    return widths;
}
function addHeaders() {
    
    var addhdrs = [];
//  tbl.table.body[0].push({text: rptColumnHdrs.SMLLobbyistNames.header, style: 'sctableheader'});

    var rptCols = rptColumns[selectedReport].Cols;
    for (var i = 0; i < rptCols.length; i++) {
         addhdrs.push({text: rptColumnHdrs[rptCols[i].column].header, style: 'sctableheader'}); 
    }

    return addhdrs;
}


/***
Problem.. just can't use JSON Data.. need current reports datasource.  In real world we will requery to get all data and ignore paging

*/
function generatePDF() {

    //$( "#pdfWait" ).removeClass("hide");
    var dt = new Date();
    var dd = {};
    dd.pageSize = 'LEGAL';
    dd.footer = function(currentPage, pageCount) { return {columns: [{text: 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=cf1fb7537e35f310VgnVCM10000071d60f89RCRD', style: 'footertext', margin: 15}, {text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', style: 'footertext', margin: 15 }] }; };
    dd.header = {columns: [ {image: 'logo', width: 80, margin: [0,20,0,10]}, {text: 'Office of the Lobbyist Registrar', margin: [0,20,20,10], style: 'headertext'} ] };
    dd.pageMargins = [20, 70, 20, 60];
    dd.styles = {};
    dd.styles.reporttitle = {fontSize: 28,bold: true, alignment: 'center', color: "#000000", margin: [0,70,0,20]};
    dd.styles.measuretitle = {fontSize: 16,bold: true, alignment: 'left', color: "#000000", margin: [0,0,0,10], pageBreak: 'before'};
    dd.styles.scorecardcattitle = {fontSize: 12, bold: true, alignment: 'left'};
    dd.styles.scorecard = {margin: [0,0,0,15]};
    dd.styles.trendtitle = {fontSize: 14,bold: true, alignment: 'left', color: "#555", margin: [0,0,0,5]};
    dd.styles.reportdate = {fontSize: 16, bold: true, alignment: 'center' };
    dd.styles.cmo = {fontSize: 20, bold: true, alignment: 'center' };
    dd.styles.headertext = {fontSize: 12, color: "#aaa", alignment: "right", width: '50%'};
    dd.styles.sctableheader = {fontSize: 8, color: "#000", alignment: "center", fillColor: '#eeeeee'};
    dd.styles.footertext = {color: "#aaa", fontSize: 8};
    dd.styles.trendanalysis = {fontSize: 10};
    dd.styles.tableheader = {fontSize: 10, bold: true, fillColor: '#eeeeee'};
    dd.styles.cityper = {fontSize: 10, alignment: 'left', margin: [0,5,0,0]};
    dd.styles.datasource = {fontSize: 10, alignment: 'left', margin: [0,10,0,10]};
    dd.styles.narrative = {fontSize: 10, alignment: 'left', margin: [0,10,0,0]};
    dd.styles.positive = {fillColor: '#dff0d8', fontSize: 8};
    dd.styles.negative = {fillColor: '#f2dede', fontSize: 8};
    dd.styles.stable = {fillColor: '#fcf8e3', fontSize: 8};
    dd.styles.graphtitle = {fontSize: 14,bold: true, alignment: 'left', color: "#555", margin: [0,20,0,0]};
    dd.styles.Monthly = {fontSize: 8};
    dd.styles.Quarterly = {fontSize: 8};
    dd.styles.Seasonal = {fontSize: 8};
    dd.styles.Yearly = {fontSize: 8};
    dd.styles.termsheader = {fontSize: 12, bold: true, margin: [50, 500, 50,0]};
    dd.styles.termstext = {fontSize: 8, margin: [50, 5, 0,0]};
    dd.styles['N/A'] = {fillColor: '#eee'};

    dd.styles.tblcol = {margin: [0,0,0,0],fontSize: 8};
    
    dd.images = {};
    dd.images.logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAL8AAAAwCAIAAADPbjxcAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAApbSURBVHhe7ZwJVFNXGscDYQtLAIlhF2SRRVREwAVEEFyqFMdKxb2gVtx66rEdZ449cqy1FcdlHGc8dlDHrTOWI3WpWKqjuBQUEQSVsVh2MARCZE8gIYT5yLsJLy8QIYGUwPuZ8/y+ex8v7738c+/3vXtvdLq6uigkJCqhi/4nIRk4pHpIVIdUD4nqkOohUZ1RoR52A+/y42IyPxh0Rn7O9bS4dnbCFYFIvCrY/btP5uno6KAKErUZ+W1PA08A0gHjPxlFX1zKwgpJBoXREvfo6erA69CPeQWVb1ERidqMFvVYmBjuXR4oEnd9eu4XVESiNqMo59oZ6WtubJBewErNLUdFJOoxitRDM9BbMcsdjJSsYqyERE20KecSi7tuv6h0Yph5OYxBRf0g+VHRimO3GWZGdWc2ZBfXTt+dYm1OYyfF4ZOvv6e9uP28EjlKWejrtG3hJOSMerRGPRDtrv3Hnfxyrq4OBRLvlcETUIVSuM1tQXt++I3dhKlH1Ck2WHkSLrj4+BpXG3O0E4Wy4WT6v+79ihylfBzunRQfhpxRj3b0XE+KagJ3XwbpgC3uonCa27By5dQ28ufv/xGkg3zIvKi6VmZGYHBb+nUEEuVogXrYDbylh9LahJ1xoZ6h3nao9F1ceVLi89mlPElbhcdInwrb9o5OzCVRBy1Qz4GruexG/lwf+1Obw8xoBqhUKTF/vbXsyM/clnZXa/rxuBBU2jdR/s57lvljr0VTnVCpFHxt5DRnVEqiFeq5nFUC211RflRddLbXskvTC94oidhu5JbBFmKUnMTl7rY98U1fLAlw2RczHXtFTiOqZ2lgT22U/3hUSjL8o2ZBR6fR6m/BYCfF2liYRB28eUP6tMZ5rNm6OR6xoV7jmXSsRIbRqpMCkfjV0ZWQnUEyteDrG1jUDFWOm8+9qefd3/uHOd722M4ETt5+ufX0Q+RIOLt1LrwLciiUjMLqewWsrKJaThMf7p2FsWGAGzPY0/Y9XyddaTfZLhTdLXiD2XgM9agedhaODDPky9MpFv/0rCLzNftpCaeRJ9DV0bG2MJ7hbh0+yXHmBBu0E4VSXc/LK69DDg44B3Njw9Z24YNX1aiIQpnixOAJOl5XNyJfAXcbc1kOm1PCufOyKuu3WlZ9q7iri04zmObCDPK0jfRz0tfr7vEJ6KH/hysdnShAkTU8gLeDZUVdS3ldy76UnK9SckK87aB58HdhBroxe73IweLN29btZx5ez+lu2PBgQpnuZp0UHzrZiQF2A08QmXhTUtkL4ximq4InJEQH0Ax67v+z0rpNSfdyS4myuPmsYk9ydvQM17/FzrYbYwIlIN+YY7exWjypf1682M+ZVc/Dv/X5beGltc1fpjxFvgK7oqYeXDMLktOdFzIvPnyNSqXcf1V9JDXfx3EMZJp4BWNoQc+lyKaIieykuFPxYRGTHKi6OvBV23EuIzjhCsQ6aI8hQCzu+uBwmqJ0ZDwproVGrqVNiPy+qeS2Jl575rcruYrbgpU0tLbP339dUToyUrJKYo7dUt5RKGlg3slHJ+4qSkdGQVU9ZK81jTzkS9FK9QAQPm8M9/7vniU1p9Z/90nEYr/uYAW+ZFjtUPD9oyLoUJAjhZDQ1TTy/3I9DznvorC6cZ+0Sfjmau7bVgFmY8C3AllSMgrZV7NLkdMbhawGZA2QOy+qfsqrQI4Uwgm0tnckJGcjR4q2qkeGlZnR6tkem+f5IH/IeFJUiywpyTvm5x9agRwpWUU1yJJnzewJF7dH0Gn6yJdw9n4hRBhgQBSFlcj439GV0OkgR4ribnj6anumjmfE9vawY463HZT7uzKh1URFUo7HzS4/sY4gIMVL03r1aIw2oQhZUsJ8HCaNs4J4HPkS+ALibhhe9pZrQjw2zPVGvoROcVcZp7u9JBzcztLYw85yro8D8qXwBR3I6o2+2h7IKM9uDd+6gDjAEh8xEco/nOnWy6VNtHewMoUAH/kS2oTEh2SkelQHciLZtp/gw2SMXtU2oCNbmhhiBqe5DeInzFYTLHl85wmQ6tF6nMb25P/qBM4qQKrnd0YxOh4o+P6FVM9IhpByg3KmSJ4PqYOnnSWyuvM4FdMu1SDVo1G4LXJxCUSsDDoNOariad+jnteketRnGA6+pBewPruQgZ9FFOXvfHrzIEwVcrWmy7o/sucamdwteHM09Tmk6PA5+zozkjaFXvn8PVOjfk0ZUI6hPlU20lfEbhJ1di8/0gykejQNtIv55dxNSffHbTmfV9bn0MSA8JQGzh2d4vI6NPqhAUj1aIgpTlYLfcchR0J1A3/pobRBmeOAD31UHq9QAVI9GiLY0zZt9/uRkvE4GRXcFuhrkKMG8oGz5kIfUj0aZYF88wNUvR2Ejgb/yIdse0YserhZShgQRyNLDfCPfEolA2eagVTPSIBBp1mZotEuVj1xFs7QQapnhIAPfTQGqZ4Rggeu89IYpHpUB0u2u4bgyTZ2xAEd2dNebi6OmqBLe9f7jwT1wKXWNvHBgO220w9iT9wJcGV+HO4NEYDiVFyVUZzrUvW2tYkvaOLLTWSWLavoJ1jUTJhJ09AqaG0XVnK7px3iUTLhBh84DxQd+CcPXJpQ1Em4e4pXpsXq4TTxj6bmv5+Yythw5vMLmR/N8dgXE7h+rtep+LCMr5YlxYdFTHa0sehehDAoMMyIw5kbv02PPvKzUPLDZDIIUw0JKH762Oww4gRFoQiOvOXUfeRLUTKkqk7cw6ATz3nn+Uw4AcJUa2wRN57hrh59KjVmlhu8sBXEIV52YLvZmN/IKfvTvx/nlHDoxgYHV89i/TP23LaILfMnTXMhLsqxtTRZGeS+JACt4mOa0/r8/iplfZiXgZ7c7XpWxr3zkrhoS3ECKB4TQ7l5zQA2Kq74V7eeVz2vkPuZM5oBNS7UEzkKjGfS9akqfpqrgicQJlz/ymqQrZuTsU3hJIe/enQdxpjC68vLT6GBqWnkg32vgPXgVbWVqZGdpYmthUkhqyEhORtqe31dfPga7iz8VeK13B+ySi59uqDh7Ebo2tAb9BtXG/O9HwYipw/WhnjMm+yInN6Y7m6NLCm/FLJhu9jPaflMN6ykL/avmNHXMkJAj6oLXyrkDJCxdNrhtUHKu9yFvuNAZMiRMtzXkoo6xS7bLyJnkDAx1HO3tbA2p4VOtI+e4WYoadVkfJ9ZtPey3NKTA6tmLg10weyMwuo/XnyUXVxLeMjnZW/55fLA6Bmu2M8C1TW3hSRcwaow4NbviQ6Au73oQGo57oGesaHe46+jDfSoUHUps2hfylPCUANVV2e6m/XhdUGyxXhpeRU7z2dgNnBt1yIs4YKYL11hAWvi6plLArpP/lZ+5Q75X907si5okV/Psvy8sjo4bEYhWyR/bS5M+hcfTIsN9VIM6Ya7eoYOiAoruS3lnBbozqeOH4tK+weEtDkldRB4wX22NDH0d2UqxgQqw21uyynlNPKE8GFZWxj7uzBNjIj93dDRJhTllnKq63lwadCdQSQA54DqFBi96iFRHy3OuUh+ZyiU/wPMJO0MrJVkbgAAAABJRU5ErkJggg==';

    dd.content = [];
    dd.content.push({text: 'Toronto\'s Lobby Registry',style: 'reporttitle'});
    dd.content.push({text: 'Office of the Lobbyist Registrar',style: 'cmo'});
    //dd.content.push({text: arrMM[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear(),style: 'reportdate'});
    dd.content.push({text: 'Terms of Use Disclaimer', style: 'termsheader'});
    dd.content.push({text: 'This portion of the City of Toronto web site is being used for the purpose of disclosure of information contained in the City\'s Lobbyist Registry System (the "System") under Chapter 140, Lobbying, of the City of Toronto Municipal Code. This site is being made available to allow members of the public to readily obtain information regarding the activities of lobbyists involved in lobbying the City of Toronto.', style: 'termstext'});
    dd.content.push({text: 'Users of this portion of the City of Toronto web site should be aware of the following:', style: 'termstext'});
    dd.content.push({text: "(i) Despite the Lobbyist Registrar's authority to verify and clarify the information submitted to the System, it is the lobbyists' exclusive responsibility to ensure that all submitted information is accurate and correct and the information submitted by lobbyists to the System may be posted as received; and", style: 'termstext'});
    dd.content.push({text: 'ii) The City of Toronto provides the System on an "as is", "as available", basis. The City does not make any express or implied warranties, representations or endorsements with respect to the system, including but not limited to, warranties as to usefulness, completeness, accuracy and reliability and the City will not accept any responsibility for data improperly entered. In addition, the City does not represent and warrant that the system will be available or meet your requirements, that access will be uninterrupted, that there will be no delays, failures or errors or omissions or loss of transmitted information, that no viruses or other contaminating or destructive properties will be transmitted or that no damage will occur to your computer system. As a user of the System, you accept sole responsibility for adequate protection and backup of your data, hardware and software and to take reasonable and appropriate precautions against viruses and other contaminating or destructive properties.', style: 'termstext'});

    //var x = columnWidths();
    var tbl = {};
        tbl.style = 'scorecard';
        tbl.table = {};
        //table widths must match columns or js error
        tbl.table.widths = columnWidths(); //['*', '*', 100, '*', '*', 100, '*','*'];
        tbl.table.headerRows = 1;
        tbl.table.body = [];
        tbl.table.body[0] = [];

        $.merge(tbl.table.body[0],addHeaders());

        dd.content.push({text: 'Lobbyist Report',style: 'measuretitle', pageBreak: 'before'});

    var dataSource = this[rptColumns[selectedReport].DataSource];
    var rowcnt = 1;
    $.each(dataSource, function(x, item) {

        var sms = [];
        if (item.SMs) {
            sms = item.SMs;
        } else {
            sms.push(item.SM);
        }
        $.each(sms, function(y, SM) {
        
        
        
        var lobbyistNames = mergeLobbyistNames(SM).replace(/<\/?b>/g,"");
        var client = getSMClient(SM);
        //if (rptColumns[selectedReport].SMLBusOrg) {    
        var busOrg = getSMBusOrg(SM);
        var bens = getSMBeneficiaries(SM);
        var privateFunding = getSMFunding(SM);

        //}
        
        tbl.table.body[rowcnt] = [];

      
        /** Can I make this an dynamic?? rows should be in alph order.. because of headers.. maybe just hard code all*/
        
        for (var i = 0; i < rptColumns[selectedReport].Cols.length; i++) {
            if (rptColumns[selectedReport].Cols[i].column === 'SMLLobbyist') {          
                tbl.table.body[rowcnt].push({text: item.LobbyistName, style: 'tblcol'});
            }
            
            if (rptColumns[selectedReport].Cols[i].column === 'SMLLobbyistNames') {         
                 tbl.table.body[rowcnt].push({text: lobbyistNames, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLPOHName') {         
                 tbl.table.body[rowcnt].push({text: item.POHName, style: 'tblcol'});
            }            
            if (rptColumns[selectedReport].Cols[i].column === 'SMLPOHPosition') {         
                 tbl.table.body[rowcnt].push({text: item.POHPosition, style: 'tblcol'});
            }            
            if (rptColumns[selectedReport].Cols[i].column === 'SMLPOHPosType') {         
                 tbl.table.body[rowcnt].push({text: item.POHPosType, style: 'tblcol'});
            }            
            if (rptColumns[selectedReport].Cols[i].column === 'SMLFunding') {           
                 tbl.table.body[rowcnt].push({text: item.FundingName, style: 'tblcol'});
            }
           if (rptColumns[selectedReport].Cols[i].column === 'SMLPrivateFunding') {           
                 tbl.table.body[rowcnt].push({text: privateFunding, style: 'tblcol'});
            }

            if (rptColumns[selectedReport].Cols[i].column === 'SMLGovAgency') {          
                 tbl.table.body[rowcnt].push({text: item.GovName, style: 'tblcol'});
            }            
            if (rptColumns[selectedReport].Cols[i].column === 'SMLLobbyistType') {          
                 tbl.table.body[rowcnt].push({text: SM.Type, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLBeneficiary') {           
                 tbl.table.body[rowcnt].push({text: bens, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLBusOrg') {            
                 tbl.table.body[rowcnt].push({text: busOrg, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLClient') {            
                 tbl.table.body[rowcnt].push({text: client, style: 'tblcol'});
            }           
            if (rptColumns[selectedReport].Cols[i].column === 'SMLSubjectMatter') {         
                 tbl.table.body[rowcnt].push({text: SM.SubjectMatter, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLStatus') {            
                 tbl.table.body[rowcnt].push({text: SM.Status, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLInitFileDate') {          
                 tbl.table.body[rowcnt].push({text: SM.InitialApprovalDate, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLSubjectMatterNo') {           
                  tbl.table.body[rowcnt].push({text: SM.SMNumber, style: 'tblcol'});
            }
            if (rptColumns[selectedReport].Cols[i].column === 'SMLLobRegNo') {          
                  tbl.table.body[rowcnt].push({text: item.LobbyistNumber, style: 'tblcol'});
            }
        }
        
        rowcnt++;
        });
        
        if (rowcnt > 30) {
            return false;  //for now
        }
    }); 

        dd.content.push( tbl );
        
        
    pdfMake.createPdf(dd).open();
    /*
    var docDefinition = {
  content: [
    {
      table: {
        // headers are automatically repeated if the table spans over multiple pages
        // you can declare how many rows should be treated as headers
        headerRows: 1,
        widths: [ '*', 'auto', 100, '*' ],

        body: [
          [ 'First', 'Second', 'Third', 'The last one' ],
          [ 'Value 1', 'Value 2', 'Value 3', 'Value 4' ],
          [ { text: 'Bold value', bold: true }, 'Val 2', 'Val 3', 'Val 4' ]
        ]
      }
    }
  ]
};
// open the PDF in a new window
pdfMake.createPdf(docDefinition).open();
*/
}


function parseBusinessAddress (addr) {
    var baddr = {};
    
    baddr.Line = addr.AddressLine1;
    baddr.Line += (addr.AddressLine2 ? "<br>" + addr.AddressLine2 : "");
    baddr.CityProv = addr.City + ", " + addr.Province;
    baddr.PostCty = addr.Country + ", " + addr.PostalCode;
    baddr.Phone = addr.Phone;
    baddr.Addr = baddr.Line;
    baddr.Addr += (baddr.CityProv ? "<br>" + baddr.CityProv : "");
    baddr.Addr += (baddr.PostCty ? "<br>" + baddr.PostCty : "");
    
    return baddr;

}

function compareCommType(a,b) {
  if (CommSortOrder[a] < CommSortOrder[b])
    return -1;
  else if (CommSortOrder[a] > CommSortOrder[b])
    return 1;
  else 
    return 0;
}

/*
----------------------------------------------------------------------------------
These routines to fill the details page(s)
If an LRNumber is present, we do not show any SM details.
we use searchString for highlighting text.. used a different method for highlighting.. qwuicker
----------------------------------------------------------------------------------
*/

function fillDetails(data, SMNumber, LRNumber, searchStr) {
    
    
    
    var strRows ="";
    var i = 0;
    var items = [];
    var incSMDetails = ( LRNumber === null ? true : false);
    if (LRNumber) {
        $("#headerText").text("Lobbyist Details");
    } else {
        $("#headerText").text("Subject Matter Details");
    }
    //We should only get one record.. but for demo we wont
    $("#BackTo").prop("href","/wps/portal/contentonly?vgnextoid=" + listGUID);
    var SMData = {};
       $.each(data, function(i, item) {
        if (item.SM.SMNumber === SMNumber) {
             SMData = item.SM;
             return false;
        }
       });
     if ($.isEmptyObject(SMData)){
         alert('detail record unexpectedly mising');
         return;
     }
    //Will do an Ajax call.. will not have existing data
    var jsonData = SMData;// JSON.parse(data);
    $(".SMIn-house").hide();
    $(".SMVoluntary").hide();
    $(".SMConsultant").hide();
    var SM = jsonData; //.SM;
     $(".SM" + SM.Type).show();
    if (incSMDetails) {
        
        //highlightSearch(SM.Status, hfOpts)
       
        items = ['SMNumber','Status','InitialApprovalDate','EffectiveDate','SubjectMatter','Particulars','ProposedStartDate'];
        for (idx = 0; idx < items.length; idx++) {
            $("."+items[idx]).html(SM[items[idx]]);
        }
        if (SM.ProposedEndDate !== "") {
            $(".ProposedEndDate").html(" to " + SM.ProposedEndDate);
        }
    } else {
        $("#smRegAccordion").hide();
    }
    
    if (incSMDetails) {
         $("#smAccordion").show();
    } else {
         $("#smAccordion").hide();
    }
    
    items = ['RegistrationNUmberWithSoNum','Type','Status','EffectiveDate','PositionTitle','PreviousPublicOfficeHolder'];
    for (idx = 0; idx < items.length; idx++) {
        $("#R_"+items[idx]).html(SM.Registrant[items[idx]]);
    }
    $(".R_LobbyistName").html(SM.Registrant.FirstName + " " + SM.Registrant.MiddleInitials + " " + SM.Registrant.LastName + " " + SM.Registrant.Suffix);
    baddr = parseBusinessAddress(SM.Registrant.BusinessAddress);
    $(".R_Address").html(baddr.Addr);
    //$(".R_BusinessAddress").html(SM.Registrant.BusinessAddress.AddressLine1 + " " + SM.Registrant.BusinessAddress.AddressLine2);
    //$(".R_CityProvince").html(SM.Registrant.BusinessAddress.City + ", " + SM.Registrant.BusinessAddress.Province);
    //$(".R_CountryPostal").html(SM.Registrant.BusinessAddress.Country + ", " + SM.Registrant.BusinessAddress.PostalCode);
    $(".R_Phone").html(SM.Registrant.BusinessAddress.Phone);

   var firmFound = true;
   if (SM.Firms) {
        var firms = convertToArrayIfNeccessary(SM.Firms.Firm);
        for ( i = 0; i < firms.length; i++) {
            if (firms[i].Type !== 'Parent' && firms[i].Type !== 'Subsidiary' && firms[i].Type !== 'Other') {
                firmsFound = true; 
                items = ['Name','TradeName','BusinessType','Description','FiscalStart'];
                for (idx = 0; idx < items.length; idx++) {
                    $(".F_"+items[idx]).html(firms[i][items[idx]]);
                }
                if (firms[i].FiscalEnd !== "") {
                    $(".F_FiscalEnd").html(" to " + firms[i].FiscalEnd);
                }
            }               
        }
   }
    if (firmFound) {
        $("#boAccordion").show();
    }else {
        $("#boAccordion").hide();
    }
    
    
    //There will only be clients on Volunteer and Consultant
    var clientFound = false;
    var otherFound = false;
    var bens = [];
    if (SM.Beneficiaries) {
        bens = convertToArrayIfNeccessary(SM.Beneficiaries.BENEFICIARY);
 
        for ( i = 0; i < bens.length; i++) {
            if (bens[i].Type === "Client") {
                baddr = parseBusinessAddress(bens[i].BusinessAddress);
                clientFound = true;
                items = ['Name','TradeName'];
                for (idx = 0; idx < items.length; idx++) {
                    $(".C_"+items[idx]).html(bens[i][items[idx]]);
                }           
                $("#C_Address").html(baddr.Addr);
                //$("#C_BusinessAddress").html(bens[i].BusinessAddress.AddressLine1 + "<br>" + bens[i].BusinessAddress.AddressLine2);
                //$("#C_CityProvince").html(bens[i].BusinessAddress.City + ", " + bens[i].BusinessAddress.Province);
                //$("#C_CountryPostal").html(bens[i].BusinessAddress.Country + ", " + bens[i].BusinessAddress.PostalCode);
           } else {
                otherFound = true;
               
           }
        }
    }
    
    //Clients are entered on SMs for Consultant and Voluntary
    if (clientFound && incSMDetails ){
        $("#clientAccordion").show();
    }else {
        $("#clientAccordion").hide();
    }
    if (otherFound) {
        var strRow = "";
        var cnt = 0;
        for ( i = 0; i < bens.length; i++) {
            if (bens[i].Type !== "Client") {
                cnt++;
                baddr = parseBusinessAddress(bens[i].BusinessAddress);
                strRows += "<tr class='labelRow'><td>" + cnt + ". " + bens[i].Type + "</td>";
                strRows += "<td>Other Trade Names</td>";
                strRows += "<td>Address</td>";
                strRows += "</tr>";
                strRows += "<tr><td>" + bens[i].Name  + "</td>";
                strRows += "<td>" + bens[i].TradeName + "</td>";
                strRows += "<td>" + baddr.Addr + "</td>";
                
                strRows += "</tr>";
                //strRows += "<tr class='labelRow'><td>Address</td>"
                //strRows += "<td>City, Province</td>"
                //strRows += "<td>Country, Postal Code</td>"
                //strRows += "</tr>";
 
                //strRows += "<tr><td colspan='3'>" + baddr.Addr + "</td>"
                //strRows += "<td>" + baddr.CityProv + "</td>"
                //strRows += "<td>" + baddr.PostCty + "</td>"
                //strRows += "</tr>";

                items = ['Name','TradeName'];
                for (idx = 0; idx < items.length; idx++) {
                    $("#C_"+items[idx]).html(bens[i][items[idx]]);
                }           
                $("#C_BusinessAddress").html(bens[i].BusinessAddress.AddressLine1 + "<br>" + bens[i].BusinessAddress.AddressLine2);
                $("#C_CityProvince").html(bens[i].BusinessAddress.City + ", " + bens[i].BusinessAddress.Province);
                $("#C_CountryPostal").html(bens[i].BusinessAddress.Country + ", " + bens[i].BusinessAddress.PostalCode);
           }
        }
        $("#OtherBeneficiariesSection tbody").html(strRows).trigger('update');
        $("#othbAccordion").show();
    }else {
        $("#othbAccordion").hide();
    }
 
    var privateFundingFound = false;
    if (SM.Privatefundings) {
        var pfs = convertToArrayIfNeccessary(SM.Privatefundings.Privatefunding);
        strRows ="";
        for ( i = 0; i < pfs.length; i++) {
            privateFundingFound = true;
            //strRows += "<tr class='labelRow'><td>" + (i +1) + ". Contributor</td></tr>"
            strRows += "<tr><td>" + (i +1) + ". " + pfs[i].Funding + "</td>";
            if (pfs[i].Contact !== "") {
                strRows += "<td><b>Contact:</b> " + pfs[i].Contact + "</td>";
            }
            strRows += "</tr>";
            
        }
       $("#PrivateFundingSection tbody").html(strRows).trigger('update');
    }

    if (privateFundingFound) {
        $("#pfAccordion").show();
    }else {
        $("#pfAccordion").hide();
    }
    

    var governmentFundingFound = false;
    var gfs = [];
    if ( incSMDetails || SM.Type === 'In-house') {
    //TODO: this needs to be fixed... can't have both mixed and upper case. just other logic in code.
        if (SM.Gmtfundings) {
            gfs = convertToArrayIfNeccessary(SM.Gmtfundings.Gmtfunding);
        }
        if (SM.GMTFUNDINGS) {
            gfs = convertToArrayIfNeccessary(SM.GMTFUNDINGS.Gmtfunding);
        }
        
        strRows ="";
        
        for ( i = 0; i < gfs.length; i++) {
             governmentFundingFound = true;
             strRows += "<tr><td>" + (i +1) + ". " + gfs[i].GMTName + ", " + gfs[i].Program + "</td></tr>";
        }
    }
    if (governmentFundingFound ) {
        $("#GovernmentFundingSection tbody").html(strRows).trigger('update');
        $("#gfAccordion").show();
    }else {
        $("#gfAccordion").hide();
    }

    
    
    if (SM.Grassroots) {
        var grs = convertToArrayIfNeccessary(SM.Grassroots.GRASSROOT);
        strRows ="";
        for ( i = 0; i < grs.length; i++) {
            grassRootsFound = true;
            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr><td>" + grs[i].Community + "</td>";
            strRows += "<td>" + grs[i].Target + "</td>";
            strRows += "<td>" + grs[i].StartDate + " to " + grs[i].EndDate + "</td>";
            strRows += "</tr>";
            
        }
       $("#GrassRootsSection tbody").html(strRows).trigger('update');
        $("#grAccordion").show();
    }else {
        $("#grAccordion").hide();
    }
    

    //TODO: is the commitee member data for those in attendance or entered on the registration..is there a difference??
    //We need to split off lobbyregistration from the actual meetings entered in the SM to report in
    // The committe can meet several times.. so need a distin
    
    if (incSMDetails) {
        detailSMMeetings(SM);
    } else {
        detailCommitees(SM);
    }
    
    // need to loop twice.. once to show inhouse lobbyist, once the communications
    // create a hash  and store unique. In-house lobbyists is a lobby and not SM item
    // so we calculate this all the time.
    detailCommunications(SM);
    if (incSMDetails) {
    } else {
        $("#pohAccordion").hide();
    }
    //$("#appDisplay").jmRemoveHighlight();
    highlightOpts = {separateWordSearch : true};
    $("#appDisplay").jmHighlight(searchStr, highlightOpts);
}

function detailSMMeetings(SM) {
    var i = 0; 
    var j = 0;
    if (SM.Meetings) {
       
        var meets = convertToArrayIfNeccessary(SM.Meetings.Meeting);
        var strRows ="";
        for (i = 0; i < meets.length; i++) {
            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr class='labelRow'><td>" + meets[i].Committee + "</td></tr>";
            strRows += "<tr><td>Meeting Date " + meets[i].Date + "</td></tr>";
            strRows += "<tr><td>&nbsp;</td></tr>";

            if (meets[i].Lobbyists) {
                var oneFound = false;
                var lobbyists = convertToArrayIfNeccessary(meets[i].Lobbyists.Lobbyist);
                for ( j = 0; j < lobbyists.length; j++) {
                    if (lobbyists[j].Type === 'Committee Member') {
                        if(!oneFound) {
                            strRows += "<tr class='labelRow'><td>Commitee Members in Attendance</td></tr>";
                            oneFound = true;
                        }
                        strRows += "<tr><td class='CommListIndent'>" + lobbyists[j].FirstName + " " + lobbyists[j].LastName + "</td></tr>";
                    }
                }   
                
                strRows += "<tr><td>&nbsp;</td></tr>";
                lobbyists = convertToArrayIfNeccessary(meets[i].Lobbyists.Lobbyist);
                oneFound = false;
                for (j = 0; j < lobbyists.length; j++) {
                    if (lobbyists[j].Type === 'In-House Lobbyist') {
                        if(!oneFound) {
                            strRows += "<tr class='labelRow'><td>In-house Lobbyists in Attendance</td></tr>";
                            oneFound = true;
                        }
                        strRows += "<tr><td class='CommListIndent'>" + lobbyists[j].FirstName + " " + lobbyists[j].LastName + " (lobbyist registration number " + lobbyists[j].Number +")</td></tr>";
                    }
                }   
            }
                if (meets[i].POHS) {
                    strRows += "<tr><td>&nbsp;</td></tr>";
                    strRows += "<tr class='labelRow'><td>Public Office Holders in Attendance</td></tr>";
                    strRows += "<tr class='labelRow'><td>Type</td>";
                    strRows += "<td>Name or Position Title</td>";
                    strRows += "<td>Ward, Office, Division or Agency</td>";
                    strRows += "</tr>";
                    var pohs = convertToArrayIfNeccessary(meets[i].POHS.POH);
                    for (j = 0; j < pohs.length; j++) {              
                        strRows += "<tr><td>" + pohs[j].Type + "</td>";
                        strRows += "<td>" + ((pohs[j].Name) ? pohs[j].Name : pohs[j].Title) + "</td>";
                        strRows += "<td>" + pohs[j].Office + "</td>";
                        strRows += "</tr>";
                    }
                }
        }
        $("#MeetingsSection tbody").html(strRows).trigger('update');
        $("#meetAccordion").show();
    }else {
        $("#meetAccordion").hide();
    }

}

function detailCommitees(SM) {
    if (SM.Meetings) {
       $("#committeeHeader").text("Committees of the Organization");
        commiteeReported = {};
        var meets = convertToArrayIfNeccessary(SM.Meetings.Meeting);
        var strRows ="";
        for (var i = 0; i < meets.length; i++) {
            if (commiteeReported[meets[i].Committee]) {
                continue;
            }
            commiteeReported[meets[i].Committee] = true;
            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr class='labelRow'><td>" + meets[i].Committee + "</td></tr>";
            strRows += "<tr><td>&nbsp;</td></tr>";

            if (meets[i].Lobbyists) {
                var oneFound = false;
                var lobbyists = convertToArrayIfNeccessary(meets[i].Lobbyists.Lobbyist);
                for (var j = 0; j < lobbyists.length; j++) {
                    if (lobbyists[j].Type === 'Committee Member') {
                        if(!oneFound) {
                            strRows += "<tr class='labelRow'><td>Commitee Members</td></tr>";
                            oneFound = true;
                        }
                        strRows += "<tr><td class='CommListIndent'>" + lobbyists[j].FirstName + " " + lobbyists[j].LastName + "</td></tr>";
                    }
                }   
            }
        }
        $("#MeetingsSection tbody").html(strRows).trigger('update');
        $("#meetAccordion").show();
    }else {
        $("#meetAccordion").hide();
    }

}

/* for Consultant and Volunteers,  there is no lobbyist info.
  The communication records are blank in that area.  POH details do exist and relate to the consultant/volunteer
 */
function detailCommunications(SM) {
    var i = 0;
    var cnt = 0;
    var lobbyistList = {};
    var strRows = "";
    var comms =[];
    if (SM.Communications) {
        comms = convertToArrayIfNeccessary(SM.Communications.Communication);
        
        for ( i = 0; i < comms.length; i++) {
            var lobbyist = {};
            if (comms[i].LobbyistNumber !== "") {
                lobbyist.LobbyistNumber = comms[i].LobbyistNumber;
                lobbyist.Name = comms[i].LobbyistPrefix + " " + comms[i].LobbyistFirstName + " " + comms[i].LobbyistLastName;
                lobbyist.LobbyistPositionTitle = comms[i].LobbyistPositionTitle;
                lobbyist.PreviousPublicOfficeHolder = comms[i].PreviousPublicOfficeHolder;
                lobbyist.LobbyistType = comms[i].LobbyistType;
                baddr = parseBusinessAddress(comms[i].LobbyistBusinessAddress);
                lobbyist.AddrLine = baddr.Line;
                lobbyist.CityProv = baddr.CityProv;
                lobbyist.PostCty = baddr.PostCty;
                lobbyist.Addr = baddr.Addr;
                lobbyist.Phone = baddr.Phone;
                if (!lobbyistList[JSON.stringify(lobbyist)]) {
                    lobbyistList[JSON.stringify(lobbyist)] = true;
                }
            }
            
            
        }
        
        Object.keys(lobbyistList).sort().forEach(function(key, idx, array) {
            cnt++;
            l = JSON.parse(key);
            strRows += "<tr><td>&nbsp;</td></tr>";
            
            strRows += "<tr class='labelRow'><td>" + cnt + ". In-house Lobbyist's Name</td>";
            strRows += "<td>Lobbyist Registration Number</td>";
            strRows += "<td>    Position title</td>";
            strRows += "</tr>";
            strRows += "<tr><td>" + l.Name  + "</td>";
            strRows += "<td>" + l.LobbyistNumber + "</td>";
            strRows += "<td>" + l.LobbyistPositionTitle + "</td>";
            strRows += "</tr>";
            strRows += "<tr class='labelRow'><td>Business Address</td>";
            strRows += "<td>Phone</td>";
            //strRows += "<td>City, Province</td>"
            //strRows += "<td>Country, Postal Code</td>"
            strRows += "</tr>";
            
            strRows += "<tr><td>" + l.Addr + "</td>";
            strRows += "<td>" + l.Phone + "</td>";
            //strRows += "<td>" + l.CityProv + "</td>"
            //strRows += "<td>" + l.PostCty + "</td>"
            strRows += "</tr>";
            //strRows += "<tr class='labelRow'><td>Phone</td>"
            strRows += "<td colspan='3' class='labelRow'>Has this in-house lobbyist held a senior public office position with the City of Toronto in the past 12 months?</td>";
            strRows += "</tr>";
            //strRows += "<td>" + l.Phone + "</td>"
            strRows += "<td colspan='2'>" + l.PreviousPublicOfficeHolder + "</td>";
            strRows += "</tr>";
        });
    }
    if (cnt > 0) {
        $("#SMLSection tbody").html(strRows).trigger('update');
        $("#smlAccordion").show();
    } else {
        $("#smlAccordion").hide();  
    }
    
    
    //If there are lobbyist. show communication by lobbyist.
    //If there are no lobbyist, then it is a Consultant.. and then show by POH
    //need to sort these by lobhyist#??  and break by Lobbyist.. for "Consultant" there will only be one???

    cnt= 0;
    strRows = "";
    comms = [];
    if (SM.Communications) {
        comms = convertToArrayIfNeccessary(SM.Communications.Communication);        
        if (Object.keys(lobbyistList).length > 0) {
            strRows += "<tr class='labelRow'><td>Public Office Holder Type</td><td>Name or Position Title</td><td>Ward, Office, Division or Agency</td><td>Communication Date</td><td>Communication Methods Used</td></tr>";
            
            Object.keys(lobbyistList).sort().forEach(function(key, idx, array) {
                l = JSON.parse(key);
                for ( i = 0; i < comms.length; i++) {
                    if (comms[i].LobbyistNumber === l.LobbyistNumber && comms[i].POH_Type !== "") {
                        cnt++;
                    }
                }
                if (cnt > 0) {
                    strRows += "<tr><td>&nbsp;</td></tr>";
                    strRows += "<tr><td colspan='10'><b>" + l.Name + "</b>, " + l.LobbyistType + " (lobbyist registration number <b>"  + l.LobbyistNumber + "</b>)</td>";
                    strRows += "</tr>";
                    //meeting arranged amy not be on all           
            
                    for ( i = 0; i < comms.length; i++) {
                        if (comms[i].LobbyistNumber === l.LobbyistNumber && comms[i].POH_Type !== "") {                       
                            strRows += "<tr><td>" + comms[i].POH_Type + "</td>";
                            strRows += "<td>" + comms[i].POH_Name + " " + comms[i].POH_Position + "</td>";
                            strRows += "<td>" + comms[i].POH_Office + "</td>";
                            strRows += "<td>" + comms[i].CommunicationDate + "</td>";
                            strRows += "<td>" + comms[i].CommunicationMethod + "</td>";
                            strRows += "</tr>";
                        }
                    }
                }
            });
        } else {
            //need to sort by Type (but not alpha), then by name, date
            var comms2 = {};
            for ( i = 0; i < comms.length; i++) {
                if (!comms2[comms[i].POH_Type]) {
                    comms2[comms[i].POH_Type] = {};
                }
                if (!comms2[comms[i].POH_Type][comms[i].POH_Name]) {
                    comms2[comms[i].POH_Type][comms[i].POH_Name] = [];
                }
                comms2[comms[i].POH_Type][comms[i].POH_Name].push(comms[i]);
            }
            var lvl1 = "";
            var lvl2 = "";
            //strRows += "<tr class='labelRow'><td>Public Office Holder Type</td><td>Name or Position Title</td><td>Ward, Office, Division or Agency</td><td>Communication Date</td><td>Communication Methods Used</td></tr>";
            Object.keys(comms2).sort(compareCommType).forEach(function(key, idx, array) {
                lvl1 = key;
                Object.keys(comms2[key]).sort().forEach(function(key2, idx2, array2) {
                    lvl2 = key2;
                    //console.log(lvl1 + "-" + lvl2 + "-" + comms2[lvl1][lvl2].length);
                    var comms3 = comms2[lvl1][lvl2].sort(dynamicSort("","CommunicationDate"));
                    strRows += "<tr><td>&nbsp;</td></tr>";
                    for (var i = 0; i < comms3.length; i++) {
                        cnt++;
                        strRows += "<tr><td>" + comms3[i].POH_Type + "</td>";
                        strRows += "<td>" + comms3[i].POH_Name + " " + comms3[i].POH_Position + "</td>";
                        strRows += "<td>" + comms3[i].POH_Office + "</td>";
                        strRows += "<td>" + comms3[i].CommunicationDate + "</td>";
                        strRows += "<td>" + comms3[i].CommunicationMethod + "</td>";
                        strRows += "</tr>";
                        }
                });
            });
        //var comms2 = comms.sort(dynamicSort("","POH_Type")).sort(dynamicSort("","POH_Name"));
        }
        
    }
    
    
    if (cnt > 0) {
        $("#CommunicationsSection tbody").html(strRows).trigger('update');
        $("#pohAccordion").show();
        $("#pohAccordion").show();
    } else {
        $("#pohAccordion").hide();
    }

}
function loadListing() {
    var strCode="";
   if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="css/lobbySearch.css">';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
       // strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
       // strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="js/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/placeholders.jquery.js"></script>';

        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/vfs_fonts.js"></script>';
        $("#appCode").html(strCode);
        $("#appDisplay").load('html/lobbyListing.html', function() {initApp();});
   } else {  
        strCode += '<link rel="stylesheet" href="datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/css/lobbySearch.css">';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/jquery.bootpag.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/jquery.placeholder.min.js"></script>';        
        strCode += '<script type="text/javascript"  src="/static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="/static_files/assets/pdfmake/vfs_fonts.js"></script>';
        
        $("#appCode").html(strCode);
        $("#appDisplay").load('/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/html/lobbyListing.html', function() {initApp();});
    }

}

function loadDetail(jsonData, SMNumber, LRNumber, searchStr) {
   var strCode="";
   if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="css/SMDetail.css">';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
       // strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
       // strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="js/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.jmHighlight.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/placeholders.jquery.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/vfs_fonts.js"></script>';
        
        
        $("#appCode").html(strCode);
        $("#appDisplay").load('html/SMDetail.html', function() {fillDetails(jsonData, SMNumber, LRNumber, searchStr);});
   } else {  
        strCode += '<link rel="stylesheet" href="datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/css/SMDetail.css">';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.js"></script>';
        //strCode += '<script type="text/javascript" src="/tablesorter/js/jquery.tablesorter.widgets.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/jquery.bootpag.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/jquery.placeholder.min.js"></script>';
        
        $("#appCode").html(strCode);
        $("#appDisplay").load('/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/html/SMDetail.html', function() {fillDetails(jsonData, SMNumber, LRNumber, searchStr);});

    }
}
function getDetailData(SMNumber, LRNumber, searchStr) {
        //SML: note sure of why IEversion is needed.. doesn't jQuery do this...and the call is the same anyway.
    //if (document.location.host!="www1.toronto.ca") {
        $.support.cors = true;
        var browser = navigator.userAgent;
        var IEversion = 99; //Give a default value for non-IE browsers
        var strURL = "/City Of Toronto/Sandbox/Steve/LobbyRegistry2/disclosure_active.json" ; //SM10376_closed.json"; //disclosure_active.json";
        if (document.location.hostname.length === 0) {
            strURL = "disclosure_active.json";
        }
        /*
        if (browser.indexOf("MSIE") > 1) { IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5));}
        if (IEversion < 10) {
                $.ajax({
                        type: 'GET',
                        url: strURL,
                        crossDomain: true,
                        dataType: 'json',
                        success: function (data) {
                                loadDetail(data, SMNumber, LRNumber);
                        },
                         error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                        }
                });
        } else {
        */
                $.ajax({
                        type: 'GET',
                        url: strURL,
                        crossDomain: true,
                        dataType: 'json',
                        success: function (data) {
                                if (data.length === 0) {
                                    alert('detail record unexpectedly mising');
                                } else {
                                    loadDetail(data,SMNumber,LRNumber,searchStr);
                                }
                        },
                         error: function (xhr, ajaxOptions, thrownError) {
                            console.log(xhr.status);
                            console.log(thrownError);
                            alert('detail record unexpectedly mising');
                        }
                });
       // }
    //} else {
    //       $.getJSON( "disclosure_active.json", function( data ) {loadDetail(data,SMNumber);});
    //}

    
}
function showSMData(SMNumber, searchStr) {
    getDetailData(SMNumber, null, searchStr);
}

function showLRData(SMNumber, LRNumber, searchStr) {
    getDetailData(SMNumber, LRNumber, searchStr);
}

$( document ).ready(function() {

    var qsSM = $.QueryString.SM;
    var qsLR = $.QueryString.LR;
    var qsSearchStr = $.QueryString.searchStr;
    if (qsLR) {
        showLRData(qsSM, qsLR,qsSearchStr);
    } else if (qsSM) {
        showSMData(qsSM,qsSearchStr);
    } else {
         $("#loader").show();
        loadListing();
    }


});

//}());