## Leaflet-OpenWeatherMap

This is example of how to fetch Openweathermap API to show current and forecast weather in some cities on the Leaflet map and combine it with [weather map](https://owm.io/weathermap) layers. It's based on [Kosmosnimki prototype app](https://github.com/ScanEx/Leaflet-OpenWeatherMap) to get city local time shift in forecast query. You can add more cities or choose different ones.

[See this map standalone](https://owm-inc.github.io/VANE-intro/apps/leaflet-owm.html)

### Usage
```
    var owm = new L.OWMLayer(options);
    map.addLayer(owm);
```

The following `options` for `L.OWMLayer` constructor are available:
  * `key`: [OpenWeatherMap APPID](http://openweathermap.org/appid)
  * `cityIDs`: array of city IDs, get city IDs list - [download](http://bulk.openweathermap.org/sample/city.list.json.gz)
  
### License
[MIT](https://opensource.org/licenses/MIT)

