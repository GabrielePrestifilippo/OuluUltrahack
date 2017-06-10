var pathFinder;
var polyOld;
var map;
define(function (require) {

    var p;
    var main = {};
    main.initApp = function (PathFinder) {

        //Initialize the tabbar
        var tabbar = new AppTabBar.Tabbar('tab_bar', {
            button_height: 60
        });

        setTimeout(function () {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }
        }, 2000);

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


        var height = window.innerHeight;

        $("#map, #view3d").css("height", height - 50 - 50 + 24);


        var osmUrl = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            osm = new L.TileLayer(osmUrl, {
                maxZoom: 22,
                attribution: "Map data &copy; OpenStreetMap contributors"
            });

        map = new L.Map('map', {
            layers: [osm],
            center: new L.LatLng(65.0588221, 25.4660605),
            zoom: 20
        });


        pathFinder = new PathFinder(myPath);
        var pathToUse = L.geoJson(myPath);

        var indoorLayer = new L.Indoor(GeoJSON, {

            onEachFeature: function (feature, layer) {

                if (feature.properties.id) {
                    var poly = getOuter(feature.geometry.coordinates);
                    var center = getCentroid(poly);

                    if (feature.properties.view) {
                        var container = $('<div><p>' + feature.properties.id + '</p><Button class="startPanoButton">Panorama</Button><br><br><Button class="startNaviButton">Go here</Button></div>');
                    } else {
                        var container = $('<div><p>' + feature.properties.id + '</p><p></p><p></p><p></p><Button class="startNaviButton">Go here</Button></div>');

                    }
                    container[0].children[1].addEventListener('click', function () {
                        startPano(feature.properties.view);
                    });

                    container[0].children[4].addEventListener('click', function () {


                        var startN = leafletKnn(pathToUse).nearest(initialPosition, 5)[0]
                        var finishN = leafletKnn(pathToUse).nearest(L.latLng(center[1], center[0]), 5)[0];
                        var foundPath = pathFinder.findPath(makePoint(startN.lat, startN.lon), makePoint(finishN.lat, finishN.lon));

                        var newPath = [];
                        foundPath.path.forEach(function (p) {
                            newPath.push([p[1], p[0]])
                        });
                        if (polyOld) {
                            map.removeLayer(polyOld);
                        }
                        polyOld = L.polyline(newPath, {color: 'green'}).addTo(map);


                        map.fitBounds(polyOld.getBounds());


                    });
                    var m = layer.bindPopup(container[0]);


                    function onClick() {
                        m.openPopup();
                    }

                    if (feature.properties.id !== "wall") {
                        var myIcon = L.divIcon({className: 'my-div-icon'});

                        L.marker([center[1], center[0]], {
                            icon: new L.DivIcon({
                                className: 'my-div-icon',
                                html: '<span class="my-div-span">' + feature.properties.id + '</span>'
                            })
                        }).addTo(map).on('click', onClick);
                    }

                } else {
                    layer.bindPopup(JSON.stringify(feature.properties.id, null, 4));
                }

            },


            style: function (feature) {
                var fill = 'white';

                if (feature.properties.id === 'wall') {
                    fill = '#ffffff';
                } else {
                    fill = '#44b9cc';
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

        map.on('zoomend', function () {
            var currentZoom = map.getZoom();
            if (currentZoom < 16) {
                currentZoom = 8;
            }
            $(".my-div-span").css("font-size", currentZoom - 8);
        });

        var levelControl = new L.Control.Level({
            level: "1",
            levels: indoorLayer.getLevels()
        });


        var myIcon = L.icon({
            iconUrl: 'image/marker.png',
            iconSize: [60, 60],
            iconAnchor: [30, 0]
        });

        var myMarker = L.marker([65.0588638816022, 25.466501712799072,
        ], {icon: myIcon}).addTo(map);
        var initialPosition = new L.LatLng(65.05883899843612, 25.466536581516266);

        function onSuccess(position) {
            if (!initialPosition) {
                initialPosition = [position.coords.latitude, position.coords.longitude];
            }

            var newLat = position.coords.latitude;
            var newLng = position.coords.longitude;
            var newLatLng = new L.LatLng(newLat, newLng);
            initialPosition = newLatLng;
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
                    if (f.properties.id !== "wall") {
                        myDiv += '<div class="listBox" panoId="' + f.properties.view;
                        myDiv += '" style="background-image: url(image/preview/';
                        myDiv += f.properties.preview + '.jpg)"><div class="nameMedia">';
                        myDiv += f.properties.info + '</div></div>';
                    }
                }

                var pos = getPosition(f.geometry.coordinates);

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
                        if (f.feature.properties.id !== "wall") {
                            var coords = getPosition(f.feature.geometry.coordinates);
                            var lat = coords[1];
                            var lng = coords[0];
                            var i = f.feature.properties.id;
                            var d = f.feature.properties.description ? f.feature.properties.description : "";
                            myDiv += '<div class="listBoxInfo" info="';
                            myDiv += f.feature.properties.id;
                            myDiv += '" lat="' + lat + '" lng="' + lng + '" level="' + f.feature.properties.level + '">';
                            myDiv += '<div class="nameInfo">' + i + ' - ' + d + '</div> </div>';
                        }
                    }
                });
            }


            $("#infoList").append(myDiv);

            $(".listBoxInfo").click(function () {
                var id = $(this).attr("level");
                var lat = $(this).attr("lat");
                var lng = $(this).attr("lng");
                var i = $(this).attr("info");
                tabbar.selectTab(homePage);
                indoorLayer.setLevel(id);
                var coords = new L.LatLng(lat, lng);
                var myIcon = L.icon({
                    iconUrl: 'image/position.png',
                    iconSize: [38, 41],
                    iconAnchor: [14, 31],
                    popupAnchor: [0, -31]
                });

                var myMarker = L.marker([lat, lng], {icon: myIcon}).addTo(map);
                setTimeout(function () {
                    map.removeLayer(myMarker);
                }, 3500);
                map.setView(coords);
                myMarker.bindPopup(i).openPopup();
            });

        }

        populateInfoList();

        function customListener(num) {
            indoorLayer.setLevel(num);
            // get3d(GeoJSON, num.newLevel);
        }


        levelControl.addEventListener("levelchange", customListener, indoorLayer);
        levelControl.addTo(map);
        indoorLayer.addTo(map);


        // var osmb = new OSMBuildings(map);
        // get3d(GeoJSON, 1);
        L.geoJson(tellus, {
            style: {
                "color": "#cdffdc",
                "weight": 0,
                "opacity": 0.3
            }
        }).addTo(map);


        map.addControl(new L.Control.Compass());
        map.addControl(new L.Control.Position());
        var viewer;


        var imagesList = [
                , {
                    img: "mentoring.mp4",
                    position: [4000, -767.48, 2000],
                    link: [476.79, -1072.92, -5402.55],
                    content: "Mentoring",
                    image: "image/marker.png"
                }, {
                    img: "hacking.mp4",
                    position: [4000, -767.48, 2000],
                    link: [476.79, -1072.92, -5402.55],
                    content: "Hacking",
                    image: "image/marker.png"
                }, {
                    img: "room1.jpg",
                    position: [4000, -767.48, 2000],
                    link: [476.79, -1072.92, -5402.55],
                    content: "Cafe",
                    image: "image/marker.png"
                }, {
                    img: "stage.jpg",
                    position: [3957.4, -744.48, 2000],
                    link: [-3682.3, -1321.65, -2657.09],
                    content: "Stage",
                    image: "image/marker.png"
                },
                {
                    img: "entrance.mp4",
                    position: [3957.4, -744.48, 2000],
                    link: [-3682.3, -1321.65, -2657.09],
                    content: "Entrance",
                    image: "image/marker.png"
                }
            ]
        ;
        var panoList = [];
        var initialized = 0;

        function initPanorama() {
            imagesList.forEach(function (p, i) {
                var pano = new PANOLENS.ImagePanorama("image/" + imagesList[i].img);
                if (i == 5 || i == 1 || i == 2) {
                    pano = new PANOLENS.VideoPanorama("image/" + imagesList[i].img, {autoplay: true});
                }
                pano.position.set(imagesList[i].link[0], imagesList[i].link[1], imagesList[i].link[2]);
                var infospot = new PANOLENS.Infospot(350, PANOLENS.DataImage.Info);
                infospot.position.set(imagesList[i].position[0], imagesList[i].position[1], imagesList[i].position[2]);

                var myDiv = document.createElement("div");
                var myDivText = "<div id='myDivInfo" + i + "' class='hoverInfo'>";
                myDivText += imagesList[i].content + "<br><img src=" + imagesList[i].image + "></div>";
                myDiv.innerHTML = myDivText;
                infospot.addHoverElement(myDiv);
                pano.add(infospot);
                panoList.push(pano);
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
            panoList.forEach(function (p, i) {

                viewer.add(p);
                if (i < panoList.length - 1) {
                    p.link(panoList[i + 1]);
                }
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
            var found = 0;
            var inputText = $(".searchBox").val().toUpperCase();

            for (var key in indoorLayer._layers) {
                indoorLayer._layers[key].eachLayer(function (f) {

                    if (f.feature.properties.info && f.feature.properties.info.toUpperCase().indexOf(inputText) !== -1) {
                        var coords = getPosition(f.feature.geometry.coordinates);
                        var poly = getOuter(f.feature.geometry.coordinates);
                        var center = getCentroid(poly);

                        map.setView(new L.latLng(center[1], center[0]));
                        f.openPopup();
                        closeSearch();
                        found = 1;
                        return;
                    }
                    return;
                });
            }
            if (!found) {
                alert("Not found")
            }
        }
    }

    return main;
});

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

var getCentroid = function (arr) {
    return arr.reduce(function (x, y) {
        return [x[0] + y[0] / arr.length, x[1] + y[1] / arr.length]
    }, [0, 0])
}
function makePoint(lat, lng) {
    var point = {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [lng, lat]
        }, "properties": {}
    };
    return point;
}
function getPosition(coord) {
    if (coord[0][0] && typeof(coord[0][0][0]) == "number") {
        return coord[0][0];
    } else if (coord[0][0][0] && typeof(coord[0][0][0][0]) == "number") {
        return coord[0][0][0];
    } else if (coord[0][0][0][0] && typeof(coord[0][0][0][0][0]) == "number") {
        return coord[0][0][0][0];
    }
};

function getOuter(coord) {
    if (coord[0][0] && typeof(coord[0][0][0]) == "number") {
        return coord[0];
    } else if (coord[0][0][0] && typeof(coord[0][0][0][0]) == "number") {
        return coord[0][0];
    } else if (coord[0][0][0][0] && typeof(coord[0][0][0][0][0]) == "number") {
        return coord[0][0][0];
    }
};
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