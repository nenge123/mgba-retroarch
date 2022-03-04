(function(Module){
    Module.EVENT = new class{
        istouch = "ontouchstart" in document;
        resize(){
            if(!this.Module.setCanvasSize) return;
            let nav = this.$('.game-container').getBoundingClientRect(),can = this.canvas.getBoundingClientRect();
            let w = Math.min(window.innerWidth,document.documentElement.clientWidth,nav.width),
               h = Math.min(window.innerHeight,document.documentElement.clientHeight,nav.height);
               if(h==0) h = w==window.innerWidth ? window.innerHeight:w/can.width *can.height;
               if(this.$('.game-ctrl').hidden == false){
                   if(h>w){
                       h = w/(this.AspectRatio||1.5);
                       this.$('.game-ctrl').style.height = (nav.height - h)+'px';
                   }else{
                    this.$('.game-ctrl').removeAttribute('style');
                   }
               }
               this.Module.setCanvasSize(w,h);
        }
        async onReady(){
            this.on(window,'resize',e=>this.resize());
            this.on(this.$('.game-container'),'contextmenu',e=>{
                this.canvas.dispatchEvent(new MouseEvent('contextmenu',{}));
                e.preventDefault()
            },false);
            this.on(document,'keydown',e=>{
                if(this.$('.game-result').childNodes[0]) return;
                e.preventDefault();
                this.canvas.dispatchEvent(this.KeyboardEvent(e));
            });
            this.on(document,'keyup',e=>{
                if(this.$('.game-result').childNodes[0]) return;
                e.preventDefault();
                this.canvas.dispatchEvent(this.KeyboardEvent(e));
            });
            let $ = e=>document.querySelector(e),
                $$ = e=>document.querySelectorAll(e),
                mobileEvent = ['touchstart', 'touchmove', 'touchcancel', 'touchend'],
                ELM_ATTR = (elm, key)=>{if (elm!=undefined &&elm!=null&& elm.nodeType == 1) return elm.getAttribute(key);},
                stopEvent = (e,bool)=>{if(!bool)e.preventDefault();e.stopPropagation();return false;},
                sendState = (arr)=>{
                if(!this.KeyState) return;
                for(var i in this.KeyMap){
                    let k = i.replace('input_player1_','');
                    if(arr.includes(k)){
                        this.KeyState[i] = 1;
                        if(this.KeyMap[i])this.keyPress(this.KeyMap[i],'keydown');
                    }else if(this.KeyState[i] == 1){
                        this.KeyState[i] = 0;
                        if(this.KeyMap[i])this.keyPress(this.KeyMap[i],'keyup');
                    }
                }
                };
                this.on($('.game-msg'),'click',e=>{
                    this.BtnMap['CloseMsg']();
                });
                this.on($('.game-setting'),'click',e=>{
                if(!this.Module._main){
                    this.$('.game-setting').hidden = true;
                    this.Module.onReady();
                }else{
                    this.BtnMap['settings']();
                }
            });
            if(this.istouch){
                /*mobile*/
                mobileEvent.forEach(
                    val =>this.on(
                        $('.game-ctrl'),
                        val,
                        event => {
                            let ct = event.changedTouches && event.changedTouches[0],
                                cte = ct && document.elementFromPoint(ct.pageX, ct.pageY),
                                elm = cte ||event.target,
                                keyState = [],
                                type = event.type,
                                key = ELM_ATTR(elm, 'data-k'),
                                btn = ELM_ATTR(elm, 'data-btn');
                            if (btn) {
                                if (type =="touchend") {
                                    if (type != "touchend" || elm == event.target) {
                                        btn = btn.toLowerCase();
                                        if(this.BtnMap[btn]) this.BtnMap[btn](event);
                                    }
                                }
                                return stopEvent(event,1);
                            } else if (key) {
                                if (event.touches && event.touches.length > 0) {
                                    for (var i = 0; i < event.touches.length; i++) {
                                        var t = event.touches[i];
                                        var k = ELM_ATTR(document.elementFromPoint(t.pageX, t.pageY), 'data-k');
                                        if (k) {
                                            if(k=='ul')keyState = keyState.concat(['up','left']);
                                            else if(k=='ur')keyState = keyState.concat(['down','right']);
                                            else if(k=='dl')keyState = keyState.concat(['up','left']);
                                            else if(k=='dr')keyState = keyState.concat(['down','right']);
                                            else keyState.push(k);
                                        }
                                    }
                                    stopEvent(event);
                                }
                            }
                            sendState(keyState);
                        },
                        {'passive': false}
                    )
                );
            };
            this.on($('.game-list'),this.istouch ? 'touchend':'mouseup',event=>{
                let ct = event.changedTouches && event.changedTouches[0],
                cte = ct && document.elementFromPoint(ct.pageX, ct.pageY),
                elm = cte ||event.target,
                type = event.type,
                btn = ELM_ATTR(elm, 'data-btn');
                if (btn) {
                    if (type != "touchend" || elm == event.target) {
                        btn = btn.toLowerCase();
                        if(this.BtnMap[btn]) this.BtnMap[btn](event);
                    }
                    return stopEvent(event,1);
                }
            });
        }
        StartRetroArch(){
            this.$('.game-setting').classList.add('game-tp');
            this.$('.game-setting').innerHTML = '菜单';
            if(this.istouch){
                this.$('.game-ctrl').hidden = false
                this.$('.game-setting').hidden = true;
            }else{
                this.$('.game-setting').hidden = false;
            }
            this.Module.canvas.hidden = false;
            this.$('.game-zan').remove();
        }
        Timer = {};
        BtnMap = {
            'do': {
                'sw':e=>{
                    if(this.CONFIG['do-sw'])this.BtnMap['sw']['clear']().then(e=>location.reload());
                    else this.BtnMap['sw']['install']().then(result=>this.BtnMap['closelist']());
                },
            },
            'sw':{
                'clear':e=>{
                    return new Promise((ok, erro) => {
                        if('serviceWorker' in navigator)navigator.serviceWorker.getRegistrations().then(registrations=>{
                            for(let i in registrations)registrations[i].unregister();
                            this.SetConfig({'do-sw':false});
                            caches.delete('NengeApp_VBA').then(result=>ok());
                        });
                        else ok();
                    });
                },
                'install':e=>{
                    return new Promise((compelte, erro) => {
                        if('serviceWorker' in navigator){
                            navigator.serviceWorker.register('sw.js').then(async serviceWorker=>{
                                this.SetConfig({'do-sw':true});
                                compelte();
                                console.log('ServiceWorker 注册成功',serviceWorker.scope);
                                    const registrations = await navigator.serviceWorker.getRegistrations();
                                for (let index in registrations) {
                                    let serviceWorker = registrations[index];
                                    if (serviceWorker['active']) {
                                        let controller = serviceWorker['active'], talk = new MessageChannel(), custom = new CustomEvent('message');
                                        talk.port1.onmessage = message => {
                                            let result_1 = message.data;
                                            if (result_1 == 'install') {
                                                console.log('sw=>web 通信建立!');
                                                controller.postMessage = e => talk.port1.postMessage(e);
                                                talk.port1.onmessage = e_1 => {
                                                    controller.onmessage && controller.onmessage(e_1);
                                                    custom.data = e_1.data;
                                                    controller.dispatchEvent(custom);
                                                };
                                            }
                                        };
                                        controller.onmessage = e_2 =>{
                                            if(e_2.data.message){
                                                this.MSG(`<button data-btn>${e_2.data.message}</button>`,true);
                                            }
                                            console.log(e_2.data)
                                        };
                                        controller.postMessage('install', [talk.port2]);
                                    }
                                }
                            },err=>{console.log('ServiceWorker registration failed: ', err);});
                            navigator.serviceWorker.addEventListener('message',message=>{if(message.data.message)this.MSG(`<button data-btn>${message.data.message}</button>`,true)});
                        }else{
                            compelte();
                        }
                    });
                },
            },
            'translate':e=>{
                let baiduKey = this.CONFIG.baiduKey;
                if (baiduKey && baiduKey.id && baiduKey.key) {
                    this.ontranslate = true;
                    this.keyPressOnce('F8');
                    this.BtnMap['closelist']();
                    return ;//this.BtnMap['Baidu']('POST');
                }
                return this.BtnMap['baiduset']();
            },
            'Baidu': async (method, CONFIG) => {
                if(!this.translateimgpath) return;
                let SparkMD5 = await this.BtnMap['SparkMD5']();
                CONFIG = CONFIG || {};
                method = method || 'GET';
                let g = new FormData(),
                    baiduKey = this.CONFIG.baiduKey,
                    p,
                    gd = {
                        "key": baiduKey.key,
                        "appid": baiduKey.id,
                        "from": baiduKey.from,
                        "to": baiduKey.to,
                        "q": baiduKey.q || "",
                        "salt": Math.random(),
                        "cuid": 'APICUID',
                        "mac": 'mac',
                        "version": 3,
                        "paste": 0,
                        //"query":'apple',
                    },
                    delkey = ['mac', 'cuid', 'version', 'paste', 'key'],
                    url = baiduKey.host + '?';
                for (var i in gd) {
                    g.append(i, CONFIG[i] || gd[i]);
                }
                if (method == 'GET') {
                    g.append("callback", 'NengeApp.MSGJSON');
                    g.append("sign", SparkMD5.hash(g.get('appid') + g.get('salt') + g.get('salt') + g.get('key')));
                } else {
                    delkey = ['q', 'key'];
                    p = new FormData();
                    let image = FS.readFile(this.translateimgpath);
                    if(!image||image.length==0) return;
                    let imgmd5 = SparkMD5.ArrayBuffer.hash(image.buffer);
                    p.append("image", new File([image], 'my.png', {
                        type: "image/png"
                    }));
                    g.append("sign", SparkMD5.hash(g.get('appid') + imgmd5 + g.get('salt') + g.get('cuid') + g.get('mac') + g.get('key')));
                }
                delkey.forEach(val => g.delete(val));
                g = new URLSearchParams(g);
                if (method == 'GET') return this.AddJs(url + g);
                else fetch(
                    new Request(url + g, {
                        'method': method,
                        'body': p
                    })
                ).then(
                    v => v.json()
                ).then(
                    v => {
                        let msg = v.error_msg;
                        if (v && v.data) {
                            msg = v.data.sumDst&&v.data.sumDst.replace(/\n/g, '<br>');
                        }
                        this.MSG('<div class="gba-translate-show">' + msg + '</div>')
                    }
                ).catch(
                    e => this.MSG('很遗憾!翻译功能要跨域!')
                );
            },
            'baidusave': e => {
                let baiduKey = {
                    id: document.querySelector('.gba-translate-id').value,
                    key: document.querySelector('.gba-translate-key').value,
                    host: document.querySelector('.gba-translate-host').value,
                    from: document.querySelector('.gba-translate-from').value,
                    to: document.querySelector('.gba-translate-to').value
                };
                if (baiduKey.id && baiduKey.key) {
                    this.SetConfig({
                        baiduKey
                    });
                    this.BtnMap['closelist']();
                } else {
                    return ;
                }
            },
            'baiduset': e => {
                this.HTML.BAIDU_HTML(this.CONFIG.baiduKey || {})
            },
            'canvasBlob':e=>{
                return new Promise(compelte=>{
                    this.Module.canvas.toBlob(b=>compelte(b),{type: "image/png"})
                });
            },
            'SparkMD5':e=>{
                return new Promise(compelte=>{
                    if(typeof SparkMD5 != "undefined")compelte(SparkMD5);
                    else{
                        let script = document.createElement('script');
                        script.src = 'assets/js/SparkMD5.min.js';
                        script.onload = e=>compelte(SparkMD5||null);
                        document.body.appendChild(script);
                    }
                });
            },
            'keypress':e=>{
                let keyname = e&&e.target&&e.target.getAttribute('data-name')||e;
                    console.log(keyname);
                if(keyname){
                    if(this.KeyMap[keyname])this.keyPressOnce(this.KeyMap[keyname]);
                    this.BtnMap['closelist']();   
                }
            },
            'reload': e => {
                location.reload(); 
            },
            'hideui':e=>{
                this.$('.game-ctrl').hidden = true;
                this.$('.game-setting').hidden = false;
            },
            'openui':e=>{
                this.$('.game-ctrl').hidden = false;
                this.$('.game-setting').hidden = true;
            },
            'fullscreen':e=>{
                this.Module.requestFullscreen(false);
            },
            'deletecfg':e=>{
                this.BtnMap['closelist']();
                if(FS.analyzePath(this.retroarchcfg).exists){
                    FS.unlink(this.retroarchcfg);
                    FS.syncfs(e=>{
                        this.MSG(`配置文件:${this.retroarchcfg}已被删除!`);
                    })
                }
            },
            update:e=>{
                this.SetConfig({version:0});
                location.reload();
            },
            remove:async e=>{
                await this.IDBFS.clearDB();
                location.href = 'https://nenge.net';
            },
            stateload:e=>{
                let keyname = 'input_load_state';
                if(this.KeyMap[keyname])this.keyPressOnce(this.KeyMap[keyname]);
    
            },
            statesave:e=>{
                let keyname = 'input_save_state';
                if(this.KeyMap[keyname])this.keyPressOnce(this.KeyMap[keyname]);
    
            },
            'settings': e => this.HTML.settings(),
            'addfile':e=>{
                let dir = e&&e.target&&e.target.getAttribute('data-name') || 'rooms';
                this.BtnMap['upload'](data=>{
                    for(var i in data){
                        let path = `/userdata/${dir}/${i.split('/').pop()}`;
                        if(FS.analyzePath(`/userdata/${dir}/${i.split('/').pop()}`).exists){
                            FS.unlink(path);
                        }
                        if(!FS.analyzePath(`/userdata/${dir}`).exists){
                            FS.createPath('/',`/userdata/${dir}`);
                        }
                        FS.createDataFile(`/userdata/${dir}`,i.split('/').pop(),data[i],!0,!0);
                    }
                    FS.syncfs(e=>this.BtnMap['filelist']());
                });
                this.BtnMap['closelist']();
            },
            'checkFile':(u8,name,cb)=>{
                let head = new TextDecoder().decode(u8.slice ? u8.slice(0,6):subarray(0,6));
                if(/^7z/.test(head))this.Module.un7z(u8,name).then(e=>cb(e));
                else if(/^Rar!/.test(head))this.Module.unRAR(u8,name).then(e=>cb(e));
                else if(/^PK/.test(head))this.Module.unZip(u8,name).then(e=>cb(e));
                else {
                    let data = {};
                    data[name] = u8;
                    cb(data);
                    delete data[name];
                    data = null;
                }
    
            },
            'upload':cb=>{
                let input = document.createElement('input');
                input.type = 'file';
                input.onchange = e=>{
                    let reader = new FileReader(),file = e.target.files[0];
                    if(file){
                        reader.onload = e=>this.BtnMap['checkFile']( new Uint8Array(e.target.result),file.name,cb);
                        reader.readAsArrayBuffer(file);
                    }
                    input.remove();
                };
                input.click();
            },
            download:(buf, name,mime)=>{
                let a = document.createElement('a');
                a.href = URL.createObjectURL(buf instanceof Blob ? buf : new Blob(buf instanceof Uint8Array ?[buf]:buf, mime||{type: 'application/octet-stream'}));
                a.download = name;
                a.click();
                a.remove();
            },
            savepathdata:(e,txt)=>{
                let elm = !txt&&e.target,
                    path = e;
                if(elm){
                    path = this.$('.game-pathlink')&&this.$('.game-pathlink').value || elm.getAttribute('data-path');
                    txt = this.$('.game-pathtxt')&&this.$('.game-pathtxt').value || '';
                }
                if(path&&txt){
                    if(FS.analyzePath(path).exists){
                        FS.unlink(path);
                    }else if(!FS.analyzePath(path.split('/').slice(0,-1).join('/')).exists){
                        FS.createPath('/',path.split('/').slice(0,-1).join('/'));
                    }
                    FS.writeFile(path,new TextEncoder().encode(txt));
                    FS.syncfs(e=>{
                        this.BtnMap['closelist']();
                        this.MSG(`path:${path} 已保存，并且同步了文件储存!`);
                    });
                }
            },
            savepathlink:(oldpath,newpath)=>{
                let elm = !newpath&&oldpath&&oldpath.target;
                if(elm || !newpath){
                    oldpath = this.$('.game-patholdlink')&&this.$('.game-patholdlink').value || elm.getAttribute('data-patholdlink');
                    newpath = this.$('.game-pathnewlink')&&this.$('.game-pathnewlink').value || elm.getAttribute('data-pathnewlink');
                }
                if(oldpath&&newpath&&oldpath!=newpath&&FS.analyzePath(oldpath).exists){
                    let temp;
                    if(FS.analyzePath(newpath).exists){
                        temp  = newpath.split('.');
                        FS.rename(newpath,temp.slice(0,-1).join('.')+new Date().valueOf()+temp.pop());
                    }
                    //FS.writeFile(newpath,FS.readFile(oldpath));
                    FS.rename(oldpath,newpath);
                    FS.syncfs(e=>{
                        this.BtnMap['closelist']();
                        this.MSG(`path:${oldpath}=>${newpath} 改变，并且同步了文件储存!`);
                    });
                }else{
                    this.BtnMap['closelist']();
                }
            },
            downpath:e=>{
                let  path = e&&e.target?e.target.getAttribute('data-path'):e;
                if(path){
                    if(FS.analyzePath(path).exists){
                        console.log(FS.readFile(path));
                        this.BtnMap['download'](FS.readFile(path),path.split('/').pop());
                    }
                }
            },
            setpath:e=>{
                let  path = e&&e.target?e.target.getAttribute('data-path'):e;
                if(path){
                    this.GameLink = path;
                    location.reload();
                }
            },
            deletepath:e=>{
                let  path = e&&e.target?e.target.getAttribute('data-path'):e;
                if(path){
                    if(FS.analyzePath(path).exists){
                        FS.unlink(path);
                        FS.syncfs(e=>{
                            this.BtnMap['closelist']();
                            this.MSG(`${path} 已删除！`);
                        });
                    }
                }
            },
            editpath:e=>{
                let  path = e&&e.target?e.target.getAttribute('data-path'):e;
                if(path){
                    if(FS.analyzePath(path).exists){
                        let txt = new TextDecoder().decode(FS.readFile(path));
                        this.RESULT(
                            `<div class="game-edittxt">`
                            +`<h3>编辑:${path} 一旦保存会同步文件记录,包括临时上传的文件!</h3>`
                            +`<input class="game-pathlink" type="text" value="${path}" style="width:calc(100% - 30px);height:60px;">`
                            +`<div class="game-button" data-btn="savepathdata" data-path="${path}">保存</div>`
                            +`<div><textarea class="game-pathtxt">${txt}</textarea></div>`
                            +`<div class="game-button" data-btn="savepathdata" data-path="${path}">保存</div>`
                            +`</div>`
                        );
                        //this.BtnMap['download'](,path.split('/').pop());
                    }
                }
            },
            changepath:(e,newpath)=>{
                let elm = !newpath&&e.target,oldpath = e;
                newpath = newpath || oldpath;
                if(elm){
                    oldpath = elm.getAttribute('data-path');
                    if(this.GameLink&&(/\.srm$/i).test(oldpath)){
                        let gamename = this.GameLink.split('/').pop().split('.').slice(0,-1).join('.'),
                            olddir = oldpath.split('/'),
                            type = olddir.pop().split('.').pop();
                        newpath = olddir.join('/')+'/'+gamename +'.'+type;
                    }else{
                        newpath = oldpath;
                    }
                }
                if(oldpath&&newpath){
                    this.RESULT(
                        `<div class="game-edittxt">`
                        +`<h3>旧位置:${oldpath} <br>修改后需要重启游戏才会读取srm存档!事先复制好游戏名.</h3>`
                        +`<input class="game-patholdlink" type="text" value="${oldpath}" style="width:calc(100% - 30px);height:60px;" disabled>`
                        +`<h3>新位置</h3>`
                        +`<input class="game-pathnewlink" type="text" value="${newpath}" style="width:calc(100% - 30px);height:60px;">`
                        +`<div class="game-button" data-btn="savepathlink">保存</div>`
                        +`</div>`
                    );
                }else{
                    this.BtnMap['closelist']();
                }
    
            },
            'filelist':e=>{
                this.IDBFS.getAllKeys('userdata').then(result=>this.HTML.filelist(result));
            },
            'closelist': e => {
                let list = this.$('.game-list');
                    list.style.cssText = '';
                    if(this.ListResultHide)list.classList.remove('hideTitle');
                    this.$('.game-result').innerHTML = '';
            },
            'openlist': e => {
                let list = this.$('.game-list');
                    list.style.cssText = 'top:0px';
                    if(e===true){
                        this.ListResultHide = true;
                        list.classList.add('hidetitle');
                    }
            },
            'closemsg': e => {
                this.BtnMap['CloseMsg']();
            },
            'CloseMsg': e => {
                let elm = this.$('.game-msg');
                elm.hidden = e?false:true;
                if(e){
                    let txt = elm.textContent,
                    size = this.$('.game-container').getBoundingClientRect(),
                    width = txt.length*18>size.width?'60%':txt.length*16+'px',
                    height = Math.max(Math.floor(txt.length*18/size.width)*20,200)+'px';
                    elm.style.cssText = `width:${width};height:${height};`;
                }else{
                    elm.style.cssText = ``;
                }
            }
        };
        autosaves = true;
        checkLog = text=>{
            if(/Loading content file:.+?\.$/.test(text)){
               let link = text.match(/Loading\scontent\sfile:\s(.+?)\.?$/i);
               if(link&&link[1]){
                    let GameLink = link[1].replace(/^"?(.+?)"?$/,"$1");
                    console.log(GameLink);
                    this.GameLink = GameLink;
                    //this.$('.game-container').classList.add(this.GameSys);
                }else{
                    console.log(link,text);
                }
            }else if(/\[INFO\]\s\[Video\]:\sVideo\s@\s\d+x\d+/.test(text)||/\[INFO\]\s\[Video\]:\s?Set\s?video\s?size\sto:\s\d+x\d+\.?/.test(text)){
                let wh = text.split(' ').pop().split('x');
                this.AspectRatio = wh&&Number(wh[0])/Number(wh[1]);
                if(!this.Module.callMain)this.resize();
            }
            else{
              let data = [
                  // /^\[INFO\]\s?\[SRAM\]:\s?Saved\s?successfully\s?to/i,
                  ///^\[INFO\]\s\[State\]:\sSaving\state\s/,
                  // /^\[INFO\]\s\[State\]:\sFile\salready\sexists\./i,
                  ///^\[INFO\] \[State\]: Loading state "/,
                  // /^\[INFO\]\s\[State\]:\sSaving\sstate\s"\/userdata\/states\//i,
                  /Saved new CONFIG to/i,
                  // /\[INFO\]\sApplying\scheat\schanges\./i
                  ];
              for(let i=0;i<data.length;i++)if(data[i].test(text)){
                  clearTimeout(this.syncfsTimer);
                  this.syncfsTimer = setTimeout(e=>FS.syncfs(e=>this.HTML.syncfs(text.match(/\"(.+?)\"\.?/)[1])),1500);
                  break;
              }
            }
            return false;
        };
        CheckMessage(info,data){
            console.log(info);
            //console.log(data);
        }
        constructor(){
            let onready = e=>{
                this.onReady();
                this.un(document,t,onready);
            },
            t='DOMContentLoaded';
            this.on(document,t,onready);
        }
        $ = e=>document.querySelector(e);
        $$ = e=>document.querySelectorAll(e);
        de(elm,eventdata){
            elm.dispatchEvent(eventdata);
            return elm;
        }
        on(elm,eventType,cb,eventdata){
            elm.addEventListener(eventType,cb,eventdata);
            return elm;
        }
        un(elm,eventType,cb,eventdata){
            elm.removeEventListener(eventType,cb,eventdata);
            return elm;
        }
        keyPress(key,type){
            let m = this.keyToCode[key.toLowerCase()];
            this.canvas.dispatchEvent(new KeyboardEvent(type, {'code':m||key,'key':key}));
        }
        keyPressOnce(key){
            this.keyPress(key,'keydown');
            setTimeout(()=>this.keyPress(key,'keyup'),50);
        }
        KeyboardEvent(e){
            let code = e.code;
            if(code.search('Arrow') != -1){
                //code = code.replace('Arrow','').toLowerCase();
            }
           return new KeyboardEvent(e.type,{
              "code":code,
              "key":e.key,
              "location":e.location,
              "ctrlKey":e.ctrlKey,
              "shiftKey":e.shiftKey,
              "altKey":e.altKey,
              "metaKey":e.metaKey,
              "repeat":e.repeat,
              "locale":e.locale,
              "char":e.char,
              "charCode":e.charCode,
              "keyCode":e.keyCode,
              "which":e.which
           });
        }
        RESULT = (html,bool)=>this.Module.HTML.RESULT(html,bool);
        MSG = (html,bool)=>this.Module.HTML.MSG(html,bool);
        SetConfig = d=>this.Module.SetConfig(d);
        get Module(){
            return Module;
        }
        get IDBFS(){
            return this.Module.IDBFS;
        }
        get HTML(){
            return this.Module.HTML;
        }
        get KeyState(){
            return this.Module.KeyState;
        }
        get KeyMap(){
            return this.Module.KeyMap;
        }
        get keyToCode(){
            return this.Module.keyToCode;
        }
        get canvas(){
            return this.Module.canvas;
        }
        get CONFIG(){
            if(!this.Module.CONFIG)this.Module.CONFIG = JSON.parse(localStorage.getItem(this.Module.__coresname))
            return this.Module.CONFIG;
        }
        get GameName(){
            if(!this.Module.GameLink) return "";
            return this.GameLink.split('/').pop();
        }
        get GameSys(){
            if(!this.Module.GameLink) return "";
            return this.GameName.split('.').pop();
        }
        get GameLink(){
            if(!this.Module.GameLink)this.Module.GameLink = this.CONFIG['lastgame'];
            return this.Module.GameLink;
        }
        set GameLink(name){
            this.SetConfig({'lastgame':name});
            this.Module.GameLink = name;
        }
        get CoresName(){
            return this.Module.CoresName;
        }
        set CoresName(name){
            this.Module.CoresName = name;
        }
        get AspectRatio(){
            return this.Module.AspectRatio;
        }
        set AspectRatio(name){
            this.Module.AspectRatio = name;
        }
    }
})(Module);