

var camera, scene, renderer;

var isUserInteracting = false,
    onMouseDownMouseX = 0, onMouseDownMouseY = 0,
    lon = 0, onMouseDownLon = 0,
    lat = 0, onMouseDownLat = 0,
    phi = 0, theta = 0;

init();
animate();

function init() {

    var container;

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 1100 );
    camera.target = new THREE.Vector3( 0, 0, 0 );

    scene = new THREE.Scene();

    var materials = getTextures();

    var skyBox = new THREE.Mesh(new THREE.CubeGeometry(200, 200, 200), materials);
    skyBox.applyMatrix(new THREE.Matrix4().makeScale(1, 1, -1));
    scene.add(skyBox);

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'wheel', onDocumentMouseWheel, false );

    document.addEventListener( 'drop', function ( event ) {

        event.preventDefault();

        var reader = new FileReader();
        reader.addEventListener( 'load', function ( event ) {

            material.map.image.src = event.target.result;
            material.map.needsUpdate = true;

        }, false );
        reader.readAsDataURL( event.dataTransfer.files[ 0 ] );

        document.body.style.opacity = 1;

    }, false );

    //

    window.addEventListener( 'resize', onWindowResize, false );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseDown( event ) {

    event.preventDefault();

    isUserInteracting = true;

    onMouseDownMouseX = event.clientX;
    onMouseDownMouseY = event.clientY;

    onMouseDownLon = lon;
    onMouseDownLat = lat;

}

function onDocumentMouseMove( event ) {

    if ( isUserInteracting === true ) {


        lon = ( onMouseDownMouseX - event.clientX ) * 0.1 *camera.fov/100 + onMouseDownLon;
        lat = ( event.clientY - onMouseDownMouseY ) * 0.1 *camera.fov/100 + onMouseDownLat;

    }

}

function onDocumentMouseUp( event ) {

    isUserInteracting = false;

}

function onDocumentMouseWheel( event ) {

    //event.deltaY 触发wheel事件时，使用deltaY属性返回鼠标滚轮的垂直滚动量（Y轴）。 一般鼠标上的滚轮为前后滚轮，往前滚动时deltaY的值为负值，往后滚动为正值。
    var fov = camera.fov + event.deltaY * 0.03;

    //THREE.Math.clamp 如果x小于a，返回a。 如果x大于b，返回b，否则返回x
    camera.fov = THREE.Math.clamp( fov, 10, 120 );

    camera.updateProjectionMatrix();

}

function animate() {

    requestAnimationFrame( animate );
    update();

}

function update() {

    if ( isUserInteracting === false ) {

        //lon += 0.1;

    }

    lat = THREE.Math.clamp( lat, - 89.9, 89.9 );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );

    camera.target.x = 100 * Math.sin( phi ) * Math.cos( theta );
    camera.target.y = 100 * Math.cos( phi );
    camera.target.z = 100 * Math.sin( phi ) * Math.sin( theta );

    camera.lookAt( camera.target );

    //console.log(lon%360,lat,camera.fov,camera.target);

    renderer.render( scene, camera );

}

function getTextures(arr) {
    //判断一下是否有数组传入，如果有则按照数组传入的图形进行绘制
    let uvArr = [];
    if (arr) {
        uvArr = arr;
    }
    else {
        //如果没有传入，则使用默认生成的一组
        let uv = ["r", "l", "u", "d", "b", "f"];
        let dir = "images/100000_2/";
        let jpg = ".jpg";
        for (let i = 0; i < uv.length; i++) {
            uvArr[i] = dir + uv[i] + jpg;
        }
    }

    let textureLoader = new THREE.TextureLoader();

    let materials = [];
    for (let i = 0, len = uvArr.length; i < len; i++) {
        materials.push(new THREE.MeshBasicMaterial({map: textureLoader.load(uvArr[i])}));
    }

    return materials;
}

class Panomara{
    constructor(){
        //存储一些相关配置项
        this.settings = {};

        //存储一些常量的对象
        this.const = {
            renderer:null, //渲染器
            camera:null, //相机
            scene:null, //场景
            light:null, //光源

        };

        //存储当前全景状态的对象
        this.state = {};

    }

    //初始化渲染器
    _initRender() {
        width = document.getElementById('canvas-frame').clientWidth;
        height = document.getElementById('canvas-frame').clientHeight;
        renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(width, height);
        document.getElementById('canvas-frame').appendChild(renderer.domElement);
        renderer.setClearColor(0xFFFFFF, 1.0);
    }

    //初始化相机
    _initCamera() {
        camera = new THREE.PerspectiveCamera(70, width / height, 1, 1000);
        camera.position.x = 0;
        camera.position.y = 1000;
        camera.position.z = 0;
        camera.up.x = 0;
        camera.up.y = 0;
        camera.up.z = 1;
        camera.lookAt({
            x: 0,
            y: 0,
            z: 0
        });
    }

    //初始化场景
    _initScene() {
        scene = new THREE.Scene();
    }

    //初始化灯光
    _initLight() {
        light = new THREE.DirectionalLight(0xFF0000, 1.0, 0);
        light.position.set(100, 100, 200);
        scene.add(light);
    }

    //初始化模型
    _initModel() {
        var geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-500, 0, 0));
        geometry.vertices.push(new THREE.Vector3(500, 0, 0));

        for (var i = 0; i <= 20; i++) {

            var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: randomColor(), opacity: 1}));
            line.position.z = ( i * 50 ) - 500;
            scene.add(line);

            var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({color: randomColor(), opacity: 1}));
            line.position.x = ( i * 50 ) - 500;
            line.rotation.y = 90 * Math.PI / 180;
            scene.add(line);

        }
    }

    //绘制方法
    _draw() {
        let that = this;
        that._initRender();
        that._initCamera();
        that._initScene();
        that._initLight();
        that._initModel();
        that.const.renderer.clear();
        that.const.renderer.render(scene, camera);
    }

}