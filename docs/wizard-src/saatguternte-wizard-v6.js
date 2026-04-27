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





// ── Baumarten ──────────────────────────────────────────────────────────────────
var TREES = [
  {k:'stieleiche',   name:'Stieleiche',   frucht:'Eicheln',    fovg:true,  ernteArt:'boden'},
  {k:'traubeneiche', name:'Traubeneiche', frucht:'Eicheln',    fovg:true,  ernteArt:'boden'},
  {k:'roteiche',     name:'Roteiche',     frucht:'Eicheln',    fovg:false, ernteArt:'boden'},
  {k:'kastanie',     name:'Kastanie',     frucht:'Kastanien',  fovg:false, ernteArt:'boden'},
  {k:'walnuss',      name:'Walnuss',      frucht:'Nüsse',      fovg:false, ernteArt:'boden'},
  {k:'schwarznuss',  name:'Schwarznuss',  frucht:'Nüsse',      fovg:false, ernteArt:'boden'},
];
var TM = {};
TREES.forEach(function(t){ TM[t.k]=t; });

// ── FoVG Herkunftsgebiete ──────────────────────────────────────────────────────
var FORVG_HKG = {
  stieleiche: { name:'Stieleiche', regulated:true, gebiete:[
    {code:'817 01',name:'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht'},
    {code:'817 02',name:'Ostsee-Küstenraum'},
    {code:'817 03',name:'Heide und Altmark'},
    {code:'817 04',name:'Ostdeutsches Tiefland'},
    {code:'817 05',name:'Mitteldeutsches Tief- und Hügelland'},
    {code:'817 06',name:'Westdeutsches Bergland'},
    {code:'817 07',name:'Oberrheingraben'},
    {code:'817 08',name:'Südostdeutsches Hügel- und Bergland'},
    {code:'817 09',name:'Süddeutsches Hügel- und Bergland sowie Alpen'},
  ]},
  traubeneiche: { name:'Traubeneiche', regulated:true, gebiete:[
    {code:'818 01',name:'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht'},
    {code:'818 02',name:'Ostsee-Küstenraum'},
    {code:'818 03',name:'Heide und Altmark'},
    {code:'818 04',name:'Ostdeutsches Tiefland'},
    {code:'818 05',name:'Mitteldeutsches Tief- und Hügelland'},
    {code:'818 06',name:'Rheinisches und Saarbergland'},
    {code:'818 07',name:'Harz, Weser- und Hessisches Bergland außer Spessart'},
    {code:'818 08',name:'Pfälzerwald'},
    {code:'818 09',name:'Oberrheingraben'},
    {code:'818 10',name:'Spessart'},
    {code:'818 11',name:'Fränkisches Hügelland'},
    {code:'818 12',name:'Südostdeutsches Hügel- und Bergland'},
    {code:'818 13',name:'Süddeutsches Mittelgebirgsland sowie Alpen'},
  ]},
  rotbuche: { name:'Rotbuche', regulated:true, gebiete:[
    {code:'810 01',name:'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht'},
    {code:'810 02',name:'Ostsee-Küstenraum'},
    {code:'810 03',name:'Heide und Altmark'},
    {code:'810 04',name:'Nordostbrandenburgisches Tiefland'},
    {code:'810 05',name:'Märkisch-Lausitzer Tiefland'},
    {code:'810 06',name:'Mitteldeutsches Tief- und Hügelland'},
    {code:'810 07',name:'Rheinisches und Saarpfälzer Bergland, kolline Stufe'},
    {code:'810 08',name:'Rheinisches und Saarpfälzer Bergland, montane Stufe'},
    {code:'810 09',name:'Harz, Weser- und Hessisches Bergland, kolline Stufe'},
    {code:'810 10',name:'Harz, Weser- und Hessisches Bergland, montane Stufe'},
    {code:'810 11',name:'Thüringer Wald, Fichtelgebirge und Vogtland, kolline Stufe'},
    {code:'810 12',name:'Thüringer Wald, Fichtelgebirge und Vogtland, montane Stufe'},
    {code:'810 13',name:'Erzgebirge mit Vorland, kolline Stufe'},
    {code:'810 14',name:'Erzgebirge mit Vorland, montane Stufe'},
    {code:'810 15',name:'Erzgebirge mit Vorland, hochmontane Stufe'},
    {code:'810 16',name:'Oberrheingraben'},
    {code:'810 17',name:'Württembergisch-Fränkisches Hügelland'},
    {code:'810 18',name:'Fränkische Alb'},
    {code:'810 19',name:'Bayerischer und Oberpfälzer Wald, submontane Stufe'},
    {code:'810 20',name:'Bayerischer und Oberpfälzer Wald, montane Stufe'},
    {code:'810 21',name:'Schwarzwald, submontane Stufe'},
    {code:'810 22',name:'Schwarzwald, hochmontane Stufe'},
    {code:'810 23',name:'Schwäbische Alb'},
    {code:'810 24',name:'Alpenvorland'},
    {code:'810 25',name:'Alpen, submontane Stufe'},
    {code:'810 26',name:'Alpen, hochmontane Stufe'},
  ]},
  bergahorn: { name:'Bergahorn', regulated:true, gebiete:[
    {code:'801 01',name:'Norddeutsches Tiefland'},
    {code:'801 02',name:'Mittel- und Ostdeutsches Tief- und Hügelland'},
    {code:'801 03',name:'Westdeutsches Bergland, kolline Stufe'},
    {code:'801 04',name:'Westdeutsches Bergland, montane Stufe'},
    {code:'801 05',name:'Oberrheingraben'},
    {code:'801 06',name:'Süddeutsches Hügel- und Bergland, kolline Stufe'},
    {code:'801 07',name:'Süddeutsches Hügel- und Bergland, montane Stufe'},
    {code:'801 08',name:'Süddeutsches Hügel- und Bergland, kolline Stufe (Ost)'},
    {code:'801 09',name:'Süddeutsches Hügel- und Bergland, montane Stufe (Ost)'},
    {code:'801 10',name:'Alpen und Alpenvorland, submontane Stufe'},
    {code:'801 11',name:'Alpen und Alpenvorland, hochmontane Stufe'},
  ]},
  douglasie: { name:'Douglasie', regulated:true, gebiete:[
    {code:'853 01',name:'Nordwestdeutsches Tiefland mit Schleswig-Holstein'},
    {code:'853 02',name:'Nordostdeutsches Tiefland außer Schleswig-Holstein'},
    {code:'853 03',name:'Mittel- und Ostdeutsches Tief- und Hügelland'},
    {code:'853 04',name:'West- und Süddeutsches Hügel- und Bergland sowie Alpen, kolline Stufe'},
    {code:'853 05',name:'West- und Süddeutsches Hügel- und Bergland sowie Alpen, montane Stufe'},
    {code:'853 06',name:'Südostdeutsches Hügel- und Bergland'},
  ]},
  weisstanne: { name:'Weißtanne', regulated:true, gebiete:[
    {code:'827 01',name:'Nordsee-Küstenraum und Rheinisch-Westfälische Bucht'},
    {code:'827 02',name:'Nordostdeutsches Tiefland und Niedersächsisches Binnenland'},
    {code:'827 03',name:'Mittel- und Ostdeutsches Tief- und Hügelland außer Niederlausitz'},
    {code:'827 04',name:'Niederlausitz'},
    {code:'827 05',name:'Westdeutsches Bergland und Oberrheingraben'},
    {code:'827 06',name:'Thüringisch-Sächsisch-Nordostbayerische Mittelgebirge'},
    {code:'827 07',name:'Bayerischer und Oberpfälzer Wald'},
    {code:'827 08',name:'Schwarzwald und Albtrauf'},
    {code:'827 09',name:'Schwäbisch-Fränkischer Wald'},
    {code:'827 10',name:'Übriges Süddeutschland'},
    {code:'827 11',name:'Alpen und Alpenvorland, submontane Stufe'},
    {code:'827 12',name:'Alpen und Alpenvorland, hochmontane Stufe'},
  ]},
  waldkiefer: { name:'Waldkiefer', regulated:true, gebiete:[
    {code:'851 01',name:'Nordsee-Küstenraum und Rheinisch-Westfälische Bucht'},
    {code:'851 02',name:'Mecklenburg'},
    {code:'851 03',name:'Heide und Altmark'},
    {code:'851 04',name:'Mittel- und Ostdeutsches Tiefland'},
    {code:'851 05',name:'Westdeutsches Bergland, kolline Stufe'},
    {code:'851 06',name:'Westdeutsches Bergland, montane Stufe'},
    {code:'851 07',name:'Vogtland, Thüringer Wald und Frankenwald, kolline Stufe'},
    {code:'851 08',name:'Vogtland, Thüringer Wald und Frankenwald, montane Stufe'},
    {code:'851 09',name:'Thüringisch-Sächsisches Hügelland'},
    {code:'851 10',name:'Erzgebirge, kolline Stufe'},
    {code:'851 11',name:'Erzgebirge, montane Stufe'},
    {code:'851 12',name:'Oberes Vogtland und Nordostbayerische Mittelgebirge'},
    {code:'851 13',name:'Oberrheingraben'},
    {code:'851 14',name:'Neckarland und Fränkische Platte'},
    {code:'851 15',name:'Mittelfränkisches Hügelland'},
    {code:'851 16',name:'Alb'},
    {code:'851 17',name:'Ostbayerische Mittelgebirge, kolline Stufe'},
    {code:'851 18',name:'Ostbayerische Mittelgebirge, montane Stufe'},
    {code:'851 19',name:'Schwarzwald, kolline Stufe'},
    {code:'851 20',name:'Schwarzwald, montane Stufe'},
    {code:'851 21',name:'Alpenvorland'},
    {code:'851 22',name:'Alpen, submontane Stufe'},
    {code:'851 23',name:'Alpen, hochmontane Stufe'},
  ]},
};

// ── Herkunfts-Kategorien ───────────────────────────────────────────────────────
var HKG_KAT = [
  {k:'quellengesichert', label:'Q – Quellengesichert'},
  {k:'ausgewaehlt',      label:'A – Ausgewählt (phänotypisch selektiert)'},
  {k:'qualifiziert',     label:'G – Qualifiziert (genetisch geprüft)'},
  {k:'geprueft',         label:'P – Geprüft (Nachkommenschaftsprüfung)'},
];

// ── Waldbesitzertyp ────────────────────────────────────────────────────────────
var BESITZERTYP = [
  {k:'privatperson',   label:'Privatperson'},
  {k:'personengesell', label:'Personengesellschaft'},
  {k:'koerperschaft',  label:'Körperschaft d. öffentl. Rechts'},
  {k:'kommunal',       label:'Kommunal/Staatlich'},
];

// ── Kostensätze ────────────────────────────────────────────────────────────────
var KOSTEN = {
  boden:       {min:0.50, max:1.20, label:'Bodenaufsammlung: 0,50–1,20 €/kg'},
  aufbereitung:{min:0.30, max:0.80, label:'Aufbereitung: +0,30–0,80 €/kg'},
};

// ── Step labels ────────────────────────────────────────────────────────────────
var STEP_LABELS = ['Besitzertyp','Baumarten','Herkunft','Standort','Logistik','Zeitraum','Kontakt'];
var TOTAL_STEPS = 7;

// ── State ──────────────────────────────────────────────────────────────────────
function newStandort(id){
  return { id: id||Date.now(), plz:'', ort:'', forstamt:'', revier:'', gps:'' };
}
var S = {
  step: 0,
  // Step 0: Waldbesitzertyp
  besitzertyp: '',
  // Step 1: Baumarten & Erntemenge
  treeKg: {},
  // Step 2: Herkunft & Zertifizierung
  herkunft: {},
  verwendungszweck: '',
  bestandsregister: '',
  // Step 3: Standort (Multi-Standorte)
  standorteArr: [newStandort(1)],
  treffpunkt: '',
  // Step 4: Logistik & Services
  logistikOptions: [],
  // Step 5: Erntezeitraum
  erntejahr: (new Date().getFullYear()+1).toString(),
  erntefenster: '',
  planung: '',
  // Step 6: Kontakt
  name: '', tel: '', email: '', bemerkung: '',
  dsgvo: false,
};
TREES.forEach(function(t){ S.treeKg[t.k]=0; });

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-saatguternte-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});
if(!S.standorteArr||!S.standorteArr.length){
  S.standorteArr=[newStandort(1)];
  if(p.plz) S.standorteArr[0].plz=p.plz;
  if(p.ort) S.standorteArr[0].ort=p.ort;
  if(p.forstamt) S.standorteArr[0].forstamt=p.forstamt;
  if(p.revier) S.standorteArr[0].revier=p.revier;
  if(p.gps) S.standorteArr[0].gps=p.gps;
}}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent=''; e.style.display='none';} }
function go(n){ S.step=n; saveDraft(); try{history.pushState({step:n},"","#step-"+n);}catch(e){} render(); kawSyncFooter(); window.scrollTo(0,0); }
function getSelTrees(){ return TREES.filter(function(t){ return (S.treeKg[t.k]||0)>0; }); }

function checkMindestmenge(){
  var warns=[];
  TREES.forEach(function(t){
    var kg=S.treeKg[t.k]||0;
    if(kg>0 && kg<500) warns.push(t.name+': '+kg+' kg');
  });
  return warns;
}

function calcKosten(){
  var sel=getSelTrees();
  if(sel.length===0) return null;
  var totalKg=sel.reduce(function(s,t){ return s+(S.treeKg[t.k]||0); },0);
  if(totalKg===0) return null;
  var minGes=totalKg*KOSTEN.boden.min;
  var maxGes=totalKg*KOSTEN.boden.max;
  if(S.logistikOptions.indexOf('aufbereitung')>-1){
    minGes+=totalKg*KOSTEN.aufbereitung.min;
    maxGes+=totalKg*KOSTEN.aufbereitung.max;
  }
  return {totalKg:totalKg, min:minGes, max:maxGes};
}

function fmtEur(n){ return n.toLocaleString('de-DE',{minimumFractionDigits:0,maximumFractionDigits:0}); }

// ── Progress Bar ───────────────────────────────────────────────────────────────
function renderProgress(){
  var labels=['Besitzer','Standort','Standorte','Baumarten','Zeitraum','Kontakt'];
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
  var root=document.getElementById('pf');
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

  var main=document.getElementById('kaw-main');
  if(!main) return;
  switch(S.step){
    case 0: main.innerHTML=s0(); bind0(); break;
    case 1: main.innerHTML=s1(); bind1(); break;
    case 2: main.innerHTML=s2(); bind2(); break;
    case 3: main.innerHTML=s3(); bind3(); break;
    case 4: main.innerHTML=s4(); bind4(); break;
    case 5: main.innerHTML=s5(); bind5(); break;
    case 6: main.innerHTML=s6(); bind6(); break;
  }
}

// ── Step 0: Waldbesitzertyp ────────────────────────────────────────────────────
function s0(){
  var opts=BESITZERTYP.map(function(b){
    var on=S.besitzertyp===b.k;
    return '<button type="button" class="ka-card-option'+(on?' selected':'')+'" data-bk="'+b.k+'">'
      +'<span class="ka-card-name">'+esc(b.label)+'</span>'
      +'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🏡 Waldbesitzertyp</h2>'
    +'<p>Welche Art von Waldbesitzer sind Sie? Dies beeinflusst Förderoptionen und Zertifizierungsanforderungen.</p>'
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
    btn.addEventListener('click',function(){
      S.besitzertyp=this.dataset.bk;
      document.querySelectorAll('[data-bk]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e0');
    });
  });
  document.getElementById('n0').addEventListener('click',function(){
    if(!S.besitzertyp){ showErr('e0','Bitte Waldbesitzertyp wählen.'); return; }
    go(1);
  });
}

// ── Step 1: Baumarten & Erntemenge ────────────────────────────────────────────
function s1(){
  var cards=TREES.map(function(t){
    var kg=S.treeKg[t.k]||0, on=kg>0;
    var fovgBadge=t.fovg
      ? '<span class="ka-tag" style="font-size:10px;padding:2px 6px;margin-left:6px">FoVG</span>'
      : '';
    return '<div class="ka-card-option'+(on?' selected':'')+' sg-tree-card" id="tc-'+t.k+'" style="margin-bottom:10px">'
      +'<div style="display:flex;align-items:center;justify-content:space-between">'
      +'<div>'
      +'<span class="ka-card-name">'+esc(t.name)+fovgBadge+'</span>'
      +'<span class="ka-card-sub">'+esc(t.frucht)+'</span>'
      +'</div>'
      +'<div class="ka-qty">'
      +'<button type="button" class="ka-qty-btn sg-qb" data-k="'+t.k+'" data-d="-500">−</button>'
      +'<input class="ka-qty-input sg-qi" type="number" min="0" step="500" id="qi-'+t.k+'" value="'+kg+'" data-k="'+t.k+'">'
      +'<button type="button" class="ka-qty-btn sg-qb" data-k="'+t.k+'" data-d="500">+</button>'
      +'<span style="font-size:12px;color:var(--kaw-text-light);min-width:18px">kg</span>'
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var totalKg=TREES.reduce(function(s,t){ return s+(S.treeKg[t.k]||0); },0);

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🌳 Baumarten &amp; Erntemenge</h2>'
    +'<p>Wählen Sie die Baumarten und geben Sie die gewünschte Erntemenge in kg an. Mindestmenge: 500 kg je Art.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +cards
    +'<div class="ka-price-box" style="margin-top:4px">'
    +'<span>Gesamtmenge Saatgut:</span>'
    +'<strong id="sg-total">'+totalKg+' kg</strong>'
    +'</div>'
    +'<div class="ka-err" id="e1"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b1">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n1">Weiter →</button>'
    +'</div></div>';
}

function bind1(){
  function updateTree(k){
    var kg=S.treeKg[k]||0, on=kg>0;
    var card=document.getElementById('tc-'+k);
    if(card){
      if(on) card.classList.add('selected');
      else card.classList.remove('selected');
    }
    var totalKg=TREES.reduce(function(s,t){ return s+(S.treeKg[t.k]||0); },0);
    var el=document.getElementById('sg-total');
    if(el) el.textContent=totalKg+' kg';
  }
  document.querySelectorAll('.sg-qb').forEach(function(btn){
    btn.addEventListener('click',function(){
      var k=this.dataset.k, d=parseInt(this.dataset.d);
      S.treeKg[k]=Math.max(0,(S.treeKg[k]||0)+d);
      document.getElementById('qi-'+k).value=S.treeKg[k];
      updateTree(k);
    });
  });
  document.querySelectorAll('.sg-qi').forEach(function(inp){
    inp.addEventListener('input',function(){
      var k=this.dataset.k;
      S.treeKg[k]=Math.max(0,parseInt(this.value)||0);
      updateTree(k);
    });
  });
  document.getElementById('b1').addEventListener('click',function(){ go(0); });
  document.getElementById('n1').addEventListener('click',function(){
    var total=TREES.reduce(function(s,t){ return s+(S.treeKg[t.k]||0); },0);
    if(total===0){ showErr('e1','Bitte mindestens eine Baumart mit Erntemenge (kg) auswählen.'); return; }
    var mw=checkMindestmenge();
    if(mw.length>0){ showErr('e1','Mindestmenge unterschritten: '+mw.join(', ')+'. Bitte mindestens 500 kg je Baumart.'); return; }
    hideErr('e1');
    go(2);
  });
}

// ── Step 2: Herkunft & Zertifizierung ─────────────────────────────────────────
function s2(){
  var sel=getSelTrees();

  var herkunftRows=sel.map(function(t){
    var fvg=FORVG_HKG[t.k];
    var cur=S.herkunft[t.k]||{};
    if(!fvg||!fvg.regulated){
      return '<div class="ka-card-option" style="margin-bottom:10px;cursor:default">'
        +'<span class="ka-card-name">'+esc(t.name)+'</span>'
        +'<span class="ka-card-sub">Nicht FoVG-reguliert – kein Herkunftsnachweis erforderlich</span>'
        +'</div>';
    }
    var hkgOpts=fvg.gebiete.map(function(g){
      return '<option value="'+esc(g.code)+'"'+(cur.hkg===g.code?' selected':'')+'>'+esc(g.code)+' – '+esc(g.name)+'</option>';
    }).join('');
    var katOpts=HKG_KAT.map(function(k){
      return '<option value="'+k.k+'"'+(cur.kat===k.k?' selected':'')+'>'+esc(k.label)+'</option>';
    }).join('');
    return '<div style="padding:14px;background:var(--kaw-warn-bg);border:1px solid rgba(197,165,90,0.3);border-radius:var(--kaw-radius);margin-bottom:12px">'
      +'<div style="font-weight:700;font-size:13px;color:var(--kaw-warn);margin-bottom:10px">🔖 '+esc(t.name)+' <span style="font-weight:400;color:var(--kaw-text-light);font-size:11px">FoVG-pflichtig</span></div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">Herkunftsgebiet (HKG) *</label>'
      +'<select class="ka-select sg-hkg-sel" data-k="'+t.k+'">'
      +'<option value="">— Herkunftsgebiet wählen —</option>'+hkgOpts
      +'</select>'
      +'</div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">Saatgutkategorie *</label>'
      +'<select class="ka-select sg-kat-sel" data-k="'+t.k+'">'
      +'<option value="">— Kategorie wählen —</option>'+katOpts
      +'</select>'
      +'</div>'
      +'</div>';
  }).join('');

  var zweckOpts=['Forstbaumschule','Staatsdepot','Eigenverwendung'].map(function(z){
    return '<option value="'+z+'"'+(S.verwendungszweck===z?' selected':'')+'>'+z+'</option>';
  }).join('');

  var registerOpts=[['ja','Ja, vorhanden'],['nein','Nein, noch nicht']].map(function(r){
    return '<option value="'+r[0]+'"'+(S.bestandsregister===r[0]?' selected':'')+'>'+r[1]+'</option>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📋 Herkunft &amp; Zertifizierung</h2>'
    +'<p>Für FoVG-regulierte Baumarten ist das Herkunftsgebiet nach Forstvermehrungsgutgesetz anzugeben.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-info-box warn">'
    +'<strong>FoVG-Hinweis:</strong> Regulierte Baumarten benötigen das Herkunftsgebiet (HKG-Code) und die Saatgutkategorie. '
    +'Nur zertifiziertes Saatgut darf für die gewerbliche Forstbaumschulanzucht und staatliche Depots verwendet werden.'
    +'</div>'
    +(sel.length>0?herkunftRows:'<p style="color:var(--kaw-text-light);font-size:13px">Keine Baumarten ausgewählt.</p>')
    +'<div class="ka-field">'
    +'<label class="ka-label">Verwendungszweck *</label>'
    +'<select class="ka-select" id="i-zweck"><option value="">— bitte wählen —</option>'+zweckOpts+'</select>'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Bestandsregister vorhanden? *</label>'
    +'<select class="ka-select" id="i-register"><option value="">— bitte wählen —</option>'+registerOpts+'</select>'
    +'</div>'
    +'<div class="ka-err" id="e2"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b2">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n2">Weiter →</button>'
    +'</div></div>';
}

function bind2(){
  document.querySelectorAll('.sg-hkg-sel').forEach(function(sel){
    sel.addEventListener('change',function(){
      var k=this.dataset.k; if(!S.herkunft[k]) S.herkunft[k]={};
      S.herkunft[k].hkg=this.value;
    });
  });
  document.querySelectorAll('.sg-kat-sel').forEach(function(sel){
    sel.addEventListener('change',function(){
      var k=this.dataset.k; if(!S.herkunft[k]) S.herkunft[k]={};
      S.herkunft[k].kat=this.value;
    });
  });
  document.getElementById('i-zweck').addEventListener('change',function(){ S.verwendungszweck=this.value; });
  document.getElementById('i-register').addEventListener('change',function(){ S.bestandsregister=this.value; });
  document.getElementById('b2').addEventListener('click',function(){ go(1); });
  document.getElementById('n2').addEventListener('click',function(){
    S.verwendungszweck=document.getElementById('i-zweck').value;
    S.bestandsregister=document.getElementById('i-register').value;
    var sel=getSelTrees();
    var missing=sel.filter(function(t){
      if(!t.fovg) return false;
      var h=S.herkunft[t.k];
      return !h||!h.hkg||!h.kat;
    });
    if(missing.length>0){
      showErr('e2','Bitte für folgende Baumarten Herkunftsgebiet und Kategorie angeben: '+missing.map(function(t){return t.name;}).join(', '));
      return;
    }
    if(!S.verwendungszweck){ showErr('e2','Bitte Verwendungszweck wählen.'); return; }
    if(!S.bestandsregister){ showErr('e2','Bitte Bestandsregister-Status angeben.'); return; }
    hideErr('e2');
    go(3);
  });
}

// ── Multi-Standorte Helpers ───────────────────────────────────────────────────
function addStandort(){
  var maxId=S.standorteArr.reduce(function(m,f){return Math.max(m,f.id);},0);
  S.standorteArr.push(newStandort(maxId+1));
  render();
}
function removeStandort(id){
  S.standorteArr=S.standorteArr.filter(function(f){return f.id!==id;});
  render();
}
function renderStandortBlocks(){
  return S.standorteArr.map(function(st,idx){
    var title=S.standorteArr.length>1?'Standort '+(idx+1):'Standort';
    var delBtn=idx>0?'<button type="button" class="ka-flaeche-del" onclick="removeStandort('+st.id+')">✕ Entfernen</button>':'';
    return '<div class="ka-flaeche" data-st-id="'+st.id+'">'
      +'<div class="ka-flaeche-header"><span class="ka-flaeche-title">📍 '+title+'</span>'+delBtn+'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">PLZ *</label>'
      +'<input class="ka-inp st-plz" type="text" inputmode="numeric" data-st="'+st.id+'" value="'+esc(st.plz)+'" placeholder="z.B. 83229" autocomplete="postal-code"></div>'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">Ort *</label>'
      +'<input class="ka-inp st-ort" type="text" data-st="'+st.id+'" value="'+esc(st.ort)+'" placeholder="z.B. Aschau im Chiemgau" autocomplete="address-level2"></div>'
      +'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field"><label class="ka-label">Forstamt *</label>'
      +'<input class="ka-inp st-forstamt" type="text" data-st="'+st.id+'" value="'+esc(st.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
      +'<div class="ka-field"><label class="ka-label">Revier <span class="ka-label-optional">(optional)</span></label>'
      +'<input class="ka-inp st-revier" type="text" data-st="'+st.id+'" value="'+esc(st.revier)+'" placeholder="z.B. Revier 3" autocomplete="off"></div>'
      +'</div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">GPS-Koordinaten <span class="ka-label-optional">(optional)</span></label>'
      +'<div class="ka-gps-row">'
      +'<input class="ka-inp st-gps" type="text" data-st="'+st.id+'" value="'+esc(st.gps)+'" placeholder="z.B. 51.1234, 8.5678">'
      +'<button type="button" class="ka-gps-btn st-gps-btn" data-st="'+st.id+'">📍 Standort</button>'
      +'</div>'
      +'<div class="ka-gps-info" id="gps-info-'+st.id+'"></div>'
      +'</div>'
      +'</div>';
  }).join('');
}

// ── Step 3: Standort ───────────────────────────────────────────────────────────
function s3(){
  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📍 Standort</h2>'
    +'<p>Wo befinden sich die Erntebäume? Sie können mehrere Standorte angeben.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +renderStandortBlocks()
    +'<button type="button" class="ka-add-btn" onclick="addStandort()">＋ Weiteren Standort hinzufügen</button>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Treffpunkt mit Ernteteam <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="text" id="i-treffpunkt" value="'+esc(S.treffpunkt)+'" placeholder="z.B. Parkplatz Waldweg, Forststraße km 3">'
    +'<p class="ka-hint">Wo soll das Ernteteam Sie treffen? GPS-Koordinaten oder Wegbeschreibung.</p>'
    +'</div>'
    +'<div class="ka-err" id="e3"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b3">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n3">Weiter →</button>'
    +'</div></div>';
}

function bind3(){
  S.standorteArr.forEach(function(st){
    var plzInp=document.querySelector('.st-plz[data-st="'+st.id+'"]');
    var ortInp=document.querySelector('.st-ort[data-st="'+st.id+'"]');
    var faInp=document.querySelector('.st-forstamt[data-st="'+st.id+'"]');
    var revInp=document.querySelector('.st-revier[data-st="'+st.id+'"]');
    var gpsInp=document.querySelector('.st-gps[data-st="'+st.id+'"]');
    if(plzInp) plzInp.addEventListener('input',function(){ st.plz=this.value; });
    if(ortInp) ortInp.addEventListener('input',function(){ st.ort=this.value; });
    if(faInp) faInp.addEventListener('input',function(){ st.forstamt=this.value; });
    if(revInp) revInp.addEventListener('input',function(){ st.revier=this.value; });
    if(gpsInp) gpsInp.addEventListener('input',function(){ st.gps=this.value; });
    if(plzInp && ortInp && window.bindPlzAutocomplete) window.bindPlzAutocomplete(plzInp, ortInp, faInp);
    var gpsBtn=document.querySelector('.st-gps-btn[data-st="'+st.id+'"]');
    if(gpsBtn) gpsBtn.addEventListener('click',function(){
      var info=document.getElementById('gps-info-'+st.id);
      if(!navigator.geolocation){
        if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a></span>';
        return;
      }
      if(info) info.textContent='Standort wird ermittelt...';
      navigator.geolocation.getCurrentPosition(function(pos){
        var coords=pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6);
        st.gps=coords;
        if(gpsInp) gpsInp.value=coords;
        if(info) info.textContent='Koordinaten: '+coords;
      },function(){
        if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a></span>';
      },{enableHighAccuracy:true,timeout:10000,maximumAge:0});
    });
  });

  var treffpunktInp=document.getElementById('i-treffpunkt');
  if(treffpunktInp) treffpunktInp.addEventListener('input',function(){ S.treffpunkt=this.value; });

  function collectStandorte(){
    S.standorteArr.forEach(function(st){
      var p=document.querySelector('.st-plz[data-st="'+st.id+'"]');
      var o=document.querySelector('.st-ort[data-st="'+st.id+'"]');
      var f=document.querySelector('.st-forstamt[data-st="'+st.id+'"]');
      var r=document.querySelector('.st-revier[data-st="'+st.id+'"]');
      var g=document.querySelector('.st-gps[data-st="'+st.id+'"]');
      if(p) st.plz=p.value;
      if(o) st.ort=o.value;
      if(f) st.forstamt=f.value;
      if(r) st.revier=r.value;
      if(g) st.gps=g.value;
    });
    var t=document.getElementById('i-treffpunkt');
    if(t) S.treffpunkt=t.value;
  }

  document.getElementById('b3').addEventListener('click',function(){ collectStandorte(); go(2); });
  document.getElementById('n3').addEventListener('click',function(){
    collectStandorte();
    for(var i=0;i<S.standorteArr.length;i++){
      var st=S.standorteArr[i];
      var label=S.standorteArr.length>1?' (Standort '+(i+1)+')':'';
      if(!st.plz.trim()){ showErr('e3','Bitte PLZ eingeben'+label+'.'); return; }
      if(!st.ort.trim()){ showErr('e3','Bitte Ort eingeben'+label+'.'); return; }
      if(!st.forstamt.trim()){ showErr('e3','Bitte Forstamt angeben'+label+'.'); return; }
    }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Logistik & Services ────────────────────────────────────────────────
var LOGISTIK_OPTS=[
  ['vollservice','Vollservice','Koch Aufforstung übernimmt die komplette Ernte inkl. Anmeldung, Erkundung und Aufsammlung.'],
  ['erkundung','Erkundung','Erkundung der Flächen vor Ort. Drohne und Fernglas sind im Service enthalten.'],
  ['bodenaufsammlung','Bodenaufsammlung','Eigenständige Aufsammlung vom Boden – Eicheln, Kastanien und Nüsse. (0,50–1,20 €/kg)'],
  ['anmeldung','Anmeldung und Registrierung','Koch Aufforstung übernimmt die Anmeldung und Registrierung beim zuständigen Forstamt.'],
];

function s4(){
  var checks=LOGISTIK_OPTS.map(function(o){
    var checked=S.logistikOptions.indexOf(o[0])>-1;
    return '<label class="ka-check-card'+(checked?' selected':'')+'">'
      +'<input type="checkbox" name="logistikOptions" value="'+o[0]+'"'+(checked?' checked':'')+'>'
      +'<div>'
      +'<div style="font-weight:700;font-size:14px;color:var(--kaw-text)">'+esc(o[1])+'</div>'
      +'<div style="font-size:12px;color:var(--kaw-text-muted);margin-top:2px">'+esc(o[2])+'</div>'
      +'</div>'
      +'</label>';
  }).join('');

  var kosten=calcKosten();
  var kostenBox='';
  if(kosten){
    kostenBox='<div class="ka-price-box" style="margin-top:12px">'
      +'<span>Kostenindikation für '+kosten.totalKg+' kg Saatgut:</span>'
      +'<strong>'+fmtEur(kosten.min)+' – '+fmtEur(kosten.max)+' €</strong>'
      +'</div>'
      +'<p class="ka-hint" style="text-align:center">Unverbindliche Schätzung – endgültiger Preis nach Vor-Ort-Erkundung.</p>';
  }

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🔧 Logistik &amp; Services</h2>'
    +'<p>Welche Leistungen soll Koch Aufforstung übernehmen?</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Leistungsumfang *</label>'
    +checks
    +'</div>'
    +kostenBox
    +'<div class="ka-err" id="e4"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b4">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n4">Weiter →</button>'
    +'</div></div>';
}

function bind4(){
  document.querySelectorAll('input[name="logistikOptions"]').forEach(function(cb){
    cb.addEventListener('change',function(){
      var v=this.value, idx=S.logistikOptions.indexOf(v);
      if(this.checked && idx===-1) S.logistikOptions.push(v);
      if(!this.checked && idx>-1) S.logistikOptions.splice(idx,1);
      var lbl=this.closest('.ka-check-card');
      if(lbl){
        if(this.checked) lbl.classList.add('selected');
        else lbl.classList.remove('selected');
      }
    });
  });
  document.getElementById('b4').addEventListener('click',function(){ go(3); });
  document.getElementById('n4').addEventListener('click',function(){
    if(S.logistikOptions.length===0){ showErr('e4','Bitte mindestens eine Leistungsoption wählen.'); return; }
    hideErr('e4');
    go(5);
  });
}

// ── Step 5: Erntezeitraum ─────────────────────────────────────────────────────
function s5(){
  var curYear=new Date().getFullYear();
  var jahreOpts=[curYear,curYear+1,curYear+2].map(function(y){
    return '<option value="'+y+'"'+(S.erntejahr===String(y)?' selected':'')+'>'+y+'</option>';
  }).join('');

  var erntefensterOpts=[
    {k:'frueh',  label:'Frühernte (August – September)', desc:'Ideal für Eicheln, Bucheckern – höchste Qualität'},
    {k:'haupt',  label:'Haupternte (Oktober – November)', desc:'Standardtermin für alle Baumarten'},
  ].map(function(o){
    var on=S.erntefenster===o.k;
    return '<div class="ka-radio-card'+(on?' selected':'')+'" data-ef="'+o.k+'">'
      +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label">'+esc(o.label)+'</div>'
      +'<div class="ka-radio-desc">'+esc(o.desc)+'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var planungOpts=[
    {k:'einmalig',    label:'Einmalige Ernte',         desc:''},
    {k:'jaehrlich',   label:'Jährliche Ernte',         desc:'Langfristige Partnerschaft, jedes Jahr'},
    {k:'mehrjaehrig', label:'Mehrjährige Planung',     desc:'Festgelegter Rahmenvertrag über mehrere Jahre'},
  ].map(function(o){
    var on=S.planung===o.k;
    return '<div class="ka-radio-card'+(on?' selected':'')+'" data-pl="'+o.k+'">'
      +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label">'+esc(o.label)+'</div>'
      +(o.desc?'<div class="ka-radio-desc">'+esc(o.desc)+'</div>':'')
      +'</div>'
      +'</div>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📅 Erntezeitraum</h2>'
    +'<p>Wann soll die Ernte stattfinden?</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Erntejahr *</label>'
    +'<select class="ka-select" id="i-jahr">'+jahreOpts+'</select>'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Erntefenster *</label>'
    +'<div class="ka-cards-stacked">'+erntefensterOpts+'</div>'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Planungshorizont *</label>'
    +'<div class="ka-cards-stacked">'+planungOpts+'</div>'
    +'</div>'
    +'<div class="ka-err" id="e5"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b5">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n5">Weiter →</button>'
    +'</div></div>';
}

function bind5(){
  document.getElementById('i-jahr').addEventListener('change',function(){ S.erntejahr=this.value; });
  document.querySelectorAll('[data-ef]').forEach(function(el){
    el.addEventListener('click',function(){
      S.erntefenster=this.dataset.ef;
      render();
    });
  });
  document.querySelectorAll('[data-pl]').forEach(function(el){
    el.addEventListener('click',function(){
      S.planung=this.dataset.pl;
      render();
    });
  });
  document.getElementById('b5').addEventListener('click',function(){
    S.erntejahr=document.getElementById('i-jahr').value;
    go(4);
  });
  document.getElementById('n5').addEventListener('click',function(){
    S.erntejahr=document.getElementById('i-jahr').value;
    if(!S.erntefenster){ showErr('e5','Bitte Erntefenster wählen.'); return; }
    if(!S.planung){ showErr('e5','Bitte Planungshorizont wählen.'); return; }
    hideErr('e5');
    go(6);
  });
}

// ── Step 6: Kontakt + Zusammenfassung + Absenden ──────────────────────────────
function s6(){
  var sel=getSelTrees();
  var kosten=calcKosten();

  // Baumarten-Tags
  var baumTags=sel.map(function(t){
    return '<span class="ka-tag">'
      +esc(t.name)+' · '+S.treeKg[t.k]+' kg'
      +(t.fovg?' <span style="font-size:10px;opacity:.7">FoVG</span>':'')
      +'</span>';
  }).join('');

  // FoVG-Herkunft-Zusammenfassung
  var fovgSel=sel.filter(function(t){ return t.fovg&&FORVG_HKG[t.k]; });
  var fovgRows=fovgSel.map(function(t){
    var fvg=FORVG_HKG[t.k];
    var h=S.herkunft[t.k]||{};
    var g=fvg.gebiete.find(function(x){return x.code===h.hkg;});
    var kat=HKG_KAT.find(function(x){return x.k===h.kat;});
    return '<div class="ka-summary-row">'
      +'<span class="ka-summary-label">'+esc(t.name)+'</span>'
      +'<span class="ka-summary-value">'+(g?esc(g.code)+' – '+esc(g.name):'–')
      +(kat?' <span style="color:var(--kaw-gold);font-size:11px">('+esc(kat.label.split('–')[0].trim())+')</span>':'')
      +'</span></div>';
  }).join('');

  var erntefensterMap={frueh:'Frühernte (Aug–Sep)',haupt:'Haupternte (Okt–Nov)'};
  var planungMap={einmalig:'Einmalig',jaehrlich:'Jährlich',mehrjaehrig:'Mehrjährig'};
  var logistikMap={vollservice:'Vollservice',erkundung:'Erkundung',bodenaufsammlung:'Bodenaufsammlung',anmeldung:'Anmeldung & Registrierung'};
  var besitzerMap={};
  BESITZERTYP.forEach(function(b){ besitzerMap[b.k]=b.label; });

  var btLabel=besitzerMap[S.besitzertyp]||S.besitzertyp||'–';

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>✅ Kontakt &amp; Zusammenfassung</h2>'
    +'<p>Bitte Kontaktdaten eingeben und Anfrage absenden.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // Zusammenfassung
    +'<div class="ka-summary">'
    +'<div class="ka-summary-title">Ihre Angaben</div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Waldbesitzertyp</span><span class="ka-summary-value">'+esc(btLabel)+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Baumarten</span><span class="ka-summary-value">'+baumTags+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Verwendungszweck</span><span class="ka-summary-value">'+esc(S.verwendungszweck||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Leistung</span><span class="ka-summary-value">'+S.logistikOptions.map(function(o){return logistikMap[o]||o;}).join(', ')+'</span></div>'
    +S.standorteArr.map(function(st,idx){
      var lbl=S.standorteArr.length>1?'Standort '+(idx+1):'Standort';
      return '<div class="ka-summary-row"><span class="ka-summary-label">'+lbl+'</span><span class="ka-summary-value">'
        +esc(st.plz+' '+st.ort)+' · FA: '+esc(st.forstamt||'–')+(st.revier?' / '+esc(st.revier):'')
        +(st.gps?' · GPS: '+esc(st.gps):'')+'</span></div>';
    }).join('')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Zeitraum</span><span class="ka-summary-value">'+esc(S.erntejahr)+' · '+esc(erntefensterMap[S.erntefenster]||S.erntefenster||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Planung</span><span class="ka-summary-value">'+esc(planungMap[S.planung]||S.planung||'–')+'</span></div>'
    +(fovgSel.length>0?'<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--kaw-border-light)"><div class="ka-summary-title">FoVG-Herkunftsnachweise</div>'+fovgRows+'</div>':'')
    +'</div>'

    +(kosten?'<div class="ka-price-box" style="margin-bottom:16px">'
      +'<span>Kostenindikation '+kosten.totalKg+' kg:</span>'
      +'<strong>'+fmtEur(kosten.min)+' – '+fmtEur(kosten.max)+' €</strong>'
      +'</div>':'')

    // Kontaktfelder
    +'<div class="ka-field">'
    +'<label class="ka-label">Vollständiger Name *</label>'
    +'<input class="ka-inp" type="text" id="i-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name">'
    +'</div>'
    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Telefon *</label>'
    +'<input class="ka-inp" type="tel" id="i-tel" value="'+esc(S.tel)+'" placeholder="+49 ..." autocomplete="tel">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">E-Mail *</label>'
    +'<input class="ka-inp" type="email" id="i-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email">'
    +'</div>'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Anmerkungen <span class="ka-label-optional">(optional)</span></label>'
    +'<textarea class="ka-textarea" id="i-bem" rows="3" placeholder="Besondere Hinweise, Standortbeschreibung, Zugänglichkeit...">'+esc(S.bemerkung)+'</textarea>'
    +'</div>'

    +'<div class="ka-info-box warn" style="margin-top:4px">'
    +'<strong>FoVG-Hinweis:</strong> Die Ernte FoVG-regulierter Baumarten setzt eine Zulassung des Erntebstands nach §6 FoVG voraus. '
    +'Koch Aufforstung organisiert die notwendige Bestandszulassung, Probennahme und Zertifizierung.'
    +'</div>'

    +'<div class="ka-field">'
    +'<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-weight:400">'
    +'<input type="checkbox" id="i-dsgvo" required '+(S.dsgvo?'checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'</div>'

    +'<div class="ka-err" id="e6"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b6">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind6(){
  document.getElementById('i-nm').addEventListener('input',function(){ S.name=this.value; });
  document.getElementById('i-tel').addEventListener('input',function(){ S.tel=this.value; });
  document.getElementById('i-em').addEventListener('input',function(){ S.email=this.value; });
  document.getElementById('i-bem').addEventListener('input',function(){ S.bemerkung=this.value; });
  document.getElementById('i-dsgvo').addEventListener('change',function(){ S.dsgvo=this.checked; });
  document.getElementById('b6').addEventListener('click',function(){
    S.name=document.getElementById('i-nm').value;
    S.tel=document.getElementById('i-tel').value;
    S.email=document.getElementById('i-em').value;
    S.bemerkung=document.getElementById('i-bem').value;
    go(5);
  });
  document.getElementById('sub').addEventListener('click',function(){
    S.name=document.getElementById('i-nm').value.trim();
    S.tel=document.getElementById('i-tel').value.trim();
    S.email=document.getElementById('i-em').value.trim();
    S.bemerkung=document.getElementById('i-bem').value.trim();
    S.dsgvo=document.getElementById('i-dsgvo').checked;
    if(!S.name){ showErr('e6','Bitte Name eingeben.'); return; }
    if(!S.tel){ showErr('e6','Bitte Telefonnummer eingeben.'); return; }
    if(!S.email||S.email.indexOf('@')<0){ showErr('e6','Bitte gültige E-Mail-Adresse eingeben.'); return; }
    if(!S.dsgvo){ showErr('e6','Bitte Datenschutzerklärung bestätigen.'); return; }

    var btn=this; btn.disabled=true; btn.textContent='⏳ Wird gesendet…';

    var sel=getSelTrees();
    var fovgSel=sel.filter(function(t){ return t.fovg&&FORVG_HKG[t.k]; });
    var kosten=calcKosten();
    var erntefensterMap={frueh:'Frühernte (Aug–Sep)',haupt:'Haupternte (Okt–Nov)'};
    var planungMap={einmalig:'Einmalig',jaehrlich:'Jährlich',mehrjaehrig:'Mehrjährig'};
    var logistikMap={vollservice:'Vollservice',erkundung:'Erkundung',bodenaufsammlung:'Bodenaufsammlung',anmeldung:'Anmeldung und Registrierung'};
    var besitzerMap={};
    BESITZERTYP.forEach(function(b){ besitzerMap[b.k]=b.label; });

    var payload={
      leistung: 'Saatguternte',
      service: 'Saatguternte',
      waldbesitzertyp: besitzerMap[S.besitzertyp]||S.besitzertyp||'',
      // Baumarten
      baumarten: sel.map(function(t){ return t.name+': '+S.treeKg[t.k]+' kg ('+t.frucht+')'; }).join(', '),
      gesamtmenge_kg: sel.reduce(function(s,t){ return s+(S.treeKg[t.k]||0); },0),
      // Herkunft
      verwendungszweck: S.verwendungszweck,
      bestandsregister: S.bestandsregister==='ja'?'Ja, vorhanden':'Nein, noch nicht',
      forvg_herkunft: fovgSel.map(function(t){
        var fvg=FORVG_HKG[t.k];
        var h=S.herkunft[t.k]||{};
        var g=fvg.gebiete.find(function(x){return x.code===h.hkg;});
        var kat=HKG_KAT.find(function(x){return x.k===h.kat;});
        return t.name+': HKG '+h.hkg+(g?' ('+g.name+')':'')+' | '+(kat?kat.label:'');
      }).join('\n'),
      // Standort
      plz: (S.standorteArr[0]||{}).plz||'',
      ort: (S.standorteArr[0]||{}).ort||'',
      forstamt: (S.standorteArr[0]||{}).forstamt||'',
      revier: (S.standorteArr[0]||{}).revier||'',
      gps: (S.standorteArr[0]||{}).gps||'',
      standorte_str: S.standorteArr.map(function(s,i){return 'Standort '+(i+1)+': '+s.plz+' '+s.ort+(s.forstamt?' (FA: '+s.forstamt+(s.revier?'/'+s.revier:'')+')'  :'');}).join(' | '),
      standorte: S.standorteArr.map(function(s){return {plz:s.plz,ort:s.ort,forstamt:s.forstamt,revier:s.revier,gps:s.gps||''};}),
      treffpunkt: S.treffpunkt||'',
      // Logistik
      logistik: S.logistikOptions.map(function(o){ return logistikMap[o]||o; }).join(', '),
      // Zeitraum
      erntejahr: S.erntejahr,
      erntefenster: erntefensterMap[S.erntefenster]||S.erntefenster,
      planungshorizont: planungMap[S.planung]||S.planung,
      // Kosten
      kostenindikation: kosten?(fmtEur(kosten.min)+' – '+fmtEur(kosten.max)+' €'):'',
      // Kontakt
      name: S.name,
      email: S.email,
      phone: S.tel,
      bemerkung: S.bemerkung,
    };

    var fd=new FormData();
    fd.append('data',JSON.stringify(payload));

    fetch('/wp-json/koch/v1/anfrage',{method:'POST',credentials:'same-origin',body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(){ showOK(); })
      .catch(function(err){
        console.error(err);
        btn.disabled=false; btn.textContent='📤 Anfrage absenden';
        var errRetry=document.getElementById('e6');if(errRetry){errRetry.setAttribute('role','alert');errRetry.setAttribute('aria-live','assertive');errRetry.innerHTML='⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.style.display=\'none\';document.querySelector(\'.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small>';errRetry.style.display='block';}
      });
  });
}

// ── Erfolgs-Screen ─────────────────────────────────────────────────────────────
function showOK(){ clearDraft();
  try {
    var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
    if(!korb.items) korb.items=[];
    korb.items=korb.items.filter(function(i){ return i.type!=='saatguternte'; });
    var sel=getSelTrees();
    var summary=sel.map(function(t){ return t.name+' '+S.treeKg[t.k]+'kg'; }).join(', ')||'Saatguternte';
    var fullState=JSON.parse(JSON.stringify(S));
    korb.items.push({type:'saatguternte',label:'🌰 Saatguternte',summary:summary,data:fullState,addedAt:Date.now()});
    localStorage.setItem('ka_projektkorb',JSON.stringify(korb));
    var korbCount=korb.items.length;
  } catch(e){ console.error(e); var korbCount=1; }

  document.getElementById('kaw-main').innerHTML='<div class="ka-card"><div class="ka-success">'
    +'<div class="ka-success-icon">✅</div>'
    +'<h2>Anfrage eingegangen!</h2>'
    +'<p>Wir melden uns innerhalb von 48 Stunden mit einem unverbindlichen Angebot.</p>'
    +'<div class="ka-success-card">'
    +'<strong>🌰 Saatguternte</strong><br>'
    +'<span style="color:#666">'+esc(summary)+' — '+esc(S.name)+'</span>'
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

// ── Expose for edit-mode ───────────────────────────────────────────────────────
window._sgS = S;
window._sgRender = render;

// ── Init ───────────────────────────────────────────────────────────────────────
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ try{ render(); }catch(e){ console.error(e); } });
} else {
  try{ render(); }catch(e){ console.error(e); }
}

})();

// ── Edit-Mode (URL-Parameter ?edit) ───────────────────────────────────────────
(function(){
  var params=new URLSearchParams(window.location.search);
  if(!params.has('edit')) return;
  function tryLoadEdit(){
    if(typeof window._sgS==='undefined'||typeof window._sgRender!=='function'){
      setTimeout(tryLoadEdit,100); return;
    }
    try {
      var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
      if(!korb.items) return;
      var item=korb.items.find(function(i){ return i.type==='saatguternte'; });
      if(!item||!item.data) return;
      Object.keys(item.data).forEach(function(k){ window._sgS[k]=item.data[k]; });
      window._sgRender();
      var main=document.getElementById('kaw-main');
      if(main&&main.parentNode){
        var b=document.createElement('div');
        b.innerHTML='<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px;margin-bottom:16px"><strong style="color:#012d1d">✏️ Bearbeitungsmodus – Ihre gespeicherten Daten wurden geladen.</strong></div>';
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

