const supabase = require('../config/supabase');

class Notification {
  static async create(notificationData) {
    const { data, error } = await supabase
      .from('notifications')
      .insert([notificationData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async find(query = {}) {
    let builder = supabase.from('notifications').select('*');

    if (query.recipient) builder = builder.eq('recipient', query.recipient);
    if (query.isRead !== undefined) builder = builder.eq('isRead', query.isRead);

    // Sort by createdAt desc
    builder = builder.order('createdAt', { ascending: false });

    const { data, error } = await builder;
    if (error) throw error;
    return data;
  }

  static async update(id, updateData) {
    const { data, error } = await supabase
      .from('notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async markAllAsRead(recipientId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ isRead: true })
      .eq('recipient', recipientId);

    if (error) throw error;
    return data;
  }
}

module.exports = Notification;
