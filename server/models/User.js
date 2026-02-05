const supabase = require('../config/supabase');

class User {
  static async findOne(query) {
    // Basic support for findOne({ email: ... })
    // Query builder could be complex, but for now we handle specific cases used in app
    let builder = supabase.from('users').select('*');

    if (query.email) {
      builder = builder.eq('email', query.email);
    }

    if (query._id || query.id) {
      builder = builder.eq('id', query._id || query.id);
    }

    // Add other fields as needed
    for (const key in query) {
      if (key !== 'email' && key !== '_id' && key !== 'id') {
        builder = builder.eq(key, query[key]);
      }
    }

    const { data, error } = await builder.single();
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async create(userData) {
    // Map Mongoose-style data to Supabase columns if needed
    // Assuming userData keys match columns
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Helper to standardise the "user.save()" pattern if we wanted to keep "instances"
  // But purely functional static methods are cleaner for the migration.
}

module.exports = User;