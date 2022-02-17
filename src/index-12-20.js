// 12.20会后将这一版本暂存
// 不考虑底图的extrude高度，因为在整体的3D vis中，高度代表着年份，最好还是相同的变量表示相同的属性
// 同时，考虑如何减轻浏览器render的workload


import './style.css';
import './libs/d3.v3.min.js';
import './libs/threebox.js';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';


import GeoData from '../dist/assets/china.json';


// Data Processing

const binarySearch = (nums, target, lower) => {
    let left = 0,
        right = nums.length - 1,
        ans = nums.length;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] > target || (lower && nums[mid] >= target)) {
            right = mid - 1;
            ans = mid;
        } else {
            left = mid + 1;
        }
    }
    return ans;
}

const searchRange = function (nums, target) {
    let ans = [-1, -1];
    const leftIdx = binarySearch(nums, target, true);
    const rightIdx = binarySearch(nums, target, false) - 1;
    if (leftIdx <= rightIdx && rightIdx < nums.length && nums[leftIdx] === target && nums[rightIdx] === target) {
        ans = [leftIdx, rightIdx];
    }
    return ans;
};

function readFile() {
    d3.text("./assets/data/domain_2017.csv", function (text) {
        var csvD_17 = d3.csv.parseRows(text);
        
        var arrP_17 = csvD_17.map(function (d) {
            return parseInt(d[2])
        });
       
        d3.text("./assets/data/total_2017.csv", function (text) {
            var csv = d3.csv.parseRows(text);
            
            for (var i = 1; i < csv.length; i++) { // length = 35

                for (var j = 0; j < GeoData.features.length - 1; j++) { // length = 35

                    if (parseInt(csv[i][0]) == parseInt(GeoData.features[j].properties.adcode) / 10000) {

                        GeoData.features[j].properties.name = csv[i][2];

                        var range = searchRange(arrP_17, parseInt(csv[i][0])); // Find search range for each province

                        var csvD_province = csvD_17.slice(range[0], range[1] + 1);
                        var json = buildHierarchy(csvD_province);

                        GeoData.features[j].properties.paper = [{
                            "year": 2017,
                            "total": parseInt(csv[i][1]),
                            "json": json
                        }];
                    }
                }
            }
        });
    });


    d3.text("./assets/data/domain_2018.csv", function (text) {
        var csvD_18 = d3.csv.parseRows(text);

        var arrP_18 = csvD_18.map(function (d) {
            return parseInt(d[2])
        });

        d3.text("./assets/data/total_2018.csv", function (text) {
            var csv = d3.csv.parseRows(text);

            for (var i = 1; i < csv.length; i++) { // length = 35

                for (var j = 0; j < GeoData.features.length - 1; j++) { // length = 35

                    if (parseInt(csv[i][0]) == parseInt(GeoData.features[j].properties.adcode) / 10000) {

                        GeoData.features[j].properties.name = csv[i][2];

                        var range = searchRange(arrP_18, parseInt(csv[i][0])); // Find search range for each province

                        var csvD_province = csvD_18.slice(range[0], range[1] + 1);
                        var json = buildHierarchy(csvD_province);

                        GeoData.features[j].properties.paper.push({
                            "year": 2018,
                            "total": parseInt(csv[i][1]),
                            "json": json
                        })
                    }
                }
            }
        });
    });


    d3.text("./assets/data/domain_2019.csv", function (text) {
        var csvD_19 = d3.csv.parseRows(text);

        var arrP_19 = csvD_19.map(function (d) {
            return parseInt(d[2])
        });

        d3.text("./assets/data/total_2019.csv", function (text) {
            var csv = d3.csv.parseRows(text);

            for (var i = 1; i < csv.length; i++) { // length = 35

                for (var j = 0; j < GeoData.features.length - 1; j++) { // length = 35

                    if (parseInt(csv[i][0]) == parseInt(GeoData.features[j].properties.adcode) / 10000) {

                        GeoData.features[j].properties.name = csv[i][2];

                        var range = searchRange(arrP_19, parseInt(csv[i][0])); // Find search range for each province

                        var csvD_province = csvD_19.slice(range[0], range[1] + 1);
                        var json = buildHierarchy(csvD_province);

                        GeoData.features[j].properties.paper.push({
                            "year": 2019,
                            "total": parseInt(csv[i][1]),
                            "json": json
                        })
                    }
                }
            }
        });
    });


    d3.text("./assets/data/domain_2020.csv", function (text) {
        var csvD_20 = d3.csv.parseRows(text);

        var arrP_20 = csvD_20.map(function (d) {
            return parseInt(d[2])
        });

        d3.text("./assets/data/total_2020.csv", function (text) {
            var csv = d3.csv.parseRows(text);

            for (var i = 1; i < csv.length; i++) { // length = 35

                for (var j = 0; j < GeoData.features.length - 1; j++) { // length = 35

                    if (parseInt(csv[i][0]) == parseInt(GeoData.features[j].properties.adcode) / 10000) {

                        GeoData.features[j].properties.name = csv[i][2];

                        var range = searchRange(arrP_20, parseInt(csv[i][0])); // Find search range for each province

                        var csvD_province = csvD_20.slice(range[0], range[1] + 1);
                        var json = buildHierarchy(csvD_province);

                        GeoData.features[j].properties.paper.push({
                            year: 2020,
                            total: parseInt(csv[i][1]),
                            json: json
                        })
                    }
                }
            }
        });
    });

    setTimeout(() => {
        for (var j = 0; j < GeoData.features.length - 1; j++) {
            var arr = GeoData.features[j].properties.paper;

            var count = 0;
            for (var k = 0; k < arr.length; k++) {
                count += arr[k].total;
            }
            GeoData.features[j].properties.totalPaper = count;
            GeoData.features[j].properties.adcode = parseInt(GeoData.features[j].properties.adcode) / 10000;
        }
    }, 500);


}

// readFile();

var button = document.getElementById("export");
button.addEventListener("click", saveHandler, false);

function saveHandler() {
    var content = JSON.stringify(GeoData);
    var blob = new Blob([content], {
        type: "text/plain;charset=utf-8"
    });
    saveAs(blob, "save.json");
}
































// Public Token
mapboxgl.accessToken = 'pk.eyJ1IjoiZ2FvbWVuZ3lhbyIsImEiOiJja2lxZjhiem8xdTF3MnNsYjQwMHlndHljIn0.tLfP2eEXpTxfujpzOyhz_A';

// 3D scene related vars
var map;
var tb;
const mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();;
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

// Store the selected provinces and year
// var selectedProvinces = [11,12,13,14,15,21,22,23,31,32,33,34,35,36,37,41,42,43,44,45,46,50,51,52,53,54,61,62,63,64,65,71,81,82];
var selectedProvinces = [11,12,13,14,15,21,22,23];
var selectedYear = 2017; 

// Popup related vars
let containers = d3.selectAll("#popup p span");
// let cate = d3.select("#popup p");
let pop = d3.select("#popup");

// Map origin
var origin = [108, 34, 0];

// Tube Geometry attributes
var radius = 4500;
var totalSize = 0;

// About Module Callbacks
d3.select("#about-map-button").on("click", function () {
    d3.select("#about").style("display", "none");
});

d3.select("#about-close").on("click", function () {
    d3.select("#about").style("display", "none");
});

d3.select("#about").on("click", function () {
    d3.select("#about").style("display", "none");
});

d3.select("#about-link").on("click", function () {
    d3.select("#about").style("display", "block");
});

d3.select(".coverpage a").on("click", function () {
    d3.select(".coverpage").style("display", "none");
})

//Load data function
function init() {
    // const request = await fetch("./assets/basemap.json");
    // const data = await request.json();
    // positions = data.data;
    // fileterCatogeries = JSON.parse(JSON.stringify(positions));
    createMap();
}

setTimeout(()=>{
    init();
    console.log(GeoData);
}, 1000);

function createMap() {
    //Create map and controls
    map = new mapboxgl.Map({
        style: 'mapbox://styles/mapbox/dark-v10',
        container: 'map',
        center: origin,
        zoom: 4,
        pitch: 30,
        heading: 60
    });
    var scale = new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: 'imperial'
    });
    map.addControl(scale);
    var campass = new mapboxgl.NavigationControl({
        showCompass: true
    })
    map.addControl(campass);
    d3.select(".mapboxgl-ctrl-top-right").attr("class", "campass-pos");
    scale.setUnit('metric');
    map.getCanvas().style.cursor = "default";
    map.on('style.load', function () {
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
                createVisualization();
                document.addEventListener('mousemove', onDocumentMouseMove);
            },
            render: function (gl, matrix) {
                tb.update();
            }
        });
    });
}

function gradient(length, maxLength) {

    var i = (length * 255 / maxLength);
    // var r = i;
    // var g = 255 - (i);
    // var b = 0;
    var r = i;
    var g = 255 - (0.5 * i);
    var b = 255 - (i);

    var rgb = b | (g << 8) | (r << 16);
    return rgb;
}

function initGeoData(geo_data, selectedYear) {
    let map = new THREE.Object3D();
    const projection = d3.geo.mercator().center([origin[0], origin[1]]).scale(162000).translate([0, 0]);

    // keep track of rendered objects
    var annualValues = [];
    var totalValues = [];

    // keep track of min and max, used to color the objects
    var maxValueAnnual = 0;
    var minValueAnnual = -1;

    // keep track of max and min of total value, used to determine heights
    var maxValueTotal = 0;
    var minValueTotal = -1;


    for (var i = 0; i < geo_data.features.length-1; i++) {

        // to determine the color later on
        var value = 0;
        var feature = geo_data.features[i];
        var paper_arr = feature.properties.paper;

        paper_arr.forEach((obj) => {
            if (obj.year == selectedYear)
                value = obj.total;
        })
        
        
        if (value > maxValueAnnual) maxValueAnnual = value;
        if (value < minValueAnnual || minValueAnnual == -1) minValueAnnual = value;

        annualValues.push(value);

        // to determine height later on
        value = parseInt(feature.properties.totalPaper);
        if (value > maxValueTotal) maxValueTotal = value;
        if (value < minValueTotal || minValueTotal == -1) minValueTotal = value;

        totalValues.push(value);

    }

    for (var i = 0; i < geo_data.features.length; i++) {

        var feature = geo_data.features[i];

        // create material color based on annualValues
        var scale = ((annualValues[i] - minValueAnnual) / (maxValueAnnual - minValueAnnual)) * 255;
        var mathColor = gradient(Math.round(scale), 255);
        var material = new THREE.MeshPhongMaterial({
            color: mathColor,
            transparent: true,
            opacity: 0.6
        });

        // create extrude based on totalValues
        var extrude = ((totalValues[i] - minValueTotal) / (maxValueTotal - minValueTotal)) * 10000;
        GeoData.features[i].properties.extrude = extrude; // store "extrude" into GeoData

        var extrudeSettings = {
            depth: extrude,
            bevelEnabled: false,
        };

        var lineMaterial = new THREE.LineBasicMaterial({
            color: "#FFF",
            linewidth: 1
        });

        const province = new THREE.Object3D();
        const coors = feature["geometry"]["coordinates"];
        coors.forEach((multipolygon) => {

            multipolygon.forEach((polygon) => {

                const shape = new THREE.Shape();

                const lineGeometry = new THREE.BufferGeometry();
                let line_vertices = [];

                for (let j = 0; j < polygon.length; j++) {
                    const [x, y] = projection(polygon[j]);
                    if (j === 0) shape.moveTo(x, -y);
                    shape.lineTo(x, -y);
                    line_vertices.push(new THREE.Vector3(x, -y, extrude));
                }

                lineGeometry.setFromPoints(line_vertices);

                const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

                const mesh = new THREE.Mesh(geometry, material);
                province.add(mesh);

                const line = new THREE.Line(lineGeometry, lineMaterial);
                province.add(line);
            });
        });

        province.properties = feature.properties;
        if (feature.properties.center) {
            const [x, y] = projection(feature.properties.center);
            province.properties.center = [x, y];
        }
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


//Get the intersected 3D object
function onDocumentMouseMove(event) {

    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, tb.camera);

    const intersects = raycaster.intersectObjects(tb.scene.children[0].children);

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


//Show the popup
function popup(obj, x, y) {
    let data = obj.data;

    containers[0][0].innerHTML = data.province;
    containers[0][1].innerHTML = data.year;
    containers[0][2].innerHTML = data.name;
    containers[0][3].innerHTML = data.size;
    containers[0][4].innerHTML = data.percent + "%";

    // cate.html(data.category);
    pop.style('display', 'block');
    pop.style('left', x + 10 + 'px');
    pop.style('top', y + 10 + "px");
}

function createVisualization() {
    initGeoData(GeoData, selectedYear);
    createSTCs(GeoData, selectedProvinces);
}


//??????????????????????????????????????????????
function createSTCs(geo_data, selectedProvinces) {
    console.log("createSTCs",geo_data);
    for (var i = 0; i < selectedProvinces.length; i++) {

        var arr_paper = geo_data.features[i].properties.paper;
        
        for(var j = 0; j < arr_paper.length; j++) {
            console.log(arr_paper[j].json, arr_paper[j].year, geo_data.features[i].properties.centroid, geo_data.features[i].properties.extrude, geo_data.features[i].properties.name);
            create3DTubes(arr_paper[j].json, arr_paper[j].year, geo_data.features[i].properties.centroid, geo_data.features[i].properties.extrude, geo_data.features[i].properties.name);
        }

    }

}

function create3DTubes(json, year, center, extrude, province) {
    console.log("create3DTubes");
    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .sort(null)
        .value(function (d) {
            return d.size;
        });

    // For efficiency, filter nodes to keep only those large enough to see.
    var nodes = partition.nodes(json)
        .filter(function (d) {
            return (d.dx > 0.005); // 0.005 radians = 0.29 degrees
        });

    totalSize = nodes[0].value;

    for (var i = 1; i < nodes.length; i++) {
        var d = nodes[i];
        var arcPath = new THREE.Path();
        var arcRadius = 0;
        if (d.depth != 2) {
            arcRadius = (Math.sqrt(d.y / 2) + Math.sqrt(d.y / 2 + d.dy / 2)) / 2;
        } else if (d.depth == 2) {
            arcRadius = Math.sqrt(d.y / 2) + (d.size / d.parent.size) * 750 / 2;
        }

        //.arc ( x : Float, y : Float, radius : Float, startAngle : Float, endAngle : Float, clockwise : Boolean ) 
        arcPath.arc(0, 0, arcRadius, d.x, d.x + d.dx, false);
        var points = arcPath.getSpacedPoints(100);

        var pointsVec = [];
        points.forEach(e => {
            pointsVec.push(new THREE.Vector3(
                e.x,
                e.y,
                (year - 2016) * 2500 + extrude
            ))
        });
        var path = new THREE.CatmullRomCurve3(pointsVec)

        var arcColor = '';
        if (d.parent && d.parent.name == "root")
            arcColor = colors[d.name];
        else if (d.parent && d.parent.name != "root")
            arcColor = colors[d.parent.name];

        var percent = (100 * d.value / totalSize).toPrecision(3);

        var r = 0;
        if (d.depth != 2) {
            r = 0.5 * (Math.sqrt(d.y / 2 + d.dy / 2) - Math.sqrt(d.y / 2));
        } else if (d.depth == 2) {
            r = (d.size / d.parent.size) * 750 / 2;
        }
        //TubeGeometry(path : Curve, 
        //	tubularSegments : Integer, 
        //	radius : Float, 
        //	radialSegments : Integer, 
        //	closed : Boolean)
        var geometry = new THREE.TubeGeometry(path, 64, r, 20, false);
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
            size: d.size,
            percent: percent
        };

        tb.add(mesh)

    }

}

function buildHierarchy(csv) {
    var root = {
        "name": "root",
        "children": [],
        "size": 0
    };
    for (var i = 0; i < csv.length; i++) {
        var size = +csv[i][0];
        var sequence = csv[i][1];
        if (isNaN(size)) { // e.g. if this is a header row
            continue;
        }
        var parts = sequence.split("+");
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
            var children = currentNode["children"];
            var nodeName = parts[j];
            var childNode;
            if (j + 1 < parts.length) {
                // Not yet at the end of the sequence; move down the tree.
                var foundChild = false;
                for (var k = 0; k < children.length; k++) {
                    if (children[k]["name"] == nodeName) {
                        childNode = children[k];
                        foundChild = true;
                        break;
                    }
                }
                // If we don't already have a child node for this branch, create it.
                if (!foundChild) {
                    childNode = {
                        "name": nodeName,
                        "children": [],
                        "size": 0
                    };
                    children.push(childNode);
                }
                currentNode = childNode;
            } else {
                // Reached the end of the sequence; create a leaf node.
                childNode = {
                    "name": nodeName,
                    "children": [],
                    "size": size
                };
                children.push(childNode);
            }
        }
    }
    return root;
};