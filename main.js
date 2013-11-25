var THREE = require('three');
var $ = require('jquery-browserify');

var fieldSize = 1000;
var intendedCameraPosition = new THREE.Vector3(0, 200, 200);
var game = {};
var spheres = [];
var plane, player;
var stats;

var keys = {};
$(window).keydown(function (e) {
  keys[e.which] = true;
}).keyup(function (e) {
  keys[e.which] = false;
});

$(document).ready(function () {
  initStats();
  initScene();
  addGround();
  addSpheres();
  addPlayer();
  animate();
});

function initStats () {
  stats = new Stats();
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);
}

function initScene () {
  game.camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 10000);
  game.camera.position = intendedCameraPosition;
  game.camera.rotation.x = -0.8;

  game.scene = new THREE.Scene();

  var ambientLight = new THREE.AmbientLight(0x404040);
  game.scene.add( ambientLight );

  var directionalLight = new THREE.DirectionalLight(0xffffff);
  directionalLight.position.x = -1;
  directionalLight.position.y = 1;
  directionalLight.position.z = 0.75;
  game.scene.add( directionalLight );

  var directionalLight = new THREE.DirectionalLight(0x808080);
  directionalLight.position.x = - 1;
  directionalLight.position.y = 1;
  directionalLight.position.z = - 0.75;
  directionalLight.position.normalize();
  game.scene.add( directionalLight );

  game.renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true
  });

  game.renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(game.renderer.domElement);

  //$(game.renderer.domElement).mousemove(mouseMove);
  $(game.renderer.domElement).click(function () {
    player.inception = +new Date();
  });
}

function addGround () {
  var geometry = new THREE.PlaneGeometry(fieldSize, fieldSize, fieldSize / 4, fieldSize / 4);
  var material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    opacity: 0.2,
    transparent: true,
    wireframe: true
  });

  plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  game.scene.add(plane);
}

function addPlayer () {
  var mass = 10;
  var density = 1;
  var size = mass / density;

  var geometry = new THREE.SphereGeometry(size, size);
  var material = new THREE.MeshLambertMaterial({
    color: 0xffff00
  });

  player = new THREE.Mesh(geometry, material);
  player.mass = 100;
  player.density = 2;
  player.inception = +new Date();
  player.velocity = new THREE.Vector3();
  player.acceleration = new THREE.Vector3();

  spheres.push(player);
  game.scene.add(player);
}

function addSpheres () {
  var limit = 20;

  for (var i = 0; i < limit; i++) {
    var mass = Math.ceil(Math.random() * 20);
    var density = 5;
    var size = mass / density;

    var geometry = new THREE.SphereGeometry(size, size * 10);
    var material = new THREE.MeshLambertMaterial({
      color: parseInt((0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6), 16)
    });

    var sphere = new THREE.Mesh(geometry, material);
    sphere.position.x = (Math.random() * fieldSize) - (fieldSize / 2);
    sphere.position.z = (Math.random() * fieldSize) - (fieldSize / 2);
    sphere.velocity = new THREE.Vector3();
    sphere.acceleration = new THREE.Vector3();
    sphere.mass = mass;
    sphere.inception = +new Date();

    spheres.push(sphere);
    game.scene.add(sphere);
  }
}

function animate () {
  stats.begin();
  requestAnimationFrame(animate);
  handleKeypresses();
  doBounce();
  calculateGravity();
  doGravity();
  moveSpheres();
  moveCamera();
  game.renderer.render(game.scene, game.camera);
  stats.end();
}

function doBounce () {
  var i = 0;
  var t = (+new Date() - spheres[i].inception) / 500;
  var offset = ((Math.pow(Math.E, -t)) * Math.cos(2 * Math.PI * t));
  spheres[i].position.y = -offset * 100;
  spheres[i].mass = offset * 150 + 100;
}

function handleKeypresses () {
  var scale = 0.05;

  if (keys[87]) {
    // up
    player.velocity.z -= scale;
  }

  if (keys[65]) {
    // left
    player.velocity.x -= scale;
  }

  if (keys[83]) {
    // down
    player.velocity.z += scale;
  }

  if (keys[68]) {
    // right
    player.velocity.x += scale;
  }
}

var G = 6.7;
function calculateGravity () {
  var vertex;
  // force = gc * ((m1 * m2) / distance^2)

  for (var i = 0; i < plane.geometry.vertices.length; i++) {
    vertex = plane.geometry.vertices[i];
    var sum = 0;

    for (var j = 0; j < spheres.length; j++) {
      var distance = Math.sqrt(Math.pow(vertex.x - spheres[j].position.x, 2) + Math.pow(vertex.y - -spheres[j].position.z, 2));
      var f = -(G * spheres[j].mass * 100) / Math.pow(distance, 2);
      sum += f;
    }

    vertex.z = sum;
  }

  plane.geometry.verticesNeedUpdate = true;
}

function doGravity () {
  for (var i = 0; i < spheres.length; i++) {
    for (var j = 0; j < spheres.length; j++) {
      if (spheres[i].position.equals(spheres[j].position)) continue;
      var distance = spheres[i].position.clone().sub(spheres[j].position.clone());
      var f = ((-G * spheres[j].mass) / distance.lengthSq());
      var acc = distance.normalize().multiplyScalar(f / spheres[i].mass);
      spheres[i].acceleration = acc;
    }
  }
}

function moveSpheres () {
  for (var i = 0; i < spheres.length; i++) {
    spheres[i].position.add(spheres[i].velocity);
    spheres[i].velocity.add(spheres[i].acceleration);
  }
}

function moveCamera () {
  game.camera.position.x = player.position.x;
  game.camera.position.z = player.position.z + 200;
}

var projector = new THREE.Projector();
function mouseMove (e) {
  var vector = new THREE.Vector3(
    (e.clientX / window.innerWidth) * 2 - 1,
    -(e.clientY / window.innerHeight) * 2 + 1,
    0.5
  );

  projector.unprojectVector(vector, game.camera);
  var dir = vector.sub(game.camera.position).normalize();
  var distance = -game.camera.position.y / dir.y;
  var pos = game.camera.position.clone().add(dir.multiplyScalar(distance));
  player.position = pos;
}
