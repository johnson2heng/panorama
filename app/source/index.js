//双屏代码引入
THREE.StereoEffect = function (renderer) {

    var _stereo = new THREE.StereoCamera();
    _stereo.aspect = 0.5;

    this.setEyeSeparation = function (eyeSep) {

        _stereo.eyeSep = eyeSep;

    };

    this.setSize = function (width, height) {

        renderer.setSize(width, height);

    };

    this.render = function (scene, camera) {

        var size = renderer.getSize();

        //增加高度和宽度的判断

        if (size.width >= size.height) {

            _stereo.aspect = 0.5;

            scene.updateMatrixWorld();

            if (camera.parent === null) camera.updateMatrixWorld();

            _stereo.update(camera);

            if (renderer.autoClear) renderer.clear();
            renderer.setScissorTest(true); //启用或禁用裁剪测试。当被激活时，只有裁剪区域内的像素会被进一步的渲染行为所影响。

            //注：以下两种方法中点（x,y）是该区域的左下角。 该区域被定义从左到右的宽度，以及从底部到顶部的高度。该垂直方向的定义和HTML canvas元素的填充方向相反。
            renderer.setScissor(0, 0, size.width / 2, size.height); //设置裁剪区域，从 (x, y) 到 (x + width, y + height).
            renderer.setViewport(0, 0, size.width / 2, size.height); //设置视口，从 (x, y) 到 (x + width, y + height)。
            renderer.render(scene, _stereo.cameraL);

            renderer.setScissor(size.width / 2, 0, size.width / 2, size.height);
            renderer.setViewport(size.width / 2, 0, size.width / 2, size.height);
            renderer.render(scene, _stereo.cameraR);
        }
        else {

            _stereo.aspect = 2;

            scene.updateMatrixWorld();

            if (camera.parent === null) camera.updateMatrixWorld();

            _stereo.update(camera);

            if (renderer.autoClear) renderer.clear();
            renderer.setScissorTest(true);

            renderer.setScissor(0, 0, size.width, size.height / 2);
            renderer.setViewport(0, 0, size.width, size.height / 2);
            renderer.render(scene, _stereo.cameraL);

            renderer.setScissor(0, size.height / 2, size.width, size.height / 2);
            renderer.setViewport(0, size.height / 2, size.width, size.height / 2);
            renderer.render(scene, _stereo.cameraR);
        }


        renderer.setScissorTest(false);

    };

};

//<!-- 控制陀螺仪 （DeviceOrientationControls.js） -->
THREE.DeviceOrientationControls = function (object) {
    var scope = this;
    this.object = object;
    this.object.rotation.reorder("YXZ");
    this.enabled = true;
    this.deviceOrientation = {};
    this.screenOrientation = 0;
    this.alpha = 0;
    this.alphaOffsetAngle = 0;
    var onDeviceOrientationChangeEvent = function (event) {
        scope.deviceOrientation = event
    };
    var onScreenOrientationChangeEvent = function () {
        scope.screenOrientation = window.orientation || 0
    };
    var setObjectQuaternion = function () {
        var zee = new THREE.Vector3(0, 0, 1);
        var euler = new THREE.Euler();
        var q0 = new THREE.Quaternion();
        var q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5));
        return function (quaternion, alpha, beta, gamma, orient) {
            euler.set(beta, alpha, -gamma, 'YXZ');
            quaternion.setFromEuler(euler);
            quaternion.multiply(q1);
            quaternion.multiply(q0.setFromAxisAngle(zee, -orient));
        }
    }();
    this.connect = function () {
        onScreenOrientationChangeEvent();
        window.addEventListener('orientationchange', onScreenOrientationChangeEvent, false);
        window.addEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        scope.enabled = true
    };
    this.disconnect = function () {
        window.removeEventListener('orientationchange', onScreenOrientationChangeEvent, false);
        window.removeEventListener('deviceorientation', onDeviceOrientationChangeEvent, false);
        scope.enabled = false
    };
    this.update = function () {
        if (scope.enabled === false) {
            return
        }
        var alpha = scope.deviceOrientation.alpha ? THREE.Math.degToRad(scope.deviceOrientation.alpha) + this.alphaOffsetAngle : 0;
        var beta = scope.deviceOrientation.beta ? THREE.Math.degToRad(scope.deviceOrientation.beta) : 0;
        var gamma = scope.deviceOrientation.gamma ? THREE.Math.degToRad(scope.deviceOrientation.gamma) : 0;
        var orient = scope.screenOrientation ? THREE.Math.degToRad(scope.screenOrientation) : 0;
        setObjectQuaternion(scope.object.quaternion, alpha, beta, gamma, orient);
        this.alpha = alpha
    };
    this.updateAlphaOffsetAngle = function (angle) {
        this.alphaOffsetAngle = angle;
        this.update()
    };
    this.dispose = function () {
        this.disconnect()
    };
    this.connect()
};


class Panomara {
    constructor() {
        let that = this;
        //存储一些相关配置项
        that.settings = {
            timeDelay: 10000, // 触碰页面后，再次自动旋转的延迟
            moveRate: 0.1, // 自动旋转时，每一帧角度移动的角度，默认零点一度
            minFov: 10, //设置最小的视角
            maxFov: 120, //设置最大的视角
        };

        //存储一些常量的对象
        that.constant = {
            container: document.getElementById("container"), //全景的容器
            renderer: null, //渲染器
            VRRenderer: null, //VR渲染器
            camera: null, //相机
            scene: null, //场景
            light: null, //光源
            skyBox: null, //存储全景纹理的天空盒子
            dop: new Dop(), //dop类
            media: null, //当前设备的类型
            devices:null, //陀螺仪
        };

        //存储当前全景状态的对象
        that.state = {
            //当前场景的角度和缩放
            position: {
                lon: 0, //当前的水平角度
                lat: 0, //当前的上下角度
                fov: 60, //当前的视角宽度
                phi: 0, //当前的水平弧度
                theta: 0, //当前的上下弧度
            },
            //当前鼠标的位置存储
            mouse: {
                onMouseDownMouseX: 0, //当前鼠标按下时的X坐标
                onMouseDownMouseY: 0, //当前鼠标按下时的y坐标
                onMouseDownLon: 0, //鼠标按下时的当前的lon
                onMouseDownLat: 0, //鼠标按下时的当前的lat
                onTwoTouchX: 0, //手指按下时的第二个手指的x坐标
                onTwoTouchY: 0, //手指按下时的第二个手指的Y坐标
                onMouseDownFov:0, //两指按下时，当前场景的fov
            },
            autoMove: true, //当前场景是否自动旋转
            timeout: null, //延迟旋转的延迟器
            canAutoMove: false, //当前场景是否能够自动旋转
            renderer: null, // 当前使用的渲染器
            gyro:false, //当前是否处于陀螺仪状态
        };

        //初始化
        that._draw();

        //绑定相关事件
        let constant = that.constant;
        let dop = constant.dop;
        let state = that.state;
        let mouse = state.mouse;
        let position = state.position;
        let settings = that.settings;

        //获取到当前设备类型
        constant.media = constant.dop.browserRedirect();

        //绑定窗口变动事件
        window.addEventListener('resize', onWindowResize, false);

        function onWindowResize() {

            constant.camera.aspect = window.innerWidth / window.innerHeight;
            constant.camera.updateProjectionMatrix();

            constant.renderer.setSize(window.innerWidth, window.innerHeight);

        }

        //绑定鼠标
        if (constant.media === "pc") {
            constant.container.addEventListener('mousedown', onDocumentMouseDown, false);
        }
        else {
            //绑定移动端拖拽
            constant.container.addEventListener('touchstart', onDocumentMouseDown, false);
        }

        function onDocumentMouseDown(event) {

            //判断是否开启了陀螺仪
            if(state.gyro) return;

            event.preventDefault();

            state.autoMove = false;

            //判断当前的设备类型
            if (constant.media === "pc") {
                mouse.onMouseDownMouseX = event.clientX;
                mouse.onMouseDownMouseY = event.clientY;
            }
            else {
                mouse.onMouseDownMouseX = event.touches[0].clientX;
                mouse.onMouseDownMouseY = event.touches[0].clientY;
            }

            //如果是第一个手指，将记录当前的lon和lat
            if(constant.media === "pc" || event.touches.length == 1 ){
                mouse.onMouseDownLon = position.lon;
                mouse.onMouseDownLat = position.lat;
            }

            //绑定移动和抬起事件
            if (constant.media === "pc") {
                document.addEventListener('mousemove', onDocumentMouseMove, false);
                document.addEventListener('mouseup', onDocumentMouseUp, false);
            }
            else {
                if(event.touches.length == 1){
                    document.removeEventListener('touchmove', onTwoTouchMove, false);
                    document.addEventListener('touchmove', onDocumentMouseMove, false);
                    document.addEventListener('touchend', onDocumentMouseUp, false);
                }
                else if(event.touches.length == 2){
                    //获取第二个手指的位置
                    mouse.onTwoTouchX = event.touches[1].clientX;
                    mouse.onTwoTouchY = event.touches[1].clientY;
                    //存储按下时的fov值
                    mouse.onMouseDownFov = position.fov;
                    //清除第一个事件
                    document.removeEventListener('touchmove', onDocumentMouseMove, false);
                    //添加两指的拖拽事件
                    document.addEventListener('touchmove', onTwoTouchMove, false);
                }
            }

        }

        function onDocumentMouseMove(event) {

            if (state.autoMove === false) {

                let moveX, moveY;
                if (constant.media === "pc") {
                    moveX = event.clientX;
                    moveY = event.clientY;

                    position.lon = (mouse.onMouseDownMouseX - moveX) * 0.1 * constant.camera.fov / 100 + mouse.onMouseDownLon;
                    position.lat = (moveY - mouse.onMouseDownMouseY) * 0.1 * constant.camera.fov / 100 + mouse.onMouseDownLat;
                }
                else {
                    moveX = event.targetTouches[0].clientX;
                    moveY = event.targetTouches[0].clientY;

                    position.lon = (mouse.onMouseDownMouseX - moveX) * 0.1 * constant.camera.fov / 50 + mouse.onMouseDownLon;
                    position.lat = (moveY - mouse.onMouseDownMouseY) * 0.1 * constant.camera.fov / 50 + mouse.onMouseDownLat;
                }

            }

        }

        function onTwoTouchMove(event) {
            if(event.touches.length == 1) return;
            //首先计算出按下时两个手指的距离
            let downDistance = dop.getRange(mouse.onMouseDownMouseX, mouse.onMouseDownMouseY, mouse.onTwoTouchX, mouse.onTwoTouchY);

            //然后计算出移动后的两指的距离
            let moveDistance = dop.getRange(event.touches[0].clientX, event.touches[0].clientY, event.touches[1].clientX, event.touches[1].clientY);

            //最后计算一下当前的fov
            that.setSceneFov((downDistance-moveDistance)/5+mouse.onMouseDownFov);
        }

        function onDocumentMouseUp(event) {

            //清楚原来的延迟器
            clearTimeout(state.timeout);

            //清楚默认的移动和抬起事件
            document.removeEventListener('mousemove', onDocumentMouseMove, false);
            document.removeEventListener('mouseup', onDocumentMouseUp, false);
            document.removeEventListener('touchmove', onDocumentMouseMove, false);
            document.removeEventListener('touchmove', onTwoTouchMove, false);
            document.removeEventListener('touchend', onDocumentMouseUp, false);

            //设置新的定时器
            state.timeout = setTimeout(function () {
                state.autoMove = true;
            }, settings.timeDelay);

        }

        //绑定鼠标滚轮事件
        dop.wheel(constant.container, function () {
            let fov = constant.camera.fov + 3;

            //THREE.Math.clamp 如果x小于a，返回a。 如果x大于b，返回b，否则返回x
            constant.camera.fov = THREE.Math.clamp(fov, 10, 120);

            constant.camera.updateProjectionMatrix();
        }, function () {
            let fov = constant.camera.fov - 3;

            //THREE.Math.clamp 如果x小于a，返回a。 如果x大于b，返回b，否则返回x
            constant.camera.fov = THREE.Math.clamp(fov, 10, 120);

            constant.camera.updateProjectionMatrix();
        });

    }

    //初始化渲染器
    _initRender() {
        let that = this;
        let constant = that.constant;
        let state = that.state;
        constant.renderer = new THREE.WebGLRenderer();
        constant.renderer.setPixelRatio(window.devicePixelRatio);
        constant.renderer.setSize(constant.container.clientWidth, constant.container.clientHeight);
        constant.renderer.setClearColor(0xFFFFFF, 1.0);
        constant.container.appendChild(constant.renderer.domElement);
        //添加vr渲染器，进入vr状态将修改成vr渲染器进行渲染
        constant.VRRenderer = new THREE.StereoEffect(constant.renderer);

        //设置默认渲染器
        state.renderer = constant.renderer;
    }

    //初始化相机
    _initCamera() {
        let that = this;
        let constant = that.constant;
        let state = that.state;
        let position = state.position;
        constant.camera = new THREE.PerspectiveCamera(position.fov, constant.container.clientWidth / constant.container.clientHeight, 1, 1000);
        constant.camera.target = new THREE.Vector3(0, 0, 0);

        //陀螺仪
        constant.devices = new THREE.DeviceOrientationControls(constant.camera);
    }

    //初始化场景
    _initScene() {
        let that = this;
        let constant = that.constant;
        constant.scene = new THREE.Scene();
    }

    //初始化灯光
    _initLight() {
        /*light = new THREE.DirectionalLight(0xFF0000, 1.0, 0);
        light.position.set(100, 100, 200);
        scene.add(light);*/
    }

    //初始化模型
    _initModel(material) {
        let that = this;
        let constant = that.constant;
        let mater;
        if (material) {
            mater = material;
        }
        else {
            mater = new THREE.MeshBasicMaterial({color: 0x000000});
        }
    }

    //更新纹理
    updateMaterial(arr) {
        //传入的纹理图片的顺序为 ["right","left","up","down","back","front"];
        let that = this;
        let constant = that.constant;
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



        //给场景添加天空盒子纹理
        let cubeTextureLoader = new THREE.CubeTextureLoader();
        let cubeTexture = cubeTextureLoader.load(arr);

        constant.scene.background = cubeTexture;

        /*let textureLoader = new THREE.TextureLoader();

        let materials = [];
        for (let i = 0, len = uvArr.length; i < len; i++) {
            materials.push(new THREE.MeshBasicMaterial({map: textureLoader.load(uvArr[i])}));
        }

        //清除掉原来的模型，放置现在的新纹理的模型
        constant.scene.remove(constant.skyBox);

        that._initModel(materials);*/
    }

    //调用更新的方法
    animate() {
        let that = this;

        function update() {
            requestAnimationFrame(update);
            //重新绘制页面
            that.update();
        }

        update();
    }

    //绘制方法
    _draw() {
        let that = this;
        that._initRender();
        that._initCamera();
        that._initScene();
        that._initLight();
        that._initModel();

        //调用循环渲染
        that.animate();
    }

    //绘制
    update() {
        let that = this;
        let state = that.state;
        let position = state.position;
        let settings = that.settings;
        let constant = that.constant;

        //首先判断是否处于陀螺仪状态
        if(state.gyro){
            //处于陀螺仪状态，用陀螺仪更新相机
            constant.devices.update();
        }
        else{
            //不处于陀螺仪状态，正常更新相机位置

            //判断是否需要旋转
            if (state.autoMove === true && state.canAutoMove) {

                //顺时针旋转
                position.lon += settings.moveRate;

                //lat往中间回
                if(Math.abs(position.lat) > 0.1) position.lat = position.lat > 0 ? position.lat - 0.1 : position.lat + 0.1;


            }

            //计算出当前目标朝向的弧度值
            position.lat = THREE.Math.clamp(position.lat, -89.99, 89.99); //防止超过最大值
            position.phi = THREE.Math.degToRad(90 - position.lat); //返回当前角度相同的弧度值
            position.theta = THREE.Math.degToRad(position.lon); //返回当前角度相同的弧度值

            //计算出当前相机的朝向的位置
            constant.camera.target.x = 100 * Math.sin(position.phi) * Math.cos(position.theta);
            constant.camera.target.y = 100 * Math.cos(position.phi);
            constant.camera.target.z = 100 * Math.sin(position.phi) * Math.sin(position.theta);

            constant.camera.lookAt(constant.camera.target);

        }

        //console.log(lon%360,lat,camera.fov,camera.target);

        state.renderer.render(constant.scene, constant.camera);
    }

    //----------------------------------------------相关操作的方法---------------------

    //设置当前场景是否可以自动旋转，true为可以，false为不可以
    setAutoMove(bool) {
        let that = this;
        that.state.canAutoMove = bool;
        that.state.autoMove = true;
    }

    //设置当前场景全屏
    setFullScreen(bool) {
        let docElm = document.body;
        if (bool) {
            //W3C
            if (docElm.requestFullscreen) {
                docElm.requestFullscreen();
            }
            //FireFox
            else if (docElm.mozRequestFullScreen) {
                docElm.mozRequestFullScreen();
            }
            //Chrome等
            else if (docElm.webkitRequestFullScreen) {
                docElm.webkitRequestFullScreen();
            }
            //IE11
            else if (docElm.msRequestFullscreen) {
                docElm.msRequestFullscreen();
            }
        }
        else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    //陀螺仪开关
    setGyro(bool) {
        let that = this;
        that.state.gyro = !!bool;
    }

    //设置当前场景进入vr状态
    setVR(bool) {
        let that = this;
        let constant = that.constant;
        let state = that.state;
        //添加vr渲染器，进入vr状态将修改成vr渲染器进行渲染
        constant.VRRenderer = new THREE.StereoEffect(constant.renderer);
        if (bool) {
            state.renderer = constant.VRRenderer;
        }
        else {
            constant.renderer.setSize(constant.container.clientWidth, constant.container.clientHeight);
            state.renderer = constant.renderer;
        }
    }

    //设置当前场景的焦点
    setSceneCenter(lon, lat, fov) {
        let that = this;
        let position = that.state.position;
        position.lon = +lon;
        position.lat = +lat;
        if (fov) that.setSceneFov(fov);

    }

    //设置当前场景的fov
    setSceneFov(fov){
        //console.log(fov);
        let that = this;
        let constant = that.constant;
        let position = that.state.position;
        let settings = that.settings;

        if (fov) position.fov = THREE.Math.clamp(fov, settings.minFov, settings.maxFov);

        //单独设置fov
        constant.camera.fov = position.fov;
        constant.camera.updateProjectionMatrix ();

    }

    //获取当前场景的中心点
    getSceneCenter(){
        let that = this;
        let position = that.state.position;
        return {
            lon:position.lon,
            lat:position.lat,
            fov:position.fov
        }
    }
}

window.pano = new Panomara();
let uvArr = [];
let uv = ["r", "l", "u", "d", "b", "f"];
let dir = "images/100000_2/";
let jpg = ".jpg";
for (let i = 0; i < uv.length; i++) {
    uvArr[i] = dir + uv[i] + jpg;
}
pano.updateMaterial(uvArr);

let btn = document.querySelectorAll("#btn button");
let dop = new Dop();

//设置是否自动旋转
let autoMove = false;
dop.$(btn[0]).on("tap", function () {
    autoMove = !autoMove;
    pano.setAutoMove(autoMove);
});

//设置是否全屏
let fullScreen = false;
dop.$(btn[1]).on("tap", function () {
    fullScreen = !fullScreen;
    pano.setFullScreen(fullScreen);
});

//设置是否进入陀螺仪
let gyro = false;
dop.$(btn[2]).on("tap", function () {
    gyro = !gyro;
    pano.setGyro(gyro);
});

//设置是否进入vr状态
let vr = false;
dop.$(btn[3]).on("tap", function () {
    vr = !vr;
    pano.setVR(vr);
});

//设置当前的位置
dop.$(btn[4]).on("tap", function () {
    pano.setSceneCenter(180, 80, 45);
});

//设置当前的位置
dop.$(btn[5]).on("tap", function () {
    let dir = "images/100000_0/";
    for (let i = 0; i < uv.length; i++) {
        uvArr[i] = dir + uv[i] + jpg;
    }
    pano.updateMaterial(uvArr);
});

