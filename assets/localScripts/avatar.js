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
    this.inputManager = null;
    this.campus = null;

    //raycaster for avoiding buildings collisions with avatar
    this.raycaster = new Shared.THREE.Raycaster();
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
    //if(!intersections.length) debugger;
    //return intersections.length ? intersections[0] : Infinity;
    // let minDist = Infinity;
    // if (intersections.length) {
    //   //debugger
    //   intersections.forEach(function (i) {
    //     if (i.distance < minDist) {
    //       //z = -i.distance;
    //       minDist = i.distance;
    //     }
    //   });
    // }

    // return minDist;
  }
  groundElevationDelta(tilesManager, origin) {
    const ground = [this.campus];
    //this.addTileLayerToArray(ground, tilesManager, '3d-tiles-layer-relief');
    //this.addTileLayerToArray(ground, tilesManager, '3d-tiles-layer-road');

    const acceptableDelta = 2;
    const avatarSize = 1.7;

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
    zShift = avatarSize;
    this.raycaster.ray.origin.set(origin.x, origin.y, origin.z + zShift);
    const intersectionsUp = this.raycaster.intersectObjects(ground, true);
    if(intersectionsUp.length)
    {
      delta = -(intersectionsUp[0].distance - zShift);
      if(Math.abs(delta) < acceptableDelta)
        deltas.push(delta);
    }

    console.log("deltas", deltas);

    if(deltas.length == 2 && deltas[1] - deltas[0] < avatarSize)
      return deltas[1];
    
    var delta = null;
    deltas.forEach(function (d) {
      if(!delta || Math.abs(d) < delta) delta = d;
    });
    console.log("delta", delta);
    return delta;

    //return (intersections.length ? intersections[0].distance - zShift : null);
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

    //*
    //referential debug gizmo
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
        








    this.campus = gV.assetsManager.createModel('campus_Yael');
    this.campus.rotateOnAxis(new Shared.THREE.Vector3(0, 0, 1), -0.5*Math.PI);
    this.campus.position.set(1849223.44, 5170874.5625, 194.8617);
    console.log("campus", this.campus);
    scene.add(this.campus);

    const dt = localContext.getDt();
    const translationSpeed = 0.05;
    const translationLength = translationSpeed * dt;
    const speedRotate = 0.0012;

    const checkCollisionFun = function(direction) {
      return false;

      const origin = avatar.getPosition().clone().add(worldOrigin);
      const intersection = this.buildingsHit(tilesManager, origin, direction);
      const depth = intersection ? intersection.distance : Infinity;
  
      if(depth != Infinity)
      {
        this.intersectionCube.visibility = true;
        this.intersectionCube.position.copy(intersection.point);
        this.intersectionCube.updateMatrixWorld();
        //console.log(this.intersectionCube.position)
      } else {
        this.intersectionCube.visibility = false;
      }
  
      //debugger
      // console.log(depth);
      return translationLength > depth;
    }.bind(this);
    const updateGroundElevationFun = function() {
      const zDelta = this.groundElevationDelta(tilesManager, avatar.getPosition().clone().add(worldOrigin));
      if(!zDelta) return;
      avatar.move(new Shared.THREE.Vector3(0, 0, zDelta));
    }.bind(this);

    
    let dtcb = 0


    //FORWARD
    // inputManager.listenKeys(['z']);
    inputManager.addKeyInput('z', 'keydown', function () {
      if(Date.now() - dtcb < 60) return;
      //console.log("exec");
      dtcb = Date.now();

      const direction = avatar.computeForwardVector();
      if(checkCollisionFun(direction)) return;
      avatar.move(direction.setLength(translationLength));
      updateGroundElevationFun();
      //onsole.log('z');
      return
    });
    //BACKWARD
    inputManager.addKeyInput('s', 'keydown', function () {
      const direction = avatar.computeBackwardVector();
      if(checkCollisionFun(direction)) return;
      avatar.move(direction.setLength(translationLength));
      updateGroundElevationFun();
      //console.log('s');
    });
    //LEFT
    inputManager.addKeyInput('q', 'keydown', function () {
      const dt = localContext.getDt();
      avatar.rotate(new Shared.THREE.Vector3(0, 0, speedRotate * dt));
      //console.log('q');
    });
    //RIGHT
    inputManager.addKeyInput('d', 'keydown', function () {
      const dt = localContext.getDt();
      avatar.rotate(new Shared.THREE.Vector3(0, 0, -speedRotate * dt));
      //console.log('d');
    });

    //warp to saved location
    inputManager.addKeyInput('m', 'keydown', function () {
      localAvatar.position.set(5522.95180710312, -3322.608827644959, -110.02345057404978);
      //console.log("saved position: ", localAvatar.position.add(worldOrigin));
      localAvatar.updateMatrixWorld();
    });
  }

  tick() {
    /*
    const avatar = this.avatar;
    const localContext = arguments[1];
    const gV = localContext.getGameView();
    const tilesManager = gV.getLayerManager().tilesManagers;
    const worldOrigin = gV.getObject3D().position;

    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();



    const dt = localContext.getDt();
    const translationSpeed = 0.03;
    const translationLength = translationSpeed * dt;
    const speedRotate = 0.0006;

    const checkCollisionFun = function(direction) {
      const origin = avatar.getPosition().clone().add(worldOrigin);
      const intersection = this.buildingsHit(tilesManager, origin, direction);
      const depth = intersection ? intersection.distance : Infinity;

      if(depth != Infinity)
      {
        this.intersectionCube.visibility = true;
        this.intersectionCube.position.copy(intersection.point);
        this.intersectionCube.updateMatrixWorld();
      } else {
        this.intersectionCube.visibility = false;
      }

      //debugger
      // console.log(depth);
      return translationLength > depth;
    }.bind(this);
    const updateGroundElevationFun = function() {
      const zDelta = this.groundElevationDelta(tilesManager, avatar.getPosition().clone().add(worldOrigin));
      if(!zDelta) return;
      avatar.move(new Shared.THREE.Vector3(0, 0, -zDelta));
    }.bind(this);

    //FORWARD
    if(inputManager.isPressed("z")){

      updateGroundElevationFun();
      
      const direction = avatar.computeForwardVector();
      if(checkCollisionFun(direction)) return;
      avatar.move(direction.setLength(translationLength));
      console.log('z');
    } 
    */

    //TODO: send update of state to world/server side
    const localContext = arguments[1];
    const worldComputer = localContext.getGameView().getStateComputer();
    const inputManager = localContext.getGameView().getInputManager();

    //send input manager command to the world
    worldComputer.addAfterTickRequester(function () {
      const cmds = inputManager.computeCommands();
      worldComputer.onCommands(cmds);
    });
  }
};