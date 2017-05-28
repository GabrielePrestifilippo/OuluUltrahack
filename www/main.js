initApp();
function initApp() {

    var height=screen.height;
    $("#map, #view3d").css("height",height-48);

    console.log(navigator.compass);

var osmUrl = '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osm = new L.TileLayer(osmUrl, {
        maxZoom: 22,
        attribution: "Map data &copy; OpenStreetMap contributors"
    });

var map = new L.Map('map', {
    layers: [osm],
    center: new L.LatLng(45.4999757, 9.2306066),
    zoom: 19
});


var indoorLayer = new L.Indoor(GeoJSON, {

    onEachFeature: function (feature, layer) {
        if (feature.properties.view) {
            var container = $('<Button class="startPanoButton" />');
            container.html("Panorama");
            container.on('click', function () {
                startPano(feature.properties.view)
            });
            layer.bindPopup(container[0]);
        } else {
            layer.bindPopup(JSON.stringify(feature.properties.id, null, 4));
        }

    },
    style: function (feature) {
        var fill = 'white';

        if (feature.properties.id === 'room') {
            fill = '#169EC6';
        } else if (feature.properties.id === 'room') {
            fill = '#0A485B';
        }

        return {
            fillColor: fill,
            weight: 1,
            color: '#666',
            fillOpacity: 1
        };
    }
});

indoorLayer.setLevel("1");


var levelControl = new L.Control.Level({
    level: "1",
    levels: indoorLayer.getLevels()
});


var myIcon = L.icon({
    iconUrl: 'image/marker.png',
    iconSize: [60, 60],
    iconAnchor: [30, 0]
});

var myMarker = L.marker([45.4999757, 9.2306066], {icon: myIcon}).addTo(map);
var initialPosition;

function onSuccess(position) {
    if (!initialPosition) {
        initialPosition = [position.coords.latitude, position.coords.longitude];
    }

    var diffLat = initialPosition[0] - position.coords.latitude;
    var diffLng = initialPosition[1] - position.coords.longitude;
    var newLat = 45.4999757 + diffLat;
    var newLng = 9.2306066 + diffLng;
    var newLatLng = new L.LatLng(newLat, newLng);
    myMarker.setLatLng(newLatLng);
}


var watchId = navigator.geolocation.watchPosition(onSuccess,
    function (e) {
        console.log(e)
    }, {maximumAge: 3000, timeout: 5000, enableHighAccuracy: true});

function get3d(myJson, level) {
    osmb.each(function (p) {
        if (p.properties.level !== level) {
            return false
        }
    });
    osmb.set(myJson);
    osmb.date(new Date(2015, 15, 1, 10, 30));
}

function customListener(num) {
    indoorLayer.setLevel(num);
    get3d(GeoJSON, num.newLevel);
}


levelControl.addEventListener("levelchange", customListener, indoorLayer);
levelControl.addTo(map);
indoorLayer.addTo(map);


var osmb = new OSMBuildings(map);
get3d(GeoJSON, 1);


map.addControl(new L.Control.Compass());
var viewer;


var imagesList = ["equirectangular.jpg", "room1.jpg"];
var panoList = [];
var initialized = 0;

function initPanorama() {
    imagesList.forEach(function (p, i) {
        panoList.push(new PANOLENS.ImagePanorama("image/" + imagesList[i]));
    });
    var view3d = document.getElementById("view3d");
    viewer = new PANOLENS.Viewer({
        container: view3d,	// A DOM Element container
        controlBar: true,
        autoHideControlBar: false,	// Auto hide control bar
        autoHideInfospot: true,		// Auto hide infospots
        horizontalView: false,		// Allow only horizontal camera control
        cameraFov: 120,				// Camera field of view in degree
        reverseDragging: false,		// Reverse orbit control direction
        enableReticle: false,		// Enable reticle for mouseless interaction
        dwellTime: 1500,			// Dwell time for reticle selection in millisecond
        autoReticleSelect: true,	// Auto select a clickable target after dwellTime
        passiveRendering: false	// Render only when control triggered by user input
    });
    panoList.forEach(function (p) {
        viewer.add(p);
    })


}

function startPano(num) {
    $("#view3d").show();
    $("#map").hide();

    if (!initialized) {
        initPanorama();
        initialized = 1;
    }
    viewer.setPanorama(panoList[num - 1]);

    $(".startMapButton").show();
}

function startMap() {
    $("#view3d").hide();
    $("#map").show();
    $("#startPanoButton").show();
    $("#startMapButton").hide();
}


$("#search").click(function () {
    var width = screen.width;
    $("#searchBox").css("display", "block");
    setTimeout(function () {
        $("#searchBox").css("width", width - 10);
    }, 1)

});

$(".searchMini").on("click", function () {
    searchText();
});


$(".searchMini").on("keyup keydown", function (e) {
    if (e.keyCode == 13) {
        searchText();
    }
});

function searchText() {
    var inputText = $(".searchBox").val();

    for (var key in indoorLayer._layers) {
        indoorLayer._layers[key].eachLayer(function (f) {

            if (f.feature.properties.info && f.feature.properties.info.indexOf(inputText) !== -1) {
                var newLatLng = L.GeoJSON.coordsToLatLngs(f.feature.geometry.coordinates[0][0])[0];
                map.setView(newLatLng);
                f.openPopup();
                return;
            }
            return;
        });
    }


    $("#searchBox").css("width", 0);
    setTimeout(function () {
        $("#searchBox").css("display", "none");
    }, 300)
}

}
