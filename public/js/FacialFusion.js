function closeModal() { //关闭模态框
    $(".modal").hide();
    localStorage.setItem("img_info", "True");
}

function cleanImg() {
    localStorage.removeItem("img_list");
    localStorage.removeItem("img_num");
    render();
    $(".main").scrollLeft(0);
}
// 渲染模板图片
function render() {
    $.ajax({
        type: 'GET',
        url: '/getlist',
        success: (res) => {
            //获取保存的本地图片
            var num = localStorage.getItem("img_num");
            var list = JSON.parse(localStorage.getItem("img_list"));
            var html;
            if (num) {
                for (let i = 0; i < num; i++) {
                    res.unshift(list[i]);
                }
                html = template('templateTpl', { data: res });
            } else {
                html = template('templateTpl', { data: res });
            }
            $('.template').html(html);
            $(".main").css("background", `url(${res[0]}) center top /cover`).data("imgData", res[0]);
        },
        error: (xhr) => {
            $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>' + JSON.parse(xhr.responseText).message + '</strong>').addClass("action");
            setTimeout(() => {
                $('.message').removeClass("action");
            }, 3000);
        }
    });
}
$(function() {

    render(); // 渲染模板图片
    //检测当前用户是否看过使用说明，看过则屏蔽
    if (localStorage.getItem("img_info") == null) {
        $(".modal").css("display", "flex");
    }
    //固定tools和message
    $(".message").css("top", $(".main").offset().top);
    $(".tools").css("top", $(".main").offset().top);
    window.onresize = function() {
        $(".message").css("top", $(".main").offset().top);
        $(".tools").css("top", $(".main").offset().top);
    }

    //鼠标滚动查看模板图片
    var scroll_width = 15; // 设置每次滚动的长度，单位 px
    var scroll_events = "mousewheel DOMMouseScroll MozMousePixelScroll"; // 鼠标滚轮滚动事件名
    $(".main").on(scroll_events, function(e) {
        var delta = e.originalEvent.wheelDelta; // 鼠标滚轮滚动度数

        // 滑轮向上滚动，滚动条向左移动，scrollleft-
        if (delta > 0) {
            $(this).scrollLeft($(this).scrollLeft() - scroll_width);
        }
        // 滑轮向下滚动，滚动条向右移动，scrollleft+
        else {
            $(this).scrollLeft($(this).scrollLeft() + scroll_width);
        }
    });
    //鼠标左右拉动查看模板图片
    var flag = false; //确定是点击图片还是滑动列表
    //移动端手指拖动
    var movePosition = 0; //移动距离
    $(".main").on("touchstart", function(e) { //手指触摸开始
        movePosition = e.targetTouches[0].pageX;
    })
    $(".main").on("touchmove", function(e) { //手指移动
        flag = true;
        var move = movePosition - e.targetTouches[0].pageX;
        $(this).scrollLeft($(this).scrollLeft() + move);
        movePosition = e.targetTouches[0].pageX;
    })
    $(".main").on("touchend", function(e) { //手指触摸结束
        e.preventDefault();
    })

    //PC端鼠标拖动
    $(".main").on("mousedown", function(e) { //鼠标点击开始
        movePosition = e.pageX;
        $(".main").on("mousemove", function(e) { //鼠标移动
            flag = true;
            var move = movePosition - e.pageX;
            $(this).scrollLeft($(this).scrollLeft() + move);
            movePosition = e.pageX;
        })
    })
    $(document).on("mouseup", function(e) { //鼠标抬起
        $(".main").off("mousemove");
    })

    //点击图片切换模板
    $(".template").on("mouseup touchend", "div", function(e) {
        if ($(this).hasClass("push")) {
            $("#file").click();
            return;
        }
        if ($(this).hasClass("clear")) {
            cleanImg();
            return;
        }
        if (!flag) {
            $(this).siblings().removeClass("action");
            $(this).addClass("action");
            $(".main").css("background", `${$(this).css("backgroundImage")} center top /cover`).data("imgData", $(this).attr("data-imgData"));
        }
        flag = false;
    })

    //模板图片选择事件
    $(".template").on("change", "#file", function(e) {
        var file = this.files[0];
        if (file == undefined || file.size == 0) {
            $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>未检测到文件</strong>').addClass("action");
            setTimeout(() => {
                $('.message').removeClass("action");
            }, 3000);
            return false;
        }
        if (file.type.indexOf('image') === -1) {
            $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>文件不是图片</strong>').addClass("action");
            setTimeout(() => {
                $('.message').removeClass("action");
            }, 3000);
            return false;
        }
        var fileRead = new FileReader();
        fileRead.readAsDataURL(file);
        fileRead.onload = function() {
            var list = JSON.parse(localStorage.getItem("img_list"));
            if (list != null && list.length != 0) {
                list.push(fileRead.result);
            } else {
                list = [];
                list.unshift(fileRead.result);
                localStorage.setItem("img_num", "0");
            }
            try {
                localStorage.setItem("img_list", JSON.stringify(list));
                localStorage.setItem("img_num", parseInt(localStorage.getItem("img_num")) + 1);
            } catch (err) {
                $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>存储空间一不小心用光了，删除一些图片吧</strong>').addClass("action");
                setTimeout(() => {
                    $('.message').removeClass("action");
                }, 3000);
            }

            render();
        }
        return false;
    })

    //点击信息图标查看使用规则
    $(".mag").on("click touchend", function() {
        $(".modal").css("display", "flex");
    })

    //点击左上图片选择换脸
    $(".selectFace").on("click touchend", function() {
        $(".selectInput").click();
        return;
    })

    //选择Face图片后
    $(".selectInput").on("change", function(e) {
        var file = this.files[0];
        if (file == undefined || file.size == 0) {
            $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>未检测到文件</strong>').addClass("action");
            setTimeout(() => {
                $('.message').removeClass("action");
            }, 3000);
            return false;
        }
        if (file.type.indexOf('image') === -1) {
            $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>文件不是图片</strong>').addClass("action");
            setTimeout(() => {
                $('.message').removeClass("action");
            }, 3000);
            return false;
        }
        $(".column").addClass("action");
        var fileRead = new FileReader();
        fileRead.readAsDataURL(file);
        fileRead.onload = function() {
            //获取模板图片信息
            $.ajax({
                type: 'POST',
                url: '/getface',
                data: { tplpath: $(".main").data("imgData"), wrappath: fileRead.result },

                success: (res) => {
                    // console.log(res);
                    $(".column").removeClass("action");
                    $(".main").css("background", `url(${"data:image/jpeg;base64," +res}) center top /cover`);
                    $(".down")[0].href = "data:image/jpeg;base64," + res;

                },
                error: (xhr) => {
                    $(".column").removeClass("action");

                    $('.message').css({ 'background-color': 'rgb(247, 211, 211)', 'color': ' #721c24' }).html('<strong>' + JSON.parse(xhr.responseText).message + '</strong>').addClass("action");
                    setTimeout(() => {
                        $('.message').removeClass("action");
                    }, 3000);
                }

            });
        }
        return false;
    })

    //点击下载图标下载
    $(".down").on("touchend", function(params) {
        $(this)[0].click();
    })
});