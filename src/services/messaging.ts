import { supabase } from '../lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type Conversation = {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  worker_id: string | null;
  last_message_at: string | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_type: string | null;
  content: string | null;
  media_url: string | null;
  metadata: any;
  is_read: boolean | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AdminConversation = {
  id: string;
  worker_id: string;
  admin_id: string | null;
  subject: string | null;
  category: 'general' | 'support' | 'payment' | 'booking' | 'other';
  status: 'open' | 'closed' | 'pending';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  last_message_at: string | null;
  last_message_preview: string | null;
  worker_unread_count: number;
  admin_unread_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
};

export type AdminMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: 'worker' | 'admin';
  message_type: 'text' | 'image' | 'file' | 'system';
  content: string | null;
  media_url: string | null;
  file_name: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

class MessagingService {
  async getAdminUserId(): Promise<string> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      throw new Error('No admin user found');
    }
    return data.id as string;
  }

  async getWorkerProfileIdFromUserId(workerUserId: string): Promise<string> {
    const { data, error } = await supabase
      .from('worker_profiles')
      .select('id')
      .eq('user_id', workerUserId)
      .maybeSingle();

    if (error) throw error;
    if (!data?.id) {
      throw new Error('Worker profile not found for this user');
    }
    return data.id as string;
  }

  async getOrCreateAdminConversation(workerUserId: string): Promise<AdminConversation> {
    // Map worker user id -> worker profile id used in admin_conversations.worker_id
    const workerProfileId = await this.getWorkerProfileIdFromUserId(workerUserId);

    const { data: existing, error: findErr } = await supabase
      .from('admin_conversations')
      .select('*')
      .eq('worker_id', workerProfileId)
      .neq('status', 'closed')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;
    if (existing) return existing as AdminConversation;

    // Best-effort: assign any admin if available (may be blocked by RLS)
    let adminId: string | null = null;
    try {
      adminId = await this.getAdminUserId();
    } catch {
      adminId = null;
    }

    const { data: created, error: createErr } = await supabase
      .from('admin_conversations')
      .insert({
        worker_id: workerProfileId,
        admin_id: adminId,
        status: 'open',
        category: 'general',
        priority: 'normal',
      })
      .select('*')
      .single();

    if (createErr) throw createErr;
    return created as AdminConversation;
  }

  async listMessages(conversationId: string, limit: number = 100): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as Message[];
  }

  async listAdminMessages(conversationId: string, limit: number = 100): Promise<AdminMessage[]> {
    const { data, error } = await supabase
      .from('admin_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data || []) as AdminMessage[];
  }

  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Message is empty');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: trimmed,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Best-effort update last_message_at
    void (async () => {
      try {
        await supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', conversationId);
      } catch {
        // noop
      }
    })();

    return data as Message;
  }

  async sendAdminMessageAsWorker(
    conversationId: string,
    workerUserId: string,
    content: string
  ): Promise<AdminMessage> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Message is empty');

    const { data, error } = await supabase
      .from('admin_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: workerUserId,
        sender_role: 'worker',
        message_type: 'text',
        content: trimmed,
      })
      .select('*')
      .single();

    if (error) throw error;

    void (async () => {
      try {
        await supabase
          .from('admin_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: trimmed,
          })
          .eq('id', conversationId);
      } catch {
        // noop
      }
    })();

    return data as AdminMessage;
  }

  async sendAdminMessageAsAdmin(
    conversationId: string,
    adminUserId: string,
    content: string
  ): Promise<AdminMessage> {
    const trimmed = content.trim();
    if (!trimmed) throw new Error('Message is empty');

    const { data, error } = await supabase
      .from('admin_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: adminUserId,
        sender_role: 'admin',
        message_type: 'text',
        content: trimmed,
      })
      .select('*')
      .single();

    if (error) throw error;

    void (async () => {
      try {
        await supabase
          .from('admin_conversations')
          .update({
            last_message_at: new Date().toISOString(),
            last_message_preview: trimmed,
          })
          .eq('id', conversationId);
      } catch {
        // noop
      }
    })();

    return data as AdminMessage;
  }

  subscribeToConversationMessages(
    conversationId: string,
    onMessage: (msg: Message) => void,
    onStatus?: (status: string) => void
  ): () => void {
    const channel: RealtimeChannel = supabase
      .channel(`conversation-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe((status) => {
        if (onStatus) {
          onStatus(status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  subscribeToAdminConversationMessages(
    conversationId: string,
    onMessage: (msg: AdminMessage) => void,
    onStatus?: (status: string) => void
  ): () => void {
    const channel: RealtimeChannel = supabase
      .channel(`admin-conversation-messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          onMessage(payload.new as AdminMessage);
        }
      )
      .subscribe((status) => {
        if (onStatus) {
          onStatus(status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const messagingService = new MessagingService();
