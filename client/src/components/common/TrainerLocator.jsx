import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ScrollControls, Scroll, useScroll, Float, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import './TrainerLocator.css';

/* ============================================================
   3D SCENE OBJECTS — Procedural gym-themed geometry
   ============================================================ */

// Procedural Hovering Gym Bot (Robotic Workout Assistant & Trainer Drones)
function GymBot({ position, color = '#06b6d4', scale = 1, speed = 1 }) {
  const group = useRef();
  const scroll = useScroll();

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime * speed;
    group.current.rotation.y = scroll.offset * Math.PI * 1.5 + t * 0.4;
    group.current.rotation.x = Math.sin(t * 0.5) * 0.1;
    group.current.position.y = position[1] + Math.sin(t * 1.2) * 0.25;
  });

  return (
    <group ref={group} position={position} scale={scale}>
      {/* Sleek metallic robot body */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#1e293b" metalness={0.95} roughness={0.05} />
      </mesh>

      {/* High-tech glowing scan visor (cyan / emerald eye) */}
      <mesh position={[0, 0.05, 0.45]}>
        <boxGeometry args={[0.6, 0.15, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
      </mesh>

      {/* Futuristic hover thruster rings */}
      <group position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.3, 0.06, 8, 24]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Thruster exhaust light */}
        <mesh position={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} transparent opacity={0.6} />
        </mesh>
      </group>

      {/* Orbiting sensor antennas */}
      <group position={[-0.6, 0.2, 0]} rotation={[0, 0, 0.3]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
      <group position={[0.6, 0.2, 0]} rotation={[0, 0, -0.3]}>
        <mesh>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

// Particle field for depth (connection nodes)
function ParticleField({ count = 300 }) {
  const points = useRef();
  const scroll = useScroll();

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 30;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = scroll.offset * Math.PI * 0.4 + state.clock.elapsedTime * 0.02;
    points.current.rotation.x = scroll.offset * Math.PI * 0.2;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#06b6d4"
        transparent
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  );
}

// Central Locator Beacon / Robotic Core (Holographic Coordinate Projection Core)
function LocatorCore() {
  const group = useRef();
  const innerSphere = useRef();
  const outerRings = useRef();
  const scroll = useScroll();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = scroll.offset;

    if (innerSphere.current) {
      innerSphere.current.rotation.y = t * 0.25 + s * Math.PI;
      innerSphere.current.rotation.x = Math.sin(t * 0.1) * 0.15;
    }
    if (outerRings.current) {
      outerRings.current.rotation.y = -t * 0.35 + s * Math.PI * 1.5;
      outerRings.current.rotation.z = t * 0.2;
    }
    if (group.current) {
      const sc = 1 - s * 0.45;
      group.current.scale.setScalar(sc);
    }
  });

  return (
    <group ref={group} position={[0, 0, -2]}>
      {/* Central Core sphere */}
      <mesh ref={innerSphere}>
        <sphereGeometry args={[1.8, 32, 32]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#06b6d4"
          emissiveIntensity={0.35}
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* Cybernetic map coordinates rings */}
      <group ref={outerRings}>
        {/* Horizontal ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.4, 0.04, 8, 64]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.2} />
        </mesh>
        {/* Vertical ring */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <torusGeometry args={[2.5, 0.03, 8, 64]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={1.2} />
        </mesh>
      </group>
    </group>
  );
}

/* ============================================================
   MAIN 3D SCENE
   ============================================================ */
function Scene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10, 15, 10]}
        angle={0.25}
        penumbra={1}
        intensity={2.5}
        color="#06b6d4"
      />
      <spotLight
        position={[-10, 5, -10]}
        angle={0.3}
        penumbra={1}
        intensity={2}
        color="#22c55e"
      />
      <pointLight position={[0, -5, 5]} intensity={0.8} color="#3b82f6" />

      {/* Environment */}
      <Environment preset="night" />
      <Stars radius={50} depth={60} count={1200} factor={3} saturation={0.5} fade speed={1.5} />

      {/* Locator Core */}
      <LocatorCore />

      {/* Particles */}
      <ParticleField count={300} />

      {/* Floating Trainer GymBots */}
      <Float speed={1.8} rotationIntensity={0.6} floatIntensity={0.8}>
        <GymBot position={[4, 1.2, -3]} color="#06b6d4" scale={0.7} speed={1.1} />
      </Float>

      <Float speed={2.2} rotationIntensity={0.5} floatIntensity={1}>
        <GymBot position={[-4.5, -0.8, -4]} color="#22c55e" scale={0.65} speed={0.9} />
      </Float>

      <Float speed={1.4} rotationIntensity={0.7} floatIntensity={0.6}>
        <GymBot position={[3.5, -1.8, -5]} color="#3b82f6" scale={0.6} speed={1.3} />
      </Float>

      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.7}>
        <GymBot position={[-3, 2.2, -6]} color="#22c55e" scale={0.55} speed={1} />
      </Float>

      <Float speed={1.6} rotationIntensity={0.8} floatIntensity={0.8}>
        <GymBot position={[5, 2.5, -7]} color="#06b6d4" scale={0.5} speed={1.2} />
      </Float>

      <Float speed={2.4} rotationIntensity={0.6} floatIntensity={0.9}>
        <GymBot position={[-5, -2.8, -5]} color="#3b82f6" scale={0.5} speed={0.8} />
      </Float>
    </>
  );
}

/* ============================================================
   HTML OVERLAY CONTENT (scrolls over the 3D scene)
   ============================================================ */
function HtmlContent({ onNavigate }) {
  return (
    <Scroll html style={{ width: '100%' }}>
      <div className="fitverse-overlay">

        {/* ── Section 1: Hero ── */}
        <section className="fitverse-section fitverse-hero">
          <div className="hero-badge-3d">
            <span className="badge-dot"></span>
            <span>Next-Gen Fitness Platform</span>
          </div>

          <h1 className="fitverse-hero-title">
            <span className="line-1">THE ULTIMATE</span>
            <span className="line-gradient">TRAINER LOCATOR</span>
          </h1>

          <p className="fitverse-hero-sub">
            Find world-class trainers, track your progress with AI-powered analytics,
            and transform your body in the most immersive fitness platform ever built.
          </p>

          <div className="fitverse-hero-actions">
            <button
              className="fitverse-btn btn-glow"
              onClick={() => onNavigate('register')}
            >
              Enter the Verse →
            </button>
            <button
              className="fitverse-btn btn-outline"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
          </div>

          <div className="scroll-indicator">
            <span>Scroll to explore</span>
            <div className="scroll-line"></div>
          </div>
        </section>

        {/* ── Section 2: Features ── */}
        <section className="fitverse-section fitverse-features">
          <span className="section-tag">FEATURES</span>
          <h2 className="fitverse-section-title">
            Why Choose <span className="text-gradient">TrainerLocator</span>?
          </h2>

          <div className="features-grid-3d">
            <div className="feature-card-3d">
              <span className="feature-icon-3d">🎯</span>
              <h3>AI-Powered Matching</h3>
              <p>Our algorithm finds your perfect trainer based on goals, schedule, and training style.</p>
            </div>
            <div className="feature-card-3d">
              <span className="feature-icon-3d">🏆</span>
              <h3>Certified Pros</h3>
              <p>Every trainer is verified, certified, and continuously evaluated for quality.</p>
            </div>
            <div className="feature-card-3d">
              <span className="feature-icon-3d">📍</span>
              <h3>Live Location</h3>
              <p>Find trainers near you in real-time. Book sessions at gyms closest to your location.</p>
            </div>
            <div className="feature-card-3d">
              <span className="feature-icon-3d">📊</span>
              <h3>Smart Analytics</h3>
              <p>Track progress with AI-driven insights, personalized workout plans and more.</p>
            </div>
            <div className="feature-card-3d">
              <span className="feature-icon-3d">💬</span>
              <h3>Real-Time Chat</h3>
              <p>Communicate with your trainer instantly. Share progress, get feedback, stay motivated.</p>
            </div>
            <div className="feature-card-3d">
              <span className="feature-icon-3d">💎</span>
              <h3>Flexible Plans</h3>
              <p>Choose packages that fit your budget. No contracts, no hidden fees, pure results.</p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Stats ── */}
        <section className="fitverse-section fitverse-stats">
          <span className="section-tag">THE NUMBERS</span>
          <h2 className="fitverse-section-title">
            Trusted by <span className="text-gradient">Thousands</span>
          </h2>

          <div className="stats-grid-3d">
            <div className="stat-card-3d">
              <div className="stat-value-3d">10K+</div>
              <div className="stat-label-3d">Active Users</div>
            </div>
            <div className="stat-card-3d">
              <div className="stat-value-3d">500+</div>
              <div className="stat-label-3d">Pro Trainers</div>
            </div>
            <div className="stat-card-3d">
              <div className="stat-value-3d">95%</div>
              <div className="stat-label-3d">Success Rate</div>
            </div>
            <div className="stat-card-3d">
              <div className="stat-value-3d">24/7</div>
              <div className="stat-label-3d">Support</div>
            </div>
          </div>
        </section>

        {/* ── Section 4: CTA ── */}
        <section className="fitverse-section fitverse-cta">
          <h2 className="cta-title">
            Ready to Enter<br />
            <span className="text-gradient">TrainerLocator?</span>
          </h2>
          <p className="cta-sub">
            Join thousands of athletes and trainers who have already transformed their fitness journey.
          </p>
          <div className="fitverse-hero-actions">
            <button
              className="fitverse-btn btn-glow"
              onClick={() => onNavigate('register')}
            >
              Create Free Account
            </button>
            <button
              className="fitverse-btn btn-outline"
              onClick={() => onNavigate('login')}
            >
              Sign In
            </button>
          </div>

          <div className="fitverse-footer">
            © 2026 TrainerLocator. All rights reserved.
          </div>
        </section>
      </div>
    </Scroll>
  );
}

/* ============================================================
   FITVERSE LANDING — MAIN EXPORT
   ============================================================ */
export default function TrainerLocator({ onNavigate }) {
  return (
    <div className="fitverse-landing">
      {/* Background ambient glow blobs */}
      <div className="fitverse-bg-glow">
        <div className="glow-blob blob-purple"></div>
        <div className="glow-blob blob-pink"></div>
        <div className="glow-blob blob-cyan"></div>
      </div>

      {/* Cybernetic digital training grid */}
      <div className="fitverse-bg-grid"></div>

      {/* Fixed navbar overlay */}
      <nav className="fitverse-nav">
        <div className="fitverse-logo" onClick={() => onNavigate('welcome')}>
          TrainerLocator
        </div>
        <div className="fitverse-nav-links">
          <button
            className="fitverse-nav-btn ghost"
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
          <button
            className="fitverse-nav-btn primary"
            onClick={() => onNavigate('register')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* 3D Canvas */}
      <Canvas
        className="fitverse-canvas"
        camera={{ position: [0, 0, 6], fov: 50 }}
        dpr={[1, 2]}
      >
        <fog attach="fog" args={['#010208', 8, 30]} />

        <Suspense fallback={null}>
          <ScrollControls pages={4} damping={0.25}>
            <Scene />
            <HtmlContent onNavigate={onNavigate} />
          </ScrollControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
