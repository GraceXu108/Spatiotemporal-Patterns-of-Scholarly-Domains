import './style.css';
import './libs/d3.v3.min.js';
import './libs/threebox.js';

import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import GeoData from '../dist/assets/china.json';

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

// Store the coordinates
var positions;
var fileterCatogeries;

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
async function init() {
    // const request = await fetch("./assets/basemap.json");
    // const data = await request.json();
    // positions = data.data;
    // fileterCatogeries = JSON.parse(JSON.stringify(positions));
    createMap();
}
init();

function gradient(length, maxLength) {

    var i = (length * 255 / maxLength);
    // var r = i;
    // var g = 255 - (i);
    // var b = 0;
    var r = i;
    var g = 255 - (0.5*i);
    var b = 255 - (i);

    var rgb = b | (g << 8) | (r << 16);
    return rgb;
}

function initGeoData(geo_data) {
    // console.log(geo_data);


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




    for (var i = 0; i < geo_data.features.length; i++) {

        var feature = geo_data.features[i];

        // to determine the color later on
        var value = parseInt(feature.properties.adcode);
        if (value > maxValueAnnual) maxValueAnnual = value;
        if (value < minValueAnnual || minValueAnnual == -1) minValueAnnual = value;

        annualValues.push(value);

        // to determine height later on
        value = parseInt(feature.properties.adcode);
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
    // console.log(map);
}


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

    containers[0][0].innerHTML = data.city;
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

    initGeoData(GeoData);

    d3.text("./assets/beijing_2017.csv", function (text) {
        var csv = d3.csv.parseRows(text);
        var json = buildHierarchy(csv);
        create3DTubes(json, 2017);
    });
    d3.text("./assets/beijing_2018.csv", function (text) {
        var csv = d3.csv.parseRows(text);
        var json = buildHierarchy(csv);
        create3DTubes(json, 2018);
    });
    d3.text("./assets/beijing_2019.csv", function (text) {
        var csv = d3.csv.parseRows(text);
        var json = buildHierarchy(csv);
        create3DTubes(json, 2019);
    });
    d3.text("./assets/beijing_2020.csv", function (text) {
        var csv = d3.csv.parseRows(text);
        var json = buildHierarchy(csv);
        create3DTubes(json, 2020);
    });

}



function create3DTubes(json, year) {

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
                (year - 2016) * 2500
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
            .setCoords(origin)

        mesh.data = {
            city: 'Beijing',
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