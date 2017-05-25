/*
 * Copyright (C) 2014 United States Government as represented by the Administrator of the
 * National Aeronautics and Space Administration. All Rights Reserved.
 */
var wwd;
require(['./src/WorldWind', './LayerManager'], function (ww, LayerManager) {
    "use strict";
    function addOSM(layerManager, geojson) {
        var request = new XMLHttpRequest();
        request.open("GET", "http://ows.terrestris.de/osm/service?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetCapabilities", true);
        request.onreadystatechange = function () {
            if (request.readyState === 4 && request.status === 200) {
                var xmlDom = request.responseXML;

                if (!xmlDom && request.responseText.indexOf("<?xml") === 0) {
                    xmlDom = new window.DOMParser().parseFromString(request.responseText, "text/xml");
                }
                var wmsCapsDoc = new WorldWind.WmsCapabilities(xmlDom);
                var config = WorldWind.WmsLayer.formLayerConfiguration(wmsCapsDoc, null);
                config.title = "OpenStreetMap";
                config.layerNames = "OSM-WMS";
                var layer = new WorldWind.WmsLayer(config, null);
                layer.detailControl = 1.5;
                wwd.addLayer(layer);
            }
        }
    };
    WorldWind.Logger.setLoggingLevel(WorldWind.Logger.LEVEL_WARNING);

    wwd = new WorldWind.WorldWindow("canvasOne");

    var layers = [
        {layer: new WorldWind.BMNGLayer(), enabled: true},
        {layer: new WorldWind.BMNGLandsatLayer(), enabled: false},
        {layer: new WorldWind.BingAerialLayer(null), enabled: false},
        {layer: new WorldWind.BingAerialWithLabelsLayer(null), enabled: false},
        {layer: new WorldWind.BingRoadsLayer(null), enabled: false},
        {layer: new WorldWind.CompassLayer(), enabled: true},
        {layer: new WorldWind.CoordinatesDisplayLayer(wwd), enabled: true},
        {layer: new WorldWind.ViewControlsLayer(wwd), enabled: true}
    ];

    for (var l = 0; l < layers.length; l++) {
        layers[l].layer.enabled = layers[l].enabled;
        wwd.addLayer(layers[l].layer);
    }

    var modelLayer = new WorldWind.RenderableLayer("model");
    wwd.addLayer(modelLayer);

    var position = new WorldWind.Position(45, -100, 0);
    var colladaLoader = new WorldWind.ColladaLoader(position);
    colladaLoader.init({dirPath: './collada_models/'});
    colladaLoader.load('building.dae', function (scene) {
        scene.scale = 50;
        modelLayer.addRenderable(scene);
    });

    addOSM();


    new LayerManager(wwd);

});
