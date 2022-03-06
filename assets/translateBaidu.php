<?php
header("Access-Control-Allow-Origin:*"); 
header("Content-type: text/html; charset=utf-8");
error_reporting(E_ALL & ~E_NOTICE);
class NengeApp{
    function __construct(){
        $this->API = array(
            "baidu" => array (
                "txt"=>"https://fanyi-api.baidu.com/api/trans/vip/translate?",
                "img"=>"https://fanyi-api.baidu.com/api/trans/sdk/picture?"
            )
        );
        $this->getRequest(empty($_GET["q"])&&isset($_FILES["image"]) ? "POST":"GET","baidu");
        //echo phpinfo();
    }
    function getRequest($method="GET",$sitename,$timeout = 20){
        $isGET = $method=="GET" ;
        $query =$_SERVER["QUERY_STRING"];
        //"http://127.0.0.1/api/translateBaidu2.php?";//
        $url = $this->API[$sitename][$isGET?"txt":"img"];
        $ssl = parse_url($url)["scheme"] == "https" ? false : null;
        $bodyDate = array();
        foreach($_POST as $k=>$v){
            $bodyDate[$k] = $v;
        }
        foreach($_FILES as $k=>$v){
            $bodyDate[$k] = new CURLFile($v["tmp_name"],$v["type"],$v["name"]);//"@".$v["tmp_name"].";type=".$v["type"].";filename=".$v["name"];
        }
        $curlObj = curl_init();
        $options = [
            CURLOPT_URL => $url.$query,
            CURLOPT_RETURNTRANSFER => 1,
            CURLOPT_FOLLOWLOCATION => 1,
            CURLOPT_AUTOREFERER => 1,
            CURLOPT_USERAGENT => "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.63 Safari/537.36",
            CURLOPT_TIMEOUT => $timeout,
            //CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_0,
            //请求头
            CURLOPT_HTTPHEADER => array(
                "User-Agent"      => "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_6) AppleWebKit/537.36 (KHTML, like Gecko) baidu-music/1.2.1 Chrome/66.0.3359.181 Electron/3.0.5 Safari/537.36",
                "Accept"          => "*/*",
                //"text/html;charset=UTF-8",
                "Content-type"    => "application/json;charset=UTF-8",
                "Accept-Language" => "zh-CN",
            ),
            //IP4
            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
            //CURLOPT_REFERER => isset($api["refer"])?$api["refer"]:$url_info["host"], //伪造来路
            //CURLOPT_COOKIEFILE=>dirname(__FILE__)."/kugou.cookies.txt",
            //CURLOPT_COOKIEJAR=>dirname(__FILE__)."/kugou.cookies.txt",
            CURLOPT_POST=>$isGET ?false:true,
            CURLOPT_POSTFIELDS => $isGET? null:$bodyDate,
            CURLOPT_SSL_VERIFYHOST => $ssl,
            CURLOPT_SSL_VERIFYPEER => $ssl,
            CURLOPT_COOKIE=>null,
        ];
        //print_r($options);exit;
        curl_setopt_array($curlObj, $options);
        $returnData = curl_exec($curlObj);
        if (curl_errno($curlObj)) {
            //error message
            $returnData = curl_error($curlObj);
        }
        curl_close($curlObj);
        echo $returnData;
    }

}
new NengeApp();
?>