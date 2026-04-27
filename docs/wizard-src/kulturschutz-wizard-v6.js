(function(){
'use strict';
// ── Stitch Design System Self-Loader ──────────────────────────────────────
(function kaStitchLoader(){
  if(document.getElementById('ka-stitch-css')) return;
  var css=document.createElement('style');
  css.id='ka-stitch-css';
  css.textContent='@import url(\'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap\');\n@import url(\'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0\');\n\n:root {\n  --kaw-bg: #fff8f2;\n  --kaw-forest: #012d1d;\n  --kaw-forest-2: #1b4332;\n  --kaw-accent: #A3E635;\n  --kaw-on-surface: #1d1b18;\n  --kaw-muted: #717973;\n  --kaw-outline: #c1c8c2;\n  --kaw-container: #f3ede7;\n  --kaw-error: #ba1a1a;\n  --kaw-white: #ffffff;\n}\n\n#ka-wizard, #ka-wizard * { box-sizing: border-box; font-family: \'Manrope\', -apple-system, sans-serif; }\n#ka-wizard { background: var(--kaw-bg); min-height: 100vh; display: flex; flex-direction: column; }\n\n.kaw-header { position: sticky; top: 0; z-index: 100; background: var(--kaw-forest); color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 16px; flex-direction: column; }\n.kaw-logo { color: rgba(255,255,255,0.7); font-size: 13px; text-decoration: none; align-self: flex-start; }\n.kaw-logo:hover { color: #fff; }\n.kaw-steps { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }\n.kaw-step { display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; cursor: default; background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); border: 1.5px solid transparent; transition: all 0.2s; }\n.kaw-step.done { background: rgba(163,230,53,0.15); color: rgba(255,255,255,0.75); }\n.kaw-step.done::before { content: \'\\2713\'; margin-right: 4px; color: var(--kaw-accent); }\n.kaw-step.active { background: rgba(163,230,53,0.2); color: #fff; border-color: var(--kaw-accent); }\n.kaw-progress-bar { width: 100%; height: 3px; background: rgba(255,255,255,0.15); border-radius: 9999px; }\n.kaw-progress-fill { height: 100%; background: var(--kaw-accent); border-radius: 9999px; transition: width 0.4s ease; }\n\n.kaw-body { flex: 1; padding: 32px 24px 120px; max-width: 800px; margin: 0 auto; width: 100%; }\n\n.kaw-step-header { margin-bottom: 32px; }\n.kaw-step-title { font-size: 24px; font-weight: 700; color: var(--kaw-forest); line-height: 1.3; }\n.kaw-step-subtitle { font-size: 15px; color: var(--kaw-muted); margin-top: 8px; }\n\n.kaw-footer { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(255,248,242,0.97); backdrop-filter: blur(8px); border-top: 1px solid var(--kaw-outline); padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; z-index: 200; }\n.kaw-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; border: none; cursor: pointer; font-family: \'Manrope\', sans-serif; transition: all 0.15s; min-width: 100px; min-height: 44px; }\n.kaw-btn-back { background: transparent; border: 2px solid var(--kaw-outline); color: var(--kaw-on-surface); }\n.kaw-btn-back:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }\n.kaw-btn-next { background: var(--kaw-accent); color: var(--kaw-forest); }\n.kaw-btn-next:hover { background: #8fce00; }\n.kaw-btn-next:disabled { background: var(--kaw-outline); color: #fff; cursor: not-allowed; }\n.kaw-step-label { font-size: 13px; color: var(--kaw-muted); font-weight: 500; }\n\n.kaw-success { text-align: center; padding: 60px 24px; }\n.kaw-success-icon { font-size: 64px; margin-bottom: 24px; }\n.kaw-success-title { font-size: 28px; font-weight: 700; color: var(--kaw-forest); margin-bottom: 12px; }\n.kaw-success-text { font-size: 16px; color: var(--kaw-muted); max-width: 500px; margin: 0 auto; line-height: 1.6; }\n\n/* COMPAT — keep old ka-* classes working */\n.ka-field { margin-bottom: 20px; position: relative; }\n.ka-label { display: block; font-size: 13px; font-weight: 700; color: var(--kaw-on-surface); margin-bottom: 6px; letter-spacing: 0.02em; }\n.ka-label-optional { color: var(--kaw-muted); font-size: 11px; font-weight: 400; }\n.ka-hint { font-size: 12px; color: var(--kaw-muted); margin-top: 4px; }\n.ka-inp { width: 100%; padding: 12px 14px; font-size: 15px; font-family: \'Manrope\', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; }\n.ka-inp:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }\n.ka-inp::placeholder { color: var(--kaw-muted); }\n.ka-select { width: 100%; padding: 12px 14px; font-size: 15px; font-family: \'Manrope\', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; cursor: pointer; -webkit-appearance: none; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23717973\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }\n.ka-select:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }\n.ka-textarea { width: 100%; padding: 12px 14px; font-size: 15px; font-family: \'Manrope\', sans-serif; border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; resize: vertical; min-height: 80px; box-sizing: border-box; }\n.ka-textarea:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }\n.ka-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }\n.ka-grid-3 { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; }\n.ka-grid-auto { display: grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap: 12px; }\n@media(max-width:520px){ .ka-grid-2,.ka-grid-3 { grid-template-columns: 1fr; } }\n.ka-cards { display: grid; grid-template-columns: repeat(auto-fill,minmax(200px,1fr)); gap: 12px; }\n.ka-cards-stacked { display: flex; flex-direction: column; gap: 12px; }\n.ka-card { background: transparent; border-radius: 0; box-shadow: none; overflow: visible; margin: 0; max-width: 100%; }\n.ka-card-header { padding: 0 0 16px; }\n.ka-card-header h2 { margin: 0 0 8px; font-size: 24px; font-weight: 700; color: var(--kaw-forest); line-height: 1.3; }\n.ka-card-header p { margin: 0; font-size: 15px; color: var(--kaw-muted); line-height: 1.5; }\n.ka-card-body { padding: 0; }\n.ka-card-footer { display: none; }\n.ka-card-option { padding: 20px 16px; border: 2px solid var(--kaw-outline); border-radius: 12px; cursor: pointer; transition: all 0.15s; background: var(--kaw-white); text-align: left; position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: 8px; }\n.ka-card-option:hover { border-color: var(--kaw-forest-2); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(27,67,50,0.12); }\n.ka-card-option.selected { border-color: var(--kaw-forest); background: #f0f7f0; }\n.ka-card-option.selected::after { content: \'\\2713\'; position: absolute; top: 10px; right: 10px; width: 22px; height: 22px; background: var(--kaw-accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--kaw-forest); font-size: 13px; font-weight: 700; }\n.ka-card-icon { font-size: 28px; }\n.ka-card-name { font-size: 14px; font-weight: 700; color: var(--kaw-on-surface); }\n.ka-card-option.selected .ka-card-name { color: var(--kaw-forest); }\n.ka-card-sub { font-size: 12px; color: var(--kaw-muted); margin-top: 2px; }\n.ka-card-desc { font-size: 12px; color: var(--kaw-muted); line-height: 1.4; margin-top: 6px; }\n.ka-card-price { font-size: 12px; color: var(--kaw-forest); font-weight: 600; margin-top: 6px; }\n.ka-chips { display: flex; flex-wrap: wrap; gap: 8px; }\n.ka-chip { padding: 8px 16px; border-radius: 9999px; border: 2px solid var(--kaw-outline); background: var(--kaw-white); cursor: pointer; font-size: 13px; font-weight: 500; color: var(--kaw-on-surface); transition: all 0.15s; font-family: \'Manrope\', sans-serif; }\n.ka-chip:hover { border-color: var(--kaw-forest-2); }\n.ka-chip.selected { border-color: var(--kaw-forest); background: #f0f7f0; font-weight: 700; color: var(--kaw-forest); }\n.ka-toggles { display: flex; gap: 8px; flex-wrap: wrap; }\n.ka-toggle { padding: 10px 18px; border-radius: 8px; border: 2px solid var(--kaw-outline); background: var(--kaw-white); cursor: pointer; font-size: 13px; font-weight: 500; color: var(--kaw-on-surface); transition: all 0.15s; font-family: \'Manrope\', sans-serif; text-align: center; }\n.ka-toggle:hover { border-color: var(--kaw-forest-2); }\n.ka-toggle.selected { border-color: var(--kaw-forest); background: #f0f7f0; font-weight: 700; color: var(--kaw-forest); }\n.ka-toggle-sub { display: block; font-size: 10px; font-weight: 400; color: var(--kaw-muted); margin-top: 2px; }\n.ka-toggle.selected .ka-toggle-sub { color: var(--kaw-forest); }\n.ka-radio-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 2px solid var(--kaw-outline); border-radius: 12px; background: var(--kaw-white); cursor: pointer; transition: all 0.15s; }\n.ka-radio-card:hover { border-color: var(--kaw-forest-2); }\n.ka-radio-card.selected { border-color: var(--kaw-forest); background: #f0f7f0; }\n.ka-radio-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--kaw-outline); background: transparent; flex-shrink: 0; margin-top: 2px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }\n.ka-radio-card.selected .ka-radio-dot { border-color: var(--kaw-forest); background: var(--kaw-forest); }\n.ka-radio-dot-inner { width: 8px; height: 8px; border-radius: 50%; background: #fff; display: none; }\n.ka-radio-card.selected .ka-radio-dot-inner { display: block; }\n.ka-radio-label { font-size: 14px; font-weight: 600; color: var(--kaw-on-surface); }\n.ka-radio-card.selected .ka-radio-label { color: var(--kaw-forest); }\n.ka-radio-desc { font-size: 12px; color: var(--kaw-muted); margin-top: 2px; }\n.ka-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 700; font-family: \'Manrope\', sans-serif; cursor: pointer; transition: all 0.15s; border: none; text-decoration: none; white-space: nowrap; min-height: 44px; min-width: 44px; }\n.ka-btn-primary { background: var(--kaw-accent); color: var(--kaw-forest); }\n.ka-btn-primary:hover { background: #8fce00; }\n.ka-btn-primary:disabled { background: var(--kaw-outline); color: #fff; cursor: not-allowed; }\n.ka-btn-secondary { background: transparent; color: var(--kaw-on-surface); border: 2px solid var(--kaw-outline); }\n.ka-btn-secondary:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }\n.ka-btn-gold { background: var(--kaw-accent); color: var(--kaw-forest); }\n.ka-btn-gold:hover { background: #8fce00; }\n.ka-btn-ghost { background: transparent; color: var(--kaw-forest); padding: 8px 16px; }\n.ka-btn-ghost:hover { background: rgba(1,45,29,0.04); }\n.ka-btn-sm { padding: 8px 16px; font-size: 13px; min-height: 36px; }\n.ka-btn-block { display: block; width: 100%; text-align: center; }\n.ka-qty { display: flex; align-items: center; gap: 6px; }\n.ka-qty-btn { width: 34px; height: 34px; border-radius: 50%; border: 2px solid var(--kaw-outline); background: var(--kaw-white); font-size: 18px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--kaw-muted); transition: all 0.15s; }\n.ka-qty-btn:hover { border-color: var(--kaw-forest); color: var(--kaw-forest); }\n.ka-qty-input { width: 70px; text-align: center; border: 2px solid var(--kaw-outline); border-radius: 8px; padding: 6px; font-size: 15px; font-weight: 600; font-family: \'Manrope\', sans-serif; color: var(--kaw-on-surface); }\n.ka-nav { display: none; }\n.ka-info-box { padding: 14px 16px; border-radius: 8px; font-size: 13px; line-height: 1.6; margin-bottom: 16px; }\n.ka-info-box.info { background: #f0f7ff; border-left: 3px solid #3b82f6; color: #1e40af; }\n.ka-info-box.warn { background: #fff8e1; border-left: 3px solid #d97706; color: #012d1d; }\n.ka-info-box.success { background: #e8f5e8; border-left: 3px solid #2d7a2d; color: #166534; }\n.ka-info-box.error { background: #fef2f2; border-left: 3px solid var(--kaw-error); color: #991b1b; }\n.ka-info-box.brand { background: var(--kaw-container); border-left: 3px solid var(--kaw-forest); color: var(--kaw-forest); }\n.ka-info-box strong { font-weight: 700; }\n.ka-err { color: var(--kaw-error); font-size: 13px; margin-top: 8px; display: none; }\n.ka-err:not(:empty) { display: block; }\n.ka-price-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg,var(--kaw-container),rgba(163,230,53,0.08)); border: 2px solid rgba(1,45,29,0.15); border-radius: 12px; margin-top: 14px; gap: 12px; }\n.ka-price-box span { font-size: 13px; color: var(--kaw-forest); line-height: 1.4; }\n.ka-price-box strong { font-size: 18px; color: var(--kaw-on-surface); font-weight: 800; white-space: nowrap; }\n.ka-tag { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; background: #f0f7f0; color: var(--kaw-forest); border-radius: 16px; font-size: 12px; font-weight: 600; border: 1px solid rgba(1,45,29,0.15); margin: 2px; }\n.ka-summary { background: var(--kaw-container); border-radius: 12px; border: 1px solid var(--kaw-outline); padding: 24px; margin-bottom: 18px; }\n.ka-summary-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--kaw-muted); margin-bottom: 12px; }\n.ka-summary-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; padding: 9px 0; border-bottom: 1px solid var(--kaw-outline); font-size: 14px; }\n.ka-summary-row:last-child { border-bottom: none; }\n.ka-summary-label { color: var(--kaw-muted); flex-shrink: 0; min-width: 130px; font-size: 12px; font-weight: 600; }\n.ka-summary-value { text-align: right; word-break: break-word; }\n.ka-flaeche { background: var(--kaw-container); border: 2px solid var(--kaw-outline); border-radius: 12px; padding: 20px; margin-bottom: 16px; transition: all 0.15s; }\n.ka-flaeche-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }\n.ka-flaeche-title { font-size: 14px; font-weight: 700; color: var(--kaw-on-surface); }\n.ka-flaeche-del { background: none; border: none; color: var(--kaw-error); cursor: pointer; font-size: 13px; font-weight: 600; padding: 4px 8px; min-height: 36px; }\n.ka-add-btn { width: 100%; padding: 14px; border: 2px dashed var(--kaw-outline); border-radius: 8px; background: rgba(1,45,29,0.02); color: var(--kaw-forest); cursor: pointer; font-size: 14px; font-weight: 600; margin-bottom: 16px; transition: all 0.15s; font-family: \'Manrope\', sans-serif; min-height: 52px; display: flex; align-items: center; justify-content: center; gap: 8px; }\n.ka-add-btn:hover { border-color: var(--kaw-forest); background: rgba(1,45,29,0.04); }\n.ka-check-card { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border: 2px solid var(--kaw-outline); border-radius: 10px; cursor: pointer; background: var(--kaw-white); margin-bottom: 10px; transition: all 0.15s; }\n.ka-check-card:hover { border-color: var(--kaw-forest-2); }\n.ka-check-card.selected { border-color: var(--kaw-forest); background: #f0f7f0; }\n.ka-check-card input[type="checkbox"],.ka-check-card input[type="radio"] { width: 18px; height: 18px; accent-color: var(--kaw-forest); flex-shrink: 0; margin-top: 2px; }\n.ka-gps-row { display: flex; gap: 8px; align-items: center; }\n.ka-gps-row input { flex: 1; }\n.ka-gps-btn { padding: 8px 16px; background: #e8f5e9; color: #1b4332; border: none; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; white-space: nowrap; transition: all 0.15s; font-family: \'Manrope\', sans-serif; min-height: 44px; }\n.ka-gps-btn:hover { background: #c8e6c9; }\n.ka-gps-info { font-size: 11px; color: var(--kaw-muted); margin-top: 3px; }\n.ka-gps-maps-link { display: inline-flex; align-items: center; gap: 6px; margin-top: 6px; padding: 6px 12px; background: rgba(1,45,29,0.04); border: 1px solid var(--kaw-outline); border-radius: 8px; color: var(--kaw-forest); font-size: 12px; font-weight: 600; text-decoration: none; transition: all 0.15s; }\n.ka-gps-maps-link:hover { background: rgba(1,45,29,0.08); }\n.ka-foerder-box { margin-top: 16px; padding: 16px; background: var(--kaw-container); border-radius: 12px; border: 1px solid var(--kaw-outline); }\n.ka-foerder-title { font-size: 15px; font-weight: 700; color: var(--kaw-forest); margin-bottom: 8px; }\n.ka-foerder-prog { padding: 10px 12px; background: var(--kaw-white); border-radius: 8px; border: 1px solid var(--kaw-outline); margin-bottom: 8px; }\n.ka-foerder-prog-name { font-size: 13px; font-weight: 700; color: var(--kaw-on-surface); }\n.ka-foerder-prog-rate { font-size: 12px; color: var(--kaw-forest); font-weight: 600; margin-top: 2px; }\n.ka-foerder-prog-desc { font-size: 11px; color: var(--kaw-muted); margin-top: 3px; }\n.ka-success { text-align: center; padding: 60px 24px; }\n.ka-success-icon { font-size: 64px; margin-bottom: 24px; }\n.ka-success h2 { font-size: 28px; font-weight: 700; color: var(--kaw-forest); margin: 0 0 12px; }\n.ka-success p { font-size: 16px; color: var(--kaw-muted); margin: 0 0 20px; line-height: 1.6; }\n.ka-success-card { background: var(--kaw-container); border: 2px solid var(--kaw-forest); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }\n.ka-success-hint { background: rgba(163,230,53,0.08); border: 2px solid var(--kaw-accent); border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }\n.ka-suggest-dropdown { position: absolute; z-index: 1000; background: var(--kaw-white); border: 1.5px solid var(--kaw-outline); border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); max-height: 200px; overflow-y: auto; width: 100%; display: none; }\n.ka-suggest-dropdown.open { display: block; }\n.ka-suggest-item { padding: 10px 14px; font-size: 14px; cursor: pointer; transition: background 0.1s; }\n.ka-suggest-item:hover { background: var(--kaw-container); }\n.ka-suggest-item.active { background: #f0f7f0; color: var(--kaw-forest); font-weight: 600; }\n.ka-accordion-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; background: var(--kaw-container); border: 2px solid var(--kaw-outline); border-radius: 12px; cursor: pointer; transition: all 0.15s; margin-bottom: 2px; }\n.ka-accordion-header:hover { background: rgba(1,45,29,0.04); }\n.ka-accordion-body { display: none; padding: 16px; border: 2px solid var(--kaw-outline); border-top: none; border-radius: 0 0 12px 12px; }\n.ka-accordion-body.open { display: block; }\n.ka-map { width: 100%; height: 0; border-radius: 8px; border: none; margin-bottom: 0; overflow: hidden; display: none; }\n.ka-dsgvo { font-size: 12px; color: var(--kaw-muted); margin-top: 16px; line-height: 1.5; }\n.ka-dsgvo a { color: var(--kaw-forest); }\n.ka-field-error { color: var(--kaw-error); font-size: 12px; margin-top: 4px; display: none; }\n.ka-field-error.visible { display: block; }\n.ka-inp.error,.ka-select.error { border-color: var(--kaw-error) !important; }\n.ka-autosave-badge { font-size: 11px; color: #888; padding: 2px 6px; background: rgba(1,45,29,0.06); border-radius: 4px; display: inline-block; margin-left: 8px; }\n.ka-retry-btn { margin-top: 8px; padding: 10px 20px; background: var(--kaw-forest); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; min-height: 44px; }\n/* pf-* compat */\n.pf-card { background: transparent; }\n.pf-hd { margin-bottom: 24px; }\n.pf-hd h2 { font-size: 24px; font-weight: 700; color: var(--kaw-forest); margin: 0 0 8px; line-height: 1.3; }\n.pf-hd p { font-size: 15px; color: var(--kaw-muted); margin: 0; }\n.pf-body { padding: 0; }\n.pf-ft { display: none; }\n.pf-field { margin-bottom: 20px; position: relative; }\n.pf-inp { width: 100%; padding: 12px 14px; font-size: 15px; font-family: \'Manrope\', sans-serif; color: var(--kaw-on-surface); background: var(--kaw-white); border: 2px solid var(--kaw-outline); border-radius: 8px; outline: none; transition: all 0.15s; box-sizing: border-box; }\n.pf-inp:focus { border-color: var(--kaw-forest); box-shadow: 0 0 0 4px rgba(163,230,53,0.15); }\n.pf-btn { display: none; }\n.pf-err { color: var(--kaw-error); font-size: 13px; margin-top: 8px; display: none; }\n.pf-err:not(:empty) { display: block; }\n.pf-sum-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--kaw-outline); font-size: 14px; }\n.pf-sum-row:last-child { border-bottom: none; }\n.pf-sum-lbl { color: var(--kaw-muted); }\n.pf-price-box { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: linear-gradient(135deg,var(--kaw-container),rgba(163,230,53,0.08)); border: 2px solid rgba(1,45,29,0.15); border-radius: 12px; margin-top: 14px; gap: 12px; }\n.pf-price-box span { font-size: 13px; color: var(--kaw-forest); line-height: 1.4; }\n.pf-price-box strong { font-size: 18px; color: var(--kaw-on-surface); font-weight: 800; white-space: nowrap; }\n.pf-ok { text-align: center; padding: 60px 24px; }\ninput[type=\'radio\'],input[type=\'checkbox\'] { width: 20px; height: 20px; cursor: pointer; }\nlabel { cursor: pointer; }\n.ka-inp:focus-visible,.ka-select:focus-visible,.ka-textarea:focus-visible,.ka-btn:focus-visible,.pf-inp:focus-visible,input[type=\'radio\']:focus-visible,input[type=\'checkbox\']:focus-visible { outline: 2px solid var(--kaw-forest); outline-offset: 2px; }\n@media (max-width: 640px) {\n  .kaw-body { padding: 24px 16px 120px; }\n  .kaw-step-label { display: none; }\n  .kaw-steps { gap: 4px; }\n  .kaw-step { padding: 4px 10px; font-size: 12px; }\n  .ka-grid-2,.ka-grid-3 { grid-template-columns: 1fr; }\n  .ka-cards { grid-template-columns: 1fr; }\n  .ka-price-box,.pf-price-box { flex-direction: column; text-align: center; gap: 6px; }\n  .ka-summary-row { flex-direction: column; gap: 2px; }\n  .ka-summary-label { min-width: unset; }\n  .ka-summary-value { text-align: left; }\n}\nbody.ka-wizard-page .site-header,body.ka-wizard-page .site-footer,body.ka-wizard-page .ka-header,body.ka-wizard-page header:not(.kaw-header) { display: none !important; }\n@media print { .kaw-header,.kaw-footer { display: none !important; } #ka-wizard { min-height: auto; } }';
  document.head.appendChild(css);
  var f=document.createElement('link');
  f.rel='stylesheet';
  f.href='https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap';
  document.head.appendChild(f);
  var m=document.createElement('link');
  m.rel='stylesheet';
  m.href='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
  document.head.appendChild(m);
})();

// ── PLZ Smart Suggest ─────────────────────────────────────────────────────
window.bindPlzAutocomplete = window.bindPlzAutocomplete || function(plzInput, ortInput, forstamtInput) {
  if(!plzInput || !ortInput) return;
  var timeout = null;
  plzInput.addEventListener('input', function(){
    var plz = this.value.trim();
    if(timeout) clearTimeout(timeout);
    if(plz.length < 4) return;
    timeout = setTimeout(function(){
      fetch('https://openplzapi.org/de/Localities?postalCode=' + encodeURIComponent(plz))
        .then(function(r){ return r.json(); })
        .then(function(data){
          if(data && data.length > 0){
            var best = data[0];
            if(ortInput && !ortInput.value) ortInput.value = best.name || '';
            if(ortInput) ortInput.dispatchEvent(new Event('input',{bubbles:true}));
          }
        })
        .catch(function(){});
      if(forstamtInput && !forstamtInput.value){
        fetch('https://ka-forstmanager.vercel.app/api/public/forstamt?plz=' + encodeURIComponent(plz))
          .then(function(r){ return r.json(); })
          .then(function(data){
            if(data && data.length > 0){
              forstamtInput.value = data[0].name || data[0].forstamt || '';
              forstamtInput.dispatchEvent(new Event('input',{bubbles:true}));
            }
          })
          .catch(function(){});
      }
    }, 300);
  });
};





// ── Baumarten (9 Arten) ────────────────────────────────────────────────────────
var TREES = [
  {k:'rotbuche',     name:'Rotbuche'},
  {k:'stieleiche',   name:'Stieleiche'},
  {k:'traubeneiche', name:'Traubeneiche'},
  {k:'bergahorn',    name:'Bergahorn'},
  {k:'douglasie',    name:'Douglasie'},
  {k:'weisstanne',   name:'Weißtanne'},
  {k:'waldkiefer',   name:'Waldkiefer'},
  {k:'haselnuss',    name:'Haselnuss'},
  {k:'weissdorn',    name:'Weißdorn'},
];

// ── Schutzarten ────────────────────────────────────────────────────────────────
var SCHUTZARTEN = [
  {
    k: 'einzelschutz',
    ico: '🌱',
    name: 'Einzelschutz',
    sub: 'Wuchshüllen / Dreibockschutz',
    pros: ['✅ Günstiger bei kleinen Stückzahlen', '✅ Keine Zaunpflege nötig', '✅ Sichtschutz gegen Verbiss', '✅ Förderfähig in den meisten Bundesländern'],
    cons: ['⚠️ Arbeitsintensiv bei Montage', '⚠️ Kunststoff muss nach 5–7 Jahren entfernt werden', '⚠️ Kein Schutz gegen Schermäuse'],
    szenarien: 'Optimal bei < 3.000 Pflanzen, wertvollen Einzelpflanzen, aufgelockerter Fläche oder schwer zugänglichem Gelände.',
    foerder: 'Förderfähig: WALDFÖPR BY, GAK bundesweit, ELER-Programme der Länder'
  },
  {
    k: 'flaechenschutz',
    ico: '🚧',
    name: 'Flächenschutz',
    sub: 'Zaunbau — Gesamtfläche einzäunen',
    pros: ['✅ Schutz für alle Pflanzen gleichzeitig', '✅ Wirtschaftlich ab ca. 3.000 Pflanzen', '✅ Kein Einzelschutz nötig', '✅ Auch gegen Hase wirksam'],
    cons: ['⚠️ Höhere Investitionskosten', '⚠️ Regelmäßige Zaunkontrolle nötig', '⚠️ Reparaturen bei Wildschäden'],
    szenarien: 'Empfohlen bei > 3.000 Pflanzen, geschlossenen Flächen, starkem Rehwild-/Rotwilddruck, Förderprojekten.',
    foerder: 'Förderfähig: WALDFÖPR BY (bis 70%), GAK, FöRL NRW, Waldförderung HE, BW, TH'
  },
  {
    k: 'kombiniert',
    ico: '🔀',
    name: 'Kombinierter Schutz',
    sub: 'Teilbereiche Zaun + Einzelschutz für Rest',
    pros: ['✅ Maßgeschneiderter Schutz', '✅ Kosten-Nutzen-optimiert', '✅ Flexibel bei unregelmäßigen Flächen'],
    cons: ['⚠️ Planung aufwändiger', '⚠️ Zwei verschiedene Systeme zu pflegen'],
    szenarien: 'Ideal bei unregelmäßigen Flächen, Hanglagen, gemischtem Wildbesatz oder Teilflächen mit besonders wertvollen Arten.',
    foerder: 'Förderfähig für beide Komponenten separat je nach Landesrichtlinie'
  },
];

// ── Wildarten ──────────────────────────────────────────────────────────────────
var WILDARTEN = [
  {k:'rehwild',    ico:'🦌', name:'Rehwild',    desc:'Verbiss Triebspitzen, Fegeschäden'},
  {k:'rotwild',    ico:'🦌', name:'Rotwild',    desc:'Verbiss + Schälschäden (gefährlichste Art)'},
  {k:'damwild',    ico:'🦌', name:'Damwild',    desc:'Verbiss, regional bedeutsam'},
  {k:'muffelwild', ico:'🐑', name:'Muffelwild', desc:'Verbiss, nur in bestimmten Regionen'},
  {k:'hase',       ico:'🐇', name:'Hase',       desc:'Verbiss an jungen Trieben und Rinde'},
  {k:'schermaus',  ico:'🐭', name:'Schermaus',  desc:'Wurzelschäden, gefährdet Setzlinge'},
];

// ── Waldbesitzertyp ────────────────────────────────────────────────────────────
var BESITZERTYP = [
  {k:'privatperson',   ico:'👤', label:'Privatperson'},
  {k:'personengesell', ico:'👥', label:'Personengesellschaft'},
  {k:'koerperschaft',  ico:'🏛️', label:'Körperschaft d. öffentl. Rechts'},
  {k:'kommunal',       ico:'🏢', label:'Kommunal/Staatlich'},
];

// ── Förderprogramme ────────────────────────────────────────────────────────────
var FOERDER_KS = {
  BY:{progs:[
    {name:'WALDFÖPR Bayern', rate:'Bis 70% (Kleinprivatwald bis 90%)', desc:'Kulturschutz, Zaunbau und Pflanzung förderfähig — Antrag über AELF Bayern', url:'https://www.stmelf.bayern.de/foerderung/index.html'},
    {name:'BaySF — Beratung und Förderung', rate:'Kostenlose Beratung + Fördercheck', desc:'Bayerische Staatsforsten bieten Beratung für private Waldbesitzer', url:'https://www.baysf.de/de/waldbesitzer/waldbesitzer-portal.html'},
  ]},
  HE:{progs:[{name:'Forstförderung Hessen', rate:'Pauschalen je Maßnahme', desc:'Kulturschutz (Zaun, Einzelschutz) förderfähig — Antrag über Landwirtschaftsamt', url:'https://landwirtschaft.hessen.de/landwirtschaft/foerderung'}]},
  NRW:{progs:[{name:'FöRL NRW — Kulturschutz', rate:'Je Maßnahme unterschiedlich', desc:'Zaunbau und Einzelschutz für Wiederaufforstungen förderfähig', url:'https://www.waldbauernlotse.de/massnahmen-im-privat-und-koerperschaftswald'}]},
  BW:{progs:[{name:'Forstförderung BW', rate:'Je nach Richtlinie', desc:'Kulturschutzmaßnahmen förderfähig — Antrag über Regierungspräsidium', url:'https://www.forstbw.de/'}]},
  TH:{progs:[{name:'Waldförderung Thüringen', rate:'Je nach Maßnahme', desc:'Kulturschutz im Rahmen von Wiederbewaldung und Waldumbau', url:'https://umwelt.thueringen.de/themen/wald-und-forstwirtschaft/foerderung'}]},
  DEFAULT:{progs:[{name:'GAK — Gemeinschaftsaufgabe Agrarstruktur', rate:'50–90% je nach Maßnahme und BL', desc:'Bundesweites Rahmenprogramm — Kulturschutz im Rahmen von Waldumbau/Wiederaufforstung', url:'https://www.bmleh.de/DE/Home/home_node.html'}]}
};

// ── Preislogik ─────────────────────────────────────────────────────────────────
function getTotalPflanzenzahl(s){
  var total=0;
  var eo=s.einzelschutzOptionen;
  if(eo){
    if(eo.tubex&&eo.tubex.aktiv) total+=parseInt(eo.tubex.menge)||0;
    if(eo.bio&&eo.bio.aktiv) total+=parseInt(eo.bio.menge)||0;
    if(eo.wunsch&&eo.wunsch.aktiv) total+=parseInt(eo.wunsch.menge)||0;
  }
  return total;
}

function calcPreis(s){
  var ks=s.schutzart, ha=s.flaechenArr?s.flaechenArr.reduce(function(sum,f){return sum+(parseFloat(f.ha)||0);},0):(parseFloat(s.ha)||0);
  var pflanzen=getTotalPflanzenzahl(s);
  var rotwild=s.wildarten.indexOf('rotwild')>-1||s.schaelrisiko;
  var zuschlag=rotwild?1.20:1.00;
  var min=0, max=0, label='';
  if(ks==='einzelschutz'){
    min=pflanzen*1.80*zuschlag; max=pflanzen*2.50*zuschlag;
    label=pflanzen+' Pflanzen × 1,80–2,50 €/Stk.'+(rotwild?' (inkl. +20% Rotwild-Zuschlag)':'');
  } else if(ks==='flaechenschutz'){
    var umfang=Math.round(Math.sqrt(ha)*400);
    min=umfang*5*zuschlag; max=umfang*14*zuschlag;
    label='ca. '+umfang+' m Zaunlänge × 5–14 €/m'+(rotwild?' (inkl. +20% Rotwild-Zuschlag)':'');
  } else if(ks==='kombiniert'){
    var umf2=Math.round(Math.sqrt(ha)*400*0.5);
    var pfl2=Math.round(pflanzen*0.5);
    min=umf2*5*zuschlag+pfl2*1.80*zuschlag; max=umf2*14*zuschlag+pfl2*2.50*zuschlag;
    label='ca. '+umf2+' m Zaun + '+pfl2+' Einzelschutz'+(rotwild?' (inkl. +20% Rotwild-Zuschlag)':'');
  }
  return {min:min, max:max, label:label};
}

// ── Steps ──────────────────────────────────────────────────────────────────────
var STEP_LABELS = ['Besitzertyp','Standort','Schutzart','Konfiguration','Zeitraum','Abschluss'];
var TOTAL_STEPS = 6;

// ── State ──────────────────────────────────────────────────────────────────────
function newFlaeche(id){
  return { id: id||Date.now(), plz:'', ort:'', forstamt:'', revier:'', ha:'', gps:'' };
}
var S = {
  step: 0,
  // Step 0: Waldbesitzertyp
  besitzertyp: '',
  // Step 1: Standort (Multi-Flächen)
  flaechenArr: [newFlaeche(1)],
  treffpunkt: '',
  // Step 2: Schutzart
  schutzart: '',
  // Step 3: Konfiguration
  baumarten: [],
  alterKultur: '',
  einzelschutzOptionen: {
    tubex:  {aktiv:false, menge:'', hoehe:''},
    bio:    {aktiv:false, menge:'', hoehe:''},
    wunsch: {aktiv:false, menge:'', hoehe:'', produktname:''},
  },
  robinienstab: {aktiv:false, menge:''},
  flaechenschutzTyp: '',
  wildarten: [],
  verbissdruck: '',
  schaelrisiko: false,
  // Step 4: Zeitraum
  ausfuehrungszeitraum: '',
  schutzdauer: '',
  wartung: null,
  bemerkung: '',
  // Step 5: Kontakt + Fördercheck
  name: '', telefon: '', email: '', dsgvo: false,
  foerdercheck: null, bundesland: '', selectedFoerderProgs: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function fmt(n){ return Number(n).toLocaleString('de-DE',{maximumFractionDigits:0}); }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-kulturschutz-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});
// Migrate old draft without flaechenArr
if(!S.flaechenArr||!S.flaechenArr.length){
  S.flaechenArr=[newFlaeche(1)];
  if(p.plz) S.flaechenArr[0].plz=p.plz;
  if(p.ort) S.flaechenArr[0].ort=p.ort;
  if(p.forstamt) S.flaechenArr[0].forstamt=p.forstamt;
  if(p.revier) S.flaechenArr[0].revier=p.revier;
  if(p.gps) S.flaechenArr[0].gps=p.gps;
  if(p.ha) S.flaechenArr[0].ha=p.ha;
}}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent=''; e.style.display='none';} }
function go(n){ S.step=n; saveDraft(); try{history.pushState({step:n},"","#step-"+n);}catch(e){} render(); kawSyncFooter(); window.scrollTo(0,0); }

// ── Progress Bar ──────────────────────────────────────────────────────────────
function renderProgress(){
  var labels=['Besitzer','Standort','Flächen','Schutz','Zeitraum','Kontakt'];
  var curStep=typeof S!=='undefined'?S.step:0;
  var pct=Math.round((curStep/Math.max(1,labels.length-1))*100);
  var pills=labels.map(function(l,i){
    var cls='kaw-step';
    if(i<curStep) cls+=' done';
    if(i===curStep) cls+=' active';
    return '<div class="'+cls+'">'+esc(l)+'</div>';
  }).join('');
  return '<div class="kaw-steps" id="kaw-steps">'+pills+'</div>'
    +'<div class="kaw-progress-bar"><div class="kaw-progress-fill" id="kaw-progress" style="width:'+pct+'%"></div></div>';
}

// ── Main Render ────────────────────────────────────────────────────────────────

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
  if(sp) sp.innerHTML=renderProgress().replace(/<div class="kaw-progress-bar">.*<\/div>/,'');
  var pb=document.getElementById('kaw-progress');
  if(pb) pb.style.width=Math.round((S.step/Math.max(1,TOTAL_STEPS-1))*100)+'%';
}

function render(){
  var root = document.getElementById('ka-wizard');
  if(!root) return;

  root.innerHTML='<header class="kaw-header">'
    +'<a href="/" class="kaw-logo">\u2190 Koch Aufforstung</a>'
    +renderProgress()
    +'</header>'
    +'<main class="kaw-body" id="kaw-main"></main>'
    +'<footer class="kaw-footer">'
    +'<button class="kaw-btn kaw-btn-back" id="kaw-back" style="visibility:hidden">Zur\u00fcck</button>'
    +'<div class="kaw-step-label" id="kaw-step-label"></div>'
    +'<button class="kaw-btn kaw-btn-next" id="kaw-next">Weiter</button>'
    +'</footer>';

  var main = document.getElementById('kaw-main');
  if(!main) return;

  switch(S.step){
    case 0: main.innerHTML=s0(); bind0(); break;
    case 1: main.innerHTML=s1(); bind1(); break;
    case 2: main.innerHTML=s2(); bind2(); break;
    case 3: main.innerHTML=s3(); bind3(); break;
    case 4: main.innerHTML=s4(); bind4(); break;
    case 5: main.innerHTML=s5(); bind5(); break;
  }
}

// ── Step 0: Waldbesitzertyp ────────────────────────────────────────────────────
function s0(){
  var opts = BESITZERTYP.map(function(b){
    var on = S.besitzertyp === b.k;
    return '<button type="button" class="ka-card-option'+(on?' selected':'')+'" data-bk="'+b.k+'">'
      +'<span class="ka-card-icon">'+b.ico+'</span>'
      +'<span class="ka-card-name">'+esc(b.label)+'</span>'
      +'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🏡 Waldbesitzertyp</h2>'
    +'<p>Welche Art von Waldbesitzer sind Sie? Dies beeinflusst die Förderoptionen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-cards">'+opts+'</div>'
    +'<div class="ka-err" id="e0"></div>'
    +'</div>'
    +'<div class="ka-card-footer"><div></div>'
    +'<button class="ka-btn ka-btn-primary" id="n0">Weiter →</button>'
    +'</div></div>';
}

function bind0(){
  document.querySelectorAll('[data-bk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.besitzertyp = this.dataset.bk;
      document.querySelectorAll('[data-bk]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e0');
    });
  });
  document.getElementById('n0').addEventListener('click', function(){
    if(!S.besitzertyp){ showErr('e0','Bitte Waldbesitzertyp wählen.'); return; }
    go(1);
  });
}

// ── Multi-Flächen Helpers ─────────────────────────────────────────────────────
function addFlaeche(){
  var maxId=S.flaechenArr.reduce(function(m,f){return Math.max(m,f.id);},0);
  S.flaechenArr.push(newFlaeche(maxId+1));
  render();
}
function removeFlaeche(id){
  S.flaechenArr=S.flaechenArr.filter(function(f){return f.id!==id;});
  render();
}
function renderFlaechenBlocks(){
  return S.flaechenArr.map(function(fl,idx){
    var title=S.flaechenArr.length>1?'Fläche '+(idx+1):'Fläche';
    var delBtn=idx>0?'<button type="button" class="ka-flaeche-del" onclick="removeFlaeche('+fl.id+')">✕ Entfernen</button>':'';
    return '<div class="ka-flaeche" data-fl-id="'+fl.id+'">'
      +'<div class="ka-flaeche-header"><span class="ka-flaeche-title">📍 '+title+'</span>'+delBtn+'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">PLZ *</label>'
      +'<input class="ka-inp fl-plz" type="text" inputmode="numeric" data-fl="'+fl.id+'" value="'+esc(fl.plz)+'" placeholder="z.B. 83229" autocomplete="postal-code"></div>'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">Ort *</label>'
      +'<input class="ka-inp fl-ort" type="text" data-fl="'+fl.id+'" value="'+esc(fl.ort)+'" placeholder="z.B. Aschau im Chiemgau" autocomplete="address-level2"></div>'
      +'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field"><label class="ka-label">Forstamt *</label>'
      +'<input class="ka-inp fl-forstamt" type="text" data-fl="'+fl.id+'" value="'+esc(fl.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
      +'<div class="ka-field"><label class="ka-label">Revier *</label>'
      +'<input class="ka-inp fl-revier" type="text" data-fl="'+fl.id+'" value="'+esc(fl.revier)+'" placeholder="z.B. Revier Süd" autocomplete="off"></div>'
      +'</div>'
      +'<div class="ka-field"><label class="ka-label">Flächengröße (ha) *</label>'
      +'<input class="ka-inp fl-ha" type="text" inputmode="decimal" data-fl="'+fl.id+'" value="'+esc(fl.ha)+'" placeholder="z.B. 2.5" autocomplete="off"></div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">GPS-Koordinaten <span class="ka-label-optional">(optional)</span></label>'
      +'<div class="ka-gps-row">'
      +'<input class="ka-inp fl-gps" type="text" data-fl="'+fl.id+'" value="'+esc(fl.gps)+'" placeholder="z.B. 51.1234, 8.5678">'
      +'<button type="button" class="ka-gps-btn fl-gps-btn" data-fl="'+fl.id+'">📍 Standort</button>'
      +'</div>'
      +'<div class="ka-gps-info" id="gps-info-'+fl.id+'"></div>'
      +'</div>'
      +'</div>';
  }).join('');
}

// ── Step 1: Standort ───────────────────────────────────────────────────────────
function s1(){
  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📍 Standort</h2>'
    +'<p>Wo befinden sich die Flächen? Sie können mehrere Flächen anlegen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +renderFlaechenBlocks()
    +'<button type="button" class="ka-add-btn" onclick="addFlaeche()">＋ Weitere Fläche hinzufügen</button>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Treffpunkt mit Förster <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="text" id="i-treffpunkt" value="'+esc(S.treffpunkt)+'" placeholder="z.B. Parkplatz Waldweg, Forststraße km 3">'
    +'<p class="ka-hint">Wo soll der Förster Sie treffen? GPS-Koordinaten oder Wegbeschreibung.</p>'
    +'</div>'
    +'<div class="ka-err" id="e1"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b1">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n1">Weiter →</button>'
    +'</div></div>';
}

function getFlById(id){ return S.flaechenArr.find(function(f){return f.id===id;}); }
function getTotalHa(){ return S.flaechenArr.reduce(function(s,f){return s+(parseFloat(f.ha)||0);},0).toLocaleString('de-DE',{maximumFractionDigits:1}); }

function bind1(){
  // Bind each fläche's inputs
  S.flaechenArr.forEach(function(fl){
    var plzInp=document.querySelector('.fl-plz[data-fl="'+fl.id+'"]');
    var ortInp=document.querySelector('.fl-ort[data-fl="'+fl.id+'"]');
    var faInp=document.querySelector('.fl-forstamt[data-fl="'+fl.id+'"]');
    var revInp=document.querySelector('.fl-revier[data-fl="'+fl.id+'"]');
    var haInp=document.querySelector('.fl-ha[data-fl="'+fl.id+'"]');
    var gpsInp=document.querySelector('.fl-gps[data-fl="'+fl.id+'"]');
    if(plzInp) plzInp.addEventListener('input',function(){ fl.plz=this.value; });
    if(ortInp) ortInp.addEventListener('input',function(){ fl.ort=this.value; });
    if(faInp) faInp.addEventListener('input',function(){ fl.forstamt=this.value; });
    if(revInp) revInp.addEventListener('input',function(){ fl.revier=this.value; });
    if(haInp) haInp.addEventListener('input',function(){ fl.ha=this.value; });
    if(gpsInp) gpsInp.addEventListener('input',function(){ fl.gps=this.value; });
    // PLZ autocomplete
    if(plzInp && ortInp && window.bindPlzAutocomplete) window.bindPlzAutocomplete(plzInp, ortInp, faInp);
    // GPS button
    var gpsBtn=document.querySelector('.fl-gps-btn[data-fl="'+fl.id+'"]');
    if(gpsBtn) gpsBtn.addEventListener('click',function(){
      var info=document.getElementById('gps-info-'+fl.id);
      if(!navigator.geolocation){
        if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a></span>';
        return;
      }
      if(info) info.textContent='Standort wird ermittelt...';
      navigator.geolocation.getCurrentPosition(function(pos){
        var coords=pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6);
        fl.gps=coords;
        if(gpsInp) gpsInp.value=coords;
        if(info) info.textContent='Koordinaten: '+coords;
      },function(){
        if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a></span>';
      },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    });
  });

  var treffpunktInp=document.getElementById('i-treffpunkt');
  if(treffpunktInp) treffpunktInp.addEventListener('input',function(){ S.treffpunkt=this.value; });

  document.getElementById('b1').addEventListener('click',function(){
    collectFlaechen(); go(0);
  });
  document.getElementById('n1').addEventListener('click',function(){
    collectFlaechen();
    for(var i=0;i<S.flaechenArr.length;i++){
      var fl=S.flaechenArr[i];
      var label=S.flaechenArr.length>1?' (Fläche '+(i+1)+')':'';
      if(!fl.plz.trim()){ showErr('e1','Bitte PLZ eingeben'+label+'.'); return; }
      if(!fl.ort.trim()){ showErr('e1','Bitte Ort eingeben'+label+'.'); return; }
      if(!fl.forstamt.trim()){ showErr('e1','Bitte Forstamt angeben'+label+'.'); return; }
      if(!fl.revier.trim()){ showErr('e1','Bitte Revier angeben'+label+'.'); return; }
      var ha=parseFloat(fl.ha);
      if(!fl.ha||isNaN(ha)||ha<0.1||ha>50){ showErr('e1','Bitte gültige Flächengröße eingeben (0,1–50 ha)'+label+'.'); return; }
    }
    hideErr('e1');
    go(2);
  });
}

function collectFlaechen(){
  S.flaechenArr.forEach(function(fl){
    var plzEl=document.querySelector('.fl-plz[data-fl="'+fl.id+'"]');
    var ortEl=document.querySelector('.fl-ort[data-fl="'+fl.id+'"]');
    var faEl=document.querySelector('.fl-forstamt[data-fl="'+fl.id+'"]');
    var revEl=document.querySelector('.fl-revier[data-fl="'+fl.id+'"]');
    var haEl=document.querySelector('.fl-ha[data-fl="'+fl.id+'"]');
    var gpsEl=document.querySelector('.fl-gps[data-fl="'+fl.id+'"]');
    if(plzEl) fl.plz=plzEl.value;
    if(ortEl) fl.ort=ortEl.value;
    if(faEl) fl.forstamt=faEl.value;
    if(revEl) fl.revier=revEl.value;
    if(haEl) fl.ha=haEl.value;
    if(gpsEl) fl.gps=gpsEl.value;
  });
  var trfEl=document.getElementById('i-treffpunkt');
  if(trfEl) S.treffpunkt=trfEl.value;
}

// ── Step 2: Schutzart ──────────────────────────────────────────────────────────
function s2(){
  var cards = SCHUTZARTEN.map(function(sa){
    var on = S.schutzart === sa.k;
    return '<button type="button" class="ka-card-option'+(on?' selected':'')+'" data-sk="'+sa.k+'">'
      +'<span class="ka-card-icon">'+sa.ico+'</span>'
      +'<span class="ka-card-name">'+esc(sa.name)+'</span>'
      +'<span class="ka-card-sub">'+esc(sa.sub)+'</span>'
      +'</button>';
  }).join('');

  var detail = '';
  if(S.schutzart){
    var sa = SCHUTZARTEN.find(function(x){ return x.k===S.schutzart; });
    if(sa){
      detail = '<div class="ka-info-box info" style="margin-top:14px">'
        +'<strong>✅ Vorteile:</strong> '+sa.pros.join(' &nbsp; ')
        +'<br><strong>⚠️ Nachteile:</strong> '+sa.cons.join(' &nbsp; ')
        +'<br><strong>📍 Szenarien:</strong> '+esc(sa.szenarien)
        +'<br><strong>🏦 Förderung:</strong> '+esc(sa.foerder)
        +'</div>';
    }
  }

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🛡️ Schutzart wählen</h2>'
    +'<p>Kulturschutz schützt frisch gepflanzte Waldflächen vor Wildverbiss und -schäle. Wählen Sie die passende Methode.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-cards">'+cards+'</div>'
    +detail
    +'<div class="ka-err" id="e2"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b2">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n2">Weiter →</button>'
    +'</div></div>';
}

function bind2(){
  document.querySelectorAll('[data-sk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.schutzart = this.dataset.sk;
      render();
    });
  });
  document.getElementById('b2').addEventListener('click', function(){ go(1); });
  document.getElementById('n2').addEventListener('click', function(){
    if(!S.schutzart){ showErr('e2','Bitte Schutzart auswählen.'); return; }
    go(3);
  });
}

// ── Step 3: Konfiguration ──────────────────────────────────────────────────────
function renderEinzelschutzOptionen(){
  var eo = S.einzelschutzOptionen;
  var rob = S.robinienstab;

  var HOEHENOPTIONEN = ['60 cm','90 cm','120 cm','180 cm'];

  function renderHoeheSelect(id, val){
    return '<select class="ka-select" id="'+id+'" style="width:130px">'
      + HOEHENOPTIONEN.map(function(h){
          return '<option value="'+h+'"'+(val===h?' selected':'')+'>'+h+'</option>';
        }).join('')
      +'</select>';
  }

  var html = '<div class="ka-field">'
    +'<label class="ka-label">Einzelschutz-Optionen (Mehrfachauswahl möglich) *</label>'
    +'<p class="ka-hint">Wählen Sie die gewünschten Hüllen-Typen und geben Sie die jeweilige Stückzahl und Höhe an.</p>';

  // Tubex
  html += '<div class="ka-check-card'+(eo.tubex.aktiv?' selected':'')+'" id="ks-es-tubex" style="flex-direction:column;align-items:stretch;margin-bottom:8px">'
    +'<div style="display:flex;align-items:flex-start;gap:10px;cursor:pointer" id="ks-es-tubex-toggle">'
    +'<input type="checkbox" id="cb-tubex"'+(eo.tubex.aktiv?' checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<div>'
    +'<div style="font-size:13px;font-weight:700">Tubex Plastilhülle</div>'
    +'<div class="ka-hint" style="margin:0">Bewährte Kunststoffhülle mit Belüftungsschlitzen</div>'
    +'</div>'
    +'</div>'
    +(eo.tubex.aktiv
      ? '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap">'
        +'<div class="ka-qty">'
        +'<button type="button" class="ka-qty-btn" id="tbx-minus">−</button>'
        +'<input type="number" class="ka-qty-input" id="menge-tubex" min="1" value="'+esc(eo.tubex.menge||'')+'" placeholder="Stück">'
        +'<button type="button" class="ka-qty-btn" id="tbx-plus">+</button>'
        +'<span style="font-size:12px;color:#666">Stück</span>'
        +'</div>'
        +'<div><label class="ka-label" style="margin-bottom:3px">Höhe</label>'
        +renderHoeheSelect('hoehe-tubex', eo.tubex.hoehe||'120 cm')
        +'</div>'
        +'</div>'
      : '')
    +'</div>';

  // Biowuchshülle
  html += '<div class="ka-check-card'+(eo.bio.aktiv?' selected':'')+'" id="ks-es-bio" style="flex-direction:column;align-items:stretch;margin-bottom:8px">'
    +'<div style="display:flex;align-items:flex-start;gap:10px;cursor:pointer" id="ks-es-bio-toggle">'
    +'<input type="checkbox" id="cb-bio"'+(eo.bio.aktiv?' checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<div>'
    +'<div style="font-size:13px;font-weight:700">Biowuchshülle</div>'
    +'<div class="ka-hint" style="margin:0">Biologisch abbaubar, kein Rückbau erforderlich</div>'
    +'</div>'
    +'</div>'
    +(eo.bio.aktiv
      ? '<div style="display:flex;align-items:center;gap:12px;margin-top:8px;flex-wrap:wrap">'
        +'<div class="ka-qty">'
        +'<button type="button" class="ka-qty-btn" id="bio-minus">−</button>'
        +'<input type="number" class="ka-qty-input" id="menge-bio" min="1" value="'+esc(eo.bio.menge||'')+'" placeholder="Stück">'
        +'<button type="button" class="ka-qty-btn" id="bio-plus">+</button>'
        +'<span style="font-size:12px;color:#666">Stück</span>'
        +'</div>'
        +'<div><label class="ka-label" style="margin-bottom:3px">Höhe</label>'
        +renderHoeheSelect('hoehe-bio', eo.bio.hoehe||'120 cm')
        +'</div>'
        +'</div>'
      : '')
    +'</div>';

  // Wunschhülle
  html += '<div class="ka-check-card'+(eo.wunsch.aktiv?' selected':'')+'" id="ks-es-wunsch" style="flex-direction:column;align-items:stretch;margin-bottom:8px">'
    +'<div style="display:flex;align-items:flex-start;gap:10px;cursor:pointer" id="ks-es-wunsch-toggle">'
    +'<input type="checkbox" id="cb-wunsch"'+(eo.wunsch.aktiv?' checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<div>'
    +'<div style="font-size:13px;font-weight:700">Wunschhülle (eigenes Produkt)</div>'
    +'<div class="ka-hint" style="margin:0">Produktname angeben — wir beschaffen auf Anfrage</div>'
    +'</div>'
    +'</div>'
    +(eo.wunsch.aktiv
      ? '<div style="margin-top:8px">'
        +'<div class="ka-field" style="margin-bottom:8px">'
        +'<input type="text" id="wunsch-name" class="ka-inp" value="'+esc(eo.wunsch.produktname||'')+'" placeholder="Produktname / Hersteller">'
        +'</div>'
        +'<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">'
        +'<div class="ka-qty">'
        +'<button type="button" class="ka-qty-btn" id="wunsch-minus">−</button>'
        +'<input type="number" class="ka-qty-input" id="menge-wunsch" min="1" value="'+esc(eo.wunsch.menge||'')+'" placeholder="Stück">'
        +'<button type="button" class="ka-qty-btn" id="wunsch-plus">+</button>'
        +'<span style="font-size:12px;color:#666">Stück</span>'
        +'</div>'
        +'<div><label class="ka-label" style="margin-bottom:3px">Höhe</label>'
        +renderHoeheSelect('hoehe-wunsch', eo.wunsch.hoehe||'120 cm')
        +'</div>'
        +'</div>'
        +'</div>'
      : '')
    +'</div>';

  html += '</div>';

  // Robinienstab
  html += '<div class="ka-info-box brand" style="cursor:pointer" id="ks-robinie-toggle">'
    +'<div style="display:flex;align-items:flex-start;gap:10px">'
    +'<div style="width:18px;height:18px;border-radius:50%;border:2px solid '+(rob.aktiv?'#C5A55A':'#bbb')+';background:'+(rob.aktiv?'#C5A55A':'transparent')+';flex-shrink:0;margin-top:2px;display:flex;align-items:center;justify-content:center">'
    +(rob.aktiv?'<div style="width:8px;height:8px;border-radius:50%;background:#fff"></div>':'')
    +'</div>'
    +'<div>'
    +'<div style="font-size:13px;font-weight:700">Einzelschutz mit Robinienstab</div>'
    +'<div style="font-size:12px;color:var(--kaw-gold);font-weight:600;margin-top:2px">+0,70 € pro Stück</div>'
    +'<div class="ka-hint" style="margin:0">Robinienstab als Pfahl zur Stabilisierung der Hülle</div>'
    +'</div>'
    +'</div>'
    +(rob.aktiv
      ? '<div class="ka-qty" style="margin-top:10px">'
        +'<button type="button" class="ka-qty-btn" id="rob-minus">−</button>'
        +'<input type="number" class="ka-qty-input" id="menge-robinie" min="1" value="'+esc(rob.menge||'')+'" placeholder="Stück">'
        +'<button type="button" class="ka-qty-btn" id="rob-plus">+</button>'
        +'<span style="font-size:12px;color:#666">Stück (+0,70 € je Stk.)</span>'
        +'</div>'
      : '')
    +'</div>';

  return html;
}

function renderFlaechenschutzOptionen(){
  var fTyp = S.flaechenschutzTyp;
  return '<div class="ka-field">'
    +'<label class="ka-label">Zauntyp *</label>'
    +'<p class="ka-hint">Wählen Sie den Zauntyp für die Einzäunung der Gesamtfläche.</p>'
    +'<div class="ka-cards-stacked">'
    +'<div class="ka-radio-card'+(fTyp==='metallzaun'?' selected':'')+'" data-zaun="metallzaun">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div>'
    +'<div class="ka-radio-label">🔩 Metallzaun</div>'
    +'<div class="ka-radio-desc">Z-Profile, Drahtgeflecht 200/2215M verzinkt — Kopf-/Fußdraht 2,4 mm, Fülldrähte 1,9 mm — Rollen à 50 m</div>'
    +'</div>'
    +'</div>'
    +'<div class="ka-radio-card'+(fTyp==='holzzaun'?' selected':'')+'" data-zaun="holzzaun">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div>'
    +'<div class="ka-radio-label">🌲 Holzzaun aus Lärche</div>'
    +'<div class="ka-radio-desc">Je Element 4 m lang, 2 m hoch — Verstärkt mit Robinienpfählen 2 m lang — Langlebig und witterungsbeständig</div>'
    +'</div>'
    +'</div>'
    +'</div>'
    +'</div>';
}

function s3(){
  var ks = S.schutzart;

  var treeChips = TREES.map(function(t){
    var on = S.baumarten.indexOf(t.k) > -1;
    return '<button type="button" class="ka-chip'+(on?' selected':'')+'" data-tk="'+t.k+'">'+esc(t.name)+'</button>';
  }).join('');

  var alterOpts = [
    {k:'neu',  ico:'🌱', label:'Neu gepflanzt', sub:'< 1 Jahr'},
    {k:'1-3',  ico:'🌿', label:'1–3 Jahre',     sub:'Junge Kultur'},
    {k:'3-5',  ico:'🌳', label:'3–5 Jahre',     sub:'Etablierungsphase'},
  ].map(function(a){
    var on = S.alterKultur===a.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-ak="'+a.k+'">'
      +a.ico+' '+esc(a.label)
      +'<span class="ka-toggle-sub">'+esc(a.sub)+'</span>'
      +'</button>';
  }).join('');

  var wildCards = WILDARTEN.map(function(w){
    var on = S.wildarten.indexOf(w.k) > -1;
    return '<button type="button" class="ka-card-option'+(on?' selected':'')+'" data-wk="'+w.k+'" style="padding:10px">'
      +'<span class="ka-card-icon" style="font-size:20px">'+w.ico+'</span>'
      +'<span class="ka-card-name" style="font-size:13px">'+esc(w.name)+'</span>'
      +'<span class="ka-card-sub">'+esc(w.desc)+'</span>'
      +'</button>';
  }).join('');

  var druckOpts = [
    {k:'niedrig',  label:'Niedrig',   sub:'vereinzelt — kein unmittelbarer Handlungsdruck'},
    {k:'mittel',   label:'Mittel',    sub:'regelmäßig — Schutz empfohlen'},
    {k:'hoch',     label:'Hoch',      sub:'starke Schäden zu erwarten — Schutz dringend'},
    {k:'sehrhoch', label:'Sehr hoch', sub:'bereits erhebliche Schäden — sofortiger Schutz'},
  ].map(function(d){
    var on = S.verbissdruck===d.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-dk="'+d.k+'">'
      +esc(d.label)+'<span class="ka-toggle-sub">'+esc(d.sub)+'</span></button>';
  }).join('');

  var rotwildAktiv = S.wildarten.indexOf('rotwild') > -1;

  var schutzKonfigHTML = '';
  if(ks==='einzelschutz'||ks==='kombiniert') schutzKonfigHTML += renderEinzelschutzOptionen();
  if(ks==='flaechenschutz'||ks==='kombiniert') schutzKonfigHTML += renderFlaechenschutzOptionen();

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>⚙️ Konfiguration</h2>'
    +'<p>Angaben zu Ihrer Fläche, Baumarten, Wildbesatz und Schutz-Konfiguration.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-info-box brand" style="margin-bottom:14px">📍 '+S.flaechenArr.length+' Fläche'+(S.flaechenArr.length>1?'n':'')+' · Gesamt: '+getTotalHa()+' ha</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Baumarten auf der Fläche <span class="ka-label-optional">(Mehrfachauswahl)</span></label>'
    +'<div class="ka-chips">'+treeChips+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Alter der Kultur *</label>'
    +'<div class="ka-toggles">'+alterOpts+'</div>'
    +'</div>'

    +schutzKonfigHTML

    +'<div class="ka-field">'
    +'<label class="ka-label">Wildarten mit Verbissdruck <span class="ka-label-optional">(Mehrfachauswahl)</span></label>'
    +'<div class="ka-cards" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">'+wildCards+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Verbissdruck *</label>'
    +'<div class="ka-toggles">'+druckOpts+'</div>'
    +'</div>'

    +(rotwildAktiv
      ? '<div class="ka-field">'
        +'<label class="ka-label">Schälrisiko (Rotwild)</label>'
        +'<div class="ka-toggles">'
        +'<button type="button" class="ka-toggle'+(S.schaelrisiko===false?' selected':'')+'" id="schael-nein">Nein</button>'
        +'<button type="button" class="ka-toggle'+(S.schaelrisiko===true?' selected':'')+'" id="schael-ja">Ja — Schälschutz nötig</button>'
        +'</div>'
        +(S.schaelrisiko
          ? '<div class="ka-info-box warn" style="margin-top:8px">⚠️ Schälschutz durch Rotwild erfordert besondere Maßnahmen. <strong>Kostenaufschlag +20%</strong> wird berücksichtigt.</div>'
          : '')
        +'</div>'
      : '')

    +'<div class="ka-err" id="e3"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b3">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n3">Weiter →</button>'
    +'</div></div>';
}

function bind3(){
  // Baumarten
  document.querySelectorAll('[data-tk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var k=this.dataset.tk, idx=S.baumarten.indexOf(k);
      if(idx>-1) S.baumarten.splice(idx,1);
      else S.baumarten.push(k);
      this.classList.toggle('selected');
    });
  });

  // Alter
  document.querySelectorAll('[data-ak]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.alterKultur=this.dataset.ak;
      document.querySelectorAll('[data-ak]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Einzelschutz checkboxen
  function bindCheckbox(id, stateKey){
    var cb=document.getElementById(id);
    if(!cb) return;
    cb.addEventListener('change', function(){ S.einzelschutzOptionen[stateKey].aktiv=this.checked; render(); });
  }
  bindCheckbox('cb-tubex','tubex');
  bindCheckbox('cb-bio','bio');
  bindCheckbox('cb-wunsch','wunsch');

  // Toggle-clicks on label areas
  ['tubex','bio','wunsch'].forEach(function(key){
    var toggle=document.getElementById('ks-es-'+key+'-toggle');
    if(toggle){
      toggle.addEventListener('click', function(e){
        if(e.target.type==='checkbox') return;
        S.einzelschutzOptionen[key].aktiv=!S.einzelschutzOptionen[key].aktiv;
        render();
      });
    }
  });

  // Qty btns + inputs for Einzelschutz
  function bindQty(minusId, plusId, inputId, stateObj, prop){
    var inp=document.getElementById(inputId);
    if(inp) inp.addEventListener('input', function(){ stateObj[prop]=this.value; });
    var minus=document.getElementById(minusId), plus=document.getElementById(plusId);
    if(minus) minus.addEventListener('click', function(){
      var v=parseInt(stateObj[prop])||0; if(v>1){ stateObj[prop]=String(v-1); if(inp) inp.value=stateObj[prop]; }
    });
    if(plus) plus.addEventListener('click', function(){
      var v=parseInt(stateObj[prop])||0; stateObj[prop]=String(v+1); if(inp) inp.value=stateObj[prop];
    });
  }
  bindQty('tbx-minus','tbx-plus','menge-tubex', S.einzelschutzOptionen.tubex,'menge');
  bindQty('bio-minus','bio-plus','menge-bio', S.einzelschutzOptionen.bio,'menge');
  bindQty('wunsch-minus','wunsch-plus','menge-wunsch', S.einzelschutzOptionen.wunsch,'menge');
  bindQty('rob-minus','rob-plus','menge-robinie', S.robinienstab,'menge');

  // Höhen-Selects
  function bindHoeheSelect(id, stateObj){
    var sel=document.getElementById(id);
    if(sel){ sel.addEventListener('change', function(){ stateObj.hoehe=this.value; }); }
  }
  bindHoeheSelect('hoehe-tubex', S.einzelschutzOptionen.tubex);
  bindHoeheSelect('hoehe-bio',   S.einzelschutzOptionen.bio);
  bindHoeheSelect('hoehe-wunsch',S.einzelschutzOptionen.wunsch);

  // Wunsch-Produktname
  var wName=document.getElementById('wunsch-name');
  if(wName) wName.addEventListener('input', function(){ S.einzelschutzOptionen.wunsch.produktname=this.value; });

  // Robinienstab toggle
  var robToggle=document.getElementById('ks-robinie-toggle');
  if(robToggle) robToggle.addEventListener('click', function(e){
    if(e.target.tagName==='INPUT') return;
    S.robinienstab.aktiv=!S.robinienstab.aktiv;
    render();
  });

  // Zauntyp
  document.querySelectorAll('[data-zaun]').forEach(function(el){
    el.addEventListener('click', function(){
      S.flaechenschutzTyp=this.dataset.zaun;
      document.querySelectorAll('[data-zaun]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Wildarten
  document.querySelectorAll('[data-wk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var k=this.dataset.wk, idx=S.wildarten.indexOf(k);
      if(idx>-1) S.wildarten.splice(idx,1);
      else S.wildarten.push(k);
      render();
    });
  });

  // Verbissdruck
  document.querySelectorAll('[data-dk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.verbissdruck=this.dataset.dk;
      document.querySelectorAll('[data-dk]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Schälrisiko
  var schaelJa=document.getElementById('schael-ja');
  var schaelNein=document.getElementById('schael-nein');
  if(schaelJa) schaelJa.addEventListener('click', function(){ S.schaelrisiko=true; render(); });
  if(schaelNein) schaelNein.addEventListener('click', function(){ S.schaelrisiko=false; render(); });

  document.getElementById('b3').addEventListener('click', function(){
    go(2);
  });
  document.getElementById('n3').addEventListener('click', function(){
    if(!S.alterKultur){ showErr('e3','Bitte Alter der Kultur auswählen.'); return; }
    var ks=S.schutzart;
    if(ks==='einzelschutz'||ks==='kombiniert'){
      var eo=S.einzelschutzOptionen;
      var hasEinzel=eo.tubex.aktiv||eo.bio.aktiv||eo.wunsch.aktiv;
      if(!hasEinzel){ showErr('e3','Bitte mindestens eine Einzelschutz-Option wählen.'); return; }
      if(eo.tubex.aktiv&&(!eo.tubex.menge||parseInt(eo.tubex.menge)<1)){ showErr('e3','Bitte Menge für Tubex Plastilhülle eingeben.'); return; }
      if(eo.bio.aktiv&&(!eo.bio.menge||parseInt(eo.bio.menge)<1)){ showErr('e3','Bitte Menge für Biowuchshülle eingeben.'); return; }
      if(eo.wunsch.aktiv&&(!eo.wunsch.menge||parseInt(eo.wunsch.menge)<1)){ showErr('e3','Bitte Menge für Wunschhülle eingeben.'); return; }
    }
    if(ks==='flaechenschutz'||ks==='kombiniert'){
      if(!S.flaechenschutzTyp){ showErr('e3','Bitte Zauntyp auswählen.'); return; }
    }
    if(!S.verbissdruck){ showErr('e3','Bitte Verbissdruck auswählen.'); return; }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Zeitraum ──────────────────────────────────────────────────────────
function s4(){
  var ksY=new Date().getFullYear(), ksM=new Date().getMonth()+1, ksNextY=ksM>8?ksY+1:ksY;

  var zeitOpts = [
    {k:'sofort',    ico:'⚡', label:'Sofort nach Pflanzung', sub:'Schutz direkt bei Pflanzung'},
    {k:'fruehjahr', ico:'🌸', label:'Frühjahr '+ksNextY,      sub:'März – Mai '+ksNextY},
    {k:'herbst',    ico:'🍂', label:'Herbst '+(ksM>10?ksY+1:ksY), sub:'Oktober – November '+(ksM>10?ksY+1:ksY)},
    {k:'flexibel',  ico:'📅', label:'Flexibel',               sub:'Nach Absprache'},
  ].map(function(z){
    var on=S.ausfuehrungszeitraum===z.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-zt="'+z.k+'">'
      +z.ico+' '+esc(z.label)+'<span class="ka-toggle-sub">'+esc(z.sub)+'</span></button>';
  }).join('');

  var dauerOpts = [
    {k:'3',    label:'3 Jahre'},
    {k:'5',    label:'5 Jahre'},
    {k:'10',   label:'10 Jahre'},
    {k:'lang', label:'Langfristig'},
  ].map(function(d){
    var on=S.schutzdauer===d.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-dt="'+d.k+'">'+esc(d.label)+'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📅 Zeitraum &amp; Schutzdauer</h2>'
    +'<p>Wann soll der Kulturschutz umgesetzt werden und wie lange soll er schützen?</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Ausführungszeitpunkt *</label>'
    +'<div class="ka-toggles" style="flex-wrap:wrap">'+zeitOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Gewünschte Schutzdauer *</label>'
    +'<div class="ka-toggles">'+dauerOpts+'</div>'
    +'<p class="ka-hint">Richtwert: Laubbäume ca. 5–10 Jahre, Nadelbäume ca. 3–5 Jahre.</p>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Jährliche Kontrolle &amp; Nachbesserung gewünscht?</label>'
    +'<div class="ka-toggles">'
    +'<button type="button" class="ka-toggle'+(S.wartung===false?' selected':'')+'" id="wart-nein">Nein, einmalig</button>'
    +'<button type="button" class="ka-toggle'+(S.wartung===true?' selected':'')+'" id="wart-ja">Ja, jährliche Wartung</button>'
    +'</div>'
    +(S.wartung===true?'<div class="ka-info-box success" style="margin-top:8px">✅ Jährliche Kontrolle: Zaunprüfung, Schäden dokumentieren, Einzelschutz nachbessern.</div>':'')
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Anmerkungen <span class="ka-label-optional">(optional)</span></label>'
    +'<textarea class="ka-textarea" id="i-bem" rows="3" placeholder="Besondere Gegebenheiten, Zufahrt, Vorgeschichte...">'+esc(S.bemerkung)+'</textarea>'
    +'</div>'

    +'<div class="ka-err" id="e4"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b4">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n4">Weiter →</button>'
    +'</div></div>';
}

function bind4(){
  document.querySelectorAll('[data-zt]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.ausfuehrungszeitraum=this.dataset.zt;
      document.querySelectorAll('[data-zt]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('[data-dt]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.schutzdauer=this.dataset.dt;
      document.querySelectorAll('[data-dt]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  var wartJa=document.getElementById('wart-ja');
  var wartNein=document.getElementById('wart-nein');
  if(wartJa) wartJa.addEventListener('click', function(){ S.wartung=true; render(); });
  if(wartNein) wartNein.addEventListener('click', function(){ S.wartung=false; render(); });
  var bemEl=document.getElementById('i-bem');
  if(bemEl) bemEl.addEventListener('input', function(){ S.bemerkung=this.value; });
  document.getElementById('b4').addEventListener('click', function(){
    var bem=document.getElementById('i-bem'); if(bem) S.bemerkung=bem.value;
    go(3);
  });
  document.getElementById('n4').addEventListener('click', function(){
    var bem=document.getElementById('i-bem'); if(bem) S.bemerkung=bem.value;
    if(!S.ausfuehrungszeitraum){ showErr('e4','Bitte Ausführungszeitpunkt wählen.'); return; }
    if(!S.schutzdauer){ showErr('e4','Bitte gewünschte Schutzdauer wählen.'); return; }
    hideErr('e4');
    go(5);
  });
}

// ── Step 5: Kontakt + Zusammenfassung + Fördercheck + Absenden ─────────────────
function renderFoerderProgListe(bl){
  var data = FOERDER_KS[bl] || FOERDER_KS.DEFAULT;
  var progs = data.progs;
  var html = '<div style="display:flex;flex-direction:column;gap:8px;margin-top:8px">';
  progs.forEach(function(p){
    var sel = S.selectedFoerderProgs.indexOf(p.name) > -1;
    html += '<label class="ka-check-card'+(sel?' selected':'')+'">'
      +'<input type="checkbox" class="ks-prog-cb" data-prog="'+esc(p.name)+'" '+(sel?'checked':'')+' style="width:16px;height:16px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
      +'<div>'
      +'<div class="ka-foerder-prog-name">'+esc(p.name)+'</div>'
      +'<div class="ka-foerder-prog-rate">💰 '+esc(p.rate)+'</div>'
      +'<div class="ka-foerder-prog-desc">'+esc(p.desc)+'</div>'
      +(p.url?'<a href="'+esc(p.url)+'" target="_blank" rel="noopener" style="display:inline-block;font-size:11px;color:#012d1d;margin-top:4px">🔗 Weitere Informationen</a>':'')
      +'</div>'
      +'</label>';
  });
  html += '</div>';
  return html;
}

function s5(){
  var preisData = calcPreis(S);
  var preisHTML = '';
  if(preisData.min>0){
    preisHTML = '<div class="ka-price-box">'
      +'<span>Kostenindikation (ca.)<br><small style="font-size:11px;color:#666">'+esc(preisData.label)+'</small></span>'
      +'<strong>'+fmt(preisData.min)+' – '+fmt(preisData.max)+' €</strong>'
      +'</div>'
      +'<p class="ka-hint">Unverbindliche Richtkosten netto. Endangebot nach Vor-Ort-Besichtigung.</p>';
  }

  var sa = SCHUTZARTEN.find(function(x){return x.k===S.schutzart;})||{name:S.schutzart,ico:'🛡️'};
  var bt = BESITZERTYP.find(function(b){return b.k===S.besitzertyp;})||{};
  var wildNamen = S.wildarten.map(function(k){var w=WILDARTEN.find(function(x){return x.k===k;}); return w?w.ico+' '+w.name:k;});
  var baumNamen = S.baumarten.map(function(k){var t=TREES.find(function(x){return x.k===k;}); return t?t.name:k;});
  var zeitMap  = {sofort:'Sofort nach Pflanzung',fruehjahr:'Im Frühjahr',herbst:'Im Herbst',flexibel:'Flexibel'};
  var dauerMap = {'3':'3 Jahre','5':'5 Jahre','10':'10 Jahre','lang':'Langfristig'};
  var druckMap = {niedrig:'Niedrig',mittel:'Mittel',hoch:'Hoch',sehrhoch:'Sehr hoch'};
  var alterMap = {neu:'Neu gepflanzt','1-3':'1–3 Jahre','3-5':'3–5 Jahre'};

  // Schutz-Konfiguration
  var eo = S.einzelschutzOptionen;
  var esLines = [];
  if(eo.tubex.aktiv) esLines.push('Tubex Plastilhülle: '+eo.tubex.menge+' Stk.'+(eo.tubex.hoehe?' / '+eo.tubex.hoehe:''));
  if(eo.bio.aktiv)   esLines.push('Biowuchshülle: '+eo.bio.menge+' Stk.'+(eo.bio.hoehe?' / '+eo.bio.hoehe:''));
  if(eo.wunsch.aktiv) esLines.push('"'+eo.wunsch.produktname+'": '+eo.wunsch.menge+' Stk.'+(eo.wunsch.hoehe?' / '+eo.wunsch.hoehe:''));

  var blOpts = Object.keys(FOERDER_KS).map(function(k){
    var labels={'BY':'Bayern','HE':'Hessen','NRW':'Nordrhein-Westfalen','BW':'Baden-Württemberg','TH':'Thüringen','DEFAULT':'Anderes Bundesland'};
    return '<option value="'+k+'"'+(S.bundesland===k?' selected':'')+'>'+esc(labels[k]||k)+'</option>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📋 Zusammenfassung &amp; Absenden</h2>'
    +'<p>Prüfen Sie Ihre Angaben, füllen Sie Ihre Kontaktdaten aus und senden Sie die Anfrage ab.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // Summary
    +'<div class="ka-summary">'
    +'<div class="ka-summary-title">Ihre Angaben</div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Besitzertyp</span><span class="ka-summary-value">'+esc(bt.label||'–')+'</span></div>'
    +S.flaechenArr.map(function(fl,idx){
      var lbl=S.flaechenArr.length>1?'Fläche '+(idx+1):'Standort';
      return '<div class="ka-summary-row"><span class="ka-summary-label">'+lbl+'</span><span class="ka-summary-value">'
        +esc(fl.plz+' '+fl.ort)+' · FA: '+esc(fl.forstamt||'–')+(fl.revier?' / '+esc(fl.revier):'')
        +' · '+esc(fl.ha)+' ha'+(fl.gps?' · GPS: '+esc(fl.gps):'')+'</span></div>';
    }).join('')
    +(S.treffpunkt?'<div class="ka-summary-row"><span class="ka-summary-label">Treffpunkt</span><span class="ka-summary-value">'+esc(S.treffpunkt)+'</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Schutzart</span><span class="ka-summary-value">'+sa.ico+' '+esc(sa.name)+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Gesamtfläche</span><span class="ka-summary-value">'+getTotalHa()+' ha</span></div>'
    +(baumNamen.length?'<div class="ka-summary-row"><span class="ka-summary-label">Baumarten</span><span class="ka-summary-value">'+baumNamen.map(function(n){return '<span class="ka-tag">'+esc(n)+'</span>';}).join(' ')+'</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Alter der Kultur</span><span class="ka-summary-value">'+esc(alterMap[S.alterKultur]||S.alterKultur||'–')+'</span></div>'
    +(esLines.length?'<div class="ka-summary-row"><span class="ka-summary-label">Einzelschutz</span><span class="ka-summary-value">'+esLines.map(esc).join('<br>')+'</span></div>':'')
    +(S.robinienstab.aktiv?'<div class="ka-summary-row"><span class="ka-summary-label">Robinienstab</span><span class="ka-summary-value">'+esc(S.robinienstab.menge)+' Stk.</span></div>':'')
    +(S.flaechenschutzTyp?'<div class="ka-summary-row"><span class="ka-summary-label">Zauntyp</span><span class="ka-summary-value">'+esc(S.flaechenschutzTyp==='metallzaun'?'🔩 Metallzaun':'🌲 Holzzaun aus Lärche')+'</span></div>':'')
    +(wildNamen.length?'<div class="ka-summary-row"><span class="ka-summary-label">Wildbesatz</span><span class="ka-summary-value">'+wildNamen.map(function(n){return '<span class="ka-tag" style="background:#fff0f0;color:#e53e3e;border-color:#f9c0c0">'+esc(n)+'</span>';}).join(' ')+'</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Verbissdruck</span><span class="ka-summary-value">'+esc(druckMap[S.verbissdruck]||S.verbissdruck||'–')+'</span></div>'
    +(S.wildarten.indexOf('rotwild')>-1?'<div class="ka-summary-row"><span class="ka-summary-label">Schälrisiko</span><span class="ka-summary-value">'+(S.schaelrisiko?'⚠️ Ja':'✅ Nein')+'</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Ausführung</span><span class="ka-summary-value">'+esc(zeitMap[S.ausfuehrungszeitraum]||S.ausfuehrungszeitraum||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Schutzdauer</span><span class="ka-summary-value">'+esc(dauerMap[S.schutzdauer]||S.schutzdauer||'–')+'</span></div>'
    +(S.wartung!==null?'<div class="ka-summary-row"><span class="ka-summary-label">Wartung</span><span class="ka-summary-value">'+(S.wartung?'✅ Jährliche Kontrolle':'Einmalig')+'</span></div>':'')
    +(S.bemerkung?'<div class="ka-summary-row"><span class="ka-summary-label">Anmerkungen</span><span class="ka-summary-value">'+esc(S.bemerkung)+'</span></div>':'')
    +'</div>'

    // Preisindikation
    +preisHTML

    // Fördercheck
    +'<div class="ka-field" style="margin-top:20px">'
    +'<label class="ka-label">🏦 Fördermöglichkeiten prüfen <span class="ka-label-optional">(optional)</span></label>'
    +'<p class="ka-hint">Kulturschutz ist in den meisten Bundesländern mit 50–90% förderfähig.</p>'
    +'<div class="ka-cards-stacked" style="margin-top:8px">'
    +'<div class="ka-radio-card'+(S.foerdercheck==='ja'?' selected':'')+'" data-fc="ja">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div><div class="ka-radio-label">✅ Ja, Fördermöglichkeiten prüfen</div>'
    +'<div class="ka-radio-desc">Bundesland auswählen und passende Programme ansehen</div></div>'
    +'</div>'
    +'<div class="ka-radio-card'+(S.foerdercheck==='nein'?' selected':'')+'" data-fc="nein">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div><div class="ka-radio-label">→ Nein, ohne Fördercheck</div>'
    +'<div class="ka-radio-desc">Direkt absenden</div></div>'
    +'</div>'
    +'</div>'
    +'</div>'

    +(S.foerdercheck==='ja'
      ? '<div class="ka-field" id="ks-bl-field">'
        +'<label class="ka-label">Bundesland *</label>'
        +'<select class="ka-select" id="i-bl"><option value="">— Bundesland wählen —</option>'+blOpts+'</select>'
        +'</div>'
        +'<div id="ks-prog-container">'
        +(S.bundesland?renderFoerderProgListe(S.bundesland):'')
        +'</div>'
      : '')

    // Kontakt
    +'<div style="margin-top:20px">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Vollständiger Name *</label>'
    +'<input class="ka-inp" type="text" id="i-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name">'
    +'</div>'

    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Telefon <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="tel" id="i-tel" value="'+esc(S.telefon)+'" placeholder="+49 ..." autocomplete="tel">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">E-Mail-Adresse *</label>'
    +'<input class="ka-inp" type="email" id="i-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email">'
    +'</div>'
    +'</div>'

    +'<div class="ka-info-box brand">'
    +'🛡️ Unverbindliche Anfrage. Angebot innerhalb von 48 Stunden. Keine Weitergabe Ihrer Daten an Dritte.'
    +'</div>'

    +'<div class="ka-field">'
    +'<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-weight:400">'
    +'<input type="checkbox" id="i-dsgvo" required '+(S.dsgvo?'checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'</div>'
    +'</div>'

    +'<div class="ka-err" id="e5"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b5">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind5(){
  // Fördercheck
  document.querySelectorAll('[data-fc]').forEach(function(el){
    el.addEventListener('click', function(){
      S.foerdercheck=this.dataset.fc;
      if(S.foerdercheck==='nein'){ S.bundesland=''; S.selectedFoerderProgs=[]; }
      render();
    });
  });

  var blSel=document.getElementById('i-bl');
  if(blSel){
    blSel.addEventListener('change', function(){
      S.bundesland=this.value;
      S.selectedFoerderProgs=[];
      var container=document.getElementById('ks-prog-container');
      if(container) container.innerHTML=S.bundesland?renderFoerderProgListe(S.bundesland):'';
      // Re-bind checkboxes
      bindProgCheckboxes();
    });
  }
  bindProgCheckboxes();

  // Kontakt
  var nmEl=document.getElementById('i-nm');
  var telEl=document.getElementById('i-tel');
  var emEl=document.getElementById('i-em');
  var dsgvoEl=document.getElementById('i-dsgvo');
  if(nmEl) nmEl.addEventListener('input', function(){ S.name=this.value; });
  if(telEl) telEl.addEventListener('input', function(){ S.telefon=this.value; });
  if(emEl) emEl.addEventListener('input', function(){ S.email=this.value; });
  if(dsgvoEl) dsgvoEl.addEventListener('change', function(){ S.dsgvo=this.checked; });

  document.getElementById('b5').addEventListener('click', function(){ go(4); });

  document.getElementById('sub').addEventListener('click', function(){
    if(nmEl) S.name=nmEl.value;
    if(telEl) S.telefon=telEl.value;
    if(emEl) S.email=emEl.value;
    if(dsgvoEl) S.dsgvo=dsgvoEl.checked;

    if(!S.foerdercheck){ showErr('e5','Bitte Fördercheck-Option wählen.'); return; }
    if(S.foerdercheck==='ja'&&!S.bundesland){ showErr('e5','Bitte Bundesland auswählen.'); return; }
    if(!S.name.trim()){ showErr('e5','Bitte Name eingeben.'); return; }
    if(!S.email||!S.email.includes('@')){ showErr('e5','Bitte gültige E-Mail eingeben.'); return; }
    if(!S.dsgvo){ showErr('e5','Bitte Datenschutzerklärung bestätigen.'); return; }
    hideErr('e5');

    var btn=this; btn.disabled=true; btn.textContent='⏳ Wird gesendet…';

    var sa=SCHUTZARTEN.find(function(x){return x.k===S.schutzart;})||{name:S.schutzart};
    var bt=BESITZERTYP.find(function(b){return b.k===S.besitzertyp;})||{};
    var wildNamen=S.wildarten.map(function(k){var w=WILDARTEN.find(function(x){return x.k===k;}); return w?w.name:k;});
    var baumNamen=S.baumarten.map(function(k){var t=TREES.find(function(x){return x.k===k;}); return t?t.name:k;});
    var preisData=calcPreis(S);
    var zeitMap={sofort:'Sofort nach Pflanzung',fruehjahr:'Im Frühjahr',herbst:'Im Herbst',flexibel:'Flexibel'};
    var dauerMap={'3':'3 Jahre','5':'5 Jahre','10':'10 Jahre','lang':'Langfristig'};
    var druckMap={niedrig:'Niedrig',mittel:'Mittel',hoch:'Hoch',sehrhoch:'Sehr hoch'};
    var alterMap={neu:'Neu gepflanzt','1-3':'1–3 Jahre','3-5':'3–5 Jahre'};
    var blLabels={'BY':'Bayern','HE':'Hessen','NRW':'Nordrhein-Westfalen','BW':'Baden-Württemberg','TH':'Thüringen','DEFAULT':'Anderes Bundesland'};

    var eo=S.einzelschutzOptionen;
    var einzelschutzLines=[];
    if(eo.tubex.aktiv) einzelschutzLines.push('Tubex Plastilhülle: '+eo.tubex.menge+' Stk.'+(eo.tubex.hoehe?' / '+eo.tubex.hoehe:''));
    if(eo.bio.aktiv)   einzelschutzLines.push('Biowuchshülle: '+eo.bio.menge+' Stk.'+(eo.bio.hoehe?' / '+eo.bio.hoehe:''));
    if(eo.wunsch.aktiv) einzelschutzLines.push('Wunschhülle "'+eo.wunsch.produktname+'": '+eo.wunsch.menge+' Stk.'+(eo.wunsch.hoehe?' / '+eo.wunsch.hoehe:''));

    var fl0=S.flaechenArr[0]||{};
    var payload = {
      leistung: 'Kulturschutz',
      waldbesitzertyp: bt.label||S.besitzertyp||'',
      plz: fl0.plz||'',
      ort: fl0.ort||'',
      forstamt: fl0.forstamt||'',
      revier: fl0.revier||'',
      gps: fl0.gps||'',
      treffpunkt: S.treffpunkt||'',
      schutzart: sa.name,
      ha: getTotalHa(),
      flaechen_str: S.flaechenArr.map(function(f,i){return 'Fläche '+(i+1)+': '+f.ha+' ha, '+f.plz+' '+f.ort+(f.forstamt?' (FA: '+f.forstamt+(f.revier?'/'+f.revier:'')+')'  :'');}).join(' | '),
      flaechen: S.flaechenArr.map(function(f){return {plz:f.plz,ort:f.ort,forstamt:f.forstamt,revier:f.revier,ha:f.ha,gps:f.gps||''};}),
      baumarten: baumNamen.join(', ')||'–',
      alter_kultur: alterMap[S.alterKultur]||S.alterKultur||'–',
      pflanzenzahl_gesamt: getTotalPflanzenzahl(S),
      einzelschutz_optionen: einzelschutzLines.join('; ')||'–',
      robinienstab: S.robinienstab.aktiv?('Ja, '+S.robinienstab.menge+' Stk. (+0,70 €/Stk.)'):'Nein',
      flaechenschutz_typ: S.flaechenschutzTyp?(S.flaechenschutzTyp==='metallzaun'?'Metallzaun':'Holzzaun aus Lärche'):'–',
      wildarten: wildNamen.join(', ')||'–',
      verbissdruck: druckMap[S.verbissdruck]||S.verbissdruck||'–',
      schaelrisiko: S.wildarten.indexOf('rotwild')>-1?(S.schaelrisiko?'Ja':'Nein'):'N/A',
      ausfuehrungszeitraum: zeitMap[S.ausfuehrungszeitraum]||S.ausfuehrungszeitraum||'–',
      schutzdauer: dauerMap[S.schutzdauer]||S.schutzdauer||'–',
      wartung: S.wartung===true?'Ja':S.wartung===false?'Nein':'–',
      bemerkung: S.bemerkung||'',
      kostenindikation_min: preisData.min>0?Math.round(preisData.min)+'':'–',
      kostenindikation_max: preisData.max>0?Math.round(preisData.max)+'':'–',
      foerdercheck: S.foerdercheck||'nein',
      bundesland: S.bundesland?(blLabels[S.bundesland]||S.bundesland):'',
      foerderProgramme: (S.selectedFoerderProgs||[]).join(', '),
      name: S.name,
      email: S.email,
      tel: S.telefon||'',
    };

    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));

    fetch('/wp-json/koch/v1/anfrage', {method:'POST', credentials:'same-origin', body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(){ showOK(); })
      .catch(function(err){
        console.error('Kulturschutz-Wizard v4 Fehler:',err);
        btn.disabled=false; btn.textContent='📤 Anfrage absenden';
        var errEl=document.getElementById('e5');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';errEl.style.display='block';}
      });
  });
}

function bindProgCheckboxes(){
  document.querySelectorAll('.ks-prog-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var prog=this.dataset.prog;
      if(this.checked){
        if(S.selectedFoerderProgs.indexOf(prog)===-1) S.selectedFoerderProgs.push(prog);
      } else {
        S.selectedFoerderProgs=S.selectedFoerderProgs.filter(function(p){return p!==prog;});
      }
    });
  });
}

// ── Erfolgs-Screen ─────────────────────────────────────────────────────────────
function showOK(){ clearDraft();
  try {
    var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
    if(!korb.items) korb.items=[];
    korb.items=korb.items.filter(function(i){return i.type!=='kulturschutz';});
    var summary=getTotalHa()+'ha · '+S.flaechenArr.length+' Fläche'+(S.flaechenArr.length>1?'n':'');
    var fullState=JSON.parse(JSON.stringify(S));
    korb.items.push({type:'kulturschutz',label:'🦌 Kulturschutz',summary:summary,data:fullState,addedAt:Date.now()});
    localStorage.setItem('ka_projektkorb',JSON.stringify(korb));
    var korbCount=korb.items.length;
  } catch(e){ console.error(e); var korbCount=1; }

  document.getElementById('kaw-main').innerHTML = '<div class="ka-card"><div class="ka-success">'
    +'<div class="ka-success-icon">✅</div>'
    +'<h2>Anfrage eingegangen!</h2>'
    +'<p>Wir melden uns innerhalb von 48 Stunden mit einem unverbindlichen Angebot.</p>'
    +'<div class="ka-success-card">'
    +'<strong>🦌 Kulturschutz</strong><br>'
    +'<span style="color:#666">'+esc(summary)+' &mdash; '+esc(S.name)+'</span>'
    +'</div>'
    +'<div class="ka-success-hint">'
    +'<p style="margin:0 0 8px;font-weight:600">💡 Mehrere Leistungen kombinieren?</p>'
    +'<p style="margin:0;color:#666;font-size:0.9rem">Die meisten Projekte benötigen Flächenvorbereitung, Pflanzung UND Kulturschutz.</p>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;margin-top:20px">'
    +'<a href="/#leistungen" style="display:block;padding:14px 24px;background:#012d1d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center">➕ Weitere Leistung hinzufügen</a>'
    +'<a href="/projektkorb/" style="display:block;padding:14px 24px;background:#A3E635;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center">🛒 Zum Projektkorb ('+korbCount+')</a>'
    +'</div>'
    +'<p style="margin-top:20px;font-size:0.85rem;color:#999"><a href="/" style="color:#012d1d">← Zur Startseite</a></p>'
    +'</div></div>';
}

// ── Expose for edit-mode support ──────────────────────────────────────────────
window._ksS = S;
window._ksRender = render;

// ── Init ───────────────────────────────────────────────────────────────────────
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', function(){ try{ render(); }catch(e){ console.error(e); } });
} else {
  try{ render(); }catch(e){ console.error(e); }
}

})();

// ── Edit-Mode (URL-Parameter ?edit) ───────────────────────────────────────────
(function(){
  var params=new URLSearchParams(window.location.search);
  if(!params.has('edit')) return;
  function tryLoadEdit(){
    if(typeof window._ksS==='undefined'||typeof window._ksRender!=='function'){
      setTimeout(tryLoadEdit,100); return;
    }
    try {
      var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
      if(!korb.items) return;
      var item=korb.items.find(function(i){return i.type==='kulturschutz';});
      if(!item||!item.data) return;
      Object.keys(item.data).forEach(function(k){ window._ksS[k]=item.data[k]; });
      window._ksRender();
      var main=document.getElementById('kaw-main');
      if(main&&main.parentNode){
        var b=document.createElement('div');
        b.innerHTML='<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px;margin-bottom:16px"><strong style="color:#012d1d">✏️ Bearbeitungsmodus — Ihre gespeicherten Daten wurden geladen.</strong></div>';
        main.parentNode.insertBefore(b,main);
      }
    } catch(e){ console.error(e); }
  }
  tryLoadEdit();


/* P1: Browser-Back */
window.addEventListener("popstate",function(e){if(e.state&&typeof e.state.step==="number"){S.step=e.state.step;render();window.scrollTo(0,0);}});
/* P1: Load draft on init */
loadDraft();

})();

