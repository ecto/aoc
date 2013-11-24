var THREE = require('three');
var $ = require('jquery-browserify');

var stats = new Stats();
stats.domElement.style.position = 'absolute';
stats.domElement.style.left = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

var intendedCameraPosition = new THREE.Vector3(0, 400, 400);
var game = {};
var plane, sphere;

init();
addGround();
addSphere();
animate();

function init () {
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

  $(game.renderer.domElement).mousemove(mouseMove);
  $(game.renderer.domElement).click(function () {
    sphere.inception = +new Date();
  });
}

function addGround () {
  var geometry = new THREE.PlaneGeometry(1000, 1000, 200, 200);
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

function addSphere () {
  var geometry = new THREE.SphereGeometry(10, 10);
  var material = new THREE.MeshLambertMaterial({
    color: 0xffff00,
  });

  sphere = new THREE.Mesh(geometry, material);
  sphere.mass = 100;
  sphere.inception = +new Date();

  game.scene.add(sphere);
}

function animate () {
  stats.begin();
  requestAnimationFrame(animate);
  calculateGravity();

  var t = (+new Date() - sphere.inception) / 500;
  var offset = ((Math.pow(Math.E, -t)) * Math.cos(2 * Math.PI * t));
  sphere.position.y = -offset * 100;
  sphere.mass = offset * 150 + 100;

  game.renderer.render(game.scene, game.camera);
  stats.end();
}

var G = 100;
function calculateGravity () {
  var vertex;
  // force = gc * ((m1 * m2) / distance^2)

  for (var i = 0; i < plane.geometry.vertices.length; i++) {
    vertex = plane.geometry.vertices[i];
    var distance = Math.sqrt(Math.pow(vertex.x - sphere.position.x, 2) + Math.pow(vertex.y - -sphere.position.z, 2));
    var f = -(G * sphere.mass) / Math.pow(distance, 2);
    vertex.z = f;
  }

  plane.geometry.verticesNeedUpdate = true;
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
  sphere.position = pos;
}
