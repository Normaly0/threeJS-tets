import { useEffect, useRef, useState, Suspense } from "react";
import { TextureLoader } from "three/src/loaders/TextureLoader";
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { useScroll, ScrollControls, Scroll, useGLTF, useAnimations, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { MathUtils, MeshBasicMaterial, MeshStandardMaterial, LoopOnce, sRGBEncoding, PointsMaterial } from "three";
import { Perf } from "r3f-perf";

import './Container.scss'

//Blender animation tests

function Scene() {

  const sceneRef = useRef();
  const gridRef = useRef();
  const sphereRef = useRef()
  const backRef = useRef();

  const scroll = useScroll();

    const [dir, setDir] = useState(-1);

  const color = useLoader(TextureLoader, 'color.png');
  const displacement = useLoader(TextureLoader, 'displacement.png');

  useFrame(() => {

    if (dir === -1 && gridRef.current.material.displacementScale > -0.9) {
      gridRef.current.material.displacementScale = MathUtils.lerp(gridRef.current.material.displacementScale, -1, 0.02)
    } else if (dir === +1 && gridRef.current.material.displacementScale > 0.9) {
      gridRef.current.material.displacementScale = MathUtils.lerp(gridRef.current.material.displacementScale, -1, 0.02)
      setDir(-1)
    } else {
      gridRef.current.material.displacementScale = MathUtils.lerp(gridRef.current.material.displacementScale, 1, 0.02)
      setDir(+1)
    }

    sphereRef.current.rotation.y += 0.01;

  })

  const firstSec = {
    start: 0,
    end: 0.2,
    valueStart: 0,
    valueEnd: Math.PI * 0.5
  }

  const secondSec = {
    start: 0.2,
    end: 0.5,
    valueStart: 0.2003449960281523,
    valueEnd: Math.PI * 1
  }

  const thirdSec = {
    start: 0.45,
    end: 1.02,
    valueStart: -8,
    valueEnd: 11
  }
  

  useFrame((state) => {

    const scrollProgress = scroll.offset

    const firstT = MathUtils.clamp((scrollProgress - firstSec.start) / (firstSec.end - firstSec.start), 0, 1);
    sceneRef.current.rotation.y = MathUtils.lerp(firstSec.valueStart, firstSec.valueEnd, firstT)

    scrollProgress > 0.3
    ? (sphereRef.current.material.visible = true, backRef.current.material.visible = true)
    : (sphereRef.current.material.visible = false, backRef.current.material.visible = false)

    const secondT = MathUtils.clamp((scrollProgress - secondSec.start) / (secondSec.end - secondSec.start), 0, 1);
    state.camera.rotation.y = MathUtils.lerp(secondSec.valueStart, secondSec.valueEnd, secondT);
    state.camera.rotation.z = MathUtils.lerp(0.08821818443456075, 0, secondT);
    state.camera.rotation.x = MathUtils.lerp(-0.4182243295792291, 0, secondT);

    const thirdT = MathUtils.clamp((scrollProgress - thirdSec.start) / (thirdSec.end - thirdSec.start), 0, 1);
    backRef.current.position.y = MathUtils.lerp(thirdSec.valueStart, thirdSec.valueEnd, thirdT)

  })

  return (
    <group ref={sceneRef}>
      <mesh rotation-x={Math.PI * -0.5} ref={gridRef}>
        <planeGeometry args={[5, 5, 7, 7]} />
        <meshStandardMaterial
          map={color}
          emissiveMap={color}
          emissive={'white'}
          emissiveIntensity={10}
          // transparent={true}
          displacementMap={displacement}
          displacementScale={1}
          wireframe={true}
        />
      </mesh>
      <Cube />

      <mesh ref={sphereRef} position={[-6.5, 2, 1]}>
        <sphereGeometry args={[1]} />
        <meshStandardMaterial map={color} transparent={true} emissive={'#00A6FF'} emissiveIntensity={2}/>
      </mesh>

      <mesh position={[-8.5, -8, 1]} rotation-y={Math.PI * 0.5} ref={backRef}>
        <planeGeometry args={[13, 10]}/>
        <meshBasicMaterial color={'#FFFFFF'} toneMapped={false}/>
      </mesh>

    </group>
  )
}

function Cube() {

  let cubeRef = useRef()
  const [dir, setDir] = useState(true)

  function handleClick() {
    setDir(!dir)    
  }

  useFrame(() => {
    dir
    ? cubeRef.current.rotation.y += 0.01
    : cubeRef.current.rotation.y -= 0.01
  })

  return (
    <>
      <mesh ref={cubeRef} position={[0, 1, 0]} onClick={handleClick}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={'coral'} />
      </mesh>
    </>
  )
}

function Stage() {

  //Performance

  const info = useThree().gl.info
  useThree().gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  
  useEffect(() => {
    console.log(info)
  }, [])

  //Load and setup Stage

  const stage = useGLTF('./stage_detailed.glb');
  const diffuseMap = useLoader(TextureLoader, './Diffuse.jpg');
  diffuseMap.flipY = false;
  diffuseMap.encoding = sRGBEncoding;

  const stageObj = stage.scene.children.find((e) => {return e.name === 'merged_stage'});
  stageObj.material = new MeshStandardMaterial({map: diffuseMap})
  stageObj.castShadow = true;
  stageObj.receiveShadow = true;

  //Load and setup animated cube

  const shapeKeyCube = useGLTF("./shape_key_cube.glb");
  const animations = useAnimations(shapeKeyCube.animations, shapeKeyCube.scene);
  
  shapeKeyCube.nodes.Cube011.receiveShadow = true;
  shapeKeyCube.nodes.Cube011.castShadow = true;
  
  useEffect(() => {
    const animation = animations.actions.KeyAction;

    animation.play();
    animation.paused = true;
  }, [])

  useFrame(() => {

    const animation = animations.actions.KeyAction;
    const scrollProgress = window.scrollY / window.innerHeight;

    const totalDuration = animation.getClip().duration;
    const currentTime = animation.time;
    const targetTime = totalDuration * scrollProgress;

    animation.time = MathUtils.lerp(currentTime, targetTime, .05)
  })

  return (
    <>
      <primitive object={stage.scene} />
      <primitive object={shapeKeyCube.scene} />
    </>
  )

}

function Camera() {

  const group = useRef();
  const { animations } = useGLTF("/camera.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {

    const intro = actions['Camera.002Action']
    intro.clampWhenFinished = true
    intro.setLoop(LoopOnce)
    intro.play();

  }, [])

  return (

    <group ref={group}>
      <group name="Scene">
        <PerspectiveCamera
          name="Camera002"
          makeDefault
          far={1000}
          near={0.1}
          fov={25}
          position={[9.54, 5.66, 22.09]}
          rotation={[0.1, 1.03, -0.13]}
        />
      </group>
    </group>

  );
}

function Fireflies() {

const firefliesCount = 100;
const positionArr = new Float32Array(firefliesCount * 3);

for (let i = 0; i < firefliesCount; i++) {
  positionArr[i * 3 + 0] = (Math.random() - 0.5) * 13;
  positionArr[i * 3 + 1] = (Math.random() * 7) + 1;
  positionArr[i * 3 + 2] = (Math.random() -0.5) * 15;
}


  return(
    <points >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positionArr.length / 3}
          array={positionArr}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.2} color="#ffff" sizeAttenuation />
    </points>
  )
}

function Overlay() {

  //Loading Overlay

  const overlayShader = {
    uniforms: {
      uAlpha: {value: 0}
    },
    vertexShader: `
      void main () {
        gl_Position = vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uAlpha;

      void main () {
        gl_FragColor = vec4(0.40, 0.41, 1.00, uAlpha);
      }
    `
  }

  return (
    <mesh>
        <planeGeometry args={[2, 2, 1, 1]} />
        <shaderMaterial attach="material" args={[overlayShader]} transparent/>
    </mesh>
  )
}

function Container() {

  return ( 
  <>
    {/* <div className="html">
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
      <p>asdadadasd</p>
    </div> */}
    <div className="container">
      
      {/* <Canvas camera={{position: [1, 2, 4.5]}}>

        <ambientLight intensity={0.5} />
        <pointLight position={[10, 5, 10]} />
        <OrbitControls />

        <gridHelper args={[20, 15, 'red', 'coral']}/>

          <ScrollControls pages={5} distance={1.5}>
            <Scene />
            <Scroll html style={{ width: '100%' }}>
              <main className="content">
                <section className="content__intro">
                  <h1>Some ThreeJS Tests!</h1>
                  <p>Welcome to Corp Sec, who are situated in the busy city of Nivalis! We have a lot going on here at Corp Sec HQ. First off, we've recently acquired a large number of new recruits from the Sorting Office. They're all eager and keen to help keep the city safe so if you see them around town, please do say hello.</p>
                </section>
                <section>
                  <p>As of last week we have expanded our business and have aquired new premises as well as a larger team of staff. If you need any security work done then please feel free to drop us a line. We can assist with everything from bodyguard services through to guarding your home or business while you're away on holiday.</p>
                </section>
                <section className="content__list">
                  <h2>Lists!</h2>
                  <ul>
                    <li>Lorem Ipsum</li>
                    <li>Lorem Ipsum</li>
                    <li>Lorem Ipsum</li>
                    <li>Lorem Ipsum</li>
                    <li>Lorem Ipsum</li>
                    <li>Lorem Ipsum</li>
                  </ul>
                </section>
                <section className="content__space">
                  <h2>Tall section</h2>
                  <p>As of last week we have expanded our business and have aquired new premises as well as a larger team of staff. If you need any security work done then please feel free to drop us a line. We can assist with everything from bodyguard services through to guarding your home or business while you're away on holiday.</p>
                  <p>As of last week we have expanded our business and have aquired new premises as well as a larger team of staff. If you need any security work done then please feel free to drop us a line. We can assist with everything from bodyguard services through to guarding your home or business while you're away on holiday.</p>
                </section>
                <section className="content__last">
                  <p>Welcome to Corp Sec, who are situated in the busy city of Nivalis! We have a lot going on here at Corp Sec HQ. First off, we've recently acquired a large number of new recruits from the Sorting Office. They're all eager and keen to help keep the city safe so if you see them around town, please do say hello.</p>
                  <p>----------------------------------------</p>
                </section>
              </main>
            </Scroll>
          </ScrollControls>

      </Canvas> */}

      <Canvas shadows>

        <ambientLight intensity={0.2} />
        <pointLight 
          shadow-normalBias={0.02}
          shadow-mapSize-height={2048}
          shadow-mapSize-width={2048}
          castShadow 
          position={[10, 7, 10]} 
          intensity={0.7}
        />
        {/* <OrbitControls /> */}
        <Perf />

        <Overlay />

        <Camera /> 
        <Stage />
        <Fireflies />
        
        {/* <mesh castShadow receiveShadow rotation-x={Math.PI * -0.5} scale={6}>
          <planeGeometry args={[1, 1, 1]} />
          <meshStandardMaterial />
        </mesh>
        <mesh position={[0, .8, 0]} castShadow receiveShadow scale={0.05}>
          <sphereGeometry args={[15, 32, 16]}/>
          <meshStandardMaterial color={'coral'} />
        </mesh> */}

      </Canvas>

    </div>
  </>
  )
}

export default Container