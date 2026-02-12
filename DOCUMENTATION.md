
# WestSoldas Pro - Guia de Configuração Supabase (Versão Final)

Para garantir que o sistema salve os dados corretamente, utilize este script SQL exato.

## 1. Novo Script SQL (Compatível)
Acesse o **SQL Editor** no Supabase e execute:

```sql
-- Remover tabelas antigas se existirem para evitar conflitos de tipo
DROP TABLE IF EXISTS service_orders;
DROP TABLE IF EXISTS quotes;
DROP TABLE IF EXISTS machines;
DROP TABLE IF EXISTS clients;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS system_config;

-- 1. TABELA DE PERFIS (IDs como TEXT para aceitar os gerados pelo JS)
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  reset_token TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir usuário admin inicial (ID fixo para o primeiro acesso)
INSERT INTO profiles (id, name, email, password, role, active)
VALUES ('admin-001', 'Admin Master', 'admin@oficina.com', 'admin', 'ADMIN', true);

-- 2. TABELA DE CLIENTES
CREATE TABLE clients (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  document TEXT UNIQUE NOT NULL,
  trade_name TEXT,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. TABELA DE MÁQUINAS
CREATE TABLE machines (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT,
  brand TEXT,
  model TEXT,
  serial_number TEXT,
  voltage TEXT,
  accessories TEXT,
  visual_condition TEXT,
  tech_notes TEXT
);

-- 4. TABELA DE ORÇAMENTOS
CREATE TABLE quotes (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  problem_description TEXT,
  preliminary_diagnosis TEXT,
  services JSONB DEFAULT '[]'::jsonb,
  parts_price DECIMAL DEFAULT 0,
  total_price DECIMAL DEFAULT 0,
  estimated_days INTEGER DEFAULT 3,
  status TEXT DEFAULT 'Em análise',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  notes TEXT
);

-- 5. TABELA DE ORDENS DE SERVIÇO
CREATE TABLE service_orders (
  id TEXT PRIMARY KEY, 
  quote_id TEXT REFERENCES quotes(id) ON DELETE SET NULL,
  client_id TEXT REFERENCES clients(id) ON DELETE CASCADE,
  machine_id TEXT REFERENCES machines(id) ON DELETE CASCADE,
  technician_id TEXT,
  identified_defect TEXT,
  services_executed TEXT,
  photos TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'Aberta',
  status_history JSONB DEFAULT '[]'::jsonb,
  entry_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  estimated_date TIMESTAMP WITH TIME ZONE,
  finish_date TIMESTAMP WITH TIME ZONE,
  warranty_days INTEGER DEFAULT 90,
  financial JSONB NOT NULL
);

-- 6. CONFIGURAÇÕES
CREATE TABLE system_config (
  key TEXT PRIMARY KEY,
  value JSONB
);
```

## 2. Dica de Segurança (Importante)
Como o sistema está enviando o ID do cliente para o banco, o uso de `TEXT` em vez de `UUID` no banco permite que o sistema funcione com os IDs simplificados que o frontend gera.

## 3. Login Inicial
- **E-mail:** admin@oficina.com
- **Senha:** admin
