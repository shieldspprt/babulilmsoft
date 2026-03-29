import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('No authorization header provided')
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract the token from Bearer header
    const token = authHeader.replace('Bearer ', '')
    if (!token) {
      console.error('No token in authorization header')
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { userId, roles } = await req.json()
    if (!userId || !Array.isArray(roles)) {
      return new Response(
        JSON.stringify({ error: 'User ID and roles array are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate roles - only admin and user are allowed (single role only)
    const validRoles = ['admin', 'user']
    const invalidRoles = roles.filter(r => !validRoles.includes(r))
    if (invalidRoles.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid roles: ${invalidRoles.join(', ')}. Only admin and user are allowed.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify the user's token using admin client
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if current user has admin role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('User is not an admin:', roleError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent removing own admin role
    if (user.id === userId && !roles.includes('admin')) {
      return new Response(
        JSON.stringify({ error: 'Cannot remove your own admin role' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete existing roles for the user
    console.log(`Updating roles for user ${userId}...`)
    const { error: deleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting existing roles:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to update roles' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert new roles
    if (roles.length > 0) {
      const roleInserts = roles.map(role => ({
        user_id: userId,
        role: role
      }))

      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert(roleInserts)

      if (insertError) {
        console.error('Error inserting new roles:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to assign new roles' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`Successfully updated roles for user ${userId}: ${roles.join(', ')}`)
    return new Response(
      JSON.stringify({ success: true, roles }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
