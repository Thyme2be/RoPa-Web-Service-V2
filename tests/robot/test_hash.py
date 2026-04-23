import bcrypt

def truncate_pwd(pwd: str) -> str:
    pwd_bytes = pwd.encode('utf-8')
    if len(pwd_bytes) > 72:
        return pwd_bytes[:72].decode('utf-8', 'ignore')
    return pwd

hashed_password = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlzAM3FeGnI6mkm'
plain_password = 'Admin@1234'

result = bcrypt.checkpw(
    truncate_pwd(plain_password).encode('utf-8'),
    hashed_password.encode('utf-8')
)

print(f"Check result: {result}")
