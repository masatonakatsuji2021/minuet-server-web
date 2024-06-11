import { MinuetWeb } from "../";
import * as http from "http";

const mw = new MinuetWeb({
    headers : {
        "cache-control":"max-age=60",
    }
});

const h = http.createServer((req, res)=>{
    mw.listen(req, res);
});
h.listen(1505);