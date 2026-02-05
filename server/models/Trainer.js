const supabase = require('../config/supabase');

class Trainer {
  static async create(trainerData) {
    const { data, error } = await supabase
      .from('trainers')
      .insert([trainerData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('trainers')
      .select('*, userId(*)') // join user
      .eq('userId', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('trainers')
      .select('*, userId(*)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async find(query = {}) {
    // Basic implementation of find with limited filtering
    let builder = supabase.from('trainers').select('*, userId(id, name, email, profileImage, location)');

    if (query.specialization) {
      builder = builder.ilike('specialization', `%${query.specialization}%`);
    }

    // JSONB filtering (e.g. location.city) is harder in simple query builder without specific syntax
    // Supabase supports .contains('location', { city: 'New York' })
    if (query['location.city']) {
      builder = builder.contains('location', { city: query['location.city'] });
    }

    const { data, error } = await builder;
    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('trainers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = Trainer;