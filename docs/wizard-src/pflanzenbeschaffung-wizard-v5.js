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





// ── Baumarten mit echten Preisen (Darmstädter Forstbaumschule 2025, Preis/100 Stk) ──
var TREES = [
  {k:'rotbuche',    name:'Rotbuche',     p100:770,  info:'1+0, 30-50cm'},
  {k:'stieleiche',  name:'Stieleiche',   p100:790,  info:'1+0, 30-50cm'},
  {k:'traubeneiche',name:'Traubeneiche', p100:790,  info:'1+0, 30-50cm'},
  {k:'bergahorn',   name:'Bergahorn',    p100:570,  info:'1+0, 30-50cm'},
  {k:'douglasie',   name:'Douglasie',    p100:1300, info:'2+1, 30-40cm'},
  {k:'weisstanne',  name:'Weißtanne',    p100:1040, info:'2+1, 20-25cm'},
  {k:'waldkiefer',  name:'Waldkiefer',   p100:404,  info:'1+1, 12-18cm'},
  {k:'haselnuss',   name:'Haselnuss',    p100:244,  info:'1+1, 30-50cm'},
  {k:'weissdorn',   name:'Weißdorn',     p100:226,  info:'1+1, 30-50cm'},
];
var TM = {};
TREES.forEach(function(t){ TM[t.k]=t; });

var COLORS = ['#012d1d','#A3E635','#3b82f6','#f59e0b','#8b5cf6','#ec4899','#10b981','#f97316','#06b6d4'];
function col(i){ var c=COLORS[i%COLORS.length]; return {bg:c+'22',bd:c+'55',tx:c}; }

// ── FoVG Herkunftsgebiete (Forstvermehrungsgutgesetz 2002, BLE-Liste) ──
var FORVG_HKG = {
  rotbuche:    { name:'Rotbuche', regulated:true, gebiete:[
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
  stieleiche:  { name:'Stieleiche', regulated:true, gebiete:[
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
  bergahorn:   { name:'Bergahorn', regulated:true, gebiete:[
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
  douglasie:   { name:'Douglasie', regulated:true, gebiete:[
    {code:'853 01',name:'Nordwestdeutsches Tiefland mit Schleswig-Holstein'},
    {code:'853 02',name:'Nordostdeutsches Tiefland außer Schleswig-Holstein'},
    {code:'853 03',name:'Mittel- und Ostdeutsches Tief- und Hügelland'},
    {code:'853 04',name:'West- und Süddeutsches Hügel- und Bergland sowie Alpen, kolline Stufe'},
    {code:'853 05',name:'West- und Süddeutsches Hügel- und Bergland sowie Alpen, montane Stufe'},
    {code:'853 06',name:'Südostdeutsches Hügel- und Bergland'},
  ]},
  weisstanne:  { name:'Weißtanne', regulated:true, gebiete:[
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
  waldkiefer:  { name:'Waldkiefer', regulated:true, gebiete:[
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

var HKG_KAT = [
  {k:'quellengesichert', label:'Q – Quellengesichert'},
  {k:'ausgewaehlt',      label:'A – Ausgewählt (phänotypisch selektiert)'},
  {k:'qualifiziert',     label:'G – Qualifiziert (genetisch geprüft)'},
  {k:'geprueft',         label:'P – Geprüft (Nachkommenschaftsprüfung)'},
];

// ── Pflanzengröße je Baumart ──────────────────────────────────────────────────
var PFLANZENGROESSEN = {
  rotbuche:    ['30–50 cm','50–80 cm','80–120 cm'],
  stieleiche:  ['30–50 cm','50–80 cm','80–120 cm'],
  traubeneiche:['30–50 cm','50–80 cm','80–120 cm'],
  bergahorn:   ['30–50 cm','50–80 cm','80–120 cm'],
  douglasie:   ['20–40 cm','30–50 cm','50–80 cm'],
  weisstanne:  ['15–25 cm','20–40 cm','40–60 cm'],
  waldkiefer:  ['10–18 cm','18–30 cm','30–50 cm'],
  haselnuss:   ['30–50 cm','50–80 cm','80–120 cm'],
  weissdorn:   ['30–50 cm','50–80 cm','80–120 cm'],
};

// ── Saison-Check für Nacktware ────────────────────────────────────────────────
function isNacktwareSaison(){
  var m = new Date().getMonth()+1; // 1=Jan
  return m >= 5 && m <= 9; // Mai–September
}

// ── State ──────────────────────────────────────────────────────────────────────
var S = {
  step: 0,
  // Step 0: Baumarten Gesamtüberblick
  treeQty: {},    // { 'rotbuche': 500 } — Gesamtmenge je Art
  // Step 1: Multi-Flächen
  flaechen: [],
  activeFl: 0,
  // Step 2: Herkunft & Qualität
  herkunft: {},   // { k: {hkg, kat} }
  wildling: {},   // { 'haselnuss': 'wildling'|'forstpflanze' }
  // Step 3: Liefermodalitäten
  lieferform: '',         // nacktware|container|ball (global, falls nicht pro Fläche)
  pflanzengroessen: {},   // { 'rotbuche': '30–50 cm' }
  qualitaet: '',          // standard|forstzertifiziert|oekologisch
  lieferMonat: '',
  lieferJahr: '',
  transport: '',          // ja|selbstabholer
  // Step 4: Kontakt
  name: '', email: '', tel: '', firma: '',
  auftraggeber: '',
  bemerkung: '',
  foerderberatung: false,
  uploadedFiles: [],
};
TREES.forEach(function(t){ S.treeQty[t.k] = 0; });

// ── Fläche Objekt ─────────────────────────────────────────────────────────────
function newFlaeche(id){
  var fl = {
    id: id || Date.now(),
    forstamt: '', revier: '',
    plz: '', ort: '', gps: '', treffpunkt: '',
    treeQty: {},        // Baumarten+Mengen für DIESE Fläche
    lieferform: '',     // nacktware|container|ball für DIESE Fläche
  };
  TREES.forEach(function(t){ fl.treeQty[t.k] = 0; });
  return fl;
}
S.flaechen = [newFlaeche()];

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function fmt(n){ return Number(n).toLocaleString('de-DE',{maximumFractionDigits:2}); }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-pflanzenbeschaffung-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent='';e.style.display='none';} }
function go(n){ S.step=n; saveDraft(); try{history.pushState({step:n},"","#step-"+n);}catch(e){} render(); window.scrollTo(0,0); }
function getSelTrees(){ return TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; }); }
function treeTotal(){ return TREES.reduce(function(s,t){ return s+(S.treeQty[t.k]||0)/100*t.p100; },0); }
function flaecheTotal(fl){
  return TREES.reduce(function(s,t){ return s+(fl.treeQty[t.k]||0)/100*t.p100; },0);
}
function getFlaecheById(id){ return S.flaechen.find(function(f){ return String(f.id)===String(id); }); }

// ── Render ─────────────────────────────────────────────────────────────────────
function render(){
  document.querySelectorAll('.pf-st').forEach(function(el){
    var i=parseInt(el.dataset.i);
    el.classList.remove('cur','done');
    if(i<S.step) el.classList.add('done');
    if(i===S.step) el.classList.add('cur');
    var dot=el.querySelector('.pf-dot');
    if(dot) dot.textContent = i<S.step ? '✓' : (i+1);
  });
  var el=document.getElementById('pf-main');
  if(!el) return;
  switch(S.step){
    case 0: el.innerHTML=s0(); bind0(); break;
    case 1: el.innerHTML=s1(); bindList1(); bindOuter1(); break;
    case 2: el.innerHTML=s2(); bind2(); break;
    case 3: el.innerHTML=s3(); bind3(); break;
    case 4: el.innerHTML=s4(); bind4(); break;
  }
}

// ── Step 0: Baumarten-Überblick ───────────────────────────────────────────────
function s0(){
  var nacktwareSaison = isNacktwareSaison();
  var cards = TREES.map(function(t,i){
    var qty=S.treeQty[t.k]||0, on=qty>0;
    var sub=on ? fmt(qty)+' Stk. × '+fmt(t.p100)+'€/100 = '+fmt(qty/100*t.p100)+' €' : '';
    return '<div class="pf-tree'+(on?' on':'')+'" id="tc-'+t.k+'">'
      +'<div class="pf-tree-hd">'
      +'<span class="pf-tree-name">'+esc(t.name)+'</span>'
      +'<span class="pf-tree-price">'+fmt(t.p100)+' €/100 Stk.<br><small style="font-size:10px;color:var(--n300)">'+t.info+'</small></span>'
      +'</div>'
      +'<div class="pf-tree-qty">'
      +'<button class="pf-qb" data-k="'+t.k+'" data-d="-50">−</button>'
      +'<input class="pf-qi" type="number" min="0" step="50" id="qi-'+t.k+'" value="'+qty+'" data-k="'+t.k+'">'
      +'<button class="pf-qb" data-k="'+t.k+'" data-d="50">+</button>'
      +'</div>'
      +'<div class="pf-tree-sub" id="ts-'+t.k+'" style="'+(on?'':'display:none')+'">'+sub+'</div>'
      +'</div>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌱 Baumarten & Stückzahlen</h2>'
    +'<p>Gesamtüberblick: Welche Baumarten und wie viele Pflanzen benötigen Sie insgesamt? Preise nach Darmstädter Forstbaumschule 2025. Mindestbestellmenge: 50 Stk. je Art.</p></div>'
    +'<div class="pf-body">'
    +(nacktwareSaison
      ? '<div style="background:#fff8e1;border-left:3px solid #f59e0b;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#012d1d">'
        +'⚠️ <strong>Saison-Hinweis (Mai–September):</strong> Nacktware ist aktuell nicht lieferbar. Bitte Container- oder Ballware wählen.'
        +'</div>'
      : '')
    +'<div class="pf-tree-grid">'+cards+'</div>'
    +'<div class="pf-price-box"><span>Richtpreis Pflanzgut gesamt (netto)</span><strong id="pt">'+fmt(treeTotal())+' €</strong></div>'
    +'<div class="pf-err" id="e0"></div>'
    +'</div>'
    +'<div class="pf-ft"><div></div>'
    +'<button class="pf-btn p" id="n0">Weiter →</button>'
    +'</div></div>';
}

function bind0(){
  function updateTree(k){
    var t=TM[k], qty=S.treeQty[k]||0, on=qty>0;
    var card=document.getElementById('tc-'+k);
    var sub=document.getElementById('ts-'+k);
    if(card){ if(on) card.classList.add('on'); else card.classList.remove('on'); }
    if(sub){
      if(on){ sub.textContent=fmt(qty)+' Stk. × '+fmt(t.p100)+'€/100 = '+fmt(qty/100*t.p100)+' €'; sub.style.display='block'; }
      else sub.style.display='none';
    }
    var pt=document.getElementById('pt');
    if(pt) pt.textContent=fmt(treeTotal())+' €';
  }
  document.querySelectorAll('.pf-qb').forEach(function(btn){
    btn.addEventListener('click',function(){
      var k=this.dataset.k, d=parseInt(this.dataset.d);
      S.treeQty[k]=Math.max(0,(S.treeQty[k]||0)+d);
      document.getElementById('qi-'+k).value=S.treeQty[k];
      updateTree(k);
    });
  });
  document.querySelectorAll('.pf-qi').forEach(function(inp){
    inp.addEventListener('input',function(){
      var k=this.dataset.k;
      S.treeQty[k]=Math.max(0,parseInt(this.value)||0);
      updateTree(k);
    });
  });
  document.getElementById('n0').addEventListener('click',function(){
    var total=TREES.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0);
    if(total===0){ showErr('e0','Bitte mindestens eine Baumart mit Stückzahl auswählen.'); return; }
    // Flächen initialisieren - Baumarten-Keys synchronisieren
    S.flaechen.forEach(function(fl){
      TREES.forEach(function(t){
        if(fl.treeQty[t.k]===undefined) fl.treeQty[t.k]=0;
      });
    });
    go(1);
  });
}

// ── Step 1: Multi-Flächen ─────────────────────────────────────────────────────
function flaecheHTML(fl, idx){
  var isActive = (idx === S.activeFl);
  var sel = getSelTrees();

  // Lieferform je Fläche
  var lieferformen = [
    {k:'nacktware', ico:'🌱', name:'Nacktware', desc:'Nur Oktober–April lieferbar'},
    {k:'container', ico:'🪴', name:'Container', desc:'Ganzjährig verfügbar'},
    {k:'ball',      ico:'⚽', name:'Ballware',  desc:'Premium – beste Anwachsrate'},
  ];
  var nacktwareSaison = isNacktwareSaison();

  var lieferformHTML = lieferformen.map(function(lf){
    var active = fl.lieferform===lf.k;
    var disabled = lf.k==='nacktware' && nacktwareSaison;
    return '<button type="button" class="pf-meth-btn pf-lf-btn" data-fid="'+fl.id+'" data-lf="'+lf.k+'" '
      +(disabled?'disabled ':'')
      +'style="padding:8px 10px;border-radius:8px;border:2px solid '+(active?'#012d1d':disabled?'#ddd':'#ddd')+';background:'+(active?'#fafaf7':disabled?'#f5f5f5':'#fff')+';cursor:'+(disabled?'not-allowed':'pointer')+';text-align:left;opacity:'+(disabled?'0.5':'1')+'">'
      +'<div style="font-size:13px;font-weight:'+(active?'700':'500')+';color:'+(active?'#012d1d':disabled?'#aaa':'#2d2d2a')+'">'+lf.ico+' '+lf.name+'</div>'
      +'<div style="font-size:10px;color:#888;margin-top:2px">'+lf.desc+'</div>'
      +'</button>';
  }).join('');

  // Baumarten+Stückzahlen für diese Fläche
  var verteilungRows = sel.map(function(t, i){
    var c = col(i);
    var currentVal = parseInt(fl.treeQty[t.k])||0;
    var totalForTree = S.treeQty[t.k]||0;
    var sumAll = S.flaechen.reduce(function(s,f){ return s+(parseInt(f.treeQty[t.k])||0); },0);
    var frei = totalForTree - sumAll;
    var freiClr = frei===0?'#012d1d':frei<0?'#e53e3e':'#b7791f';
    var freiBg  = frei===0?'#d4f0eb':frei<0?'#ffe5e5':'#fff8e1';
    var freiIcon= frei===0?'✅':frei<0?'⚠️':'🌱';
    return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #f0f0ee">'
      +'<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+c.tx+';flex-shrink:0;display:inline-block"></span>'
      +'<span style="font-size:13px;font-weight:500">'+esc(t.name)+'</span>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'
      +'<div style="text-align:right">'
      +'<div style="font-size:10px;color:#999;margin-bottom:2px">Gesamt: '+fmt(totalForTree)+'</div>'
      +'<span class="vt-free-badge" data-tree="'+t.k+'" style="font-size:11px;font-weight:600;color:'+freiClr+';background:'+freiBg+';border-radius:10px;padding:2px 8px">'+freiIcon+' '+Math.abs(frei)+' '+(frei<0?'zu viel':frei===0?'verteilt':'frei')+'</span>'
      +'</div>'
      +'<input class="pf-inp pf-fl-qty-inp" type="number" min="0" step="50" value="'+currentVal+'" '
      +'data-fid="'+fl.id+'" data-tree="'+t.k+'" style="width:80px;padding:6px 8px;text-align:center">'
      +'<span style="font-size:11px;color:#999;min-width:22px">Stk.</span>'
      +'</div>'
      +'</div>';
  }).join('');

  // Preis für diese Fläche
  var flPreis = flaecheTotal(fl);

  var summary=[];
  if(fl.plz||fl.ort) summary.push((fl.plz+' '+fl.ort).trim());
  if(fl.forstamt) summary.push('FA: '+fl.forstamt);

  return '<div class="pf-fl-item" id="fl-'+fl.id+'">'
    +'<div class="pf-fl-item-hd pf-fl-hd-click" data-flid="'+fl.id+'" data-flidx="'+idx+'">'
    +'<div>'
    +'<div class="pf-fl-item-title">Lieferstelle '+(idx+1)+'</div>'
    +'<div class="pf-fl-item-sub">'+(summary.length?summary.join(' · '):'Bitte ausfüllen')+'</div>'
    +'</div>'
    +(S.flaechen.length>1
      ? '<button class="pf-fl-del pf-fl-del-btn" data-delfl="'+fl.id+'">✕ Entfernen</button>'
      : '<span style="font-size:14px;color:var(--n300)">'+(isActive?'▲':'▼')+'</span>')
    +'</div>'
    +'<div class="pf-fl-item-body'+(isActive?' open':'')+'" id="flb-'+fl.id+'">'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>PLZ der Lieferstelle *</label>'
    +'<input class="pf-inp pf-fld-inp" type="text" inputmode="numeric" id="plz-'+fl.id+'" data-fid="'+fl.id+'" data-field="plz" value="'+esc(fl.plz)+'" placeholder="z.B. 83229" maxlength="5" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Ort der Lieferstelle *</label>'
    +'<input class="pf-inp pf-fld-inp" type="text" id="ort-'+fl.id+'" data-fid="'+fl.id+'" data-field="ort" value="'+esc(fl.ort)+'" placeholder="z.B. Rosenheim" autocomplete="off"></div>'
    +'<div class="pf-field">'
    +'<label>GPS-Koordinaten <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<input type="text" id="gps-'+fl.id+'" placeholder="z.B. 51.1234, 8.5678" style="flex:1;border:1px solid var(--n300,#d1d5db);border-radius:6px;padding:8px 10px;font-size:14px" oninput="updateGPS(this.value,'+fl.id+')" value="">'
    +'<button type="button" onclick="getMyLocation('+fl.id+')" style="padding:8px 12px;background:#012d1d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap">\ud83d\udccd Standort</button>'
    +'</div>'
    +'<div id="gps-info-'+fl.id+'" style="font-size:11px;color:#666;margin-top:3px"></div>'
    +'</div>'
    +'</div>'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Forstamt (optional)</label>'
    +'<input class="pf-inp pf-fld-inp" type="text" id="forstamt-'+fl.id+'" data-fid="'+fl.id+'" data-field="forstamt" value="'+esc(fl.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Revier (optional)</label>'
    +'<input class="pf-inp pf-fld-inp" type="text" id="revier-'+fl.id+'" data-fid="'+fl.id+'" data-field="revier" value="'+esc(fl.revier)+'" placeholder="z.B. Revier 3" autocomplete="off"></div>'
    +'</div>'

    +'<div class="pf-field"><label>🌲 Lieferform für diese Lieferstelle</label>'
    +(nacktwareSaison?'<div style="font-size:11px;color:#f59e0b;margin-bottom:6px">⚠️ Mai–September: Nacktware nicht verfügbar</div>':'')
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:6px">'+lieferformHTML+'</div></div>'

    +(sel.length>0
      ? '<div class="pf-field"><label>🌿 Baumarten & Stückzahlen für diese Lieferstelle</label>'
        +'<p style="font-size:12px;color:#666;margin-bottom:8px">Wie viele Pflanzen je Art an diese Lieferstelle? Das Badge zeigt Ihnen, wie viele noch zuzuordnen sind.</p>'
        +'<div class="pf-verteil-grid">'+verteilungRows+'</div>'
        +(flPreis>0?'<div style="margin-top:10px;padding:8px 12px;background:#f8f8f6;border-radius:6px;font-size:12px;color:#012d1d;font-weight:600">Richtpreis diese Lieferstelle: '+fmt(flPreis)+' € netto</div>':'')
        +'</div>'
      : '')

    +'</div>' // close body
    +'</div>'; // close item
}

function s1(){
  var html='<div class="pf-card">'
    +'<div class="pf-hd"><h2>📦 Lieferstellen</h2>'
    +'<p>Fügen Sie eine oder mehrere Lieferstellen hinzu. Für jede Lieferstelle geben Sie PLZ, Ort, Lieferform und Baumarten-Stückzahlen an.</p></div>'
    +'<div class="pf-body">'
    +'<div class="pf-fl-list" id="fl-list">';
  S.flaechen.forEach(function(fl,i){ html+=flaecheHTML(fl,i); });
  html+='</div>'
    +'<button class="pf-add-fl" id="btn-add-fl">+ Weitere Lieferstelle hinzufügen</button>'
    +'<div class="pf-price-box" style="margin-top:16px"><span>Richtpreis gesamt (alle Lieferstellen)</span><strong>'+fmt(treeTotal())+' € netto</strong></div>'
    +'<div class="pf-err" id="e1"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b1">← Zurück</button>'
    +'<button class="pf-btn p" id="n1">Weiter →</button>'
    +'</div></div>';
  return html;
}

function bindList1(){
  // Header toggle
  document.querySelectorAll('.pf-fl-hd-click').forEach(function(hd){
    hd.addEventListener('click',function(e){
      if(e.target.closest('.pf-fl-del-btn')) return;
      var idx=parseInt(this.dataset.flidx);
      S.activeFl = (S.activeFl===idx) ? -1 : idx;
      rebuildFl1();
    });
  });
  // Delete
  document.querySelectorAll('.pf-fl-del-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var fid=this.dataset.delfl;
      S.flaechen=S.flaechen.filter(function(f){ return String(f.id)!==String(fid); });
      if(S.activeFl>=S.flaechen.length) S.activeFl=S.flaechen.length-1;
      rebuildFl1();
    });
  });
  // Text inputs
  document.querySelectorAll('.pf-fld-inp').forEach(function(inp){
    inp.addEventListener('input',function(){
      var fid=this.dataset.fid, field=this.dataset.field;
      var fl=getFlaecheById(fid);
      if(fl&&field) fl[field]=this.value;
      if(field==='plz'||field==='ort') updateFlTitle(fid);
    });
  });
  // Lieferform buttons
  document.querySelectorAll('.pf-lf-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      if(this.disabled) return;
      var fid=this.dataset.fid, lf=this.dataset.lf;
      var fl=getFlaecheById(fid);
      if(fl){
        fl.lieferform=lf;
        // Update button styles in this fläche
        document.querySelectorAll('.pf-lf-btn[data-fid="'+fid+'"]').forEach(function(b){
          var active=b.dataset.lf===lf;
          b.style.borderColor=active?'#012d1d':'#ddd';
          b.style.background=active?'#fafaf7':'#fff';
          var lbl=b.querySelector('div');
          if(lbl) lbl.style.fontWeight=active?'700':'500';
        });
      }
    });
  });
  // Qty inputs
  document.querySelectorAll('.pf-fl-qty-inp').forEach(function(inp){
    inp.addEventListener('input',function(){
      var fid=this.dataset.fid, tree=this.dataset.tree;
      var fl=getFlaecheById(fid);
      var val=Math.max(0,parseInt(this.value)||0);
      if(fl) fl.treeQty[tree]=val;
      // Check totals
      var totalForTree=S.treeQty[tree]||0;
      var sum=S.flaechen.reduce(function(s,f){ return s+(parseInt(f.treeQty[tree])||0); },0);
      if(sum>totalForTree){
        this.style.borderColor='#e53e3e';
        showErr('e1','Hinweis: Verteilung für "'+TM[tree].name+'" überschreitet Gesamtmenge ('+fmt(sum)+' / '+fmt(totalForTree)+' Stk.)');
      } else {
        this.style.borderColor='';
        hideErr('e1');
      }
      updateVerteilBadges();
    });
  });
  updateVerteilBadges();
}

function bindOuter1(){
  document.getElementById('btn-add-fl').addEventListener('click',function(){
    var fl=newFlaeche(Date.now());
    TREES.forEach(function(t){ fl.treeQty[t.k]=0; });
    S.flaechen.push(fl);
    S.activeFl=S.flaechen.length-1;
    rebuildFl1();
  });
  document.getElementById('b1').addEventListener('click',function(){ go(0); });
  document.getElementById('n1').addEventListener('click',function(){
    // Read DOM values
    S.flaechen.forEach(function(fl){
      ['forstamt','revier','plz','ort'].forEach(function(field){
        var inp=document.getElementById(field+'-'+fl.id);
        if(inp) fl[field]=inp.value;
      });
    });
    // Validate
    var ok=true, errMsg='';
    S.flaechen.forEach(function(fl,i){
      if(!ok) return;
      if(!fl.plz||fl.plz.length<4){ ok=false; errMsg='Lieferstelle '+(i+1)+': Bitte gültige PLZ eingeben.'; }
      else if(!fl.ort.trim()){ ok=false; errMsg='Lieferstelle '+(i+1)+': Bitte Ort eingeben.'; }
      else if(!fl.lieferform){ ok=false; errMsg='Lieferstelle '+(i+1)+': Bitte Lieferform wählen.'; }
    });
    if(!ok){ showErr('e1',errMsg); return; }
    // Check if any lieferstelle has qty assigned
    var anyQty = S.flaechen.some(function(fl){
      return TREES.some(function(t){ return (fl.treeQty[t.k]||0)>0; });
    });
    if(!anyQty){ showErr('e1','Bitte mindestens einer Lieferstelle Baumarten und Stückzahlen zuordnen.'); return; }
    go(2);
  });
}

function rebuildFl1(){
  var list=document.getElementById('fl-list');
  if(!list) return;
  var html='';
  S.flaechen.forEach(function(fl,i){ html+=flaecheHTML(fl,i); });
  list.innerHTML=html;
  bindList1();
}

function updateVerteilBadges(){
  getSelTrees().forEach(function(t){
    var total=S.treeQty[t.k]||0;
    var sum=S.flaechen.reduce(function(s,fl){ return s+(parseInt(fl.treeQty[t.k])||0); },0);
    var frei=total-sum;
    var clr=frei===0?'#012d1d':frei<0?'#e53e3e':'#b7791f';
    var bg =frei===0?'#d4f0eb':frei<0?'#ffe5e5':'#fff8e1';
    var icon=frei===0?'✅':frei<0?'⚠️':'🌱';
    var txt=icon+' '+Math.abs(frei)+' '+(frei<0?'zu viel':frei===0?'verteilt':'frei');
    document.querySelectorAll('.vt-free-badge[data-tree="'+t.k+'"]').forEach(function(el){
      el.textContent=txt; el.style.color=clr; el.style.background=bg;
    });
  });
}

function updateFlTitle(fid){
  var fl=getFlaecheById(fid);
  if(!fl) return;
  var idx=S.flaechen.indexOf(fl);
  var sub=document.querySelector('#fl-'+fid+' .pf-fl-item-sub');
  if(sub){
    var parts=[];
    if(fl.plz||fl.ort) parts.push((fl.plz+' '+fl.ort).trim());
    if(fl.forstamt) parts.push('FA: '+fl.forstamt);
    sub.textContent=parts.length?parts.join(' · '):'Bitte ausfüllen';
  }
}

// ── Step 2: Herkunft & Qualität ────────────────────────────────────────────────
function s2(){
  var sel=getSelTrees();
  var WILDLING_ARTEN = ['haselnuss','weissdorn'];

  var rows = sel.map(function(t){
    var fvg = FORVG_HKG[t.k];
    var cur = S.herkunft[t.k] || {};
    var isWildlingArt = WILDLING_ARTEN.indexOf(t.k) > -1;

    var mainSection = '';
    if(!fvg || !fvg.regulated){
      mainSection = '<div style="font-size:12px;color:#888;padding:6px 0;font-style:italic">Nicht FoVG-reguliert — kein Herkunftsnachweis erforderlich</div>';
    } else {
      var hkgOpts = fvg.gebiete.map(function(g){
        return '<option value="'+esc(g.code)+'"'+(cur.hkg===g.code?' selected':'')+'>'+esc(g.code)+' – '+esc(g.name)+'</option>';
      }).join('');
      var katOpts = HKG_KAT.map(function(k){
        return '<option value="'+k.k+'"'+(cur.kat===k.k?' selected':'')+'>'+esc(k.label)+'</option>';
      }).join('');
      mainSection = '<div class="pf-g2" style="gap:8px">'
        +'<div class="pf-field"><label style="font-size:11px;color:#666">HKG-Code (FoVG) *</label>'
        +'<select class="pf-select pf-hkg-sel" data-k="'+t.k+'">'
        +'<option value="">— Herkunftsgebiet wählen —</option>'
        +hkgOpts
        +'</select></div>'
        +'<div class="pf-field"><label style="font-size:11px;color:#666">Saatgutkategorie *</label>'
        +'<select class="pf-select pf-kat-sel" data-k="'+t.k+'">'
        +'<option value="">— Kategorie —</option>'
        +katOpts
        +'</select></div>'
        +'</div>';
    }

    var wildlingSection = '';
    if(isWildlingArt){
      var wVal = S.wildling[t.k] || '';
      wildlingSection = '<div class="pf-field" style="margin-top:8px">'
        +'<label style="font-size:11px;color:#666">Pflanzenherkunft</label>'
        +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
        +'<button type="button" class="pf-wildling-btn" data-k="'+t.k+'" data-val="wildling" '
        +'style="padding:7px 14px;border-radius:6px;border:1.5px solid '+(wVal==='wildling'?'#012d1d':'#ddd')+';background:'+(wVal==='wildling'?'#fafaf7':'#fff')+';font-size:12px;cursor:pointer;color:'+(wVal==='wildling'?'#012d1d':'#555')+'">'
        +'🌿 Wildling</button>'
        +'<button type="button" class="pf-wildling-btn" data-k="'+t.k+'" data-val="forstpflanze" '
        +'style="padding:7px 14px;border-radius:6px;border:1.5px solid '+(wVal==='forstpflanze'?'#012d1d':'#ddd')+';background:'+(wVal==='forstpflanze'?'#fafaf7':'#fff')+';font-size:12px;cursor:pointer;color:'+(wVal==='forstpflanze'?'#012d1d':'#555')+'">'
        +'🌳 Forstpflanze (Anzucht)</button>'
        +'</div></div>';
    }

    return '<div style="padding:14px;background:#fafaf8;border-radius:10px;border:1px solid #e5e5df;margin-bottom:10px">'
      +'<div style="font-weight:700;font-size:14px;color:#2d2d2a;margin-bottom:10px">'+esc(t.name)
      +(fvg&&fvg.regulated?'<span style="font-size:11px;font-weight:400;color:#A3E635;margin-left:6px">FoVG-reguliert</span>':'')
      +'</div>'
      +mainSection
      +wildlingSection
      +'</div>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🔖 Herkunft & Qualität</h2>'
    +'<p>Für FoVG-regulierte Baumarten: Herkunftsgebiet (HKG-Code) und Saatgutkategorie angeben. Pflichtangabe für Förderung.</p></div>'
    +'<div class="pf-body">'
    +'<div style="background:rgba(163,230,53,0.06);border:1px solid #A3E63544;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#012d1d;line-height:1.5">'
    +'<strong>📋 FoVG-Pflicht</strong> — Das Forstvermehrungsgutgesetz (FoVG 2002) schreibt für alle geregelten Baumarten eine Herkunftsdokumentation vor. <a href="https://www.ble.de/DE/Themen/Wald-Fischerei-Forstgenetik/" target="_blank" style="color:#A3E635">BLE-Informationen →</a>'
    +'</div>'
    +rows
    +'<div class="pf-err" id="e2"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b2">← Zurück</button>'
    +'<button class="pf-btn p" id="n2">Weiter →</button>'
    +'</div></div>';
}

function bind2(){
  document.querySelectorAll('.pf-hkg-sel').forEach(function(sel){
    sel.addEventListener('change',function(){
      var k=this.dataset.k;
      if(!S.herkunft[k]) S.herkunft[k]={};
      S.herkunft[k].hkg=this.value;
    });
  });
  document.querySelectorAll('.pf-kat-sel').forEach(function(sel){
    sel.addEventListener('change',function(){
      var k=this.dataset.k;
      if(!S.herkunft[k]) S.herkunft[k]={};
      S.herkunft[k].kat=this.value;
    });
  });
  document.querySelectorAll('.pf-wildling-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var k=this.dataset.k, val=this.dataset.val;
      S.wildling[k]=val;
      document.querySelectorAll('.pf-wildling-btn[data-k="'+k+'"]').forEach(function(b){
        b.style.borderColor='#ddd'; b.style.background='#fff'; b.style.color='#555';
      });
      this.style.borderColor='#012d1d'; this.style.background='#fafaf7'; this.style.color='#012d1d';
    });
  });
  document.getElementById('b2').addEventListener('click',function(){ go(1); });
  document.getElementById('n2').addEventListener('click',function(){
    var sel=getSelTrees();
    var missing=sel.filter(function(t){
      var fvg=FORVG_HKG[t.k];
      if(!fvg||!fvg.regulated) return false;
      var h=S.herkunft[t.k];
      return !h||!h.hkg||!h.kat;
    });
    if(missing.length>0){
      showErr('e2','Bitte Herkunftsgebiet und Kategorie angeben für: '+missing.map(function(t){return t.name;}).join(', '));
      return;
    }
    hideErr('e2');
    go(3);
  });
}

// ── Step 3: Liefermodalitäten ─────────────────────────────────────────────────
function s3(){
  var sel=getSelTrees();
  var nacktwareSaison = isNacktwareSaison();

  // Check if any fläche uses nacktware
  var hasNacktware = S.flaechen.some(function(fl){ return fl.lieferform==='nacktware'; });

  var MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  var JAHRE = ['2026','2027','2028'];

  var monatOpts = MONATE.map(function(m,i){
    var disabled = hasNacktware && (i>=4 && i<=8);
    return '<option value="'+(i+1)+'"'
      +(S.lieferMonat===(i+1)?' selected':'')
      +(disabled?' disabled style="color:#ccc"':'')
      +'>'+(disabled?'⛔ ':'')+m+'</option>';
  }).join('');

  var jahrOpts = JAHRE.map(function(y){
    return '<option value="'+y+'"'+(S.lieferJahr===y?' selected':'')+'>'+y+'</option>';
  }).join('');

  // Pflanzengröße je Baumart
  var groessenHTML = sel.length > 0
    ? '<div class="pf-field">'
      +'<label style="font-weight:700">Pflanzengröße je Baumart</label>'
      +'<p style="font-size:12px;color:#888;margin-bottom:8px">Gewünschte Größenklasse je Art:</p>'
      +'<div style="display:flex;flex-direction:column;gap:10px">'
      +sel.map(function(t){
        var groessen = PFLANZENGROESSEN[t.k]||['30–50 cm','50–80 cm','80–120 cm'];
        var cur = S.pflanzengroessen[t.k]||'';
        var opts = groessen.map(function(g){
          return '<option value="'+esc(g)+'"'+(cur===g?' selected':'')+'>'+esc(g)+'</option>';
        }).join('');
        return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'
          +'<span style="min-width:120px;font-size:13px;font-weight:500">'+esc(t.name)+'</span>'
          +'<select class="pf-select pb-groesse-sel" data-k="'+t.k+'" style="flex:1;min-width:180px">'
          +'<option value="">— Größe wählen —</option>'
          +opts
          +'</select></div>';
      }).join('')
      +'</div></div>'
    : '';

  // Qualität
  var qualitaeten = [
    {k:'standard',         name:'Standard Forstqualität'},
    {k:'forstzertifiziert',name:'Forstzertifiziert (PEFC/FSC-Kette)'},
    {k:'oekologisch',      name:'Ökologische Produktion'},
  ];
  var qualHTML = qualitaeten.map(function(q){
    var active=S.qualitaet===q.k;
    return '<button type="button" class="pb-qual-btn" data-qual="'+q.k+'" '
      +'style="padding:8px 14px;border-radius:6px;border:1.5px solid '+(active?'#012d1d':'#ddd')+';background:'+(active?'#fafaf7':'#fff')+';font-size:12px;cursor:pointer;color:'+(active?'#012d1d':'#555')+';font-weight:'+(active?'600':'400')+'">'
      +q.name+'</button>';
  }).join('');

  // Transport
  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🚚 Liefermodalitäten</h2>'
    +'<p>Liefertermin, Pflanzengröße und Qualitätsanforderungen.'
    +(hasNacktware?' <strong style="color:#f59e0b">Achtung: mind. eine Lieferstelle mit Nacktware → nur Oktober–April!</strong>':'')
    +'</p></div>'
    +'<div class="pf-body">'

    +(hasNacktware && nacktwareSaison
      ? '<div style="background:#ffe5e5;border-left:3px solid #e53e3e;border-radius:8px;padding:10px 14px;margin-bottom:14px;font-size:12px;color:#c53030">'
        +'⚠️ <strong>Achtung:</strong> Sie haben Nacktware gewählt, aber aktuell ist Mai–September (Vegetationszeit). Nacktware ist in diesem Zeitraum nicht verfügbar. Bitte Lieferstelle(n) auf Container oder Ball umstellen.'
        +'</div>'
      : '')

    // Liefertermin-Übersicht je Fläche
    +'<div style="background:#f8f8f8;border-radius:8px;border:1px solid #e0e0d8;padding:12px;margin-bottom:14px">'
    +'<div style="font-size:12px;font-weight:700;color:#555;margin-bottom:8px">Lieferformen je Lieferstelle</div>'
    +S.flaechen.map(function(fl,i){
      var lfLabels={'nacktware':'🌱 Nacktware','container':'🪴 Container','ball':'⚽ Ballware'};
      return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:4px 0;border-bottom:1px dashed #e0e0d8">'
        +'<span>Lieferstelle '+(i+1)+': '+(fl.plz?fl.plz+' ':'')+esc(fl.ort||'(PLZ/Ort fehlt)')+'</span>'
        +'<span style="color:'+(fl.lieferform?'#012d1d':'#e53e3e')+';font-weight:600">'+(lfLabels[fl.lieferform]||'⚠️ Bitte zurück und wählen')+'</span>'
        +'</div>';
    }).join('')
    +'</div>'

    +'<div class="pf-field">'
    +'<label style="font-weight:700">Gewünschter Liefertermin *</label>'
    +(hasNacktware?'<p style="font-size:12px;color:#f59e0b;margin-bottom:4px">Nacktware: nur Oktober–April lieferbar</p>':'')
    +'<div class="pf-g2" style="margin-top:6px">'
    +'<div class="pf-field"><label style="font-size:11px;color:#666">Monat</label>'
    +'<select class="pf-inp" id="pb-monat"><option value="">— Monat —</option>'+monatOpts+'</select></div>'
    +'<div class="pf-field"><label style="font-size:11px;color:#666">Jahr</label>'
    +'<select class="pf-inp" id="pb-jahr"><option value="">— Jahr —</option>'+jahrOpts+'</select></div>'
    +'</div></div>'

    +groessenHTML

    +'<div class="pf-field">'
    +'<label style="font-weight:700">Qualitätsanforderungen *</label>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+qualHTML+'</div></div>'

    +'<div class="pf-field">'
    +'<label style="font-weight:700">Transport *</label>'
    +'<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">'
    +'<button type="button" class="pb-transport-btn" data-tr="ja" '
    +'style="padding:10px 16px;border-radius:8px;border:2px solid '+(S.transport==='ja'?'#012d1d':'#ddd')+';background:'+(S.transport==='ja'?'#fafaf7':'#fff')+';cursor:pointer;text-align:left;font-size:13px;color:'+(S.transport==='ja'?'#012d1d':'#555')+';font-weight:'+(S.transport==='ja'?'700':'400')+'">'
    +'🚛 Transport durch Koch Aufforstung<br><small style="font-weight:400;font-size:11px;color:#888">Auf Anfrage, nach Menge und Entfernung</small></button>'
    +'<button type="button" class="pb-transport-btn" data-tr="selbstabholer" '
    +'style="padding:10px 16px;border-radius:8px;border:2px solid '+(S.transport==='selbstabholer'?'#012d1d':'#ddd')+';background:'+(S.transport==='selbstabholer'?'#fafaf7':'#fff')+';cursor:pointer;text-align:left;font-size:13px;color:'+(S.transport==='selbstabholer'?'#012d1d':'#555')+';font-weight:'+(S.transport==='selbstabholer'?'700':'400')+'">'
    +'📦 Selbstabholer<br><small style="font-weight:400;font-size:11px;color:#888">Kostenlose Abholung am Lager Koch Aufforstung</small></button>'
    +'</div></div>'

    +'<div class="pf-err" id="e3"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b3">← Zurück</button>'
    +'<button class="pf-btn p" id="n3">Weiter →</button>'
    +'</div></div>';
}

function bind3(){
  var monatSel=document.getElementById('pb-monat');
  var jahrSel=document.getElementById('pb-jahr');
  if(monatSel) monatSel.addEventListener('change',function(){ S.lieferMonat=parseInt(this.value)||''; });
  if(jahrSel) jahrSel.addEventListener('change',function(){ S.lieferJahr=this.value; });

  document.querySelectorAll('.pb-groesse-sel').forEach(function(sel){
    sel.addEventListener('change',function(){ S.pflanzengroessen[this.dataset.k]=this.value; });
  });
  document.querySelectorAll('.pb-qual-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      S.qualitaet=this.dataset.qual;
      document.querySelectorAll('.pb-qual-btn').forEach(function(b){
        b.style.borderColor='#ddd'; b.style.background='#fff'; b.style.color='#555'; b.style.fontWeight='400';
      });
      this.style.borderColor='#012d1d'; this.style.background='#fafaf7'; this.style.color='#012d1d'; this.style.fontWeight='600';
    });
  });
  document.querySelectorAll('.pb-transport-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      S.transport=this.dataset.tr;
      document.querySelectorAll('.pb-transport-btn').forEach(function(b){
        b.style.borderColor='#ddd'; b.style.background='#fff'; b.style.color='#555'; b.style.fontWeight='400';
      });
      this.style.borderColor='#012d1d'; this.style.background='#fafaf7'; this.style.color='#012d1d'; this.style.fontWeight='700';
    });
  });
  document.getElementById('b3').addEventListener('click',function(){ go(2); });
  document.getElementById('n3').addEventListener('click',function(){
    if(!S.lieferMonat||!S.lieferJahr){ showErr('e3','Bitte Liefertermin (Monat und Jahr) wählen.'); return; }
    var hasNacktware = S.flaechen.some(function(fl){ return fl.lieferform==='nacktware'; });
    if(hasNacktware){
      var m=parseInt(S.lieferMonat);
      if(m>=5&&m<=9){ showErr('e3','Nacktware ist nur Oktober–April lieferbar. Bitte anderen Monat wählen.'); return; }
    }
    if(!S.qualitaet){ showErr('e3','Bitte Qualitätsanforderung wählen.'); return; }
    if(!S.transport){ showErr('e3','Bitte Transportoption wählen.'); return; }
    var sel=getSelTrees();
    var missingGroesse=sel.filter(function(t){ return !S.pflanzengroessen[t.k]; });
    if(missingGroesse.length>0){ showErr('e3','Bitte Pflanzengröße wählen für: '+missingGroesse.map(function(t){return t.name;}).join(', ')); return; }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Kontakt + Zusammenfassung ─────────────────────────────────────────
function s4(){
  var sel=getSelTrees();
  var MONATSNAMEN=['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];

  var baumTags=sel.map(function(t,i){
    var c=col(i);
    return '<span class="pf-tag" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'">'+esc(t.name)+' × '+fmt(S.treeQty[t.k])+'</span>';
  }).join('');

  // Flächen-Zusammenfassung
  var lfLabels={'nacktware':'🌱 Nacktware','container':'🪴 Container','ball':'⚽ Ballware'};
  var flaechenRows=S.flaechen.map(function(fl,i){
    var flSel=TREES.filter(function(t){ return (fl.treeQty[t.k]||0)>0; });
    var qtyTags=flSel.map(function(t,j){
      var c=col(j);
      return '<span class="pf-tag" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'">'+esc(t.name)+': '+fmt(fl.treeQty[t.k])+'</span>';
    }).join('');
    var flPreis=flaecheTotal(fl);
    return '<div style="padding:10px 0;border-bottom:1px solid #e5e5df">'
      +'<strong>Lieferstelle '+(i+1)+'</strong>'
      +'<div style="font-size:12px;color:#555;margin-top:4px">'
      +(fl.plz||fl.ort?(fl.plz+' '+fl.ort).trim():'')
      +(fl.forstamt?' · FA: '+esc(fl.forstamt)+(fl.revier?' / '+esc(fl.revier):''):'')
      +'</div>'
      +'<div style="font-size:12px;color:#012d1d;font-weight:600;margin-top:3px">'+(lfLabels[fl.lieferform]||'–')+'</div>'
      +(qtyTags?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">'+qtyTags+'</div>':'')
      +(flPreis>0?'<div style="font-size:11px;color:#666;margin-top:4px">Richtpreis: '+fmt(flPreis)+' € netto</div>':'')
      +'</div>';
  }).join('');

  // FoVG Herkunft
  var herkunftRows=sel.map(function(t){
    var fvg=FORVG_HKG[t.k]; var h=S.herkunft[t.k]||{};
    if(!fvg||!fvg.regulated) return '<span class="pf-tag" style="background:#f5f5f5;color:#888;font-size:11px">'+esc(t.name)+': nicht FoVG-reg.</span>';
    var g=fvg.gebiete.find(function(g){return g.code===h.hkg;});
    var kat=HKG_KAT.find(function(k){return k.k===h.kat;});
    return '<span class="pf-tag" style="background:rgba(163,230,53,0.06);border:1px solid #A3E63555;color:#012d1d;font-size:11px">🔖 '+esc(t.name)+': '+(g?esc(g.code):'?')+(kat?' ('+kat.label.split('–')[0].trim()+')':'')+'</span>';
  }).join('');

  var auftraggeber = [
    {k:'privatperson', label:'👤 Privatperson / Waldeigentümer'},
    {k:'forstbetrieb', label:'🏢 Forstbetrieb'},
    {k:'gemeinde',     label:'🏛️ Gemeinde / Körperschaft'},
    {k:'vereinigung',  label:'🤝 Forstwirtschaftliche Vereinigung'},
  ];
  var auftrAgHTML = auftraggeber.map(function(o){
    var active=S.auftraggeber===o.k;
    return '<button type="button" class="pb-ag-btn" data-ag="'+o.k+'" '
      +'style="padding:8px 14px;border-radius:6px;border:1.5px solid '+(active?'#012d1d':'#ddd')+';background:'+(active?'#fafaf7':'#fff')+';font-size:12px;cursor:pointer;color:'+(active?'#012d1d':'#555')+';font-weight:'+(active?'600':'400')+'">'
      +o.label+'</button>';
  }).join('');

  var qualStr={'standard':'Standard Forstqualität','forstzertifiziert':'Forstzertifiziert','oekologisch':'Ökologische Produktion'}[S.qualitaet]||'–';
  var transportStr={'ja':'Transport durch Koch Aufforstung','selbstabholer':'Selbstabholer'}[S.transport]||'–';

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>✅ Kontakt & Zusammenfassung</h2>'
    +'<p>Bitte Kontaktdaten angeben und Anfrage prüfen. Wir melden uns innerhalb von 48 Stunden.</p></div>'
    +'<div class="pf-body">'

    // Zusammenfassung
    +'<div style="background:#f8f8f6;border-radius:10px;border:1px solid #d0d0cc;padding:14px;margin-bottom:18px">'
    +'<div style="font-weight:700;font-size:13px;color:#012d1d;margin-bottom:10px">📦 Bestellübersicht</div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Baumarten gesamt</span><div style="display:flex;flex-wrap:wrap;gap:4px">'+baumTags+'</div></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Gesamtstückzahl</span><span>'+fmt(sel.reduce(function(s,t){return s+(S.treeQty[t.k]||0);},0))+' Pflanzen</span></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Richtpreis Pflanzgut</span><span>'+fmt(treeTotal())+' € netto</span></div>'
    +(herkunftRows?'<div class="pf-sum-row"><span class="pf-sum-lbl">FoVG Herkunft</span><div style="display:flex;flex-wrap:wrap;gap:4px">'+herkunftRows+'</div></div>':'')
    +'<div style="margin:12px 0 4px;font-weight:600;font-size:12px;color:#555">Lieferstellen</div>'
    +flaechenRows
    +'<div class="pf-sum-row" style="margin-top:10px"><span class="pf-sum-lbl">Liefertermin</span><span>'+(S.lieferMonat&&S.lieferJahr?MONATSNAMEN[S.lieferMonat]+' '+S.lieferJahr:'–')+'</span></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Qualität</span><span>'+esc(qualStr)+'</span></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Transport</span><span>'+esc(transportStr)+'</span></div>'
    +'</div>'

    // Auftraggeber
    +'<div class="pf-field"><label style="font-weight:700">Auftraggeber *</label>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">'+auftrAgHTML+'</div></div>'

    // Kontaktdaten
    +'<div class="pf-field"><label>Vollständiger Name *</label>'
    +'<input class="pf-inp" type="text" id="pb-name" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name"></div>'
    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>E-Mail-Adresse *</label>'
    +'<input class="pf-inp" type="email" id="pb-email" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email"></div>'
    +'<div class="pf-field"><label>Telefon</label>'
    +'<input class="pf-inp" type="tel" id="pb-tel" value="'+esc(S.tel)+'" placeholder="+49 ..." autocomplete="tel"></div>'
    +'<div class="pf-field">'
    +'<label>Treffpunkt mit F\u00f6rster <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<input type="text" id="pb-treffpunkt" placeholder="z.B. Parkplatz Waldweg / GPS-Koordinaten / Forststra\u00dfe km 3" style="width:100%;border:1px solid var(--n300,#d1d5db);border-radius:6px;padding:8px 10px;font-size:14px;box-sizing:border-box" oninput="S.treffpunkt=this.value">'
    +'</div>'
    +'</div>'
    +'<div class="pf-field"><label>Forstbetrieb / Organisation (optional)</label>'
    +'<input class="pf-inp" type="text" id="pb-firma" value="'+esc(S.firma)+'" placeholder="Optional" autocomplete="organization"></div>'

    +'<div class="pf-field" style="margin-top:8px"><label>Dokumente hochladen (optional)</label>'
    +'<input class="pf-inp" type="file" id="pb-docs" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" multiple style="padding:10px 12px;cursor:pointer">'
    +'<p style="font-size:11px;color:#888;margin-top:4px">z.B. Flurkarten, Lagepläne, Fotos (max. 10 MB)</p></div>'

    +'<div class="pf-field"><label>Anmerkungen (optional)</label>'
    +'<textarea class="pf-inp" id="pb-bem" rows="3" placeholder="Besondere Anforderungen, Rückfragen...">'+esc(S.bemerkung)+'</textarea></div>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0d0cc;line-height:1.4">'
    +'<input type="checkbox" id="pb-foerder" style="width:18px;height:18px;margin-top:2px;accent-color:#012d1d;flex-shrink:0"'+(S.foerderberatung?' checked':'')+' >'
    +'<span><strong>🏦 Förderberatung anfragen</strong><br><small style="color:#666">Pflanzenbeschaffung kann gefördert werden. Wir prüfen kostenlos alle Möglichkeiten.</small></span>'
    +'</label>'

    +'<p style="font-size:12px;color:#999;margin-top:14px">Unverbindliche Anfrage. Pflanzgutpreise basieren auf Darmstädter Forstbaumschule 2025. Verbindliches Angebot innerhalb von 48 Stunden.</p>'
    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="i-dsgvo" required style="width:20px;height:20px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'<div class="pf-err" id="e4"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b4">← Zurück</button>'
    +'<button class="pf-btn p" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind4(){
  document.querySelectorAll('.pb-ag-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      S.auftraggeber=this.dataset.ag;
      document.querySelectorAll('.pb-ag-btn').forEach(function(b){
        b.style.borderColor='#ddd'; b.style.background='#fff'; b.style.color='#555'; b.style.fontWeight='400';
      });
      this.style.borderColor='#012d1d'; this.style.background='#fafaf7'; this.style.color='#012d1d'; this.style.fontWeight='600';
    });
  });
  var ifoerder=document.getElementById('pb-foerder');
  if(ifoerder) ifoerder.addEventListener('change',function(){ S.foerderberatung=this.checked; });
  document.getElementById('b4').addEventListener('click',function(){ go(3); });
  document.getElementById('sub').addEventListener('click',function(){
    var nm=document.getElementById('pb-name').value.trim();
    var em=document.getElementById('pb-email').value.trim();
    var tel=document.getElementById('pb-tel').value.trim();
    var firma=document.getElementById('pb-firma').value.trim();
    var bem=document.getElementById('pb-bem').value.trim();
    var docs=document.getElementById('pb-docs');
    var foerder=document.getElementById('pb-foerder');
    S.name=nm; S.email=em; S.tel=tel; S.firma=firma; S.bemerkung=bem;
    if(docs) S.uploadedFiles=Array.from(docs.files);
    if(foerder) S.foerderberatung=foerder.checked;

    if(!S.auftraggeber){ showErr('e4','Bitte Auftraggeber-Typ wählen.'); return; }
    if(!nm){ showErr('e4','Bitte Namen eingeben.'); return; }
    if(!em||!em.includes('@')){ showErr('e4','Bitte gültige E-Mail-Adresse eingeben.'); return; }
    var dsgvoEl=document.getElementById('i-dsgvo'); if(dsgvoEl&&!dsgvoEl.checked){ showErr('e4','Bitte Datenschutzerklärung bestätigen.'); return; }


    var btn=this; btn.disabled=true; btn.textContent='⏳ Wird gesendet…';

    var sel=getSelTrees();
    var MONATSNAMEN=['','Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    var lfLabels={'nacktware':'Nacktware','container':'Container','ball':'Ballware'};
    var auftrStr={'privatperson':'Privatperson/Waldeigentümer','forstbetrieb':'Forstbetrieb','gemeinde':'Gemeinde/Körperschaft','vereinigung':'Forstwirtschaftliche Vereinigung'}[S.auftraggeber]||S.auftraggeber;

    var flaechenData=S.flaechen.map(function(fl,i){
      var flSel=TREES.filter(function(t){ return (fl.treeQty[t.k]||0)>0; });
      return {
        nummer: i+1,
        plz: fl.plz, ort: fl.ort,
        forstamt: fl.forstamt||'', revier: fl.revier||'',
        lieferform: lfLabels[fl.lieferform]||fl.lieferform,
        baumarten: flSel.map(function(t){ return t.name+': '+fl.treeQty[t.k]+' Stk.'; }).join(', '),
        richtpreis: fmt(flaecheTotal(fl))+' €',
        gps: fl.gps||''
      };
    });

    var payload={
      leistung: 'Pflanzenbeschaffung',
      waldbesitzertyp: S.waldbesitzertyp||'',
      baumarten_gesamt: sel.map(function(t){ return t.name+': '+S.treeQty[t.k]+' Stk.'; }).join(', '),
      pflanzenzahl_gesamt: sel.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0),
      richtpreis_gesamt: fmt(treeTotal())+' €',
      lieferstellen_anzahl: S.flaechen.length,
      lieferstellen: JSON.stringify(flaechenData),
      liefertermin: MONATSNAMEN[S.lieferMonat]+' '+S.lieferJahr,
      qualitaet: {'standard':'Standard','forstzertifiziert':'Forstzertifiziert','oekologisch':'Ökologisch'}[S.qualitaet]||S.qualitaet,
      transport: {'ja':'Transport durch Koch','selbstabholer':'Selbstabholer'}[S.transport]||S.transport,
      pflanzengroessen: sel.map(function(t){ return t.name+': '+(S.pflanzengroessen[t.k]||'–'); }).join(' | '),
      forvg_herkunft: sel.map(function(t){
        var fvg=FORVG_HKG[t.k]; var h=S.herkunft[t.k]||{};
        if(!fvg||!fvg.regulated) return t.name+': nicht FoVG-reguliert';
        var g=fvg.gebiete.find(function(g){return g.code===h.hkg;});
        var kat=HKG_KAT.find(function(k){return k.k===h.kat;});
        var wildlingInfo=['haselnuss','weissdorn'].indexOf(t.k)>-1&&S.wildling[t.k]?' | '+({'wildling':'Wildling','forstpflanze':'Forstpflanze'}[S.wildling[t.k]]||''):'';
        return t.name+': HKG '+h.hkg+(g?' ('+g.name+')':'')+' | '+(kat?kat.label:'')+wildlingInfo;
      }).join('\n'),
      auftraggeber: auftrStr,
      foerderberatung: S.foerderberatung?'Ja':'Nein',
      bemerkung: S.bemerkung||'',
      name: S.name, email: S.email, tel: S.tel||'', firma: S.firma||'',
          treffpunkt: S.treffpunkt||'',
      gps: S.gps||'',
    };

    var fd=new FormData();
    fd.append('data',JSON.stringify(payload));
    if(docs&&docs.files&&docs.files[0]) fd.append('file',docs.files[0]);
    fetch('/wp-json/koch/v1/anfrage',{method:'POST',credentials:'same-origin',body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(showOK)
      .catch(function(err){
        console.error(err);
        btn.disabled=false; btn.textContent='📤 Anfrage absenden';
        var errEl=document.getElementById('e4');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';errEl.style.display='block';});
  });
}

function showOK(){ clearDraft();
  try {
    var korb = JSON.parse(localStorage.getItem("ka_projektkorb")||"{}");
    if(!korb.items) korb.items = [];
    korb.items = korb.items.filter(function(i){ return i.type !== "pflanzenbeschaffung"; });
    korb.items.push({
      type: "pflanzenbeschaffung",
      label: "🪴 Pflanzenbeschaffung",
      summary: (S.name || "Anfrage"),
      data: S,
      addedAt: Date.now()
    });
    localStorage.setItem("ka_projektkorb", JSON.stringify(korb));
    var korbCount = korb.items.length;
  } catch(e) { var korbCount = 1; }
  
  document.getElementById("pf-main").innerHTML='<div class="pf-card"><div class="pf-ok">'
    +'<div class="pf-ok-ico">✅</div><h2>Leistung hinzugefügt!</h2>'
    +'<div style="background:#F8F9F5;border:2px solid #012d1d;border-radius:10px;padding:16px;margin:20px 0;text-align:left;">'
    +'<strong>🪴 Pflanzenbeschaffung</strong></div>'
    +'<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:16px;margin:20px 0;text-align:left;">'
    +'<p style="margin:0 0 8px;font-weight:600;">💡 Mehrere Leistungen kombinieren?</p>'
    +'<p style="margin:0;color:#666;font-size:0.9rem;">Die meisten Projekte benötigen mehrere Leistungen für ein Gesamtangebot.</p>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;">'
    +'<a href="/#leistungen" style="display:block;padding:14px 24px;background:#012d1d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center;">➕ Weitere Leistung hinzufügen</a>'
    +'<a href="/projektkorb/" style="display:block;padding:14px 24px;background:#A3E635;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center;">🛒 Zum Projektkorb ('+korbCount+')</a>'
    +'</div>'
    +'<p style="margin-top:20px;font-size:0.85rem;color:#999;"><a href="/" style="color:#012d1d;">← Zur Startseite</a></p>'
    +'</div></div>';
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ try{ render(); }catch(e){ console.error(e); } });
} else {
  try{ render(); }catch(e){ console.error(e); }
}
})();


function getMyLocation(flId) {
  var info = document.getElementById('gps-info-' + flId);
  if (navigator.geolocation) {
    if (info) info.textContent = 'Standort wird ermittelt...';
    navigator.geolocation.getCurrentPosition(
      function(pos) {
        var coords = pos.coords.latitude.toFixed(6) + ', ' + pos.coords.longitude.toFixed(6);
        var inp = document.getElementById('gps-' + flId);
        if (inp) { inp.value = coords; inp.dispatchEvent(new Event('input')); }
        if (info) info.textContent = 'Koordinaten: ' + coords;
      },
      function(err) {
        if (info) info.innerHTML = '<span role="status" aria-live="polite">📍 GPS nicht verfuegbar. Koordinaten manuell eingeben oder auf Google Maps markieren.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps oeffnen</a> und Koordinaten manuell eintragen.</span>';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    if (info) info.innerHTML = '<span role="status" aria-live="polite">📍 GPS nicht verfuegbar. Koordinaten manuell eingeben oder auf Google Maps markieren.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps oeffnen</a> und Koordinaten manuell eintragen.</span>';
  }
}

function updateGPS(val, flId) {
  var fl = S.flaechen.find(function(f){ return String(f.id) === String(flId); });
  if (fl) fl.gps = val;
}

/* P1: Browser-Back */
window.addEventListener("popstate",function(e){if(e.state&&typeof e.state.step==="number"){S.step=e.state.step;render();window.scrollTo(0,0);}});
/* P1: Load draft on init */
loadDraft();


