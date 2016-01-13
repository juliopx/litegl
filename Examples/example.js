// Copy example.html and style.css required by example.html in webpack
require('file?name=example.html!./static-files/example.html')
require('file?name=style.css!./static-files/style.css')

//require example script
require("./src/deferred.js")
