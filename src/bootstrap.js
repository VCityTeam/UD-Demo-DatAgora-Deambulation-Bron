import * as udv from 'ud-viz';

const myWorld = new udv.Game.Shared.World({
  name: 'My World',
  origin: { lat: 45.7530993, lng: 4.8452654, alt: 300 },
  gameObject: {
    name: 'GameManager',
    static: true,
    components: {
      LocalScript: {
        conf: {
          nameGO2Focus: 'avatar',
          cameraAngle: 0,
          offsetZ: 2,
          minDist: 5,
          maxDist: 20,
        },
        idScripts: ['focus', 'localAvatar'],
      },
    },
    children: [
      {
        name: 'avatar',
        noLocalUpdate: true,
        components: {
          Render: { idRenderData: 'avatar' },
        },
      },
    ],
  },
});

const app = new udv.Templates.LocalGame();
app.start(myWorld, './assets/config/local_game_config.json').then(function () {
  //set custom render pass
  const THREE = udv.THREE;

  const MYMAT = new THREE.ShaderMaterial({
    uniforms: {
      // logDepthBufFC:{value:1},
      // opacity: {
      //   value: 1.0
      // }
    },
    vertexShader: `
      #define NORMAL

      varying vec3 vNormal;
      //varying float vDepth;
      //varying vec3 vView;
      varying vec2 vHighPrecisionZW;
      varying float vDistance;

      #include <common>
      #include <logdepthbuf_pars_vertex>

      void main() {
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>

        //vNormal = normalize( transformedNormal );

        #include <begin_vertex>
        #include <project_vertex>
        #include <logdepthbuf_vertex>

        vNormal = normal;
        //vView = -(modelViewMatrix * vec4(position.xyz, 1.)).xyz;
        //vView = vec3(1.0 + gl_Position.w)/1000.;
        //vDepth = 1.0 + gl_Position.w;
        //vDepth = log(1.0 + abs(gl_Position.z));
        //vDepth = gl_Position.w;
        //vDepth = log(1. + abs(mvPosition.y));
        //vDepth = -(modelViewMatrix * vec4(position.xyz, 1.)).z;
        //vDepth = length(-(modelViewMatrix * vec4(position.xyz, 1.)).xyz);
        //vDepth = log(1. + length(-(modelViewMatrix * vec4(position.xyz, 1.)).xyz));
        //vDepth = log(1. + length(-(modelViewMatrix * vec4(position.xyz, 1.)).xyz);
        //
        vHighPrecisionZW = gl_Position.zw;
        //
        vDistance = length((modelViewMatrix * vec4(position.xyz, 1.)).xyz);
        vDistance /= 1000.;
      }
    `,
    fragmentShader: `
      #define NORMAL

      varying vec3 vNormal;
      //varying float vDepth;
      //varying vec3 vView;
      varying vec2 vHighPrecisionZW; 
      varying float vDistance;

      #include <packing>
      #include <normalmap_pars_fragment>
      #include <logdepthbuf_pars_fragment>

      void main() {

        #include <clipping_planes_fragment>
        #include <logdepthbuf_fragment>
        #include <normal_fragment_begin>
        #include <normal_fragment_maps>

        //float depth = 1.;
        //
        // float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
        // float simplyPackedDepth = 1.0 - fragCoordZ;
        // float depth = simplyPackedDepth;
        //float depth = abs(vHighPrecisionZW[0] / vHighPrecisionZW[1]);
        float depth = vDistance;
        depth = clamp(depth, 0., 1.);

        // gl_FragColor = vec4(packNormalToRGB( normal ), 1.);
        gl_FragColor = vec4(packNormalToRGB( normal ), depth);
      }
    `,
  });

  const MySobelOperatorShader = {
    uniforms: {
      tDiffuse: { value: null },
      tDepth: { value: null },
      resolution: new THREE.Uniform(new THREE.Vector2()),
    },

    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,

    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform sampler2D tDepth;
      uniform vec2 resolution;
      varying vec2 vUv;
      vec4 getTex(in vec2 uv)
      {
        //float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
        //float simplyPackedDepth = 1.0 - fragCoordZ;

        // float simplyPackedDepth = texture2D(tDiffuse, uv).w;
        // float fragCoordZ = -simplyPackedDepth + 1.0;
        
        return vec4(
          // fragCoordZ
          texture2D(tDiffuse, uv)
          //texture2D(tDiffuse, uv).xyz,
          //texture2D(tDepth, uv).x
        );
      }
      void main() {
        vec2 texel = vec2( 1.0 / resolution.x, 1.0 / resolution.y );
        //vec2 texel = vUv;
        // kernel definition (in glsl matrices are filled in column-major order)
        const mat3 Gx = mat3( -1, -2, -1, 0, 0, 0, 1, 2, 1 ); // x direction kernel
        const mat3 Gy = mat3( -1, 0, 1, -2, 0, 2, -1, 0, 1 ); // y direction kernel
        // fetch the 3x3 neighbourhood of a fragment
        // first column
        vec4 tx0y0 = getTex(vUv + texel * vec2( -1, -1 ) );
        vec4 tx0y1 = getTex(vUv + texel * vec2( -1,  0 ) );
        vec4 tx0y2 = getTex(vUv + texel * vec2( -1,  1 ) );
        // second column
        vec4 tx1y0 = getTex(vUv + texel * vec2(  0, -1 ) );
        vec4 tx1y1 = getTex(vUv + texel * vec2(  0,  0 ) );
        vec4 tx1y2 = getTex(vUv + texel * vec2(  0,  1 ) );
        // third column
        vec4 tx2y0 = getTex(vUv + texel * vec2(  1, -1 ) );
        vec4 tx2y1 = getTex(vUv + texel * vec2(  1,  0 ) );
        vec4 tx2y2 = getTex(vUv + texel * vec2(  1,  1 ) );
        // gradient value in x direction
        vec4 valueGx = Gx[0][0] * tx0y0 + Gx[1][0] * tx1y0 + Gx[2][0] * tx2y0 +
          Gx[0][1] * tx0y1 + Gx[1][1] * tx1y1 + Gx[2][1] * tx2y1 +
          Gx[0][2] * tx0y2 + Gx[1][2] * tx1y2 + Gx[2][2] * tx2y2;
        // gradient value in y direction
        vec4 valueGy = Gy[0][0] * tx0y0 + Gy[1][0] * tx1y0 + Gy[2][0] * tx2y0 +
          Gy[0][1] * tx0y1 + Gy[1][1] * tx1y1 + Gy[2][1] * tx2y1 +
          Gy[0][2] * tx0y2 + Gy[1][2] * tx1y2 + Gy[2][2] * tx2y2;
        // magnitute of the total gradient
        gl_FragColor = sqrt( ( valueGx * valueGx ) + ( valueGy * valueGy ) );
      }
    `,
  };

  const MaskShader = {
    uniforms: {
      tDiffuse: { value: null },
      tMask: { value: null },
      resolution: new THREE.Uniform(new THREE.Vector2()),
    },

    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,

    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse;
      uniform sampler2D tMask;
      uniform vec2 resolution;
      varying vec2 vUv;

      //#include <packing>

      void main() {
        gl_FragColor = vec4(0.);

        /*
        //gl_FragColor = vec4(mod(vUv*resolution, vec2(2.)), 0., 1.);
        //gl_FragColor = vec4(vec2(mod(vUv.x*resolution.x/5., 2.)), 0., 1.);
        float xgrad = mod(vUv.x*resolution.x, 10.)/10.;
        if(xgrad > 0.5)
        gl_FragColor = texture2D(tDiffuse, vUv);
        else
        gl_FragColor = texture2D(tMask, vUv);
        */

        vec4 maskTexel = texture2D(tMask, vUv);
        float maskFactor = max(max(max(maskTexel.x, maskTexel.y), maskTexel.z), maskTexel.w);
        gl_FragColor = vec4((1.- maskFactor) * texture2D(tDiffuse, vUv).xyz, 1.);
        /*
        if(maskFactor <= 0.05)
        {
          gl_FragColor = texture2D(tDiffuse, vUv);

          ////float depth = unpackRGBAToDepth(gl_FragColor);
          //float depth = gl_FragColor.x;
          ////depth = abs(depth)/2.;
          ////gl_FragColor = vec4(vec3(depth), 1.);
          ////gl_FragColor = vec4(vec3(unpackRGBAToDepth(texture2D(tDiffuse, vUv)), 1.);
        }
        */

        #include <tonemapping_fragment>
        #include <encodings_fragment>
        #include <fog_fragment>
        #include <premultiplied_alpha_fragment>
        #include <dithering_fragment>
        }
    `,
  };

  //renderTarget for special effects
  const renderTargetFX = new THREE.WebGLRenderTarget(0, 0, {
    depthBuffer: true,
    stencilBuffer: false,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
  });

  const gameView = app.getGameView();

  //create custom render pass (init composers)
  const scene = gameView.getScene();
  const camera = gameView.getCamera();
  const renderer = gameView.getRenderer();

  const edgeDetectionComposer = new udv.EffectComposer(renderer, renderTargetFX);
  const normalsPass = new udv.RenderPass(scene, camera, MYMAT);
  edgeDetectionComposer.addPass(normalsPass);
  const sobelPass = new udv.ShaderPass(MySobelOperatorShader);
  edgeDetectionComposer.addPass(sobelPass);
  edgeDetectionComposer.renderToScreen = false;

  const finalComposer = new udv.EffectComposer(renderer);
  const renderPass = new udv.RenderPass(scene, camera);
  finalComposer.addPass(renderPass);
  const compositionPass = new udv.ShaderPass(MaskShader);
  compositionPass.uniforms.tMask.value = renderTargetFX.texture;
  finalComposer.addPass(compositionPass);

  //update variables on resize
  const updateResize = function (ctx) {
    const size = ctx.getGameView().getSize();
    renderTargetFX.setSize(size.x, size.y);

    sobelPass.uniforms.resolution.value = new THREE.Vector2(
      edgeDetectionComposer.writeBuffer.width,
      edgeDetectionComposer.writeBuffer.height
    );
    compositionPass.uniforms.resolution.value = new THREE.Vector2(
      finalComposer.writeBuffer.width,
      finalComposer.writeBuffer.height
    );
  };

  //launch an init resize update
  updateResize(gameView.getLocalContext());
  //record in the resize requester
  gameView.addResizeRequester(updateResize);

  //define the custom render pass
  const customRender = function () {
    edgeDetectionComposer.reset(renderTargetFX);
    finalComposer.reset();
    edgeDetectionComposer.render();
    finalComposer.render();
  };

  //set the custom render pass
  gameView.setRender(customRender);
});