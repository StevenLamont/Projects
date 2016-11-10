java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js ngCoTSubmit.js --js_output_file ngCoTSubmit.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js ngCoTGoogleMapUtils.js --js_output_file ngCoTGoogleMapUtils.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js ngCoTThumb.js --js_output_file ngCoTThumb.min.js  >>complile.txt 2>&1

java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js ngCoTLogin.js --js_output_file ngCoTLogin.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js ngCoTNotify.js --js_output_file ngCoTNotify.min.js  >>complile.txt 2>&1
pause