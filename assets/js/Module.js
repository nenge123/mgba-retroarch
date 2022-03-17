var Module = new class {
    noInitialRun = true;
    arguments = ["-v", "--menu"];
    preRun = [];
    postRun = [];
    print = text => console.log(text);
    totalDependencies = 0;
    monitorRunDependencies = function(left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
    }
    version = 2.2;
    fileversion = 2.4;
    CoreName = 'mgba_config_data';
    BASEPATH = "/home/web_user/retroarch";
    USERPATH = "/userdata";
    CONFIGPATH = `${this.BASEPATH}/userdata/retroarch.cfg`;
    DB_NAME = "RetroArch_MGBA";
    MyFile = {};
    async StartRetroArch() {
        if (location.search) {
            let search = location.search.replace(/^\?/, '').split('&'),
                data = {};
            for (let i = 0; i < search.length; i++) {
                let m = search[i].split('=');
                if (m[0] && m[1]) data[m[0]] = decodeURIComponent(m[1]);
            }
            if (data['game']) {
                self.GameLink = data['game'];
            }
        }
        if (typeof self.GameLink == 'string') {
            let path = `${this.USERPATH}/rooms/` + self.GameLink.split('/').pop();
            if(!this.CONFIG.files)this.CONFIG.files = {};
            if (this.CONFIG.files[self.GameLink]) {
                this.SetConfig({ lastgame: this.CONFIG.files[self.GameLink] });
            } else if (FS.analyzePath(path).exists) {
                this.SetConfig({ lastgame: path });
            } else {
                let buf = await this.__Fetch({
                    path:'',
                    url:self.GameLink,
                    error: e => this.HTML.MSG(`${self.GameLink}:${e}`,true),
                    process: (a, b, c) => this.HTML.MSG(`${self.GameLink}:${Math.floor(c/1024)}KB`, true),
                });
                if(buf){
                    let returnpath = await this.CheckLoadFile(buf, path);
                    if (returnpath) {
                        if (!this.CONFIG.files) this.CONFIG.files = {};
                        this.CONFIG.files[self.GameLink] = returnpath;
                        this.SetConfig({ files: this.CONFIG.files, lastgame: returnpath });
                    }
                }
            }
        }
        this.GameLink = this.CONFIG.lastgame;
        if (this.GameLink) {
            this.arguments.pop();
            this.arguments.push(this.GameLink);
        }
        //this.EVENT.$('.game-setting').hidden = false;
        this.EVENT.$('.game-setting').innerHTML = this.HTML.translate('启动');
    }
    InitializedData() {
        delete this.callMain;
        delete this.wasmBinary;
        this.MyFile = {};
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
    CreateDataFile(path, data, bool) {
        let dir = path.split('/').slice(0, -1).join('/');
        if (!FS.analyzePath(dir).exists){
            let pdir = dir.split('/').slice(0, -1).join('/');
            if (!FS.analyzePath(pdir).exists)FS.createPath('/', pdir,!0,!0);
            FS.createPath('/', dir,!0,!0);
        }
        if (bool) {
            if (FS.analyzePath(path).exists) FS.unlink(path);
            FS.createDataFile(dir, path.split('/').pop(), data, !0, !0);
        } else if (!FS.analyzePath(path).exists) FS.createDataFile(dir, path.split('/').pop(), data, !0, !0);
    }
    async INSTALL_WASM() {
        let corename = this.CoreName.split('_')[0],content;
        let coredata = this.REPLACE_MODULE(await this.IDBFS.getContent('data-libjs', `${corename}_libretro.js`));
       // let coredata = this.REPLACE_MODULE(await (await fetch(`assets/${corename}_libretro.js`)).arrayBuffer()); //
        //(await this.IDBFS.getContent('data-libjs',`${corename}_libretro.wasm`));
        this.wasmBinary = await this.IDBFS.getContent('data-libjs', `${corename}_libretro.wasm`);
        if (!coredata || !this.wasmBinary) {
            this.SetConfig({ version: null });
            return this.onReady();
        }
        this.printErr = text => {
            console.log(text);
            this.EVENT.checkLog(text);
        };
        //chinese-fallback-font.ttf
        this.onRuntimeInitialized = async e => {
            FS.createPath('/', '/userdata', !0, !0);
            FS.createPath('/', `${this.BASEPATH}/userdata`, !0, !0);
            FS.createPath('/', `${this.BASEPATH}/bundle`, !0, !0);
            FS.mount(this.IDBFS, {}, this.USERPATH);
            FS.mount(this.IDBFS, {}, `${this.BASEPATH}/userdata`);
            FS.mount(this.IDBFS, {}, `${this.BASEPATH}/bundle`);
            await this.IDBFS.IsReady();
            if (!FS.analyzePath(`${this.BASEPATH}/bundle/assets`).exists) {
                let zipu8 = await this.__Fetch({
                    url: 'assets.zip.js?' + Math.random(),
                    error: e => console.log(e),
                    process: (a, b, c) => this.HTML.MSG(`assets.zip.js:${Math.floor(c/1024)}KB`, true)
                });
                let coreFile = await this.unZip(zipu8);
                for (let file in coreFile) {
                    let path = `${this.BASEPATH}/bundle/${file}`;
                    this.CreateDataFile(path, coreFile[file]);
                    if (/chinese\-fallback\-font\.ttf$/.test(file)) {
                        this.CreateDataFile(`${this.BASEPATH}/bundle/assets/glui/font.ttf`, coreFile[file]);
                        this.CreateDataFile(`${this.BASEPATH}/bundle/assets/pkg/fallback-font.ttf`, coreFile[file]);
                    }
                    delete coreFile[file];
                }
                await this.IDBFS.syncfs(`${this.BASEPATH}/bundle`);
                coreFile = null;
                if(FS.analyzePath(this.CONFIGPATH).exists){
                    FS.unlink(this.CONFIGPATH);
                }
            }
            if (!FS.analyzePath(this.CONFIGPATH).exists) {
                let cfg = 'menu_mouse_enable = "true"\n' +
                    'menu_pointer_enable = "true"\n' +
                    `menu_driver = "glui"\n` +
                    //+'materialui_show_nav_bar = false\n'
                    `materialui_playlist_icons_enable = "false"\n` +
                    `materialui_auto_rotate_nav_bar = "false"\n` +
                    `video_font_size = "12.000000"\n` +
                    `video_adaptive_vsync = "true"\n` +
                    //`video_shader_enable = true\n`+
                    `savestate_auto_load = true\n` +
                    //`fastforward_ratio = 1.0\n`+
                    `rewind_enable = "false"\n` +
                    `video_font_path = "/home/web_user/retroarch/bundle/assets/pkg/chinese-fallback-font.ttf"\n` +
                    `xmb_font = "/home/web_user/retroarch/bundle/assets/pkg/chinese-fallback-font.ttf"\n` +
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
                    `settings_show_accessibility = "false"\n` +
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
                    `settings_show_latency = "false"\n` +
                    //+`settings_show_frame_throttle = "false"\n`
                    `settings_show_saving = "false"\n` +
                    `camera_allow = "false"\n` +
                    `camera_driver = "null"\n` +
                    `camera_device = "null"\n` +
                    `input_max_users = "1"\n` +
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
            if (!FS.analyzePath(`${this.BASEPATH}/userdata/config/mGBA/mGBA.opt`).exists) {
                FS.createDataFile(`${this.BASEPATH}/userdata/config/mGBA`, `mGBA.opt`, `mgba_sgb_borders = "OFF"`, !0, !0);
            }
            FS.createPath('/', `${this.USERPATH}/states`, !0, !0);
            FS.createPath('/', `${this.USERPATH}/saves`, !0, !0);
            FS.createPath('/', `${this.USERPATH}/rooms`, !0, !0);
            FS.createPath('/', `${this.USERPATH}/rooms/downloads`, !0, !0);
            FS.createPath('/', `${this.USERPATH}/screenshots`, !0, !0);
            this.StartRetroArch();
        };
        coredata = `((Module)=>{\n` +
            `${coredata};\n` +
            `FS.PATH = PATH;\n` +
            `FS.MEMFS = MEMFS;\n` +
            `self.FS = FS;\n` +
            `Module.LoopTime = e=>_emscripten_set_main_loop_timing(1,1);\n` +
            `Module.RA = RA;\n` +
            `Module.FS = FS;\n` +
            `Module._RWebAudioInit = _RWebAudioInit;\n` +
            `Module.Browser = Browser;\n` +
            `Module._emscripten_set_main_loop_timing = _emscripten_set_main_loop_timing;\n` +
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
        if(!result||result.byteLength==0) return ;
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
            'stream&&stream.node&&Module.CHECK_SAVE(stream,num,iov, iovcnt);'
        );
    }
    CHECK_SAVE(){
        return this.EVENT.CHECK_SAVE.apply(this.EVENT,arguments);
    }
    CHECK_STATE(stream,offset){
        if(stream&&stream.node&&Module.IDBFS.DB_STORE_MAP[stream.node.mount.mountpoint] == 'userdata'){
            clearTimeout(Module.EVENT.syncfsTimer);
            Module.EVENT.syncfsTimer = setTimeout(e=>FS.syncfs(e=>Module.HTML.syncfs(stream.path)),500);
        }
    }
    async onReady() {
        let corename = this.CoreName.split('_')[0];
        let timestamp = new Date;
        if (this.CONFIG.version != this.version){
            let libbuf = await this.__Fetch({
                url: 'mgba_libretro.zip.js?' + Math.random(),
                error: e => console.log(e),
                process: (a, b, c) => this.HTML.MSG(`mgba_libretro.zip.js:${Math.floor(c/1024)}KB`, true)
            });
            let libresult = await this.unZip(libbuf);
            for (var i in libresult) {
                if (libresult[i]) {
                    await this.IDBFS.setItem('data-libjs', i, {
                        'content': libresult[i],
                        'mode': 33206,
                        timestamp
                    });
                }
                libresult[i] = null;
                delete libresult[i];
            }
            libresult = null;
            this.SetConfig({ 'version': this.version });
        }
        if (this.CONFIG.fileversion != this.fileversion){
            let libbuf2 = await this.__Fetch({
                url: 'lib.zip.js?' + Math.random(),
                error: e => console.log(e),
                process: (a, b, c) => this.HTML.MSG(`lib.zip.js:${Math.floor(c/1024)}KB`, true)
            });
            let libresult2 = await this.unZip(libbuf2);
            for (var i in libresult2) {
                if (libresult2[i]) {
                    await this.IDBFS.setItem('data-libjs', i, {
                        'content': libresult2[i],
                        'mode': 33206,
                        timestamp
                    });
                }
                libresult2[i] = null;
                delete libresult2[i];
            }
            libresult2 = null;
            this.SetConfig({ 'fileversion': this.fileversion });
        }
        return this.INSTALL_WASM();
        

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
    async GetFile(str) {
        if (this.MyFile[str]) return this.MyFile[str];
        let file = await this.IDBFS.getContent('data-libjs', str);
        if (!file) {
            this.MyFile[str] = `assets/js/${str}`;
            return this.MyFile[str];
        }
        if (/^unrar.+?\.js$/.test(str)) {
            let wasmname = str.split('.')[0],
                lasChar = wasmname.slice(-1),
                type = lasChar == "m" ? 'mem' : lasChar == "w" ? 'wasm' : null;
            if (type) {
                let ff=`${wasmname}.${type}.png`,dataFile = await this.GetFile(ff);
                if (dataFile) {
                    file = new TextDecoder().decode(file);
                    file = file.replace(`libunrar.${type}`,dataFile).replace(ff,dataFile);
                }
            };
        }
        this.MyFile[str] = window.URL.createObjectURL(new Blob([file], {
            type: 'text/javascript'
        }));
        return this.MyFile[str];
    }
    async __Fetch(ARG) {
        let path = ARG.path != undefined ? ARG.path:'assets/';
        let response = await fetch(path+ARG.url),
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
        buf = new Uint8Array(buf);
        ARG.success&&ARG.success(buf);
        return buf;
    }
    IDBFS = new class {
        constructor(Module) {
            if(Module){
                if(Module.DB_NAME)this.DB_NAME = Module.DB_NAME;
                let _dD = {
                    Module:()=>{
                        return Module;
                    },
                    FS:()=>{
                        return self.FS || self.Module.FS || this.Module.FS;
                    },
                    MEMFS:()=>{
                        return this.FS.filesystems.MEMFS ||this.FS.MEMFS;
                    }
                };
                for(let _nN in _dD)Object.defineProperty(this,_nN,{'get':_dD[_nN]},'get Module Info');
                if(Module.USERPATH)this.DB_STORE_MAP[Module.USERPATH] = 'userdata';
                if(Module.BASEPATH){
                    this.DB_STORE_MAP[`${Module.BASEPATH}/userdata`] = 'config';
                    this.DB_STORE_MAP[`${Module.BASEPATH}/bundle`] = 'assets';
                }
            }
        };
        get indexedDB() {
            let ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
            if (!ret) throw "IDBFS used, but indexedDB not supported";
            return ret
        }
        async getItem(store,name,cb) {
            if(!name) return await this.GetItems(store,cb);
            let T = this,db = await T.GET_DB(store),
            maxsize = T.maxsize,
            part = T.part;
            return new Promise(callback => {
                T.transaction(store,db,!0).get(name).onsuccess = event => {
                    let result = event.target.result;
                    if(result&&result.content&&result.filesize&&result.filesize>maxsize&&result.key.search(part) ==-1){
                        let maxLen = Math.ceil(result.filesize/maxsize),
                        returnBuf = new Uint8Array(result.filesize),
                        list=[];
                        returnBuf.set(result.content,0);
                        delete result.content;
                        for(let index=1;index<maxLen;index++){
                            list.push(T.getItem(store,name+part+index));
                        }
                        return Promise.all(list).then(values_1=>{
                            for (var m = 0; m < values_1.length; m++) {
                                let index_1 = Number(values_1[m].key.split(part).pop());
                                returnBuf.set(values_1[m].content, index_1 * maxsize);
                                delete values_1[m].content;
                                delete values_1[m];
                            }
                            result.content = returnBuf;
                            callback(result);
                            cb && cb(result);
                        });
    
                    }
                    callback(result),
                    cb&&cb(result)
                };
            })
        }
        async setItem(store, name, data,cb) {
            let T=this,db = await T.GET_DB(store),maxsize = T.maxsize,part = T.part;
            if(data.content&&data.content.length>maxsize){
                let save = [],BufLen = data.content.length;
                for(var index=0;index<Math.ceil(BufLen/maxsize);index++){
                    let newdata = {
                            filesize:data.filesize,
                            timestamp:data.timestamp,
                            type:data.type
                        };
                    newdata.content = new Uint8Array(data.content.subarray(maxsize*index,BufLen - maxsize*index>=maxsize ? (index+1)*maxsize :BufLen)) ;
                    newdata.key = index>0?name+part+index:name;
                    save.push(T.setItem(store,newdata.key,newdata));
    
                }
                const values_1 = await Promise.all(save);
                cb && cb(values_1);
                return values_1;
            }
            return new Promise(callback => {
                T.transaction(store,db).put(data, name).onsuccess = e => {
                    let result = e.target.result;
                    callback(result),cb&&cb(result)};
            });
        }
        async getContent(store, name) {
            let result = await this.getItem(store, name);
            if(!result) return undefined;
            return result.content||result;
        }
        async getAllKeys(store,cb) {
            let T=this,db = await T.GET_DB(store);
            return new Promise(callback => {
                T.transaction(store,db,!0).getAllKeys().onsuccess = e => {let result = e.target.result;callback(result),cb&&cb(result)};
            });
        }
        async GetItems(store,cb) {
            let T=this,db = await T.GET_DB(store);
            return new Promise(callback => {
                var entries = {};
                T.transaction(store,db,!0).openCursor().onsuccess = evt => {
                    var cursor = evt.target.result;
                    if (cursor) {
                        entries[cursor.primaryKey] = cursor.value;
                        cursor.continue();
                    } else {
                        callback(entries);
                        cb&&cb(entries);
                    }
                }
            });
        }
        async FectchItem(ARG){
            let T=this,key = ARG.key || ARG.url.split('/').pop(),
            result = {},
            callback = result=>{
                if(result&&result.content){
                    ARG.success&&ARG.success(result.content);
                    return result.content;
                }
                return ;
            };
            if(ARG.store&&!ARG.unset){
                result = await T.getItem(ARG.store,key);
                if(!ARG.checksize&&callback(result)){
                    return result.content;
                }
            }
            let response = await fetch(ARG.url),
            type = ARG.type || 'arrayBuffer',
            downsize = response.headers.get("Content-Length") || 1024,
            havesize = 0;            
            if (response.status == 404) {
                ARG.error && ARG.error(response.statusText);
                return callback(result);
            }else if(ARG.checksize&&downsize&&result.filesize==downsize&&callback(result)){
                return result.content;
            }
            delete result.content;
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
                            let statussize = '0%';
                            if(downsize)statussize = Math.floor(havesize / downsize * 100) + '%';
                            ARG.process && ARG.process(statussize, value.length, havesize);
                            //下载或者上传进度
                            controller.enqueue(value);
                            push();
                        });
                    }
                    push();
                }
            });
            let content = await (new Response(stream)[type]());
            let filesize = content.byteLength;
            if(['arrayBuffer','Uint8Array'].includes(type)){
                content = new Uint8Array(content);
                filesize = content.byteLength;
            };
            if(ARG.unpack){
                content = await T.CHECK_FILE(content,key);
            }
            if(ARG.store){
                T.setItem(ARG.store,key,{
                    content,
                    timestamp:new Date,
                    filesize,
                    type
                });
            }
            ARG.success&&ARG.success(content);
            return content;
        }
        async CHECK_FILE(u8,name){
            if(u8 instanceof ArrayBuffer) u8 = new Uint8Array(u8);
            let head = new TextDecoder().decode(u8.slice ? u8.slice(0,8):u8.subarray(0,8)),
                Module=this.Module,
                action = null;
            if (/^7z/.test(head)) action = 'un7z';
            else if (/^Rar!/.test(head) || /[\x52][\x45][\x7E][\x5E]/.test(head))action = 'unRAR';
            else if (/^PK/.test(head)) action = 'unZip';
            if(action&&Module[action]) return await Module[action](u8);
            return u8;
        }
        maxsize = 0x6400000;
        part = '-part-';
        DB_STORE_MAP = {
            'data-libjs':null,
            'data-rooms':null
        };
        DB_MOUNT_MAP = {};
        IsReady(){
            let mounts = FS.root.mount.mounts;
            return new Promise(complete=>{
                let Timer = setInterval(()=>{
                    let ok = true;
                    for(let i = 0;i<mounts.length;i++){
                        let node = mounts[i];
                        if(this.DB_STORE_MAP[node.mountpoint]&&!node.root.isReady){
                            ok=false;
                        }
                    }
                    if(ok){
                        clearInterval(Timer);
                        complete(Timer);
                    }
                },100)
            });
        }
        mount(mount) {
            let T=this,node = T.MEMFS.createNode(null,mount.mountpoint, 16384 | 511, 0);
            setTimeout(()=>{
                T.syncfs(node.mount,!0,e=>{
                    node.isReady = true;
                });
            },1);
            return node;
        }
        findMount(mount){
            let T=this,FS = T.FS;
            if(!FS) return;
            let mounts = FS.root.mount.mounts;
            for(var i =0;i<mounts.length;i++){
                if(mounts[i].mountpoint == mount) return mounts[i];
            }
            let node = T.MEMFS.createNode(null,mount, 16384 | 511, 0);
            return node.mount;
        }
        syncfs(mount, populate, callback) {
            let T=this;
            return new Promise((cb,resolve) => {
                if(!mount.mountpoint) mount = T.findMount(mount);
                let storeName = T.DB_STORE_MAP[mount.mountpoint];
                if (!storeName) return resolve('Store Name erro');
                callback = callback || populate||cb;
                T.getLocalSet(mount, (err, local) => {
                    if (err) return resolve(err);
                    T.getRemoteSet(storeName,remote => {
                        var src = populate ? remote : local;
                        var dst = populate ? local : remote;
                        T.reconcile(src, dst, callback, storeName)
                    });
                })
            });
        }
        transaction(store,db,mode){ db = db || this.db; mode = mode?"readonly":"readwrite"; var transaction = db.transaction([store],mode); transaction.onerror = e => { e.preventDefault(); throw transaction.error; }; return transaction.objectStore(store);}
        async getRemoteSet(store,cb) {
            let T=this,db = await T.GET_DB(store);
            return new Promise(callback => {
                var type="remote",
                    entries = {},
                    key = "timestamp";
                T.transaction(store,db).index(key).openKeyCursor().onsuccess = evt => {
                    var cursor = evt.target.result;
                    if (cursor) {
                        entries[cursor.primaryKey] = {};
                        entries[cursor.primaryKey][key] = cursor.key;
                        cursor.continue();
                    } else {
                        let remote = {type,db,entries};
                        callback(remote);
                        cb&&cb(remote);
                    }
                }
            });
        }
        async clearDB(storeName) {
            let T=this;
            if (!storeName) return T.indexedDB.deleteDatabase(T.DB_NAME);
            var db = await T.GET_DB(storeName);
            T.transaction(store,db).clear();
        }
        close(e) {
            this.db&&this.db.close();
        }
        get StoreNames(){
            return this.db.objectStoreNames;
        }
        async GET_DB(storeName,version,key) {
            let T=this;
            return new Promise((callback, err) => {
                if (T.db&&T.StoreNames.contains(storeName)) return callback(T.db);
                let req = T.indexedDB.open(T.DB_NAME, version);
                if (!req) return err("Unable to connect to IndexedDB");
                req.onupgradeneeded = e => {
                    T.db = e.target.result;
                    let fileStore,
                        createIndex= (store,keyId)=>store.createIndex(keyId, keyId, {"unique": false});
                    if (!T.StoreNames.contains(storeName)) {
                        for (var i in T.DB_STORE_MAP) {
                            let NAME = T.DB_STORE_MAP[i] || i,
                                keyId =  null;
                            if (T.StoreNames.contains(NAME)) continue;
                            let Store = T.db.createObjectStore(NAME);
                            if(T.DB_STORE_MAP[i])keyId = "timestamp";
                            else if (key&&NAME == storeName) keyId = key;
                            if (keyId&&!Store.indexNames.contains(keyId)) createIndex(Store,keyId);
                            if (NAME == storeName) fileStore = Store;
                        }
                        if (!fileStore) {
                            fileStore = T.db.createObjectStore(storeName);
                            if (key&&!fileStore.indexNames.contains(key))createIndex(fileStore,key);
                        }
                    }
                };
                req.onsuccess = async e => {
                    T.db = e.target.result;
                    if (!T.StoreNames.contains(storeName)) {
                        version = T.db.version + 1;
                        T.close();
                        T.GET_DB(storeName, version,key).then(db=>callback(db));
                    }else{
                        callback(T.db);
                    }
                };
                req.onerror = e => {
                    err(req.error);
                    e.preventDefault()
                }
            });
        }
        getLocalSet(mount, callback) {
            let T=this,FS=T.FS,entries = {},
                isRealDir = p => p !== "." && p !== "..",
                toAbsolute = root => p => T.join2(root, p),
                check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
            while (check.length) {
                let path = check.pop();
                if (FS.analyzePath(path).exists) {
                    let stat = FS.stat(path);
                    if (FS.isDir(stat.mode)) {
                        check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
                    }
                    entries[path] = {
                        timestamp: stat.mtime
                    }
                }
            }
            return callback(null, {
                "type": "local",
                entries
            })
        }
        loadLocalEntry(path, callback) {
            let T=this,FS=T.FS;
            var stat, node;
            if(FS.analyzePath(path).exists){
                var lookup = FS.lookupPath(path);
                node = lookup.node;
                stat = FS.stat(path)
    
            }else{
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                return callback(null, {
                    timestamp: stat.mtime,
                    mode: stat.mode
                })
            } else if (FS.isFile(stat.mode)) {
                node.contents = T.MEMFS.getFileDataAsTypedArray(node);
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
            let T=this,FS=T.FS;
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {canOwn: true})
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp);
            callback(null)
        }
        removeLocalEntry(path, callback) {
            let T=this,FS = T.FS;
            if(FS.analyzePath(path).exists){
                var lookup = FS.lookupPath(path);
                var stat = FS.stat(path);
                if (FS.isDir(stat.mode)) {
                    FS.rmdir(path)
                } else if (FS.isFile(stat.mode)) {
                    FS.unlink(path)
                }
    
            }else{
                return callback(e)
            }
            callback(null)
        }
        loadRemoteEntry(store, path, callback) {
            var req = store.get(path);
            req.onsuccess = event => {
                callback(null, event.target.result)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        storeRemoteEntry(store, path, entry, callback) {
            var req = store.put(entry, path);
            req.onsuccess = () => {
                callback(null)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        removeRemoteEntry(store, path, callback) {
            var req = store.delete(path);
            req.onsuccess = () => {
                callback(null)
            };
            req.onerror = e => {
                callback(req.error);
                e.preventDefault()
            }
        }
        reconcile(src, dst, callback, storeName) {
            let T=this;
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
            var store = T.transaction(storeName,db),
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
            create.sort().forEach(path => {
                if (dst.type === "local") {
                    T.loadRemoteEntry(store, path, (err, entry) => {
                        if (err) return done(err);
                        T.storeLocalEntry(path, entry, done)
                    })
                } else {
                    T.loadLocalEntry(path, (err, entry) => {
                        if (err) return done(err);
                        T.storeRemoteEntry(store, path, entry, done)
                    })
                }
            });
            remove.sort().reverse().forEach(path => {
                if (dst.type === "local") {
                    T.removeLocalEntry(path, done)
                } else {
                    T.removeRemoteEntry(store, path, done)
                }
            });
        }
        splitPath(filename) { var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/; return splitPathRe.exec(filename).slice(1) }
        normalizeArray(parts, allowAboveRoot) { var up = 0; for (var i = parts.length - 1; i >= 0; i--) { var last = parts[i]; if (last === ".") { parts.splice(i, 1) } else if (last === "..") { parts.splice(i, 1); up++ } else if (up) { parts.splice(i, 1); up-- } } if (allowAboveRoot) { for (; up; up--) { parts.unshift("..") } } return parts }
        normalize(path) { var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substring(-1) === "/"; path = this.normalizeArray(path.split("/").filter(p => { return !!p }), !isAbsolute).join("/"); if (!path && !isAbsolute) { path = "." } if (path && trailingSlash) { path += "/" } return (isAbsolute ? "/" : "") + path }
        dirname(path) { var result = this.splitPath(path), root = result[0], dir = result[1]; if (!root && !dir) { return "." } if (dir) { dir = dir.substring(0, dir.length - 1) } return root + dir }
        basename(path) { if (path === "/") return "/"; var lastSlash = path.lastIndexOf("/"); if (lastSlash === -1) return path; return path.substring(lastSlash + 1) }
        extname(path) { return this.splitPath(path)[3] }
        join() { var paths = Array.prototype.slice.call(arguments, 0); return this.normalize(paths.join("/")) }
        join2(l, r) { return this.normalize(l + "/" + r) }
    }(this);
    async CheckLoadFile(u8, path) {
        if(u8 instanceof ArrayBuffer) u8 = new Uint8Array(u8);
        let head = new TextDecoder().decode(u8.slice ? u8.slice(0, 6) : subarray(0, 6)),
            data;
        if (/^7z/.test(head)) data = await Module.un7z(u8);
        else if (/^Rar!/.test(head) || /[\x52][\x45][\x7E][\x5E]/.test(head)) data = await Module.unRAR(u8);
        else if (/^PK/.test(head)) data = await Module.unZip(u8);
        else {
            this.CreateDataFile(path, u8);
            return path;
        }
        if (data) {
            let returnpath;
            for (var i in data) {
                let newpath = (`${this.USERPATH}/rooms/` + i.split('/').pop()).toLowerCase();
                if (!returnpath && (/\.(gb|gbc|gba)$/i).test(newpath)) returnpath = newpath;
                this.CreateDataFile(newpath, data[i]);
                delete data[i];
            }
            data = null;
            if (returnpath) return returnpath;
        }
        return;
    }
    async un7z(buf, name) {
        let url = await this.GetFile('un7z.min.js');
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
        let url = await this.GetFile('jszip.min.js');
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
        //https://github.com/tnikolai2/libunrar-js only support english file name
        if (str == 'Rar!\x1A\x07\x01\x00') url = await this.GetFile('unrar-5-9-2-w.min.js'); // rar >=5.9?
        //Rar!\x1A\x07\x00  <5.0
        //https://github.com/wcchoi/libunrar-js
        // if(/^Rar![\x1A][\x07][\x00]/.test(str)) 
        else url = await this.GetFile('unrar-5-m.min.js'); // rar <=4.0
        ///[\x52][\x45][\x7E][\x5E]/.test(head) <1.5
        // https://github.com/seikichi/unrar.js
        name = name && name + ".rar" || 'test.rar';
        password = password || "";
        return new Promise((ok, erro) => {
            let w = new Worker(url);
            w.onmessage = e => {
                ok(e.data);
                w.terminate();
            };
            w.onerror = e => {
                if (e.message == "Uncaught Missing password" || e.message == "Uncaught File CRC error") {
                    this.HTML.RAR_HTML(e.message);
                    this.BtnMap['unrar'] = e => {
                        let password = this.HTML.RAR_PASSWORD();
                        if (!password) return;
                        this.BtnMap['unrar'] = null;
                        this.BtnMap['closelist']();
                        w.postMessage({ "data": [{ name, content }], password });
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
            w.postMessage({ "data": [{ name, content }], password });
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
        audio_latency: 128,
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
    IDBObjectStore.prototype.getAll = function(params) {
        var request = {};
        var req = this.openCursor(params);
        req.onerror = function(evt) {
            if (typeof request.onerror == 'function') {
                request.onerror(evt);
            }
        };
        var rst_values = [];
        req.onsuccess = function(evt) {
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