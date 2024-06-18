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
import { MinuetServerModuleBase, MinuetServerSector } from "minuet-server";

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

    /**
     * ***directoryIndexs*** : Specifies a list of files to display for a directory request.
     */
    directoryIndexs? : Array<string>,

    /**
     * ***listNavigator*** : Determines whether to display the file/directory list screen when a directory area is specified in the URL.  
     * Displays the list screen when there is no content to display in the URL to the directory.  
     * The default is ``false``.
     */
    listNavigator?: boolean, 
}

enum MinuetWebBufferName {
    notFound = "#notfound",
    listNavigator = "#listNavigator",
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

    /**
     * ***directoryIndexs*** : Specifies a list of files to display for a directory request.
     */
    public directoryIndexs : Array<string> = [];

    /**
     * ***listNavigator*** : Determines whether to display the file/directory list screen when a directory area is specified in the URL.  
     * Displays the list screen when there is no content to display in the URL to the directory.  
     * The default is ``false``.
     */
    public listNavigator?: boolean = false;

    private buffers = {};
    private directoryBuffers = [];

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
        if (options.directoryIndexs != undefined) this.directoryIndexs = options.directoryIndexs;
        if (options.listNavigator != undefined) this.listNavigator = options.listNavigator;
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
            this.buffers = {};
            this.directoryBuffers = [ "/" ];
            this.search(this.rootDir);
            if (typeof this.notFound == "string"){
                const content = fs.readFileSync(this.notFound.toString());
                this.buffers[MinuetWebBufferName.notFound] = content;
            }
            if (this.listNavigator){
                const content = fs.readFileSync(__dirname + "/listnavigator/index.html");
                this.buffers[MinuetWebBufferName.listNavigator] = content;
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
        const target = targetPath;
        const list = fs.readdirSync(target, {
            withFileTypes: true,
        });
        for (let n = 0 ; n < list.length ; n++){
            const l_ = list[n];

            if (l_.isDirectory()){
                this.directoryBuffers.push((targetPath + "/" + l_.name).substring(this.rootDir.length).split("//").join("/"));
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
                notFoundPath = MinuetWebBufferName.notFound;
            }
            const content = this.readFile(notFoundPath);
            res.statusCode = 404;
            res.write(content);
            res.end();
            return true;
        }
    }

    private getUrl(baseUrl: string) : string {
        const url = baseUrl.split("?")[0];
        let urlList = [];
        urlList.push(url);
        for (let n = 0 ; n < this.directoryIndexs.length ; n++){
            const index = this.directoryIndexs[n];
            urlList.push((url + "/" + index).split("//").join("/"));
        }

        let decisionUrl : string;
        for (let n = 0 ; n < urlList.length ; n++){
            const url_ = urlList[n];;
            if (this.directReading) {
                const exists = fs.existsSync(this.rootDir + "/" + url_);
                if (exists) {
                    decisionUrl = url_;
                    break;                   
                }
             }
             else {
                if(this.buffers[url_]){
                    decisionUrl = url_;
                    break;
                }                    
             }
        }

        return decisionUrl;        
    }

    private getDirectories(url : string) {
        let res = [];

        if (this.buffering) {
            for (let n = 0 ; n < this.directoryBuffers.length ; n++) {
                const dir = this.directoryBuffers[n];

                if (dir.indexOf(url) == 0 && dir != url) {
                    if (dir.substring(url.length).split("/").length == 2) {
                        res.push(dir);
                    }
                }
            }

            const bc = Object.keys(this.buffers);
            for (let n = 0 ; n < bc.length ; n++) {
                const file = bc[n];

                if (file.indexOf(url) == 0) {
                    if (file.substring(url.length).split("/").length == 2) {
                        res.push(file);
                    }
                }
            }
        }
        else {
            // comming soon...
        }

        return res;
    }

    private isDirectory(req :IncomingMessage, res : ServerResponse) : boolean {
        let url = req.url.split("?")[0];
        if (url[url.length - 1] == "/") {
            url = url.substring(0, url.length - 1);
        }
        if (this.buffering){
            if (this.directoryBuffers.indexOf(url) === -1){
                return false;
            }

            let content = this.buffers[MinuetWebBufferName.listNavigator].toString();
            content = content.split("{url}").join(url);
            content = content.split("{back}").join(path.dirname(url));
            const list = this.getDirectories(url);
            let listStr = "";
            for (let n = 0 ; n < list.length ; n++) {
                const l_ = list[n];
                const td = "<tr><td>-</td><td><a href=\"" + l_ + "\">" + path.basename(l_) + "</a></td></tr>";
                listStr += td;
            }
            content = content.split("{lists}").join(listStr);
            const d_ = new Date();
            const nowDate = d_.getFullYear() + "/" + ("0" + (d_.getMonth() + 1)).slice(-2) + "/" + ("0" + d_.getDate()).slice(-2)
                            + " " + ("0" + d_.getHours()).slice(-2) + ":" + ("0" + d_.getMinutes()).slice(-2) + ":" + ("0" + d_.getSeconds()).slice(-2);
            content = content.split("{comment}").join("Minuet Server | " + nowDate);
            res.write(content);
            res.end();
        }
        else {
            // comming soon...
        }

        return true;
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
        const url0 = req.url.split("?")[0];
        let url = this.getUrl(url0);
        if (!url){
            if (this.listNavigator && this.isDirectory(req, res)){
                return true
            }
            return this.error(res);
        }
        let content = this.readFile(url);

        res.statusCode = 200;
        this.headers["content-type"] = this.getMime(url);
        this.setHeader(res);
        res.write(content);
        res.end();

        return true;
    }
}

export class MinuetServerModuleWeb extends MinuetServerModuleBase {
    
    public mse : MinuetWeb;

    public onBegin(){
        if (!this.init) {
            this.init = {};
        }
        this.init.rootDir = this.sector.root + "/" + this.init.rootDir,
        this.mse = new MinuetWeb(this.init);
    }

    public async onRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
        return await this.mse.listen(req, res);
    }

}