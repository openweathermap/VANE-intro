(function() {

var posSign = function(num) {
    return num > 0 ? '+' + num : String(num);
}

var langDict = {
    'eng': {
        weekDay: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
        timeOfDay: ['night', 'morning', 'day', 'evening'],
        windDir: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'SW'],
        windSpeedUnit: 'm/sec',
        pressureUnit: 'mmHg',
        copyright: 'Data from <a href="http://openweathermap.org/">OpenWeatherMap</a>'
    }, 
    'rus': {
        weekDay: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
        timeOfDay: ['ночь', 'утро', 'день', 'вечер'],
        windDir: ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'],
        windSpeedUnit: 'м/с',
        pressureUnit: 'м.р.с.',
        copyright: 'По данным <a href="http://openweathermap.org/">OpenWeatherMap</a>'
    }
}

var defaultCityIDs = [1138958,3688357,2172517,2761369,3448433,3571824,6087824,625144,1816670,1796236,3067696,360630,658224,6455259,524901,1261481,293397,2964574,2643741,5128638,5391959];

var defaultLocalDateProvider = function(lat, lng) {
    var def = $.Deferred();
    $.getJSON('https://maps.kosmosnimki.ru/rest/ver1/layers/295894E2A2F742109AB112DBFEAEFF09/search', {
        border: JSON.stringify({type: 'Point', coordinates: [lng, lat]}),
        geometry: false,
        api_key: 'Y5YMN9XSOC'
    }).then(function(result) {
        def.resolve(Number(result.features[0].properties.name));
    }, def.reject.bind(def))

    return def.promise();
};

L.OWMLayer = L.Class.extend({
    getAttribution: function() {
        return 'Weather from <a href="http://openweathermap.org/" alt="World Map and worldwide Weather Forecast online">OpenWeatherMap</a>';
    },
    initialize: function(options) {
        options = options || {};
        var cityIDs = (options.cityIDs || defaultCityIDs).slice(0);
        
        this._cityIDChunks = [];
        while (cityIDs.length) {
            this._cityIDChunks.push(cityIDs.splice(0, 20));
        }
        
        this._lang = options.language || 'eng';
        this._key = options.key;
        this._timeShiftProvider = options.timeShiftProvider || defaultLocalDateProvider;
    },
    _icons: {
        '01d': '0.png',
        '01n': '0.png',
        '02d': '1.png',
        '02n': '1.png',
        '03d': '2.png',
        '03n': '2.png',
        '04d': '3.png',
        '04n': '3.png',
        '09d': '5.png',
        '09n': '5.png',
        '10d': '4.png',
        '10n': '4.png',
        '11d': '8.png',
        '11n': '8.png',
        '13d': '6.png',
        '13n': '6.png',
        '50d': '9.png',
        '50n': '9.png'
    },
    _template: Handlebars.compile(
        '<div class="owm-city-name">{{cityName}}</div>' +
        '<table class="owm-forecast-table"><tbody>' +
            '{{#forecast}}<tr>' +
                '<td>{{dayInfo}}</td>' +
                '<td>{{tempMin}}..{{tempMax}}</td>' +
                '<td>{{windDir}}</td>' +
                '<td>{{windSpeed}}</td>' +
                '<td>{{pressure}}</td>' +
                '<td>{{humidity}}%</td>' +
                '<td><img width=16 height=16 src="https://maps.kosmosnimki.ru/api/img/weather/16/{{icon}}"></img></td>' +
            '</tr>{{/forecast}}' +
        '</tbody></table>' + 
        '<div class="owm-city-copyright">{{{copyright}}}</div>'),
    onAdd: function(map) {
        if (this._markers) {
            map.addLayer(this._markers);
            return;
        };
        
        var _this = this;
        
        var requests = this._cityIDChunks.map(function(cityIDs) {
            var params = {id: cityIDs.join(','), units: 'metric'};
            if (_this._key) {
                params.appid = _this._key;
            }
            return $.getJSON('https://openweathermap.org/data/2.5/group', params);
        });
        
        $.when.apply($.when, requests).then(function() {
            var list = [];
            
            for (var i = 0; i < arguments.length; i++) {
                list = list.concat(arguments[i][0].list);
            }
            
            _this._markers = L.layerGroup();
            
            list.forEach(function(city) {
                var marker = L.marker([city.coord.lat, city.coord.lon], {
                    icon: L.icon({
                        iconUrl: 'https://maps.kosmosnimki.ru/api/img/weather/24/' + _this._icons[city.weather[0].icon],
                        iconAnchor: [12, 12]
                    })
                }).on('click', function() {
                    marker.unbindPopup();
                    
                    var params = {id: city.id, units: 'metric'};
                    if (_this._key) {
                        params.appid = _this._key;
                    }
                    
                    $.when(
                        $.getJSON('https://openweathermap.org/data/2.5/forecast', params),
                        _this._timeShiftProvider(city.coord.lat, city.coord.lon)
                    ).then(function(owmRes, timeShift) {
                        var owmData = owmRes[0],
                            dict = langDict[_this._lang];
                            
                        var forecastData = [];
                        var html = '';
                        for (var t = 0; t < 4; t++) {
                            var f = owmData.list[2 * t + 1]; //each 6 hours

                            if (!f) continue;

                            var localTime = new Date(f.dt*1000 + timeShift*3600*1000),
                                localWeekDay = localTime.getUTCDay(),
                                localHours = localTime.getUTCHours();
                            
                            forecastData.push({
                                dayInfo: dict.weekDay[localWeekDay] + ', ' + dict.timeOfDay[Math.floor(localHours/6)],
                                tempMin: posSign(Math.round(f.main.temp_min)),
                                tempMax: posSign(Math.round(f.main.temp_max)),
                                windDir: dict.windDir[Math.round(f.wind.deg/45) % 8],
                                windSpeed: Math.round(f.wind.speed) + ' ' + dict.windSpeedUnit,
                                pressure: Math.round(f.main.pressure * 0.75006375541921) + ' ' + dict.pressureUnit,
                                humidity: Math.round(f.main.humidity),
                                icon: _this._icons[f.weather[0].icon]
                            });
                        }
                        
                        marker.bindPopup(_this._template({
                            forecast: forecastData, 
                            cityName: owmData.city.name, 
                            copyright: dict.copyright
                        }), {maxWidth: 500}).openPopup();
                    })
                });
                
                _this._markers.addLayer(marker);
            })
            
            map.addLayer(_this._markers);
        });
    },
    
    onRemove: function(map) {
        map.removeLayer(this._markers);
    }
})

})();
