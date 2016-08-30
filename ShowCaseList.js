/**
 * Created by Leo on 2016/8/19.
 */
/**
 *  展開的方塊清單
 *  1. width : [number  (contain '%')] default => Width
 *  2. height : [number  (contain '%')] default => Height
 *  3. speed : [number] default=>500
 *  4. easing : [String] ( you can use  http://easings.net/zh-tw  *need to placement) default=>''swing'
 *  5. z_index : [number]  default => 0
 *  6. direction : [String] [left,right,up,down]  default => right
 *  7. style : [number] [0~4] default => 1                         0 = float 位移  1 = 伸縮位移 2 = 遮罩位移 3 = 列車位移   * 除1 皆使用 position
 *   8.trigger : [String] [hover,click] default => hover
 *   9. resize [boolean] default=>false
 *
 *  by Leo 20160531 Copy right
 *
 *  update 20160815  1.1version
 */
(function($){
    if (!$.ShowCaseListConID) {//唯一編號
        $.ShowCaseListConID = 0;
    }
    if (!$.ShowCaseListConCha) {//用於auto時 該放控制開關
        $.ShowCaseListConCha = true;
    }

    $.fn.ShowCaseList=function(settings){

        var obj = this;//外層物件   level 0
        var btnN = ' div[SCL="nextBtn'+$.ShowCaseListConID+'"]';
        var btnP = ' div[SCL="prevBtn'+$.ShowCaseListConID+'"]';
        var frame = 'div[SCL="frame'+$.ShowCaseListConID+'"]';//鎖定螢幕 level 1
        var mask =frame+' div[SCL="mask"]';//全長遮罩  level 2
        var con =frame+' div[SCL="con"]';//代表全長  level 2
        var items = con+' div[SCL="items"]';//包覆item  level 3
        var Changer = false;//用於auto時 該放控制開關
        var i= 0;


        //default
        var config={
            width:obj.width()
            ,height:obj.height()
            ,speed:'500'
            ,easing:'swing'
            ,z_index:'0'
            ,direction:'left' //left , up , down
            ,style:'0' // 0 , 2 , 3
            ,showsItem:1 // 2 ,3,4, 5
            ,setMask:true //有無mask
            ,auto:true // 自動撥放
            ,switching:5000 // 自動撥放後幾秒換下一張
            ,btnNP:true //左右按鈕
            ,dotBtn:false
            ,hoverStop:true //觸碰停止 //按鈕除外
            ,resize:true//是否持續追蹤放大縮小

            ,changeAuto:false //暫時沒用
            ,position:'relative' //外層位置
            ,testMode:false
        };

        //導入自訂參數
        if(settings){$.extend(true,config,settings);}

        var speed = toNum(config.speed,500);//移動速度
        var z_index = toNum(config.z_index);
        var easing = (typeof config.easing == 'string')?config.easing:'swing';//移動速率
        var direction = config.direction;
        //var style = config.style;//移動方式  //    0 = float 位移  1 = 伸縮位移 2 = 遮罩位移 3 = 列車位移   * 除1 皆使用 position
        var style = 0;// 不給你改 目前做做一種
        var auto = !!(config.auto);//觸發方式
        var switching = toNum(config.switching,5000);//換圖持續時間
        var hoverStop = !!(config.hoverStop);
        var resize = !!(config.resize);//resize
        var btnNP = !!(config.btnNP);
        var position = config.position;//預設外層的位置 如有必要才需改動
        var setMask = !!(config.setMask);

        //var changeAuto = !!(config.firstClick) ;//使用布林轉換

        //算出 非參數
        var len = obj.children().length;//子選項總數
        var halfLen = Math.ceil((len - 1)/2); //長度的一半 取進位
        var currentID = 0;
        var arrList = [];
        for( i = currentID ; i < len ; i++){
            arrList.push(i);
        }

        //方向配置 先做往left為主

        //高寬配置  吃百分比
        var width = String(config.width);//取得數值(先轉為字串)(原數值為上層
        width = (width.match(/%/))?(obj.width()*parseFloat(width.replace(/%/,'')/100)):width;//如果這個含有百分比則做前者
        var height = String(config.height);
        height = (height.match(/%/))?(obj.height()*parseFloat(height.replace(/%/,'')/100)):height;
        obj.children().css({'width':width,'height':height,'position':'absolute'});
        var outerWidth = obj.children().outerWidth(true);
        var outerHeight = obj.children().outerHeight(true);


        var build=function(){
            if(system.tagIn(obj)){
                setDOM.start();
                fixedWindow.start(resize);
                decorate.start();
                trigger.start(auto);
            }
            $.ShowCaseListConID++;
        };

        var setDOM = {
            start:function(){
                this.mainDOM();
                this.btnPN(btnNP);
            }
            ,mainDOM:function(){//把DOM置入
                var tempCh = obj.html() ;
                obj.attr('SCL',$.ShowCaseListConID);
                obj.html('').append(
                    '<div SCL="frame'+$.ShowCaseListConID+'">' +
                        '<div SCL="mask"></div>' +
                        '<div SCL="con">'+
                            '<div SCL="items">' +
                                tempCh+
                            '</div>' +
                        '</div>' +
                    '</div>'
                );
                frame = $(frame);
                mask = $(mask);
                con = $(con);
                items = $(items);
                items.css({'width':'100%','height':'100%'});
            }
            ,btnPN:function(bool){//把按鈕置入
                if(bool){
                    obj.append(
                        '<div SCL="prevBtn'+$.ShowCaseListConID+'" class="SCLBtnP" ><div class="btn btnP jssora20l"></div></div>' +
                        '<div SCL="nextBtn'+$.ShowCaseListConID+'" class="SCLBtnN" ><div class="btn btnN jssora20r"></div></div>'
                    );
                    btnN = $(btnN);
                    btnP = $(btnP);
                }
            }
        };

        var fixedWindow ={
            start:function(resize){//畫面矯正
                var ob = this;
                //跟隨畫面大小
                this.delay(resize);
                $(window).on('resize',function(){
                    if(resize){
                        ob.delay(resize);
                    }
                });
            }
            ,delay:function(resize){//延遲
                var ob = this;
                setTimeout(function(){
                    ob.doWork(resize);
                },200);
            }
            ,doWork:function(resize){
                //針對 mask 與 con 持續取得位置
                var comWindowW2 = window.innerWidth; //window 寬
                var comWindowW = $(window).width();
                //alert(comWindowW+' '+comWindowW2);
                var objL =  (obj.offset().left); //物件左空距
                var allWidth = len*outerWidth; //全長
                var fixedMaskL = ((typeof objL=='number')?objL:0) - (len - (halfLen + 1))*outerWidth;
                var fixedConL =  - (len - (halfLen + 1))*outerWidth;
                outerWidth = obj.outerWidth(true);
                outerHeight = obj.outerHeight(true);
                frame.css({
                   'width': (allWidth >comWindowW)?comWindowW:allWidth
                    ,'height':outerHeight
                    ,'margin-left':(allWidth >comWindowW)?(typeof objL=='number')?-objL:0:fixedConL
                });
                (setMask)?mask.css({
                    'width':(allWidth >comWindowW)?comWindowW:allWidth
                    ,'height':outerHeight
                }):'';
                con.css({
                    'width':allWidth
                    ,'height':outerHeight
                    ,'margin-left':(allWidth >comWindowW)?fixedMaskL:0
                });
                (resize)?this.scaling():'';
            }
            ,scaling:function(){
                items.children().css({'width':outerWidth,'height':outerHeight});
                decorate.setItems(0);
            }
        };

        var decorate = {
            start:function(){
                this.setList(true);
                //對上層包覆做
                if(style == '0'){
                    this.setBox(0);
                }
                //對子層物件做
                if(style == '0'){
                    this.setItems(0);
                }
                //對按鈕做
                if(style == '0'){
                    this.setBtnNP(btnNP);
                }
            }
            ,setBox:function(types){
                switch (types){//
                    case 0:
                        obj.css({'position': position});
                        frame.css({'position': 'relative','overflow':'hidden'});
                        (setMask)?mask.css({'background-color':'#000','opacity':0.75,'position':'absolute','z-index':z_index}):'';
                        con.css({'position': 'relative'});
                        break;
                }
            }
            ,setItems:function(types){//Item CSS 定位
                if(types == 0){
                    if (direction == 'left') {
                        for (i = 0 ; i < len   ; i++) {
                            if(i < (len -1) - halfLen ){
                                items.children().eq(arrList[i]).css('z-index', z_index-2);
                            }else if(i > (len -1) - halfLen ){
                                items.children().eq(arrList[i]).css('z-index', z_index-1);
                            }else{
                                items.children().eq(arrList[i]).css('z-index', z_index);
                            }
                            items.children().eq(arrList[i]).stop().css({'left': (i) * outerWidth});
                        }
                    }
                }
            }
            ,setList:function(first,oppo){//是否要一次作業   (2 . 順序為正或負
                var temp=null;
                if(typeof oppo=='undefined'){
                    oppo = true;
                }
                if(first){
                    arrList = [];
                    for( i = halfLen + 1 ; i < len ; i++){
                        arrList.push(i);
                    }
                    for( i = 0 ; i < halfLen + 1; i++){
                        arrList.push(i);
                    }
                }else{
                    if(oppo){
                        temp = arrList.shift();
                        arrList.push(temp);
                    }else{
                        temp = arrList.pop();
                        arrList.unshift(temp);
                    }
                }
            }
            ,setBtnNP:function(types){//按鈕CSS配置
                if(types){
                    btnP.css({'position':'absolute',width:'30%','height':'100%',top:'0','left':'-30%'});
                    btnN.css({'position':'absolute',width:'30%','height':'100%',top:'0','right':'-30%'});
                    if(config.testMode){
                        btnP.children().css({
                            'background':'#ccc'
                            ,'width':'30px'
                            ,'height':'50px'
                            ,'position':'absolute'
                            ,'right':'15px'
                            ,'top':'calc( 50% - 25px )'
                        });
                        btnN.children().css({
                            'background':'#ccc'
                            ,'width':'30px'
                            ,'height':'50px'
                            ,'position':'absolute'
                            ,'left':'15px'
                            ,'top':'calc( 50% - 25px )'
                        });
                    }
                }
            }
        };
        var trigger = {
            start:function(way){
                this.autoControl(way);
                this.setBtn(btnNP);
            }
            ,autoControl:function(way){//自動下筆
                switch (way){
                    case true:
                        var siControl,ob = this;

                        siControl = setInterval(function(){
                            if($.ShowCaseListConCha == true) {
                                ob.showNext(true);
                            }
                        },switching);

                        if(hoverStop){
                            obj.mouseleave(function(){
                                siControl = setInterval(function(){
                                    if($.ShowCaseListConCha == true) {
                                        ob.showNext(true);
                                    }
                                },switching);
                            });

                            obj.mouseover(function(){
                                clearInterval(siControl);
                            });
                        }
                        break;
                }
            }
            ,setBtn:function(need){//按鈕觸發
                var ob = this;
                if(need){
                    btnP.click(function(e){
                        ob.showNext(false);
                    });
                    btnN.click(function(e){
                        ob.showNext(true);
                    });
                }
            }
            ,showNext:function(opposite){//下筆資料
                var oppo = (!!opposite)?1:-1;
                currentID =(currentID + oppo < 0 )?len - 1 :(currentID + oppo >= len )?0: currentID + oppo;
                decorate.setList(false,opposite);
                for (i = 0 ; i < len  ; i++) {
                    if(i == len-1 && len > 2){
                        items.children().eq(arrList[i])
                            .css({'z-index':z_index-3,'display':'none'});
                    }else if(i < (len -1) - halfLen ){
                        items.children().eq(arrList[i])
                            .css({'z-index':z_index-2,'display':'block'});
                    }else if(i > (len -1) - halfLen){
                        items.children().eq(arrList[i])
                            .css({'z-index':z_index-1,'display':'block'});
                    }else{
                        items.children().eq(arrList[i])
                            .css({'z-index': z_index,'display':'block'})
                    }
                    items.children().eq(arrList[i])
                        .stop(true,true)
                        .animate({'left': (i) * outerWidth},speed,easing);
                }
            }
        };

        var system={//系統
            tagIn:function(obj){
                var rts = false;
                if(typeof obj.attr('SCL')!='undefined'){
                    rts = true;
                }
                return rts;
            }
            ,callBack:{
                pause:function(){
                    alert('Hi'+Changer);
                }
            }
        };

        build();
    };

    $.ShowCaseList={//緊急開關
        pause:function(){
            $.ShowCaseListConCha = false;
        }
        ,start:function(){
            $.ShowCaseListConCha = true;
        }
    };


    /*他打從娘胎就不屬於這裡*/
    function toNum(obj,theDefault) {//要轉換的值 , 預設值
        if(typeof theDefault != 'undefined'){
            if(typeof theDefault == 'string'){
                try{
                    theDefault = parseFloat(theDefault);
                }catch (e){
                    theDefault = 0;
                }
            }else if(typeof theDefault == 'number'){
                //等於不更動
            }else{
                theDefault = 0
            }
        }else{
            theDefault = 0;
        }

        if (typeof obj == 'string') {
            try{
                obj = parseFloat(obj);
            }catch (e){
                obj = theDefault;
            }
        }else if(typeof obj == 'number'){
            //等於不更動
        }else{
            obj = theDefault;
        }
        return obj;
    }
})(jQuery);

