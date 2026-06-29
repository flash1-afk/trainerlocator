/**
 * CoachingEngine
 *
 * Three modes (auto-selected from template metadata):
 *
 *  'reps'     — strength, cardio, etc.
 *               ROM-based deviation. Rep counted via midpoint-crossing.
 *               Thresholds: ≤10% ROM → good job, >15% → warning, >30% → error.
 *
 *  'hold'     — stretching
 *  'sequence' — yoga, boxing
 *               Deviation measured in standard deviations (σ) from training data.
 *               ≤ 1.5σ → good job
 *               1.5σ – 3σ → warning
 *               > 3σ    → error
 *
 * Analysis window : 2-second rolling average (smooths jitter)
 * Message cooldown: 5 seconds between ANY message (wall-clock)
 */

const { v4: uuidv4 } = require('uuid');

// ── How strict should we be on Reps? (Pushups, Squats, etc.) ───────────────
// This is based on Range of Motion (ROM). 1.0 means the entire movement.
const GOOD_JOB_THRESHOLD = 0.10; // If they are off by less than 10%, tell them "Good job!"
const WARNING_FACTOR     = 0.15; // If they are off by more than 15%, give them a warning.
const ERROR_FACTOR       = 0.30; // If they are off by more than 30%, give them an error (e.g. "Bend knee more").

// ── How strict should we be on Holds & Sequences? (Yoga, Boxing) ───────────
// We use "Sigma" (σ), which is just a fancy math term for "how much did the trainer wobble?"
// If the trainer wobbled a lot, 1 Sigma is a big number. If they were perfectly still, 1 Sigma is tiny.
const HOLD_GOOD_SIGMA  = 1.5;   // If the user's wobble is within 1.5x of the trainer's wobble, tell them "Good job!"
const HOLD_WARN_SIGMA  = 1.5;   // If they wobble more than 1.5x, give a warning.
const HOLD_ERROR_SIGMA = 3.0;   // If they wobble more than 3x, give an error.

// What if the trainer only did 1 frame and we couldn't measure their wobble?
const HOLD_WARN_DEG  = 10;      // Fallback: Just assume they are allowed to wobble by 10 degrees.

// ── How often should the AI think and speak? ──────────────────────────────
const ANALYSIS_WINDOW_MS  = 2000; // The AI always looks at the last 2 seconds of video to avoid glitchy feedback.
const MESSAGE_COOLDOWN_MS = 5000; // WAIT 5 SECONDS before giving the user another piece of advice so we don't spam them!
const MIN_WINDOW_FRAMES   = 8;    // We need to see at least 8 frames before we start judging them.

const REPS_GOOD_MESSAGES = [
  'Great form — keep it up!',
  'Perfect technique, well done!',
  'Excellent — your form is spot on!',
  'Good job! That is the correct movement.',
  'Nice work — maintain that form!',
  'Perfect range of motion!',
];

const HOLD_GOOD_MESSAGES = [
  'Perfect pose — hold it!',
  'Excellent alignment!',
  'Great form — keep holding!',
  'Spot on — your body is aligned correctly.',
  'Beautiful pose — stay there!',
];

const SEQ_GOOD_MESSAGES = [
  'Perfect — hold that position!',
  'Excellent form on this step!',
  'Great technique — nail it!',
  'Spot on — keep it up!',
];

class CoachingEngine {
  /**
   * CONSTRUCTOR
   * Think of this as the "startup routine" when a user starts a workout.
   * We feed it the "Profile" (Template) that was created by the TrainerEngine earlier.
   */
  constructor(template) {
    this.template = template;
    this.repCount  = 0; // How many reps has the user completed?
    this.score     = 0; // Overall score (0-100)
    this.jointMap  = {}; // Real-time color coding for joints (green=correct, yellow=warning, red=error)

    const meta = template.metadata || {};
    this._mode = meta.exerciseMode || 'reps';

    // Shared data from the Trainer's perfect example
    this.learnedROM   = meta.rangeOfMotion || {}; // How far did the trainer bend?
    this.peakAngles   = meta.peakAngles    || {}; // Max extension
    this.valleyAngles = meta.valleyAngles  || {}; // Max flexion
    this.avgTempo     = meta.avgTempo      || 0;  // How fast did the trainer do it?
    this.avgVelocity  = meta.avgVelocity   || 0;

    this._frameWindow     = []; // Recent frames to smooth out glitchy camera data
    this._lastMessageTime = 0;  // To prevent the coach from talking too much

    if (this._mode === 'sequence') {
      // ── Sequence mode (Boxing, Yoga) ─────────────────────────────────────────
      this.steps = (meta.steps || []).filter(s => s.activeJoints?.length > 0);
      if (!this.steps.length) {
        // If something went wrong recording steps, fall back to simple rep counting
        console.warn('[CoachingEngine] sequence mode but no steps found — degrading to reps');
        this._mode = 'reps';
        this._setupRepsMode(meta);
      } else {
        this._currentStepIdx  = 0;  // Which step of the combo are they currently on?
        this._stepHoldMs      = 0;
        this._stepConfirmedAt = 0;
        // Keep track of which steps they hit to count a full sequence as 1 rep
        this._visitedSteps    = new Set();
        this._lastStepIdx     = -1;
        // Only monitor joints that the trainer actually used
        this._activeJoints = [...new Set(this.steps.flatMap(s => s.activeJoints))];
        console.log(
          `[CoachingEngine] mode=sequence steps=${this.steps.length} ` +
          `activeJoints=[${this._activeJoints.join(',')}]`
        );
      }

    } else if (this._mode === 'hold') {
      // ── Hold mode (Stretching) ───────────────────────────────────────────────
      this.targetPose    = meta.targetPose  || {}; // The perfect pose to match
      this.targetStdDev  = meta.jointStdDev || {}; // How strict we should be based on trainer's wobbles
      this._activeJoints = Object.entries(this.targetPose)
        .filter(([, v]) => v > 0)
        .map(([j]) => j);
      console.log(`[CoachingEngine] mode=hold activeJoints=[${this._activeJoints.join(',')}]`);

    } else {
      // ── Reps mode (Strength/Cardio) ──────────────────────────────────────────
      this._setupRepsMode(meta);
    }
  }

  _setupRepsMode(meta) {
    this.primaryJoint = meta.primaryJoint || this._inferPrimaryJoint();
    this.velocityGoodLo = this.avgVelocity > 0 ? this.avgVelocity * 0.93 : 0;
    this.velocityGoodHi = this.avgVelocity > 0 ? this.avgVelocity * 1.07 : Infinity;
    this.velocityWarnHi = this.avgVelocity > 0 ? this.avgVelocity * 1.60 : Infinity;
    this.velocityWarnLo = this.avgVelocity > 0 ? this.avgVelocity * 0.40 : 0;
    this._activeJoints = Object.entries(this.learnedROM)
      .filter(([, rom]) => rom > 10).map(([j]) => j);
    const peak   = this.peakAngles[this.primaryJoint]   || 150;
    const valley = this.valleyAngles[this.primaryJoint] || 30;
    this._repMid           = (peak + valley) / 2;
    this._lastPrimaryAngle = null;
    this._crossings        = 0;
    console.log(
      `[CoachingEngine] mode=reps primary=${this.primaryJoint} ` +
      `mid=${this._repMid?.toFixed(1)}° activeJoints=[${this._activeJoints.join(',')}]`
    );
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * ANALYZE FRAME
   * Called 30 times a second with the user's current live camera data.
   * Returns feedback (like "Bend knee more"), the rep count, and the live score.
   */
  analyzeFrame(frame) {
    const now       = frame.timestamp;
    const wallClock = Date.now();

    // 1. Smoothing: We keep a rolling window of recent frames (e.g. last 2 seconds)
    // This stops the app from giving wrong advice just because of a 1-frame camera glitch.
    this._frameWindow.push(frame);
    while (this._frameWindow.length > 0 &&
           now - this._frameWindow[0].timestamp > ANALYSIS_WINDOW_MS) {
      this._frameWindow.shift();
    }

    // 2. Rep Detection (for squats, pushups, etc.)
    let repResult = { completed: false };
    if (this._mode === 'reps') {
      repResult = this._detectRep(frame); // Did they just finish a rep?
    }

    let feedback    = [];
    let currentStep = this._currentStepIdx ?? 0;
    let totalSteps  = this.steps?.length ?? 0;

    // 3. Generate Feedback (Only if we have enough data and it's been 5 seconds since the last message)
    if (this._frameWindow.length >= MIN_WINDOW_FRAMES &&
        wallClock - this._lastMessageTime >= MESSAGE_COOLDOWN_MS) {

      // Analyze their form based on the exercise mode
      if (this._mode === 'sequence') {
        const result = this._analyzeSequence(now, wallClock);
        feedback    = result.feedback;
        currentStep = result.currentStep;
      } else if (this._mode === 'hold') {
        feedback = this._analyzeHold(now);
      } else {
        feedback = this._analyzeWindow(now);
      }

      // If we generated a message (e.g. "Straighten your arm"), reset the 5-second cooldown timer
      if (feedback.length > 0) this._lastMessageTime = wallClock;
    } else if (this._mode === 'sequence') {
      // Even if we aren't talking right now, keep track of which step of the combo they are on
      currentStep = this._findNearestStep(this._windowAvgAngles()).idx;
      this._currentStepIdx = currentStep;
    }

    // Sequence rep counting (for boxing combos) runs every frame regardless of cooldown
    if (this._mode === 'sequence') {
      repResult = this._detectSequenceRep(currentStep);
    }

    // 4. Update the live score and the skeleton colors (green/yellow/red)
    this.score = this._computeScore();
    this._updateLiveJointMap();

    // 5. Send it all back to the frontend to display and speak
    return {
      feedback,
      repCount:     this.repCount,
      score:        this.score,
      jointMap:     { ...this.jointMap },
      currentStep,
      totalSteps,
      repCompleted: repResult.completed,
      repScore:     repResult.completed ? this.score : 0,
      repFeedback:  repResult.completed ? feedback : [],
    };
  }

  // ── Sequence mode analysis ─────────────────────────────────────────────────

  /**
   * SEQUENCE MODE: Form check (Boxing/Yoga)
   * Compares the user's current angles to the trainer's angles for the specific "step" they are on.
   */
  _analyzeSequence(now, wallClock) {
    const avgAngles = this._windowAvgAngles(); // User's smoothed live angles
    // Figure out which step they are currently doing (e.g., are they throwing a jab or holding guard?)
    const { idx, distance } = this._findNearestStep(avgAngles);
    this._currentStepIdx = idx;
    const step = this.steps[idx];

    const issues  = [];
    let allGood   = true;
    let anyActive = false;

    // Check every joint that the trainer used in this step
    for (const joint of step.activeJoints) {
      const current = avgAngles[joint];
      const target  = step.targetAngles[joint];
      if (!current || current <= 0 || !target || target <= 0) continue;
      anyActive = true;

      // Adaptive thresholds: If the trainer was very strict (low sigma), be strict with the user.
      // If the trainer wobbled a lot (high sigma), give the user more leeway.
      const sigma    = step.jointStdDev?.[joint] ?? HOLD_WARN_DEG;
      const warnDeg  = sigma * HOLD_WARN_SIGMA;    // Warning threshold
      const errorDeg = sigma * HOLD_ERROR_SIGMA;   // Error threshold

      const deviation = Math.abs(current - target);
      if (deviation > warnDeg) allGood = false; // Form is not perfect

      if (deviation > errorDeg) {
        issues.push({ joint, deviation, severity: 'error',
          message: this._holdAngleMessage(joint, current, target) });
      } else if (deviation > warnDeg) {
        issues.push({ joint, deviation, severity: 'warning',
          message: this._holdAngleMessage(joint, current, target) });
      }
    }

    let feedback;
    if (allGood && anyActive) {
      // Pick a random positive phrase so it doesn't sound robotic
      const msg = SEQ_GOOD_MESSAGES[Math.floor(Math.random() * SEQ_GOOD_MESSAGES.length)];
      feedback = [this._makeFeedback(null, 'correct',
        `${step.name}: ${msg}`, now)];
    } else if (issues.length) {
      // If they have multiple bad joints, find the worst one so we don't overwhelm them with feedback
      issues.sort((a, b) => b.deviation - a.deviation);
      const worst = issues[0];
      // Prefix with step name so the user knows which step is being assessed
      const msg = `${step.name} — ${worst.message}`;
      feedback = [this._makeFeedback(worst.joint, worst.severity, msg, now)];
    } else {
      feedback = [];
    }

    return { feedback, currentStep: idx };
  }

  /**
   * Find the step whose target angles are closest to the current average angles.
   * Distance = mean absolute degree difference across shared joints.
   */
  _findNearestStep(avgAngles) {
    let bestIdx  = 0;
    let bestDist = Infinity;
    for (let i = 0; i < this.steps.length; i++) {
      const step   = this.steps[i];
      const joints = step.activeJoints.filter(
        j => (avgAngles[j] || 0) > 0 && (step.targetAngles[j] || 0) > 0
      );
      if (!joints.length) continue;
      const dist = joints.reduce((sum, j) =>
        sum + Math.abs((avgAngles[j] || 0) - (step.targetAngles[j] || 0)), 0
      ) / joints.length;
      if (dist < bestDist) { bestDist = dist; bestIdx = i; }
    }
    return { idx: bestIdx, distance: bestDist };
  }

  // ── Hold mode analysis ─────────────────────────────────────────────────────

  /**
   * HOLD MODE: Form check (Stretching)
   * Compares the user's live angles against the trainer's single "Perfect Pose".
   */
  _analyzeHold(now) {
    const avgAngles = this._windowAvgAngles();
    const issues    = [];
    let allGood     = true;
    let anyActive   = false;

    for (const joint of this._activeJoints) {
      const current = avgAngles[joint];
      const target  = this.targetPose[joint];
      if (!current || current <= 0 || !target || target <= 0) continue;
      anyActive = true;

      // Adaptive thresholds derived from how stable the trainer was
      const sigma    = this.targetStdDev[joint] ?? HOLD_WARN_DEG;
      const warnDeg  = sigma * HOLD_WARN_SIGMA;    // 1.5σ
      const errorDeg = sigma * HOLD_ERROR_SIGMA;   // 3σ

      const deviation = Math.abs(current - target);
      if (deviation > warnDeg) allGood = false; // They are out of alignment
      
      if (deviation > errorDeg) {
        issues.push({ joint, deviation, severity: 'error', message: this._holdAngleMessage(joint, current, target) });
      } else if (deviation > warnDeg) {
        issues.push({ joint, deviation, severity: 'warning', message: this._holdAngleMessage(joint, current, target) });
      }
    }

    // Give positive reinforcement if everything is perfect
    if (allGood && anyActive) {
      const msg = HOLD_GOOD_MESSAGES[Math.floor(Math.random() * HOLD_GOOD_MESSAGES.length)];
      return [this._makeFeedback(null, 'correct', msg, now)];
    }
    
    // If they have bad form, tell them how to fix the worst joint
    if (!issues.length) return [];
    issues.sort((a, b) => b.deviation - a.deviation);
    const worst = issues[0];
    return [this._makeFeedback(worst.joint, worst.severity, worst.message, now)];
  }

  _holdAngleMessage(joint, current, target) {
    const diff    = Math.round(Math.abs(current - target));
    const jl      = joint.toLowerCase();
    const side    = joint.startsWith('left') ? 'left' : 'right';
    const tooOpen = current > target;

    if (jl.includes('elbow')) {
      return tooOpen
        ? `Bend your ${side} elbow more — ${diff}° past target`
        : `Straighten your ${side} elbow — ${diff}° short of target`;
    }
    if (jl.includes('knee')) {
      return tooOpen
        ? `Your ${side} knee is too straight — bend ${diff}° more`
        : `Bend your ${side} knee less — ${diff}° too bent`;
    }
    if (jl.includes('hip')) {
      return tooOpen
        ? `Open your hips more — ${diff}° short of target`
        : `Close your hip angle — ${diff}° too wide`;
    }
    if (jl.includes('shoulder')) {
      return tooOpen
        ? `Lower your ${side} arm — ${diff}° above target`
        : `Raise your ${side} arm — ${diff}° below target`;
    }
    return `${this._fmtJoint(joint)}: adjust by ${diff}° (currently ${Math.round(current)}°, target ${Math.round(target)}°)`;
  }

  // ── Reps mode analysis ─────────────────────────────────────────────────────

  /**
   * REPS MODE: Form check (Squats/Pushups/etc)
   * Instead of a single target pose, this checks if the user is moving through
   * the full "Range of Motion" that the trainer demonstrated.
   */
  _analyzeWindow(now) {
    const avgAngles = this._windowAvgAngles();
    const avgVel    = this._windowAvgVelocity();
    const issues    = [];
    let allGood     = true;
    let anyActive   = false;

    for (const joint of this._activeJoints) {
      const current = avgAngles[joint];
      if (!current || current <= 0) continue;
      anyActive = true;

      // Peak = fully open joint. Valley = fully bent joint. ROM = the total distance between them.
      const peak   = this.peakAngles[joint]   || 0;
      const valley = this.valleyAngles[joint] || 0;
      const rom    = peak - valley;
      if (rom < 10) continue; // Ignore joints that barely move

      // If they go past the trainer's peak, or squeeze tighter than the trainer's valley, they are "out of band"
      const outOfBand = Math.max(valley - current, current - peak, 0);
      const fraction  = outOfBand / rom;

      // E.g., if they over-extend their elbow by more than 15% of the total range of motion, that's a warning.
      if (fraction > GOOD_JOB_THRESHOLD) allGood = false;
      if (fraction > ERROR_FACTOR) {
        issues.push({ joint, fraction, severity: 'error',
          message: this._preciseAngleMessage(joint, current, peak, valley) });
      } else if (fraction > WARNING_FACTOR) {
        issues.push({ joint, fraction, severity: 'warning',
          message: this._preciseAngleMessage(joint, current, peak, valley) });
      }
    }

    // Tempo check (Are they doing it way too fast or too slow?)
    if (this.avgVelocity > 0 && avgVel > 0) {
      if (avgVel > this.velocityWarnHi) {
        allGood = false;
        issues.push({ joint: null, fraction: 1, severity: 'warning',
          message: `You are moving too fast — slow down by about ${Math.round((avgVel / this.avgVelocity - 1) * 100)}%` });
      } else if (avgVel < this.velocityWarnLo && avgVel > 0.0001) {
        allGood = false;
        issues.push({ joint: null, fraction: 1, severity: 'warning',
          message: `You are moving too slowly — increase your pace` });
      }
    }

    // Symmetry check (Are their left and right arms moving equally?)
    const symIssue = this._checkSymmetry(avgAngles);
    if (symIssue) { allGood = false; issues.push(symIssue); }

    if (allGood && anyActive) {
      const msg = REPS_GOOD_MESSAGES[Math.floor(Math.random() * REPS_GOOD_MESSAGES.length)];
      return [this._makeFeedback(null, 'correct', msg, now)];
    }

    const errors   = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
    // Only shout out the very worst thing they are doing wrong so we don't spam them
    const worst    = errors.length ? errors[0] : warnings.length ? warnings[0] : null;
    if (!worst) return [];
    return [this._makeFeedback(worst.joint, worst.severity, worst.message, now)];
  }

  _preciseAngleMessage(joint, current, peak, valley) {
    const rom     = peak - valley;
    const side    = joint.startsWith('left') ? 'left' : 'right';
    const jl      = joint.toLowerCase();
    const tooOpen = current > peak;
    const tooShort = current < valley;
    const openBy  = Math.round(current - peak);
    const shortBy = Math.round(valley - current);
    const pct     = Math.round(Math.max(tooOpen ? openBy : shortBy, 0) / rom * 100);

    if (jl.includes('elbow')) {
      if (tooShort) return `Extend your ${side} arm further — ${shortBy}° short of full extension`;
      if (tooOpen)  return `Your ${side} elbow is over-extended — ease off by ${openBy}°`;
      return `Adjust your ${side} elbow angle slightly`;
    }
    if (jl.includes('knee')) {
      if (tooShort) return `Bend your ${side} knee more — ${shortBy}° short of target depth`;
      if (tooOpen)  return `Do not lock your ${side} knee — reduce by ${openBy}°`;
      return `Adjust your ${side} knee angle`;
    }
    if (jl.includes('hip')) {
      if (tooShort) return `Hinge your hips further — ${shortBy}° short of target`;
      if (tooOpen)  return `Your hip angle is too wide — reduce by ${openBy}°`;
      return `Adjust your hip position`;
    }
    if (jl.includes('shoulder')) {
      if (tooShort) return `Raise your ${side} arm higher — ${shortBy}° below target`;
      if (tooOpen)  return `Lower your ${side} shoulder — ${openBy}° past target`;
      return `Adjust your ${side} shoulder position`;
    }
    if (tooShort) return `${this._fmtJoint(joint)}: increase range by ${shortBy}° (${pct}% short)`;
    if (tooOpen)  return `${this._fmtJoint(joint)}: reduce range by ${openBy}°`;
    return `${this._fmtJoint(joint)}: adjust your angle`;
  }

  _checkSymmetry(avgAngles) {
    const pairs = [
      ['leftElbow','rightElbow','arm'],['leftKnee','rightKnee','leg'],['leftHip','rightHip','hip'],
    ];
    for (const [l, r, name] of pairs) {
      const lv = avgAngles[l] || 0, rv = avgAngles[r] || 0;
      if (!lv || !rv) continue;
      const rom = Math.max(this.learnedROM[l] || 0, this.learnedROM[r] || 0);
      if (rom < 15) continue;
      const diff = Math.abs(lv - rv);
      if (diff > rom * 0.25) {
        const low = lv < rv ? 'left' : 'right';
        return { joint: null, fraction: diff / rom, severity: 'warning',
          message: `Your ${low} ${name} is ${Math.round(diff)}° lower than your other side — keep them even` };
      }
    }
    return null;
  }

  /**
   * REP DETECTION (Squats/Pushups/etc)
   * Tracks the primary joint. If it goes below the midpoint and comes back up, that's 1 rep.
   */
  _detectRep(frame) {
    const angle = frame.angles[this.primaryJoint];
    if (!angle || angle <= 0) return { completed: false };
    if (this._lastPrimaryAngle === null) { this._lastPrimaryAngle = angle; return { completed: false }; }

    // Check if they crossed the halfway point of the movement
    const wasBelow = this._lastPrimaryAngle <  this._repMid;
    const isAbove  = angle                  >= this._repMid;
    const wasAbove = this._lastPrimaryAngle >= this._repMid;
    const isBelow  = angle                  <  this._repMid;

    // Crossing down is 1 crossing. Crossing back up is the 2nd crossing.
    if ((wasBelow && isAbove) || (wasAbove && isBelow)) this._crossings++;
    this._lastPrimaryAngle = angle;

    // Two crossings = 1 full repetition
    if (this._crossings >= 2) {
      this._crossings = 0; this.repCount++;
      return { completed: true };
    }
    return { completed: false };
  }

  /**
   * SEQUENCE REP COUNTING (Boxing combos, Yoga flows)
   * A rep is completed when the user has visited every step at least once
   * and then returns to step 0 (the start/guard position).
   *
   * This handles any combo length:
   *   2-step: guard → punch → guard = 1 rep
   *   3-step: guard → jab → cross → guard = 1 rep
   *   N-step: all steps visited → return to step 0 = 1 rep
   */
  _detectSequenceRep(currentStep) {
    if (!this.steps.length) return { completed: false };

    // Record every step the user lands on
    if (currentStep !== this._lastStepIdx) {
      this._visitedSteps.add(currentStep);
      this._lastStepIdx = currentStep;
    }

    // A rep completes when ALL steps have been visited and we're back at step 0
    const allVisited = this._visitedSteps.size === this.steps.length;
    if (allVisited && currentStep === 0 && this._visitedSteps.size > 1) {
      // Make sure we actually left step 0 (don't count just standing in guard)
      this._visitedSteps = new Set([0]);  // reset, keeping current position
      this.repCount++;
      return { completed: true };
    }

    return { completed: false };
  }

  /**
   * OVERALL SCORE CALCULATION
   * Generates a 0-100 score of how well they are doing right now.
   * 100 = Perfect, matching trainer exactly.
   * Lower scores = They are deviating from the trainer's angles.
   */
  _computeScore() {
    if (this._mode === 'sequence') return this._scoreSequence();
    if (this._mode === 'hold')     return this._scoreHold();
    return this._scoreReps();
  }

  _scoreSequence() {
    if (!this.steps.length) return 0;
    const avg  = this._windowAvgAngles();
    const step = this.steps[this._currentStepIdx ?? 0];
    let total = 0, count = 0;
    for (const joint of step.activeJoints) {
      const current = avg[joint] || 0;
      const target  = step.targetAngles[joint] || 0;
      if (!current || !target) continue;
      // Score: 100 at 0, 50 at 1.5σ, 0 at 3σ+
      const sigma = step.jointStdDev?.[joint] ?? 10;
      total += Math.max(0, 100 - (Math.abs(current - target) / (sigma * HOLD_ERROR_SIGMA)) * 100);
      count++;
    }
    return count ? Math.round(total / count) : 0;
  }

  _scoreHold() {
    const avg = this._windowAvgAngles();
    let total = 0, count = 0;
    for (const joint of this._activeJoints) {
      const current = avg[joint] || 0, target = this.targetPose[joint] || 0;
      if (!current || !target) continue;
      // Score: 100 at 0, 50 at 1.5σ, 0 at 3σ+
      const sigma = this.targetStdDev?.[joint] ?? 10;
      total += Math.max(0, 100 - (Math.abs(current - target) / (sigma * HOLD_ERROR_SIGMA)) * 100);
      count++;
    }
    return count ? Math.round(total / count) : 0;
  }

  _scoreReps() {
    const avg = this._windowAvgAngles();
    let total = 0, count = 0;
    for (const joint of this._activeJoints) {
      const rom = (this.peakAngles[joint] || 0) - (this.valleyAngles[joint] || 0);
      if (rom < 10) continue;
      const cur = avg[joint] || 0;
      if (!cur) continue;
      const out = Math.max((this.valleyAngles[joint] || 0) - cur, cur - (this.peakAngles[joint] || 180), 0);
      total += Math.max(0, 100 - (out / rom) * 200);
      count++;
    }
    return count ? Math.round(total / count) : 0;
  }

  // ── Math Helpers (Behind-the-scenes calculations) ──────────────────────────

  /**
   * Smooths out the jitter from the camera by averaging all the joint angles 
   * over the last 2 seconds. This stops the AI from freaking out over a 1-frame glitch.
   */
  _windowAvgAngles() {
    if (!this._frameWindow.length) return {};
    const sums = {}, counts = {};
    for (const frame of this._frameWindow) {
      for (const [j, v] of Object.entries(frame.angles)) {
        if (!v || v <= 0) continue;
        sums[j]   = (sums[j]   || 0) + v;
        counts[j] = (counts[j] || 0) + 1;
      }
    }
    const out = {};
    for (const j of Object.keys(sums)) out[j] = sums[j] / counts[j];
    return out;
  }

  /**
   * Calculates how fast the user is moving on average over the last 2 seconds.
   */
  _windowAvgVelocity() {
    const vals = this._frameWindow.map(f => f.velocity || 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  /**
   * If the trainer didn't tell us which joint to watch for counting reps, 
   * this automatically picks the joint that moved the furthest distance.
   */
  _inferPrimaryJoint() {
    const peak = this.peakAngles, val = this.valleyAngles;
    let maxRom = 0, primary = 'leftElbow'; // Default
    for (const j of Object.keys(peak)) {
      const rom = (peak[j] || 0) - (val[j] || 0); // Max minus min = total distance moved
      if (rom > maxRom) { maxRom = rom; primary = j; }
    }
    return primary;
  }

  /**
   * Packages up a piece of feedback into a nice object that the frontend can 
   * display on the screen and read out loud.
   */
  _makeFeedback(joint, severity, message, timestamp) {
    return {
      id: uuidv4(), timestamp, joint: joint || null, severity, message,
      score: severity === 'correct' ? 100 : severity === 'warning' ? 70 : 40,
    };
  }

  /**
   * Makes internal code names readable for the voice robot. 
   * E.g. turns 'leftElbow' into 'Left Elbow' so the voice doesn't sound weird.
   */
  _fmtJoint(joint) {
    return joint.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  /**
   * UPDATE LIVE SKELETON COLORS
   * This changes the colors of the bones on the user's screen in real time.
   * If they are matching the trainer perfectly, the bones turn Green ('correct').
   * If they are slightly off, Yellow ('warning'). 
   * If they are really messing up, Red ('error').
   * This updates constantly, completely ignoring the 5-second voice cooldown!
   */
  _updateLiveJointMap() {
    const avg = this._windowAvgAngles();

    if (this._mode === 'sequence') {
      const step = this.steps[this._currentStepIdx ?? 0];
      if (!step) return;
      for (const j of step.activeJoints) {
        const current = avg[j] || 0;
        const target  = step.targetAngles[j] || 0;
        if (!current || !target) { this.jointMap[j] = 'correct'; continue; }
        const sigma = step.jointStdDev?.[j] ?? HOLD_WARN_DEG;
        const dev   = Math.abs(current - target);
        this.jointMap[j] = dev > sigma * HOLD_ERROR_SIGMA ? 'error'
                         : dev > sigma * HOLD_WARN_SIGMA  ? 'warning'
                         : 'correct';
      }

    } else if (this._mode === 'hold') {
      for (const j of this._activeJoints) {
        const current = avg[j] || 0;
        const target  = this.targetPose[j] || 0;
        if (!current || !target) { this.jointMap[j] = 'correct'; continue; }
        const sigma = this.targetStdDev?.[j] ?? HOLD_WARN_DEG;
        const dev   = Math.abs(current - target);
        this.jointMap[j] = dev > sigma * HOLD_ERROR_SIGMA ? 'error'
                         : dev > sigma * HOLD_WARN_SIGMA  ? 'warning'
                         : 'correct';
      }

    } else {
      // Reps mode — colour by fraction of ROM out-of-band
      for (const j of this._activeJoints) {
        const current = avg[j] || 0;
        if (!current) { this.jointMap[j] = 'correct'; continue; }
        const peak   = this.peakAngles[j]   || 0;
        const valley = this.valleyAngles[j] || 0;
        const rom    = peak - valley;
        if (rom < 10) { this.jointMap[j] = 'correct'; continue; }
        const fraction = Math.max(valley - current, current - peak, 0) / rom;
        this.jointMap[j] = fraction > ERROR_FACTOR ? 'error'
                         : fraction > WARNING_FACTOR ? 'warning'
                         : 'correct';
      }
    }
  }
}

module.exports = CoachingEngine;
