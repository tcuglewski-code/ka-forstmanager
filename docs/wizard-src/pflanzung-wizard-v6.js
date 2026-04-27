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



// -- Dynamic Season Generator (WP-13) --
function kaSeasons(){
  var now=new Date(),y=now.getFullYear(),m=now.getMonth()+1;
  var out=[];
  var ss=[["Frühling",3,5],["Sommer",6,8],["Herbst",9,11],["Winter",12,2]];
  var ci=m<=2?3:m<=5?0:m<=8?1:m<=11?2:3;
  for(var i=0;i<5;i++){
    var si=(ci+i)%4;
    var sY=y+Math.floor((ci+i)/4);
    var sn=ss[si][0];
    var key=sn.toLowerCase().replace(/ü/g,"ue")+"-"+sY;
    out.push([key,sn+" "+sY]);
  }
  out.push(["flexibel","Flexibel / nach Absprache"]);
  return out;
}

// -- Plausibilitaetscheck Pflanzdichte (WP-05) --
function checkPflanzdichte(anzahl, ha){
  if(!anzahl || !ha || ha<=0) return null;
  var pHa = anzahl / ha;
  if(pHa > 8000) return {warn:true, msg:"⚠️ Sehr hohe Pflanzdichte ("+Math.round(pHa).toLocaleString("de-DE")+"/ha). Normal: 2.000–5.000/ha. Bitte Eingabe pruefen."};
  if(pHa < 500) return {warn:true, msg:"⚠️ Sehr geringe Pflanzdichte ("+Math.round(pHa).toLocaleString("de-DE")+"/ha). Normal: 2.000–5.000/ha. Bitte Eingabe pruefen."};
  return {warn:false, msg:"✅ Pflanzdichte: "+Math.round(pHa).toLocaleString("de-DE")+"/ha (im Normalbereich)"};
}


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

var SOILS = [
  {k:'sandig',   ico:'🏖️', name:'Sandig'},
  {k:'lehmig',   ico:'🔶', name:'Lehmig'},
  {k:'tonig',    ico:'💧', name:'Tonig'},
  {k:'steinig',  ico:'⛰️', name:'Steinig'},
  {k:'torfig',   ico:'🌿', name:'Torfig'},
  {k:'unbekannt',ico:'❓', name:'Unbekannt'},
];

var COLORS = ['#012d1d','#8B5E3C','#3A5A6A','#6B5C2F','#7B3F2A','#4B6343','#5B4E1E','#4A5E2A','#655525'];
function col(i){ var c=COLORS[i%COLORS.length]; return {bg:c+'22',bd:c+'55',tx:c}; }

// ── Waldbesitzertypen (Schritt -1) ────────────────────────────────────────────────────────────────────
var BESITZERTYPEN = [
  {k:'privatperson',         name:'Privatperson'},
  {k:'personengesellschaft', name:'Personengesellschaft'},
  {k:'koerperschaft',        name:'Körperschaft d. öffentl. Rechts'},
  {k:'kommunal',             name:'Kommunal / Staatlich'}
];


// ── FoVG Herkunftsgebiete (Forstvermehrungsgutgesetz 2002, BLE-Liste) ──────────
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


// ── HKG-Bezeichnungen (aus DB: fovg_herkuenfte) ─────────────────────────────
var HKG_BEZEICHNUNGEN = {
  '800 01': 'Norddeutsches Tiefland',
  '800 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '800 03': 'Südostdeutsches Hügel- und Bergland',
  '800 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '801 01': 'Norddeutsches Tiefland',
  '801 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '801 03': 'Westdeutsches Bergland, kolline Stufe',
  '801 04': 'Westdeutsches Bergland, montane Stufe',
  '801 05': 'Oberrheingraben',
  '801 06': 'Südostdeutsches Hügel- und Bergland, kolline Stufe',
  '801 07': 'Südostdeutsches Hügel- und Bergland, montane Stufe',
  '801 08': 'Süddeutsches Hügel- und Bergland, kolline Stufe',
  '801 09': 'Süddeutsches Hügel- und Bergland, montane Stufe',
  '801 10': 'Alpen und Alpenvorland, submontane Stufe',
  '801 11': 'Alpen und Alpenvorland, hochmontane Stufe',
  '802 01': 'Nordwestdeutsches Tiefland',
  '802 02': 'Nordostdeutsches Tiefland',
  '802 03': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '802 04': 'Westdeutsches Bergland',
  '802 05': 'Oberrheingraben',
  '802 06': 'Südostdeutsches Hügel- und Bergland',
  '802 07': 'Süddeutsches Hügel- und Bergland',
  '802 08': 'Alpen und Alpenvorland',
  '803 01': 'Bundesgebiet nördlich der Donau',
  '803 02': 'Alpen und Alpenvorland südlich der Donau',
  '804 01': 'Norddeutsches Tiefland',
  '804 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '804 03': 'Südostdeutsches Hügel- und Bergland',
  '804 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '805 01': 'Norddeutsches Tiefland',
  '805 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '805 03': 'Südostdeutsches Hügel- und Bergland',
  '805 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '806 01': 'Norddeutsches Tiefland',
  '806 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '806 03': 'Südostdeutsches Hügel- und Bergland',
  '806 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '808 01': 'Norddeutsches Tiefland',
  '808 02': 'Übriges Bundesgebiet',
  '810 01': 'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht',
  '810 02': 'Ostsee-Küstenraum',
  '810 03': 'Heide und Altmark',
  '810 04': 'Nordostbrandenburgisches Tiefland',
  '810 05': 'Märkisch-Lausitzer Tiefland',
  '810 06': 'Mitteldeutsches Tief- und Hügelland',
  '810 07': 'Rheinisches und Saarpfälzer Bergland, kolline Stufe',
  '810 08': 'Rheinisches und Saarpfälzer Bergland, montane Stufe',
  '810 09': 'Harz, Weser- und Hessisches Bergland, kolline Stufe',
  '810 10': 'Harz, Weser- und Hessisches Bergland, montane Stufe',
  '810 11': 'Thüringer Wald, Fichtelgebirge und Vogtland, kolline Stufe',
  '810 12': 'Thüringer Wald, Fichtelgebirge und Vogtland, montane Stufe',
  '810 13': 'Erzgebirge mit Vorland, kolline Stufe',
  '810 14': 'Erzgebirge mit Vorland, montane Stufe',
  '810 15': 'Erzgebirge mit Vorland, hochmontane Stufe',
  '810 16': 'Oberrheingraben',
  '810 17': 'Württembergisch-Fränkisches Hügelland',
  '810 18': 'Fränkische Alb',
  '810 19': 'Bayerischer und Oberpfälzer Wald, submontane Stufe',
  '810 20': 'Bayerischer und Oberpfälzer Wald, montane Stufe',
  '810 21': 'Schwarzwald, submontane Stufe',
  '810 22': 'Schwarzwald, hochmontane Stufe',
  '810 23': 'Schwäbische Alb',
  '810 24': 'Alpenvorland',
  '810 25': 'Alpen, submontane Stufe',
  '810 26': 'Alpen, hochmontane Stufe',
  '811 01': 'Nordwestdeutsches Tiefland',
  '811 02': 'Nordostdeutsches Tiefland',
  '811 03': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '811 04': 'Westdeutsches Bergland',
  '811 05': 'Oberrheingraben',
  '811 06': 'Südostdeutsches Hügel- und Bergland',
  '811 07': 'Süddeutsches Hügel- und Bergland',
  '811 08': 'Alpen und Alpenvorland',
  '814 01': 'Norddeutsches Tiefland',
  '814 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '814 03': 'Südostdeutsches Hügel- und Bergland',
  '814 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '816 01': 'Norddeutsches Tiefland',
  '816 02': 'Übriges Bundesgebiet',
  '817 01': 'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht',
  '817 02': 'Ostsee-Küstenraum',
  '817 03': 'Heide und Altmark',
  '817 04': 'Ostdeutsches Tiefland',
  '817 05': 'Mitteldeutsches Tief- und Hügelland',
  '817 06': 'Westdeutsches Bergland',
  '817 07': 'Oberrheingraben',
  '817 08': 'Südostdeutsches Hügel- und Bergland',
  '817 09': 'Süddeutsches Hügel- und Bergland sowie Alpen',
  '818 01': 'Niedersächsischer Küstenraum und Rheinisch-Westfälische Bucht',
  '818 02': 'Ostsee-Küstenraum',
  '818 03': 'Heide und Altmark',
  '818 04': 'Ostdeutsches Tiefland',
  '818 05': 'Mitteldeutsches Tief- und Hügelland',
  '818 06': 'Rheinisches und Saarbergland',
  '818 07': 'Harz, Weser- und Hessisches Bergland außer Spessart',
  '818 08': 'Pfälzerwald',
  '818 09': 'Oberrheingraben',
  '818 10': 'Spessart',
  '818 11': 'Fränkisches Hügelland',
  '818 12': 'Südostdeutsches Hügel- und Bergland',
  '818 13': 'Süddeutsches Mittelgebirgsland sowie Alpen',
  '819 01': 'Norddeutsches Tiefland',
  '819 02': 'Übriges Bundesgebiet',
  '823 01': 'Nordwestdeutsches Tiefland',
  '823 02': 'Nordostdeutsches Tiefland',
  '823 03': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '823 04': 'Westdeutsches Bergland',
  '823 05': 'Oberrheingraben',
  '823 06': 'Südostdeutsches Hügel- und Bergland',
  '823 07': 'Süddeutsches Hügel- und Bergland',
  '823 08': 'Alpen und Alpenvorland',
  '824 01': 'Norddeutsches Tiefland',
  '824 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '824 03': 'Südostdeutsches Hügel- und Bergland',
  '824 04': 'West- und Süddeutsches Bergland sowie Alpen und Alpenvorland',
  '827 01': 'Nordsee-Küstenraum und Rheinisch-Westfälische Bucht',
  '827 02': 'Nordostdeutsches Tiefland und Niedersächsisches Binnenland',
  '827 03': 'Mittel- und Ostdeutsches Tief- und Hügelland außer Niederlausitz',
  '827 04': 'Niederlausitz',
  '827 05': 'Westdeutsches Bergland und Oberrheingraben',
  '827 06': 'Thüringisch-Sächsisch-Nordostbayerische Mittelgebirge',
  '827 07': 'Bayerischer und Oberpfälzer Wald',
  '827 08': 'Schwarzwald und Albtrauf',
  '827 09': 'Schwäbisch-Fränkischer Wald',
  '827 10': 'Übriges Süddeutschland',
  '827 11': 'Alpen und Alpenvorland, submontane Stufe',
  '827 12': 'Alpen und Alpenvorland, hochmontane Stufe',
  '830 01': 'Norddeutsches Tiefland',
  '830 02': 'Übriges Bundesgebiet',
  '837 01': 'Norddeutsches Tiefland',
  '837 02': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '837 03': 'West- und Süddeutsches Hügel- und Bergland',
  '837 04': 'Südostdeutsches Hügel- und Bergland',
  '837 05': 'Alpen, submontane Stufe',
  '837 06': 'Alpen, montane Stufe',
  '837 07': 'Alpen, subalpine Stufe',
  '839 01': 'Norddeutsches Tiefland',
  '839 02': 'Übriges Bundesgebiet',
  '840 01': 'Norddeutsches Tiefland',
  '840 02': 'Mittel- und Ostdeutsches Tiefland außer Niederlausitz',
  '840 03': 'Niederlausitz',
  '840 04': 'Rheinisches und Saarpfälzer Bergland sowie Oberrheingraben, kolline Stufe',
  '840 05': 'Rheinisches und Saarpfälzer Bergland sowie Oberrheingraben, montane Stufe',
  '840 06': 'Weser- und Hessisches Bergland, kolline Stufe',
  '840 07': 'Weser- und Hessisches Bergland, montane Stufe',
  '840 08': 'Harz, kolline Stufe',
  '840 09': 'Harz, montane Stufe',
  '840 10': 'Harz, hochmontane Stufe',
  '840 11': 'Thüringer Wald und Frankenwald, kolline Stufe',
  '840 12': 'Thüringer Wald und Frankenwald, montane Stufe',
  '840 13': 'Vogtland und Ostthüringisches Hügelland',
  '840 14': 'Sächsisches Bergland, kolline Stufe',
  '840 15': 'Sächsisches Bergland, montane Stufe',
  '840 16': 'Sächsisches Bergland, hochmontane Stufe',
  '840 17': 'Neckarland und Fränkisches Hügelland',
  '840 18': 'Fichtelgebirge und Oberpfälzer Wald, submontane Stufe',
  '840 19': 'Fichtelgebirge und Oberpfälzer Wald, montane Stufe',
  '840 20': 'Bayerischer Wald, submontane Stufe',
  '840 21': 'Bayerischer Wald, montane Stufe',
  '840 22': 'Bayerischer Wald, hochmontane Stufe',
  '840 23': 'Schwarzwald, submontane Stufe',
  '840 24': 'Schwarzwald, hochmontane Stufe',
  '840 25': 'Schwäbisch-Fränkischer Wald',
  '840 26': 'Alb',
  '840 27': 'Alpenvorland',
  '840 28': 'Alpen, submontane Stufe',
  '840 29': 'Alpen, montane Stufe',
  '840 30': 'Alpen, subalpine Stufe',
  '844 01': 'Norddeutsches Tiefland',
  '844 02': 'Übriges Bundesgebiet',
  '847 01': 'Var. austriaca - Norddeutsches Tiefland',
  '847 02': 'Var. austriaca - Übriges Bundesgebiet',
  '848 01': 'Var. calabrica - Norddeutsches Tiefland',
  '848 02': 'Var. calabrica - Übriges Bundesgebiet',
  '849 01': 'Var. corsicana - Norddeutsches Tiefland',
  '849 02': 'Var. corsicana - Übriges Bundesgebiet',
  '850 01': 'Übriges Bundesgebiet',
  '851 01': 'Nordsee-Küstenraum und Rheinisch-Westfälische Bucht',
  '851 02': 'Mecklenburg',
  '851 03': 'Heide und Altmark',
  '851 04': 'Mittel- und Ostdeutsches Tiefland',
  '851 05': 'Westdeutsches Bergland, kolline Stufe',
  '851 06': 'Westdeutsches Bergland, montane Stufe',
  '851 07': 'Vogtland, Thüringer Wald und Frankenwald, kolline Stufe',
  '851 08': 'Vogtland, Thüringer Wald und Frankenwald, montane Stufe',
  '851 09': 'Thüringisch-Sächsisches Hügelland',
  '851 10': 'Erzgebirge, kolline Stufe',
  '851 11': 'Erzgebirge, montane Stufe',
  '851 12': 'Oberes Vogtland und Nordostbayerische Mittelgebirge',
  '851 13': 'Oberrheingraben',
  '851 14': 'Neckarland und Fränkische Platte',
  '851 15': 'Mittelfränkisches Hügelland',
  '851 16': 'Alb',
  '851 17': 'Ostbayerische Mittelgebirge, kolline Stufe',
  '851 18': 'Ostbayerische Mittelgebirge, montane Stufe',
  '851 19': 'Schwarzwald, kolline Stufe',
  '851 20': 'Schwarzwald, montane Stufe',
  '851 21': 'Alpenvorland',
  '851 22': 'Alpen, submontane Stufe',
  '851 23': 'Alpen, hochmontane Stufe',
  '853 01': 'Nordwestdeutsches Tiefland mit Schleswig-Holstein',
  '853 02': 'Nordostdeutsches Tiefland außer Schleswig-Holstein',
  '853 03': 'Mittel- und Ostdeutsches Tief- und Hügelland',
  '853 04': 'West- und Süddeutsches Hügel- und Bergland sowie Alpen, kolline Stufe',
  '853 05': 'West- und Süddeutsches Hügel- und Bergland sowie Alpen, montane Stufe',
  '853 06': 'Südostdeutsches Hügel- und Bergland',
};

function hkgLabel(code) {
  if(!code || code === 'unbekannt' || code === 'n/a') return code || '';
  return HKG_BEZEICHNUNGEN[code] ? code + ' — ' + HKG_BEZEICHNUNGEN[code] : code;
}
// ── Herkunft-Kategorien ────────────────────────────────────────────────────────
var HKG_KAT = [
  {k:'quellengesichert', label:'Q – Quellengesichert'},
  {k:'ausgewaehlt',      label:'A – Ausgewählt (phänotypisch selektiert)'},
  {k:'qualifiziert',     label:'G – Qualifiziert (genetisch geprüft)'},
  {k:'geprueft',         label:'P – Geprüft (Nachkommenschaftsprüfung)'},
];
// ── Lieferanten-Baumschulen (hardcoded Top-20, Darmstädter zuerst) ────────────
var LIEFERANTEN = [
  {k:'darmstaedter', name:'Darmstädter Forstbaumschulen GmbH', ort:'Darmstadt', is_partner:true},
  {k:'abeln',        name:'Abeln, Maria Baumschule',             ort:'Molbergen'},
  {k:'aicher',       name:'Aicher Forstpflanzenbetrieb',          ort:'Halfing'},
  {k:'meile',        name:'Andreas Meile Baumschule',             ort:'Reinholdshai n'},
  {k:'app_rolf',     name:'App, Rolf Baumschule',                 ort:'Unlingen'},
  {k:'appen',        name:'Appen, Hermann von Baumschule',        ort:'Soderstorf'},
  {k:'arenberg',     name:'Arenberg-Meppen GmbH',                ort:'Meppen'},
  {k:'luedemann_ell',name:'August Lüdemann FLS Zweigbetrieb GmbH Ellerhoop', ort:'Ellerhoop'},
  {k:'luedemann_ffm',name:'August Lüdemann Forst- und Landschaftsservice GmbH', ort:'Frankfurt'},
  {k:'aumann',       name:'Aumann Garten & Wohnen GmbH',         ort:'Cloppenburg'},
  {k:'bbc',          name:'BBC Baumschulen Berlin GmbH',          ort:'Berlin'},
  {k:'barnimer',     name:'Barnimer Baumschulen Biesenthal',      ort:'Biesenthal'},
  {k:'oswald',       name:'Baum- und Rosenschulen Oswald Müller', ort:'Wiedemar'},
  {k:'appel',        name:'Baumschule Appel GmbH',                ort:'Waldsieversdorf'},
  {k:'arbores',      name:'Baumschule Arbores Mundi',             ort:'Hohenthann'},
  {k:'hamm',         name:'Baumschule Hamm',                      ort:'Eslohe'},
  {k:'holzmann',     name:'Baumschule Holzmann',                  ort:'Tacherting'},
  {k:'vogel',        name:'Baumschule Jörg Vogel',                ort:'Stützengrün'},
  {k:'koehler',      name:'Baumschule Karl Köhler GmbH',          ort:'Leipzig'},
  {k:'hofmeier',     name:'Baumschule Hofmeier (Forstbaumschule)',ort:'Wolnzach'},
];

// ── Darmstädter Angebote 2025 — mit beiden Preisen + HKG-Codes ────────────────
// preis_fovg: FoVG-Preis, preis_ffv: inkl. FfV/ZüF — Preise per 100 Stk.
var DARMST_ANGEBOTE = {
  Baumhasel: [
    {q:'1+0', h:'30-50 cm', fovg:2200, ffv:2340, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:2680, ffv:2820, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:3850, ffv:4130, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'50-80 (autochthon) cm', fovg:4800, ffv:5160, hkg:'autochthon'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:5850, ffv:6270, hkg:'autochthon'},
  ],
  Berberitze: [
    {q:'1+1', h:'30-50 cm', fovg:258, ffv:335, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:302, ffv:395, hkg:'Süddeutschland'},
  ],
  'Berberitze I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:459, ffv:600, hkg:'Süddeutschland'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:510, ffv:655, hkg:'Süddeutschland'},
  ],
  bergahorn: [
    {q:'1+0', h:'15-30 cm', fovg:464, ffv:520, hkg:'801 03'},
    {q:'1+0', h:'30-50 cm', fovg:580, ffv:650, hkg:'801 03'},
    {q:'1+0', h:'50-80 cm', fovg:770, ffv:860, hkg:'801 03'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:1240, ffv:1380, hkg:'801 04'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1540, ffv:1720, hkg:'801 04'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:1910, ffv:2120, hkg:'801 04'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:2360, ffv:2610, hkg:'801 05'},
  ],
  Bergulme: [
    {q:'1+1', h:'30-50 cm', fovg:2440, ffv:2860, hkg:'unbekannt'},
    {q:'1+1', h:'50-80 cm', fovg:2940, ffv:3440, hkg:'unbekannt'},
  ],
  Besenginster: [
    {q:'1+0P', h:'15-30 cm', fovg:640, ffv:850, hkg:'Oberrhein'},
    {q:'1+0P', h:'30-50 cm', fovg:780, ffv:1060, hkg:'Oberrhein'},
  ],
  Bibernellrose: [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:0, hkg:'Süddeutschland'},
  ],
  'Bibernellrose I.Str.': [
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:406, ffv:0, hkg:'Süddeutschland'},
  ],
  Bitternuss: [
    {q:'1+0', h:'15-30 cm', fovg:1750, ffv:0, hkg:'unbekannt'},
  ],
  Blasenstrauch: [
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:344, ffv:0, hkg:'Süddeutschland'},
  ],
  'Blasenstrauch I.Str.': [
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:510, ffv:0, hkg:'Süddeutschland'},
  ],
  'Blaue Hechtrose': [
    {q:'1+1', h:'30-50 cm', fovg:258, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:302, ffv:0, hkg:'Süddeutschland'},
  ],
  'Blaue Hechtrose I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:459, ffv:0, hkg:'Süddeutschland'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:510, ffv:0, hkg:'Süddeutschland'},
  ],
  Blaufichte: [
    {q:'2+0', h:'7-15 cm', fovg:240, ffv:0, hkg:'Apache/Kaibab'},
    {q:'2+1', h:'15-30 cm', fovg:790, ffv:0, hkg:'Apache/Kaibab'},
    {q:'2+2', h:'20-40 cm', fovg:930, ffv:0, hkg:'Apache/Kaibab'},
    {q:'2+2', h:'25-50 cm', fovg:1160, ffv:0, hkg:'Apache/Kaibab'},
    {q:'2+2', h:'30-60 cm', fovg:1420, ffv:0, hkg:'Apache/Kaibab'},
  ],
  'Blaufichte Pot': [
    {q:'2+1P', h:'12-25 cm', fovg:3900, ffv:0, hkg:'Apache/Kaibab'},
  ],
  Coloradotanne: [
    {q:'2+0', h:'–', fovg:1070, ffv:0, hkg:'var. glauca'},
    {q:'2+1', h:'–', fovg:2200, ffv:0, hkg:'var. glauca'},
    {q:'2+2', h:'–', fovg:2940, ffv:0, hkg:'var. glauca'},
  ],
  douglasie: [
    {q:'2+0', h:'20-40 cm', fovg:760, ffv:830, hkg:'853 01'},
    {q:'1+1/2+1', h:'20-45 cm', fovg:1380, ffv:1540, hkg:'853 04'},
    {q:'1+2/2+2', h:'30-60 cm', fovg:1500, ffv:1670, hkg:'853 05'},
    {q:'1+2/2+2', h:'40-70 cm', fovg:1620, ffv:1810, hkg:'853 05'},
    {q:'1+2/2+2', h:'50-80 cm', fovg:1720, ffv:1910, hkg:'853 05'},
    {q:'1+2/2+2', h:'80-100 cm', fovg:1920, ffv:2120, hkg:'853 05'},
    {q:'1+1', h:'30-50 cm', fovg:2760, ffv:2920, hkg:'853 54'},
  ],
  Eberesche: [
    {q:'1+0', h:'15-30 cm', fovg:610, ffv:810, hkg:'VkG 4'},
    {q:'1+0', h:'30-50 cm', fovg:790, ffv:1040, hkg:'VkG 4'},
    {q:'1+0', h:'50-80 cm', fovg:1010, ffv:1320, hkg:'VkG 4'},
    {q:'1+1', h:'30-50 cm', fovg:2260, ffv:2940, hkg:'VkG 4'},
    {q:'1+2', h:'50-80 cm', fovg:2720, ffv:3550, hkg:'VkG 4'},
    {q:'1+2', h:'80-120 cm', fovg:3180, ffv:4200, hkg:'VkG 4'},
    {q:'1+2', h:'120-150 cm', fovg:3840, ffv:4980, hkg:'VkG 4'},
  ],
  Edelkastanie: [
    {q:'1+0/2+0', h:'15-30 cm', fovg:1350, ffv:1400, hkg:'808 02'},
    {q:'1+0/2+0', h:'30-50 cm', fovg:1600, ffv:1620, hkg:'808 02'},
    {q:'50-80', h:'50-80 cm', fovg:1980, ffv:2200, hkg:'808 02'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:2120, ffv:2360, hkg:'EFA Annweiler'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:2550, ffv:2840, hkg:'EFA Annweiler'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:3600, ffv:4080, hkg:'EFA Annweiler'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:3840, ffv:4320, hkg:'EFA Annweiler'},
  ],
  Edeltanne: [
    {q:'2+0', h:'–', fovg:1110, ffv:0, hkg:'unbekannt'},
    {q:'2+1', h:'–', fovg:2260, ffv:0, hkg:'unbekannt'},
    {q:'2+2#', h:'–', fovg:3020, ffv:0, hkg:'unbekannt'},
  ],
  'Edeltanne QP24': [
    {q:'2+1', h:'–', fovg:3650, ffv:0, hkg:'unbekannt'},
  ],
  Eibe: [
    {q:'2+0', h:'–', fovg:990, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'18-24 cm', fovg:3950, ffv:0, hkg:'unbekannt'},
  ],
  'Eibe Pot': [
    {q:'2+1P', h:'8-12 cm', fovg:6200, ffv:0, hkg:'unbekannt'},
    {q:'2+2P', h:'12-18 cm', fovg:6800, ffv:0, hkg:'unbekannt'},
  ],
  Elsbeere: [
    {q:'1+0', h:'15-30 cm', fovg:1870, ffv:2260, hkg:'VkG 4'},
    {q:'1+0', h:'30-50 cm', fovg:2330, ffv:2580, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:5700, ffv:7000, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:7000, ffv:8500, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:8000, ffv:10000, hkg:'VkG 4'},
  ],
  'Elsbeere Pot': [
    {q:'1+1 P', h:'30-50 cm', fovg:10000, ffv:12100, hkg:'VkG 4'},
    {q:'1+2 P', h:'50-80 cm', fovg:11800, ffv:14500, hkg:'VkG 4'},
  ],
  laerche: [
    {q:'1+0', h:'15-30 cm', fovg:392, ffv:440, hkg:'837 03'},
    {q:'1+1', h:'30-50 cm', fovg:1040, ffv:1170, hkg:'837 03'},
    {q:'1+2', h:'50-80 cm', fovg:1300, ffv:1460, hkg:'837 03'},
    {q:'1+2', h:'80-120 cm', fovg:1460, ffv:1620, hkg:'837 03'},
  ],
  Faulbaum: [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:318, ffv:420, hkg:'Süddeutschland'},
  ],
  Feldahorn: [
    {q:'1+0', h:'30-50 cm', fovg:790, ffv:1004, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:2260, ffv:2940, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:2720, ffv:3550, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:3180, ffv:4200, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:3640, ffv:4760, hkg:'VkG 4'},
  ],
  Feldulme: [
    {q:'1+0', h:'15-30 cm', fovg:770, ffv:910, hkg:'unbekannt'},
    {q:'1+0', h:'30-50 cm', fovg:990, ffv:1160, hkg:'unbekannt'},
  ],
  'Felsenbirne (kanadisch)': [
    {q:'1+1', h:'30-50 cm', fovg:258, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:302, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:354, ffv:0, hkg:'Süddeutschland'},
  ],
  'Felsenbirne I.Str.': [
    {q:'I.Str. 2-3 Tr.', h:'40-70 cm', fovg:459, ffv:0, hkg:'Süddeutschland'},
    {q:'I.Str. 2-3 Tr.', h:'70-90 cm', fovg:510, ffv:0, hkg:'Süddeutschland'},
  ],
  Felsenmispel: [
    {q:'1+2', h:'50-80 cm', fovg:318, ffv:0, hkg:'Süddeutschland'},
  ],
  'Felsenmispel I.Str.': [
    {q:'I.Str. 2-3 Tr.', h:'40-70 cm', fovg:570, ffv:0, hkg:'Süddeutschland'},
    {q:'I.Str. 2-3 Tr.', h:'70-90 cm', fovg:635, ffv:0, hkg:'Süddeutschland'},
  ],
  Flatterulme: [
    {q:'1+2', h:'80-120 cm', fovg:3440, ffv:4050, hkg:'unbekannt'},
    {q:'1+2', h:'120-150 cm', fovg:4200, ffv:5100, hkg:'unbekannt'},
    {q:'1+2', h:'150-180 cm', fovg:5250, ffv:6200, hkg:'unbekannt'},
  ],
  'Gem. Heckenkirsche': [
    {q:'1+0', h:'30-50 cm', fovg:79, ffv:81, hkg:'Süddeutschland'},
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
    {q:'1+2', h:'80-120 cm', fovg:318, ffv:420, hkg:'Süddeutschland'},
  ],
  'Gem. Heckenkirsche I.Str.': [
    {q:'I.Str. 3 Tr.', h:'70-90 cm', fovg:368, ffv:471, hkg:'Süddeutschland'},
  ],
  'Gemeiner Hartriegel': [
    {q:'1+1/1+2', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:318, ffv:420, hkg:'Süddeutschland'},
  ],
  'Gemeiner Hartriegel I.Str.': [
    {q:'I.Str. 3 Tr.', h:'70-90 cm', fovg:368, ffv:471, hkg:'Süddeutschland'},
  ],
  'Gemeiner Schneeball': [
    {q:'1+1', h:'30-50 cm', fovg:258, ffv:335, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:302, ffv:395, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:362, ffv:495, hkg:'Süddeutschland'},
  ],
  'Gemeiner Schneeball l.Str.': [
    {q:'l.Str. 3 Tr.', h:'40-70 cm', fovg:396, ffv:510, hkg:'Süddeutschland'},
    {q:'l.Str. 3 Tr.', h:'70-90 cm', fovg:437, ffv:570, hkg:'Süddeutschland'},
  ],
  'Große Küstentanne': [
    {q:'2+0#', h:'–', fovg:635, ffv:710, hkg:'83002'},
    {q:'2+1', h:'–', fovg:1380, ffv:1540, hkg:'83002'},
    {q:'2+2#', h:'–', fovg:1720, ffv:1910, hkg:'83002'},
  ],
  'Große Küstentanne QP24': [
    {q:'2+1', h:'–', fovg:3950, ffv:4500, hkg:'83002'},
  ],
  hainbuche: [
    {q:'1+0', h:'15-30 cm', fovg:440, ffv:488, hkg:'806 01'},
    {q:'1+0', h:'30-50 cm', fovg:510, ffv:690, hkg:'806 01'},
    {q:'2+0#', h:'30-50 cm', fovg:980, ffv:1110, hkg:'806 01'},
    {q:'2+0#', h:'50-80 cm', fovg:1300, ffv:1460, hkg:'806 01'},
    {q:'2+0#', h:'80-120 cm', fovg:1670, ffv:1860, hkg:'806 01'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1760, ffv:1960, hkg:'806 01'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:2120, ffv:2360, hkg:'806 01'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:2680, ffv:3000, hkg:'806 04'},
    {q:'2+2', h:'150-180 cm', fovg:3000, ffv:3360, hkg:'806 01'},
  ],
  haselnuss: [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:318, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:385, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:344, ffv:465, hkg:'Süddeutschland'},
    {q:'I.Str. 3 Tr.', h:'40-70 cm', fovg:459, ffv:600, hkg:'Süddeutschland'},
    {q:'I.Str. 3 Tr.', h:'70-90 cm', fovg:510, ffv:655, hkg:'Süddeutschland'},
  ],
  Hemlocktanne: [
    {q:'2+1', h:'–', fovg:2580, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'20-30 cm', fovg:3440, ffv:0, hkg:'unbekannt'},
  ],
  Hirschholunder: [
    {q:'1+1', h:'30-50 cm', fovg:318, ffv:465, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:385, ffv:570, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:465, ffv:680, hkg:'Süddeutschland'},
  ],
  Hundsrose: [
    {q:'1+0', h:'30-50 cm', fovg:99, ffv:130, hkg:'Süddeutschland'},
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:318, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:385, hkg:'Süddeutschland'},
  ],
  'Hundsrose I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:368, ffv:471, hkg:'Süddeutschland'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:406, ffv:525, hkg:'Süddeutschland'},
  ],
  Hybridlärche: [
    {q:'1+1', h:'30-50 cm', fovg:1620, ffv:1810, hkg:'div. SP'},
    {q:'1+1', h:'50-80 cm', fovg:1720, ffv:1910, hkg:'div. SP'},
  ],
  Kartoffelrose: [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:0, hkg:'Japan'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:0, hkg:'Japan'},
  ],
  'Kartoffelrose I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:368, ffv:0, hkg:'Japan'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:406, ffv:0, hkg:'Japan'},
  ],
  Kornelkirsche: [
    {q:'1+1/1+2', h:'30-50 cm', fovg:258, ffv:405, hkg:'Südwestdeutschland'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:302, ffv:495, hkg:'Südwestdeutschland'},
  ],
  'Kornelkirsche I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:570, ffv:735, hkg:'Südwestdeutschland'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:635, ffv:815, hkg:'Südwestdeutschland'},
  ],
  Kreuzdorn: [
    {q:'1+1/1+2', h:'30-50 cm', fovg:244, ffv:318, hkg:'Süddeutschland'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:294, ffv:385, hkg:'Süddeutschland'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:344, ffv:465, hkg:'Süddeutschland'},
  ],
  'Kreuzdorn I.Str.': [
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:437, ffv:585, hkg:'Süddeutschland'},
  ],
  'Liguster (Steckholz)': [
    {q:'1j. Steckholz', h:'15-30 cm', fovg:208, ffv:272, hkg:'Süddeutschland'},
    {q:'1j. Steckholz', h:'30-50 cm', fovg:344, ffv:318, hkg:'Süddeutschland'},
  ],
  'Liguster l.Str.': [
    {q:'l.Str. 3 Tr.', h:'30-50 cm', fovg:309, ffv:333, hkg:'Süddeutschland'},
    {q:'l.Str. 3 Tr.', h:'50-80 cm', fovg:377, ffv:406, hkg:'Süddeutschland'},
  ],
  'Liguster l.Str. 5 Tr.': [
    {q:'l.Str. 5 Tr.', h:'50-80 cm', fovg:459, ffv:494, hkg:'Süddeutschland'},
  ],
  Maulbeerbaum: [
    {q:'1+1', h:'30-50 cm', fovg:286, ffv:0, hkg:'unbekannt'},
    {q:'1+1', h:'50-80 cm', fovg:344, ffv:0, hkg:'unbekannt'},
  ],
  Mehlbeere: [
    {q:'1+0', h:'7-15 cm', fovg:770, ffv:1040, hkg:'unbekannt'},
    {q:'1+0', h:'15-30 cm', fovg:990, ffv:1300, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:2580, ffv:3360, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:3020, ffv:3930, hkg:'unbekannt'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:3650, ffv:4780, hkg:'unbekannt'},
  ],
  Nordmannstanne: [
    {q:'2+0', h:'–', fovg:730, ffv:0, hkg:'Ambrolauri/Borshomi'},
    {q:'2+1', h:'8-15 cm', fovg:1240, ffv:0, hkg:'Ambrolauri/Borshomi'},
    {q:'2+2', h:'15-25 cm', fovg:1670, ffv:0, hkg:'Ambrolauri/Borshomi'},
  ],
  'Nordmannstanne QP24': [
    {q:'2+1', h:'12-18 cm', fovg:3850, ffv:0, hkg:'Ambrolauri/Borshomi'},
  ],
  Orientbuche: [
    {q:'1+0', h:'15-30 cm', fovg:650, ffv:0, hkg:'unbekannt'},
    {q:'2+0', h:'30-50 cm', fovg:995, ffv:0, hkg:'unbekannt'},
    {q:'1+1', h:'30-50 cm', fovg:1300, ffv:0, hkg:'unbekannt'},
    {q:'1+2', h:'50-80 cm', fovg:2600, ffv:0, hkg:'unbekannt'},
  ],
  Pfaffenhütchen: [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
  ],
  'Pfaffenhütchen I.Str.': [
    {q:'I.Str. 2 Tr.', h:'40-70 cm', fovg:459, ffv:585, hkg:'Süddeutschland'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:510, ffv:645, hkg:'Süddeutschland'},
  ],
  Riesenlebensbaum: [
    {q:'2+1/2+2', h:'15-30 cm', fovg:960, ffv:0, hkg:'unbekannt'},
    {q:'2+1/2+2', h:'20-35 cm', fovg:1160, ffv:0, hkg:'unbekannt'},
    {q:'2+1/2+2', h:'25-50 cm', fovg:1500, ffv:0, hkg:'unbekannt'},
  ],
  'Riesenlebensbaum QP24': [
    {q:'2+1', h:'–', fovg:3980, ffv:0, hkg:'unbekannt'},
  ],
  Robinie: [
    {q:'1+0', h:'30-50 cm', fovg:770, ffv:860, hkg:'819 02'},
    {q:'1+0', h:'50-80 cm', fovg:960, ffv:1070, hkg:'819 02'},
    {q:'1+1', h:'50-80 cm', fovg:1870, ffv:2080, hkg:'819 02'},
    {q:'1+1', h:'80-120 cm', fovg:2510, ffv:2790, hkg:'819 02'},
    {q:'1+1', h:'120-150 cm', fovg:2790, ffv:3100, hkg:'819 02'},
  ],
  Rosskastanie: [
    {q:'2+0', h:'15-30 cm', fovg:1500, ffv:0, hkg:'unbekannt'},
    {q:'1+2', h:'30-50 cm', fovg:2650, ffv:0, hkg:'unbekannt'},
    {q:'1+2', h:'50-80 cm', fovg:3180, ffv:0, hkg:'unbekannt'},
    {q:'1+2', h:'80-120 cm', fovg:3750, ffv:0, hkg:'unbekannt'},
  ],
  rotbuche: [
    {q:'1+0', h:'15-30 cm', fovg:488, ffv:555, hkg:'810 01'},
    {q:'1+0', h:'30-50 cm', fovg:770, ffv:860, hkg:'810 01'},
    {q:'2+0#', h:'30-50 cm', fovg:1080, ffv:1200, hkg:'810 01'},
    {q:'3+0#', h:'50-80 cm', fovg:1500, ffv:1670, hkg:'810 01'},
    {q:'3+0#', h:'80-120 cm', fovg:1860, ffv:2070, hkg:'810 01'},
    {q:'1+2', h:'30-50 cm', fovg:1380, ffv:1540, hkg:'810 01'},
    {q:'1+2', h:'50-80 cm', fovg:1720, ffv:1910, hkg:'810 01'},
    {q:'1+2', h:'80-120 cm', fovg:2070, ffv:2290, hkg:'810 01'},
    {q:'1+3', h:'120-150 cm', fovg:2920, ffv:3240, hkg:'810 01'},
  ],
  Rotfichte: [
    {q:'2+1/2+2', h:'20-40 cm', fovg:555, ffv:630, hkg:'840 04'},
    {q:'2+1/2+2', h:'35-60 cm', fovg:675, ffv:760, hkg:'840 04'},
    {q:'2+1/2+2', h:'45-70 cm', fovg:810, ffv:900, hkg:'840 04'},
    {q:'2+1/2+2', h:'70-90 cm', fovg:1200, ffv:1340, hkg:'840 04'},
    {q:'2+1/2+2', h:'80-100 cm', fovg:1460, ffv:1620, hkg:'840 06'},
  ],
  'Rotfichte QP1+1': [
    {q:'1+1', h:'30-50 cm', fovg:2650, ffv:2960, hkg:'840 04'},
  ],
  'Rotfichte QP24': [
    {q:'2+1', h:'–', fovg:3980, ffv:0, hkg:'840 17'},
  ],
  'Salweide (Bienenweide)': [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:318, ffv:0, hkg:'Süddeutschland'},
  ],
  'Sandbirke / Moorbirke': [
    {q:'1+0', h:'30-50 cm', fovg:505, ffv:570, hkg:'804 04'},
    {q:'1+0', h:'50-80 cm', fovg:690, ffv:800, hkg:'804 04'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:955, ffv:1080, hkg:'804 04'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1240, ffv:1380, hkg:'804 04'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:1540, ffv:1720, hkg:'804 04'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:1860, ffv:2070, hkg:'804 04'},
  ],
  Sanddorn: [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:0, hkg:'VkG 4'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:0, hkg:'VkG 4'},
    {q:'1+1', h:'80-120 cm', fovg:344, ffv:0, hkg:'VkG 4'},
  ],
  'Sanddorn l.Str.': [
    {q:'l.Str. ab 2 Tr.', h:'70-90 cm', fovg:437, ffv:0, hkg:'VkG 4'},
  ],
  Schiffsmastenrobinie: [
    {q:'1+0', h:'30-50 cm', fovg:860, ffv:0, hkg:'unbekannt'},
    {q:'1+0', h:'50-80 cm', fovg:1040, ffv:0, hkg:'unbekannt'},
    {q:'1+0', h:'120-150 cm', fovg:1640, ffv:0, hkg:'unbekannt'},
    {q:'1+1', h:'80-120 cm', fovg:2800, ffv:0, hkg:'unbekannt'},
    {q:'1+1', h:'120-150 cm', fovg:3270, ffv:0, hkg:'unbekannt'},
  ],
  Schlehdorn: [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:295, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:345, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:318, ffv:420, hkg:'Süddeutschland'},
  ],
  'Schlehdorn I.Str.': [
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:406, ffv:525, hkg:'Süddeutschland'},
  ],
  'Schwarzer Holunder': [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:318, hkg:'VkG 5'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:385, hkg:'VkG 5'},
  ],
  'Schwarzer Holunder I.Str.': [
    {q:'I.Str. 2 Tr.', h:'50-80 cm', fovg:459, ffv:510, hkg:'VkG 5'},
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:510, ffv:655, hkg:'VkG 5'},
  ],
  schwarzerle: [
    {q:'1+0', h:'15-30 cm', fovg:364, ffv:404, hkg:'802 04'},
    {q:'1+0', h:'30-50 cm', fovg:505, ffv:570, hkg:'802 04'},
    {q:'1+0', h:'50-80 cm', fovg:690, ffv:800, hkg:'802 04'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:955, ffv:1080, hkg:'802 04'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1240, ffv:1380, hkg:'802 04'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:1540, ffv:1720, hkg:'802 04'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:1860, ffv:2070, hkg:'802 04'},
    {q:'1+1/1+2', h:'150-180 cm', fovg:2180, ffv:2420, hkg:'802 08'},
    {q:'1+1/1+2', h:'180-220 cm', fovg:2420, ffv:2680, hkg:'802 08'},
  ],
  'Schwarzkiefer kalabrisch': [
    {q:'1+0', h:'–', fovg:233, ffv:257, hkg:'848 02'},
    {q:'2+0', h:'–', fovg:452, ffv:505, hkg:'848 02'},
    {q:'1+1', h:'–', fovg:730, ffv:810, hkg:'848 02'},
    {q:'1+2', h:'–', fovg:1040, ffv:1170, hkg:'848 02'},
  ],
  'Schwarzkiefer korsisch': [
    {q:'2+0#', h:'–', fovg:610, ffv:0, hkg:'849 02'},
  ],
  'Schwarzkiefer österr.': [
    {q:'1+0', h:'–', fovg:222, ffv:245, hkg:'847 02'},
    {q:'2+0#', h:'–', fovg:428, ffv:476, hkg:'847 02'},
    {q:'1+1', h:'–', fovg:690, ffv:770, hkg:'847 02'},
    {q:'1+2', h:'–', fovg:980, ffv:1110, hkg:'847 02'},
  ],
  Schwarznuss: [
    {q:'1+0', h:'30-50 cm', fovg:2440, ffv:2580, hkg:'Oberrheingraben'},
    {q:'1+0', h:'50-80 cm', fovg:2780, ffv:2900, hkg:'Oberrheingraben'},
    {q:'1+0', h:'80-120 cm', fovg:3130, ffv:3200, hkg:'Oberrheingraben'},
  ],
  'Schwarznuss DKV': [
    {q:'1+1', h:'50-80 cm', fovg:5250, ffv:5390, hkg:'DKV Rheinauen'},
    {q:'1+1', h:'80-120 cm', fovg:6400, ffv:6560, hkg:'DKV Rheinauen'},
  ],
  'Serbische Fichte': [
    {q:'2+1', h:'15-30 cm', fovg:1340, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'20-40 cm', fovg:1580, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'25-50 cm', fovg:2020, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'30-60 cm', fovg:2380, ffv:0, hkg:'unbekannt'},
  ],
  'Silberweide (Steckholz)': [
    {q:'1j. Steckholz', h:'50-80 cm', fovg:214, ffv:232, hkg:'Süddeutschland'},
    {q:'1j. Steckholz', h:'80-120 cm', fovg:258, ffv:272, hkg:'Süddeutschland'},
    {q:'1j. Steckholz', h:'120-150 cm', fovg:302, ffv:326, hkg:'Süddeutschland'},
  ],
  'Silberweide l.Str.': [
    {q:'l.Str. 2 Tr.', h:'70-90 cm', fovg:368, ffv:368, hkg:'Süddeutschland'},
  ],
  Sommerlinde: [
    {q:'1+0', h:'15-30 cm', fovg:1010, ffv:1140, hkg:'824 02'},
    {q:'1+0', h:'30-50 cm', fovg:1300, ffv:1460, hkg:'824 02'},
    {q:'2+0', h:'30-50 cm', fovg:1500, ffv:1670, hkg:'824 02'},
    {q:'2+0', h:'50-80 cm', fovg:1860, ffv:2070, hkg:'824 02'},
    {q:'1+1', h:'50-80 cm', fovg:2180, ffv:2420, hkg:'824 02'},
    {q:'1+2', h:'80-120 cm', fovg:2680, ffv:3000, hkg:'824 02'},
    {q:'1+2', h:'120-150 cm', fovg:3160, ffv:3600, hkg:'824 02'},
  ],
  Speierling: [
    {q:'1+0', h:'15-30 cm', fovg:1920, ffv:2510, hkg:'VkG 4'},
    {q:'1+0', h:'30-50 cm', fovg:2380, ffv:3220, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:6400, ffv:7800, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:7800, ffv:9700, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:9100, ffv:11200, hkg:'VkG 4'},
  ],
  'Speierling Pot': [
    {q:'1+1 P', h:'30-50 cm', fovg:10000, ffv:13700, hkg:'VkG 4'},
    {q:'1+2 P', h:'50-80 cm', fovg:11800, ffv:16100, hkg:'VkG 4'},
  ],
  spitzahorn: [
    {q:'1+0', h:'15-30 cm', fovg:505, ffv:570, hkg:'800 01'},
    {q:'1+0', h:'30-50 cm', fovg:620, ffv:690, hkg:'800 01'},
    {q:'1+0', h:'50-80 cm', fovg:844, ffv:972, hkg:'800 01'},
    {q:'1+0', h:'80-120 cm', fovg:1060, ffv:1220, hkg:'800 01'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:1300, ffv:1460, hkg:'800 01'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1620, ffv:1810, hkg:'800 01'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:2010, ffv:2240, hkg:'800 04'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:2480, ffv:2760, hkg:'800 04'},
    {q:'1+1/1+2', h:'150-180 cm', fovg:2680, ffv:3000, hkg:'800 04'},
    {q:'1+1/1+2', h:'180-220 cm', fovg:3000, ffv:3360, hkg:'800 04'},
  ],
  Stechpalme: [
    {q:'1+2P', h:'15-30 cm', fovg:910, ffv:0, hkg:'unbekannt'},
  ],
  Steinweichsel: [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'80-120 cm', fovg:318, ffv:0, hkg:'Süddeutschland'},
  ],
  'Steinweichsel l.Str.': [
    {q:'l.Str. 3 Tr.', h:'70-90 cm', fovg:406, ffv:0, hkg:'Süddeutschland'},
  ],
  stieleiche: [
    {q:'1+0', h:'15-30 cm', fovg:635, ffv:710, hkg:'817 01'},
    {q:'1+0', h:'30-50 cm', fovg:1040, ffv:1160, hkg:'817 01'},
    {q:'2+0/3+0#', h:'30-50 cm', fovg:1240, ffv:1380, hkg:'817 01'},
    {q:'2+0/3+0#', h:'50-80 cm', fovg:1580, ffv:1760, hkg:'817 01'},
    {q:'2+0/3+0#', h:'80-120 cm', fovg:1960, ffv:2180, hkg:'817 01'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:1580, ffv:1760, hkg:'817 01'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:1960, ffv:2180, hkg:'817 01'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:2360, ffv:2610, hkg:'817 01'},
    {q:'1+1/1+2', h:'120-150 cm', fovg:3000, ffv:3360, hkg:'817 01'},
  ],
  'Tatarischer Hartriegel': [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:0, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:0, hkg:'Süddeutschland'},
  ],
  'Tatarischer Hartriegel I.Str.': [
    {q:'I.Str. 3 Tr.', h:'70-90 cm', fovg:368, ffv:0, hkg:'Süddeutschland'},
  ],
  traubeneiche: [
    {q:'1+0', h:'15-30 cm', fovg:770, ffv:860, hkg:'818 06'},
    {q:'1+0', h:'30-50 cm', fovg:1140, ffv:1270, hkg:'818 06'},
    {q:'2+0', h:'15-30 cm', fovg:955, ffv:1080, hkg:'818 06'},
    {q:'2+0', h:'30-50 cm', fovg:1460, ffv:1620, hkg:'818 06'},
    {q:'2+0', h:'50-80 cm', fovg:1760, ffv:1960, hkg:'818 06'},
    {q:'2+0', h:'80-120 cm', fovg:2120, ffv:2360, hkg:'818 06'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:2140, ffv:2380, hkg:'818 06'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:2460, ffv:2740, hkg:'818 06'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:2740, ffv:3060, hkg:'818 06'},
    {q:'2+2', h:'120-150 cm', fovg:3000, ffv:3360, hkg:'818 06'},
  ],
  'Türkische Tanne': [
    {q:'2+1', h:'–', fovg:1560, ffv:0, hkg:'HK Kökez/Bolu'},
    {q:'2+2', h:'–', fovg:1950, ffv:0, hkg:'HK Kökez/Bolu'},
  ],
  'Türkische Tanne QP/mTb': [
    {q:'2+1', h:'–', fovg:3500, ffv:0, hkg:'HK Kökez/Bolu'},
  ],
  'Ungarische Eiche': [
    {q:'1+0', h:'15-30 cm', fovg:250, ffv:0, hkg:'unbekannt'},
  ],
  Vogelkirsche: [
    {q:'1+0', h:'30-50 cm', fovg:860, ffv:955, hkg:'814 01'},
    {q:'1+0', h:'50-80 cm', fovg:1170, ffv:1300, hkg:'814 01'},
    {q:'1+0', h:'80-120 cm', fovg:1460, ffv:1620, hkg:'814 01'},
    {q:'1+1', h:'50-80 cm', fovg:1860, ffv:2070, hkg:'814 01'},
    {q:'1+2', h:'80-120 cm', fovg:2290, ffv:2550, hkg:'814 01'},
    {q:'1+2', h:'120-150 cm', fovg:2760, ffv:3080, hkg:'814 01'},
    {q:'1+2', h:'150-180 cm', fovg:3080, ffv:3480, hkg:'814 01'},
  ],
  waldkiefer: [
    {q:'1+0', h:'–', fovg:211, ffv:233, hkg:'851 05'},
    {q:'2+0#', h:'–', fovg:404, ffv:452, hkg:'851 05'},
    {q:'1+1', h:'–', fovg:650, ffv:730, hkg:'851 05'},
    {q:'1+2', h:'–', fovg:930, ffv:1040, hkg:'851 05'},
    {q:'2+1', h:'–', fovg:3650, ffv:0, hkg:'851 05'},
    {q:'1+1P', h:'–', fovg:2900, ffv:3240, hkg:'SP Ostpreußen'},
  ],
  Walnuss: [
    {q:'1+0', h:'7-15 cm', fovg:158, ffv:169, hkg:'VkG 4'},
    {q:'1+0', h:'15-30 cm', fovg:294, ffv:316, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'15-30 cm', fovg:336, ffv:360, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'30-50 cm', fovg:420, ffv:449, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'50-80 cm', fovg:525, ffv:560, hkg:'VkG 4'},
    {q:'1+1/1+2', h:'80-120 cm', fovg:640, ffv:680, hkg:'Oberrhein/Süddt.'},
  ],
  'Walnuss Urnuss': [
    {q:'1+0', h:'15-30 cm', fovg:250, ffv:0, hkg:'Indien/Pakistan'},
    {q:'1+0', h:'30-50 cm', fovg:550, ffv:0, hkg:'Indien/Pakistan'},
    {q:'1+1', h:'15-30 cm', fovg:420, ffv:0, hkg:'Indien/Pakistan'},
  ],
  weissdorn: [
    {q:'1+0', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
    {q:'I.Str. 3 Tr.', h:'70-90 cm', fovg:482, ffv:635, hkg:'Süddeutschland'},
  ],
  weisstanne: [
    {q:'2+0', h:'–', fovg:392, ffv:440, hkg:'827 05'},
    {q:'2+1', h:'–', fovg:1040, ffv:1170, hkg:'827 05'},
    {q:'2+2', h:'15-30 cm', fovg:1380, ffv:1540, hkg:'827 05'},
    {q:'2+2', h:'20-40 cm', fovg:1580, ffv:1760, hkg:'827 05'},
    {q:'2+3', h:'25-50 cm', fovg:1810, ffv:2010, hkg:'827 05'},
    {q:'2+1', h:'–', fovg:3380, ffv:3890, hkg:'827 05'},
  ],
  Weymouthskiefer: [
    {q:'2+1', h:'–', fovg:1300, ffv:0, hkg:'unbekannt'},
    {q:'2+2', h:'–', fovg:1770, ffv:0, hkg:'unbekannt'},
  ],
  Wildapfel: [
    {q:'1+1', h:'30-50 cm', fovg:226, ffv:294, hkg:'Süddeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:272, ffv:355, hkg:'Süddeutschland'},
    {q:'1+2', h:'80-120 cm', fovg:318, ffv:420, hkg:'Süddeutschland'},
  ],
  'Wildapfel l.Str.': [
    {q:'l.Str. 3 Tr.', h:'70-90 cm', fovg:510, ffv:655, hkg:'Süddeutschland'},
  ],
  Wildbirne: [
    {q:'1+1', h:'30-50 cm', fovg:244, ffv:318, hkg:'Westdeutschland'},
    {q:'1+1', h:'50-80 cm', fovg:294, ffv:385, hkg:'Westdeutschland'},
    {q:'1+2', h:'80-120 cm', fovg:344, ffv:465, hkg:'Westdeutschland'},
  ],
  Winterlinde: [
    {q:'1+0', h:'15-30 cm', fovg:750, ffv:835, hkg:'823 04'},
    {q:'1+0', h:'30-50 cm', fovg:980, ffv:1110, hkg:'823 04'},
    {q:'2+0#', h:'30-50 cm', fovg:1240, ffv:1380, hkg:'823 04'},
    {q:'2+0#', h:'50-80 cm', fovg:1540, ffv:1720, hkg:'823 04'},
    {q:'1+1', h:'30-50 cm', fovg:1540, ffv:1720, hkg:'823 04'},
    {q:'1+2', h:'50-80 cm', fovg:1910, ffv:2120, hkg:'823 04'},
    {q:'1+2', h:'80-120 cm', fovg:2360, ffv:2610, hkg:'823 04'},
    {q:'1+3', h:'120-150 cm', fovg:2920, ffv:3240, hkg:'823 04'},
  ],
  Wirtschaftspappel: [
    {q:'0+1', h:'80-120 cm', fovg:550, ffv:0, hkg:'unbekannt'},
    {q:'0+1', h:'120-150 cm', fovg:620, ffv:0, hkg:'unbekannt'},
    {q:'0+2', h:'150-200 cm', fovg:820, ffv:0, hkg:'unbekannt'},
  ],
  'Wolliger Schneeball': [
    {q:'2+1', h:'30-50 cm', fovg:258, ffv:335, hkg:'Süddeutschland'},
    {q:'2+1', h:'50-80 cm', fovg:302, ffv:495, hkg:'Süddeutschland'},
    {q:'2+1', h:'80-120 cm', fovg:365, ffv:510, hkg:'Süddeutschland'},
  ],
  'Wolliger Schneeball I.Str.': [
    {q:'I.Str. 2 Tr.', h:'70-90 cm', fovg:406, ffv:525, hkg:'Süddeutschland'},
  ],
  Zerreiche: [
    {q:'1+0', h:'15-30 cm', fovg:1540, ffv:1720, hkg:'Bulgarien'},
    {q:'1+0', h:'30-50 cm', fovg:1720, ffv:1910, hkg:'Bulgarien'},
    {q:'1+1', h:'30-50 cm', fovg:2120, ffv:2360, hkg:'Bulgarien'},
    {q:'1+1', h:'50-80 cm', fovg:2550, ffv:2840, hkg:'Bulgarien'},
  ],
  'Zerreiche QP': [
    {q:'1+0', h:'30-50 cm', fovg:2920, ffv:3080, hkg:'Bulgarien'},
  ],
};


// ── Welche Baumarten bietet Darmstädter an? ───────────────────────────────────
var DARMSTAEDTER_BAUMARTEN = Object.keys(DARMST_ANGEBOTE);

// ── HKG-Codes je Baumart (aus Preisliste herkunft_codes) ─────────────────────
// Zeigt alle möglichen Herkünfte für eine Baumart an (nicht nur den hkg-Code des Angebots)
var DARMST_HKG_CODES = {
  'Baumhasel': ['autochthon', 'unbekannt'],
  'Berberitze': ['Süddeutschland'],
  'Berberitze I.Str.': ['Süddeutschland'],
  'bergahorn': ['801 03', '801 04', '801 05', '801 08', '801 09'],
  'Bergulme': ['unbekannt'],
  'Besenginster': ['Oberrhein'],
  'Bibernellrose': ['Süddeutschland'],
  'Bibernellrose I.Str.': ['Süddeutschland'],
  'Bitternuss': ['unbekannt'],
  'Blasenstrauch': ['Süddeutschland'],
  'Blasenstrauch I.Str.': ['Süddeutschland'],
  'Blaue Hechtrose': ['Süddeutschland'],
  'Blaue Hechtrose I.Str.': ['Süddeutschland'],
  'Blaufichte': ['Apache/Kaibab'],
  'Blaufichte Pot': ['Apache/Kaibab'],
  'Coloradotanne': ['var. glauca'],
  'douglasie': ['853 01', '853 04', '853 05'],
  'Eberesche': ['VkG 4', 'VkG 5'],
  'Edelkastanie': ['808 02', 'EFA Annweiler'],
  'Edeltanne': ['unbekannt'],
  'Edeltanne QP24': ['unbekannt'],
  'Eibe': ['unbekannt'],
  'Eibe Pot': ['unbekannt'],
  'Elsbeere': ['VkG 4', 'VkG 5'],
  'Elsbeere Pot': ['VkG 4', 'VkG 5'],
  'laerche': ['837 03'],
  'Faulbaum': ['Süddeutschland'],
  'Feldahorn': ['VkG 4', 'VkG 5'],
  'Feldulme': ['unbekannt'],
  'Felsenbirne (kanadisch)': ['Süddeutschland'],
  'Felsenbirne I.Str.': ['Süddeutschland'],
  'Felsenmispel': ['Süddeutschland'],
  'Felsenmispel I.Str.': ['Süddeutschland'],
  'Flatterulme': ['unbekannt'],
  'Gem. Heckenkirsche': ['Süddeutschland'],
  'Gem. Heckenkirsche I.Str.': ['Süddeutschland'],
  'Gemeiner Hartriegel': ['Süddeutschland'],
  'Gemeiner Hartriegel I.Str.': ['Süddeutschland'],
  'Gemeiner Schneeball': ['Süddeutschland'],
  'Gemeiner Schneeball l.Str.': ['Süddeutschland'],
  'Große Küstentanne': ['83002'],
  'Große Küstentanne QP24': ['83002'],
  'hainbuche': ['806 01', '806 04'],
  'haselnuss': ['Süddeutschland'],
  'Hemlocktanne': ['unbekannt'],
  'Hirschholunder': ['Süddeutschland'],
  'Hundsrose': ['Süddeutschland'],
  'Hundsrose I.Str.': ['Süddeutschland'],
  'Hybridlärche': ['div. SP'],
  'Kartoffelrose': ['Japan'],
  'Kartoffelrose I.Str.': ['Japan'],
  'Kornelkirsche': ['Südwestdeutschland'],
  'Kornelkirsche I.Str.': ['Südwestdeutschland'],
  'Kreuzdorn': ['Süddeutschland'],
  'Kreuzdorn I.Str.': ['Süddeutschland'],
  'Liguster (Steckholz)': ['Süddeutschland'],
  'Liguster l.Str.': ['Süddeutschland'],
  'Liguster l.Str. 5 Tr.': ['Süddeutschland'],
  'Maulbeerbaum': ['unbekannt'],
  'Mehlbeere': ['unbekannt'],
  'Nordmannstanne': ['Ambrolauri/Borshomi'],
  'Nordmannstanne QP24': ['Ambrolauri/Borshomi'],
  'Orientbuche': ['unbekannt'],
  'Pfaffenhütchen': ['Süddeutschland'],
  'Pfaffenhütchen I.Str.': ['Süddeutschland'],
  'Riesenlebensbaum': ['unbekannt'],
  'Riesenlebensbaum QP24': ['unbekannt'],
  'Robinie': ['819 02'],
  'Rosskastanie': ['unbekannt'],
  'rotbuche': ['810 01', '810 07', '810 08', '810 09', '810 10', '810 16', '810 17'],
  'Rotfichte': ['840 04', '840 05', '840 06', '840 07', '840 17'],
  'Rotfichte QP1+1': ['840 04', '840 05', '840 06', '840 07', '840 17'],
  'Rotfichte QP24': ['840 17'],
  'Salweide (Bienenweide)': ['Süddeutschland'],
  'Sandbirke / Moorbirke': ['804 04'],
  'Sanddorn': ['VkG 4'],
  'Sanddorn l.Str.': ['VkG 4'],
  'Schiffsmastenrobinie': ['unbekannt'],
  'Schlehdorn': ['Süddeutschland'],
  'Schlehdorn I.Str.': ['Süddeutschland'],
  'Schwarzer Holunder': ['VkG 5'],
  'Schwarzer Holunder I.Str.': ['VkG 5'],
  'schwarzerle': ['802 04', '802 05', '802 07', '802 08'],
  'Schwarzkiefer kalabrisch': ['848 02'],
  'Schwarzkiefer korsisch': ['849 02'],
  'Schwarzkiefer österr.': ['847 02'],
  'Schwarznuss': ['Oberrheingraben'],
  'Schwarznuss DKV': ['DKV Rheinauen'],
  'Serbische Fichte': ['unbekannt'],
  'Silberweide (Steckholz)': ['Süddeutschland'],
  'Silberweide l.Str.': ['Süddeutschland'],
  'Sommerlinde': ['824 02', '824 04'],
  'Speierling': ['VkG 4', 'VkG 5'],
  'Speierling Pot': ['VkG 4', 'VkG 5'],
  'spitzahorn': ['800 01', '800 02', '800 04'],
  'Stechpalme': ['unbekannt'],
  'Steinweichsel': ['Süddeutschland'],
  'Steinweichsel l.Str.': ['Süddeutschland'],
  'stieleiche': ['817 01', '817 06', '817 07', '817 09'],
  'Tatarischer Hartriegel': ['Süddeutschland'],
  'Tatarischer Hartriegel I.Str.': ['Süddeutschland'],
  'traubeneiche': ['818 06', '818 07', '818 08', '818 09', '818 10', '818 11', '818 13'],
  'Türkische Tanne': ['HK Kökez/Bolu'],
  'Türkische Tanne QP/mTb': ['HK Kökez/Bolu'],
  'Ungarische Eiche': ['unbekannt'],
  'Vogelkirsche': ['814 01', '814 02', '814 04'],
  'waldkiefer': ['851 05', '851 06', '851 13', '851 15'],
  'Walnuss': ['Oberrhein/Süddt.', 'VkG 4', 'VkG 5'],
  'Walnuss Urnuss': ['Indien/Pakistan'],
  'weissdorn': ['Süddeutschland'],
  'weisstanne': ['827 05', '827 06', '827 07', '827 08', '827 09', '827 10'],
  'Weymouthskiefer': ['unbekannt'],
  'Wildapfel': ['Süddeutschland'],
  'Wildapfel l.Str.': ['Süddeutschland'],
  'Wildbirne': ['Westdeutschland'],
  'Winterlinde': ['823 04', '823 05', '823 07'],
  'Wirtschaftspappel': ['unbekannt'],
  'Wolliger Schneeball': ['Süddeutschland'],
  'Wolliger Schneeball I.Str.': ['Süddeutschland'],
  'Zerreiche': ['Bulgarien'],
  'Zerreiche QP': ['Bulgarien'],
};

// ── Alle bekannten Baumarten (für Pfad A: eigene Pflanzen) ────────────────────
var ALLE_BAUMARTEN_FOVG = [
  'Bergahorn',
  'Douglasie',
  'Eberesche',
  'Elsbeere',
  'Esche',
  'Esskastanie',
  'Europäische Lärche',
  'Feldahorn',
  'Fichte',
  'Grauerle',
  'Große Küstentanne',
  'Hainbuche',
  'Haselnuss',
  'Hybridlärche',
  'Japanische Lärche',
  'Moorbirke',
  'Pappeln',
  'Robinie',
  'Rotbuche',
  'Roteiche',
  'Sandbirke',
  'Schwarzerle',
  'Schwarzkiefer',
  'Sitkafichte',
  'Sommerlinde',
  'Spitzahorn',
  'Stieleiche',
  'Traubeneiche',
  'Vogelkirsche',
  'Waldkiefer',
  'Weißdorn',
  'Weißtanne',
  'Wildapfel',
  'Wildbirne',
  'Winterlinde',
  'Zitterpappel'
];

// ── HKG-Codes je Baumart (aus fovg_baumarten.json) ──────────────────────────
var HKG_PRO_BAUMART = {
  'Spitzahorn':['800 01','800 02','800 03','800 04'],
  'Bergahorn':['801 01','801 02','801 03','801 04','801 05','801 06','801 07','801 08','801 09','801 10','801 11'],
  'Schwarzerle':['802 01','802 02','802 03','802 04','802 05','802 06','802 07','802 08'],
  'Grauerle':['803 01','803 02'],
  'Sandbirke':['804 01','804 02','804 03','804 04'],
  'Moorbirke':['805 01','805 02','805 03','805 04'],
  'Hainbuche':['806 01','806 02','806 03','806 04'],
  'Esskastanie':['808 01','808 02'],
  'Rotbuche':['810 01','810 02','810 03','810 04','810 05','810 06','810 07','810 08','810 09','810 10','810 11','810 12','810 13','810 14','810 15','810 16','810 17','810 18','810 19','810 20','810 21','810 22','810 23','810 24','810 25','810 26'],
  'Esche':['811 01','811 02','811 03','811 04','811 05','811 06','811 07','811 08'],
  'Vogelkirsche':['814 01','814 02','814 03','814 04'],
  'Roteiche':['816 01','816 02'],
  'Stieleiche':['817 01','817 02','817 03','817 04','817 05','817 06','817 07','817 08','817 09'],
  'Traubeneiche':['818 01','818 02','818 03','818 04','818 05','818 06','818 07','818 08','818 09','818 10','818 11','818 12','818 13'],
  'Robinie':['819 01','819 02'],
  'Winterlinde':['823 01','823 02','823 03','823 04','823 05','823 06','823 07','823 08'],
  'Sommerlinde':['824 01','824 02','824 03','824 04'],
  'Weißtanne':['827 01','827 02','827 03','827 04','827 05','827 06','827 07','827 08','827 09','827 10','827 11','827 12'],
  'Große Küstentanne':['830 01','830 02'],
  'Europäische Lärche':['837 01','837 02','837 03','837 04','837 05','837 06','837 07'],
  'Fichte':['840 01','840 02','840 03','840 04','840 05','840 06','840 07','840 08','840 09','840 10','840 11','840 12','840 13','840 14','840 15','840 16','840 17','840 18','840 19','840 20','840 21','840 22','840 23','840 24','840 25','840 26','840 27','840 28','840 29','840 30'],
  'Schwarzkiefer':['847 01','847 02','848 01','848 02','849 01','849 02'],
  'Waldkiefer':['851 01','851 02','851 03','851 04','851 05','851 06','851 07','851 08','851 09','851 10','851 11','851 12','851 13','851 14','851 15','851 16','851 17','851 18','851 19','851 20','851 21','851 22','851 23'],
  'Douglasie':['853 01','853 02','853 03','853 04','853 05','853 06']
};


function isBaumartVerfuegbar(treeKey){
  if(S.lieferant !== 'darmstaedter') return true;
  if(S.bezugsquelle === 'vorhanden') return true;
  return DARMSTAEDTER_BAUMARTEN.indexOf(treeKey) !== -1;
}

// ── DARMST_PREISE (Rückwärtskompatibilität) ───────────────────────────────────
var DARMST_PREISE = {};
Object.keys(DARMST_ANGEBOTE).forEach(function(k){
  DARMST_PREISE[k] = DARMST_ANGEBOTE[k].map(function(a){
    return {q: a.q, h: a.h + (a.h && a.h !== '–' ? 'cm' : ''), p: a.fovg};
  });
});



// ── State ──────────────────────────────────────────────────────────────────────
var S = {
  step: -1,
  // Step 0: Baumarten
  treeQty: {},          // { 'rotbuche': 500, 'stieleiche': 300 }
  // Step 1: Flächen
  flaechen: [],
  activeFl: 0,
  // Step 2: Zeitraum + Fördercheck
  zeitraum: '',
  bemerkung: '',
  bundesland: '',
  foerderProgramme: [],
  foerderBeratungS2: false,
  // Step 3: Kontakt
  name: '', email: '', tel: '', treffpunkt: '', firma: '', waldbesitzertyp: '',
  uploadedFiles: [],
  // FoVG Herkunft (Pflicht)
  herkunft: {},  // { 'rotbuche': {hkg:'801 08', kat:'ausgewaehlt'}, 'haselnuss': {hkg:'n/a', kat:'n/a'} }
  // Bezugsquelle
  bezugsquelle: null,          // 'vorhanden' | 'bestellen'
  eigenePflanzen: [],          // [{baumart, menge}]
  eigenePflanzenHerkunft: [],  // [{baumart, hkg_code}]
  // Bezugsquelle legacy
  pflanzenVorhanden: null,  // 'vorhanden' | 'bestellen'
  lieferant: '',             // 'darmstaedter' | other key
  herkunftCode: '',          // HKG-Code Freitext (wenn nicht Darmstädter)
  lieferort: '',             // 'forststrasse' | 'pflanzflaeche' | 'selbst'
  lieferAdresse: '',         // Straße, Hausnummer, PLZ, Ort (computed)
  lieferStr: '',             // Straße + Hausnummer
  lieferPlz: '',             // PLZ
  lieferOrt: '',             // Ort
  lieferBundesland: '',      // Bundesland (optional)
  lieferMapsLink: '',        // Google Maps Link oder Koordinaten
  befahrbarkeit: '',         // 'lkw' | 'kleintransporter' | 'traktor' | 'unbekannt'
  selectedPreise: {},        // {treeKey: {q,h,p} } für Darmstädter (Rückwärtskompatibilität)
  selectedAngebote: [],      // [{baumart_key, baumart_name, q, h, hkg, fovg, ffv, menge}] für Darmstädter
  darmstPhase: 1,            // 1=Baumart-Auswahl, 2=Detail-Auswahl
  darmstSelectedBaumarten: [], // array of tree keys (Phase 1 selection)
  andereBaumschule: '',      // Freitext wenn lieferant === 'andere'
};
TREES.forEach(function(t){ S.treeQty[t.k] = 0; });

function newFlaeche(id){
  var fl = {
    id: id || Date.now(),
    forstamt: '', revier: '',
    ha: '', plz: '', ort: '',
    hang: null, boden: '',
    treeVerteilung: {},
    abstand_p: '2.0', abstand_r: '2.0',
    seq: {},
    // Pflanzverband
    verbandMethode: 'reihe',      // reihe|quincunx|trupp|nester|streifen|frei
    reihenStart: 'gleich',        // gleich|quincunx|alternierend
    aussenreihe: false,
    aussenreiheArt: '',
    truppGroesse: 10,
    verbandFreitext: ''
  };
  TREES.forEach(function(t){
    fl.treeVerteilung[t.k] = 0;
    fl.seq[t.k] = 1;
  });
  return fl;
}

S.flaechen = [newFlaeche()];

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function fmt(n){ return Number(n).toLocaleString('de-DE',{maximumFractionDigits:2}); }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-pflanzung-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent='';e.style.display='none';} }
var _kaSearchA = ''; // Suchfeld-Query Step 3A (eigene Pflanzen)
var _kaSearchB = ''; // Suchfeld-Query Step 3B Phase 1 (Darmstaedter Baumartenauswahl)

window.kaFilterEigenePflanzen = function kaFilterEigenePflanzen(query) {
  _kaSearchA = query;
  var q = query.toLowerCase().trim();
  document.querySelectorAll('.ep-row').forEach(function(item) {
    var cb = item.querySelector('[data-baumart]');
    var name = (cb ? cb.dataset.baumart : item.textContent || '').toLowerCase();
    item.style.display = (!q || name.indexOf(q) >= 0) ? '' : 'none';
  });
}


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
function updateGPSFl(val, flId) {
  var fl = S.flaechen.find(function(f){ return String(f.id) === String(flId); });
  if (fl) fl.gps = val;
}


window.kaFilterDarmstBaumarten = function kaFilterDarmstBaumarten(query) {
  _kaSearchB = query;
  var q = query.toLowerCase().trim();
  document.querySelectorAll('.darmst-baumart-cb').forEach(function(cb) {
    var label = cb.closest ? cb.closest('label') : cb.parentNode;
    if(!label) return;
    var name = label.textContent.toLowerCase();
    label.style.display = (!q || name.indexOf(q) >= 0) ? 'flex' : 'none';
  });
}

var _kaSearchBP='';
window.kaFilterBpRows = function kaFilterBpRows(query){
  _kaSearchBP=query;
  var q=query.toLowerCase().trim();
  document.querySelectorAll('.bp-row').forEach(function(row){
    var name=row.textContent.toLowerCase();
    row.style.display=(!q||name.indexOf(q)>=0)?'flex':'none';
  });
}
function go(n){ _kaSearchA=''; _kaSearchB=''; _kaSearchBP=''; S.step=n; saveDraft(); try{history.pushState({step:n},'','#step-'+n);}catch(e){} render(); window.scrollTo(0,0); }
function getSelTrees(){
  var result = TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
  // Fix A: eigenePflanzen-Baumarten (vorhanden-Pfad + non-Darmstädter custom)
  if(S.eigenePflanzen && S.eigenePflanzen.length){
    S.eigenePflanzen.forEach(function(ep){
      if((ep.menge||0) <= 0) return;
      if(result.find(function(t){ return t.name === ep.baumart; })) return;
      var k = ep.baumart.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,'');
      result.push({k: k, name: ep.baumart, p100: 0, info: ''});
    });
  }
  // Fix B: treeQty-Keys für Nicht-TREES-Arten (z.B. Darmstädter: Lärche, Hainbuche, Schwarzerle, Spitzahorn)
  Object.keys(S.treeQty).forEach(function(k){
    if((S.treeQty[k]||0) <= 0) return;
    if(TREES.find(function(t){ return t.k === k; })) return;
    if(result.find(function(t){ return t.k === k; })) return;
    var name = k;
    if(S.selectedAngebote) { var sa=S.selectedAngebote.find(function(sa){ return sa.baumart_key===k; }); if(sa) name=sa.baumart_name||k; }
    result.push({k: k, name: name, p100: 0, info: ''});
  });
  return result;
}
function treeTotal(){ return TREES.reduce(function(s,t){ return s+(S.treeQty[t.k]||0)/100*t.p100; },0); }
function getFlaecheById(id){ return S.flaechen.find(function(f){ return String(f.id)===String(id); }); }

// ── Schritt -1: Waldbesitzertyp ───────────────────────────────────────────────────────────────────────
function sBesitzertyp(){
  var cards = BESITZERTYPEN.map(function(b){
    var sel = S.waldbesitzertyp === b.k;
    var borderCol = sel ? '#012d1d' : '#d0cfc7';
    var bgCol = sel ? '#f0f5ec' : '#fff';
    var fw = sel ? '700' : '500';
    var txCol = sel ? '#012d1d' : '#2d2d2a';
    var dotBorder = sel ? '#012d1d' : '#aaa';
    var dotBg = sel ? '#012d1d' : 'transparent';
    var style = 'cursor:pointer;padding:14px 18px;border-radius:10px;border:2px solid '+borderCol+';background:'+bgCol+';margin-bottom:8px;font-size:15px;font-weight:'+fw+';color:'+txCol+';display:flex;align-items:center;gap:12px;transition:all 0.15s;';
    var dotStyle = 'width:20px;height:20px;border-radius:50%;border:2px solid '+dotBorder+';background:'+dotBg+';flex-shrink:0;display:inline-block';
    return '<div class="ka-card-option'+(sel?' selected':'')+'" data-k="'+b.k+'" style="'+style+'">'
      +'<span style="'+dotStyle+'"></span>'
      +esc(b.name)+'</div>';
  }).join('');
  return '<div class="ka-card">'
    +'<div class="ka-card-header" style="padding:20px 20px 12px">'
    +'<h2 style="font-size:1.3rem;margin:0 0 6px;color:#012d1d">🌳 Waldbesitzertyp</h2>'
    +'<p style="margin:0;font-size:14px;color:#666">Welche Art von Waldbesitzer sind Sie?</p>'
    +'</div>'
    +'<div class="ka-card-body" style="padding:0 20px 16px">'
    +'<div class="ka-cards">'+cards+'</div>'
    +'<div class="ka-err" id="e-1" style="color:red;font-size:13px;margin-top:8px;display:none"></div>'
    +'</div>'
    +'<div class="ka-card-footer" style="padding:14px 20px;display:flex;justify-content:space-between;border-top:1px solid #eee;">'
    +'<div></div>'
    +'<button class="ka-btn ka-btn-primary" id="n-1" style="background:#012d1d;color:#fff;border:none;border-radius:8px;padding:10px 24px;font-size:15px;font-weight:700;cursor:pointer">Weiter →</button>'
    +'</div></div>';
}

function bindBesitzertyp(){
  document.querySelectorAll('.ka-card-option').forEach(function(card){
    card.addEventListener('click', function(){
      S.waldbesitzertyp = this.dataset.k;
      render();
    });
  });
  var btn = document.getElementById('n-1');
  if(btn) btn.addEventListener('click', function(){
    if(!S.waldbesitzertyp){
      showErr('e-1', 'Bitte Waldbesitzertyp auswählen.');
      return;
    }
    hideErr('e-1');
    go(0);
  });
}

// ── Render ─────────────────────────────────────────────────────────────────────

// ── Pflanzverband Vorschau-Animation ──────────────────────────────────────────
function pvDot(color,name,size){
  size=size||18;
  var ds=window.innerWidth<600?Math.floor(size*0.7):size;
  return '<div title="'+esc(name)+'" style="width:'+ds+'px;height:'+ds+'px;border-radius:50%;background:'+color+';flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.15)"></div>';
}
function pvLegend(sel,fl,showSeq){
  var legend='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px dashed #d4edd9">';
  sel.forEach(function(t,i){
    var n=parseInt(fl.seq[t.k])||1; var c=col(i);
    legend+='<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#555">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+c.tx+';display:inline-block;flex-shrink:0"></span>'
      +(showSeq?'<strong>'+n+'×</strong> ':'')+esc(t.name)+'</span>';
  });
  legend+='</div>';
  return legend;
}

function drawPflanzverband(flId){
  var el=document.getElementById('pv-preview-'+flId);
  if(!el) return;
  var fl=getFlaecheById(String(flId));
  if(!fl){ // fallback: use S.flaechen[0] if id matches
    if(S.flaechen && S.flaechen.length && String(S.flaechen[0].id)===String(flId)) fl=S.flaechen[0];
    else return;
  }
  var sel=getSelTrees();
  var m=fl.verbandMethode||'reihe';

  if(m==='frei'){
    el.innerHTML='<p style="color:#012d1d;font-size:12px;margin:0;font-style:italic">✏️ Freie Beschreibung — bitte im Textfeld unten beschreiben.</p>';
    return;
  }

  // Berechnete Stückzahl aus ha und Pflanzverband
  var haVal=parseFloat(fl.ha)||0;
  var ap=parseFloat(fl.abstand_p||2), ar=parseFloat(fl.abstand_r||2);
  var stueckzahl = ap>0&&ar>0&&haVal>0 ? Math.round(haVal*10000/(ap*ar)) : 0;
  var infoHtml = stueckzahl>0
    ? '<div style="font-size:11px;color:#555;margin-bottom:6px">📊 Ca. <strong>'+stueckzahl.toLocaleString('de-DE')+'</strong> Pflanzen auf '+haVal+' ha bei '+ap+'m × '+ar+'m Abstand</div>'
    : '';

  if(!sel.length){
    el.innerHTML=infoHtml+'<p style="color:#666;font-size:12px;margin:0;font-style:italic">Keine Baumarten ausgewählt — Vorschau zeigt Anordnungsmuster</p>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">'
      +(function(){var r='';for(var i=0;i<15;i++)r+=pvDot('#012d1d','Pflanze',14);return r;})()
      +'</div>';
    return;
  }

  var html=infoHtml;

  if(m==='reihe'||m==='quincunx'){
    var unit=[];
    sel.forEach(function(t,i){ var n=Math.max(0,parseInt(fl.seq[t.k])||1); var c=col(i); for(var j=0;j<n;j++) unit.push({color:c.tx,name:t.name,key:t.k}); });
    if(!unit.length){ el.innerHTML=html+'<p style="color:#666;font-size:12px;margin:0">Reihenfolge-Werte alle 0</p>'; return; }
    var isMobile=window.innerWidth<600; var ROWS=isMobile?3:5; var REPS=isMobile?Math.min(3,Math.floor(20/unit.length)):Math.min(5,Math.floor(32/unit.length));
    html+='<div style="display:flex;flex-direction:column;gap:'+(isMobile?'2':'4')+'px;max-width:100%;overflow-x:auto">';
    for(var r=0;r<ROWS;r++){
      html+='<div style="display:flex;gap:4px;align-items:center">';
      var offset=0;
      if(m==='quincunx'&&r%2===1) offset=Math.floor(unit.length/2);
      else if(fl.reihenStart==='quincunx'&&r%2===1) offset=Math.floor(unit.length/2);
      else if(fl.reihenStart==='alternierend') offset=r%unit.length;
      var rowUnit=offset>0 ? unit.slice(offset).concat(unit.slice(0,offset)) : unit;
      if((m==='quincunx'||(fl.reihenStart==='quincunx'))&&r%2===1) html+='<div style="width:11px;flex-shrink:0"></div>';
      for(var rep=0;rep<REPS;rep++) rowUnit.forEach(function(p){ html+=pvDot(p.color,p.name); });
      html+='</div>';
    }
    html+='</div>';
    html+=pvLegend(sel,fl,true);
  } else if(m==='trupp'){
    var tSize=7;
    html+='<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start">';
    sel.forEach(function(t,i){
      var n=Math.max(1,parseInt(fl.seq[t.k])||tSize);
      var c=col(i);
      html+='<div style="padding:10px 12px;background:'+c.bg+';border:1.5px dashed '+c.bd+';border-radius:12px">'
        +'<div style="font-size:10px;color:'+c.tx+';font-weight:600;margin-bottom:5px">'+esc(t.name)+' ('+n+' Pfl.)</div>'
        +'<div style="position:relative;width:'+(Math.ceil(Math.sqrt(n))*28)+'px;height:'+(Math.ceil(Math.sqrt(n))*28)+'px">';
      for(var k=0;k<n&&k<25;k++){
        var angle=k*137.5*Math.PI/180;var rad=12+k*6;
        var px=50+Math.cos(angle)*rad*(0.7+Math.sin(k*2.1)*0.3);
        var py=50+Math.sin(angle)*rad*(0.7+Math.cos(k*1.7)*0.3);
        html+='<div title="'+esc(t.name)+'" style="position:absolute;left:'+px.toFixed(0)+'%;top:'+py.toFixed(0)+'%;width:15px;height:15px;border-radius:50%;background:'+c.tx+';opacity:0.85;transform:translate(-50%,-50%)"></div>';
      }
      html+='</div></div>';
    });
    html+='</div>';
  } else if(m==='nester'){
    var tSize=4;
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start">';
    sel.forEach(function(t,i){
      var n=Math.max(1,parseInt(fl.seq[t.k])||tSize);
      var c=col(i);
      var nestR=Math.min(n,7);
      html+='<div style="padding:8px;background:'+c.bg+';border:1.5px solid '+c.bd+';border-radius:50%">'
        +'<div style="font-size:9px;color:'+c.tx+';font-weight:600;text-align:center;margin-bottom:3px">'+esc(t.name)+'</div>'
        +'<div style="position:relative;width:60px;height:60px">';
      for(var k=0;k<nestR&&k<25;k++){
        var angle=k*(360/nestR)*Math.PI/180;var rad=k===0?0:18;
        var px=50+Math.cos(angle)*rad;
        var py=50+Math.sin(angle)*rad;
        html+='<div title="'+esc(t.name)+'" style="position:absolute;left:'+px.toFixed(0)+'%;top:'+py.toFixed(0)+'%;width:12px;height:12px;border-radius:50%;background:'+c.tx+';opacity:0.9;transform:translate(-50%,-50%)"></div>';
      }
      html+='</div>'
        +'<div style="font-size:9px;color:'+c.tx+';text-align:center;margin-top:2px">('+n+' Pfl.)</div>'
        +'</div>';
    });
    html+='</div>';
    html+=pvLegend(sel,fl,false);
  } else if(m==='streifen'){
    var strSel=sel.filter(function(t){ return (parseInt(fl.seq[t.k])||1)>0; });
    html+='<div style="display:flex;flex-direction:column;gap:3px;border-radius:6px;overflow:hidden">';
    for(var sv=0;sv<2;sv++){
      strSel.forEach(function(t,i){
        var n=parseInt(fl.seq[t.k])||1; var c=col(sel.indexOf(t));
        for(var sr=0;sr<n;sr++){
          html+='<div style="display:flex;gap:4px;padding:3px 6px;background:'+c.bg+';border-left:4px solid '+c.tx+'">';
          for(var sc=0;sc<8;sc++) html+=pvDot(c.tx,t.name,14);
          html+='<span style="font-size:10px;color:'+c.tx+';font-weight:600;align-self:center;margin-left:4px">'+esc(t.name)+'</span>';
          html+='</div>';
        }
      });
    }
    html+='</div>';
    html+=pvLegend(sel,fl,true);
  }

  el.innerHTML=html||'<p style="color:#666;font-size:12px;margin:0">Keine Vorschau verfügbar</p>';
}

function render(){
  // Berechne Anzeige-Schritt für Progress-Bar
  // Flow: -1=Besitzertyp, 0=Bezugsquelle, (10/11=Pfad A, 20/21=Pfad B) sub-steps, 1=Lieferort, 2=Fläche, 3=Fördercheck, 4=Kontakt
  var displayStep;
  if(S.step === -1) displayStep = -1;
  else if(S.step === 0 || S.step === 10 || S.step === 11 || S.step === 20 || S.step === 21) displayStep = 0;
  else if(S.step === 1) displayStep = 1;
  else if(S.step === 2) displayStep = 2;
  else if(S.step === 3) displayStep = 3;
  else displayStep = 4;

  document.querySelectorAll('.pf-st').forEach(function(el){
    var i=parseInt(el.dataset.i);
    el.classList.remove('cur','done','skip');
    if(i<displayStep) el.classList.add('done');
    if(i===displayStep) el.classList.add('cur');
    var dot=el.querySelector('.pf-dot');
    if(dot) dot.textContent = i<displayStep ? '✓' : (i+1);
  });
  // Path A (vorhanden): Lieferort-Step wird übersprungen → als "done" (automatisch erledigt) markieren
  if(S.bezugsquelle==='vorhanden' && displayStep>=2){
    var lStep=document.querySelector('.pf-st[data-i="1"]');
    if(lStep){lStep.classList.add('done');lStep.classList.remove('cur');
    var lDot=lStep.querySelector('.pf-dot');if(lDot)lDot.textContent='✓';}
  }
  var el=document.getElementById('pf-main');
  if(!el) return;
  switch(S.step){
    case -1: el.innerHTML=sBesitzertyp();     bindBesitzertyp();     break;
    case 0:  el.innerHTML=sBezugsquelle2();   bindBezugsquelle2();   break;
    case 10: el.innerHTML=sPflanzauswahl();   bindPflanzauswahl();   break;
    case 11: el.innerHTML=sHerkunftEigen();   bindHerkunftEigen();   break;
    case 20: el.innerHTML=sLieferantWahl();   bindLieferantWahl();   break;
    case 21: el.innerHTML=sBaumArtenPreise(); bindBaumArtenPreise(); break;
    case 1:  el.innerHTML=sLieferort();       bindLieferort();       break;
    case 2:
      // Sync treeQty aus vorherigen Steps für Pflanzverband-Vorschau
      if(S.bezugsquelle==='vorhanden'&&S.eigenePflanzen&&S.eigenePflanzen.length){
        S.eigenePflanzen.forEach(function(ep){
          var t=TREES.find(function(t){ return t.name===ep.baumart; });
          if(t){ S.treeQty[t.k]=Math.max(1,parseInt(ep.menge)||0); }
          else { var k=ep.baumart.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,''); S.treeQty[k]=Math.max(1,parseInt(ep.menge)||0); }
        });
      } else if(S.bezugsquelle==='bestellen'&&S.selectedAngebote&&S.selectedAngebote.length){
        S.selectedAngebote.forEach(function(sa){
          if(sa.baumart_key) S.treeQty[sa.baumart_key]=Math.max(1,parseInt(sa.menge)||100);
        });
      }
      el.innerHTML=s1(); bindListEvents1(); bindOuter1();  break;
    case 3:  el.innerHTML=sFoerdercheck();    bindFoerdercheck();    break;
    case 4:  el.innerHTML=sKontaktSummary();  bind4();
      setTimeout(function(){ S.flaechen.forEach(function(fl){ drawPflanzverband(fl.id); }); }, 50);
      break;
  }
}


// ── Step 1: Pflanzen — Bezugsquelle ──────────────────────────────────────────
function renderDarmstAngebotCards(selTrees){
  var html = '';
  selTrees.forEach(function(t){
    var angebote = DARMST_ANGEBOTE[t.k];
    if(!angebote || !angebote.length) return;
    html += '<div style="margin-bottom:18px">';
    html += '<div style="font-size:13px;font-weight:700;color:#2d2d2a;margin-bottom:8px;border-bottom:1px solid #eee;padding-bottom:4px">🌲 '+esc(t.name)+'</div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    angebote.forEach(function(an, idx){
      // Check if this offering is selected
      var isOn = false;
      for(var i=0; i<S.selectedAngebote.length; i++){
        var sa = S.selectedAngebote[i];
        if(sa.baumart_key === t.k && sa.q === an.q && sa.h === an.h){ isOn = true; break; }
      }
      var hkgCodes = DARMST_HKG_CODES[t.k] || [];
      var hkgList = hkgCodes.length > 1
        ? hkgLabel(an.hkg) + ' <span style="color:#666;font-size:10px">(+' + (hkgCodes.length-1) + ' weitere: ' + hkgCodes.filter(function(c){return c!==an.hkg;}).join(', ') + ')</span>'
        : hkgLabel(an.hkg);
      html += '<div class="darmst-angebot-card" data-tree="'+t.k+'" data-idx="'+idx+'" '
        + 'style="padding:10px 12px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#e0e0e0')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer;transition:all 0.15s;user-select:none">'
        // Header row
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:4px">'
        +   '<div style="font-size:13px;font-weight:'+(isOn?'700':'600')+';color:'+(isOn?'#012d1d':'#2d2d2a')+'">'
        +     esc(t.name)+' <span style="color:#666;font-weight:500">'+esc(an.q)+'</span>'
        +     (an.h && an.h !== '–' ? ' <span style="color:#666;font-size:12px">| '+esc(an.h)+'</span>' : '')
        +   '</div>'
        +   (isOn ? '<span style="color:#012d1d;font-size:18px;font-weight:700">✓</span>' : '')
        + '</div>'
        // HKG row
        + '<div style="font-size:11px;color:#666;margin-top:3px">Herkunft: '+hkgList+'</div>'
        // Prices row
        + '<div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">'
        +   '<div style="background:#f0faf8;border-radius:6px;padding:4px 10px">'
        +     '<div style="font-size:10px;color:#666;font-weight:600">FoVG</div>'
        +     '<div style="font-size:13px;font-weight:700;color:#012d1d">'+fmt(an.fovg)+' €<span style="font-size:10px;color:#666">/100 Stk.</span></div>'
        +   '</div>'
        +   (an.ffv ? '<div style="background:rgba(163,230,53,0.06);border-radius:6px;padding:4px 10px">'
        +     '<div style="font-size:10px;color:#666;font-weight:600">inkl. FfV/ZüF</div>'
        +     '<div style="font-size:13px;font-weight:700;color:#A3E635">'+fmt(an.ffv)+' €<span style="font-size:10px;color:#666">/100 Stk.</span></div>'
        +   '</div>' : '')
        + '</div>'
        // Menge + Preistyp (wenn ausgewählt)
        + (isOn
          ? (function(){
              var curPT = (function(){ for(var i=0;i<S.selectedAngebote.length;i++){ var sa=S.selectedAngebote[i]; if(sa.baumart_key===t.k&&sa.q===an.q&&sa.h===an.h) return sa.preistyp||'fovg'; } return 'fovg'; })();
              var curMenge = (function(){ for(var i=0;i<S.selectedAngebote.length;i++){ var sa=S.selectedAngebote[i]; if(sa.baumart_key===t.k&&sa.q===an.q&&sa.h===an.h) return sa.menge||100; } return 100; })();
              var ptKey = t.k+'_'+idx;
              var out = '<div style="margin-top:8px" onclick="event.stopPropagation()">';
              // Preistyp Radio (nur wenn ffv > 0)
              if(an.ffv){
                out += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">'
                  + '<label style="cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1.5px solid '+(curPT==='fovg'?'#012d1d':'#ccc')+';background:'+(curPT==='fovg'?'#fafaf7':'#fff')+';font-size:12px;font-weight:'+(curPT==='fovg'?'700':'500')+'">'
                  +   '<input type="radio" name="pt_'+ptKey+'" value="fovg" '+(curPT==='fovg'?'checked':'')+' onchange="window._pfPT(\''+t.k+'\','+idx+',\'fovg\')" style="accent-color:#012d1d">'
                  +   ' FoVG '+fmt(an.fovg)+' €/100'
                  + '</label>'
                  + '<label style="cursor:pointer;display:flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;border:1.5px solid '+(curPT==='ffv'?'#A3E635':'#ccc')+';background:'+(curPT==='ffv'?'#fffdf0':'#fff')+';font-size:12px;font-weight:'+(curPT==='ffv'?'700':'500')+'">'
                  +   '<input type="radio" name="pt_'+ptKey+'" value="ffv" '+(curPT==='ffv'?'checked':'')+' onchange="window._pfPT(\''+t.k+'\','+idx+',\'ffv\')" style="accent-color:#A3E635">'
                  +   ' FfV/ZüF '+fmt(an.ffv)+' €/100'
                  + '</label>'
                  + '</div>';
              }
              out += '<div style="display:flex;align-items:center;gap:8px">'
                + '<label style="font-size:12px;color:#555">Menge:</label>'
                + '<input type="number" class="darmst-menge-inp" data-tree="'+t.k+'" data-idx="'+idx+'" '
                +   'value="'+curMenge+'" '
                +   'min="50" step="50" '
                +   'style="width:90px;padding:5px 8px;border:1.5px solid #012d1d;border-radius:6px;font-size:13px;font-weight:600">'
                + '<span style="font-size:12px;color:#666">Stk.</span>'
                + '</div>';
              out += '</div>';
              return out;
            })()
          : '')
        + '</div>';
    });
    html += '</div></div>';
  });
  return html || '<p style="font-size:12px;color:#666">Keine Darmstädter Angebote für die gewählten Baumarten verfügbar.</p>';
}

// Backward compat wrapper
function renderDarmstPreisCards(selTrees){ return renderDarmstAngebotCards(selTrees); }

function sBezugsquelle(){
  var pv = S.pflanzenVorhanden;
  var isDarmst = S.lieferant === 'darmstaedter';
  var selTrees = getSelTrees();

  var liefOpts = LIEFERANTEN.map(function(l){
    return '<option value="'+l.k+'"'+(S.lieferant===l.k?' selected':'')+'>'
      +(l.is_partner?'⭐ ':'')+esc(l.name)+' ('+esc(l.ort)+')'
      +'</option>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌿 Pflanzen — Bezugsquelle</h2>'
    +'<p>Woher kommen die Pflanzen für Ihr Projekt?</p></div>'
    +'<div class="pf-body">'

    // Frage 1
    +'<div class="pf-field">'
    +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:10px">Haben Sie bereits Pflanzen oder möchten Sie über uns bestellen?</label>'
    +'<div style="display:flex;flex-direction:column;gap:8px">'
    +'<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;border:2px solid '+(pv==='vorhanden'?'#012d1d':'#ddd')+';background:'+(pv==='vorhanden'?'#fafaf7':'#fff')+';cursor:pointer">'
    +'<input type="radio" name="pv-radio" value="vorhanden" '+(pv==='vorhanden'?'checked':'')+' style="accent-color:#012d1d;width:18px;height:18px;flex-shrink:0">'
    +'<div><div style="font-weight:600;color:#2d2d2a">🌱 Pflanzen vorhanden</div><div style="font-size:12px;color:#666;margin-top:2px">Ich bringe eigenes Pflanzgut mit</div></div>'
    +'</label>'
    +'<label style="display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:8px;border:2px solid '+(pv==='bestellen'?'#012d1d':'#ddd')+';background:'+(pv==='bestellen'?'#fafaf7':'#fff')+';cursor:pointer">'
    +'<input type="radio" name="pv-radio" value="bestellen" '+(pv==='bestellen'?'checked':'')+' style="accent-color:#012d1d;width:18px;height:18px;flex-shrink:0">'
    +'<div><div style="font-weight:600;color:#2d2d2a">🛒 Über Koch Aufforstung bestellen</div><div style="font-size:12px;color:#666;margin-top:2px">Wir beschaffen das Pflanzgut von unseren Partnerbaumschulen</div></div>'
    +'</label>'
    +'</div>'
    +'</div>'

    // Bestellbereich (nur wenn 'bestellen')
    +(pv==='bestellen'
      ? '<div id="bez-bestell-section">'

        // Frage 2: Lieferant
        +'<div class="pf-field" style="margin-top:16px">'
        +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:6px">Lieferant wählen</label>'
        +'<p style="font-size:12px;color:#666;margin-bottom:8px">⭐ = Vertragspartner von Koch Aufforstung</p>'
        +'<select class="pf-inp" id="bez-lieferant-sel" style="max-width:100%">'
        +'<option value="">— Baumschule wählen —</option>'
        +liefOpts
        +'</select>'
        +'</div>'

        // Darmstädter Angebot-Karten (wenn Darmstädter gewählt + Baumarten vorhanden)
        +(isDarmst && selTrees.length
          ? '<div style="margin-top:12px;padding:14px;background:#fffdf7;border:1px solid #A3E63544;border-radius:8px">'
            +'<div style="font-size:13px;font-weight:700;color:#A3E635;margin-bottom:4px">📋 Qualität & Herkunft wählen — Darmstädter 2025</div>'
            +'<p style="font-size:11px;color:#666;margin:0 0 12px">Bitte für jede Baumart die gewünschte Qualität, Größe und Herkunft auswählen. Beide Preise (FoVG / FfV/ZüF) sind ausgewiesen.</p>'
            +renderDarmstAngebotCards(selTrees)
            +'</div>'
          : '')

        // Frage 3: Herkunft/HKG
        +'<div class="pf-field" style="margin-top:16px">'
        +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:6px">Herkunft / HKG-Code</label>'
        +(isDarmst
          ? '<p style="font-size:12px;color:#666;margin-bottom:8px">HKG-Codes werden durch die Darmstädter Forstbaumschulen vorgegeben (abhängig von Baumart und Herkunftsgebiet).</p>'
            +'<input class="pf-inp" type="text" id="bez-hkg-inp" value="'+esc(S.herkunftCode)+'" placeholder="z.B. 81001 (aus Preisliste entnehmen)" style="max-width:300px">'
          : '<input class="pf-inp" type="text" id="bez-hkg-inp" value="'+esc(S.herkunftCode)+'" placeholder="HKG-Code (optional, z.B. 810 01)" style="max-width:300px">'
         )
        +'</div>'

        // Frage 4: Lieferort
        +'<div class="pf-field" style="margin-top:16px">'
        +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:8px">Lieferort</label>'
        +'<div style="display:flex;flex-direction:column;gap:8px">'
        +[
          ['forststrasse','🚛 An Forststraße liefern','LKW-zugängliche Forststraße'],
          ['pflanzflaeche','🌲 An Pflanzfläche liefern','Direktanlieferung an die Aufforstungsfläche'],
          ['selbst','🏭 Selbst abholen','Abholung direkt bei der Baumschule'],
        ].map(function(o){
          var isOn = S.lieferort === o[0];
          return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#ddd')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer">'
            +'<input type="radio" name="lieferort-radio" value="'+o[0]+'" '+(isOn?'checked':'')+' style="accent-color:#012d1d;width:16px;height:16px;flex-shrink:0">'
            +'<div><div style="font-weight:600;color:#2d2d2a;font-size:13px">'+o[1]+'</div><div style="font-size:11px;color:#666;margin-top:1px">'+o[2]+'</div></div>'
            +'</label>';
        }).join('')
        +'</div>'
        +'</div>'

        // Adresse + Befahrbarkeit (nur bei Lieferung, nicht bei Selbstabholung)
        +((S.lieferort === 'forststrasse' || S.lieferort === 'pflanzflaeche')
          ? '<div style="margin-top:14px;padding:14px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px">'
            +'<div style="font-size:13px;font-weight:700;color:#2d2d2a;margin-bottom:10px">📍 Lieferdetails</div>'

            // Adressfeld
            +'<div class="pf-field">'
            +'<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Lieferadresse <span style="color:#666;font-weight:400">(optional)</span></label>'
            +'<input class="pf-inp" type="text" id="bez-lieferadresse" value="'+esc(S.lieferAdresse)+'" '
            +'placeholder="Straße, Hausnummer, PLZ, Ort" '
            +'style="max-width:420px">'
            +'</div>'

            // Maps Link
            +'<div class="pf-field" style="margin-top:10px">'
            +'<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Alternativ: Google Maps Link / Koordinaten <span style="color:#666;font-weight:400">(optional)</span></label>'
            +'<input class="pf-inp" type="text" id="bez-mapslink" value="'+esc(S.lieferMapsLink)+'" '
            +'placeholder="z.B. https://maps.google.com/... oder 49.123, 8.456" '
            +'style="max-width:420px">'
            +'</div>'

            // Befahrbarkeit
            +'<div class="pf-field" style="margin-top:14px">'
            +'<label style="font-size:13px;font-weight:700;display:block;margin-bottom:8px">Befahrbarkeit der Zufahrt</label>'
            +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">'
            +[
              ['lkw',           '🚛','LKW-befahrbar','bis 26t'],
              ['kleintransporter','🚐','Kleintransporter','bis 3,5t'],
              ['traktor',       '🚜','Nur Traktor/Forstmaschine','forstwirtschaftliche Fahrzeuge'],
              ['unbekannt',     '❓','Unbekannt','Angabe nicht möglich'],
            ].map(function(o){
              var isOn = S.befahrbarkeit === o[0];
              return '<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#ddd')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer">'
                +'<input type="radio" name="befahrbarkeit-radio" value="'+o[0]+'" '+(isOn?'checked':'')+' style="accent-color:#012d1d;width:16px;height:16px;flex-shrink:0">'
                +'<div><div style="font-weight:600;color:#2d2d2a;font-size:12px">'+o[1]+' '+o[2]+'</div>'
                +'<div style="font-size:10px;color:#666;margin-top:1px">'+o[3]+'</div></div>'
                +'</label>';
            }).join('')
            +'</div>'
            +'</div>'
            +'</div>'
          : '')

        +'</div>' // bez-bestell-section
      : '')

    +'<div class="pf-err" id="e-bez"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-bez">← Zurück</button>'
    +'<button class="pf-btn p" id="n-bez">Weiter →</button>'
    +'</div></div>';
}

function bindBezugsquelle(){
  // Radio: Pflanzen vorhanden / bestellen
  document.querySelectorAll('[name="pv-radio"]').forEach(function(radio){
    radio.addEventListener('change', function(){
      S.pflanzenVorhanden = this.value;
      render();
    });
  });

  // Lieferant dropdown
  var liefSel = document.getElementById('bez-lieferant-sel');
  if(liefSel){
    liefSel.addEventListener('change', function(){
      S.lieferant = this.value;
      render();
    });
  }

  // Darmstädter Angebot-Karten (neues System)
  document.querySelectorAll('.darmst-angebot-card').forEach(function(card){
    card.addEventListener('click', function(e){
      // Don't trigger if clicking menge input or price radio buttons
      if(e.target.classList.contains('darmst-menge-inp')) return;
      if(e.target.type === 'radio') return;
      if(e.target.tagName === 'INPUT') return;
      var tree = this.dataset.tree;
      var idx = parseInt(this.dataset.idx);
      var angebote = DARMST_ANGEBOTE[tree];
      if(!angebote || !angebote[idx]) return;
      var an = angebote[idx];
      var t = TM[tree];
      // Toggle selection
      var existIdx = -1;
      for(var i=0; i<S.selectedAngebote.length; i++){
        if(S.selectedAngebote[i].baumart_key === tree && S.selectedAngebote[i].q === an.q && S.selectedAngebote[i].h === an.h){
          existIdx = i; break;
        }
      }
      if(existIdx >= 0){
        S.selectedAngebote.splice(existIdx, 1);
      } else {
        // Remove other selections for same tree (only one quality per tree)
        S.selectedAngebote = S.selectedAngebote.filter(function(sa){ return sa.baumart_key !== tree; });
        S.selectedAngebote.push({
          baumart_key: tree,
          baumart_name: t ? t.name : tree,
          q: an.q, h: an.h,
          hkg: an.hkg, hkgs: an.hkgs,
          fovg: an.fovg, ffv: an.ffv,
          menge: S.treeQty[tree] || 100
        });
        // Also update selectedPreise for backward compat
        S.selectedPreise[tree] = {q: an.q, h: an.h, p: an.fovg};
      }
      render();
    });
  });

  // Menge-Inputs in Angebot-Karten
  document.querySelectorAll('.darmst-menge-inp').forEach(function(inp){
    inp.addEventListener('change', function(){
      var tree = this.dataset.tree;
      var idx = parseInt(this.dataset.idx);
      var angebote = DARMST_ANGEBOTE[tree];
      if(!angebote || !angebote[idx]) return;
      var an = angebote[idx];
      for(var i=0; i<S.selectedAngebote.length; i++){
        if(S.selectedAngebote[i].baumart_key === tree && S.selectedAngebote[i].q === an.q && S.selectedAngebote[i].h === an.h){
          S.selectedAngebote[i].menge = Math.max(50, parseInt(this.value) || 100);
          break;
        }
      }
    });
  });

  // HKG input
  var hkgInp = document.getElementById('bez-hkg-inp');
  if(hkgInp) hkgInp.addEventListener('input', function(){ S.herkunftCode = this.value; });

  // Lieferort radio
  document.querySelectorAll('[name="lieferort-radio"]').forEach(function(radio){
    radio.addEventListener('change', function(){
      S.lieferort = this.value;
      // Reset address fields when switching to selbst
      if(this.value === 'selbst'){
        S.lieferAdresse = ''; S.lieferMapsLink = ''; S.befahrbarkeit = '';
      }
      render();
    });
  });

  // Lieferadresse
  var adresseInp = document.getElementById('bez-lieferadresse');
  if(adresseInp) adresseInp.addEventListener('input', function(){ S.lieferAdresse = this.value; });

  // Maps Link
  var mapsInp = document.getElementById('bez-mapslink');
  if(mapsInp) mapsInp.addEventListener('input', function(){ S.lieferMapsLink = this.value; });

  // Befahrbarkeit radio
  document.querySelectorAll('[name="befahrbarkeit-radio"]').forEach(function(radio){
    radio.addEventListener('change', function(){
      S.befahrbarkeit = this.value;
    });
  });

  // Back / Forward
  document.getElementById('b-bez').addEventListener('click', function(){ go(0); });
  document.getElementById('n-bez').addEventListener('click', function(){
    if(!S.pflanzenVorhanden){ showErr('e-bez','Bitte wählen Sie eine Option.'); return; }
    if(S.pflanzenVorhanden==='bestellen'){
      if(!S.lieferant){ showErr('e-bez','Bitte Lieferant auswählen.'); return; }
      if(!S.lieferort){ showErr('e-bez','Bitte Lieferort angeben.'); return; }
    }
    go(2);
  });
}

// ── Bezugsquelle Summary Row ──────────────────────────────────────────────────
function bezugsquelleSumRow(){
  if(!S.bezugsquelle) return '';
  if(S.bezugsquelle === 'vorhanden'){
    return '<div class="pf-sum-row"><span class="pf-sum-lbl">Bezugsquelle</span><span style="color:#012d1d;font-weight:600">🌱 Pflanzen vorhanden (eigenes Pflanzgut)</span></div>';
  }
  var lief = LIEFERANTEN.find(function(l){ return l.k === S.lieferant; });
  var liefName = lief ? lief.name : S.lieferant;
  var liefOrtMap = {forststrasse:'🚛 An Forststraße liefern',pflanzflaeche:'🌲 An Pflanzfläche liefern',selbst:'🏭 Selbst abholen'};
  var befahrMap = {lkw:'🚛 LKW-befahrbar (bis 26t)',kleintransporter:'🚐 Kleintransporter (bis 3,5t)',traktor:'🚜 Nur Traktor/Forstmaschine',unbekannt:'❓ Unbekannt'};
  var rows = '<div class="pf-sum-row"><span class="pf-sum-lbl">Bezugsquelle</span><span>🛒 Über Koch Aufforstung<br><small style="color:#666">'+esc(liefName)+'</small></span></div>';
  if(S.lieferort) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Lieferort</span><span>'+(liefOrtMap[S.lieferort]||S.lieferort)+'</span></div>';
  if(S.lieferAdresse) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Lieferadresse</span><span>'+esc(S.lieferAdresse)+'</span></div>';
  if(S.lieferBundesland) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Bundesland</span><span>'+esc(S.lieferBundesland)+'</span></div>';
  if(S.lieferMapsLink) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Maps / Koordinaten</span><span style="word-break:break-all;font-size:12px">'+esc(S.lieferMapsLink)+'</span></div>';
  if(S.befahrbarkeit) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Befahrbarkeit</span><span>'+(befahrMap[S.befahrbarkeit]||S.befahrbarkeit)+'</span></div>';
  if(S.herkunftCode) rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">HKG-Code</span><span>'+esc(S.herkunftCode)+'</span></div>';

  // Darmstädter Angebote (neues System)
  if(S.lieferant === 'darmstaedter' && S.selectedAngebote && S.selectedAngebote.length){
    var angCards = S.selectedAngebote.map(function(sa){
      return '<div style="margin-bottom:6px;padding:8px 10px;background:#fff;border:1px solid #A3E63544;border-radius:6px">'
        +'<div style="font-size:12px;font-weight:700;color:#2d2d2a">'+esc(sa.baumart_name)+' '+esc(sa.q)+(sa.h&&sa.h!=='–'?' | '+esc(sa.h):'')+'</div>'
        +'<div style="font-size:11px;color:#666;margin:2px 0">Herkunft: '+esc(sa.hkg)+'</div>'
        +'<div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">'
        +(sa.preistyp==='ffv' && sa.ffv
          ? '<span style="font-size:11px;background:rgba(163,230,53,0.06);border-radius:4px;padding:2px 8px;color:#A3E635;font-weight:700">✓ FfV/ZüF: '+fmt(sa.ffv)+' €/100 Stk.</span>'
            +'<span style="font-size:11px;background:#f5f5f5;border-radius:4px;padding:2px 8px;color:#666">FoVG: '+fmt(sa.fovg)+' €/100 Stk.</span>'
          : '<span style="font-size:11px;background:#f0faf8;border-radius:4px;padding:2px 8px;color:#012d1d;font-weight:700">✓ FoVG: '+fmt(sa.fovg)+' €/100 Stk.</span>'
            +(sa.ffv ? '<span style="font-size:11px;background:#f5f5f5;border-radius:4px;padding:2px 8px;color:#666">FfV/ZüF: '+fmt(sa.ffv)+' €/100 Stk.</span>' : ''))
        +'<span style="font-size:11px;color:#666">× '+fmt(sa.menge)+' Stk.</span>'
        +'</div>'
        +'</div>';
    }).join('');
    rows += '<div class="pf-sum-row" style="flex-direction:column;align-items:flex-start"><span class="pf-sum-lbl">Ausgewählte Angebote</span>'
      +'<div style="width:100%;margin-top:6px">'+angCards+'</div></div>';
  } else if(Object.keys(S.selectedPreise||{}).length){
    rows += '<div class="pf-sum-row"><span class="pf-sum-lbl">Bestellte Qualitäten</span>'
      +'<div style="display:flex;flex-wrap:wrap;gap:4px">'
      +Object.keys(S.selectedPreise).map(function(k){
        var p=S.selectedPreise[k]; var t=TM[k];
        return t?'<span class="pf-tag" style="background:#F8F9F5;color:#012d1d;font-size:11px">'+esc(t.name)+': '+esc(p.q)+(p.h&&p.h!=='–'?' '+esc(p.h):'')+' — '+p.p+'€/100</span>':'';
      }).join('')+'</div></div>';
  }
  return rows;
}


// ═══════════════════════════════════════════════════════════════════════════
// NEUE SCHRITTE: Neuer Flow (Fläche → Förder → Bezugsquelle → 3A/3B/3C/3D → Lieferort → Kontakt+Summary)
// ═══════════════════════════════════════════════════════════════════════════

// ── Step 0 (NEU): Fläche & Rahmendaten ───────────────────────────────────────
function sFlaeche(){
  var fl = S.flaechen[0];
  var verbandOpts = [
    ['reihe','Reihenpflanzung'],['quincunx','Quincunx'],['trupp','Truppweise'],
    ['nester','Nesterweise'],['streifen','Streifenpflanzung'],['frei','Freie Anordnung']
  ].map(function(o){
    var isOn = (fl.verbandMethode||'reihe') === o[0];
    return '<label style="display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:7px;border:2px solid '+(isOn?'#012d1d':'#ddd')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer;font-size:12px">'
      +'<input type="radio" name="verband-radio" value="'+o[0]+'" '+(isOn?'checked':'')+' style="accent-color:#012d1d"> '+o[1]+'</label>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🗺️ Fläche & Rahmendaten</h2>'
    +'<p>Bitte geben Sie die Basisdaten Ihrer Aufforstungsfläche an.</p></div>'
    +'<div class="pf-body">'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Zuständiges Forstamt</label>'
    +'<input class="pf-inp" type="text" id="fl-forstamt" value="'+esc(fl.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Revier</label>'
    +'<input class="pf-inp" type="text" id="fl-revier" value="'+esc(fl.revier)+'" placeholder="z.B. Revier 3" autocomplete="off"></div>'
    +'</div>'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Flächengröße (ha) *</label>'
    +'<input class="pf-inp" type="text" inputmode="decimal" id="fl-ha" value="'+esc(fl.ha)+'" placeholder="z.B. 2.5" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Postleitzahl</label>'
    +'<input class="pf-inp" type="text" inputmode="numeric" id="fl-plz" value="'+esc(fl.plz||'')+'" placeholder="z.B. 83052" maxlength="5" autocomplete="off"></div>'
    +'</div>'

    +'<div class="pf-field">'
    +'<label>Ort / Gemeinde</label>'
    +'<input class="pf-inp" type="text" id="fl-ort" value="'+esc(fl.ort||'')+'" placeholder="z.B. Rosenheim" autocomplete="off"></div>'
    +'</div>'
    +'<div class="pf-field">'
    +'<label>GPS-Koordinaten <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<input type="text" id="gps-'+fl.id+'" placeholder="z.B. 51.1234, 8.5678" style="flex:1;border:1px solid var(--n300,#d1d5db);border-radius:6px;padding:8px 10px;font-size:14px" oninput="updateGPS(this.value,'+fl.id+')" value="">'
    +'<button type="button" onclick="getMyLocation('+fl.id+')" style="padding:8px 12px;background:#012d1d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap">\ud83d\udccd Standort</button>'
    +'</div>'
    +'<div id="gps-info-'+fl.id+'" style="font-size:11px;color:#666;margin-top:3px"></div>'
    +'</div>'

    +'<div class="pf-field" style="margin-top:16px">'
    +'<label style="font-weight:700;font-size:14px">Pflanzverband</label>'
    +'<p style="font-size:12px;color:#666;margin:4px 0 10px">Abstände zwischen den Pflanzen</p>'
    +'<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;margin-bottom:12px">'
    +'<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Pflanzenabstand (m)</label>'
    +'<input class="pf-inp" type="number" min="0.5" max="10" step="0.1" id="fl-abstand-p" value="'+(fl.abstand_p||'2.0')+'" style="width:90px"></div>'
    +'<div><label style="font-size:12px;color:#555;display:block;margin-bottom:4px">Reihenabstand (m)</label>'
    +'<input class="pf-inp" type="number" min="0.5" max="10" step="0.1" id="fl-abstand-r" value="'+(fl.abstand_r||'2.0')+'" style="width:90px"></div>'
    +'</div>'
    +'<label style="font-size:12px;font-weight:600;display:block;margin-bottom:6px">Pflanzanordnung</label>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px">'+verbandOpts+'</div>'
    +'</div>'

    // Pflanzverband-Vorschau
    +'<div style="margin-top:12px;padding:14px;background:#f8f8f6;border-radius:8px;border:1px solid #d0cfc7">'
    +'<div style="font-size:11px;font-weight:700;color:#012d1d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🌱 Pflanzverband-Vorschau</div>'
    +'<div id="pv-preview-'+fl.id+'" style="min-height:40px"></div>'
    +'</div>'

    +'<div class="pf-field" style="margin-top:10px">'
    +'<label>Beschreibung / Sonderwünsche zum Pflanzverband (optional)</label>'
    +'<textarea class="pf-inp" id="fl-verbandfreitext" rows="2" placeholder="z.B. Außenreihe Weißdorn als Windschutz, Klumpen im Zentrum...">'+esc(fl.verbandFreitext||'')+'</textarea>'
    +'</div>'

    +'<div class="pf-err" id="e-fl"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-fl">← Zurück</button>'
    +'<button class="pf-btn p" id="n-fl">Weiter →</button>'
    +'</div></div>';
}

function bindFlaeche(){
  var fl = S.flaechen[0];
  var fields = [['fl-forstamt','forstamt'],['fl-revier','revier'],['fl-ha','ha'],['fl-plz','plz'],['fl-ort','ort'],['fl-abstand-p','abstand_p'],['fl-abstand-r','abstand_r']];
  fields.forEach(function(pair){
    var el = document.getElementById(pair[0]);
    if(el) el.addEventListener('input', function(){ fl[pair[1]] = this.value; drawPflanzverband(fl.id); });
  });
  // Task 2: PLZ onBlur → Forstamt Smart Suggest
  var plzEl=document.getElementById('fl-plz');
  if(plzEl) plzEl.addEventListener('blur',function(){
    var plz=this.value;
    if(!plz||plz.length<3) return;
    fetch('https://ka-forstmanager.vercel.app/api/public/forstamt?plz='+encodeURIComponent(plz))
      .then(function(r){return r.json();})
      .then(function(data){
        if(!data||!data.length) return;
        var faInp=document.getElementById('fl-forstamt');
        if(faInp&&!faInp.value){
          faInp.value=data[0].name;
          fl.forstamt=data[0].name;
        }
        var dlId='dl-fa-single';
        var dl=document.getElementById(dlId);
        if(!dl){ dl=document.createElement('datalist'); dl.id=dlId; document.body.appendChild(dl); }
        dl.innerHTML=data.map(function(d){return '<option value="'+esc(d.name)+'">'+esc(d.plz+' '+d.ort)+'</option>';}).join('');
        if(faInp) faInp.setAttribute('list',dlId);
      })
      .catch(function(){});
  });
  document.querySelectorAll('[name="verband-radio"]').forEach(function(r){
    r.addEventListener('change', function(){ fl.verbandMethode = this.value; render(); });
  });
  var bFl = document.getElementById('b-fl');
  if(bFl) bFl.addEventListener('click', function(){ go(1); });
  document.getElementById('n-fl').addEventListener('click', function(){
    fl.forstamt = document.getElementById('fl-forstamt').value;
    fl.revier = document.getElementById('fl-revier').value;
    fl.ha = document.getElementById('fl-ha').value;
    fl.plz = document.getElementById('fl-plz').value;
    fl.ort = document.getElementById('fl-ort').value;
    if(!fl.ha||isNaN(parseFloat(fl.ha))){ showErr('e-fl','Bitte gültige Flächengröße in Hektar eingeben.'); return; }
    go(3);
  });
  // Sync treeQty aus eigenePflanzen (Pfad A) oder selectedAngebote (Pfad B) → für Pflanzverband-Vorschau
  if((S.bezugsquelle === 'vorhanden' || S.lieferant !== 'darmstaedter') && S.eigenePflanzen && S.eigenePflanzen.length){
    // Reset treeQty, dann eigenePflanzen einspeisen
    S.eigenePflanzen.forEach(function(ep){
      var t = TREES.find(function(t){ return t.name === ep.baumart; });
      if(t){ S.treeQty[t.k] = Math.max(1, parseInt(ep.menge)||0); }
      else { var k=ep.baumart.toLowerCase().replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-z0-9]/g,''); S.treeQty[k] = Math.max(1, parseInt(ep.menge)||0); }
    });
  } else if(S.bezugsquelle === 'bestellen' && S.selectedAngebote && S.selectedAngebote.length){
    S.selectedAngebote.forEach(function(sa){
      if(sa.baumart_key) S.treeQty[sa.baumart_key] = Math.max(1, parseInt(sa.menge)||100);
    });
  }
  // Initiale Vorschau zeichnen
  drawPflanzverband(fl.id);
}

// ── Step 1 (NEU): Fördercheck ─────────────────────────────────────────────────
function sFoerdercheck(){
  var blOptions = ['BY:Bayern','HE:Hessen','NRW:Nordrhein-Westfalen','RP:Rheinland-Pfalz','TH:Thüringen','BW:Baden-Württemberg','NI:Niedersachsen','SN:Sachsen','ST:Sachsen-Anhalt','MV:Mecklenburg-Vorpommern','BB:Brandenburg','SL:Saarland','SH:Schleswig-Holstein'].map(function(opt){
    var p = opt.split(':');
    return '<option value="'+p[0]+'"'+(S.bundesland===p[0]?' selected':'')+'>'+p[1]+'</option>';
  }).join('') + '<option value="DEFAULT"'+(S.bundesland==='DEFAULT'?' selected':'')+'>Anderes Bundesland</option>';

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🏦 Fördercheck</h2>'
    +'<p>Viele Aufforstungsmaßnahmen werden mit <strong>50–90%</strong> gefördert. Prüfen Sie passende Programme für Ihr Bundesland.</p></div>'
    +'<div class="pf-body">'

    +'<div class="pf-field">'
    +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:8px">Bundesland</label>'
    +'<select class="pf-inp" id="i-bl-fc"><option value="">— Bundesland wählen —</option>'+blOptions+'</select>'
    +'</div>'

    +'<div id="foerder-prog-list-fc" style="margin-top:12px">'
    +(S.bundesland ? '' : '<p style="font-size:12px;color:#666;margin:0;font-style:italic">Bundesland wählen um passende Programme zu sehen</p>')
    +'</div>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:16px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7">'
    +'<input type="checkbox" id="i-foerder-fc" '+(S.foerderBeratungS2?'checked':'')+' style="width:18px;height:18px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span style="font-size:13px;line-height:1.4"><strong>Förderberatung anfragen</strong><br><small style="color:#666">Wir prüfen kostenlos alle Fördermöglichkeiten für Ihr konkretes Projekt und unterstützen bei der Antragstellung.</small></span>'
    +'</label>'

    +'<div class="pf-err" id="e-fc"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-fc">← Zurück</button>'
    +'<button class="pf-btn p" id="n-fc">Weiter →</button>'
    +'</div></div>';
}

function bindFoerdercheck(){
  var blSel = document.getElementById('i-bl-fc');
  if(S.bundesland && blSel) renderFoerderProgs(S.bundesland, 'foerder-prog-list-fc');
  if(blSel){
    blSel.addEventListener('change', function(){
      S.bundesland = this.value;
      if(this.value) renderFoerderProgs(this.value, 'foerder-prog-list-fc');
      else { var el=document.getElementById('foerder-prog-list-fc'); if(el) el.innerHTML='<p style="font-size:12px;color:#666;margin:0;font-style:italic">Bundesland wählen um passende Programme zu sehen</p>'; }
    });
  }
  var cb = document.getElementById('i-foerder-fc');
  if(cb) cb.addEventListener('change', function(){ S.foerderBeratungS2 = this.checked; });
  document.getElementById('b-fc').addEventListener('click', function(){ go(2); });
  document.getElementById('n-fc').addEventListener('click', function(){ go(4); });
}

// ── Step 2 (NEU): Bezugsquelle ────────────────────────────────────────────────
function sBezugsquelle2(){
  var bq = S.bezugsquelle;
  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌿 Pflanzen</h2>'
    +'<p>Sind Pflanzen bereits vorhanden oder sollen wir diese mitbestellen?</p></div>'
    +'<div class="pf-body">'
    +'<div class="pf-field">'
    +'<div style="display:flex;flex-direction:column;gap:10px">'

    // Karte: Pflanzen vorhanden
    +'<div class="bq-card" data-val="vorhanden" style="display:flex;align-items:flex-start;gap:14px;padding:16px;border-radius:10px;border:2px solid '+(bq==='vorhanden'?'#012d1d':'#ddd')+';background:'+(bq==='vorhanden'?'#fafaf7':'#fff')+';cursor:pointer;transition:border-color 0.15s,background 0.15s">'
    +'<span style="font-size:28px;flex-shrink:0;line-height:1">🌱</span>'
    +'<div style="flex:1">'
    +'<div style="font-weight:700;font-size:15px;color:'+(bq==='vorhanden'?'#012d1d':'#2d2d2a')+'">Pflanzen bereits vorhanden</div>'
    +'<div style="font-size:13px;color:#666;margin-top:3px">Nur Pflanzung — ich bringe eigenes Pflanzgut mit</div>'
    +'</div>'
    +(bq==='vorhanden'?'<span style="color:#012d1d;font-size:20px;flex-shrink:0;align-self:center">✓</span>':'')
    +'</div>'

    // Info-Hinweis wenn "vorhanden" gewählt
    +(bq==='vorhanden'
      ? '<div style="padding:12px 14px;background:#f8f8f6;border:1px solid #d0cfc7;border-radius:8px;font-size:13px;color:#012d1d">'
        +'ℹ️ Bitte halten Sie Baumart und Stückzahl bereit — diese werden im nächsten Schritt abgefragt.'
        +'</div>'
      : '')

    // Karte: Pflanzen mitbestellen
    +'<div class="bq-card" data-val="bestellen" style="display:flex;align-items:flex-start;gap:14px;padding:16px;border-radius:10px;border:2px solid '+(bq==='bestellen'?'#012d1d':'#ddd')+';background:'+(bq==='bestellen'?'#fafaf7':'#fff')+';cursor:pointer;transition:border-color 0.15s,background 0.15s">'
    +'<span style="font-size:28px;flex-shrink:0;line-height:1">🛒</span>'
    +'<div style="flex:1">'
    +'<div style="font-weight:700;font-size:15px;color:'+(bq==='bestellen'?'#012d1d':'#2d2d2a')+'">Pflanzen mitbestellen</div>'
    +'<div style="font-size:13px;color:#666;margin-top:3px">Wir beschaffen das Pflanzgut — Lieferung direkt zur Fläche</div>'
    +'</div>'
    +(bq==='bestellen'?'<span style="color:#012d1d;font-size:20px;flex-shrink:0;align-self:center">✓</span>':'')
    +'</div>'

    +'</div>'
    +'<div class="pf-err" id="e-bq"></div>'
    +'</div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-bq">← Zurück</button>'
    +'<button class="pf-btn p" id="n-bq">Weiter →</button>'
    +'</div></div>';
}

function bindBezugsquelle2(){
  document.querySelectorAll('.bq-card').forEach(function(card){
    card.addEventListener('click', function(){
      S.bezugsquelle = this.dataset.val;
      render();
    });
  });
  // Step 0 = Bezugsquelle = START, kein Zurück
  var bBq = document.getElementById('b-bq');
  if(bBq) bBq.style.visibility = 'hidden';
  document.getElementById('n-bq').addEventListener('click', function(){
    if(!S.bezugsquelle){ showErr('e-bq','Bitte eine Option wählen.'); return; }
    if(S.bezugsquelle === 'vorhanden') go(10);
    else go(20);
  });
}

// ── Step 3A (30): Pflanzauswahl — eigene Pflanzen ─────────────────────────────
function sPflanzauswahl(){
  var html = '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌲 Pflanzauswahl</h2>'
    +'<p>Welche Baumarten bringen Sie mit? Wählen Sie Art und Menge.</p></div>'
    +'<div class="pf-body">'
    +'<p style="font-size:12px;color:#666;margin-bottom:12px">Mehrere Baumarten auswählbar. Mindestmenge: 50 Stk. je Art.</p>'
    +'<div class="ka-search-wrap" style="margin-bottom:10px"><input type="text" id="ka-search-a" placeholder="🔍 Pflanze suchen..." style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box" oninput="window.kaFilterEigenePflanzen(this.value)"></div>'
    +'<div style="display:flex;flex-direction:column;gap:6px">';

  ALLE_BAUMARTEN_FOVG.forEach(function(baumart){
    var existing = S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; });
    var isOn = !!existing;
    var menge = existing ? existing.menge : 100;
    html += '<div class="ep-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#e0e0e0')+';background:'+(isOn?'#fafaf7':'#fff')+'">'
      +'<input type="checkbox" class="ep-cb" data-baumart="'+esc(baumart)+'" '+(isOn?'checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;cursor:pointer">'
      +'<span style="flex:1;font-size:13px;font-weight:'+(isOn?'700':'500')+';color:#2d2d2a">'+esc(baumart)+'</span>'
      +(HKG_PRO_BAUMART[baumart] ? '<span class="pf-badge-fovg">⚖️ FoVG</span>' : '<span style="font-size:10px;color:#666;background:#f5f5f5;border-radius:4px;padding:2px 6px;flex-shrink:0">frei</span>')
      +(isOn ? '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0"><label style="font-size:11px;color:#555">Menge:</label><input type="number" class="ep-menge pf-inp" data-baumart="'+esc(baumart)+'" value="'+menge+'" min="50" step="50" style="width:80px;padding:4px 8px;font-size:13px" onclick="event.stopPropagation()"><span style="font-size:11px;color:#666">Stk.</span></div>' : '')
      +'</div>';
  });

  html += '</div>'
    +'<div class="pf-err" id="e-pa"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-pa">← Zurück</button>'
    +'<button class="pf-btn p" id="n-pa">Weiter →</button>'
    +'</div></div>';
  return html;
}

function bindPflanzauswahl(){
  var _srA = document.getElementById('ka-search-a');
  if(_srA && _kaSearchA){ _srA.value = _kaSearchA; kaFilterEigenePflanzen(_kaSearchA); }
  document.querySelectorAll('.ep-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var baumart = this.dataset.baumart;
      if(this.checked){
        if(!S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; })){
          S.eigenePflanzen.push({baumart: baumart, menge: 100});
        }
      } else {
        S.eigenePflanzen = S.eigenePflanzen.filter(function(ep){ return ep.baumart !== baumart; });
      }
      render();
    });
  });
  document.querySelectorAll('.ep-menge').forEach(function(inp){
    inp.addEventListener('change', function(){
      var baumart = this.dataset.baumart;
      var ep = S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; });
      if(ep) ep.menge = Math.max(50, parseInt(this.value)||100);
    });
    inp.addEventListener('click', function(e){ e.stopPropagation(); });
  });
  document.getElementById('b-pa').addEventListener('click', function(){ go(0); });
  document.getElementById('n-pa').addEventListener('click', function(){
    if(S.eigenePflanzen.length === 0){ showErr('e-pa','Bitte mindestens eine Baumart mit Menge angeben.'); return; }
    go(11);
  });
}

// ── Step 3B (32): Herkunft je Baumart ────────────────────────────────────────
function sHerkunftEigen(){
  var html = '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🔖 Herkunft je Baumart (HKG)</h2>'
    +'<p>Für FoVG-regulierte Baumarten bitte das Herkunftsgebiet (HKG-Code) angeben.</p></div>'
    +'<div class="pf-body">';

  S.eigenePflanzen.forEach(function(ep){
    var hkgCodes = HKG_PRO_BAUMART[ep.baumart];
    var curHerkunft = S.eigenePflanzenHerkunft.find(function(h){ return h.baumart === ep.baumart; });
    var curCode = curHerkunft ? curHerkunft.hkg_code : '';

    html += '<div style="margin-bottom:16px;padding:14px;border:1px solid #e0e0d8;border-radius:10px;background:#fafaf8">';
    html += '<div style="font-size:14px;font-weight:700;color:#2d2d2a;margin-bottom:6px">🌲 '+esc(ep.baumart)+'</div>';
    html += '<div style="font-size:12px;color:#666;margin-bottom:8px">Menge: '+fmt(ep.menge)+' Stk.</div>';

    if(hkgCodes && hkgCodes.length){
      html += '<label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">HKG-Code <span class="pf-badge-fovg">⚖️ FoVG</span></label>';
      html += '<select class="pf-inp hkg-eigen-sel" data-baumart="'+esc(ep.baumart)+'" style="max-width:100%">';
      html += '<option value="unbekannt"'+(curCode==='unbekannt'?' selected':'')+'>— Unbekannt / nicht relevant</option>';
      hkgCodes.forEach(function(code){
        html += '<option value="'+esc(code)+'"'+(curCode===code?' selected':'')+'>'+esc(hkgLabel(code))+'</option>';
      });
      html += '</select>';
    } else {
      html += '<div style="font-size:12px;color:#666;background:#f5f5f5;padding:8px 12px;border-radius:6px">Nicht FoVG-reguliert — kein Herkunftsnachweis erforderlich</div>';
      // Store auto n/a
      if(!S.eigenePflanzenHerkunft.find(function(h){ return h.baumart === ep.baumart; })){
        S.eigenePflanzenHerkunft.push({baumart: ep.baumart, hkg_code: 'n/a'});
      }
    }
    html += '</div>';
  });

  html += '<div class="pf-err" id="e-he"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-he">← Zurück</button>'
    +'<button class="pf-btn p" id="n-he">Weiter →</button>'
    +'</div></div>';
  return html;
}

function bindHerkunftEigen(){
  document.querySelectorAll('.hkg-eigen-sel').forEach(function(sel){
    sel.addEventListener('change', function(){
      var baumart = this.dataset.baumart;
      var existing = S.eigenePflanzenHerkunft.find(function(h){ return h.baumart === baumart; });
      if(existing) existing.hkg_code = this.value;
      else S.eigenePflanzenHerkunft.push({baumart: baumart, hkg_code: this.value});
    });
    // Init state if not set
    var baumart = sel.dataset.baumart;
    if(!S.eigenePflanzenHerkunft.find(function(h){ return h.baumart === baumart; })){
      S.eigenePflanzenHerkunft.push({baumart: baumart, hkg_code: sel.value || 'unbekannt'});
    }
  });
  document.getElementById('b-he').addEventListener('click', function(){ go(10); });
  // Vorhanden-Pfad: Lieferort überspringen, direkt zu Flächendetails (Schritt 2)
  document.getElementById('n-he').addEventListener('click', function(){ go(2); });
}

// ── Step 3C (31): Lieferant wählen ──────────────────────────────────────────
function sLieferantWahl(){
  var lief = S.lieferant;
  var istAndere = (lief === 'andere');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🛒 Pflanzen mitbestellen</h2>'
    +'<p>Wählen Sie Ihre bevorzugte Baumschule und geben Sie die Lieferadresse an.</p></div>'
    +'<div class="pf-body">'

    // Lieferanten-Auswahl (vereinfacht)
    +'<div class="pf-field">'
    +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:8px">Baumschule</label>'
    +'<select class="pf-inp" id="lw-lieferant-sel" style="max-width:100%">'
    +'<option value="">— Baumschule auswählen —</option>'
    +'<option value="darmstaedter"'+(lief==='darmstaedter'?' selected':'')+'>⭐ Darmstädter Forstbaumschulen (Empfehlung)</option>'
    +'<option value="andere"'+(istAndere?' selected':'')+'>Andere Baumschule (bitte angeben)</option>'
    +'</select>'
    +'</div>'

    // Freitext für "Andere Baumschule"
    +(istAndere
      ? '<div class="pf-field" style="margin-top:10px">'
        +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:6px">Name der Baumschule</label>'
        +'<input class="pf-inp" type="text" id="lw-andere-inp" placeholder="z.B. Baumschule Müller, Freiburg" value="'+esc(S.andereBaumschule||'')+'">'
        +'</div>'
      : '')

    // Info für Darmstädter
    +(lief==='darmstaedter'
      ? '<div style="margin-top:10px;padding:12px 14px;background:#F8F9F5;border:1px solid #A3E63544;border-radius:8px;font-size:12px;color:#012d1d">'
        +'<strong>⭐ Darmstädter Forstbaumschulen GmbH</strong> — Koch Aufforstung Vertragspartner<br>'
        +'Im nächsten Schritt wählen Sie Baumarten, Qualität und Preistierungen aus dem aktuellen Angebot 2025.'
        +'</div>'
      : '')

    +'<div class="pf-err" id="e-lw"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-lw">← Zurück</button>'
    +'<button class="pf-btn p" id="n-lw">Weiter →</button>'
    +'</div></div>';
}

function bindLieferantWahl(){
  var liefSel = document.getElementById('lw-lieferant-sel');
  if(liefSel){
    liefSel.addEventListener('change', function(){
      S.lieferant = this.value;
      render();
    });
  }
  var andereInp = document.getElementById('lw-andere-inp');
  if(andereInp){
    andereInp.addEventListener('input', function(){ S.andereBaumschule = this.value; });
  }

  document.getElementById('b-lw').addEventListener('click', function(){ go(0); });
  document.getElementById('n-lw').addEventListener('click', function(){
    if(!S.lieferant){ showErr('e-lw','Bitte Baumschule auswählen.'); return; }
    if(S.lieferant === 'andere'){
      var andereEl = document.getElementById('lw-andere-inp');
      var andereVal = andereEl ? andereEl.value.trim() : (S.andereBaumschule||'').trim();
      if(!andereVal){ showErr('e-lw','Bitte Name der Baumschule angeben.'); return; }
      S.andereBaumschule = andereVal;
    }
    go(21);
  });
}

// ── Step 3D (33): Baumarten + Qualitäts/Preis-Karten ─────────────────────────
function sBaumArtenPreise(){
  var isDarmst = S.lieferant === 'darmstaedter';
  var liefObj = LIEFERANTEN.find(function(l){ return l.k === S.lieferant; });
  var liefName = liefObj ? liefObj.name : S.lieferant;
  var phase = S.darmstPhase || 1;
  var selBaumarten = S.darmstSelectedBaumarten || [];

  var html = '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌲 Baumarten & Qualitäten</h2>'
    +'<p>Lieferant: <strong>'+esc(liefName)+'</strong></p></div>'
    +'<div class="pf-body">';

  if(isDarmst){
    // PHASE 1: Baumart-Auswahl (Kacheln mit Checkboxes)
    if(phase === 1){
      html += '<p style="font-size:13px;color:#444;margin-bottom:14px">Welche Baumarten benötigen Sie? Mehrfachauswahl möglich.</p>';
      html += '<div class="ka-search-wrap" style="margin-bottom:10px"><input type="text" id="ka-search-b" placeholder="🔍 Pflanze suchen..." style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box" oninput="window.kaFilterDarmstBaumarten(this.value)"></div>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;margin-bottom:16px">';
      var darmstTreeKeys = Object.keys(DARMST_ANGEBOTE).sort(function(a,b){ var na=(TM[a]?TM[a].name:a); var nb=(TM[b]?TM[b].name:b); return na.localeCompare(nb,'de'); });
      darmstTreeKeys.forEach(function(tk){
        var tObj = TM[tk] || {k:tk, name:tk};
        var isOn = selBaumarten.indexOf(tk) >= 0;
        var treeIcons = {rotbuche:'🌳',stieleiche:'🌰',traubeneiche:'🌰',bergahorn:'🍁',spitzahorn:'🍁',schwarzerle:'🌿',hainbuche:'🌿',douglasie:'🌲',weisstanne:'🌲',waldkiefer:'🌲',laerche:'🌲',haselnuss:'🪨',weissdorn:'🌸'};
        var ico = treeIcons[tk] || '🌱';
        html += '<label style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border-radius:10px;border:2px solid '+(isOn?'#012d1d':'#e0e0e0')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer;text-align:center;transition:all 0.15s;position:relative">'
          +'<input type="checkbox" class="darmst-baumart-cb" data-tk="'+tk+'" '+(isOn?'checked':'')+' style="position:absolute;top:8px;right:8px;width:16px;height:16px;accent-color:#012d1d">'
          +'<span style="font-size:28px">'+ico+'</span>'
          +'<span style="font-size:12px;font-weight:'+(isOn?'700':'600')+';color:'+(isOn?'#012d1d':'#2d2d2a')+';line-height:1.3">'+esc(tObj.name)+'</span>'
          +'<span style="font-size:10px;color:#012d1d;background:#F8F9F5;border-radius:4px;padding:2px 6px">bei Darmstädter ✓</span>'
          +'</label>';
      });
      html += '</div>';
      if(selBaumarten.length > 0){
        html += '<div style="padding:12px;background:#F8F9F5;border-radius:8px;border:1px solid #d0cfc7;font-size:13px;color:#012d1d;margin-bottom:8px">'
          +'✅ <strong>'+selBaumarten.length+'</strong> Baumart'+( selBaumarten.length>1?'en':'')+' ausgewählt — klicken Sie auf "Zur Detailauswahl" um Qualität und Menge festzulegen.'
          +'</div>';
        html += '<div class="pf-ft" style="margin-top:0;padding:0">'
          +'<div></div>'
          +'<button class="pf-btn p" id="darmst-detail-btn">Zur Detailauswahl →</button>'
          +'</div>';
      }
    } else {
      // PHASE 2: Detail-Auswahl — je Baumart eine Akkordeon-Karte
      html += '<div style="margin-bottom:12px;display:flex;align-items:center;gap:10px">'
        +'<button class="pf-btn s" id="darmst-back-phase" style="padding:6px 14px;font-size:12px">← Baumarten ändern</button>'
        +'<span style="font-size:13px;color:#555">'+selBaumarten.length+' Baumart'+( selBaumarten.length>1?'en':'')+'</span>'
        +'</div>';
      html += '<p style="font-size:12px;color:#666;margin-bottom:12px">Wählen Sie für jede Baumart Qualität, Herkunft und Menge:</p>';
      html += '<div style="display:flex;flex-direction:column;gap:14px">';
      selBaumarten.forEach(function(tk){
        var tObj = TM[tk] || {k:tk, name:tk};
        var angebote = DARMST_ANGEBOTE[tk] || [];
        // Check if this tree has a selected offering
        var existingAn = null;
        for(var i=0;i<S.selectedAngebote.length;i++){
          if(S.selectedAngebote[i].baumart_key===tk){ existingAn=S.selectedAngebote[i]; break; }
        }
        html += (function(){
        var selCount=S.selectedAngebote.filter(function(x){return x.baumart_key===tk;}).length;
        return '<div style="border:2px solid '+(selCount>0?'#012d1d':'#e0e0e0')+';border-radius:10px;overflow:hidden">';
      })()
          +(function(){
        var selCount2=S.selectedAngebote.filter(function(x){return x.baumart_key===tk;}).length;
        return '<div style="background:'+(selCount2>0?'#fafaf7':'#f9f9f7')+';padding:12px 16px;border-bottom:1px solid #eee;display:flex;align-items:center;gap:8px">';
      })()
          +'<span style="font-size:20px">🌲</span>'
          +(function(){var sc3=S.selectedAngebote.filter(function(x){return x.baumart_key===tk;}).length;return '<strong style="font-size:14px;color:'+(sc3>0?'#012d1d':'#2d2d2a')+'">'+esc(tObj.name)+'</strong>';})()
          +(function(){
          var selForTree=S.selectedAngebote.filter(function(x){return x.baumart_key===tk;});
          if(selForTree.length===0) return '<span style="font-size:11px;color:#666;margin-left:auto">Bitte Größe(n) wählen</span>';
          return '<span style="font-size:11px;color:#012d1d;margin-left:auto">✓ '+selForTree.length+' Größe'+(selForTree.length>1?'n':'')+' gewählt</span>';
        })()
          +'</div>'
          +'<div style="padding:12px 16px">'
          +'<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px">';
        angebote.forEach(function(an, idx){
          // Check if this specific angebot is selected (multiple allowed per baumart)
          var existingForThisAn = null;
          for(var xi=0;xi<S.selectedAngebote.length;xi++){
            var xa=S.selectedAngebote[xi];
            if(xa.baumart_key===tk&&xa.q===an.q&&xa.h===an.h){existingForThisAn=xa;break;}
          }
          var isOn2 = !!existingForThisAn;
          html += '<div style="padding:8px 10px;border-radius:8px;border:2px solid '+(isOn2?'#012d1d':'#ddd')+';background:'+(isOn2?'#fafaf7':'#fff')+';margin-bottom:4px">'
            +'<label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer">'
            +'<input type="checkbox" class="darmst-an-cb" data-tree="'+tk+'" data-idx="'+idx+'" '+(isOn2?'checked':'')+' style="width:16px;height:16px;accent-color:#012d1d;flex-shrink:0;margin-top:3px">'
            +'<div style="flex:1">'
            +'<div style="font-weight:700;color:'+(isOn2?'#012d1d':'#2d2d2a')+';font-size:12px">'+esc(an.q)+(an.h&&an.h!=='–'?' | '+esc(an.h):'')+'</div>'
            +'<div style="font-size:10px;color:#666;margin-top:2px">HKG: '+esc(hkgLabel(an.hkg))+(DARMST_HKG_CODES[tk]&&DARMST_HKG_CODES[tk].length>1?' <span style="color:#666;font-size:10px">(+'+(DARMST_HKG_CODES[tk].length-1)+' weitere)</span>':'')+'</div>'
            +'<div style="display:flex;gap:8px;margin-top:3px;flex-wrap:wrap">'
            +'<span style="color:#012d1d;font-weight:600;font-size:11px">FoVG: '+fmt(an.fovg)+' €/100</span>'
            +(an.ffv?'<span style="color:#A3E635;font-weight:600;font-size:11px">FfV: '+fmt(an.ffv)+' €/100</span>':'')
            +'</div>'
            +(isOn2?(function(){
              var curPT2 = existingForThisAn ? (existingForThisAn.preistyp||'fovg') : 'fovg';
              var curHKG2 = existingForThisAn ? (existingForThisAn.hkg||an.hkg) : an.hkg;
              var hkgCodes2 = DARMST_HKG_CODES[tk] || [an.hkg];
              var ptKey2 = tk+'_'+idx;
              var out2 = '<div style="margin-top:8px" onclick="event.stopPropagation()">';
              if(an.ffv){
                out2 += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">'
                  +'<label style="cursor:pointer;display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;border:1.5px solid '+(curPT2==='fovg'?'#012d1d':'#ccc')+';background:'+(curPT2==='fovg'?'#fafaf7':'#fff')+';font-size:11px;font-weight:'+(curPT2==='fovg'?'700':'500')+'">'
                  +'<input type="radio" name="pt2_'+ptKey2+'" value="fovg" '+(curPT2==='fovg'?'checked':'')+' onchange="window._pfPT(\''+tk+'\','+idx+',\'fovg\')" style="accent-color:#012d1d" onclick="event.stopPropagation()">'
                  +' FoVG '+fmt(an.fovg)+' \u20ac/100'
                  +'</label>'
                  +'<label style="cursor:pointer;display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:6px;border:1.5px solid '+(curPT2==='ffv'?'#A3E635':'#ccc')+';background:'+(curPT2==='ffv'?'#fffdf0':'#fff')+';font-size:11px;font-weight:'+(curPT2==='ffv'?'700':'500')+'">'
                  +'<input type="radio" name="pt2_'+ptKey2+'" value="ffv" '+(curPT2==='ffv'?'checked':'')+' onchange="window._pfPT(\''+tk+'\','+idx+',\'ffv\')" style="accent-color:#A3E635" onclick="event.stopPropagation()">'
                  +' FfV/Z\u00fcF '+fmt(an.ffv)+' \u20ac/100'
                  +'</label>'
                  +'</div>';
              }
              if(hkgCodes2.length > 1){
                out2 += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">'
                  +'<label style="font-size:11px;color:#555">Herkunft:</label>'
                  +'<select onchange="window._pfSetHKG(\''+tk+'\','+idx+',this.value)" onclick="event.stopPropagation()" style="font-size:11px;padding:3px 6px;border:1.5px solid #012d1d;border-radius:6px;background:#fff">'
                  +hkgCodes2.map(function(code){ return '<option value="'+esc(code)+'"'+(curHKG2===code?' selected':'')+'>'+esc(code)+(HKG_BEZEICHNUNGEN[code]?' \u2014 '+esc(HKG_BEZEICHNUNGEN[code]):'')+'</option>'; }).join('')
                  +'</select>'
                  +'</div>';
              }
              out2 += '<div style="display:flex;align-items:center;gap:6px">'
                +'<label style="font-size:11px;color:#555">Menge:</label>'
                +'<input type="number" class="darmst-menge-inp" data-tree="'+tk+'" data-idx="'+idx+'" value="'+(existingForThisAn?existingForThisAn.menge:100)+'" min="50" step="50" style="width:80px;padding:4px 8px;border:1.5px solid #012d1d;border-radius:6px;font-size:12px;font-weight:600" onclick="event.stopPropagation()">'
                +'<span style="font-size:11px;color:#666">Stk.</span>'
                +'</div>';
              out2 += '</div>';
              return out2;
            })():'')
            +'</div>'
            +'</label>'
            +'</div>';
        });
        html += '</div>';
        // menge inputs are now per-angebot in checkboxes above
        html += '</div></div>';
      });
      html += '</div>';
    }
  } else {
    // Other lieferant: show all BAUMARTEN with menge input
    html += '<p style="font-size:12px;color:#666;margin-bottom:12px">Bitte Baumarten und gewünschte Mengen eingeben. Exaktes Angebot folgt nach Rückfrage beim Lieferanten.</p>';
    html += '<div style="margin-bottom:10px"><input type="text" id="ka-search-bp" placeholder="🔍 Baumart suchen..." style="width:100%;padding:8px 12px;border:1px solid #ccc;border-radius:6px;font-size:14px;box-sizing:border-box" oninput="window.kaFilterBpRows(this.value)"></div>';
    html += '<div style="display:flex;flex-direction:column;gap:6px">';
    ALLE_BAUMARTEN_FOVG.forEach(function(baumart){
      var treeKey = TREES.find(function(t){ return t.name === baumart; });
      var treeK = treeKey ? treeKey.k : null;
      var epEntry = S.eigenePflanzen ? S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; }) : null; var qty = treeK ? (S.treeQty[treeK]||0) : (epEntry ? epEntry.menge : 0);
      var isOn = qty > 0;
      html += '<div class="bp-row" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#e0e0e0')+';background:'+(isOn?'#fafaf7':'#fff')+'">'
        +'<input type="checkbox" class="bp-cb" data-baumart="'+esc(baumart)+'" data-treekey="'+(treeK||'')+'" '+(isOn?'checked':'')+' style="width:18px;height:18px;accent-color:#012d1d;flex-shrink:0;cursor:pointer">'
        +'<span style="flex:1;font-size:13px;font-weight:'+(isOn?'700':'500')+'">'+esc(baumart)+(HKG_PRO_BAUMART[baumart]?' <span class="pf-badge-fovg">⚖️ FoVG</span>':'')+'</span>'
        +(isOn ? '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0"><label style="font-size:11px;color:#555">Menge:</label><input type="number" class="bp-menge pf-inp" data-baumart="'+esc(baumart)+'" data-treekey="'+(treeK||'')+'" value="'+qty+'" min="50" step="50" style="width:80px;padding:4px 8px;font-size:13px" onclick="event.stopPropagation()"><span style="font-size:11px;color:#666">Stk.</span></div>' : '')
        +'</div>';
    });
    html += '</div>';
  }

  html += '<div class="pf-err" id="e-bp"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-bp">← Zurück</button>'
    +'<button class="pf-btn p" id="n-bp">Weiter →</button>'
    +'</div></div>';
  return html;
}

function bindBaumArtenPreise(){
  var isDarmst = S.lieferant === 'darmstaedter';
  var phase = S.darmstPhase || 1;

  if(isDarmst){
    if(phase === 1){
      // Phase 1: Baumart-Checkbox Kacheln
      var _srB = document.getElementById('ka-search-b');
      if(_srB && _kaSearchB){ _srB.value = _kaSearchB; kaFilterDarmstBaumarten(_kaSearchB); }
      document.querySelectorAll('.darmst-baumart-cb').forEach(function(cb){
        cb.addEventListener('change', function(){
          var tk = this.dataset.tk;
          var idx2 = S.darmstSelectedBaumarten.indexOf(tk);
          if(this.checked && idx2 < 0) S.darmstSelectedBaumarten.push(tk);
          else if(!this.checked && idx2 >= 0) S.darmstSelectedBaumarten.splice(idx2,1);
          render();
        });
      });
      var detailBtn = document.getElementById('darmst-detail-btn');
      if(detailBtn){
        detailBtn.addEventListener('click', function(){
          if(S.darmstSelectedBaumarten.length === 0){ showErr('e-bp','Bitte mindestens eine Baumart auswählen.'); return; }
          S.darmstPhase = 2;
          render();
        });
      }
    } else {
      // Phase 2: Angebots-Karten + Preis-Radio + Menge
      var backPhaseBtn = document.getElementById('darmst-back-phase');
      if(backPhaseBtn){
        backPhaseBtn.addEventListener('click', function(){
          S.darmstPhase = 1;
          render();
        });
      }
      // Angebots-Checkboxes (Größe/Qualität wählen — Mehrfachauswahl)
      document.querySelectorAll('.darmst-an-cb').forEach(function(cb){
        cb.addEventListener('change', function(){
          var tree = this.dataset.tree;
          var idx3 = parseInt(this.dataset.idx);
          var angebote = DARMST_ANGEBOTE[tree];
          if(!angebote || !angebote[idx3]) return;
          var an = angebote[idx3];
          var t = TM[tree] || {k:tree, name:tree};
          // Find existing entry for this exact angebot
          var existIdx = -1;
          for(var i=0; i<S.selectedAngebote.length; i++){
            var sa=S.selectedAngebote[i];
            if(sa.baumart_key===tree && sa.q===an.q && sa.h===an.h){ existIdx=i; break; }
          }
          if(this.checked){
            if(existIdx < 0){
              S.selectedAngebote.push({
                baumart_key: tree, baumart_name: t.name,
                q: an.q, h: an.h, hkg: (DARMST_HKG_CODES[tree]&&DARMST_HKG_CODES[tree].length>0 ? DARMST_HKG_CODES[tree][0] : an.hkg),
                fovg: an.fovg, ffv: an.ffv, menge: 100, preistyp: 'fovg'
              });
            }
          } else {
            if(existIdx >= 0) S.selectedAngebote.splice(existIdx, 1);
          }
          render();
        });
      });
      // Menge inputs (per angebot, identified by tree+idx)
      document.querySelectorAll('.darmst-menge-inp').forEach(function(inp){
        inp.addEventListener('change', function(){
          var tree = this.dataset.tree;
          var idx3 = parseInt(this.dataset.idx);
          var angebote = DARMST_ANGEBOTE[tree];
          if(!angebote || !angebote[idx3]) return;
          var an = angebote[idx3];
          for(var i=0; i<S.selectedAngebote.length; i++){
            var sa=S.selectedAngebote[i];
            if(sa.baumart_key===tree && sa.q===an.q && sa.h===an.h){
              sa.menge = Math.max(50, parseInt(this.value)||100);
              break;
            }
          }
        });
        inp.addEventListener('click', function(e){ e.stopPropagation(); });
      });
    }
  } else {
    // Non-Darmstädter: treeQty für TREES-Arten, eigenePflanzen für Nicht-TREES-Arten (Multi-Baumart-Fix)
    document.querySelectorAll('.bp-cb').forEach(function(cb){
      cb.addEventListener('change', function(){
        var treeK = this.dataset.treekey;
        var baumart = this.dataset.baumart;
        if(treeK) {
          S.treeQty[treeK] = this.checked ? 100 : 0;
        } else if(baumart) {
          // Nicht-TREES Baumart (z.B. Eberesche, Esche): eigenePflanzen → getSelTrees() part 2
          if(this.checked) {
            if(!S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; }))
              S.eigenePflanzen.push({baumart: baumart, menge: 100});
          } else {
            S.eigenePflanzen = S.eigenePflanzen.filter(function(ep){ return ep.baumart !== baumart; });
          }
        }
        render();
      });
    });
    document.querySelectorAll('.bp-menge').forEach(function(inp){
      inp.addEventListener('change', function(){
        var treeK = this.dataset.treekey;
        var baumart = this.dataset.baumart;
        if(treeK) {
          S.treeQty[treeK] = Math.max(50, parseInt(this.value)||100);
        } else if(baumart) {
          var ep = S.eigenePflanzen.find(function(ep){ return ep.baumart === baumart; });
          if(ep) ep.menge = Math.max(50, parseInt(this.value)||100);
        }
      });
      inp.addEventListener('click', function(e){ e.stopPropagation(); });
    });
  }

  document.getElementById('b-bp').addEventListener('click', function(){
    if(isDarmst && phase === 2){ S.darmstPhase = 1; render(); }
    else go(20);
  });
  document.getElementById('n-bp').addEventListener('click', function(){
    if(isDarmst){
      if(phase === 1){
        if(S.darmstSelectedBaumarten.length === 0){ showErr('e-bp','Bitte mindestens eine Baumart auswählen.'); return; }
        S.darmstPhase = 2; render(); return;
      }
      if(S.selectedAngebote.length === 0){ showErr('e-bp','Bitte mindestens ein Angebot auswählen.'); return; }
    } else {
      var hasAny = TREES.some(function(t){ return (S.treeQty[t.k]||0) > 0; }) ||
                   (S.eigenePflanzen && S.eigenePflanzen.some(function(ep){ return (ep.menge||0) > 0; }));
      if(!hasAny){ showErr('e-bp','Bitte mindestens eine Baumart mit Menge angeben.'); return; }
    }
    go(1);
  });
}

// ── Step 1 (NEU): Lieferort + Adresse + Befahrbarkeit ────────────────────────
function sLieferort(){
  var lo = S.lieferort;
  var befahrOpts = [
    ['lkw','🚛','LKW-befahrbar','bis 26t'],
    ['kleintransporter','🚐','Kleintransporter','bis 3,5t'],
    ['traktor','🚜','Nur Traktor / Forstmaschine','forstwirtschaftliche Fahrzeuge'],
    ['unbekannt','❓','Unbekannt','Angabe nicht möglich'],
  ].map(function(o){
    var isOn = S.befahrbarkeit === o[0];
    return '<label style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#ddd')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer">'
      +'<input type="radio" name="befahrbarkeit-radio2" value="'+o[0]+'" '+(isOn?'checked':'')+' style="accent-color:#012d1d;width:16px;height:16px;flex-shrink:0">'
      +'<div><div style="font-weight:600;color:#2d2d2a;font-size:12px">'+o[1]+' '+o[2]+'</div>'
      +'<div style="font-size:10px;color:#666;margin-top:1px">'+o[3]+'</div></div>'
      +'</label>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>📍 Lieferort</h2>'
    +'<p>Wie und wo sollen die Pflanzen ankommen?</p></div>'
    +'<div class="pf-body">'

    +'<div class="pf-field">'
    +'<label style="font-weight:700;font-size:14px;display:block;margin-bottom:8px">Lieferort</label>'
    +'<div style="display:flex;flex-direction:column;gap:8px">'
    +[
      ['forststrasse','🚛 An Forststraße liefern','LKW-zugängliche Forststraße'],
      ['pflanzflaeche','🌲 An Pflanzfläche liefern','Direktanlieferung an die Aufforstungsfläche'],
      ['selbst','🏭 Selbst abholen','Abholung direkt bei der Baumschule'],
    ].map(function(o){
      var isOn = lo === o[0];
      return '<label style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;border:2px solid '+(isOn?'#012d1d':'#ddd')+';background:'+(isOn?'#fafaf7':'#fff')+';cursor:pointer">'
        +'<input type="radio" name="lieferort-radio2" value="'+o[0]+'" '+(isOn?'checked':'')+' style="accent-color:#012d1d;width:16px;height:16px;flex-shrink:0">'
        +'<div><div style="font-weight:600;color:#2d2d2a;font-size:13px">'+o[1]+'</div><div style="font-size:11px;color:#666;margin-top:1px">'+o[2]+'</div></div>'
        +'</label>';
    }).join('')
    +'</div>'
    +'</div>'

    +((lo==='forststrasse'||lo==='pflanzflaeche')
      ? '<div style="margin-top:14px;padding:14px;background:#f9f9f9;border:1px solid #e0e0e0;border-radius:8px">'
        +'<div style="font-size:13px;font-weight:700;color:#2d2d2a;margin-bottom:10px">📍 Lieferdetails</div>'
        +'<div class="pf-field">'
        +'<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Lieferadresse <span style="color:#666;font-weight:400">(optional)</span></label>'
        +'<input class="pf-inp" type="text" id="lo-str" value="'+esc(S.lieferStr||'')+'" placeholder="Straße + Hausnummer" style="width:100%;margin-bottom:6px">'
        +'<div style="display:grid;grid-template-columns:90px 1fr;gap:6px;margin-bottom:6px">'
        +'<input class="pf-inp" type="text" id="lo-plz" value="'+esc(S.lieferPlz||'')+'" placeholder="PLZ">'
        +'<input class="pf-inp" type="text" id="lo-ort" value="'+esc(S.lieferOrt||'')+'" placeholder="Ort">'
        +'</div>'
        +'<select class="pf-inp" id="lo-bundesland" style="width:100%;margin-bottom:0">'
        +'<option value="">Bundesland (optional)</option>'
        +["Baden-Württemberg","Bayern","Berlin","Brandenburg","Bremen","Hamburg","Hessen","Mecklenburg-Vorpommern","Niedersachsen","Nordrhein-Westfalen","Rheinland-Pfalz","Saarland","Sachsen","Sachsen-Anhalt","Schleswig-Holstein","Thüringen"].map(function(bl){ return '<option value="'+bl+'"'+((S.lieferBundesland||'')=== bl?' selected':'')+'>'+bl+'</option>'; }).join('')
        +'</select>'
        +'</div>'
        +'<div class="pf-field" style="margin-top:10px">'
        +'<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Google Maps Link / Koordinaten <span style="color:#666;font-weight:400">(optional)</span></label>'
        +'<input class="pf-inp" type="text" id="lo-maps" value="'+esc(S.lieferMapsLink)+'" placeholder="z.B. https://maps.google.com/... oder 49.123, 8.456" style="max-width:420px">'
        +'</div>'
        +'<div class="pf-field" style="margin-top:14px">'
        +'<label style="font-size:13px;font-weight:700;display:block;margin-bottom:8px">Befahrbarkeit der Zufahrt</label>'
        +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">'+befahrOpts+'</div>'
        +'</div>'
        +'</div>'
      : '')

    +'<div class="pf-err" id="e-lo"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-lo">← Zurück</button>'
    +'<button class="pf-btn p" id="n-lo">Weiter →</button>'
    +'</div></div>';
}

function bindLieferort(){
  document.querySelectorAll('[name="lieferort-radio2"]').forEach(function(r){
    r.addEventListener('change', function(){
      S.lieferort = this.value;
      if(this.value === 'selbst'){ S.lieferAdresse=''; S.lieferMapsLink=''; S.befahrbarkeit=''; }
      render();
    });
  });
  var loStr = document.getElementById('lo-str');
  if(loStr) loStr.addEventListener('input', function(){
    S.lieferStr = this.value;
    S.lieferAdresse = [S.lieferStr, S.lieferPlz&&S.lieferOrt ? (S.lieferPlz+' '+S.lieferOrt) : (S.lieferPlz||S.lieferOrt||'')].filter(Boolean).join(', ');
  });
  var loPlz = document.getElementById('lo-plz');
  if(loPlz) loPlz.addEventListener('input', function(){
    S.lieferPlz = this.value;
    S.lieferAdresse = [S.lieferStr||'', S.lieferPlz&&S.lieferOrt ? (S.lieferPlz+' '+S.lieferOrt) : (S.lieferPlz||S.lieferOrt||'')].filter(Boolean).join(', ');
  });
  var loOrt = document.getElementById('lo-ort');
  if(loOrt) loOrt.addEventListener('input', function(){
    S.lieferOrt = this.value;
    S.lieferAdresse = [S.lieferStr||'', S.lieferPlz&&S.lieferOrt ? (S.lieferPlz+' '+S.lieferOrt) : (S.lieferPlz||S.lieferOrt||'')].filter(Boolean).join(', ');
  });
  var loBl = document.getElementById('lo-bundesland');
  if(loBl) loBl.addEventListener('change', function(){ S.lieferBundesland = this.value; });
  var mapsInp = document.getElementById('lo-maps');
  if(mapsInp) mapsInp.addEventListener('input', function(){ S.lieferMapsLink = this.value; });
  document.querySelectorAll('[name="befahrbarkeit-radio2"]').forEach(function(r){
    r.addEventListener('change', function(){ S.befahrbarkeit = this.value; });
  });
  // Zurück: hängt von Bezugsquelle ab (Pfad A → 11, Pfad B → 21)
  document.getElementById('b-lo').addEventListener('click', function(){
    if(S.bezugsquelle === 'vorhanden') go(11);
    else go(21);
  });
  document.getElementById('n-lo').addEventListener('click', function(){
    if(!S.lieferort){ showErr('e-lo','Bitte Lieferort angeben.'); return; }
    go(2);
  });
}

// ── Step 5 (NEU): Kontakt + Zusammenfassung ───────────────────────────────────
function sKontaktSummary(){
  // Baumarten-Summary je Bezugsquelle
  var baumSummary = '';
  if(S.bezugsquelle === 'vorhanden' && S.eigenePflanzen.length){
    baumSummary = '<div class="pf-sum-row" style="flex-direction:column;align-items:flex-start">'
      +'<span class="pf-sum-lbl">🌱 Eigene Pflanzen</span>'
      +'<div style="width:100%;margin-top:6px;display:flex;flex-direction:column;gap:4px">'
      +S.eigenePflanzen.map(function(ep){
        var h = S.eigenePflanzenHerkunft.find(function(x){ return x.baumart === ep.baumart; });
        var hkgText = h && h.hkg_code && h.hkg_code !== "n/a" && h.hkg_code !== "unbekannt" ? " | HKG: "+hkgLabel(h.hkg_code) : ""
        return '<span style="font-size:12px;background:#F8F9F5;border-radius:4px;padding:3px 10px;color:#012d1d;font-weight:600">'+esc(ep.baumart)+': '+fmt(ep.menge)+' Stk.'+hkgText+'</span>';
      }).join('')
      +'</div></div>';
  } else if(S.bezugsquelle === 'bestellen'){
    baumSummary = bezugsquelleSumRow();
  }

  // Flächen-Summary (alle Flächen)
  var flaecheSummary = '';
  S.flaechen.forEach(function(fl, fi) {
    var haVal=parseFloat(fl.ha)||0, apSum=parseFloat(fl.abstand_p||2), arSum=parseFloat(fl.abstand_r||2);
    // Tatsächliche Kundeneingabe aus treeVerteilung
    var stueckzahlSum = fl.treeVerteilung && Object.keys(fl.treeVerteilung).length
      ? Object.values(fl.treeVerteilung).reduce(function(s,v){ return s+(parseInt(v)||0); }, 0)
      : (apSum>0&&arSum>0&&haVal>0 ? Math.round(haVal*10000/(apSum*arSum)) : 0);
    var pvC=['#012d1d','#8B5E3C','#3A5A6A','#6B5C2F','#7B3F2A'];
    var sel=getSelTrees();
    var pvHtml='';
    // Per-Fläche Baumarten aus treeVerteilung (tatsächliche Eingabe)
    var flSel = fl.treeVerteilung ? Object.entries(fl.treeVerteilung).filter(function(e){ return parseInt(e[1])>0; }) : [];
    if(flSel.length&&apSum>0&&arSum>0){
      var unit=[];flSel.forEach(function(e,i){var n=Math.max(1,parseInt(e[1])||1);var total=flSel.reduce(function(s,x){return s+parseInt(x[1]);},0);var nScaled=Math.max(1,Math.round(n/total*5));var c=pvC[i%pvC.length];for(var j=0;j<nScaled;j++)unit.push(c);});
      pvHtml='<div style="margin-top:5px;display:flex;flex-direction:column;gap:2px">';
      for(var r=0;r<3;r++){pvHtml+='<div style="display:flex;gap:3px">';var reps=Math.min(6,Math.floor(24/unit.length));for(var rep=0;rep<reps;rep++)unit.forEach(function(cl){pvHtml+='<div style="width:12px;height:12px;border-radius:50%;background:'+cl+';flex-shrink:0"></div>';});pvHtml+='</div>';}
      pvHtml+='</div>';
    }
    flaecheSummary += '<div class="pf-sum-row"><span class="pf-sum-lbl">'+(S.flaechen.length>1?'Fläche '+(fi+1):'Fläche')+'</span><span>'
      +(fl.forstamt ? 'FA: '+esc(fl.forstamt) : '')
      +(fl.revier ? (fl.forstamt?' / ':'')+ esc(fl.revier) : '')
      +(fl.forstamt||fl.revier ? '<br>' : '')
      +esc(fl.ha||'?')+' ha'+(fl.plz||fl.ort?' · '+esc(fl.plz)+' '+esc(fl.ort):'')
      +'<br><span style="font-size:11px;color:#666">Pflanzverband: '+esc(fl.abstand_p||'2.0')+' × '+esc(fl.abstand_r||'2.0')+' m ('+esc(fl.verbandMethode||'reihe')+')</span>'
      +(stueckzahlSum>0?'<br><span style="font-size:11px;color:#012d1d;font-weight:600">≈ '+stueckzahlSum.toLocaleString('de-DE')+' Pflanzen</span>':'')
      +(function(){var haV=parseFloat(fl.ha)||0;if(stueckzahlSum>0&&haV>0){var r=checkPflanzdichte(stueckzahlSum,haV);if(r)return '<br><span style="font-size:11px;color:'+(r.warn?'#A3E635':'#012d1d')+'">'+r.msg+'</span>';}return '';})()
      +pvHtml
      +'</span></div>';
  });

  // Lieferort Summary
  var liefOrtMap = {forststrasse:'🚛 An Forststraße liefern',pflanzflaeche:'🌲 An Pflanzfläche liefern',selbst:'🏭 Selbst abholen'};
  var lieferortSummary = S.lieferort
    ? '<div class="pf-sum-row"><span class="pf-sum-lbl">Lieferort</span><span>'+(liefOrtMap[S.lieferort]||S.lieferort)+(S.lieferAdresse?'<br><small>'+esc(S.lieferAdresse)+'</small>':'')+'</span></div>'
    : '';

  // Zeitraum Optionen
  var zeitOpts = '<option value="">— bitte wählen —</option>'
    +kaSeasons().map(function(o){
      return '<option value="'+o[0]+'"'+(S.zeitraum===o[0]?' selected':'')+'>'+o[1]+'</option>';
    }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>✅ Kontakt & Zusammenfassung</h2>'
    +'<p>Bitte prüfen Sie Ihre Angaben und hinterlassen Sie Ihre Kontaktdaten.</p></div>'
    +'<div class="pf-body">'

    // Mini-Zusammenfassung
    +'<div style="background:#f9faf8;border:1px solid #e0e0d8;border-radius:10px;padding:14px;margin-bottom:20px">'
    +'<div style="font-size:13px;font-weight:700;color:#2d2d2a;margin-bottom:10px">📋 Ihre Anfrage im Überblick</div>'
    +(S.waldbesitzertyp ? '<div class="pf-sum-row">'
      +'<span class="pf-sum-lbl">Waldbesitzertyp</span>'
      +'<span>'+esc((BESITZERTYPEN.find(function(b){return b.k===S.waldbesitzertyp;})||{}).name || S.waldbesitzertyp)+'</span>'
      +'</div>' : '')
    +flaecheSummary
    +baumSummary
    +lieferortSummary
    +(S.bundesland ? '<div class="pf-sum-row"><span class="pf-sum-lbl">Bundesland</span><span>'+esc(S.bundesland)+(S.foerderBeratungS2?' · <span style="color:#012d1d">Förderberatung gewünscht</span>':'')+'</span></div>' : '')
    +'</div>'

    // Kontaktformular
    +'<div style="font-size:14px;font-weight:700;color:#2d2d2a;margin-bottom:12px">👤 Ihre Kontaktdaten</div>'

    +'<div style="background:#f8f8f6;border-left:3px solid #012d1d;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#012d1d;line-height:1.6">'
    +'<strong>💡 Hinweis für öffentliche Auftraggeber</strong><br>'
    +'Gemeinden und Körperschaften des öffentlichen Rechts können Aufträge bis <strong>5.000 €</strong> (BW) bzw. <strong>3.000 €</strong> direkt vergeben.'
    +'</div>'

    +'<div class="pf-field"><label>Gewünschter Pflanzzeitraum *</label>'
    +'<select class="pf-inp" id="ks-zt">'+zeitOpts+'</select></div>'

    +'<div class="pf-field"><label>Vollständiger Name *</label>'
    +'<input class="pf-inp" type="text" id="ks-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name"></div>'

    +'<div class="pf-field"><label>E-Mail-Adresse *</label>'
    +'<input class="pf-inp" type="email" id="ks-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email"></div>'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Telefon (optional)</label>'
    +'<input class="pf-inp" type="tel" id="ks-tel" value="'+esc(S.tel)+'" placeholder="+49 ..." autocomplete="tel"></div>'
    +'<div class="pf-field">'
    +'<label>Treffpunkt mit F\u00f6rster <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<input class="pf-inp" type="text" id="ks-treffpunkt" value="'+esc(S.treffpunkt||'')+'" placeholder="z.B. Parkplatz Waldweg / GPS-Koordinaten / Forststra\u00dfe km 3">'
    +'</div>'
    +'<div class="pf-field"><label>Forstbetrieb / Organisation</label>'
    +'<input class="pf-inp" type="text" id="ks-fi" value="'+esc(S.firma)+'" placeholder="Optional" autocomplete="organization"></div>'

    +'<div class="pf-field"><label>Waldbesitzertyp</label>'
    +'<select class="pf-inp" id="ks-wbt"><option value="">— bitte wählen —</option>'
    +'<option value="privatwald"'+(S.waldbesitzertyp==="privatwald"?' selected':'')+'>Privatwald</option>'
    +'<option value="koerperschaftswald"'+(S.waldbesitzertyp==="koerperschaftswald"?' selected':'')+'>Körperschaftswald</option>'
    +'<option value="staatswald"'+(S.waldbesitzertyp==="staatswald"?' selected':'')+'>Staatswald</option>'
    +'<option value="kirchenwald"'+(S.waldbesitzertyp==="kirchenwald"?' selected':'')+'>Kirchenwald</option>'
    +'</select></div>'
    +'</div>'

    +'<div class="pf-field" style="margin-top:8px">'
    +'<label>Karten oder Dokumente hochladen (optional)</label>'
    +'<input class="pf-inp" type="file" id="ks-docs" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" multiple style="padding:10px 12px;cursor:pointer">'
    +'<p style="font-size:0.8rem;color:#a8a8a0;margin-top:4px">z.B. Flurkarten, Lagepläne, Fotos der Fläche (max. 10 MB)</p>'
    +'</div>'

    +'<div class="pf-field" style="margin-top:8px">'
    +'<label>Anmerkungen / Sonderwünsche (optional)</label>'
    +'<textarea class="pf-inp" id="ks-bem" rows="3" placeholder="Besondere Wünsche, Zufahrt, Vorgeschichte...">'+esc(S.bemerkung||'')+'</textarea>'
    +'</div>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="ks-beratung" style="width:18px;height:18px;margin-top:2px;accent-color:#012d1d;flex-shrink:0" '+(S.beratungsgespraech?'checked':'')+' >'
    +'<span><strong>💬 Persönliches Beratungsgespräch anfragen</strong><br><small style="color:#666">Vor Angebotserstellung direkt mit unserem Forstexperten sprechen.</small></span>'
    +'</label>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="i-dsgvo" required style="width:20px;height:20px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'<div class="pf-err" id="e-ks"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b-ks">← Zurück</button>'
    +'<button class="pf-btn p" id="sub-ks">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bindKontaktSummary(){
  var inm=document.getElementById('ks-nm'), iem=document.getElementById('ks-em'),
      itel=document.getElementById('ks-tel'), ifi=document.getElementById('ks-fi'),
      izt=document.getElementById('ks-zt'), ibem=document.getElementById('ks-bem'),
      idocs=document.getElementById('ks-docs'), iberatung=document.getElementById('ks-beratung');
  if(inm) inm.addEventListener('input',function(){ S.name=this.value; });
  if(iem) iem.addEventListener('input',function(){ S.email=this.value; });
  if(itel) itel.addEventListener('input',function(){ S.tel=this.value; });
  var itreff=document.getElementById('ks-treffpunkt'); if(itreff){ itreff.addEventListener('input',function(){ S.treffpunkt=this.value; }); if(S.treffpunkt) itreff.value=S.treffpunkt; }
  if(ifi) ifi.addEventListener('input',function(){ S.firma=this.value; });
  var iwbt=document.getElementById("ks-wbt"); if(iwbt) iwbt.addEventListener("change",function(){ S.waldbesitzertyp=this.value; });
  if(izt) izt.addEventListener('change',function(){ S.zeitraum=this.value; });
  if(ibem) ibem.addEventListener('input',function(){ S.bemerkung=this.value; });
  if(idocs) idocs.addEventListener('change',function(){ S.uploadedFiles=Array.from(this.files); });
  if(iberatung) iberatung.addEventListener('change',function(){ S.beratungsgespraech=this.checked; });
  var idsgvo=document.getElementById('i-dsgvo'); if(idsgvo) idsgvo.addEventListener('change',function(){ S.dsgvo=this.checked; });

  document.getElementById('b-ks').addEventListener('click', function(){ go(3); });
  document.getElementById('sub-ks').addEventListener('click', function(){
    // Collect current values
    if(inm) S.name=inm.value;
    if(iem) S.email=iem.value;
    if(itel) S.tel=itel.value;
    if(ifi) S.firma=ifi.value;
    if(izt) S.zeitraum=izt.value;
    if(ibem) S.bemerkung=ibem.value;
    if(idocs) S.uploadedFiles=Array.from(idocs.files);
    if(iberatung) S.beratungsgespraech=iberatung.checked;

    if(!S.zeitraum){ showErr('e-ks','Bitte Pflanzzeitraum wählen.'); return; }
    if(!S.name.trim()){ showErr('e-ks','Bitte Name eingeben.'); return; }
    if(!S.email||!S.email.includes('@')){ showErr('e-ks','Bitte gültige E-Mail eingeben.'); return; }
    var dsgvoEl=document.getElementById('i-dsgvo'); if(dsgvoEl&&!dsgvoEl.checked){ showErr('e-ks','Bitte Datenschutzerklärung bestätigen.'); return; }

    var btn = this;
    btn.disabled=true; btn.textContent='⏳ Wird gesendet…';

    // Build payload
    var fl = S.flaechen[0];
    var SOIL_MAP={}; SOILS.forEach(function(s){ SOIL_MAP[s.k]=s.ico+' '+s.name; });

    // Baumarten-String je Pfad
    var baumartenStr = '';
    var pflanzenzahl = 0;
    if(S.bezugsquelle === 'vorhanden'){
      baumartenStr = S.eigenePflanzen.map(function(ep){ return ep.baumart+': '+ep.menge+' Stk.'; }).join(', ');
      pflanzenzahl = S.eigenePflanzen.reduce(function(s,ep){ return s+ep.menge; },0);
    } else {
      // bestellen
      if(S.lieferant === 'darmstaedter' && S.selectedAngebote.length){
        baumartenStr = S.selectedAngebote.map(function(sa){ return sa.baumart_name+': '+sa.menge+' Stk.'; }).join(', ');
        pflanzenzahl = S.selectedAngebote.reduce(function(s,sa){ return s+sa.menge; },0);
      } else {
        var selTrees = TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
        baumartenStr = selTrees.map(function(t){ return t.name+': '+S.treeQty[t.k]+' Stk.'; }).join(', ');
        pflanzenzahl = selTrees.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0);
      }
    }

    // Herkunft-String
    var herkunftStr = '';
    if(S.bezugsquelle === 'vorhanden'){
      herkunftStr = S.eigenePflanzenHerkunft.map(function(h){ return h.baumart+': HKG '+h.hkg_code; }).join('\n');
    } else {
      var selT = TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
      herkunftStr = selT.map(function(t){
        var fvg=FORVG_HKG[t.k]; var h=S.herkunft[t.k]||{};
        if(!fvg||!fvg.regulated) return t.name+': nicht FoVG-reguliert';
        return t.name+': HKG '+hkgLabel(h.hkg)+(h.kat?' ('+h.kat+')':'');
      }).join('\n');
    }

    var liefObj = LIEFERANTEN.find(function(l){ return l.k === S.lieferant; });
    var payload = {
      leistung: 'Pflanzung',
      baumarten: baumartenStr,
      pflanzenzahl_gesamt: pflanzenzahl,
      flaechen_str: S.flaechen.map(function(f,i){return 'Fläche '+(i+1)+': '+f.ha+' ha, '+f.plz+' '+f.ort+(f.forstamt?' (FA: '+f.forstamt+(f.revier?'/'+f.revier:'')+')'  :'');}).join(' | '),
      zeitraum: S.zeitraum,
      bemerkung: S.bemerkung,
      bundesland: S.bundesland||'',
      foerderProgramme: (S.foerderProgramme||[]).join(', '),
      foerderBeratungS2: S.foerderBeratungS2 ? 'Ja' : 'Nein',
      beratungsgespraech: S.beratungsgespraech ? 'Ja' : 'Nein',
      waldbesitzertyp: S.waldbesitzertyp||'',
      bezugsquelle: S.bezugsquelle === 'vorhanden' ? 'Pflanzen vorhanden (eigenes Pflanzgut)' : 'Über Koch Aufforstung bestellen',
      lieferant: liefObj ? liefObj.name : (S.lieferant||''),
      lieferort: ({forststrasse:'An Forststraße liefern',pflanzflaeche:'An Pflanzfläche liefern',selbst:'Selbst abholen'})[S.lieferort]||S.lieferort||'',
      lieferAdresse: S.lieferAdresse||'',
      lieferMapsLink: S.lieferMapsLink||'',
      befahrbarkeit: ({lkw:'LKW-befahrbar (bis 26t)',kleintransporter:'Kleintransporter (bis 3,5t)',traktor:'Nur Traktor/Forstmaschine',unbekannt:'Unbekannt'})[S.befahrbarkeit]||S.befahrbarkeit||'',
      darmstaedter_angebote: (S.lieferant==='darmstaedter'&&S.selectedAngebote.length)
        ? S.selectedAngebote.map(function(sa){ var preis=(sa.preistyp==='ffv'&&sa.ffv)?sa.ffv:sa.fovg; var typ=(sa.preistyp==='ffv'&&sa.ffv)?'FfV/ZüF':'FoVG'; return sa.baumart_name+' '+sa.q+(sa.h&&sa.h!=='–'?' '+sa.h.replace(/\s*cm\s*$/i,'')+' cm':'')+' | HKG '+sa.hkg+' | '+typ+': '+preis+'€/100 | '+sa.menge+' Stk.'; }).join('\n')
        : '',
      forvg_herkunft: herkunftStr,
      flaechen: S.flaechen.map(function(f){
        var ap=parseFloat(f.abstand_p||2), ar=parseFloat(f.abstand_r||2), haVal=parseFloat(f.ha)||0;
        var n=ap>0&&ar>0&&haVal>0?Math.round(haVal*10000/(ap*ar)):0;
        if(f.verbandMethode==='quincunx') n=Math.round(n*1.15);
        return {ha:f.ha||'',plz:f.plz||'',ort:f.ort||'',forstamt:f.forstamt||'',revier:f.revier||'',pflanzverband:f.verbandMethode||'reihe',abstand_p:f.abstand_p||'2.0',abstand_r:f.abstand_r||'2.0',stueckzahl:Object.values(f.treeVerteilung||{}).reduce(function(s,v){return s+(parseInt(v)||0);},0),baumarten_verteilung:f.treeVerteilung||{},gps:f.gps||''};
      }),
      flaeche_ha: S.flaechen.reduce(function(s,f){return s+(parseFloat(f.ha)||0);},0),
      pflanzverband: S.flaechen[0]?S.flaechen[0].verbandMethode||'reihe':'reihe',
      flaeche_forstamt: S.flaechen[0]?S.flaechen[0].forstamt||'':'',
      flaeche_revier: S.flaechen[0]?S.flaechen[0].revier||'':'',
      flaeche_plz: S.flaechen[0]?S.flaechen[0].plz||'':'',
      flaeche_ort: S.flaechen[0]?S.flaechen[0].ort||'':'',
      pflanzabstand: S.flaechen[0]?(S.flaechen[0].abstand_p||'2.0')+'m':'2.0m',
      reihenabstand: S.flaechen[0]?(S.flaechen[0].abstand_r||'2.0')+'m':'2.0m',
      aussenreihe: fl.aussenreihe ? true : false,
      aussenreiheArt: fl.aussenreiheArt||'',
      name: S.name, email: S.email, tel: S.tel, unternehmen: S.firma,
      treffpunkt: S.treffpunkt||''
    };

    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    var fileInput = document.getElementById('ks-docs');
    if(fileInput && fileInput.files && fileInput.files[0]) fd.append('file', fileInput.files[0]);
    fetch('/wp-json/koch/v1/anfrage',{method:'POST',credentials:'same-origin',body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(wpResult) { if (typeof S !== 'undefined' && S.lieferant === 'netzwerk' && S.selectedBaumschuleId && typeof sendBaumschulBestellung === 'function') { sendBaumschulBestellung(S).catch(function(){}); } showOK(wpResult); })
      .catch(function(err){
        console.error(err);
        btn.disabled=false; btn.textContent='📤 Anfrage absenden';
        var errEl=document.getElementById('e-ks');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';}
      });
  });
}

// ── Ende neue Schritt-Funktionen ─────────────────────────────────────────────

// ── Step 0: Baumarten & Stückzahlen ───────────────────────────────────────────
function s0(){
  var darmstFilterActive = S.lieferant === 'darmstaedter' && S.pflanzenVorhanden !== 'vorhanden';
  var cards = TREES.map(function(t,i){
    var qty=S.treeQty[t.k]||0, on=qty>0;
    var verfuegbar = isBaumartVerfuegbar(t.k);
    var sub=on ? fmt(qty)+' Stk. × '+fmt(t.p100)+'€/100 = '+fmt(qty/100*t.p100)+' €' : '';
    var disabledStyle = !verfuegbar ? 'opacity:0.4;pointer-events:none;' : '';
    var unavailBadge = !verfuegbar ? '<span style="font-size:10px;color:#e53e3e;display:block;margin-top:2px">❌ Nicht bei Darmstädter</span>' : '';
    return '<div class="pf-tree'+(on?' on':'')+'" id="tc-'+t.k+'" style="'+disabledStyle+'">'
      +'<div class="pf-tree-hd">'
      +'<span class="pf-tree-name">'+esc(t.name)+'</span>'
      +'<span class="pf-tree-price">'+fmt(t.p100)+' €/100 Stk.<br><small style="font-size:10px;color:var(--n300)">'+t.info+'</small>'+unavailBadge+'</span>'
      +'</div>'
      +'<div class="pf-tree-qty">'
      +'<button class="pf-qb" data-k="'+t.k+'" data-d="-50"'+(verfuegbar?'':' disabled')+'>−</button>'
      +'<input class="pf-qi" type="number" min="0" step="50" id="qi-'+t.k+'" value="'+qty+'" data-k="'+t.k+'" '+(verfuegbar?'':' disabled="disabled"')+'>'
      +'<button class="pf-qb" data-k="'+t.k+'" data-d="50"'+(verfuegbar?'':' disabled')+'>+</button>'
      +'</div>'
      +'<div class="pf-tree-sub" id="ts-'+t.k+'" style="'+(on?'':'display:none')+'">'+sub+'</div>'
      +'</div>';
  }).join('');
  var darmstHint = darmstFilterActive
    ? '<div style="font-size:12px;color:#A3E635;background:#fffdf7;border:1px solid #A3E63544;border-radius:6px;padding:8px 12px;margin-bottom:10px">⭐ Lieferant: Darmstädter — ausgegraut = nicht im Angebot 2025</div>'
    : '';

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>🌱 Baumarten & Stückzahlen</h2>'
    +'<p>Preise nach Darmstädter Forstbaumschule 2025. Mindestbestellmenge: 50 Stk. je Art. Endpreis inklusive Pflanzung auf Anfrage.</p></div>'
    +'<div class="pf-body">'
    +darmstHint
    +'<input type="text" id="pf-baum-search" placeholder="🔍 Baumart suchen..." style="width:100%;padding:10px 14px;border:1.5px solid #D4D4CF;border-radius:8px;font-size:1rem;margin-bottom:16px;font-family:inherit;box-sizing:border-box">'
    +'<div class="pf-tree-grid">'+cards+'</div>'
    +'<div class="pf-price-box"><span>Richtpreis Pflanzgut (netto, ohne Pflanzung)</span><strong id="pt">'+fmt(treeTotal())+' €</strong></div>'
    +'<div id="pf-herkunft-section">'+renderHerkunftSection()+'</div>'
    +'<div class="pf-err" id="e0"></div>'
    +'</div>'
    +'<div class="pf-ft"><div></div>'
    +'<button class="pf-btn p" id="n0">Weiter →</button>'
    +'</div></div>';
}

function renderHerkunftSection(){
  var sel = getSelTrees();
  if(sel.length === 0) return '';
  var rows = sel.map(function(t){
    var fvg = FORVG_HKG[t.k];
    var cur = S.herkunft[t.k] || {};
    if(!fvg || !fvg.regulated){
      return '<div class="pf-hkg-row">'
        +'<span class="pf-hkg-name">'+esc(t.name)+'</span>'
        +'<span class="pf-hkg-nota">Nicht FoVG-reguliert – kein Herkunftsnachweis erforderlich</span>'
        +'</div>';
    }
    var hkgOpts = fvg.gebiete.map(function(g){
      return '<option value="'+esc(g.code)+'"'+(cur.hkg===g.code?' selected':'')+'>'+esc(hkgLabel(g.code))+'</option>';
    }).join('');
    var katOpts = HKG_KAT.map(function(k){
      return '<option value="'+k.k+'"'+(cur.kat===k.k?' selected':'')+'>'+esc(k.label)+'</option>';
    }).join('');
    return '<div class="pf-hkg-row">'
      +'<span class="pf-hkg-name">'+esc(t.name)+'</span>'
      +'<div class="pf-hkg-selects">'
      +'<select class="pf-select pf-hkg-sel" data-k="'+t.k+'">'
      +'<option value="">— Herkunftsgebiet (HKG) wählen —</option>'
      +hkgOpts
      +'</select>'
      +'<select class="pf-select pf-kat-sel" data-k="'+t.k+'">'
      +'<option value="">— Kategorie —</option>'
      +katOpts
      +'</select>'
      +'</div>'
      +'</div>';
  }).join('');

  return '<div style="margin-top:20px;border:1px solid #A3E63544;border-radius:8px;padding:14px;background:#fffdf7">'
    +'<div style="font-weight:700;font-size:13px;color:#A3E635;margin-bottom:6px">🔖 Forstliches Vermehrungsgut (FoVG) – Herkunft <span style="color:#e53e3e;font-size:11px">* Pflichtangabe</span></div>'
    +'<p style="font-size:12px;color:#666;margin:0 0 10px">Bitte für jede Baumart das Herkunftsgebiet (HKG-Code gem. FoVG) und die Saatgutkategorie angeben. Dies ist für die Dokumentation und etwaige Förderungen erforderlich.</p>'
    +rows
    +'<p style="font-size:11px;color:#666;margin:8px 0 0">HKG = Herkunftsgebiet nach Forstvermehrungsgutgesetz (FoVG 2002). <a href="https://www.ble.de/DE/Themen/Wald-Fischerei-Forstgenetik/" target="_blank" style="color:#A3E635">BLE-Informationen →</a></p>'
    +'</div>';
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
    // Herkunft-Section aktualisieren
    var hs=document.getElementById('pf-herkunft-section');
    if(hs){ hs.innerHTML=renderHerkunftSection(); bindHerkunftEvents(); }
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
  // Suchfeld für Baumarten (s0)
  var baumSearch = document.getElementById('pf-baum-search');
  if(baumSearch){
    baumSearch.addEventListener('input', function(){
      var q = this.value.toLowerCase().trim();
      document.querySelectorAll('.pf-tree').forEach(function(card){
        var nameEl = card.querySelector('.pf-tree-name');
        var text = nameEl ? nameEl.textContent.toLowerCase() : card.textContent.toLowerCase();
        card.style.display = (!q || text.indexOf(q) > -1) ? '' : 'none';
      });
    });
  }
  // Initiale Herkunft-Events binden
  bindHerkunftEvents();
  document.getElementById('n0').addEventListener('click',function(){
    var total=TREES.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0);
    if(total===0){ showErr('e0','Bitte mindestens eine Baumart mit Stückzahl auswählen.'); return; }
    // Herkunft-Pflichtvalidierung für FoVG-regulierte Arten
    var sel=getSelTrees();
    var missingHerkunft=sel.filter(function(t){
      var fvg=FORVG_HKG[t.k];
      if(!fvg||!fvg.regulated) return false;
      var h=S.herkunft[t.k];
      return !h||!h.hkg||!h.kat;
    });
    if(missingHerkunft.length>0){
      showErr('e0','Bitte für folgende Baumarten das Herkunftsgebiet und die Kategorie angeben: '+missingHerkunft.map(function(t){return t.name;}).join(', '));
      document.getElementById('pf-herkunft-section').scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    // Flächen initialisieren
    S.flaechen.forEach(function(fl){
      sel.forEach(function(t){
        if(fl.treeVerteilung[t.k]===undefined) fl.treeVerteilung[t.k]=0;
        if(fl.seq[t.k]===undefined) fl.seq[t.k]=1;
      });
    });
    go(1);
  });
}

function bindHerkunftEvents(){
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
}

// ── Step 1: Flächen + Pflanzenverteilung + Pflanzverband ──────────────────────
function flaecheHTML(fl, idx){
  var isActive = (idx === S.activeFl);
  var sel = getSelTrees();

  var soilOpts = SOILS.map(function(s){
    return '<div class="pf-soil-opt'+(fl.boden===s.k?' on':'')+'" data-fid="'+fl.id+'" data-soil="'+s.k+'">'
      +'<span class="pf-soil-ico">'+s.ico+'</span>'
      +'<div class="pf-soil-name">'+s.name+'</div>'
      +'</div>';
  }).join('');

  // Pflanzenverteilung
  var verteilungRows = sel.map(function(t, i){
    var c = col(i);
    var currentVal = parseInt(fl.treeVerteilung[t.k])||0;
    var totalForTree = S.treeQty[t.k]||0;
    var sumAll = S.flaechen.reduce(function(s,f){ return s+(parseInt(f.treeVerteilung[t.k])||0); },0);
    var frei = totalForTree - sumAll;
    var isOver = frei < 0;
    var freiClr = frei===0?'#012d1d':frei<0?'#e53e3e':'#b7791f';
    var freiBg  = frei===0?'#d4f0eb':frei<0?'#ffe5e5':'#fff8e1';
    var freiIcon= frei===0?'✅':frei<0?'⚠️':'🌱';
    return '<div class="pf-verteil-row" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--n100,#f0f0ee)">'
      +'<div style="display:flex;align-items:center;gap:6px;min-width:0;flex:1">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+c.tx+';flex-shrink:0;display:inline-block"></span>'
      +'<span style="font-size:13px;font-weight:500">'+esc(t.name)+'</span>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:8px;flex-shrink:0">'
      +'<div style="text-align:right">'
      +'<div style="font-size:10px;color:#666;margin-bottom:2px">Gesamt: '+fmt(totalForTree)+'</div>'
      +'<span class="vt-free-badge" data-tree="'+t.k+'" style="display:inline-block;font-size:11px;font-weight:600;color:'+freiClr+';background:'+freiBg+';border-radius:10px;padding:2px 8px;white-space:nowrap">'+freiIcon+' '+Math.abs(frei)+' '+(frei<0?'zu viel':frei===0?'verteilt':'frei')+'</span>'
      +'</div>'
      +'<input class="pf-inp pf-verteil-inp" type="number" min="0" step="1" '
      +'id="vt-'+fl.id+'-'+t.k+'" value="'+currentVal+'" '
      +'data-fid="'+fl.id+'" data-tree="'+t.k+'" '
      +'style="width:75px;padding:6px 8px;text-align:center;'+(isOver?'border-color:#e53e3e;background:#fff5f5':'')+'">'
      +'<span style="font-size:11px;color:#666;min-width:20px">Stk.</span>'
      +'</div>'
      +'</div>';
  }).join('');

  // Mischungsreihenfolge
  var seqRows = sel.map(function(t, i){
    var c = col(i);
    return '<div class="pf-seq-row">'
      +'<div class="pf-seq-lbl"><span style="width:10px;height:10px;border-radius:50%;background:'+c.tx+';display:inline-block;margin-right:4px"></span>'+esc(t.name)+'</div>'
      +'<input class="pf-si pf-seq-inp" type="number" min="0" max="99" '
      +'id="sq-'+fl.id+'-'+t.k+'" value="'+(fl.seq[t.k]||1)+'" '
      +'data-fid="'+fl.id+'" data-tree="'+t.k+'">'
      +'<span style="font-size:12px;color:var(--n500)">× je Einheit</span>'
      +'</div>';
  }).join('');

  var summary=[];
  if(fl.ha) summary.push(fl.ha+' ha');
  if(fl.plz||fl.ort) summary.push((fl.plz+' '+fl.ort).trim());

  return '<div class="pf-fl-item" id="fl-'+fl.id+'">'
    +'<div class="pf-fl-item-hd pf-fl-hd-click" data-flid="'+fl.id+'" data-flidx="'+idx+'">'
    +'<div>'
    +'<div class="pf-fl-item-title">Fläche '+(idx+1)+(fl.ha?' — '+fl.ha+' ha':'')+'</div>'
    +'<div class="pf-fl-item-sub">'+(summary.length?summary.join(' · '):'Bitte ausfüllen')+'</div>'
    +'</div>'
    +(S.flaechen.length>1
      ? '<button class="pf-fl-del pf-fl-del-btn" data-delfl="'+fl.id+'">✕ Entfernen</button>'
      : '<span style="font-size:14px;color:var(--n300)">'+(isActive?'▲':'▼')+'</span>')
    +'</div>'
    +'<div class="pf-fl-item-body'+(isActive?' open':'')+'" id="flb-'+fl.id+'">'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Zuständiges Forstamt</label>'
    +'<input class="pf-inp pf-fl-inp" type="text" id="forstamt-'+fl.id+'" data-fid="'+fl.id+'" data-field="forstamt" value="'+esc(fl.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Revier</label>'
    +'<input class="pf-inp pf-fl-inp" type="text" id="revier-'+fl.id+'" data-fid="'+fl.id+'" data-field="revier" value="'+esc(fl.revier)+'" placeholder="z.B. Revier 3" autocomplete="off"></div>'
    +'</div>'

    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Flächengröße (ha) *</label>'
    +'<input class="pf-inp pf-fl-inp" type="text" inputmode="decimal" id="ha-'+fl.id+'" data-fid="'+fl.id+'" data-field="ha" value="'+esc(fl.ha)+'" placeholder="z.B. 2.5" autocomplete="off"></div>'
    +'<div class="pf-field"><label>Postleitzahl *</label>'
    +'<input class="pf-inp pf-fl-inp" type="text" inputmode="numeric" id="plz-'+fl.id+'" data-fid="'+fl.id+'" data-field="plz" value="'+esc(fl.plz)+'" placeholder="z.B. 83229" maxlength="5" autocomplete="off"></div>'
    +'</div>'

    +'<div class="pf-field"><label>Gemeinde / Ort *</label>'
    +'<input class="pf-inp pf-fl-inp" type="text" id="ort-'+fl.id+'" data-fid="'+fl.id+'" data-field="ort" value="'+esc(fl.ort)+'" placeholder="z.B. Rosenheim" autocomplete="off"></div>'

    +'<div class="pf-field"><label>Ist die Fläche ein Hang?</label>'
    +'<div class="pf-toggle">'
    +'<button class="pf-tgl'+(fl.hang===false?' on':'')+'" data-hangfid="'+fl.id+'" data-hangval="0" type="button">Kein Hang</button>'
    +'<button class="pf-tgl'+(fl.hang===true?' on':'')+'" data-hangfid="'+fl.id+'" data-hangval="1" type="button">Ja, Hang</button>'
    +'</div></div>'

    +'<div class="pf-field"><label>Bodenbeschaffenheit (optional)</label>'
    +'<div class="pf-soil-grid">'+soilOpts+'</div></div>'

    +(sel.length>0
      ? '<div class="pf-field"><label>🌿 Pflanzenverteilung für diese Fläche</label>'
        +'<p style="font-size:12px;color:var(--n500);margin-bottom:8px">Wie viele Pflanzen je Art auf dieser Fläche? Ein Hinweis erscheint, wenn die Gesamtmenge überschritten wird.</p>'
        +'<div class="pf-verteil-grid">'+verteilungRows+'</div>'
    +'<div class="pf-field" style="margin-top:8px">'
    +'<label>GPS-Koordinaten <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<div style="display:flex;gap:8px;align-items:center">'
    +'<input type="text" id="gps-'+fl.id+'" placeholder="z.B. 51.1234, 8.5678" value="'+esc(fl.gps||'')+'" style="flex:1;border:1px solid #d1d5db;border-radius:6px;padding:8px 10px;font-size:14px" oninput="updateGPSFl(this.value,\''+fl.id+'\')"> '
    +'<button type="button" onclick="getMyLocation(\''+fl.id+'\')" style="padding:8px 12px;background:#012d1d;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px;white-space:nowrap">\ud83d\udccd Standort</button>'
    +'</div>'
    +'<div id="gps-info-'+fl.id+'" style="font-size:11px;color:#666;margin-top:3px"></div>'
    +'</div>'
        +'</div>'
      : '')

    // ── Pflanzverband Konfiguration ──────────────────────────────────────────
    +'<div class="pf-field" style="margin-top:4px">'
    +'<label style="font-weight:700;color:#2d2d2a">🌲 Pflanzverband-Methode</label>'
    +'<p style="font-size:12px;color:var(--n500);margin-bottom:8px">Wählen Sie die Pflanzanordnung für diese Fläche:</p>'
    +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-bottom:14px">'
    +[
      ['reihe','📏 Reihenpflanzung','Klassische Reihen'],
      ['quincunx','◈ Quincunx-Verband','Versetzt für höhere Dichte'],
      ['trupp','🫧 Truppweise','Unregelmäßige Gruppen von 5–10 Pflanzen in natürlicher Verteilung'],
      ['nester','🪺 Nesterpflanzung','Kreisförmige Gruppen von 3–7 Pflanzen (ca. 1–2m Durchmesser)'],
      ['streifen','▬ Streifenpflanzung','Abwechselnde Artenstreifen'],
      ['frei','✏️ Frei beschreiben','Sonderform / Individuell'],
    ].map(function(m){
      var active=fl.verbandMethode===m[0];
      return '<button type="button" class="pf-meth-btn" data-fid="'+fl.id+'" data-methode="'+m[0]+'" '
        +'style="padding:10px 8px;border-radius:8px;border:2px solid '+(active?'#012d1d':'#ddd')+';background:'+(active?'#fafaf7':'#fff')+';cursor:pointer;text-align:left;transition:all 0.15s">'
        +'<div style="font-size:13px;font-weight:'+(active?'700':'500')+';color:'+(active?'#012d1d':'#2d2d2a')+'">'+m[1]+'</div>'
        +'<div style="font-size:10px;color:'+(active?'#4B6343':'#595955')+';margin-top:2px">'+m[2]+'</div>'
        +'</button>';
    }).join('')
    +'</div>'

    // Abstände (immer sichtbar außer bei "frei")
    +(fl.verbandMethode!=='frei'
      ? '<div class="pf-g2">'
        +'<div class="pf-field"><label>'+(fl.verbandMethode==='trupp'||fl.verbandMethode==='nester'?'Pflanzabstand innerhalb Gruppe (m)':'Pflanzabstand in der Reihe (m)')+'</label>'
        +'<input class="pf-inp pf-fl-inp" type="text" inputmode="decimal" id="abstand_p-'+fl.id+'" data-fid="'+fl.id+'" data-field="abstand_p" value="'+esc(fl.abstand_p||'2.0')+'" placeholder="2.0" autocomplete="off"></div>'
        +'<div class="pf-field"><label>'+(fl.verbandMethode==='trupp'||fl.verbandMethode==='nester'?'Abstand zwischen Gruppen (m)':'Abstand zwischen Reihen (m)')+'</label>'
        +'<input class="pf-inp pf-fl-inp" type="text" inputmode="decimal" id="abstand_r-'+fl.id+'" data-fid="'+fl.id+'" data-field="abstand_r" value="'+esc(fl.abstand_r||'2.0')+'" placeholder="2.0" autocomplete="off"></div>'
        +'</div>'
      : '')

    // Reihen-spezifische Optionen
    +(sel.length>0 && (fl.verbandMethode==='reihe'||fl.verbandMethode==='quincunx')
      ? // Mischungsreihenfolge
        '<label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px">🔢 Mischungsreihenfolge</label>'
        +'<p style="font-size:12px;color:var(--n500);margin-bottom:8px">Anzahl Pflanzen je Art in einer Wiederholungseinheit:</p>'
        +'<div class="pf-seq-box">'+seqRows+'</div>'
        // Reihenstart-Option (nur bei reihe, nicht bei quincunx der schon immer versetzt ist)
        +(fl.verbandMethode==='reihe'
          ? '<div class="pf-field" style="margin-top:12px"><label>Reihenanfang</label>'
            +'<div style="display:flex;gap:8px;flex-wrap:wrap">'
            +[['gleich','Gleich (alle Reihen starten identisch)'],['quincunx','Versetzt / Quincunx (½-Einheit verschoben)'],['alternierend','Alternierend (Reihe 2 beginnt mit nächster Art)']].map(function(o){
              return '<button type="button" class="pf-rst-btn" data-fid="'+fl.id+'" data-rstart="'+o[0]+'" '
                +'style="padding:6px 12px;border-radius:6px;border:1.5px solid '+(fl.reihenStart===o[0]?'#012d1d':'#ddd')+';background:'+(fl.reihenStart===o[0]?'#fafaf7':'#fff')+';font-size:11px;cursor:pointer;color:'+(fl.reihenStart===o[0]?'#012d1d':'#555')+'">'+o[1]+'</button>';
            }).join('')
            +'</div></div>'
          : '')
        // Außenreihe
        +'<label style="display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer">'
        +'<input type="checkbox" class="pf-aussenreihe-cb" data-fid="'+fl.id+'" '+(fl.aussenreihe?'checked':'')+' style="width:16px;height:16px;accent-color:#012d1d">'
        +'<span style="font-size:13px;font-weight:500">Außenreihe abweichend konfigurieren</span>'
        +'</label>'
        +(fl.aussenreihe && sel.length>1
          ? '<div class="pf-field" style="margin-top:8px;margin-left:24px"><label>Baumart für Außenreihe</label>'
            +'<select class="pf-inp pf-aussenreihe-art" data-fid="'+fl.id+'" style="max-width:260px">'
            +sel.map(function(t){ return '<option value="'+t.k+'"'+(fl.aussenreiheArt===t.k?' selected':'')+'>'+esc(t.name)+'</option>'; }).join('')
            +'</select>'
            +'<p style="font-size:11px;color:#666;margin-top:4px">Die erste und letzte Reihe der Fläche werden mit dieser Art bepflanzt (z.B. Traufzone, Windschutz).</p>'
            +'</div>'
          : (fl.aussenreihe && sel.length<=1 ? '<p style="font-size:11px;color:#b7791f;margin-top:6px;margin-left:24px">⚠️ Mindestens 2 Baumarten für Außenreihen-Konfiguration</p>' : ''))
      : '')

    // Trupp/Nester-spezifische Optionen
    +(sel.length>0 && (fl.verbandMethode==='trupp'||fl.verbandMethode==='nester')
      ? '<label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px">'+(fl.verbandMethode==='trupp'?'🫧 Truppgröße':'🪺 Nestgröße')+'</label>'
        +'<p style="font-size:12px;color:var(--n500);margin-bottom:8px">'+(fl.verbandMethode==='trupp'?'Pflanzen pro Trupp (je Baumart):':'Pflanzen pro Nest (je Baumart):')+' (empfohlen: '+(fl.verbandMethode==='trupp'?'5–25':'3–9')+')</p>'
        +'<div class="pf-g2">'
        +sel.map(function(t,i){ var c=col(i); return '<div class="pf-field"><label style="color:'+c.tx+'">'+esc(t.name)+'</label>'
          +'<input class="pf-inp pf-seq-inp" type="number" min="1" max="'+(fl.verbandMethode==='trupp'?'50':'15')+'" '
          +'id="sq-'+fl.id+'-'+t.k+'" value="'+(fl.seq[t.k]||fl.truppGroesse)+'" '
          +'data-fid="'+fl.id+'" data-tree="'+t.k+'"></div>'; }).join('')
        +'</div>'
      : '')

    // Streifen-spezifische Optionen
    +(sel.length>0 && fl.verbandMethode==='streifen'
      ? '<label style="font-weight:600;font-size:13px;display:block;margin-bottom:4px">▬ Streifenbreite</label>'
        +'<p style="font-size:12px;color:var(--n500);margin-bottom:8px">Reihen je Streifen (je Baumart) — definiert Breite der abwechselnden Streifen:</p>'
        +'<div class="pf-seq-box">'+seqRows+'</div>'
      : '')

    +'</div>' // close pf-field Pflanzverband

    // Pflanzverband-Vorschau (immer)
    +'<div style="margin-top:4px;padding:14px;background:#f8f8f6;border-radius:8px;border:1px solid #d0cfc7">'
    +'<div style="font-size:11px;font-weight:700;color:#012d1d;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">🌱 Pflanzverband-Vorschau</div>'
    +'<div id="pv-preview-'+fl.id+'" style="min-height:40px"></div>'
    +'</div>'

    // Freitext (immer sichtbar)
    +'<div class="pf-field" style="margin-top:10px">'
    +'<label>Beschreibung / Sonderwünsche zum Pflanzverband (optional)</label>'
    +'<textarea class="pf-inp pf-verbandfreitext" data-fid="'+fl.id+'" rows="3" '
    +'placeholder="z.B. Außenreihe Weißdorn als Wildschutz, Klumpen im Zentrum 5× Weißtanne, Abteilungsgrenze mit Buche...">'+esc(fl.verbandFreitext)+'</textarea>'
    +'</div>'

    +'</div>'  // close pf-fl-item-body
    +'</div>';  // close pf-fl-item
}

function s1(){
  var html='<div class="pf-card">'
    +'<div class="pf-hd"><h2>📐 Aufforstungsfläche(n)</h2>'
    +'<p>Definieren Sie Ihre Flächen inkl. Pflanzenverteilung und Pflanzverband.</p></div>'
    +'<div class="pf-body">'
    +'<div class="pf-fl-list" id="fl-list">';
  S.flaechen.forEach(function(fl,i){ html+=flaecheHTML(fl,i); });
  html+='</div>'
    +'<button class="pf-add-fl" id="btn-add-fl">+ Weitere Fläche hinzufügen</button>'
    +'<div class="pf-err" id="e1"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b1">← Zurück</button>'
    +'<button class="pf-btn p" id="n1">Weiter →</button>'
    +'</div></div>';
  return html;
}

function bindListEvents1(){
  // Fläche header toggle
  document.querySelectorAll('.pf-fl-hd-click').forEach(function(hd){
    hd.addEventListener('click',function(e){
      if(e.target.closest('.pf-fl-del-btn')) return;
      var idx=parseInt(this.dataset.flidx);
      S.activeFl = (S.activeFl===idx) ? -1 : idx;
      rebuildFl1();
    });
  });

  // Delete Fläche
  document.querySelectorAll('.pf-fl-del-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var fid=this.dataset.delfl;
      S.flaechen=S.flaechen.filter(function(f){ return String(f.id)!==String(fid); });
      if(S.activeFl>=S.flaechen.length) S.activeFl=S.flaechen.length-1;
      rebuildFl1();
    });
  });

  // Text inputs for Fläche fields
  document.querySelectorAll('.pf-fl-inp').forEach(function(inp){
    inp.addEventListener('input',function(){
      var fid=this.dataset.fid, field=this.dataset.field;
      var fl=getFlaecheById(fid);
      if(fl && field) fl[field]=this.value;
      if(field==='ha'||field==='plz'||field==='ort') updateFlTitle(fid);
      // Pflanzverband-Vorschau aktualisieren wenn flächenrelevante Felder ändern
      if(field==='ha'||field==='abstand_p'||field==='abstand_r') drawPflanzverband(fid);
    });
    // Task 2: PLZ onBlur → Forstamt Smart Suggest aus Second Brain DB
    if(inp.dataset.field==='plz'){
      inp.addEventListener('blur',function(){
        var fid=this.dataset.fid, plz=this.value;
        if(!plz||plz.length<3) return;
        var fl=getFlaecheById(fid);
        if(!fl) return;
        fetch('https://ka-forstmanager.vercel.app/api/public/forstamt?plz='+encodeURIComponent(plz))
          .then(function(r){return r.json();})
          .then(function(data){
            if(!data||!data.length) return;
            // Auto-fill Forstamt if empty
            var faInp=document.getElementById('forstamt-'+fid);
            if(faInp&&!faInp.value){
              faInp.value=data[0].name;
              if(fl) fl.forstamt=data[0].name;
            }
            // Add datalist for suggestions
            var dlId='dl-fa-'+fid;
            var dl=document.getElementById(dlId);
            if(!dl){ dl=document.createElement('datalist'); dl.id=dlId; document.body.appendChild(dl); }
            dl.innerHTML=data.map(function(d){return '<option value="'+esc(d.name)+'">'+esc(d.plz+' '+d.ort)+'</option>';}).join('');
            if(faInp) faInp.setAttribute('list',dlId);
          })
          .catch(function(){});
      });
    }
  });

  // Hang toggle
  document.querySelectorAll('[data-hangfid]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=this.dataset.hangfid;
      var val=this.dataset.hangval==='1';
      var fl=getFlaecheById(fid);
      if(fl) fl.hang=val;
      document.querySelectorAll('[data-hangfid="'+fid+'"]').forEach(function(b){ b.classList.remove('on'); });
      this.classList.add('on');
    });
  });

  // Soil opts
  document.querySelectorAll('.pf-soil-opt').forEach(function(opt){
    opt.addEventListener('click',function(){
      var fid=this.dataset.fid, soil=this.dataset.soil;
      var fl=getFlaecheById(fid);
      if(fl) fl.boden=soil;
      document.querySelectorAll('[data-fid="'+fid+'"].pf-soil-opt').forEach(function(o){ o.classList.remove('on'); });
      this.classList.add('on');
    });
  });

  // Pflanzenverteilung inputs
  document.querySelectorAll('.pf-verteil-inp').forEach(function(inp){
    inp.addEventListener('input',function(){
      var fid=this.dataset.fid, tree=this.dataset.tree;
      var fl=getFlaecheById(fid);
      var val=Math.max(0,parseInt(this.value)||0);
      if(fl) fl.treeVerteilung[tree]=val;
      // Check totals
      var totalForTree=S.treeQty[tree]||0;
      var sum=S.flaechen.reduce(function(s,f){ return s+(parseInt(f.treeVerteilung[tree])||0); },0);
      if(sum>totalForTree){
        this.style.borderColor='#e53e3e';
        showErr('e1','Hinweis: Die Verteilung für "'+(TM[tree]?TM[tree].name:tree)+'" überschreitet die Gesamtmenge ('+fmt(sum)+' / '+fmt(totalForTree)+' Stk.). Bitte anpassen.');
      } else {
        this.style.borderColor='';
        hideErr('e1');
      }
      updateVerteilCounter();
    });
  });

  // Seq inputs
  document.querySelectorAll('.pf-seq-inp').forEach(function(inp){
    inp.addEventListener('input',function(){
      var fid=this.dataset.fid, tree=this.dataset.tree;
      var fl=getFlaecheById(fid);
      if(fl){ fl.seq[tree]=Math.max(0,parseInt(this.value)||0); drawPflanzverband(fid); }
    });
  });

  // Methode-Buttons
  document.querySelectorAll('.pf-meth-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=this.dataset.fid, methode=this.dataset.methode;
      var fl=getFlaecheById(fid);
      if(fl){ fl.verbandMethode=methode; rebuildFl1(); }
    });
  });

  // Reihenstart-Buttons
  document.querySelectorAll('.pf-rst-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      var fid=this.dataset.fid, rs=this.dataset.rstart;
      var fl=getFlaecheById(fid);
      if(fl){ fl.reihenStart=rs; rebuildFl1(); }
    });
  });

  // Außenreihe Checkbox
  document.querySelectorAll('.pf-aussenreihe-cb').forEach(function(cb){
    cb.addEventListener('change',function(){
      var fl=getFlaecheById(this.dataset.fid);
      if(fl){ fl.aussenreihe=this.checked; rebuildFl1(); }
    });
  });

  // Außenreihe Art
  document.querySelectorAll('.pf-aussenreihe-art').forEach(function(sel){
    sel.addEventListener('change',function(){
      var fl=getFlaecheById(this.dataset.fid);
      if(fl){ fl.aussenreiheArt=this.value; drawPflanzverband(this.dataset.fid); }
    });
  });

  // Verband-Freitext
  document.querySelectorAll('.pf-verbandfreitext').forEach(function(ta){
    ta.addEventListener('input',function(){
      var fl=getFlaecheById(this.dataset.fid);
      if(fl) fl.verbandFreitext=this.value;
    });
  });

  updateVerteilCounter();
  // Initiale Pflanzverband-Vorschau für alle Flächen
  S.flaechen.forEach(function(fl){ drawPflanzverband(fl.id); });
}

function bindOuter1(){
  // Add Fläche
  document.getElementById('btn-add-fl').addEventListener('click',function(){
    var fl=newFlaeche(Date.now());
    // Task 3: Daten aus erster Fläche übernehmen (Forstamt, Revier, PLZ, Ort)
    if(S.flaechen.length>0){
      var src=S.flaechen[0];
      fl.forstamt=src.forstamt||'';
      fl.revier=src.revier||'';
      fl.plz=src.plz||'';
      fl.ort=src.ort||'';
    }
    S.flaechen.push(fl);
    S.activeFl=S.flaechen.length-1;
    rebuildFl1();
  });

  // Back: Vorhanden-Pfad → zurück zu Herkunft (11), Bestellen-Pfad → zurück zu Lieferort (1)
  document.getElementById('b1').addEventListener('click',function(){
    if(S.bezugsquelle === 'vorhanden') go(11);
    else go(1);
  });

  // Next
  document.getElementById('n1').addEventListener('click',function(){
    // Read current DOM values
    S.flaechen.forEach(function(fl){
      ['forstamt','revier','ha','plz','ort','abstand_p','abstand_r','verbandFreitext'].forEach(function(field){
        var inp=document.getElementById(field+'-'+fl.id);
        if(inp) fl[field]=inp.value;
      });
    });
    // Validate
    var ok=true, errMsg='';
    S.flaechen.forEach(function(fl,i){
      if(!ok) return;
      if(!fl.ha||isNaN(parseFloat(fl.ha))){ ok=false; errMsg='Fläche '+(i+1)+': Bitte gültige Größe (ha) eingeben'; }
      else if(!fl.plz||fl.plz.length<4){ ok=false; errMsg='Fläche '+(i+1)+': Bitte gültige PLZ eingeben'; }
      else if(!fl.ort.trim()){ ok=false; errMsg='Fläche '+(i+1)+': Bitte Ort eingeben'; }
    });
    if(!ok){ showErr('e1',errMsg); return; }
    go(3);
  });
}

function rebuildFl1(){
  var list=document.getElementById('fl-list');
  if(!list) return;
  var html='';
  S.flaechen.forEach(function(fl,i){ html+=flaecheHTML(fl,i); });
  list.innerHTML=html;
  bindListEvents1();
  updateVerteilCounter();
  S.flaechen.forEach(function(fl){ drawPflanzverband(fl.id); });
}

// ── Fördercheck Daten ─────────────────────────────────────────────────────────
// ── Förderprogramme — URL-geprüft 07.03.2026 (alle Links HTTP 200 verifiziert) ──
var FOERDER = {
  BY:[
    {id:'waldfoerp',name:'WALDFÖPR — Bayerische Waldförderung',
      desc:'Waldumbau, Pflanzung, Kulturschutz, Zaunbau — Privat- und Körperschaftswald',
      rate:'Bis 70% (Kleinprivatwald bis 90%)',
      url:'https://www.stmelf.bayern.de/foerderung/index.html',
      keyPoints:[
        '✅ Waldumbau zu Misch- und Laubbaumarten förderfähig',
        '✅ Pflanzung, Kulturpflege, Zaunbau eingeschlossen',
        '📋 Antrag über das zuständige AELF Bayern',
        '📐 Mindestfläche: 0,3 ha',
        '👥 Nur Privat- und Körperschaftswald antragsberechtigt',
        '💡 Kleinprivatwald (< 5 ha): bis 90% Förderung',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm — Bayern setzt konkrete Maßnahmen um',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  HE:[
    {id:'he-forst',name:'Forstförderung Hessen',
      desc:'Waldumbau, Wiederaufforstung, Kulturschutz — Privat- und Körperschaftswald',
      rate:'Pauschalen je Maßnahme',
      url:'https://landwirtschaft.hessen.de/landwirtschaft/foerderung',
      keyPoints:[
        '✅ Wiederaufforstung nach Kalamität förderfähig',
        '✅ Waldumbau: Rein- → Mischbestand',
        '✅ Kulturschutz: Zaunbau, Einzelschutz',
        '📋 Antrag über das zuständige Landwirtschaftsamt',
        '💰 Pauschalen je Maßnahmenart',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  NRW:[
    {id:'priko',name:'FöRL Privat- und Körperschaftswald NRW',
      desc:'Wiederaufforstung, Waldumbau, Kulturpflege — vollständig digitales Verfahren',
      rate:'Je Maßnahme verschieden',
      url:'https://www.waldbauernlotse.de/massnahmen-im-privat-und-koerperschaftswald',
      keyPoints:[
        '✅ Waldumbau Reinbestand → klimaangepasster Mischbestand',
        '✅ Wiederaufforstung auf Kalamitätsflächen + Wiederbewaldungsprämie',
        '✅ Initialbegründung und WET-Förderung',
        '✅ Biotop- und Artenschutz eingeschlossen',
        '✅ Bodenschutzkalkungen und Wegebau förderfähig',
        '💻 100% digitales Antragsverfahren über Waldweb NRW',
      ]},
    {id:'nrw-dienst',name:'Forstliche Dienstleistungen NRW',
      desc:'Förderung forstlicher Dienstleistungen für Forstwirtschaftliche Zusammenschlüsse',
      rate:'80% (FWZ) / 90% (Waldgenossenschaften)',
      url:'https://www.waldbauernlotse.de/forstliche-dienstleistungen',
      keyPoints:[
        '👥 Nur für Forstwirtschaftliche Zusammenschlüsse und Waldgenossenschaften',
        '💰 80% (Zusammenschluss) oder 90% (Genossenschaft)',
        '💡 Direktvergabe bis 100.000 € ohne Angebotseinholung möglich',
        '📋 Antrag an Geschäftsstelle Forst / Direkte Förderung Münster',
        '⚠️ Vertragsschluss erst nach Antragstellung!',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  RP:[
    {id:'rp-forst',name:'Forstförderung Rheinland-Pfalz',
      desc:'Waldumbau, Wiederaufforstung und Waldpflege — Landesforsten RLP',
      rate:'Je nach aktueller Richtlinie',
      url:'https://mwvlw.rlp.de/',
      keyPoints:[
        '✅ Wiederaufforstung nach Kalamität förderfähig',
        '✅ Waldumbau und Bestandespflege gefördert',
        '✅ Kulturschutzmaßnahmen eingeschlossen',
        '📋 Antrag über das zuständige Forstamt / Revierförsterei',
        '💡 Tipp: Direktauftrag bis 5.000 € ohne Ausschreibung möglich',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  TH:[
    {id:'th-forst',name:'Forstförderung Thüringen',
      desc:'Waldumbau, Wiederbewaldung, Jungbestandspflege — ThüringenForst / TMUEN',
      rate:'Je nach Maßnahme und aktueller Richtlinie',
      url:'https://umwelt.thueringen.de/themen/wald-und-forstwirtschaft/foerderung',
      keyPoints:[
        '✅ Wiederbewaldung nach Kalamität förderfähig',
        '✅ Waldumbau: Rein- → Laubmischbestand',
        '✅ Jungbestandspflege gefördert',
        '📋 ELER-Förderung — Antrag über ThüringenForst',
        '🌿 Schwerpunkt: klimastabile Laubbaumarten',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  BW:[
    {id:'bw-forst',name:'Forstförderung Baden-Württemberg',
      desc:'Waldumbau, Wiederaufforstung — Antrag beim Regierungspräsidium',
      rate:'Je nach Richtlinie',
      url:'https://www.forstbw.de/',
      keyPoints:[
        '✅ Wiederaufforstung und Waldumbau förderfähig',
        '✅ Kulturschutz und Pflanzung eingeschlossen',
        '📋 Antrag über das zuständige Regierungspräsidium',
        '💡 Direktauftrag bis 5.000 € (LVG BW) ohne Ausschreibung',
        '🌿 Schwerpunkt: Misch- und Laubbaumarten',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  NI:[
    {id:'ni-forst',name:'Forstförderung Niedersachsen (KLARA)',
      desc:'Wiederaufforstung, Kulturpflege, Waldschutz — ELER 2023–2027',
      rate:'Je nach Maßnahme — Pauschalen',
      url:'https://www.ml.niedersachsen.de/startseite/',
      keyPoints:[
        '✅ Kalamitätsflächen-Wiederaufforstung förderfähig',
        '✅ Waldumbau und Kulturpflege eingeschlossen',
        '✅ Bodenschutzkalkungen gefördert',
        '📋 KLARA-Förderung (ELER 2023–2027) — Antrag über Forstamt',
        '🌿 Schwerpunkt: klimaangepasste Baumarten',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  SN:[
    {id:'sn-forst',name:'Waldförderung Sachsen (SMUL)',
      desc:'Waldumbau, Pflanzung, Schutzmaßnahmen — Sächsisches Förderportal',
      rate:'Je nach Maßnahme und Programm',
      url:'https://www.smul-foerderung.sachsen.de/',
      keyPoints:[
        '✅ Waldumbau und Wiederaufforstung förderfähig',
        '✅ ELER-Förderung: Waldschutz und Klimaanpassung',
        '✅ GAK-Maßnahmen im Privat- und Körperschaftswald',
        '📋 Antrag über das Sächsische Förderportal (SMUL)',
        '🌿 Schwerpunkt: klimastabile Mischwälder',
      ]},
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm',
      rate:'50–90% je nach Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und BL',
        '📋 Antrag über das zuständige Forstamt',
      ]},
  ],
  DEFAULT:[
    {id:'gak',name:'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc:'Bundesweites Rahmenprogramm — alle Bundesländer setzen Maßnahmen konkret um',
      rate:'50–90% je nach BL und Maßnahme',
      url:'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints:[
        '🇩🇪 Kofinanzierung Bund + Bundesland',
        '✅ Waldumbau, Klimaanpassung, Schutzmaßnahmen förderbar',
        '💰 50–90% Förderanteil je nach Maßnahme und Bundesland',
        '📋 Antrag über das zuständige Landes-Forstamt',
        '📋 Gilt in allen 16 Bundesländern',
      ]},
    {id:'kwmplus',name:'KWM PLUS — Klimaangepasstes Waldmanagement (in Vorbereitung)',
      desc:'Bundesprogramm Ökosystemleistungen + Klimaanpassung — Richtlinie 12/2024, Antrag noch nicht möglich',
      rate:'Fördersätze in Abstimmung',
      url:'https://www.klimaanpassung-wald.de',
      keyPoints:[
        '🌿 BMUKN-Bundesprogramm für naturnahe Wälder',
        '✅ Waldumbau → stabile Laubmischwälder',
        '✅ Ökosystemleistungen werden honoriert',
        '⚠️ Antragstellung aktuell NOCH NICHT möglich (Stand März 2026)',
        '📧 Infos: klimaanpassung-wald@fnr.de',
      ]},
  ]
};

function renderFoerderProgs(bl, targetId){
  var el=document.getElementById(targetId||'foerder-prog-list');
  if(!el) return;
  var progs=FOERDER[bl]||FOERDER.DEFAULT;
  S.bundesland=bl;
  // Reset selections that no longer exist in new BL
  S.foerderProgramme=S.foerderProgramme.filter(function(id){ return progs.some(function(p){ return p.id===id; }); });
  var html='<div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">';
  progs.forEach(function(p){
    var checked=S.foerderProgramme.indexOf(p.id)>-1;
    html+='<div style="padding:10px 12px;background:#fff;border-radius:8px;border:1px solid '+(checked?'#012d1d':'#e0e0d8')+';transition:border 0.2s">'
      +'<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">'
      +'<input type="checkbox" class="foerder-prog-cb" data-progid="'+p.id+'" '+(checked?'checked':'')+' style="width:16px;height:16px;margin-top:3px;accent-color:#012d1d;flex-shrink:0">'
      +'<div style="flex:1;min-width:0">'
      +'<div style="font-size:13px;font-weight:600;color:#2d2d2a">'+esc(p.name)+'</div>'
      +'<div style="font-size:11px;color:#666;margin-top:1px">'+esc(p.desc)+'</div>'
      +'<div style="font-size:11px;color:#012d1d;font-weight:600;margin-top:3px">💰 '+esc(p.rate)+'</div>'
      +(p.keyPoints&&p.keyPoints.length?'<ul style="margin:6px 0 0 0;padding:0 0 0 16px;font-size:11px;color:#555;line-height:1.6">'+p.keyPoints.map(function(k){return'<li>'+esc(k)+'</li>';}).join('')+'</ul>':'')
      +'</div>'
      +'</label>'
      +(p.url?'<a href="'+p.url+'" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;margin-left:26px;font-size:11px;color:#012d1d;text-decoration:none;border:1px solid #d0cfc7;border-radius:5px;padding:3px 9px;background:#f8f8f6">🔗 Weitere Informationen</a>':'')
      +'</div>';
  });
  html+='</div>';
  el.innerHTML=html;
  // Bind checkbox events
  el.querySelectorAll('.foerder-prog-cb').forEach(function(cb){
    cb.addEventListener('change',function(){
      var id=this.dataset.progid;
      if(this.checked){
        if(S.foerderProgramme.indexOf(id)===-1) S.foerderProgramme.push(id);
        this.closest('label').style.borderColor='#012d1d';
      } else {
        S.foerderProgramme=S.foerderProgramme.filter(function(x){ return x!==id; });
        this.closest('label').style.borderColor='#e0e0d8';
      }
    });
  });
}

// ── Pflanzverband Vorschau-Animation ──────────────────────────────────────────
function pvDot(color,name,size){
  size=size||18;
  var ds=window.innerWidth<600?Math.floor(size*0.7):size; return '<div title="'+esc(name)+'" style="width:'+ds+'px;height:'+ds+'px;border-radius:50%;background:'+color+';flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.15)"></div>';
}
function pvLegend(sel,fl,showSeq){
  var legend='<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;padding-top:8px;border-top:1px dashed #d4edd9">';
  sel.forEach(function(t,i){
    var n=parseInt(fl.seq[t.k])||1; var c=col(i);
    legend+='<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:#555">'
      +'<span style="width:10px;height:10px;border-radius:50%;background:'+c.tx+';display:inline-block;flex-shrink:0"></span>'
      +(showSeq?'<strong>'+n+'×</strong> ':'')+esc(t.name)+'</span>';
  });
  if(fl.aussenreihe&&fl.aussenreiheArt){
    var at=TM[fl.aussenreiheArt];
    if(at) legend+='<span style="font-size:11px;color:#A3E635;border:1px solid #A3E635;border-radius:4px;padding:0 5px">Außenreihe: '+esc(at.name)+'</span>';
  }
  legend+='</div>';
  return legend;
}

function drawPflanzverband(flId){
  var el=document.getElementById('pv-preview-'+flId);
  if(!el) return;
  var fl=getFlaecheById(String(flId));
  if(!fl) return;
  var sel=getSelTrees();
  var m=fl.verbandMethode||'reihe';

  // Stueckzahl-Info (unabhängig von Methode und Baumarten)
  var haVal=parseFloat(fl.ha)||0;
  var ap=parseFloat(fl.abstand_p||2), ar=parseFloat(fl.abstand_r||2);
  var stueckzahl = ap>0&&ar>0&&haVal>0 ? Math.round(haVal*10000/(ap*ar)) : 0;
  var infoHtml = stueckzahl>0
    ? '<div style="font-size:11px;color:#555;margin-bottom:6px">📊 Ca. <strong>'+stueckzahl.toLocaleString('de-DE')+'</strong> Pflanzen auf '+haVal+' ha bei '+ap+'m × '+ar+'m Abstand</div>'
    : '';

  if(m==='frei'){
    el.innerHTML=infoHtml+'<p style="color:#012d1d;font-size:12px;margin:0;font-style:italic">✏️ Freie Beschreibung — bitte im Textfeld unten beschreiben.</p>';
    return;
  }
  if(!sel.length){
    el.innerHTML=infoHtml+'<p style="color:#666;font-size:12px;margin:0;font-style:italic">Keine Baumarten ausgewählt — Vorschau zeigt Anordnungsmuster</p>'
      +'<div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">'
      +(function(){var r='';for(var i=0;i<15;i++)r+=pvDot('#012d1d','Pflanze',14);return r;})()
      +'</div>';
    return;
  }

  var html=infoHtml;

  if(m==='reihe'||m==='quincunx'){
    // Wiederholungseinheit aufbauen
    var unit=[];
    sel.forEach(function(t,i){ var n=Math.max(0,parseInt(fl.seq[t.k])||1); var c=col(i); for(var j=0;j<n;j++) unit.push({color:c.tx,name:t.name,key:t.k}); });
    if(!unit.length){ el.innerHTML='<p style="color:#666;font-size:12px;margin:0">Reihenfolge-Werte alle 0</p>'; return; }
    var isMobile=window.innerWidth<600; var ROWS=isMobile?3:5; var REPS=isMobile?Math.min(3,Math.floor(24/unit.length)):Math.min(5,Math.floor(36/unit.length));
    var aussenIdx=sel.findIndex(function(t){return t.k===fl.aussenreiheArt;}); var aussenCol=fl.aussenreihe&&fl.aussenreiheArt&&TM[fl.aussenreiheArt]?(aussenIdx>=0?col(aussenIdx):{bg:"#A3E63522",bd:"#A3E63555",tx:"#A3E635"}):null;
    var aussenName=aussenCol&&TM[fl.aussenreiheArt]?TM[fl.aussenreiheArt].name:'';
    html+='<div style="display:flex;flex-direction:column;gap:'+(isMobile?'2':'4')+'px;max-width:100%;overflow-x:auto">';
    for(var r=0;r<ROWS;r++){
      var isAussen=(fl.aussenreihe&&aussenCol)&&(r===0||r===ROWS-1);
      html+='<div style="display:flex;gap:4px;align-items:center">';
      if(isAussen){
        // Außenreihe: volle Breite mit Außenreihe-Art
        for(var x=0;x<REPS*unit.length;x++) html+=pvDot(aussenCol.tx,aussenName);
        html+='<span style="font-size:10px;color:#A3E635;margin-left:4px">← Außenreihe</span>';
      } else {
        // Versatz bestimmen
        var offset=0;
        if(m==='quincunx'&&r%2===1) offset=Math.floor(unit.length/2);
        else if(fl.reihenStart==='quincunx'&&r%2===1) offset=Math.floor(unit.length/2);
        else if(fl.reihenStart==='alternierend') offset=r%unit.length;
        var rowUnit=offset>0 ? unit.slice(offset).concat(unit.slice(0,offset)) : unit;
        // Einrückung für Quincunx
        if((m==='quincunx'||(fl.reihenStart==='quincunx'))&&r%2===1) html+='<div style="width:11px;flex-shrink:0"></div>';
        for(var rep=0;rep<REPS;rep++) rowUnit.forEach(function(p){ html+=pvDot(p.color,p.name); });
      }
      html+='</div>';
    }
    html+='</div>';
    html+=pvLegend(sel,fl,true);
  }

  else if(m==='trupp'){
    var tSize=7;
    html+='<div style="display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start">';
    sel.forEach(function(t,i){
      var n=Math.max(1,parseInt(fl.seq[t.k])||tSize);
      var c=col(i);
      html+='<div style="padding:10px 12px;background:'+c.bg+';border:1.5px dashed '+c.bd+';border-radius:12px">'
        +'<div style="font-size:10px;color:'+c.tx+';font-weight:600;margin-bottom:5px">'+esc(t.name)+' ('+n+' Pfl.)</div>'
        +'<div style="position:relative;width:'+(Math.ceil(Math.sqrt(n))*28)+'px;height:'+(Math.ceil(Math.sqrt(n))*28)+'px">';
      for(var k=0;k<n&&k<25;k++){
        var angle=k*137.5*Math.PI/180;var rad=12+k*6;
        var px=50+Math.cos(angle)*rad*(0.7+Math.sin(k*2.1)*0.3);
        var py=50+Math.sin(angle)*rad*(0.7+Math.cos(k*1.7)*0.3);
        html+='<div title="'+esc(t.name)+'" style="position:absolute;left:'+px.toFixed(0)+'%;top:'+py.toFixed(0)+'%;width:15px;height:15px;border-radius:50%;background:'+c.tx+';opacity:0.85;transform:translate(-50%,-50%)"></div>';
      }
      html+='</div></div>';
    });
    html+='</div>';
    html+='<p style="font-size:11px;color:#666;margin:8px 0 0">Trupps unregelm\u00e4\u00dfig verteilt \u00fcber die Fl\u00e4che \u2014 Abstand: '+fl.abstand_r+'m</p>';
    html+=pvLegend(sel,fl,false);
  }

  else if(m==='nester'){
    var tSize=4;
    html+='<div style="display:flex;flex-wrap:wrap;gap:8px;align-items:flex-start">';
    sel.forEach(function(t,i){
      var n=Math.max(1,parseInt(fl.seq[t.k])||tSize);
      var c=col(i);
      var nestR=Math.min(n,7);
      html+='<div style="padding:8px;background:'+c.bg+';border:1.5px solid '+c.bd+';border-radius:50%">'
        +'<div style="font-size:9px;color:'+c.tx+';font-weight:600;text-align:center;margin-bottom:3px">'+esc(t.name)+'</div>'
        +'<div style="position:relative;width:60px;height:60px">';
      for(var k=0;k<nestR&&k<25;k++){
        var angle=k*(360/nestR)*Math.PI/180;var rad=k===0?0:18;
        var px=50+Math.cos(angle)*rad;
        var py=50+Math.sin(angle)*rad;
        html+='<div title="'+esc(t.name)+'" style="position:absolute;left:'+px.toFixed(0)+'%;top:'+py.toFixed(0)+'%;width:12px;height:12px;border-radius:50%;background:'+c.tx+';opacity:0.9;transform:translate(-50%,-50%)"></div>';
      }
      html+='</div>'
        +'<div style="font-size:9px;color:'+c.tx+';text-align:center;margin-top:2px">('+n+' Pfl.)</div>'
        +'</div>';
    });
    html+='</div>';
    html+='<p style="font-size:11px;color:#666;margin:8px 0 0">Nester eng beieinander \u2014 Nestabstand: '+fl.abstand_r+'m</p>';
    html+=pvLegend(sel,fl,false);
  }
  else if(m==='streifen'){
    var strSel=sel.filter(function(t){ return (parseInt(fl.seq[t.k])||1)>0; });
    html+='<div style="display:flex;flex-direction:column;gap:3px;border-radius:6px;overflow:hidden">';
    var totalStreifen=strSel.reduce(function(s,t){ return s+(parseInt(fl.seq[t.k])||1); },0);
    var VIEWREPS=2;
    for(var sv=0;sv<VIEWREPS;sv++){
      strSel.forEach(function(t,i){
        var n=parseInt(fl.seq[t.k])||1; var c=col(sel.indexOf(t));
        for(var sr=0;sr<n;sr++){
          html+='<div style="display:flex;gap:4px;padding:3px 6px;background:'+c.bg+';border-left:4px solid '+c.tx+'">';
          for(var sc=0;sc<8;sc++) html+=pvDot(c.tx,t.name,14);
          html+='<span style="font-size:10px;color:'+c.tx+';font-weight:600;align-self:center;margin-left:4px">'+esc(t.name)+'</span>';
          html+='</div>';
        }
      });
    }
    html+='</div>';
    html+=pvLegend(sel,fl,true);
  }

  el.innerHTML=html||'<p style="color:#666;font-size:12px;margin:0">Keine Vorschau verfügbar</p>';
}

function updateVerteilCounter(){
  // Aktualisiert alle Inline-"Noch frei"-Badges direkt neben den Inputs
  var sel=getSelTrees();
  sel.forEach(function(t){
    var total=S.treeQty[t.k]||0;
    var verteilt=S.flaechen.reduce(function(s,fl){ return s+(parseInt(fl.treeVerteilung[t.k])||0); },0);
    var frei=total-verteilt;
    var clr=frei===0?'#012d1d':frei<0?'#e53e3e':'#b7791f';
    var bg =frei===0?'#d4f0eb':frei<0?'#ffe5e5':'#fff8e1';
    var icon=frei===0?'✅':frei<0?'⚠️':'🌱';
    var txt=icon+' '+Math.abs(frei)+' '+(frei<0?'zu viel':frei===0?'verteilt':'frei');
    // Alle Badges mit diesem tree-key aktualisieren (in jeder Fläche sichtbar)
    document.querySelectorAll('.vt-free-badge[data-tree="'+t.k+'"]').forEach(function(el){
      el.textContent=txt;
      el.style.color=clr;
      el.style.background=bg;
    });
  });
}

function updateFlTitle(fid){
  var fl=getFlaecheById(fid);
  if(!fl) return;
  var idx=S.flaechen.indexOf(fl);
  var title=document.querySelector('#fl-'+fid+' .pf-fl-item-title');
  var sub=document.querySelector('#fl-'+fid+' .pf-fl-item-sub');
  if(title) title.textContent='Fläche '+(idx+1)+(fl.ha?' — '+fl.ha+' ha':'');
  if(sub){
    var parts=[];
    if(fl.plz||fl.ort) parts.push((fl.plz+' '+fl.ort).trim());
    sub.textContent=parts.length?parts.join(' · '):'Bitte ausfüllen';
  }
}

// ── Darmstädter Preistyp-Handler ─────────────────────────────────────────────
window._pfPT = function(treeKey, idx, typ) {
  var angebote = DARMST_ANGEBOTE[treeKey];
  if(!angebote || !angebote[idx]) return;
  var an = angebote[idx];
  for(var i=0; i<S.selectedAngebote.length; i++){
    var sa = S.selectedAngebote[i];
    if(sa.baumart_key===treeKey && sa.q===an.q && sa.h===an.h){
      sa.preistyp = typ;
      break;
    }
  }
  render();
};

// ── Darmstädter HKG-Handler ───────────────────────────────────────────────────
window._pfSetHKG = function(treeKey, idx, code) {
  var angebote = DARMST_ANGEBOTE[treeKey];
  if(!angebote || !angebote[idx]) return;
  var an = angebote[idx];
  for(var i=0; i<S.selectedAngebote.length; i++){
    var sa = S.selectedAngebote[i];
    if(sa.baumart_key===treeKey && sa.q===an.q && sa.h===an.h){
      sa.hkg = code;
      break;
    }
  }
};

// Legacy global window functions
window.toggleFlaeche=function(id){
  var idx=S.flaechen.findIndex(function(f){ return String(f.id)===String(id); });
  if(idx>=0){ S.activeFl=(S.activeFl===idx)?-1:idx; rebuildFl1(); }
};
window.delFlaeche=function(id){
  S.flaechen=S.flaechen.filter(function(f){ return String(f.id)!==String(id); });
  if(S.activeFl>=S.flaechen.length) S.activeFl=S.flaechen.length-1;
  rebuildFl1();
};

// ── Step 2: Zeitraum ──────────────────────────────────────────────────────────
function s2(){
  var opts=kaSeasons().map(function(o){
    return '<option value="'+o[0]+'"'+(S.zeitraum===o[0]?' selected':'')+'>'+o[1]+'</option>';
  }).join('');
  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>📅 Zeitraum & Anmerkungen</h2><p>Pflanzungen: März–Mai (Frühjahr) oder Oktober–November (Herbst)</p></div>'
    +'<div class="pf-body">'
    +'<div class="pf-field"><label>Gewünschter Pflanzzeitraum *</label>'
    +'<select class="pf-inp" id="i-zt"><option value="">— bitte wählen —</option>'+opts+'</select></div>'
    +'<div class="pf-field"><label>Anmerkungen (optional)</label>'
    +'<textarea class="pf-inp" id="i-bem" rows="3" placeholder="Besondere Wünsche, Zufahrt, Vorgeschichte...">'+esc(S.bemerkung)+'</textarea></div>'

    // ── Fördercheck Sektion ──
    +'<div style="margin-top:20px;padding:18px;background:#f8f8f6;border-radius:12px;border:1px solid #d0cfc7">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:6px">'
    +'<h4 style="margin:0;color:#012d1d;font-size:15px;font-weight:700">🏦 Fördermöglichkeiten prüfen</h4>'
    +'<a href="/foerdercheck/" target="_blank" style="font-size:12px;color:#012d1d;text-decoration:none;border:1px solid #012d1d;border-radius:6px;padding:3px 10px;white-space:nowrap">Vollständiger Fördercheck →</a>'
    +'</div>'
    +'<p style="font-size:12px;color:#556;margin:0 0 12px;line-height:1.5">Viele Aufforstungsmaßnahmen werden mit <strong>50–90%</strong> gefördert. Wählen Sie Ihr Bundesland und sehen Sie passende Programme:</p>'
    +'<select class="pf-inp" id="i-bl" style="margin-bottom:12px">'
    +'<option value="">— Bundesland wählen —</option>'
    +'<option value="BY"'+(S.bundesland==='BY'?' selected':'')+'>Bayern</option>'
    +'<option value="HE"'+(S.bundesland==='HE'?' selected':'')+'>Hessen</option>'
    +'<option value="NRW"'+(S.bundesland==='NRW'?' selected':'')+'>Nordrhein-Westfalen</option>'
    +'<option value="RP"'+(S.bundesland==='RP'?' selected':'')+'>Rheinland-Pfalz</option>'
    +'<option value="TH"'+(S.bundesland==='TH'?' selected':'')+'>Thüringen</option>'
    +'<option value="BW"'+(S.bundesland==='BW'?' selected':'')+'>Baden-Württemberg</option>'
    +'<option value="NI"'+(S.bundesland==='NI'?' selected':'')+'>Niedersachsen</option>'
    +'<option value="SN"'+(S.bundesland==='SN'?' selected':'')+'>Sachsen</option>'
    +'<option value="ST"'+(S.bundesland==='ST'?' selected':'')+'>Sachsen-Anhalt</option>'
    +'<option value="MV"'+(S.bundesland==='MV'?' selected':'')+'>Mecklenburg-Vorpommern</option>'
    +'<option value="BB"'+(S.bundesland==='BB'?' selected':'')+'>Brandenburg</option>'
    +'<option value="SL"'+(S.bundesland==='SL'?' selected':'')+'>Saarland</option>'
    +'<option value="SH"'+(S.bundesland==='SH'?' selected':'')+'>Schleswig-Holstein</option>'
    +'<option value="DEFAULT">Anderes Bundesland</option>'
    +'</select>'
    +'<div id="foerder-prog-list">'
    +(S.bundesland ? (function(){ renderFoerderProgs(S.bundesland); return ''; })() : '<p style="font-size:12px;color:#666;margin:0;font-style:italic">Bundesland wählen um passende Programme zu sehen</p>')
    +'</div>'
    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding-top:14px;border-top:1px solid #d0cfc7">'
    +'<input type="checkbox" id="i-foerder-s2" '+(S.foerderBeratungS2?'checked':'')+' style="width:18px;height:18px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span style="font-size:13px;line-height:1.4"><strong>Förderberatung anfragen</strong><br><small style="color:#666">Wir prüfen kostenlos alle Fördermöglichkeiten für Ihr konkretes Projekt und unterstützen bei der Antragstellung.</small></span>'
    +'</label>'
    +'</div>'

    +'<div class="pf-err" id="e2"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b2">← Zurück</button>'
    +'<button class="pf-btn p" id="n2">Weiter →</button>'
    +'</div></div>';
}
function bind2(){
  document.getElementById('i-zt').addEventListener('change',function(){ S.zeitraum=this.value; });
  document.getElementById('i-bem').addEventListener('input',function(){ S.bemerkung=this.value; });
  // Bundesland Selector
  var blSel=document.getElementById('i-bl');
  if(blSel){
    if(S.bundesland) renderFoerderProgs(S.bundesland);
    blSel.addEventListener('change',function(){
      S.bundesland=this.value;
      if(this.value) renderFoerderProgs(this.value);
      else { var el=document.getElementById('foerder-prog-list'); if(el) el.innerHTML='<p style="font-size:12px;color:#666;margin:0;font-style:italic">Bundesland wählen um passende Programme zu sehen</p>'; }
    });
  }
  var foerderS2=document.getElementById('i-foerder-s2');
  if(foerderS2) foerderS2.addEventListener('change',function(){ S.foerderBeratungS2=this.checked; });

  document.getElementById('b2').addEventListener('click',function(){ go(2); });
  document.getElementById('n2').addEventListener('click',function(){
    S.zeitraum=document.getElementById('i-zt').value;
    S.bemerkung=document.getElementById('i-bem').value;
    var fs=document.getElementById('i-foerder-s2'); if(fs) S.foerderBeratungS2=fs.checked;
    if(!S.zeitraum){ showErr('e2','Bitte Zeitraum wählen.'); return; }
    go(4);
  });
}

// ── Step 3: Kontakt ───────────────────────────────────────────────────────────
function s3(){
  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>👤 Ihre Kontaktdaten</h2><p>Wir melden uns innerhalb von 48 Stunden mit einem Angebot.</p></div>'
    +'<div class="pf-body">'
    +'<div style="background:#f8f8f6;border-left:3px solid #012d1d;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:12px;color:#012d1d;line-height:1.6">'
    +'<strong>💡 Hinweis für öffentliche Auftraggeber</strong><br>'
    +'Gemeinden und Körperschaften des öffentlichen Rechts können Aufträge bis <strong>5.000 €</strong> (BW) bzw. <strong>3.000 €</strong> direkt vergeben — '
    +'ganz ohne Ausschreibungsverfahren. Ideal als unkomplizierter Einstieg.'
    +'</div>'
    +'<div class="pf-field"><label>Vollständiger Name *</label>'
    +'<input class="pf-inp" type="text" id="i-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name"></div>'
    +'<div class="pf-field"><label>E-Mail-Adresse *</label>'
    +'<input class="pf-inp" type="email" id="i-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email"></div>'
    +'<div class="pf-g2">'
    +'<div class="pf-field"><label>Telefon (optional)</label>'
    +'<input class="pf-inp" type="tel" id="i-tel" value="'+esc(S.tel)+'" placeholder="+49 ..." autocomplete="tel"></div>'
    +'<div class="pf-field">'
    +'<label>Treffpunkt mit F\u00f6rster <span style="color:#aaa;font-size:11px">(optional)</span></label>'
    +'<input type="text" id="pflanzung-treffpunkt" placeholder="z.B. Parkplatz Waldweg / GPS-Koordinaten / Forststra\u00dfe km 3" style="width:100%;border:1px solid var(--n300,#d1d5db);border-radius:6px;padding:8px 10px;font-size:14px;box-sizing:border-box" oninput="S.treffpunkt=this.value">'
    +'</div>'
    +'<div class="pf-field"><label>Forstbetrieb / Organisation</label>'
    +'<input class="pf-inp" type="text" id="i-fi" value="'+esc(S.firma)+'" placeholder="Optional" autocomplete="organization"></div>'
    +'<div class="pf-field"><label>Waldbesitzertyp</label>'
    +'<select class="pf-inp" id="i-wbt"><option value="">— bitte wählen —</option>'
    +'<option value="privatwald"'+(S.waldbesitzertyp==="privatwald"?' selected':'')+'>Privatwald</option>'
    +'<option value="koerperschaftswald"'+(S.waldbesitzertyp==="koerperschaftswald"?' selected':'')+'>Körperschaftswald</option>'
    +'<option value="staatswald"'+(S.waldbesitzertyp==="staatswald"?' selected':'')+'>Staatswald</option>'
    +'<option value="kirchenwald"'+(S.waldbesitzertyp==="kirchenwald"?' selected':'')+'>Kirchenwald</option>'
    +'</select></div>'
    +'</div>'
    +'<div class="pf-field" style="margin-top:8px;">'
    +'<label>Karten oder Dokumente hochladen (optional)</label>'
    +'<input class="pf-inp" type="file" id="i-docs" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" multiple style="padding:10px 12px;cursor:pointer;">'
    +'<p style="font-size:0.8rem;color:var(--n400,#a8a8a0);margin-top:4px;">z.B. Flurkarten, Lagepläne, Fotos der Fläche (max. 10 MB)</p>'
    +'</div>'
    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="i-beratung" style="width:18px;height:18px;margin-top:2px;accent-color:#012d1d;flex-shrink:0"'+(S.beratungsgespraech?' checked':'')+' >'
    +'<span><strong>💬 Persönliches Beratungsgespräch anfragen</strong><br><small style="color:#666">Vor Angebotserstellung direkt mit unserem Forstexperten sprechen.</small></span>'
    +'</label>'
    +'<div class="pf-field" style="margin-top:12px;">'
    +'<label>Anmerkungen / Sonderwünsche (optional)</label>'
    +'<textarea class="pf-inp" id="i-bem3" rows="3" placeholder="Weitere Hinweise zur Anfrage..." style="resize:vertical">'+esc(S.bemerkung||'')+'</textarea>'
    +'</div>'
    +'<div class="pf-err" id="e3"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b3">← Zurück</button>'
    +'<button class="pf-btn p" id="n3">Zur Übersicht →</button>'
    +'</div></div>';
}
function bind3(){
  var inm=document.getElementById('i-nm'), iem=document.getElementById('i-em'),
      itel=document.getElementById('i-tel'), ifi=document.getElementById('i-fi');
  inm.addEventListener('input',function(){ S.name=this.value; });
  iem.addEventListener('input',function(){ S.email=this.value; });
  itel.addEventListener('input',function(){ S.tel=this.value; });
  ifi.addEventListener('input',function(){ S.firma=this.value; });
  var iwbt2=document.getElementById("i-wbt"); if(iwbt2) iwbt2.addEventListener("change",function(){ S.waldbesitzertyp=this.value; });
  var idocs=document.getElementById('i-docs');
  var iberatung=document.getElementById('i-beratung');
  var ibem3=document.getElementById('i-bem3');
  if(idocs) idocs.addEventListener('change',function(){ S.uploadedFiles=Array.from(this.files); });
  if(iberatung) iberatung.addEventListener('change',function(){ S.beratungsgespraech=this.checked; });
  var idsgvo=document.getElementById('i-dsgvo'); if(idsgvo) idsgvo.addEventListener('change',function(){ S.dsgvo=this.checked; });
  if(ibem3) ibem3.addEventListener('input',function(){ S.bemerkung=this.value; });
  document.getElementById('b3').addEventListener('click',function(){ go(3); });
  document.getElementById('n3').addEventListener('click',function(){
    S.name=inm.value; S.email=iem.value; S.tel=itel.value; S.firma=ifi.value;
    if(idocs) S.uploadedFiles=Array.from(idocs.files);
    if(iberatung) S.beratungsgespraech=iberatung.checked;
    if(ibem3) S.bemerkung=ibem3.value;
    if(!S.name.trim()){ showErr('e3','Bitte Name eingeben.'); return; }
    if(!S.email||!S.email.includes('@')){ showErr('e3','Bitte gültige E-Mail eingeben.'); return; }
    go(5);
  });
}

// ── Step 4: Übersicht ─────────────────────────────────────────────────────────
function herkunftSumRow(){
  var sel=TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
  if(sel.length===0) return '';
  var items=sel.map(function(t){
    var fvg=FORVG_HKG[t.k];
    var h=S.herkunft[t.k]||{};
    if(!fvg||!fvg.regulated){
      return '<span class="pf-tag" style="background:#f5f5f5;color:#666;font-size:11px">'+esc(t.name)+': nicht FoVG-reg.</span>';
    }
    var g=fvg.gebiete.find(function(g){return g.code===h.hkg;});
    var katLabel=HKG_KAT.find(function(k){return k.k===h.kat;});
    return '<span class="pf-tag" style="background:rgba(163,230,53,0.06);border:1px solid #A3E63555;color:#012d1d;font-size:11px">'
      +'🔖 '+esc(t.name)+': '+(g?esc(g.code)+' – '+esc(g.name):'?')+(katLabel?' ('+katLabel.label.split('–')[0].trim()+')':'')+'</span>';
  }).join('');
  return '<div class="pf-sum-row"><span class="pf-sum-lbl">FoVG Herkunft</span><div style="display:flex;flex-wrap:wrap;gap:4px">'+items+'</div></div>';
}

function s4(){
  var sel=TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
  var totalQty=sel.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0);
  var totalPreis=treeTotal();
  var zeitMap={};kaSeasons().forEach(function(s){zeitMap[s[0]]=s[1];});
  var SOIL_MAP={}; SOILS.forEach(function(s){ SOIL_MAP[s.k]=s.ico+' '+s.name; });

  // Baumarten gesamt tags
  var baumTags=sel.map(function(t,i){
    var c=col(i);
    return '<span class="pf-tag" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'">'+esc(t.name)+' × '+fmt(S.treeQty[t.k])+'</span>';
  }).join('');

  // Pro Fläche
  var flaechenRows=S.flaechen.map(function(fl,i){
    var info=[];
    if(fl.forstamt) info.push('FA: '+esc(fl.forstamt)+(fl.revier?' / '+esc(fl.revier):''));
    info.push(esc(fl.ha)+' ha');
    info.push(esc(fl.plz)+' '+esc(fl.ort));
    if(fl.hang!==null) info.push(fl.hang?'Hang':'Kein Hang');
    if(fl.boden) info.push(SOIL_MAP[fl.boden]||fl.boden);

    var verteilTags=sel.map(function(t,j){
      var qty=parseInt(fl.treeVerteilung[t.k])||0;
      if(!qty) return '';
      var c=col(j);
      return '<span class="pf-tag" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'">'+esc(t.name)+': '+fmt(qty)+'</span>';
    }).filter(Boolean).join('');

    var seqTags=sel.map(function(t,j){
      var n=fl.seq[t.k]||1;
      var c=col(j);
      return '<span class="pf-tag" style="background:'+c.bg+';border-color:'+c.bd+';color:'+c.tx+'">'+n+'× '+esc(t.name)+'</span>';
    }).join('');

    return '<div class="pf-sum-row" style="flex-direction:column;align-items:flex-start;gap:5px;padding:10px 0;border-bottom:1px solid var(--n200,#e5e5e5)">'
      +'<strong style="color:var(--n700,#2a2a22)">Fläche '+(i+1)+'</strong>'
      +'<span style="font-size:13px">'+info.join(' · ')+'</span>'
      +(verteilTags?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px"><span class="pf-sum-lbl" style="font-size:11px;margin-right:4px">Pflanzen:</span>'+verteilTags+'</div>':'')
      +'<div style="font-size:12px;color:var(--n600)"><span class="pf-sum-lbl" style="font-size:11px">Pflanzverband:</span> '+esc(fl.abstand_p||'2.0')+' m × '+esc(fl.abstand_r||'2.0')+' m (Pflanzreihe × Reihenabstand)</div>'
      +(sel.length>0&&seqTags?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:2px"><span class="pf-sum-lbl" style="font-size:11px;margin-right:4px">Reihenfolge:</span>'+seqTags+'</div>':'')
      +'<div id="pv-preview-'+fl.id+'" style="margin-top:6px;max-width:100%;overflow:hidden;border-radius:6px"></div>'
      +'</div>';
  }).join('');

  return '<div class="pf-card">'
    +'<div class="pf-hd"><h2>✅ Zusammenfassung</h2><p>Bitte alle Angaben vor dem Absenden prüfen.</p></div>'
    +'<div class="pf-body">'

    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Baumarten gesamt</span><div style="display:flex;flex-wrap:wrap;gap:4px">'+baumTags+'</div></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Stückzahl gesamt</span><span>'+fmt(totalQty)+' Pflanzen</span></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Richtpreis Pflanzgut</span><span>'+fmt(totalPreis)+' € (netto)</span></div>'

    +bezugsquelleSumRow()
    +herkunftSumRow()
    +'<div style="margin:16px 0 4px;font-weight:600;font-size:13px;color:var(--n600)">Flächen-Details</div>'
    +flaechenRows

    +'<div style="margin:16px 0 4px;border-top:1px solid var(--n200,#e5e5e5);padding-top:12px"></div>'
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Zeitraum</span><span>'+(zeitMap[S.zeitraum]||S.zeitraum)+'</span></div>'
    +(S.bemerkung?'<div class="pf-sum-row"><span class="pf-sum-lbl">Anmerkungen</span><span style="max-width:280px;word-break:break-word">'+esc(S.bemerkung)+'</span></div>':'')
    +(S.bundesland&&S.foerderProgramme.length
      ?'<div class="pf-sum-row"><span class="pf-sum-lbl">Förderprogramme</span><div style="display:flex;flex-direction:column;gap:2px">'+S.foerderProgramme.map(function(id){ var bl=FOERDER[S.bundesland]||FOERDER.DEFAULT; var p=bl.find(function(x){ return x.id===id; }); return p?'<span class="pf-tag" style="background:#F8F9F5;color:#012d1d;font-size:11px">🏦 '+esc(p.name)+'</span>':''; }).join('')+'</div></div>'
      :'')
    +(S.foerderBeratungS2?'<div class="pf-sum-row"><span class="pf-sum-lbl">Förderberatung</span><span style="color:#012d1d;font-weight:600">✅ Ja, gewünscht</span></div>':'')
    +(S.foerderberatung?'<div class="pf-sum-row"><span class="pf-sum-lbl">Förderberatung (Kontakt)</span><span style="color:#012d1d;font-weight:600">✅ Ja, gewünscht</span></div>':'')
    +(S.beratungsgespraech?'<div class="pf-sum-row"><span class="pf-sum-lbl">Beratungsgespräch</span><span style="color:#012d1d;font-weight:600">✅ Ja, gewünscht</span></div>':'')
    +'<div class="pf-sum-row"><span class="pf-sum-lbl">Kontakt</span><span>'+esc(S.name)+(S.firma?' · '+esc(S.firma):'')+'<br><small style="color:var(--n500)">'+esc(S.email)+(S.tel?' · '+esc(S.tel):'')+'</small></span></div>'

    +'<p style="font-size:12px;color:var(--n500);margin-top:14px">Unverbindliche Anfrage. Preise nach Darmstädter Forstbaumschulen GmbH 2025 (FoVG / FfV/ZüF). Endangebot inkl. Pflanzung in 48h.</p>'
    +'<div class="pf-err" id="e4" style="margin-top:12px"></div>'
    +'</div>'
    +'<div class="pf-ft">'
    +'<button class="pf-btn s" id="b4">← Zurück</button>'
    +'<button class="pf-btn p" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind4(){
  // Sync treeQty für alle Baumart-Pfade, damit Pflanzverband-Vorschau alle Baumarten zeigt
  if(S.bezugsquelle==='vorhanden'&&S.eigenePflanzen&&S.eigenePflanzen.length){
    S.eigenePflanzen.forEach(function(ep){
      var t=TREES.find(function(t){ return t.name===ep.baumart; });
      if(t) S.treeQty[t.k]=Math.max(1,parseInt(ep.menge)||1);
    });
  } else if(S.selectedAngebote&&S.selectedAngebote.length){
    S.selectedAngebote.forEach(function(sa){
      if(sa.baumart_key) S.treeQty[sa.baumart_key]=Math.max(1,parseInt(sa.menge)||100);
    });
  }
  // Pflanzverband-Vorschau in Zusammenfassung einfügen
  S.flaechen.forEach(function(fl){ drawPflanzverband(fl.id); });
  var bBack = document.getElementById('b4') || document.getElementById('b-ks');
  if(bBack) bBack.addEventListener('click',function(){ go(3); });
  var bSub = document.getElementById('sub');
  if(bSub) bSub.addEventListener('click',function(){
    var btn=this; btn.disabled=true; btn.textContent='⏳ Wird gesendet…';
    var sel=TREES.filter(function(t){ return (S.treeQty[t.k]||0)>0; });
    var SOIL_MAP={}; SOILS.forEach(function(s){ SOIL_MAP[s.k]=s.ico+' '+s.name; });

    var flaechenData=S.flaechen.map(function(fl,i){
      var verteilung={};
      sel.forEach(function(t){ verteilung[t.name]=fl.treeVerteilung[t.k]||0; });
      var seqStr=sel.map(function(t){ return (fl.seq[t.k]||1)+'× '+t.name; }).join(' + ');
      return {
        nummer: i+1,
        ha: fl.ha, plz: fl.plz, ort: fl.ort,
        forstamt: fl.forstamt, revier: fl.revier,
        hang: fl.hang===true?'Ja':fl.hang===false?'Nein':'-',
        boden: fl.boden?(SOIL_MAP[fl.boden]||fl.boden):'-',
        pflanzenVerteilung: verteilung,
        pflanzabstand: (fl.abstand_p||'2.0')+'m',
        reihenabstand: (fl.abstand_r||'2.0')+'m',
        mischungsfolge: seqStr,
        verbandMethode: fl.verbandMethode||'reihe',
        reihenStart: fl.reihenStart||'gleich',
        aussenreihe: fl.aussenreihe?(fl.aussenreiheArt&&TM[fl.aussenreiheArt]?'Ja ('+TM[fl.aussenreiheArt].name+')':'Ja'):'Nein',
        verbandFreitext: fl.verbandFreitext||''
      };
    });

    var payload={
      leistung:'Pflanzung',
      baumarten: sel.map(function(t){ return t.name+': '+S.treeQty[t.k]+' Stk.'; }).join(', '),
      pflanzenzahl_gesamt: sel.reduce(function(s,t){ return s+(S.treeQty[t.k]||0); },0),
      flaechen: flaechenData,
      flaechen_str: S.flaechen.map(function(fl,i){
        return 'Fl.'+(i+1)+': '+fl.ha+' ha, '+fl.plz+' '+fl.ort+
          (fl.forstamt?' (FA: '+fl.forstamt+(fl.revier?'/'+fl.revier:'')+')'  :'');
      }).join(' | '),
      zeitraum: S.zeitraum,
      bemerkung: S.bemerkung,
      bundesland: S.bundesland||'',
      foerderProgramme: S.foerderProgramme.join(', '),
      foerderBeratungS2: S.foerderBeratungS2 ? 'Ja' : 'Nein',
      foerderberatung: S.foerderberatung ? 'Ja' : 'Nein',
      beratungsgespraech: S.beratungsgespraech ? 'Ja' : 'Nein',
      waldbesitzertyp: S.waldbesitzertyp||'',
      pflanzenVorhanden: S.bezugsquelle==='vorhanden' ? 'Pflanzen vorhanden' : 'Über Koch Aufforstung bestellen',
      eigenePflanzen: S.bezugsquelle==='vorhanden' && S.eigenePflanzen && S.eigenePflanzen.length
        ? S.eigenePflanzen.map(function(ep){
            var h = S.eigenePflanzenHerkunft.find(function(x){ return x.baumart === ep.baumart; });
            var hkgPart = (h && h.hkg_code && h.hkg_code !== 'n/a' && h.hkg_code !== 'unbekannt') ? ' | HKG: '+h.hkg_code : '';
            return ep.baumart+': '+ep.menge+' Stk.'+hkgPart;
          }).join('\n')
        : '',
      lieferant: S.lieferant === 'darmstaedter' ? 'Darmstädter Forstbaumschulen GmbH' : (S.andereBaumschule || S.lieferant || ''),
      andereBaumschule: S.andereBaumschule||'',
      herkunftCode: S.herkunftCode||'',
      lieferort: ({forststrasse:'An Forststraße liefern',pflanzflaeche:'An Pflanzfläche liefern',selbst:'Selbst abholen'})[S.lieferort]||S.lieferort,
      lieferAdresse: S.lieferAdresse||'',
      lieferMapsLink: S.lieferMapsLink||'',
      befahrbarkeit: ({lkw:'LKW-befahrbar (bis 26t)',kleintransporter:'Kleintransporter (bis 3,5t)',traktor:'Nur Traktor/Forstmaschine',unbekannt:'Unbekannt'})[S.befahrbarkeit]||S.befahrbarkeit||'',
      darmstaedter_angebote: S.lieferant === 'darmstaedter' && S.selectedAngebote.length
        ? S.selectedAngebote.map(function(sa){
            return sa.baumart_name+' '+sa.q+(sa.h&&sa.h!=='–'?' '+sa.h.replace(/\s*cm\s*$/i,'')+' cm':'')+' | HKG '+sa.hkg+' | FoVG: '+sa.fovg+'€/100 | FfV/ZüF: '+(sa.ffv||'-')+'€/100 | '+sa.menge+' Stk.';
          }).join('\n')
        : '',
      forvg_herkunft: sel.map(function(t){
        var fvg=FORVG_HKG[t.k]; var h=S.herkunft[t.k]||{};
        if(!fvg||!fvg.regulated) return t.name+': nicht FoVG-reguliert';
        var g=fvg.gebiete.find(function(g){return g.code===h.hkg;});
        var kat=HKG_KAT.find(function(k){return k.k===h.kat;});
        return t.name+': HKG '+h.hkg+(g?' ('+g.name+')'  :'')+' | '+(kat?kat.label:'');
      }).join('\n'),
      name: S.name, email: S.email, tel: S.tel, unternehmen: S.firma,
      treffpunkt: S.treffpunkt||''
    };

    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    var fileInput = document.getElementById('i-docs');
    if(fileInput && fileInput.files && fileInput.files[0]) fd.append('file', fileInput.files[0]);
    fetch('/wp-json/koch/v1/anfrage',{method:'POST',credentials:'same-origin',body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(wpResult) { if (typeof S !== 'undefined' && S.lieferant === 'netzwerk' && S.selectedBaumschuleId && typeof sendBaumschulBestellung === 'function') { sendBaumschulBestellung(S).catch(function(){}); } showOK(wpResult); })
      .catch(function(err){
        console.error(err);
        btn.disabled=false; btn.textContent='📤 Anfrage absenden';
        var errEl=document.getElementById('e4');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';}
      });
  });
  // If sub-ks is present (sKontaktSummary path), call bindKontaktSummary for submit handler
  if(document.getElementById('sub-ks') && typeof bindKontaktSummary === 'function'){
    bindKontaktSummary();
  }
}

function showOK(){ clearDraft();
  // Add to Projektkorb - SAVE FULL STATE
  try {
    var korb = JSON.parse(localStorage.getItem("ka_projektkorb")||"{}");
    if(!korb.items) korb.items = [];
    korb.items = korb.items.filter(function(i){ return i.type !== "pflanzung"; });
    var summary = S.flaechen.map(function(f){ return f.ha+"ha "+f.plz; }).join(", ");
    // Save complete state for edit functionality
    var fullState = JSON.parse(JSON.stringify(S));
    korb.items.push({
      type: "pflanzung",
      label: "🌱 Pflanzung",
      summary: summary,
      data: fullState,
      addedAt: Date.now()
    });
    localStorage.setItem("ka_projektkorb", JSON.stringify(korb));
    var korbCount = korb.items.length;
  } catch(e) { console.error(e); var korbCount = 1; }
  
  document.getElementById("pf-main").innerHTML='<div class="pf-card"><div class="pf-ok">'
    +'<div class="pf-ok-ico">✅</div><h2>Leistung hinzugefügt!</h2>'
    +'<div style="background:#F8F9F5;border:2px solid #012d1d;border-radius:10px;padding:16px;margin:20px 0;text-align:left;">'
    +'<strong>🌱 Pflanzung</strong><br><span style="color:#666">'+S.flaechen.length+' Fläche(n), '+esc(S.name)+'</span></div>'
    +'<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:16px;margin:20px 0;text-align:left;">'
    +'<p style="margin:0 0 8px;font-weight:600;">💡 Mehrere Leistungen kombinieren?</p>'
    +'<p style="margin:0;color:#666;font-size:0.9rem;">Die meisten Projekte benötigen Flächenvorbereitung, Pflanzung UND Kulturschutz.</p>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;">'
    +'<a href="/#leistungen" style="display:block;padding:14px 24px;background:#012d1d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center;">➕ Weitere Leistung hinzufügen</a>'
    +'<a href="/projektkorb/" style="display:block;padding:14px 24px;background:#A3E635;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center;">🛒 Zum Projektkorb ('+korbCount+')</a>'
    +'</div>'
    +'<p style="margin-top:20px;font-size:0.85rem;color:#666;"><a href="/" style="color:#012d1d;">← Zur Startseite</a></p>'
    +'</div></div>';
}

// Load edit data if in edit mode
function loadEditData() {
  var params = new URLSearchParams(window.location.search);
  if (!params.has('edit')) return false;
  
  try {
    var korb = JSON.parse(localStorage.getItem('ka_projektkorb') || '{}');
    if (!korb.items) return false;
    
    var item = korb.items.find(function(i) { return i.type === 'pflanzung'; });
    if (!item || !item.data) return false;
    
    // Load full state
    var saved = item.data;
    if (saved.flaechen) S.flaechen = saved.flaechen;
    if (saved.treeQty) S.treeQty = saved.treeQty;
    if (saved.name) S.name = saved.name;
    if (saved.email) S.email = saved.email;
    if (saved.phone) S.phone = saved.phone;
    if (saved.firma) S.firma = saved.firma;
    if (saved.zeitraum) S.zeitraum = saved.zeitraum;
    if (saved.kommentar) S.kommentar = saved.kommentar;
    if (typeof saved.step === 'number') S.step = saved.step;
    if (typeof saved.activeFl === 'number') S.activeFl = saved.activeFl;
    
    console.log('Edit data loaded:', S);
    return true;
  } catch(e) {
    console.error('Edit load error:', e);
    return false;
  }
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ 
    try{ 
      var isEdit = loadEditData();
      render();
      if (isEdit) {
        // Show edit banner
        var banner = document.createElement('div');
        banner.innerHTML = '<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;gap:12px;"><span style="font-size:28px;">✏️</span><div><strong style="color:#012d1d;font-size:1.1rem;">Bearbeitungsmodus</strong><p style="margin:4px 0 0;font-size:0.9rem;color:#666;">Ihre bisherigen Eingaben wurden geladen. Ändern Sie was nötig ist und klicken Sie am Ende auf "Anfrage aktualisieren".</p></div></div>';
        var main = document.getElementById('pf-main');
        if (main && main.parentNode) main.parentNode.insertBefore(banner, main);
      }
    }catch(e){ console.error(e); } 
  });
} else {
  try{ render(); }catch(e){ console.error(e); }
}
})();
/**
 * Baumschule-Netzwerk Integration v2 — ForstManager API
 * Lädt Baumschulen vom FM und sendet Bestellungen an FM API
 * 
 * Patch-Version: 2.0.0
 * Datum: 2026-04-12
 */
(function() {
    'use strict';

    var FM_API = 'https://ka-forstmanager.vercel.app/api/public/baumschulen';

    // Warte bis LIEFERANTEN geladen ist
    var checkInterval = setInterval(function() {
        if (typeof LIEFERANTEN !== 'undefined' && LIEFERANTEN.length > 0) {
            clearInterval(checkInterval);
            initBaumschuleNetzwerk();
        }
    }, 100);
    setTimeout(function() { clearInterval(checkInterval); }, 10000);

    function initBaumschuleNetzwerk() {
        console.log('[Baumschule-Netzwerk v2] Initialisiere FM-API Integration...');

        // 1. Netzwerk-Option in LIEFERANTEN einfügen
        var exists = LIEFERANTEN.some(function(l) { return l.k === 'netzwerk'; });
        if (!exists) {
            LIEFERANTEN.unshift({
                k: 'netzwerk',
                name: '\uD83C\uDF33 Baumschule aus unserem Netzwerk',
                ort: 'Deutschlandweit',
                is_partner: true,
                is_netzwerk: true
            });
        }

        // 2. Event-Listener für Lieferant-Auswahl
        document.addEventListener('change', function(e) {
            if (e.target && e.target.id === 'bez-lieferant-sel') {
                if (e.target.value === 'netzwerk') {
                    showBaumschulAuswahl();
                } else {
                    hideBaumschulAuswahl();
                }
            }
            // Auch für lw-lieferant-sel (Laubwald-Wizard-Variante)
            if (e.target && e.target.id === 'lw-lieferant-sel') {
                if (e.target.value === 'netzwerk') {
                    showBaumschulAuswahl();
                } else {
                    hideBaumschulAuswahl();
                }
            }
        });

        // 3. State-Erweiterung
        if (typeof S !== 'undefined') {
            S.netzwerkBaumschulen = [];
            S.selectedBaumschuleId = null;
            S.selectedBaumschuleName = '';
        }
    }

    // Baumschul-Auswahl anzeigen
    window.showBaumschulAuswahl = function() {
        var section = document.getElementById('bez-bestell-section');
        if (!section) {
            // Fallback: nach dem Select suchen
            var sel = document.getElementById('bez-lieferant-sel') || document.getElementById('lw-lieferant-sel');
            if (sel) section = sel.closest('.pf-field') || sel.parentNode.parentNode;
        }
        if (!section) return;

        var existing = document.getElementById('netzwerk-baumschul-container');
        if (existing) existing.remove();

        var container = document.createElement('div');
        container.id = 'netzwerk-baumschul-container';
        container.innerHTML = '<div style="margin-top:16px;padding:16px;background:var(--color-forest-50,#F0F4EC);border:1px solid var(--color-forest-300,#8FBF6E);border-radius:12px">'
            + '<div style="font-size:14px;font-weight:700;color:var(--color-forest-800,#012d1d);margin-bottom:12px">Baumschule aus unserem Netzwerk w\u00e4hlen</div>'
            + '<div id="netzwerk-baumschul-list" style="color:#666;font-size:13px">Lade Baumschulen...</div>'
            + '</div>';

        section.after(container);
        loadBaumschulen();
    };

    window.hideBaumschulAuswahl = function() {
        var container = document.getElementById('netzwerk-baumschul-container');
        if (container) container.remove();
        if (typeof S !== 'undefined') {
            S.selectedBaumschuleId = null;
            S.selectedBaumschuleName = '';
        }
    };

    function loadBaumschulen() {
        var listEl = document.getElementById('netzwerk-baumschul-list');
        if (!listEl) return;

        fetch(FM_API)
            .then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            })
            .then(function(data) {
                var baumschulen = data.baumschulen || [];

                if (typeof S !== 'undefined') {
                    S.netzwerkBaumschulen = baumschulen;
                }

                if (baumschulen.length === 0) {
                    listEl.innerHTML = '<p style="color:#666;margin:0">Aktuell keine Baumschulen verf\u00fcgbar.</p>';
                    return;
                }

                var html = '<div style="display:flex;flex-direction:column;gap:10px">';

                baumschulen.forEach(function(b) {
                    var isSelected = (typeof S !== 'undefined' && S.selectedBaumschuleId === b.id);
                    var spez = (b.spezialisierung && b.spezialisierung.length)
                        ? b.spezialisierung.slice(0, 5).join(', ') + (b.spezialisierung.length > 5 ? ' +' + (b.spezialisierung.length - 5) + ' weitere' : '')
                        : 'Diverse Baumarten';

                    html += '<label style="display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-radius:10px;border:2px solid '
                        + (isSelected ? 'var(--color-forest-600,#4F6B35)' : 'var(--color-border,#E8E7E0)') + ';background:'
                        + (isSelected ? 'var(--color-forest-50,#F0F4EC)' : '#fff') + ';cursor:pointer;transition:all .2s">'
                        + '<input type="radio" name="netzwerk-baumschule" value="' + escapeAttr(b.id) + '" ' + (isSelected ? 'checked' : '')
                        + ' style="accent-color:var(--color-forest-600,#4F6B35);width:18px;height:18px;flex-shrink:0;margin-top:3px">'
                        + '<div style="flex:1">'
                        + '<div style="font-weight:700;color:var(--color-stone-900,#1C1C1A);font-size:14px;font-family:var(--font-heading,Georgia,serif)">' + escapeHtml(b.name) + '</div>'
                        + '<div style="font-size:12px;color:var(--color-text-secondary,#6B6B64);margin-top:3px">'
                        + '\uD83D\uDCCD ' + escapeHtml(b.ort || '') + (b.bundesland ? ', ' + escapeHtml(b.bundesland) : '')
                        + '</div>'
                        + '<div style="font-size:12px;color:var(--color-text-muted,#8C8C84);margin-top:4px">'
                        + '\uD83C\uDF31 ' + escapeHtml(spez)
                        + '</div>'
                        + (b.preislisten_count > 0
                            ? '<div style="margin-top:6px"><span style="background:var(--color-gold-100,#F5EDD8);color:var(--color-gold-600,#A07C2E);padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">'
                              + b.preislisten_count + ' Artikel verf\u00fcgbar</span></div>'
                            : '')
                        + '</div>'
                        + '</label>';
                });

                html += '</div>';
                listEl.innerHTML = html;

                // Event-Listener
                listEl.querySelectorAll('input[name="netzwerk-baumschule"]').forEach(function(radio) {
                    radio.addEventListener('change', function() {
                        var bId = this.value;
                        var bObj = baumschulen.find(function(b) { return b.id === bId; });
                        if (typeof S !== 'undefined' && bObj) {
                            S.selectedBaumschuleId = bId;
                            S.selectedBaumschuleName = bObj.name;
                            S.lieferant = 'netzwerk';
                            S.andereBaumschule = bObj.name;
                            console.log('[Baumschule-Netzwerk v2] Gew\u00e4hlt:', bObj.name);
                        }
                        // Labels visuell aktualisieren
                        listEl.querySelectorAll('label').forEach(function(lbl) {
                            var r = lbl.querySelector('input');
                            lbl.style.borderColor = r.checked ? 'var(--color-forest-600,#4F6B35)' : 'var(--color-border,#E8E7E0)';
                            lbl.style.background = r.checked ? 'var(--color-forest-50,#F0F4EC)' : '#fff';
                        });
                    });
                });
            })
            .catch(function(err) {
                console.error('[Baumschule-Netzwerk v2] Fehler:', err);
                listEl.innerHTML = '<p style="color:#c62828;margin:0">Fehler beim Laden der Baumschulen.</p>';
            });
    }

    // Hook into form submit: send Bestellung to FM API
    window.sendBaumschulBestellung = function(formState) {
        if (!formState || !formState.selectedBaumschuleId) return Promise.resolve(null);

        var selTrees = (typeof getSelTrees === 'function') ? getSelTrees() : [];
        var pflanzenArten = selTrees.length
            ? selTrees.map(function(t) { return t.name || t.key || t.k; })
            : [formState.andereBaumschule || 'Diverse'];

        var mengeGesamt = 0;
        if (formState.eigenePflanzen && formState.eigenePflanzen.length) {
            formState.eigenePflanzen.forEach(function(ep) { mengeGesamt += parseInt(ep.menge) || 0; });
        }
        if (formState.selectedAngebote && formState.selectedAngebote.length) {
            formState.selectedAngebote.forEach(function(sa) { mengeGesamt += parseInt(sa.menge) || 0; });
        }
        if (mengeGesamt <= 0) mengeGesamt = 1;

        var payload = {
            baumschule_id: formState.selectedBaumschuleId,
            pflanzen_arten: pflanzenArten,
            menge_gesamt: mengeGesamt,
            kontakt_name: formState.name || '',
            kontakt_email: formState.email || '',
            kontakt_telefon: formState.tel || '',
            flaeche_ha: parseFloat(formState.flaeche) || null,
            anfrage_datum: new Date().toISOString().split('T')[0]
        };

        return fetch(FM_API + '/bestellung', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(function(r) { return r.json(); })
        .then(function(data) {
            console.log('[Baumschule-Netzwerk v2] Bestellung gesendet:', data);
            return data;
        })
        .catch(function(err) {
            console.error('[Baumschule-Netzwerk v2] Bestellung Fehler:', err);
            return null;
        });
    };

    function escapeHtml(text) {
        if (!text) return '';
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeAttr(text) {
        if (!text) return '';
        return text.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    console.log('[Baumschule-Netzwerk v2] Patch geladen — FM API Integration');


/* P1: Browser-Back */
window.addEventListener("popstate",function(e){if(e.state&&typeof e.state.step==="number"){S.step=e.state.step;render();window.scrollTo(0,0);}});
/* P1: Load draft on init */
loadDraft();

})();

