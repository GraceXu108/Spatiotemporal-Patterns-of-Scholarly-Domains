import './style.css';
import './libs/d3.v3.min.js';
import './libs/threebox.js';
import './libs/OrbitControls.js';
import './libs/TrackballControls.js';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as echarts from 'echarts';


// Public Token
mapboxgl.accessToken = 'pk.eyJ1IjoiZ2FvbWVuZ3lhbyIsImEiOiJja2lxZjhiem8xdTF3MnNsYjQwMHlndHljIn0.tLfP2eEXpTxfujpzOyhz_A';

// 3D scene (the map) related vars
var map;
var origin = [107, 33, 0];
var GeoData;
var tb;
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var INTERSECTED;
var colors = {
    "Applied computing": "#5687d1",
    "Computer systems organization": "#7b615c",
    "Computing methodologies": "#de783b",
    "General and reference": "#6ab975",
    "Hardware": "#a173d1",
    "Human-centered computing": "#99D0D0",
    "Information systems": "#ffd966",
    "Mathematics of computing": "#aad156",
    "Networks": "#56d1ac",
    "Security and privacy": "#56b4d1",
    "Social and professional topics": "#7356d1",
    "Software and its engineering": "#d15691",
    "Theory of computation": "#d15656"
};

// Tube geometry on the map
var radius = 4000;

// Popup 
var containers = d3.selectAll(".popup p span");
var pop = d3.select(".popup");

// Store the default provinces and year
var selectedProvinces = ["Beijing", "Shanghai", "Jiangsu", "Guangdong", "Gansu", "Yunnan", "Hubei", "Heilongjiang"]
var selectedYears = [2017, 2018, 2019, 2020];
var selectedProvince = "Beijing";
var selectedYear = 2020;
var isLoaded = false;



// Load data
async function init() {

    var request = await fetch("./assets/data/GeoData.json");
    GeoData = await request.json();
    console.log("GeoData", GeoData);

    // Create map and controls
    createMap();
    // Create selectors
    createSelector(GeoData);
    // Draw 3D model in side panel
    create3DModel();
    // Draw sunburst diagram
    createSunburst(GeoData, selectedYear, selectedProvince);
    // Draw bar chart
    createBarChart(GeoData, domain_default, selectedProvince);

    $(".info-map").click(onInfoClick);
    $(".info-legend").click(onLegendClick);
    $(".side-panel-button").click(onPanelClick);
    $("#tip1 .got-it").click(() => {
        $("#tip1").css("display", "none");
        $("#tip2").css("display", "");
    });
    $("#tip2 .got-it").click(() => {
        $("#tip2").css("display", "none");
        $("#tip3").css("display", "");
    });
    $("#tip3 .got-it").click(() => {
        $("#tip3").css("display", "none");
        $("#tip4").css("display", "");
    });
    $("#tip4 .got-it").click(() => {
        $("#tip4").css("display", "none");
    });
    $("#got").click(() => {
        setTimeout(() => {
            $(".info-panel").addClass("animate");
            $(".content").css("display", "none");
            $("#tip1").css("display", "");
        }, 0);
    });
}
init();

// Create map
function createMap() {
    //create map and controls
    map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/dark-v10',
        container: 'map',
        center: origin,
        zoom: 4,
        pitch: 45,
        heading: 90
    });
    var scale = new mapboxgl.ScaleControl({
        maxWidth: 100,
        unit: 'metric'
    });
    map.addControl(scale);
    d3.select(".mapboxgl-ctrl-bottom-left").attr("class", "scale-pos");

    var campass = new mapboxgl.NavigationControl({
        showCompass: true
    })
    map.addControl(campass);
    d3.select(".mapboxgl-ctrl-top-right").attr("class", "campass-pos");

    map.getCanvas().style.cursor = "default";
    map.on('style.load', function () {
        isLoaded = true;
        // add STC layer for selected provinces and years
        addMapLayer(GeoData, selectedProvinces, selectedYears);

    });
}

// Add STC layer for selected provinces and years
function addMapLayer(geo_data, provinces, years) {
    map.addLayer({
        id: 'custom_layer',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function (map, mbxContext) {
            tb = new Threebox(
                map,
                mbxContext, {
                    defaultLights: true
                }
            );
            createBaseMap(GeoData);
            createSTCs(geo_data, provinces, years);
            document.addEventListener('mousemove', onDocumentMouseMove);
        },
        render: function (gl, matrix) {
            tb.update();
        }
    });
}

// Draw base map
function createBaseMap(geo_data) {
    
    var map = new THREE.Object3D();
    var projection = d3.geo.mercator().center([origin[0], origin[1]]).scale(162000).translate([0, 0]);

    // 3D settings
    var extrudeSettings = {
        depth: 100,
        bevelEnabled: false,
    };
    var lineMaterial = new THREE.LineBasicMaterial({
        color: "#FFF",
        linewidth: 1
    });

    // keep track of rendered objects, used to color the objects
    var totalValues = [];

    for (var i = 0; i < geo_data.features.length; i++) {

        // to determine the color later on
        var value = 0;

        value = geo_data.features[i].properties.totalPaper;
        totalValues.push(value);
    }

    for (var i = 0; i < geo_data.features.length; i++) {

        var feature = geo_data.features[i];

        // create material color based on totalValues
        var materialColor = setColor(totalValues[i]);
        var material = new THREE.MeshPhongMaterial({
            color: materialColor,
            transparent: true,
            opacity: 0.4
        });

        var province = new THREE.Object3D();
        var coors = feature["geometry"]["coordinates"];
        coors.forEach((multipolygon) => {

            multipolygon.forEach((polygon) => {

                var shape = new THREE.Shape();

                var lineGeometry = new THREE.BufferGeometry();
                var line_vertices = [];

                for (var j = 0; j < polygon.length; j++) {
                    var [x, y] = projection(polygon[j]);
                    if (j === 0) shape.moveTo(x, -y);
                    shape.lineTo(x, -y);
                    line_vertices.push(new THREE.Vector3(x, -y, 100));
                }

                lineGeometry.setFromPoints(line_vertices);

                var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                var mesh = new THREE.Mesh(geometry, material);
                province.add(mesh);

                var line = new THREE.Line(lineGeometry, lineMaterial);
                province.add(line);
            });
        });

        map.add(province);

    }

    map.rotation.x = Math.PI;
    map.rotation.y = Math.PI;

    map = tb.Object3D({
            obj: map
        })
        .setCoords(origin)

    tb.add(map)
}

// Draw STCs on the map, according to the selected provinces
function createSTCs(geo_data, provinces, years) {
    while (years.length > 0) {
        var year = years.pop();
        for (var i = 0; i < provinces.length; i++) {
            // get arr_paper accords to each selected province
            for (var j = 0; j < geo_data.features.length; j++) {
                if (provinces[i] != geo_data.features[j].properties.name) continue;
                else {
                    var province_code = geo_data.features[j].properties.adcode;
                    var arr_paper = geo_data.features[j].properties.paper;

                    // create stacking 3D tubes for each province
                    for (var k = 0; k < arr_paper.length; k++) {
                        if (year != arr_paper[k].year) continue;
                        else {
                            create3DTubes(arr_paper[k].json, year, geo_data.features[j].properties.centroid, provinces[i], province_code);
                        }
                    }
                }
            }
        }
    }
}

// Draw 3D tubes
function create3DTubes(json, year, center, province, province_code) {
    var totalValue = 0;
    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function (d) {
            return d.size;
        });

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition.nodes(json)
        .filter(function (d) {
            return (d.dx > 0.01);
        });

    totalValue = nodes[0].value;

    for (var i = 1; i < nodes.length; i++) {
        var d = nodes[i];
        var arcPath = new THREE.Path();
        var arcRadius = 0;
        if (d.depth != 2) {
            arcRadius = Math.sqrt(d.y / 2 + d.dy / 2);
        } else if (d.depth == 2) {
            arcRadius = (Math.sqrt(d.y / 2) + Math.sqrt(d.y / 2 + d.dy / 2 * (1 + (d.value / d.parent.value)))) / 2;
        }

        arcPath.arc(0, 0, arcRadius, d.x, d.x + d.dx, false);
        var points = arcPath.getSpacedPoints(8);

        var pointsVec = [];
        points.forEach(e => {
            pointsVec.push(new THREE.Vector3(
                e.x,
                e.y,
                (year - 2016) * 3000
            ))
        });
        var path = new THREE.CatmullRomCurve3(pointsVec)

        var arcColor = '';
        if (d.parent && d.parent.name == "root")
            arcColor = colors[d.name];
        else if (d.parent && d.parent.name != "root")
            arcColor = colors[d.parent.name];

        var percent = (100 * d.value / totalValue).toPrecision(3);

        var r = 0;
        if (d.depth != 2) {
            r = (Math.sqrt(d.y / 2 + d.dy / 2) - Math.sqrt(d.y / 2)) / 2;
        } else if (d.depth == 2) {
            r = (Math.sqrt(d.y + d.dy / 2 * (1 + (d.value / d.parent.value))) - Math.sqrt(d.y / 2 + d.dy / 2)) / 2;
        }

        //TubeGeometry(path : Curve, 
        //	tubularSegments : Integer, 
        //	radius : Float, 
        //	radialSegments : Integer, 
        //	closed : Boolean)
        var geometry = new THREE.TubeGeometry(path, 10, r, 16, false);
        var material = [
            new THREE.MeshPhongMaterial({
                color: arcColor,
                side: THREE.DoubleSide
            })
        ];
        var mesh = new THREE.Mesh(geometry, material);

        mesh = tb.Object3D({
                obj: mesh
            })
            .setCoords(center)

        mesh.data = {
            province: province,
            year: year,
            name: d.name,
            size: d.value,
            percent: percent,
            province_code: province_code
        };
        tb.add(mesh)
    }
}

// Draw the legend
function drawLegend() {
    // Dimensions of legend item: width, height, spacing, radius of rounded rect.
    var li = {
        w: 200,
        h: 20,
        s: 3,
        r: 0
    };

    var legend = d3.select("#ring-color").append("svg:svg")
        .attr("width", li.w)
        .attr("height", d3.keys(colors).length * (li.h + li.s));

    var g = legend.selectAll("g")
        .data(d3.entries(colors))
        .enter().append("svg:g")
        .attr("transform", function (d, i) {
            return "translate(0," + i * (li.h + li.s) + ")";
        });

    g.append("svg:rect")
        .attr("rx", li.r)
        .attr("ry", li.r)
        .attr("width", li.h)
        .attr("height", li.h)
        .style("fill", function (d) {
            return d.value;
        });

    g.append("svg:text")
        .attr("x", li.h + 5)
        .attr("y", li.h / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "left")
        .attr("fill", "#fff")
        .text(function (d) {
            return d.key;
        });
}


//////////////////////////////////////////////////
// Interactions
//////////////////////////////////////////////////

// Create selectors
function createSelector(GeoData) {

    var sMap = document.getElementById('selectProvinceMap');
    var s = document.getElementById('selectProvince');
    var featuresP = GeoData.features;
    featuresP.pop();

    featuresP.forEach(function (element, key) {
        var text = element.properties.name;
        var value = element.properties.adcode;
        sMap[key] = new Option(text, value);
        s[key] = new Option(text, value);
        $('#selectProvinceMap').append(sMap[key]).trigger('change');
        $('#selectProvince').append(s[key]).trigger('change');
    });


    $('#selectProvinceMap').multipleSelect({
        placeholder: 'Select Province(s) to display on Map',
        selectAll: false,
        // single:true,
        multiple: true,
        width: 250,
        dropWidth: 250,
        maxHeight: 500,
        maxHeightUnit: 'px',
        displayValues: false,
        filter: true,
        filterAcceptOnEnter: true,
        showClear: true,

        onClick: function () {
            // First to delete the existed layer
            map.removeLayer("custom_layer");

            // Then add a new layer
            selectedProvinces = $('#selectProvinceMap').multipleSelect('getSelects', 'text');
            selectedYears = $('#selectYearMap').multipleSelect('getSelects', 'text');
            addMapLayer(GeoData, selectedProvinces, selectedYears);

        },
        onCheckAll: function () {
            if (isLoaded) {
                // First to delete the existed layer
                map.removeLayer("custom_layer");

                // Then add a new layer
                selectedProvinces = $('#selectProvinceMap').multipleSelect('getSelects', 'text');
                selectedYears = $('#selectYearMap').multipleSelect('getSelects', 'text');
                addMapLayer(GeoData, selectedProvinces, selectedYears);
            }
        },
        onUncheckAll: function () {
            // First to delete the existed layer
            map.removeLayer("custom_layer");

            // Then add a new layer
            addMapLayer(GeoData, "", "");
        }
    });

    // Set the default value
    $('#selectProvinceMap').multipleSelect('setSelects', [11, 23, 31, 32, 42, 44, 53, 62]);

    // Select year for sunburst diagram, province has been selected already
    $('#selectYearMap').multipleSelect({
        placeholder: 'Select Year(s) to display on Map',
        selectAll: true,
        multiple: true,
        width: 250,
        dropWidth: 250,
        maxHeight: 500,
        maxHeightUnit: 'px',
        displayValues: true,
        showClear: true,

        onClick: function () {
            // First to delete the existed layer
            map.removeLayer("custom_layer");

            // Then add a new layer
            selectedProvinces = $('#selectProvinceMap').multipleSelect('getSelects', 'text');
            selectedYears = $('#selectYearMap').multipleSelect('getSelects', 'text');
            addMapLayer(GeoData, selectedProvinces, selectedYears);
        },
        onCheckAll: function () {
            if (isLoaded) {
                // First to delete the existed layer
                map.removeLayer("custom_layer");

                // Then add a new layer
                selectedProvinces = $('#selectProvinceMap').multipleSelect('getSelects', 'text');
                addMapLayer(GeoData, selectedProvinces, [2017, 2018, 2019, 2020]);
            }
        },
        onUncheckAll: function () {
            // First to delete the existed layer
            map.removeLayer("custom_layer");

            // Then add a new layer
            addMapLayer(GeoData, "", "");
        }
    });

    // Set the default value
    $('#selectYearMap').multipleSelect('setSelects', [2017, 2018, 2019, 2020]);


    $('#selectProvince').multipleSelect({
        placeholder: 'Select a Province',
        single: true,
        width: 250,
        dropWidth: 250,
        maxHeight: 250,
        maxHeightUnit: 'px',
        displayValues: false,

        onClick: function () {
            // First to delete the existed group
            disposeObject(group);
            sceneModel.remove(group);

            // Then add a new group
            selectedProvince = $('#selectProvince').multipleSelect('getSelects', 'text');
            addGeoObject(GeoData, selectedProvince[0]);


            // Change sunburst accordingly
            // First to delete the existed SVGs
            d3.select("#sequence").select("svg").remove();
            d3.select("#chart").select("svg").remove();
            d3.select("#ring-color").select("svg").remove();
            d3.select("#explanation")
                .style("visibility", "hidden");

            // Then add new SVGs
            selectedYear = parseInt($('#selectYear').multipleSelect('getSelects', 'text'));
            $("#sun-prov").html("Province :");
            createSunburst(GeoData, selectedYear, selectedProvince);

            // Change bar chart accordingly
            $("#bar-prov").html("Province :");
            createBarChart(GeoData, domain_default, selectedProvince);
        },

    });

    // Set the default value, Beijing
    $('#selectProvince').multipleSelect('setSelects', [11]);

    // Select year for sunburst diagram, province has been selected already
    $('#selectYear').multipleSelect({
        placeholder: 'Select Year',
        single: true,
        width: 120,
        dropWidth: 120,
        maxHeight: 250,
        maxHeightUnit: 'px',
        displayValues: true,

        onClick: function () {
            // First to delete the existed SVGs
            d3.select("#sequence").select("svg").remove();
            d3.select("#chart").select("svg").remove();
            d3.select("#ring-color").select("svg").remove();
            d3.select("#explanation")
                .style("visibility", "hidden");

            // Then add new SVGs
            selectedYear = parseInt($('#selectYear').multipleSelect('getSelects', 'text'));
            selectedProvince = $('#selectProvince').multipleSelect('getSelects', 'text');
            $("#sun-prov").html("Province :");
            createSunburst(GeoData, selectedYear, selectedProvince);
        }
    });

    // Set the default value, 2020
    $('#selectYear').multipleSelect('setSelects', [2020]);

}

// Get the intersected 3D object in the map
function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, tb.camera);
    var intersects = raycaster.intersectObjects(tb.scene.children[0].children);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) INTERSECTED.material[0].color.setHex(INTERSECTED.currentHex);
            INTERSECTED = intersects[0].object;
            popup(INTERSECTED, event.clientX, event.clientY);
            INTERSECTED.currentHex = INTERSECTED.material[0].color.getHex();
            INTERSECTED.material[0].color.setHex(0xFFFF00);
        }
    } else {
        pop.style("display", 'none');
        if (INTERSECTED) INTERSECTED.material[0].color.setHex(INTERSECTED.currentHex);
        INTERSECTED = null;
    }
    map.triggerRepaint();
}

// Show the popup in the map
function popup(obj, x, y) {
    var data = obj.data;
    containers[0][0].innerHTML = data.province;
    containers[0][1].innerHTML = data.year;
    containers[0][2].innerHTML = data.name;
    containers[0][3].innerHTML = data.size;
    containers[0][4].innerHTML = data.percent + "%";

    pop.style('display', 'block');
    pop.style('left', x + 10 + 'px');
    pop.style('top', y + 10 + "px");

    // Change 3D viewer accordingly
    // First to delete the existed group
    disposeObject(group);
    sceneModel.remove(group);
    // Then change selector and add new SVGs
    $('#selectProvince').multipleSelect('setSelects', [data.province_code]);
    addGeoObject(GeoData, data.province);

    // Change sunburst graph accordingly
    // First to delete the existed SVGs
    d3.select("#sequence").select("svg").remove();
    d3.select("#chart").select("svg").remove();
    d3.select("#ring-color").select("svg").remove();
    d3.select("#explanation")
        .style("visibility", "hidden");

    // Then change selector and add new SVGs
    $('#selectYear').multipleSelect('setSelects', [data.year]);
    $("#sun-prov").html("Province :");
    createSunburst(GeoData, data.year, data.province);

    // Change bar chart accordingly
    $("#bar-prov").html("Province :");
    createBarChart(GeoData, data.name, data.province);

}

// Toggle information popup
function onInfoClick() {
    if ($(".info-panel").css("display") == "none") {
        $(".info-panel").css("display", "block");
    } else {
        if ($(".info-panel").hasClass("animate")) {
            setTimeout(() => {
                $(".info-panel").removeClass("animate");
                $(".content").css("display", "");
            }, 0);
        } else {
            setTimeout(() => {
                $(".info-panel").addClass("animate");
                $(".content").css("display", "none");
            }, 0);
        }
    }
}

// Toggle legend
function onLegendClick() {
    if ($(".legend").css("display") == "none") {
        $(".legend").slideDown();
        $("#legend-img").attr('src', 'assets/img/up.png');
    } else {
        $(".legend").slideUp();
        $("#legend-img").attr('src', 'assets/img/legend.png');
    }
}

// Toggle left panel
function onPanelClick() {
    if ($(".side-panel-container").css("display") == "none") {
        $(".side-panel-container").css("display", "block");
    } else {
        if ($(".side-panel-container").hasClass("slideLeft")) {
            setTimeout(() => {
                $(".side-panel-container").removeClass("slideLeft");
                $(".button-container").removeClass("slideLeft");
                $("#side-panel-img").attr('src', 'assets/img/left.png');
                $(".panel-content").css("display", "");
            }, 0);
        } else {
            setTimeout(() => {
                $(".side-panel-container").addClass("slideLeft");
                $(".button-container").addClass("slideLeft");
                $("#side-panel-img").attr('src', 'assets/img/right.png');
                $(".panel-content").css("display", "none");
            }, 0);
        }
    }
}

//////////////////////////////////////////////////
// 3D Model Viewer
//////////////////////////////////////////////////
var sceneModel, renderer, camera, controls, INTERSECTED_M;
var group;

// Popup in model related vars
var containers_M = d3.selectAll(".pop-up p span");
var pop_M = d3.select(".pop-up");

// Show the pop-up
function popupModel(obj, x, y) {
    var data = obj.data;
    containers_M[0][0].innerHTML = data.province;
    containers_M[0][1].innerHTML = data.year;
    containers_M[0][2].innerHTML = data.name;
    containers_M[0][3].innerHTML = data.size;
    containers_M[0][4].innerHTML = data.percent + "%";

    pop_M.style('display', 'block');
    pop_M.style('left', x + 10 + 'px');
    pop_M.style('top', y + 10 + "px");

    // Change sunburst graph accordingly
    // First to delete the existed SVGs
    d3.select("#sequence").select("svg").remove();
    d3.select("#chart").select("svg").remove();
    d3.select("#ring-color").select("svg").remove();
    d3.select("#explanation")
        .style("visibility", "hidden");
    // Then change selector and add new SVGs
    $('#selectYear').multipleSelect('setSelects', [data.year]);
    $("#sun-prov").html("Province :");
    createSunburst(GeoData, data.year, data.province);

    // Change bar chart accordingly
    $("#bar-prov").html("Province :");
    createBarChart(GeoData, data.name, data.province);
}

// Get the intersected 3D object in the 3D model viewer
function onModelMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1 + 0.8;
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(sceneModel.children[2].children);
    if (intersects.length > 0) {
        if (INTERSECTED_M != intersects[0].object) {
            if (INTERSECTED_M) INTERSECTED_M.material[0].color.setHex(INTERSECTED_M.currentHex);
            INTERSECTED_M = intersects[0].object;
            popupModel(INTERSECTED_M, event.clientX, event.clientY);
            INTERSECTED_M.currentHex = INTERSECTED_M.material[0].color.getHex();
            INTERSECTED_M.material[0].color.setHex(0xFFFF00);
        }
    } else {
        pop_M.style("display", 'none');
        if (INTERSECTED_M) INTERSECTED_M.material[0].color.setHex(INTERSECTED_M.currentHex);
        INTERSECTED_M = null;
    }
}

// Create the model in the viewer
function create3DModel() {
    // set the scene size
    var WIDTH = 450,
        HEIGHT = 280;

    // set some camera attributes
    var VIEW_ANGLE = 45,
        ASPECT = WIDTH / HEIGHT,
        NEAR = 0.1,
        FAR = 1000;

    // create a WebGL renderer, camera, and a scene
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true
    });
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

    sceneModel = new THREE.Scene();

    // add and position the camera at a fixed position
    sceneModel.add(camera);

    // start the renderer, and black background
    renderer.setSize(WIDTH, HEIGHT);
    renderer.setClearAlpha(0.0)

    // add the render target to the page
    document.querySelector("#model").append(renderer.domElement);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    // controls = new THREE.TrackballControls(camera, renderer.domElement);

    camera.position.y = 90;

    document.querySelector("#model").addEventListener('mousemove', onModelMouseMove);


    // add a light at a specific position
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    sceneModel.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.9);
    camera.add(pointLight);

    group = new THREE.Group();

    // Set default, Beijing
    addGeoObject(GeoData, selectedProvince);

    requestAnimationFrame(animate);
    controls.update();
}

// Rotate automatically 
function animate(timer) {
    timer *= 0.0002;
    if (timer <= 2 * Math.PI) {
        camera.position.x = (Math.cos(timer) * 120);
        camera.position.z = (Math.sin(timer) * 120);
    }
    camera.lookAt(sceneModel.position);
    renderer.render(sceneModel, camera);
    requestAnimationFrame(animate);
    controls.update();
}

// Draw the model according to the selected province
function addGeoObject(geo_data, province) {
    group = new THREE.Group();

    var radius = 40;
    var totalValue = 0;

    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function (d) {
            return d.size;
        });

    // To store data in this function
    var year, json;

    // Get json
    for (var i = 0; i < geo_data.features.length; i++) {
        if (province != geo_data.features[i].properties.name) continue;
        else {
            var province_code = geo_data.features[i].properties.adcode;
            var paper_arr = geo_data.features[i].properties.paper;

            for (var j = 0; j < paper_arr.length; j++) {
                year = paper_arr[j].year;
                json = paper_arr[j].json;

                // For efficiency, filter nodes to keep only those large enough to see.
                var nodes = partition.nodes(json)
                    .filter(function (d) {
                        return (d.dx > 0.01); 
                    });

                totalValue = nodes[0].value;

                for (var k = 1; k < nodes.length; k++) {
                    var d = nodes[k];
                    var arcPath = new THREE.Path();
                    var arcRadius = 0;
                    if (d.depth != 2) {
                        arcRadius = Math.sqrt(d.y / 2 + d.dy / 2);
                    } else if (d.depth == 2) {
                        arcRadius = (Math.sqrt(d.y / 2) + Math.sqrt(d.y / 2 + d.dy / 2 * (1 + (d.value / d.parent.value)))) / 2;
                    }

                    arcPath.arc(0, 0, arcRadius, d.x, d.x + d.dx, false);
                    var points = arcPath.getSpacedPoints(8);

                    var pointsVec = [];
                    points.forEach(e => {
                        pointsVec.push(new THREE.Vector3(
                            e.x,
                            e.y,
                            (year - 2016) * 20
                        ))
                    });
                    var path = new THREE.CatmullRomCurve3(pointsVec)

                    var arcColor = '';
                    if (d.parent && d.parent.name == "root")
                        arcColor = colors[d.name];
                    else if (d.parent && d.parent.name != "root")
                        arcColor = colors[d.parent.name];

                    var percent = (100 * d.value / totalValue).toPrecision(3);

                    var r = 0;
                    if (d.depth != 2) {
                        r = (Math.sqrt(d.y / 2 + d.dy / 2) - Math.sqrt(d.y / 2)) / 2;
                    } else if (d.depth == 2) {
                        r = (Math.sqrt(d.y + d.dy / 2 * (1 + (d.value / d.parent.value))) - Math.sqrt(d.y / 2 + d.dy / 2)) / 2;
                    }

                    var geometry = new THREE.TubeGeometry(path, 10, r, 16, false);
                    var material = [
                        new THREE.MeshPhongMaterial({
                            color: arcColor,
                            side: THREE.DoubleSide
                        })
                    ];
                    var mesh = new THREE.Mesh(geometry, material);
                    mesh.rotation.x = -Math.PI / 2;
                    mesh.rotation.z = -Math.PI / 2;
                    mesh.translateZ(-40);
                    mesh.data = {
                        province: province,
                        year: year,
                        name: d.name,
                        size: d.value,
                        percent: percent,
                        province_code: province_code
                    };
                    group.add(mesh);
                }
            }
        }
    }
    sceneModel.add(group);
}

//////////////////////////////////////////////////
// 2D Graphs - Sunbrust
//////////////////////////////////////////////////

// Dimensions of sunburst.
var width_2d = 280;
var height_2d = 240;
var radius_2d = Math.min(width_2d, height_2d) / 2;

// Breadcrumb dimensions: width, height, spacing, width of tip/tail.
var b = {
    w: 220,
    h: 30,
    s: 3,
    t: 20
};

// Create sunburst diagram
function createSunburst(geo_data, year, province) {
    $("#sun-prov").html("Province : &nbsp;&nbsp;&nbsp;&nbsp;" + province);

    var totalValue = 0;
    drawLegend();
    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius_2d * radius_2d])
        .value(function (d) {
            return d.size;
        });

    var arc = d3.svg.arc()
        .startAngle(function (d) {
            return -d.x - Math.PI / 2;
        })
        .endAngle(function (d) {
            return -(d.x + d.dx) - Math.PI / 2;
        })
        .innerRadius(function (d) {
            return Math.sqrt(d.y / 2);
        })
        .outerRadius(function (d) {
            if (d.depth != 2) {
                return Math.sqrt(d.y / 2 + d.dy / 2);
            } else if (d.depth == 2) {
                return Math.sqrt(d.y / 2 + d.dy / 2 + d.dy / 2 * (1 + (d.value / d.parent.value)));
            }
        });

    // Initialize breadcrumb trail
    // Add the svg area.
    d3.select("#sequence").append("svg:svg")
        .attr("width", width_2d)
        .attr("height", 100)
        .attr("id", "trail");

    var vis = d3.select("#chart").append("svg:svg")
        .attr("width", width_2d)
        .attr("height", height_2d)
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width_2d / 2 + "," + height_2d / 2 + ")");

    // Bounding circle underneath the sunburst, to make it easier to detect
    // when the mouse leaves the parent g.
    vis.append("svg:circle")
        .attr("r", radius_2d)
        .style("opacity", 0);

    // To store json data in this function
    var json = null;
    var isFound = false;

    // Get json
    if (!isFound) {
        for (var i = 0; i < geo_data.features.length; i++) {
            if (province != geo_data.features[i].properties.name) continue;
            else {
                var paper_arr = geo_data.features[i].properties.paper;
                for (var j = 0; j < paper_arr.length; j++) {
                    if (year != paper_arr[j].year) continue;
                    else {
                        json = paper_arr[j].json;
                        isFound = true;
                        break;
                    }
                }
                if (!isFound) {
                    d3.select("#percentage")
                        .text("No Data");
                    d3.select("#explanation")
                        .style("visibility", "");
                }
            }
            break;
        }
    }

    if (isFound) {
        // For efficiency, filter nodes to keep only those large enough to see.
        var nodes = partition.nodes(json)
            .filter(function (d) {
                return (d.dx > 0.01);
            });

        var path = vis.data([json]).selectAll("path")
            .data(nodes)
            .enter().append("svg:path")
            .attr("display", function (d) {
                return d.depth ? null : "none";
            })
            .attr("d", arc)
            .attr("fill-rule", "evenodd")
            .style("fill", function (d) {
                if (d.parent && d.parent.name == "root")
                    return colors[d.name];
                else if (d.parent && d.parent.name != "root")
                    return colors[d.parent.name];
            })
            .style("opacity", 1)
            .on("mouseover", mouseover);

        // Add the mouseleave handler to the bounding circle.
        d3.select("#container").on("mouseleave", mouseleave);
        // Get total size of the tree = value of root node from partition.
        totalValue = path.node().__data__.value;

    }


    //////////////// helpers in this function ////////////////////
    // Fade all but the current sequence, and show it in the breadcrumb trail.
    function mouseover(d) {

        var percentage = (100 * d.value / totalValue).toPrecision(3);
        var percentageString = percentage + "%";
        if (percentage < 0.1) {
            percentageString = "< 0.1%";
        }

        d3.select("#percentage")
            .text(percentageString);

        d3.select("#explanation")
            .style("visibility", "");

        var sequenceArray = getAncestors(d);
        updateBreadcrumbs(sequenceArray);

        // Fade all the segments.
        d3.selectAll("path")
            .style("opacity", 0.3);

        // Then highlight only those that are an ancestor of the current segment.
        vis.selectAll("path")
            .filter(function (node) {
                return (sequenceArray.indexOf(node) >= 0);
            })
            .style("opacity", 1);

        // Change bar chart accordingly
        selectedProvince = $('#selectProvince').multipleSelect('getSelects', 'text');
        $("#bar-prov").html("Province :");
        createBarChart(GeoData, d.name, selectedProvince);
    }

    // Restore everything to full opacity when moving off the visualization.
    function mouseleave(d) {

        // Hide the breadcrumb trail
        d3.select("#trail")
            .style("visibility", "hidden");

        // Deactivate all segments during transition.
        d3.selectAll("path").on("mouseover", null);

        // Transition each segment to full opacity and then reactivate it.
        d3.selectAll("path")
            .transition()
            .duration(1000)
            .style("opacity", 1)
            .each("end", function () {
                d3.select(this).on("mouseover", mouseover);
            });

        d3.select("#explanation")
            .style("visibility", "hidden");

        // Show the explanation
        $(".sequence-explain").css("visibility", "");
    }

}

// Given a node in a partition layout, return an array of all of its ancestor nodes, highest first, but excluding the root.
function getAncestors(node) {
    var path = [];
    var current = node;
    while (current.parent) {
        path.unshift(current);
        current = current.parent;
    }
    return path;
}

// Generate a string that describes the points of a breadcrumb polygon.
function breadcrumbPoints(d, i) {
    var points = [];
    points.push("0,0");
    points.push(b.w + ",0");
    points.push(b.w + b.t + "," + (b.h / 2));
    points.push(b.w + "," + b.h);
    points.push("0," + b.h);
    if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
    }
    return points.join(" ");
}

// Update the breadcrumb trail to show the current sequence and percentage.
function updateBreadcrumbs(nodeArray) {
    // Data join; key function combines name and depth (= position in sequence).
    var g = d3.select("#trail")
        .selectAll("g")
        .data(nodeArray, function (d) {
            return d.name + d.depth;
        });

    // Add breadcrumb and label for entering nodes.
    var entering = g.enter().append("svg:g");

    entering.append("svg:polygon")
        .attr("points", breadcrumbPoints)
        .style("fill", function (d) {
            if (d.parent && d.parent.name == "root")
                return colors[d.name];
            else if (d.parent && d.parent.name != "root")
                return colors[d.parent.name];
        });

    entering.append("foreignObject")
        .attr("width", b.w)
        .attr("height", b.h)
        .text(function (d) {
            return d.name;
        });

    // Set position for entering and updating nodes.
    g.attr("transform", function (d, i) {
        if (i == 0) return "translate(0, 35)";
        else
            return "translate(20, " + (i * (b.h + b.s) + 35) + ")";
    });

    // Remove exiting nodes.
    g.exit().remove();

    // Hide the explanation
    $(".sequence-explain").css("visibility", "hidden");

    // Make the breadcrumb trail visible, if it's hidden.
    d3.select("#trail")
        .style("visibility", "");


}

//////////////////////////////////////////////////
// 2D Graphs - Bar chart
//////////////////////////////////////////////////

var chartDom = document.getElementById('bar-chart');
var myChart = echarts.init(chartDom, 'dark');
var option;
var domain_default = "Applied computing";

function createBarChart(geo_data, domain, province) {
    $("#bar-prov").html("Province : &nbsp;&nbsp;&nbsp;&nbsp;" + province);

    var barColor;

    // To store data in this function
    var valArr = [{
        year: 2017,
        valObj: null
    }, {
        year: 2018,
        valObj: null
    }, {
        year: 2019,
        valObj: null
    }, {
        year: 2020,
        valObj: null
    }];

    var sizeArr = [];
    var isFound = false;

    // Get json
    if (!isFound) {
        for (var i = 0; i < geo_data.features.length; i++) {
            if (province != geo_data.features[i].properties.name) continue;
            else {
                var paper_arr = geo_data.features[i].properties.paper;
                for (var j = 0; j < paper_arr.length; j++) {
                    if (paper_arr[j].year == 2017) {
                        valArr[0].valObj = paper_arr[j].json.children;
                    } else if (paper_arr[j].year == 2018) {
                        valArr[1].valObj = paper_arr[j].json.children;
                    } else if (paper_arr[j].year == 2019) {
                        valArr[2].valObj = paper_arr[j].json.children;
                    } else if (paper_arr[j].year == 2020) {
                        valArr[3].valObj = paper_arr[j].json.children;
                    }
                }
                isFound = true;
            }
            break;
        }
    }

    // Match selected domain, and store the occurrence frequency
    for (var m = 0; m < valArr.length; m++) {
        if (valArr[m].valObj) {
            var valObj = valArr[m].valObj;
            // mark whether the "domain" has been found
            var flag = false;
            for (var n = 0; n < valObj.length; n++) {
                if (valObj[n].name == domain) {
                    flag = true;
                    sizeArr.push(valObj[n].value)
                    barColor = colors[domain];
                    continue
                } else if (valObj[n].children) {
                    var childObj = valObj[n].children;
                    for (var k = 0; k < childObj.length; k++) {
                        if (childObj[k].name == domain) {
                            flag = true;
                            sizeArr.push(childObj[k].value)
                            barColor = colors[valObj[n].name];
                            continue
                        }
                    }
                }
                // if it comes to the end and has not found yet
                if (n == valObj.length - 1 && flag == false) sizeArr.push(0);
            }
        } else sizeArr.push(0); // For a missing year
    }

    option = {
        title: {
            text: domain,
            x: 'center',
            y: 60,
            textStyle: {
                fontFamily: 'Ubuntu',
                color: '#fff',
                fontSize: 12,
                fontWeight: 100,
                lineHeight: 18,
                width: 200,
                overflow: 'break'
            }
        },
        backgroundColor: '',
        tooltip: {
            trigger: 'item',
            axisPointer: {
                type: 'shadow'
            },
            backgroundColor: 'rgb(41, 50, 60, 0.8)',
            borderWidth: 0,
            textStyle: {
                color: '#fff',
                fontFamily: 'Ubuntu'
            },
            backgroundColor: '#29323c',
            formatter: function (params) {
                return `Occur. Freq.:
                ${Math.abs(params.data)}`;
            }
        },
        grid: {
            top: 130,
            left: 35,
            bottom: 0
        },
        xAxis: {
            type: 'value',
            position: 'top',
            axisLabel: {
                textStyle: {
                    color: '#fff',
                    fontFamily: 'Ubuntu',
                    fontSize: 10
                },
                formatter: function (data) {
                    return Math.abs(data);
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.2)',
                    type: 'dashed'
                }
            }
        },
        yAxis: {
            type: 'category',
            axisLine: {
                show: false
            },
            axisLabel: {
                show: true,
                textStyle: {
                    color: '#fff',
                    fontFamily: 'Ubuntu'
                },
            },
            axisTick: {
                show: false
            },
            splitLine: {
                show: false
            },
            data: ['2017', '2018', '2019', '2020']
        },
        series: [{
            name: 'Occurrence Frequency',
            type: 'bar',
            barWidth: 30,
            stack: 'Total',
            label: {
                show: true,
                position: 'right',
                textStyle: {
                    color: '#fff',
                    fontFamily: 'Ubuntu'
                },
                formatter: '{c}'
            },
            data: sizeArr,
            color: barColor
        }]
    };
    option && myChart.setOption(option, true);
}

//////////////////////////////////////////////////
// Helpers
//////////////////////////////////////////////////

// Set the color for the base map
function setColor(val) {
    if (val >= 0 && val <= 49) {
        return '#4ed8b1'
    } else if (val > 49 && val <= 237) {
        return '#67D075'
    } else if (val > 237 && val <= 395) {
        return '#96C030'
    } else if (val > 395 && val <= 1135) {
        return '#CBA800'
    } else {
        return '#ff7f00'
    }
}

// Delete 3D objects
function disposeObject(parentObject) {
    parentObject.traverse(function (node) {
        if (node instanceof THREE.Mesh) {
            if (node.geometry) {
                node.geometry.dispose();
            }
            if (node.material) {
                var materialArray;
                if (node.material instanceof THREE.MeshFaceMaterial || node.material instanceof THREE.MultiMaterial) {
                    materialArray = node.material.materials;
                } else if (node.material instanceof Array) {
                    materialArray = node.material;
                }
                if (materialArray) {
                    materialArray.forEach(function (mtrl, idx) {
                        if (mtrl.map) mtrl.map.dispose();
                        if (mtrl.lightMap) mtrl.lightMap.dispose();
                        if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                        if (mtrl.normalMap) mtrl.normalMap.dispose();
                        if (mtrl.specularMap) mtrl.specularMap.dispose();
                        if (mtrl.envMap) mtrl.envMap.dispose();
                        mtrl.dispose();
                    });
                } else {
                    if (node.material.map) node.material.map.dispose();
                    if (node.material.lightMap) node.material.lightMap.dispose();
                    if (node.material.bumpMap) node.material.bumpMap.dispose();
                    if (node.material.normalMap) node.material.normalMap.dispose();
                    if (node.material.specularMap) node.material.specularMap.dispose();
                    if (node.material.envMap) node.material.envMap.dispose();
                    node.material.dispose();
                }
            }
        }
    });
}