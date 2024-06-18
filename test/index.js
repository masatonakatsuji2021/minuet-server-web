"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple Server Test Sample
const __1 = require("../");
const http = require("http");
const mw = new __1.MinuetWeb({
    // root directory
    rootDir: "htdocs",
    // 404 not found HTML file.
    notFound: "error.html",
    // response header 
    headers: {
        // cache control (keep max 60s)
        "cache-control": "max-age=60,",
    },
    // directory indexs
    directoryIndexs: ["index.html"],
    // list navigator
    listNavigator: true,
});
// server listen
const h = http.createServer((req, res) => {
    // static content listen
    const status = mw.listen(req, res);
});
h.listen(1505);
console.log("Listen http://localhost:1505");
