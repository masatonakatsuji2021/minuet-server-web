import * as fs from "fs";
import * as path from "path";
import { IncomingMessage, ServerResponse } from "http";

export const DefaultMimes = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/jig",
    txt: "text/plain",
    css: "text/css",
    js : "text/javascript",
    html: "text/html",
};

export interface MinuetWebOption {
    rootDir? : string,

    mimes?: Object,

    headers?: Object,

    buffering? : boolean,

    bufferingMaxSize? : number,

    handle? : Function,
}

export class MinuetWeb {

    public rootDir : string = "htdocs";
    public mimes : Object = DefaultMimes;
    public headers : Object = {};
    public buffering : boolean = true;
    public bufferingMaxSize : number =  4000000;

    private buffers = {};

    public constructor(options? : MinuetWebOption) {
        if (options) {
            this.setting(options);
        }
        else {
            this.updateBuffer();
        }
    }

    public setting(options : MinuetWebOption) : MinuetWeb {
        if (options.rootDir != undefined) this.rootDir = options.rootDir;
        if (options.mimes != undefined) this.mimes = options.mimes;
        if (options.headers != undefined) this.headers = options.headers;
        if (options.buffering != undefined) this.buffering = options.buffering;        
        if (options.bufferingMaxSize != undefined) this.bufferingMaxSize = options.bufferingMaxSize;
        this.updateBuffer();
        return this;
    }

    public updateBuffer() : MinuetWeb {
        if (this.buffering){
            this.search(this.rootDir);
        }
        return this;
    }

    private search(targetPath : string) {
        this.buffers = {};
        const target = targetPath;
        const list = fs.readdirSync(target, {
            withFileTypes: true,
        });
        for (let n = 0 ; n < list.length ; n++){
            const l_ = list[n];

            if (l_.isDirectory()){
                this.search(targetPath + "/" + l_.name);
            }
            else {
                if (!this.hasMine(l_.name)) continue;
                const filePath = target + "/" + l_.name;
                if (fs.statSync(filePath).size > this.bufferingMaxSize) continue;
                const content = fs.readFileSync(filePath);
                const fileName = filePath.substring(this.rootDir.length);
                this.buffers[fileName] = content;
            }
        }
    } 

    private getMime(target : string) : string {
        const ext = path.extname(target).substring(1);
        return this.mimes[ext];
    }

    private hasMine(target : string) : boolean {
        const ext = path.extname(target).substring(1);
        if (!ext) return false;

        if (!this.mimes[ext]){
            return false;
        }
        
        return true;
    }

    private setHeader(res : ServerResponse) : void {
        const c = Object.keys(this.headers);
        for (let n = 0 ; n < c.length ; n++){
            const name = c[n];
            const value = this.headers[name];
            res.setHeader(name, value);
        }
    }

    public listen(req :IncomingMessage, res : ServerResponse ) : boolean {
        const url = req.url.split("?")[0];
        let content;
        if (!this.buffers[url]){
            return false;
        }
        else {
            content = this.buffers[url];
        }

        const mime = this.getMime(url);
        res.statusCode = 200;
        res.setHeader("content-type", mime);
        this.setHeader(res);
        res.write(content);
        res.end();

        return true;
    }
}