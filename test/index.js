"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const __1 = require("../");
const http = require("http");
const mw = new __1.MinuetWeb({
    notFound: "error.html",
    headers: {
        "cache-control": "max-age=60",
    }
});
const h = http.createServer((req, res) => {
    const status = mw.listen(req, res);
});
h.listen(1505);
console.log("Listen http://localhost:1505");
