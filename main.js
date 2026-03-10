// ============================================
// ANNY 3D - VERSÃO OTIMIZADA
// ============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
    moveSpeed: 0.15,
    rotationSpeed: 0.2,

    cameraDistance: 6,
    cameraHeight: 3,
    cameraSmoothness: 0.15,
    cameraMinDistance: 3,
    cameraMaxDistance: 10,

    cameraRotSpeed: 0.005,
    cameraRotSmoothness: 0.15,

    joystickMaxRadius: 35,

    shadowMapSize: 1024,
    grassCount: 50,
    textureSize: 256
};

// ============================================
// ESTADO
// ============================================

const state = {
    keys: { w: false, a: false, s: false, d: false },

    scene: null,
    camera: null,
    renderer: null,

    character: null,
    mixer: null,

    isLoaded: false,
    isTouch: ('ontouchstart' in window) || (navigator.maxTouchPoints > 0),
    gameStarted: false,

    cameraZoom: CONFIG.cameraDistance,
    targetZoom: CONFIG.cameraDistance,

    camAngle: { h: 0, v: 0.4, targetH: 0, targetV: 0.4 },

    joystick: {
        active: false,
        x: 0,
        y: 0,
        vec: new THREE.Vector2()
    },

    drag: { active: false, lastX: 0, lastY: 0 },

    clock: new THREE.Clock()
};

// ============================================
// LOADING MANAGER
// ============================================

const loadingManager = {

    progressBar: document.getElementById('progress-bar'),
    percentText: document.getElementById('loading-percent'),
    statusText: document.getElementById('loading-status'),
    progressContainer: document.getElementById('progress-container'),
    startButton: document.getElementById('start-button'),
    screen: document.getElementById('loading-screen'),
    canvas: document.getElementById('canvas-container'),
    ui: document.getElementById('ui'),

    update(progress, status) {

        if (this.progressBar)
            this.progressBar.style.width = progress + '%';

        if (this.percentText)
            this.percentText.textContent = Math.floor(progress) + '%';

        if (status && this.statusText)
            this.statusText.textContent = status;

    },

    showStartButton() {

        this.update(100, 'Pronto!');

        setTimeout(() => {

            this.progressContainer?.classList.add('hidden');
            this.statusText?.classList.add('hidden');

            setTimeout(() => {
                this.startButton?.classList.add('visible');
            }, 200);

        }, 400);

    },

    startGame() {

        this.startButton.textContent = '▶';

        setTimeout(() => {

            this.screen?.classList.add('hidden');
            this.canvas?.classList.add('loaded');

            setTimeout(() => {

                this.ui?.classList.add('visible');
                state.gameStarted = true;

            }, 200);

        }, 100);

    }

};

// ============================================
// INIT
// ============================================

function init() {

    if (state.isTouch) {

        document.getElementById('desktop-hint').style.display = 'none';
        document.getElementById('mobile-hint').style.display = 'inline';
        document.querySelector('.mobile-hint-ui').style.display = 'block';

    }

    loadingManager.startButton?.addEventListener(
        'click',
        () => loadingManager.startGame()
    );

    simulateLoading();

}

// ============================================
// LOADING SIMULADO
// ============================================

function simulateLoading() {

    const steps = [
        { p: 20, s: 'Recursos...', d: 100 },
        { p: 40, s: 'Gráficos...', d: 150 },
        { p: 60, s: 'Mundo 3D...', d: 150 },
        { p: 80, s: 'Personagem...', d: 200 },
        { p: 95, s: 'Quase lá...', d: 150 }
    ];

    let i = 0;

    function next() {

        if (i >= steps.length) {
            startThreeJS();
            return;
        }

        const s = steps[i];

        setTimeout(() => {

            loadingManager.update(s.p, s.s);
            i++;
            next();

        }, s.d);

    }

    next();

}

// ============================================
// THREE
// ============================================

function startThreeJS() {

    createScene();
    createCamera();
    createRenderer();
    createLighting();
    createGround();
    setupControls();

    if (state.isTouch)
        setupJoystick();

    loadCharacter();

    animate();

    window.addEventListener('resize', onResize);

    const check = setInterval(() => {

        if (state.isLoaded) {

            clearInterval(check);
            loadingManager.showStartButton();

        }

    }, 100);

}

// ============================================
// SCENE
// ============================================

function createScene() {

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x87CEEB);
    state.scene.fog = new THREE.Fog(0x87CEEB, 15, 40);

}

// ============================================
// CAMERA
// ============================================

function createCamera() {

    state.camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

}

// ============================================
// RENDERER
// ============================================

function createRenderer() {

    state.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    document
        .getElementById('canvas-container')
        .appendChild(state.renderer.domElement);

}

// ============================================
// LUZ
// ============================================

function createLighting() {

    const ambient = new THREE.AmbientLight(0x404060, 1.7);
    state.scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xfff5d1, 2);
    sun.position.set(10, 20, 5);
    sun.castShadow = true;

    sun.shadow.mapSize.width = CONFIG.shadowMapSize;
    sun.shadow.mapSize.height = CONFIG.shadowMapSize;

    state.scene.add(sun);

}

// ============================================
// CHÃO
// ============================================

function createGround() {

    const geo = new THREE.CircleGeometry(50, 32);

    const mat = new THREE.MeshStandardMaterial({
        color: 0x3a7a3a,
        roughness: 0.9
    });

    const ground = new THREE.Mesh(geo, mat);

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    state.scene.add(ground);

}

// ============================================
// PERSONAGEM
// ============================================

function loadCharacter() {

    const loader = new GLTFLoader();

    loader.load(

        'assets/anny2.glb',

        (gltf) => {

            state.character = gltf.scene;

            state.character.traverse((c) => {

                if (c.isMesh) {

                    c.castShadow = true;
                    c.receiveShadow = true;

                }

            });

            state.scene.add(state.character);

            if (gltf.animations.length > 0) {

                state.mixer = new THREE.AnimationMixer(state.character);

                state.mixer
                    .clipAction(gltf.animations[0])
                    .play();

            }

            state.isLoaded = true;

        },

        undefined,

        () => {

            console.warn("Erro ao carregar personagem");

        }

    );

}

// ============================================
// CONTROLES
// ============================================

function setupControls() {

    window.addEventListener('keydown', (e) => {

        const k = e.key.toLowerCase();

        if (k in state.keys)
            state.keys[k] = true;

    });

    window.addEventListener('keyup', (e) => {

        const k = e.key.toLowerCase();

        if (k in state.keys)
            state.keys[k] = false;

    });

}

// ============================================
// JOYSTICK
// ============================================

function setupJoystick() {

    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');

    container.addEventListener('touchstart', (e) => {

        const t = e.touches[0];

        const rect = container.getBoundingClientRect();

        state.joystick.active = true;

        state.joystick.originX = rect.left + rect.width / 2;
        state.joystick.originY = rect.top + rect.height / 2;

        state.joystick.x = t.clientX;
        state.joystick.y = t.clientY;

        updateJoystick(knob);

    });

    window.addEventListener('touchmove', (e) => {

        if (!state.joystick.active) return;

        const t = e.touches[0];

        state.joystick.x = t.clientX;
        state.joystick.y = t.clientY;

        updateJoystick(knob);

    });

    window.addEventListener('touchend', () => {

        state.joystick.active = false;

        state.joystick.vec.set(0, 0);

        knob.style.transform = `translate(-50%, -50%)`;

    });

}

function updateJoystick(knob) {

    const dx = state.joystick.x - state.joystick.originX;
    const dy = state.joystick.y - state.joystick.originY;

    const dist = Math.hypot(dx, dy);

    const max = CONFIG.joystickMaxRadius;

    const clamped = Math.min(dist, max);

    const angle = Math.atan2(dy, dx);

    const x = Math.cos(angle) * clamped;
    const y = Math.sin(angle) * clamped;

    knob.style.transform =
        `translate(-50%, -50%) translate(${x}px, ${y}px)`;

    state.joystick.vec.set(x / max, y / max);

}

// ============================================
// MOVIMENTO
// ============================================

function updateMovement() {

    if (!state.character || !state.gameStarted) return;

    const cameraDir = new THREE.Vector3();

    state.camera.getWorldDirection(cameraDir);

    cameraDir.y = 0;
    cameraDir.normalize();

    const cameraRight =
        new THREE.Vector3()
            .crossVectors(new THREE.Vector3(0, 1, 0), cameraDir)
            .normalize();

    const moveDir = new THREE.Vector3();

    if (state.keys.w) moveDir.add(cameraDir);
    if (state.keys.s) moveDir.sub(cameraDir);

    if (state.keys.a) moveDir.sub(cameraRight);
    if (state.keys.d) moveDir.add(cameraRight);

    if (state.joystick.active) {

        const joyX = state.joystick.vec.x;
        const joyY = -state.joystick.vec.y;

        moveDir.addScaledVector(cameraRight, joyX);
        moveDir.addScaledVector(cameraDir, joyY);

    }

    if (moveDir.length() > 0.1) {

        moveDir.normalize();

        const targetRot = Math.atan2(moveDir.x, moveDir.z);

        let diff = targetRot - state.character.rotation.y;

        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        state.character.rotation.y += diff * CONFIG.rotationSpeed;

        state.character.position.x += moveDir.x * CONFIG.moveSpeed;
        state.character.position.z += moveDir.z * CONFIG.moveSpeed;

    }

}

// ============================================
// CAMERA
// ============================================

function updateCamera() {

    if (!state.character) return;

    state.cameraZoom += (state.targetZoom - state.cameraZoom) * 0.1;

    state.camAngle.h += (state.camAngle.targetH - state.camAngle.h) * 0.1;
    state.camAngle.v += (state.camAngle.targetV - state.camAngle.v) * 0.1;

    const pos =
        state.character.position.clone().add(new THREE.Vector3(0, 1.2, 0));

    const hDist = state.cameraZoom * Math.cos(state.camAngle.v);
    const vDist = state.cameraZoom * Math.sin(state.camAngle.v);

    state.camera.position.x = pos.x + Math.sin(state.camAngle.h) * hDist;
    state.camera.position.y = pos.y + vDist + 1.5;
    state.camera.position.z = pos.z + Math.cos(state.camAngle.h) * hDist;

    state.camera.lookAt(pos);

}

// ============================================
// LOOP
// ============================================

function animate() {

    requestAnimationFrame(animate);

    if (state.mixer)
        state.mixer.update(0.016);

    updateMovement();
    updateCamera();

    state.renderer.render(state.scene, state.camera);

}

// ============================================
// RESIZE
// ============================================

function onResize() {

    if (!state.camera) return;

    state.camera.aspect =
        window.innerWidth / window.innerHeight;

    state.camera.updateProjectionMatrix();

    state.renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', init);