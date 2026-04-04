# Security Audit — Port 8100 (Navi OS)

**Auditor:** WARREN (Chief Quality Officer)  
**Date:** 2026-04-03  
**Model:** minimax-m2.7  

---

## 1. Estat Actual

| Element | Valor | Risc |
|---------|-------|------|
| Port | 8100 | — |
| Binding | `0.0.0.0` (tots els interfícies) | 🔴 ALT |
| Procés | `node /home/user` (Vite dev server) | 🔴 ALT |
| IP pública | `185.188.208.225` | 🔴 ALT |
| Accés extern | **OBERT** (curl retorna 200) | 🔴 ALT |
| Nginx | No instal·lat | 🟡 MITJA |
| Firewall (UFW) | Inactiu / sense regles per 8100 | 🔴 ALT |
| Autenticació | Cap a nivell de xarxa | 🔴 ALT |

---

## 2. Exposició Detectada

```
ss -tlnp | grep 8100
LISTEN 0 511 0.0.0.0:8100 0.0.0.0:*  users:(("node /home/user",pid=328880))

curl -s --max-time 5 http://185.188.208.225:8100
→ HTTP 200 (HTML de Navi OS retornat)  ← EXPOSAT A INTERNET
```

**El port 8100 és accessible des d'internet sense cap capa d'autenticació de xarxa.**

---

## 3. Vulnerabilitats

1. **Servei Vite en producció** — Vite no és un servidor de producció. No té cap headers de seguretat (CSP, HSTS, X-Frame-Options).
2. **Binding a 0.0.0.0** — escolta a totes les interfícies inclosa la pública.
3. **Sense capa d'autenticació** — el dashboard de Navi OS no té protecció a nivell de xarxa.
4. **Sense firewall** — UFW inactiu, iptables buit o sense regles de bloqueig.

---

## 4. Proposta de Tancament — Opció A: Nginx + Basic Auth (RECOMANADA)

### Per què:
- Ràpida d'implementar
- No cal configurar VPN per a clients
-的费用: 0
- Manté l'accés des de qualsevol navegador

### Passos:

#### 1. Instal·lar nginx
```bash
sudo apt update && sudo apt install nginx apache2-utils
```

#### 2. Crear fitxer de config Nginx
```bash
sudo nano /etc/nginx/sites-available/navi-os
```

```nginx
server {
    listen 8100;
    server_name _;

    # Autenticació bàsica
    auth_basic "Navi OS - Accés restringit";
    auth_basic_user_file /etc/nginx/.htpasswd_navi;

    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

> ⚠️ **PROBLEMA:** Nginx escoltant al port 8100 encara rebrà tràfic directament. Cal fer un canvi previ: moure Vite a localhost i fer que Nginx escolti al port 80/443.

**Arquitectura recomanada:**

```
[Internet] → [Firewall: bloqueja 8100] → [Nginx:80/443] → [Vite:127.0.0.1:8100]
```

#### 3. Moure Vite a loopback (només localhost)
Canviar `vite.config.js`:
```javascript
server: {
  port: 8100,
  host: '127.0.0.1',  // Canviar de 0.0.0.0 a 127.0.0.1
  ...
}
```

#### 4. Nginx al port 80/443
```bash
# /etc/nginx/sites-available/navi-os
server {
    listen 80;
    server_name navi.casa;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name navi.casa;

    ssl_certificate /etc/ssl/certs/navi.casa.crt;
    ssl_certificate_key /etc/ssl/private/navi.casa.key;

    auth_basic "Navi OS";
    auth_basic_user_file /etc/nginx/.htpasswd_navi;

    location / {
        proxy_pass http://127.0.0.1:8100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. Crear usuari i contrasenya
```bash
sudo htpasswd -c /etc/nginx/.htpasswd_navi aleix
# Demanarà contrasenya
```

#### 6. Bloquejar port 8100 al firewall
```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 8100/tcp
sudo ufw enable
```

---

## 5. Proposta de Tancament — Opció B: WireGuard VPN

**Més segur però més complex per a clients.**

- Només qui tingui VPN pot accedir a la xarxa interna
- WireGuard és ràpid i modern
- Aleix es connecta via VPN i després accceeix a http://192.168.1.101:8100

```
[Aleix] → [WireGuard VPN] → [192.168.1.101:8100]
```

**Avantatge:** Zero exposició pública  
**Inconvenient:** Cal configurar VPN a cada dispositiu client

---

## 6. Opció C: Tancament immediat (Stop Gap)

Si cal tancar ara mateix l'exposició:

```bash
# Canviar Vite a només loopback (temporal)
sed -i "s/host: '0.0.0.0'/host: '127.0.0.1'/" /home/user/.openclaw/workspace/navi-os/vite.config.js

# Reiniciar servei PM2
pm2 restart navi-os-vite
```

**Això trenca l'accés des d'internet però també des de la LAN.** Cal then fer NAT/port forwarding a un port intern o usar VPN.

---

## 7. Recomendació Final (WARREN)

**Opció A (Nginx + Basic Auth)** és la millor opció perquè:
- Tanca l'exposició pública
- Manté accessibilitat via navegador
-的费用 baix (gratis)
- Implementable en ~30 minuts

**Acció immediata recomanada:**
1. Canviar `host: '127.0.0.1'` a Vite ara
2. Instal·lar nginx
3. Configurar basic auth
4. Obrir només ports 80/443

---

## 8. Ticket per JEFF

> JEFF — quanAleix validi la proposta,implementa l'Opció A:
> 1. Canviar vite.config.js host → 127.0.0.1
> 2. Install nginx + apache2-utils
> 3. Crear /etc/nginx/sites-available/navi-os
> 4. htpasswd -c /etc/nginx/.htpasswd_navi aleix
> 5. ufw: allow 80,443 / deny 8100
> 6. pm2 restart navi-os-vite
> 7. Test: curl http://185.188.208.225:8100 → ha de fallar (connection refused)
> 8. Test: curl http://185.188.208.225 → demana auth i retorna 200

