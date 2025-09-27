import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let audio = null;
let allImagesLoaded = false;

// Khởi tạo scene, camera và renderer
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = true;
controls.autoRotateSpeed = 0.2;
controls.autoRotate = false;
controls.target.set(0, 0, 0);
controls.enableZoom = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

// Hàm tạo material phát sáng cho glow trung tâm và nebula
function createGlowMaterial(color, size = 128, opacity = 0.55) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    return new THREE.Sprite(spriteMaterial);
}

// Thêm central glow
const centralGlow = createGlowMaterial('#ffb3de', 156, 0.25);
centralGlow.scale.set(8, 8, 1);
scene.add(centralGlow);

// Tham số thiên hà
let galaxyParameters = {
    count: window.innerWidth < 768 ? 50000 : 200000,
    arms: 8,
    radius: 600,
    spin: 0.5,
    randomness: 0.25,
    randomnessPower: 25,
    insideColor: new THREE.Color(0xd63ed6),
    outsideColor: new THREE.Color(0x48b8b8)
};
let galaxy = null;

// Giải mã Base64 Unicode
function decodeBase64Unicode(str) {
    try {
        return decodeURIComponent(
            atob(str)
                .split('')
                .map(char => '%' + ('00' + char.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
    } catch (e) {
        console.error('Lỗi giải mã Base64:', e);
        return '';
    }
}

// Lấy ảnh từ URL params
function getHeartImagesFromURL() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        const decoded = decodeBase64Unicode(id);
        return decoded.split(',').map(url => url.trim()).filter(Boolean);
    }
    return [
        './assets/image/att.23Fj-zvoa_dUvrjezIWzqn9OUWxZE5JjUYKwfvFew90.jpg',
        './assets/image/att.GyMuWTJngW6qTHSdSXlASpNbimSv4hkjEzhUimlkEHc.jpg',
        './assets/image/att.lM_8Nt8_8sZY0NTtGjzUsMMGB64ZDBwMNgLyk-24bgk.jpg',
        './assets/image/att.mSkkU3juKwg-KgzzLIiwkjaCGdsrbrLQnSv_NdOiFio.jpg',
        './assets/image/att.w2FtmV4QsYYx-kLXXfTi3uzdVmyWF8NUu6i42lPP5Uc.jpg',
        './assets/image/IMG_0076.JPG',
        './assets/image/IMG_0100.JPG',
        './assets/image/IMG_0101.JPG',
        './assets/image/IMG_0103.JPG',
        './assets/image/IMG_0175.JPG',
        './assets/image/IMG_0176.JPG',
        './assets/image/IMG_0191.JPG',
        './assets/image/IMG_0192.JPG',
        './assets/image/IMG_0193.JPG',
        './assets/image/IMG_0194.JPG',
        './assets/image/IMG_0195.JPG',
        './assets/image/IMG_0196.JPG',
        './assets/image/IMG_0197.JPG',
        './assets/image/IMG_0198.JPG',
        './assets/image/IMG_0199.JPG',
        './assets/image/IMG_0200.JPG',
        './assets/image/IMG_0201.JPG',
        './assets/image/IMG_0202.JPG',
        './assets/image/IMG_0203.JPG',
        './assets/image/IMG_0204.JPG',
    ];
}

// Quản lý danh sách ảnh
let heartImages = getHeartImagesFromURL();
const textureLoader = new THREE.TextureLoader();
let heartPointClouds = [];

// Tạo texture neon
function createNeonTexture(image, size) {
    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size * pixelRatio;
    canvas.style.width = canvas.style.height = `${size}px`;
    const context = canvas.getContext('2d');
    context.scale(pixelRatio, pixelRatio);

    const aspect = image.width / image.height;
    let drawWidth, drawHeight, offsetX, offsetY;
    if (aspect > 1) {
        drawWidth = size;
        drawHeight = size / aspect;
        offsetX = 0;
        offsetY = (size - drawHeight) / 2;
    } else {
        drawHeight = size;
        drawWidth = size * aspect;
        offsetX = (size - drawWidth) / 2;
        offsetY = 0;
    }

    context.clearRect(0, 0, size, size);
    const cornerRadius = size * 0.1;
    context.save();
    context.beginPath();
    context.moveTo(offsetX + cornerRadius, offsetY);
    context.lineTo(offsetX + drawWidth - cornerRadius, offsetY);
    context.arcTo(offsetX + drawWidth, offsetY, offsetX + drawWidth, offsetY + cornerRadius, cornerRadius);
    context.lineTo(offsetX + drawWidth, offsetY + drawHeight - cornerRadius);
    context.arcTo(offsetX + drawWidth, offsetY + drawHeight, offsetX + drawWidth - cornerRadius, offsetY + drawHeight, cornerRadius);
    context.lineTo(offsetX + cornerRadius, offsetY + drawHeight);
    context.arcTo(offsetX, offsetY + drawHeight, offsetX, offsetY + drawHeight - cornerRadius, cornerRadius);
    context.lineTo(offsetX, offsetY + cornerRadius);
    context.arcTo(offsetX, offsetY, offsetX + cornerRadius, offsetY, cornerRadius);
    context.closePath();
    context.clip();
    context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
    context.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = texture.magFilter = THREE.LinearFilter;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Fallback texture
function createFallbackTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, '#ff66ff');
    grad.addColorStop(1, '#66ffff');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    return createNeonTexture(canvas, 256);
}

// Tạo point clouds từ ảnh với kiểm tra tải
function createPointClouds() {
    if (heartImages.length === 0) {
        heartImages = [
            './assets/image/att.23Fj-zvoa_dUvrjezIWzqn9OUWxZE5JjUYKwfvFew90.jpg',
            './assets/image/att.GyMuWTJngW6qTHSdSXlASpNbimSv4hkjEzhUimlkEHc.jpg',
            './assets/image/att.lM_8Nt8_8sZY0NTtGjzUsMMGB64ZDBwMNgLyk-24bgk.jpg',
            './assets/image/att.mSkkU3juKwg-KgzzLIiwkjaCGdsrbrLQnSv_NdOiFio.jpg',
            './assets/image/att.w2FtmV4QsYYx-kLXXfTi3uzdVmyWF8NUu6i42lPP5Uc.jpg',
            './assets/image/IMG_0076.JPG',
            './assets/image/IMG_0100.JPG',
            './assets/image/IMG_0101.JPG',
            './assets/image/IMG_0103.JPG',
            './assets/image/IMG_0175.JPG',
            './assets/image/IMG_0176.JPG',
            './assets/image/IMG_0191.JPG',
            './assets/image/IMG_0192.JPG',
            './assets/image/IMG_0193.JPG',
            './assets/image/IMG_0194.JPG',
            './assets/image/IMG_0195.JPG',
            './assets/image/IMG_0196.JPG',
            './assets/image/IMG_0197.JPG',
            './assets/image/IMG_0198.JPG',
            './assets/image/IMG_0199.JPG',
            './assets/image/IMG_0200.JPG',
            './assets/image/IMG_0201.JPG',
            './assets/image/IMG_0202.JPG',
            './assets/image/IMG_0203.JPG',
            './assets/image/IMG_0204.JPG',
        ];
        console.log('Không có ảnh nào được cung cấp, sử dụng ảnh mặc định:', heartImages);
    }

    // Xóa cũ
    heartPointClouds.forEach(cloud => scene.remove(cloud));
    heartPointClouds = [];

    const numGroups = heartImages.length || 1;
    const maxDensity = window.innerWidth < 768 ? 5000 : 20000;
    const minDensity = 4000;
    const maxGroupsForScale = 6;
    let pointsPerGroup;
    if (numGroups <= 1) {
        pointsPerGroup = maxDensity;
    } else if (numGroups >= maxGroupsForScale) {
        pointsPerGroup = minDensity;
    } else {
        const t = (numGroups - 1) / (maxGroupsForScale - 1);
        pointsPerGroup = Math.floor(maxDensity * (1 - t) + minDensity * t);
    }
    if (pointsPerGroup * numGroups > galaxyParameters.count) {
        pointsPerGroup = Math.floor(galaxyParameters.count / numGroups);
    }

    console.log(`Số lượng ảnh thiên hà: ${numGroups}, Điểm mỗi ảnh: ${pointsPerGroup}`);

    const loadPromises = [];
    for (let group = 0; group < numGroups; group++) {
        const groupPositions = new Float32Array(pointsPerGroup * 3);
        const groupColorsNear = new Float32Array(pointsPerGroup * 3);
        const groupColorsFar = new Float32Array(pointsPerGroup * 3);
        let validPointCount = 0;

        for (let i = 0; i < pointsPerGroup; i++) {
            const idx = validPointCount * 3;
            const globalIdx = group * pointsPerGroup + i;
            const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
            if (radius < 30) continue;

            const branchAngle = (globalIdx % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
            const spinAngle = radius * galaxyParameters.spin;
            const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
            const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
            const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
            const totalAngle = branchAngle + spinAngle;

            groupPositions[idx] = Math.cos(totalAngle) * radius + randomX;
            groupPositions[idx + 1] = randomY;
            groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

            const colorNear = new THREE.Color(0xffffff);
            groupColorsNear[idx] = colorNear.r;
            groupColorsNear[idx + 1] = colorNear.g;
            groupColorsNear[idx + 2] = colorNear.b;

            const colorFar = galaxyParameters.insideColor.clone();
            colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius);
            colorFar.multiplyScalar(0.7 + 0.3 * Math.random());
            groupColorsFar[idx] = colorFar.r;
            groupColorsFar[idx + 1] = colorFar.g;
            groupColorsFar[idx + 2] = colorFar.b;
            validPointCount++;
        }

        if (validPointCount === 0) continue;

        const groupGeometryNear = new THREE.BufferGeometry();
        groupGeometryNear.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
        groupGeometryNear.setAttribute('color', new THREE.BufferAttribute(groupColorsNear.slice(0, validPointCount * 3), 3));

        const groupGeometryFar = new THREE.BufferGeometry();
        groupGeometryFar.setAttribute('position', new THREE.BufferAttribute(groupPositions.slice(0, validPointCount * 3), 3));
        groupGeometryFar.setAttribute('color', new THREE.BufferAttribute(groupColorsFar.slice(0, validPointCount * 3), 3));

        const posAttr = groupGeometryFar.getAttribute('position');
        let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < posAttr.count; i++) {
            cx += posAttr.getX(i);
            cy += posAttr.getY(i);
            cz += posAttr.getZ(i);
        }
        cx /= posAttr.count;
        cy /= posAttr.count;
        cz /= posAttr.count;
        groupGeometryNear.translate(-cx, -cy, -cz);
        groupGeometryFar.translate(-cx, -cy, -cz);

        const loadPromise = new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = heartImages[group] || '';
            img.onload = () => {
                const texture = createNeonTexture(img, 256);
                const materialNear = new THREE.PointsMaterial({
                    size: 2.0,
                    map: texture,
                    transparent: false,
                    alphaTest: 0.2,
                    depthWrite: true,
                    depthTest: true,
                    blending: THREE.NormalBlending,
                    vertexColors: true
                });
                const materialFar = new THREE.PointsMaterial({
                    size: 2.0,
                    map: texture,
                    transparent: true,
                    alphaTest: 0.2,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    vertexColors: true
                });
                const points = new THREE.Points(groupGeometryFar, materialFar);
                points.position.set(cx, cy, cz);
                points.userData.materialNear = materialNear;
                points.userData.materialFar = materialFar;
                points.userData.geometryNear = groupGeometryNear;
                points.userData.geometryFar = groupGeometryFar;
                scene.add(points);
                heartPointClouds.push(points);
                resolve();
            };
            img.onerror = () => {
                console.error(`Không thể tải ảnh thiên hà: ${heartImages[group] || 'Không có URL'}`);
                const texture = createFallbackTexture();
                const materialNear = new THREE.PointsMaterial({
                    size: 2.0,
                    map: texture,
                    transparent: false,
                    alphaTest: 0.2,
                    depthWrite: true,
                    depthTest: true,
                    blending: THREE.NormalBlending,
                    vertexColors: true
                });
                const materialFar = new THREE.PointsMaterial({
                    size: 2.0,
                    map: texture,
                    transparent: true,
                    alphaTest: 0.2,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending,
                    vertexColors: true
                });
                const points = new THREE.Points(groupGeometryFar, materialFar);
                points.position.set(cx, cy, cz);
                points.userData.materialNear = materialNear;
                points.userData.materialFar = materialFar;
                points.userData.geometryNear = groupGeometryNear;
                points.userData.geometryFar = groupGeometryFar;
                scene.add(points);
                heartPointClouds.push(points);
                resolve();
            };
        });
        loadPromises.push(loadPromise);
    }

    // Đánh dấu tất cả ảnh đã tải khi tất cả promise hoàn thành
    Promise.all(loadPromises).then(() => {
        allImagesLoaded = true;
        console.log('Tất cả ảnh đã được tải xong.');
    });
}

// --- Xử lý form ảnh và âm thanh ---
const imageForm = document.getElementById('image-form');
const imageUrlInput = document.getElementById('image-url');
const imageList = document.getElementById('image-list');
const errorMessage = document.getElementById('error-message');
const toggleFormBtn = document.getElementById('toggle-form-btn');
const musicUrlInput = document.getElementById('music-url');
const addMusicBtn = document.getElementById('add-music-btn');
const toggleAudioBtn = document.getElementById('toggle-audio');
const audioIcon = document.getElementById('audio-icon');

if (toggleFormBtn) {
  toggleFormBtn.addEventListener('click', () => {
    imageForm.style.display = imageForm.style.display === 'none' ? 'block' : 'none';
  });
}

if (imageForm) {
  imageForm.addEventListener('submit', (e) => {
    e.preventDefault();
  });

  document.getElementById('add-img-btn').addEventListener('click', () => {
    const url = imageUrlInput.value.trim();
    if (!url) {
      errorMessage.textContent = 'Vui lòng nhập URL ảnh!';
      return;
    }
    if (!url.match(/\.(jpg|jpeg|png)$/i)) {
      errorMessage.textContent = 'Chỉ hỗ trợ định dạng JPG hoặc PNG!';
      return;
    }
    errorMessage.textContent = '';
    heartImages.push(url);
    imageUrlInput.value = '';

    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = url;
    img.style.width = '50px';
    img.style.height = '50px';
    li.appendChild(img);
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'X';
    deleteBtn.addEventListener('click', () => {
      heartImages.splice(heartImages.indexOf(url), 1);
      li.remove();
      createPointClouds();
    });
    li.appendChild(deleteBtn);
    imageList.appendChild(li);

    createPointClouds();
  });
}

if (addMusicBtn && musicUrlInput) {
  addMusicBtn.addEventListener('click', () => {
    const url = musicUrlInput.value.trim();
    if (!url.match(/\.mp3$/i)) {
      document.getElementById('error-message').textContent = 'Vui lòng nhập URL MP3 hợp lệ!';
      return;
    }
    audio = new Audio(url);
    audio.loop = true;
    document.getElementById('error-message').textContent = '';
    musicUrlInput.value = '';
  });
}

if (toggleAudioBtn) {
  toggleAudioBtn.addEventListener('click', () => {
    if (audio) {
      if (audio.paused) {
        audio.play();
        audioIcon.classList.replace('fa-volume-xmark', 'fa-volume-high');
      } else {
        audio.pause();
        audioIcon.classList.replace('fa-volume-high', 'fa-volume-xmark');
      }
    } else {
      document.getElementById('error-message').textContent = 'Chưa có nhạc được thêm!';
    }
  });
}

// Ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

// Starfield
const starCount = window.innerWidth < 768 ? 5000 : 20000;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 900;
}
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
const starMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    transparent: true,
    opacity: 0.7,
    depthWrite: false
});
const starField = new THREE.Points(starGeometry, starMaterial);
starField.name = 'starfield';
starField.renderOrder = 999;
scene.add(starField);

// Shooting stars
let shootingStars = [];

function createShootingStar() {
    const trailLength = 100;
    const headGeometry = new THREE.SphereGeometry(2, 32, 32);
    const headMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending
    });
    const head = new THREE.Mesh(headGeometry, headMaterial);

    const glowGeometry = new THREE.SphereGeometry(3, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 } },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            varying vec3 vNormal;
            uniform float time;
            void main() {
                float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(1.0, 1.0, 1.0, intensity * (0.8 + sin(time * 5.0) * 0.2));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    head.add(glow);

    const curve = createRandomCurve();
    const trailPoints = [];
    for (let i = 0; i < trailLength; i++) {
        const t = i / (trailLength - 1);
        trailPoints.push(curve.getPoint(t));
    }

    const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0x99eaff) }
        },
        vertexShader: `
            uniform float time;
            void main() {
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            void main() {
                float alpha = 0.7 + sin(time * 5.0) * 0.2;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    const trail = new THREE.Line(trailGeometry, trailMaterial);

    const shootingStar = new THREE.Group();
    shootingStar.add(head);
    shootingStar.add(trail);
    shootingStar.userData = {
        curve,
        progress: 0,
        speed: 0.001 + Math.random() * 0.001,
        life: 0,
        maxLife: 300,
        head,
        trail,
        trailLength,
        trailPoints
    };
    scene.add(shootingStar);
    shootingStars.push(shootingStar);
}

function createRandomCurve() {
    const start = new THREE.Vector3(-200 + Math.random() * 100, -100 + Math.random() * 200, -100 + Math.random() * 200);
    const end = new THREE.Vector3(600 + Math.random() * 200, start.y + (-100 + Math.random() * 200), start.z + (-100 + Math.random() * 200));
    const control1 = new THREE.Vector3(start.x + 200 + Math.random() * 100, start.y + (-50 + Math.random() * 100), start.z + (-50 + Math.random() * 100));
    const control2 = new THREE.Vector3(end.x - 200 + Math.random() * 100, end.y + (-50 + Math.random() * 100), end.z + (-50 + Math.random() * 100));
    return new THREE.CubicBezierCurve3(start, control1, control2, end);
}

// Planet texture
function createPlanetTexture(size = 512) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(size / 2, size / 2, size / 8, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, '#f8bbd0');
    gradient.addColorStop(0.12, '#f48fb1');
    gradient.addColorStop(0.22, '#f06292');
    gradient.addColorStop(0.35, '#ffffff');
    gradient.addColorStop(0.5, '#e1aaff');
    gradient.addColorStop(0.62, '#e0b3ff');
    gradient.addColorStop(0.75, '#a259f7');
    gradient.addColorStop(1, '#b2ff59');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const colors = ['#f8bbd0', '#f8bbd0', '#f48fb1', '#f48fb1', '#f06292', '#f06292', '#3fd8c7', '#e1aaff', '#e0b3ff', '#a259f7'];
    for (let i = 0; i < 40; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const radius = 30 + Math.random() * 120;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const grad = context.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, color + 'cc');
        grad.addColorStop(1, color + '00');
        context.fillStyle = grad;
        context.fillRect(0, 0, size, size);
    }

    for (let i = 0; i < 8; i++) {
        context.beginPath();
        context.moveTo(Math.random() * size, Math.random() * size);
        context.bezierCurveTo(
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size,
            Math.random() * size, Math.random() * size
        );
        context.strokeStyle = `rgba(180, 120, 200, ${0.12 + Math.random() * 0.18})`;
        context.lineWidth = 8 + Math.random() * 18;
        context.stroke();
    }

    if (context.filter !== undefined) {
        context.filter = 'blur(2px)';
        context.drawImage(canvas, 0, 0);
        context.filter = 'none';
    }

    return new THREE.CanvasTexture(canvas);
}

// Storm shader cho planet
const stormShader = {
    uniforms: {
        time: { value: 0 },
        baseTexture: { value: null }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform sampler2D baseTexture;
        varying vec2 vUv;
        void main() {
            vec2 uv = vUv;
            float angle = length(uv - vec2(0.5)) * 3.0;
            float twist = sin(angle * 3.0 + time) * 0.1;
            uv.x += twist * sin(time * 0.5);
            uv.y += twist * cos(time * 0.5);
            vec4 texColor = texture2D(baseTexture, uv);
            float noise = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time) * 0.1;
            texColor.rgb += noise * vec3(0.8, 0.4, 0.2);
            gl_FragColor = texColor;
        }
    `
};

const planetRadius = 10;
const planetGeometry = new THREE.SphereGeometry(planetRadius, 48, 48);
const planetTexture = createPlanetTexture();
const planetMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        baseTexture: { value: planetTexture }
    },
    vertexShader: stormShader.vertexShader,
    fragmentShader: stormShader.fragmentShader
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.position.set(0, 0, 0);
scene.add(planet);

// Text rings
const ringTexts = ['LOVE LOVE LOVE LOVE LOVE LOVE LOVE LOVE LOVE LOVE', ...(window.dataLove2Loveloom?.ringTexts || [])];

function createTextRings() {
    const numRings = ringTexts.length;
    const ringRadiusBase = planetRadius * 1.1;
    const spacing = 5;
    window.textRings = [];

    for (let i = 0; i < numRings; i++) {
        const text = ringTexts[i % ringTexts.length] + '   ';
        const ringRadius = ringRadiusBase + i * spacing;

        function getCharType(char) {
            const code = char.charCodeAt(0);
            if ((code >= 0x4e00 && code <= 0x9fff) || 
                (code >= 0x3040 && code <= 0x309f) || 
                (code >= 0x30a0 && code <= 0x30ff) || 
                (code >= 0xac00 && code <= 0xd7af)) {
                return 'cjk';
            } else if (code >= 0x0 && code <= 0x7f) {
                return 'latin';
            }
            return 'other';
        }

        let charCounts = { cjk: 0, latin: 0, other: 0 };
        for (let char of text) {
            charCounts[getCharType(char)]++;
        }

        const textLength = text.length;
        const cjkRatio = charCounts.cjk / textLength;
        let config = { fontScale: 0.75, spacingScale: 1.1 };
        if (i === 0) {
            config.fontScale = 0.55;
            config.spacingScale = 0.9;
        } else if (i === 1) {
            config.fontScale = 0.65;
            config.spacingScale = 1;
        }
        if (cjkRatio > 0) {
            config.fontScale *= 0.9;
            config.spacingScale *= 1.1;
        }

        const canvasSize = 400;
        const fontSize = Math.max(200, 0.9 * canvasSize);
        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        measureContext.font = `bold ${fontSize}px Arial, sans-serif`;

        let displayText = ringTexts[i % ringTexts.length];
        const suffix = '   ';
        let fullText = displayText + suffix;
        let textWidth = measureContext.measureText(fullText).width;
        const circumference = 2 * Math.PI * ringRadius * 180;
        const repeatCount = Math.ceil(circumference / textWidth);
        let repeatedText = '';
        for (let j = 0; j < repeatCount; j++) {
            repeatedText += fullText;
        }

        if (textWidth < 1 || !repeatedText) {
            repeatedText = fullText;
            textWidth = measureContext.measureText(fullText).width;
        }

        const textCanvas = document.createElement('canvas');
        textCanvas.width = Math.ceil(Math.max(1, textWidth));
        textCanvas.height = canvasSize;
        const textContext = textCanvas.getContext('2d');
        textContext.clearRect(0, 0, textCanvas.width, canvasSize);
        textContext.font = `bold ${fontSize}px Arial, sans-serif`;
        textContext.fillStyle = 'rgba(255,255,255,0.8)';

        textContext.textAlign = 'left';
        textContext.textBaseline = 'middle';
        textContext.shadowColor = '#e0b3ff';
        textContext.shadowBlur = 24;
        textContext.lineWidth = 8;
        textContext.strokeStyle = '#fff';
        textContext.strokeText(repeatedText, 0, canvasSize * 0.5);
        textContext.shadowColor = '#a259f7';
        textContext.shadowBlur = 16;
        textContext.fillText(repeatedText, 0, canvasSize * 0.5);

        const texture = new THREE.CanvasTexture(textCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.repeat.x = textWidth / circumference;
        texture.needsUpdate = true;

        const geometry = new THREE.CylinderGeometry(ringRadius, ringRadius, 2, 128, 1, true);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide,
            alphaTest: 0.5
        });
        const ringMesh = new THREE.Mesh(geometry, material);
        ringMesh.position.set(0, 0, 0);
        ringMesh.rotation.y = 0;

        const ringGroup = new THREE.Group();
        ringGroup.add(ringMesh);
        ringGroup.userData = {
            ringRadius,
            angleOffset: 0.15 * Math.PI * 0.5,
            speed: 0.008,
            tiltSpeed: 0,
            rollSpeed: 0,
            pitchSpeed: 0,
            tiltAmplitude: Math.PI / 3,
            rollAmplitude: Math.PI / 6,
            pitchAmplitude: Math.PI / 8,
            tiltPhase: Math.PI * 2,
            rollPhase: Math.PI * 2,
            pitchPhase: Math.PI * 2,
            isTextRing: true
        };
        ringGroup.rotation.x = i / numRings * (Math.PI / 1);
        scene.add(ringGroup);
        window.textRings.push(ringGroup);
    }
}

createTextRings();

// Update text rings rotation
function updateTextRingsRotation() {
    if (!window.textRings || !camera) return;

    window.textRings.forEach((ringGroup) => {
        ringGroup.traverse((child) => {
            // Phần comment giữ nguyên nếu cần
        });
    });
}

// Animate planet system
function animatePlanetSystem() {
    if (!window.textRings) return;

    const time = Date.now() * 0.001;
    window.textRings.forEach((ringGroup, index) => {
        const data = ringGroup.userData;
        data.angleOffset += data.speed;

        const tilt = Math.sin(time * data.tiltSpeed + data.tiltPhase) * data.tiltAmplitude;
        const roll = Math.cos(time * data.rollSpeed + data.rollPhase) * data.rollAmplitude;
        const pitch = Math.sin(time * data.pitchSpeed + data.pitchPhase) * data.pitchAmplitude;

        ringGroup.rotation.x = index / window.textRings.length * (Math.PI / 1) + tilt;
        ringGroup.rotation.z = roll;
        ringGroup.rotation.y = data.angleOffset + pitch;

        const yOffset = Math.sin(time * (data.tiltSpeed * 0.7) + data.tiltPhase) * 0.3;
        ringGroup.position.y = yOffset;

        const opacityFactor = (Math.sin(time * 1.5 + index) + 1) / 2;
        const mesh = ringGroup.children[0];
        if (mesh && mesh.material) {
            mesh.material.opacity = 0.7 + opacityFactor * 0.3;
        }
    });

    updateTextRingsRotation();
}

// Hint icon
let hintIcon, hintText;
function createHintIcon() {
    hintIcon = new THREE.Group();
    hintIcon.name = 'hint-icon-group';
    scene.add(hintIcon);

    const shapeGroup = new THREE.Group();
    const shape = new THREE.Shape();
    const size = 1.5;
    const halfSize = size * 0.5;
    shape.moveTo(0, 0);
    shape.lineTo(-halfSize * 0.4, -size * 0.7);
    shape.lineTo(-halfSize * 0.25, -size * 0.7);
    shape.lineTo(-halfSize * 0.5, -size);
    shape.lineTo(halfSize * 0.5, -size);
    shape.lineTo(halfSize * 0.25, -size * 0.7);
    shape.lineTo(halfSize * 0.4, -size * 0.7);
    shape.closePath();

    const shapeGeometry = new THREE.ShapeGeometry(shape);
    const shapeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const shapeMesh = new THREE.Mesh(shapeGeometry, shapeMaterial);

    const shapeGeometry2 = new THREE.ShapeGeometry(shape);
    const shapeMaterial2 = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
    const shapeMesh2 = new THREE.Mesh(shapeGeometry2, shapeMaterial2);
    shapeMesh2.scale.set(0.8, 0.8, 1);
    shapeMesh2.position.z = 0.01;

    shapeGroup.add(shapeMesh, shapeMesh2);
    shapeGroup.position.y = size / 2;
    shapeGroup.rotation.x = Math.PI / 2;

    const ringGeometry = new THREE.RingGeometry(1.8, 2, 32);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
    });
    const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;

    hintIcon.userData.ringMesh = ringMesh;
    hintIcon.add(shapeGroup, ringMesh);
    hintIcon.position.set(1.5, 1.5, 15);
    hintIcon.scale.set(0.8, 0.8, 0.8);
    hintIcon.lookAt(planet.position);
    hintIcon.userData.initialPosition = hintIcon.position.clone();
}

// Animate hint icon
let fadeOpacity = 0.1, fadeInProgress = false, introStarted = false;
function animateHintIcon(time) {
    if (!hintIcon) return;

    if (!introStarted) {
        hintIcon.visible = true;
        const speed = 2.5;
        const amplitude = 1.5;
        const yOffset = Math.sin(time * speed) * amplitude;
        const direction = new THREE.Vector3();
        hintIcon.getWorldDirection(direction);
        hintIcon.position.copy(hintIcon.userData.initialPosition).addScaledVector(direction, -yOffset);

        const ringMesh = hintIcon.userData.ringMesh;
        const scale = 1 + Math.sin(time * speed) * 0.1;
        ringMesh.scale.set(scale, scale, 1);
        ringMesh.material.opacity = 0.5 + Math.sin(time * speed) * 0.2;

        if (hintText) {
            hintText.visible = true;
            hintText.material.opacity = 0.7 + Math.sin(time * 3) * 0.3;
            hintText.position.y = 15 + Math.sin(time * 2) * 0.5;
            hintText.lookAt(camera.position);
        }
    } else {
        if (hintIcon) hintIcon.visible = false;
        if (hintText) hintText.visible = false;
    }
}

// Hint text
function createHintText() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const context = canvas.getContext('2d');
    const fontSize = 50;
    const text = 'Chạm Vào Tinh Cầu';
    context.font = `bold ${fontSize}px Arial, sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.shadowColor = '#ffb3de';
    context.shadowBlur = 5;
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(255, 200, 220, 0.8)';
    context.strokeText(text, size / 2, size / 2);
    context.shadowColor = '#e0b3ff';
    context.shadowBlur = 5;
    context.lineWidth = 2;
    context.strokeStyle = 'rgba(220, 180, 255, 0.5)';
    context.strokeText(text, size / 2, size / 2);
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.fillStyle = 'white';
    context.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        opacity: 1.0
    });
    const geometry = new THREE.PlaneGeometry(16, 8);
    hintText = new THREE.Mesh(geometry, material);
    hintText.position.set(0, 25, 0);
    hintText.renderOrder = 1000;
    hintText.lookAt(camera.position);
    scene.add(hintText);
}

// Thêm lời chúc với hiệu ứng viết tay, mỗi chữ xuống dòng, và backglow
let wishPlane = null;
const wishText = "Chúc bạn Hà Phương yêu mãi hạnh phúc!";
let currentLine = 0;
function createWishPlane() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    context.font = 'bold 30px Dancing Script, Arial'; // Giảm kích thước font để vừa với nhiều dòng
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // Thiết lập backglow
    context.shadowColor = '#ff66ff'; // Màu backglow mới (hồng đậm)
    context.shadowBlur = 20; // Tăng độ mờ để tạo hiệu ứng phát sáng
    context.fillText(wishText, canvas.width / 2, canvas.height / 2); // Vẽ backglow trước

    // Thêm lớp shadow hiện tại để tạo độ sâu
    context.shadowColor = '#e0b3ff'; // Giữ màu tím nhạt làm lớp thứ hai
    context.shadowBlur = 10;
    context.fillText(wishText, canvas.width / 2, canvas.height / 2); // Vẽ lớp thứ hai

    // Vẽ chữ chính (không shadow)
    context.shadowColor = 'transparent';
    context.shadowBlur = 0;
    context.fillStyle = 'white';
    context.fillText(wishText, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const geometry = new THREE.PlaneGeometry(50, 25);
    wishPlane = new THREE.Mesh(geometry, material);
    wishPlane.position.set(0, 20, -50);
    wishPlane.rotation.y = Math.PI;
    wishPlane.visible = false;
    scene.add(wishPlane);

    // Hàm vẽ từng chữ trên dòng mới
    function drawTextStep(index) {
        if (index < wishText.length) {
            const words = wishText.split(' ');
            let charIndex = 0;
            let wordIndex = 0;

            for (let i = 0; i < index; i++) {
                if (wishText[i] === ' ') {
                    charIndex++;
                } else {
                    charIndex++;
                    if (charIndex >= words[wordIndex].length) {
                        charIndex = 0;
                        wordIndex++;
                    }
                }
            }

            const currentWord = words[wordIndex];
            let textSoFar = '';
            for (let i = 0; i <= wordIndex; i++) {
                if (i < wordIndex) {
                    textSoFar += words[i] + ' ';
                } else {
                    textSoFar += currentWord.slice(0, charIndex + 1);
                }
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            const lines = textSoFar.split(' ');
            const lineHeight = 40; // Khoảng cách giữa các dòng
            lines.forEach((line, idx) => {
                if (line) {
                    // Vẽ backglow
                    context.shadowColor = '#ff66ff';
                    context.shadowBlur = 20;
                    context.fillText(line, canvas.width / 2, canvas.height / 2 - (lines.length - 1) * lineHeight / 2 + idx * lineHeight);

                    // Vẽ lớp shadow thứ hai
                    context.shadowColor = '#e0b3ff';
                    context.shadowBlur = 10;
                    context.fillText(line, canvas.width / 2, canvas.height / 2 - (lines.length - 1) * lineHeight / 2 + idx * lineHeight);

                    // Vẽ chữ chính
                    context.shadowColor = 'transparent';
                    context.shadowBlur = 0;
                    context.fillStyle = 'white';
                    context.fillText(line, canvas.width / 2, canvas.height / 2 - (lines.length - 1) * lineHeight / 2 + idx * lineHeight);
                }
            });
            texture.needsUpdate = true;

            setTimeout(() => drawTextStep(index + 1), 300); // Độ trễ 300ms giữa các ký tự
        } else {
            wishPlane.visible = true; // Hiển thị hoàn toàn khi xong
        }
    }

    // Bắt đầu hiệu ứng viết tay khi cần
    window.startHandwriting = () => {
        if (wishPlane && !wishPlane.visible) {
            wishPlane.visible = true;
            currentLine = 0;
            drawTextStep(0);
        }
    };
}

// Khởi tạo
createShootingStar();
createHintIcon();
createHintText();
createWishPlane();

// Resize
function handleResize() {
    const container = document.getElementById('container');
    if (container) {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();
    }
}

// Fullscreen
function setFullScreen() {
    const container = document.getElementById('container');
    if (container) {
        const vh = window.innerHeight * 0.01;
        container.style.height = `${vh * 100}px`;
        handleResize();
    }
}

function requestFullScreen() {
    const element = document.documentElement;
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    }
}

// Create galaxy
function createGalaxy() {
    const positions = new Float32Array(galaxyParameters.count * 3);
    const colors = new Float32Array(galaxyParameters.count * 3);
    let pointIdx = 0;

    for (let i = 0; i < galaxyParameters.count; i++) {
        const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
        const branchAngle = (i % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
        const spinAngle = radius * galaxyParameters.spin;
        const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
        const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
        const totalAngle = branchAngle + spinAngle;

        if (radius < 30 && Math.random() < 0.7) continue;

        const i3 = pointIdx * 3;
        positions[i3] = Math.cos(totalAngle) * radius + randomX;
        positions[i3 + 1] = randomY;
        positions[i3 + 2] = Math.sin(totalAngle) * radius + randomZ;

        const mixedColor = new THREE.Color(0xff66ff);
        mixedColor.lerp(new THREE.Color(0x66ffff), radius / galaxyParameters.radius);
        mixedColor.multiplyScalar(0.7 + 0.3 * Math.random());
        colors[i3] = mixedColor.r;
        colors[i3 + 1] = mixedColor.g;
        colors[i3 + 2] = mixedColor.b;
        pointIdx++;
    }

    const galaxyGeometry = new THREE.BufferGeometry();
    const galaxyMaterial = new THREE.PointsMaterial({
        uniforms: {
            uTime: { value: 0 },
            uSize: { value: 50 * renderer.getPixelRatio() },
            uRippleTime: { value: -1 },
            uRippleSpeed: { value: 40 },
            uRippleWidth: { value: 20 }
        },
        vertexShader: `
            uniform float uSize;
            uniform float uTime;
            uniform float uRippleTime;
            uniform float uRippleSpeed;
            uniform float uRippleWidth;

            varying vec3 vColor;

            void main() {
                vColor = color;
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);

                if (uRippleTime > 0.0) {
                    float rippleRadius = (uTime - uRippleTime) * uRippleSpeed;
                    float particleDist = length(modelPosition.xyz);
                    float strength = 1.0 - smoothstep(rippleRadius - uRippleWidth, rippleRadius + uRippleWidth, particleDist);
                    strength *= smoothstep(rippleRadius + uRippleWidth, rippleRadius - uRippleWidth, particleDist);
                    if (strength > 0.0) {
                        vColor += vec3(strength * 2.0);
                    }
                }

                vec4 viewPosition = viewMatrix * modelPosition;
                gl_Position = projectionMatrix * viewPosition;
                gl_PointSize = uSize / -viewPosition.z;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(vColor, 1.0);
            }
        `,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        vertexColors: true
    });

    galaxy = new THREE.Points(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
}

// Khởi tạo heartImages và tạo các đám mây điểm
heartImages = getHeartImagesFromURL();
createPointClouds();

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * 0.001;
    animateHintIcon(time);
    controls.update();
    planet.material.uniforms.time.value = time * 0.5;

    if (fadeInProgress && fadeOpacity < 1) {
        fadeOpacity += 0.025;
        if (fadeOpacity > 1) fadeOpacity = 1;
    }

    if (!introStarted) {
        fadeOpacity = 0.1;
        scene.traverse(obj => {
            if (!(obj.isMesh || obj.isPoints)) return;

            if (obj.name === 'starfield') {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                }
                return;
            }
            if (obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing)) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = false;
                    obj.material.opacity = 1;
                }
                if (obj.material && obj.material.color) {
                    obj.material.color.set(0xffffff);
                }
            } else if (obj !== planet && obj !== centralGlow && obj !== hintIcon && obj.type !== 'Scene' && !obj.parent?.isGroup) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity = 0.1;
                }
            }
        });
        planet.visible = true;
        centralGlow.visible = true;
    } else {
        scene.traverse(obj => {
            if (!(obj.isMesh || obj.isPoints)) return;

            if (!(obj.userData.isTextRing || (obj.parent && obj.parent.userData && obj.parent.userData.isTextRing) || obj === planet || obj === centralGlow || obj.type === 'Scene')) {
                if (obj.material && obj.material.opacity !== undefined) {
                    obj.material.transparent = true;
                    obj.material.opacity = fadeOpacity;
                }
            } else if (obj.material && obj.material.opacity !== undefined) {
                obj.material.opacity = 1;
                obj.material.transparent = false;
            }
            if (obj.material && obj.material.color) {
                obj.material.color.set(0xffffff);
            }
        });
    }

    if (galaxy && galaxy.material.uniforms) {
        galaxy.material.uniforms.uTime.value = time;
    }

    for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        star.userData.life++;
        let opacity = 1;
        if (star.userData.life < 30) {
            opacity = star.userData.life / 30;
        } else if (star.userData.life > star.userData.maxLife - 30) {
            opacity = (star.userData.maxLife - star.userData.life) / 30;
        }

        star.userData.progress += star.userData.speed;
        if (star.userData.progress > 1) {
            scene.remove(star);
            shootingStars.splice(i, 1);
            continue;
        }

        const position = star.userData.curve.getPoint(star.userData.progress);
        star.position.copy(position);
        star.userData.head.material.opacity = opacity;
        star.userData.trail.material.uniforms.time.value = time;
        star.userData.trail.material.uniforms.color.value = new THREE.Color(0x99eaff).lerp(new THREE.Color(0xffffff), Math.sin(time) * 0.5);

        const trail = star.userData.trail;
        const trailPoints = star.userData.trailPoints;
        trailPoints[0].copy(position);
        for (let j = 1; j < star.userData.trailLength; j++) {
            const t = Math.max(0, star.userData.progress - j * 0.01);
            trailPoints[j].copy(star.userData.curve.getPoint(t));
        }
        trail.geometry.setFromPoints(trailPoints);
    }

    if (shootingStars.length < 3 && Math.random() < 0.02) {
        createShootingStar();
    }

    scene.traverse(obj => {
        if (obj.isPoints && obj.userData.materialNear && obj.userData.materialFar) {
            const posAttr = obj.geometry.getAttribute('position');
            let nearCamera = false;
            for (let i = 0; i < posAttr.count; i++) {
                const x = posAttr.getX(i) + obj.position.x;
                const y = posAttr.getY(i) + obj.position.y;
                const z = posAttr.getZ(i) + obj.position.z;
                const dist = camera.position.distanceTo(new THREE.Vector3(x, y, z));
                if (dist < 10) {
                    nearCamera = true;
                    break;
                }
            }
            if (nearCamera) {
                if (obj.material !== obj.userData.materialNear) {
                    obj.material = obj.userData.materialNear;
                    obj.geometry = obj.userData.geometryNear;
                }
            } else if (obj.material !== obj.userData.materialFar) {
                obj.material = obj.userData.materialFar;
                obj.geometry = obj.userData.geometryFar;
            }
        }
    });

    planet.lookAt(camera.position);
    animatePlanetSystem();

    if (starField && starField.material && starField.material.opacity !== undefined) {
        starField.material.opacity = 1;
        starField.material.transparent = false;
    }

    if (wishPlane) {
        wishPlane.lookAt(camera.position); // Luôn hướng về camera
    }

    renderer.render(scene, camera);
}

// Click events
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const originalStarCount = starGeometry.getAttribute('position').count;
starField.geometry.setDrawRange(0, Math.floor(originalStarCount * 0.1));

function onCanvasClick(event) {
    if (introStarted) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(planet);
    if (intersects.length > 0) {
        requestFullScreen();
        introStarted = true;
        fadeInProgress = true;
        document.body.classList.add('intro-started');
        startCameraAnimation();
        starField.geometry.setDrawRange(0, originalStarCount);
        createGalaxy();
        if (audio) audio.play();

        // Kích hoạt hiệu ứng viết tay nếu ảnh đã tải xong
        if (allImagesLoaded) {
            window.startHandwriting();
        }
    } else if (introStarted) {
        const heartIntersects = raycaster.intersectObjects(heartPointClouds);
        if (heartIntersects.length > 0) {
            const obj = heartIntersects[0].object;
            controls.target.copy(obj.position);
        }
    }
}

renderer.domElement.addEventListener('click', onCanvasClick);

// Camera animation
function startCameraAnimation() {
    const startPos = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
    const pos1 = { x: startPos.x, y: 0, z: startPos.z };
    const pos2 = { x: startPos.x, y: 0, z: 160 };
    const finalPos = { x: -40, y: 100, z: 100 };
    const phase1Duration = 0.2;
    const phase2Duration = 0.55;
    const phase3Duration = 0.4;
    let progress = 0;

    function animateCamera() {
        progress += 0.00101;
        let newPos;
        if (progress < phase1Duration) {
            const t = progress / phase1Duration;
            newPos = {
                x: startPos.x + (pos1.x - startPos.x) * t,
                y: startPos.y + (pos1.y - startPos.y) * t,
                z: startPos.z + (pos1.z - startPos.z) * t
            };
        } else if (progress < phase1Duration + phase2Duration) {
            const t = (progress - phase1Duration) / phase2Duration;
            newPos = {
                x: pos1.x + (pos2.x - pos1.x) * t,
                y: pos1.y + (pos2.y - pos1.y) * t,
                z: pos1.z + (pos2.z - pos1.z) * t
            };
        } else if (progress < phase1Duration + phase2Duration + phase3Duration) {
            const t = (progress - phase1Duration - phase2Duration) / phase3Duration;
            const ease = 0.5 - 0.5 * Math.cos(Math.PI * t);
            newPos = {
                x: pos2.x + (finalPos.x - pos2.x) * ease,
                y: pos2.y + (finalPos.y - pos2.y) * ease,
                z: pos2.z + (finalPos.z - pos2.z) * ease
            };
        } else {
            camera.position.set(finalPos.x, finalPos.y, finalPos.z);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
            controls.autoRotate = true;
            return;
        }
        camera.position.set(newPos.x, newPos.y, newPos.z);
        camera.lookAt(0, 0, 0);
        requestAnimationFrame(animateCamera);
    }

    controls.enabled = false;
    animateCamera();
}

// Event listeners
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => setTimeout(setFullScreen, 300));
document.addEventListener('DOMContentLoaded', setFullScreen);
document.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
const container = document.getElementById('container');
if (container) {
    container.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
}
window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 200));

function checkOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth && 'orientation' in window;
    document.body.classList.toggle('portrait-mode', isPortrait);
}

// Start
animate();

window.scene = scene;
window.camera = camera;