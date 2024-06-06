import{
Vector3,
Color,
PerspectiveCamera,
Scene,
Fog,
HemisphereLight,
Raycaster,
PlaneGeometry,
SRGBColorSpace,
Float32BufferAttribute,
MeshBasicMaterial,
Mesh,
BoxGeometry,
MeshPhongMaterial,
WebGLRenderer,
EquirectangularReflectionMapping,
ACESFilmicToneMapping,
} from 'three';

			import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
            import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
			import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

			let camera, scene, renderer, controls;

			const objects = [];

			let raycaster;

			let moveForward = false;
			let moveBackward = false;
			let moveLeft = false;
			let moveRight = false;

			let prevTime = performance.now();
			const velocity = new Vector3();
			const direction = new Vector3();

			init();
			animate();

			function init() {
				camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
				camera.position.y = 1.7;
			
				scene = new Scene();
			
				controls = new PointerLockControls(camera, document.body);
			
				const blocker = document.getElementById('blocker');
				const instructions = document.getElementById('instructions');
			
				instructions.addEventListener('click', function() {
					controls.lock();
				});
			
				controls.addEventListener('lock', function() {
					instructions.style.display = 'none';
					blocker.style.display = 'none';
				});
			
				controls.addEventListener('unlock', function() {
					blocker.style.display = 'block';
					instructions.style.display = '';
				});
			
				scene.add(controls.getObject());
			
				const onKeyDown = function(event) {
					switch (event.code) {
						case 'ArrowUp':
						case 'KeyW':
							moveForward = true;
							break;
						case 'ArrowLeft':
						case 'KeyA':
							moveLeft = true;
							break;
						case 'ArrowDown':
						case 'KeyS':
							moveBackward = true;
							break;
						case 'ArrowRight':
						case 'KeyD':
							moveRight = true;
							break;
					}
				};
			
				const onKeyUp = function(event) {
					switch (event.code) {
						case 'ArrowUp':
						case 'KeyW':
							moveForward = false;
							break;
						case 'ArrowLeft':
						case 'KeyA':
							moveLeft = false;
							break;
						case 'ArrowDown':
						case 'KeyS':
							moveBackward = false;
							break;
						case 'ArrowRight':
						case 'KeyD':
							moveRight = false;
							break;
					}
				};
			
				document.addEventListener('keydown', onKeyDown);
				document.addEventListener('keyup', onKeyUp);
			
				raycaster = new Raycaster(new Vector3(), new Vector3(0, -1, 0), 0, 10);
			
				// Tạo danh sách thả xuống để chọn texture
				const textureSelect = document.createElement('select');
				textureSelect.id = 'textureSelect';
				const option1 = document.createElement('option');
				option1.value = 'texture1';
				option1.textContent = 'Museum';
				const option2 = document.createElement('option');
				option2.value = 'texture2';
				option2.textContent = 'House';
				textureSelect.appendChild(option1);
				textureSelect.appendChild(option2);
				instructions.appendChild(textureSelect);
			
				// Tạo nút để thay đổi texture và model
				const changeTextureButton = document.createElement('button');
				changeTextureButton.textContent = 'Change Model';
				changeTextureButton.onclick = changeTexture;
				instructions.appendChild(changeTextureButton);
			
				// Tải texture mặc định và model mặc định
				loadDefaultTextureAndModel();
			
				renderer = new WebGLRenderer({ antialias: true });
				renderer.setPixelRatio(window.devicePixelRatio);
				renderer.setSize(window.innerWidth, window.innerHeight);
				renderer.toneMapping = ACESFilmicToneMapping;
				renderer.toneMappingExposure = 1;
				renderer.useLegacyLights = false;
				document.body.appendChild(renderer.domElement);
			
				window.addEventListener('resize', onWindowResize);
			}
			
			function loadDefaultTextureAndModel() {
				// Tải texture mặc định
				new RGBELoader().setPath('./textures/').load('grey_4k.hdr', function(texture) {
					texture.mapping = EquirectangularReflectionMapping;
					scene.background = texture;
					scene.environment = texture;
				});
			
				// Tải model mặc định
				const loader = new GLTFLoader().setPath('./models/');
				loader.load('Museum.glb', function(gltf) {
					scene.add(gltf.scene);
				});
			}
			
			function changeTexture() {
				const textureSelect = document.getElementById('textureSelect');
				const selectedTexture = textureSelect.value;
			
				// Thay đổi texture dựa trên lựa chọn của người dùng
				switch (selectedTexture) {
					case 'texture1':
						changeTextureTo('grey_4k.hdr', 'Museum.glb');
						break;
					case 'texture2':
						changeTextureTo('danang.hdr', 'House.glb');
						break;
				}
			}
			
			function changeTextureTo(textureFileName, modelFileName) {
				// Tải texture mới
				const textureLoader = new RGBELoader();
				textureLoader.setPath('./textures/');
				textureLoader.load(textureFileName, function(texture) {
					texture.mapping = EquirectangularReflectionMapping;
					scene.background = texture;
					scene.environment = texture;
				});
			
				// Tải model mới
				const loader = new GLTFLoader().setPath('./models/');
				loader.load(modelFileName, function(gltf) {
					// Xóa các model cũ khỏi scene
					scene.children.forEach(child => {
						if (child.isMesh || child.isGroup) {
							scene.remove(child);
						}
					});
					// Thêm model mới vào scene
					scene.add(gltf.scene);
				});
			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {

				requestAnimationFrame( animate );

				const time = performance.now();

				if ( controls.isLocked === true ) {

					raycaster.ray.origin.copy( controls.getObject().position );

					const delta = ( time - prevTime ) / 1000;

					velocity.x -= velocity.x * 10.0 * delta;
					velocity.z -= velocity.z * 10.0 * delta;

					direction.z = Number( moveForward ) - Number( moveBackward );
					direction.x = Number( moveRight ) - Number( moveLeft );
					direction.normalize(); // this ensures consistent movements in all directions

					if ( moveForward || moveBackward ) velocity.z -= direction.z * 40.0 * delta;
					if ( moveLeft || moveRight ) velocity.x -= direction.x * 40.0 * delta;

					controls.moveRight( - velocity.x * delta );
					controls.moveForward( - velocity.z * delta );

				}

				prevTime = time;

				renderer.render( scene, camera );

			}