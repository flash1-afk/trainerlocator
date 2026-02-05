const supabase = require('../config/supabase');

class Booking {
  static async create(bookingData) {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('bookings')
      .select('*, userId(name, email), trainerId(name, email)')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async find(query = {}) {
    let builder = supabase.from('bookings').select('*, userId(name), trainerId(name)');

    if (query.userId) builder = builder.eq('userId', query.userId);
    if (query.trainerId) builder = builder.eq('trainerId', query.trainerId);
    if (query.status) builder = builder.eq('status', query.status);

    const { data, error } = await builder;
    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

module.exports = Booking;