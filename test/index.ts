import { MinuetWeb } from "../";
import * as http from "http";

const mw = new MinuetWeb({
    notFound:  "error.html",
    headers : {
        "cache-control":"max-age=60",
    }
});

const h = http.createServer((req, res)=>{
    const status = mw.listen(req, res);
});
h.listen(1505);

console.log("Listen http://localhost:1505");