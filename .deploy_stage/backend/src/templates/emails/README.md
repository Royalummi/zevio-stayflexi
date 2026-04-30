# Email Templates

# ─────────────────────────────────────────────

# These HTML templates are used by the email notification system.

# You can edit them directly — changes take effect immediately (no restart needed).

#

# ## Files

#

# | File | Purpose | Sender |

# |--------------------|----------------------------------------------|---------------------------|

# | `base.html` | Outer layout (header, footer, styles) | — |

# | `notification.html`| System notifications (property, change req) | noreply@notify.zevio.in |

# | `alert.html` | Alerts (approvals, rejections, reminders) | alerts@notify.zevio.in |

#

# ## How it works

#

# 1. The system reads `base.html` and injects the inner template into `{{CONTENT}}`

# 2. Placeholders like `{{TITLE}}`, `{{MESSAGE}}`, `{{CTA_URL}}` are replaced with real values

# 3. Templates are re-read from disk each time, so edits are instant

#

# ## Placeholders Reference

#

# ### Common (all templates)

# - `{{RECIPIENT_NAME}}` — Name of the recipient

# - `{{TITLE}}` — Email heading

# - `{{MESSAGE}}` — Main body text

# - `{{CTA_URL}}` — Button link URL

# - `{{CTA_TEXT}}` — Button label text

# - `{{DETAILS_HTML}}` — Extra info rows (auto-generated)

#

# ### notification.html

# - `{{BADGE_TEXT}}` — Status badge label

# - `{{BADGE_CLASS}}` — badge-success | badge-warning | badge-danger | badge-info

#

# ### alert.html

# - `{{ALERT_COLOR}}` — Left border color (#22c55e, #f59e0b, #ef4444, #3b82f6)

#

# ### base.html

# - `{{SUBJECT}}` — Page title

# - `{{HEADER_SUBTITLE}}` — Subtext below "ZEVIO" in header

# - `{{CONTENT}}` — Inner template HTML

# - `{{YEAR}}` — Current year (auto-filled)
