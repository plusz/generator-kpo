-- Create the form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rodzaj_dzialalnosci TEXT NOT NULL,
    pkd_code TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    political_connections BOOLEAN NOT NULL DEFAULT FALSE,
    user_ip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by IP and date
CREATE INDEX IF NOT EXISTS idx_form_submissions_ip_date 
ON form_submissions (user_ip, created_at);

-- Enable Row Level Security (optional, for better security)
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows inserting and reading (adjust as needed)
CREATE POLICY "Allow insert and select" ON form_submissions
    FOR ALL USING (true);
