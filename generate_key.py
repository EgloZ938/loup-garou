import secrets

# Génère une clé secrète sécurisée
print('Voici votre clé secrète:')
print(secrets.token_hex(32))