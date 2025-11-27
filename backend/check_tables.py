"""
Script para verificar que las tablas existan en la base de datos.
"""
import sys
from sqlalchemy import inspect, text
from app.core.database import engine

def check_tables():
    """Verificar que las tablas necesarias existan."""
    print("Verificando tablas en la base de datos...")
    
    try:
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        print(f"\nTablas encontradas ({len(tables)}):")
        for table in sorted(tables):
            print(f"  [OK] {table}")
        
        # Verificar tablas críticas
        required_tables = ['users', 'companies', 'profiles']
        missing_tables = []
        
        for table in required_tables:
            if table not in tables:
                missing_tables.append(table)
                print(f"  [ERROR] FALTA: {table}")
            else:
                print(f"  [OK] EXISTE: {table}")
        
        if missing_tables:
            print(f"\n[ERROR] Faltan las siguientes tablas: {', '.join(missing_tables)}")
            print("   Ejecuta el script SQL en Supabase para crear las tablas.")
            return False
        
        # Verificar estructura de la tabla users
        if 'users' in tables:
            print("\nVerificando estructura de la tabla 'users'...")
            columns = inspector.get_columns('users')
            column_names = [col['name'] for col in columns]
            print(f"  Columnas: {', '.join(column_names)}")
            
            required_columns = ['id', 'email', 'hashed_password', 'role', 'company_id', 'is_active', 'is_verified']
            for col in required_columns:
                if col in column_names:
                    print(f"  [OK] {col}")
                else:
                    print(f"  [ERROR] FALTA: {col}")
        
        # Verificar que el enum role_enum exista
        print("\nVerificando tipos ENUM...")
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT typname FROM pg_type 
                WHERE typname = 'role_enum'
            """))
            enum_exists = result.fetchone() is not None
            
            if enum_exists:
                print("  [OK] role_enum existe")
            else:
                print("  [ERROR] role_enum NO existe - ejecuta el script SQL para crearlo")
        
        print("\n[OK] Verificacion completada")
        return True
        
    except Exception as e:
        print(f"\n[ERROR] Error al verificar tablas: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = check_tables()
    sys.exit(0 if success else 1)

