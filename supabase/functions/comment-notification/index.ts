import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Hardcoded EmailJS configuration
const EMAILJS_CONFIG = {
  service_id: 'service_csgl6se', // Replace with your actual service ID
  template_id: 'template_wa93zkh', // Replace with your actual template ID
  user_id: 'Tcn6lWQV3bIpjlonp', // Replace with your actual user ID
  to_email: 'sofaspartan.music@gmail.com' // Your email address
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Edge Function started')
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the request payload
    const { record, type } = await req.json()
    console.log('Received request:', { type, record })

    // Only process new comments
    if (type !== 'INSERT') {
      console.log('Not a new comment, skipping')
      return new Response(JSON.stringify({ message: 'Not a new comment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Get the comment details
    const { content, user_id, parent_id } = record
    console.log('Processing comment:', { content, user_id, parent_id })

    // Get the user's email
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('id', user_id)
      .single()

    if (userError) {
      console.error('Error getting user email:', userError)
      throw userError
    }

    console.log('User email:', userData.email)

    // Send email notification using EmailJS
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: EMAILJS_CONFIG.service_id,
        template_id: EMAILJS_CONFIG.template_id,
        user_id: EMAILJS_CONFIG.user_id,
        template_params: {
          to_email: EMAILJS_CONFIG.to_email,
          from_email: userData.email,
          comment_content: content,
          comment_url: `https://sofaspartan.com/comments#${record.id}`,
          is_reply: parent_id ? 'true' : 'false'
        }
      })
    })

    const responseData = await response.text()
    console.log('EmailJS response:', responseData)

    if (!response.ok) {
      console.error('EmailJS error:', responseData)
      throw new Error(`Failed to send email: ${responseData}`)
    }

    console.log('Email sent successfully')
    return new Response(JSON.stringify({ message: 'Notification sent successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error in Edge Function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
}) 