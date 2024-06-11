"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinuetWeb = exports.DefaultMimes = void 0;
const fs = require("fs");
const path = require("path");
exports.DefaultMimes = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/jig",
    mp3: "audio/mp3",
    txt: "text/plain",
    css: "text/css",
    js: "text/javascript",
    html: "text/html",
};
class MinuetWeb {
    constructor(options) {
        this.url = "/";
        this.rootDir = "htdocs";
        this.mimes = exports.DefaultMimes;
        this.headers = {};
        this.buffering = true;
        this.bufferingMaxSize = 4000000;
        this.directReading = false;
        this.notFound = false;
        this.buffers = {};
        if (options) {
            this.setting(options);
        }
        else {
            this.updateBuffer();
        }
    }
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
        this.updateBuffer();
        return this;
    }
    updateBuffer() {
        if (this.buffering) {
            this.search(this.rootDir);
            if (typeof this.notFound == "string") {
                const content = fs.readFileSync(this.notFound.toString());
                this.buffers["#notfound"] = content;
            }
        }
        console.log(this.buffers);
        return this;
    }
    search(targetPath) {
        this.buffers = {};
        const target = targetPath;
        const list = fs.readdirSync(target, {
            withFileTypes: true,
        });
        for (let n = 0; n < list.length; n++) {
            const l_ = list[n];
            if (l_.isDirectory()) {
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
    addBuffer(filePath, content) {
        const fileName = (this.url + filePath.substring(this.rootDir.length)).split("//").join("/");
        this.buffers[fileName] = content;
        return this;
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
        let targetFullPath = this.rootDir + "/" + targetPath;
        targetFullPath = targetFullPath.split("//").join("/");
        if (!fs.existsSync(targetFullPath)) {
            return false;
        }
        return true;
    }
    readFile(targetPath) {
        if (this.buffering) {
            return this.buffers[targetPath];
        }
        let targetFullPath = this.rootDir + "/" + targetPath;
        targetFullPath = targetFullPath.split("//").join("/");
        const content = fs.readFileSync(targetFullPath);
        return content;
    }
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
                notFoundPath = "#notfound";
            }
            const content = this.readFile(notFoundPath);
            res.statusCode = 404;
            res.write(content);
            res.end();
            return true;
        }
    }
    listen(req, res) {
        const url = (req.url.split("?")[0]);
        let content;
        if (!this.buffers[url]) {
            if (!this.directReading)
                return this.error(res);
            ;
            if (!this.existFile(url))
                return this.error(res);
            ;
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
exports.MinuetWeb = MinuetWeb;
