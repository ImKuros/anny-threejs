// ============================================
// ANNY 3D - Three.js Character Controller
// ============================================
// Projeto vanilla JavaScript + Three.js via CDN
// Sem Node.js, sem build tools, sem frameworks

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================
// CONFIGURAÇÕES GLOBAIS
// ============================================

const CONFIG = {
    // Velocidade de movimento do personagem
    moveSpeed: 0.1,
    
    // Velocidade de rotação (interpolação suave)
    rotationSpeed: 0.15,
    
    // Altura da câmera em relação ao personagem
    cameraHeight: 3,
    
    // Distância da câmera atrás do personagem
    cameraDistance: 5,
    
    // Suavidade do follow da câmera (0-1, menor = mais suave)
    cameraSmoothness: 0.1,
    
    // Cor do chão
    groundColor: 0x2a2a3e,
    
    // Cor da iluminação ambiente
    ambientColor: 0x404040,
    
    // Cor da luz direcional (sol)
    sunColor: 0xffffff,
    
    // Intensidade da luz ambiente
    ambientIntensity: 0.6,
    
    // Intensidade da luz direcional
    sunIntensity: 1.2
};

// ============================================
// ESTADO DO JOGO
// ============================================

const state = {
    // Teclas pressionadas
    keys: {
        w: false,
        a: false,
        s: false,
        d: false
    },
    
    // Referências aos objetos Three.js
    scene: null,
    camera: null,
    renderer: null,
    character: null,
    mixer: null,
    
    // Controles
    controls: null,
    
    // Vetor de movimento calculado
    moveDirection: new THREE.Vector3(),
    
    // Posição alvo da câmera (para suavização)
    targetCameraPosition: new THREE.Vector3(),
    
    // Flag para verificar se modelo foi carregado
    isLoaded: false
};

// ============================================
// INICIALIZAÇÃO
// ============================================

function init() {
    // Criar cena
    createScene();
    
    // Criar câmera
    createCamera();
    
    // Criar renderer
    createRenderer();
    
    // Criar iluminação
    createLighting();
    
    // Criar chão
    createGround();
    
    // Carregar personagem Anny
    loadCharacter();
    
    // Configurar controles de input
    setupInput();
    
    // Iniciar loop de animação
    animate();
    
    // Handle resize da janela
    window.addEventListener('resize', onWindowResize);
}

// ============================================
// CENA
// ============================================

function createScene() {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x1a1a2e);
    state.scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
}

// ============================================
// CÂMERA
// ============================================

function createCamera() {
    state.camera = new THREE.PerspectiveCamera(
        75, // FOV
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near plane
        1000 // Far plane
    );
    
    // Posição inicial
    state.camera.position.set(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
}

// ============================================
// RENDERER
// ============================================

function createRenderer() {
    state.renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: false 
    });
    
    state.renderer.setSize(window.innerWidth, window.innerHeight);
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    state.renderer.shadowMap.enabled = true;
    state.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    document.getElementById('canvas-container').appendChild(state.renderer.domElement);
}

// ============================================
// ILUMINAÇÃO
// ============================================

function createLighting() {
    // Luz ambiente - iluminação base suave
    const ambientLight = new THREE.AmbientLight(
        CONFIG.ambientColor, 
        CONFIG.ambientIntensity
    );
    state.scene.add(ambientLight);
    
    // Luz direcional (sol) - cria sombras
    const sunLight = new THREE.DirectionalLight(
        CONFIG.sunColor, 
        CONFIG.sunIntensity
    );
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    
    // Configurar sombras
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    
    state.scene.add(sunLight);
    
    // Luz de preenchimento para suavizar sombras
    const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
    fillLight.position.set(-10, 10, -10);
    state.scene.add(fillLight);
}

// ============================================
// CHÃO
// ============================================

function createGround() {
    const geometry = new THREE.PlaneGeometry(100, 100);
    const material = new THREE.MeshStandardMaterial({ 
        color: CONFIG.groundColor,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2; // Rotacionar para ficar plano
    ground.receiveShadow = true;
    
    // Grid helper para referência visual
    const gridHelper = new THREE.GridHelper(100, 100, 0x444466, 0x2a2a3e);
    
    state.scene.add(ground);
    state.scene.add(gridHelper);
}

// ============================================
// CARREGAR PERSONAGEM
// ============================================

function loadCharacter() {
    const loader = new GLTFLoader();
    
    loader.load(
        'assets/anny.glb',
        onCharacterLoad,
        onLoadProgress,
        onLoadError
    );
}

function onCharacterLoad(gltf) {
    state.character = gltf.scene;
    
    // Configurar sombras para todos os meshes do personagem
    state.character.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    
    // Posicionar personagem no centro
    state.character.position.set(0, 0, 0);
    
    // Ajustar escala se necessário (ajuste conforme seu modelo)
    state.character.scale.set(1, 1, 1);
    
    // Adicionar à cena
    state.scene.add(state.character);
    
    // Configurar animações se existirem
    if (gltf.animations && gltf.animations.length > 0) {
        state.mixer = new THREE.AnimationMixer(state.character);
        
        // Tocar primeira animação (geralmente idle/walk)
        const action = state.mixer.clipAction(gltf.animations[0]);
        action.play();
    }
    
    // Esconder loading e mostrar UI
    document.getElementById('loading').style.display = 'none';
    document.getElementById('ui').style.display = 'block';
    
    state.isLoaded = true;
    console.log('✅ Anny carregada com sucesso!');
}

function onLoadProgress(xhr) {
    const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
    console.log(`⏳ Carregando: ${percent}%`);
}

function onLoadError(error) {
    console.error('❌ Erro ao carregar Anny:', error);
    
    // Criar personagem placeholder em caso de erro
    createPlaceholderCharacter();
    
    document.getElementById('loading').innerHTML = `
        <p style="color: #ff6666;">Erro ao carregar modelo</p>
        <p style="font-size: 14px; color: #888;">Usando modelo placeholder</p>
    `;
    
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('ui').style.display = 'block';
    }, 1500);
}

// ============================================
// PERSONAGEM PLACEHOLDER (Fallback)
// ============================================

function createPlaceholderCharacter() {
    // Criar um grupo para o personagem
    state.character = new THREE.Group();
    
    // Corpo (cápsula)
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x00d4ff,
        roughness: 0.3,
        metalness: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.25;
    body.castShadow = true;
    
    // Cabeça (esfera)
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffdbac,
        roughness: 0.5 
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 2.4;
    head.castShadow = true;
    
    // Olhos
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.15, 2.45, 0.35);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.15, 2.45, 0.35);
    
    // Adicionar partes ao grupo
    state.character.add(body);
    state.character.add(head);
    state.character.add(leftEye);
    state.character.add(rightEye);
    
    state.scene.add(state.character);
    state.isLoaded = true;
}

// ============================================
// INPUT / CONTROLES
// ============================================

function setupInput() {
    // Keyboard events
    window.addEventListener('keydown', (event) => {
        const key = event.key.toLowerCase();
        if (state.keys.hasOwnProperty(key)) {
            state.keys[key] = true;
        }
    });
    
    window.addEventListener('keyup', (event) => {
        const key = event.key.toLowerCase();
        if (state.keys.hasOwnProperty(key)) {
            state.keys[key] = false;
        }
    });
}

// ============================================
// ATUALIZAÇÃO DO MOVIMENTO
// ============================================

function updateMovement() {
    if (!state.character || !state.isLoaded) return;
    
    // Resetar direção
    state.moveDirection.set(0, 0, 0);
    
    // Calcular vetor de movimento baseado nas teclas
    if (state.keys.w) state.moveDirection.z -= 1;
    if (state.keys.s) state.moveDirection.z += 1;
    if (state.keys.a) state.moveDirection.x -= 1;
    if (state.keys.d) state.moveDirection.x += 1;
    
    // Normalizar para movimento diagonal não ser mais rápido
    if (state.moveDirection.length() > 0) {
        state.moveDirection.normalize();
        
        // Rotacionar personagem na direção do movimento
        const targetRotation = Math.atan2(
            state.moveDirection.x, 
            state.moveDirection.z
        );
        
        // Interpolação suave da rotação (Lerp)
        const currentRotation = state.character.rotation.y;
        let rotationDiff = targetRotation - currentRotation;
        
        // Ajustar para rotação mais curta
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        state.character.rotation.y += rotationDiff * CONFIG.rotationSpeed;
        
        // Mover personagem
        const moveStep = state.moveDirection.clone().multiplyScalar(CONFIG.moveSpeed);
        state.character.position.add(moveStep);
        
        // Atualizar animação se existir mixer
        if (state.mixer) {
            // Aqui você pode alternar entre animações de walk/idle
            // Por simplicidade, mantemos a animação atual
        }
    }
}

// ============================================
// ATUALIZAÇÃO DA CÂMERA (Third Person)
// ============================================

function updateCamera() {
    if (!state.character || !state.isLoaded) return;
    
    // Calcular posição ideal da câmera atrás do personagem
    const characterPos = state.character.position.clone();
    
    // Offset da câmera (atrás e acima)
    const offset = new THREE.Vector3(0, CONFIG.cameraHeight, CONFIG.cameraDistance);
    
    // Aplicar rotação do personagem ao offset (câmera segue por trás)
    offset.applyAxisAngle(new THREE.Vector3(0, 0, 0), state.character.rotation.y);
    
    // Posição alvo da câmera
    state.targetCameraPosition.copy(characterPos).add(offset);
    
    // Suavizar movimento da câmera (Lerp)
    state.camera.position.lerp(state.targetCameraPosition, CONFIG.cameraSmoothness);
    
    // Olhar para o personagem
    state.camera.lookAt(
        characterPos.x,
        characterPos.y + 1.5, // Olhar para a altura do peito/cabeça
        characterPos.z
    );
}

// ============================================
// LOOP PRINCIPAL
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    // Atualizar mixer de animação
    if (state.mixer) {
        state.mixer.update(0.016); // ~60fps
    }
    
    // Atualizar movimento do personagem
    updateMovement();
    
    // Atualizar posição da câmera
    updateCamera();
    
    // Renderizar cena
    state.renderer.render(state.scene, state.camera);
}

// ============================================
// UTILITÁRIOS
// ============================================

function onWindowResize() {
    // Atualizar aspect ratio da câmera
    state.camera.aspect = window.innerWidth / window.innerHeight;
    state.camera.updateProjectionMatrix();
    
    // Atualizar tamanho do renderer
    state.renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// INICIAR APLICAÇÃO
// ============================================

// Aguardar DOM carregar
document.addEventListener('DOMContentLoaded', init);