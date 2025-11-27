-- Script para actualizar el enum role_enum en la base de datos
-- Ejecutar este script en Supabase SQL Editor

-- 1. Crear un nuevo tipo enum con los valores correctos
CREATE TYPE role_enum_new AS ENUM ('estudiante', 'profesor', 'administrador', 'company_admin');

-- 2. Eliminar el valor por defecto temporalmente
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

-- 3. Actualizar la columna role en la tabla users para usar el nuevo enum
-- Mapeo: student -> estudiante, instructor -> profesor, system_admin/company_admin -> administrador
ALTER TABLE users 
  ALTER COLUMN role TYPE role_enum_new 
  USING CASE 
    WHEN role::text = 'student' THEN 'estudiante'::role_enum_new
    WHEN role::text = 'instructor' THEN 'profesor'::role_enum_new
    WHEN role::text = 'system_admin' THEN 'administrador'::role_enum_new
    WHEN role::text = 'company_admin' THEN 'company_admin'::role_enum_new
    ELSE 'estudiante'::role_enum_new
  END;

-- 4. Restaurar el valor por defecto con el nuevo enum
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'estudiante'::role_enum_new;

-- 5. Eliminar el tipo enum antiguo
DROP TYPE role_enum;

-- 6. Renombrar el nuevo tipo al nombre original
ALTER TYPE role_enum_new RENAME TO role_enum;

