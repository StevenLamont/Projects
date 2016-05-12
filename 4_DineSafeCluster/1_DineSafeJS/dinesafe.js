
/* ==================================================
 * window.console OBJECT
 *  - If the browser does not handle console.log(), ignore it
 * ================================================== */

window.console = window.console || { log: function() {} };


/* ==================================================
 * tph.dinesafe NAMESPACE
 * ================================================== */

window.tph = window.tph || {};

tph.dinesafe = tph.dinesafe || {};


/* ==================================================
 * tph.dinesafe.config OBJECT
 * ================================================== */

tph.dinesafe.config = tph.dinesafe.config || {};

tph.dinesafe.config.dinesafeAlertGroup = 'DNSF';
tph.dinesafe.config.fusionTableId = '1O6xNSVIpvADT-oX0W9FS41u6Wr-PDg6Ddqm6R-ve'; // dinesafe_fusion_data.csv
// tph.dinesafe.config.fusionTableId = '1t8Lvz2APt_-jLzET9qW_G6OuPTE904Z53g9jm1s'; // dinesafe_fusion_data2.csv

/* TEMPORARY SOLUTION */
// tph.dinesafe.config.fusionTableId = '1cq9fYP71CSYIOsATCPI5rSl3g3cDPYlxZBV2Kno';

tph.dinesafe.config.maximumInfoWindowEstablishment =  50;

// URLs

tph.dinesafe.config.alertsURL    = 'http://app.toronto.ca/alerts/alert.json';
tph.dinesafe.config.complaintURL = 'https://secure.toronto.ca/dinesafe/complaint.html';
tph.dinesafe.config.dataTableEstablishmentsURL = 'https://secure.toronto.ca/dinesafe/dataTableEstablishments.json';
tph.dinesafe.config.getEstablishmentDetailURL  = 'https://secure.toronto.ca/dinesafe/getEstablishmentDetails.json';
tph.dinesafe.config.lastUpdatedDateURL      = 'https://secure.toronto.ca/dinesafe/getMetadata.json';
tph.dinesafe.config.searchEstablishmentsURL = 'https://secure.toronto.ca/dinesafe/searchEstablishments.json';

