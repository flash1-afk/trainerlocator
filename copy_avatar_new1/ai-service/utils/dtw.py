"""
Dynamic Time Warping (DTW) implementation.

Compares two joint-angle time series of different lengths.
Automatically adapts to any recorded exercise template —
no hardcoded exercise knowledge required.
"""

import numpy as np
from typing import Optional


def sequence_to_matrix(frames: list[dict], joints: list[str]) -> np.ndarray:
    """Convert a list of angle dicts to a (T x J) numpy matrix."""
    mat = []
    for frame in frames:
        row = [frame.get(j, 0.0) for j in joints]
        mat.append(row)
    return np.array(mat, dtype=float)


def dtw_distance(
    s1: list[dict],
    s2: list[dict],
    joints: list[str],
    window: Optional[int] = None,
) -> float:
    """
    Compute DTW distance between two multi-dimensional angle sequences.

    Uses Sakoe-Chiba band constraint when window is specified.
    Lower distance = more similar movement.
    """
    m1 = sequence_to_matrix(s1, joints)
    m2 = sequence_to_matrix(s2, joints)

    n, m = len(m1), len(m2)
    if n == 0 or m == 0:
        return float('inf')

    # Normalize each joint independently (z-score) so magnitude differences
    # don't dominate — only shape/timing matters
    for j in range(m1.shape[1]):
        std = m1[:, j].std()
        if std > 0:
            m1[:, j] = (m1[:, j] - m1[:, j].mean()) / std
            m2[:, j] = (m2[:, j] - m1[:, j].mean()) / std  # normalize by template stats

    # DTW matrix
    dtw_mat = np.full((n + 1, m + 1), np.inf)
    dtw_mat[0, 0] = 0.0

    w = window or max(n, m)  # no constraint if window not set

    for i in range(1, n + 1):
        j_start = max(1, i - w)
        j_end   = min(m, i + w) + 1
        for j in range(j_start, j_end):
            cost = float(np.linalg.norm(m1[i-1] - m2[j-1]))
            dtw_mat[i, j] = cost + min(
                dtw_mat[i-1, j],
                dtw_mat[i, j-1],
                dtw_mat[i-1, j-1],
            )

    return float(dtw_mat[n, m])


def dtw_similarity_score(
    template: list[dict],
    query: list[dict],
    joints: list[str],
    window: int = 10,
) -> tuple[float, float]:
    """
    Returns (distance, score_0_to_100).

    Score is derived by comparing the DTW distance against the
    template's own self-distance (baseline) — fully data-driven.
    """
    dist = dtw_distance(template, query, joints, window)

    # Self-distance of template as a reference point for 100% score
    # We use a randomly-shifted copy of the template to get a baseline
    half = len(template) // 2
    shifted = template[half:] + template[:half]
    self_dist = dtw_distance(template, shifted, joints, window)
    if self_dist <= 0:
        self_dist = dist * 0.5 if dist > 0 else 1.0

    # Score: 100 when dist ≈ self_dist, 0 when dist >> self_dist
    ratio = dist / (self_dist * 2.0)
    score = max(0.0, min(100.0, (1.0 - ratio) * 100.0))
    return dist, round(score, 1)
