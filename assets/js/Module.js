
var Module = new class {
    noInitialRun = true;
    arguments =  ["-v", "--menu"];
    preRun = [];
    postRun = [];
    print = text => console.log(text);
    totalDependencies = 0;
    monitorRunDependencies =  function (left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
    }
    version = 2.1;
    CoreName = 'mgba_config_data';
    BASEPATH = "/home/web_user/retroarch";
    USERPATH = "/userdata";
    CONFIGPATH = `${this.BASEPATH}/userdata/retroarch.cfg`;
    DB_NAME = "RetroArch_MGBA";
    __FILE__ = {
        "un7z.min.js": "assets/js/un7z.min.js",
        "unrar-5-m.min.js": "assets/js/unrar-5-m.min.js",
        "unrar-5-m.mem": "assets/js/unrar-5-m.mem",
        "jszip.min.js": "assets/js/jszip.min.js",
        "spark-md5.min.js": "assets/js/spark-md5.min.js",
        "mgba_libretro.js": null,
        "mgba_libretro.wasm": null,
    };
    StartRetroArch() {
        this.GameLink = this.CONFIG.lastgame;
        if (this.GameLink) {
            this.arguments.pop();
            this.arguments.push(this.GameLink);
        }
        this.EVENT.$('.game-setting').hidden = false;
        this.EVENT.$('.game-setting').innerHTML = this.HTML.translate('启动');
        if (this.version != this.CONFIG.version) FS.syncfs(e => this.SetConfig({'version': this.version}));
    }
    InitializedData(){
        delete this.callMain;
        delete this.wasmBinary;
        this.__FILE__ = {};
        let txt = new TextDecoder().decode(FS.readFile(this.CONFIGPATH));
        txt.split("\n").forEach(val => {
            let s = val.split('='),
                key = s[0].replace(/^\s+?/, '').replace(/\s+?$/, ''),
                value = s[1] && s[1].replace(/^\s+?"?/, '').replace(/"?\s*?$/, '');
            if (this.KeyMap[key] && value) {
                this.KeyMap[key] = value;
            }

        });
        this.EVENT.SetKeyMap();
    }
    get BtnMap() {
        return this.EVENT.BtnMap;
    }
    CreateDataFile(path,data){
        let dir = path.split('/').slice(0,-1).join('/');
        if (!FS.analyzePath(dir).exists) FS.createPath('/', dir);
        if (!FS.analyzePath(path).exists) FS.createDataFile(dir, path.split('/').pop(),data, !0, !0);
    }
    async INSTALL_WASM(coreFile) {
        let corename = this.CoreName.split('_')[0];
        let coredata = await this.IDBFS.getContent('coredata',`${corename}_libretro.js`);
        //let coredata = this.REPLACE_MODULE(await (await fetch(`assets/${corename}_libretro.js`)).arrayBuffer()); //
        //(await this.IDBFS.getContent('coredata',`${corename}_libretro.wasm`));
        
        this.wasmBinary = await this.IDBFS.getContent('coredata',`${corename}_libretro.wasm`);
        //this.wasmBinary = new Uint8Array(await (await fetch(`assets/${corename}_libretro.wasm`)).arrayBuffer());
        if(!coredata || !this.wasmBinary){
            this.SetConfig({version:null});
            return this.onReady();
        }
        this.printErr = text => {
            console.log(text);
            this.EVENT.checkLog(text);
        };
        //chinese-fallback-font.ttf
        this.onRuntimeInitialized = e => {
            FS.createPath('/', '/userdata', !0, !0);
            FS.createPath('/', `${this.BASEPATH}/userdata`, !0, !0);
            FS.createPath('/', `${this.BASEPATH}/bundle`, !0, !0);
            FS.mount(this.IDBFS, {}, this.USERPATH);
            FS.mount(this.IDBFS, {}, `${this.BASEPATH}/userdata`);
            FS.mount(this.IDBFS, {}, `${this.BASEPATH}/bundle`);
            FS.syncfs(!0, ok => {
                if (coreFile) {
                    for (let file in coreFile) {
                        let path = `${this.BASEPATH}/bundle/${file}`;
                        this.CreateDataFile(path,coreFile[file]);
                        if(/chinese\-fallback\-font\.ttf$/.test(file)){
                            this.CreateDataFile(`${this.BASEPATH}/bundle/assets/glui/font.ttf`,coreFile[file]);
                            this.CreateDataFile(`${this.BASEPATH}/bundle/assets/pkg/fallback-font.ttf`,coreFile[file]);
                        }
                        /*
                        let path = `${this.BASEPATH}/bundle/${file.split('/').slice(0, -1).join('/')}`;
                        if (!FS.analyzePath(path).exists) FS.createPath('/', path);
                        if (!FS.analyzePath(`${this.BASEPATH}/bundle/${file}`).exists) FS.createDataFile(path, file.split('/').pop(), coreFile[file], !0, !0);
                        */
                        delete coreFile[file];
                    }
                    coreFile = null;
                }
                if (!FS.analyzePath(this.CONFIGPATH).exists) {
                    let cfg = 'menu_mouse_enable = "true"\n' +
                        'menu_pointer_enable = "true"\n' +
                        `menu_driver = "glui"\n`+
                        //+'materialui_show_nav_bar = false\n'
                        `materialui_playlist_icons_enable = "false"\n` +
                        `materialui_auto_rotate_nav_bar = "false"\n` +
                        `video_font_size = "12.000000"\n` +
                        `video_adaptive_vsync = "true"\n`+
                        //`video_shader_enable = true\n`+
                        `savestate_auto_load = true\n`+
                        //`fastforward_ratio = 1.0\n`+
                        `rewind_enable = "false"\n`+
                        `video_font_path = "/home/web_user/retroarch/bundle/assets/pkg/chinese-fallback-font.ttf"\n`+
                        `xmb_font = "/home/web_user/retroarch/bundle/assets/pkg/chinese-fallback-font.ttf"\n`+


                        `menu_widget_scale_auto = "false"\n` +
                        'materialui_icons_enable = false\n' +
                        `menu_scale_factor = "2.000000"\n` +
                        `menu_show_core_updater = "false"\n` +
                        `menu_show_help = "false"\n` +
                        `menu_show_information = "false"\n` +
                        `menu_show_legacy_thumbnail_updater = "false"\n` +
                        `menu_show_load_core = "false"\n` +
                        `menu_show_quit_retroarch = "false"\n` +
                        `menu_show_overlays = "false"\n` +
                        `menu_show_online_updater = "false"\n` +
                        `settings_show_accessibility = "false"\n`+
                        //+`settings_show_user_interface = "false"\n`
                        `settings_show_user = "false"\n` +
                        `settings_show_recording = "false"\n` +
                        `settings_show_power_management = "false"\n` +
                        `settings_show_playlists = "false"\n` +
                        `settings_show_network = "false"\n` +
                        `settings_show_logging = "false"\n` +
                        `settings_show_file_browser = "false"\n` +
                        `settings_show_directory = "false"\n` +
                        `settings_show_core = "false"\n` +
                        `settings_show_ai_service = "false"\n` +
                        `settings_show_achievements = "false"\n` +
                        `settings_show_drivers = "false"\n` +
                        `settings_show_configuration = "false"\n` +
                        `settings_show_latency = "false"\n`+
                        //+`settings_show_frame_throttle = "false"\n`
                        `settings_show_saving = "false"\n` +
                        `camera_allow = "false"\n` +
                        `camera_driver = "null"\n` +
                        `camera_device = "null"\n` +
                        `input_max_users = "1"\n`+
                        //+`bundle_assets_extract_enable = "false"\n`
                        `quick_menu_show_information = "false"\n` +
                        `quick_menu_show_recording = "false"\n` +
                        `quick_menu_show_reset_core_association = "false"\n` +
                        `quick_menu_show_save_content_dir_overrides = "false"\n` +
                        `quick_menu_show_save_core_overrides = "false"\n` +
                        `quick_menu_show_save_game_overrides = "false"\n` +
                        `quick_menu_show_start_recording = "false"\n` +
                        `quick_menu_show_start_streaming = "false"\n` +
                        `quick_menu_show_streaming = "false"\n` +
                        `quick_menu_show_add_to_favorites = "false"\n` +

                        `content_show_explore = "fasle"\n` +
                        `content_show_favorites = "fasle"\n` +
                        `content_show_history = "fasle"\n` +
                        `content_show_music = "fasle"\n` +
                        `content_show_playlists = "fasle"\n` +
                        `content_favorites_path = "null"\n` +
                        `content_history_path = "null"\n` +
                        `content_image_history_path = "null"\n` +
                        `content_music_history_path = "null"\n` +

                        `playlist_directory = "null"\n` +
                        `auto_screenshot_filename = "false"\n` +
                        `savestate_thumbnail_enable = "false"\n` +
                        `autosave_interval = "1"\n` +
                        `block_sram_overwrite = "false"\n` +
                        `savestate_file_compression = "false"\n` +
                        `save_file_compression = "false"\n` +
                        `savefile_directory = "${this.USERPATH}/saves"\n` +
                        `savestate_directory = "${this.USERPATH}/states"\n` +
                        `screenshot_directory = "${this.USERPATH}/screenshots"\n` +
                        `system_directory = "${this.BASEPATH}/bundle/system"\n` +
                        `rgui_browser_directory = "${this.USERPATH}/rooms"\n` +
                        `core_assets_directory = "${this.USERPATH}/rooms/downloads"\n` +
                        `cheat_database_path = "${this.USERPATH}/cheats"\n`;
                    FS.createDataFile(`${this.BASEPATH}/userdata`, 'retroarch.cfg', cfg, !0, !0);
                }
                FS.createPath('/', `${this.BASEPATH}/userdata/config/mGBA`, !0, !0);
                if(!FS.analyzePath(`${this.BASEPATH}/userdata/config/mGBA/mGBA.opt`).exists){
                    FS.createDataFile(`${this.BASEPATH}/userdata/config/mGBA`,`mGBA.opt`,`mgba_sgb_borders = "OFF"`,!0, !0);
                }
                FS.createPath('/', `${this.USERPATH}/states`, !0, !0);
                FS.createPath('/', `${this.USERPATH}/saves`, !0, !0);
                FS.createPath('/', `${this.USERPATH}/rooms`, !0, !0);
                FS.createPath('/', `${this.USERPATH}/rooms/downloads`, !0, !0);
                FS.createPath('/', `${this.USERPATH}/screenshots`, !0, !0);
                this.StartRetroArch();
            });
        };
        coredata = `((Module)=>{`+
                        `${coredata};`+
                        `FS.PATH = PATH;`+
                        `FS.MEMFS = MEMFS;`+
                        `self.FS = FS;`+
                        `Module.LoopTime = e=>_emscripten_set_main_loop_timing(1,1);`+
                        `Module.RA = RA;`+
                        `Module.FS = FS;`+
                        `Module._RWebAudioInit = _RWebAudioInit;`+
                        `Module.Browser = Browser`+
                    `})(Module);`;
        let script = document.createElement('script');
        script.src = window.URL.createObjectURL(new Blob([coredata], {
            type: 'text/javascript'
        }));
        script.onload = async e => {
            coredata = null;
            window.URL.revokeObjectURL(script.src);
        };
        document.body.appendChild(script);

    }
    REPLACE_MODULE(result) {
        if (result instanceof ArrayBuffer) result = new Uint8Array(result);
        if (result instanceof Uint8Array) result = new TextDecoder().decode(result);
        return result.replace(
            /var\s?__specialEventTargets\s?=\s?\[0,\s?typeof\s?document\s?!==\s?"undefined"\s?\?\s?document\s?:\s?0,\s?typeof\s?window\s?!==\s?"undefined"\s?\?\s?window\s?:\s?0\];/,
            'var __specialEventTargets=[0,Module.canvas,window];'
        ).replace(
            /var\s?rect\s?=\s?__specialEventTargets\.indexOf\(target\)\s?<\s?0\s?\?\s?__getBoundingClientRect\(target\)\s?:\s?\{\s*\n*\s*"left":\s*\d+,\n?\s*"top":\s*\d+\n?\s*\};/,
            'var rect= __getBoundingClientRect(Module.canvas);'
        ).replace(
            /if\s?\(!JSEvents\.mouseEvent\)\s?JSEvents\.mouseEvent\s?=\s?_malloc\(64\);/,
            'if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(64);eventTypeString = eventTypeString.replace(\'mouse\',\'pointer\');'
        ).replace(
            //fix canvan id not #canvas will error
            /function\s?__findEventTarget\(target\)\s?\{/,
            'function __findEventTarget(target) {if(target>0&&UTF8ToString(target) == "#canvas") return Module.canvas;'
            /*).replace(
                /function\s?_glReadPixels\(x,\s?y,\s?width,\s?height,\s?format,\s?type,\s?pixels\)\s?\{\s?\n?\s*var\s?pixelData\s?=\s?emscriptenWebGLGetTexPixelData\(type,\s?format,\s?width,\s?height,\s?pixels,\s?format\);/,
                'function _glReadPixels(x,y,width,height,format,type,pixels){var pixelData=emscriptenWebGLGetTexPixelData(type,format,width,height,pixels,format);if(pixelData)Module.printErr("screenshots is saved.");'
                */
        ).replace(
            /function _fd_write\(fd,\s?iov,\s?iovcnt,\s?pnum\)\s?\{\s?\n?\s*try\s?\{\n?\s*var stream\s?=\s?SYSCALLS\.getStreamFromFD\(fd\);\n?\s*var\s?num\s?=\s?SYSCALLS\.doWritev\(stream,\s?iov,\s?iovcnt\);/,
            'function _fd_write(fd,iov,iovcnt,pnum){try{var stream=SYSCALLS.getStreamFromFD(fd);var num = SYSCALLS.doWritev(stream, iov, iovcnt);' +
            'if(stream&&stream.node&&Module.IDBFS.DB_STORE_MAP[stream.node.mount.mountpoint]){'
            // num 是储存字符大小
            +
            'if(stream.position==num){' +
            'if(Module.EVENT.ontranslate&&/\.png$/.test(stream.path)){' +
            'Module.EVENT.translateimgpath = stream.path;' +
            'clearTimeout(Module.EVENT.syncfsTimer);Module.EVENT.syncfsTimer = setTimeout(e=>Module.EVENT.BtnMap["Baidu"]("POST"),1000);' +
            '}else if(/\.srm$/.test(stream.path)||/\.rtc$/.test(stream.path)){console.log(stream.path);' +
            'clearTimeout(Module.EVENT.syncfsTimer);Module.EVENT.syncfsTimer = setTimeout(e=>FS.syncfs(e=>Module.HTML.syncfs(stream.path)),500);' +
            '}' +
            '}'
            //+'console.log(stream.position==num);'
            +'}'
            /*).replace(
                /ret\s?\+=\s?curr\s*\n?\}\s*return ret/,
                'ret+=curr}'
                +'if(stream&&stream.node&&this.IDBFS.DB_STORE_MAP[stream.node.mount.mountpoint]){'
                    +'if(stream.position==ret){'
                        +'clearTimeout(Module.syncfsTimer);Module.syncfsTimer = setTimeout(e=>FS.syncfs(e=>Module.HTML.syncfs(stream.path)),50);'
                    +'}'
                +'}else{'
                    +'console.log(iov);Module.EVENT.CheckMessage('
                        +'new TextDecoder().decode(new Uint8Array(HEAP8.subarray(HEAP32[iov>>2],HEAP32[iov>>2]+HEAP32[iov+4>>2])))'
                        //+'new TextDecoder().decode(new Uint8Array(HEAP8.subarray(HEAP32[iov+8>>2],HEAP32[iov+8>>2]+HEAP32[iov+12>>2])))'
                    +');'
                +'}'
                +'return ret'*/
        );
    }
    async onReady() {
        let corename = this.CoreName.split('_')[0];
        if (this.CONFIG.version == this.version) return this.INSTALL_WASM();
        await this.IDBFS.clearDB('assets');
        await this.IDBFS.clearDB('config');
        this.__Fetch({
            url: 'assets/assets.zip.js?' + Math.random(),
            error: e => console.log(e),
            process: (a, b, c) => this.HTML.MSG(`${Math.floor(c/1024)}KB`, true),
            success: buf => {
                this.unZip(buf).then(async result => {
                    let timestamp = new Date;
                    for (var i in this.__FILE__) {
                        if (result[i]) {
                            if (i == `${corename}_libretro.js`) {
                                result[i] = this.REPLACE_MODULE(result[i]);
                            }
                            await this.IDBFS.put('coredata', i, {
                                'content': result[i],
                                'mode': 33206,
                                timestamp
                            });
                        }
                        result[i] = null;
                        delete result[i];
                    }
                    this.INSTALL_WASM(result);
                });
            }
        });

    }
    constructor() {
        this.CONFIG = JSON.parse(localStorage.getItem(this.CoreName) || '{}');
    }
    SetConfig(data) {
        for (let i in data) {
            this.CONFIG[i] = data[i];
        }
        localStorage.setItem(this.CoreName, JSON.stringify(this.CONFIG));
    }
    async __getFile(str) {
        if (this.__FILE__[str]) return this.__FILE__[str];
        let file = (await this.IDBFS.getContent('coredata', str));
        if (!file) {
            this.__FILE__[str] = `assets/js/${str}`;
            return this.__FILE__[str];
        }
        if (/^unrar\-/.test(str)) {
            let wasmname = str.split('.')[0],
                lasChar = wasmname.charAt(wasmname.length - 1),
                type = lasChar == "m" ? 'mem' : lasChar == "w" ? 'wasm' : "";
            if (type) {
                let wasmdata = await this.IDBFS.getContent('coredata', `${wasmname}.${type}`);
                if (wasmdata) {
                    this.__FILE__[`${wasmname}.${type}`] = window.URL.createObjectURL(new Blob([wasmdata], {
                        type: 'text/javascript'
                    }));
                    file = new TextDecoder().decode(file);
                    file = file.replace(`${wasmname}.${type}`, this.__FILE__[`${wasmname}.${type}`])
                }
            };
        }
        this.__FILE__[str] = window.URL.createObjectURL(new Blob([file], {
            type: 'text/javascript'
        }));
        return this.__FILE__[str];
    }
    async __Fetch(ARG) {
        let response = await fetch(ARG.url),
            downsize = response.headers.get("Content-Length") || 1024,
            havesize = 0,
            ContentType = response.headers.get("Content-Type") || 'application/octet-stream';
        if (response.status == 404) {
            ARG.error && ARG.error(response.statusText);
            return;
        }
        const reader = response.body.getReader();
        const stream = new ReadableStream({
            start(controller) {
                let push = e => {
                    reader.read().then(({
                        done,
                        value
                    }) => {
                        if (done) {
                            controller.close();
                            push = null;
                            return;
                        }
                        havesize += value.length;
                        ARG.process && ARG.process(Math.floor(havesize / downsize * 100) + '%', value.length, havesize);
                        //下载或者上传进度
                        controller.enqueue(value);
                        push();
                    });
                }
                push();
            }
        });
        let buf = await (new Response(stream)[ARG.type || 'arrayBuffer']());
        ARG.success(buf);
        return buf;
    }
    IDBFS = new class {
        DB_STORE_MAP = {};
        constructor(Module){
            this.DB_STORE_MAP[Module.USERPATH] = 'userdata';
            this.DB_STORE_MAP[`${Module.BASEPATH}/userdata`] = 'config';
            this.DB_STORE_MAP[`${Module.BASEPATH}/bundle`] = 'assets';
            this.DB_NAME = Module.DB_NAME;
        };
        get indexedDB() {
            let ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
            if (!ret) throw "IDBFS used, but indexedDB not supported";
            return ret
        }
        mount(mount) {
            return FS.MEMFS.mount.apply(null, arguments)
        }
        syncfs(mount, populate, callback) {
            return new Promise(cb => {
                callback = callback || cb;
                this.getLocalSet(mount, (err, local) => {
                    if (err) return callback(err);
                    let storeName = this.DB_STORE_MAP[mount.mountpoint];
                    if (!storeName) return callback('Store Name erro');
                    this.getRemoteSet(storeName).then(remote => {
                        var src = populate ? remote : local;
                        var dst = populate ? local : remote;
                        this.reconcile(src, dst, callback, storeName)
                    }).catch(e => callback(e))
                })
            });
        }
        async get(store, name) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store]);
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                let request = objectStore.get(name);
                request.onsuccess = e => callback(request.result);
            })
        }
        async getContent(store, name) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store]);
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                let request = objectStore.get(name);
                request.onsuccess = e => callback(request.result && request.result.content || null);
            })
        }
        async put(store, name, data) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store], "readwrite");
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                let request = objectStore.put(data, name);
                request.onsuccess = e => callback(request.result);
            });
        }
        async getAllKeys(store, name, data) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store], "readwrite");
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                let request = objectStore.getAllKeys();
                request.onsuccess = e => callback(request.result);
            });
        }
        async getAll(store, name, data) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store], "readwrite");
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                let request = objectStore.getAll();
                request.onsuccess = e => callback(request.result), console.log(request);
            });
        }
        async getData(store, name, data) {
            let db = await this.getDB(store);
            var transaction = db.transaction([store], "readwrite");
            var objectStore = transaction.objectStore(store);
            return new Promise(callback => {
                var rst_values = {};
                var req = objectStore.openCursor();
                req.onsuccess = function (evt) {
                    var cursor = evt.target.result;
                    if (cursor) {
                        rst_values[cursor.primaryKey] = cursor.value;
                        cursor.continue();
                    } else {
                        callback(rst_values);
                    }
                }
            });
        }
        async clearDB(storeName) {
            if (!storeName) return this.indexedDB.deleteDatabase(this.DB_NAME);
            var db = await this.getDB(storeName);
            var transaction = db.transaction([storeName], "readwrite");
            var objectStore = transaction.objectStore(storeName);
            objectStore.clear();
        }
        close(e) {
            if (this.db) this.close();
            console.log(e);
        }
        async getDB(storeName, version) {
            return new Promise((callback, err) => {
                if (this.db) {
                    if (this.db.objectStoreNames.contains(storeName)) return callback(this.db);
                    else {
                        this.db.close();
                        version = this.db.version + 1;
                    }
                }
                let req = this.indexedDB.open(this.DB_NAME, version);
                if (!req) return err("Unable to connect to IndexedDB");
                req.onupgradeneeded = e => {
                    var db = e.target.result;
                    var transaction = e.target.transaction;
                    var fileStore;
                    if (!db.objectStoreNames.contains(storeName)) {
                        for (var i in this.DB_STORE_MAP) {
                            if (db.objectStoreNames.contains(this.DB_STORE_MAP[i])) continue;
                            let Store = db.createObjectStore(this.DB_STORE_MAP[i]);
                            if (!Store.indexNames.contains("timestamp")) Store.createIndex("timestamp", "timestamp", {
                                unique: false
                            });
                            if (this.DB_STORE_MAP[i] == storeName) fileStore = Store;
                        }
                        if (!fileStore) {
                            fileStore = db.createObjectStore(storeName);
                            if (!fileStore.indexNames.contains("timestamp")) {
                                fileStore.createIndex("timestamp", "timestamp", {
                                    unique: false
                                });
                            }
                        }
                    }
                };
                req.onsuccess = async e => {
                    let db = e.target.result;
                    if (!db.objectStoreNames.contains(storeName)) {
                        version = db.version + 1;
                        db.close();
                        this.db = await this.getDB(storeName, version);
                    } else {
                        this.db = db;
                    }
                    callback(this.db);
                };
                req.onerror = e => {
                    err(req.error);
                    e.preventDefault()
                }
            });
        }
        getLocalSet(mount, callback) {
            let entries = {},
                isRealDir = p => {
                    return p !== "." && p !== ".."
                },
                toAbsolute = root => {
                    return function (p) {
                        return FS.PATH.join2(root, p)
                    }
                },
                check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
            while (check.length) {
                var path = check.pop();
                var stat;
                try {
                    stat = FS.stat(path)
                } catch (e) {
                    return callback(e)
                }
                if (FS.isDir(stat.mode)) {
                    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
                }
                entries[path] = {
                    timestamp: stat.mtime
                }
            }
            return callback(null, {
                "type": "local",
                entries
            })
        }
        async getRemoteSet(storeName) {
            return new Promise((callback, err) => {
                var entries = {};
                this.getDB(storeName).then(db => {
                    var transaction = db.transaction([storeName], "readonly");
                    transaction.onerror = e => {
                        err(transaction.error);
                        e.preventDefault()
                    };
                    var store = transaction.objectStore(storeName);
                    var index = store.index("timestamp");
                    index.openKeyCursor().onsuccess = function (event) {
                        var cursor = event.target.result;
                        if (!cursor) {
                            return callback({
                                type: "remote",
                                db: db,
                                entries: entries
                            })
                        }
                        entries[cursor.primaryKey] = {
                            timestamp: cursor.key
                        };
                        cursor.continue()
                    }
                }).catch(e => err(e))
            });
        }
        loadLocalEntry(path, callback) {
            var stat, node;
            try {
                var lookup = FS.lookupPath(path);
                node = lookup.node;
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                return callback(null, {
                    timestamp: stat.mtime,
                    mode: stat.mode
                })
            } else if (FS.isFile(stat.mode)) {
                node.contents = FS.MEMFS.getFileDataAsTypedArray(node);
                return callback(null, {
                    timestamp: stat.mtime,
                    mode: stat.mode,
                    contents: node.contents
                })
            } else {
                return callback(new Error("node type not supported"))
            }
        }
        storeLocalEntry(path, entry, callback) {
            try {
                if (FS.isDir(entry.mode)) {
                    FS.mkdir(path, entry.mode)
                } else if (FS.isFile(entry.mode)) {
                    FS.writeFile(path, entry.contents, {
                        canOwn: true
                    })
                } else {
                    return callback(new Error("node type not supported"))
                }
                FS.chmod(path, entry.mode);
                FS.utime(path, entry.timestamp, entry.timestamp)
            } catch (e) {
                return callback(e)
            }
            callback(null)
        }
        removeLocalEntry(path, callback) {
            try {
                var lookup = FS.lookupPath(path);
                var stat = FS.stat(path);
                if (FS.isDir(stat.mode)) {
                    FS.rmdir(path)
                } else if (FS.isFile(stat.mode)) {
                    FS.unlink(path)
                }
            } catch (e) {
                return callback(e)
            }
            callback(null)
        }
        loadRemoteEntry(store, path, callback) {
            var req = store.get(path);
            req.onsuccess = function (event) {
                callback(null, event.target.result)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        storeRemoteEntry(store, path, entry, callback) {
            var req = store.put(entry, path);
            req.onsuccess = function () {
                callback(null)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        removeRemoteEntry(store, path, callback) {
            var req = store.delete(path);
            req.onsuccess = function () {
                callback(null)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        reconcile(src, dst, callback, storeName) {
            var total = 0;
            var create = [];
            Object.keys(src.entries).forEach(key => {
                var e = src.entries[key];
                var e2 = dst.entries[key];
                if (!e2 || e.timestamp > e2.timestamp) {
                    create.push(key);
                    total++
                }
            });
            var remove = [];
            Object.keys(dst.entries).forEach(key => {
                var e = dst.entries[key];
                var e2 = src.entries[key];
                if (!e2) {
                    remove.push(key);
                    total++
                }
            });
            if (!total) {
                return callback(null)
            }
            var errored = false;
            var completed = 0;
            var db = src.type === "remote" ? src.db : dst.db;
            var transaction = db.transaction([storeName], "readwrite");
            var store = transaction.objectStore(storeName),
                done = err => {
                    if (err) {
                        if (!done.errored) {
                            done.errored = true;
                            return callback(err)
                        }
                        return
                    }
                    if (++completed >= total) {
                        return callback(null)
                    }
                };
            transaction.onerror = e => {
                done(transaction.error);
                e.preventDefault()
            };
            create.sort().forEach(path => {
                if (dst.type === "local") {
                    this.loadRemoteEntry(store, path, (err, entry) => {
                        if (err) return done(err);
                        this.storeLocalEntry(path, entry, done)
                    })
                } else {
                    this.loadLocalEntry(path, (err, entry) => {
                        if (err) return done(err);
                        this.storeRemoteEntry(store, path, entry, done)
                    })
                }
            });
            remove.sort().reverse().forEach(path => {
                if (dst.type === "local") {
                    this.removeLocalEntry(path, done)
                } else {
                    this.removeRemoteEntry(store, path, done)
                }
            });
        }
    }(this);
    async un7z(buf, name) {
        let url = await this.__getFile('un7z.min.js');
        return new Promise((ok, erro) => {
            let w = new Worker(url);
            w.onmessage = e => {
                ok(e.data);
                w.terminate();
            };
            w.postMessage(buf);
        });
    }
    async unZip(buf, name, cb) {
        let url = await this.__getFile('jszip.min.js');
        return new Promise((ok, erro) => {
            let w = new Worker(url),
                F = {};
            w.onmessage = e => {
                ok(e.data);
                w.terminate();
            };
            w.postMessage(buf);
            buf = null;
            return F;

        });
    }
    async unRAR(content, name, password) {
        let str = new TextDecoder().decode(new Uint8Array(content.subarray(0, 8)));
        let url;
        if (/Rar!$/.test(str)) url = await this.__getFile('unrar-5-m.min.js'); // rar >=5
        else url = await this.__getFile('unrar-5-m.js'); // rar <=4.0
        name = name + ".rar" || 'test.rar';
        return new Promise((ok, erro) => {
            let w = new Worker(url);
            w.onmessage = e => {
                ok(e.data);
                w.terminate();
            };
            w.addEventListener('error', e => {
                console.log(e);

            });
            w.onerror = async e => {
                if (e.message == "Uncaught Missing password" || e.message == "Uncaught File CRC error") {
                    this.HTML.RAR_HTML(e.message);
                    this.BtnMap['unrar'] = e => {
                        let password = this.HTML.RAR_PASSWORD();
                        if (!password) return;
                        this.BtnMap['unrar'] = null;
                        this.BtnMap['closelist']();
                        w.postMessage({
                            "data": [{
                                name,
                                content
                            }],
                            password
                        });
                    }
                    this.BtnMap['exitrar'] = e => {
                        w.terminate();
                        this.BtnMap['closelist']();
                    };
                } else {
                    this.HTML.RAR_ERROR(e);
                    w.terminate();
                }
            };
            w.postMessage({
                "data": [{
                    name,
                    content
                }],
                password
            });
        });
    }
    KeyMap = {
        input_player1_a: "x",
        input_player1_b: "z",
        input_player1_down: "down",
        input_player1_l: "q",
        input_player1_l2: "nul",
        input_player1_l3: "nul",
        input_player1_left: "left",
        input_player1_r: "w",
        input_player1_r2: "nul",
        input_player1_r3: "nul",
        input_player1_right: "right",
        input_player1_select: "rshift",
        input_player1_start: "enter",
        input_player1_turbo: "nul",
        input_player1_up: "up",
        input_player1_x: "s",
        input_player1_y: "a",
        input_toggle_fast_forward: "space",
        input_toggle_fullscreen: "f",
        input_reset: "h",
        input_screenshot: "f8",
        input_load_state: "f4",
        input_save_state: "f2",
        input_menu_toggle: "f1",
        input_toggle_slowmotion: null,
        audio_latency:128,
    };
    keyToCode = {
        "tilde": "Backquote",
        "num1": "Digit1",
        "num2": "Digit2",
        "num3": "Digit3",
        "num4": "Digit4",
        "num5": "Digit5",
        "num6": "Digit6",
        "num7": "Digit7",
        "num8": "Digit8",
        "num9": "Digit9",
        "num0": "Digit0",
        "minus": "Minus",
        "equal": "Equal",
        "backspace": "Backspace",
        "tab": "Tab",
        "q": "KeyQ",
        "w": "KeyW",
        "e": "KeyE",
        "r": "KeyR",
        "t": "KeyT",
        "y": "KeyY",
        "u": "KeyU",
        "i": "KeyI",
        "o": "KeyO",
        "p": "KeyP",
        "a": "KeyA",
        "s": "KeyS",
        "d": "KeyD",
        "f": "KeyF",
        "g": "KeyG",
        "h": "KeyH",
        "j": "KeyJ",
        "k": "KeyK",
        "l": "KeyL",
        "z": "KeyZ",
        "x": "KeyX",
        "c": "KeyC",
        "v": "KeyV",
        "b": "KeyB",
        "n": "KeyN",
        "m": "KeyM",
        "leftbracket": "BracketLeft",
        "rightbracket": "BracketRight",
        "backslash": "Backslash",
        "capslock": "CapsLock",
        "semicolon": "Semicolon",
        "quote": "Quote",
        "enter": "Enter",
        "shift": "ShiftLeft",
        "comma": "Comma",
        "period": "Period",
        "slash": "Slash",
        "rshift": "ShiftRight",
        "ctrl": "ControlLeft",
        "lmeta": "MetaLeft",
        "alt": "AltLeft",
        "space": "Space",
        "ralt": "AltRight",
        "menu": "ContextMenu",
        "rctrl": "ControlRight",
        "up": "ArrowUp",
        "left": "ArrowLeft",
        "down": "ArrowDown",
        "right": "ArrowRight",
        "kp_period": "NumpadDecimal",
        "kp_enter": "NumpadEnter",
        "keypad0": "Numpad0",
        "keypad1": "Numpad1",
        "keypad2": "Numpad2",
        "keypad3": "Numpad3",
        "keypad4": "Numpad4",
        "keypad5": "Numpad5",
        "keypad6": "Numpad6",
        "keypad7": "Numpad7",
        "keypad8": "Numpad8",
        "keypad9": "Numpad9",
        "add": "NumpadAdd",
        "numlock": "NumLock",
        "divide": "NumpadDivide",
        "multiply": "NumpadMultiply",
        "subtract": "NumpadSubtract",
        "home": "Home",
        "end": "End",
        "pageup": "PageUp",
        "pagedown": "PageDown",
        "del": "Delete",
        "insert": "Insert",
        "f12": "F12",
        "f10": "F10",
        "f9": "F9",
        "f8": "F8",
        "f7": "F7",
        "f6": "F6",
        "f5": "F5",
        "f4": "F4",
        "f3": "F3",
        "f2": "F2",
        "f1": "F1",
        "escape": "Escape"
    };
    //get FS(){
    //    return Module.FS;
    //}
};
if (typeof IDBObjectStore.prototype.getAll != 'function') {
    IDBObjectStore.prototype.getAll = function (params) {
        var request = {};
        var req = this.openCursor(params);
        req.onerror = function (evt) {
            if (typeof request.onerror == 'function') {
                request.onerror(evt);
            }
        };
        var rst_values = [];
        req.onsuccess = function (evt) {
            if (typeof request.onsuccess == 'function') {
                var cursor = evt.target.result;
                if (cursor) {
                    rst_values.push(cursor.value);
                    cursor.continue();
                } else {
                    request.result = rst_values;
                    evt.target.result = rst_values;
                    request.onsuccess(evt);
                }
            }
        }
        return request;
    }
}