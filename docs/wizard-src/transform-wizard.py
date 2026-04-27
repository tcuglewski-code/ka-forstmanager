#!/usr/bin/env python3
"""
Wizard Stitch Layout Transformer v2
Converts ka-hero/ka-card/ka-progress → kaw-header/kaw-body/kaw-footer.
Uses string manipulation instead of regex for CSS replacement.
"""
import re, sys, os

# ── New CSS (will be escaped for JS single-quoted string) ───────────────────
NEW_CSS_RAW = r"""@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

:root {
  --kaw-bg: #fff8f2;
  --kaw-forest: #012d1d;
  --kaw-forest-2: #1b4332;
  --kaw-accent: #A3E635;
  --kaw-on-surface: #1d1b18;
  --kaw-muted: #717973;
  --kaw-outline: #c1c8c2;
  --kaw-container: #f3ede7;
  --kaw-error: #ba1a1a;
  --kaw-white: #ffffff;
}

#ka-wizard, #ka-wizard * { box-sizing: border-box; font-family: 'Manrope', -apple-system, sans-serif; }
#ka-wizard { background: var(--kaw-bg); min-height: 100vh; display: flex; flex-direction: column; }

.kaw-header { position: sticky; top: 0; z-index: 100; background: var(--kaw-forest); color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 16px; flex-direction: column; }
.kaw-logo { color: rgba(255,255,255,0.7); font-size: 13px; text-decoration: none; align-self: flex-start; }
.kaw-logo:hover { color: #fff; }
.kaw-steps { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.kaw-step { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: default; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); border: 1.5px solid transparent; transition: all 0.2s; }
.kaw-step.done { background: rgba(163,230,53,0.15); color: rgba(255,255,255,0.75); }
.kaw-step.done::before { content: '\2713'; margin-right: 4px; color: var(--kaw-accent); }
.kaw-step.active { background: rgba(163,230,53,0.2); color: #fff; border-color: var(--kaw-accent); }
.kaw-progress-bar { width: 100%; height: 3px; background: rgba(255,255,255,0.15); border-radius: 9999px; }
.kaw-progress-fill { height: 100%; background: var(--kaw-accent); border-radius: 9999px; transition: width 0.4s ease; }

.kaw-body { flex: 1; padding: 32px 24px 120px; max-width: 800px; margin: 0 auto; width: 100%; }

.kaw-step-header { margin-bottom: 32px; }
.kaw-step-title { font-size: 24px; font-weight: 700; color: var(--kaw-forest); line-height: 1.3; }
.kaw-step-subtitle { font-size: 15px; color: var(--kaw-muted); margin-top: 8px; }

.kaw-footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255,248,242,0.97); backdrop-filter: blur(8px); border-top: 1px solid var(--kaw-outline); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; z-index: 200; }
.kaw-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; font-family: 'Manrope', sans-serif; transition: all 0.15s; min-width: 100px; min-height: 44px; }
.kaw-btn-back { background: transparent; border: 2px solid var(--kaw-outline); color: var(--kaw-on-surface); }
.kaw-btn-back:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }
.kaw-btn-next { background: var(--kaw-accent); color: var(--kaw-forest); }
.kaw-btn-next:hover { background: #8fce00; }
.kaw-btn-next:disabled { background: var(--kaw-outline); color: #fff; cursor: not-allowed; }
.kaw-step-label { font-size: 13px; color: var(--kaw-muted); font-weight: 500; }

.kaw-success { text-align: center; padding: 60px 24px; }
.kaw-success-icon { font-size: 64px; margin-bottom: 24px; }
.kaw-success-title { font-size: 28px; font-weight: 700; color: var(--kaw-forest); margin-bottom: 12px; }
.kaw-success-text { font-size: 16px; color: var(--kaw-muted); max-width: 500px; margin: 0 auto; line-height: 1.6; }

/* COMPAT — keep old ka-* classes working */
.ka-field { margin-bottom: 20px; position: relative; }
.ka-label { display: block; font-size: 13px; font-weight: 700; color: var(--kaw-on-surface); margin-bottom: 6px; letter-spacing: 0.02em; }
.ka-label-optional { color: var(--kaw-muted); font-size: 11px; font-weight: 400; }
.ka-hint { font-size: 12px; color: var(--kaw-muted); margin-top: 4px; }
.ka-inp { width: 100%; padding: 12px 14px; font-size: 15px; font-family: 'Manrope', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; }
.ka-inp:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }
.ka-inp::placeholder { color: var(--kaw-muted); }
.ka-select { width: 100%; padding: 12px 14px; font-size: 15px; font-family: 'Manrope', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; cursor: pointer; -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23717973' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }
.ka-select:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }
.ka-textarea { width: 100%; padding: 12px 14px; font-size: 15px; font-family: 'Manrope', sans-serif; border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; }
.ka-textarea:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }
.ka-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ka-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }
.ka-grid-auto { display: grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap: 12px; }
@media(max-width:520px){ .ka-grid-2,.ka-grid-3 { grid-template-columns: 1fr; } }
.ka-cards { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 12px; }
.ka-cards-stacked { display: flex; flex-direction: column; gap: 12px; }
.ka-card { background: transparent; border-radius: 0; box-shadow: none; overflow: visible; margin: 0; max-width: 100%; }
.ka-card-header { padding: 0 0 16px; }
.ka-card-header h2 { margin: 0 0 8px; font-size: 24px; font-weight: 700; color: var(--kaw-forest); line-height: 1.3; }
.ka-card-header p { margin: 0; font-size: 15px; color: var(--kaw-muted); line-height: 1.5; }
.ka-card-body { padding: 0; }
.ka-card-footer { display: none; }
.ka-card-option { padding: 20px 16px; border: 2px solid var(--kaw-outline); border-radius: 12px; cursor: pointer; transition: all 0.15s; background: var(--kaw-white); text-align: left; position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }
.ka-card-option:hover { border-color: var(--kaw-forest-2); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(27,67,50,0.12); }
.ka-card-option.selected { border-color: var(--kaw-forest); background: #f0f7f0; }
.ka-card-option.selected::after { content: '\2713'; position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; background: var(--kaw-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--kaw-forest); font-size: 13px; font-weight: 700; }
.ka-card-icon { font-size: 28px; }
.ka-card-name { font-size: 14px; font-weight: 700; color: var(--kaw-on-surface); }
.ka-card-option.selected .ka-card-name { color: var(--kaw-forest); }
.ka-card-sub { font-size: 12px; color: var(--kaw-muted); margin-top: 2px; }
.ka-card-desc { font-size: 12px; color: var(--kaw-muted); line-height: 1.4; margin-top: 6px; }
.ka-card-price { font-size: 12px; color: var(--kaw-forest); font-weight: 600; margin-top: 6px; }
.ka-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.ka-chip { padding: 8px 16px; border-radius: 9999px; border: 2px solid var(--kaw-outline); background: var(--kaw-white); cursor: pointer; font-size: 13px; font-weight: 500; color: var(--kaw-on-surface); transition: all 0.15s; font-family: 'Manrope', sans-serif; }
.ka-chip:hover { border-color: var(--kaw-forest-2); }
.ka-chip.selected { border-color: var(--kaw-forest); background: #f0f7f0; font-weight: 700; color: var(--kaw-forest); }
.ka-toggles { display: flex; gap: 8px; flex-wrap: wrap; }
.ka-toggle { padding: 10px 18px; border-radius: 8px; border: 2px solid var(--kaw-outline); background: var(--kaw-white); cursor: pointer; font-size: 13px; font-weight: 500; color: var(--kaw-on-surface); transition: all 0.15s; font-family: 'Manrope', sans-serif; text-align: center; }
.ka-toggle:hover { border-color: var(--kaw-forest-2); }
.ka-toggle.selected { border-color: var(--kaw-forest); background: #f0f7f0; font-weight: 700; color: var(--kaw-forest); }
.ka-toggle-sub { display: block; font-size: 10px; font-weight: 400; color: var(--kaw-muted); margin-top: 2px; }
.ka-toggle.selected .ka-toggle-sub { color: var(--kaw-forest); }
.ka-radio-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 2px solid var(--kaw-outline); border-radius: 12px; background: var(--kaw-white); cursor: pointer; transition: all 0.15s; }
.ka-radio-card:hover { border-color: var(--kaw-forest-2); }
.ka-radio-card.selected { border-color: var(--kaw-forest); background: #f0f7f0; }
.ka-radio-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--kaw-outline); background: transparent; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
.ka-radio-card.selected .ka-radio-dot { border-color: var(--kaw-forest); background: var(--kaw-forest); }
.ka-radio-dot-inner { width: 8px; height: 8px; border-radius: 50%; background: #fff; display: none; }
.ka-radio-card.selected .ka-radio-dot-inner { display: block; }
.ka-radio-label { font-size: 14px; font-weight: 600; color: var(--kaw-on-surface); }
.ka-radio-card.selected .ka-radio-label { color: var(--kaw-forest); }
.ka-radio-desc { font-size: 12px; color: var(--kaw-muted); margin-top: 2px; }
.ka-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; font-family: 'Manrope', sans-serif; cursor: pointer; transition: all 0.15s; border: none; text-decoration: none; white-space: nowrap; min-height: 44px; min-width: 44px; }
.ka-btn-primary { background: var(--kaw-accent); color: var(--kaw-forest); }
.ka-btn-primary:hover { background: #8fce00; }
.ka-btn-primary:disabled { background: var(--kaw-outline); color: #fff; cursor: not-allowed; }
.ka-btn-secondary { background: transparent; color: var(--kaw-on-surface); border: 2px solid var(--kaw-outline); }
.ka-btn-secondary:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }
.ka-btn-gold { background: var(--kaw-accent); color: var(--kaw-forest); }
.ka-btn-gold:hover { background: #8fce00; }
.ka-btn-ghost { background: transparent; color: var(--kaw-forest); padding: 8px 16px; }
.ka-btn-ghost:hover { background: rgba(1,45,29,0.04); }
.ka-btn-sm { padding: 8px 16px; font-size: 13px; min-height: 36px; }
.ka-btn-block { display: block; width: 100%; text-align: center; }
.ka-qty { display: flex; align-items: center; gap: 6px; }
.ka-qty-btn { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--kaw-outline); background: var(--kaw-white); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--kaw-muted); transition: all 0.15s; }
.ka-qty-btn:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }
.ka-qty-input { width: 70px; text-align: center; border: 2px solid var(--kaw-outline); border-radius: 8px; padding: 6px; font-size: 15px; font-weight: 600; font-family: 'Manrope', sans-serif; color: var(--kaw-on-surface); }
.ka-nav { display: none; }
.ka-info-box { padding: 14px 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin-bottom: 16px; }
.ka-info-box.info { background: #f0f7ff; border-left: 3px solid #3b82f6; color: #1e40af; }
.ka-info-box.warn { background: #fff8e1; border-left: 3px solid #d97706; color: #012d1d; }
.ka-info-box.success { background: #e8f5e8; border-left: 3px solid #2d7a2d; color: #166534; }
.ka-info-box.error { background: #fef2f2; border-left: 3px solid var(--kaw-error); color: #991b1b; }
.ka-info-box.brand { background: var(--kaw-container); border-left: 3px solid var(--kaw-forest); color: var(--kaw-forest); }
.ka-info-box strong { font-weight: 700; }
.ka-err { color: var(--kaw-error); font-size: 13px; margin-top: 8px; display: none; }
.ka-err:not(:empty) { display: block; }
.ka-price-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg,var(--kaw-container),rgba(163,230,53,0.08)); border: 2px solid rgba(1,45,29,0.15); border-radius: 12px; margin-top: 14px; gap: 12px; }
.ka-price-box span { font-size: 13px; color: var(--kaw-forest); line-height: 1.4; }
.ka-price-box strong { font-size: 18px; color: var(--kaw-on-surface); font-weight: 800; white-space: nowrap; }
.ka-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: #f0f7f0; color: var(--kaw-forest); border-radius: 16px; font-size: 12px; font-weight: 600; border: 1px solid rgba(1,45,29,0.15); margin: 2px; }
.ka-summary { background: var(--kaw-container); border-radius: 12px; border: 1px solid var(--kaw-outline); padding: 24px; margin-bottom: 18px; }
.ka-summary-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--kaw-muted); margin-bottom: 12px; }
.ka-summary-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--kaw-outline); font-size: 14px; }
.ka-summary-row:last-child { border-bottom: none; }
.ka-summary-label { color: var(--kaw-muted); flex-shrink: 0; min-width: 130px; font-size: 12px; font-weight: 600; }
.ka-summary-value { text-align: right; word-break: break-word; }
.ka-flaeche { background: var(--kaw-container); border: 2px solid var(--kaw-outline); border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: all 0.15s; }
.ka-flaeche-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.ka-flaeche-title { font-size: 14px; font-weight: 700; color: var(--kaw-on-surface); }
.ka-flaeche-del { background: none; border: none; color: var(--kaw-error); cursor: pointer; font-size: 13px; font-weight: 600; padding: 4px 8px; min-height: 36px; }
.ka-add-btn { width: 100%; padding: 14px; border: 2px dashed var(--kaw-outline); border-radius: 8px; background: rgba(1,45,29,0.02); color: var(--kaw-forest); cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 16px; transition: all 0.15s; font-family: 'Manrope', sans-serif; min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 8px; }
.ka-add-btn:hover { border-color: var(--kaw-forest); background: rgba(1,45,29,0.04); }
.ka-check-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 2px solid var(--kaw-outline); border-radius: 10px; cursor: pointer; background: var(--kaw-white); margin-bottom: 10px; transition: all 0.15s; }
.ka-check-card:hover { border-color: var(--kaw-forest-2); }
.ka-check-card.selected { border-color: var(--kaw-forest); background: #f0f7f0; }
.ka-check-card input[type="checkbox"],.ka-check-card input[type="radio"] { width: 18px; height: 18px; accent-color: var(--kaw-forest); flex-shrink: 0; margin-top: 2px; }
.ka-gps-row { display: flex; gap: 8px; align-items: center; }
.ka-gps-row input { flex: 1; }
.ka-gps-btn { padding: 8px 16px; background: #e8f5e9; color: #1b4332; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; white-space: nowrap; transition: all 0.15s; font-family: 'Manrope', sans-serif; min-height: 44px; }
.ka-gps-btn:hover { background: #c8e6c9; }
.ka-gps-info { font-size: 11px; color: var(--kaw-muted); margin-top: 3px; }
.ka-gps-maps-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 6px 12px; background: rgba(1,45,29,0.04); border: 1px solid var(--kaw-outline); border-radius: 8px; color: var(--kaw-forest); font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.15s; }
.ka-gps-maps-link:hover { background: rgba(1,45,29,0.08); }
.ka-foerder-box { margin-top: 16px; padding: 16px; background: var(--kaw-container); border-radius: 12px; border: 1px solid var(--kaw-outline); }
.ka-foerder-title { font-size: 15px; font-weight: 700; color: var(--kaw-forest); margin-bottom: 8px; }
.ka-foerder-prog { padding: 10px 12px; background: var(--kaw-white); border-radius: 8px; border: 1px solid var(--kaw-outline); margin-bottom: 8px; }
.ka-foerder-prog-name { font-size: 13px; font-weight: 700; color: var(--kaw-on-surface); }
.ka-foerder-prog-rate { font-size: 12px; color: var(--kaw-forest); font-weight: 600; margin-top: 2px; }
.ka-foerder-prog-desc { font-size: 11px; color: var(--kaw-muted); margin-top: 3px; }
.ka-success { text-align: center; padding: 60px 24px; }
.ka-success-icon { font-size: 64px; margin-bottom: 24px; }
.ka-success h2 { font-size: 28px; font-weight: 700; color: var(--kaw-forest); margin: 0 0 12px; }
.ka-success p { font-size: 16px; color: var(--kaw-muted); margin: 0 0 20px; line-height: 1.6; }
.ka-success-card { background: var(--kaw-container); border: 2px solid var(--kaw-forest); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
.ka-success-hint { background: rgba(163,230,53,0.08); border: 2px solid var(--kaw-accent); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
.ka-suggest-dropdown { position: absolute; z-index: 1000; background: var(--kaw-white); border: 1.5px solid var(--kaw-outline); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto; width: 100%; display: none; }
.ka-suggest-dropdown.open { display: block; }
.ka-suggest-item { padding: 10px 14px; font-size: 14px; cursor: pointer; transition: background 0.1s; }
.ka-suggest-item:hover { background: var(--kaw-container); }
.ka-suggest-item.active { background: #f0f7f0; color: var(--kaw-forest); font-weight: 600; }
.ka-accordion-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--kaw-container); border: 2px solid var(--kaw-outline); border-radius: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; }
.ka-accordion-header:hover { background: rgba(1,45,29,0.04); }
.ka-accordion-body { display: none; padding: 16px; border: 2px solid var(--kaw-outline); border-top: none; border-radius: 0 0 12px 12px; }
.ka-accordion-body.open { display: block; }
.ka-map { width: 100%; height: 0; border-radius: 8px; border: none; margin-bottom: 0; overflow: hidden; display: none; }
.ka-dsgvo { font-size: 12px; color: var(--kaw-muted); margin-top: 16px; line-height: 1.5; }
.ka-dsgvo a { color: var(--kaw-forest); }
.ka-field-error { color: var(--kaw-error); font-size: 12px; margin-top: 4px; display: none; }
.ka-field-error.visible { display: block; }
.ka-inp.error,.ka-select.error { border-color: var(--kaw-error) !important; }
.ka-autosave-badge { font-size: 11px; color: #888; padding: 2px 6px; background: rgba(1,45,29,0.06); border-radius: 4px; display: inline-block; margin-left: 8px; }
.ka-retry-btn { margin-top: 8px; padding: 10px 20px; background: var(--kaw-forest); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; min-height: 44px; }
/* pf-* compat */
.pf-card { background: transparent; }
.pf-hd { margin-bottom: 24px; }
.pf-hd h2 { font-size: 24px; font-weight: 700; color: var(--kaw-forest); margin: 0 0 8px; line-height: 1.3; }
.pf-hd p { font-size: 15px; color: var(--kaw-muted); margin: 0; }
.pf-body { padding: 0; }
.pf-ft { display: none; }
.pf-field { margin-bottom: 20px; position: relative; }
.pf-inp { width: 100%; padding: 12px 14px; font-size: 15px; font-family: 'Manrope', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; }
.pf-inp:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }
.pf-btn { display: none; }
.pf-err { color: var(--kaw-error); font-size: 13px; margin-top: 8px; display: none; }
.pf-err:not(:empty) { display: block; }
.pf-sum-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kaw-outline); font-size: 14px; }
.pf-sum-row:last-child { border-bottom: none; }
.pf-sum-lbl { color: var(--kaw-muted); }
.pf-price-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg,var(--kaw-container),rgba(163,230,53,0.08)); border: 2px solid rgba(1,45,29,0.15); border-radius: 12px; margin-top: 14px; gap: 12px; }
.pf-price-box span { font-size: 13px; color: var(--kaw-forest); line-height: 1.4; }
.pf-price-box strong { font-size: 18px; color: var(--kaw-on-surface); font-weight: 800; white-space: nowrap; }
.pf-ok { text-align: center; padding: 60px 24px; }
input[type='radio'],input[type='checkbox'] { width: 20px; height: 20px; cursor: pointer; }
label { cursor: pointer; }
.ka-inp:focus-visible,.ka-select:focus-visible,.ka-textarea:focus-visible,.ka-btn:focus-visible,.pf-inp:focus-visible,input[type='radio']:focus-visible,input[type='checkbox']:focus-visible { outline: 2px solid var(--kaw-forest); outline-offset: 2px; }
@media (max-width: 640px) {
  .kaw-body { padding: 24px 16px 120px; }
  .kaw-step-label { display: none; }
  .kaw-steps { gap: 4px; }
  .kaw-step { padding: 4px 10px; font-size: 12px; }
  .ka-grid-2,.ka-grid-3 { grid-template-columns: 1fr; }
  .ka-cards { grid-template-columns: 1fr; }
  .ka-price-box,.pf-price-box { flex-direction: column; text-align: center; gap: 6px; }
  .ka-summary-row { flex-direction: column; gap: 2px; }
  .ka-summary-label { min-width: unset; }
  .ka-summary-value { text-align: left; }
}
body.ka-wizard-page .site-header,body.ka-wizard-page .site-footer,body.ka-wizard-page .ka-header,body.ka-wizard-page header:not(.kaw-header) { display: none !important; }
@media print { .kaw-header,.kaw-footer { display: none !important; } #ka-wizard { min-height: auto; } }"""


def find_js_string_end(src, start_quote_pos):
    """Find the end of a JS single-quoted string, handling escapes."""
    i = start_quote_pos + 1
    while i < len(src):
        if src[i] == '\\':
            i += 2  # skip escaped char
            continue
        if src[i] == "'":
            return i
        i += 1
    return -1


def replace_css_block(src):
    """Replace css.textContent='...' with new CSS, using string parsing."""
    marker = "css.textContent='"
    idx = src.find(marker)
    if idx < 0:
        return src
    start_q = idx + len(marker) - 1  # position of opening quote
    end_q = find_js_string_end(src, start_q)
    if end_q < 0:
        return src
    # Find the semicolon after the closing quote
    rest = src[end_q+1:end_q+5]
    semi_offset = rest.find(';')
    end_pos = end_q + 1 + (semi_offset if semi_offset >= 0 else 0) + 1

    # Escape the new CSS for JS single-quoted string
    escaped = NEW_CSS_RAW.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
    new_line = f"css.textContent='{escaped}';"

    return src[:idx] + new_line + src[end_pos:]


def transform_wizard(src, info):
    name = info['name']
    step_labels = info['step_labels']
    main_id = info.get('main_id', 'pf-main')
    root_id = info.get('root_id', 'pf')

    result = src

    # 1. Replace CSS injection
    result = replace_css_block(result)

    # 2. Add body class for hiding WP elements
    if "ka-wizard-page" not in result:
        result = result.replace(
            "document.head.appendChild(css);",
            "document.head.appendChild(css);\n  document.body.classList.add('ka-wizard-page');"
        )

    # 3. Replace renderProgress function
    step_labels_js = '[' + ','.join(f"'{l}'" for l in step_labels) + ']'
    new_progress = f"""function renderProgress(){{
  var labels={step_labels_js};
  var curStep=typeof S!=='undefined'?S.step:0;
  var pct=Math.round((curStep/Math.max(1,labels.length-1))*100);
  var pills=labels.map(function(l,i){{
    var cls='kaw-step';
    if(i<curStep) cls+=' done';
    if(i===curStep) cls+=' active';
    return '<div class="'+cls+'">'+esc(l)+'</div>';
  }}).join('');
  return '<div class="kaw-steps" id="kaw-steps">'+pills+'</div>'
    +'<div class="kaw-progress-bar"><div class="kaw-progress-fill" id="kaw-progress" style="width:'+pct+'%"></div></div>';
}}"""

    # Find and replace renderProgress function using string search
    rp_start = result.find('function renderProgress()')
    if rp_start >= 0:
        # Find the matching closing brace
        brace_count = 0
        i = result.index('{', rp_start)
        while i < len(result):
            if result[i] == '{': brace_count += 1
            elif result[i] == '}':
                brace_count -= 1
                if brace_count == 0:
                    result = result[:rp_start] + new_progress + result[i+1:]
                    break
            i += 1

    # 4. Replace render function's skeleton creation
    # Find the render function and replace the hero + skeleton
    render_start = result.find('function render()')
    if render_start >= 0:
        # Find root.innerHTML = ... pattern within render()
        search_area_start = render_start
        # Look for the innerHTML assignment
        innerHTML_pattern = "root.innerHTML = '<div class=\"ka-wizard\">"
        innerHTML_pattern2 = "root.innerHTML='<div class=\"ka-wizard\">"
        innerHTML_idx = result.find(innerHTML_pattern, search_area_start)
        if innerHTML_idx < 0:
            innerHTML_idx = result.find(innerHTML_pattern2, search_area_start)

        if innerHTML_idx >= 0:
            # Find the end of this statement (the semicolon after the string concatenation)
            # We need to find where the main div placeholder is and replace everything up to there
            main_placeholder = f"'<div id=\"{main_id}\"></div>'"
            main_idx = result.find(main_placeholder, innerHTML_idx)
            if main_idx >= 0:
                # Find the semicolon after the closing
                end_idx = result.find(';', main_idx + len(main_placeholder))
                if end_idx >= 0:
                    # Also look for the hero variable definition above innerHTML
                    hero_var_start = result.rfind("var hero = '", render_start, innerHTML_idx)
                    if hero_var_start < 0:
                        hero_var_start = result.rfind("var hero='", render_start, innerHTML_idx)

                    replace_start = hero_var_start if hero_var_start >= 0 else innerHTML_idx

                    new_skeleton = """root.innerHTML='<header class="kaw-header">'
    +'<a href="/" class="kaw-logo">\\u2190 Koch Aufforstung</a>'
    +renderProgress()
    +'</header>'
    +'<main class="kaw-body" id="kaw-main"></main>'
    +'<footer class="kaw-footer">'
    +'<button class="kaw-btn kaw-btn-back" id="kaw-back" style="visibility:hidden">Zur\\u00fcck</button>'
    +'<div class="kaw-step-label" id="kaw-step-label"></div>'
    +'<button class="kaw-btn kaw-btn-next" id="kaw-next">Weiter</button>'
    +'</footer>';"""

                    result = result[:replace_start] + new_skeleton + result[end_idx+1:]

    # 5. Replace getElementById references
    result = result.replace(f"getElementById('{main_id}')", "getElementById('kaw-main')")
    result = result.replace(f'getElementById("{main_id}")', "getElementById('kaw-main')")

    # Replace root element lookup (but NOT in css.textContent or other strings)
    # Only replace in actual JS code, not in HTML strings
    result = result.replace(f"getElementById('{root_id}')", "getElementById('ka-wizard')")
    result = result.replace(f'getElementById("{root_id}")', "getElementById('ka-wizard')")

    # 6. Add footer nav update after each render
    # Find where render() does the switch statement and add footer update after
    # We add a separate function and call it after render
    footer_update = """
// ── kaw-footer nav sync ──
function kawSyncFooter(){
  var _b=document.getElementById('kaw-back');
  var _n=document.getElementById('kaw-next');
  var _l=document.getElementById('kaw-step-label');
  if(_b) _b.style.visibility=(S.step<=0)?'hidden':'visible';
  if(_l) _l.textContent='Schritt '+(S.step+1)+' von '+TOTAL_STEPS;
  if(_b){_b.onclick=function(){if(S.step>0)go(S.step-1);};}
  // Next button: find the primary button in the step content and delegate
  if(_n){_n.onclick=function(){
    var btns=document.querySelectorAll('#kaw-main .ka-btn-primary, #kaw-main [id^="n"]');
    for(var i=0;i<btns.length;i++){
      var b=btns[i];
      if(b.tagName==='BUTTON'&&b.offsetParent!==null&&!b.disabled){b.click();return;}
    }
    // Fallback: go to next step
    if(S.step<TOTAL_STEPS-1) go(S.step+1);
  };}
  // Update progress pills
  var sp=document.getElementById('kaw-steps');
  if(sp) sp.innerHTML=renderProgress().replace(/<div class="kaw-progress-bar">.*<\\/div>/,'');
  var pb=document.getElementById('kaw-progress');
  if(pb) pb.style.width=Math.round((S.step/Math.max(1,TOTAL_STEPS-1))*100)+'%';
}
"""

    # Insert kawSyncFooter function before the render function
    if 'kawSyncFooter' not in result:
        render_pos = result.find('function render()')
        if render_pos >= 0:
            result = result[:render_pos] + footer_update + '\n' + result[render_pos:]

    # Add kawSyncFooter() call at the end of go() function
    go_pattern = "function go("
    go_idx = result.find(go_pattern)
    if go_idx >= 0:
        # Find the render() call inside go()
        render_call = result.find("render();", go_idx)
        if render_call >= 0 and render_call < go_idx + 500:
            # Add kawSyncFooter after render
            insert_pos = render_call + len("render();")
            if "kawSyncFooter" not in result[render_call:render_call+100]:
                result = result[:insert_pos] + " kawSyncFooter();" + result[insert_pos:]

    # Also call kawSyncFooter after initial render in DOMContentLoaded
    dom_ready = result.find("render();")
    if dom_ready >= 0:
        # Only add once after the first render call that's NOT inside go()
        if "kawSyncFooter" not in result[dom_ready:dom_ready+80]:
            result = result[:dom_ready+len("render();")] + " try{kawSyncFooter();}catch(e){}" + result[dom_ready+len("render();"):]

    return result


# ── Wizard configurations ──
WIZARDS = {
    'pflanzung': {
        'name': 'pflanzung',
        'title': 'Pflanzung anfragen',
        'subtitle': 'Professionelle Aufforstung mit zertifiziertem Pflanzgut',
        'step_labels': ['Besitzer', 'Pflanzen', 'Lieferort', u'Fl\u00e4che', u'F\u00f6rderung', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'pflanzung-wizard-v6.js',
        'dst': 'pflanzung-wizard-v7.js',
    },
    'flaechenvorbereitung': {
        'name': 'flaechenvorbereitung',
        'title': u'Fl\u00e4chenvorbereitung anfragen',
        'subtitle': u'Professionelle Freihaltung und Vorbereitung Ihrer Waldfl\u00e4chen',
        'step_labels': ['Besitzer', 'Standort', u'Fl\u00e4chen', u'Ma\u00dfnahmen', 'Zeitraum', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'flaechenvorbereitung-wizard-v5.js',
        'dst': 'flaechenvorbereitung-wizard-v6.js',
    },
    'kulturschutz': {
        'name': 'kulturschutz',
        'title': 'Kulturschutz anfragen',
        'subtitle': 'Schutz Ihrer Kulturen vor Wildverbiss, Unkraut und Sch\u00e4dlingen',
        'step_labels': ['Besitzer', 'Standort', u'Fl\u00e4chen', 'Schutz', 'Zeitraum', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'kulturschutz-wizard-v5.js',
        'dst': 'kulturschutz-wizard-v6.js',
    },
    'pflege': {
        'name': 'pflege',
        'title': 'Pflege anfragen',
        'subtitle': 'Professionelle Kultur- und Jungbestandspflege',
        'step_labels': ['Besitzer', 'Standort', u'Fl\u00e4chen', 'Pflege', 'Zeitraum', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'pflege-wizard-v5.js',
        'dst': 'pflege-wizard-v6.js',
    },
    'zaunbau': {
        'name': 'zaunbau',
        'title': 'Zaunbau anfragen',
        'subtitle': u'Professioneller Wildschutzzaun f\u00fcr Ihre Waldfl\u00e4chen',
        'step_labels': ['Besitzer', 'Standort', 'Abschnitte', 'Material', 'Zeitraum', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'zaunbau-wizard-v4.js',
        'dst': 'zaunbau-wizard-v5.js',
    },
    'saatguternte': {
        'name': 'saatguternte',
        'title': 'Saatguternte anfragen',
        'subtitle': 'Professionelle Ernte von forstlichem Vermehrungsgut',
        'step_labels': ['Besitzer', 'Standort', 'Standorte', 'Baumarten', 'Zeitraum', 'Kontakt'],
        'main_id': 'sg-main',
        'root_id': 'sg',
        'src': 'saatguternte-wizard-v5.js',
        'dst': 'saatguternte-wizard-v6.js',
    },
    'pflanzenbeschaffung': {
        'name': 'pflanzenbeschaffung',
        'title': 'Pflanzenbeschaffung anfragen',
        'subtitle': 'Zertifiziertes Pflanzgut von unseren Partnerbaumschulen',
        'step_labels': ['Besitzer', 'Standort', 'Baumarten', u'Qualit\u00e4t', 'Zeitraum', 'Kontakt'],
        'main_id': 'pf-main',
        'root_id': 'pf',
        'src': 'pflanzenbeschaffung-wizard-v5.js',
        'dst': 'pflanzenbeschaffung-wizard-v6.js',
    },
}

if __name__ == '__main__':
    target = sys.argv[1] if len(sys.argv) > 1 else 'all'
    wizards_to_process = WIZARDS if target == 'all' else {target: WIZARDS[target]}

    for key, info in wizards_to_process.items():
        src_path = info['src']
        dst_path = info['dst']
        if not os.path.exists(src_path):
            print(f"SKIP: {src_path} not found")
            continue
        with open(src_path, 'r') as f:
            src = f.read()
        result = transform_wizard(src, info)
        with open(dst_path, 'w') as f:
            f.write(result)
        # Verify key elements
        checks = {
            'kaw-header': 'kaw-header' in result,
            'kaw-footer': 'kaw-footer' in result,
            'kaw-main': 'kaw-main' in result,
            'old-pf-main': f"'{main_id}'" not in result if (main_id := info.get('main_id','pf-main')) else True,
            'new-css': '--kaw-bg: #fff8f2' in result,
            'kawSyncFooter': 'kawSyncFooter' in result,
        }
        status = 'OK' if all(checks.values()) else 'WARN'
        failed = [k for k,v in checks.items() if not v]
        print(f"{status}: {src_path} -> {dst_path} ({len(result)} bytes)" + (f" [missing: {','.join(failed)}]" if failed else ""))
