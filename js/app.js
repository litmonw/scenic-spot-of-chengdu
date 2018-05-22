const markers = [
    {name: '成都大熊猫繁育研究基地', position: [104.14469, 30.737297] },
    // {name: '都江堰景区', position: [103.608743, 31.001635]},
    // {name: '锦里', position: [104.048721, 30.644285]},
    // {name: '宽窄巷子', position: [104.053647, 30.663823]},
    // {name: '春熙路', position: [104.077758, 30.65552]},
    // {name: '青城山', position: [103.562887, 30.905374]},
    // {name: '紫颐香薰山谷', position: [104.174772, 30.436418]},
    // {name: '文殊院', position: [104.072534, 30.675325]},
    // {name: '杜甫草堂', position: [104.072534, 30.675325]},
    // {name: '西岭雪山', position: [103.173787, 30.615003]},
    // {name: '金沙遗址博物馆', position: [104.012659, 30.681726]},
    // {name: '成都海昌极地海洋公园', position: [104.073406, 30.49423]}
]

// 初始化
function init() {
    // 初始化地图
    map = new AMap.Map('container', {
        resizeEnable: true,
        zoom: 10,
        center: [104.065735, 30.659462]
    });

    ko.applyBindings(new MapViewModel(markers));
}

// 景点对象
let Scenic = function (scenic) {
    this.name = ko.observable(scenic.name);
    this.position = ko.observable(scenic.position);
    this.visible = ko.observable(true);
}

// 地图 VM
let MapViewModel = function (data) {
    let self = this;

    // 创建数据观察的数组
    self.scenicList = ko.observableArray([]);
    data.forEach(scenic => {
        self.scenicList.push(new Scenic(scenic));
    });

    // 标记功能
    self.scenicList().forEach(scenic => {
        let marker = new AMap.Marker({
            position: scenic.position(),
            title: scenic.name(),
            map: map,
            animation: 'AMAP_ANIMATION_DROP',
        });

        // 初始化 高德地图 信息窗体
        let infoWindow = new AMap.InfoWindow();

        scenic.marker = marker;

        fetch(`https://free-api.heweather.com/s6/weather/now?location=${scenic.position()}&key=0ac38465236e4d71b38ae3c3e62e5b48`, {
            method: 'GET'
        }).then(function (res) {
            // 解析 JSON
            return res.json();
        }).then(function (data) {
            // 天气数据
            let weatherData = data.HeWeather6[0];

            // 添加 Amap 点击事件
            AMap.event.addListener(scenic.marker, 'click', function () {
                let info = [];
                info.push("<h2>" + scenic.name() + "</h2>");

                info.push(`<span>天气：${weatherData.now.cond_txt}</span>`);
                info.push(`<span>温度：${weatherData.now.fl}</span>`);
                info.push(`<span>风向：${weatherData.now.wind_dir}</span>`);

                infoWindow.setContent(info.join("<br>"));
                infoWindow.open(map, this.getPosition());

                scenic.marker.setAnimation('AMAP_ANIMATION_BOUNCE');

                setTimeout(function () {
                    scenic.marker.setAnimation(null);
                }, 1200);

                map.setCenter(scenic.marker.getPosition());
            });
        }).catch(function () {
            AMap.event.addListener(scenic.marker, 'click', function () {
                let info = [];
                info.push("<h2>" + scenic.name() + "</h2>");

                info.push(`<span>暂未获取到该地区的天气信息</span>`);

                infoWindow.setContent(info.join("<br>"));
                infoWindow.open(map, this.getPosition());

                scenic.marker.setAnimation('AMAP_ANIMATION_BOUNCE');

                setTimeout(function () {
                    scenic.marker.setAnimation(null);
                }, 1200);

                map.setCenter(scenic.marker.getPosition());
            });
        });
    });

    // 显示列表所点击景点的 infoWindow
    self.showInfoWindow = function (scenic) {
        AMap.event.trigger(scenic.marker, 'click');
    };

    // 存储搜索对应的标记
    self.show = ko.observableArray();

    // 输入过滤字段功能
    self.filterWord = ko.observable('');

    // 搜索函数功能
    self.filterScenic = function () {
        var filterWord = self.filterWord();
        // removeAll() knockout 内置方法
        self.show.removeAll();

        self.scenicList().forEach(function (scenic) {
            scenic.marker.hide();
            scenic.visible(false);
            if (scenic.name().indexOf(filterWord) !== -1) {
                self.show.push(scenic);
                scenic.visible(true);
            }
        });

        // 
        self.show().forEach(function (scenic) {
            scenic.marker.show();
        });
    }

    // 抽屉栏折叠功能
    self.isToggled = ko.observable(true);
    self.isFalseToggled = ko.observable(false);

    self.switchToggle = function () {
        if (self.isToggled() === true) {
            self.isToggled(false);
            return self.isFalseToggled(true);
        }

        self.isFalseToggled(false);
        return self.isToggled(true);
    }
    
};