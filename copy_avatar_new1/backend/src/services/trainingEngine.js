/**
 * TrainingEngine
 *
 * Three modes (auto-selected from exercise category):
 *
 *  'reps'      — strength, cardio, martial_arts, dance, custom
 *                Detects repetitions via primary-joint phase transitions.
 *
 *  'hold'      — stretching
 *                Detects a single sustained stable position as the target pose.
 *
 *  'sequence'  — yoga, boxing
 *                Detects multiple distinct key positions in order:
 *                  • Yoga  → each held pose is a step
 *                  • Boxing → guard, strike apex, recovery are all steps
 *                After capture, similar positions are clustered so the same
 *                technique recorded twice collapses into one step.
 *
 * Nothing is hardcoded — all angles, ROM, velocity, and poses are learned
 * entirely from the trainer's demonstration.
 */

const HOLD_CATEGORIES     = new Set(['stretching']);
const SEQUENCE_CATEGORIES = new Set(['yoga', 'boxing']);

// Stability detection (used by both hold and sequence modes)
const STABLE_DEG_HOLD     = 6;    // tight threshold for stretching (single clean hold)
const STABLE_DEG_SEQUENCE = 12;   // looser for boxing — punch apex isn't perfectly still
const HOLD_WINDOW         = 20;   // frames in stability assessment window
const HOLD_MIN_FRAMES_HOLD     = 25;   // sustained frames before "hold" is confirmed
const HOLD_MIN_FRAMES_SEQUENCE = 12;   // shorter for boxing (fast transitions)

// Velocity-peak detection (sequence mode — catches boxing strikes even if brief)
const VELOCITY_HIGH     = 0.05;   // above this = active movement
const VELOCITY_LOW      = 0.012;  // below this = body at rest / limb fully extended
const PEAK_MIN_GAP_MS   = 350;    // debounce: ignore peaks closer than this to avoid doubles

// Clustering: positions closer than this (avg °) merge into the same step
const CLUSTER_THRESHOLD_DEG = 28;

class TrainingEngine {
  constructor(exerciseId, category = 'strength') {
    this.exerciseId = exerciseId;
    this.category   = category;

    if (SEQUENCE_CATEGORIES.has(category))  this._mode = 'sequence';
    else if (HOLD_CATEGORIES.has(category)) this._mode = 'hold';
    else                                     this._mode = 'reps';

    this.frames      = [];
    this.repFrames   = [];   // reps: [[frame…],…]  |  hold/sequence: one array per captured position
    this.startTime   = Date.now();

    // ── Reps state ────────────────────────────────────────────────────────────
    this._repBuffer    = [];
    this._phase        = 'idle';
    this._primaryJoint = null;
    this._angleHistory = [];
    this._lastRepEnd   = 0;
    this._minRepGap    = 500;

    // ── Hold / sequence state ─────────────────────────────────────────────────
    this._holdBuffer  = [];
    this._inHold      = false;
    this._holdHistory = [];   // ring buffer for stability check

    // ── Velocity-peak tracking (sequence mode) ────────────────────────────────
    this._wasMoving   = false;   // true while velocity is above HIGH threshold
    this._peakBuffer  = [];      // accumulates frames during a movement burst + deceleration
    this._lastPeakTs  = 0;       // timestamp of last captured peak (debounce)

    const sd  = SEQUENCE_CATEGORIES.has(category) ? STABLE_DEG_SEQUENCE : STABLE_DEG_HOLD;
    const mf  = SEQUENCE_CATEGORIES.has(category) ? HOLD_MIN_FRAMES_SEQUENCE : HOLD_MIN_FRAMES_HOLD;
    this._stableDeg  = sd;
    this._minHoldFr  = mf;

    console.log(`[TrainingEngine] mode=${this._mode} category=${category} stableDeg=${sd}`);
  }

  addFrame(frame) {
    this.frames.push(frame);
    this._angleHistory.push(frame.angles);
    if (this._angleHistory.length > 60) this._angleHistory.shift();

    if (this._mode === 'sequence') return this._addFrameSequence(frame);
    if (this._mode === 'hold')     return this._addFrameHold(frame);
    return this._addFrameReps(frame);
  }

  // ── Sequence mode ─────────────────────────────────────────────────────────

  _addFrameSequence(frame) {
    this._holdHistory.push(frame);
    if (this._holdHistory.length > HOLD_WINDOW) this._holdHistory.shift();

    const vel    = frame.velocity || 0;
    const stable = this._isStable(this._holdHistory, this._stableDeg);

    // ── Velocity-peak capture (boxing strikes) ────────────────────────────────
    if (vel > VELOCITY_HIGH) {
      // Actively moving — accumulate
      this._wasMoving = true;
      this._peakBuffer.push(frame);
    } else if (this._wasMoving) {
      // Decelerating (velocity between LOW and HIGH, or just crossed LOW).
      // IMPORTANT: these frames contain the apex — limb at maximum extension.
      this._peakBuffer.push(frame);
      if (vel < VELOCITY_LOW) {
        // Fully stopped — the deceleration phase just ended, apex is captured.
        const now = frame.timestamp;
        if (this._peakBuffer.length >= 4 && (now - this._lastPeakTs) > PEAK_MIN_GAP_MS) {
          // The apex lives in the deceleration frames: last 40% of the buffer.
          const apexStart = Math.floor(this._peakBuffer.length * 0.60);
          const apex = this._peakBuffer.slice(apexStart);
          this.repFrames.push(apex);
          this._lastPeakTs = now;
          console.log(`[TrainingEngine] Strike apex #${this.repFrames.length} captured (${apex.length} frames, buf=${this._peakBuffer.length})`);
        }
        this._wasMoving  = false;
        this._peakBuffer = [];
      }
    } else {
      // Idle — discard any stale buffer
      if (this._peakBuffer.length) this._peakBuffer = [];
    }

    // ── Stable hold capture (yoga poses + boxing guard) ───────────────────────
    if (stable) {
      this._holdBuffer.push(frame);
      if (!this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this._inHold = true;
        console.log(`[TrainingEngine] Hold started (${this._holdBuffer.length} frames)`);
      }
    } else {
      if (this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this.repFrames.push([...this._holdBuffer]);
        console.log(`[TrainingEngine] Stable position #${this.repFrames.length} captured (${this._holdBuffer.length} frames)`);
      }
      this._holdBuffer = [];
      this._inHold     = false;
    }

    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  // ── Hold mode ──────────────────────────────────────────────────────────────

  _addFrameHold(frame) {
    this._holdHistory.push(frame);
    if (this._holdHistory.length > HOLD_WINDOW) this._holdHistory.shift();

    const stable = this._isStable(this._holdHistory, this._stableDeg);

    if (stable) {
      this._holdBuffer.push(frame);
      if (!this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this._inHold = true;
      }
    } else {
      if (this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this.repFrames.push([...this._holdBuffer]);
      }
      this._holdBuffer = [];
      this._inHold     = false;
    }

    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  // ── Reps mode ──────────────────────────────────────────────────────────────

  _addFrameReps(frame) {
    this._repBuffer.push(frame);
    if (!this._primaryJoint && this.frames.length === 30) {
      this._primaryJoint = this._detectPrimaryJoint();
    }
    if (this._primaryJoint && this.frames.length > 30) {
      this._detectRep(frame);
    }
    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  _detectPrimaryJoint() {
    const jointNames = Object.keys(this._angleHistory[0] || {});
    let maxVariance = 0, primary = 'leftElbow';
    for (const joint of jointNames) {
      const vals = this._angleHistory.map(a => a[joint] || 0).filter(v => v > 0);
      if (vals.length < 5) continue;
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      if (variance > maxVariance) { maxVariance = variance; primary = joint; }
    }
    console.log(`[TrainingEngine] Primary joint: ${primary} (variance=${maxVariance.toFixed(1)})`);
    return primary;
  }

  _detectRep(frame) {
    const now    = frame.timestamp;
    const window = this._angleHistory.slice(-15).map(a => a[this._primaryJoint] || 0);
    if (window.length < 10) return;

    const recent     = window.slice(-5);
    const earlier    = window.slice(0, 5);
    const recentAvg  = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const delta      = recentAvg - earlierAvg;

    if (this._phase === 'idle' || this._phase === 'returning') {
      if (Math.abs(delta) > 8) { this._phase = 'going'; this._repStart = now; this._repBuffer = []; }
    } else if (this._phase === 'going') {
      if (Math.abs(delta) < 3 && this._repBuffer.length > 10) this._phase = 'returning';
    }

    if (this._phase === 'returning' && this._repBuffer.length > 20) {
      const timeInPhase = now - (this._repStart || now);
      if (timeInPhase > this._minRepGap) {
        this.repFrames.push([...this._repBuffer]);
        this._repBuffer = [];
        this._phase     = 'idle';
        this._lastRepEnd = now;
        console.log(`[TrainingEngine] Rep ${this.repFrames.length} (${timeInPhase}ms)`);
      }
    }
  }

  // ── Stability check ────────────────────────────────────────────────────────

  _isStable(window, maxDeg) {
    if (window.length < 5) return false;
    const joints = Object.keys(window[0].angles);
    for (const joint of joints) {
      const vals = window.map(f => f.angles[joint] || 0).filter(v => v > 0);
      if (vals.length < 3) continue;
      if (Math.max(...vals) - Math.min(...vals) > maxDeg) return false;
    }
    return true;
  }

  // ── Finalize ───────────────────────────────────────────────────────────────

  finalize() {
    // Flush any in-progress hold
    if ((this._mode === 'hold' || this._mode === 'sequence') &&
        this._inHold && this._holdBuffer.length >= this._minHoldFr) {
      this.repFrames.push([...this._holdBuffer]);
    }
    // Flush any in-progress velocity-peak buffer
    if (this._mode === 'sequence' && this._wasMoving && this._peakBuffer.length >= 4) {
      const apexStart = Math.floor(this._peakBuffer.length * 0.60);
      this.repFrames.push(this._peakBuffer.slice(apexStart));
    }

    const duration = Date.now() - this.startTime;
    const repCount = this.repFrames.length;

    const repDurations = this.repFrames.map(rep =>
      rep.length < 2 ? 0 : rep[rep.length - 1].timestamp - rep[0].timestamp
    ).filter(d => d > 0);
    const avgTempo = repDurations.length
      ? repDurations.reduce((a, b) => a + b, 0) / repDurations.length / 1000 : 0;

    const rangeOfMotion = this._computeRangeOfMotion(this.frames);
    const peakAngles    = this._computePeakAngles(this.frames, 'max');
    const valleyAngles  = this._computePeakAngles(this.frames, 'min');
    const keyAngles     = this.repFrames.map(rep => {
      const slice = rep.slice(Math.floor(rep.length * 0.1), Math.floor(rep.length * 0.9));
      return this._averageAngles(slice.length ? slice : rep);
    });
    const symmetryScore = this._computeSymmetry(this.frames);
    const velocities    = this.frames.map(f => f.velocity || 0).filter(v => v > 0);
    const avgVelocity   = velocities.length ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
    const smoothness    = this.frames.map(f => f.smoothness || 0);
    const avgSmoothness = smoothness.length ? smoothness.reduce((a, b) => a + b, 0) / smoothness.length : 0;

    // ── Hold mode: single target pose + per-joint std dev ────────────────────
    let targetPose   = null;
    let jointStdDev  = null;
    if (this._mode === 'hold') {
      const bestHold = this.repFrames.reduce(
        (best, hold) => hold.length > best.length ? hold : best,
        this.repFrames[0] || []
      );
      const sourceFrames = bestHold?.length > 0 ? bestHold : this.frames;
      const slice = sourceFrames.slice(
        Math.floor(sourceFrames.length * 0.1),
        Math.floor(sourceFrames.length * 0.9)
      );
      const holdFrames = slice.length ? slice : sourceFrames;
      targetPose  = this._averageAngles(holdFrames);
      jointStdDev = this._computeJointStdDev(holdFrames);
    }

    // ── Sequence mode: cluster captured positions into ordered steps ───────────
    let steps = null;
    if (this._mode === 'sequence') {
      steps = this._clusterIntoSteps(this.repFrames);
      console.log(`[TrainingEngine] ${steps.length} distinct steps identified from ${this.repFrames.length} captured positions`);
      steps.forEach((s, i) => console.log(`  Step ${i+1}: ${JSON.stringify(s.targetAngles).slice(0,80)}…`));
    }

    return {
      exerciseId:   this.exerciseId,
      frames:       this.frames,
      repFrames:    this.repFrames,
      keyAngles,
      repCount,
      durationMs:   duration,
      tempo:        avgTempo,
      primaryJoint: this._primaryJoint,
      metadata: {
        exerciseMode:     this._mode,
        exerciseCategory: this.category,
        avgVelocity,
        avgSmoothness,
        rangeOfMotion,
        peakAngles,
        valleyAngles,
        symmetryScore,
        repDurations,
        avgTempo,
        targetPose,    // hold mode only
        jointStdDev,   // hold mode only — per-joint σ for adaptive thresholds
        steps,         // sequence mode only — ordered array of step descriptors (each has jointStdDev)
      },
    };
  }

  // ── Clustering ─────────────────────────────────────────────────────────────

  /**
   * Groups captured-position frame-arrays into distinct steps.
   * Two positions merge if their average joint-angle difference < CLUSTER_THRESHOLD_DEG.
   * Steps are ordered by their first occurrence in time.
   */
  _clusterIntoSteps(capturedGroups) {
    if (!capturedGroups.length) return [];

    const clusters = [];   // { centroid{}, frames[][], firstTimestamp }

    for (const group of capturedGroups) {
      if (!group.length) continue;
      const avgAngles = this._averageAngles(group);
      const firstTs   = group[0].timestamp;

      // Find closest existing cluster
      let bestCluster  = null;
      let bestDistance = Infinity;
      for (const cluster of clusters) {
        const dist = this._angleDistance(cluster.centroid, avgAngles);
        if (dist < bestDistance) { bestDistance = dist; bestCluster = cluster; }
      }

      if (bestCluster && bestDistance < CLUSTER_THRESHOLD_DEG) {
        // Merge into existing cluster and recompute centroid
        bestCluster.groups.push(group);
        const allFrames = bestCluster.groups.flat();
        bestCluster.centroid = this._averageAngles(allFrames);
      } else {
        // New distinct step
        clusters.push({
          centroid: avgAngles,
          groups: [group],
          firstTimestamp: firstTs,
        });
      }
    }

    // Sort by order of first appearance and build step descriptors
    clusters.sort((a, b) => a.firstTimestamp - b.firstTimestamp);

    return clusters.map((cluster, i) => {
      const allFrames    = cluster.groups.flat();
      const targetAngles = this._averageAngles(allFrames);
      const jointStdDev  = this._computeJointStdDev(allFrames);
      const activeJoints = Object.entries(targetAngles)
        .filter(([, v]) => v > 0)
        .map(([j]) => j);

      return {
        name:         `Step ${i + 1}`,
        targetAngles,
        activeJoints,
        jointStdDev,   // per-joint σ — used for adaptive warning thresholds
        frameCount:    allFrames.length,
      };
    });
  }

  /**
   * Average absolute difference per joint between two angle maps.
   */
  _angleDistance(a, b) {
    const joints = Object.keys(a).filter(j => (a[j] || 0) > 0 && (b[j] || 0) > 0);
    if (!joints.length) return Infinity;
    return joints.reduce((sum, j) => sum + Math.abs(a[j] - b[j]), 0) / joints.length;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Compute per-joint standard deviation of angles across the given frames.
   * Returns { joint: σ } — clamped to [3°, 20°] so thresholds stay sensible.
   * A consistent trainer → small σ → strict threshold.
   * A looser demo    → larger σ → more forgiving threshold.
   */
  _computeJointStdDev(frames) {
    const result = {};
    if (!frames.length) return result;
    const getAngles = f => (f && typeof f.angles === 'object') ? f.angles : f;
    const joints = Object.keys(getAngles(frames[0]) || {});
    for (const joint of joints) {
      const vals = frames.map(f => (getAngles(f)[joint] || 0)).filter(v => v > 0);
      if (vals.length < 2) { result[joint] = 10; continue; }
      const mean     = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      // Clamp: minimum 3° (avoid impossibly strict) · maximum 20° (avoid too lenient)
      result[joint] = Math.min(20, Math.max(3, Math.sqrt(variance)));
    }
    return result;
  }

  _computeRangeOfMotion(frames) {
    const rom = {};
    if (!frames.length) return rom;
    for (const joint of Object.keys(frames[0].angles)) {
      const vals = frames.map(f => f.angles[joint] || 0).filter(v => v > 0);
      if (vals.length) rom[joint] = Math.max(...vals) - Math.min(...vals);
    }
    return rom;
  }

  _computePeakAngles(frames, mode) {
    const result = {};
    if (!frames.length) return result;
    for (const joint of Object.keys(frames[0].angles)) {
      const vals = frames.map(f => f.angles[joint] || 0).filter(v => v > 0);
      if (vals.length) result[joint] = mode === 'max' ? Math.max(...vals) : Math.min(...vals);
    }
    return result;
  }

  _averageAngles(frames) {
    if (!frames.length) return {};
    const result = {};
    // frames can be either PoseFrame objects (with .angles) or plain angle maps
    const getAngles = f => (f && typeof f.angles === 'object') ? f.angles : f;
    const joints = Object.keys(getAngles(frames[0]) || {});
    for (const joint of joints) {
      const vals = frames.map(f => (getAngles(f)[joint] || 0)).filter(v => v > 0);
      result[joint] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return result;
  }

  _computeSymmetry(frames) {
    const pairs = [['leftElbow','rightElbow'],['leftKnee','rightKnee'],
                   ['leftHip','rightHip'],['leftShoulder','rightShoulder']];
    let totalDiff = 0, count = 0;
    for (const [l, r] of pairs) {
      for (const frame of frames) {
        const lv = frame.angles[l] || 0, rv = frame.angles[r] || 0;
        if (lv > 0 && rv > 0) { totalDiff += Math.abs(lv - rv); count++; }
      }
    }
    return count ? Math.max(0, Math.min(100, 100 - totalDiff / count)) : 100;
  }
}

module.exports = TrainingEngine;
