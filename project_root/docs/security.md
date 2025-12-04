possible threats that can happen in our website:

Weak authentication
• Simple or reused passwords for admin accounts.
• No account lockout after many failed logins.
• No multi factor authentication for admin area.
• Defense: strong password rules, rate limiting on logins, account lockout, optional MFA for admins.



Protect SQLite file (9. Data leakage through SQLite file)
Move the .db file outside the web root and fix file permissions.
Also ignore it in Git. Few code changes.

Basic server hardening (15. Misconfigured server)
Turn off debug mode in production.
Disable directory listing.
Change default passwords on panels.
Mostly configuration, not code.

HTTPS everywhere (13. Lack of HTTPS)
Use Let’s Encrypt or a hosting panel to issue a certificate.
Force redirect from HTTP to HTTPS.
Mostly one-time setup.

Basic logging and monitoring (16. Poor logging and monitoring)
Log failed logins, key actions, and server errors.
Even simple file logs help.
No complex logic needed at first.

Input validation (10. Input validation issues)
Check length, type, and range for fields like quantity, price, IDs.
Add server side validation on all forms.
Repetitive, but concept is simple.

Secure password storage (8. Insecure password storage)
Use a library for bcrypt or Argon2.
Apply on registration and password change.
Main work is migration if old accounts already exist.

SQL injection protection (1. SQL injection)
Replace string concatenated queries with prepared statements.
This touches many database calls, but logic stays the same.
