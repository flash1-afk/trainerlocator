"""
Pose Normalization

Makes pose sequences scale- and position-invariant so that
comparison works regardless of the user's distance from the camera
or their body size relative to the trainer.
"""

import numpy as np
from typing import Optional


def normalize_pose_sequence(frames: list[dict]) -> list[dict]:
    """
    Normalize a sequence of joint angle dicts.

    Approach: z-score each joint independently across the sequence.
    This preserves relative shape (timing + proportion) while removing
    absolute magnitude differences.
    """
    if not frames:
        return frames

    joints = list(frames[0].keys())
    result = [{} for _ in frames]

    for joint in joints:
        vals  = np.array([f.get(joint, 0.0) for f in frames], dtype=float)
        mean  = vals.mean()
        std   = vals.std()
        if std < 1e-6:
            normed = vals - mean  # all same value, keep as zero
        else:
            normed = (vals - mean) / std

        for i, v in enumerate(normed):
            result[i][joint] = float(v)

    return result
