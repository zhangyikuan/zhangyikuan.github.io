/**
 * @modified from herbertliu badjs
 * @author shinelgzli
 * @date 2013-02-25 version 0.2
 * @description jsreport上报
 * @param msg {String} 上报错误信息
 * @param url {String} 该上报信息所属的文件路径
 * @param line {Number} 上报信息所属的文件行号，没有为0
 * @param level {Number} 上报对应的级别 debug（调试日志）：1 ; info（流水日志）：2 ; error（错误日志）：4（默认值） ; fail（致命错误日志）：8
 * @param type {Number} 默认为 -1,表示从onerror捕捉到的错误，2为业务JS错误上报 
 * @example jsreport.init(bid, rate, delay) 业务ID：bid需要申请,rate：错误采样率，如10表示采样10%，delay，错误上报延时，单位 s
 * @example jsreport.report(msg,url,line,level,type)  
 */

(function() {
    var env = {};
    var nav = window.navigator;
    var intime = +(new Date);
    var cReport = true;
    window.jsreport = (function() {
        var config = {
            bid: 102
        };
        var report = function(msg, url, line, level, type) {
            if (!cReport) return false;

            var bid = report.bid || config.bid;
            level = Number(level) || 4;
            if (!env.info) {
                env.info = {};
                env.info.userAgent = nav.userAgent;
                env.info.platform = nav.platform;
                env.info.appCodeName = nav.appCodeName;
                env.info.appName = nav.appName;
                env.info.appVersion = nav.appVersion;
            }

            var info = env.info;
            var _info = info && ['|_|browser:[',
                'agent:' + info.userAgent,
                ',plat:' + info.platform,
                ',appcode:' + info.appCodeName,
                ',appname:' + info.appName,
                ',appversion:' + info.appVersion +
                ']',
                '|_|' + 'st:' + ((+new Date()) - intime)
            ].join('') || '';
            var surl = location.href;
            setTimeout(function() {
                if ((typeof msg == 'object') && msg.toString) {
                    var msg_str = msg.toString();
                    if (msg_str.indexOf('[object event]') > -1) {
                        msg = objectSerialize(msg);
                    } //if
                } //if
                var img = new Image();
                var domainRoute = location.protocol + '//iyouxi.vip.qq.com/';
                img.src = domainRoute + 'common/js-report.php?type=' +
                    type + '&level=' + level + '&bid=' + bid +
                    '&surl=' + encodeURIComponent(surl) +
                    '&msg=' + encodeURIComponent(msg) + '|_|' +
                    line + _info + '|_|' + url + '&r=' + Math.random();
            }, report.buffTime * 1000);
        }
        /**
         * @param msg {Number} bid，整数，业务ID，联系shinelgzli申请
         * @param url {Number} rate，上报采样率，默认暂为100，建议流量大的降低采样率
         * @param line {Number} bufferTime，上报错误信息时延迟时间，单位为秒
         **/
        report.init = function(bid, rate, bufferTime) {
            if (typeof(bid) == 'undefined') {
                throw "jsreport缺少bid";
                return;
            }
            report.rate = rate || 100;
            report.buffTime = bufferTime || 3;
            report.bid = bid;

            if (Math.random() > report.rate / 100) {
                return cReport = false;
            }
            this.report('v', location.href, 0, 1, 1);
        }
        /**
         * @see Class description
         * @example:
         * report('error info','http://',11,1,2);
         * report('error info', 2);
         **/
        report.report = function(msg, url, line, level, type) {
            //只有两个参数时，即传msg和type的情况
            if (arguments.length == 2) {
                report(msg, location.href, 0, 4, url);
            } else {
                report(msg, url || location.href, line || 0, level || 4, type || 2);
            }
        };
        //将obj变成一个字符串形式，最多读30个属性
        function objectSerialize(obj) {
            var str = [],
                i = 0,
                x;
            if (obj.toString) {
                str.push(obj.toString());
            }
            for (x in obj) {
                if (i++ > 30) break;
                try {
                    if (typeof obj[x] == 'object') {
                        str.push(x + '=' + obj[x].toString().replace(/[\n\s\r]/g, ''));
                    } else {
                        str.push(x + '=' + obj[x]);
                    }
                } catch (e) {
                    str.push(x + '=read-err#' + e.message);
                }
            }
            return str.join('&');
        }
        var arr = [];
        //(msg,url,line,level,type)  
        window['onerror'] = function() {
            var stack = '';
            //貌似是一个事件参数触发
            if (arguments.length == 1 && typeof arguments[0] == 'object') {
                var ext = '';
                if (arguments[0].target) {
                    ext = arguments[0].target.src;
                }
                report.apply(this, ['oneargs#' + ext + '#' + objectSerialize(arguments[0]), '', 0, null, -1]);
            } else {
                if (arguments[4] && typeof arguments[4] == 'object') {
                    stack = (arguments[4].stack || '').replace(/\n/g, '');
                }
                arr.splice.apply(arguments, [3, 0, null, -1]);
                arguments[0] += '#stack:' + stack;
                report.apply(this, arguments);
            }
        };
        return report;
    })();
}).call(this);
(function() {
    var jp = document.getElementsByTagName('script'),
        url, mths;
    for (var i = 0, len = jp.length; i < len; i++) {
        url = jp[i].src;
        if (url) {
            mths = url.match(/\/jsreport-?([\.\d]*)\.js.*[?&]rpt_bid=(\d+)&?/)
            if (mths && mths[2]) {
                var rate = 100,
                    name = "rate",
                    reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"),
                    r = url.match(reg);
                if (r != null) {
                    rate = unescape(r[2]).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&apos;').replace(/"/g, '&quot;');
                }
                jsreport.init(mths[2], rate);
            }
        }
    }
})();