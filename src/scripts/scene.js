import * as THREE from 'three';
import gsap from 'gsap';

// ... at the top of scene.js

// --- Global transition function ---
function triggerTransition(storyName, clickX, clickY) {
    console.log(`Story selected: ${storyName}`);

    const { scene, camera } = window.myApp;
    if (!scene || !camera) return;

    // --- 1. Create the Comet with a new, softer tail ---
    
    const comet = new THREE.Group();

    // The Comet Head (remains the same)
    const headGeo = new THREE.SphereGeometry(1.5, 32, 32);
    const headMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        blending: THREE.AdditiveBlending,
    });
    const cometHead = new THREE.Mesh(headGeo, headMat);

    // The NEW Comet Tail (using a textured plane for a soft effect)
    // First, we create a gradient texture in memory
    const tailCanvas = document.createElement('canvas');
    tailCanvas.width = 32;
    tailCanvas.height = 256;
    const tailCtx = tailCanvas.getContext('2d');
    const gradient = tailCtx.createLinearGradient(0, 0, 0, tailCanvas.height);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Solid at the top
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');  // Fades to transparent
    tailCtx.fillStyle = gradient;
    tailCtx.fillRect(0, 0, tailCanvas.width, tailCanvas.height);
    const tailTexture = new THREE.CanvasTexture(tailCanvas);

    // Now, we apply that texture to a plane
    const tailGeo = new THREE.PlaneGeometry(4, 50); // A bit wider and longer
    const tailMat = new THREE.MeshBasicMaterial({
        map: tailTexture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
    });
    const cometTail = new THREE.Mesh(tailGeo, tailMat);
    
    // Position the tail so it extends behind the head
    cometTail.position.z = 25; // Move back by half the plane's height

    comet.add(cometHead);
    comet.add(cometTail);
    
    // --- 2. Position and Animate the Comet ---
    const startPos = new THREE.Vector3().set(
        (clickX / window.innerWidth) * 2 - 1,
        - (clickY / window.innerHeight) * 2 + 1,
        0.5
    ).unproject(camera);
    
    comet.position.copy(startPos);
    
    const endPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z - 5);
    
    scene.add(comet);

    // The GSAP animation timeline
    const tl = gsap.timeline({
        onComplete: () => {
            console.log("Transition complete!");
            scene.remove(comet);
        }
    });

    tl.to("#ui-content", { opacity: 0, duration: 0.5 }, 0)
      .to(comet.scale, {
          x: 2, y: 2, z: 2, // Scale it up a bit less for a better look
          duration: 1.5, ease: 'power2.inOut'
      }, "<")
      .to(comet.position, {
          x: endPos.x, y: endPos.y, z: endPos.z,
          duration: 1.5,
          ease: 'power2.inOut',
          onUpdate: function() {
              // This makes the comet always point towards its destination
              if (comet.position.distanceTo(endPos) > 0.1) {
                  comet.lookAt(endPos);
              }
          }
      }, "<")
      .to(comet.scale, {
          x: 30, y: 30, z: 30, // Adjust final scale
          duration: 1, ease: 'power2.in'
      }, ">-0.5")
      .to("#transition-overlay", {
          opacity: 1, duration: 0.5, ease: 'power2.in'
      }, ">-0.5");
}


// --- Main Scene Initialization ---
export function initScene() {
    const canvas = document.querySelector('#bg');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.setZ(50);
    
    // Expose scene and camera for our global function
    window.myApp = { scene, camera };
    // Attach the trigger function to the window
    window.triggerTransition = triggerTransition;

    // --- Background Stars ---
    const bgStarsGeometry = new THREE.BufferGeometry();
    const bgStarVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        bgStarVertices.push(x, y, z);
    }
    bgStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(bgStarVertices, 3));
    const bgStarsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.7 });
    const backgroundStars = new THREE.Points(bgStarsGeometry, bgStarsMaterial);
    scene.add(backgroundStars);

    // The old 3D story objects have been correctly removed.

    // --- Mouse movement for camera parallax ---
    const mouse = new THREE.Vector2();
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    });

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate);
        camera.position.x += (mouse.x * 5 - camera.position.x) * 0.02;
        camera.position.y += (mouse.y * 5 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
    
    // --- Window Resize Handler ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);

    animate();
}