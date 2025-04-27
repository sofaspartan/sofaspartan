-- Create storage bucket for email assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'email-assets',
    'email-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
CREATE POLICY "Email assets are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'email-assets');

CREATE POLICY "Service role can upload email assets"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'email-assets' AND
        auth.role() = 'service_role'
    );

CREATE POLICY "Service role can update email assets"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'email-assets' AND
        auth.role() = 'service_role'
    );

CREATE POLICY "Service role can delete email assets"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'email-assets' AND
        auth.role() = 'service_role'
    ); 