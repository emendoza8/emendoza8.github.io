//Still would like to refactor, reorganize a little bit
//Add more geometries!
//Checkout other noise functions from the lib in README!
//Connect to Spotify API
//More analysers with different FFT numbers??
//The list goes on; This project will never end :)
// Thanks for checking this out:
// -Zar

import * as THREE from 'three';
import { OrbitControls } from './three.js/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from './three.js/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './three.js/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './three.js/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './three.js/examples/jsm/postprocessing/OutputPass.js';

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

//Camera setup
const near = 0.1;
const far = 25;
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//Orbit control setup
const controls = new OrbitControls(camera, renderer.domElement);

//Set up GUI for bloom and color changes
//See README for credit
const gui = new dat.GUI();
const params = {
  red: 1.0,
  green: 1.0,
  blue: 1.0,
  threshold: 0.75,
  strength: 0.25,
  radius: 0.2
};

renderer.outputColorSpace = THREE.SRGBColorSpace;
const renderScene = new RenderPass(scene, camera);

//Set up bloom effect
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight)
);
bloomPass.threshold = params.threshold;
bloomPass.strength = params.strength;
bloomPass.radius = params.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

const outputPass = new OutputPass();
bloomComposer.addPass(outputPass);

//Camera starting position
camera.position.set(5, 5, 20);

// Uniform variables for the shaderz
const uniforms = {
  u_time: { type: 'f', value: 0.0 },
  u_frequency: { type: 'f', value: 0.0 },
  u_red: { type: 'f', value: 1.0 },
  u_green: { type: 'f', value: 1.0 },
  u_blue: { type: 'f', value: 1.0 }
};

// Shaderz for vertex transformations and color changes
// Coming from index.html
const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: document.getElementById('vertexshader').textContent,
  fragmentShader: document.getElementById('fragmentshader').textContent
});

// Geometry! This becomes a sphere when the second parameter
// is increased beyond default; that adds more vertices
// Sets wireframe mode and position as well
const geo = new THREE.IcosahedronGeometry(8.5, 16);
const mesh = new THREE.Mesh(geo, mat);
scene.add(mesh);
mesh.material.wireframe = true;
mesh.position.set(0, 7, 0);

// Audio stuff!
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('./assets/music/SharonVanEtten-Jupiter4.mp3', function (buffer) {
  sound.setBuffer(buffer);
  window.addEventListener('click', function () {
    sound.play();
  });
});

const analyser = new THREE.AudioAnalyser(sound, 128);

const colorsFolder = gui.addFolder('Colors');
colorsFolder.add(params, 'red', 0, 1).onChange(function (value) {
  uniforms.u_red.value = Number(value);
});
colorsFolder.add(params, 'green', 0, 1).onChange(function (value) {
  uniforms.u_green.value = Number(value);
});
colorsFolder.add(params, 'blue', 0, 1).onChange(function (value) {
  uniforms.u_blue.value = Number(value);
});

const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(params, 'threshold', 0, 1).onChange(function (value) {
  bloomPass.threshold = Number(value);
});
bloomFolder.add(params, 'strength', 0, 1).onChange(function (value) {
  bloomPass.strength = Number(value);
});
bloomFolder.add(params, 'radius', 0, 1).onChange(function (value) {
  bloomPass.radius = Number(value);
});

const clock = new THREE.Clock();

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  bloomComposer.setSize(window.innerWidth, window.innerHeight);
});

// Textures
let textureLoader = new THREE.TextureLoader();
let floor = textureLoader.load('./assets/textures/Marble_001.png');
floor.wrapS = THREE.RepeatWrapping;
floor.wrapT = THREE.RepeatWrapping;

// Skybox
const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeTextureLoader.load([
  './assets/textures/interstellar_skybox/xpos.png', './assets/textures/interstellar_skybox/xneg.png',
  './assets/textures/interstellar_skybox/ypos.png', './assets/textures/interstellar_skybox/yneg.png',
  './assets/textures/interstellar_skybox/zpos.png', './assets/textures/interstellar_skybox/zneg.png'
]);

const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter
});

const cubeCamera = new THREE.CubeCamera(near, far, cubeRenderTarget);
scene.add(cubeCamera);

scene.background = cubeTexture;

// Platform
let floorGeometry = new THREE.CircleGeometry(50, 64);
let floorMaterial = new THREE.MeshStandardMaterial({
  map: floor,
  metalness: 1.0,
  roughness: 0.0
});
let floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

floorMesh.position.set(0, -1, -3);
floorMesh.rotation.set(-Math.PI / 2, 0, 0);
scene.add(floorMesh);

// Lights
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);

var pointLight = new THREE.PointLight(0xffffff, 85);
pointLight.position.set(6.75, 10.75, -6.25);
scene.add(pointLight);

renderer.shadowMap.enabled = true;
floorMesh.receiveShadow = true;
pointLight.castShadow = true;

const spotLight = new THREE.SpotLight(0xffffff, 25, 55, Math.PI / 2, 1.0, 0);
spotLight.position.set(0, 7.5, 0);
spotLight.castShadow = true;
scene.add(spotLight);

mesh.receiveShadow = true;
mesh.castShadow = true;

// --- NEW: Sphere-focused "scanner" spotlight (lightweight) ---
const sphereSpot = new THREE.SpotLight(0xffffff, 18, 35, Math.PI / 10, 0.6, 1.5);
sphereSpot.castShadow = false; // keep it lightweight
scene.add(sphereSpot);

const sphereSpotTarget = new THREE.Object3D();
scene.add(sphereSpotTarget);
sphereSpot.target = sphereSpotTarget;

// More textures
const texture = textureLoader.load('./assets/textures/Stone.png');

const material = new THREE.MeshStandardMaterial({
  map: texture,
  metalness: 0.4,
  roughness: 0.5
});

// --- Multi audio-reactive orbiting spheres ---
const sphereCount = 12;
const spheres = [];

const sphereGeometry = new THREE.SphereGeometry(1.0, 24, 24);
const sphereMaterial = material.clone();

for (let i = 0; i < sphereCount; i++) {
  const m = new THREE.Mesh(sphereGeometry, sphereMaterial.clone());
  m.castShadow = true;
  m.receiveShadow = true;

  spheres.push({
    mesh: m,
    orbitRadius: 10 + i * 1.2,
    orbitSpeed: 0.15 + i * 0.02,
    phase: (i / sphereCount) * Math.PI * 2,
    freqBin: i,
    baseScale: 0.6,
    scaleBoost: 2.0
  });

  scene.add(m);
}

document.body.appendChild(renderer.domElement);

//update orbit controls once outside animation
controls.update();

function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  uniforms.u_time.value = t;
  uniforms.u_frequency.value = analyser.getAverageFrequency();

  const freqData = analyser.getFrequencyData();
  const bins = freqData.length;

  // Update spheres (orbit + scale)
  for (let i = 0; i < spheres.length; i++) {
    const s = spheres[i];
    const m = s.mesh;

    const a = t * s.orbitSpeed + s.phase;

    const x = Math.cos(a) * s.orbitRadius;
    const z = Math.sin(a) * s.orbitRadius;
    const y = Math.sin(a * 0.7) * 2;

    m.position.set(x, 7 + y, z);

    const binIndex = Math.min(s.freqBin, bins - 1);
    const amp = freqData[binIndex] / 255;

    const scale = s.baseScale + amp * s.scaleBoost;
    m.scale.setScalar(scale);
  }

  // --- NEW: Spotlight targets orbiting spheres (focus on satellites) ---
  if (spheres.length > 0) {
    const featuredIndex = Math.floor(t * 0.8) % spheres.length;
    const p = spheres[featuredIndex].mesh.position;

    // place spotlight above and offset from featured sphere
    sphereSpot.position.set(p.x + 8, p.y + 10, p.z + 8);

    // aim beam at the featured sphere
    sphereSpotTarget.position.copy(p);
    sphereSpotTarget.updateMatrixWorld();
  }

  controls.update();
  cubeCamera.update(renderer, scene);

  bloomComposer.render(); // render once
}

animate();
