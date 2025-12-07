import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

// POST create/update profiles table schema
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        error: 'Supabase credentials not configured'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // SQL to create/update profiles table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID REFERENCES auth.users(id) PRIMARY KEY,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        username TEXT UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        website TEXT,
        is_admin BOOLEAN DEFAULT FALSE,
        is_premium BOOLEAN DEFAULT FALSE,
        premium_expires_at TIMESTAMP WITH TIME ZONE
      );

      -- Add missing columns if they don't exist
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
          ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_premium') THEN
          ALTER TABLE profiles ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'premium_expires_at') THEN
          ALTER TABLE profiles ADD COLUMN premium_expires_at TIMESTAMP WITH TIME ZONE;
        END IF;
      END $$;

      -- Create trigger for new user signup
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, avatar_url, is_admin, is_premium)
        VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', false, false);
        RETURN new;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    // Execute the SQL using raw query
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL })

    if (error) {
      console.error('Error creating profiles table:', error)
      
      // Try alternative approach - check if table exists and add columns individually
      try {
        // Check if we can access the table
        const { data: checkData, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .limit(1)

        if (checkError) {
          return NextResponse.json({
            success: false,
            error: `Profiles table doesn't exist and cannot be created: ${checkError.message}`,
            suggestion: 'Please create profiles table manually in Supabase dashboard'
          }, { status: 500 })
        }

        // Table exists, try to add missing columns
        const updates = []
        
        // Try adding is_admin column
        try {
          await supabase.rpc('add_column_if_not_exists', { 
            table_name: 'profiles', 
            column_name: 'is_admin', 
            column_type: 'BOOLEAN DEFAULT FALSE' 
          })
          updates.push('is_admin column added')
        } catch (e) {
          updates.push('is_admin column already exists or failed to add')
        }

        // Try adding is_premium column
        try {
          await supabase.rpc('add_column_if_not_exists', { 
            table_name: 'profiles', 
            column_name: 'is_premium', 
            column_type: 'BOOLEAN DEFAULT FALSE' 
          })
          updates.push('is_premium column added')
        } catch (e) {
          updates.push('is_premium column already exists or failed to add')
        }

        // Try adding premium_expires_at column
        try {
          await supabase.rpc('add_column_if_not_exists', { 
            table_name: 'profiles', 
            column_name: 'premium_expires_at', 
            column_type: 'TIMESTAMP WITH TIME ZONE' 
          })
          updates.push('premium_expires_at column added')
        } catch (e) {
          updates.push('premium_expires_at column already exists or failed to add')
        }

        return NextResponse.json({
          success: true,
          message: 'Profiles table updated with manual column additions',
          updates: updates
        })

      } catch (fallbackError) {
        return NextResponse.json({
          success: false,
          error: `Failed to setup profiles table: ${error.message}`,
          fallbackError: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
          suggestion: 'Please manually create profiles table with required fields in Supabase dashboard'
        }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profiles table created/updated successfully',
      data: data
    })

  } catch (error) {
    console.error('Error setting up profiles table:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
