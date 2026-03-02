// ============================================
// ANNY 3D - Three.js Character Controller
// ============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// CONFIGURAÇÕES
// ============================================

const CONFIG = {
    moveSpeed: 0.1,
    rotationSpeed: 0.15,
    cameraHeight: 3,
    cameraDistance: 5,
    cameraSmoothness: 0.1,
    joystickMaxRadius: 35
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
    isTouchDevice: false,
    gameStarted: false,
    
    joystick: {
        active: false,
        originX: 0,
        originY: 0,
        currentX: 0,
        currentY: 0,
        vector: new THREE.Vector2(0, 0)
    }
};

// ============================================
// LOADING MANAGER COM BOTÃO INICIAR
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
    controlsHint: document.getElementById('controls-hint'),
    
    update(progress, status) {
        this.progressBar.style.width = progress + '%';
        this.percentText.textContent = Math.floor(progress) + '%';
        if (status) this.statusText.textContent = status;
    },
    
    // Mostra botão de iniciar quando carregar
    showStartButton() {
        this.update(100, 'Pronto para jogar!');
        this.statusText.classList.add('complete');
        
        // Esconder barra de progresso
        setTimeout(() => {
            this.progressContainer.classList.add('hidden');
            this.statusText.classList.add('hidden');
            this.controlsHint.classList.add('hidden');
            
            // Mostrar botão com animação
            setTimeout(() => {
                this.startButton.classList.add('visible');
            }, 300);
        }, 500);
    },
    
    // Inicia o jogo quando clicar no botão
    startGame() {
        this.startButton.textContent = 'CARREGANDO...';
        
        setTimeout(() => {
            this.screen.classList.add('hidden');
            this.canvas.classList.add('loaded');
            
            setTimeout(() => {
                this.ui.classList.add('visible');
                state.gameStarted = true;
            }, 300);
        }, 200);
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    state.isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (state.isTouchDevice) {
        document.getElementById('desktop-hint').style.display = 'none';
        document.getElementById('mobile-hint').style.display = 'inline';
    }
    
    // Configurar botão de iniciar
    loadingManager.startButton.addEventListener('click', () => {
        loadingManager.startGame();
    });
    
    simulateLoading();
}

function simulateLoading() {
    const steps = [
        { progress: 15, status: 'Carregando recursos...', delay: 400 },
        { progress: 35, status: 'Inicializando gráficos...', delay: 500 },
        { progress: 55, status: 'Construindo mundo 3D...', delay: 600 },
        { progress: 75, status: 'Carregando personagem...', delay: 700 },
        { progress: 90, status: 'Finalizando...', delay: 500 },
        { progress: 100, status: 'Pronto!', delay: 300 }
    ];
    
    let current = 0;
    
    function next() {
        if (current >= steps.length) {
            // Carregar Three.js em paralelo
            startThreeJS();
            return;
        }
        const step = steps[current];
        setTimeout(() => {
            loadingManager.update(step.progress, step.status);
            current++;
            next();
        }, step.delay);
    }
    
    next();
}

function startThreeJS() {
    createScene();
    createCamera();
    createRenderer();
    createLighting();
    createGround();
    setupInput();
    
    if (state.isTouchDevice) setupJoystick();
    
    loadCharacter();
    animate();
    
    window.addEventListener('resize', onWindowResize);
    
    // Quando personagem carregar, mostrar botão
    const check = setInterval(() => {
        if (state.isLoaded) {
            clearInterval(check);
            loadingManager.showStartButton();
        }
    }, 100);
}

// ============================================
// THREE.JS
// ============================================

function createScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x1a1a2e);
    state.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
}

function createCamera() {
    state.camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    state.camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
}

function createRenderer() {
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.getElementById('canvas-container').appendChild(state.renderer.domElement);
}

function createLighting() {
    const ambient = new THREE.AmbientLight(0x404040, 0.6);
    state.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xffffff, 1.2);
    sun.position.set(1, 1, 1);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    state.scene.add(sun);
    
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3);
    fill.position.set(-10, 10, -10);
    state.scene.add(fill);
}

function createGround() {
    const geo = new THREE.PlaneGeometry(100, 100);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a3e,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    const grid = new THREE.GridHelper(100, 100, 0x444466, 0x2a2a3e);
    
    state.scene.add(ground);
    state.scene.add(grid);
}

// ============================================
// PERSONAGEM
// ============================================

function loadCharacter() {
    const loader = new GLTFLoader();
    loader.load(
        'assets/anny.glb',
        (gltf) => {
            state.character = gltf.scene;
            state.character.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });
            state.character.position.set(1, 1, 1);
            state.scene.add(state.character);
            
            if (gltf.animations?.length) {
                state.mixer = new THREE.AnimationMixer(state.character);
                state.mixer.clipAction(gltf.animations[0]).play();
            }
            
            state.isLoaded = true;
        },
        undefined,
        (error) => {
            console.log('Erro ao carregar, usando placeholder');
            createPlaceholder();
            state.isLoaded = true;
        }
    );
}

function createPlaceholder() {
    state.character = new THREE.Group();
    
    const bodyMat = new THREE.MeshStandardMaterial({ 
        color: 0x00d4ff,
        roughness: 0.3,
        metalness: 0.5
    });
    
    const body = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.5, 1.5, 4, 8),
        bodyMat
    );
    body.position.y = 1.25;
    body.castShadow = true;
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4 , 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.5 })
    );
    head.position.y = 2.4;
    head.castShadow = true;
    
    state.character.add(body);
    state.character.add(head);
    state.scene.add(state.character);
}

// ============================================
// CONTROLES
// ============================================

function setupInput() {
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (state.keys.hasOwnProperty(k)) state.keys[k] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (state.keys.hasOwnProperty(k)) state.keys[k] = false;
    });
}

function setupJoystick() {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');
    
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        
        state.joystick.active = true;
        state.joystick.originX = rect.left + rect.width / 2;
        state.joystick.originY = rect.top + rect.height / 2;
        state.joystick.currentX = touch.clientX;
        state.joystick.currentY = touch.clientY;
        
        knob.classList.add('active');
        updateJoystick(knob);
    }, { passive: false });
    
    window.addEventListener('touchmove', (e) => {
        if (!state.joystick.active) return;
        
        for (let t of e.touches) {
            const rect = container.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            
            if (Math.hypot(t.clientX - cx, t.clientY - cy) < 100) {
                state.joystick.currentX = t.clientX;
                state.joystick.currentY = t.clientY;
                updateJoystick(knob);
                break;
            }
        }
    }, { passive: false });
    
    window.addEventListener('touchend', () => {
        if (!state.joystick.active) return;
        state.joystick.active = false;
        state.joystick.vector.set(0, 0);
        knob.classList.remove('active');
        knob.style.transform = `translate(-50%, -50%)`;
    });
}

function updateJoystick(knob) {
    const dx = state.joystick.currentX - state.joystick.originX;
    const dy = state.joystick.currentY - state.joystick.originY;
    const dist = Math.hypot(dx, dy);
    const max = CONFIG.joystickMaxRadius;
    const clamped = Math.min(dist, max);
    const angle = Math.atan2(dy, dx);
    
    const x = Math.cos(angle) * clamped;
    const y = Math.sin(angle) * clamped;
    
    knob.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    state.joystick.vector.set(x / max, y / max);
}

// ============================================
// GAME LOOP
// ============================================

function updateMovement() {
    if (!state.character || !state.isLoaded || !state.gameStarted) return;
    
    const dir = new THREE.Vector3();
    
    if (state.keys.w) dir.z -= 1;
    if (state.keys.s) dir.z += 1;
    if (state.keys.a) dir.x -= 1;
    if (state.keys.d) dir.x += 1;
    
    if (state.joystick.active && state.joystick.vector.length() > 0.1) {
        dir.x = state.joystick.vector.x;
        dir.z = state.joystick.vector.y;
    }
    
    if (dir.length() > 0) {
        dir.normalize();
        
        const targetRot = Math.atan2(dir.x, dir.z);
        let diff = targetRot - state.character.rotation.y;
        
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        state.character.rotation.y += diff * CONFIG.rotationSpeed;
        
        const move = dir.multiplyScalar(CONFIG.moveSpeed);
        state.character.position.add(move);
    }
}

function updateCamera() {
    if (!state.character) return;
    
    const pos = state.character.position.clone();
    const offset = new THREE.Vector3(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    offset.applyAxisAngle(new THREE.Vector3(0, 0, 0), state.character.rotation.y);
    
    const target = pos.clone().add(offset);
    state.camera.position.lerp(target, CONFIG.cameraSmoothness);
    state.camera.lookAt(pos.x, pos.y + 1.5, pos.z);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (state.mixer) state.mixer.update(0.016);
    
    updateMovement();
    updateCamera();
    
    state.renderer.render(state.scene, state.camera);
}

function onWindowResize() {
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// START
// ============================================

document.addEventListener('DOMContentLoaded', init);