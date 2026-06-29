const supabase = require('../config/supabase');

class Session {
  static async create(sessionData) {
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*, userId(id, name, email), trainerId(id, name, email)')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async find(query = {}) {
    let builder = supabase.from('sessions').select('*, userId(id, name), trainerId(id, name)');

    if (query.userId) builder = builder.eq('userId', query.userId);
    if (query.trainerId) builder = builder.eq('trainerId', query.trainerId);
    if (query.status) builder = builder.eq('status', query.status);

    const { data, error } = await builder;
    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = Session;