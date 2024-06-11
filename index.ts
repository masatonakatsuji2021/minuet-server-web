import * as fs from "fs";
import * as path from "path";
import { IncomingMessage, ServerResponse } from "http";

export const DefaultMimes = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/jig",
    mp3: "audio/mp3",
    txt: "text/plain",
    css: "text/css",
    js : "text/javascript",
    html: "text/html",
};

export interface MinuetWebOption {
    url? : string;

    rootDir? : string,

    mimes?: Object,

    headers?: Object,

    buffering? : boolean,

    bufferingMaxSize? : number,

    directReading? : boolean,

    handle? : Function,

    notFound? : string | boolean,
}

export class MinuetWeb {

    public url : string = "/";
    public rootDir : string = "htdocs";
    public mimes : Object = DefaultMimes;
    public headers : Object = {};
    public buffering : boolean = true;
    public bufferingMaxSize : number =  4000000;
    public directReading : boolean = false;
    public notFound : string | boolean= false;

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
        if (options.url != undefined) this.url = options.url;
        if (options.rootDir != undefined) this.rootDir = options.rootDir;
        if (options.mimes != undefined) this.mimes = options.mimes;
        if (options.headers != undefined) this.headers = options.headers;
        if (options.buffering != undefined) this.buffering = options.buffering;        
        if (options.bufferingMaxSize != undefined) this.bufferingMaxSize = options.bufferingMaxSize;
        if (options.directReading != undefined) this.directReading = options.directReading;
        if (options.notFound != undefined) this.notFound = options.notFound;
        this.updateBuffer();
        return this;
    }

    public updateBuffer() : MinuetWeb {
        if (this.buffering){
            this.search(this.rootDir);
            if (typeof this.notFound == "string"){
                const content = fs.readFileSync(this.notFound.toString());
                this.buffers["#notfound"] = content;
            }
        }
        console.log(this.buffers);
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
                this.addBuffer(filePath, content);
            }
        }
    } 

    public addBuffer(filePath : string, content : Buffer) : MinuetWeb {
        const fileName = (this.url + filePath.substring(this.rootDir.length)).split("//").join("/");
        this.buffers[fileName] = content;
        return this;
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

    private existFile(targetPath : string) : boolean {
        let targetFullPath = this.rootDir + "/" + targetPath;
        targetFullPath = targetFullPath.split("//").join("/");
        if (!fs.existsSync(targetFullPath)) {
            return false;
        }
        return true;
    }

    private readFile(targetPath : string) : Buffer | null  {
        if (this.buffering){
            return this.buffers[targetPath];
        }

        let targetFullPath = this.rootDir + "/" + targetPath;
        targetFullPath = targetFullPath.split("//").join("/");
        const content = fs.readFileSync(targetFullPath);
        return content;
    }

    private error(res: ServerResponse) : boolean {
        if (typeof this.notFound == "boolean") {
            if (!this.notFound) {
                return false;
            }
            res.statusCode = 404;
            res.end();
            return true;
        }
        else {
            let notFoundPath = this.notFound;
            if (this.buffering){
                notFoundPath = "#notfound";
            }
            const content = this.readFile(notFoundPath);
            res.statusCode = 404;
            res.write(content);
            res.end();
            return true;
        }
    }

    public listen(req :IncomingMessage, res : ServerResponse ) : boolean {
        const url = (req.url.split("?")[0]);
        let content;
        if (!this.buffers[url]){
            if (!this.directReading) return this.error(res);;
            if (!this.existFile(url)) return this.error(res);;
        }
        content = this.readFile(url);

        const mime = this.getMime(url);
        res.statusCode = 200;
        res.setHeader("content-type", mime);
        this.setHeader(res);
        res.write(content);
        res.end();

        return true;
    }
}