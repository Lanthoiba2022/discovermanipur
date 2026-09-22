"use client";

/**
 * Ambient mist plane for the hero.
 *
 * Purely decorative: it is dynamically imported with `ssr: false`, only mounted
 * on wide viewports without `prefers-reduced-motion`, and the hero is designed
 * to look finished without it.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { ShaderMaterial } from "three";
import { Color } from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision mediump float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uMoss;
  uniform vec3 uGold;

  // Cheap value noise — three octaves is plenty for drifting mist.
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.55;
    for (int i = 0; i < 3; i++) {
      v += a * noise(p);
      p *= 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.035;

    float m = fbm(uv * 2.4 + vec2(t, -t * 0.6));
    float m2 = fbm(uv * 4.1 - vec2(t * 0.8, t * 0.3));

    vec3 col = mix(uDeep, uMoss, smoothstep(0.25, 0.85, m));
    col = mix(col, uGold, smoothstep(0.62, 1.0, m2) * 0.35);

    // Veil concentrated at the horizon band, fading out top and bottom.
    float band = smoothstep(0.0, 0.42, uv.y) * (1.0 - smoothstep(0.58, 1.0, uv.y));
    float alpha = (0.18 + 0.30 * m2) * band;

    gl_FragColor = vec4(col, alpha);
  }
`;

function createUniforms() {
  return {
    uTime: { value: 0 },
    uDeep: { value: new Color("#0b3b3c") },
    uMoss: { value: new Color("#4a7c59") },
    uGold: { value: new Color("#c9a227") },
  };
}

function MistPlane() {
  const material = useRef<ShaderMaterial>(null);
  const { viewport } = useThree();
  // Created once; the values are driven through the material ref, never re-created.
  const [uniforms] = useState(createUniforms);

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    // Clamp delta so a backgrounded tab does not jump the animation.
    m.uniforms.uTime.value += Math.min(delta, 0.05);
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        key="manipur-mist"
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms as unknown as ShaderMaterial["uniforms"]}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroShader() {
  return (
    <Canvas
      aria-hidden
      className="pointer-events-none"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 1], fov: 50 }}
      style={{ position: "absolute", inset: 0 }}
    >
      <MistPlane />
    </Canvas>
  );
}
