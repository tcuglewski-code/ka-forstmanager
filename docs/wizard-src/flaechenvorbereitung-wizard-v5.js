(function(){
'use strict';
// ── Stitch Design System Self-Loader ──────────────────────────────────────
(function kaStitchLoader(){
  if(document.getElementById('ka-stitch-css')) return;
  var css=document.createElement('style');
  css.id='ka-stitch-css';
  css.textContent='/* Koch Aufforstung — Stitch Design System v1.0 (Google Stitch)\n   Inline CSS — embedded in each wizard JS file\n   Colors: Stitch palette | Font: Manrope | Icons: Material Symbols */\n\n:root {\n  --kaw-forest: #012d1d;\n  --kaw-forest-light: #1B4332;\n  --kaw-gold: #A3E635;\n  --kaw-gold-light: #bef264;\n  --kaw-bark: #5C4033;\n  --kaw-moss: #4A6741;\n  --kaw-sage: #7A9E7E;\n  --kaw-cream: #fff8f2;\n  --kaw-white: #FFFFFF;\n  --kaw-text: #1d1b18;\n  --kaw-text-muted: #717973;\n  --kaw-text-light: #8B8D88;\n  --kaw-border: #c1c8c2;\n  --kaw-border-light: #dce0dc;\n  --kaw-bg-subtle: #F8F9F5;\n  --kaw-bg-hover: #f3ede7;\n  --kaw-success: #2d7a2d;\n  --kaw-success-bg: #e8f5e8;\n  --kaw-warn: #d97706;\n  --kaw-warn-bg: #fff8e1;\n  --kaw-error: #ba1a1a;\n  --kaw-error-bg: #fef2f2;\n  --kaw-info-bg: #f0f7ff;\n  --kaw-info-border: #bfdbfe;\n  --kaw-shadow-sm: 0 2px 6px rgba(27,67,50,0.04);\n  --kaw-shadow: 0 10px 20px rgba(27,67,50,0.05);\n  --kaw-shadow-lg: 0 16px 32px rgba(27,67,50,0.08);\n  --kaw-radius: 12px;\n  --kaw-radius-sm: 8px;\n  --kaw-radius-xs: 6px;\n  --kaw-radius-pill: 20px;\n  --kaw-font: \'Manrope\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n  --kaw-font-heading: \'Manrope\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif;\n  --kaw-transition: all 0.2s ease;\n}\n\n.ka-wizard { max-width:800px; margin:0 auto; font-family:var(--kaw-font); color:var(--kaw-text); line-height:1.5; -webkit-font-smoothing:antialiased; }\n.ka-hero { background:linear-gradient(135deg,rgba(1,45,29,0.94) 0%,rgba(27,67,50,0.97) 100%); color:#fff; padding:28px 20px 24px; text-align:center; border-radius:0 0 16px 16px; margin-bottom:0; }\n.ka-hero h1 { margin:0 0 6px; font-family:var(--kaw-font-heading); font-size:22px; font-weight:800; line-height:1.2; color:#fff; }\n.ka-hero p { margin:6px 0 0; opacity:0.88; font-size:14px; }\n.ka-hero-icon { font-size:28px; margin-bottom:6px; display:block; }\n.ka-home-btn { display:inline-block; color:rgba(255,255,255,0.7); text-decoration:none; font-size:12px; margin-bottom:10px; }\n.ka-home-btn:hover { color:#fff; }\n\n.ka-progress { padding:16px 16px 20px; }\n.ka-steps { display:flex; align-items:flex-start; justify-content:center; gap:0; padding:0 8px; margin-bottom:8px; }\n.ka-step { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; cursor:default; }\n.ka-step-dot { width:32px; height:32px; border-radius:50%; background:#dce0dc; color:#8B8D88; display:flex; align-items:center; justify-content:center; font-size:13px; font-weight:700; border:2px solid #dce0dc; transition:var(--kaw-transition); }\n.ka-step.cur .ka-step-dot,.ka-step.done .ka-step-dot { background:var(--kaw-forest); color:#fff; border-color:var(--kaw-forest); }\n.ka-step-label { font-size:10px; color:#8B8D88; font-weight:400; text-align:center; max-width:70px; line-height:1.2; }\n.ka-step.cur .ka-step-label { color:var(--kaw-forest); font-weight:700; }\n.ka-step.done .ka-step-label { color:var(--kaw-forest); }\n.ka-progress-bar { height:4px; background:#dce0dc; border-radius:2px; overflow:hidden; }\n.ka-progress-fill { height:4px; background:var(--kaw-gold); border-radius:2px; transition:width 0.3s ease; }\n\n.ka-card { background:var(--kaw-white); border-radius:var(--kaw-radius); box-shadow:var(--kaw-shadow); overflow:hidden; margin:0 auto; max-width:800px; }\n.ka-card-header { padding:20px 20px 12px; }\n.ka-card-header h2 { margin:0 0 6px; font-family:var(--kaw-font-heading); font-size:18px; font-weight:800; color:var(--kaw-text); line-height:1.3; }\n.ka-card-header p { margin:0; font-size:13px; color:var(--kaw-text-muted); line-height:1.5; }\n.ka-card-body { padding:0 20px 20px; }\n.ka-card-footer { display:flex; justify-content:space-between; align-items:center; padding:12px 20px 20px; gap:12px; }\n\n.ka-field { margin-bottom:16px; }\n.ka-label { display:block; font-size:13px; font-weight:600; color:var(--kaw-text); margin-bottom:5px; }\n.ka-label-optional { color:var(--kaw-text-light); font-size:11px; font-weight:400; }\n.ka-hint { font-size:12px; color:var(--kaw-text-muted); margin-top:4px; line-height:1.4; }\n.ka-inp { width:100%; padding:10px 14px; border:1.5px solid var(--kaw-border); border-radius:var(--kaw-radius-sm); font-size:14px; font-family:var(--kaw-font); color:var(--kaw-text); background:var(--kaw-white); transition:var(--kaw-transition); box-sizing:border-box; outline:none; }\n.ka-inp:focus { border-color:var(--kaw-forest); box-shadow:0 0 0 3px rgba(1,45,29,0.1); }\n.ka-inp::placeholder { color:#aaa; }\n.ka-inp[type="file"] { padding:10px 12px; cursor:pointer; }\n.ka-select { width:100%; padding:10px 14px; border:1.5px solid var(--kaw-border); border-radius:var(--kaw-radius-sm); font-size:14px; font-family:var(--kaw-font); color:var(--kaw-text); background:var(--kaw-white); transition:var(--kaw-transition); box-sizing:border-box; outline:none; cursor:pointer; -webkit-appearance:none; appearance:none; background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23717973\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E"); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px; }\n.ka-select:focus { border-color:var(--kaw-forest); box-shadow:0 0 0 3px rgba(1,45,29,0.1); }\n.ka-textarea { width:100%; padding:10px 14px; border:1.5px solid var(--kaw-border); border-radius:var(--kaw-radius-sm); font-size:14px; font-family:var(--kaw-font); color:var(--kaw-text); background:var(--kaw-white); transition:var(--kaw-transition); box-sizing:border-box; outline:none; resize:vertical; min-height:60px; }\n.ka-textarea:focus { border-color:var(--kaw-forest); box-shadow:0 0 0 3px rgba(1,45,29,0.1); }\n\n.ka-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }\n.ka-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }\n.ka-grid-auto { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:8px; }\n@media(max-width:520px){ .ka-grid-2,.ka-grid-3 { grid-template-columns:1fr; } }\n\n.ka-cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:10px; }\n.ka-cards-stacked { display:flex; flex-direction:column; gap:10px; }\n.ka-card-option { padding:14px; border:2px solid var(--kaw-border-light); border-radius:var(--kaw-radius); cursor:pointer; transition:var(--kaw-transition); background:var(--kaw-white); text-align:left; position:relative; }\n.ka-card-option:hover { border-color:rgba(1,45,29,0.3); background:var(--kaw-bg-hover); }\n.ka-card-option.selected { border-color:var(--kaw-forest); background:var(--kaw-bg-subtle); }\n.ka-card-option.selected::after { content:\'\\2713\'; position:absolute; top:10px; right:10px; width:22px; height:22px; background:var(--kaw-gold); border-radius:50%; display:flex; align-items:center; justify-content:center; color:var(--kaw-forest); font-size:13px; font-weight:700; }\n.ka-card-icon { font-size:24px; margin-bottom:6px; display:block; }\n.ka-card-name { font-size:14px; font-weight:700; color:var(--kaw-text); display:block; }\n.ka-card-option.selected .ka-card-name { color:var(--kaw-forest); }\n.ka-card-sub { font-size:11px; color:var(--kaw-text-muted); display:block; margin-top:2px; }\n.ka-card-desc { font-size:12px; color:var(--kaw-text-muted); line-height:1.4; margin-top:6px; }\n.ka-card-price { font-size:12px; color:var(--kaw-forest); font-weight:600; margin-top:6px; }\n\n.ka-chips { display:flex; flex-wrap:wrap; gap:8px; }\n.ka-chip { padding:8px 16px; border-radius:var(--kaw-radius-pill); border:1.5px solid var(--kaw-border-light); background:var(--kaw-white); cursor:pointer; font-size:13px; font-weight:500; color:var(--kaw-text); transition:var(--kaw-transition); font-family:var(--kaw-font); }\n.ka-chip:hover { border-color:rgba(1,45,29,0.3); background:var(--kaw-bg-hover); }\n.ka-chip.selected { border-color:var(--kaw-forest); background:rgba(1,45,29,0.06); font-weight:700; color:var(--kaw-forest); }\n\n.ka-toggles { display:flex; gap:8px; flex-wrap:wrap; }\n.ka-toggle { padding:10px 18px; border-radius:var(--kaw-radius-sm); border:1.5px solid var(--kaw-border-light); background:var(--kaw-white); cursor:pointer; font-size:13px; font-weight:500; color:var(--kaw-text); transition:var(--kaw-transition); font-family:var(--kaw-font); text-align:center; }\n.ka-toggle:hover { border-color:rgba(1,45,29,0.3); background:var(--kaw-bg-hover); }\n.ka-toggle.selected { border-color:var(--kaw-forest); background:rgba(1,45,29,0.06); font-weight:700; color:var(--kaw-forest); }\n.ka-toggle-sub { display:block; font-size:10px; font-weight:400; color:var(--kaw-text-light); margin-top:2px; }\n.ka-toggle.selected .ka-toggle-sub { color:var(--kaw-forest); }\n\n.ka-radio-card { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border:2px solid var(--kaw-border-light); border-radius:var(--kaw-radius); background:var(--kaw-white); cursor:pointer; transition:var(--kaw-transition); }\n.ka-radio-card:hover { border-color:rgba(1,45,29,0.3); background:var(--kaw-bg-hover); }\n.ka-radio-card.selected { border-color:var(--kaw-forest); background:var(--kaw-bg-subtle); }\n.ka-radio-dot { width:18px; height:18px; border-radius:50%; border:2px solid var(--kaw-border); background:transparent; flex-shrink:0; margin-top:2px; display:flex; align-items:center; justify-content:center; transition:var(--kaw-transition); }\n.ka-radio-card.selected .ka-radio-dot { border-color:var(--kaw-forest); background:var(--kaw-forest); }\n.ka-radio-dot-inner { width:8px; height:8px; border-radius:50%; background:#fff; display:none; }\n.ka-radio-card.selected .ka-radio-dot-inner { display:block; }\n.ka-radio-label { font-size:14px; font-weight:600; color:var(--kaw-text); }\n.ka-radio-card.selected .ka-radio-label { color:var(--kaw-forest); }\n.ka-radio-desc { font-size:12px; color:var(--kaw-text-muted); margin-top:2px; }\n\n.ka-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 24px; border-radius:var(--kaw-radius-sm); font-size:14px; font-weight:600; font-family:var(--kaw-font); cursor:pointer; transition:var(--kaw-transition); border:none; text-decoration:none; white-space:nowrap; min-height:44px; }\n.ka-btn-primary { background:var(--kaw-gold); color:var(--kaw-forest); font-weight:700; }\n.ka-btn-primary:hover { background:var(--kaw-gold-light); box-shadow:var(--kaw-shadow-sm); }\n.ka-btn-primary:disabled { background:#9ca3af; color:#fff; cursor:not-allowed; }\n.ka-btn-secondary { background:transparent; color:var(--kaw-text-muted); border:1.5px solid var(--kaw-border); }\n.ka-btn-secondary:hover { background:var(--kaw-bg-hover); color:var(--kaw-text); }\n.ka-btn-gold { background:var(--kaw-gold); color:var(--kaw-forest); }\n.ka-btn-gold:hover { background:var(--kaw-gold-light); }\n.ka-btn-ghost { background:transparent; color:var(--kaw-forest); padding:8px 16px; }\n.ka-btn-ghost:hover { background:var(--kaw-bg-hover); }\n.ka-btn-sm { padding:8px 16px; font-size:13px; min-height:36px; }\n.ka-btn-block { display:block; width:100%; text-align:center; }\n\n.ka-qty { display:flex; align-items:center; gap:6px; }\n.ka-qty-btn { width:34px; height:34px; border-radius:50%; border:1px solid var(--kaw-border); background:var(--kaw-white); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--kaw-text-muted); transition:var(--kaw-transition); }\n.ka-qty-btn:hover { border-color:var(--kaw-forest); color:var(--kaw-forest); }\n.ka-qty-input { width:70px; text-align:center; border:1px solid var(--kaw-border); border-radius:var(--kaw-radius-sm); padding:6px; font-size:15px; font-weight:600; font-family:var(--kaw-font); color:var(--kaw-text); }\n.ka-nav { display:flex; justify-content:space-between; align-items:center; margin-top:24px; padding:0 8px; gap:12px; }\n\n.ka-info-box { padding:12px 14px; border-radius:var(--kaw-radius-sm); font-size:12px; line-height:1.6; margin-bottom:14px; }\n.ka-info-box.info { background:var(--kaw-info-bg); border-left:3px solid #3b82f6; color:#1e40af; }\n.ka-info-box.warn { background:var(--kaw-warn-bg); border-left:3px solid var(--kaw-warn); color:#012d1d; }\n.ka-info-box.success { background:var(--kaw-success-bg); border-left:3px solid var(--kaw-success); color:#166534; }\n.ka-info-box.error { background:var(--kaw-error-bg); border-left:3px solid var(--kaw-error); color:#991b1b; }\n.ka-info-box.brand { background:var(--kaw-bg-subtle); border-left:3px solid var(--kaw-forest); color:var(--kaw-forest); }\n.ka-info-box strong { font-weight:700; }\n\n.ka-err { color:var(--kaw-error); font-size:13px; margin-top:8px; display:none; }\n.ka-err:not(:empty) { display:block; }\n\n.ka-price-box { display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:linear-gradient(135deg,var(--kaw-bg-subtle),rgba(163,230,53,0.08)); border:1.5px solid rgba(1,45,29,0.15); border-radius:var(--kaw-radius); margin-top:14px; gap:12px; }\n.ka-price-box span { font-size:13px; color:var(--kaw-forest); line-height:1.4; }\n.ka-price-box strong { font-size:18px; color:var(--kaw-text); font-weight:800; white-space:nowrap; }\n\n.ka-tag { display:inline-flex; align-items:center; gap:5px; padding:4px 10px; background:var(--kaw-bg-subtle); color:var(--kaw-forest); border-radius:16px; font-size:12px; font-weight:600; border:1px solid rgba(1,45,29,0.15); margin:2px; }\n\n.ka-summary { background:var(--kaw-bg-subtle); border-radius:var(--kaw-radius); border:1px solid var(--kaw-border-light); padding:16px; margin-bottom:18px; }\n.ka-summary-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--kaw-text-muted); margin-bottom:12px; }\n.ka-summary-row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:9px 0; border-bottom:1px solid var(--kaw-border-light); font-size:13px; }\n.ka-summary-row:last-child { border-bottom:none; }\n.ka-summary-label { color:var(--kaw-text-muted); flex-shrink:0; min-width:130px; font-size:12px; font-weight:600; }\n.ka-summary-value { text-align:right; word-break:break-word; }\n\n.ka-flaeche { background:var(--kaw-bg-subtle); border:1.5px solid var(--kaw-border-light); border-radius:var(--kaw-radius); padding:16px; margin-bottom:14px; transition:var(--kaw-transition); }\n.ka-flaeche-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }\n.ka-flaeche-title { font-size:14px; font-weight:700; color:var(--kaw-text); }\n.ka-flaeche-del { background:none; border:none; color:var(--kaw-error); cursor:pointer; font-size:13px; font-weight:600; padding:4px 8px; min-height:36px; }\n.ka-add-btn { width:100%; padding:14px; border:1.5px dashed var(--kaw-forest); border-radius:var(--kaw-radius-sm); background:rgba(1,45,29,0.02); color:var(--kaw-forest); cursor:pointer; font-size:13px; font-weight:600; margin-bottom:16px; transition:var(--kaw-transition); font-family:var(--kaw-font); min-height:52px; }\n.ka-add-btn:hover { background:var(--kaw-bg-subtle); border-color:var(--kaw-forest-light); }\n\n.ka-accordion-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; background:var(--kaw-bg-subtle); border:1.5px solid var(--kaw-border-light); border-radius:var(--kaw-radius); cursor:pointer; transition:var(--kaw-transition); margin-bottom:2px; }\n.ka-accordion-header:hover { background:var(--kaw-bg-hover); }\n.ka-accordion-body { display:none; padding:16px; border:1.5px solid var(--kaw-border-light); border-top:none; border-radius:0 0 var(--kaw-radius) var(--kaw-radius); }\n.ka-accordion-body.open { display:block; }\n\n.ka-map { width:100%; height:0; border-radius:var(--kaw-radius-sm); border:none; margin-bottom:0; overflow:hidden; display:none; }\n.ka-gps-row { display:flex; gap:8px; align-items:center; }\n.ka-gps-row input { flex:1; }\n.ka-gps-btn { padding:8px 16px; background:var(--kaw-forest); color:#fff; border:none; border-radius:var(--kaw-radius-xs); cursor:pointer; font-size:13px; white-space:nowrap; transition:var(--kaw-transition); font-family:var(--kaw-font); min-height:44px; }\n.ka-gps-btn:hover { background:var(--kaw-forest-light); }\n.ka-gps-info { font-size:11px; color:var(--kaw-text-muted); margin-top:3px; }\n.ka-gps-maps-link { display:inline-flex; align-items:center; gap:6px; margin-top:6px; padding:6px 12px; background:rgba(1,45,29,0.04); border:1px solid var(--kaw-border); border-radius:var(--kaw-radius-xs); color:var(--kaw-forest); font-size:12px; font-weight:600; text-decoration:none; transition:var(--kaw-transition); }\n.ka-gps-maps-link:hover { background:rgba(1,45,29,0.08); }\n\n.ka-check-card { display:flex; align-items:flex-start; gap:10px; padding:12px 14px; border:1.5px solid var(--kaw-border-light); border-radius:var(--kaw-radius-sm); cursor:pointer; background:var(--kaw-white); margin-bottom:8px; transition:var(--kaw-transition); }\n.ka-check-card:hover { border-color:rgba(1,45,29,0.3); background:var(--kaw-bg-hover); }\n.ka-check-card.selected { border-color:var(--kaw-forest); background:var(--kaw-bg-subtle); }\n.ka-check-card input[type="checkbox"],.ka-check-card input[type="radio"] { width:18px; height:18px; accent-color:var(--kaw-forest); flex-shrink:0; margin-top:2px; }\n\n.ka-foerder-box { margin-top:16px; padding:16px; background:var(--kaw-bg-subtle); border-radius:var(--kaw-radius); border:1px solid var(--kaw-border); }\n.ka-foerder-title { font-size:15px; font-weight:700; color:var(--kaw-forest); margin-bottom:8px; }\n.ka-foerder-prog { padding:10px 12px; background:var(--kaw-white); border-radius:var(--kaw-radius-sm); border:1px solid var(--kaw-border-light); margin-bottom:8px; }\n.ka-foerder-prog-name { font-size:13px; font-weight:700; color:var(--kaw-text); }\n.ka-foerder-prog-rate { font-size:12px; color:var(--kaw-forest); font-weight:600; margin-top:2px; }\n.ka-foerder-prog-desc { font-size:11px; color:var(--kaw-text-muted); margin-top:3px; }\n\n.ka-success { text-align:center; padding:40px 20px; }\n.ka-success-icon { font-size:48px; margin-bottom:16px; }\n.ka-success h2 { font-family:var(--kaw-font-heading); font-size:22px; font-weight:800; color:var(--kaw-text); margin:0 0 16px; }\n.ka-success p { font-size:14px; color:var(--kaw-text-muted); margin:0 0 20px; }\n.ka-success-card { background:var(--kaw-bg-subtle); border:2px solid var(--kaw-forest); border-radius:var(--kaw-radius); padding:16px; margin:20px 0; text-align:left; }\n.ka-success-hint { background:rgba(163,230,53,0.08); border:2px solid var(--kaw-gold); border-radius:var(--kaw-radius); padding:16px; margin:20px 0; text-align:left; }\n\n.ka-suggest-dropdown { position:absolute; z-index:1000; background:var(--kaw-white); border:1px solid var(--kaw-border); border-radius:var(--kaw-radius-sm); box-shadow:var(--kaw-shadow-lg); max-height:200px; overflow-y:auto; width:100%; display:none; }\n.ka-suggest-dropdown.open { display:block; }\n.ka-suggest-item { padding:10px 14px; font-size:13px; cursor:pointer; transition:background 0.1s; }\n.ka-suggest-item:hover { background:var(--kaw-bg-hover); }\n.ka-suggest-item.active { background:var(--kaw-bg-subtle); color:var(--kaw-forest); font-weight:600; }\n\n.ka-dsgvo { font-size:12px; color:var(--kaw-text-light); margin-top:16px; line-height:1.5; }\n.ka-dsgvo a { color:var(--kaw-forest); }\n\n@media(max-width:768px){\n  .ka-wizard { max-width:100%; }\n  .ka-card { border-radius:var(--kaw-radius-sm); box-shadow:var(--kaw-shadow-sm); }\n  .ka-card-header { padding:16px 16px 10px; }\n  .ka-card-body { padding:0 16px 16px; }\n  .ka-card-footer { padding:10px 16px 16px; }\n  .ka-cards { grid-template-columns:1fr; }\n  .ka-price-box { flex-direction:column; text-align:center; gap:6px; }\n}\n@media(max-width:480px){\n  .ka-hero h1 { font-size:18px; }\n  .ka-card-header h2 { font-size:16px; }\n  .ka-btn { padding:10px 18px; font-size:13px; }\n  .ka-step-label { font-size:9px; max-width:50px; }\n  .ka-summary-row { flex-direction:column; gap:2px; }\n  .ka-summary-label { min-width:unset; }\n  .ka-summary-value { text-align:left; }\n}\n@media print{\n  .ka-wizard { max-width:100%; box-shadow:none; }\n  .ka-hero { background:#333!important; -webkit-print-color-adjust:exact; print-color-adjust:exact; }\n  .ka-btn,.ka-nav,.ka-progress { display:none!important; }\n}\n\n.ka-inp:focus-visible,.ka-select:focus-visible,.ka-textarea:focus-visible,\n.ka-btn:focus-visible,.ka-btn-primary:focus-visible,.ka-btn-secondary:focus-visible,\n.ka-btn-ghost:focus-visible,[class*=\'ka-card\']:focus-visible,\n.pf-inp:focus-visible,.pf-btn:focus-visible,\ninput[type=\'radio\']:focus-visible,input[type=\'checkbox\']:focus-visible {\n  outline:2px solid var(--kaw-forest); outline-offset:2px; box-shadow:0 0 0 4px rgba(1,45,29,.15);\n}\n.ka-btn,.ka-btn-primary,.ka-btn-secondary,.ka-btn-ghost,.pf-btn { min-height:44px; min-width:44px; }\ninput[type=\'radio\'],input[type=\'checkbox\'] { width:20px; height:20px; cursor:pointer; }\nlabel { cursor:pointer; }\n.ka-card,.pf-card { min-height:56px; }\n.ka-field-error { color:var(--kaw-error); font-size:12px; margin-top:4px; display:none; }\n.ka-field-error.visible { display:block; }\n.ka-inp.error,.ka-select.error,.pf-inp.error { border-color:var(--kaw-error)!important; }\n.ka-autosave-badge { font-size:11px; color:#888; padding:2px 6px; background:rgba(1,45,29,.06); border-radius:4px; display:inline-block; margin-left:8px; }\n.ka-retry-btn { margin-top:8px; padding:10px 20px; background:var(--kaw-forest); color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px; min-height:44px; }\n';
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





// ── Aufwuchsarten ──────────────────────────────────────────────────────────────
var AUFWUCHS_TYPEN = [
  { k: 'adlerfarn', ico: '🌿', name: 'Adlerfarn' },
  { k: 'brombeere', ico: '🫐', name: 'Brombeere' },
  { k: 'gras',      ico: '🌾', name: 'Gras' },
  { k: 'sonstiges', ico: '✏️',  name: 'Sonstiges' },
];

// ── Arbeitsmethoden ────────────────────────────────────────────────────────────
var METHODEN = [
  { k: 'freischneider', ico: '⚙️', name: 'Freischneider',              desc: 'Motormanuell, geeignet für größere Flächen und dichten Aufwuchs' },
  { k: 'haendisch',     ico: '🌾', name: 'Händisch mit Heppe / Sense', desc: 'Traditionelle Methode, schonend für empfindliche Bereiche' },
];

// ── Hangneigung ────────────────────────────────────────────────────────────────
var HANG = [
  { k: 'eben',   label: 'Eben',           desc: '<5°',    surcharge: 0 },
  { k: 'leicht', label: 'Leicht geneigt', desc: '5–15°',  surcharge: 0 },
  { k: 'mittel', label: 'Mittel',         desc: '15–25°', surcharge: 0.20 },
  { k: 'steil',  label: 'Steil',          desc: '>25°',   surcharge: 0.40 },
];

// ── Zugänglichkeit ─────────────────────────────────────────────────────────────
var ZUGANG = [
  { k: 'gut',            label: 'Gut',           desc: 'Direkt per Fahrzeug erreichbar' },
  { k: 'eingeschraenkt', label: 'Eingeschränkt', desc: 'Nur über Wald- oder Fußpfad' },
  { k: 'schwierig',      label: 'Schwierig',     desc: 'Kein Weg, nur zu Fuß erreichbar' },
];

// ── Turnus ─────────────────────────────────────────────────────────────────────
var TURNUS = [
  { k: 'einmalig',     label: 'Einmalig',               desc: 'Einmalige Maßnahme zur Vorbereitung' },
  { k: 'jaehrlich',    label: 'Jährlich wiederkehrend',  desc: '1× pro Jahr, optimaler Pflegerhythmus' },
  { k: '2x_jaehrlich', label: '2× jährlich',             desc: 'Frühjahr + Herbst, für starke Bestände' },
];

// ── Pflegeziel ─────────────────────────────────────────────────────────────────
var ZIEL = [
  { k: 'pflanzung',      label: 'Vorbereitung für Pflanzung', desc: 'Fläche für bevorstehende Aufforstung freistellen' },
  { k: 'bestandspflege', label: 'Bestandspflege',             desc: 'Laufende Pflege bestehender Kulturen' },
  { k: 'kulturpflege',   label: 'Kulturpflege laufend',       desc: 'Regelmäßige Pflege während der Anwuchsphase' },
];

// ── Waldbesitzertyp ────────────────────────────────────────────────────────────
var BESITZERTYP = [
  { k: 'privatperson',   label: 'Privatperson' },
  { k: 'personengesell', label: 'Personengesellschaft' },
  { k: 'koerperschaft',  label: 'Körperschaft d. öffentl. Rechts' },
  { k: 'kommunal',       label: 'Kommunal/Staatlich' },
];

// ── Zeiträume (dynamisch) ──────────────────────────────────────────────────────
var QUARTALE = (function(){
  var now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
  var ss=[['Frühling','Mär–Mai'],['Sommer','Jun–Aug'],['Herbst','Sep–Nov'],['Winter','Dez–Feb']];
  var ci=m<=2?3:m<=5?0:m<=8?1:m<=11?2:3;
  var out=[];
  for(var i=0;i<6;i++){
    var si=(ci+i)%4, sY=y+Math.floor((ci+i)/4);
    out.push(ss[si][0]+' '+sY+' ('+ss[si][1]+')');
  }
  out.push('Flexibel / nach Absprache');
  return out;
})();

// ── Bundesländer + Förderprogramme ────────────────────────────────────────────
var BL_NAMEN = {
  'BY':'Bayern','BW':'Baden-Württemberg','NW':'Nordrhein-Westfalen',
  'HE':'Hessen','NI':'Niedersachsen','RP':'Rheinland-Pfalz',
  'SN':'Sachsen','TH':'Thüringen','ST':'Sachsen-Anhalt',
  'BB':'Brandenburg','MV':'Mecklenburg-Vorpommern','SH':'Schleswig-Holstein',
  'HB':'Bremen','HH':'Hamburg','SL':'Saarland','BE':'Berlin'
};

var FOERDER_FLAECHE = {
  'BY': [
    {name:'BaySF Förderprogramm', desc:'Bayerische Forstliche Förderung — Flächenvorbereitung bis 70%', url:'https://www.stmelf.bayern.de/wald/waldfoerderung/'},
    {name:'GAK Forstliche Förderung Bayern', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'},
    {name:'Bayer. Aufforstungsprämie', desc:'Prämie für Aufforstung von Nichtholzbodenflächen', url:'https://www.stmelf.bayern.de/foerderung/'}
  ],
  'BW': [
    {name:'ForstBW Förderung', desc:'Landesförderung Waldumweltmaßnahmen und Flächenvorbereitung', url:'https://www.forstbw.de/'},
    {name:'MEKA Agrarumweltprogramm', desc:'Maßnahmen zur Erhaltung und Pflege der Kulturlandschaft', url:'https://www.landwirtschaft-bw.info/'},
    {name:'GAK BW', desc:'GAK-Rahmenplan forstwirtschaftliche Förderung', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'NW': [
    {name:'NRW Wald und Holz', desc:'Landesbetrieb Wald und Holz Förderangebote', url:'https://www.wald-und-holz.nrw.de/foerderung'},
    {name:'Klimawald NRW', desc:'Förderung klimaresilienter Waldumwandlung und Flächenvorbereitung', url:'https://www.wald-und-holz.nrw.de/klimawald'},
    {name:'GAK NRW', desc:'Gemeinschaftsaufgabe Agrarstruktur bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'HE': [
    {name:'HALM Hessen', desc:'Hessisches Agrarumweltprogramm — Forstliche Maßnahmen', url:'https://landwirtschaft.hessen.de/foerderung/halm'},
    {name:'GAK Hessen', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'},
    {name:'Hessisches Förderprogramm Forst', desc:'Landesförderung Waldbewirtschaftung und -vorbereitung', url:'https://landwirtschaft.hessen.de/'}
  ],
  'NI': [
    {name:'GAK Niedersachsen', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'},
    {name:'Nds. Landesforsten', desc:'Niedersächsische Landesforsten Förderung', url:'https://www.landesforsten.de/'},
    {name:'Niedersächsisches Waldprogramm', desc:'Landesspezifisches Waldprogramm für Umbau und Vorbereitung', url:'https://www.ml.niedersachsen.de/'}
  ],
  'RP': [
    {name:'GAK Rheinland-Pfalz', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'},
    {name:'Wald & Forst RP', desc:'Landesbetrieb Landesforsten Rheinland-Pfalz Förderangebote', url:'https://www.wald.rlp.de/'}
  ],
  'SN': [
    {name:'Freistaat Sachsen Waldförd.', desc:'Sächsische Waldförderrichtlinie — Flächenvorbereitung', url:'https://www.smekul.sachsen.de/foerderung/'},
    {name:'GAK Sachsen', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'TH': [
    {name:'ThüringenForst', desc:'Landesforstanstalt Thüringen Förderangebote', url:'https://www.thueringenforst.de/'},
    {name:'GAK Thüringen', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'ST': [
    {name:'Sachsen-Anhalt Waldförderung', desc:'Förderrichtlinie Wald Sachsen-Anhalt', url:'https://mlul.sachsen-anhalt.de/foerderung/'},
    {name:'GAK ST', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'BB': [
    {name:'Brandenburg Wald', desc:'Landesförderung Waldentwicklung Brandenburg', url:'https://forst.brandenburg.de/foerderung/'},
    {name:'GAK Brandenburg', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'MV': [
    {name:'Mecklenburg-Vorpommern Forst', desc:'Landesforstanstalt MV Förderangebote', url:'https://www.wald-mv.de/foerderung/'},
    {name:'GAK MV', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'SH': [
    {name:'Schleswig-Holstein Forst', desc:'Landesforsten SH — Waldförderung', url:'https://www.schleswig-holstein.de/foerderung/'},
    {name:'GAK SH', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'HB': [
    {name:'GAK Bremen', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'HH': [
    {name:'GAK Hamburg', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'SL': [
    {name:'Saarland Forst', desc:'Saarforst Landesbetrieb Förderangebote', url:'https://www.saarland.de/saarforst/'},
    {name:'GAK Saarland', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ],
  'BE': [
    {name:'GAK Berlin', desc:'Gemeinschaftsaufgabe Agrarstruktur, bundesweit', url:'https://www.bmel.de/DE/themen/landwirtschaft/forstliche-foerderung/'}
  ]
};

// ── Steps-Definition ──────────────────────────────────────────────────────────
// 0: Waldbesitzertyp, 1: Standort, 2: Flächendetails, 3: Zeitraum, 4: Kontakt, 5: Zusammenfassung
var STEP_LABELS = ['Besitzertyp','Standort','Fläche','Zeitraum','Kontakt','Übersicht'];
var TOTAL_STEPS = 6;

// ── Neue Fläche erstellen ──────────────────────────────────────────────────────
function newFlaeche() {
  return {
    ha: '',
    aufwuchsarten: [],
    methode: '',
    hangneigung: '',
    zugaenglichkeit: '',
    besonderheiten: '',
    forstamt: '',
    revier: '',
    gps: '',
  };
}

// ── State ──────────────────────────────────────────────────────────────────────
var S = {
  step: 0,
  // Step 0: Waldbesitzertyp
  besitzertyp: '',
  // Step 1: Standort
  plz: '',
  ort: '',
  forstamt: '',   // shared / first Fläche forstamt
  revier: '',     // shared / first Fläche revier
  gps: '',
  treffpunkt: '',
  // Step 2: Flächendetails (multi-Fläche)
  flaechen: [newFlaeche()],
  // Step 3: Zeitraum
  zeitpunkt: '',
  turnus: '',
  ziel: '',
  // Step 4: Kontakt
  name: '', telefon: '', email: '', dsgvo: false,
  // Step 5: Fördercheck (shown in summary step)
  foerdercheck: null, bundesland: '', foerderprogramme: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-flaechenvorbereitung-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent=''; e.style.display='none';} }
function go(n){ S.step=n; saveDraft(); try{history.pushState({step:n},"","#step-"+n);}catch(e){} render(); window.scrollTo(0,0); }

// ── Progress Bar ──────────────────────────────────────────────────────────────
function renderProgress(){
  var dots = STEP_LABELS.map(function(lbl, i){
    var cls = 'ka-step';
    if(i < S.step) cls += ' done';
    if(i === S.step) cls += ' cur';
    var dotContent = i < S.step ? '✓' : (i+1);
    return '<div class="'+cls+'" data-i="'+i+'">'
      +'<div class="ka-step-dot">'+dotContent+'</div>'
      +'<div class="ka-step-label">'+esc(lbl)+'</div>'
      +'</div>';
  }).join('');
  var pct = Math.round((S.step / (TOTAL_STEPS-1)) * 100);
  return '<div class="ka-progress">'
    +'<div class="ka-steps">'+dots+'</div>'
    +'<div class="ka-progress-bar"><div class="ka-progress-fill" style="width:'+pct+'%"></div></div>'
    +'</div>';
}

// ── Main Render ────────────────────────────────────────────────────────────────
function render(){
  var root = document.getElementById('pf');
  if(!root) return;

  var hero = '<div class="ka-hero">'
    +'<a href="/" class="ka-home-btn">← Koch Aufforstung</a>'
    +'<span class="ka-hero-icon">🌿</span>'
    +'<h1>Flächenvorbereitung anfragen</h1>'
    +'<p>Professionelle Freihaltung und Vorbereitung Ihrer Waldflächen</p>'
    +'</div>';

  root.innerHTML = '<div class="ka-wizard">'
    + hero
    + renderProgress()
    + '<div id="pf-main"></div>'
    + '</div>';

  var main = document.getElementById('pf-main');
  if(!main) return;

  switch(S.step){
    case 0: main.innerHTML = s0(); bind0(); break;
    case 1: main.innerHTML = s1(); bind1(); break;
    case 2: main.innerHTML = s2(); bind2(); break;
    case 3: main.innerHTML = s3(); bind3(); break;
    case 4: main.innerHTML = s4(); bind4(); break;
    case 5: main.innerHTML = s5(); bind5(); break;
  }
}

// ── Step 0: Waldbesitzertyp ────────────────────────────────────────────────────
function s0(){
  var opts = BESITZERTYP.map(function(b){
    var on = S.besitzertyp === b.k;
    return '<button type="button" class="ka-card-option'+(on?' selected':'')+'" data-bk="'+b.k+'">'
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

// ── Step 1: Standort ───────────────────────────────────────────────────────────
function s1(){
  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📍 Standort</h2>'
    +'<p>Wo befinden sich die Flächen? Geben Sie Adresse, Forstamt und ggf. GPS-Koordinaten an.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // PLZ + Ort
    +'<div class="ka-grid-2">'
    +'<div class="ka-field" style="position:relative">'
    +'<label class="ka-label">PLZ *</label>'
    +'<input class="ka-inp" type="text" id="i-plz" inputmode="numeric" value="'+esc(S.plz)+'" placeholder="z.B. 83229" autocomplete="postal-code">'
    +'</div>'
    +'<div class="ka-field" style="position:relative">'
    +'<label class="ka-label">Ort *</label>'
    +'<input class="ka-inp" type="text" id="i-ort" value="'+esc(S.ort)+'" placeholder="z.B. Aschau im Chiemgau" autocomplete="address-level2">'
    +'</div>'
    +'</div>'

    // Forstamt + Revier
    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Forstamt *</label>'
    +'<input class="ka-inp" type="text" id="i-forstamt" value="'+esc(S.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Revier *</label>'
    +'<input class="ka-inp" type="text" id="i-revier" value="'+esc(S.revier)+'" placeholder="z.B. Revier Süd" autocomplete="off">'
    +'</div>'
    +'</div>'

    // GPS Fläche
    +'<div class="ka-field">'
    +'<label class="ka-label">GPS-Koordinaten der Fläche <span class="ka-label-optional">(optional)</span></label>'
    +'<div id="map-gps-standort" class="ka-map"></div>'
    +'<div class="ka-gps-row">'
    +'<input class="ka-inp" type="text" id="gps-standort" value="'+esc(S.gps)+'" placeholder="z.B. 51.1234, 8.5678">'
    +'<button type="button" class="ka-gps-btn" id="gps-btn-standort">📍 Standort</button>'
    +'</div>'
    +'<div class="ka-gps-info" id="gps-info-standort"></div>'
    +'</div>'

    // GPS Treffpunkt
    +'<div class="ka-field">'
    +'<label class="ka-label">GPS-Treffpunkt mit Förster <span class="ka-label-optional">(optional)</span></label>'
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

function bind1(){
  var plzInp = document.getElementById('i-plz');
  var ortInp = document.getElementById('i-ort');
  if(plzInp) plzInp.addEventListener('input', function(){ S.plz = this.value; });
  if(ortInp) ortInp.addEventListener('input', function(){ S.ort = this.value; });
  if(plzInp && ortInp && window.bindPlzAutocomplete) window.bindPlzAutocomplete(plzInp, ortInp, document.getElementById('i-forstamt'));

  var forstamtInp = document.getElementById('i-forstamt');
  var revierInp = document.getElementById('i-revier');
  if(forstamtInp) forstamtInp.addEventListener('input', function(){ S.forstamt = this.value; });
  if(revierInp) revierInp.addEventListener('input', function(){ S.revier = this.value; });

  var gpsInp = document.getElementById('gps-standort');
  if(gpsInp) gpsInp.addEventListener('input', function(){ S.gps = this.value; });

  var gpsBtn = document.getElementById('gps-btn-standort');
  if(gpsBtn) gpsBtn.addEventListener('click', function(){
    var info = document.getElementById('gps-info-standort');
    if(!navigator.geolocation){ if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar. Koordinaten manuell eingeben oder auf Google Maps markieren.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a> und Koordinaten manuell eintragen.</span>'; return; }
    if(info) info.textContent='Standort wird ermittelt...';
    navigator.geolocation.getCurrentPosition(function(pos){
      var coords = pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6);
      S.gps = coords;
      if(gpsInp){ gpsInp.value = coords; }
      if(info) info.textContent='Koordinaten: '+coords;
    }, function(){
      if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar. Koordinaten manuell eingeben oder auf Google Maps markieren.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a> und per Rechtsklick die Koordinaten kopieren.</span>';
    }, {enableHighAccuracy:true,timeout:10000,maximumAge:0});
  });

  // Leaflet map
  if(false && window.kaInitMap){
    window.kaInitMap('map-gps-standort', {
      gpsInputId: 'gps-standort',
      onSelect: function(lat, lng){
        S.gps = lat.toFixed(6)+', '+lng.toFixed(6);
        var inp = document.getElementById('gps-standort');
        if(inp) inp.value = S.gps;
        var info = document.getElementById('gps-info-standort');
        if(info) info.textContent='Koordinaten: '+S.gps;
      }
    });
  }

  var treffpunktInp = document.getElementById('i-treffpunkt');
  if(treffpunktInp) treffpunktInp.addEventListener('input', function(){ S.treffpunkt = this.value; });

  document.getElementById('b1').addEventListener('click', function(){
    collectStandort();
    go(0);
  });
  document.getElementById('n1').addEventListener('click', function(){
    collectStandort();
    if(!S.plz.trim()){ showErr('e1','Bitte PLZ eingeben.'); return; }
    if(!S.ort.trim()){ showErr('e1','Bitte Ort eingeben.'); return; }
    if(!S.forstamt.trim()){ showErr('e1','Bitte Forstamt angeben.'); return; }
    if(!S.revier.trim()){ showErr('e1','Bitte Revier angeben.'); return; }
    hideErr('e1');
    // Pre-fill first Fläche forstamt/revier from shared Standort
    if(S.flaechen.length > 0 && !S.flaechen[0].forstamt) S.flaechen[0].forstamt = S.forstamt;
    if(S.flaechen.length > 0 && !S.flaechen[0].revier) S.flaechen[0].revier = S.revier;
    go(2);
  });
}

function collectStandort(){
  var plzEl=document.getElementById('i-plz'), ortEl=document.getElementById('i-ort');
  var faEl=document.getElementById('i-forstamt'), revEl=document.getElementById('i-revier');
  var gpsEl=document.getElementById('gps-standort'), trfEl=document.getElementById('i-treffpunkt');
  if(plzEl) S.plz=plzEl.value;
  if(ortEl) S.ort=ortEl.value;
  if(faEl) S.forstamt=faEl.value;
  if(revEl) S.revier=revEl.value;
  if(gpsEl) S.gps=gpsEl.value;
  if(trfEl) S.treffpunkt=trfEl.value;
}

// ── Step 2: Flächendetails (multi-Fläche) ─────────────────────────────────────
function renderFlaeche(f, idx){
  var aufwuchsChips = AUFWUCHS_TYPEN.map(function(a){
    var on = f.aufwuchsarten.indexOf(a.k) > -1;
    return '<button type="button" class="ka-chip'+(on?' selected':'')+'" data-idx="'+idx+'" data-awk="'+a.k+'">'
      +a.ico+' '+esc(a.name)+'</button>';
  }).join('');

  var methodeOpts = METHODEN.map(function(m){
    var on = f.methode === m.k;
    return '<div class="ka-radio-card'+(on?' selected':'')+'" data-idx="'+idx+'" data-mk="'+m.k+'">'
      +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label">'+m.ico+' '+esc(m.name)+'</div>'
      +'<div class="ka-radio-desc">'+esc(m.desc)+'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var hangOpts = HANG.map(function(h){
    var on = f.hangneigung === h.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-idx="'+idx+'" data-hk="'+h.k+'">'
      +esc(h.label)
      +'<span class="ka-toggle-sub">'+esc(h.desc)+(h.surcharge>0?' +'+Math.round(h.surcharge*100)+'%':'')+'</span>'
      +'</button>';
  }).join('');

  var zugangOpts = ZUGANG.map(function(z){
    var on = f.zugaenglichkeit === z.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-idx="'+idx+'" data-zk="'+z.k+'">'
      +esc(z.label)
      +'<span class="ka-toggle-sub">'+esc(z.desc)+'</span>'
      +'</button>';
  }).join('');

  var deleteBtn = S.flaechen.length > 1
    ? '<button type="button" class="ka-flaeche-del" data-idx="'+idx+'">✕ Entfernen</button>'
    : '';

  return '<div class="ka-flaeche" id="flaeche-'+idx+'">'
    +'<div class="ka-flaeche-header">'
    +'<div class="ka-flaeche-title">🌲 Fläche '+(idx+1)+'</div>'
    +deleteBtn
    +'</div>'

    // Flächengröße
    +'<div class="ka-field">'
    +'<label class="ka-label">Flächengröße (ha) *</label>'
    +'<input class="ka-inp fv-ha-inp" type="text" inputmode="decimal" data-idx="'+idx+'" value="'+esc(f.ha)+'" placeholder="z.B. 2.5 (Hektar)" autocomplete="off">'
    +'</div>'

    // Aufwuchsart
    +'<div class="ka-field">'
    +'<label class="ka-label">Aufwuchsart (Mehrfachauswahl) *</label>'
    +'<div class="ka-chips">'+aufwuchsChips+'</div>'
    +'</div>'

    // Arbeitsmethode
    +'<div class="ka-field">'
    +'<label class="ka-label">Arbeitsmethode *</label>'
    +'<div class="ka-cards-stacked">'+methodeOpts+'</div>'
    +'</div>'

    // Hangneigung
    +'<div class="ka-field">'
    +'<label class="ka-label">Hangneigung *</label>'
    +'<div class="ka-toggles">'+hangOpts+'</div>'
    +'</div>'

    // Zugänglichkeit
    +'<div class="ka-field">'
    +'<label class="ka-label">Zugänglichkeit *</label>'
    +'<div class="ka-toggles">'+zugangOpts+'</div>'
    +'</div>'

    // Besonderheiten
    +'<div class="ka-field">'
    +'<label class="ka-label">Besonderheiten <span class="ka-label-optional">(optional)</span></label>'
    +'<textarea class="ka-textarea fv-bes-inp" data-idx="'+idx+'" rows="2" placeholder="z.B. Feuchtstellen, Steine, Bach, Stacheldrahtzaun...">'+esc(f.besonderheiten)+'</textarea>'
    +'</div>'

    +'</div>';
}

function s2(){
  var flaechenHTML = S.flaechen.map(function(f,i){ return renderFlaeche(f,i); }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🌿 Flächendetails</h2>'
    +'<p>Geben Sie die Details zu allen zu bearbeitenden Flächen an. Mehrere Flächen sind möglich.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +flaechenHTML
    +'<button type="button" id="add-flaeche" class="ka-add-btn">+ Weitere Fläche hinzufügen</button>'
    +'<div class="ka-err" id="e2"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b2">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n2">Weiter →</button>'
    +'</div></div>';
}

function collectFlaechen(){
  document.querySelectorAll('.fv-ha-inp').forEach(function(inp){
    var idx=parseInt(inp.dataset.idx); if(S.flaechen[idx]) S.flaechen[idx].ha=inp.value;
  });
  document.querySelectorAll('.fv-bes-inp').forEach(function(ta){
    var idx=parseInt(ta.dataset.idx); if(S.flaechen[idx]) S.flaechen[idx].besonderheiten=ta.value;
  });
}

function validateFlaechen(){
  if(S.flaechen.length===0) return 'Mindestens eine Fläche ist erforderlich.';
  for(var i=0;i<S.flaechen.length;i++){
    var f=S.flaechen[i], n=i+1;
    var ha=parseFloat(f.ha);
    if(!f.ha||isNaN(ha)||ha<=0) return 'Fläche '+n+': Bitte eine gültige Flächengröße eingeben.';
    if(!f.aufwuchsarten||f.aufwuchsarten.length===0) return 'Fläche '+n+': Bitte mindestens eine Aufwuchsart wählen.';
    if(!f.methode) return 'Fläche '+n+': Bitte eine Arbeitsmethode wählen.';
    if(!f.hangneigung) return 'Fläche '+n+': Bitte die Hangneigung angeben.';
    if(!f.zugaenglichkeit) return 'Fläche '+n+': Bitte die Zugänglichkeit angeben.';
  }
  return null;
}

function bind2(){
  // Aufwuchs-Chips
  document.querySelectorAll('[data-awk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx=parseInt(this.dataset.idx), awk=this.dataset.awk;
      var f=S.flaechen[idx];
      var pos=f.aufwuchsarten.indexOf(awk);
      if(pos>-1) f.aufwuchsarten.splice(pos,1);
      else f.aufwuchsarten.push(awk);
      collectFlaechen();
      render();
    });
  });

  // Methode
  document.querySelectorAll('[data-mk]').forEach(function(el){
    el.addEventListener('click', function(){
      var idx=parseInt(this.dataset.idx);
      collectFlaechen();
      S.flaechen[idx].methode=this.dataset.mk;
      render();
    });
  });

  // Hangneigung
  document.querySelectorAll('[data-hk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx=parseInt(this.dataset.idx);
      collectFlaechen();
      S.flaechen[idx].hangneigung=this.dataset.hk;
      render();
    });
  });

  // Zugänglichkeit
  document.querySelectorAll('[data-zk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx=parseInt(this.dataset.idx);
      collectFlaechen();
      S.flaechen[idx].zugaenglichkeit=this.dataset.zk;
      render();
    });
  });

  // Fließende Inputs
  document.querySelectorAll('.fv-ha-inp').forEach(function(inp){
    inp.addEventListener('input', function(){ S.flaechen[parseInt(this.dataset.idx)].ha=this.value; });
  });
  document.querySelectorAll('.fv-bes-inp').forEach(function(ta){
    ta.addEventListener('input', function(){ S.flaechen[parseInt(this.dataset.idx)].besonderheiten=this.value; });
  });

  // Fläche löschen
  document.querySelectorAll('.ka-flaeche-del').forEach(function(btn){
    btn.addEventListener('click', function(){
      var idx=parseInt(this.dataset.idx);
      collectFlaechen();
      S.flaechen.splice(idx,1);
      render();
    });
  });

  // Fläche hinzufügen — Forstamt/Revier aus Standort übernehmen
  document.getElementById('add-flaeche').addEventListener('click', function(){
    collectFlaechen();
    var fl=newFlaeche();
    fl.forstamt = S.forstamt || '';
    fl.revier   = S.revier   || '';
    S.flaechen.push(fl);
    render();
    setTimeout(function(){
      var last=document.getElementById('flaeche-'+(S.flaechen.length-1));
      if(last) last.scrollIntoView({behavior:'smooth',block:'start'});
    },100);
  });

  document.getElementById('b2').addEventListener('click', function(){
    collectFlaechen();
    go(1);
  });
  document.getElementById('n2').addEventListener('click', function(){
    collectFlaechen();
    var err=validateFlaechen();
    if(err){ showErr('e2',err); return; }
    hideErr('e2');
    go(3);
  });
}

// ── Step 3: Zeitraum ──────────────────────────────────────────────────────────
function s3(){
  var quartalOpts = QUARTALE.map(function(q){
    return '<option value="'+q+'"'+(S.zeitpunkt===q?' selected':'')+'>'+esc(q)+'</option>';
  }).join('');

  var turnusOpts = TURNUS.map(function(t){
    var on = S.turnus === t.k;
    return '<div class="ka-radio-card'+(on?' selected':'')+'" data-tk="'+t.k+'">'
      +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label">'+esc(t.label)+'</div>'
      +'<div class="ka-radio-desc">'+esc(t.desc)
      +(t.k==='2x_jaehrlich'?' <strong style="color:#012d1d">— 10% Mengenrabatt</strong>':'')
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  var zielOpts = ZIEL.map(function(z){
    var on = S.ziel === z.k;
    return '<div class="ka-radio-card'+(on?' selected gold-border':'')+'" data-zk="'+z.k+'" style="'+(on?'border-color:#A3E635;background:rgba(163,230,53,0.06);':'')+'">'
      +'<div class="ka-radio-dot" style="'+(on?'border-color:#A3E635;background:#A3E635;':'')+'"><div class="ka-radio-dot-inner" style="'+(on?'display:block;':'')+'"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label" style="'+(on?'color:#012d1d;':'')+'">'+esc(z.label)+'</div>'
      +'<div class="ka-radio-desc">'+esc(z.desc)+'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📅 Zeitraum &amp; Turnus</h2>'
    +'<p>Wann soll die Maßnahme stattfinden und wie oft wird sie benötigt?</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Gewünschter Zeitpunkt *</label>'
    +'<select class="ka-select" id="i-zt"><option value="">— Quartal wählen —</option>'+quartalOpts+'</select>'
    +'<p class="ka-hint">Empfehlung: Frühjahr (März–Mai) oder Herbst (Aug–Okt). Bei Brombeere und Farn: 2 Schnitte/Jahr empfohlen.</p>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Maßnahmen-Turnus *</label>'
    +'<div class="ka-cards-stacked">'+turnusOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Pflegeziel *</label>'
    +'<div class="ka-cards-stacked">'+zielOpts+'</div>'
    +'</div>'

    +'<div class="ka-err" id="e3"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b3">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n3">Weiter →</button>'
    +'</div></div>';
}

function bind3(){
  document.getElementById('i-zt').addEventListener('change', function(){ S.zeitpunkt=this.value; });

  document.querySelectorAll('[data-tk]').forEach(function(el){
    el.addEventListener('click', function(){
      S.turnus=this.dataset.tk;
      render();
    });
  });

  document.querySelectorAll('[data-zk]').forEach(function(el){
    el.addEventListener('click', function(){
      S.ziel=this.dataset.zk;
      render();
    });
  });

  document.getElementById('b3').addEventListener('click', function(){
    S.zeitpunkt = document.getElementById('i-zt').value;
    go(2);
  });
  document.getElementById('n3').addEventListener('click', function(){
    S.zeitpunkt = document.getElementById('i-zt').value;
    if(!S.zeitpunkt){ showErr('e3','Bitte Zeitpunkt wählen.'); return; }
    if(!S.turnus){ showErr('e3','Bitte Maßnahmen-Turnus wählen.'); return; }
    if(!S.ziel){ showErr('e3','Bitte Pflegeziel angeben.'); return; }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Kontakt ───────────────────────────────────────────────────────────
function s4(){
  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📬 Kontaktdaten</h2>'
    +'<p>Wie können wir Sie erreichen? Wir melden uns innerhalb von 48 Stunden.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Vollständiger Name *</label>'
    +'<input class="ka-inp" type="text" id="i-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name">'
    +'</div>'

    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">Telefon *</label>'
    +'<input class="ka-inp" type="tel" id="i-tel" value="'+esc(S.telefon)+'" placeholder="+49 ..." autocomplete="tel">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">E-Mail-Adresse *</label>'
    +'<input class="ka-inp" type="email" id="i-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email">'
    +'</div>'
    +'</div>'

    +'<div class="ka-info-box warn">'
    +'<strong>🔧 Unser Einsatz:</strong> Ausschließlich handgeführte Geräte — Freischneider und Heppe/Sense. Bodenschonend und geländetauglich auch an steilen Hängen.'
    +'</div>'

    +'<div class="ka-field">'
    +'<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;font-weight:400">'
    +'<input type="checkbox" id="i-dsgvo" required '+(S.dsgvo?'checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'</div>'

    +'<div class="ka-err" id="e4"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b4">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n4">Weiter zur Übersicht →</button>'
    +'</div></div>';
}

function bind4(){
  document.getElementById('i-nm').addEventListener('input', function(){ S.name=this.value; });
  document.getElementById('i-tel').addEventListener('input', function(){ S.telefon=this.value; });
  document.getElementById('i-em').addEventListener('input', function(){ S.email=this.value; });
  document.getElementById('i-dsgvo').addEventListener('change', function(){ S.dsgvo=this.checked; });

  document.getElementById('b4').addEventListener('click', function(){
    collectKontakt();
    go(3);
  });
  document.getElementById('n4').addEventListener('click', function(){
    collectKontakt();
    if(!S.name.trim()){ showErr('e4','Bitte Name eingeben.'); return; }
    if(!S.telefon.trim()){ showErr('e4','Bitte Telefonnummer eingeben.'); return; }
    if(!S.email||!S.email.includes('@')){ showErr('e4','Bitte gültige E-Mail eingeben.'); return; }
    if(!S.dsgvo){ showErr('e4','Bitte Datenschutzerklärung bestätigen.'); return; }
    hideErr('e4');
    go(5);
  });
}

function collectKontakt(){
  var nm=document.getElementById('i-nm'), tel=document.getElementById('i-tel');
  var em=document.getElementById('i-em'), dsgvo=document.getElementById('i-dsgvo');
  if(nm) S.name=nm.value;
  if(tel) S.telefon=tel.value;
  if(em) S.email=em.value;
  if(dsgvo) S.dsgvo=dsgvo.checked;
}

// ── Step 5: Zusammenfassung + Fördercheck + Absenden ──────────────────────────
function s5(){
  var flaechenSummary = S.flaechen.map(function(f,i){
    var awk = f.aufwuchsarten.map(function(k){
      var a=AUFWUCHS_TYPEN.find(function(x){return x.k===k;}); return a?a.ico+' '+a.name:k;
    }).join(', ');
    var methode=METHODEN.find(function(m){return m.k===f.methode;});
    var hang=HANG.find(function(h){return h.k===f.hangneigung;});
    var zugang=ZUGANG.find(function(z){return z.k===f.zugaenglichkeit;});
    return '<div class="ka-summary" style="margin-bottom:10px">'
      +'<div class="ka-summary-title">🌲 Fläche '+(i+1)+'</div>'
      +'<div class="ka-summary-row"><span class="ka-summary-label">Größe</span><span class="ka-summary-value">'+esc(f.ha)+' ha</span></div>'
      +'<div class="ka-summary-row"><span class="ka-summary-label">Aufwuchs</span><span class="ka-summary-value">'+esc(awk||'–')+'</span></div>'
      +'<div class="ka-summary-row"><span class="ka-summary-label">Methode</span><span class="ka-summary-value">'+esc(methode?methode.name:'–')+'</span></div>'
      +'<div class="ka-summary-row"><span class="ka-summary-label">Hangneigung</span><span class="ka-summary-value">'+esc(hang?hang.label+' ('+hang.desc+')':'–')+'</span></div>'
      +'<div class="ka-summary-row"><span class="ka-summary-label">Zugänglichkeit</span><span class="ka-summary-value">'+esc(zugang?zugang.label:'–')+'</span></div>'
      +(f.besonderheiten?'<div class="ka-summary-row"><span class="ka-summary-label">Besonderheiten</span><span class="ka-summary-value">'+esc(f.besonderheiten)+'</span></div>':'')
      +'</div>';
  }).join('');

  var t = TURNUS.find(function(x){return x.k===S.turnus;})||{};
  var zl = ZIEL.find(function(x){return x.k===S.ziel;})||{};
  var bt = BESITZERTYP.find(function(b){return b.k===S.besitzertyp;})||{};

  // Fördercheck section
  var blOpts = Object.keys(BL_NAMEN).map(function(k){
    return '<option value="'+k+'"'+(S.bundesland===k?' selected':'')+'>'+BL_NAMEN[k]+'</option>';
  }).join('');

  var progHtml = '';
  if(S.bundesland && FOERDER_FLAECHE[S.bundesland]){
    progHtml = '<div class="ka-foerder-box">'
      +'<div class="ka-foerder-title">🏦 Förderprogramme für '+esc(BL_NAMEN[S.bundesland])+'</div>'
      + FOERDER_FLAECHE[S.bundesland].map(function(prog){
        var pname = typeof prog==='object' ? prog.name : prog;
        var pdesc = typeof prog==='object' ? (prog.desc||'') : '';
        var purl  = typeof prog==='object' ? (prog.url||'') : '';
        var checked = S.foerderprogramme.indexOf(pname) > -1;
        return '<label class="ka-check-card'+(checked?' selected':'')+'" style="margin-bottom:8px">'
          +'<input type="checkbox" class="fv-prog-cb" data-prog="'+esc(pname)+'" '+(checked?'checked':'')+' style="width:16px;height:16px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
          +'<div>'
          +'<div class="ka-foerder-prog-name">'+esc(pname)+'</div>'
          +(pdesc?'<div class="ka-foerder-prog-desc">'+esc(pdesc)+'</div>':'')
          +(purl?'<a href="'+esc(purl)+'" target="_blank" rel="noopener" style="display:inline-block;font-size:11px;color:#012d1d;margin-top:4px">🔗 Weitere Informationen</a>':'')
          +'</div>'
          +'</label>';
      }).join('')
      +(S.foerderprogramme.length > 0
        ? '<div style="margin-top:14px;padding-top:12px;border-top:1px solid #e0ece9">'
          +'<button type="button" id="foerder-pdf-btn" class="ka-btn ka-btn-primary ka-btn-sm">📄 Förderprogramme als PDF speichern</button>'
          +'<p class="ka-hint">Öffnet sich in einem neuen Tab — dort als PDF drucken oder speichern.</p>'
          +'</div>'
        : '')
      +'</div>';
  }

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📋 Zusammenfassung &amp; Absenden</h2>'
    +'<p>Prüfen Sie Ihre Angaben und senden Sie die Anfrage ab.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // Summary
    +'<div class="ka-summary">'
    +'<div class="ka-summary-title">📋 Ihre Angaben</div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Besitzertyp</span><span class="ka-summary-value">'+esc(bt.label||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Standort</span><span class="ka-summary-value">'+esc(S.plz+(S.ort?' '+S.ort:''))+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Forstamt</span><span class="ka-summary-value">'+esc(S.forstamt||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Revier</span><span class="ka-summary-value">'+esc(S.revier||'–')+'</span></div>'
    +(S.gps?'<div class="ka-summary-row"><span class="ka-summary-label">GPS Fläche</span><span class="ka-summary-value">'+esc(S.gps)+'</span></div>':'')
    +(S.treffpunkt?'<div class="ka-summary-row"><span class="ka-summary-label">Treffpunkt</span><span class="ka-summary-value">'+esc(S.treffpunkt)+'</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Zeitpunkt</span><span class="ka-summary-value">'+esc(S.zeitpunkt||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Turnus</span><span class="ka-summary-value">'+esc(t.label||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Pflegeziel</span><span class="ka-summary-value">'+esc(zl.label||'–')+'</span></div>'
    +'<div class="ka-summary-row"><span class="ka-summary-label">Kontakt</span><span class="ka-summary-value">'+esc(S.name)+'<br>'+esc(S.email)+'<br>'+esc(S.telefon)+'</span></div>'
    +'</div>'

    // Flächen-Summaries
    +flaechenSummary

    // Fördercheck
    +'<div class="ka-field" style="margin-top:16px">'
    +'<label class="ka-label">🏦 Fördermöglichkeiten prüfen <span class="ka-label-optional">(optional)</span></label>'
    +'<p class="ka-hint">Viele Maßnahmen zur Flächenvorbereitung werden mit 50–90% gefördert.</p>'
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

    +(S.foerdercheck==='ja' ?
      '<div class="ka-field" id="fv-bl-field">'
      +'<label class="ka-label">Bundesland *</label>'
      +'<select class="ka-select" id="i-bl"><option value="">— Bundesland wählen —</option>'+blOpts+'</select>'
      +'</div>'
      +'<div id="fv-prog-container">'+progHtml+'</div>'
    : '<div id="fv-bl-field" style="display:none"><select class="ka-select" id="i-bl"><option value="">— Bundesland wählen —</option>'+blOpts+'</select></div><div id="fv-prog-container"></div>')

    +'<div class="ka-err" id="e5"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b5">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind5(){
  // Fördercheck radio
  document.querySelectorAll('[data-fc]').forEach(function(el){
    el.addEventListener('click', function(){
      S.foerdercheck = this.dataset.fc;
      if(S.foerdercheck === 'nein'){ S.bundesland=''; S.foerderprogramme=[]; }
      render();
    });
  });

  var blSel = document.getElementById('i-bl');
  if(blSel){
    blSel.addEventListener('change', function(){
      S.bundesland = this.value;
      S.foerderprogramme = [];
      render();
    });
  }

  document.querySelectorAll('.fv-prog-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var prog = this.dataset.prog;
      if(this.checked){
        if(S.foerderprogramme.indexOf(prog)===-1) S.foerderprogramme.push(prog);
      } else {
        S.foerderprogramme = S.foerderprogramme.filter(function(p){return p!==prog;});
      }
    });
  });

  var pdfBtn = document.getElementById('foerder-pdf-btn');
  if(pdfBtn) pdfBtn.addEventListener('click', function(){ downloadFoerderPDF_FV(); });

  document.getElementById('b5').addEventListener('click', function(){ go(4); });

  document.getElementById('sub').addEventListener('click', function(){
    if(S.foerdercheck==='ja' && !S.bundesland){ showErr('e5','Bitte Bundesland auswählen.'); return; }
    if(!S.foerdercheck){ showErr('e5','Bitte Fördercheck-Option wählen.'); return; }
    hideErr('e5');

    var btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Wird gesendet…';

    var t = TURNUS.find(function(x){return x.k===S.turnus;})||{};
    var zl = ZIEL.find(function(x){return x.k===S.ziel;})||{};
    var bt = BESITZERTYP.find(function(b){return b.k===S.besitzertyp;})||{};

    var flaechenData = S.flaechen.map(function(f,i){
      var aufwuchsNamen = f.aufwuchsarten.map(function(k){
        var a=AUFWUCHS_TYPEN.find(function(x){return x.k===k;}); return a?a.name:k;
      });
      var methode=METHODEN.find(function(m){return m.k===f.methode;})||{};
      var hang=HANG.find(function(h){return h.k===f.hangneigung;})||{};
      var zugang=ZUGANG.find(function(z){return z.k===f.zugaenglichkeit;})||{};
      return {
        nr: i+1,
        ha: f.ha,
        aufwuchsarten: aufwuchsNamen.join(', '),
        methode: methode.name||f.methode,
        hangneigung: (hang.label||f.hangneigung)+' ('+(hang.desc||'')+')',
        zugaenglichkeit: zugang.label||f.zugaenglichkeit,
        besonderheiten: f.besonderheiten||'',
        forstamt: S.forstamt,
        revier: S.revier,
      };
    });

    var payload = {
      leistung: 'Flächenvorbereitung',
      waldbesitzertyp: bt.label||S.besitzertyp||'',
      plz: S.plz,
      ort: S.ort,
      forstamt: S.forstamt,
      revier: S.revier,
      gps: S.gps||'',
      treffpunkt: S.treffpunkt||'',
      flaechen: flaechenData,
      flaechen_anzahl: S.flaechen.length,
      zeitpunkt: S.zeitpunkt,
      turnus: t.label||S.turnus,
      ziel: zl.label||S.ziel,
      name: S.name,
      tel: S.telefon,
      email: S.email,
      foerdercheck: S.foerdercheck||'nein',
      bundesland: S.bundesland ? (BL_NAMEN[S.bundesland]||S.bundesland) : '',
      foerderprogramme: S.foerderprogramme.join(', '),
    };

    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));

    fetch('/wp-json/koch/v1/anfrage', {method:'POST', credentials:'same-origin', body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(){ showOK(); })
      .catch(function(err){
        console.error(err);
        btn.disabled = false;
        btn.textContent = '📤 Anfrage absenden';
        var errEl = document.getElementById('e5');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';}
        if(errEl) errEl.style.display='block';
      });
  });
}

// ── Erfolgs-Screen ─────────────────────────────────────────────────────────────
function showOK(){ clearDraft();
  try {
    var korb = JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
    if(!korb.items) korb.items=[];
    korb.items = korb.items.filter(function(i){ return i.type!=='flaechenvorbereitung'; });
    var summary = S.flaechen.map(function(f){ return f.ha+'ha'; }).join(', ');
    var fullState = JSON.parse(JSON.stringify(S));
    korb.items.push({type:'flaechenvorbereitung',label:'🌲 Flächenvorbereitung',summary:summary,data:fullState,addedAt:Date.now()});
    localStorage.setItem('ka_projektkorb', JSON.stringify(korb));
    var korbCount = korb.items.length;
  } catch(e){ console.error(e); var korbCount=1; }

  document.getElementById('pf-main').innerHTML = '<div class="ka-card"><div class="ka-success">'
    +'<div class="ka-success-icon">✅</div>'
    +'<h2>Anfrage eingegangen!</h2>'
    +'<p>Wir melden uns innerhalb von 48 Stunden mit einem unverbindlichen Angebot.</p>'
    +'<div class="ka-success-card">'
    +'<strong>🌲 Flächenvorbereitung</strong><br>'
    +'<span style="color:#666">'+esc(String(S.flaechen.length))+' Fläche(n) &mdash; '+esc(S.name)+'</span>'
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

// ── Fördercheck PDF-Export ─────────────────────────────────────────────────────
function downloadFoerderPDF_FV(){
  var fl0 = S.flaechen && S.flaechen[0] ? S.flaechen[0] : {};
  fetch('/wp-json/ka/v1/wizard-pdf', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name: S.name||'Waldbesitzer',
      email: S.email||'',
      waldflaeche: fl0.ha||'',
      bundesland: S.bundesland,
      eigentuemer: 'Flächenvorbereitung',
      programme: S.foerderprogramme
    })
  }).then(function(r){ return r.json(); })
    .then(function(d){ if(d&&d.html){ var w=window.open('','_blank'); w.document.write(d.html); w.document.close(); } })
    .catch(function(e){ console.error('PDF Fehler:',e); alert('Fehler beim Generieren des PDFs. Bitte versuchen Sie es erneut.'); });
}

// ── Expose for edit-mode support ──────────────────────────────────────────────
window._fvS = S;
window._fvRender = render;

// ── Init ───────────────────────────────────────────────────────────────────────
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', function(){ try{ render(); }catch(e){ console.error(e); } });
} else {
  try{ render(); }catch(e){ console.error(e); }
}

})();

// ── Edit-Mode (URL-Parameter ?edit) ───────────────────────────────────────────
(function(){
  var params = new URLSearchParams(window.location.search);
  if(!params.has('edit')) return;
  function tryLoadEdit(){
    if(typeof window._fvS === 'undefined' || typeof window._fvRender !== 'function'){
      setTimeout(tryLoadEdit, 100); return;
    }
    try {
      var korb = JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
      if(!korb.items) return;
      var item = korb.items.find(function(i){ return i.type==='flaechenvorbereitung'; });
      if(!item||!item.data) return;
      Object.keys(item.data).forEach(function(k){ window._fvS[k] = item.data[k]; });
      window._fvRender();
      var main = document.getElementById('pf-main');
      if(main && main.parentNode){
        var b = document.createElement('div');
        b.innerHTML='<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px;margin-bottom:16px"><strong style="color:#012d1d">✏️ Bearbeitungsmodus — Ihre gespeicherten Daten wurden geladen.</strong></div>';
        main.parentNode.insertBefore(b, main);
      }
    } catch(e){ console.error(e); }
  }
  tryLoadEdit();


/* P1: Browser-Back */
window.addEventListener("popstate",function(e){if(e.state&&typeof e.state.step==="number"){S.step=e.state.step;render();window.scrollTo(0,0);}});
/* P1: Load draft on init */
loadDraft();

})();

