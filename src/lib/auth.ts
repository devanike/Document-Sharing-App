import { supabase } from "./supabase"
// import { generateOTP, generateTempPassword } from "./utils"

// async function storeOTP(email: string, otp: string) {
//   const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
//   const { error } = await supabase
//     .from("email_verification_otps")
//     .insert({
//       email,
//       otp,
//       expires_at: expiresAt.toISOString(),
//       used: false
//     });

//   if (error) {
//     console.error('Error storing OTP:', error);
//     throw error;
//   }
// }

// export async function signUpStudent(email: string, password: string, name: string, level: string) {
//   try {
//     // Generate OTP
//     const otp = generateOTP();
//     console.log(`Generated OTP for ${email}: ${otp}`);
    
    
//     // Store OTP in database
//     await storeOTP(email, otp);
    
//     // Note: We're not creating the actual user account yet
//     // The user will be created after OTP verification
    
//     return {
//       message: "OTP sent! Please check your email and enter the verification code.",
//       requiresVerification: true
//     }
//   } catch (error: any) {
//     throw new Error(error.message || "Failed to initiate signup")
//   }
// }

export async function signUpStudent(email: string, password: string, name: string, level: string) {
  try {
    // This is the core change: Use Supabase's signInWithOtp to send the OTP email.
    // 'shouldCreateUser: true' is crucial here. It tells Supabase to:
    // 1. Create a new user record in the 'auth.users' table if the email doesn't exist.
    //    This user will be in an 'unconfirmed' or 'pending' state.
    // 2. Generate an OTP and send it to the provided email address.
    // The password is not directly used by signInWithOtp, but it's passed
    // so it can be used later when the user is fully created/profile updated.
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, // IMPORTANT: Creates a new user if they don't exist
        // emailRedirectTo: 'http://localhost:3000/verify-email' // Optional: Redirect after clicking link in email (if using magic link style)
      },
    });

    if (error) {
      console.error('Supabase Error sending OTP email:', error);
      throw error; // Re-throw the error for the frontend to catch
    }

    // Supabase handles the actual email sending. We just get confirmation that the request was successful.
    console.log(`Supabase has successfully initiated OTP email sending to ${email}.`);

    return {
      message: "A verification code has been sent to your email. Please check your inbox and spam folder.",
      requiresVerification: true // Indicate that the next step is OTP verification
    }
  } catch (error: any) {
    // Provide a more user-friendly error message for the user
    throw new Error(error.message || "Failed to send verification email. Please try again.");
  }
}

// export async function verifyOTPAndCreateUser(
//   email: string,
//   otp: string,
//   password: string,
//   name: string,
//   level: string,
// ) {
//   // Verify OTP
//   const { data: otpData, error: otpError } = await supabase
//     .from("email_verification_otps")
//     .select("*")
//     .eq("email", email)
//     .eq("otp", otp)
//     .eq("used", false)
//     .gt("expires_at", new Date().toISOString())
//     .single()

//   if (otpError || !otpData) {
//     throw new Error("Invalid or expired OTP")
//   }

//   console.log(`OTP verified successfully for ${email}`);

//   // Create user
//   const { data: authData, error: authError } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         name,
//         level,
//         role: "student",
//       },
//     },
//   })

//   if (authError) throw authError

//   // Mark OTP as used
//   await supabase.from("email_verification_otps").update({ used: true }).eq("id", otpData.id)

//   // Create profile
//   if (authData.user) {
//     const { error: profileError } = await supabase.from("profiles").insert({
//       id: authData.user.id,
//       email,
//       name,
//       level,
//       role: "student",
//     })

//     if (profileError) {
//       console.error('Profile creation error:', profileError)
//       // Don't throw error here - user is created, profile can be created later
//     }
//   }

//   return authData
// }

export async function verifyOTPAndCreateUser(
  email: string,
  otp: string,
  password: string, // This password will be set for the user's account
  name: string,
  level: string,
) {
  // Step 1: Verify the OTP using Supabase's built-in method.
  // If successful, the user's email will be confirmed, and they will be signed in.
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp, // The OTP entered by the user
    type: 'email', // Specify that this is an email OTP verification
  });

  if (verifyError) {
    console.error('Supabase OTP verification error:', verifyError);
    throw new Error(verifyError.message || "Invalid or expired verification code. Please try again.");
  }

  // Step 2: If OTP is verified, the user is now signed in.
  // Now, set the user's password and update their metadata.
  if (authData.user) {
    // Set the user's password. This is crucial for subsequent logins.
    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password: password, // Set the password provided during signup
      data: { // Update additional user metadata directly in Supabase Auth
        name,
        level,
        role: "student", // Assign the role here
      },
    });

    if (passwordUpdateError) {
      console.error('Error setting user password or updating metadata:', passwordUpdateError);
      // This is a critical error, as the user might not be able to log in later.
      throw new Error(passwordUpdateError.message || "Failed to finalize account setup. Please contact support.");
    }

    // Step 3: Insert into your custom 'profiles' table (if you have one for additional data).
    // This is separate from Supabase Auth's user metadata.
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id, // Link to the Supabase Auth user ID
      email: authData.user.email,
      name,
      level,
      role: "student",
    });

    if (profileError) {
      console.error('Custom profile table creation error:', profileError);
      // Log this, but don't prevent the user from being created in auth,
      // as the primary authentication is already handled.
    }
  } else {
    // This case should ideally not happen if verifyOtp was successful,
    // but it's a good safeguard.
    throw new Error("User session not found after successful verification. Please try logging in.");
  }

  return authData; // Return the authentication data (includes user, session)
}

// export async function sendPasswordReset(email: string) {
//   const tempPassword = generateTempPassword()
//   const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

//   // Store temp password
//   const { error } = await supabase.from("password_resets").insert({
//     email,
//     temp_password: tempPassword,
//     expires_at: expiresAt.toISOString(),
//   })

//   if (error) throw error

//   // Send email (mock implementation)
//   console.log(`Temporary password for ${email}: ${tempPassword}`)

//   return { message: "Temporary password sent to your email" }
// }

export async function sendPasswordReset(email: string) {
  // Use Supabase's native password reset functionality
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    // Optional: Specify a redirect URL after the user clicks the reset link in the email.
    // redirectTo: 'http://localhost:3000/update-password'
  });

  if (error) {
    console.error('Error sending password reset email via Supabase:', error);
    throw error;
  }

  return { message: "Password reset link sent to your email. Please check your inbox and spam folder." };
}

