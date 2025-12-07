import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { decryptToken } from "@/lib/encryption";

export const dynamic = "force-dynamic";

// POST update user role (admin/premium)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: userId } = params;
    const body = await request.json();

    console.log("Updating user role:", userId, body);

    // Check authentication
    const cookieStore = cookies();
    const encryptedAccessToken = cookieStore.get("arkomik-access-token")?.value;

    if (!encryptedAccessToken) {
      console.error("No access token found");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Decrypt the access token
    let accessToken: string;
    try {
      accessToken = decryptToken(encryptedAccessToken);
    } catch (decryptError) {
      console.error("Failed to decrypt token:", decryptError);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Initialize Supabase client for auth check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase credentials");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error - missing database credentials",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Invalid user token:", userError);
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check if current user is admin
    const { data: adminProfile, error: adminError } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();

    if (adminError || !adminProfile?.is_admin) {
      console.error("User is not admin:", adminError);
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
    }

    // Validate required fields
    if (!body.action || !["admin", "premium"].includes(body.action)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid action (admin or premium) is required",
        },
        { status: 400 }
      );
    }

    // Use existing Supabase client from auth check

    // Get current user data to update
    let currentUser = null;
    let fetchError = null;

    try {
      const result = await supabase.from("profiles").select("*").eq("id", userId).single();

      currentUser = result.data;
      fetchError = result.error;
    } catch (e) {
      fetchError = { message: "Failed to query profiles table" };
    }

    if (fetchError) {
      console.error("Error fetching user to update:", fetchError);

      // If profiles table doesn't exist, try to create it first
      if (fetchError.message?.includes("does not exist") || fetchError.code === "PGRST116") {
        console.log("Profiles table missing, attempting to create profile for user...");

        // Create profile entry for this user
        const { data: newProfile, error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            is_admin: false,
            is_premium: false,
            premium_expires_at: null,
          })
          .select()
          .single();

        if (createError) {
          console.error("Failed to create profile:", createError);
          return NextResponse.json(
            {
              success: false,
              error: `User profile not found and could not be created: ${createError.message}`,
              suggestion: "Please ensure profiles table exists with required fields",
            },
            { status: 500 }
          );
        }

        currentUser = newProfile;
        console.log("Created new profile for user:", userId);
      } else {
        return NextResponse.json(
          {
            success: false,
            error: `User not found in profiles: ${fetchError.message}`,
            suggestion: "Please ensure profiles table exists with required fields",
          },
          { status: 404 }
        );
      }
    }

    // Prepare update data with safe defaults
    const updateData: any = {};
    const currentIsAdmin = currentUser.is_admin ?? false;
    const currentIsPremium = currentUser.is_premium ?? false;

    if (body.action === "admin") {
      updateData.is_admin = !currentIsAdmin;
      console.log("Toggling admin status to:", updateData.is_admin);
    } else if (body.action === "premium") {
      updateData.is_premium = !currentIsPremium;

      if (!currentIsPremium) {
        // Adding premium - set expiry date
        const duration = body.duration || 30; // default 30 days
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + duration);
        updateData.premium_expires_at = expiryDate.toISOString();
        console.log(`Adding premium for ${duration} days, expires: ${updateData.premium_expires_at}`);
      } else {
        // Removing premium - clear expiry date
        updateData.premium_expires_at = null;
        console.log("Removing premium access");
      }
    }

    // Update user role
    console.log("Attempting to update user:", userId, "with data:", updateData);

    const { data: updatedUser, error: updateError } = await supabase.from("profiles").update(updateData).eq("id", userId).select().single();

    if (updateError) {
      console.error("Error updating user role:", updateError);
      console.error("Error details:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to update user role: ${updateError.message}`,
          details: updateError.details,
          code: updateError.code,
        },
        { status: 500 }
      );
    }

    console.log("User role updated successfully:", userId, updateData);

    return NextResponse.json({
      success: true,
      message: `User ${body.action} status updated successfully`,
      user: updatedUser,
      action: body.action,
      newStatus: body.action === "admin" ? updatedUser.is_admin : updatedUser.is_premium,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
