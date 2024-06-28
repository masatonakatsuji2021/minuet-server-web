// Simple Server Test Sample
import { MinuetWeb } from "../";
import * as http from "http";

const mw = new MinuetWeb({

    // root directory
    rootDir: {
        "/": "htdocs",
        "/2": "htdocs2",
    },

    // 404 not found HTML file.
    notFound:  "error.html",

    // direct reading ()
    directReading: true,

    // buffering max size (150KB)
    bufferingMaxSize: 150000,

    // response header 
    headers : {
        // cache control (keep max 60s)
        "cache-control":"max-age=60,",
    },
    // directory indexs
    directoryIndexs: [ "index.html" ],

    // list navigator
    listNavigator: true,
});

// server listen
const h = http.createServer((req, res)=>{
    // static content listen
    const status = mw.listen(req, res);
});
h.listen(1505);
console.log("Listen http://localhost:1505");