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

    //initial distance of the camera with the subject
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
    //const localCtx = arguments[1];
    const gV = arguments[1].getGameView();
    const iView = gV.getItownsView();
    const iCamera = iView.camera.camera3D;

    const inputManager = gV.getInputManager();
    const tilesManager = gV.getLayerManager().tilesManagers;

    const addObjectToGround = function (ground, nameLayer) {
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
        if (obj) ground.push(obj);
      });
    };

    const thisFocus = this;
    inputManager.addKeyInput('c', "keydown", function (event) {
      //debugger
      thisFocus.swapCameraMode(iView);
    })
    inputManager.addMouseCommand('mousedown', function () {
      //TODO: warp only at pure left click
      //if(inputManager.mouseState.isDragging())
      //  return;

      const event = this.event('mousedown');
      const mousePosition = thisFocus.mousePosition;
      mousePosition.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
      );
      thisFocus.raycaster.setFromCamera(mousePosition, iCamera);
      
      const ground = []
      addObjectToGround(ground, '3d-tiles-layer-relief');
      addObjectToGround(ground, '3d-tiles-layer-road');
      const intersects = thisFocus.raycaster.intersectObjects(ground, true);
      if(intersects.length > 0) {
        return new Shared.Command({
          type: Shared.Command.TYPE.MOVE_TO,
          data: {
            vector: intersects[0].point.sub( gV.getObject3D().position),
          },
        });
      }
      return null;
    });
  }

  tick() {
    if(this.useItownsCamera)
      return;
    
    //the gameobject parent of this script
    const go = arguments[0];

    //a context containing all data to script clientside script
    const localContext = arguments[1];

    //get the subject gameobject by name
    const subject = go.computeRoot().findByName(this.conf.nameGO2Focus);

    //compute world transform
    const obj = subject.computeObject3D();
    let position = new Shared.THREE.Vector3();
    let quaternion = new Shared.THREE.Quaternion();
    obj.matrixWorld.decompose(position, quaternion, new Shared.THREE.Vector3());

    //move the position a bit up (z is up)
    position.z += this.conf.offsetZ;

    //compute camera position
    const dir = subject
      .getDefaultForward()
      .applyQuaternion(this.quaternionAngle)
      .applyQuaternion(quaternion);

    position.sub(dir.setLength(this.distance));
    quaternion.multiply(this.quaternionCam);
    quaternion.multiply(this.quaternionAngle);

    //tweak values in camera object
    const iV = localContext.getGameView().getItownsView();
    iV.camera.camera3D.position.copy(position);
    iV.camera.camera3D.quaternion.copy(quaternion);
    iV.camera.camera3D.updateProjectionMatrix();
  }
};
