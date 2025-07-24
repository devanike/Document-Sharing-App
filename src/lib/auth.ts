import { supabase } from "./supabase"

export async function signUpStudent(email: string, password: string, name: string, level: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true, 
      },
    });

    if (error) {
      console.error('Supabase Error sending OTP email:', error);
      throw error;
    }

    console.log(`Supabase has successfully initiated OTP email sending to ${email}.`);

    return {
      message: "A verification code has been sent to your email. Please check your inbox and spam folder.",
      requiresVerification: true 
    }
  } catch (error: any) {
    throw new Error(error.message || "Failed to send verification email. Please try again.");
  }
}

export async function verifyOTPAndCreateUser(
  email: string,
  otp: string,
  password: string,
  name: string,
  level: string,
) {
  // Step 1: Verify the OTP using Supabase's built-in method.
  const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: otp, 
    type: 'email', 
  });

  if (verifyError) {
    console.error('Supabase OTP verification error:', verifyError);
    throw new Error(verifyError.message || "Invalid or expired verification code. Please try again.");
  }

  // Step 2: If OTP is verified, the user is now signed in.
  if (authData.user) {
    const { error: passwordUpdateError } = await supabase.auth.updateUser({
      password: password, 
      data: { 
        name,
        level,
        role: "student", 
      },
    });

    if (passwordUpdateError) {
      console.error('Error setting user password or updating metadata:', passwordUpdateError);
      throw new Error(passwordUpdateError.message || "Failed to finalize account setup. Please contact support.");
    }

    // Step 3: Insert into 'profiles' table.
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id, 
      email: authData.user.email,
      name,
      level,
      role: "student",
    });

    if (profileError) {
      console.error('Custom profile table creation error:', profileError);
    }
  } else {
    throw new Error("User session not found after successful verification. Please try logging in.");
  }

  return authData; 
}

// export async function sendPasswordReset(email: string) {
//   const { error } = await supabase.auth.resetPasswordForEmail(email)

//   if (error) throw error

//   return { message: "Password reset link sent to your email. The link will expire in 1 hour." }
// }

// export async function resetPassword(newPassword: string) {
//   try {
//     // First check if we have a valid session
//     const {
//       data: { session },
//       error: sessionError,
//     } = await supabase.auth.getSession()

//     if (sessionError) {
//       console.error("Session check error:", sessionError)
//       throw new Error("Invalid session. Please request a new password reset.")
//     }

//     if (!session) {
//       throw new Error("No active session. Please request a new password reset.")
//     }

//     console.log("Updating password for user:", session.user.id)

//     const { data, error } = await supabase.auth.updateUser({
//       password: newPassword,
//     })

//     if (error) {
//       console.error("Password update error:", error)
//       if (error.message.includes("expired") || error.message.includes("invalid")) {
//         throw new Error("Your session has expired. Please request a new password reset.")
//       }
//       throw error
//     }

//     console.log("Password updated successfully:", !!data.user)
//     return { message: "Password updated successfully" }
//   } catch (error: any) {
//     console.error("Reset password error:", error)
//     throw new Error(error.message || "Failed to update password")
//   }
// }

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw error;

  return { message: "Password reset link sent to your email. The link will expire in 1 hour." };
}

export async function resetPassword(newPassword: string) {
  try {
    // First check if we have a valid session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session check error:", sessionError);
      throw new Error("Invalid session. Please request a new password reset.");
    }

    if (!session) {
      throw new Error("No active session. Please request a new password reset.");
    }

    console.log("Updating password for user:", session.user.id);

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error("Password update error:", error);
      if (error.message.includes("expired") || error.message.includes("invalid")) {
        throw new Error("Your session has expired. Please request a new password reset.");
      }
      throw error;
    }

    console.log("Password updated successfully:", !!data.user);
    return { message: "Password updated successfully" };
  } catch (error: any) {
    console.error("Reset password error:", error);
    throw new Error(error.message || "Failed to update password");
  }
}