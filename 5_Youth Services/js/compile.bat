java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js youthServices.js --js_output_file youthServices.min.js  >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js pdfmakeHTMLConverter.js --js_output_file pdfmakeHTMLConverter.min.js >>complile.txt 2>&1
java -jar "C:\SML\nodejs\node_modules\compiler.jar" --compilation_level SIMPLE_OPTIMIZATIONS --js pdfmake.js --js_output_file pdfmake.min.js >>complile.txt 2>&1
pause