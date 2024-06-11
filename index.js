"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MinuetWeb = exports.DefaultMimes = void 0;
const fs = require("fs");
const path = require("path");
exports.DefaultMimes = {
    jpg: "image/jpeg",
    png: "image/png",
    gif: "image/jig",
    txt: "text/plain",
    css: "text/css",
    js: "text/javascript",
    html: "text/html",
};
class MinuetWeb {
    constructor(options) {
        this.rootDir = "htdocs";
        this.mimes = exports.DefaultMimes;
        this.headers = {};
        this.buffering = true;
        this.bufferingMaxSize = 4000000;
        this.buffers = {};
        if (options) {
            this.setting(options);
        }
        else {
            this.updateBuffer();
        }
    }
    setting(options) {
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
        this.updateBuffer();
        return this;
    }
    updateBuffer() {
        if (this.buffering) {
            this.search(this.rootDir);
        }
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
                const fileName = filePath.substring(this.rootDir.length);
                this.buffers[fileName] = content;
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
    listen(req, res) {
        const url = req.url.split("?")[0];
        let content;
        if (!this.buffers[url]) {
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
exports.MinuetWeb = MinuetWeb;
