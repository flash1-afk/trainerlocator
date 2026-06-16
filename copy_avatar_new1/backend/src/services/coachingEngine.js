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

// Reps-mode thresholds (fraction of ROM)
const GOOD_JOB_THRESHOLD = 0.10;
const WARNING_FACTOR     = 0.15;
const ERROR_FACTOR       = 0.30;

// Hold / sequence mode — σ multipliers
const HOLD_GOOD_SIGMA  = 1.5;   // ≤ 1.5σ  → good job
const HOLD_WARN_SIGMA  = 1.5;   // > 1.5σ  → warning
const HOLD_ERROR_SIGMA = 3.0;   // > 3σ    → error

// Fallback when σ is unavailable (degrees)
const HOLD_WARN_DEG  = 10;      // treated as 1σ fallback

const ANALYSIS_WINDOW_MS  = 2000;
const MESSAGE_COOLDOWN_MS = 5000;
const MIN_WINDOW_FRAMES   = 8;

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
  constructor(template) {
    this.template = template;
    this.repCount  = 0;
    this.score     = 0;
    this.jointMap  = {};

    const meta = template.metadata || {};
    this._mode = meta.exerciseMode || 'reps';

    // Shared
    this.learnedROM   = meta.rangeOfMotion || {};
    this.peakAngles   = meta.peakAngles    || {};
    this.valleyAngles = meta.valleyAngles  || {};
    this.avgTempo     = meta.avgTempo      || 0;
    this.avgVelocity  = meta.avgVelocity   || 0;

    this._frameWindow     = [];
    this._lastMessageTime = 0;

    if (this._mode === 'sequence') {
      // ── Sequence mode ──────────────────────────────────────────────────────
      this.steps = (meta.steps || []).filter(s => s.activeJoints?.length > 0);
      if (!this.steps.length) {
        // Fallback: degrade to reps if no steps were captured
        console.warn('[CoachingEngine] sequence mode but no steps found — degrading to reps');
        this._mode = 'reps';
        this._setupRepsMode(meta);
      } else {
        this._currentStepIdx  = 0;
        this._stepHoldMs      = 0;
        this._stepConfirmedAt = 0;
        // Rep counting: track which steps have been visited since last rep reset
        this._visitedSteps    = new Set();
        this._lastStepIdx     = -1;
        // Active joints = union of all steps' active joints
        this._activeJoints = [...new Set(this.steps.flatMap(s => s.activeJoints))];
        console.log(
          `[CoachingEngine] mode=sequence steps=${this.steps.length} ` +
          `activeJoints=[${this._activeJoints.join(',')}]`
        );
      }

    } else if (this._mode === 'hold') {
      // ── Hold mode ──────────────────────────────────────────────────────────
      this.targetPose    = meta.targetPose  || {};
      this.targetStdDev  = meta.jointStdDev || {};   // per-joint σ from training
      this._activeJoints = Object.entries(this.targetPose)
        .filter(([, v]) => v > 0)
        .map(([j]) => j);
      console.log(`[CoachingEngine] mode=hold activeJoints=[${this._activeJoints.join(',')}]`);

    } else {
      // ── Reps mode ──────────────────────────────────────────────────────────
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

  analyzeFrame(frame) {
    const now       = frame.timestamp;
    const wallClock = Date.now();

    this._frameWindow.push(frame);
    while (this._frameWindow.length > 0 &&
           now - this._frameWindow[0].timestamp > ANALYSIS_WINDOW_MS) {
      this._frameWindow.shift();
    }

    let repResult = { completed: false };
    if (this._mode === 'reps') {
      repResult = this._detectRep(frame);
    }

    let feedback    = [];
    let currentStep = this._currentStepIdx ?? 0;
    let totalSteps  = this.steps?.length ?? 0;

    if (this._frameWindow.length >= MIN_WINDOW_FRAMES &&
        wallClock - this._lastMessageTime >= MESSAGE_COOLDOWN_MS) {

      if (this._mode === 'sequence') {
        const result = this._analyzeSequence(now, wallClock);
        feedback    = result.feedback;
        currentStep = result.currentStep;
      } else if (this._mode === 'hold') {
        feedback = this._analyzeHold(now);
      } else {
        feedback = this._analyzeWindow(now);
      }

      if (feedback.length > 0) this._lastMessageTime = wallClock;
    } else if (this._mode === 'sequence') {
      // Update current step + rep count even when not emitting feedback
      currentStep = this._findNearestStep(this._windowAvgAngles()).idx;
      this._currentStepIdx = currentStep;
    }

    // Sequence rep counting — runs every frame regardless of cooldown
    if (this._mode === 'sequence') {
      repResult = this._detectSequenceRep(currentStep);
    }

    this.score = this._computeScore();
    this._updateLiveJointMap();

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

  _analyzeSequence(now, wallClock) {
    const avgAngles = this._windowAvgAngles();
    const { idx, distance } = this._findNearestStep(avgAngles);
    this._currentStepIdx = idx;
    const step = this.steps[idx];

    const issues  = [];
    let allGood   = true;
    let anyActive = false;

    for (const joint of step.activeJoints) {
      const current = avgAngles[joint];
      const target  = step.targetAngles[joint];
      if (!current || current <= 0 || !target || target <= 0) continue;
      anyActive = true;

      // Adaptive thresholds per joint per step
      const sigma    = step.jointStdDev?.[joint] ?? HOLD_WARN_DEG;
      const warnDeg  = sigma * HOLD_WARN_SIGMA;    // 1.5σ
      const errorDeg = sigma * HOLD_ERROR_SIGMA;   // 3σ

      const deviation = Math.abs(current - target);
      if (deviation > warnDeg) allGood = false;

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
      const msg = SEQ_GOOD_MESSAGES[Math.floor(Math.random() * SEQ_GOOD_MESSAGES.length)];
      feedback = [this._makeFeedback(null, 'correct',
        `${step.name}: ${msg}`, now)];
    } else if (issues.length) {
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

      // Adaptive thresholds derived from training σ
      const sigma    = this.targetStdDev[joint] ?? HOLD_WARN_DEG;
      const warnDeg  = sigma * HOLD_WARN_SIGMA;    // 1.5σ
      const errorDeg = sigma * HOLD_ERROR_SIGMA;   // 3σ

      const deviation = Math.abs(current - target);
      if (deviation > warnDeg) allGood = false;
      if (deviation > errorDeg) {
        issues.push({ joint, deviation, severity: 'error', message: this._holdAngleMessage(joint, current, target) });
      } else if (deviation > warnDeg) {
        issues.push({ joint, deviation, severity: 'warning', message: this._holdAngleMessage(joint, current, target) });
      }
    }

    if (allGood && anyActive) {
      const msg = HOLD_GOOD_MESSAGES[Math.floor(Math.random() * HOLD_GOOD_MESSAGES.length)];
      return [this._makeFeedback(null, 'correct', msg, now)];
    }
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

      const peak   = this.peakAngles[joint]   || 0;
      const valley = this.valleyAngles[joint] || 0;
      const rom    = peak - valley;
      if (rom < 10) continue;

      const outOfBand = Math.max(valley - current, current - peak, 0);
      const fraction  = outOfBand / rom;

      if (fraction > GOOD_JOB_THRESHOLD) allGood = false;
      if (fraction > ERROR_FACTOR) {
        issues.push({ joint, fraction, severity: 'error',
          message: this._preciseAngleMessage(joint, current, peak, valley) });
      } else if (fraction > WARNING_FACTOR) {
        issues.push({ joint, fraction, severity: 'warning',
          message: this._preciseAngleMessage(joint, current, peak, valley) });
      }
    }

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

    const symIssue = this._checkSymmetry(avgAngles);
    if (symIssue) { allGood = false; issues.push(symIssue); }

    if (allGood && anyActive) {
      const msg = REPS_GOOD_MESSAGES[Math.floor(Math.random() * REPS_GOOD_MESSAGES.length)];
      return [this._makeFeedback(null, 'correct', msg, now)];
    }

    const errors   = issues.filter(i => i.severity === 'error');
    const warnings = issues.filter(i => i.severity === 'warning');
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

  // ── Rep detection ──────────────────────────────────────────────────────────

  _detectRep(frame) {
    const angle = frame.angles[this.primaryJoint];
    if (!angle || angle <= 0) return { completed: false };
    if (this._lastPrimaryAngle === null) { this._lastPrimaryAngle = angle; return { completed: false }; }

    const wasBelow = this._lastPrimaryAngle <  this._repMid;
    const isAbove  = angle                  >= this._repMid;
    const wasAbove = this._lastPrimaryAngle >= this._repMid;
    const isBelow  = angle                  <  this._repMid;

    if ((wasBelow && isAbove) || (wasAbove && isBelow)) this._crossings++;
    this._lastPrimaryAngle = angle;

    if (this._crossings >= 2) {
      this._crossings = 0; this.repCount++;
      return { completed: true };
    }
    return { completed: false };
  }

  /**
   * Sequence rep counting.
   *
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

  // ── Scoring ────────────────────────────────────────────────────────────────

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

  // ── Helpers ────────────────────────────────────────────────────────────────

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

  _windowAvgVelocity() {
    const vals = this._frameWindow.map(f => f.velocity || 0).filter(v => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }

  _inferPrimaryJoint() {
    const peak = this.peakAngles, val = this.valleyAngles;
    let maxRom = 0, primary = 'leftElbow';
    for (const j of Object.keys(peak)) {
      const rom = (peak[j] || 0) - (val[j] || 0);
      if (rom > maxRom) { maxRom = rom; primary = j; }
    }
    return primary;
  }

  _makeFeedback(joint, severity, message, timestamp) {
    return {
      id: uuidv4(), timestamp, joint: joint || null, severity, message,
      score: severity === 'correct' ? 100 : severity === 'warning' ? 70 : 40,
    };
  }

  _fmtJoint(joint) {
    return joint.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
  }

  /**
   * Recomputes jointMap from the current rolling-window averages every frame.
   * Uses the same deviation thresholds as the feedback methods so colours
   * always reflect the user's live position — independently of the 5s message cooldown.
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
