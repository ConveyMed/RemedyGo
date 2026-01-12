# Email Templates - Best Practice

## Pattern
Simple table-based layout, inline styles, minimal HTML. Works in all email clients.

## Structure
```html
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <tr>
    <td style="padding:40px 20px;text-align:center;">
      <h2 style="color:#1a1523;margin:0 0 20px;">Title Here</h2>
      <p style="color:#6b5f7a;margin:0 0 30px;line-height:1.5;">Description text here.</p>
      <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#8246AF;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;">Button Text</a>
      <p style="color:#9088a3;margin:30px 0 0;font-size:13px;">Footer/disclaimer text.</p>
    </td>
  </tr>
</table>
```

## Key Points
- Single table, single cell - keeps it simple
- All styles inline (email clients strip `<style>` tags)
- System font stack for cross-platform consistency
- Supabase variable: `{{ .ConfirmationURL }}`
- No images, no external CSS, no JavaScript
- Max-width 500px centers nicely on desktop, full-width on mobile

## Colors (update per brand)
- Button: `#8246AF` (brand primary)
- Title: `#1a1523` (dark text)
- Body: `#6b5f7a` (muted text)
- Footer: `#9088a3` (light text)

## Supabase Setup
1. Dashboard > Authentication > Email Templates
2. Paste template HTML
3. Update Subject line
4. Save
