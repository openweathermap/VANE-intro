## Leaflet-OpenWeatherMap

This example to show current weather in 200+ main cities is based on [Kosmosnimki prototype app](https://github.com/ScanEx/Leaflet-OpenWeatherMap).

"Kosmosnimki" server is used to get city local time shift in forecast display.

### Usage
```
    var owm = new L.OWMLayer(options);
    map.addLayer(owm);
```

The following `options` for `L.OWMLayer` constructor are available:
  * `key`: [OpenWeatherMap APPID](http://openweathermap.org/appid)
  * `cityIDs`: array of city IDs, see [OpenWeatherMap API](http://openweathermap.org/api)
  
### License
[MIT](https://opensource.org/licenses/MIT)

