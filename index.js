"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinuetServerModuleWeb = exports.MinuetWeb = exports.DefaultMimes = void 0;
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
const fs = require("fs");
const path = require("path");
const minuet_server_1 = require("minuet-server");
/**
 * ***DefaultMimes*** : Default MimeType List
 */
exports.DefaultMimes = {
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
    js: "text/javascript",
    html: "text/html",
    htm: "text/html",
    xml: "text/xml",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    zip: "application/zip",
    bz: "application/x-bzip",
    gz: "application/gzip",
    "7z": "application/x-7z-compressed",
    csv: "text/csv",
};
var MinuetWebBufferName;
(function (MinuetWebBufferName) {
    MinuetWebBufferName["notFound"] = "#notfound";
    MinuetWebBufferName["listNavigator"] = "#listNavigator";
})(MinuetWebBufferName || (MinuetWebBufferName = {}));
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
class MinuetWeb {
    /**
     * ***constructor*** : If options are specified, it behaves the same as the setting method.
     * If ``buffering`` is set to ``true``, the buffer will be created automatically.
     * @param {MinuetWebOption} options Minuet Web Option
     */
    constructor(options) {
        /**
         * ***url*** : Subdirectory URL to be published on the server.
         */
        this.url = "/";
        /**
         * ***rootDir*** : Root directory to deploy as a server.
         * If not specified, ``htdocs`` is used as the root directory.
         */
        this.rootDir = "htdocs";
        /**
         * ***mimes*** : List of MIMETypes allowed for deployment by the server.
         * If not specified, ***DefaultMimes*** will be applied.
         */
        this.mimes = exports.DefaultMimes;
        /**
         * ***headers*** : Response header information.
         */
        this.headers = {};
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
        this.buffering = true;
        /**
         * ***bufferingMaxSize*** : Maximum size of buffered file.
         * (The default is 300KB. )
         */
        this.bufferingMaxSize = 300000;
        /**
         * ***directReading*** : When ``buffering`` is set to ``true``,
         * this setting determines whether to load and output files
         * that are not in the buffer but are in the root directory.
         * (The default is ``false``.)
         */
        this.directReading = false;
        /**
         * ***notFound** : Settings when the accessed URL (file) does not exist.
         * Can be specified as a boolean (return value of the ``listen`` method)
         * or a string (display page file for 404 not Found).
         * (The default is ``false``.)
         */
        this.notFound = false;
        /**
         * ***directoryIndexs*** : Specifies a list of files to display for a directory request.
         */
        this.directoryIndexs = [];
        /**
         * ***listNavigator*** : Determines whether to display the file/directory list screen when a directory area is specified in the URL.
         * Displays the list screen when there is no content to display in the URL to the directory.
         * The default is ``false``.
         */
        this.listNavigator = false;
        this.buffers = {};
        this.directoryBuffers = [];
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
    setting(options) {
        if (options.url != undefined)
            this.url = options.url;
        if (options.rootDir != undefined)
            this.rootDir = options.rootDir;
        if (options.mimes != undefined)
            this.mimes = options.mimes;
        if (options.headers != undefined)
            this.headers = options.headers;
        if (options.buffering != undefined)
            this.buffering = options.buffering;
        if (options.bufferingMaxSize != undefined)
            this.bufferingMaxSize = options.bufferingMaxSize;
        if (options.directReading != undefined)
            this.directReading = options.directReading;
        if (options.notFound != undefined)
            this.notFound = options.notFound;
        if (options.directoryIndexs != undefined)
            this.directoryIndexs = options.directoryIndexs;
        if (options.listNavigator != undefined)
            this.listNavigator = options.listNavigator;
        if (options.logAccess != undefined)
            this.logAccess = options.logAccess;
        this.updateBuffer();
        return this;
    }
    /**
     * ***updateBuffer*** : Methods for updating buffer information.
     * Reloads the set of target files from the root directory and updates the buffer information.
     * @returns {MinuetWeb}
     */
    updateBuffer() {
        if (this.buffering) {
            this.buffers = {};
            this.directoryBuffers = ["/"];
            this.search(this.rootDir);
            if (typeof this.notFound == "string") {
                const content = fs.readFileSync(this.notFound.toString());
                this.buffers[MinuetWebBufferName.notFound] = content;
            }
            if (this.listNavigator) {
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
    addBuffer(filePath, content) {
        const fileName = (this.url + filePath.substring(this.rootDir.length)).split("//").join("/");
        this.buffers[fileName] = content;
        return this;
    }
    search(targetPath) {
        const target = targetPath;
        const list = fs.readdirSync(target, {
            withFileTypes: true,
        });
        for (let n = 0; n < list.length; n++) {
            const l_ = list[n];
            if (l_.isDirectory()) {
                this.directoryBuffers.push((targetPath + "/" + l_.name).substring(this.rootDir.length).split("//").join("/"));
                this.search(targetPath + "/" + l_.name);
            }
            else {
                if (!this.hasMine(l_.name))
                    continue;
                const filePath = target + "/" + l_.name;
                if (fs.statSync(filePath).size > this.bufferingMaxSize)
                    continue;
                const content = fs.readFileSync(filePath);
                this.addBuffer(filePath, content);
            }
        }
    }
    getMime(target) {
        const ext = path.extname(target).substring(1);
        return this.mimes[ext];
    }
    hasMine(target) {
        const ext = path.extname(target).substring(1);
        if (!ext)
            return false;
        if (!this.mimes[ext]) {
            return false;
        }
        return true;
    }
    setHeader(res) {
        const c = Object.keys(this.headers);
        for (let n = 0; n < c.length; n++) {
            const name = c[n];
            const value = this.headers[name];
            res.setHeader(name, value);
        }
    }
    existFile(targetPath) {
        if (this.buffering) {
            if (this.buffers[targetPath]) {
                return true;
            }
            else {
                if (!this.directReading)
                    return false;
            }
        }
        let targetFullPath = this.rootDir + "/" + targetPath;
        if (this.url != "/") {
            targetFullPath = this.rootDir + "/" + targetPath.substring(this.url.length);
        }
        targetFullPath = targetFullPath.split("//").join("/");
        if (!fs.existsSync(targetFullPath)) {
            return false;
        }
        if (!fs.statSync(targetFullPath).isFile()) {
            return false;
        }
        return true;
    }
    readFile(targetPath) {
        if (this.buffering) {
            if (this.buffers[targetPath]) {
                return this.buffers[targetPath];
            }
        }
        let targetFullPath = this.rootDir + "/" + targetPath;
        if (this.url != "/") {
            targetFullPath = this.rootDir + "/" + targetPath.substring(this.url.length);
        }
        targetFullPath = targetFullPath.split("//").join("/");
        const content = fs.readFileSync(targetFullPath);
        return content;
    }
    // How to deal with errors (404 not found).
    error(res) {
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
            if (this.buffering) {
                notFoundPath = MinuetWebBufferName.notFound;
            }
            const content = this.readFile(notFoundPath);
            res.statusCode = 404;
            res.write(content);
            res.end();
            return true;
        }
    }
    getUrl(baseUrl) {
        const url = baseUrl.split("?")[0];
        let urlList = [];
        for (let n = 0; n < this.directoryIndexs.length; n++) {
            const index = this.directoryIndexs[n];
            urlList.push((url + "/" + index).split("//").join("/"));
        }
        let decisionUrl = baseUrl;
        for (let n = 0; n < urlList.length; n++) {
            const url_ = urlList[n];
            if (this.buffering) {
                if (this.buffers[url_]) {
                    decisionUrl = url_;
                    break;
                }
                if (!this.directReading)
                    continue;
            }
            const exists = fs.existsSync(this.rootDir + "/" + url_);
            if (exists) {
                decisionUrl = url_;
                break;
            }
        }
        return decisionUrl;
    }
    getDirectories(url) {
        let res = [];
        if (this.buffering) {
            for (let n = 0; n < this.directoryBuffers.length; n++) {
                const dir = this.directoryBuffers[n];
                if (dir.indexOf(url) == 0 && dir != url) {
                    if (dir.substring(url.length).split("/").length == 2) {
                        res.push(dir);
                    }
                }
            }
            const bc = Object.keys(this.buffers);
            for (let n = 0; n < bc.length; n++) {
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
    isDirectory(req, res) {
        let url = req.url.split("?")[0];
        if (url[url.length - 1] == "/") {
            url = url.substring(0, url.length - 1);
        }
        if (this.buffering) {
            if (this.directoryBuffers.indexOf(url) === -1) {
                return false;
            }
            let content = this.buffers[MinuetWebBufferName.listNavigator].toString();
            content = content.split("{url}").join(url);
            content = content.split("{back}").join(path.dirname(url));
            const list = this.getDirectories(url);
            let listStr = "";
            for (let n = 0; n < list.length; n++) {
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
    listen(req, res) {
        const url0 = req.url.split("?")[0];
        let url = this.getUrl(url0);
        if (!url) {
            if (this.listNavigator && this.isDirectory(req, res)) {
                return true;
            }
            return this.error(res);
        }
        if (!this.existFile(url))
            return this.error(res);
        let content = this.readFile(url);
        res.statusCode = 200;
        this.headers["content-type"] = this.getMime(url);
        this.setHeader(res);
        res.write(content);
        res.end();
        // access log write
        this.log(this.logAccess, req, res);
        return true;
    }
    // log write
    log(logMode, req, res, message) {
        if (!logMode)
            return;
        if (this.logger) {
            if (typeof logMode == "string") {
                this.logger.write(logMode, req, res, message);
            }
        }
    }
}
exports.MinuetWeb = MinuetWeb;
class MinuetServerModuleWeb extends minuet_server_1.MinuetServerModuleBase {
    onBegin() {
        if (!this.init) {
            this.init = {};
        }
        this.init.rootDir = this.sector.root + "/" + this.init.rootDir,
            this.web = new MinuetWeb(this.init);
        // load logger module
        const logger = this.getModule("logger");
        if (logger) {
            this.web.logger = logger;
        }
    }
    onRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.web.listen(req, res);
        });
    }
}
exports.MinuetServerModuleWeb = MinuetServerModuleWeb;
