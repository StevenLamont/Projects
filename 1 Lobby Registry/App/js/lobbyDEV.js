/*

Adv Search Validator:
1) if beneficary, then must select Consultant. this is not implmented.


http://stackoverflow.com/questions/19035557/jsonp-request-error-handling
There is no error handling for cross domain JSONP requests. Use jsonp plug-in available on Github https://github.com/jaubourg/jquery-jsonp that provides support for error handling.

TODO List:

1) We don't have an API for deteriming if a option in the A-Z listing is valid or not.  The API teams is not sure they can develop one on time. SO a person could click on 'Z' in
an A-Z listing only to find that there is no records found. Ideally that Z option should be disabled.

*/
(function () {
   'use strict';

var LS_KEY_STATE = "LobbyistDisclosure";
var LS_KEY_APP_ENV = "LobbyistEnvironment";
var listGUID;
//Make sure to check css.
var gblAllowEnvSwitch = true;
//var APP_ENV = "http://was-inter-qa.toronto.ca";
var APP_ENV = "http://was8-inter-dev.toronto.ca";

var SM_DETAIL_DATA_URL = "/LobbyistRegistryRestWeb/disclosure/subjectMatterDetails?callback=?&subjectMatterId=<SMID>";
var LR_DETAIL_DATA_URL = "/LobbyistRegistryRestWeb/disclosure/lobbyistDetails?callback=?&lobbyistRegistrationId=<LRID>";
var SM_TYPE_URL =  "/LobbyistRegistryRestWeb/disclosure/subjectMatter/Category/*?callback=?";

var gblCurrentSMData = [];
var gblRowsPerPage = 10;
var gblPageNo = 1;
var gblNextRow=1;
var gblTotalPages=0;
var gblTotalRows = 0;

var gblCurrentAlpha = "A";
var gblAlphaMap = {};
var gblSelectedReport = 'SMRpt';
var gblFilters = {};
var CommSortOrder = {"Member of Council" : 1, "Staff of Member of Council": 2, "Member of Local Board" : 3,
                     "Staff of Member of Local Board" : 4, "Employee of Local Board" : 5,
                     "Member of Advisory Board": 6, "Employee of the City" :7};

var rptColumnHdrs = { SMLLobbyist: {header : 'Lobbyist', size : '*'},
                    SMLGovAgency: {header : 'Gov Agency', size : '*'},
                    SMLFinContributors: {header : 'Financial Contributors', size : '*'},
                    SMLFinContributor: {header : 'Financial Contributor', size : '*'},
                    SMLBeneficiary: {header : 'Beneficiary', size : '*'},
                    SMLBeneficiaries: {header : 'Beneficiaries', size : '*'},
                    SMLLobbyistType: {header : 'Lobbyist Type', size : '*'},
                    SMLBusOrg: {header : 'Business/Org', size : '*'},
                    SMLBusOrgClient: {header : 'Bus/Org/Client', size : '*'},
                    SMLLobbyistNames: {header : 'Lobbyist Name(s)', size : '*'},
                    SMLClient: {header : 'Client', size : '*'},
                    SMLPOHOfficeName: {header : 'Office', size : '*'},
                    SMLPOHName: {header : 'Public Office Holder', size : '*'},
                    SMLPOHNameTitle: {header : 'Name or Position', size : '*'},
                    SMLPOHPosition: {header : 'Position', size : '*'},
                    SMLPOHType: {header : 'Type', size : '*'},
                    SMLSubjectMatter: {header : 'Subject Matter', size : '*'},
                    SMLStatus: {header : 'Status', size : '*'},
                    SMLInitFileDate: {header : 'Init Filing Date', size : '*'},
                    SMLSubjectMatterNo: {header : 'Subject Matter No', size : '*'},
                    SMLLobRegNo: {header : 'Lobbyist Reg No.', size : '*'},
                    SMLCommDate: {header : 'Comm. Date', size : '*'},
                    SMLCommMethod: {header : 'Comm. Method', size : '*'},
                    SMLRequestMeeting: {header : 'Req. Meeting?', size : '*'},
                    SMLResultOfMeetingRequest: {header : 'Result of Req.', size : '*'},
                    SMLDateOfRequest: {header : 'Date of Req.', size : '*'}
                    };

var rptColumns = {

  // 'SMRpt'   : {Idx: 'N', DataSource : "/LobbyistRegistryRestWeb/disclosure/1?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
  //              Cols :  [
  //                      {column: 'SMLLobbyistNames', cls: '', style: 'width: 25%', label: 'Lobbyist Name(s)', title: 'Lobbyist Name(s)'},
  //                      {column: 'SMLBusOrg', cls: '', style: 'width: 25%', label: 'Business/Org', title: 'Business&#47;Organization'},
  //                      {column: 'SMLSubjectMatter', cls: '', style: 'width: 32%', label: 'Subject Matter', title: 'Subject Matter'},
  //                      {column: 'SMLStatus', cls: '', style: 'width: 8%', label: 'Status', title: 'Subject Matter Registration  Status'},
  //                      {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 10%', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
  //                      ]
  //              },
   'SMRpt'   : {Idx: 'N', DataSource : "/LobbyistRegistryRestWeb/disclosure/1?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLLobbyistNames', cls: '', style: 'width: 265px;white-space: normal;', label: 'Lobbyist Name(s)', title: 'Lobbyist Name(s)'},
                        {column: 'SMLBusOrg', cls: '', style: 'width: 265px;white-space: normal;', label: 'Business/Org', title: 'Business&#47;Organization'},
                        {column: 'SMLSubjectMatter', cls: '', style: 'width: 345px;white-space: normal;', label: 'Subject Matter', title: 'Subject Matter'},
                        {column: 'SMLStatus', cls: '', style: 'width: 70px;white-space: normal;', label: 'Status', title: 'Subject Matter Registration  Status'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        ]
                },              
    'LobbyRpt': {Idx: 'A', DataSource : "/LobbyistRegistryRestWeb/disclosure/startWith/<PGALPHA>/2?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols : [
                        {column: 'SMLLobbyist', cls: '', style: 'width: 150px;white-space: normal;', label: 'Lobbyist Name', title: 'Lobbyist Name'},
                        {column: 'SMLLobbyistType', cls: '', style: 'width: 82px;white-space: normal;', label: 'Lobbyist Type', title: 'Lobbyist Type'},
                        {column: 'SMLBusOrg', cls: '', style: 'width: 185px;white-space: normal;', label: 'Business/Org', title: 'Business&#47;Organization'},
                        {column: 'SMLClient', cls: '', style: 'width: 185px;white-space: normal;', label: 'Client', title: 'Client'},
                        {column: 'SMLSubjectMatter', cls: '', style: 'width: 205px;white-space: normal;', label: 'Subject Matter', title: 'Subject Matter'},
                        {column: 'SMLLobRegNo', cls: '', style: 'width: 95px;', label: 'Lobbyist<br />Reg No.', title: 'Lobbyist Registration No.'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        ]
                },

    // They changed the definitions for 1sdt two columns, the new property names make no sense.. but ce la vie
    'POHNameRpt' : {Idx: 'N', DataSource : "/LobbyistRegistryRestWeb/disclosure/3?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLPOHNameTitle', cls: '', style: 'width: 150px;', label: 'Name or Position', title: 'Public Office Holder Name'},
                        {column: 'SMLPOHType', cls: '', style: 'width: 240px;', label: 'Type', title: 'Public Office Holder Type'},
                        {column: 'SMLSubjectMatter', cls: '', style: 'width: 230px;white-space: normal;', label: 'Subject Matter', title: 'Subject Matter'},
                        {column: 'SMLLobbyistNames', cls: '', style: 'width: 230px;white-space: normal;', label: 'Lobbyist Name(s)', title: 'Lobbyist Name(s)'},
                        {column: 'SMLStatus', cls: '', style: 'width: 70px;', label: 'Status', title: 'Subject Matter Registration Status'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        ]
                },
    'POHCommRpt' : {Idx: 'N', DataSource : "/LobbyistRegistryRestWeb/disclosure/4?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLPOHNameTitle', cls: '', style: 'width: 95px;white-space: normal;', label: 'Name or Position', title: 'Public Office Holder Name &#47; Position'},
                        {column: 'SMLPOHType', cls: '', style: 'width: 95px;;white-space: normal;', label: 'Type', title: 'Public Office Holder Type'},
                        {column: 'SMLSubjectMatter', cls: '', style: 'width: 95px;;white-space: normal;', label: 'Subject Matter', title: 'Subject Matter'},
                        {column: 'SMLLobbyist', cls: '', style: 'width: 95px;white-space: normal;', label: 'Lobbyist', title: 'Lobbyist'},
                        {column: 'SMLCommDate', cls: '', style: 'width: 95px;white-space: normal;', label: 'Comm Date', title: 'Comm. Date'},
                        {column: 'SMLCommMethod', cls: '', style: 'width: 95px;white-space: normal;', label: 'Method', title: 'Method'},
                        {column: 'SMLRequestMeeting', cls: '', style: 'width: 95px;white-space: normal;', label: 'Request a Meeting', title: 'Request a Meeting'},
                        {column: 'SMLResultOfMeetingRequest', cls: '', style: 'width: 95px;white-space: normal;', label: 'Result of Request', title: 'Result of Meeting Request. &#13;Only applies to Consultant/Voluntary'},
                        {column: 'SMLDateOfRequest', cls: '', style: 'width: 95px;white-space: normal;', label: 'Date of Request', title: 'Date of Request. &#13;Only applies to Consultant/Voluntary'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        
                        ]
                },
    'BenRpt'  : {Idx: 'A', DataSource : "/LobbyistRegistryRestWeb/disclosure/startWith/<PGALPHA>/5?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLBeneficiary', cls: '', style: 'width: 150px;white-space: normal;', label: 'Beneficiary', title: 'Beneficiary'},
                        {column: 'SMLBusOrg', cls: '', style: 'width: 150px;white-space: normal;', label: 'Business/Org', title: 'Business&#47;Organization'},
                        {column: 'SMLClient', cls: '', style: 'width: 150px;white-space: normal;', label: 'Client', title: 'Client'},
                        {column: 'SMLLobbyistNames', cls: '', style: 'width: 210px;white-space: normal;', label: 'Lobbyist Name(s)',  title: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', cls: '', style: 'width: 95px;white-space: normal;', label: 'Lobbyist Type',  title: 'Lobbyist Type'},
                        {column: 'SMLFinContributors', cls: '', style: 'width: 150px;white-space: normal;', label: 'Financial Contributors',  title: 'Financial Contributors'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.',  title: 'Subject Matter Registration No.'}
                        ]
                },
    'BusOrgClientRpt' : {Idx: 'A', DataSource : "/LobbyistRegistryRestWeb/disclosure/startWith/<PGALPHA>/6?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLBusOrg', cls: '', style: 'width: 150px;white-space: normal;', label: 'Business/Org', title: 'Business&#47;Organization'},
                        {column: 'SMLClient', cls: '', style: 'width: 150px;white-space: normal;', label: 'Client', title: 'Client'},
                        {column: 'SMLLobbyistNames', cls: '', style: 'width: 200px;white-space: normal;', label: 'Lobbyist Name(s)', title: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', cls: '', style: 'width: 95px;white-space: normal;', label: 'Lobbyist Type', title: 'Lobbyist Type'},
                        {column: 'SMLBeneficiaries', cls: '', style: 'width: 190px;white-space: normal;', label: 'Beneficiaries', title: 'Beneficiaries'},
                        {column: 'SMLFinContributors', cls: '', style: 'width: 110px;white-space: normal;', label: 'Financial Contributors', title: 'Financial Contributors'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        ]
                },

   'FinRpt'  : {Idx: 'A', DataSource : "/LobbyistRegistryRestWeb/disclosure/startWith/<PGALPHA>/7?callback=?&pageNum=<PGNUM>&maxResults=<MAXRES>",
                Cols :  [
                        {column: 'SMLFinContributor', cls: '', style: 'width: 175px;white-space: normal;', label: 'Financial Contributor', title: 'Financial Contributor'},
                        {column: 'SMLBusOrg', cls: '', style: 'width: 160px;white-space: normal;', label: 'Business/Org', title: 'Business&#47;Organization'},
                        {column: 'SMLClient', cls: '', style: 'width: 140px;white-space: normal;', label: 'Client', title: 'Client'},                      
                        {column: 'SMLLobbyistNames', cls: '', style: 'width: 175px;white-space: normal;', label: 'Lobbyist Name(s)', title: 'Lobbyist Name(s)'},
                        {column: 'SMLLobbyistType', cls: '', style: 'width: 95px;white-space: normal;', label: 'Lobbyist Type', title: 'Lobbyist Type'},
                        {column: 'SMLBeneficiaries', cls: '', style: 'width: 110px;white-space: normal;', label: 'Beneficiaries', title: 'Beneficiaries'},
                        {column: 'SMLStatus', cls: '', style: 'width: 65px;', label: 'Status', title: 'Subject Matter Registration Status'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 100px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        ]
                }
    };

/* --- Utility Functions ------------------------------------------------------------------------------------------------------------- */

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

function checkMinSelection(option, checked, select, minVal) {
    var selectedOptions = $(option).parent().find('option:selected').length;
    if (selectedOptions < minVal) {
        bootbox.alert("You must select at least " + minVal + " of the options.");
        $(option).parent().multiselect('select', $(option).val());
    }
}

function toTitleCase(str) {
    var ret = str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
    return ret.split(/(?=[A-Z])/).join(' ');
}

function saveCurrentState() {
    if (typeof(Storage) !== "undefined") {
        var currentState = { pageNo: gblPageNo,
                             currentAlpha : gblCurrentAlpha,
                             nextRow: gblNextRow,
                             rowsPerPage: gblRowsPerPage,
                             selectedReport: gblSelectedReport,
                             filters : gblFilters};
        localStorage.setItem(LS_KEY_STATE,  JSON.stringify(currentState));
    }
}

function resetAppState(prevState) {
    if (prevState !== null) {
        setAlphaIdx(prevState.currentAlpha);
        gblPageNo = prevState.pageNo;
        $("#PageNo").html(gblPageNo);
        $('#numberPageSelection').bootpag({page: gblPageNo});
        gblNextRow = prevState.NextRow;
        gblRowsPerPage = prevState.rowsPerPage;
        var pgSize = $("#pageSize");
        pgSize.multiselect('select',gblRowsPerPage);
        pgSize.multiselect('refresh');
        gblSelectedReport = prevState.selectedReport;
        $(".lrCats").parent().removeClass("active");
        $("#"+gblSelectedReport).parent().addClass("active");
        Object.keys(prevState.filters).sort().forEach(function(filter, idx, array) {
            var flt =  $("#" + filter);
            if ( flt.hasClass("columnCheckBox")) {
                flt.prop( "checked", true );
            } else if ( flt.hasClass("columnSelect")) {
				var vals = prevState.filters[filter].split(',');
                flt.val(vals);
                flt.multiselect("refresh");
            } else {
                flt.val(prevState.filters[filter]);
				flt.next('.clearer').show();
            }
         });
    }
    filtersApplied(); //
}

function restorePreviousState() {
    if  (typeof(Storage) !== "undefined" ) {
        var prevState = localStorage.getItem(LS_KEY_STATE);
        if (prevState) {
            try{
                var previousState = JSON.parse( prevState);
                resetAppState(previousState);

            }catch(e){
                //ignore error
            }
        }
    }
}


function setAlphaIdx(char) {
    if (char  === '>') {
        if (gblCurrentAlpha !== 'Z') {
            char = gblCurrentAlpha == "0" ? 'A' : String.fromCharCode(gblCurrentAlpha.charCodeAt()+1);
        } else {
            char = gblCurrentAlpha;
        }
    } else if (char === '<') {
        if ( gblCurrentAlpha != "0" ) {
            char = String.fromCharCode(gblCurrentAlpha.charCodeAt()-1)
        } else {
            char = gblCurrentAlpha;
        }
    }
    gblCurrentAlpha = (char === "@") ? "0" : char;
    $(".alphaIdx").parent().removeClass("active");
    $("#alpha-" + gblCurrentAlpha).addClass("active");
}
/* ----------------------------------------------------------------------------------------------------------------------------------- */

/* this is the on bit of bussiness logic */
function boldSeniorOfficer(str, type) {
    var l = str.split(",");
    var retStr = "";
    for (var i = 0; i <l.length; i++) {
        if ( i === 0 && type.toLowerCase().indexOf("in-house") > -1)  {
            retStr = "<b>" + l[0] + "</b>";
        } else if (i === 0) {
			retStr += l[0];
		} else {
            retStr += ", " + l[i];
        }
    }
    return  retStr;
}

function writeListingHeaders() {
    var rptCols = rptColumns[gblSelectedReport].Cols;
    var tblHdr= "<tr id='SubjectMatterListingHdr'>";
    for (var i = 0; i < rptCols.length; i++) {
        tblHdr += "<th class='" + rptCols[i].cls + "'" + " style='" + rptCols[i].style + "' id='" + rptCols[i].column + "'>" +
                  "<label class='colHdr control-label' ";
        if (rptCols[i].title)
            tblHdr += "title='" +  rptCols[i].title + "'";
        tblHdr += ">" + rptCols[i].label + "</label> </th>";
    }

    tblHdr += "</tr>";
       $("#lobbytable").find("thead").html(tblHdr).trigger('update');

}
function getHighLightFilterOptions() {
    var searchStr = $('#searchString').val();
    var hfOpts = {searchStr : [],
                         searchRegex : []};
    if (searchStr.length > 0) {
        var words = searchStr.split(' ');
        for (var i = 0; i < words.length; i++) {
            hfOpts.searchStr.push(words[i]);
            //console.log("word" + words[i]);
            hfOpts.searchRegex.push(new RegExp("(.*?)(" + words[i] + ")(.*)", "ig"));
        }
    }

    hfOpts.SubjectMatterNumSearch = $("#subjectMatterNumSearch").val();
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

    hfOpts.startIdx = gblNextRow;
    hfOpts.endIdx = gblNextRow + gblRowsPerPage;

    return hfOpts;
}

 var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }
  
function highlightSearch(string, hfOpts){
    if (hfOpts.searchRegex.length === 0) return string;
    var match = null;
    var retStr = string;

    for (var i = 0; i < hfOpts.searchRegex.length; i++) {
        var regStr = retStr;
        retStr = "";
        while ( ( match = hfOpts.searchRegex[i].exec(regStr)) !== null  ) {
                retStr += match[1] + '<span class="searchHighlight">'+ match[2] + '</span>';
                regStr = match[3];
        }
        retStr += regStr;
        }
    return retStr;
}

function loadSubjectMatters() {
    $.ajax({
        type: 'GET',
        url: APP_ENV + SM_TYPE_URL,
        crossDomain: true,
        dataType: 'jsonp',
        success: function (data) {
            var smLookup = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.whitespace,
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: data
            });

            $('#subjectMatterFilter').typeahead({
                hint: true,
                highlight: true,
                minLength: 1

            },
            {
                name: 'matters',
                source: smLookup,
                limit: 50
            });
    },
    error: function (xhr, ajaxOptions, thrownError) {
        console.log(xhr.status);
        console.log(thrownError);
    }
    });


}

function showDetail(type, number, id) {

    var href = document.location;

    href += document.location.hostname.length === 0 ?  "?" :  "&";
    href += type + "=" + number + '&' + type + 'Id=' + id;
    var srchStr = $('#searchString');
    href += (srchStr.val() !== "" ? "&searchStr=" + srchStr.val() :"");

    window.location.href = href;
    return false; //to cancel the link
}


function resetFilters() {
    $(".columnSearch").each(function( index ) {
        this.value="";
		$(this).next('.clearer').hide();
    });
    $(".columnCheckBox").each(function( index ) {
        this.checked = false;
    });
    $(".columnSelect").each(function( index ) {
        var cs = $("#" + this.id);
        cs.multiselect('selectAll',false);
        cs.multiselect('refresh');
     });
    $(".datepicker").each(function( index ) {
        this.value="";
    });
    $("#searchBtn").show();
    $("#advSearchBtnGroup").show();
    $("#advSearchString").hide();
    var srchStr = $("#searchString");
    srchStr.val("");
    srchStr.prop( "disabled", false );
    srchStr.show();
    filtersApplied(); //to Reset tooltips
}



/* return true/false and URL Parameters
The id of the search element must match the URL Parameter. (minus Search suffix)
The API have hard coded values for select boxes, so we must put effort into making tooltip more user friendly
*/
function filtersApplied() {
    var advSearch = false;
    var search = false;
    var filterText = "";
    gblFilters = {};
    var URLParms = "";
    $(".columnSearch").each(function( index ) {
        if(this.id !== null && this.value !== null && this.value.length > 0) {
            gblFilters[this.id] = this.value;
            var idCore = this.id.replace('Search','').replace('Filter','');
            
            filterText +=  toTitleCase(idCore) + " : " + this.value + "<br>";
            URLParms += "&" + idCore + "=" +  this.value;
            advSearch = true;
        }
    });
    /* id value for checkboxes have Ind as a suffix */
    $(".columnCheckBox").each(function( index ) {
        if(this.id !== null && this.checked) {
            gblFilters[this.id] = this.checked;
            var idCore = this.id.replace('Ind','');
            filterText +=  $(this).prev().text() + " : " + this.checked  + "<br>";
            //filterText += toTitleCase(idCore) + " : " + this.checked  + "<br>";
            URLParms += "&" + idCore + "=true";
            advSearch = true;
        }
    });

    /* this.selectedOptiions doesn't work in IE */
    $(".columnSelect").each(function( index ) {
        if(this.id !== null) {
            var selected = $("#"+ this.id + " option:selected");
            if (selected.length != this.options.length) {
            
                filterText += toTitleCase(this.id).replace('Filter','') + " : ";
                var filterValues = "";

                for (var i = 0; i < selected.length; i++) {
                    filterText += selected[i].text + ", ";
                    filterValues  += selected[i].value + ",";
                    URLParms += "&" + selected[i].value + "=true";
                }
                filterText =filterText.slice(0,-2);
                filterValues =filterValues.slice(0,-1);
                gblFilters[this.id] = filterValues;
                filterText += "<br>";
                advSearch = true;
            }
        }
    });

    /* datepicker, the id values match the url parameters */
    $(".datepicker").each(function( index ) {
        if(this.id !== null && this.value.length > 0) {
            gblFilters[this.id] = this.value;
            filterText += toTitleCase(this.id) + " : " + this.value + "<br>";
            URLParms += "&" + this.id + "="  + this.value;
           advSearch = true;
        }
    });

    var searchStr = $("#searchString");
    if (searchStr.val().length > 0) {
        search = true;
        gblFilters.searchString = searchStr.val();
        URLParms += "&keyword=" + searchStr.val();
        $("#advSearchBtnGroup").hide();

    } else {
        $("#advSearchBtnGroup").show();

    }

    var advSearchStr = $("#advSearchString");
	filterText = filterText.replace(/Poh /g,"POH "); //This is kludge but we didn't want to title case POH.
    advSearchStr.val(filterText.replace(/<br>/g," ; ").slice(0,-3));
    $("#lrServiceBar").tooltip('hide')
          .attr('data-original-title', filterText)
          .tooltip('fixTitle')
          .tooltip('show');


    if (advSearch || search) {
        $("#advSearchResetGroup").show();
    } else {
        $("#advSearchResetGroup").hide();
    }
    
    if (advSearch) {
        searchStr.hide();
        $("#searchBtn").hide();
        advSearchStr.show();
    } else {
        searchStr.show();
        $("#searchBtn").show();
        advSearchStr.hide();
    }
    return URLParms;
}

function resetgblAlphaMap() {
    gblAlphaMap = {};
    var alphabet = "1ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (var i = 0; i < alphabet.length; i++) {
        gblAlphaMap[alphabet[i]] = false;
    }
}

/** TODO: This isn't invoked.  Should need it.. consioldate with SetAlpha? */
function setgblAlphaMap(SMData, keyCol) {

    if (filtersApplied() !== "") {
        $("#alphaPagination").hide();
    } else {
        $("#alphaPagination").show();
        resetgblAlphaMap();
        for (var i = 0; i < SMData.length; i++) {
            var alphaKey = SMData[i][keyCol].charAt(0);
            if (alphaKey.match(/[a-z]/i)) {
                gblAlphaMap[alphaKey.toUpperCase()] = true;
            } else {
                gblAlphaMap["1"] = true;
            }
        }
        var firstLetter = false;
        Object.keys(gblAlphaMap).forEach(function(key, idx, array) {
            if (gblAlphaMap[key]) {
                if (!firstLetter) {
                    firstLetter = true;
                    gblCurrentAlpha = (key === "1") ? "#" : key;
                }
                $("#alpha-" + key ).removeClass("disabled");
            } else {
                $("#alpha-" + key ).addClass("disabled");
            }
        });
    }
}

function listDetailRow(SM, rowNum, hfOpts) {

    var strRows = "";
    var rptCols = rptColumns[gblSelectedReport].Cols;
    var rowId = "lrRow" + rowNum;

    strRows += '<tr id="' + rowId + '">';

    for (var i = 0; i < rptCols.length; i++) {
        switch(rptCols[i].column) {
            case 'SMLLobbyist':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.lobbyistName),hfOpts) + '</td>';
                break;
            case 'SMLLobbyistNames':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' +  highlightSearch(boldSeniorOfficer(escapeHtml(SM.lobbyistList),SM.lobbyistType),hfOpts) + "</td>";
                break;
            case 'SMLPOHName':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.pohName) ,hfOpts) + '</td>';
                break;
            case 'SMLPOHNameTitle':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.pohNameOrTitle) ,hfOpts) + '</td>';
                break;
            case 'SMLPOHPosition':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' +highlightSearch(escapeHtml(SM.posPosition) ,hfOpts) + '</td>';
                break;
            case 'SMLPOHType':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' +highlightSearch(escapeHtml(SM.pohType) ,hfOpts) + '</td>';
                break;
            case 'SMLFinContributor':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' +highlightSearch(escapeHtml(SM.financialContributor), hfOpts) + '</td>';
                break;
            case 'SMLFinContributors':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.financialContributors.join(", ")), hfOpts) + '</td>';
                break;
            case 'SMLLobbyistType':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + escapeHtml(SM.lobbyistType) + '</td>';
                break;
            case 'SMLBeneficiary':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.beneficiaryName), hfOpts) + '</td>';
                break;
            case 'SMLBeneficiaries':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.beneficiaries.join(", ")), hfOpts) + '</td>';
                break;
            case 'SMLBusOrg':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.businessOrganization), hfOpts) + "</td>";
                break;
            case 'SMLClient':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.client), hfOpts) + "</td>";
                break;
            case 'SMLSubjectMatter':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.subjectMatter).replace(';','; '), hfOpts) + "</td>";
                break;
            case 'SMLStatus':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.status), hfOpts) + "</td>";
                break;
            case 'SMLInitFileDate':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.InitialApprovalDate), hfOpts) + "</td>";
                break;
            case 'SMLCommMethod':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.communicationMethod), hfOpts) + "</td>";
                break;
            case 'SMLCommDate':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.communicationDate), hfOpts) + "</td>";
                break;
            case 'SMLRequestMeeting':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.requestMeeting), hfOpts) + "</td>";
                break;
            case 'SMLResultOfMeetingRequest':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.resultOfMeetingRequest), hfOpts) + "</td>";
                break;
            case 'SMLDateOfRequest':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + highlightSearch(escapeHtml(SM.dateOfRequest), hfOpts) + "</td>";
                break;
            case 'SMLSubjectMatterNo':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + '<button class="showSM" title="click to see details"  data-smno="' + escapeHtml(SM.subjectMatterNumber) + '" data-smid="' + SM.subjectMatterId + '">' +  highlightSearch(SM.subjectMatterNumber,hfOpts) + '</button></td>';
                break;
            case 'SMLLobRegNo':
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' + '<button class="showLR" title="click to see details" data-lrno="' + escapeHtml(SM.lobbyistRegistrationNumber) + '" data-lrid="' + SM.lobbyistRegistrationId + '">' +  highlightSearch(SM.lobbyistRegistrationNumber,hfOpts) + '</button></td>';
                break;
        }
    }
    strRows +="</tr>";

    return strRows;
}


function updatePageTable(strRows) {
    if (strRows === "") {
       strRows += "<tr id='nowRows'><td colspan='25'>No Rows Selected</td></tr>"; // + "' onmouseover='highlightMarker(this);'>";
    }
    $("#lobbytable").find("tbody").html(strRows).trigger('update');
    $("#listLoader").modal('hide');
    saveCurrentState();
}

function generateNoDataListing() {

    var strRows = "<tr id='nowRows'><td colspan='25'>No Rows Selected</td></tr>";
    $("#lobbytable").find("tbody").html(strRows).trigger('update');
    $("#PageStatus").hide();
    $("#listLoader").modal('hide');
}

function generateListing(pagingType) {
    var strRows = "";
    var rowNum = 0;
    var hfOpts = getHighLightFilterOptions();
    if (gblCurrentSMData.totalSize > 0 && gblCurrentSMData.searchResultVOs !== null) {
        $.each(gblCurrentSMData.searchResultVOs, function(item, SM) {
            rowNum++;
            strRows += listDetailRow(SM, rowNum, hfOpts);
        });
    }
    writeListingHeaders();
    updatePageTable(strRows);
    checkPaging(gblCurrentSMData.totalPages, gblCurrentSMData.totalSize, pagingType);
}

function callAPI(APIUrl, pagingType) {
    $.ajax({
        type: 'GET',
        url: APIUrl,
        crossDomain: true,
        dataType: 'jsonp',
        timeout: 60000,
        success: function (data) {
            gblCurrentSMData = data;
            generateListing(pagingType);
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
            generateNoDataListing();
        },
        complete: function(xhr, ajaxOptions, thrownError) {
            $("#listLoader").modal('hide');
            if (xhr.status !== 200) {
                bootbox.alert("An error has occured. Please try again.");
             }
        }
    });

}

/* generic function. Not all replacement parameters will exist */
function getPageData(searchParms, pagingType) {

    gblCurrentSMData = [];
    var alphaVal = gblCurrentAlpha; // === '1' ? "0" : gblCurrentAlpha;
    var strURL = APP_ENV + rptColumns[gblSelectedReport].DataSource.replace("<PGNUM>",gblPageNo).replace("<MAXRES>",gblRowsPerPage).replace("<PGALPHA>",alphaVal);
    if (searchParms !== "") {
        strURL += searchParms;
         strURL = strURL.replace("/startWith/" + alphaVal,"");
    }
    if (searchParms.indexOf("keyword") > -1) {
        strURL = strURL.replace("disclosure","disclosure/search");
        strURL = strURL.replace("/startWith/" + alphaVal,"");
    }
    callAPI(strURL,pagingType);
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
            checkMinSelection(option, checked, select, 1);
        }
    });

   $("#pohTypeFilter").multiselect({
        onChange: function(option, checked, select) {
            checkMinSelection(option, checked, select, 1);
        },
        numberDisplayed: 1
    });

    $("#lobbyistTypeFilter").multiselect({
        onChange: function(option, checked, select) {
            checkMinSelection(option, checked, select, 1);
        }
   });
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
        onChange: function(option, checked, select) {
            gblRowsPerPage = Number($("#pageSize").val());
            $('#numberPageSelection').bootpag({
                page: 1});  //doesn't cause page event
            gblNextRow = 1;
            gblPageNo = 1;
            showListing();
        }
        });

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
            todayHighlight: true,
            endDate:"0d"
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
    
    $("#gotoTop").click(function () {
        window.scrollTo(0, $("#paging").offset().top);
    });

    $('#numberPageSelection').bootpag({
        total: gblRowsPerPage,
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
        gblPageNo = num;
        gblNextRow = ((gblPageNo  -1 ) * gblRowsPerPage) + 1;
        showListing();
        $("#PageNo").html(gblPageNo);
    });

    $(".alphaIdx").click(function (e) {
        setAlphaIdx($(this).data('value'));
        showListing();
        return false;
    });

    $(".lrCats").on("click",function() {
        gblSelectedReport = this.id;
        gblNextRow = 1;
        $('#numberPageSelection').bootpag({page: 1});
        $("#PageNo").html("1");
        gblPageNo = 1;
        initListing();
        showListing();
    });

    $("#advSearchApplyBtn").on("click",function() {
        $('#modalSearch').modal('hide');
        if (filtersApplied() !== "") {
            var srchStr = $("#searchString");
            srchStr.val("");
            //srchStr.prop( "disabled", true );
            srchStr.hide();
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

    $("#maincontent").on("click",".showSM", function() {
        showDetail("SM", $(this).attr("data-smno"), $(this).attr("data-smid"));
        return false;
    });
    $("#maincontent").on("click",".showLR", function() {
        showDetail("LR", $(this).attr("data-lrno"), $(this).attr("data-lrid"));
        return false;
    });

    var genPDF = $("#generatePDF");
    genPDF.tooltip( {html: true});
    genPDF.on("click", function() {
        generatePDF();
    });
    $("#generateExcel").on("click", function() {
        generateExcel();
    });
    

 if (gblAllowEnvSwitch && $("#appEnv")) {
    $("#appEnv").change(function() {
        APP_ENV = $(this).val();
        if (typeof(Storage) !== "undefined") {
            var appEnv = { env: APP_ENV};
            localStorage.setItem(LS_KEY_APP_ENV,  JSON.stringify(appEnv));
        }
    });
 }
 /* this wont work for jsonp
 $( document ).ajaxError(function(event, xhr) {
  if (xhr.status === 0) {
    if (xhr.statusText === 'abort') {
        alert('abort');
      // Has been aborted
    } else {
      // Offline mode
    }
  }
});
*/

}

function setUpDetailEvents() {
    $('.closeall').click(function(){
        $('.panel-collapse.in').collapse('hide');
        $('.panel-heading').addClass('collapsed');
    });
    
    $('.openall').click(function(){
        $('.panel-collapse:not(".in")').collapse('show');
        $('.panel-heading').removeClass('collapsed');
    });
}
function initApp() {
    var appEnv = $("#appEnv");
    if (gblAllowEnvSwitch) {
        appEnv.val(APP_ENV);
        appEnv.show();
        
    } else {
        appEnv.hide();
    }
    loadSubjectMatters();
    setUpSearchFilters();
    setUpEvents();
    initListing('main');
    showListing();

}

/* when initializing for 1st time, check local storage for current state */
function initListing(src) {
    $('#numPagination').hide();
    $('#alphaPagination').hide();
    if (src === 'main') {
        restorePreviousState();
    } else {
        gblNextRow = 1;
        setAlphaIdx('A');
    }
}

function turnOnAlphaNumericPaging() {
    $("#numPagination").hide();
    $("#PageStatus").hide();
    $("#alphaPagination").show();
}

function turnOnNumericPaging(totalPages, totalRows) {
    gblTotalRows = totalRows;
    gblTotalPages = totalPages;
    $("#numPagination").show();
    $("#alphaPagination").hide();
    //var numPages = 0;
    if (totalPages > 0) {
        //numPages = Math.ceil(totalJSONRows / gblRowsPerPage);
        $('#numberPageSelection').bootpag({
            total: totalPages,
            page: gblPageNo
        });
        $("#PageStatus").show();
    } else {
        $('#numberPageSelection').bootpag({
            total: 1
        });
        $("#PageStatus").hide();
    }
    $("#NoPages").html(totalPages)     ;
    $("#TotalRows").html(totalRows)  ;
    $("#PageNo").html(gblPageNo);
}

function checkPaging(totalPages, totalRows, pagingType) {

    if (pagingType === 'N' && ($('#numPagination').is(':hidden') || totalPages !== gblTotalPages ||  totalRows !== gblTotalRows )) {
        turnOnNumericPaging(totalPages,totalRows);
    } else if (pagingType === 'A' && $('#alphaPagination').is(':hidden') ){
        turnOnAlphaNumericPaging();
    }
}

function showListing() {
    $("#listLoader").modal('show');
    var pagingType = rptColumns[gblSelectedReport].Idx;
    var searchParms = filtersApplied();
    if (searchParms !== "" && rptColumns[gblSelectedReport].Idx === 'A') {
        pagingType = 'N';
    }
    getPageData(searchParms, pagingType);
    //TODO: remove this switch statements.. not needed anymore..
    /*
    switch (gblSelectedReport) {
    case 'SMRpt':
        getPageData(searchParms, pagingType);
        break;
    case 'LobbyRpt':
        getPageData(searchParms, pagingType);
        break;
    case 'BenRpt':
        getPageData(searchParms, pagingType);
        //SMData = getPageBenData(searchParms, pagingType);
        break;
    case 'POHCommRpt':
        getPageData(searchParms, pagingType);
        //SMData = getPagePOHCommData(searchParms, pagingType);
        break;
    case 'POHNameRpt':
        getPageData(searchParms, pagingType);
        //SMData = getPagePOHNameData(searchParms, pagingType);
        break;
    case 'BusOrgClientRpt':
        getPageData(searchParms, pagingType);
        //SMData = getPageBusOrgClientData(searchParms, pagingType);
        break;
    case 'FinRpt':
        getPageData(searchParms, pagingType);
        //SMData = getPagePrivateFundingSMData(searchParms, pagingType);
        break;
    default:
        bootbox.alert('not implemented yet');
    }
    */

}


function columnWidths() {
    var rptCols = rptColumns[gblSelectedReport].Cols;
    var widths = [];

    for (var i = 0; i < rptCols.length; i++) {
        widths.push(rptColumnHdrs[rptCols[i].column].size);
    }
    return widths;
}
function addHeaders() {

    var addhdrs = [];

    var rptCols = rptColumns[gblSelectedReport].Cols;
    for (var i = 0; i < rptCols.length; i++) {
         addhdrs.push({text: rptColumnHdrs[rptCols[i].column].header, style: 'tableheader'});
    }

    return addhdrs;
}


/***
1) We don't want to report all rows (4000+) as it will be too long.
  --> if a search was performed, report all
  --> in - A-Z Listing, report current page
  --> in a numeric listing, show current page

*/
function generatePDF() {

    if (gblCurrentSMData.searchResultVOs === null) { bootbox.alert('There is no data to report.'); return;}
    var dt = new Date();
    var dd = {};
    dd.pageSize = 'LEGAL';
    dd.pageOrientation = 'landscape';
    dd.footer = function(currentPage, pageCount) { 
		var ft = [];
		//ft.push({columns: [{text: 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=cf1fb7537e35f310VgnVCM10000071d60f89RCRD', style: 'footertext', margin: [15,0,0,0]}, {text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', style: 'footertext', margin: [0,0,15,0] }] });
		ft.push({columns: [{text: '375 University Avenue, Suite 201,', style: 'footertext', margin: [20,0,0,0]}] });
		ft.push({columns: [{text: 'Toronto, Ontario M5G 2J5 | 416-338-5858', style: 'footertext', margin: [20,0,0,0]}, {text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', style: 'footertext', margin: [0,0,20,0] }] });
		ft.push({columns: [{text: 'lobbyistregistrar@toronto.ca', style: 'footertext', margin: [20,0,0,0] }, {text: '' + moment().format('LLLL'), alignment: 'right', style: 'footertext', margin: [0,0,20,0] }] });
		
		return ft; 
	
	};
    dd.header = {columns: [ {image: 'logo', width: 160, margin: [0,20,0,10]}, {text: 'Office of the Lobbyist Registrar', margin: [0,20,20,0], style: 'headertext'} ] };
    dd.pageMargins = [20, 70, 20, 60];
    dd.styles = {};
    dd.styles.reporttitle = {fontSize: 28,bold: true, alignment: 'center', color: "#000000", margin: [0,70,0,20]};
    dd.styles.measuretitle = {fontSize: 16,bold: true, alignment: 'left', color: "#000000", margin: [0,0,0,10], pageBreak: 'before'};
    dd.styles.rpttable = {margin: [0,0,0,15]};
    dd.styles.reportdate = {fontSize: 16, bold: true, alignment: 'center' };
    dd.styles.cmo = {fontSize: 20, bold: true, alignment: 'center' };
    dd.styles.headertext = {fontSize: 12, color: "#aaa", alignment: "right", width: '50%'};
    dd.styles.tableheader = {fontSize: 8, color: "#000", alignment: "center", fillColor: '#eeeeee'};
    dd.styles.footertext = {color: "#aaa", fontSize: 8};
    dd.styles.datasource = {fontSize: 10, alignment: 'left', margin: [0,10,0,10]};
    dd.styles.termsheader = {fontSize: 16, bold: true, margin: [50, 500, 50,10]};
    dd.styles.termstext = {fontSize: 10, margin: [50, 0, 100,0]};
    dd.styles['N/A'] = {fillColor: '#eee'};

    dd.styles.tblcol = {margin: [0,0,0,0],fontSize: 8};

    dd.images = {};
    //dd.images.logo = 'data:image/png;base64,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';
    dd.images.logo = 'data:image/png;base64,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';
	
    dd.content = [];
    dd.content.push({text: 'Toronto\'s Lobby Registry',style: 'reporttitle'});
    dd.content.push({text: 'Lobbyist Report (PDF)',style: 'cmo'});
    //dd.content.push({text: arrMM[dt.getMonth()] + " " + dt.getDate() + ", " + dt.getFullYear(),style: 'reportdate'});
    dd.content.push({text: 'Terms of Use Disclaimer', style: 'termsheader'});
    dd.content.push({text: 'This portion of the City of Toronto web site is being used for the purpose of disclosure of information contained in the City\'s Lobbyist Registry System (the "System") under Chapter 140, Lobbying, of the City of Toronto Municipal Code. This site is being made available to allow members of the public to readily obtain information regarding the activities of lobbyists involved in lobbying the City of Toronto.', style: 'termstext'});
    dd.content.push({text: 'Users of this portion of the City of Toronto web site should be aware of the following:', style: 'termstext'});
    dd.content.push({text: "(i) Despite the Lobbyist Registrar's authority to verify and clarify the information submitted to the System, it is the lobbyists' exclusive responsibility to ensure that all submitted information is accurate and correct and the information submitted by lobbyists to the System may be posted as received; and", style: 'termstext'});
    dd.content.push({text: 'ii) The City of Toronto provides the System on an "as is", "as available", basis. The City does not make any express or implied warranties, representations or endorsements with respect to the system, including but not limited to, warranties as to usefulness, completeness, accuracy and reliability and the City will not accept any responsibility for data improperly entered. In addition, the City does not represent and warrant that the system will be available or meet your requirements, that access will be uninterrupted, that there will be no delays, failures or errors or omissions or loss of transmitted information, that no viruses or other contaminating or destructive properties will be transmitted or that no damage will occur to your computer system. As a user of the System, you accept sole responsibility for adequate protection and backup of your data, hardware and software and to take reasonable and appropriate precautions against viruses and other contaminating or destructive properties.', style: 'termstext'});

    var tbl = {};
        tbl.style = 'rpttable';
        tbl.table = {};
        //table widths must match columns or js error
        tbl.table.widths = columnWidths(); //['*', '*', 100, '*', '*', 100, '*','*'];
        tbl.table.headerRows = 1;
        tbl.table.body = [];
        tbl.table.body[0] = [];

        $.merge(tbl.table.body[0],addHeaders());

        dd.content.push({text: 'Lobbyist Report',style: 'measuretitle', pageBreak: 'before'});

    //var dataSource = this[rptColumns[gblSelectedReport].DataSource];
    var rowcnt = 1;
    $.each(gblCurrentSMData.searchResultVOs, function(x, SM) {

        tbl.table.body[rowcnt] = [];

        for (var i = 0; i < rptColumns[gblSelectedReport].Cols.length; i++) {
            switch(rptColumns[gblSelectedReport].Cols[i].column) {
                case 'SMLLobbyist':
                    tbl.table.body[rowcnt].push({text: SM.lobbyistName || "", style: 'tblcol'});
                    break;
                case 'SMLLobbyistNames':
                    tbl.table.body[rowcnt].push({text: SM.lobbyistList , style: 'tblcol'});
                    break;
                case 'SMLPOHName':
                    tbl.table.body[rowcnt].push({text: SM.pohName || "", style: 'tblcol'});
                    break;
                case 'SMLPOHNameTitle':
                    tbl.table.body[rowcnt].push({text: SM.pohNameOrTitle || "", style: 'tblcol'});
                    break;                  
                case 'SMLPOHPosition':
                    tbl.table.body[rowcnt].push({text: SM.pohPosition || "", style: 'tblcol'});
                    break;
                case 'SMLPOHType':
                    tbl.table.body[rowcnt].push({text: SM.pohType || "", style: 'tblcol'});
                    break;
                case 'SMLFinContributor':
                    tbl.table.body[rowcnt].push({text: SM.financialContributor || "", style: 'tblcol'});
                    break;
                case 'SMLFinContributors':
                    tbl.table.body[rowcnt].push({text: SM.financialContributors.join(", "), style: 'tblcol'});
                    break;
                case 'SMLLobbyistType':
                     tbl.table.body[rowcnt].push({text: SM.lobbyistType || "", style: 'tblcol'});
                    break;
                case 'SMLBeneficiary':
                    tbl.table.body[rowcnt].push({text: SM.beneficiaryName || "", style: 'tblcol'});
                    break;
                case 'SMLBeneficiaries':
                    tbl.table.body[rowcnt].push({text: SM.beneficiaries.join(", "), style: 'tblcol'});
                    break;
                case 'SMLBusOrg':
                    tbl.table.body[rowcnt].push({text: SM.businessOrganization || "", style: 'tblcol'});
                    break;
                case 'SMLClient':
                    tbl.table.body[rowcnt].push({text: SM.client || "", style: 'tblcol'});
                    break;
                case 'SMLSubjectMatter':
                    tbl.table.body[rowcnt].push({text: SM.subjectMatter || "", style: 'tblcol'});
                    break;
                case 'SMLStatus':
                    tbl.table.body[rowcnt].push({text: SM.status || "", style: 'tblcol'});
                    break;
                case 'SMLInitFileDate':
                    tbl.table.body[rowcnt].push({text: SM.InitialApprovalDate || "", style: 'tblcol'});
                    break;
                case 'SMLCommMethod':
                    tbl.table.body[rowcnt].push({text: SM.communicationMethod || "", style: 'tblcol'});
                    break;
                case 'SMLCommDate':
                    tbl.table.body[rowcnt].push({text: SM.communicationDate || "", style: 'tblcol'});
                    break;
                case 'SMLRequestMeeting':
                    tbl.table.body[rowcnt].push({text: SM.requestMeeting || "", style: 'tblcol'});
                    break;
                case 'SMLResultOfMeetingRequest':
                    tbl.table.body[rowcnt].push({text: SM.resultOfMeetingRequest || "", style: 'tblcol'});
                    break;
                case 'SMLDateOfRequest':
                    tbl.table.body[rowcnt].push({text: SM.dateOfRequest || "", style: 'tblcol'});
                    break;
                case 'SMLSubjectMatterNo':
                    tbl.table.body[rowcnt].push({text: SM.subjectMatterNumber || "", style: 'tblcol'});
                    break;
                case 'SMLLobRegNo':
                    tbl.table.body[rowcnt].push({text: SM.lobbyistRegistrationNumber || "", style: 'tblcol'});
                    break;
            }

        }

        rowcnt++;
        });

        dd.content.push( tbl );

    //pdfMake.createPdf(dd).open();
    pdfMake.createPdf(dd).download("Lobby Registry Data.pdf");
}

/* fix column data as required. Anything with a comma should be place in double quotes. In fact why not do for all clumns this way. */
function escColumn(colData) {
    return '"' + colData + '"';
}
function generateExcel() {
    if (gblCurrentSMData.searchResultVOs === null) { bootbox.alert('There is no data to report.'); return;}
    var csv_cols = [], csv_out;

    var rptCols = rptColumns[gblSelectedReport].Cols;
    for (var i = 0; i < rptCols.length; i++) {
        csv_cols.push(rptColumnHdrs[rptCols[i].column].header);
    }
    csv_out = csv_cols.join(",")+"\r\n";


   $.each(gblCurrentSMData.searchResultVOs, function(x, SM) {
       csv_cols = [];

        for (var i = 0; i < rptColumns[gblSelectedReport].Cols.length; i++) {
            switch(rptColumns[gblSelectedReport].Cols[i].column) {
                case 'SMLLobbyist':
                    csv_cols.push(escColumn(SM.lobbyistName));
                    break;
                case 'SMLLobbyistNames':
                    csv_cols.push(escColumn(SM.lobbyistList ));
                    break;
                case 'SMLPOHName':
                    csv_cols.push(escColumn(SM.pohName));
                    break;
                case 'SMLPOHNameTitle':
                    csv_cols.push(escColumn(SM.pohNameOrTitle));
                    break;                  
                case 'SMLPOHPosition':
                    csv_cols.push(escColumn(SM.pohName));
                    break;
                case 'SMLPOHType':
                    csv_cols.push(escColumn(SM.pohType));
                    break;
                case 'SMLFinContributor':
                    csv_cols.push(escColumn(SM.financialContributor));
                    break;
                case 'SMLFinContributors':
                    csv_cols.push(escColumn(SM.financialContributors.join(", ")));
                    break;
                case 'SMLLobbyistType':
                    csv_cols.push(escColumn(SM.lobbyistType));
                    break;
                case 'SMLBeneficiary':
                    csv_cols.push(escColumn(SM.beneficiaryName));
                    break;
                case 'SMLBeneficiaries':
                    csv_cols.push(escColumn(SM.beneficiaries.join(", ")));
                    break;
                case 'SMLBusOrg':
                    csv_cols.push(escColumn(SM.businessOrganization));
                    break;
                case 'SMLClient':
                    csv_cols.push(escColumn(SM.client));
                    break;
                case 'SMLSubjectMatter':
                     csv_cols.push(escColumn(SM.subjectMatter));
                    break;
                case 'SMLStatus':
                    csv_cols.push(escColumn(SM.status));
                    break;
                case 'SMLInitFileDate':
                    csv_cols.push(escColumn(SM.InitialApprovalDate));
                    break;
               case 'SMLCommMethod':
                     csv_cols.push(escColumn(SM.communicationMethod));
                    break;
                case 'SMLCommDate':
                     csv_cols.push(escColumn(SM.communicationDate));
                    break;
                case 'SMLRequestMeeting':
                     csv_cols.push(escColumn(SM.requestMeeting));
                    break;
                case 'SMLResultOfMeetingRequest':
                     csv_cols.push(escColumn(SM.resultOfMeetingRequest));
                    break;
                case 'SMLDateOfRequest':
                     csv_cols.push(escColumn(SM.dateOfRequest));
                    break;
                    
                case 'SMLSubjectMatterNo':
                    csv_cols.push(escColumn(SM.subjectMatterNumber));
                    break;
                case 'SMLLobRegNo':
                    csv_cols.push(escColumn(SM.lobbyistRegistrationNumber));
                    break;
                }
        }
        csv_out += csv_cols.join(",")+"\r\n";
    });

    var browser = navigator.userAgent;
    var IEversion = 99;
    if (browser.indexOf("MSIE") > 1) {IEversion = parseInt(browser.substr(browser.indexOf("MSIE")+5, 5),10);}
    if (IEversion < 10) {
        bootbox.alert("You are using an old version of Internet Explorer that does not allow for file export.  Please upgrade to a more up to date browser in order to use this feature.");
    } else {
        var blob = new Blob([csv_out], {type: 'text/csv;charset=utf-8'});
        if (navigator.msSaveBlob) {  //ie 10+
            navigator.msSaveBlob(blob, "Lobby Registry Data.csv")
        } else {
            var url  = window.URL || window.webkitURL;
            var link = document.createElementNS("http://www.w3.org/1999/xhtml", "a");
            link.href = url.createObjectURL(blob);
            link.download = "Lobby Registry Data.csv";
            var event = document.createEvent("MouseEvents");
            event.initEvent("click", true, false);
            link.dispatchEvent(event);
        }
    }
}

function mergeAddress (addr1, addr2, cityProv, countryPostal) {
    var addr = {};

    addr.Line =  escapeHtml(addr1);
    addr.Line += ( escapeHtml(addr2) ? "<br>" +  escapeHtml(addr2) : "");
    addr.CityProv =  escapeHtml(cityProv);
    addr.PostCty =  escapeHtml(countryPostal);
    //baddr.Phone = addr.Phone;
    addr.Addr =  escapeHtml(addr.Line);
    addr.Addr += ( escapeHtml(addr.CityProv) ? "<br>" +  escapeHtml(addr.CityProv) : "");
    addr.Addr += (  escapeHtml(addr.PostCty) ? "<br>" +  escapeHtml(addr.PostCty) : "");

    return addr;

}

/*
----------------------------------------------------------------------------------
These routines to fill the details page(s)
we use searchString for highlighting text.. used a different method for highlighting.. quicker
----------------------------------------------------------------------------------
*/

function fillDetails(item, SMId, LRId, searchStr) {
    $("#BackTo").prop("href","/wps/portal/contentonly?vgnextoid=" + listGUID);
    setUpDetailEvents();
    
    if (LRId !== null) {
        $("#headerText").text("Lobbyist Details");
    } else {
        $("#headerText").text("Subject Matter Details");
    }

    if ($.isEmptyObject(item)){
        bootbox.alert('detail record unexpectedly mising');
        return;
    }

    /* hide all elements that are specific to a particular SM type, then unhide the ones we want. */
    $(".SMIn-house").hide();
    $(".SMVoluntary").hide();
    $(".SMConsultant").hide();
    $(".SM" + item.lobbyistType).show();

    detailSingleItems(item);
    detailLobbyists(item);
    detailOtherBeneficiariaries(item);
    detailFinancialContributors(item);
    detailGovFunding(item);
    detailGrassRoots(item);
    detailCommitteeMeetings(item);
    detailCommitees(item);
    detailCommunications(item);

    var highlightOpts = {separateWordSearch : true};
    $("#appDisplay").jmHighlight(searchStr, highlightOpts);
}

function detailSingleItems(item) {
    var props = ['subjectMatterNumber','subjectMatterStatus','subjectMatterInitialApprovalDate','subjectMatterRecentApprovalDate','subjectMatter',
        'subjectMatterDecisionIssue','subjectMatterStartDate',
        'lobbyistName','lobbyistRegistrationNumber','lobbyistRegistrationStatus','lobbyistType','lobbyistPositionTitle','lobbyistRegistrationMostRecentApprovalDate',
        'lobbyistPhone','lobbyistPrevPubOfficeHolder',
        'businessOrganizationName','businessOtherTradeName','businessType','businessFiscalStartDate','businessDescription',
        'clientName','clientOtherTradeName'
        ];
    
    for (var idx = 0; idx < props.length; idx++) {
        $("."+props[idx]).text(item[props[idx]]);
    }
    
    if (item.subjectMatterEndDate) {
        $(".subjectMatterEndDate").text(" to " + item.subjectMatterEndDate);
    }
    
    if (item.businessFiscalEndDate) {
        $(".businessFiscalEndDate").text(" to " + item.businessFiscalEndDate);
    }   

    if (typeof item.subjectMatterNumber !== 'undefined') {
        $("#smRegAccordion").show();
    } else {
        $("#smRegAccordion").hide();
    }

    if (typeof item.subjectMatter !== 'undefined') {
        $("#smAccordion").show();        
    } else {
         $("#smAccordion").hide();
    }

    var baddr = mergeAddress(item.businessAddress, item.businessAddress2, item.businessCityProvince, item.businessCountryPostalCode);
    $(".businessAddress").html(baddr.Addr);
    if (item.lobbyistAddress) {
        var laddr = mergeAddress(item.lobbyistAddress, item.lobbyistAddress2, item.lobbyistCityProvince, item.lobbyistCountryPostalCode);
        $(".lobbyistAddress").html(laddr.Addr);
    }
    if (item.clientName) {
        var caddr = mergeAddress(item.clientAddress, item.clientAddress2, item.clientCityProvince, item.clientCountryPostalCode);
        $(".clientAddress").html(caddr.Addr);
        $("#clientAccordion").show();
    } else {
        $("#clientAccordion").hide();
    }

    //TODO: Buysiness Phone????
    //-$(".R_Phone").html(SM.Registrant.BusinessAddress.Phone);

    if (typeof item.businessOrganizationName !== 'undefined') {
        $("#boAccordion").show();
    } else {
        $("#boAccordion").hide();
    }

}

function detailLobbyists(item) {
    var strRows = "";
    var cnt = 1;    
    if (typeof item.inhouseLobbyistList !== 'undefined' && item.inhouseLobbyistList.length > 0) {
        strRows += "<tr><td>&nbsp;</td></tr>";
        
        $.each(item.inhouseLobbyistList, function (idx, l) {
            var laddr = mergeAddress(l.inhouseLobbyistAddress, l.inhouseLobbyistAddress2, l.inhouseLobbyistCityProvince, l.inhouseLobbyistCountryPostalCode);
            strRows += "<tr class='labelRow'><td>" + cnt + ". In-house Lobbyist's Name</td>";
            strRows += "<td>Lobbyist Registration Number</td>";
            strRows += "<td>    Position title</td>";
            strRows += "</tr>";
            strRows += "<tr><td>" + escapeHtml(l.inhouseLobbyistName)  + "</td>";
            strRows += "<td>" +  escapeHtml(l.inhouseLobbyistRegistrationNumber) + "</td>";
            strRows += "<td>" +  escapeHtml(l.inhouseLobbyistPositionTitle) + "</td>";
            strRows += "</tr>";
            strRows += "<tr class='labelRow'><td>Business Address</td>";
            strRows += "<td>Phone</td>";
            //strRows += "<td>City, Province</td>"
            //strRows += "<td>Country, Postal Code</td>"
            strRows += "</tr>";

            strRows += "<tr><td>" +  laddr.Addr + "</td>";
            strRows += "<td>" +  escapeHtml(l.inhouseLobbyistTelephone) + "</td>";
            strRows += "</tr>";
            strRows += "<tr class='labelRow'>";
            strRows += "<td colspan='3' >Has this in-house lobbyist held a senior public office position with the City of Toronto in the past 12 months?</td>";
            strRows += "</tr>";
            //strRows += "<td>" + l.Phone + "</td>"
            strRows += "<td colspan='2'>" +  escapeHtml(l.inhouseLobbyistPrevPubOfficeHolder) + "</td>";
            strRows += "</tr>";
            cnt++;
        });
        $("#SMLSection").find("tbody").html(strRows); //.trigger('update');
        $("#smlAccordion").show();
    } else {
        $("#smlAccordion").hide();
    }
    
}
function detailOtherBeneficiariaries(item) {
    var strRows = "";
    var cnt = 1;
    if (typeof item.otherBeneficiaryList !== 'undefined' && item.otherBeneficiaryList.length > 0) {
        $.each(item.otherBeneficiaryList, function (idx, ben) {
            var baddr = mergeAddress(ben.beneficiaryAddress, ben.beneficiaryAddress2, ben.beneficiaryCityProvince, ben.beneficiaryCountryPostalCode);
            strRows += "<tr class='labelRow'><td>" + cnt + ". " +  ben.beneficiaryType + "</td>"; 
            strRows += "<td>Other Trade Names</td>";
            strRows += "<td>Address</td>";
            strRows += "</tr>";
            strRows += "<tr><td>" +  escapeHtml(ben.beneficiaryName)  + "</td>";
            strRows += "<td>" +  escapeHtml(ben.beneficiaryOtherTradeName) + "</td>";
            strRows += "<td>" +  baddr.Addr + "</td>";
            strRows += "</tr>";
            cnt++;
        });
        $("#OtherBeneficiariesSection").find("tbody").html(strRows);
        $("#othbAccordion").show();
    } else {
        $("#othbAccordion").hide();
    }
}
function detailFinancialContributors(item) {
    var strRows ="";
    if (typeof item.financialContributionList !== 'undefined' && item.financialContributionList.length > 0) {
        var pfs = item.financialContributionList;
		strRows += "<tr class='labelRow'><td>Contributor</td><td>Contact Name</td></tr>";
        
        for ( var i = 0; i < pfs.length; i++) {
            strRows += "<tr><td>" + (i +1) + ". " +  escapeHtml(pfs[i].financialContributor) + "</td>";
            if (pfs[i].contactName !== "") {
                strRows += "<td>" +  escapeHtml(pfs[i].contactName) + "</td>";
            }
            strRows += "</tr>";
        }
        $("#PrivateFundingSection").find("tbody").html(strRows);
        $("#pfAccordion").show();
    } else {
        $("#pfAccordion").hide();
    }   
    
}
function detailGovFunding(item){
    var strRows ="";
    if (typeof item.gmtFundingList !== 'undefined' && item.gmtFundingList.length > 0) {    
        $.each(item.gmtFundingList, function ( idx, gf) {
            strRows += "<tr><td>" + (idx + 1) + ". " +  escapeHtml(gf.governmentName) + ", " +  escapeHtml(gf.departmentProgramName) + "</td></tr>";
        });
        $("#GovernmentFundingSection").find("tbody").html(strRows);
        $("#gfAccordion").show();
    } else {
        $("#gfAccordion").hide();
    }
}

function detailGrassRoots(item) {
    var strRows ="";
    if (typeof item.grassRootsCommunicationList !== 'undefined' && item.grassRootsCommunicationList.length > 0) {
        $.each(item.grassRootsCommunicationList, function (idx, gr) {
            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr><td>" +  escapeHtml(gr.grassRootCommunity) + "</td>";
            strRows += "<td>" +  escapeHtml(gr.grassRootTarget) +  "</td>";
            strRows += "<td>" +  escapeHtml(gr.grassRootStartDate) + " to " +  escapeHtml(gr.grassRootEndDate) + "</td>";
            strRows += "</tr>";

        });
        $("#GrassRootsSection").find("tbody").html(strRows);
        $("#grAccordion").show();
    } else {
        $("#grAccordion").hide();
    }
    
}
function detailCommunications(item) {
    var strRows ="";
    var detailCommunicationsFound = false;
    if (typeof item.inhouseLobbyistCommunicationMethodList !== 'undefined' && item.inhouseLobbyistCommunicationMethodList.length > 0) {
        $.each(item.inhouseLobbyistCommunicationMethodList, function (idx, lcm) {
            detailCommunicationsFound = true;
            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr><td colspan='10'><b>" +  escapeHtml(lcm.inHouseLobbyistNameAndRegistrationNumber) + "</b></td>";
            strRows += "</tr>";
			strRows += "<tr class='detailMiniHdr'><td class='col-md-2'>Public Office Holder Type</td>";
            strRows += "<td class='col-md-2'>Name or Position Title</td>";
            strRows += "<td class='col-md-2'>Ward, Office, Division or Agency</td>";
            strRows += "<td class='col-md-1'>Communication Date</td>";
            strRows += "<td class='col-md-1'>Communication Methods Used</td>";
            strRows += "<td class='col-md-1'>Request a Meeting</td>";
            strRows += "<td class='col-md-2'>Result of Request</td>";
            strRows += "<td class='col-md-1'>Date of Request</td>";
            strRows += "</tr>";
            $.each(lcm.pohCommunicationMethodList, function (idx, pohcomm) {
                    strRows += "<tr><td class='col-md-2'>" +  escapeHtml(pohcomm.pohType) + "</td>";
                    strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.pohNameOrTitle) + "</td>";
                    strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.pohOfficeName) + "</td>";
                    strRows += "<td class='col-md-1'>" +  escapeHtml(pohcomm.communicationDate) + "</td>";
                    strRows += "<td class='col-md-1'>" +  pohcomm.communicationMethod + "</td>";
                    strRows += "<td class='col-md-1'>" +  pohcomm.requestMeeting + "</td>";
                    strRows += "<td class='col-md-2'>" +  pohcomm.resultOfMeetingRequest + "</td>";
                    strRows += "<td class='col-md-1'>" +  pohcomm.dateOfRequest + "</td>";
                    strRows += "</tr>";
            });
        });
       $("#CommunicationsSection").find("tbody").html(strRows);
    }

    /* For volunatry or consultant, the list is not inhouselobbyist related */
    if (typeof item.pohCommunicationMethodList !== 'undefined' && item.pohCommunicationMethodList.length > 0) {
			strRows += "<tr class='detailMiniMajorHdr'><td class='col-md-2'>Public Office Holder Type</td>";
            strRows += "<td class='col-md-2'>Name or Position Title</td>";
            strRows += "<td class='col-md-2'>Ward, Office, Division or Agency</td>";
            strRows += "<td class='col-md-1'>Communication Date</td>";
            strRows += "<td class='col-md-1'>Communication Methods Used</td>";
            strRows += "<td class='col-md-1'>Request a Meeting</td>";
            strRows += "<td class='col-md-2'>Result of Request</td>";
            strRows += "<td class='col-md-1'>Date of Request</td>";			
            strRows += "</tr>";	
        $.each(item.pohCommunicationMethodList, function (idx, pohcomm) {
            detailCommunicationsFound = true;
            strRows += "<tr><td class='col-md-2'>" +  escapeHtml(pohcomm.pohType) + "</td>";
            strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.pohNameOrTitle) + "</td>";
            strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.pohOfficeName) + "</td>";
            strRows += "<td class='col-md-1'>" +  escapeHtml(pohcomm.communicationDate) + "</td>";
            strRows += "<td class='col-md-1'>" +  pohcomm.communicationMethod + "</td>";
            strRows += "<td class='col-md-1'>" +  pohcomm.requestMeeting + "</td>";
            strRows += "<td class='col-md-2'>" +  pohcomm.resultOfMeetingRequest + "</td>";
            strRows += "<td class='col-md-1'>" +  pohcomm.dateOfRequest + "</td>";			
            strRows += "</tr>";
        });
        $("#CommunicationsSection").find("tbody").html(strRows); //.trigger('update');
    }

    if (detailCommunicationsFound) {
        $("#pohAccordion").show();
    } else {
        $("#pohAccordion").hide();
    }
    
}
function detailCommitteeMeetings(item) {
    var j = 0;
    var strRows ="";
    var oneFound = false;
    if (item.meetingList && item.meetingList.length > 0) {

        $.each(item.meetingList, function( idx, meet) {

            strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr class='labelRow'><td>" +  escapeHtml(meet.committeeName) + "</td></tr>";
            strRows += "<tr><td>Meeting Date: " +  escapeHtml(meet.meetingDate) + "</td></tr>";
            strRows += "<tr><td>&nbsp;</td></tr>";

            if (typeof meet.attendeeCommitteeMemberList !== 'undefined' && meet.attendeeCommitteeMemberList) {
                oneFound = false;
                var commMembers = meet.attendeeCommitteeMemberList;
                for ( j = 0; j < commMembers.length; j++) {
                    if(!oneFound) {
                        strRows += "<tr class='labelRow'><td>Commitee Members in Attendance</td></tr>";
                        oneFound = true;
                    }
                    strRows += "<tr><td class='CommListIndent'>" +  escapeHtml(commMembers[j]) + "</td></tr>";
                }
            }


            strRows += "<tr><td>&nbsp;</td></tr>";
            if (typeof meet.attendeeInhouseLobbyistList !== 'undefined' && meet.attendeeInhouseLobbyistList) {
                var lobbyists = meet.attendeeInhouseLobbyistList;
                oneFound = false;
                for (j = 0; j < lobbyists.length; j++) {
                    if(!oneFound) {
                        strRows += "<tr class='labelRow'><td>In-house Lobbyists in Attendance</td></tr>";
                        oneFound = true;
                    }
                    strRows += "<tr><td class='CommListIndent'>" +  escapeHtml(lobbyists[j]) +")</td></tr>";
                }
            }
            
            if (typeof meet.attendeePOHList !== 'undefined' &&  meet.attendeePOHList) {
                strRows += "<tr><td>&nbsp;</td></tr>";
                strRows += "<tr class='labelRow'><td>Public Office Holders in Attendance</td></tr>";
                strRows += "<tr class='labelRow'><td>Type</td>";
                strRows += "<td>Name or Position Title</td>";
                strRows += "<td>Ward, Office, Division or Agency</td>";
                strRows += "</tr>";
                var pohs = meet.attendeePOHList;
                    for (j = 0; j < pohs.length; j++) {
                        strRows += "<tr><td>" +  escapeHtml(pohs[j].pohType) + "</td>";
                        strRows += "<td>" +  escapeHtml(pohs[j].pohNameOrTitle) + "</td>";
                        strRows += "<td>" +  escapeHtml(pohs[j].pohOfficeName) + "</td>";
                        strRows += "</tr>";
                    }
                }
        });

        $("#MeetingsSection").find("tbody").html(strRows);
        $("#meetAccordion").show();
    } else {
        $("#meetAccordion").hide();
    }
}

function detailCommitees(data) {
    var strRows ="";
    if (typeof data.committeeList !== "undefined" && data.committeeList.length > 0) {
      // $("#committeeHeader").text("Committees of the Organization");
        for (var i = 0; i < data.committeeList.length; i++) {
            var commitee = data.committeeList[i];
            //strRows += "<tr><td>&nbsp;</td></tr>";
            strRows += "<tr class='labelRow'><td>" +  escapeHtml(commitee.committeeName) + "</td></tr>";
            //strRows += "<tr><td>&nbsp;</td></tr>";

            if (typeof commitee.committeeMemberList !== "undefined") {
                for (var j = 0; j < commitee.committeeMemberList.length; j++) {
                    var member = commitee.committeeMemberList[j];
                    if (j === 0) {
                        strRows += "<tr class='labelRow'><td class='CommListIndent'>Commitee Members</td></tr>";
                    }
                    strRows += "<tr><td class='CommListIndent'>" +  escapeHtml(member) + "</td></tr>";
                }
            }
        }
        $("#CommitteeSection").find("tbody").html(strRows).trigger('update');
        $("#committeeAccordion").show();
    } else {
        $("#committeeAccordion").hide();
    }

}

function loadListing() {
    var strCode="";
    if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="css/lobbySearch.css">';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="js/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/placeholders.jquery.js"></script>';
        strCode += '<script type="text/javascript"  src="js/bootbox.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/vfs_fonts.js"></script>';
        $("#appCode").html(strCode);
        $("#appDisplay").load('html/lobbyListing.html', function() {initApp();});
    } else {
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry3/css/lobbySearch.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/bootbox/bootbox.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/jquery.placeholder.min.js"></script>';
        strCode += '<script type="text/javascript"  src="/static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="/static_files/assets/pdfmake/vfs_fonts.js"></script>';

        $("#appCode").html(strCode);
        $("#appDisplay").load('/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry3/html/lobbyListing.html', function() {initApp();});
    }
}

function loadDetail(jsonData, SMId, LRId, searchStr) {
   var strCode="";
   if (document.location.hostname.length === 0) {
        strCode += '<link rel="stylesheet" href="css/SMDetail.css">';
        strCode += '<link rel="stylesheet" href="js/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="static_files/assets/css/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="http://netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<script type="text/javascript" src="static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="js/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/jquery.jmHighlight.min.js"></script>';
        //strCode += '<script type="text/javascript" src="/placeholders/placeholders.min.js"></script>';
        strCode += '<script type="text/javascript"  src="js/bootbox.min.js"></script>';
        strCode += '<script type="text/javascript" src="js/placeholders.jquery.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/pdfmake.min.js"></script>';
        strCode += '<script type="text/javascript"  src="static_files/assets/pdfmake/vfs_fonts.js"></script>';


        $("#appCode").html(strCode);
        $("#appDisplay").load('html/SMDetail.html', function() {fillDetails(jsonData, SMId, LRId, searchStr);});
   } else {
        strCode += '<link rel="stylesheet" href="/datepicker/datepicker.css">';
        strCode += '<link rel="stylesheet" href="/static_files/assets/multiselect/bootstrap-multiselect.css">';
        strCode += '<link rel="stylesheet" href="/tablesorter/css/theme.blue.css">';
        strCode += '<link rel="stylesheet" href="//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css">';
        strCode += '<link rel="stylesheet" href="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry3/css/SMDetail.css">';
        strCode += '<script type="text/javascript" src="/static_files/assets/multiselect/bootstrap-multiselect.js"></script>';
        strCode += '<script type="text/javascript" src="/datepicker/bootstrap-datepicker.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/datepicker/moment-with-locales.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/typeahead.bundle.js"></script>';
        strCode += '<script type="text/javascript" src="/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry2/js/jquery.bootpag.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/highlights/jquery.jmHighlight.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/bootbox/bootbox.min.js"></script>';
        strCode += '<script type="text/javascript" src="/static_files/assets/placeholders/jquery.placeholder.min.js"></script>';

        $("#appCode").html(strCode);
        $("#appDisplay").load('/City%20Of%20Toronto/Sandbox/Steve/LobbyRegistry3/html/SMDetail.html', function() {fillDetails(jsonData, SMId, LRId, searchStr);});

    }
}
function getDetailData(SMNumber, SMId, LRNumber, searchStr) {

    $.support.cors = true;
    var strURL = APP_ENV + SM_DETAIL_DATA_URL.replace("<SMID>", SMId);
    $.ajax({
        type: 'GET',
        url: strURL,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            if (data.length === 0) {
                bootbox.alert('detail record unexpectedly mising');
            } else {
                loadDetail(data,SMId,null,searchStr);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
            bootbox.alert('detail record unexpectedly mising');
            }
    });
}

function showSMData(SMNumber, SMId, searchStr) {
    getDetailData(SMNumber, SMId, null, searchStr);
}

function showLRData(LRNumber, LRId, searchStr) {
    $.support.cors = true;
    var strURL = APP_ENV + LR_DETAIL_DATA_URL.replace("<LRID>", LRId);
    $.ajax({
        type: 'GET',
        url: strURL,
        crossDomain: true,
        dataType: 'json',
        success: function (data) {
            if (data.length === 0) {
                bootbox.alert('detail record unexpectedly mising');
            } else {
                loadDetail(data,null,LRId,searchStr);
            }
        },
        error: function (xhr, ajaxOptions, thrownError) {
            console.log(xhr.status);
            console.log(thrownError);
            bootbox.alert('detail record unexpectedly mising');
            }
    });
    //getDetailData(SMNumber, LRNumber, searchStr);
}

$( document ).ready(function() {

    if  (gblAllowEnvSwitch && typeof(Storage) !== "undefined") {
        var prevState = localStorage.getItem(LS_KEY_APP_ENV);
        if (prevState) {
            try{
                var state = JSON.parse( prevState);
                APP_ENV = state.env;
            }catch(e){
                //ignore error
            }
        }
    } 
    
    var qsSM = $.QueryString.SM;
    var qsSMId = $.QueryString.SMId;
    var qsLRId = $.QueryString.LRId;
    var qsSearchStr = $.QueryString.searchStr;
    listGUID = $.QueryString.vgnextoid;
    if (qsLRId) {
        showLRData(qsSM, qsLRId,qsSearchStr);
    } else if (qsSM) {
        showSMData(qsSM,qsSMId, qsSearchStr);
    } else {
        $("#listLoader").modal('show');
        loadListing();
    }
});

}());