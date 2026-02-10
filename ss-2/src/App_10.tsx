import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
//@ts-ignore
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import * as THREE from "three";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function BloomFX({ bloomRef }: any) {
  useEffect(() => {
    if (!bloomRef.current) return;

    gsap.to(bloomRef.current, {
      intensity: 0,
      duration: 5,
      ease: "power2.out",
      delay: 0, // change if you want bloom to hold first
    });
  }, []);

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        intensity={2.5}
        luminanceThreshold={1.1}
        luminanceSmoothing={0.9}
        kernelSize={5}
      />
    </EffectComposer>
  );
}


/* ---------- MODEL ---------- */
function Model() {
  const gltf = useLoader(GLTFLoader, "ss-2/public/models/SS-5.glb");

  useEffect(() => {
    const boltMeshes: THREE.Mesh[] = [];
    let wordMesh: THREE.Mesh | null = null;

    // ---------- Traverse ----------
    gltf.scene.traverse((child: any) => {
      console.log(child.name, child.type, child.isMesh);

      if (!child.isMesh) return;

      child.material = child.material.clone();

      if (child.name === "LBolt_2" || child.name === "LBolt_3") {
        boltMeshes.push(child);
        
       
      }

      

      if (child.name === "Stateside_whole_word") {
        wordMesh = child;
      }
    });

    // ---------- Flicker Helper ----------
    function lightningFlicker(meshes: THREE.Mesh[], finalGlow = 2) {
      const tl = gsap.timeline();
      const glow = { value: 0 };

      meshes.forEach((m) => {
        const mat = m.material as THREE.MeshStandardMaterial;
        mat.emissive = new THREE.Color("#ffffff");
        mat.color.set("#333333");
        mat.emissiveIntensity = 0;
      });

      // mini flickers
      for (let i = 0; i < 5; i++) {
        const burst = gsap.utils.random(2, 5);

        tl.to(glow, {
          value: burst,
          duration: 0.04,
          onUpdate: () => {
            meshes.forEach((m) => {
              const mat = m.material as THREE.MeshStandardMaterial;
              mat.emissiveIntensity = glow.value;
              mat.color.lerp(new THREE.Color("#ffffff"), 0.7);
            });
          },
        });

        tl.to(glow, {
          value: 0,
          duration: 0.06,
          onUpdate: () => {
            meshes.forEach((m) => {
              const mat = m.material as THREE.MeshStandardMaterial;
              mat.emissiveIntensity = glow.value;
            });
          },
        });
      }

      // big strike
      tl.to(glow, {
        value: 8,
        duration: 0.1,
        onUpdate: () => {
          meshes.forEach((m) => {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.color.set("#ffffff");
            mat.emissiveIntensity = glow.value;
          });
        },
      });

      // settle
      tl.to(glow, {
        value: finalGlow,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          meshes.forEach((m) => {
            const mat = m.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = glow.value;
          });
        },
      });

      return tl;
    }

    // ---------- Sequence ----------

    // ⚡ 1000ms — bolts flicker then disappear
    const t1 = setTimeout(() => {
      const tl = lightningFlicker(boltMeshes, 0.5);
      tl.call(() => {
        boltMeshes.forEach((m) => (m.visible = false));
      });
    }, 100);

    // ✨ 3000ms — word flicker reveal
    const t2 = setTimeout(() => {
      if (wordMesh) {
        lightningFlicker([wordMesh], 3);
      }
    }, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gltf]);

  return <primitive object={gltf.scene} />;
}


/* ---------- APP ---------- */
export default function App() {
  const bloomRef = useRef<any>(null);

  return (
    <Canvas
      orthographic
      camera={{ zoom: 75, position: [0, 0, 25], near: 0.01, far: 1000 }}
      gl={{ toneMapping: THREE.NoToneMapping }}
      style={{ background: "black", width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1} />

      <Model />

      <BloomFX bloomRef={bloomRef} />

      <OrbitControls />
    </Canvas>
  );
}

