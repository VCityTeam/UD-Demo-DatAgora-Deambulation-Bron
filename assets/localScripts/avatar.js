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
    this.map = null;
    this.mapsIdsCoordinates = [
      {
        "id":"Mark_BuildingA",
        "coordinates": new Shared.THREE.Vector3(5537.449588712847, -3265.356191088625, -109.39584916667938)
      },
      {
        "id":"Mark_BuildingN",
        "coordinates": new Shared.THREE.Vector3(5686.848128705462, -3549.7381362048473, -109.13350603232911)
      },
      {
        "id":"Mark_StudentHome",
        "coordinates": new Shared.THREE.Vector3(5774.157292781828, -3569.0877146511893, -105.76962835709135)
      },
      {
        "id":"Mark_Restaurant",
        "coordinates": new Shared.THREE.Vector3(5758.669726618163, -3519.4069644746364, -105.80908654132688)
      },
      {
        "id":"Mark_BuildingH",
        "coordinates": new Shared.THREE.Vector3(5699.6274396647, -3426.4343528145305, -104.00858011720136)
      },
    ];
    this.mapsDistanceThreshold = 3.;

    //raycaster for avoiding buildings collisions with avatar
    this.raycaster = new Shared.THREE.Raycaster();
    //this.translationSpeed = 0.03;
    this.translationSpeed = 0.01;
    this.rotationSpeed = 0.0012;
    this.acceptableSlope = 0.7;
    this.avatarSize = 1.7;
    this.navelZ = 0.85;

    this.traceSecondsInterval = 0.1;
    this.trace = [];

    this.objectives = [
      {
        "id":"cafet'U",
        "coordinates": new Shared.THREE.Vector3(5567.575164457585, -3256.6427702494893, -108.00143772201538),
        "distanceThreshold": 2
      },
      {
        "id":"amphi F1",
        "coordinates": new Shared.THREE.Vector3(5650.173994000734, -3278.2185901795615, -105.06365650052463)
      },
      {
        "id":"accueil de l'Université du campus",
        "coordinates": new Shared.THREE.Vector3(5572.270994168237, -3332.921776014817, -109.72455618791247),
        "distanceThreshold": 5
      },
      {
        "id":"halle des sports B",
        "coordinates": new Shared.THREE.Vector3(5804.805060583292, -3437.70027410573, -99.08255773098806),
        "distanceThreshold": 7
      },
      {
        "id":"resto'U",
        "coordinates": new Shared.THREE.Vector3(5748.186775903313, -3521.249842989633, -106.90629936294067),
        "distanceThreshold": 2
      },
      {
        "id":"café Filtre",
        "coordinates": new Shared.THREE.Vector3(5782.290437117068, -3560.5980054803413, -106.42284282285995),
        "distanceThreshold": 2
      },
      {
        "id":"Kiosque",
        "coordinates": new Shared.THREE.Vector3(5702.917950964341, -3384.870627430719, -101.17011562107709),
        "distanceThreshold": 3
      },
      {
        "id":"amphi L2",
        "coordinates": new Shared.THREE.Vector3(5714.873221125032, -3463.3328045019757, -107.96326898109473)
      },
      {
        "id":"bâtiment B",
        "coordinates": new Shared.THREE.Vector3(5617.592245786231, -3248.1625083272656, -105.3557973487854),
        "distanceThreshold": 2
      },
      {
        "id":"forum",
        "coordinates": new Shared.THREE.Vector3(5638.039973720276, -3320.6375219867145, -105.32150721865845),
        "distanceThreshold": 7
      },
    ];
    this.currentObjective = 0;
    this.objectivesDelay = null;
    //this.objectivesDelay = 3;

    this.warped = false;
  }

  //addTileLayerToArray(array, tilesManager, layerName) {
  //  let layerManager = null;
  //  //console.log(tilesManager);
  //  for (let index = 0; index < tilesManager.length; index++) {
  //    const element = tilesManager[index];
  //    if (element.layer.id == layerName) {
  //      layerManager = element;
  //      break;
  //    }
  //  }
  //
  //  if (!layerManager) throw new Error('no layer called ', layerName);
  //
  //  layerManager.tiles.forEach(function (t) {
  //    const obj = t.getObject3D();
  //    if (obj) array.push(obj);
  //  });
  //}
  buildingsHit(tilesManager, origin, direction) {
    // const gV = localContext.getGameView();
    // const tilesManager = gV.getLayerManager().tilesManagers;
    const buildings = [this.campus];
    // this.addTileLayerToArray(buildings, tilesManager, '3d-tiles-layer-building');

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

  checkForNearbyMap() {
    const position = this.localAvatar.position;
    const mapO3D = this.map.object3D;
    var mapNearby = false;
    this.mapsIdsCoordinates.forEach(function (mapIdCoordinates) {
      const id = mapIdCoordinates.id;
      const p = mapIdCoordinates.coordinates;
      const o3D = mapO3D.getObjectByName(id);
      if(p.distanceTo(position) < this.mapsDistanceThreshold) {
        mapNearby = true;
        o3D.visible = true;
      }
      else o3D.visible = false;
    }.bind(this));
    this.map.object3D.visible = mapNearby;
  }

  traceMovement() {
    //Trace only after warp and before completion of objectives.
    if(!this.warped || this.currentObjective >= this.objectives.length) return;

    //Trace position.
    const time = Date.now();
    if(this.trace.length == 0 || (time - this.trace[this.trace.length - 1].time) > this.traceSecondsInterval * 1000)
    {
      this.trace.push({
        "time": time,
        "matrix": this.localAvatar.matrix
      });
      //console.log(time/1000 % 100);
      //console.log(this.trace.length);
      //console.log(this.localAvatar);
    }
  }


  updateLabel() {
    if(!this.warped) {
      this.label.innerHTML = "Waiting for warp (M key) to give objectives.";
      return;
    }

    if(this.currentObjective >= this.objectives.length)
    {
      const startTime = this.trace[0].time;
      const finishTime = this.trace[this.trace.length - 1].time;
      const duration = finishTime - startTime;
      this.label.innerHTML = 'All objectives completed in ' + duration/1000 + " seconds!";
      this.label.innerHTML += "<br>";
      this.label.innerHTML += "Please press key T to save trace.";
      return;
    }
    this.label.innerHTML = 'Current objective: ' + this.objectives[this.currentObjective].id;
  }

  checkForNearbyObjective() {
    if(this.currentObjective >= this.objectives.length) return;

    const position = this.localAvatar.position;
    const objective = this.objectives[this.currentObjective];
    const threshold = (objective.distanceThreshold ? objective.distanceThreshold : 1);
    if(objective.coordinates.distanceTo(position) < threshold) {

      //Validate objective only after given delay without moving.
      if(this.objectivesDelay)
      {
        const elapsedTime = (Date.now() - this.trace[this.trace.length - 1].time)/1000;
        if(elapsedTime < this.objectivesDelay) return;
      }

      console.log("Objective '" + objective.id + "' reached!");
      this.currentObjective++;

      this.updateLabel();

      if(this.currentObjective >= this.objectives.length) return;
      console.log("New objective is '" + this.objectives[this.currentObjective].id + "'");
    }
  }


  init() {
    const avatar = arguments[0].computeRoot().findByName('avatar');
    this.avatar = avatar;
    const localContext = arguments[1];
    const gV = localContext.getGameView();
    const tilesManager = gV.getLayerManager().tilesManagers;
    const worldOrigin = gV.getObject3D().position;

    //local avatar
    const scene = gV.getScene();
    const localAvatar = avatar.object3D;
    this.localAvatar = localAvatar;
    //scene.add(localAvatar);
    //console.log(scene);

    //debug intersection cube
    const geometry = new Shared.THREE.BoxGeometry( 1, 1, 1 );
    const material = new Shared.THREE.MeshBasicMaterial( {color: 0x00ff00} );
    this.intersectionCube = new Shared.THREE.Mesh( geometry, material );
    scene.add( this.intersectionCube );

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


    //Manual instanciation of campus.
    this.campus = gV.assetsManager.createRenderData('campus_Yael').object;
    //console.log(this.campus);
    this.campus.rotateOnAxis(new Shared.THREE.Vector3(0, 0, 1), -0.5*Math.PI); //here or manually on -y axis in rotation parameter of local_game_config.json
    this.campus.position.set(1849223.44, 5170874.5625, 194.8617); //not currently possible in local_game_config.json
    //console.log("campus", this.campus);
    scene.add(this.campus);

    //Campus map is initialized as invisible.
    this.map = arguments[0].computeRoot().findByName('map');
    //console.log(this.map);
    this.map.object3D.visible = false;

    //Label div to print infos on objectives.
    this.label = document.createElement('div');
    localContext.getGameView().appendToUI(this.label);
    this.updateLabel();


    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();
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

      //Show map if needed.
      this.checkForNearbyMap();

      //Trace position.
      this.traceMovement();

      //Check for objective completion
      this.checkForNearbyObjective();
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
      this.traceMovement();
    }.bind(this));
    //RIGHT
    inputManager.addKeyCommand('rotate_right', ['d'], function () {
      const dt = localContext.getDt();
      avatar.rotate(new Shared.THREE.Vector3(0, 0, -rotationAngle));
      //console.log('d');
      this.traceMovement();
    }.bind(this));

    //Print position.
    inputManager.addKeyCommand('rotate_right', ['p'], function () {
      console.log("game coordinates: ", localAvatar.position);
      console.log("absolute coordinates: ", localAvatar.position.clone().add(worldOrigin));
    });

    //tick command
    gV.addTickRequester(function () {
      inputManager.computeCommands();
    });

    //warp to saved location
    inputManager.addKeyInput('m', 'keydown', function () {
      //Allow only initial warp.
      if(this.warped) return;
      this.warped = true;

      localAvatar.position.set(5522.95180710312, -3322.608827644959, -110.02345057404978);
      //console.log("saved position: ", localAvatar.position.add(worldOrigin));
      localAvatar.updateMatrixWorld();

      this.updateLabel();
    }.bind(this));

    //save trace.
    function download(content, fileName, contentType) {
      var a = document.createElement("a");
      var file = new Blob([content], {type: contentType});
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      a.click();
    }
    inputManager.addKeyInput('t', 'keydown', function () {
      //console.log(Date.now());
      //const dateString = new Date().toLocaleString("fr-FR");
      const dateString = Date.now();
      //console.log(dateString);
      download(JSON.stringify(this.trace), 'trace-' + dateString + '.txt', 'text/plain');
    }.bind(this));
  }

  tick() {
    if(this.objectivesDelay) this.checkForNearbyObjective();
  }
};
