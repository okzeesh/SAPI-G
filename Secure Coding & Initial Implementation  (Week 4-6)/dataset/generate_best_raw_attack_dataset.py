import pandas as pd
import random
import datetime
import string

# Example payloads
benign_passwords = [
        'myDogRex2024', 'BlueSky!@#', 'CoffeeLover99', 'SecurePass!2024', 'Bookworm_42',
        'Travel4Fun', 'GuitarHero2023', 'Sunset$Beach', 'WinterIsComing', 'HelloWorld2024',
        'MapleTreeHouse', 'SoccerFan_88', 'JazzLover2022', 'MountainHike$', 'OceanView!2023',
        'PianoKeys#1', 'StarlightNight', 'GreenTeaLover', 'CodeMaster2024', 'RubyOnRails!',
        'Pythonista_99', 'QuantumLeap42', 'SpaceOdyssey', 'RedVelvetCake', 'PixelPainter'
]
sqli_payloads = [
        "' OR 1=1 --", 'admin" --', 'password123 OR 1=1', "' UNION SELECT * FROM users --",
        "; DROP TABLE users; --", "' OR 'a'='a", 'admin\' --', "1' or '1' = '1", "admin' #"
]
xss_payloads = [
        '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<svg/onload=alert(1)>',
        '<body onload=alert(1)>', '<iframe src=javascript:alert(1)>', '<a href=javascript:alert(1)>Click</a>',
        '<div onmouseover=alert(1)>XSS</div>', '<input onfocus=alert(1)>'
]
bruteforce_passwords = [
        '123456', '111111', '000000', '654321', '222222', '333333', '444444', '555555', '666666', '777777',
        '888888', '999999', '121212', '112233', '789456', '147258', '258369', '369258', 'password1', 'qwerty1'
]
# Port scan: simulate by using many different endpoints/ports from same IP
portscan_endpoints = [
        '/api/login', '/api/register', '/api/data', '/api/admin', '/api/user', '/api/secret', '/api/config'
]
# More diverse email domains
email_domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'protonmail.com', 
                'icloud.com', 'aol.com', 'mail.com', 'zoho.com', 'yandex.com']

# More diverse user agents
user_agents = [
