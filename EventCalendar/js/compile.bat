java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarController.js --js_output_file eventCalendarController.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarDataService.js --js_output_file eventCalendarDataService.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarRoutes.js --js_output_file eventCalendarRoutes.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarUtilService.js --js_output_file eventCalendarUtilService.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarCache.js --js_output_file eventCalendarCache.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js eventCalendarApp.js --js_output_file eventCalendarApp.min.js  >>complile.txt 2>&1

pause