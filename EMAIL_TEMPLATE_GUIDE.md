# 📧 Email Template Customization Guide

## 🎯 Customize Email di Supabase

### Step 1: Buka Email Templates

1. Go to Supabase Dashboard
2. Click **Authentication** → **Email Templates**
3. Pilih template yang ingin diubah

### Step 2: Confirm Signup Template

Ganti template **Confirm signup** dengan:

```html
<h2>Selamat Datang di ArKomik! 🎉</h2>

<p>Halo,</p>

<p>Terima kasih telah mendaftar di <strong>ArKomik</strong> - Platform baca manhwa, manga, dan manhua gratis!</p>

<p>Untuk melanjutkan, silakan klik tombol di bawah ini untuk verifikasi email Anda:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
    ✅ Verifikasi Email Saya
  </a>
</p>

<p>Atau copy link ini ke browser Anda:</p>
<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">
  {{ .ConfirmationURL }}
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

<p><strong>Setelah verifikasi, Anda bisa:</strong></p>
<ul>
  <li>📚 Bookmark manhwa favorit</li>
  <li>⏰ Simpan riwayat baca</li>
  <li>👤 Customize profil Anda</li>
  <li>🔔 Dapatkan update chapter terbaru</li>
</ul>

<p style="margin-top: 30px; color: #6b7280; font-size: 13px;">
  Link ini akan kadaluarsa dalam 24 jam.<br>
  Jika Anda tidak mendaftar di ArKomik, abaikan email ini.
</p>

<p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
  Salam hangat,<br>
  <strong>Tim ArKomik</strong> 🚀
</p>
```

### Step 3: Magic Link Template (Optional)

Ganti template **Magic Link** dengan:

```html
<h2>Login ke ArKomik 🔐</h2>

<p>Halo,</p>

<p>Klik tombol di bawah untuk login ke akun <strong>ArKomik</strong> Anda:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
    🔓 Login ke ArKomik
  </a>
</p>

<p>Atau copy link ini ke browser Anda:</p>
<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 30px; color: #6b7280; font-size: 13px;">
  Link ini akan kadaluarsa dalam 1 jam.<br>
  Jika Anda tidak meminta login, abaikan email ini.
</p>

<p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
  Salam hangat,<br>
  <strong>Tim ArKomik</strong> 🚀
</p>
```

### Step 4: Reset Password Template

Ganti template **Reset Password** dengan:

```html
<h2>Reset Password ArKomik 🔑</h2>

<p>Halo,</p>

<p>Kami menerima permintaan untuk reset password akun <strong>ArKomik</strong> Anda.</p>

<p>Klik tombol di bawah untuk membuat password baru:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
    🔄 Reset Password
  </a>
</p>

<p>Atau copy link ini ke browser Anda:</p>
<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 30px; color: #6b7280; font-size: 13px;">
  Link ini akan kadaluarsa dalam 1 jam.<br>
  Jika Anda tidak meminta reset password, abaikan email ini dan password Anda tetap aman.
</p>

<p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
  Salam hangat,<br>
  <strong>Tim ArKomik</strong> 🚀
</p>
```

### Step 5: Change Email Template

Ganti template **Change Email Address** dengan:

```html
<h2>Konfirmasi Perubahan Email 📧</h2>

<p>Halo,</p>

<p>Kami menerima permintaan untuk mengubah email akun <strong>ArKomik</strong> Anda.</p>

<p>Klik tombol di bawah untuk konfirmasi perubahan email:</p>

<p style="text-align: center; margin: 30px 0;">
  <a href="{{ .ConfirmationURL }}" 
     style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 14px 32px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: bold;
            display: inline-block;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
    ✅ Konfirmasi Email Baru
  </a>
</p>

<p>Atau copy link ini ke browser Anda:</p>
<p style="background: #f3f4f6; padding: 12px; border-radius: 6px; word-break: break-all; font-size: 13px;">
  {{ .ConfirmationURL }}
</p>

<p style="margin-top: 30px; color: #6b7280; font-size: 13px;">
  Link ini akan kadaluarsa dalam 24 jam.<br>
  Jika Anda tidak meminta perubahan email, segera hubungi kami.
</p>

<p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
  Salam hangat,<br>
  <strong>Tim ArKomik</strong> 🚀
</p>
```

## 🎨 Customization Tips

### Warna Brand
- Primary: `#667eea` (Purple)
- Secondary: `#764ba2` (Dark Purple)
- Gradient: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### Font
- Heading: Bold, 24px
- Body: Regular, 15px
- Small text: 13px
- Footer: 12px

### Button Style
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
padding: 14px 32px;
border-radius: 8px;
font-weight: bold;
box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
```

## 📱 Email Preview

Setelah save template, test dengan:
1. Register akun baru
2. Check email inbox
3. Verify tampilan email
4. Click button untuk test link

## ✅ Checklist

- [ ] Update Confirm Signup template
- [ ] Update Magic Link template
- [ ] Update Reset Password template
- [ ] Update Change Email template
- [ ] Test email delivery
- [ ] Verify button styling
- [ ] Check mobile responsive
- [ ] Test all links working

## 🎯 Benefits

- ✅ **Professional** - Branded emails
- ✅ **Clear CTA** - Big button yang jelas
- ✅ **Informative** - Explain what to do
- ✅ **Friendly** - Bahasa Indonesia
- ✅ **Secure** - Expiry time info

---

**Note:** Setelah update template, test dengan register akun baru untuk verify!
