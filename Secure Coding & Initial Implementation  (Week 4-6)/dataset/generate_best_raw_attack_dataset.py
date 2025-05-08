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
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'curl/7.68.0', 'python-requests/2.25.1', 'nmap/7.80', 'sqlmap/1.4.6',
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; Bingbot/2.0; +http://www.bing.com/bingbot.htm)'
]

# More diverse IP ranges
def generate_random_ip():
    # Generate IPs from different ranges
     ranges = [
         (192, 168, 1, 1, 254),  # Private network
         (10, 0, 0, 1, 254),     # Private network
         (172, 16, 0, 1, 254),   # Private network
         (1, 1, 1, 1, 254),      # Public network
         (8, 8, 8, 1, 254),      # Public network
         (45, 45, 45, 1, 254),   # Public network
         (104, 16, 0, 1, 254),   # Public network
         (185, 199, 108, 1, 254) # Public network
     ]
     range_choice = random.choice(ranges)
     return f"{range_choice[0]}.{range_choice[1]}.{range_choice[2]}.{random.randint(range_choice[3], range_choice[4])}"

# More diverse endpoints
endpoints = [
        '/api/login', '/api/register', '/api/data', '/api/admin', '/api/user', 
        '/api/secret', '/api/config', '/api/v1/auth', '/api/v2/login', '/api/v3/authenticate',
        '/api/account', '/api/profile', '/api/settings', '/api/dashboard', '/api/status',
        '/api/health', '/api/metrics', '/api/logs', '/api/backup', '/api/restore'
]  

def random_timestamp():
    # Generate more realistic timestamps with patterns
    start = datetime.datetime(2024, 1, 1)
    end = datetime.datetime(2024, 12, 31)
    
    # Add time patterns (more activity during business hours)
    hour = random.randint(0, 23)
    if 9 <= hour <= 17:  # Business hours
        time_range = random.randint(0, 60)  # More frequent
    else:
        time_range = random.randint(0, 120)  # Less frequent
        
    return (start + datetime.timedelta(