-- Add email verification fields to clientes table
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS token_verificacion VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verificado BOOLEAN DEFAULT FALSE;

-- Add index for token verification lookup
CREATE INDEX IF NOT EXISTS idx_clientes_token_verificacion ON clientes(token_verificacion);
CREATE INDEX IF NOT EXISTS idx_clientes_email_verificado ON clientes(email_verificado); 