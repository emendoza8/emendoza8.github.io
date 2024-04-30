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

const renderer = new THREE.WebGLRenderer({antialias: true});

renderer.setSize(window.innerWidth, window.innerHeight);

//Camera setup
const near = 0.1
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
	threshold: 0.5,
	strength: 0.5,
	radius: 0.8
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
const renderScene = new RenderPass(scene, camera);

//Set up bloom effect
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight));
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
	u_time: {type: 'f', value: 0.0},
	u_frequency: {type: 'f', value: 0.0},
	u_red: {type: 'f', value: 1.0},
	u_green: {type: 'f', value: 1.0},
	u_blue: {type: 'f', value: 1.0}
}

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
// Listener is added to the camera for consistent sound as orbit controls used
// Sound will hold music data
// Audio directs to the location of the audio
// Analyser discretizes the audio for operating on! Whoohoo!
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('./assets/music/SharonVanEtten-Jupiter4.mp3', function(buffer) {
	sound.setBuffer(buffer);
	window.addEventListener('click', function() {
		sound.play();
	});
});
const analyser = new THREE.AudioAnalyser(sound, 32);


const colorsFolder = gui.addFolder('Colors');
colorsFolder.add(params, 'red', 0, 1).onChange(function(value) {
	uniforms.u_red.value = Number(value);
});
colorsFolder.add(params, 'green', 0, 1).onChange(function(value) {
	uniforms.u_green.value = Number(value);
});
colorsFolder.add(params, 'blue', 0, 1).onChange(function(value) {
	uniforms.u_blue.value = Number(value);
});

const bloomFolder = gui.addFolder('Bloom');
bloomFolder.add(params, 'threshold', 0, 1).onChange(function(value) {
	bloomPass.threshold = Number(value);
});
bloomFolder.add(params, 'strength', 0, 3).onChange(function(value) {
	bloomPass.strength = Number(value);
});
bloomFolder.add(params, 'radius', 0, 1).onChange(function(value) {
	bloomPass.radius = Number(value);
});

const clock = new THREE.Clock();

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    bloomComposer.setSize(window.innerWidth, window.innerHeight);
});
// This section is largely texture related
// Credits/Licenses in assets folder
// Load Textures with this
let textureLoader = new THREE.TextureLoader();
let floor = textureLoader.load('./assets/textures/Marble_001.png');
floor.wrapS = THREE.RepeatWrapping;
floor.wrapT = THREE.RepeatWrapping;

// Create Cube Texture for Skybox
const cubeTextureLoader = new THREE.CubeTextureLoader();
const cubeTexture = cubeTextureLoader.load([
 './assets/textures/interstellar_skybox/xpos.png', './assets/textures/interstellar_skybox/xneg.png',
 './assets/textures/interstellar_skybox/ypos.png', './assets/textures/interstellar_skybox/yneg.png',
 './assets/textures/interstellar_skybox/zpos.png', './assets/textures/interstellar_skybox/zneg.png'
]);

// Create Cube Camera for Skybox!
// Create cube render target
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
});

// Create cube camera
const cubeCamera = new THREE.CubeCamera(near, far, cubeRenderTarget);
scene.add(cubeCamera);
scene.add(cubeCamera);

// Set Skybox! Texture as Background
scene.background = cubeTexture;
// Platform!
let floorGeometry = new THREE.CircleGeometry(50, 64);
let floorMaterial = new THREE.MeshStandardMaterial({
 map: floor,
 metalness: 1.0,
 roughness: 0.0
});
let floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);

floorMesh.position.set( 0, -1, -3 );
floorMesh.rotation.set( -Math.PI/2, 0, 0 );
scene.add(floorMesh);

// Adding cool lights and shadows;
// ThreeJS Documentation is the best place to loook for tips on adjusting these
var ambient = new THREE.AmbientLight(0xffffff);
scene.add(ambient);

var pointLight = new THREE.PointLight(0xffffff, 750);
pointLight.position.set(6.75, 10.75, -6.25);
scene.add(pointLight);

renderer.shadowMap.enabled = true;
floorMesh.receiveShadow = true;
pointLight.castShadow = true;

const spotLight = new THREE.SpotLight( 0xffffff, 25, 55, Math.PI/2, 1.0, 0 );
spotLight.position.set( 0, 7.5, 0 );
spotLight.castShadow = true;
scene.add( spotLight );

mesh.recieveShadow = true;
mesh.castShadow = true;

// More textures
const texture = textureLoader.load('./assets/textures/Stone.png');

// Material; Don't forget, Three LOVES material
// If something isn't going well, check material usage
const material = new THREE.MeshStandardMaterial({
    map: texture,
    metalness: 1.0,
    roughness: 1.0
});

// Create the torus geometry
const geometry = new THREE.TorusGeometry(2.25, 0.77, 16, 100);

// Torus with added texture
const torus = new THREE.Mesh(geometry, material);

// Set the position of the torus
torus.position.set(6, 10, -7);

// Add the torus to the scene and shadows
scene.add(torus);
torus.recieveShadow = true;
torus.castShadow = true;

renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
camera.position.set( 6, 6, -10);

//update orbit controls once outside animation
controls.update();

function animate() {

	uniforms.u_time.value = clock.getElapsedTime();
	uniforms.u_frequency.value = analyser.getAverageFrequency();
    bloomComposer.render();

    // Update torus position to orbit around the mesh sphere
    const orbitRadius = 17;
    const orbitSpeed = 0.22;

    // Calculate the new position of the torus
    const angle = orbitSpeed * clock.getElapsedTime();
    const torusX = Math.cos(angle) * orbitRadius;
    const torusY = Math.sin(angle) * orbitRadius;
    const torusZ = Math.cos(angle) * orbitRadius * 0.5;
    
    // Update light to follow the same orbit as the torus
    // Future work: Probably should optimize this dupe code
    const lightOrbitRadius = 17;
    const lightOrbitSpeed = 0.22;
    // Calculate the new position of the pointlight
    const lightAngle = lightOrbitSpeed * clock.getElapsedTime();
    const lightX = Math.cos(lightAngle) * lightOrbitRadius;
    const lightY = Math.sin(lightAngle) * lightOrbitRadius;
    const lightZ = Math.cos(lightAngle) * lightOrbitRadius * 0.5;

    // Set the new position of the pointlight
    pointLight.position.set(lightX, lightY, lightZ);
	// Set the new position of the torus
    torus.position.set(torusX, torusY, torusZ);
    // Orbit controls updates again in here
    controls.update();

    cubeCamera.update(renderer, scene);
    //Don't forget to actually animate! Very important
    requestAnimationFrame( animate );
    // Sure, don't forget to render either
    renderer.render( scene, camera );
}
// Animate outside the loop to fire off the initial animation loop! Yay!
animate();
