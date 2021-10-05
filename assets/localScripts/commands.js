/** @format */

let udviz;
let Shared = null;

module.exports = class Commands {
  constructor(conf, udvizBundle) {
    this.conf = conf;
    udviz = udvizBundle;
    Shared = udviz.Game.Shared;

    //raycaster for avoiding buildings collisions with avatar
    this.raycaster = new Shared.THREE.Raycaster();
  }

  addObjectToArray(array, tilesManager, layerName) {
    let layerManager = null;
    for (let index = 0; index < tilesManager.length; index++) {
      const element = tilesManager[index];
      //debugger
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
    const buildings = [];
    this.addObjectToArray(buildings, tilesManager, '3d-tiles-layer-building');

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

  init() {
    const avatar = arguments[0].computeRoot().findByName('avatar');
    const localContext = arguments[1];
    const gV = localContext.getGameView();
    const tilesManager = gV.getLayerManager().tilesManagers;

    //Input manager of the game
    const inputManager = localContext.getGameView().getInputManager();

    const thisCommands = this;




    //intersection cube
    const scene = gV.getScene();
    const geometry = new Shared.THREE.BoxGeometry( 1, 1, 1 );
    const material = new Shared.THREE.MeshBasicMaterial( {color: 0x00ff00} );
    const cube = new Shared.THREE.Mesh( geometry, material );
    scene.add( cube );





    //FORWARD
    inputManager.addKeyCommand(
      Shared.Command.TYPE.MOVE_FORWARD,
      ['z', 'ArrowUp'],
      function () {
        const direction = avatar.computeForwardVector();
        const avatarPosition = avatar.getPosition().clone();
        const origin = avatarPosition.add(localContext.getGameView().getObject3D().position.clone());
        const intersection = thisCommands.buildingsHit(tilesManager, origin, direction);
        const depth = intersection ? intersection.distance : Infinity;


        if(depth != Infinity)
        {
          //debugger
          //console.log(intersection.point);
          //console.log(scene)
          cube.visibility = true;
          cube.position.copy(intersection.point);
          cube.updateMatrixWorld();
        } else {
          cube.visibility = false;
        }

        //debugger
        // console.log(depth);
        // const speedTranslate = 0.03;
        // const dt = gV.getStateComputer().getWorldContext().getDt();
        // if(speedTranslate * dt > depth)
        //   return null;
        
        return new Shared.Command({
          type: Shared.Command.TYPE.MOVE_FORWARD,
          data: {
            position: avatarPosition,
            direction: direction,
            buildingsDepth: depth,
          },
        });
      }
    );

    //BACKWARD
    inputManager.addKeyCommand(
      Shared.Command.TYPE.MOVE_BACKWARD,
      ['s', 'ArrowDown'],
      function () {
        const direction = avatar.computeBackwardVector();
        const origin = localContext.getGameView().getObject3D().position.clone().add(avatar.getPosition());
        const intersection = thisCommands.buildingsHit(tilesManager, origin, direction);
        const depth = intersection ? intersection.distance : Infinity;
        // if(depth == Infinity)
        //   return null;

        return new Shared.Command({
          type: Shared.Command.TYPE.MOVE_BACKWARD,
          data: {
            buildingsDepth: depth,
          },
        });
      }
    );

    //LEFT
    inputManager.addKeyCommand(
      Shared.Command.TYPE.MOVE_LEFT,
      ['q', 'ArrowLeft'],
      function () {
        return new Shared.Command({ type: Shared.Command.TYPE.MOVE_LEFT });
      }
    );

    //RIGHT
    inputManager.addKeyCommand(
      Shared.Command.TYPE.MOVE_RIGHT,
      ['d', 'ArrowRight'],
      function () {
        return new Shared.Command({ type: Shared.Command.TYPE.MOVE_RIGHT });
      }
    );


    // //MOVE_TO
    // inputManager.addKeyCommand(
    //   Shared.Command.TYPE.MOVE_TO,
    //   ['m'],
    //   function () {
    //     return new Shared.Command({ type: Shared.Command.TYPE.MOVE_TO });
    //   }
    // );
  }

  tick() {
    const localContext = arguments[1];
    const worldComputer = localContext.getGameView().getStateComputer();
    const inputManager = localContext.getGameView().getInputManager();

    //send input manager command to the world
    worldComputer.setOnAfterTick(function () {
      const cmds = inputManager.computeCommands();
      worldComputer.onCommands(cmds);
    });
  }
};
