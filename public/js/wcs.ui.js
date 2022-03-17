"use strict";

/**
* 모든 함수의 실행은 소스 맨 하단의 fn_init() 에서 이루어짐.
**/

// 상태정보용 오브젝트 선언
var TM = new Object();

// 로그인 상태
TM.isLogin = false;

// 참여자목록 열림 상태
TM.isOpenMemberList = false;

// 채팅 프록시 생성
var chat = new signalR.HubConnectionBuilder().withUrl("/chatHub").build();


var adh = new AjaxDataHelper();
var apiMemberURL = "api/common/member/adminlogin";

var chatStatus = false;

//var tabIndex = 0;
var chatSaveType = "NONE";

var chatcontent = { "chatlist": [{ "username": "", "msgtype": "", "msg": "", "msgdate": "", "fontfamily": "tmFontFamily1", "fontsize": "tmFontSize2", "fontcolor": "tmFontColor8", "fontstyle": "tmFontStyle1" }] };

// 사이트에서 넘겨받은 유저이름이 있는 경우 대화명 고정 및 대화명 변경 비활성 처리
var isFixedUserName = true;


//채팅서버연결 이벤트
chat.start().then(function () {

    console.log("채팅서버 연결이 완료되었습니다.");

    //자동로그인 기능 제공
    if (isFixedUserName) {
        $("#tmBtnConfirmName").click();
        console.log("자동 로그인 되었습니다.");
    }
    else {
        $("#tmPopWrap").show();
        $("#tmInputName").focus();
    }

}).catch(function (err) {
    return console.error(err.toString());
});



// 클라이언트 종류가 모바일인지 여부 체크
var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

// 풀스크린 모드로 전환함
function fn_enterFullScreen(element) {
    alert("enter");
    alert(element.webkitRequestFullScreen);
    if (element.webkitRequestFullScreen) {
        alert("enter if");
        element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    }
}

// 풀스크린 모드가 아닌지 여부
function fn_isStandAlone() {
    return ((document.fullScreenElement && document.fullScreenElement !== null) ||
        (!document.mozFullScreen && !document.webkitIsFullScreen));
}

// 모바일 클릭딜레이 없애기
function fn_noClickDelay() {
    $("button, a").each(function () {
        new NoClickDelay(this);
    });
}

// 레이아웃 리사이징
function fn_resizeFrame() {
    // 레이아웃 조정
    var layoutScale = new Object();
    layoutScale.winHeight = $(window).height();
    layoutScale.tmHeadHeight = $(".tmHead").height();
    layoutScale.tmBodyHeight = layoutScale.winHeight - layoutScale.tmHeadHeight;

    layoutScale.tmPreferenceWidth = $("#tmLayerPreference").outerWidth();
    layoutScale.tmPreferenceHeight = layoutScale.tmBodyHeight - 32;
    layoutScale.tmMemberListWidth = $("#tmLayerMemberList").outerWidth();
    layoutScale.tmMemberListInnerBtnAreaHeight = $("#tmLayerMemberList .tmInnerBtnArea").outerHeight();
    layoutScale.tmMemberListFormCheckboxHeight = TM.isLogin ? layoutScale.tmBodyHeight - layoutScale.tmMemberListInnerBtnAreaHeight : layoutScale.tmBodyHeight;
    layoutScale.tmMessageListHeight = layoutScale.tmBodyHeight - $("#tmMessageForm").outerHeight() - $("#tmCopyright").outerHeight();

    $(".tmBody").height(layoutScale.tmBodyHeight);

    if (parseInt($("#tmLayerMemberList").css("left")) != 0) {
        $("#tmLayerMemberList").css("left", -layoutScale.tmMemberListWidth);
    }

    if (layoutScale.winWidth < 320) {
        $("#tmLayerChat").css("left", layoutScale.winHeight);
    }
    else {
        if (TM.isOpenMemberList) {
            $("#tmLayerChat").css("left", layoutScale.tmMemberListWidth);
        }
    }

    if (parseInt($("#tmLayerPreference").css("right")) != 0) {
        $("#tmLayerPreference").css("right", -layoutScale.tmPreferenceWidth);
    }

    $("#tmLayerMemberList").find(".scroll-pane").height(layoutScale.tmMemberListFormCheckboxHeight);
    $("#tmMessageList").height(layoutScale.tmMessageListHeight);
    $("#tmPreferenceView").height(layoutScale.tmPreferenceHeight);

    // 로그인 폼 위치 조정
    var loginFormScale = new Object();
    loginFormScale.winWidth = $(window).width();
    loginFormScale.winHeight = $(window).height();
    loginFormScale.popWidth = $("#tmPopWrap").outerWidth();
    loginFormScale.popHeight = $("#tmPopWrap").outerHeight();
    loginFormScale.bodyWidth = $("#tmLayerChat .tmBody").outerWidth();
    loginFormScale.bodyHeight = $("#tmLayerChat .tmBody").outerHeight();
    loginFormScale.popTop = (loginFormScale.bodyHeight - loginFormScale.popHeight) / 2;
    loginFormScale.popLeft = (loginFormScale.bodyWidth - loginFormScale.popWidth) / 2;
    loginFormScale.options = new Object();
    loginFormScale.options.top = loginFormScale.popTop;
    loginFormScale.options.left = loginFormScale.popLeft;

    // 320px 미만에서 로그인 폼 높이 조절
    if (loginFormScale.winWidth < 320) {
        loginFormScale.options.top = 0;
        loginFormScale.options.left = 0;
        loginFormScale.options.height = loginFormScale.winHeight - $("#tmLayerChat .tmHead").outerHeight() - ($("#tmMessageForm").outerHeight() + $("#tmCopyright").outerHeight());
    }
    else {
        $("#tmPopWrap").css("height", 0);
        loginFormScale.options.height = "";
    }

    $("#tmPopWrap").css(loginFormScale.options);

    // 스크롤 갱신
    jScrollPaneInit();
}

// jScrollPane
function jScrollPaneInit() {
    $('.scroll-pane').each(function () {
        var _this = $(this);
        _this.jScrollPane({
            showArrows: true,
            animateScroll: true
        });
        var contentPane = _this.data('jsp').getContentPane();
    });
}

// jScrollPane 갱신: 메세지 리스트 
function jScrollPaneMessageListReInit() {
    jScrollPaneInit();
    $("#tmMessageList .tmInner .jspPane").css("padding-bottom", "50px");
    var pane = $("#tmMessageList .tmInner.scroll-pane").data('jsp');
    pane.scrollTo(0, 10000000);
}

// jScrollPane 갱신: 메세지 리스트  최상단 이동
function jScrollPaneMessageTopMove() {
    jScrollPaneInit();
    $("#tmMessageList .tmInner .jspPane").css("padding-bottom", "50px");
    var pane = $("#tmMessageList .tmInner.scroll-pane").data('jsp');
    pane.scrollTo(0, 0);
}

// 문자열 앞 뒤 공백 제거
function fn_removeWhiteSpacePrePost(str) {
    return str.replace(/(^\s*)|(\s*$)/g, "");
}

// 문자열에 포함된 모든 공백 제거
function fn_removeWhiteSpaceAll(str) {
    return str.replace(/(\s*)/g, "");
}

// 문자열 자르기
function fn_stringCut(string, limitLength) {
    if (limitLength == 0) return string;
    var str = string;
    var tmp = 0;
    for (var i = 0; i < str.length; i++) {
        tmp += (str.charCodeAt(i) > 128) ? 2 : 1;
        if (tmp > limitLength) return str.substring(0, i) + "";
    }
    return str;
}

// 문자열 길이제한 통과 여부
function fn_getStringLength(string, limitLength) {
    if (limitLength == 0) return string;
    var str = string;
    var tmp = 0;
    for (var i = 0; i < str.length; i++) {
        tmp += (str.charCodeAt(i) > 128) ? 2 : 1;
        if (tmp > limitLength) return false;
    }
    return true;
}

// 캐리지리턴 위치를 가져옴
function getCaret(el) {
    if (el.selectionStart) {
        return el.selectionStart;
    } else if (document.selection) {
        el.focus();

        var r = document.selection.createRange();
        if (r == null) {
            return 0;
        }

        var re = el.createTextRange(),
            rc = re.duplicate();
        re.moveToBookmark(r.getBookmark());
        rc.setEndPoint('EndToStart', re);

        return rc.text.length;
    }
    return 0;
}

// 메세지 출력: 나 : Append
function fn_addMyMessage(message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmMyMsg">';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();


    if (chatSaveType != "NONE") {
        fn_JsonMsg(chatNickName, "M", message, fontFamily, fontSize, fontColor, fontStyle);
    }
}

// 메세지 출력: 나 : Prepend
function fn_addMyPreMessage(message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmMyMsg">';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").prepend(html);

    //jScrollPaneMessageListReInit();


    //if (chatSaveType != "NONE") {
    //    fn_JsonMsg(chatNickName, "M", message, fontFamily, fontSize, fontColor, fontStyle);
    //}
}

// 메세지 출력: 상대방
function fn_addOtherMessage(nickName, message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();

    if (chatSaveType != "NONE") {
        fn_JsonMsg(nickName, "O", message, fontFamily, fontSize, fontColor, fontStyle);
    }
}

// 메세지 출력: 상대방:Prepend
function fn_addOtherPreMessage(nickName, message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").prepend(html);
}


// 파일업로드 수신 메시지
function fn_addFileMessage(nickName, message, fileName, fileSize, validDate, baseTime) {


    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');

    var arrFileName = fileName.split('.');
    var fileFilter = "/JPG/JPEG/PNG/GIF/BMP/";
    var thumnailFileName = "";

    if (fileFilter.indexOf(arrFileName[1]) > 0) {
        thumnailFileName = arrFileName[0] + "_Thumb." + arrFileName[1];
    }




    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');

            var linkText = "";
            linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' ><img src='/Images/ThemeDefault/BG-chat_icon_file.png'></a>";

            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += '	<span class="tmMsg">파일명: ' + fileName + '<br>유효기간: ' + validDate + ' 까지<br>용량: ' + fileSize + ' Byte<br><br>' + message + ' <b class="tmTime">' + baseTime + '</b></span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();

    if (chatSaveType != "NONE") {
        fn_JsonMsg(nickName, "O", message, "", "", "", "");
    }
}

//파일 메시지 처리
function fn_addFileMessage2(nickName, message, baseTime) {

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();

    if (chatSaveType != "NONE") {
        fn_JsonMsg(nickName, "O", message, "", "", "", "");
    }
}

//타인 파일 메시지 프리펜더
function fn_addFilePreMessage2(nickName, message, baseTime) {

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").prepend(html);
}


//내파일 메시지처리
function fn_addMyFileMessage(message, fileName, fileSize, validDate, baseTime) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    var arrFileName = fileName.split('.');
    var fileFilter = "/JPG/JPEG/PNG/GIF/BMP/";
    var thumnailFileName = "";

    if (fileFilter.indexOf(arrFileName[1]) > 0) {
        thumnailFileName = arrFileName[0] + "_Thumb." + arrFileName[1];
    }


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');

            var linkText = "";
            linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "'><img src='/Images/ThemeDefault/BG-chat_icon_file.png'></a>";

            message = message.replace(rs[n], linkText);
        }
    }




    var html = '';
    html += '<p class="tmMyMsg">';
    html += '	<span class="tmMsg">파일명: ' + fileName + '<br>유효기간: ' + validDate + ' 까지<br>용량: ' + fileSize + ' Byte<br><br>' + message + ' <b class="tmTime">' + baseTime + '</b></span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();


    if (chatSaveType != "NONE") {
        fn_JsonMsg(chatNickName, "M", message, "", "", "", "");
    }
}


//내파일 메시지처리
function fn_addMyFileMessage2(message, baseTime) {

    var html = '';
    html += '<p class="tmMyMsg">';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();


    if (chatSaveType != "NONE") {
        fn_JsonMsg(chatNickName, "M", message, "", "", "", "");
    }
}

//내파일 메시지처리: Prepend
function fn_addMyFilePreMessage2(message, baseTime) {

    var html = '';
    html += '<p class="tmMyMsg">';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").prepend(html);
}



//채팅 히스토리 바인딩
function ChatHistoryPreBind(chatHistory) {

    //채팅내역 출력
    $.each(chatHistory, function (index, item) {
        //debugger;
        if (item.loggingType == "7" || item.loggingType == "8") {
            if (chatNickName == item.nickName) {
                fn_addMyFilePreMessage2(item.message, yyyymmdd(item.loggingDate));
            } else {
                fn_addFilePreMessage2(item.nickName, item.message, yyyymmdd(item.loggingDate));
            }
        } else {
            if (chatNickName == item.nickName) {
                fn_addMyPreMessage(item.message, "", "", "", "", yyyymmdd(item.loggingDate));
            } else {
                fn_addOtherPreMessage(item.nickName, item.message, "", "", "", "", yyyymmdd(item.loggingDate));
            }
        }
    });

    //스크롤 최상단 이동처리
    jScrollPaneMessageTopMove();
}

//내파일전송 메시지 어펜더
function fn_addMyFileMessageAppend(message, baseTime) {

    var html = '';
    html += '<p class="tmMyMsg">';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

}

//타인파일전송 메시지 어펜더
function fn_addFileMessageAppend(nickName, message, baseTime) {

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += message;
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

}

//내 메시지 어펜더
function fn_addMyMessageAppend(message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmMyMsg">';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

}

//타인 메시지 어펜더
function fn_addOtherMessageAppend(nickName, message, fontFamily, fontSize, fontColor, fontStyle) {
    // 메세지 개행처리
    message = message.replace(/[\r|\n]/g, "<br/>");

    // 메세지 공백문자처리
    message = message.replace(/ /g, '&nbsp;');


    // URL링크변환처리
    var rs = ClevisURL.collect(message.replace(/&nbsp;/g, ' '));
    if (rs.length > 0) {
        for (var n = 0; n < rs.length; n++) {
            rs[n] = rs[n].replace(/&/g, '&amp;');
            var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
            message = message.replace(rs[n], linkText);
        }
    }

    var html = '';
    html += '<p class="tmOtherMsg">';
    html += '	<span class="tmUserId">' + nickName + '</span>';
    html += '	<span class="tmMsg ' + fontFamily + ' ' + fontSize + ' ' + fontColor + ' ' + fontStyle + '">' + message + '</span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

}



// 메세지 출력: 상대방이 입력중
function fn_addOtherMessageChatOn(nickName, message) {
    message = "";
    var html = '';
    html += '<p class="tmOtherMsg" id="writting">';
    html += '	<span class="tmUserId" id="chatUserName">' + nickName + '</span>';
    html += '	<span class="tmMsg">' + message + '<b id="chaton"></b></span>';
    html += '	<span class="tmArrow"></span>';
    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();
}

// 메세지 출력: 시스템
function fn_addSystemMessage(type, msg1, msg2) {
    var html = '';
    html += '<p class="tmSystemMsg">';

    if (type == "in") {
        if (msg1 == chatNickName) {
            html += '<span class="tmMsg"><strong>' + msg1 + '</strong> 님으로 입장했습니다.</span>';
        } else {
            html += '<span class="tmMsg"><strong>' + msg1 + '</strong> 님이 입장했습니다.</span>';
        }
    }
    else if (type == "out") {
        if (msg1 == chatNickName) {
            html += '<span class="tmMsg">대화방을  퇴장했습니다.</span>';
        } else {
            html += '<span class="tmMsg"><strong>' + msg1 + '</strong> 님이 퇴장했습니다.</span>';
        }
    }
    else if (type == "deny") {
        html += '<span class="tmMsg"><strong>' + msg2 + '</strong></span>';
    }
    else if (type == "namechangedentry") {
        html += '<span class="tmMsg"><strong>' + msg1 + '</strong> 님으로 입장했습니다.</span>';
    }
    else if (type == "namechanged") {
        if (msg1 == chatNickName) {
            html += '<span class="tmMsg">대화명이 <strong>' + msg2 + '</strong> 에서 <strong>' + msg1 + '</strong> 으로 변경 되었습니다.</span>';
        } else {
            html += '<span class="tmMsg"><strong>' + msg2 + '</strong>님 대화명이 <strong>' + msg1 + '</strong> 으로 변경 되었습니다.</span>';
        }
    }
    else if (type == "system") {

        // 메세지 개행처리
        msg1 = msg1.replace(/[\r|\n]/g, "<br/>");

        // 메세지 공백문자처리
        msg1 = msg1.replace(/ /g, '&nbsp;');


        // URL링크변환처리
        var rs = ClevisURL.collect(msg1.replace(/&nbsp;/g, ' '));
        if (rs.length > 0) {
            for (var n = 0; n < rs.length; n++) {
                rs[n] = rs[n].replace(/&/g, '&amp;');
                var linkText = "<a href='http://" + rs[n].replace("http://", "").replace(/ /g, '') + "' target='_blank'>" + rs[n].replace(/ /g, '') + "</a>";
                msg1 = msg1.replace(rs[n], linkText);
            }
        }


        html += '<span class="tmMsg">[공지] <strong>' + msg1 + '</strong></span>';
    }
    else if (type == "outdeny") {
        html += '<span class="tmMsg"><strong>' + msg1 + '</strong> ' + msg2 + '---</span>';
    }
    else if (type == "ipdeny") {
        html += '<span class="tmMsg"><strong>' + msg2 + '</strong></span>';
    }

    html += '</p>';

    $("#tmMessageList .tmInner .jspPane").append(html);

    jScrollPaneMessageListReInit();

    if (chatSaveType != "NONE") {
        fn_JsonMsg(chatNickName, "S", html, "tmFontFamily1", "tmFontSize2", "tmFontColor8", "tmFontStyle1");
    }
}

// 채팅메시지 json처리 적용하기
function fn_JsonMsg(username, msgtype, message, fontfamily, fontsize, fontcolor, fontstyle) {
    var nowdate = new Date();
    var msg = { "username": username, "msgtype": msgtype, "msg": message, "msgdate": nowdate, "fontfamily": fontfamily, "fontsize": fontsize, "fontcolor": fontcolor, "fontstyle": fontstyle };
    fn_MessageSave(msg);
}

// 채팅메시지 저장하기
function fn_MessageSave(msg) {
    if (chatSaveType == "Client") {
        chatcontent.chatlist.push(msg);
        // $.cookie('TokmonChatData', JSON.stringify(chatcontent), { path: '/', expires: 1 });
        localStorage.setItem('TokmonChatData', JSON.stringify(chatcontent));
        // console.dir(chatcontent);
    }
}

// 채팅참여자목록 레이어 열기
function fn_openMemberListLayer() {
    var duration = 300;
    var distance = $("#tmLayerMemberList").outerWidth();

    $("#tmLayerMemberList").animate({ left: 0 }, duration, function () {
        TM.isOpenMemberList = true;
    });
    $("#tmLayerChat").css("right", "auto").animate({ left: distance }, duration);
    $("#tmLayerMask").hide().fadeIn(duration);
}

// 채팅참여자목록 레이어 닫기
function fn_closeMemberListLayer() {
    var duration = 300;
    var distance = -$("#tmLayerMemberList").outerWidth();

    $("#tmLayerMemberList").animate({ left: distance }, duration, function () {
        TM.isOpenMemberList = false;
    });
    $("#tmLayerChat").animate({ left: 0 }, duration);
    $("#tmLayerMask").fadeOut(duration);
}

// 환경설정 레이어 열기
function fn_openPreferenceLayer() {
    var duration = 300;
    var distance = $("#tmLayerPreference").outerWidth();

    $("#tmLayerPreference").animate({ right: 0 }, duration);
    $("#tmLayerChat").css("left", "auto").animate({ right: distance }, duration);
    $("#tmLayerMask").hide().fadeIn(duration);
}

// 환경설정 레이어 닫기
function fn_closePreferenceLayer(callback) {
    var duration = 300;
    var distance = -$("#tmLayerPreference").outerWidth();

    fn_closePreferenceSubLayer();

    $("#tmLayerPreference").animate({ right: distance }, duration);
    $("#tmLayerChat").animate({ right: 0 }, duration);
    $("#tmLayerMask").fadeOut(duration, function () {
        if (callback !== undefined) {
            callback();
        }
    });
}

// 채팅사용자 목록조회 바인딩
function fn_ChatUserListBind(users) {

    $("#chkUserList").html("");

    var disableText = "";

    $.each(users, function (index, user) {
        // console.log(user.NickName);
        disableText = "";
        if (chatNickName == user.nickName) {
            disableText = "disabled";
        }
        $("#chkUserList").append("<li class='" + disableText + "'><a href='javascript:;'>" + user.nickName + "</a><input type='checkbox' name='chkUser' id='chkUser" + index.toString() + "' value='" + user.nickName + "' " + disableText + " /></li>");
    });

    jScrollPaneMessageListReInit();

    // 목록 레이어 보여주기
    fn_openMemberListLayer();
}

// 아이피 차단
function fn_Blocking(blockingType) {
    if (confirm("강퇴처리 하시겠습니까?")) {
        var chkUser = $('input[name=chkUser]');
        var userList = null;

        $.each(chkUser, function (index, obj) {
            var checked = this.checked;
            if (checked == true) {
                if (userList == null) {
                    userList = { "RoomName": groupName, "NickNames": [{ "RoomName": groupName, "NickName": this.value, "BlockingType": blockingType }] };
                } else {
                    userList.NickNames.push({ "RoomName": groupName, "NickName": this.value, "BlockingType": blockingType });
                }
            }
        });

        // IP차단정보등록 및 강퇴처리
        chat.invoke("IpBlocking", JSON.stringify(userList)).catch(function (err) {
            return console.error(err.toString());
        });
    }
}

// 사용자 폰트 설정정보 저장
function fn_FontConfigSave() {
    // debugger;
    var fontType = $.cookie('TokmonFontType');
    var fontSize = $.cookie('TokmonFontSize');
    var fontColor = $.cookie('TokmonFontColor');
    var fontStyle = $.cookie('TokmonFontStyle');


    fontType = $('#tmSelectFontFamily').val();
    fontSize = $('#tmSelectFontSize').val();
    fontColor = $('#tmSelectFontColor').val();
    fontStyle = $('#tmSelectFontStyle').val();

    fontType = fontType == null ? "tmFontFamily1" : fontType;
    fontSize = fontSize == null ? "tmFontSize2" : fontSize;
    fontColor = fontColor == null ? "tmFontColor8" : fontColor;
    fontStyle = fontStyle == null ? "tmFontStyle1" : fontStyle;

    $.cookie('TokmonFontType', fontType, { path: '/', expires: 30 });
    $.cookie('TokmonFontSize', fontSize, { path: '/', expires: 30 });
    $.cookie('TokmonFontColor', fontColor, { path: '/', expires: 30 });
    $.cookie('TokmonFontStyle', fontStyle, { path: '/', expires: 30 });

    alert("설정이 완료 되었습니다.");

    fn_closePreferenceLayer();

    // 쿠키삭제
    // $.cookie('cookie name', null);
}


// 사용자 채팅유지기능 설정정보 저장
function fn_ChatConfigSave() {
    var chatConfig = $.cookie('TokmonChatConfig');
    chatConfig = $('input[name=rdoChatConfig]:checked').val();
    $.cookie('TokmonChatConfig', chatConfig, { path: '/', expires: 1 });
    chatSaveType = chatConfig;
    alert("설정 완료 되었습니다.");

    fn_closePreferenceLayer();
}


// 채팅방명 변경처리
function fn_RoomNameChange() {
    var roomName = $("#txtRoomName").val();
    chat.invoke("RoomNameChange", groupName, roomName).catch(function (err) {
        return console.error(err.toString());
    });


    $("#lblRoomName").html(roomName);
    alert("대화방명이 변경되었습니다.");
}

// 대화내용 파일 다운로드
function fn_FileDownload() {
    // 오늘날짜 구하기
    var newDate = new Date();
    var yy = newDate.getFullYear();
    var mm = newDate.getMonth() + 1;
    var dd = newDate.getDate();
    var today = yy + "-" + ((mm < 10) ? "0" + mm : mm) + "-" + ((dd < 10) ? "0" + dd : dd);

    var chatContents = '';
    chatContents += '<!DOCTYPE html>\n';
    chatContents += '<html lang="ko">\n';
    chatContents += '<head>\n';
    chatContents += '    <meta charset="UTF-8">\n';
    chatContents += '    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />\n';
    chatContents += '    <meta http-equiv="X-UA-Compatible" content="IE=edge, chrome=1" />\n';
    chatContents += '    <meta name="description" content="" />\n';
    chatContents += '    <meta name="author" content="" />\n';
    chatContents += '    <title>' + groupName + '_' + chatNickName + '_' + today + ' 저장된 대화내용</title>\n';
    chatContents += '    <link rel=\"stylesheet\" href=\"http://fonts.googleapis.com/earlyaccess/nanumgothic.css\" />\n';
    chatContents += '    <link rel=\"stylesheet\" href=\"http://chat.unioncraft.kr/css/style.css\" />\n';
    chatContents += '</head>\n';
    chatContents += '<body>\n';
    chatContents += '    <section id="tmLayerChat">\n';
    chatContents += '        <div class="tmHead">\n';
    chatContents += '            <h2 class="logo"><a href="http://chat.unioncraft.kr" class="hidden" target="_blank">UnionCraft</a></h2>\n';
    chatContents += '        </div>\n';
    chatContents += '        <div class="tmBody">\n';
    chatContents += '            <div id="tmNotification">\n';
    chatContents += '                <h1 id="lblRoomName">' + groupName + '_' + chatNickName + '_' + today + ' 저장된 대화내용</h1>\n';
    chatContents += '            </div>\n';
    chatContents += '            <div id="tmMessageList">\n';
    chatContents += '                <div class="tmInner">\n';

    $("#tmMessageList p").each(function () {
        var className = $(this).attr("class");
        var html = $(this).html();

        chatContents += '                    <p class="' + className + '">' + html + '</p>\n';
    });

    chatContents += '                </div>\n';
    chatContents += '            </div>\n';
    chatContents += '        </div>\n';
    chatContents += '    </section>\n';
    chatContents += '    <script src="http://code.jquery.com/jquery-latest.min.js"></script>\n';
    chatContents += '</body>\n';
    chatContents += '</html>';

    var chatHistory = { "RoomName": groupName, "NickName": chatNickName, "ChatContents": chatContents };
    $("#hidChatHistory").val(JSON.stringify(chatHistory));
    // $("#formHistory").submit();
    document.formHistory.submit();
}

// 설정정보세팅
function fn_configSetting() {

    var fontType = $.cookie('TokmonFontType');
    var fontSize = $.cookie('TokmonFontSize');
    var fontColor = $.cookie('TokmonFontColor');
    var fontStyle = $.cookie('TokmonFontStyle');
    var chatConfig = $.cookie('TokmonChatConfig');

    $('#tmSelectFontFamily').find("option[value=" + fontType + "]").attr("selected", true).siblings().attr("selected", false);
    $('#tmSelectFontSize').find("option[value=" + fontSize + "]").attr("selected", true).siblings().attr("selected", false);
    $('#tmSelectFontColor').find("option[value=" + fontColor + "]").attr("selected", true).siblings().attr("selected", false);
    $('#tmSelectFontStyle').find("option[value=" + fontStyle + "]").attr("selected", true).siblings().attr("selected", false);

    $('#tmSelectFontFamily, #tmSelectFontSize, #tmSelectFontColor,#tmSelectFontStyle').change();
    // debugger;
    chatSaveType = chatConfig;

    $.each($('input[name=rdoChatConfig]'), function (index, obj) {
        if (obj.value == chatConfig) {
            $(obj).attr("checked", "checked").change();
        }
    });

    // 채팅데이터 쿠키에서 불러오기
    if (chatSaveType == "Client") {
        // if ($.cookie('TokmonChatData') != null) {
        //    var savedChat = JSON.parse($.cookie('TokmonChatData'));
        //    var chatHTML = "";

        //    $.each(savedChat.chatlist, function (index, chat) {
        //        debugger;
        //        console.log(chat.msg);
        //    });
        // }

        if (localStorage.getItem('TokmonChatData') != null) {
            var savedChat = JSON.parse(localStorage.getItem('TokmonChatData'));
            var chatHTML = "";
            // console.dir(savedChat);
            $.each(savedChat.chatlist, function (index, chat) {
                switch (chat.msgtype) {
                    case "S":
                        $(chat.msg).appendTo("#tmMessageList .tmInner .jspPane");
                        jScrollPaneMessageListReInit();
                        break;
                    case "M":
                        fn_addMyMessage(chat.msg, chat.fontfamily, chat.fontsize, chat.fontcolor, chat.fontstyle);
                        break;
                    case "O":
                        fn_addOtherMessage(chat.username, chat.msg, chat.fontfamily, chat.fontsize, chat.fontcolor, chat.fontstyle);
                        break;
                }
            });
        }
        // console.dir(chatcontent);
    }
}

// 셀렉트박스 커스터마이즈
function fn_formSelectBox() {
    // 셀렉트박스 클릭 이벤트
    $(".tmFormSelect").on("click", "button", function () {
        var _this = $(this);
        var isActive = $(this).hasClass("active");

        if (isActive) {
            _this.removeClass("active").siblings("ul").css("z-index", "auto").hide();
        }
        else {
            _this.addClass("active").siblings("ul").css("z-index", "10").show();
        }
    });

    // 셀렉트박스 클릭 이벤트
    $(".tmFormSelect").on("click", "li", function () {
        var _this = $(this);
        var realSelect = _this.parent().siblings("select");
        var sVal = _this.attr("data-value");

        realSelect.find("option[value=" + sVal + "]").attr("selected", true).siblings().attr("selected", false);
        realSelect.change();

        _this.parent().siblings("button").click();
    });

    // 셀렉트박스 체인지 이벤트
    $(".tmFormSelect").on("change", "select", function () {
        var _this = $(this);
        var fakeSelect = _this.siblings("ul");
        var fakeButton = _this.siblings("button");
        var sVal = _this.val();
        var sText = _this.find("option:selected").text();

        fakeSelect.find("li[data-value=" + sVal + "]").addClass("active").siblings().removeClass("active");
        fakeButton.find(".tmSelectText").text(sText);
    });

    // 셀렉트박스: 데이타 바인딩 후 실행시켜주어야함.
    $(".tmFormSelect select").change();
}

// 체크박스 커스터마이즈
function fn_formCheckBox() {
    // 체크박스 클릭 이벤트
    $(".tmFormCheckbox").on("click", "a", function (event) {
        var _this = $(this);
        var realCheckbox = _this.siblings("input[type=checkbox]");
        var isChecked = realCheckbox.prop("checked") == true ? true : false;
        var isDisabled = realCheckbox.attr("disabled") == "disabled" ? true : false;
        var isNotLogin = $(this).parents(".tmFormCheckbox").hasClass(".tmNotLogin");

        if (isNotLogin) return false;

        if (isDisabled) return false;

        if (isChecked) {
            realCheckbox.prop("checked", false);
        }
        else {
            realCheckbox.prop("checked", true);
        }

        realCheckbox.change();

        event.preventDefault();
    });

    // 체크박스 체인지 이벤트
    $(".tmFormCheckbox").on("change", "input[type=checkbox]", function () {
        var _this = $(this);
        var isChecked = _this.prop("checked") == true ? true : false;

        if (isChecked) {
            _this.parent().addClass("active");
        }
        else {
            _this.parent().removeClass("active");
        }
    });

    // 셀렉트박스: 데이타 바인딩 후 실행시켜주어야함.
    $(".tmFormCheckbox").find("input[type=checkbox]").change();
}

// 라디오 커스터마이즈
function fn_formRadio() {
    // 라디오 클릭 이벤트
    $(".tmFormRadio").on("click", "button", function (event) {
        var _this = $(this);
        var realRadio = _this.siblings("input[type=radio]");

        realRadio.prop("checked", true).parent();
        _this.parent().siblings().find("input[type=radio]").prop("checked", false);

        realRadio.change();

        event.preventDefault();
    });

    // 라디오 체인지 이벤트
    $(".tmFormRadio").on("change", "input[type=radio]", function () {
        var _this = $(this);

        _this.parent().addClass("active").siblings().removeClass("active");
    });

    // 라디오: 데이타 바인딩 후 실행시켜주어야함.
    $(".tmFormRadio").find("input[type=radio]:checked").change();
}

// 컬러피커 셀렉트박스 커스터마이즈
function fn_colorPicker() {
    // 셀렉트박스 클릭 이벤트
    $(".tmColorBar").on("click", "button", function () {
        var _this = $(this);
        var sVal = _this.val();
        var realSelect = $("#tmSelectFontColor");

        realSelect.find("option[value=" + sVal + "]").attr("selected", true).siblings().attr("selected", false);
        realSelect.change();
    });

    // 셀렉트박스 체인지 이벤트
    $(".tmColorBar").on("change", "select", function () {
        var _this = $(this);
        var sVal = _this.val();

        $(".tmColorBar").find("button").removeClass("active");
        $(".tmColorBar").find("button[value=" + sVal + "]").addClass("active");
    });

    // 셀렉트박스: 데이타 바인딩 후 실행시켜주어야함.
    $("#tmSelectFontColor").change();
}

//채팅시간변경
function yyyymmdd(loggingDate) {
    var x = new Date(Date.parse(loggingDate));
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    var hh = x.getHours().toString();
    var mi = x.getMinutes().toString();
    var ss = x.getSeconds().toString();

    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    (mi.length == 1) && (mi = '0' + mi);
    (ss.length == 1) && (ss = '0' + ss);
    var yyyymmdd = hh + ':' + mi + ' ' + ss;
    return yyyymmdd;
}

// 채팅 수신 이벤트 바인딩 함수
function fn_chatBind() {

    // 채팅 수신 메시지 처리
    chat.on("broadcastMessage", function (name, message, fontFamily, fontSize, fontColor, fontStyle, baseTime) {
        if ($("#writting").length > 0) { $("#writting").remove(); }
        fn_addOtherMessage(name, message, fontFamily, fontSize, fontColor, fontStyle);
    });


    // 채팅방 입장 메시지처리
    chat.on("entryRoomMsg", function (name, message, result, userCnt, chatHistory) {

        if (result == "Ok") {

            //채팅내역 출력
            $.each(chatHistory, function (index, item) {
                //debugger;
                if (item.loggingType == "7" || item.loggingType == "8") {
                    if (chatNickName == item.nickName) {
                        fn_addMyFileMessageAppend(item.message, yyyymmdd(item.loggingDate));
                    } else {
                        fn_addFileMessageAppend(item.nickName, item.message, yyyymmdd(item.loggingDate));
                    }
                } else {
                    if (chatNickName == item.nickName) {
                        fn_addMyMessageAppend(item.message, "", "", "", "", yyyymmdd(item.loggingDate));
                    } else {
                        fn_addOtherMessageAppend(item.nickName, item.message, "", "", "", "", yyyymmdd(item.loggingDate));
                    }
                }
            });

            //화면출력 시직 채팅이력 고유번호 세팅
            if (chatHistory.length > 0) {
                baseLogidx = chatHistory[0].chatLogIdx;
            }

            $("#tmChatTotalCnt").html(userCnt);
            fn_addSystemMessage("in", name);
            chatNickName = name;
        }

        if (result == "OtherOk") {
            $("#tmChatTotalCnt").html(userCnt);
            fn_addSystemMessage("in", name);
        }

        if (result == "Changed") {
            chatNickName = name;
            $("#tmInputName").val(name);
            $("#tmPreferenceUserName").val(name);

            $.each(chatHistory, function (index, item) {
                fn_addOtherMessage(item.nickName, item.message, "", "", "", "", yyyymmdd(item.loggingDate));
            });

            fn_addSystemMessage("namechangedentry", name);
            $("#tmChatTotalCnt").html(userCnt);
        }

        if (result == "Deny") {
            fn_addSystemMessage("deny", name, message);
            console.log("접속실패:", message);
            $("#tmBtnJoinChat").prop("disabled", true);
            $("#tmInputMessage").prop("disabled", true);
            $("#tmSendMessage").prop("disabled", true);
            $("#tmBtnFile").prop("disabled", true);
            
            chatStatus = false;

            alert(message);
            self.close();
        }

        if (result == "IPDeny") {
            fn_addSystemMessage("ipdeny", name, message);
            console.log("접속차단:", message);
            $("#tmBtnJoinChat").prop("disabled", true);
            $("#tmInputMessage").prop("disabled", true);
            $("#tmSendMessage").prop("disabled", true);
            $("#tmBtnFile").prop("disabled", true);
            chatStatus = false;

            alert(message);
            self.close();
        }

    });

    // 사용자 키입력중 메시지
    chat.on("typingOn", function (name, message) {
        if ($("#writting").length == 0) {
            fn_addOtherMessageChatOn(name, message);
        } else {
            $("#chaton").attr("class", "chat_open");
            $("#chatUserName").text(name);
        }
    });

    // 사용자 키입력완료 메시지
    chat.on("typingComplete", function (name, message) {
        if ($("#writting").length > 0) {
            $("#chaton").attr("class", "chat_close");
            $("#chatUserName").text(name);
        }
    });

    // 사용자 키입력취소  메시지
    chat.on("typingInit", function (name, message) {
        if ($("#writting").length > 0) {
            $("#writting").remove();
        }
    });

    // 대화명 변경 메시지 수신 처리
    chat.on("nameChangeMessage", function (newName, oldName) {
        fn_addSystemMessage("namechanged", newName, oldName);
    });

    // 본인 대화명 변경 메시지 수신처리
    chat.on("myNameChangeMessage", function (newName, oldName) {
        chatNickName = newName;
        $("#tmInputName").val(newName);
        $("#tmPreferenceUserName").val(newName);

        fn_addSystemMessage("namechanged", newName, oldName);
    });

    // 사용자 퇴장 메시지
    chat.on("goodByMsg", function (name, message, userCnt) {
        fn_addSystemMessage("out", name);
        $("#tmChatTotalCnt").html(userCnt);
    });

    // 사용자 강퇴처리 결과 메시지
    chat.on("goodByDeny", function (name, message, userCnt) {
        // debugger;
        fn_addSystemMessage("outdeny", name, message);
        $("#tmChatTotalCnt").html(userCnt);

        if (chatNickName == name) {
            chatStatus = false;

            // $.connection.hub.stop();
            $("#tmBtnCloseChat").hide();
            $("#tmInputMessage").prop("disabled", true);
            $("#tmSendMessage").prop("disabled", true);
            $("#tmBtnJoinChat").show();
            $("#tmBtnJoinChat").prop("disabled", true);
        }
    });

    // 시스템 메시지 수신 처리
    chat.on("systemMessage", function (name, message) {
        fn_addSystemMessage("system", message);
    });

    // 채팅사용자목록 조회결과 바인딩
    chat.on("getUserList", function (users) {
        //console.log("채팅접속자목록", users);
        fn_ChatUserListBind(users);
    });

    //파일전송완료 수신 메시지처리
    chat.on("fileTransferOK", function (name, message) {
        fn_addSystemMessage("file", name, message);
    });

    // 채팅 수신 메시지 처리
    chat.on("fileMessage", function (name, message, fileName, fileSize, validDate, userType, baseTime) {
        //alert("도착1");
        if ($("#writting").length > 0) { $("#writting").remove(); }

        if (userType == "me") {
            fn_addMyFileMessage(message, fileName, fileSize, validDate, baseTime);
        } else {
            fn_addFileMessage(name, message, fileName, fileSize, validDate, baseTime);
        }
    });


}

// 환경설정: 서브 레이어창 열기
function fn_openPreferenceSubLayer(viewId) {
    $("#tmLayerPreference").hide();
    $("#tmLayerPreferenceChat, #tmLayerPreferenceSave, #tmLayerPreferenceManager").hide();
    $("section[data-view='" + viewId + "']").show();

    // 슬라이딩 샘플
    //$("#tmLayerPreferenceChat, #tmLayerPreferenceSave, #tmLayerPreferenceManager").hide();
    //$("section[data-view='" + viewId + "'").css("right", "-320px").show().stop(true, true).animate({ "right": "0" }, 300, function () {
    //    $("#tmLayerPreference").hide();
    //});
}

// 환경설정: 서브 레이어창 닫기
function fn_closePreferenceSubLayer() {
    $("#tmLayerPreference").show();
    $("#tmLayerPreferenceChat:visible, #tmLayerPreferenceSave:visible, #tmLayerPreferenceManager:visible").hide();

    // 슬라이딩 샘플
    //$("#tmLayerPreference").show();
    //$("#tmLayerPreferenceChat:visible, #tmLayerPreferenceSave:visible, #tmLayerPreferenceManager:visible").stop(true, true).animate({ "right": -320 }, 300, function () {
    //    $(this).hide();
    //});
}

// 각종 이벤트 바인드
function fn_eventBind() {
    // 공통: 레이아웃 리사이징 이벤트
    $(window).resize(function () {
        fn_resizeFrame();
    });

    // IE 업데이트 안내 레이어 닫기 버튼
    $("#tmBtnCloseUpdateIE").click(function (event) {
        var duration = 500;
        $("#tmUpdateIE").fadeOut(duration);
        event.preventDefault();
    });

    // 로그인: 대화명 입력시 이벤트
    $("#tmInputName").keydown(function (event) {
        var keyCode = event.keyCode;
        var isSpaceBarKey = (keyCode == 32) ? true : false; // 스페이스바 눌렸는지 여부
        var isEnterKey = (keyCode == 13) ? true : false; // 엔터키 눌렸는지 여부

        // Space Bar
        if (isSpaceBarKey) {
            event.preventDefault();
        }
        else if (isEnterKey) {
            event.preventDefault();
            $("#tmBtnConfirmName").click();
        }
    });

    // 대화방참여: 대화명 설정 확인 버튼 클릭/대화방입장
    $("#tmBtnConfirmName").click(function () {

        var userName = $("#tmInputName").val();
        var oldName = $('#txtOldName').val();

        //대화명 전달된 경우
        if (isFixedUserName) {

            $("#tmPopWrap").fadeOut("slow");
            $("#tmBtnJoinChat").hide();
            $("#tmBtnCloseChat").show();
            $("#tmNotification").show().css("top", "-50px").animate({ top: 0 }, 500);
     

            $("#tmPreferenceUserName").val(userName);
            chatNickName = userName;

            // 그룹채팅방 조인
            if (referURL == null) { referURL = ""; }

            chat.invoke("JoinGroup", groupName, encryptInfo, referURL).catch(function (err) {
                return console.error(err.toString());
            });

            chatStatus = true;
            $('#txtOldName').val(userName);

            $("#tmInputMessage").prop("disabled", false).focus();

            console.log("채팅서버 연결이 완료되었습니다.");
        }
        else {
            if (userName == "") {
                alert("대화명을 입력해주세요.");
                $("#tmInputName").focus();
                return false;
            }
            else if (userName == oldName && chatStatus == true) {
                alert("대화명을 변경해주세요.");
                $("#tmInputName").focus();
                return false;
            }
            else if (fn_getStringLength(userName, 12) == false) {
                alert("한글 1~6자, 영문 대소문자, 숫자 2~12자를 사용할 수 있습니다. (혼용가능)");
                $("#tmInputName").focus();
                return false;
            }
            else {
                $("#tmPopWrap").fadeOut("slow");
                $("#tmBtnJoinChat").hide();
                $("#tmBtnCloseChat").show();
                $("#tmNotification").show().css("top", "-50px").animate({ top: 0 }, 500);
                $("#tmInputMessage").prop("disabled", false).focus();

                $("#tmPreferenceUserName").val(userName);
                chatNickName = userName;

                // 그룹채팅방 조인
                if (referURL == null) { referURL = ""; }

                chat.invoke("JoinGroup", groupName, encryptInfo, referURL).catch(function (err) {
                    return console.error(err.toString());
                });

                chatStatus = true;
                $('#txtOldName').val(userName);


            }
        }
    });

    // 채팅: 방제목레이어 닫기버튼 클릭 이벤트
    $("#tmBtnCloseNotification").click(function () {
        var isOpen = $(this).hasClass("tmBtnOpen");
        var duration = 500;
        var distance = + $("#tmNotification").outerHeight() - 12);

        if (isOpen) {
            $("#tmNotification").stop(true, true).animate({ top: distance }, duration);
            $("#tmBtnCloseNotification").removeClass("tmBtnOpen").addClass("tmBtnClose");
            $("#tmMessageList p:first-child").animate({ "margin-top": 30 }, duration);
        }
        else {
            $("#tmNotification").stop(true, true).animate({ top: 0 }, duration);
            $("#tmBtnCloseNotification").removeClass("tmBtnClose").addClass("tmBtnOpen");
            $("#tmMessageList p:first-child").animate({ "margin-top": 80 }, duration);
        }
    });


    // 채팅: 나가기 버튼 클릭 이벤트
    $("#tmBtnCloseChat").click(function () {
        if (confirm("채팅방을 퇴장하시겠습니까?")) {
            ChatExit();
        }
    });



    // 채팅: 메세지 입력시 전송버튼 활성/비활성화
    $("#tmInputMessage").keyup(function () {
        var msg = $(this).val();

        // 입력중 메시지 발송
        chat.invoke("KeyUpMessage", groupName, chatNickName, msg).catch(function (err) {
            return console.error(err.toString());
        });

        var isEmpty = (fn_removeWhiteSpaceAll(msg) == "") ? true : false; // 공백제거해서 빈값인지 체크

        if (isEmpty) {
            $("#tmSendMessage").prop("disabled", true);
        }
        else {
            $("#tmSendMessage").prop("disabled", false);
        }
    });

    // 채팅: 키입력 메시지처리
    $("#tmInputMessage").keydown(function (event) {

        chat.invoke("KeyDownMessage", groupName, chatNickName).catch(function (err) {
            return console.error(err.toString());
        });

        var msg = $(this).val();
        var isEmpty = (fn_removeWhiteSpaceAll(msg) == "") ? true : false; // 공백제거해서 빈값인지 체크
        var keyCode = event.keyCode; // 키코드
        var isEnterKey = (keyCode == 13) ? true : false; // 엔터키 눌렸는지 여부
        var isAltKey = event.altKey; // 알트키 눌렸는지 여부
        var isShiftKey = event.shiftKey; // 쉬프트키 눌렸는지 여부
        var isCtrlKey = event.ctrlKey; // 컨트롤키 눌렸는지 여부
        // var currRows = parseInt($(this).attr("rows"));

        // 모바일일때
        if (isMobile.any()) {
            if (isEnterKey) {
                var content = this.value;
                var caret = getCaret(this);
                this.value = content.substring(0, caret) +
                    "\n" + content.substring(caret, content.length);

                event.stopPropagation();
                event.preventDefault();

                // if (currRows < 4) {
                //     currRows += 1;
                //     $(this).attr("rows", currRows);
                // }

                $(this).scrollTop(10000);
            }
        }
        // PC일때
        else {
            if ((isAltKey || isShiftKey || isCtrlKey) && isEnterKey) {
                var content = this.value;
                var caret = getCaret(this);
                this.value = content.substring(0, caret) +
                    "\n" + content.substring(caret, content.length);

                event.stopPropagation();
                event.preventDefault();

                // if (currRows < 4) {
                //     currRows += 1;
                //     $(this).attr("rows", currRows);
                // }

                $(this).scrollTop(10000);
            }
            else if (isEnterKey) {
                event.preventDefault();

                if (!isEmpty) {
                    $("#tmSendMessage").click();
                }
            }
        }
    });

    // 채팅: 전송버튼 클릭 이벤트
    $("#tmSendMessage").click(function () {

        var msg = $("#tmInputMessage").val();

        // 채팅메시지 발송
        chat.invoke("SendOrigin", groupName, chatNickName, msg, $('#tmSelectFontFamily').val(), $('#tmSelectFontSize').val(), $('#tmSelectFontColor').val(), $('#tmSelectFontStyle').val()).catch(function (err) {
            return console.error(err.toString());
        });


        fn_addMyMessage(msg, $('#tmSelectFontFamily').val(), $('#tmSelectFontSize').val(), $('#tmSelectFontColor').val(), $('#tmSelectFontStyle').val());

        // $("#tmInputMessage").val("").attr("rows", "1").focus();
        $("#tmInputMessage").val("").focus();
        $("#tmSendMessage").prop("disabled", true);
    });


    // 채팅: 참여자목록 보기버튼 클릭 이벤트
    $("#tmBtnMemberList").click(function () {

        chat.invoke("CheckUserList", groupName).catch(function (err) {
            return console.error(err.toString());
        });
    });

    // 채팅: 참여자목록 닫기버튼 클릭 이벤트
    $("#tmLayerMemberList .tmBtnCloseLayer").click(function () {
        fn_closeMemberListLayer();
    });

    // 채팅: 설정버튼 클릭 이벤트
    $("#tmBtnPreference").click(function () {
        fn_openPreferenceLayer();
    });

    // 환경설정: 설정닫기버튼 클릭 이벤트
    $("#tmLayerPreference .tmBtnCloseLayer").click(function () {
        fn_closePreferenceLayer();
    });

    // 환경설정: 서브레이어 열기버튼 클릭 이벤트
    $("#tmLayerPreference .tmListView button").click(function (event) {
        var viewId = $(this).attr("data-target");
        fn_openPreferenceSubLayer(viewId);
        event.preventDefault();
    });

    // 환경설정: 서브레이어 닫기버튼 클릭 이벤트
    $(".tmBtnPrevLayer").click(function (event) {
        fn_closePreferenceSubLayer();
        event.preventDefault();
    });

    // 환경설정: 서브레이어 닫기버튼 클릭 이벤트
    $("#tmLayerPreferenceChat .tmBtnCloseLayer, #tmLayerPreferenceSave .tmBtnCloseLayer, #tmLayerPreferenceManager .tmBtnCloseLayer").click(function (event) {
        fn_closePreferenceLayer();
        event.preventDefault();
    });

    // 환경설정: 채팅참여자관리버튼 클릭 이벤트
    $(document).on("click", "#tmBtnMemberListManage", function () {
        fn_closePreferenceLayer(function () {
            $("#tmBtnMemberList").click();
        });
    });

    // 환경설정: 대화명 설정변경
    $("#tmBtnConfirmUserName").click(function () {
        var userName = $("#tmPreferenceUserName").val();
        var oldName = $('#txtOldName').val();

        if (userName == "") {
            alert("대화명을 입력해주세요.");
            $("#tmPreferenceUserName").focus();
            return false;
        }
        else if (userName == oldName && chatStatus == true) {
            alert("대화명을 변경해주세요.");
            $("#tmPreferenceUserName").focus();
            return false;
        }
        else if (fn_getStringLength(userName, 12) == false) {
            alert("한글 1~6자, 영문 대소문자, 숫자 2~12자를 사용할 수 있습니다. (혼용가능)");
            $("#tmPreferenceUserName").focus();
            return false;
        }
        else {
            chatNickName = userName;

            // 대화명 변경 메시지 발송
            chat.invoke("SendNameChange", groupName, userName, oldName).catch(function (err) {
                return console.error(err.toString());
            });


            $('#txtOldName').val(userName);
            alert("대화명이 변경되었습니다.");
        }
    });

    // 환경설정: 대화명 변경 클릭 이벤트
    // $("#tmBtnConfirmUserName").click(function(){
    // 	// $("#tmPreferenceUserName").attr("placeholder", "이미 사용중인 대화명 입니다.").val("").focus();
    // });

    // 환경설정: 관리자 로그인 입력시 아이디, 비밀번호 공백 체크 및 enter대응
    $("#tmUserId, #tmUserPw").keydown(function (event) {
        var keyCode = event.keyCode;
        var isSpaceBarKey = (keyCode == 32) ? true : false; // 스페이스바 눌렸는지 여부
        var isEnterKey = (keyCode == 13) ? true : false; // 엔터키 눌렸는지 여부

        if (isSpaceBarKey) {
            event.preventDefault();
        }

        if (isEnterKey) {
            $("#btnAdminLogin").click();
        }
    });

    // 환경설정: 관리자로그인
    $("#btnAdminLogin").click(function (event) {
        // debugger;
        var userid = $("#tmUserId").val();
        var userpwd = $("#tmUserPw").val();

        if (fn_removeWhiteSpaceAll(userid) == "") {
            alert("아이디를 입력하세요.");
            $("#tmUserId").focus();
            return false;
        }

        if (fn_removeWhiteSpaceAll(userpwd) == "") {
            alert("비밀번호를 입력하세요.");
            $("#tmUserPw").focus();
            return false;
        }

        $.ajax({
            type: "GET",
            url: apiMemberURL + "?id=" + userid + "&pwd=" + userpwd ,
            async: false,
            dataType: "json",
            success: function (data) {
                if (data == null) {
                    alert("로그인 정보가 일치하지 않습니다.");
                } else {
                    $("#adminLogin").css("display", "none");

                    // 채팅방명 변경기능 추가
                    var adminForm = "";
                    adminForm += "<div class=\"tmSub\" id=\"adminForm\">";
                    adminForm += "  <h4 class=\"tmSubHead\">대화 참여자 관리</h4>";
                    adminForm += "  <div class=\"tmSubBody\">";
                    adminForm += "    <button id=\"tmBtnMemberListManage\" class=\"tmBtnBasicForm\">대화 참여자 관리</button>";
                    adminForm += "  </div>";
                    adminForm += "</div>";
                    adminForm += "<div class=\"tmSub\">";
                    adminForm += "  <h4 class=\"tmSubHead\">방제목 설정</h4>";
                    adminForm += "  <div class=\"tmSubBody\">";
                    adminForm += "    <fieldset>";
                    adminForm += "        <div class=\"tmInputBox\">";
                    adminForm += "            <input type=\"text\" class=\"tmFormInputText\" id=\"txtRoomName\" />";
                    adminForm += "        </div>";
                    adminForm += "    </fieldset>";
                    adminForm += "    <div class=\"tmBtnArea\">";
                    adminForm += "        <button onclick=\"fn_RoomNameChange();\"><span class=\"icon_save\"></span> 저장</button>";
                    adminForm += "    </div>";
                    adminForm += "  </div>";
                    adminForm += "</div>";

                    $(adminForm).insertAfter("#adminLogin");

                    // 아이피 차단기능 추가
                    var blockingForm = "";
                    blockingForm += "<strong class=\"tmChatMemberManage\"><span></span>대화 참여자 관리</strong>";
                    blockingForm += "<button class=\"tmBtnBasicForm\" onclick=\"fn_Blocking('D');\">1일 차단시키기</button>";
                    blockingForm += "<button class=\"tmBtnBasicForm\" onclick=\"fn_Blocking('P');\">영구 차단시키기</button>";
                    blockingForm += "<a href=\"javascript:;\" class=\"tmLinkList\" onclick=\"alert('준비중 입니다.');\">차단 회원 목록 보기<span class=\"tmIconBlueArr\"></span></a>";

                    $("#adminBlocking").append(blockingForm);

                    $("#txtRoomName").focus();

                    TM.isLogin = true;

                    $("#chkUserList").removeClass("tmNotLogin");

                    $("#adminBlocking").show();

                    fn_resizeFrame();
                }
            },
            error: function (error) {
            }
        });
    });
}

//채팅방 나가기 처리
function ChatExit() {

    var userName = $("#tmInputName").val();

    $("#tmInputMessage").prop("disabled", true);
    $("#tmSendMessage").prop("disabled", true);

    // 채팅방 나가기
    chat.invoke("ChatExit").catch(function (err) {
        return console.error(err.toString());
    });

    chatStatus = false;

    fn_addSystemMessage("out", userName);
}


// 쿼리스트링 가져오기
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split('&');
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (decodeURIComponent(pair[0]) == variable) {
            return decodeURIComponent(pair[1]);
        }
    }
    // console.log('Query variable %s not found', variable);
}

// 구글 웹로그 분석
function fn_googleAnalytics() {
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r; i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date(); a = s.createElement(o),
            m = s.getElementsByTagName(o)[0]; a.async = 1; a.src = g; m.parentNode.insertBefore(a, m)
    })(window, document, 'script', '//www.google-analytics.com/analytics.js', 'ga');

    ga('create', 'UA-45163508-2', 'tokmon.com');
    ga('send', 'pageview');
}

// 웹채팅 초기화 함수
function fn_init() {

    // 채팅 이벤트 바인딩
    fn_chatBind();

    // 셀렉트박스 커스터마이즈
    fn_formSelectBox();

    // 체크박스 커스터마이즈
    fn_formCheckBox();

    // 라디오 커스터마이즈
    fn_formRadio();

    // 컬러피커 셀렉트박스 커스터마이즈
    fn_colorPicker();

    // 각종 이벤트 바인드
    fn_eventBind();

    // 윈도우 리사이즈
    fn_resizeFrame();

    // 사용자설정정보 세팅
    fn_configSetting();

    // 사이트로부터 유저네임 넘겨받은 경우 이름설정관련 비활성화
    if (isFixedUserName) {
        $("#tmPreferenceUserName, #tmInputName, #tmBtnConfirmUserName").prop("disabled", true);	
    }

    // 참여자목록, 설정 위치 조정
    var tmLayerMemberListPosLeft = -$("#tmLayerMemberList").outerWidth();
    $("#tmLayerMemberList").css("left", tmLayerMemberListPosLeft);

    var tmLayerPreferencePosRight = -$("#tmLayerPreference").outerWidth();
    $("#tmLayerPreference").css("right", tmLayerPreferencePosRight);

    // 채팅 참여자 목록 미로그인 클래스 추가(체크박스 안나오게 하는 용도)
    $("#chkUserList").addClass("tmNotLogin");
}

// 페이지 로딩시 초기화 함수 호출
$(function () {
    fn_init();
});


//메시지 수신처리
chat.on("ReceiveMessage", function (user, message) {
    var msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    var encodedMsg = user + " says " + msg;
    var li = document.createElement("li");
    li.textContent = encodedMsg;
    document.getElementById("messagesList").appendChild(li);
});







