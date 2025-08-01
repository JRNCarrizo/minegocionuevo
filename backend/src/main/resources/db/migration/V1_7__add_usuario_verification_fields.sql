-- Add email verification fields to usuarios table
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Add index for token verification lookup
CREATE INDEX IF NOT EXISTS idx_usuarios_token_verificacion ON usuarios(token_verificacion);
CREATE INDEX IF NOT EXISTS idx_usuarios_email_verificado ON usuarios(email_verificado); 