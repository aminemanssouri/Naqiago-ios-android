import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface AuthUser {
  id: string;
  email: string;
  profile?: Profile;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: 'customer' | 'worker';
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  // Ensure profile row exists and is synced with auth metadata
  private async syncProfileFromAuthUser(user: any, existing?: Profile) {
    if (!user?.id) return existing;

    const desired: ProfileUpdate = {
      email: user.email || existing?.email || '',
      full_name:
        user.user_metadata?.full_name ||
        existing?.full_name ||
        (user.email ? String(user.email).split('@')[0] : 'User'),
      phone: user.user_metadata?.phone ?? existing?.phone ?? null,
      role: (user.user_metadata?.role as Profile['role']) || existing?.role || 'customer',
      updated_at: new Date().toISOString(),
    } as ProfileUpdate;

    // If the DB row exists but is missing fields, or if it doesn't exist at all,
    // upsert to guarantee profile has required data.
    const needsSync =
      !existing ||
      (!existing.phone && desired.phone) ||
      (!existing.full_name && desired.full_name) ||
      (!existing.email && desired.email) ||
      (!existing.role && desired.role);

    if (!needsSync) return existing;

    const payload: ProfileInsert = {
      id: user.id,
      email: desired.email as any,
      full_name: desired.full_name as any,
      phone: desired.phone as any,
      role: desired.role as any,
    } as ProfileInsert;

    try {
      const { data: upserted, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) {
        console.error('Sync profile error:', error);
        return existing;
      }
      return upserted as Profile;
    } catch (e) {
      console.error('Sync profile exception:', e);
      return existing;
    }
  }

  // Sign up new user
  async signUp({ email, password, fullName, phone, role = 'customer' }: SignUpData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Supabase may return a user object even when the email already exists
      // In that case, user.identities can be an empty array. Treat this as duplicate email.
      const identities = (authData.user as any)?.identities as any[] | undefined;
      if (Array.isArray(identities) && identities.length === 0) {
        throw Object.assign(new Error('This email is already registered. Please sign in or use a different email.'), {
          code: 'user_already_exists',
          status: 409,
        });
      }

      // If email confirmation is enabled, there may be NO session after signUp.
      // In that case, client-side upsert will run as anon and be blocked by RLS.
      // Only attempt upsert if we have a session; otherwise rely on a DB trigger.
      if (authData.session) {
        const userId = authData.user.id;
        const profilePayload: ProfileInsert = {
          id: userId,
          email,
          full_name: fullName,
          phone,
          role,
        } as ProfileInsert;

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' });
        if (profileError) {
          console.error('Create profile error (with session):', profileError);
        }
      } else {
        console.log('No session after signUp; skipping client upsert and relying on DB trigger to create profile.');
      }

      return { user: authData.user, session: authData.session };
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  }

  // Sign in existing user
  async signIn({ email, password }: SignInData) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Handle auth errors
      if (userError) {
        // Auth session missing is expected when not logged in
        if (userError.message?.includes('Auth session missing')) {
          return null;
        }
        // Handle refresh token errors
        if (userError.message?.includes('Refresh Token') || userError.message?.includes('refresh_token')) {
          console.log('🔄 Invalid refresh token, clearing session');
          await supabase.auth.signOut();
          return null;
        }
        throw userError;
      }
      
      if (!user) return null;

      // Get user profile with timeout
      let profile: Profile | undefined;
      try {
        const profilePromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile fetch timeout')), 3000);
        });

        const { data: profileData, error: profileError } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as any;

        if (profileError && !profileError.message?.includes('timeout')) {
          console.error('Profile fetch error:', profileError);
        } else {
          profile = profileData as Profile;
        }
      } catch (profileError) {
        console.log('Profile fetch failed or timed out, using minimal profile');
      }

      // Important: if a profile row exists but was created without phone/full_name
      // (common when signUp returns no session and a DB trigger creates an incomplete row),
      // sync missing fields from auth metadata now that we have a session.
      profile = await this.syncProfileFromAuthUser(user, profile);

      // If profile is missing (e.g., legacy user), create a minimal one
      let ensuredProfile = profile;
      if (!ensuredProfile) {
        const minimal: ProfileInsert = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'User'),
          phone: user.user_metadata?.phone || null,
          role: (user.user_metadata?.role as Profile['role']) || 'customer',
        } as ProfileInsert;
        
        try {
          const { data: created, error: createErr } = await supabase
            .from('profiles')
            .upsert(minimal, { onConflict: 'id' })
            .select('*')
            .single();
          if (createErr) {
            console.error('Ensure profile error:', createErr);
          } else {
            ensuredProfile = created as Profile;
          }
        } catch (createError) {
          console.log('Profile creation failed, using minimal profile');
          // Use the minimal profile even if creation fails
          ensuredProfile = minimal as Profile;
        }
      }

      return {
        id: user.id,
        email: user.email!,
        profile: ensuredProfile || undefined,
      };
    } catch (error: any) {
      // Don't log expected "no session" errors
      if (!error?.message?.includes('Auth session missing') && 
          !error?.message?.includes('Refresh Token')) {
        console.error('Get current user error:', error);
      }
      return null;
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: ProfileUpdate) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  // Reset password
  async resetPassword(email: string) {
    try {
      // Force direct deep link instead of web URL
      const redirectTo = 'naqiago://reset-password';
      console.log('🔗 Using redirect URL:', redirectTo);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, { 
        redirectTo,
      });

      if (error) throw error;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // Update password after user opens the recovery magic link (session is established)
  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  }

  // Refresh the current session
  async refreshSession() {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Refresh session error:', error);
      throw error;
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('🔔 Supabase auth state change:', event, session ? 'session present' : 'no session');
      
      if (session?.user) {
        try {
          // Add timeout to prevent hanging
          const timeoutPromise = new Promise<AuthUser | null>((_, reject) => {
            setTimeout(() => reject(new Error('getCurrentUser timeout')), 5000);
          });
          
          const userPromise = this.getCurrentUser();
          const user = await Promise.race([userPromise, timeoutPromise]);
          
          console.log('🔔 Auth state change - user loaded:', user ? 'success' : 'null');
          callback(user);
        } catch (error) {
          console.error('🔔 Auth state change - getCurrentUser failed:', error);
          // If getCurrentUser fails, create a minimal user object to prevent hanging.
          // Populate phone from user_metadata if available for the booking flow.
          const userMetadata = (session.user as any)?.user_metadata ?? {};
          const phone =
            typeof userMetadata.phone === 'string' ? userMetadata.phone : null;
          const minimalUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || '',
            profile: { phone } as any,
          };
          callback(minimalUser);
        }
      } else {
        console.log('🔔 Auth state change - no session, setting user to null');
        callback(null);
      }
    });
  }
}

export const authService = new AuthService();
