const supabase = require('./config/supabase');
const bcrypt = require('bcryptjs');

// Helper to hash password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

// Seed Data
const seedData = async () => {
    try {
        console.log('🌱 Starting seed process...');

        // Default password for everyone
        const defaultPassword = 'password123';
        const hashedPassword = await hashPassword(defaultPassword);

        // --- TRAINERS ---

        const trainersData = [
            {
                name: 'Abdullah_ahmed',
                email: 'asim.taekwondo@example.com',
                role: 'trainer',
                specialization: 'Taekwondo',
                bio: 'Professional Taekwondo instructor with 10 years of experience helping students achieve discipline and strength.',
                location: { city: 'Lahore', address: 'DHA Phase 5, Lahore' },
                services: [
                    { name: 'Private Session', price: 2500, duration: 60 },
                    { name: 'Group Class', price: 1000, duration: 60 }
                ],
                availability: {
                    monday: { available: true, slots: ['16:00', '17:00', '18:00'] },
                    wednesday: { available: true, slots: ['16:00', '17:00'] },
                    friday: { available: true, slots: ['16:00', '17:00', '18:00'] }
                }
            },
            {
                name: 'Haris Ahmed',
                email: 'haris.yoga@example.com',
                role: 'trainer',
                specialization: 'Yoga',
                bio: 'Certified Hatha Yoga teacher focusing on mindfulness and flexibility.',
                location: { city: 'Lahore', address: 'Gulberg III, Lahore' },
                services: [
                    { name: 'Morning Flow', price: 2000, duration: 60 },
                    { name: 'Meditation', price: 1500, duration: 30 }
                ],
                availability: {
                    tuesday: { available: true, slots: ['07:00', '08:00', '09:00'] },
                    thursday: { available: true, slots: ['07:00', '08:00'] },
                    saturday: { available: true, slots: ['09:00', '10:00'] }
                }
            },
            {
                name: 'Alizeh Sultan',
                email: 'alizeh.grappling@example.com',
                role: 'trainer',
                specialization: 'Grappling',
                bio: 'BJJ Purple belt and competitive grappler. Teaching self-defense and submission wrestling.',
                location: { city: 'Islamabad', address: 'F-7 Markaz, Islamabad' },
                services: [
                    { name: 'Grappling Basics', price: 3000, duration: 90 },
                    { name: 'Sparring Prep', price: 2500, duration: 60 }
                ],
                availability: {
                    monday: { available: true, slots: ['18:00', '19:30'] },
                    wednesday: { available: true, slots: ['18:00', '19:30'] },
                    friday: { available: true, slots: ['17:00', '18:30'] }
                }
            },
            {
                name: 'Bilal Chaudhry',
                email: 'bilal.gym@example.com',
                role: 'trainer',
                specialization: 'Bodybuilding',
                bio: 'Expert in hypertrophy training and nutrition planning.',
                location: { city: 'Lahore', address: 'Model Town C Block, Lahore' },
                services: [
                    { name: 'PT Session', price: 3500, duration: 60 },
                    { name: 'Diet Consultation', price: 2000, duration: 45 }
                ],
                availability: {
                    monday: { available: true, slots: ['06:00', '07:00', '18:00', '19:00'] },
                    tuesday: { available: true, slots: ['06:00', '07:00', '18:00', '19:00'] },
                    wednesday: { available: true, slots: ['06:00', '07:00', '18:00', '19:00'] },
                    thursday: { available: true, slots: ['06:00', '07:00', '18:00', '19:00'] },
                    friday: { available: true, slots: ['06:00', '07:00', '18:00', '19:00'] }
                }
            },
            {
                name: 'Zainab Bibi',
                email: 'zainab.pilates@example.com',
                role: 'trainer',
                specialization: 'Pilates',
                bio: 'Reformer and Mat Pilates instructor for core strength and posture.',
                location: { city: 'Islamabad', address: 'Blue Area, Islamabad' },
                services: [
                    { name: 'Private Reformer', price: 4000, duration: 55 },
                    { name: 'Mat Class', price: 1500, duration: 55 }
                ],
                availability: {
                    monday: { available: true, slots: ['10:00', '11:00'] },
                    wednesday: { available: true, slots: ['10:00', '11:00'] }
                }
            },
            {
                name: 'Usman Malik',
                email: 'usman.crossfit@example.com',
                role: 'trainer',
                specialization: 'CrossFit',
                bio: 'High-intensity functional training coach.',
                location: { city: 'Lahore', address: 'Johar Town, Lahore' },
                services: [
                    { name: 'WOD Session', price: 2000, duration: 60 },
                    { name: 'Strength Spec', price: 2500, duration: 60 }
                ],
                availability: {
                    tuesday: { available: true, slots: ['17:00', '18:00', '19:00'] },
                    thursday: { available: true, slots: ['17:00', '18:00', '19:00'] },
                    saturday: { available: true, slots: ['10:00', '11:00', '12:00'] }
                }
            }
        ];

        // --- STUDENTS ---
        const studentsData = [
            {
                name: 'Fatima Ali',
                email: 'fatima.student@example.com',
                role: 'user',
                location: { city: 'Lahore' }
            },
            {
                name: 'Ahmed Raza',
                email: 'ahmed.student@example.com',
                role: 'user',
                location: { city: 'Islamabad' }
            },
            {
                name: 'Saad Sheikh',
                email: 'saad.student@example.com',
                role: 'user',
                location: { city: 'Lahore' }
            }
        ];

        // --- INSERT TRAINERS ---
        console.log(`\nCreating ${trainersData.length} trainers...`);
        for (const t of trainersData) {
            // 1. Create User
            const userPayload = {
                name: t.name,
                email: t.email,
                password: hashedPassword,
                role: t.role,
                bio: t.bio, // MOVED BIO HERE: users table has bio, trainers table does NOT in schema
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };

            // Check if exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', t.email).single();

            let userId;
            if (existing) {
                console.log(`  User ${t.email} already exists.`);
                userId = existing.id;
            } else {
                const { data: newUser, error: userError } = await supabase.from('users').insert([userPayload]).select().single();
                if (userError) {
                    console.error(`  Error creating user ${t.name}:`, userError.message);
                    continue;
                }
                userId = newUser.id;
                console.log(`  User created: ${t.name} (${t.email})`);
            }

            // 2. Create Trainer Profile
            // Removed 'bio' from this payload as it belongs to users table in current schema
            const trainerPayload = {
                userId: userId,
                specialization: t.specialization,
                location: t.location,
                services: t.services,
                availability: t.availability,
                rating: { average: 5.0, count: 0 },
                isVerified: true
            };

            // Check if trainer profile exists
            const { data: existingProfile } = await supabase.from('trainers').select('id').eq('userId', userId).single();
            if (!existingProfile) {
                const { error: trainerError } = await supabase.from('trainers').insert([trainerPayload]);
                if (trainerError) {
                    console.error(`  Error creating trainer profile for ${t.name}:`, trainerError.message);
                } else {
                    console.log(`  Trainer profile created for ${t.name}`);
                }
            } else {
                console.log(`  Trainer profile already exists for ${t.name}`);
            }
        }

        // --- INSERT STUDENTS ---
        console.log(`\nCreating ${studentsData.length} students...`);
        for (const s of studentsData) {
            const userPayload = {
                name: s.name,
                email: s.email,
                password: hashedPassword,
                role: s.role,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
                location: s.location.city // Schema says location is text for user, JSONB for trainer. Taking string.
            };

            // Check if exists
            const { data: existing } = await supabase.from('users').select('id').eq('email', s.email).single();
            if (existing) {
                console.log(`  Student ${s.email} already exists.`);
            } else {
                const { data: newUser, error: userError } = await supabase.from('users').insert([userPayload]).select().single();
                if (userError) {
                    console.error(`  Error creating student ${s.name}:`, userError.message);
                } else {
                    console.log(`  Student created: ${s.name} (${s.email})`);
                }
            }
        }

        console.log('\n✅ Seeding complete!');
        console.log('\n---------------------------------------------------');
        console.log('Use the following credentials to login:');
        console.log(`Password for ALL accounts: ${defaultPassword}`);
        console.log('---------------------------------------------------');

        console.log('\nTRAINERS:');
        trainersData.forEach(t => console.log(`- ${t.name}: ${t.email}`));

        console.log('\nSTUDENTS:');
        studentsData.forEach(s => console.log(`- ${s.name}: ${s.email}`));
        console.log('---------------------------------------------------');

    } catch (err) {
        console.error('Seeding failed:', err);
    }
};

seedData();
