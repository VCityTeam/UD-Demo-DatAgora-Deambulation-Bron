/** @format */

let udviz = null;
let Shared;

module.exports = class Focus {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    //quaternion to place the camera
    this.quaternionCam = new Shared.THREE.Quaternion().setFromEuler(
      new Shared.THREE.Euler(Math.PI * 0.5, 0, 0)
    );
    this.quaternionAngle = new Shared.THREE.Quaternion().setFromEuler(
      new Shared.THREE.Euler(-this.conf.cameraAngle, 0, 0)
    );

    //initial distance of the camera with the go2Focus
    this.distance = this.conf.minDist;

    //raycaster for picking/warp of avatar
    this.raycaster = new Shared.THREE.Raycaster();
    this.useItownsCamera = false;
    this.mousePosition = new Shared.THREE.Vector2();
  }

  swapCameraMode(iView)
  {
    this.useItownsCamera = !this.useItownsCamera;

    if(this.useItownsCamera)
    {
      //creating controls like put it in _this.view.controls
      this.c = new udviz.itowns.PlanarControls(iView, {
        handleCollision: false,
        focusOnMouseOver: false, //TODO itowns bug not working
        focusOnMouseClick: false,
      });
      return;
    }

    this.c.dispose();
  }
  init() {
    const thisFocus = this;

    const localContext = arguments[1];
    const gV = localContext.getGameView();
    const inputManager = gV.getInputManager();
    inputManager.addMouseInput(gV.html(), 'wheel', function (event) {
      thisFocus.distance += event.wheelDelta * 0.1;
      thisFocus.distance = Math.max(
        Math.min(thisFocus.distance, thisFocus.conf.maxDist),
        thisFocus.conf.minDist
      );
      gV.computeNearFarCamera();
    });



    //The following (click warping and itowns/Three cameras swapping) is currently broken. 
    /*
    const iView = gV.getItownsView();
    const iCamera = iView.camera.camera3D;
    const tilesManager = gV.getLayerManager().tilesManagers;

    //TODO: do this at loads/unloads objects with events watchers instead of every tick
    //TODO: mutualize this between this, `updateElevationGround`, and `commands` local scripts
    const addObjectToArray = function (array, nameLayer) {
      let layerManager = null;
      for (let index = 0; index < tilesManager.length; index++) {
        const element = tilesManager[index];
        if (element.layer.id == nameLayer) {
          layerManager = element;
          break;
        }
      }

      if (!layerManager) throw new Error('no ', nameLayer);

      layerManager.tiles.forEach(function (t) {
        const obj = t.getObject3D();
        if (obj) array.push(obj);
      });
    };

    
    inputManager.addKeyInput('c', 'keydown', function () {
      //debugger
      thisFocus.swapCameraMode(iView);
    });
    const avatar = arguments[0].computeRoot().findByName('avatar');
    if(!avatar) return;
    inputManager.addMouseInput(gV.html(), 'mousedown', function (event) {
      //TODO: warp only on visible terrain, not when first intersection is a building
      //TODO: warp only at pure left click
      //if(inputManager.mouseState.isDragging())
      //  return;

      const mousePosition = thisFocus.mousePosition;
      mousePosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      thisFocus.raycaster.setFromCamera(mousePosition, iCamera);
      
      const ground = [];
      addObjectToArray(ground, '3d-tiles-layer-relief');
      addObjectToArray(ground, '3d-tiles-layer-road');
      const intersects = thisFocus.raycaster.intersectObjects(ground, true);
      if(intersects.length > 0)
        avatar.setPosition(intersects[0].point.sub( gV.getObject3D().position));
    });
    */
  }

  tick() {
    if(this.useItownsCamera)
      return;
    
    //the gameobject parent of this script
    const go = arguments[0];

    //a context containing all data to script clientside script
    const localContext = arguments[1];

    //get the go2Focus gameobject by name
    const go2Focus = go.computeRoot().findByName(this.conf.nameGO2Focus);

    if (!go2Focus) return;

    //compute world transform
    const obj = go2Focus.computeObject3D();
    let position = new Shared.THREE.Vector3();
    let quaternion = new Shared.THREE.Quaternion();
    obj.matrixWorld.decompose(position, quaternion, new Shared.THREE.Vector3());

    //move the position a bit up (z is up)
    position.z += this.conf.offsetZ;

    //compute camera position
    const dir = go2Focus
      .getDefaultForward()
      .applyQuaternion(this.quaternionAngle)
      .applyQuaternion(quaternion);

    position.sub(dir.setLength(this.distance));
    quaternion.multiply(this.quaternionCam);
    quaternion.multiply(this.quaternionAngle);

    //tweak values in camera object
    const camera = localContext.getGameView().getCamera();
    camera.position.copy(position);
    camera.quaternion.copy(quaternion);
    camera.updateProjectionMatrix();

    localContext.getGameView().computeNearFarCamera();
  }
};
