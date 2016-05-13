/* 
We schedule these function. There are currently 1141 records
The order of the scheduled items should follow below.
If allowed, the split could run concurrently.
We'd schedule these appropriately each morning or night and space them to avoid conflicts.
*/

function RunCreateCoreData() {
  createCoreData();
}

function RunSplit1() {
  splitOrgDataFile(0, 300);
}
function RunSplit2() {
  splitOrgDataFile(301, 600);
}
function RunSplit3() {
  splitOrgDataFile(601, 900);
}
function RunSplit4() {
  splitOrgDataFile(901, 1200);
}

function RunCreateSearchData() {
  createSearchData();
}
