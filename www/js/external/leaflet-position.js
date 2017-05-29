(function (factory) {
    if (typeof define === 'function' && define.amd) {
        //AMD
        define(['leaflet'], factory);
    } else if (typeof module !== 'undefined') {
        // Node/CommonJS
        module.exports = factory(require('leaflet'));
    } else {
        // Browser globals
        if (typeof window.L === 'undefined')
            throw 'Leaflet must be loaded first';
        factory(window.L);
    }
})(function (L) {

    L.Control.Position = L.Control.extend({

        includes: L.Mixin.Events,

        options: {
            position: 'bottomleft',	//position of control inside map
            autoActive: false,		//activate control at startup
            showDigit: true,		//show angle value bottom compass
            textErr: null,			//error message on alert notification
            callErr: null,			//function that run on compass error activating
            angleOffset: 2			//min angle deviation before rotate
            /* big angleOffset is need for device have noise in orientation sensor */
        },

        initialize: function (options) {
            if (options && options.style)
                options.style = L.Util.extend({}, this.options.style, options.style);
            L.Util.setOptions(this, options);
            this._errorFunc = this.options.callErr || this.showAlert;
            this._isActive = false;//global state of compass
            this._currentAngle = null;	//store last angle
        },

        onAdd: function (map) {

            var self = this;

            this._map = map;


            var container = L.DomUtil.create('div', 'leaflet-position');

            this._button = L.DomUtil.create('span', 'position-button', container);
            this._button.href = '#';

            this._icon = L.DomUtil.create('div', 'position-icon', this._button);

            var iconB = L.DomUtil.create('i', 'fa fa-location-arrow', this._button);

            $(this._icon).append(iconB);

            container.width = 32;
            container.height = 32;
            L.DomEvent
                .on(container, 'click', L.DomEvent.stop, this)
                .on(container, 'click', function (e) {
                    navigator.geolocation.getCurrentPosition(
                        function (position) {
                            console.log(position);
                            var latitude = position.coords.latitude;
                            var longitude = position.coords.longitude;
                            var newLatLng = new L.LatLng(latitude, longitude);
                            map.setView(newLatLng);
                        }, function (e) {
                            console.log(e)
                        }, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});
                }, this);

            return container;
        }
    });

    L.control.compass = function (options) {
        return new L.Control.Position(options);
    };

    return L.Control.Position;

});