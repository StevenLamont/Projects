var LocationLookup = function () {
	this.wcmURLPrefix = '//www1.toronto.ca/wps/portal/contentonly?vgnextoid=';
	this.apiWARDURLPrefix = '//map.toronto.ca/geoservices/rest/search/rankedsearch?searchString=';
	this.apiWARDURLSuffix = '&searchArea=1&matchType=1&projectionType=1&retRowLimit=10';
	this.apiNEIGHBOURURL1Prefix = '//gis.toronto.ca/arcgis/rest/services/primary/cot_geospatial_webm/MapServer/265/query?where=&text=&objectIds=&time=&geometry=';
	this.apiNEIGHBOURURL2Prefix = '//gis.toronto.ca/arcgis/rest/services/secondary/cot_geospatial_webm/MapServer/265/query?where=&text=&objectIds=&time=&geometry=';
	this.apiNEIGHBOURURLSuffix = '&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&relationParam=&outFields=AREA_ID%2CAREA_SHORT_CODE%2CAREA_NAME&returnGeometry=false&maxAllowableOffset=&geometryPrecision=&outSR=3857&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&returnTrueCurves=false&resultOffset=&resultRecordCount=&f=pjson';
	this.results = [];
	this.wardGUIDS = {
1: 'd8b9be4436161410VgnVCM10000071d60f89RCRD',
2: 'abd9be4436161410VgnVCM10000071d60f89RCRD',
3: '991abe4436161410VgnVCM10000071d60f89RCRD',
4: '833abe4436161410VgnVCM10000071d60f89RCRD',
5: '434abe4436161410VgnVCM10000071d60f89RCRD',
6: '664abe4436161410VgnVCM10000071d60f89RCRD',
7: '884abe4436161410VgnVCM10000071d60f89RCRD',
8: 'aa4abe4436161410VgnVCM10000071d60f89RCRD',
9: 'fc4abe4436161410VgnVCM10000071d60f89RCRD',
10: 'fab9be4436161410VgnVCM10000071d60f89RCRD',
11: '1db9be4436161410VgnVCM10000071d60f89RCRD',
12: '3fb9be4436161410VgnVCM10000071d60f89RCRD',
13: '51c9be4436161410VgnVCM10000071d60f89RCRD',
14: '73c9be4436161410VgnVCM10000071d60f89RCRD',
15: '95c9be4436161410VgnVCM10000071d60f89RCRD',
16: 'b7c9be4436161410VgnVCM10000071d60f89RCRD',
17: 'eac9be4436161410VgnVCM10000071d60f89RCRD',
18: '64d9be4436161410VgnVCM10000071d60f89RCRD',
19: '08d9be4436161410VgnVCM10000071d60f89RCRD',
20: 'cdd9be4436161410VgnVCM10000071d60f89RCRD',
21: '71e9be4436161410VgnVCM10000071d60f89RCRD',
22: '88e9be4436161410VgnVCM10000071d60f89RCRD',
23: 'abf9be4436161410VgnVCM10000071d60f89RCRD',
24: '9ff9be4436161410VgnVCM10000071d60f89RCRD',
25: 'e50abe4436161410VgnVCM10000071d60f89RCRD',
26: '980abe4436161410VgnVCM10000071d60f89RCRD',
27: '4d0abe4436161410VgnVCM10000071d60f89RCRD',
28: '511abe4436161410VgnVCM10000071d60f89RCRD',
29: 'f51abe4436161410VgnVCM10000071d60f89RCRD',
30: '3d1abe4436161410VgnVCM10000071d60f89RCRD',
31: '9f1abe4436161410VgnVCM10000071d60f89RCRD',
32: 'b12abe4436161410VgnVCM10000071d60f89RCRD',
33: 'f32abe4436161410VgnVCM10000071d60f89RCRD',
34: '162abe4436161410VgnVCM10000071d60f89RCRD',
35: '382abe4436161410VgnVCM10000071d60f89RCRD',
36: '5a2abe4436161410VgnVCM10000071d60f89RCRD',
37: '7c2abe4436161410VgnVCM10000071d60f89RCRD',
38: '9e2abe4436161410VgnVCM10000071d60f89RCRD',
39: 'd03abe4436161410VgnVCM10000071d60f89RCRD',
40: '473abe4436161410VgnVCM10000071d60f89RCRD',
41: '693abe4436161410VgnVCM10000071d60f89RCRD',
42: 'ab3abe4436161410VgnVCM10000071d60f89RCRD',
43: 'ed3abe4436161410VgnVCM10000071d60f89RCRD',
44: '004abe4436161410VgnVCM10000071d60f89RCRD'
};
	this.neighbourhoodGUIDS = {
 1: '3325fc2beecb1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 2: '4d48861b9fdb1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 3: '16016bfbc0fb1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 4: '6de52a21591c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 5: '5db4133adc1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 6: '6487133adc1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 7: '6ab4b3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 8: 'b93a5674c52c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 9: '1c3c5674c52c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 10: 'd337606bc72c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 11: '218739220b2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 12: '10e90e32cc2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 13: 'a0000e32cc2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 14: '1d310e32cc2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 15: 'a6420e32cc2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 16: '95340e32cc2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 17: '0dff457bae2c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 18: '242facbae96c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 19: '4799c69a6b6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 20: '286bc69a6b6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 21: '0fccc69a6b6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 22: 'e3c5c69a6b6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 23: 'ac083f8a7d6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 24: 'ee003f8a7d6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 25: '43823f8a7d6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 26: '1669d5994f6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 27: '9d9bd5994f6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 28: '3192d5994f6c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 29: 'b6fa3a2f287c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 30: 'b8ebb425b3cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 31: '150719b125cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 32: 'f8195a9d96cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 33: '51cc5a9d96cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 34: '1bf35a9d96cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 35: '4238f57118cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 36: '51d7133adc1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 37: '4962358f09cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 38: 'a255358f09cd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 39: '41e885d32acd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 40: 'bacc85d32acd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 41: 'ae3285d32acd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 42: '919485d32acd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 43: '5d7685d32acd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 44: '3a0ac91a1ccd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 45: '3b4cc91a1ccd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 46: 'c31dc91a1ccd1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 47: 'ab921c03d90e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 48: '976ffe7a8c0e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 49: '43b1fe7a8c0e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 50: '51d7133adc1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD', 
 51: 'c70812ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 52: 'dd3812ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 53: 'd17812ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 54: '33a812ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 55: '32e812ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 56: '3d1912ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 57: '5d3912ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 58: '646912ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 59: 'df7912ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 60: '4ba912ceaf1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 61: 'cd3bb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 62: '586bb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 63: '568bb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 64: '12bbb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 65: 'a9ebb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 66: '741cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 67: 'd42cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 68: '604cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 69: '256cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 70: 'a28cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD', 
 71: '7c9cb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 72: '80ccb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 73: '3ddcb3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 74: '411db3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 75: 'b92db3d0122c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 76: '3cc5fe7a8c0e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 77: '4397fe7a8c0e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 78: 'df5bf322c21e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 79: '1c70f322c21e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 80: '5378d3cde41e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 81: '2c3bd3cde41e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 82: '1781d3cde41e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 83: 'd235d3cde41e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 84: '2f0bed1ea61e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 85: '2aa2ed1ea61e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 86: 'e744ed1ea61e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 87: 'ca56ed1ea61e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 88: '3b384074781e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 89: '22cf4074781e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 90: '06034074781e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 91: 'f9054074781e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 92: '94d91fcd6a1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 93: 'd64f1fcd6a1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 94: 'e1e31fcd6a1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 95: '50871fcd6a1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 96: '64ca88575b1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 97: '373e88575b1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 98: '474188575b1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 99: '77a688575b1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 100: 'a18c248a6c1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 101: '6964248a6c1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 102: '5bb8df065e1e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 103: 'ceb806bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 104: '69ab06bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 105: '8a1d06bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 106: 'c78f06bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 107: '1cd106bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 108: '352506bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 109: '2fe706bd9b5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 110: 'c2f5fbb8dc5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 111: '95c7fbb8dc5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 112: '6b3a38f41e5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 113: 'cb8c38f41e5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 114: 'd4de38f41e5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 115: '9ca238f41e5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 116: 'bdf438f41e5e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 117: '8152c998fa6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 118: '3d0a1a4acc6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 119: 'f10f1a4acc6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 120: '1a911a4acc6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 121: '2bd9addfbd6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 122: 'a67eaddfbd6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 123: '55a1addfbd6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 124: 'b487addfbd6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 125: '737ebb0bbe6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 126: 'f9f1bb0bbe6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 127: '5dc8a84c9f6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 128: '167ba84c9f6e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 129: '348cf5cf807e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 130: 'fdfef5cf807e1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 131: '2b592d31aaae1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 132: 'b654edb4bcae1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 133: '55df56cc0eae1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 134: '06f256cc0eae1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 135: '8a6932924bbe1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 136: '57db32924bbe1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 137: 'da5e32924bbe1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 138: 'ef6432924bbe1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 139: '338632924bbe1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD',
 140: '4f8a133adc1c1410VgnVCM10000071d60f89RCRD&vgnextchannel=1e68f40f9aae0410VgnVCM10000071d60f89RCRD'
  };
	this.codeSelector = '#appCode';
	this.displaySelector = '#appDisplay';
	this.resultsDisplaySelector = '#resultsDisplay';
	this.inputSelector = '#searchLocation';
}

LocationLookup.prototype.init = function () {
	var strCode = '<link rel="stylesheet" href="/static_files/WebApps/Location Lookup/files/locationlookup.css">';
	$( this.codeSelector ).html( strCode );
} 
LocationLookup.prototype.drawForm = function () {
	$( this.displaySelector ).html( "<div class='form-group form-box'> <label for='searchLocation' class='control-label'>Search by Location or Place: </label></span><input type='text' id='searchLocation' class='form-control' placeholder='Type in Address or Place Name'></input><div class='row'><button class='btn btn-primary pull-right btn-wl' id='action-button' onclick='kk.setCookie()'>Location Lookup</button></div></div>  <div id='resultsDisplay' class='clear'></div>");	
	$('#searchLocation').keydown( function(e) {
        var key = e.charCode ? e.charCode : e.keyCode ? e.keyCode : 0;
        if(key == 13) { kk.setCookie(); }
    });
	if (getCookie('nlookup')!="" && getCookie('nlookup') != null) { $("#searchLocation").val( decodeURIComponent(getCookie('nlookup')) ); this.getData(); }
}

LocationLookup.prototype.setCookie = function() {
	var strCookie = encodeURIComponent($( this.inputSelector ).val());
	document.cookie = "nlookup=" + strCookie + "; path=/";
	this.getData();
}

LocationLookup.prototype.getData = function( ) {
	this.results = [];
	$( this.resultsDisplaySelector ).html( "" );	
     var urlStr= this.apiWARDURLPrefix + getCookie('nlookup') + this.apiWARDURLSuffix;
     $.ajax({
         type: 'GET',
         url: urlStr,
		 ll: this,
         dataType: 'json',
         error: function(jqXHR, textStatus, errorThrown) {
             this.ll.processError.call(this.ll,jqXHR, textStatus, errorThrown);
         },
         dataType: 'jsonp',
         success: function (data) {
             this.ll.processWardData.call(this.ll, data);
         }         
     });
}
 
LocationLookup.prototype.processWardData = function(data) {
 
	this.wards = 
					$.merge(( data.result['bestResult'] ),
					$.merge(data.result['likelyResults'],
					data.result['restOfResults'] ));

	 if (this.wards.length==0)
		 {
			 this.results.length=0;
			 this.drawResults();
		}
	var key_Desc, ward, wardno, wardUrl;
	this.countprocessed = 0;
	this.countrequired = this.wards.length;
	var o = this;
    $.each(this.wards, function (i, item) {
		item.complete = $.Deferred();
		$.ajax({
			type: 'GET',
			url: o.apiNEIGHBOURURL1Prefix + item.longitude + '%2C' + item.latitude + o.apiNEIGHBOURURLSuffix,
			ll: o,
			llitem: item, 
			dataType: 'jsonp',
			error: function () {
					$.ajax({
						type: 'GET',
						url: this.ll.apiNEIGHBOURURL2Prefix + item.longitude + '%2C' + item.latitude + this.ll.apiNEIGHBOURURLSuffix,
						ll: this.ll,
						llitem: this.llitem,
						dataType: 'jsonp',
						error: function(jqXHR, textStatus, errorThrown) {
								this.ll.processError.call(this,jqXHR, textStatus, errorThrown);
						},
						success: function (data) {
							 this.ll.processNeighbourhoodData.call(this, data);
						}         
					});
			},
			success: function (data) {
				this.ll.processNeighbourhoodData.call(this, data);
			}         
		});
	});
}
 
LocationLookup.prototype.processNeighbourhoodData  = function (data) {
	this.ll.countprocessed++;
	var o = {};
	o.address = this.llitem.key_Desc;
	o.score = this.llitem.score;
	o.ward = this.llitem.detail;
	o.wardlink = (this.llitem.detail.match(/\((\d+)\)/)!=null) ? this.ll.wcmURLPrefix + this.ll.wardGUIDS[parseInt(this.llitem.detail.match(/\((\d+)\)/)[1])] : "";
	o.neighbourhood = data.features[0].attributes.AREA_NAME;
	o.neighbourhoodlink = (data.features[0].attributes.AREA_NAME.match(/\((\d+)\)/)!=null) ? this.ll.wcmURLPrefix + this.ll.neighbourhoodGUIDS[parseInt(data.features[0].attributes.AREA_NAME.match(/\((\d+)\)/)[1])] : "";
	if (o.wardlink != "" && o.neighbourhoodlink != "") {this.ll.results.push(o);}
	if (this.ll.countprocessed == this.ll.countrequired) {this.ll.drawResults();}	
}		 
LocationLookup.prototype.drawResults = function() {
	var strHTML = ""; strTmp = "";
	this.results = this.results.sort(SortByScore);
	
	if (this.results.length==0  )	 {
		$( this.resultsDisplaySelector ).html( "<p class='found'><b>No Result Found. </b>Please try again with <i>Street Number</i> and <i>Street Name</i>, or a <i>Place Name</i>. </p><hr>" );		
	} else	{
		$( this.resultsDisplaySelector ).html( "<p  class='found'>"+ this.results.length +" Results Found</p><hr>" );
	}
	$.each( this.results, function (i, item) {
		strHTML += '<section class="locationresult">';
			strHTML += '<div class="address">' + item.address + '</div>';
			strTmp = item.ward.substring(item.ward.indexOf("(") + 1, item.ward.indexOf( ")" )) + " - " + item.ward.substring(0, item.ward.indexOf(" ("));
			strHTML += '<ul><li><div class="ward"> Ward: <a title="Open the ward profile page" href="' + item.wardlink + '">' + strTmp + '</a></div></li>';
			strTmp = item.neighbourhood.substring(item.neighbourhood.indexOf("(") + 1, item.neighbourhood.indexOf( ")" )) + " - " + item.neighbourhood.substring(0, item.neighbourhood.indexOf(" ("));
			strHTML += '<li><div class="neighbourhood"> Neighbourhood: <a title="open the neighbourhood profile page" href="' + item.neighbourhoodlink + '">' + strTmp + '</a>  </div></li></ul>';
		strHTML += '</section>' ;
	})
	$( this.resultsDisplaySelector ).append( strHTML );	
}

LocationLookup.prototype.processError = function(jqXHR, textStatus, errorThrown) {
	$( this.resultsDisplaySelector ).html( textStatus + " " + errorThrown );
}
 
function SortByScore(a, b) {
      return b.score - a.score;
}

 
 