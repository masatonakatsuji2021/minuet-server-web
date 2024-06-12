/**
 * MIT License
 * 
 * Copyright (c) 2024 Masato Nakatsuji
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as fs from "fs";
import * as path from "path";
import { IncomingMessage, ServerResponse } from "http";

/**
 * ***DefaultMimes*** : Default MimeType List
 */
export const DefaultMimes = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/jig",
    tif: "image/tiff",
    tiff: "image/tiff",
    svg: "image/svg+xml",
    ico: "image/vnd.microsoft.icon",
    mp3: "audio/mp3",
    aac: "audio/aac",
    txt: "text/plain",
    css: "text/css",
    js : "text/javascript",
    html: "text/html",
    htm: "text/html",
    xml: "text/xml",
    woff: "font/woff",
    woff2 : "font/woff2",
    ttf: "font/ttf",
    zip: "application/zip",
    bz: "application/x-bzip",
    gz: "application/gzip",
    "7z": "application/x-7z-compressed",
    csv: "text/csv",
};

export interface MinuetWebOption {
    /**
     * ***url*** : Subdirectory URL to be published on the server.
     */
    url? : string;

    /**
     * ***rootDir*** : Root directory to deploy as a server.  
     * If not specified, ``htdocs`` is used as the root directory.
     */
    rootDir? : string,

    /**
     * ***mimes*** : List of MIMETypes allowed for deployment by the server.  
     * If not specified, ***DefaultMimes*** will be applied.
     */
    mimes?: Object,

    /**
     * ***headers*** : Response header information.
     */
    headers?: Object,

    /**
     * ***buffering*** : Setting whether to buffer server data.  
     * (The default is ``true``.)
     * 
     * If you select ``true``, when you instantiate or execute the ``setting`` method,  
     * a set of files in the root directory with access permissions for each MimeType will be buffered.  
     * When listening from now on, it will be loaded from the buffer.  
     * 
     * This is done as part of the speedup.  
     * Even if a file in the root directory is changed, the display results will not be updated when listening.
     * 
     * If you select ``false``, no buffer will be created and the file will be loaded every time you listen.  
     */
    buffering? : boolean,

    /**
     * ***bufferingMaxSize*** : Maximum size of buffered file.  
     * (The default is 8MB.)
     */
    bufferingMaxSize? : number,

    /**
     * ***directReading*** : When ``buffering`` is set to ``true``,    
     * this setting determines whether to load and output files   
     * that are not in the buffer but are in the root directory.   
     * (The default is ``false``.)
     */
    directReading? : boolean,

    /**
     * ***notFound** : Settings when the accessed URL (file) does not exist.  
     * Can be specified as a boolean (return value of the ``listen`` method)   
     * or a string (display page file for 404 not Found).  
     * (The default is ``false``.)
     */
    notFound? : string | boolean,
}

/**
 * ### MinuetWeb
 * A class for listening to a web server for static content.  
 * By combining it with modules such as http, you can easily deploy a static web server.  
 * 
 * Here is a simple example:
 * ```typescript
 * import * as http from "http";
 * import { MinuetWeb } from "minuet-web";
 * 
 * const mw = new MineutWeb();
 * // If you do not specify rootDir,   
 * // the 'htdocs' in the root directory will be automatically buffered   
 * // and made available as static content.
 * 
 * const h = http.createServer((req, res) => {
 *      mw.listen(req, res);
 * });
 * h.listen(8000);
 * ```
 */
export class MinuetWeb {

    /**
     * ***url*** : Subdirectory URL to be published on the server.
     */
    public url : string = "/";

    /**
     * ***rootDir*** : Root directory to deploy as a server.  
     * If not specified, ``htdocs`` is used as the root directory.
     */
    public rootDir : string = "htdocs";

    /**
     * ***mimes*** : List of MIMETypes allowed for deployment by the server.  
     * If not specified, ***DefaultMimes*** will be applied.
     */
    public mimes : Object = DefaultMimes;

    /**
     * ***headers*** : Response header information.
     */
    public headers : Object = {};

    /**
     * ***buffering*** : Setting whether to buffer server data.  
     * (The default is ``true``.)
     * 
     * If you select ``true``, when you instantiate or execute the ``setting`` method,  
     * a set of files in the root directory with access permissions for each MimeType will be buffered.  
     * When listening from now on, it will be loaded from the buffer.  
     * 
     * This is done as part of the speedup.  
     * Even if a file in the root directory is changed, the display results will not be updated when listening.
     * 
     * If you select ``false``, no buffer will be created and the file will be loaded every time you listen.  
     */
    public buffering : boolean = true;

    /**
     * ***bufferingMaxSize*** : Maximum size of buffered file.  
     * (The default is 8MB.)
     */
    public bufferingMaxSize : number =  8000000;

    /**
     * ***directReading*** : When ``buffering`` is set to ``true``,    
     * this setting determines whether to load and output files   
     * that are not in the buffer but are in the root directory.   
     * (The default is ``false``.)
     */
    public directReading : boolean = false;

    /**
     * ***notFound** : Settings when the accessed URL (file) does not exist.  
     * Can be specified as a boolean (return value of the ``listen`` method)   
     * or a string (display page file for 404 not Found).  
     * (The default is ``false``.)
     */
    public notFound : string | boolean= false;

    private buffers = {};

    /**
     * ***constructor*** : If options are specified, it behaves the same as the setting method.  
     * If ``buffering`` is set to ``true``, the buffer will be created automatically.
     * @param {MinuetWebOption} options Minuet Web Option
     */
    public constructor(options? : MinuetWebOption) {
        if (options) {
            this.setting(options);
        }
        else {
            this.updateBuffer();
        }
    }

    /**
     * ### setting
     * For setting server option information  
     * Mainly used to reset to new option information
     * @param {MinuetWebOption} options Minuet Web Option
     * @returns 
     */
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

    /**
     * ***updateBuffer*** : Methods for updating buffer information.  
     * Reloads the set of target files from the root directory and updates the buffer information. 
     * @returns {MinuetWeb} 
     */
    public updateBuffer() : MinuetWeb {
        if (this.buffering){
            this.search(this.rootDir);
            if (typeof this.notFound == "string"){
                const content = fs.readFileSync(this.notFound.toString());
                this.buffers["#notfound"] = content;
            }
        }
        return this;
    }

    /**
     * ***addBuffer*** : Access URL and add buffer from file content.
     * @param {string} filePath Access File URL
     * @param {Buffer} content Contents
     * @returns {MinuetWeb}
     */
    public addBuffer(filePath : string, content : Buffer) : MinuetWeb {
        const fileName = (this.url + filePath.substring(this.rootDir.length)).split("//").join("/");
        this.buffers[fileName] = content;
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

    // How to deal with errors (404 not found).
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

    /**
     * ***listen*** : Proxy processing when the server listens.
     * Here, based on the request URL,   
     * buffer information or a file from the root directory is loaded,  
     * and judgment processing or response control is performed.
     * @param {IncomingMessage} req http.IncomingMessage
     * @param {ServerResponse} res http.ServerResponse
     * @returns {boolean} judgment result
     */
    public listen(req :IncomingMessage, res : ServerResponse ) : boolean {
        const url = (req.url.split("?")[0]);
        let content;
        if (!this.buffers[url]){
            if (!this.directReading) return this.error(res);
            if (!this.existFile(url)) return this.error(res);
        }
        content = this.readFile(url);

        res.statusCode = 200;
        this.headers["content-type"] = this.getMime(url);
        this.setHeader(res);
        res.write(content);
        res.end();

        return true;
    }
}