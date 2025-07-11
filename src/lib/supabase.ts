// import { createClient } from "@supabase/supabase-js"
// import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"
// import { cookies } from "next/headers"

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// export const createServerClient = () => {
//   const cookieStore = cookies()
//   return createServerComponentClient({ cookies: () => cookieStore })
// }

// export const createBrowserClient = () => createClientComponentClient()

import { createClient } from "@supabase/supabase-js"
import { createClientComponentClient, createServerComponentClient } from "@supabase/auth-helpers-nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// For server-side usage (API routes, server components in app directory)
// export const createServerClient = (cookieStore) => {
//   return createServerComponentClient({ cookies: () => cookieStore })
// }

// For client-side usage
// export const createBrowserClient = () => createClientComponentClient()

// Alternative: Create server client in API routes
// export const createServerClientForAPI = (req) => {
//   return createServerComponentClient({ 
//     cookies: () => req.cookies 
//   })
// }