/** @format */

//import * as itowns from 'itowns';

let udviz;
let Shared = null;

module.exports = class LocalAvatar {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    this.avatar = null;
    this.localAvatar = null;
    this.intersectionCube = null;
    this.debugGizmo = false;
    this.debugIntersection = false;
    this.inputManager = null;
    this.campus = null;

    //raycaster for avoiding buildings collisions with avatar
    this.raycaster = new Shared.THREE.Raycaster();
    this.translationSpeed = 0.03;
    this.rotationSpeed = 0.0012;
    this.acceptableSlope = 0.7;
    this.avatarSize = 1.7;
    this.navelZ = 0.85;
  }

  addTileLayerToArray(array, tilesManager, layerName) {
    let layerManager = null;
    //console.log(tilesManager);
    for (let index = 0; index < tilesManager.length; index++) {
      const element = tilesManager[index];
      if (element.layer.id == layerName) {
        layerManager = element;
        break;
      }
    }
  
    if (!layerManager) throw new Error('no layer called ', layerName);
  
    layerManager.tiles.forEach(function (t) {
      const obj = t.getObject3D();
      if (obj) array.push(obj);
    });
  }
  buildingsHit(tilesManager, origin, direction) {
    // const gV = localContext.getGameView();

    // const tilesManager = gV.getLayerManager().tilesManagers;
    const buildings = [this.campus];
    // this.addTileLayerToArray(buildings, tilesManager, '3d-tiles-layer-building');

    // const pos = this.avatar.getPosition();
    // const ref = localContext.getGameView().getObject3D().position;

    // this.raycaster.ray.origin = pos.add(ref);
    this.raycaster.ray.origin = origin;
    this.raycaster.ray.direction = direction;
    //console.log(origin);

    
    const intersections = this.raycaster.intersectObjects(buildings, true);
    if(intersections.length) return intersections[0];
    return null;
  }
  groundElevationDelta(tilesManager, origin, acceptableDelta) {
    const ground = [this.campus];
    //this.addTileLayerToArray(ground, tilesManager, '3d-tiles-layer-relief');
    //this.addTileLayerToArray(ground, tilesManager, '3d-tiles-layer-road');

    var delta;
    const deltas = [];
    this.raycaster.ray.direction.set(0, 0, -1);
    var zShift;

    //Down
    zShift = 0.;
    this.raycaster.ray.origin.set(origin.x, origin.y, origin.z + zShift);
    const intersectionsDown = this.raycaster.intersectObjects(ground, true);
    if(intersectionsDown.length)
    {
      delta = -(intersectionsDown[0].distance - zShift);
      if(Math.abs(delta) < acceptableDelta)
        deltas.push(delta);
    }
    //Up
    zShift = this.avatarSize;
    this.raycaster.ray.origin.set(origin.x, origin.y, origin.z + zShift);
    const intersectionsUp = this.raycaster.intersectObjects(ground, true);
    if(intersectionsUp.length)
    {
      delta = -(intersectionsUp[0].distance - zShift);
      if(Math.abs(delta) < acceptableDelta)
        deltas.push(delta);
    }

    //console.log("deltas", deltas);

    if(deltas.length == 2 && deltas[1] - deltas[0] < this.avatarSize)
      return deltas[1];
    
    var delta = null;
    deltas.forEach(function (d) {
      if(!delta || Math.abs(d) < delta) delta = d;
    });
    //console.log("delta", delta);
    return delta;
  }

  init() {
    const avatar = arguments[0].computeRoot().findByName('avatar');
    this.avatar = avatar;
    const localContext = arguments[1];
    const gV = localContext.getGameView();
    const tilesManager = gV.getLayerManager().tilesManagers;
    const worldOrigin = gV.getObject3D().position;

    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();

    //const thisLocalAvatar = this;



    //local avatar/cube
    const scene = gV.getScene();
    //console.log(avatar.object3D);
    // const geometry = new Shared.THREE.BoxGeometry(3, 3, 3);
    // const material = new Shared.THREE.MeshBasicMaterial( {color: 0xff0000} );
    // const cube = new Shared.THREE.Mesh( geometry, material );
    const localAvatar = avatar.object3D;//.clone();
    //avatar.object3D.visible = false;
    this.localAvatar = localAvatar;
    //scene.add(localAvatar);
    //console.log(scene);

    //intersection cube
    const geometry = new Shared.THREE.BoxGeometry( 1, 1, 1 );
    const material = new Shared.THREE.MeshBasicMaterial( {color: 0x00ff00} );
    this.intersectionCube = new Shared.THREE.Mesh( geometry, material );
    scene.add( this.intersectionCube );

    console.log(scene);

    //referential debug gizmo
    if(this.debugGizmo) {
      const sphere = new Shared.THREE.SphereGeometry( 1, 32, 16 );
      const red = new Shared.THREE.MeshBasicMaterial( {color: 0xff0000} );
      const green = new Shared.THREE.MeshBasicMaterial( {color: 0x00ff00} );
      const blue = new Shared.THREE.MeshBasicMaterial( {color: 0x0000ff} );
      //
      const redSphere = new Shared.THREE.Mesh( sphere, red );
      const greenSphere = new Shared.THREE.Mesh( sphere, green );
      const blueSphere = new Shared.THREE.Mesh( sphere, blue );
      //
      redSphere.position.setX(5.);
      greenSphere.position.setY(5.);
      blueSphere.position.setZ(5.);
      //
      redSphere.position.add(worldOrigin);
      greenSphere.position.add(worldOrigin);
      blueSphere.position.add(worldOrigin);
      //
      scene.add( redSphere );
      scene.add( greenSphere );
      scene.add( blueSphere );
    }








    this.campus = gV.assetsManager.createRenderData('campus_Yael').object;
    console.log(this.campus);
    this.campus.rotateOnAxis(new Shared.THREE.Vector3(0, 0, 1), -0.5*Math.PI); //here or manually on -y axis in rotation parameter of local_game_config.json
    this.campus.position.set(1849223.44, 5170874.5625, 194.8617); //not currently possible in local_game_config.json
    console.log("campus", this.campus);
    scene.add(this.campus);

    const dt = localContext.getDt();
    const translationLength = this.translationSpeed * dt;
    const rotationAngle = this.rotationSpeed * dt;

    //Check if movement is possible according to :
    //- altitude delta and size of avatar
    //- presence of surface for the avatar
    //- intersections
    const checkAndApplyMovementFun = function(direction, length) {
      const origin = avatar.getPosition().clone().add(worldOrigin);
      //console.log(direction, length);
      const hShift = direction.clone().multiplyScalar(length);
      //console.log("hShift", hShift);
      const hShiftedOrigin = origin.clone().add(hShift);
      const acceptableDelta = this.acceptableSlope*length;
      //console.log("acceptableDelta", acceptableDelta);
      const groundDelta = this.groundElevationDelta(tilesManager, hShiftedOrigin, acceptableDelta);

      const navelOrigin = origin.clone();
      navelOrigin.z += this.navelZ;

      //In absence of surface, just cancel movement (except if already flying).
      if(groundDelta == null)
      {
        const intersection = this.buildingsHit(tilesManager, navelOrigin, new Shared.THREE.Vector3(0, 0, -1));
        //console.log("flying intersection", intersection);
        if(intersection != null) return;
      }

      //Move a little bit the intersection test origin (near navel) to avoid foots level intersections.
      const shift = hShift.clone();
      shift.z += groundDelta;
      const tiltedDirection = shift.clone().normalize();
      const intersection = this.buildingsHit(tilesManager, navelOrigin, tiltedDirection);
      const depth = intersection ? intersection.distance : Infinity;
  
      if(this.debugIntersection && depth != Infinity)
      {
        this.intersectionCube.visibility = true;
        this.intersectionCube.position.copy(intersection.point);
        this.intersectionCube.updateMatrixWorld();
        //console.log(this.intersectionCube.position)
      } else {
        this.intersectionCube.visibility = false;
      }
  
      //In case of intersection between origin and shifted positions, just cancel movement.
      if(depth < shift.length()) return;
      
      //Apply movement.
      this.avatar.move(shift);
    }.bind(this);

    
    //FORWARD
    inputManager.addKeyCommand('move_forward', ['z'], function () {
      const direction = avatar.computeForwardVector();
      checkAndApplyMovementFun(direction, translationLength);
      //console.log('z');
    });
    //BACKWARD
    inputManager.addKeyCommand('move_backward', ['s'], function () {
      const direction = avatar.computeBackwardVector();
      checkAndApplyMovementFun(direction, translationLength);
      //console.log('s');
    });
    //LEFT
    inputManager.addKeyCommand('rotate_left', ['q'], function () {
      const dt = localContext.getDt();
      avatar.rotate(new Shared.THREE.Vector3(0, 0, rotationAngle));
      //console.log('q');
    });
    //RIGHT
    inputManager.addKeyCommand('rotate_right', ['d'], function () {
      const dt = localContext.getDt();
      avatar.rotate(new Shared.THREE.Vector3(0, 0, -rotationAngle));
      //console.log('d');
    });

    //tick command
    gV.addTickRequester(function () {
      inputManager.computeCommands();
    });

    //warp to saved location
    inputManager.addKeyInput('m', 'keydown', function () {
      localAvatar.position.set(5522.95180710312, -3322.608827644959, -110.02345057404978);
      //console.log("saved position: ", localAvatar.position.add(worldOrigin));
      localAvatar.updateMatrixWorld();
    });
  }

  tick() {}
};
