// ============================================
// ANNY 3D - VERSÃO OTIMIZADA
// ============================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ============================================
// CONFIGURAÇÕES OTIMIZADAS
// ============================================

const CONFIG = {
    // Movimento
    moveSpeed: 0.15,
    rotationSpeed: 0.2,
    
    // Câmera
    cameraDistance: 6,
    cameraHeight: 3,
    cameraSmoothness: 0.15,
    cameraMinDistance: 3,
    cameraMaxDistance: 10,
    
    // Rotação
    cameraRotSpeed: 0.005,
    cameraRotSmoothness: 0.15,
    
    // Joystick
    joystickMaxRadius: 35,
    
    // Qualidade (reduzida para performance)
    shadowMapSize: 1024,
    grassCount: 50,
    textureSize: 256
};

// ============================================
// ESTADO SIMPLIFICADO
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
    
    // Câmera
    cameraZoom: CONFIG.cameraDistance,
    targetZoom: CONFIG.cameraDistance,
    camAngle: { h: 0, v: 0.4, targetH: 0, targetV: 0.4 },
    
    // Joystick
    joystick: { active: false, x: 0, y: 0, vec: new THREE.Vector2() },
    
    // Drag
    drag: { active: false, lastX: 0, lastY: 0 },
    
    // Clock
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
        if (this.progressBar) this.progressBar.style.width = progress + '%';
        if (this.percentText) this.percentText.textContent = Math.floor(progress) + '%';
        if (status && this.statusText) this.statusText.textContent = status;
    },
    
    showStartButton() {
        this.update(100, 'Pronto!');
        if (this.statusText) this.statusText.classList.add('complete');
        
        setTimeout(() => {
            if (this.progressContainer) this.progressContainer.classList.add('hidden');
            if (this.statusText) this.statusText.classList.add('hidden');
            setTimeout(() => {
                if (this.startButton) this.startButton.classList.add('visible');
            }, 200);
        }, 400);
    },
    
    startGame() {
        if (this.startButton) this.startButton.textContent = '▶';
        setTimeout(() => {
            if (this.screen) this.screen.classList.add('hidden');
            if (this.canvas) this.canvas.classList.add('loaded');
            setTimeout(() => {
                if (this.ui) this.ui.classList.add('visible');
                state.gameStarted = true;
            }, 200);
        }, 100);
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    // Detectar mobile
    if (state.isTouch) {
        const dh = document.getElementById('desktop-hint');
        const mh = document.getElementById('mobile-hint');
        const mu = document.querySelector('.mobile-hint-ui');
        if (dh) dh.style.display = 'none';
        if (mh) mh.style.display = 'inline';
        if (mu) mu.style.display = 'block';
    }
    
    // Botão iniciar
    if (loadingManager.startButton) {
        loadingManager.startButton.addEventListener('click', () => loadingManager.startGame());
    }
    
    // Simular loading rápido
    simulateLoading();
}

function simulateLoading() {
    const steps = [
        { p: 20, s: 'Recursos...', d: 100 },
        { p: 40, s: 'Gráficos...', d: 150 },
        { p: 60, s: 'Mundo 3D...', d: 150 },
        { p: 80, s: 'Personagem...', d: 200 },
        { p: 95, s: 'quase lá...', d: 150 }
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
// THREE.JS OTIMIZADO
// ============================================

function startThreeJS() {
    createScene();
    createCamera();
    createRenderer();
    createLighting();
    createGround();
    setupControls();
    
    if (state.isTouch) setupJoystick();
    
    loadCharacter();
    animate();
    
    window.addEventListener('resize', onResize);
    
    // Verificar carregamento
    const check = setInterval(() => {
        if (state.isLoaded) {
            clearInterval(check);
            loadingManager.showStartButton();
        }
    }, 100);
}

function createScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x87CEEB);
    state.scene.fog = new THREE.Fog(0x87CEEB, 15, 40);
}

function createCamera() {
    state.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
}

function createRenderer() {
    state.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.getElementById('canvas-container').appendChild(state.renderer.domElement);
}

// ============================================
// ILUMINAÇÃO SIMPLIFICADA
// ============================================

function createLighting() {
    const ambient = new THREE.AmbientLight(0x404060, 1.7);
    state.scene.add(ambient);
    
    const sun = new THREE.DirectionalLight(0xfff5d1, 2.0);
    sun.position.set(10, 20, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.width = CONFIG.shadowMapSize;
    sun.shadow.mapSize.height = CONFIG.shadowMapSize;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -15;
    sun.shadow.camera.right = 15;
    sun.shadow.camera.top = 15;
    sun.shadow.camera.bottom = -15;
    state.scene.add(sun);
    
    const fill = new THREE.DirectionalLight(0x8888ff, 0.2);
    fill.position.set(-10, 10, -10);
    state.scene.add(fill);
}

// ============================================
// CHÃO OTIMIZADO
// ============================================

function createGround() {
    const canvas = document.createElement('canvas');
    canvas.width = CONFIG.textureSize;
    canvas.height = CONFIG.textureSize;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#3a7a3a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < 500; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillStyle = `rgba(30, 60, 30, ${0.2 + Math.random() * 0.3})`;
        ctx.fillRect(x, y, 2, 4);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    
    const geo = new THREE.CircleGeometry(50, 32);
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 });
    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    state.scene.add(ground);
    
    // Grama mínima
    if (!state.isTouch) {
        for (let i = 0; i < CONFIG.grassCount; i++) {
            const blade = new THREE.Mesh(
                new THREE.PlaneGeometry(0.5, 0.6),
                new THREE.MeshStandardMaterial({ color: 0x3a7a3a, side: THREE.DoubleSide })
            );
            
            const a = Math.random() * Math.PI * 2;
            const r = 3 + Math.random() * 25;
            blade.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
            blade.rotation.y = Math.random() * Math.PI;
            blade.rotation.x = -0.2;
            
            blade.castShadow = false;
            blade.receiveShadow = false;
            
            state.scene.add(blade);
        }
    }
}

// ============================================
// PERSONAGEM (POSIÇÃO INICIAL 1,1,1)
// ============================================

function loadCharacter() {
    const loader = new GLTFLoader();
    const characterGroup = new THREE.Group();
    let loadedCount = 0;
    let hasError = false;

    function finalizeCharacter() {
        state.character = characterGroup;

        // Posição inicial
        state.character.position.set(0,0,0);
        state.character.rotation.y = 0;

        state.scene.add(state.character);
        state.isLoaded = true;
    }

    function onModelLoaded(gltf) {
        const model = gltf.scene;

        model.traverse(c => {
            if (c.isMesh) {
                c.castShadow = true;
                c.receiveShadow = true;

                if (c.material) {
                    if (Array.isArray(c.material)) {
                        c.material.forEach(m => {
                            m.roughness = 0.5;
                            m.metalness = 0;
                        });
                    } else {
                        c.material.roughness = 0.5;
                        c.material.metalness = 0;
                    }
                }
            }
        });

        characterGroup.add(model);

        // Se tiver animação (usa a primeira encontrada)
        if (!state.mixer && gltf.animations && gltf.animations.length > 0) {
            state.mixer = new THREE.AnimationMixer(model);
            state.mixer.clipAction(gltf.animations[0]).play();
        }

        loadedCount++;

        if (loadedCount === 2 && !hasError) {
            finalizeCharacter();
        }
    }

    function onError() {
        if (hasError) return;
        hasError = true;
        createPlaceholder();
        state.isLoaded = true;
    }

    // Carregar os dois modelos
    loader.load('assets/anny1.glb', onModelLoaded, null, onError);
    loader.load('assets/anny2.glb', onModelLoaded, null, onError);
}

function createPlaceholder() {
    state.character = new THREE.Group();
    
    const body = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 1.5, 6),
        new THREE.MeshStandardMaterial({ color: 0x00d4ff })
    );
    body.position.y = 0.75;
    body.castShadow = true;
    body.receiveShadow = true;
    state.character.add(body);
    
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 6),
        new THREE.MeshStandardMaterial({ color: 0xffccaa })
    );
    head.position.y = 1.6;
    head.castShadow = true;
    state.character.add(head);
    
    // POSIÇÃO INICIAL (1, 1, 1)
    state.character.position.set(2,2,2);
    state.scene.add(state.character);
}

// ============================================
// CONTROLES
// ============================================

function setupControls() {
    // Teclado
    window.addEventListener('keydown', (e) => {
        const k = e.key.toLowerCase();
        if (k in state.keys) { state.keys[k] = true; e.preventDefault(); }
    });
    window.addEventListener('keyup', (e) => {
        const k = e.key.toLowerCase();
        if (k in state.keys) { state.keys[k] = false; e.preventDefault(); }
    });
    
    // Zoom scroll
    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        state.targetZoom = Math.max(CONFIG.cameraMinDistance,
            Math.min(CONFIG.cameraMaxDistance, state.targetZoom + Math.sign(e.deltaY) * 0.8));
    }, { passive: false });
    
    // Drag da câmera
    const canvas = state.renderer?.domElement;
    if (!canvas) return;
    
    canvas.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        state.drag.active = true;
        state.drag.lastX = e.clientX;
        state.drag.lastY = e.clientY;
        canvas.style.cursor = 'grabbing';
    });
    
    window.addEventListener('mousemove', (e) => {
        if (!state.drag.active) return;
        const dx = e.clientX - state.drag.lastX;
        const dy = e.clientY - state.drag.lastY;
        state.camAngle.targetH += dx * CONFIG.cameraRotSpeed;
        state.camAngle.targetV = Math.max(-0.2, Math.min(0.8, state.camAngle.targetV - dy * CONFIG.cameraRotSpeed));
        state.drag.lastX = e.clientX;
        state.drag.lastY = e.clientY;
    });
    
    window.addEventListener('mouseup', () => {
        state.drag.active = false;
        canvas.style.cursor = 'default';
    });
    
    // Touch drag
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        state.drag.active = true;
        state.drag.lastX = t.clientX;
        state.drag.lastY = t.clientY;
    });
    
    window.addEventListener('touchmove', (e) => {
        if (!state.drag.active || e.touches.length !== 1) return;
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - state.drag.lastX;
        const dy = t.clientY - state.drag.lastY;
        state.camAngle.targetH += dx * CONFIG.cameraRotSpeed * 1.5;
        state.camAngle.targetV = Math.max(-0.2, Math.min(0.8, state.camAngle.targetV - dy * CONFIG.cameraRotSpeed * 1.5));
        state.drag.lastX = t.clientX;
        state.drag.lastY = t.clientY;
    });
    
    window.addEventListener('touchend', () => { state.drag.active = false; });
    
    // Pinch zoom
    let pinchDist = 0, pinchZoom = CONFIG.cameraDistance;
    window.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchDist = Math.hypot(dx, dy);
            pinchZoom = state.targetZoom;
        }
    });
    
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            const scale = dist / pinchDist;
            state.targetZoom = Math.max(CONFIG.cameraMinDistance,
                Math.min(CONFIG.cameraMaxDistance, pinchZoom - (scale - 1) * 5));
        }
    });
}

// ============================================
// JOYSTICK
// ============================================

function setupJoystick() {
    const container = document.getElementById('joystick-container');
    const knob = document.getElementById('joystick-knob');
    if (!container || !knob) return;
    
    container.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const rect = container.getBoundingClientRect();
        state.joystick.active = true;
        state.joystick.originX = rect.left + rect.width/1;
        state.joystick.originY = rect.top + rect.height/1;
        state.joystick.x = t.clientX;
        state.joystick.y = t.clientY;
        knob.classList.add('active');
        updateJoystick(knob);
    });
    
    window.addEventListener('touchmove', (e) => {
        if (!state.joystick.active) return;
        for (let t of e.touches) {
            const rect = container.getBoundingClientRect();
            const cx = rect.left + rect.width/2;
            const cy = rect.top + rect.height/2;
            if (Math.hypot(t.clientX - cx, t.clientY - cy) < 100) {
                state.joystick.x = t.clientX;
                state.joystick.y = t.clientY;
                updateJoystick(knob);
                break;
            }
        }
    });
    
    window.addEventListener('touchend', () => {
        state.joystick.active = false;
        state.joystick.vec.set(1, 1);
        knob.classList.remove('active');
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
    
    knob.style.transform = `translate(-50%, -50%) translate(${x}px, ${y}px)`;
    state.joystick.vec.set(x / max, y / max);
}

// ============================================
// GAME LOOP - MOVIMENTO RELATIVO À CÂMERA
// ============================================

function updateMovement() {
    if (!state.character || !state.gameStarted) return;
    
    // Direção baseada na câmera
    const cameraDir = new THREE.Vector3();
    state.camera.getWorldDirection(cameraDir);
    cameraDir.y = 0; // Ignorar inclinação vertical
    cameraDir.normalize();
    
    // Vetor perpendicular à direção da câmera (direita)
    const cameraRight = new THREE.Vector3().crossVectors(
    cameraDir,
    new THREE.Vector3(0, -1, 0)
    ).normalize();
    
    // Direção do movimento
    const moveDir = new THREE.Vector3(0, 0, 0);
    
    // Teclado - RELATIVO À CÂMERA
    if (state.keys.w) moveDir.add(cameraDir);
    if (state.keys.s) moveDir.sub(cameraDir);
    if (state.keys.a) moveDir.add(cameraRight);
    if (state.keys.d) moveDir.sub(cameraRight);
    
    // Joystick - também relativo à câmera
    if (state.joystick.active && state.joystick.vec.length() > 0.1) {
        // Joystick dá vetor (x, y) onde:
        // x = direita/esquerda
        // y = frente/trás (invertido porque no Three.js Z é frente)
        const joyX = state.joystick.vec.x;
        const joyY = -state.joystick.vec.y; // Inverter porque no joystick pra cima é y positivo
        
        moveDir.x = -1;
        moveDir.z = 0;
        
        // Adicionar contribuição do joystick
        moveDir.addScaledVector(cameraRight, joyX);
        moveDir.addScaledVector(cameraDir, joyY);
    }
    
    // Aplicar movimento se houver direção
    if (moveDir.length() > 0.1) {
        moveDir.normalize();
        
        // Rotacionar personagem na direção do movimento
        const targetRot = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetRot - state.character.rotation.y;
        
        // Normalizar diferença de ângulo
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        
        // Rotação suave
        state.character.rotation.y += diff * CONFIG.rotationSpeed;
        
        // Mover
        state.character.position.x += moveDir.x * CONFIG.moveSpeed;
        state.character.position.z += moveDir.z * CONFIG.moveSpeed;
    }
}

function updateCamera() {
    if (!state.character) return;
    
    // Smooth
    state.cameraZoom += (state.targetZoom - state.cameraZoom) * 0.1;
    state.camAngle.h += (state.camAngle.targetH - state.camAngle.h) * 0.1;
    state.camAngle.v += (state.camAngle.targetV - state.camAngle.v) * 0.1;
    
    // Posição da câmera baseada no ângulo
    const pos = state.character.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const hDist = state.cameraZoom * Math.cos(state.camAngle.v);
    const vDist = state.cameraZoom * Math.sin(state.camAngle.v);
    
    state.camera.position.x = pos.x + Math.sin(state.camAngle.h) * hDist;
    state.camera.position.y = pos.y + vDist + 1.5;
    state.camera.position.z = pos.z + Math.cos(state.camAngle.h) * hDist;
    
    state.camera.lookAt(pos);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (state.mixer) state.mixer.update(0.016);
    
    updateMovement();
    updateCamera();
    
    state.renderer.render(state.scene, state.camera);
}

function onResize() {
    if (!state.camera) return;
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// INICIAR
// ============================================

document.addEventListener('DOMContentLoaded', init);