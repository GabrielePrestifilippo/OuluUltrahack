var osmUrl = '//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    osm = new L.TileLayer(osmUrl, {
        maxZoom: 22,
        attribution: "Map data &copy; OpenStreetMap contributors"
    });

var map = new L.Map('map', {
    layers: [osm],
    center: new L.LatLng(45.499688842786, 9.230298207042001),
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


function get3d(myJson, level) {
    osmb.each(function (p) {
        if (p.properties.level !== level) {
            return false
        }
    });
    osmb.set(myJson);
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
    panoList.forEach(function(p){
        viewer.add(p);
    })


}
function startPano(num) {
    $("#view3d").show();
    $("#map").hide();

    if (!initialized) {
        initPanorama();
        initialized=1;
    }
    viewer.setPanorama(panoList[num-1]);

    $(".startMapButton").show();
}

function startMap() {
    $("#view3d").hide();
    $("#map").show();
    $("#startPanoButton").show();
    $("#startMapButton").hide();
}