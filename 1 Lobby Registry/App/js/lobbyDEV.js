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
var gblAllowEnvSwitch = false;
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
                        {column: 'SMLStatus', cls: '', style: 'width: 70px', label: 'Status', title: 'Subject Matter Registration  Status'},
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 90px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
                        
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.',  title: 'Subject Matter Registration No.'}
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
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
                        {column: 'SMLSubjectMatterNo', cls: '', style: 'width: 95px;white-space: normal;', label: 'Subject Matter No.', title: 'Subject Matter Registration No.'}
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
                flt.val(prevState.filters[filter]);
                flt.multiselect("refresh");
            } else {
                flt.val(prevState.filters[filter]);
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

function boldSeniorOfficer(str) {
    var l = str.split(",");
    var retStr = "";
    for (var i = 0; i <l.length; i++) {
        if ( i === 0 ) {
            retStr = "<b>" + l[0] + "</b>";
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

    $(".columnSelect").each(function( index ) {
        if(this.id !== null && this.selectedOptions && this.selectedOptions.length != this.options.length) {
            filterText += toTitleCase(this.id).replace('Filter','') + " : ";
            var filterValues = "";

            for (var i = 0; i < this.selectedOptions.length; i++) {
                filterText += this.selectedOptions[i].label + ", ";
                filterValues  += this.selectedOptions[i].value + ",";
                URLParms += "&" + this.selectedOptions[i].value + "=true";
            }
            filterText =filterText.slice(0,-2);
            filterValues =filterValues.slice(0,-1);
            gblFilters[this.id] = filterValues;
            filterText += "<br>";
            advSearch = true;
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
                strRows += '<td class="' + rptCols[i].cls + '" style="' + rptCols[i].style + '">' +  highlightSearch(boldSeniorOfficer(escapeHtml(SM.lobbyistList)),hfOpts) + "</td>";
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
    dd.footer = function(currentPage, pageCount) { return {columns: [{text: 'http://www1.toronto.ca/wps/portal/contentonly?vgnextoid=cf1fb7537e35f310VgnVCM10000071d60f89RCRD', style: 'footertext', margin: 15}, {text: currentPage.toString() + ' of ' + pageCount, alignment: 'right', style: 'footertext', margin: 15 }] }; };
    dd.header = {columns: [ {image: 'logo', width: 80, margin: [0,20,0,10]}, {text: 'Office of the Lobbyist Registrar', margin: [0,20,20,10], style: 'headertext'} ] };
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
    dd.styles.termsheader = {fontSize: 12, bold: true, margin: [50, 500, 50,0]};
    dd.styles.termstext = {fontSize: 8, margin: [50, 0, 100,0]};
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
            var laddr = mergeAddress(l.inhouseLobbyistAddress, l.inhouseLobbyist2, l.inhouseLobbyistCityProvince, l.inhouseLobbyistCountryPostalCode);
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
        
        for ( var i = 0; i < pfs.length; i++) {
            strRows += "<tr><td>" + (i +1) + ". " +  escapeHtml(pfs[i].financialContributor) + "</td>";
            if (pfs[i].contactName !== "") {
                strRows += "<td><b>Contact:</b> " +  escapeHtml(pfs[i].contactName) + "</td>";
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
            $.each(lcm.pohCommunicationMethodList, function (idx, pohcomm) {
                    strRows += "<tr><td class='col-md-2'>" +  escapeHtml(pohcomm.pohType) + "</td>";
                    strRows += "<td class='col-md-3'>" +  escapeHtml(pohcomm.pohNameOrTitle) + "</td>";
                    strRows += "<td class='col-md-3'>" +  escapeHtml(pohcomm.pohOfficeName) + "</td>";
                    strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.communicationDate) + "</td>";
                    strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.communicationMethod) + "</td>";
                    strRows += "</tr>";
            });
        });
       $("#CommunicationsSection").find("tbody").html(strRows);
    }

    /* For volunatry or consultant, the list is not inhouselobbyist related */
    if (typeof item.pohCommunicationMethodList !== 'undefined' && item.pohCommunicationMethodList.length > 0) {
        $.each(item.pohCommunicationMethodList, function (idx, pohcomm) {
            detailCommunicationsFound = true;
            strRows += "<tr><td class='col-md-2'>" +  escapeHtml(pohcomm.pohType) + "</td>";
            strRows += "<td class='col-md-3'>" +  escapeHtml(pohcomm.pohNameOrTitle) + "</td>";
            strRows += "<td class='col-md-3'>" +  escapeHtml(pohcomm.pohOfficeName) + "</td>";
            strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.communicationDate) + "</td>";
            strRows += "<td class='col-md-2'>" +  escapeHtml(pohcomm.communicationMethod) + "</td>";
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
            strRows += "<tr><td>Meeting Date " +  escapeHtml(meet.meetingDate) + "</td></tr>";
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