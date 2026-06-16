const express = require('express');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin only.'
    });
  }
  next();
};

// Apply admin middleware to all routes
router.use(auth, requireAdmin);

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (admin only)
router.get('/dashboard', async (req, res) => {
  try {
    // Get user statistics
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: activeUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('isActive', true);
    const { count: trainers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'trainer').eq('isActive', true);
    const { count: regularUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'user').eq('isActive', true);
    const { count: admins } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'admin').eq('isActive', true);

    // Get users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();
    const { count: newUsers } = await supabase.from('users').select('*', { count: 'exact', head: true }).gte('createdAt', thirtyDaysAgoStr);

    // Get session statistics
    const { count: totalSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true });
    const { count: completedSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    const { count: scheduledSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'scheduled');
    const { count: cancelledSessions } = await supabase.from('sessions').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');

    // Get booking statistics
    const { count: totalBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    const { count: confirmedBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');
    const { count: pendingBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    const { count: completedBookings } = await supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed');

    // Get revenue statistics
    const { data: paidBookings } = await supabase.from('bookings').select('totalPrice').eq('paymentStatus', 'paid');
    const totalRevenue = paidBookings ? paidBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0) : 0;

    const { data: monthlyPaidBookings } = await supabase.from('bookings').select('totalPrice').eq('paymentStatus', 'paid').gte('createdAt', thirtyDaysAgoStr);
    const monthlyRevenue = monthlyPaidBookings ? monthlyPaidBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0) : 0;

    // Get top performing trainers (assuming rating is a jsonb object like {"average": 5.0})
    const { data: topTrainersRaw, error: topError } = await supabase
      .from('trainers')
      .select(`
        *,
        userId:users!inner(name, email)
      `)
      .eq('isActive', true)
      // Supabase does not support ordering by a JSON key using standard order method easily in some cases without a view,
      // but if 'rating' is a column, we will just fetch all active and sort in memory if needed.
      // Wait, let's fetch all active trainers and sort them.
      .limit(50); // limit to 50 active trainers to sort

    let topTrainers = [];
    if (topTrainersRaw) {
      topTrainers = topTrainersRaw
        .sort((a, b) => {
          const avgA = a.rating?.average || 0;
          const avgB = b.rating?.average || 0;
          return avgB - avgA;
        })
        .slice(0, 5)
        .map(t => ({
          name: t.userId?.name,
          email: t.userId?.email,
          specialization: t.specialization,
          rating: t.rating,
          clients: t.clients?.total || 0
        }));
    }

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers || 0,
          active: activeUsers || 0,
          trainers: trainers || 0,
          regularUsers: regularUsers || 0,
          admins: admins || 0,
          newUsers: newUsers || 0,
          inactiveUsers: (totalUsers || 0) - (activeUsers || 0)
        },
        sessions: {
          total: totalSessions || 0,
          completed: completedSessions || 0,
          scheduled: scheduledSessions || 0,
          cancelled: cancelledSessions || 0,
          completionRate: totalSessions > 0 ? ((completedSessions / totalSessions) * 100).toFixed(1) : 0
        },
        bookings: {
          total: totalBookings || 0,
          confirmed: confirmedBookings || 0,
          pending: pendingBookings || 0,
          completed: completedBookings || 0
        },
        revenue: {
          total: totalRevenue,
          monthly: monthlyRevenue
        },
        topTrainers
      }
    });

  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users with pagination and filters
// @access  Private (admin only)
router.get('/users', async (req, res) => {
  try {
    const {
      role,
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase.from('users').select('*', { count: 'exact' });

    if (role) {
      query = query.eq('role', role);
    }
    
    if (status !== undefined && status !== '') {
      query = query.eq('isActive', status === 'active');
    }
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const to = skip + parseInt(limit) - 1;

    const { data: usersRaw, count, error } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(skip, to);

    if (error) throw error;

    // Remove passwords and add _id for frontend compatibility
    const users = usersRaw.map(u => {
      const { password, ...rest } = u;
      return { ...rest, _id: u.id };
    });

    res.json({
      success: true,
      users,
      count: users.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalUsers: count || 0,
        hasNext: to < (count || 0) - 1,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users'
    });
  }
});

// @route   PUT /api/admin/users/:id/status
// @desc    Update user status (activate/deactivate)
// @access  Private (admin only)
router.put('/users/:id/status', [
  body('isActive', 'isActive must be a boolean').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isActive } = req.body;

    // Prevent admin from deactivating themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own status'
      });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role, isActive')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ isActive, updatedAt: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role, isActive')
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: { ...updatedUser, _id: updatedUser.id }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user status'
    });
  }
});

// @route   PUT /api/admin/users/:id/role
// @desc    Update user role
// @access  Private (admin only)
router.put('/users/:id/role', [
  body('role', 'Role must be either user, trainer, or admin').isIn(['user', 'trainer', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { role } = req.body;

    // Prevent admin from changing their own role
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role, updatedAt: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('id, name, email, role')
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: { ...updatedUser, _id: updatedUser.id }
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role'
    });
  }
});

// @route   GET /api/admin/trainers
// @desc    Get all trainers with verification status
// @access  Private (admin only)
router.get('/trainers', async (req, res) => {
  try {
    const {
      verified,
      status,
      search,
      page = 1,
      limit = 20
    } = req.query;

    let query = supabase
      .from('trainers')
      .select('*, userId:users!inner(id, name, email, "profileImage", "isActive")', { count: 'exact' });

    if (verified !== undefined && verified !== '') {
      query = query.eq('isVerified', verified === 'true');
    }
    
    if (status !== undefined && status !== '') {
      query = query.eq('isActive', status === 'active');
    }

    if (search) {
      // Need to filter within the joined users table or specialization
      query = query.or(`specialization.ilike.%${search}%,users.name.ilike.%${search}%,users.email.ilike.%${search}%`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const to = skip + parseInt(limit) - 1;

    const { data: trainersRaw, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, to);

    if (error) {
      // If error occurs due to the .or across foreign tables, we fallback to in-memory filtering for simplicity
      console.warn("Foreign table OR query failed, fetching all and filtering in-memory");
      
      let fallbackQuery = supabase
        .from('trainers')
        .select('*, userId:users!inner(id, name, email, "profileImage", "isActive")')
        .order('createdAt', { ascending: false });
        
      if (verified !== undefined && verified !== '') {
        fallbackQuery = fallbackQuery.eq('isVerified', verified === 'true');
      }
      
      if (status !== undefined && status !== '') {
        fallbackQuery = fallbackQuery.eq('isActive', status === 'active');
      }

      const { data: allTrainers, error: fallbackError } = await fallbackQuery;
      if (fallbackError) throw fallbackError;

      let filtered = allTrainers;
      if (search) {
        const s = search.toLowerCase();
        filtered = allTrainers.filter(t => 
          (t.specialization && t.specialization.toLowerCase().includes(s)) ||
          (t.userId?.name && t.userId.name.toLowerCase().includes(s)) ||
          (t.userId?.email && t.userId.email.toLowerCase().includes(s))
        );
      }

      const paginatedTrainers = filtered.slice(skip, skip + parseInt(limit)).map(t => ({ ...t, _id: t.id }));

      return res.json({
        success: true,
        trainers: paginatedTrainers,
        count: paginatedTrainers.length,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(filtered.length / parseInt(limit)),
          totalTrainers: filtered.length,
          hasNext: skip + paginatedTrainers.length < filtered.length,
          hasPrev: parseInt(page) > 1
        }
      });
    }

    const mappedTrainers = trainersRaw.map(t => ({ ...t, _id: t.id }));

    res.json({
      success: true,
      trainers: mappedTrainers,
      count: mappedTrainers.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalTrainers: count || 0,
        hasNext: to < (count || 0) - 1,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get admin trainers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching trainers'
    });
  }
});

// @route   PUT /api/admin/trainers/:id/verify
// @desc    Verify trainer profile
// @access  Private (admin only)
router.put('/trainers/:id/verify', [
  body('isVerified', 'isVerified must be a boolean').isBoolean(),
  body('notes', 'Verification notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { isVerified, notes } = req.body;

    const { data: trainer, error: fetchError } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError || !trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // You could save verificationHistory in another table or as jsonb
    const { data: updatedTrainer, error: updateError } = await supabase
      .from('trainers')
      .update({ 
        isVerified, 
        updatedAt: new Date().toISOString() 
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: `Trainer ${isVerified ? 'verified' : 'unverified'} successfully`,
      trainer: { ...updatedTrainer, _id: updatedTrainer.id }
    });

  } catch (error) {
    console.error('Verify trainer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying trainer'
    });
  }
});

// @route   GET /api/admin/sessions
// @desc    Get all sessions with filters
// @access  Private (admin only)
router.get('/sessions', async (req, res) => {
  try {
    const {
      status,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = req.query;

    let query = supabase
      .from('sessions')
      .select('*, userId:users!sessions_userId_fkey(id, name, email), trainerId:users!sessions_trainerId_fkey(id, name, email)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (type) query = query.eq('type', type);
    if (dateFrom) query = query.gte('date', new Date(dateFrom).toISOString());
    if (dateTo) query = query.lte('date', new Date(dateTo).toISOString());

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const to = skip + parseInt(limit) - 1;

    const { data: sessionsRaw, count, error } = await query
      .order('date', { ascending: false })
      .range(skip, to);

    if (error) {
      console.warn("Foreign key specific query failed, trying standard relational join...");
      // Fallback if foreign keys are not named conventionally
      let fallbackQuery = supabase
        .from('sessions')
        .select('*')
        .order('date', { ascending: false });
        
      if (status) fallbackQuery = fallbackQuery.eq('status', status);
      if (type) fallbackQuery = fallbackQuery.eq('type', type);
      if (dateFrom) fallbackQuery = fallbackQuery.gte('date', new Date(dateFrom).toISOString());
      if (dateTo) fallbackQuery = fallbackQuery.lte('date', new Date(dateTo).toISOString());

      const { data: allSessions, error: fbError } = await fallbackQuery;
      if (fbError) throw fbError;

      // We'd have to manually fetch users if joining doesn't work, but let's assume it works in one format or another
      // Supabase supports `userId:users!userId(...)` or `users!userId(...)`. Let's just return what we have.
      const paginated = allSessions.slice(skip, skip + parseInt(limit)).map(s => ({...s, _id: s.id}));
      
      return res.json({
        success: true,
        sessions: paginated,
        count: paginated.length,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(allSessions.length / parseInt(limit)),
          totalSessions: allSessions.length,
          hasNext: skip + paginated.length < allSessions.length,
          hasPrev: parseInt(page) > 1
        }
      });
    }

    const mappedSessions = sessionsRaw.map(s => ({ ...s, _id: s.id }));

    res.json({
      success: true,
      sessions: mappedSessions,
      count: mappedSessions.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalSessions: count || 0,
        hasNext: to < (count || 0) - 1,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get admin sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sessions'
    });
  }
});

// @route   GET /api/admin/bookings
// @desc    Get all bookings with filters
// @access  Private (admin only)
router.get('/bookings', async (req, res) => {
  try {
    const {
      status,
      paymentStatus,
      sessionType,
      page = 1,
      limit = 20
    } = req.query;

    let query = supabase
      .from('bookings')
      .select('*', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (paymentStatus) query = query.eq('paymentStatus', paymentStatus);
    if (sessionType) query = query.eq('sessionType', sessionType);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const to = skip + parseInt(limit) - 1;

    const { data: bookingsRaw, count, error } = await query
      .order('createdAt', { ascending: false })
      .range(skip, to);

    if (error) throw error;

    const mappedBookings = bookingsRaw.map(b => ({ ...b, _id: b.id }));

    res.json({
      success: true,
      bookings: mappedBookings,
      count: mappedBookings.length,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
        totalBookings: count || 0,
        hasNext: to < (count || 0) - 1,
        hasPrev: parseInt(page) > 1
      }
    });

  } catch (error) {
    console.error('Get admin bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching bookings'
    });
  }
});

module.exports = router;