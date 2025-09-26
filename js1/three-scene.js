if (window.location.href.startsWith('https://hntech.dev')) {
class ThreeScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('three-canvas'),
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            logarithmicDepthBuffer: true
        });
        
        // Post-processing setup
        this.composer = null;
        this.bloomPass = null;
        this.renderPass = null;
        
        this.particles = [];
        this.geometries = [];
        this.techIcons = [];
        this.galaxy = null;
        this.solarSystem = null;
        this.starField = null;
        this.nebulae = [];
        this.planets = [];
        this.distantStars = null;
        this.midrangeStars = null;
        this.foregroundStars = null;
        this.galaxyCore = null;
        this.sun = null;
        this.corona = null;
        this.mouse = { x: 0, y: 0 };
        this.targetMouse = { x: 0, y: 0 };
        this.time = 0;
        this.dizzyFactor = 0;
        this.audioData = new Array(128).fill(0);
        
        // Camera roller coaster
        this.cameraPath = null;
        this.cameraProgress = 0;
        this.cameraSpeed = 0.0005; // Reduced base speed for smoother movement
        this.rollerCoasterActive = true;
        this.originalCameraPosition = new THREE.Vector3();
        this.cameraLookTarget = new THREE.Vector3();
        this.cameraVelocity = new THREE.Vector3(); // For smoother interpolation
        this.smoothingFactor = 0.1; // Lerp factor for ultra-smooth movement
        
        this.galaxyParams = {
            count: 50000, // Massive galaxy
            size: 0.02,
            radius: 300,
            branches: 8,
            spin: 3.0,
            randomness: 1.2,
            randomnessPower: 5,
            insideColor: '#ffd700', // Golden core
            outsideColor: '#4169e1'  // Blue arms
        };
        
        this.starParams = {
            count: 50000, // Billions simulated via layers
            spread: 2000
        };
        
        this.init();
        this.setupPostProcessing();
        this.createMassiveGalaxy();
        this.createBillionsOfStars();
        this.createSolarSystem();
        this.createNebulae();
        this.createCameraPath();
        this.createLights();
        this.addEventListeners();
        this.animate();
    }
    
    init() {
        // Renderer setup
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000005, 1); // Very dark blue space
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 0.8;
        
        // Camera position for roller coaster start
        this.camera.position.set(0, 50, 100);
        this.camera.fov = 75;
        this.camera.near = 0.1;
        this.camera.far = 5000;
        this.camera.updateProjectionMatrix();
        
        // No fog - we want to see the full galaxy
        this.scene.fog = null;
        
        console.log('ThreeJS renderer initialized with HDR pipeline');
    }
    
    setupPostProcessing() {
        // Import post-processing if available, otherwise create basic version
        if (typeof THREE.EffectComposer !== 'undefined') {
            this.composer = new THREE.EffectComposer(this.renderer);
            
            this.renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(this.renderPass);
            
            // Bloom pass for stellar glow
            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                2.0,    // strength
                0.8,    // radius
                0.1     // threshold
            );
            this.composer.addPass(this.bloomPass);
            
            console.log('Post-processing enabled with bloom');
        } else {
            console.log('Post-processing not available, using direct rendering');
        }
    }
    
    createMassiveGalaxy() {
        this.createGalaxyCore();
        this.createGalaxySpiralArms();
    }
    
    createGalaxyCore() {
        // Central supermassive black hole with accretion disk
        const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1
        });
        const blackHole = new THREE.Mesh(coreGeometry, coreMaterial);
        blackHole.position.set(0, 0, 0);
        this.scene.add(blackHole);
        
        // Bright galactic core
        const glowGeometry = new THREE.SphereGeometry(8, 32, 32);
        const glowMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 3.0 }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uIntensity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    vec3 color = mix(vec3(1.0, 0.8, 0.2), vec3(1.0, 0.4, 0.0), fresnel);
                    float pulse = sin(uTime * 2.0) * 0.3 + 0.7;
                    gl_FragColor = vec4(color * uIntensity * pulse, 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.galaxyCore = new THREE.Mesh(glowGeometry, glowMaterial);
        this.scene.add(this.galaxyCore);
    }
    
    createGalaxySpiralArms() {
        const positions = new Float32Array(this.galaxyParams.count * 3);
        const colors = new Float32Array(this.galaxyParams.count * 3);
        const scales = new Float32Array(this.galaxyParams.count);
        const brightness = new Float32Array(this.galaxyParams.count);
        
        const coreColor = new THREE.Color(this.galaxyParams.insideColor);
        const armColor = new THREE.Color(this.galaxyParams.outsideColor);
        
        for (let i = 0; i < this.galaxyParams.count; i++) {
            const i3 = i * 3;
            
            // Enhanced galaxy spiral mathematics
            const radius = Math.pow(Math.random(), 0.7) * this.galaxyParams.radius;
            const branchAngle = (i % this.galaxyParams.branches) / this.galaxyParams.branches * Math.PI * 2;
            const spinAngle = radius * this.galaxyParams.spin * 0.01;
            
            // More realistic spiral arm distribution
            const armOffset = Math.sin(radius * 0.02) * 10;
            const densityVariation = Math.pow(Math.random(), 2) * this.galaxyParams.randomness;
            
            const randomX = (Math.random() - 0.5) * densityVariation * radius * 0.3;
            const randomY = (Math.random() - 0.5) * densityVariation * radius * 0.1;
            const randomZ = (Math.random() - 0.5) * densityVariation * radius * 0.3;
            
            positions[i3] = Math.cos(branchAngle + spinAngle) * (radius + armOffset) + randomX;
            positions[i3 + 1] = randomY * (1 - radius / this.galaxyParams.radius) * 10;
            positions[i3 + 2] = Math.sin(branchAngle + spinAngle) * (radius + armOffset) + randomZ;
            
            // Color based on distance and position
            const normalizedRadius = radius / this.galaxyParams.radius;
            const mixedColor = coreColor.clone();
            mixedColor.lerp(armColor, normalizedRadius);
            
            // Add stellar classification colors
            const stellarType = Math.random();
            if (stellarType < 0.1 && normalizedRadius < 0.3) {
                // Young blue giants in spiral arms
                mixedColor.setHex(0x9bb0ff);
            } else if (stellarType < 0.6) {
                // Main sequence stars
                mixedColor.setHex(0xfff4ea);
            } else if (stellarType < 0.8) {
                // Red giants
                mixedColor.setHex(0xff7f50);
            }
            
            colors[i3] = mixedColor.r;
            colors[i3 + 1] = mixedColor.g;
            colors[i3 + 2] = mixedColor.b;
            
            // Variable star sizes and brightness
            scales[i] = Math.random() * 2 + 0.5;
            brightness[i] = Math.pow(Math.random(), 2) * 5; // Power law distribution
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
        geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
        
        const material = new THREE.ShaderMaterial({
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            vertexColors: true,
            uniforms: {
                uTime: { value: 0 },
                uSize: { value: 3.0 },
                uAudioFactor: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float uSize;
                uniform float uAudioFactor;
                
                attribute float aScale;
                attribute float aBrightness;
                
                varying vec3 vColor;
                varying float vBrightness;
                
                void main() {
                    vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                    
                    // Galactic rotation with differential speed
                    float angle = atan(modelPosition.x, modelPosition.z);
                    float distanceToCenter = length(modelPosition.xz);
                    float rotationSpeed = 1.0 / (distanceToCenter * 0.01 + 1.0);
                    float angleOffset = rotationSpeed * uTime * 0.1;
                    
                    angle += angleOffset;
                    
                    modelPosition.x = cos(angle) * distanceToCenter;
                    modelPosition.z = sin(angle) * distanceToCenter;
                    
                    // Stellar motion
                    modelPosition.y += sin(uTime * 0.5 + distanceToCenter * 0.01) * 2.0;
                    
                    vec4 viewPosition = viewMatrix * modelPosition;
                    vec4 projectedPosition = projectionMatrix * viewPosition;
                    
                    gl_Position = projectedPosition;
                    
                    // Audio-reactive size
                    float finalSize = uSize * aScale * (1.0 + uAudioFactor * 2.0);
                    gl_PointSize = finalSize * (300.0 / length(viewPosition.xyz));
                    
                    vColor = color;
                    vBrightness = aBrightness;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vBrightness;
                
                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    
                    // Stellar glow
                    float glow = pow(alpha, 0.5) * vBrightness;
                    vec3 finalColor = vColor * glow;
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.8);
                }
            `
        });
        
        this.galaxy = new THREE.Points(geometry, material);
        this.scene.add(this.galaxy);
    }
    
    createBillionsOfStars() {
        // Create multiple layers to simulate billions of stars
        this.createDistantStarfield();
        this.createMidrangeStars();
        this.createForegroundStars();
    }
    
    createDistantStarfield() {
        // Sphere of distant stars to simulate the cosmic background
        const starCount = 15000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            // Random point on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 1800 + Math.random() * 500;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Stellar color variety
            const temp = Math.random();
            if (temp < 0.3) {
                // Red stars
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.5;
                colors[i3 + 2] = 0.3;
            } else if (temp < 0.7) {
                // White stars
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.95;
                colors[i3 + 2] = 0.9;
            } else {
                // Blue stars
                colors[i3] = 0.7;
                colors[i3 + 1] = 0.8;
                colors[i3 + 2] = 1.0;
            }
            
            sizes[i] = Math.random() * 3 + 1;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 }
            },
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Twinkling effect
                    float twinkle = sin(uTime + position.x + position.y + position.z) * 0.5 + 1.0;
                    gl_PointSize = size * twinkle;
                    
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    gl_FragColor = vec4(vColor, alpha * 0.6);
                }
            `
        });
        
        this.distantStars = new THREE.Points(geometry, material);
        this.scene.add(this.distantStars);
    }
    
    createMidrangeStars() {
        // Medium distance stars with more detail
        const starCount = 25000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const brightness = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 1200;
            positions[i3 + 1] = (Math.random() - 0.5) * 1200;
            positions[i3 + 2] = (Math.random() - 0.5) * 1200;
            
            // Realistic stellar colors
            const starType = Math.random();
            if (starType < 0.76) {
                // M-class (red dwarfs)
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.3;
                colors[i3 + 2] = 0.0;
            } else if (starType < 0.885) {
                // K-class (orange)
                colors[i3] = 1.0;
                colors[i3 + 1] = 0.7;
                colors[i3 + 2] = 0.4;
            } else if (starType < 0.96) {
                // G-class (yellow, like our Sun)
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 0.8;
            } else if (starType < 0.99) {
                // F-class (white)
                colors[i3] = 1.0;
                colors[i3 + 1] = 1.0;
                colors[i3 + 2] = 1.0;
            } else {
                // O/B-class (blue giants)
                colors[i3] = 0.6;
                colors[i3 + 1] = 0.7;
                colors[i3 + 2] = 1.0;
            }
            
            brightness[i] = Math.pow(Math.random(), 3) * 10; // Power law distribution
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('brightness', new THREE.BufferAttribute(brightness, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uAudioFactor: { value: 0 }
            },
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                attribute float brightness;
                varying vec3 vColor;
                varying float vBrightness;
                uniform float uTime;
                uniform float uAudioFactor;
                
                void main() {
                    vColor = color;
                    vBrightness = brightness;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    float twinkle = sin(uTime * 2.0 + position.x * 0.01 + position.y * 0.01) * 0.3 + 1.0;
                    float audioBoost = 1.0 + uAudioFactor;
                    
                    gl_PointSize = brightness * twinkle * audioBoost * (500.0 / length(mvPosition.xyz));
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vBrightness;
                
                void main() {
                    float dist = distance(gl_PointCoord, vec2(0.5));
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    float glow = pow(alpha, 0.3) * vBrightness * 0.1;
                    gl_FragColor = vec4(vColor * glow, alpha * 0.8);
                }
            `
        });
        
        this.midrangeStars = new THREE.Points(geometry, material);
        this.scene.add(this.midrangeStars);
    }
    
    createForegroundStars() {
        // Close, bright stars that can be interacted with
        const starCount = 5000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            
            positions[i3] = (Math.random() - 0.5) * 800;
            positions[i3 + 1] = (Math.random() - 0.5) * 800;
            positions[i3 + 2] = (Math.random() - 0.5) * 800;
            
            // Bright stellar colors
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 0.8, 0.8);
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            sizes[i] = Math.random() * 8 + 2;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2() }
            },
            vertexColors: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                uniform float uTime;
                uniform vec2 uMouse;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Dramatic twinkling
                    float twinkle = sin(uTime * 3.0 + position.x * 0.1) * 
                                   cos(uTime * 2.5 + position.y * 0.1) * 0.5 + 1.0;
                    
                    // Mouse interaction
                    vec2 screenPos = (mvPosition.xy / mvPosition.z + 1.0) * 0.5;
                    float mouseDist = distance(screenPos, uMouse);
                    float mouseEffect = 1.0 + exp(-mouseDist * 10.0) * 3.0;
                    
                    gl_PointSize = size * twinkle * mouseEffect;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // Star-like pattern
                    float angle = atan(center.y, center.x);
                    float spikes = abs(sin(angle * 4.0)) * 0.3 + 0.7;
                    
                    float alpha = (1.0 - smoothstep(0.0, 0.5, dist)) * spikes;
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `
        });
        
        this.foregroundStars = new THREE.Points(geometry, material);
        this.scene.add(this.foregroundStars);
    }
    
    createNebulae() {
        // Create colorful nebula clouds
        const nebulaCount = 8;
        
        for (let i = 0; i < nebulaCount; i++) {
            const nebulaGeometry = new THREE.PlaneGeometry(200, 200);
            const nebulaMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor1: { value: new THREE.Color().setHSL(Math.random(), 0.8, 0.6) },
                    uColor2: { value: new THREE.Color().setHSL(Math.random(), 0.9, 0.4) },
                    uOpacity: { value: 0.3 }
                },
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide,
                depthWrite: false,
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;
                    uniform float uOpacity;
                    varying vec2 vUv;
                    
                    float random(vec2 st) {
                        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                    }
                    
                    float noise(vec2 st) {
                        vec2 i = floor(st);
                        vec2 f = fract(st);
                        float a = random(i);
                        float b = random(i + vec2(1.0, 0.0));
                        float c = random(i + vec2(0.0, 1.0));
                        float d = random(i + vec2(1.0, 1.0));
                        vec2 u = f * f * (3.0 - 2.0 * f);
                        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                    }
                    
                    void main() {
                        vec2 st = vUv * 3.0;
                        vec2 movement = vec2(uTime * 0.01, uTime * 0.02);
                        
                        float n1 = noise(st + movement);
                        float n2 = noise(st * 2.0 - movement);
                        float n3 = noise(st * 0.5 + movement * 0.5);
                        
                        float combined = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
                        
                        vec3 color = mix(uColor1, uColor2, combined);
                        float alpha = smoothstep(0.2, 0.8, combined) * uOpacity;
                        
                        gl_FragColor = vec4(color, alpha);
                    }
                `
            });
            
            const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
            
            // Random position and rotation
            nebula.position.set(
                (Math.random() - 0.5) * 1000,
                (Math.random() - 0.5) * 500,
                (Math.random() - 0.5) * 1000
            );
            
            nebula.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            nebula.userData = {
                rotationSpeed: (Math.random() - 0.5) * 0.001,
                originalPosition: nebula.position.clone()
            };
            
            this.nebulae.push(nebula);
            this.scene.add(nebula);
        }
    }
    
    createCameraPath() {
        // Create spectacular roller coaster path through the galaxy with more points for smoothness
        // Added tunnel segment: a curved path through dense stars (positions z decreasing rapidly)
        const points = [
            // Start: Overview of galaxy (smooth entry)
            new THREE.Vector3(0, 100, 200),
            new THREE.Vector3(0, 90, 180),
            new THREE.Vector3(0, 80, 160),
            
            // Dive into spiral arm (gradual curve)
            new THREE.Vector3(-50, 60, 120),
            new THREE.Vector3(-100, 50, 100),
            new THREE.Vector3(-150, 40, 80),
            new THREE.Vector3(-200, 20, 50),
            
            // Flyby of solar system (smooth arc)
            new THREE.Vector3(-150, 25, 60),
            new THREE.Vector3(-100, 30, 70),
            new THREE.Vector3(0, 35, 75),
            new THREE.Vector3(100, 30, 80),
            new THREE.Vector3(150, 10, 50),
            
            // Transition to tunnel (build up speed)
            new THREE.Vector3(140, 15, 55),
            new THREE.Vector3(130, 20, 60),
            
            // Star-filled tunnel segment (rapid z decrease, surrounded by stars, curved for immersion)
            new THREE.Vector3(120, 25, 200), // Enter tunnel from side
            new THREE.Vector3(80, 30, 150),
            new THREE.Vector3(40, 35, 100),
            new THREE.Vector3(0, 40, 50),
            new THREE.Vector3(-40, 35, 0),
            new THREE.Vector3(-80, 30, -50),
            new THREE.Vector3(-120, 25, -100),
            new THREE.Vector3(-160, 20, -150), // Exit tunnel
            
            // Plunge toward galactic core (post-tunnel dramatic dive)
            new THREE.Vector3(-140, 15, -120),
            new THREE.Vector3(-100, 10, -80),
            new THREE.Vector3(-50, 5, -40),
            new THREE.Vector3(0, 0, -10),
            new THREE.Vector3(50, 5, 20),
            new THREE.Vector3(0, 0, 10),
            
            // Escape from core (upward spiral)
            new THREE.Vector3(-20, -5, 20),
            new THREE.Vector3(-50, -10, 40),
            new THREE.Vector3(-80, -15, 60),
            new THREE.Vector3(-100, -10, 80),
            
            // Tour outer regions (wide sweep)
            new THREE.Vector3(-120, 0, 100),
            new THREE.Vector3(-150, 20, 120),
            new THREE.Vector3(-180, 40, 140),
            new THREE.Vector3(-200, 40, 150),
            new THREE.Vector3(-180, 50, 160),
            new THREE.Vector3(-150, 60, 180),
            new THREE.Vector3(-120, 70, 200),
            new THREE.Vector3(-100, 80, 220),
            new THREE.Vector3(-80, 90, 240),
            new THREE.Vector3(-50, 100, 260),
            new THREE.Vector3(0, 110, 280),
            
            // Final overview (smooth loop back)
            new THREE.Vector3(50, 105, 260),
            new THREE.Vector3(100, 100, 240),
            new THREE.Vector3(150, 95, 220),
            new THREE.Vector3(180, 90, 200),
            new THREE.Vector3(200, 85, 180),
            new THREE.Vector3(180, 80, 160),
            new THREE.Vector3(150, 75, 140),
            new THREE.Vector3(100, 70, 120),
            new THREE.Vector3(50, 65, 100),
            new THREE.Vector3(0, 60, 80),
            new THREE.Vector3(-50, 55, 60),
            new THREE.Vector3(0, 50, 40) // Connect back smoothly
        ];
        
        this.cameraPath = new THREE.CatmullRomCurve3(points, true, 'catmullrom', 0.5); // Higher tension for smoother curves
        this.cameraProgress = 0;
        
        // Create look-at targets for dramatic camera movements (more targets for tunnel)
        this.cameraTargets = [
            new THREE.Vector3(0, 0, 0),        // Galaxy center
            new THREE.Vector3(150, 0, 50),     // Solar system
            new THREE.Vector3(-100, 0, 0),     // Spiral arm
            new THREE.Vector3(0, 20, 100),     // Tunnel entry
            new THREE.Vector3(-80, 0, -50),    // Tunnel mid
            new THREE.Vector3(-120, 0, -100),  // Tunnel exit
            new THREE.Vector3(0, 0, 0),        // Core again
            new THREE.Vector3(200, 0, 100)     // Outer edge
        ];
    }
    
    createSolarSystem() {
        this.solarSystem = new THREE.Group();
        
        // Create the Sun
        this.createSun();
        
        // Create planets with cinematic scaling
        this.createPlanets();
        
        this.scene.add(this.solarSystem);
        
        // Position solar system within galaxy
        this.solarSystem.position.set(150, 0, 50);
    }
    
    createSun() {
        const sunGeometry = new THREE.SphereGeometry(8, 32, 32);
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: 5.0 }
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                uniform float uTime;
                
                void main() {
                    vPosition = position;
                    vNormal = normalize(normalMatrix * normal);
                    
                    // Solar surface turbulence
                    vec3 pos = position + normal * sin(uTime + position.x * 2.0) * 0.1;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uIntensity;
                varying vec3 vPosition;
                varying vec3 vNormal;
                
                void main() {
                    // Solar surface pattern
                    float noise = sin(vPosition.x * 3.0 + uTime) * 
                                 cos(vPosition.y * 2.0 + uTime * 0.7) * 
                                 sin(vPosition.z * 4.0 + uTime * 1.3);
                    
                    vec3 color1 = vec3(1.0, 0.8, 0.0); // Yellow core
                    vec3 color2 = vec3(1.0, 0.3, 0.0); // Orange-red
                    vec3 color3 = vec3(1.0, 1.0, 0.9); // White hot spots
                    
                    vec3 finalColor = mix(color1, color2, noise * 0.5 + 0.5);
                    finalColor = mix(finalColor, color3, abs(noise) * 0.3);
                    
                    // Solar corona effect
                    float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    finalColor += vec3(1.0, 0.9, 0.8) * fresnel * 2.0;
                    
                    gl_FragColor = vec4(finalColor * uIntensity, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.solarSystem.add(this.sun);
        
        // Solar corona
        const coronaGeometry = new THREE.SphereGeometry(12, 32, 32);
        const coronaMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa00,
            transparent: true,
            opacity: 0.1,
            blending: THREE.AdditiveBlending
        });
        
        this.corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        this.solarSystem.add(this.corona);
    }
    
    createPlanets() {
        const planetData = [
            { name: 'Mercury', distance: 20, size: 1, color: 0x8c7853, speed: 0.04 },
            { name: 'Venus', distance: 30, size: 1.5, color: 0xffc649, speed: 0.03 },
            { name: 'Earth', distance: 45, size: 2, color: 0x6b93d6, speed: 0.02 },
            { name: 'Mars', distance: 60, size: 1.8, color: 0xcd5c5c, speed: 0.015 },
            { name: 'Jupiter', distance: 90, size: 6, color: 0xd8ca9d, speed: 0.008 },
            { name: 'Saturn', distance: 120, size: 5, color: 0xfad5a5, speed: 0.006 },
            { name: 'Uranus', distance: 150, size: 3, color: 0x4fd0e7, speed: 0.004 },
            { name: 'Neptune', distance: 180, size: 3, color: 0x4b70dd, speed: 0.003 }
        ];
        
        this.planets = [];
        
        planetData.forEach((data, index) => {
            // Planet sphere
            const planetGeometry = new THREE.SphereGeometry(data.size, 16, 16);
            const planetMaterial = new THREE.MeshPhongMaterial({
                color: data.color,
                shininess: 30
            });
            
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // Orbital container
            const orbit = new THREE.Group();
            orbit.add(planet);
            planet.position.x = data.distance;
            
            // Orbital path visualization
            const orbitGeometry = new THREE.RingGeometry(data.distance - 0.5, data.distance + 0.5, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            const orbitRing = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbitRing.rotation.x = Math.PI / 2;
            this.solarSystem.add(orbitRing);
            
            // Special effects for certain planets
            if (data.name === 'Saturn') {
                // Saturn's rings
                const ringGeometry = new THREE.RingGeometry(data.size + 1, data.size + 3, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xc4a582,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const rings = new THREE.Mesh(ringGeometry, ringMaterial);
                rings.rotation.x = Math.PI / 2;
                planet.add(rings);
            }
            
            if (data.name === 'Earth') {
                // Earth's moon
                const moonGeometry = new THREE.SphereGeometry(0.5, 8, 8);
                const moonMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
                const moon = new THREE.Mesh(moonGeometry, moonMaterial);
                moon.position.x = 4;
                planet.add(moon);
            }
            
            orbit.userData = {
                speed: data.speed,
                planet: planet,
                name: data.name
            };
            
            this.planets.push(orbit);
            this.solarSystem.add(orbit);
        });
    }
    
    createTechIcons() {
        const iconTextures = this.createIconTextures();
        const iconCount = 200;
        
        const geometry = new THREE.PlaneGeometry(4, 4);
        
        iconTextures.forEach((texture, index) => {
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.5,
                side: THREE.DoubleSide
            });
            
            const instancedMesh = new THREE.InstancedMesh(geometry, material, iconCount / iconTextures.length);
            
            const matrix = new THREE.Matrix4();
            const position = new THREE.Vector3();
            const rotation = new THREE.Euler();
            const scale = new THREE.Vector3();
            
            for (let i = 0; i < iconCount / iconTextures.length; i++) {
                // Random position in space
                position.set(
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400,
                    (Math.random() - 0.5) * 400
                );
                
                rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                const scaleValue = Math.random() * 0.5 + 0.5;
                scale.set(scaleValue, scaleValue, scaleValue);
                
                matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale);
                instancedMesh.setMatrixAt(i, matrix);
            }
            
            instancedMesh.userData = {
                originalPositions: [],
                rotationSpeed: Math.random() * 0.02 + 0.01
            };
            
            // Store original positions for animation
            for (let i = 0; i < iconCount / iconTextures.length; i++) {
                instancedMesh.getMatrixAt(i, matrix);
                position.setFromMatrixPosition(matrix);
                instancedMesh.userData.originalPositions.push(position.clone());
            }
            
            this.techIcons.push(instancedMesh);
            this.scene.add(instancedMesh);
        });
    }
    
    createIconTextures() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const icons = [
            '💻', '🖥️', '📱', '⚙️', '🔧', '🔨', '💾', '🖨️', '🔌', '💡',
            '🚀', '⭐', '💎', '🔥', '⚡', '🌟', '🎯', '🎮', '🖱️', '⌨️'
        ];
        
        return icons.map(icon => {
            ctx.clearRect(0, 0, 64, 64);
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.generateMipmaps = false;
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            
            return texture;
        });
    }
    
    createGeometries() {
        // Floating geometric shapes
        const shapes = [
            { geometry: new THREE.TetrahedronGeometry(5, 0), position: { x: -30, y: 20, z: -20 } },
            { geometry: new THREE.OctahedronGeometry(4, 0), position: { x: 40, y: -15, z: -30 } },
            { geometry: new THREE.IcosahedronGeometry(6, 0), position: { x: -20, y: -25, z: -40 } },
            { geometry: new THREE.DodecahedronGeometry(3, 0), position: { x: 35, y: 30, z: -25 } }
        ];
        
        shapes.forEach((shape, index) => {
            const material = new THREE.MeshPhongMaterial({
                color: [0x00ffff, 0xff0080, 0xffff00, 0x0080ff][index],
                transparent: true,
                opacity: 0.7,
                wireframe: Math.random() > 0.5
            });
            
            const mesh = new THREE.Mesh(shape.geometry, material);
            mesh.position.set(shape.position.x, shape.position.y, shape.position.z);
            
            // Add rotation properties
            mesh.userData = {
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.02,
                    y: (Math.random() - 0.5) * 0.02,
                    z: (Math.random() - 0.5) * 0.02
                },
                floatSpeed: Math.random() * 0.005 + 0.002,
                floatRange: Math.random() * 10 + 5
            };
            
            this.geometries.push(mesh);
            this.scene.add(mesh);
        });
    }
    
    create3DAudioWaves() {
        // Create 3D audio wave visualization
        const waveGeometry = new THREE.PlaneGeometry(2, 2, 64, 64);
        const waveMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uAudioData: { value: this.audioData },
                uMouseX: { value: 0 },
                uMouseY: { value: 0 },
                uHover: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                uniform float[128] uAudioData;
                uniform float uMouseX;
                uniform float uMouseY;
                uniform float uHover;
                
                varying vec2 vUv;
                varying vec3 vPosition;
                varying float vAudioValue;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Audio-reactive waves
                    int audioIndex = int(uv.x * 127.0);
                    float audioValue = uAudioData[audioIndex] / 255.0;
                    vAudioValue = audioValue;
                    
                    // Multiple wave layers
                    float wave1 = sin(pos.x * 10.0 + uTime * 2.0) * audioValue * 3.0;
                    float wave2 = cos(pos.y * 8.0 + uTime * 1.5) * audioValue * 2.0;
                    float wave3 = sin((pos.x + pos.y) * 6.0 + uTime * 3.0) * audioValue * 1.5;
                    
                    // Mouse interaction
                    float mouseInfluence = 1.0 + uHover * 2.0;
                    float mouseDistX = abs(pos.x - uMouseX * 2.0);
                    float mouseDistY = abs(pos.y - uMouseY * 2.0);
                    float mouseDist = length(vec2(mouseDistX, mouseDistY));
                    float mouseEffect = exp(-mouseDist * 3.0) * uHover * 5.0;
                    
                    pos.z = (wave1 + wave2 + wave3 + mouseEffect) * mouseInfluence;
                    
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPosition;
                varying float vAudioValue;
                
                void main() {
                    vec3 color1 = vec3(0.0, 1.0, 1.0); // Cyan
                    vec3 color2 = vec3(1.0, 0.0, 0.5); // Magenta
                    vec3 color3 = vec3(1.0, 1.0, 0.0); // Yellow
                    
                    // Audio-reactive colors
                    vec3 finalColor = mix(color1, color2, vAudioValue);
                    finalColor = mix(finalColor, color3, sin(uTime + vPosition.z) * 0.5 + 0.5);
                    
                    // Intensity based on height
                    float intensity = abs(vPosition.z) * 0.5 + 0.5;
                    finalColor *= intensity;
                    
                    // Add glow effect
                    float glow = 1.0 - distance(vUv, vec2(0.5)) * 2.0;
                    finalColor += vec3(0.1, 0.3, 0.5) * glow * vAudioValue;
                    
                    gl_FragColor = vec4(finalColor, 0.8);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create multiple audio wave planes
        const numWaves = 8;
        for (let i = 0; i < numWaves; i++) {
            const wave = new THREE.Mesh(waveGeometry, waveMaterial.clone());
            wave.position.z = -50 + (i * 15);
            wave.position.y = Math.sin(i * 0.5) * 20;
            wave.rotation.x = -Math.PI * 0.3;
            wave.scale.setScalar(50 + i * 10);
            
            wave.userData = {
                originalY: wave.position.y,
                rotationSpeed: 0.01 + i * 0.002,
                hoverState: 0
            };
            
            this.scene.add(wave);
        }
        
        this.audioWaves = this.scene.children.filter(child => 
            child instanceof THREE.Mesh && child.material.uniforms && child.material.uniforms.uAudioData
        );
    }
    
    createDizzyTunnels() {
        // Create mind-bending tunnel effects
        const tunnelGeometry = new THREE.CylinderGeometry(5, 50, 200, 32, 1, true);
        const tunnelMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uSpeed: { value: 2.0 }
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Spiral deformation
                    float angle = atan(pos.x, pos.z) + uTime * 2.0;
                    float radius = length(vec2(pos.x, pos.z));
                    
                    pos.x = cos(angle) * radius;
                    pos.z = sin(angle) * radius;
                    
                    // Pulsing effect
                    pos *= 1.0 + sin(uTime * 3.0 + pos.y * 0.1) * 0.2;
                    
                    vPosition = pos;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                varying vec2 vUv;
                varying vec3 vPosition;
                
                void main() {
                    vec2 uv = vUv;
                    
                    // Hypnotic patterns
                    float pattern = sin(uv.y * 50.0 + uTime * 5.0) * cos(uv.x * 30.0 + uTime * 3.0);
                    
                    vec3 color1 = vec3(1.0, 0.0, 1.0);
                    vec3 color2 = vec3(0.0, 1.0, 1.0);
                    vec3 color3 = vec3(1.0, 1.0, 0.0);
                    
                    vec3 finalColor = mix(color1, color2, pattern * 0.5 + 0.5);
                    finalColor = mix(finalColor, color3, sin(uTime + vPosition.y * 0.01) * 0.5 + 0.5);
                    
                    // Fade edges
                    float fade = 1.0 - abs(uv.y - 0.5) * 2.0;
                    
                    gl_FragColor = vec4(finalColor * fade, 0.6);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 3; i++) {
            const tunnel = new THREE.Mesh(tunnelGeometry, tunnelMaterial.clone());
            tunnel.position.z = -100 + i * 100;
            tunnel.rotation.z = i * Math.PI * 0.3;
            tunnel.userData = { speed: 1 + i * 0.5 };
            this.dizzyTunnels.push(tunnel);
            this.scene.add(tunnel);
        }
    }
    
    createHypnoticSpirals() {
        // Create mesmerizing spiral effects
        const spiralGeometry = new THREE.PlaneGeometry(100, 100, 128, 128);
        const spiralMaterial = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uRotation: { value: 0 }
            },
            vertexShader: `
                uniform float uTime;
                varying vec2 vUv;
                
                void main() {
                    vUv = uv;
                    vec3 pos = position;
                    
                    // Spiral wave deformation
                    float angle = atan(pos.x, pos.y) + length(vec2(pos.x, pos.y)) * 0.1;
                    float wave = sin(angle * 8.0 + uTime * 4.0) * 2.0;
                    pos.z = wave;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform float uRotation;
                varying vec2 vUv;
                
                void main() {
                    vec2 center = vec2(0.5);
                    vec2 pos = vUv - center;
                    
                    // Rotating spiral pattern
                    float angle = atan(pos.y, pos.x) + uRotation;
                    float radius = length(pos);
                    
                    float spiral = sin(angle * 12.0 - radius * 20.0 + uTime * 3.0);
                    
                    vec3 color1 = vec3(0.0, 1.0, 0.5);
                    vec3 color2 = vec3(1.0, 0.0, 1.0);
                    vec3 color3 = vec3(1.0, 0.5, 0.0);
                    
                    vec3 finalColor = mix(color1, color2, spiral * 0.5 + 0.5);
                    finalColor = mix(finalColor, color3, sin(uTime * 2.0 + radius * 10.0) * 0.5 + 0.5);
                    
                    // Radial fade
                    float fade = 1.0 - smoothstep(0.3, 0.7, radius);
                    
                    gl_FragColor = vec4(finalColor, fade * 0.7);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        for (let i = 0; i < 4; i++) {
            const spiral = new THREE.Mesh(spiralGeometry, spiralMaterial.clone());
            spiral.position.set(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                -150 + i * 50
            );
            spiral.rotation.x = Math.random() * Math.PI;
            spiral.rotation.y = Math.random() * Math.PI;
            spiral.userData = { rotationSpeed: (Math.random() - 0.5) * 0.02 };
            this.hypnotricSpirals.push(spiral);
            this.scene.add(spiral);
        }
    }
    
    createPsychedelicShapes() {
        // Create mind-bending geometric shapes
        const shapes = [
            new THREE.IcosahedronGeometry(15, 2),
            new THREE.OctahedronGeometry(20, 1),
            new THREE.TetrahedronGeometry(12, 0),
            new THREE.DodecahedronGeometry(18, 0)
        ];
        
        shapes.forEach((geometry, index) => {
            const material = new THREE.ShaderMaterial({
                uniforms: {
                    uTime: { value: 0 },
                    uColor1: { value: new THREE.Color(Math.random(), Math.random(), Math.random()) },
                    uColor2: { value: new THREE.Color(Math.random(), Math.random(), Math.random()) }
                },
                vertexShader: `
                    uniform float uTime;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        vPosition = position;
                        vNormal = normal;
                        
                        vec3 pos = position;
                        
                        // Morphing effect
                        pos += normal * sin(uTime * 3.0 + pos.x * 0.1) * 3.0;
                        pos *= 1.0 + sin(uTime * 2.0) * 0.3;
                        
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float uTime;
                    uniform vec3 uColor1;
                    uniform vec3 uColor2;
                    varying vec3 vPosition;
                    varying vec3 vNormal;
                    
                    void main() {
                        float noise = sin(vPosition.x * 0.1 + uTime) * 
                                     cos(vPosition.y * 0.1 + uTime) * 
                                     sin(vPosition.z * 0.1 + uTime);
                        
                        vec3 color = mix(uColor1, uColor2, noise * 0.5 + 0.5);
                        
                        // Fresnel effect
                        float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                        color += vec3(0.2, 0.5, 1.0) * fresnel;
                        
                        gl_FragColor = vec4(color, 0.8);
                    }
                `,
                transparent: true
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                (Math.random() - 0.5) * 300,
                (Math.random() - 0.5) * 300,
                (Math.random() - 0.5) * 200
            );
            mesh.userData = {
                originalPosition: mesh.position.clone(),
                rotationSpeed: {
                    x: (Math.random() - 0.5) * 0.05,
                    y: (Math.random() - 0.5) * 0.05,
                    z: (Math.random() - 0.5) * 0.05
                },
                floatSpeed: Math.random() * 0.01 + 0.005
            };
            
            this.psychedelicShapes.push(mesh);
            this.scene.add(mesh);
        });
    }
    
    createLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Dynamic colored lights
        const colors = [0x00ffff, 0xff0080, 0xffff00, 0x80ff00, 0xff8000];
        colors.forEach((color, index) => {
            const light = new THREE.PointLight(color, 1.5, 150);
            light.position.set(
                Math.cos(index * Math.PI * 0.4) * 80,
                Math.sin(index * Math.PI * 0.3) * 60,
                Math.sin(index * Math.PI * 0.5) * 100
            );
            light.userData = {
                originalPosition: light.position.clone(),
                orbitSpeed: 0.01 + index * 0.003
            };
            this.scene.add(light);
        });
    }
    
    addEventListeners() {
        // Mouse movement for camera interaction
        document.addEventListener('mousemove', (event) => {
            this.targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Click to toggle roller coaster / free camera
        document.addEventListener('click', (event) => {
            this.rollerCoasterActive = !this.rollerCoasterActive;
            
            if (!this.rollerCoasterActive) {
                // Save current position for free camera
                this.originalCameraPosition.copy(this.camera.position);
                console.log('Free camera mode - use mouse to look around');
            } else {
                console.log('Roller coaster mode active');
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
            
            // Update post-processing
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            switch(event.code) {
                case 'Space':
                    event.preventDefault();
                    this.rollerCoasterActive = !this.rollerCoasterActive;
                    break;
                case 'KeyR':
                    // Reset camera
                    this.cameraProgress = 0;
                    break;
                case 'KeyS':
                    // Speed up roller coaster
                    this.cameraSpeed *= 1.5; // Gentler speed increase
                    break;
            }
        });
        
        // Disable scroll effects to focus on 3D experience
        document.addEventListener('wheel', (event) => {
            if (!this.rollerCoasterActive) {
                // Zoom in free camera mode
                event.preventDefault();
                this.camera.fov += event.deltaY * 0.05;
                this.camera.fov = Math.max(10, Math.min(120, this.camera.fov));
                this.camera.updateProjectionMatrix();
            }
        }, { passive: false });
    }
    
    animate() {
        this.time += 0.016;
        
        // Get audio data for visualizations
        if (window.audioController) {
            this.audioData = window.audioController.getAudioData() || new Array(128).fill(0);
            this.dizzyFactor = window.audioController.getBassBeat() * 2;
        }
        
        // Smooth mouse following for interaction
        this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
        this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;
        
        // Update roller coaster camera
        this.updateRollerCoasterCamera();
        
        // Update massive galaxy
        this.updateGalaxy();
        
        // Update billions of stars
        this.updateStarLayers();
        
        // Update solar system
        this.updateSolarSystem();
        
        // Update nebulae
        this.updateNebulae();
        
        // Detect tunnel segment for enhanced bloom
        const tunnelProgressStart = 0.35; // Approximate progress where tunnel starts
        const tunnelProgressEnd = 0.45;
        const inTunnel = this.cameraProgress % 1 >= tunnelProgressStart && this.cameraProgress % 1 <= tunnelProgressEnd;
        
        // Render with post-processing if available
        if (this.composer) {
            // Update bloom with audio and tunnel enhancement
            if (this.bloomPass) {
                this.bloomPass.strength = 1.5 + this.dizzyFactor * 2 + (inTunnel ? 3.0 : 0); // Extra bloom in tunnel
                this.bloomPass.radius = 0.8 + this.dizzyFactor * 0.5 + (inTunnel ? 1.2 : 0);
                this.bloomPass.threshold = inTunnel ? 0.05 : 0.1; // Lower threshold for more glow in tunnel
            }
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
        
        requestAnimationFrame(() => this.animate());
    }
    
    updateRollerCoasterCamera() {
        if (!this.cameraPath) return;
        
        // Audio-reactive speed with smoothing
        const baseSpeed = 0.0005;
        const audioSpeed = this.dizzyFactor * 0.001;
        const targetSpeed = baseSpeed + audioSpeed;
        this.cameraSpeed += (targetSpeed - this.cameraSpeed) * 0.02; // Smooth speed changes
        
        if (this.rollerCoasterActive) {
            this.cameraProgress += this.cameraSpeed;
            if (this.cameraProgress > 1) this.cameraProgress = 0;
            
            // Get target position and tangent on path for smoother movement
            const targetPosition = this.cameraPath.getPoint(this.cameraProgress);
            const tangent = this.cameraPath.getTangent(this.cameraProgress).normalize();
            
            // Calculate velocity based on tangent and speed
            this.cameraVelocity.copy(tangent).multiplyScalar(50 * this.cameraSpeed * 60); // Approximate units per frame
            
            // Lerp current position to target for ultra-smooth interpolation
            this.camera.position.lerp(targetPosition, this.smoothingFactor);
            
            // Add subtle banking and rolling based on curve
            const curvature = Math.sin(this.cameraProgress * Math.PI * 10) * 0.2; // Smoother freq
            const roll = curvature * 0.4;
            const pitch = Math.cos(this.cameraProgress * Math.PI * 8) * 0.15;
            
            // Smooth micro-vibrations
            const vibration = new THREE.Vector3(
                Math.sin(this.time * 8) * 0.3,  // Reduced amplitude
                Math.cos(this.time * 10) * 0.2,
                Math.sin(this.time * 6) * 0.25
            ).multiplyScalar(this.dizzyFactor * 0.5 + 0.05);
            
            this.camera.position.add(vibration);
            
            // Dynamic look-at target with enhanced mouse control
            const targetIndex = Math.floor((this.cameraProgress % 1) * this.cameraTargets.length);
            let lookTarget = this.cameraTargets[targetIndex] || this.cameraTargets[0];
            
            // Stronger mouse influence for angle control
            const mouseInfluenceStrength = 0.3; // Adjustable sensitivity
            const mouseInfluence = new THREE.Vector3(
                this.mouse.x * 50 * mouseInfluenceStrength,
                this.mouse.y * 40 * mouseInfluenceStrength,
                0
            );
            
            this.cameraLookTarget.lerp(lookTarget.clone().add(mouseInfluence), 0.1); // Smooth look target
            this.camera.lookAt(this.cameraLookTarget);
            
            // Apply smooth banking
            this.camera.rotateZ(roll * 0.5); // Reduced roll intensity
        }
    }
    
    updateGalaxy() {
        if (!this.galaxy) return;
        
        // Update galaxy core
        if (this.galaxyCore) {
            this.galaxyCore.material.uniforms.uTime.value = this.time;
            this.galaxyCore.rotation.y += 0.001;
            
            // Audio-reactive core intensity
            this.galaxyCore.material.uniforms.uIntensity.value = 3.0 + this.dizzyFactor * 2;
        }
        
        // Update main galaxy
        this.galaxy.material.uniforms.uTime.value = this.time;
        this.galaxy.material.uniforms.uAudioFactor.value = this.dizzyFactor;
        
        // Galactic rotation with differential speed
        this.galaxy.rotation.y += 0.0002;
    }
    
    updateStarLayers() {
        // Update distant stars
        if (this.distantStars) {
            this.distantStars.material.uniforms.uTime.value = this.time;
            this.distantStars.rotation.y += 0.00005;
        }
        
        // Update midrange stars
        if (this.midrangeStars) {
            this.midrangeStars.material.uniforms.uTime.value = this.time;
            this.midrangeStars.material.uniforms.uAudioFactor.value = this.dizzyFactor;
        }
        
        // Update foreground stars
        if (this.foregroundStars) {
            this.foregroundStars.material.uniforms.uTime.value = this.time;
            this.foregroundStars.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
        }
    }
    
    updateSolarSystem() {
        if (!this.solarSystem) return;
        
        // Update sun
        if (this.sun) {
            this.sun.material.uniforms.uTime.value = this.time;
            this.sun.material.uniforms.uIntensity.value = 5.0 + this.dizzyFactor * 3;
            this.sun.rotation.y += 0.01;
        }
        
        // Update corona
        if (this.corona) {
            this.corona.rotation.y -= 0.005;
            this.corona.material.opacity = 0.1 + this.dizzyFactor * 0.2;
        }
        
        // Update planets
        if (this.planets) {
            this.planets.forEach(orbit => {
                orbit.rotation.y += orbit.userData.speed * (1 + this.dizzyFactor * 0.5);
                
                // Planet self-rotation
                orbit.userData.planet.rotation.y += 0.02;
                
                // Audio-reactive planet glow
                if (orbit.userData.name === 'Jupiter' || orbit.userData.name === 'Saturn') {
                    orbit.userData.planet.material.emissive.setRGB(
                        this.dizzyFactor * 0.1,
                        this.dizzyFactor * 0.05,
                        0
                    );
                }
            });
        }
    }
    
    updateNebulae() {
        if (this.nebulae) {
            this.nebulae.forEach((nebula, index) => {
                nebula.material.uniforms.uTime.value = this.time;
                
                // Slow rotation
                nebula.rotation.z += nebula.userData.rotationSpeed;
                
                // Audio-reactive opacity
                nebula.material.uniforms.uOpacity.value = 0.3 + this.dizzyFactor * 0.4;
                
                // Gentle floating motion
                nebula.position.y = nebula.userData.originalPosition.y + 
                                   Math.sin(this.time * 0.001 + index) * 20;
            });
        }
    }
    
    // Method to update scene based on current section
    updateForSection(sectionName) {
        switch(sectionName) {
            case 'home':
                gsap.to(this.camera.position, {
                    duration: 2,
                    x: 0,
                    y: 0,
                    z: 50,
                    ease: "power2.inOut"
                });
                break;
            case 'about':
                gsap.to(this.camera.position, {
                    duration: 2,
                    x: -20,
                    y: 10,
                    z: 40,
                    ease: "power2.inOut"
                });
                break;
            case 'projects':
                gsap.to(this.camera.position, {
                    duration: 2,
                    x: 20,
                    y: -10,
                    z: 45,
                    ease: "power2.inOut"
                });
                break;
            case 'skills':
                gsap.to(this.camera.position, {
                    duration: 2,
                    x: 0,
                    y: 20,
                    z: 35,
                    ease: "power2.inOut"
                });
                break;
            case 'contact':
                gsap.to(this.camera.position, {
                    duration: 2,
                    x: 0,
                    y: 0,
                    z: 60,
                    ease: "power2.inOut"
                });
                break;
        }
    }
}

// Initialize scene when DOM is loaded
let threeScene;
window.addEventListener('DOMContentLoaded', () => {
    threeScene = new ThreeScene();
});

}