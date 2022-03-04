(function(Module){
    Module.HTML = new class{
        istouch = "ontouchstart" in document;
        $ = e=>document.querySelector(e);
        $$ = e=>document.querySelectorAll(e);
        get BtnMap(){
            return Module.EVENT.BtnMap;
        }
        Timer = {};
        syncfs(file){
            this.MSG(`文件同步成功${file&&`<p>位置：${file}</p>`||``}`,true);
        }
        filelist(result){
            
            let game = '',saves='',cheat='',other='';
            for(let index=0;index<result.length;index++){
                let path = result[index],
                    filename = path.split('/').pop(),
                    mime = filename.split('.').pop();
                if(['gb','gbc','gba'].includes(mime)){
                    game += `<tr title="${path}"><td><span data-btn="deletepath" data-path="${path}">删除</span></td><td>${filename}</td><td><span data-btn="changepath" data-path="${path}">更改</span></td><td><span data-btn="setpath" data-path="${path}">启动</span></td></tr>`;
                }else if(['srm','state'].includes(mime)){
                    saves += `<tr title="${path}"><td><span data-btn="deletepath" data-path="${path}">删除</span></td><td>${filename}</td><td><span data-btn="downpath" data-path="${path}">下载</span></td><td><span data-btn="changepath" data-path="${path}">更改</span></td></tr>`;
                }else if(['cht'].includes(mime)){
                    cheat += `<tr title="${path}"><td><span data-btn="deletepath" data-path="${path}">删除</span></td><td>${filename} | </td><td><span data-btn="downpath" data-path="${path}">下载</span></td><td><span data-btn="editpath" data-path="${path}">编辑</span></td></tr>`;
                }else if(filename != mime){
                    other += `<tr title="${path}"><td><span data-btn="deletepath" data-path="${path}">删除</span></td><td>${filename}</td><td><span data-btn="downpath" data-path="${path}">下载</span></td><td><span data-btn="changepath" data-path="${path}">更改</span></td></tr>`;
                }
            }
            this.RESULT(`<h3>文件列表</h3>`
                +`<table class="game-tablelist">`
                +`<tr><td colspan="4">游戏文件 - 启动游戏会刷新页面！</td></tr>`
                +`${game}`
                +`<tr><td colspan="4">存档文件 - 修改文件为当前游戏重启时读取</td></tr>`
                +`${saves}`
                +`<tr><td colspan="4">金手指文件</td></tr>`
                +`${cheat}`
                +`<tr><td colspan="4">其他文件</td></tr>`
                +`${other}`
                +`</table>`
                );
        }
        settings(){
            let t = `<div class="game-button" data-btn="`;
            this.RESULT(
                `<div class="game-doing">`
                +`${t}addfile" data-name="rooms">添加游戏</div>`
                +`${t}filelist">文件列表</div>`
                +(
                    this.istouch&&
                        (
                        this.$('.game-ctrl').hidden == false ? 
                        `${t}hideui">关闭UI</div>`:
                        `${t}openui">打开UI</div>`
                        )
                    ||``
                )
                +`${t}keypress" data-name="input_menu_toggle">进入系统</div>`
                +`${t}reload">刷新页面</div>`
                +`${t}keypress" data-name="input_toggle_fast_forward">加速开关</div>`
                +`${t}keypress" data-name="input_toggle_slowmotion">龟速开关</div>`
                //+`${t}fullscreen">全屏开关</div>`
                +`${t}keypress" data-name="input_reset">重启游戏</div>`
                +`${t}addfile" data-name="saves">上传存档</div>`
                +`${t}addfile" data-name="sates">上传状态</div>`
                +`${t}deletecfg">默认配置</div>`
                +`${t}update">重载版本(刷新)</div>`
                +`${t}remove">清空所有数据</div>`
                +`${t}baiduset">翻译API</div>`
                +`${t}translate">翻译</div>`
                +`</div>`
            );
        }
        BAIDU_HTML(translate) {
            this.RESULT(`<div class="gba-translate-set"><h3>翻译API 目前使用百度</h3><p>申请地址:<a href="https://api.fanyi.baidu.com/product/22">https://api.fanyi.baidu.com/product/22</a></p><p>申请成功后点击<a href="https://api.fanyi.baidu.com/manage/developer">开发者信息</a></p>` +
                `<p><label>APPID:<input type="text" class="gba-translate-id biginput" tabindex="1" value="${translate.id||''}"></label></p>` +
                `<p><label>密 钥：<input type="text" class="gba-translate-key biginput" tabindex="2" value="${translate.key||''}"></label></p>` +
                `<p><label>来 源：<input type="text" class="gba-translate-from biginput" tabindex="3" value="${translate.from||'auto'}"></label></p>` +
                `<p><label>目 标：<input type="text" class="gba-translate-to biginput" tabindex="4" value="${translate.to||'zh'}"></label></p>` +
                `<p><label>跨域：<input type="text" class="gba-translate-host biginput" tabindex="5" value="${translate.host||'https://api.nenge.net/translateBaidu.php'}"></label><br>https://api.nenge.net/translateBaidu.php</p><p><label><button data-btn="baidusave">保存</button></p><p>跨域服务器由能哥网自由服务提供（使用期限不确定！），如果有服务器资源的朋友，可以自己搭建下方是PHP代码！百度翻译月免费1万次，多出部分四毛钱一次！</p></div>`);
        }
        RAR_HTML(message){
            this.RESULT(`<div class="gba-rar"><h3>${message}</h3><p><input value="" class="gba-rar-password" placeholder="输入密码 Enter password"></p><p><button data-btn="unrar">解压 Uncompress</button> | <button data-btn="exitrar">取消 Cancel</button></p><p class="gba-tl"><b>Uncaught Missing password:</b>需要密码</p><p class="gba-tl"><b>Uncaught File CRC error:</b>密码可能不正确！ password erro!</p></div>`,true);
        }
        RAR_PASSWORD(){
            let elm = this.$(".gba-rar-password");
            return elm&&elm.value;
        }
        RAR_ERROR(e){
            this.MSG(e.message||'rar发生未知错误!');
        }
        RESULT(html,bool) {
            let result = this.$('.game-result');
            result.innerHTML = html;
            this.BtnMap['openlist'](bool);
            result = null;
        }
        MSG(str, bool) {
            clearTimeout(this.Timer.msg);
            this.$('.game-msg').innerHTML = str;
            this.BtnMap['CloseMsg'](true);
            if (bool==true) {
                this.Timer.msg = setTimeout(e => this.BtnMap['CloseMsg'](),2000)
            }
        }
    }
}(Module))