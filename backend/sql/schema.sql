CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  verification_code TEXT,
  verification_expires TIMESTAMP,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS animals (
  id SERIAL PRIMARY KEY,
  numero TEXT,
  brinco TEXT,
  nascimento DATE,
  raca TEXT,
  estado TEXT DEFAULT 'vazia',
  ultima_ia DATE,
  diagnostico_data DATE,
  diagnostico_resultado TEXT,
  previsao_parto DATE,
  parto DATE,
  secagem DATE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS repro_events (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- IA|DIAGNOSTICO|PARTO|SECAGEM
  data DATE NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_events (
  id SERIAL PRIMARY KEY,
  animal_id INTEGER REFERENCES animals(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL, -- OCORRENCIA|TRATAMENTO
  data DATE NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);
