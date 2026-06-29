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

// ── How we decide if someone is "holding still" ───────────────────────────
// We measure joint movement like angles on a protractor (degrees).
const STABLE_DEG_HOLD     = 6;    // Stretching: Very strict! You can only wobble by 6 degrees.
const STABLE_DEG_SEQUENCE = 12;   // Boxing/Yoga: More forgiving! A boxer's punch bounces, so we allow 12 degrees of wobble.
const HOLD_WINDOW         = 20;   // The AI always looks at the last 20 camera frames (about 2/3 of a second) to check for wobble.
const HOLD_MIN_FRAMES_HOLD     = 25;   // You must hold totally still for 25 frames before the AI officially says "Yes, they are holding the pose!"
const HOLD_MIN_FRAMES_SEQUENCE = 12;   // In boxing, you don't pause for long, so you only need to hold still for 12 frames to count as a "guard" or "pause".

// ── Catching super fast movements (like Boxing punches) ───────────────────
const VELOCITY_HIGH     = 0.05;   // If you move faster than this, the AI knows you are throwing a punch or moving actively.
const VELOCITY_LOW      = 0.012;  // When you slow down past this speed, the AI assumes your punch has fully extended (the "apex").
const PEAK_MIN_GAP_MS   = 350;    // Wait at least a third of a second between punches so the AI doesn't double-count a glitch.

// ── Organizing complex combos ─────────────────────────────────────────────
// If you throw two punches that are almost identical (within 28 degrees of each other), 
// the AI groups them together as the exact same "Step" in the combo.
const CLUSTER_THRESHOLD_DEG = 28;

class TrainingEngine {
  /**
   * CONSTRUCTOR
   * Think of this as the "startup routine" when a trainer starts recording a new exercise.
   * It sets up all the blank slate variables we need to track their body movements.
   */
  constructor(exerciseId, category = 'strength') {
    this.exerciseId = exerciseId;
    this.category   = category; // What type of exercise is this? (e.g., strength, yoga)

    // Automatically decide the logic "mode" based on the category of exercise
    if (SEQUENCE_CATEGORIES.has(category))  this._mode = 'sequence'; // Boxing, Yoga
    else if (HOLD_CATEGORIES.has(category)) this._mode = 'hold';     // Stretching
    else                                     this._mode = 'reps';    // Pushups, Squats

    this.frames      = []; // This will store every single snapshot (frame) of the trainer's body
    this.repFrames   = []; // This stores specifically the important frames (like the bottom of a squat)
    this.startTime   = Date.now(); // Start a timer

    // ── Reps mode variables (for counting pushups, squats, etc.) ──────────────
    this._repBuffer    = [];       // Temporary storage for frames during one rep
    this._phase        = 'idle';   // Are they resting, going down, or coming back up?
    this._primaryJoint = null;     // Which joint is doing the most work? (e.g., knee for squats)
    this._angleHistory = [];       // History of joint angles to track movement
    this._lastRepEnd   = 0;        // When did the last rep finish?
    this._minRepGap    = 500;      // Don't count reps faster than half a second

    // ── Hold & Sequence mode variables (for yoga, stretching, boxing) ─────────
    this._holdBuffer  = [];        // Temporary storage while they are holding a pose
    this._inHold      = false;     // Are they currently holding perfectly still?
    this._holdHistory = [];        // Recent frames to check if they are stable

    // ── Boxing specific variables (tracking fast punches) ─────────────────────
    this._wasMoving   = false;     // Did they just throw a punch?
    this._peakBuffer  = [];        // Temporary storage to find the exact moment the punch fully extended
    this._lastPeakTs  = 0;         // When was the last punch captured? (to prevent double counting)

    // Set how strict we want to be about "holding still" based on the exercise
    const sd  = SEQUENCE_CATEGORIES.has(category) ? STABLE_DEG_SEQUENCE : STABLE_DEG_HOLD;
    const mf  = SEQUENCE_CATEGORIES.has(category) ? HOLD_MIN_FRAMES_SEQUENCE : HOLD_MIN_FRAMES_HOLD;
    this._stableDeg  = sd; // Maximum allowed wobble (degrees)
    this._minHoldFr  = mf; // Minimum frames they must hold still

    console.log(`[TrainingEngine] mode=${this._mode} category=${category} stableDeg=${sd}`);
  }

  /**
   * ADD FRAME
   * Every time the camera captures a new position of the trainer (usually 30 times a second),
   * this function is called to process it.
   */
  addFrame(frame) {
    this.frames.push(frame); // Save the raw snapshot
    this._angleHistory.push(frame.angles); // Save the angles of all their joints
    // Keep only the last 60 angle snapshots in memory so it doesn't get too big
    if (this._angleHistory.length > 60) this._angleHistory.shift();

    // Route the snapshot to the correct logic depending on the exercise mode
    if (this._mode === 'sequence') return this._addFrameSequence(frame);
    if (this._mode === 'hold')     return this._addFrameHold(frame);
    return this._addFrameReps(frame); // Default for strength/cardio
  }

  // ── Sequence mode ─────────────────────────────────────────────────────────

  /**
   * SEQUENCE MODE: Processing a frame
   * Used for things like Boxing or Yoga, where the exercise is a sequence of distinct steps.
   */
  _addFrameSequence(frame) {
    this._holdHistory.push(frame); // Keep track of recent frames to see if they are holding still
    if (this._holdHistory.length > HOLD_WINDOW) this._holdHistory.shift();

    const vel    = frame.velocity || 0; // How fast are they moving right now?
    const stable = this._isStable(this._holdHistory, this._stableDeg); // Are they holding still?

    // ── Velocity-peak capture (Catching fast movements like boxing strikes) ────
    if (vel > VELOCITY_HIGH) {
      // Actively moving — start recording this burst of movement
      this._wasMoving = true;
      this._peakBuffer.push(frame);
    } else if (this._wasMoving) {
      // Decelerating: They were moving fast, but are now slowing down.
      // IMPORTANT: The moment they slow down is usually the "apex" or full extension of a punch.
      this._peakBuffer.push(frame);
      if (vel < VELOCITY_LOW) {
        // Fully stopped — the punch/movement is complete.
        const now = frame.timestamp;
        
        // Ensure this isn't just a glitch by checking time since last peak
        if (this._peakBuffer.length >= 4 && (now - this._lastPeakTs) > PEAK_MIN_GAP_MS) {
          // The true "apex" (full extension) usually happens in the last 40% of the movement
          const apexStart = Math.floor(this._peakBuffer.length * 0.60);
          const apex = this._peakBuffer.slice(apexStart);
          this.repFrames.push(apex); // Save this key moment
          this._lastPeakTs = now;
          console.log(`[TrainingEngine] Strike apex #${this.repFrames.length} captured (${apex.length} frames, buf=${this._peakBuffer.length})`);
        }
        this._wasMoving  = false;
        this._peakBuffer = []; // Clear the temporary buffer
      }
    } else {
      // Idle — discard any old stale movement data
      if (this._peakBuffer.length) this._peakBuffer = [];
    }

    // ── Stable hold capture (Catching pauses like a Yoga pose or Boxing guard) ─
    if (stable) {
      this._holdBuffer.push(frame);
      // If they've held still long enough, officially start recording a "Hold"
      if (!this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this._inHold = true;
        console.log(`[TrainingEngine] Hold started (${this._holdBuffer.length} frames)`);
      }
    } else {
      // They broke the hold (started moving again). Save what we captured.
      if (this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this.repFrames.push([...this._holdBuffer]); // Save this stable pose
        console.log(`[TrainingEngine] Stable position #${this.repFrames.length} captured (${this._holdBuffer.length} frames)`);
      }
      this._holdBuffer = [];
      this._inHold     = false;
    }

    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  // ── Hold mode ──────────────────────────────────────────────────────────────

  /**
   * HOLD MODE: Processing a frame
   * Used for stretching exercises where the goal is a single sustained pose.
   */
  _addFrameHold(frame) {
    this._holdHistory.push(frame); // Keep track of recent frames
    if (this._holdHistory.length > HOLD_WINDOW) this._holdHistory.shift();

    const stable = this._isStable(this._holdHistory, this._stableDeg); // Are they holding perfectly still?

    if (stable) {
      this._holdBuffer.push(frame);
      // If held long enough, it counts as a valid hold pose
      if (!this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this._inHold = true;
      }
    } else {
      // If they move, the hold is over. Save it if it was long enough.
      if (this._inHold && this._holdBuffer.length >= this._minHoldFr) {
        this.repFrames.push([...this._holdBuffer]);
      }
      this._holdBuffer = [];
      this._inHold     = false;
    }

    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  // ── Reps mode ──────────────────────────────────────────────────────────────

  /**
   * REPS MODE: Processing a frame
   * Used for things like pushups, squats, situps, where we need to count repetitions.
   */
  _addFrameReps(frame) {
    this._repBuffer.push(frame);
    
    // We need to wait for 30 frames (about 1 second) of movement to figure out 
    // which joint is doing the primary work (e.g., knee for squats).
    if (!this._primaryJoint && this.frames.length === 30) {
      this._primaryJoint = this._detectPrimaryJoint();
    }
    
    // Once we know the main working joint, we can start counting reps based on its movement
    if (this._primaryJoint && this.frames.length > 30) {
      this._detectRep(frame);
    }
    
    return { frameCount: this.frames.length, repCount: this.repFrames.length };
  }

  /**
   * DETECT PRIMARY JOINT
   * Looks at the first 30 frames of movement and figures out which joint is 
   * changing the most. For example, in a squat, the knee angle changes a lot, 
   * so it becomes the "primary" joint we watch to count reps.
   */
  _detectPrimaryJoint() {
    const jointNames = Object.keys(this._angleHistory[0] || {});
    let maxVariance = 0, primary = 'leftElbow'; // Default
    
    for (const joint of jointNames) {
      const vals = this._angleHistory.map(a => a[joint] || 0).filter(v => v > 0);
      if (vals.length < 5) continue;
      
      // Calculate how much this joint's angle is changing (variance)
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
      
      // The joint with the biggest change is the primary joint
      if (variance > maxVariance) { maxVariance = variance; primary = joint; }
    }
    console.log(`[TrainingEngine] Primary joint: ${primary} (variance=${maxVariance.toFixed(1)})`);
    return primary;
  }

  /**
   * DETECT REP
   * Watches the primary joint. If it goes down and comes back up, that counts as 1 rep.
   */
  _detectRep(frame) {
    const now    = frame.timestamp;
    // Look at the last 15 frames for the primary joint
    const window = this._angleHistory.slice(-15).map(a => a[this._primaryJoint] || 0);
    if (window.length < 10) return;

    // Compare the very recent frames to slightly older frames to see direction of movement
    const recent     = window.slice(-5);
    const earlier    = window.slice(0, 5);
    const recentAvg  = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    const delta      = recentAvg - earlierAvg; // Positive means opening, negative means closing

    // State machine for counting a rep:
    if (this._phase === 'idle' || this._phase === 'returning') {
      // If they were resting, and now the joint is bending significantly, they are "going" into a rep
      if (Math.abs(delta) > 8) { this._phase = 'going'; this._repStart = now; this._repBuffer = []; }
    } else if (this._phase === 'going') {
      // If they were "going", and the joint stops bending, they are at the bottom of the rep and starting to "return"
      if (Math.abs(delta) < 3 && this._repBuffer.length > 10) this._phase = 'returning';
    }

    // If they have fully returned, the rep is finished
    if (this._phase === 'returning' && this._repBuffer.length > 20) {
      const timeInPhase = now - (this._repStart || now);
      // Ensure it wasn't just a glitch by making sure the rep took at least half a second
      if (timeInPhase > this._minRepGap) {
        this.repFrames.push([...this._repBuffer]); // Save the frames that make up this rep
        this._repBuffer = [];
        this._phase     = 'idle'; // Reset to idle for the next rep
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

  /**
   * FINALIZE
   * Called when the trainer presses "Stop Recording".
   * This function looks at all the data we gathered (the reps, the holds, the punches)
   * and builds a "Profile" of the perfect exercise. The Coach Engine will use this 
   * profile later to judge the user.
   */
  finalize() {
    // 1. Clean up: If they were in the middle of a hold or punch when they stopped, save it.
    if ((this._mode === 'hold' || this._mode === 'sequence') &&
        this._inHold && this._holdBuffer.length >= this._minHoldFr) {
      this.repFrames.push([...this._holdBuffer]);
    }
    if (this._mode === 'sequence' && this._wasMoving && this._peakBuffer.length >= 4) {
      const apexStart = Math.floor(this._peakBuffer.length * 0.60);
      this.repFrames.push(this._peakBuffer.slice(apexStart));
    }

    const duration = Date.now() - this.startTime; // Total time of the exercise
    const repCount = this.repFrames.length;       // Total number of reps/holds captured

    // Calculate how fast they did the reps (Tempo)
    const repDurations = this.repFrames.map(rep =>
      rep.length < 2 ? 0 : rep[rep.length - 1].timestamp - rep[0].timestamp
    ).filter(d => d > 0);
    const avgTempo = repDurations.length
      ? repDurations.reduce((a, b) => a + b, 0) / repDurations.length / 1000 : 0;

    // Calculate biomechanical stats
    const rangeOfMotion = this._computeRangeOfMotion(this.frames); // Max angle - Min angle
    const peakAngles    = this._computePeakAngles(this.frames, 'max'); // E.g., fully open arm
    const valleyAngles  = this._computePeakAngles(this.frames, 'min'); // E.g., fully bent arm
    const keyAngles     = this.repFrames.map(rep => {
      // Find the average angles right in the middle of a rep
      const slice = rep.slice(Math.floor(rep.length * 0.1), Math.floor(rep.length * 0.9));
      return this._averageAngles(slice.length ? slice : rep);
    });
    const symmetryScore = this._computeSymmetry(this.frames); // E.g., is left arm doing the same as right arm?
    const velocities    = this.frames.map(f => f.velocity || 0).filter(v => v > 0);
    const avgVelocity   = velocities.length ? velocities.reduce((a, b) => a + b, 0) / velocities.length : 0;
    const smoothness    = this.frames.map(f => f.smoothness || 0);
    const avgSmoothness = smoothness.length ? smoothness.reduce((a, b) => a + b, 0) / smoothness.length : 0;

    // ── Hold mode specific processing ─────────────────────────────────────────
    let targetPose   = null;
    let jointStdDev  = null;
    if (this._mode === 'hold') {
      // Find the longest, most stable hold they did
      const bestHold = this.repFrames.reduce(
        (best, hold) => hold.length > best.length ? hold : best,
        this.repFrames[0] || []
      );
      const sourceFrames = bestHold?.length > 0 ? bestHold : this.frames;
      // Throw away the messy start/end of the hold, keep the clean middle
      const slice = sourceFrames.slice(
        Math.floor(sourceFrames.length * 0.1),
        Math.floor(sourceFrames.length * 0.9)
      );
      const holdFrames = slice.length ? slice : sourceFrames;
      
      targetPose  = this._averageAngles(holdFrames); // This becomes the "Perfect Pose"
      jointStdDev = this._computeJointStdDev(holdFrames); // How much did the trainer wobble? (Sets the strictness for the user)
    }

    // ── Sequence mode specific processing ──────────────────────────────────────
    let steps = null;
    if (this._mode === 'sequence') {
      // Take all the chaotic punches/poses and organize them into clean "Steps" (Step 1, Step 2...)
      steps = this._clusterIntoSteps(this.repFrames);
      console.log(`[TrainingEngine] ${steps.length} distinct steps identified from ${this.repFrames.length} captured positions`);
      steps.forEach((s, i) => console.log(`  Step ${i+1}: ${JSON.stringify(s.targetAngles).slice(0,80)}…`));
    }

    // Return the final "Profile" to be saved in the database
    return {
      exerciseId:   this.exerciseId,
      frames:       this.frames,
      repFrames:    this.repFrames,
      keyAngles,
      repCount,
      durationMs:   duration,
      tempo:        avgTempo,
      primaryJoint: this._primaryJoint, // e.g., 'leftKnee'
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
        targetPose,    // Only used for 'hold' mode
        jointStdDev,   // Only used for 'hold' mode
        steps,         // Only used for 'sequence' mode
      },
    };
  }

  // ── Organizing complex movements (Clustering) ─────────────────────────────

  /**
   * CLUSTER INTO STEPS
   * If a trainer throws 5 Jabs during their recording, we don't want 5 separate steps 
   * in the final profile. We want them to merge into a single "Step 1: Jab".
   * This function looks at every pose captured, groups the similar ones together, 
   * and averages them out to create the final "Steps".
   */
  _clusterIntoSteps(capturedGroups) {
    if (!capturedGroups.length) return [];

    const clusters = [];   // Stores our grouped poses

    for (const group of capturedGroups) {
      if (!group.length) continue;
      const avgAngles = this._averageAngles(group);
      const firstTs   = group[0].timestamp;

      // Check if this pose looks like any of the poses we've already grouped
      let bestCluster  = null;
      let bestDistance = Infinity;
      for (const cluster of clusters) {
        const dist = this._angleDistance(cluster.centroid, avgAngles); // How different are they?
        if (dist < bestDistance) { bestDistance = dist; bestCluster = cluster; }
      }

      // If they are similar enough (e.g. less than 28 degrees difference), merge them!
      if (bestCluster && bestDistance < CLUSTER_THRESHOLD_DEG) {
        bestCluster.groups.push(group);
        const allFrames = bestCluster.groups.flat();
        bestCluster.centroid = this._averageAngles(allFrames); // Recalculate the average of the group
      } else {
        // Otherwise, this must be a totally new move. Create a new step!
        clusters.push({
          centroid: avgAngles,
          groups: [group],
          firstTimestamp: firstTs,
        });
      }
    }

    // Sort the steps so Step 1 is the first move they did, Step 2 is the second, etc.
    clusters.sort((a, b) => a.firstTimestamp - b.firstTimestamp);

    // Finalize the steps with nice names and math stats
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
        jointStdDev,   // How much wobble was there in this specific step?
        frameCount:    allFrames.length,
      };
    });
  }

  /**
   * Math helper to find the average difference in degrees between two poses.
   */
  _angleDistance(a, b) {
    const joints = Object.keys(a).filter(j => (a[j] || 0) > 0 && (b[j] || 0) > 0);
    if (!joints.length) return Infinity;
    return joints.reduce((sum, j) => sum + Math.abs(a[j] - b[j]), 0) / joints.length;
  }

  // ── Math Helpers (Behind-the-scenes calculations) ──────────────────────────

  /**
   * Calculate how much the trainer wobbled (Standard Deviation).
   * A consistent trainer has a small wobble -> we will grade the user strictly.
   * A sloppy trainer has a large wobble -> we will give the user more leeway.
   * We clamp it between 3 and 20 degrees so the AI never becomes impossibly strict or too loose.
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
      
      // Keep the wobble strictness between 3° and 20°
      result[joint] = Math.min(20, Math.max(3, Math.sqrt(variance)));
    }
    return result;
  }

  /**
   * Find the total distance a joint moved (Max angle minus Min angle).
   */
  _computeRangeOfMotion(frames) {
    const rom = {};
    if (!frames.length) return rom;
    for (const joint of Object.keys(frames[0].angles)) {
      const vals = frames.map(f => f.angles[joint] || 0).filter(v => v > 0);
      if (vals.length) rom[joint] = Math.max(...vals) - Math.min(...vals);
    }
    return rom;
  }

  /**
   * Find the highest or lowest angle a joint ever reached.
   */
  _computePeakAngles(frames, mode) {
    const result = {};
    if (!frames.length) return result;
    for (const joint of Object.keys(frames[0].angles)) {
      const vals = frames.map(f => f.angles[joint] || 0).filter(v => v > 0);
      if (vals.length) result[joint] = mode === 'max' ? Math.max(...vals) : Math.min(...vals);
    }
    return result;
  }

  /**
   * Smooth out jitter by averaging the angles across multiple frames.
   */
  _averageAngles(frames) {
    if (!frames.length) return {};
    const result = {};
    const getAngles = f => (f && typeof f.angles === 'object') ? f.angles : f;
    const joints = Object.keys(getAngles(frames[0]) || {});
    for (const joint of joints) {
      const vals = frames.map(f => (getAngles(f)[joint] || 0)).filter(v => v > 0);
      result[joint] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    }
    return result;
  }

  /**
   * Checks if the left side of the body is mirroring the right side of the body.
   */
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
    // Returns a score from 0 to 100
    return count ? Math.max(0, Math.min(100, 100 - totalDiff / count)) : 100;
  }
}

module.exports = TrainingEngine;
