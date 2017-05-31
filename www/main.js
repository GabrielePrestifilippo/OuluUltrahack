initApp();
function initApp() {

    //Initialize the tabbar
    var tabbar = new AppTabBar.Tabbar('tab_bar', {
        button_height: 60
    });

    tabbar.init();

    //Add tabs
    var homePage = tabbar.addTab('  <i class="fa fa-home"></i>', '', {
        events: {
            selected: function () {
                document.getElementById('page_info').style.display = 'none';
                document.getElementById('page_media').style.display = 'none';
                document.getElementById('page_home').style.display = 'block';
            }
        }
    });

    var mediaPage = tabbar.addTab('  <i class="fa fa-picture-o"></i>', '', {
        events: {
            selected: function () {
                document.getElementById('page_home').style.display = 'none';
                document.getElementById('page_media').style.display = 'block';
                document.getElementById('page_info').style.display = 'none';
            }
        }
    });

    var infoPage = tabbar.addTab('  <i class="fa fa-search"></i>', '', {
        events: {
            selected: function () {
                document.getElementById('page_home').style.display = 'none';
                document.getElementById('page_media').style.display = 'none';
                document.getElementById('page_info').style.display = 'block';
            }
        }
    });

    tabbar.render();

    tabbar.selectTab(homePage);


    var height = screen.height;
    $("#map, #view3d").css("height", height - 48 - 50);

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

    function populateMediaList() {
        var myDiv = "";
        GeoJSON.features.forEach(function (f) {
            if (f.properties.info) {
                myDiv += `<div class="listBox" panoId="` + f.properties.view + `" style="background-image: url('image/preview/` + f.properties.preview + `.jpg')">
                <div class="nameMedia">` + f.properties.info + `</div>
                    </div>`;
            }
        });
        $("#mediaList").append(myDiv);

        $(".listBox").click(function () {
            var id = $(this).attr("panoId");
            startPano(id);
        });
    }

    populateMediaList();

    function populateInfoList() {
        var myDiv = "";


        for (var key in indoorLayer._layers) {
            indoorLayer._layers[key].eachLayer(function (f) {
                if (f.feature.geometry.coordinates[0]) {
                    var coords = L.GeoJSON.coordsToLatLngs(f.feature.geometry.coordinates[0][0])[0];
                    var lat = coords.lat;
                    var lng = coords.lng;
                    var i = f.feature.properties.info ? f.feature.properties.info : "";
                    var d = f.feature.properties.description ? f.feature.properties.description : "";
                    myDiv += `<div class="listBoxInfo" lat="` + lat + `" lng="` + lng + `" level="` + f.feature.properties.level + `">
                   <div class="nameInfo">` + i + ` ` + d + `</div>
                   </div>`;
                }
            });
        }


        $("#infoList").append(myDiv);

        $(".listBoxInfo").click(function () {
            var id = $(this).attr("level");
            var lat = $(this).attr("lat");
            var lng = $(this).attr("lng");
            tabbar.selectTab(homePage);
            indoorLayer.setLevel(id);
            var coords = new L.LatLng(lat, lng);
            var myIcon = L.icon({
                iconUrl: 'image/marker.png',
                iconSize: [60, 60],
                iconAnchor: [30, 0]
            });

            var myMarker = L.marker([lat, lng], {icon: myIcon}).addTo(map);
            setTimeout(function () {
                map.removeLayer(myMarker);
            }, 500);
            map.setView(coords);
        });

    }

    populateInfoList();

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
    map.addControl(new L.Control.Position());
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
        $(".backButton").show();
        $("#mediaList").hide();
        tabbar.selectTab(mediaPage);
        if (!initialized) {
            initPanorama();
            initialized = 1;
        }
        viewer.setPanorama(panoList[num - 1]);

        $(".startMapButton").show();
    }


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
                    closeSearch();
                    return;
                }
                return;

            });
        }

        function closeSearch() {
            $(".searchBar").css("width", "1px");
            setTimeout(function () {
                $(".searchBar").css("display", "none");
            }, 250)
        }

        $("#searchBox").css("width", 0);
        setTimeout(function () {
            $("#searchBox").css("display", "none");
        }, 300);
    }

}
function hidePano() {
    $("#view3d").hide();
    $("#startMapButton").hide();
    $(".backButton").hide();
    $("#mediaList").show();
}


$(".search").click(function () {
    var width = screen.width;
    $(".searchBar").css("display", "block");
    setTimeout(function () {
        $(".searchBar").css("width", width - 10);
    }, 1)

});