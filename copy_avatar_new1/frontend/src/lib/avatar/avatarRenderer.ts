/**
 * AvatarRenderer
 *
 * Three.js skeleton-driven stick figure avatar.
 * - Mirrors detected pose landmarks in real time
 * - Color-codes joints green/yellow/red based on coaching feedback
 * - Renders in its own canvas (passed as ref)
 */

import * as THREE from 'three';
import type { Landmark, JointName, FeedbackSeverity } from '@shared/types';
import { AVATAR_COLORS } from '@shared/constants';
import { LANDMARK_INDICES as LM } from '@shared/constants';

// Bone connections: [from, to] landmark indices
const BONE_CONNECTIONS: [number, number][] = [
  // Torso
  [LM.LEFT_SHOULDER,  LM.RIGHT_SHOULDER],
  [LM.LEFT_SHOULDER,  LM.LEFT_HIP],
  [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
  [LM.LEFT_HIP,       LM.RIGHT_HIP],
  [LM.LEFT_SHOULDER,  LM.NOSE],
  [LM.RIGHT_SHOULDER, LM.NOSE],
  // Left arm
  [LM.LEFT_SHOULDER,  LM.LEFT_ELBOW],
  [LM.LEFT_ELBOW,     LM.LEFT_WRIST],
  // Right arm
  [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
  [LM.RIGHT_ELBOW,    LM.RIGHT_WRIST],
  // Left leg
  [LM.LEFT_HIP,       LM.LEFT_KNEE],
  [LM.LEFT_KNEE,      LM.LEFT_ANKLE],
  [LM.LEFT_ANKLE,     LM.LEFT_FOOT_INDEX],
  // Right leg
  [LM.RIGHT_HIP,      LM.RIGHT_KNEE],
  [LM.RIGHT_KNEE,     LM.RIGHT_ANKLE],
  [LM.RIGHT_ANKLE,    LM.RIGHT_FOOT_INDEX],
];

// Map landmark indices to joint names for coloring
const LANDMARK_TO_JOINT: Partial<Record<number, JointName>> = {
  [LM.LEFT_ELBOW]:     'leftElbow',
  [LM.RIGHT_ELBOW]:    'rightElbow',
  [LM.LEFT_KNEE]:      'leftKnee',
  [LM.RIGHT_KNEE]:     'rightKnee',
  [LM.LEFT_HIP]:       'leftHip',
  [LM.RIGHT_HIP]:      'rightHip',
  [LM.LEFT_SHOULDER]:  'leftShoulder',
  [LM.RIGHT_SHOULDER]: 'rightShoulder',
};

function severityToColor(severity: FeedbackSeverity): number {
  switch (severity) {
    case 'correct': return AVATAR_COLORS.JOINT_CORRECT;
    case 'warning': return AVATAR_COLORS.JOINT_WARNING;
    case 'error':   return AVATAR_COLORS.JOINT_ERROR;
    default:        return AVATAR_COLORS.JOINT_NEUTRAL;
  }
}

export class AvatarRenderer {
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private joints:   THREE.Mesh[]    = [];
  private bones:    THREE.Line[]    = [];
  private jointMaterials: THREE.MeshStandardMaterial[] = [];
  private boneMaterials:  THREE.LineBasicMaterial[]    = [];
  private animId:   number | null   = null;
  private jointMap: Partial<Record<JointName, FeedbackSeverity>> = {};
  private scale = 2.5; // world units to fit avatar

  constructor(canvas: HTMLCanvasElement) {
    this.scene    = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111118);

    this.camera   = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.01, 100);
    this.camera.position.set(0, 0, 3.5);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(canvas.width, canvas.height);

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const dir     = new THREE.DirectionalLight(0x0ea5e9, 1.2);
    dir.position.set(0, 2, 3);
    this.scene.add(ambient, dir);

    // Grid floor
    const grid = new THREE.GridHelper(4, 20, 0x1e3a5f, 0x1e3a5f);
    grid.position.y = -1.2;
    this.scene.add(grid);

    this._buildSkeleton();
    this._startRenderLoop();
  }

  private _buildSkeleton(): void {
    // 33 joint spheres
    for (let i = 0; i < 33; i++) {
      const mat  = new THREE.MeshStandardMaterial({ color: AVATAR_COLORS.JOINT_NEUTRAL, emissive: AVATAR_COLORS.JOINT_NEUTRAL, emissiveIntensity: 0.3 });
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.joints.push(mesh);
      this.jointMaterials.push(mat);
    }

    // Bone lines
    for (const [, ] of BONE_CONNECTIONS) {
      const mat  = new THREE.LineBasicMaterial({ color: AVATAR_COLORS.BONE_DEFAULT });
      const geo  = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.bones.push(line);
      this.boneMaterials.push(mat);
    }
  }

  updatePose(landmarks: Landmark[]): void {
    if (!landmarks || landmarks.length < 33) return;

    for (let i = 0; i < 33; i++) {
      const lm   = landmarks[i];
      const mesh = this.joints[i];
      const vis  = lm.visibility ?? 1;

      if (vis < 0.3) { mesh.visible = false; continue; }
      mesh.visible = true;

      // Normalize: MediaPipe x=0-1, y=0-1 → Three.js world coords
      // Flip x (mirror) and invert y
      mesh.position.set(
        (0.5 - lm.x) * this.scale,
        (0.5 - lm.y) * this.scale,
        (lm.z ?? 0)  * this.scale * 0.5
      );

      // Color joint based on feedback map
      const jointName  = LANDMARK_TO_JOINT[i];
      const severity   = jointName ? (this.jointMap[jointName] ?? 'correct') : 'correct';
      const color      = severityToColor(severity);
      this.jointMaterials[i].color.setHex(color);
      this.jointMaterials[i].emissive.setHex(color);
    }

    // Update bone lines
    for (let b = 0; b < BONE_CONNECTIONS.length; b++) {
      const [from, to] = BONE_CONNECTIONS[b];
      const jFrom = this.joints[from];
      const jTo   = this.joints[to];
      if (!jFrom.visible || !jTo.visible) { this.bones[b].visible = false; continue; }
      this.bones[b].visible = true;
      const positions = this.bones[b].geometry.attributes.position;
      positions.setXYZ(0, jFrom.position.x, jFrom.position.y, jFrom.position.z);
      positions.setXYZ(1, jTo.position.x,   jTo.position.y,   jTo.position.z);
      positions.needsUpdate = true;
    }
  }

  updateJointMap(jointMap: Partial<Record<JointName, FeedbackSeverity>>): void {
    this.jointMap = { ...jointMap };
  }

  resize(width: number, height: number): void {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private _startRenderLoop(): void {
    const loop = () => {
      this.animId = requestAnimationFrame(loop);
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  dispose(): void {
    if (this.animId !== null) cancelAnimationFrame(this.animId);
    this.renderer.dispose();
    this.scene.clear();
  }
}
