import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ user, onUpdate, onBack }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        password: '',
        profileImage: user.profileImage || '',
        phone: user.phone || '',
        location: (typeof user.location === 'string' ? user.location : user.location?.city) || '',
        bio: user.bio || '',
        // Trainer specific optional fields
        specialization: '',
        services: [], // Array of { name, price, duration }
        availability: {}, // Complex object
        certifications: []
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isTrainer, setIsTrainer] = useState(false);

    useEffect(() => {
        // Check if user is trainer and fetch extra details if so
        if (user.role === 'trainer') {
            setIsTrainer(true);
            fetchTrainerProfile();
        }
    }, [user]);

    const fetchTrainerProfile = async () => {
        try {
            const response = await axios.get(`/trainers/user/${user.id || user._id}`);
            if (response.data.success && response.data.trainer) {
                const trainer = response.data.trainer;
                setFormData(prev => ({
                    ...prev,
                    specialization: trainer.specialization || '',
                    location: typeof trainer.location === 'string' ? trainer.location : (trainer.location?.city || prev.location),
                    bio: trainer.bio || prev.bio, // Use trainer bio if available
                    services: trainer.services || [],
                    availability: trainer.availability || {},
                    certifications: trainer.certifications || []
                }));
            }
        } catch (err) {
            console.error('Error fetching trainer details', err);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const uploadData = new FormData();
        uploadData.append('image', file);

        try {
            const res = await axios.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setFormData(prev => {
                    const updated = { ...prev, profileImage: res.data.imageUrl };
                    checkChanges(updated);
                    return updated;
                });
            }
        } catch (err) {
            console.error('File Upload Error:', err);
            setError('Failed to upload image. Make sure "avatars" bucket exists in Supabase.');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            checkChanges(updated);
            return updated;
        });
    };

    const checkChanges = (newData) => {
        // Simple check: compare with initial user data
        // Ideally we should store initial state and compare deeply
        // For now, assume if any field is touched, button is enabled
        setHasChanges(true); // Simplified for UX responsiveness, real validation on submit
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!hasChanges) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            // 1. Update User Basic Info
            const userPayload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                location: formData.location,
                bio: formData.bio
            };
            if (formData.password) userPayload.password = formData.password;

            const userRes = await axios.put(`/users/${user.id || user._id}`, userPayload);

            let updatedUser = userRes.data.user;

            // 2. If Trainer, Update Trainer Profile
            if (isTrainer) {
                // First get trainer ID if strictly needed, but our endpoint might handle it via user ID or we need to find it first.
                // The backend route usually requires trainer ID. 
                // Let's assume we fetched it earlier or search it now.
                // Ideally we stored trainer ID in state.
                // For simplicity, we rely on the backend finding valid trainer via auth or passed ID.
                // Actually, let's fetch it first to be safe or use what we got in fetchTrainerProfile.
                // We'll optimistically try to find the trainer ID from the user object if joined, or search again.

                // Fetch current trainer ID
                const trainerRes = await axios.get(`/trainers/user/${user.id || user._id}`);
                if (trainerRes.data.success) {
                    const trainerId = trainerRes.data.trainer.id || trainerRes.data.trainer._id;
                    const trainerPayload = {
                        specialization: formData.specialization,
                        location: { city: formData.location }, // Simple mapping for now
                        bio: formData.bio,
                        // services: formData.services, // UI for services array editing is complex, left as placeholder
                    };
                    await axios.put(`/trainers/${trainerId}`, trainerPayload);
                }
            }

            setSuccess('Profile updated successfully!');
            onUpdate(updatedUser);
            setHasChanges(false);
            setFormData(prev => ({ ...prev, password: '' })); // Clear password field
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <button
                    onClick={onBack || (() => window.location.href = '/')} // Use passed handler or default
                    style={{
                        marginBottom: '1rem',
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                    type="button"
                >
                    ← Back to Dashboard
                </button>
                <h2>Update Profile</h2>

                {error && <div className="error-msg">{error}</div>}
                {success && <div className="success-msg">{success}</div>}

                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-section">
                        <h3>Personal Information</h3>
                        <div className="form-group">
                            <label>Profile Picture</label>
                            <div className="file-upload-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    id="file-input"
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="file-input" className="btn-upload" style={{
                                    background: '#334155', padding: '0.8rem', borderRadius: '0.5rem', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)'
                                }}>
                                    {uploading ? 'Uploading...' : '📁 Choose File'}
                                </label>
                                <input
                                    type="text"
                                    name="profileImage"
                                    value={formData.profileImage}
                                    onChange={handleChange}
                                    placeholder="Or paste image URL"
                                    style={{ flex: 1 }}
                                />
                            </div>
                            {formData.profileImage && (
                                <div style={{ marginTop: '10px' }}>
                                    <img src={formData.profileImage} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
                                </div>
                            )}
                        </div>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Location (City)</label>
                            <input type="text" name="location" value={formData.location} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Bio</label>
                            <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3"></textarea>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Security</h3>
                        <div className="form-group">
                            <label>New Password (leave blank to keep current)</label>
                            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" />
                        </div>
                    </div>

                    {isTrainer && (
                        <div className="form-section">
                            <h3>Trainer Details</h3>
                            <div className="form-group">
                                <label>Specialization</label>
                                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} />
                            </div>
                            <p className="note">To update services, schedule, and fees, please contact support or use the dedicated dashboard widget (coming soon).</p>
                        </div>
                    )}

                    <div className="form-actions">
                        <button type="submit" className={`btn-update ${hasChanges ? 'active' : 'disabled'}`} disabled={!hasChanges || loading}>
                            {loading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
