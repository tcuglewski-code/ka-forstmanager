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





// ── Pflegemaßnahmen ────────────────────────────────────────────────────────────
var MASSNAHMEN = [
  {k:'freischneiden', ico:'🌿', name:'Freischneiden',
   sub:'Motormanuell / Freischneider',
   desc:'Entfernung von Aufwuchs zwischen Kulturbäumen — verhindert Überwuchs und Konkurrenz.',
   preis_min:400, preis_max:800, einheit:'€/ha'},
  {k:'laeuterung', ico:'🌲', name:'Läuterung / Jungbestandspflege',
   sub:'Auslese · Stammpflege',
   desc:'Selektive Entnahme von Begleitwuchs, Förderung der Auslesebäume, Stammpflege im Jungbestand.',
   preis_min:600, preis_max:1200, einheit:'€/ha'},
  {k:'kombiniert', ico:'🔄', name:'Kulturpflege kombiniert',
   sub:'Freischneiden + Läuterung',
   desc:'Freischneiden und Läuterung in einer Maßnahme — wirtschaftlichste Variante bei hohem Handlungsbedarf.',
   preis_min:800, preis_max:1600, einheit:'€/ha'},
  {k:'astreinigung', ico:'✂️', name:'Astreinigung',
   sub:'Totäste · Grünäste',
   desc:'Entfernung von Totästen und tiefen Grünästen zur Qualitätssteigerung — sorgt für astfreies Wertholz.',
   preis_min:150, preis_max:300, einheit:'€/ha'},
  {k:'negativauslese', ico:'🪓', name:'Negativauslese',
   sub:'Unerwünschte Baumarten',
   desc:'Gezielte Entnahme minderwertiger Individuen und unerwünschter Baumarten zur Mischungsregulierung.',
   preis_min:400, preis_max:800, einheit:'€/ha'},
];
var MM = {};
MASSNAHMEN.forEach(function(m){ MM[m.k] = m; });

// ── Baumarten (Mehrfachauswahl) ────────────────────────────────────────────────
var BAUMARTEN = [
  {k:'rotbuche',   ico:'🌳', name:'Rotbuche'},
  {k:'eiche',      ico:'🌳', name:'Eiche (Stiel-/Trauben-)'},
  {k:'bergahorn',  ico:'🍁', name:'Bergahorn'},
  {k:'fichte',     ico:'🌲', name:'Fichte'},
  {k:'douglasie',  ico:'🌲', name:'Douglasie'},
  {k:'waldkiefer', ico:'🌲', name:'Waldkiefer'},
  {k:'laerche',    ico:'🌲', name:'Lärche'},
  {k:'espe',       ico:'🌿', name:'Espe / Pappel'},
  {k:'sonstiges',  ico:'🌿', name:'Sonstige Arten'},
];

// ── Bestandsalter ──────────────────────────────────────────────────────────────
var BESTANDSALTER = [
  {k:'jung',        name:'Jung',        sub:'1–5 Jahre',   mult:1.0},
  {k:'mitteljung',  name:'Mitteljung',  sub:'5–15 Jahre',  mult:1.15},
  {k:'jungbestand', name:'Jungbestand', sub:'15–30 Jahre', mult:1.3},
];

// ── Bestandsdichte ─────────────────────────────────────────────────────────────
var DICHTE = [
  {k:'licht',      ico:'☀️',  name:'Licht',      zuschlag:0.0},
  {k:'normal',     ico:'🌤️', name:'Normal',     zuschlag:0.0},
  {k:'dicht',      ico:'⛅',  name:'Dicht',      zuschlag:0.2},
  {k:'sehr_dicht', ico:'☁️',  name:'Sehr dicht', zuschlag:0.4},
];

// ── Waldbesitzertyp ────────────────────────────────────────────────────────────
var BESITZERTYP = [
  {k:'privatperson',   label:'Privatperson'},
  {k:'personengesell', label:'Personengesellschaft'},
  {k:'koerperschaft',  label:'Körperschaft d. öffentl. Rechts'},
  {k:'kommunal',       label:'Kommunal/Staatlich'},
];

// ── Fördercheck Daten ──────────────────────────────────────────────────────────
var BL_NAMEN = {
  'BY':'Bayern','BW':'Baden-Württemberg','NW':'Nordrhein-Westfalen',
  'HE':'Hessen','NI':'Niedersachsen','RP':'Rheinland-Pfalz',
  'SN':'Sachsen','TH':'Thüringen','ST':'Sachsen-Anhalt',
  'BB':'Brandenburg','MV':'Mecklenburg-Vorpommern','SH':'Schleswig-Holstein',
  'HB':'Bremen','HH':'Hamburg','SL':'Saarland','BE':'Berlin'
};
var FOERDER_PFLEGE = {
  'BY': ['BaySF Kulturpflege', 'GAK Pflege Bayern', 'Bayer. Jungwaldpflege'],
  'BW': ['ForstBW Jungwaldpflege', 'GAK BW Pflege'],
  'NW': ['NRW Kulturpflege', 'GAK NRW Pflege'],
  'HE': ['HALM Pflegemaßnahmen', 'GAK Hessen Pflege'],
  'NI': ['Nds. Waldbau Kulturpflege', 'GAK Nds. Pflege'],
  'RP': ['GAK RP Pflege'],
  'SN': ['Sachsen Jungwaldpflege', 'GAK Sachsen Pflege'],
  'TH': ['ThüringenForst Pflege', 'GAK Thüringen Pflege'],
  'ST': ['ST Waldpflege', 'GAK ST Pflege'],
  'BB': ['Brandenburg Waldpflege', 'GAK BB Pflege'],
  'MV': ['MV Waldpflege', 'GAK MV Pflege'],
  'SH': ['SH Forst Pflege', 'GAK SH Pflege'],
  'HB': ['GAK HB'], 'HH': ['GAK HH'], 'SL': ['GAK SL Pflege'], 'BE': ['GAK BE']
};

// ── Steps ──────────────────────────────────────────────────────────────────────
var STEP_LABELS = ['Besitzertyp','Bestand & Fläche','Pflegemaßnahme','Pflegeziel','Zeitraum','Fördercheck','Kontakt & Absenden'];
var TOTAL_STEPS = 7;

// ── Preisberechnung ────────────────────────────────────────────────────────────
function calcPreis(){
  var totalHa=getTotalHaNum();
  if(!S.massnahme||!totalHa) return null;
  var m=MM[S.massnahme]; if(!m) return null;
  var ha=totalHa; if(ha<=0) return null;
  var dichte=DICHTE.find(function(d){ return d.k===S.dichte; })||DICHTE[1];
  var alter=BESTANDSALTER.find(function(a){ return a.k===S.bestandsalter; })||BESTANDSALTER[0];
  var dichteFaktor=(dichte.k==='licht'?0:dichte.k==='normal'?0.33:dichte.k==='dicht'?0.67:1.0);
  var basisProHa=m.preis_min+dichteFaktor*(m.preis_max-m.preis_min);
  basisProHa=basisProHa*alter.mult;
  if(dichte.k==='sehr_dicht') basisProHa=basisProHa*(1+dichte.zuschlag);
  var rabatt=S.wiederkehrend==='rahmenvertrag' ? 0.10 : 0;
  var gesamt=basisProHa*ha*(1-rabatt);
  return {
    min: Math.round(m.preis_min*ha*(1-rabatt)),
    max: Math.round(m.preis_max*ha*alter.mult*(1+(dichte.k==='sehr_dicht'?dichte.zuschlag:0))*(1-rabatt)),
    richtpreis: Math.round(gesamt),
    rabatt: rabatt
  };
}

// ── State ──────────────────────────────────────────────────────────────────────
function newFlaeche(id){
  return { id: id||Date.now(), plz:'', ort:'', forstamt:'', revier:'', ha:'', gps:'' };
}
var S = {
  step: 0,
  // Step 0: Waldbesitzertyp
  waldbesitzertyp: '',
  // Step 1: Bestand & Fläche (Multi-Flächen)
  flaechenArr: [newFlaeche(1)],
  bestandsalter: '',
  baumarten: [],
  dichte: '',
  treffpunkt: '',
  // Step 2: Pflegemaßnahme
  massnahme: '',
  // Step 3: Pflegeziel & Intensität
  pflegeziel: '',
  vegetation: [],
  intensitaet: '',
  folgepflege: '',
  // Step 4: Zeitraum & Planung
  zeitpunkt: '',
  dringlichkeit: '',
  wiederkehrend: '',
  bemerkung: '',
  // Step 5: Fördercheck
  foerdercheck: null,
  bundesland: '',
  foerderprogramme: [],
  // Step 6: Kontakt
  name: '',
  email: '',
  tel: '',
  plz4: '',
  ort4: '',
  foerderberatung: false,
  uploadedFiles: [],
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function fmt(n){ return Number(n).toLocaleString('de-DE',{maximumFractionDigits:0}); }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-pflege-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});
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
    +'<span class="ka-hero-icon">✂️</span>'
    +'<h1>Waldpflege anfragen</h1>'
    +'<p>Professionelle Kultur- und Jungbestandspflege für Ihren Wald</p>'
    +'</div>';

  root.innerHTML = '<div class="ka-wizard">'
    + hero
    + renderProgress()
    + '<div id="pf-main"></div>'
    +'</div>';

  var main = document.getElementById('pf-main');
  if(!main) return;

  switch(S.step){
    case 0: main.innerHTML = s0(); bind0(); break;
    case 1: main.innerHTML = s1(); bind1(); break;
    case 2: main.innerHTML = s2(); bind2(); break;
    case 3: main.innerHTML = s3(); bind3(); break;
    case 4: main.innerHTML = s4(); bind4(); break;
    case 5: main.innerHTML = s5(); bind5(); break;
    case 6: main.innerHTML = s6(); bind6(); break;
  }
}

// ── Step 0: Waldbesitzertyp ────────────────────────────────────────────────────
function s0(){
  var opts = BESITZERTYP.map(function(b){
    var on = S.waldbesitzertyp === b.k;
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
      S.waldbesitzertyp = this.dataset.bk;
      document.querySelectorAll('[data-bk]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e0');
    });
  });
  document.getElementById('n0').addEventListener('click', function(){
    if(!S.waldbesitzertyp){ showErr('e0','Bitte Waldbesitzertyp wählen.'); return; }
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
function getTotalHa(){ return S.flaechenArr.reduce(function(s,f){return s+(parseFloat(f.ha)||0);},0).toLocaleString('de-DE',{maximumFractionDigits:1}); }
function getTotalHaNum(){ return S.flaechenArr.reduce(function(s,f){return s+(parseFloat(f.ha)||0);},0); }

function renderFlaechenBlocks(){
  return S.flaechenArr.map(function(fl,idx){
    var title=S.flaechenArr.length>1?'Fläche '+(idx+1):'Fläche';
    var delBtn=idx>0?'<button type="button" class="ka-flaeche-del" onclick="removeFlaeche('+fl.id+')">✕ Entfernen</button>':'';
    return '<div class="ka-flaeche" data-fl-id="'+fl.id+'">'
      +'<div class="ka-flaeche-header"><span class="ka-flaeche-title">📍 '+title+'</span>'+delBtn+'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field"><label class="ka-label">Flächengröße (ha) *</label>'
      +'<input class="ka-inp fl-ha" type="text" inputmode="decimal" data-fl="'+fl.id+'" value="'+esc(fl.ha)+'" placeholder="z.B. 2.5" autocomplete="off"></div>'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">PLZ</label>'
      +'<input class="ka-inp fl-plz" type="text" inputmode="numeric" data-fl="'+fl.id+'" value="'+esc(fl.plz)+'" placeholder="z.B. 83229" maxlength="5" autocomplete="off"></div>'
      +'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field" style="position:relative"><label class="ka-label">Gemeinde / Ort</label>'
      +'<input class="ka-inp fl-ort" type="text" data-fl="'+fl.id+'" value="'+esc(fl.ort)+'" placeholder="z.B. Rosenheim" autocomplete="off"></div>'
      +'<div class="ka-field"><label class="ka-label">Forstamt *</label>'
      +'<input class="ka-inp fl-forstamt" type="text" data-fl="'+fl.id+'" value="'+esc(fl.forstamt)+'" placeholder="z.B. Forstamt Rosenheim" autocomplete="off"></div>'
      +'</div>'
      +'<div class="ka-field"><label class="ka-label">Revier *</label>'
      +'<input class="ka-inp fl-revier" type="text" data-fl="'+fl.id+'" value="'+esc(fl.revier)+'" placeholder="z.B. Revier Süd" autocomplete="off"></div>'
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

// ── Step 1: Bestand & Fläche ──────────────────────────────────────────────────
function s1(){
  var baChips = BAUMARTEN.map(function(b){
    var on = S.baumarten.indexOf(b.k) > -1;
    return '<button type="button" class="ka-chip'+(on?' selected':'')+' pf-ba-chip" data-bk="'+b.k+'">'
      +b.ico+' '+esc(b.name)+'</button>';
  }).join('');

  var alterOpts = BESTANDSALTER.map(function(a){
    var on = S.bestandsalter === a.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-alter-btn" data-ak="'+a.k+'">'
      +esc(a.name)
      +'<span class="ka-toggle-sub">'+esc(a.sub)+'</span>'
      +'</button>';
  }).join('');

  var dichteOpts = DICHTE.map(function(d){
    var on = S.dichte === d.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-dichte-btn" data-dk="'+d.k+'">'
      +d.ico+' '+esc(d.name)+'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📐 Bestand & Fläche</h2>'
    +'<p>Geben Sie die Eckdaten Ihrer Pflegefläche an. Sie können mehrere Flächen anlegen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +renderFlaechenBlocks()
    +'<button type="button" class="ka-add-btn" onclick="addFlaeche()">＋ Weitere Fläche hinzufügen</button>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Treffpunkt mit Förster <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="text" id="i-treffpunkt" value="'+esc(S.treffpunkt)+'" placeholder="z.B. Parkplatz Waldweg / GPS-Koordinaten / Forststraße km 3">'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Bestandsalter *</label>'
    +'<div class="ka-toggles">'+alterOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Baumarten im Bestand <span class="ka-label-optional">(Mehrfachauswahl)</span></label>'
    +'<p class="ka-hint">Welche Baumarten sind vorhanden? Hilft uns bei der Einsatzplanung.</p>'
    +'<div class="ka-chips">'+baChips+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Bestandsdichte *</label>'
    +'<div class="ka-toggles">'+dichteOpts+'</div>'
    +'</div>'

    +'<div class="ka-err" id="e1"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b1">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n1">Weiter →</button>'
    +'</div></div>';
}

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

  // Bestandsalter
  document.querySelectorAll('.pf-alter-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.bestandsalter = this.dataset.ak;
      document.querySelectorAll('.pf-alter-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Baumarten chips
  document.querySelectorAll('.pf-ba-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var k = this.dataset.bk;
      var idx = S.baumarten.indexOf(k);
      if(idx > -1){ S.baumarten.splice(idx, 1); this.classList.remove('selected'); }
      else { S.baumarten.push(k); this.classList.add('selected'); }
    });
  });

  // Bestandsdichte
  document.querySelectorAll('.pf-dichte-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.dichte = this.dataset.dk;
      document.querySelectorAll('.pf-dichte-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  document.getElementById('b1').addEventListener('click', function(){
    collectBestandFlaeche(); go(0);
  });

  document.getElementById('n1').addEventListener('click', function(){
    collectBestandFlaeche();
    for(var i=0;i<S.flaechenArr.length;i++){
      var fl=S.flaechenArr[i];
      var label=S.flaechenArr.length>1?' (Fläche '+(i+1)+')':'';
      var ha=parseFloat(fl.ha);
      if(!fl.ha||isNaN(ha)||ha<0.1||ha>30){ showErr('e1','Bitte gültige Flächengröße eingeben (0,1–30 ha)'+label+'.'); return; }
      if(!fl.forstamt||!fl.forstamt.trim()){ showErr('e1','Bitte Forstamt angeben'+label+'.'); return; }
      if(!fl.revier||!fl.revier.trim()){ showErr('e1','Bitte Revier angeben'+label+'.'); return; }
    }
    if(!S.bestandsalter){ showErr('e1','Bitte das Bestandsalter auswählen.'); return; }
    if(!S.dichte){ showErr('e1','Bitte die Bestandsdichte auswählen.'); return; }
    hideErr('e1');
    go(2);
  });
}

function collectBestandFlaeche(){
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

// ── Step 2: Pflegemaßnahme ─────────────────────────────────────────────────────
function s2(){
  var cards = MASSNAHMEN.map(function(m){
    var on = S.massnahme === m.k;
    return '<div class="ka-card-option'+(on?' selected':'')+' pf-massnahme-card" data-mk="'+m.k+'">'
      +'<span class="ka-card-icon">'+m.ico+'</span>'
      +'<span class="ka-card-name">'+esc(m.name)+'</span>'
      +'<span class="ka-card-sub">'+esc(m.sub)+'</span>'
      +'<span class="ka-card-desc">'+esc(m.desc)+'</span>'
      +'<span class="ka-card-price">'+esc(m.preis_min)+'–'+esc(m.preis_max)+' '+esc(m.einheit)+'</span>'
      +'</div>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🌿 Welche Pflegemaßnahme benötigen Sie?</h2>'
    +'<p>Jungwaldpflege, Bestandsregulierung in Kulturen und Jungbeständen. Wählen Sie die passende Maßnahme.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-cards">'+cards+'</div>'
    +'<div class="ka-err" id="e2"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b2">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n2">Weiter →</button>'
    +'</div></div>';
}

function bind2(){
  document.querySelectorAll('.pf-massnahme-card').forEach(function(card){
    card.addEventListener('click', function(){
      S.massnahme = this.dataset.mk;
      document.querySelectorAll('.pf-massnahme-card').forEach(function(c){ c.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e2');
    });
  });
  document.getElementById('b2').addEventListener('click', function(){ go(1); });
  document.getElementById('n2').addEventListener('click', function(){
    if(!S.massnahme){ showErr('e2','Bitte eine Pflegemaßnahme auswählen.'); return; }
    hideErr('e2');
    go(3);
  });
}

// ── Step 3: Pflegeziel & Intensität ───────────────────────────────────────────
function s3(){
  var ziele = [
    {k:'aufwuchs',  ico:'🌱', name:'Aufwuchsbeseitigung', desc:'Konkurrenzvegetation zurückdrängen'},
    {k:'qualitaet', ico:'⭐', name:'Qualitätssicherung',  desc:'Wertholzproduktion, astfreier Schaft'},
    {k:'struktur',  ico:'🌳', name:'Bestandsstruktur',    desc:'Optimale Stammzahl und Verteilung'},
    {k:'mischung',  ico:'🔄', name:'Mischungsregulierung',desc:'Artenzusammensetzung anpassen'},
  ];
  var zielCards = ziele.map(function(z){
    var on = S.pflegeziel === z.k;
    return '<div class="ka-card-option'+(on?' selected':'')+' pf-ziel-card" data-zk="'+z.k+'">'
      +'<span class="ka-card-icon">'+z.ico+'</span>'
      +'<span class="ka-card-name">'+esc(z.name)+'</span>'
      +'<span class="ka-card-desc">'+esc(z.desc)+'</span>'
      +'</div>';
  }).join('');

  var vegChips = [
    {k:'adlerfarn', ico:'🌿', name:'Adlerfarn'},
    {k:'brombeere', ico:'🫐', name:'Brombeere'},
    {k:'gras',      ico:'🌾', name:'Gras / Binsen'},
    {k:'sonstiges', ico:'🌱', name:'Sonstiges'},
  ].map(function(v){
    var on = S.vegetation.indexOf(v.k) > -1;
    return '<button type="button" class="ka-chip'+(on?' selected':'')+' pf-veg-chip" data-vk="'+v.k+'">'
      +v.ico+' '+esc(v.name)+'</button>';
  }).join('');

  var intensOpts = [
    {k:'minimal',  name:'Minimal',  sub:'nur Engpässe'},
    {k:'standard', name:'Standard', sub:'nach Forstregeln'},
    {k:'intensiv', name:'Intensiv', sub:'max. Qualität'},
  ].map(function(i){
    var on = S.intensitaet === i.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-int-btn" data-ik="'+i.k+'">'
      +esc(i.name)
      +'<span class="ka-toggle-sub">'+esc(i.sub)+'</span>'
      +'</button>';
  }).join('');

  var folgeOpts = [
    {k:'jaehrlich', name:'Jährlich'},
    {k:'alle2-3',   name:'Alle 2–3 Jahre'},
    {k:'einmalig',  name:'Einmalig'},
  ].map(function(f){
    var on = S.folgepflege === f.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-folge-btn" data-fk="'+f.k+'">'
      +esc(f.name)+'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🎯 Pflegeziel & Intensität</h2>'
    +'<p>Was soll die Pflegemaßnahme primär erreichen? Das hilft uns, die richtige Vorgehensweise zu wählen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Primäres Pflegeziel *</label>'
    +'<div class="ka-cards">'+zielCards+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Vorhandene Konkurrenzvegetation <span class="ka-label-optional">(Mehrfachauswahl)</span></label>'
    +'<p class="ka-hint">Welche Konkurrenzpflanzen dominieren die Fläche?</p>'
    +'<div class="ka-chips">'+vegChips+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Pflegeintensität *</label>'
    +'<div class="ka-toggles">'+intensOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Folgepflege geplant?</label>'
    +'<div class="ka-toggles">'+folgeOpts+'</div>'
    +'</div>'

    +'<div class="ka-err" id="e3"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b3">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n3">Weiter →</button>'
    +'</div></div>';
}

function bind3(){
  document.querySelectorAll('.pf-ziel-card').forEach(function(card){
    card.addEventListener('click', function(){
      S.pflegeziel = this.dataset.zk;
      document.querySelectorAll('.pf-ziel-card').forEach(function(c){ c.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e3');
    });
  });

  document.querySelectorAll('.pf-veg-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      var k = this.dataset.vk, idx = S.vegetation.indexOf(k);
      if(idx > -1){ S.vegetation.splice(idx, 1); this.classList.remove('selected'); }
      else { S.vegetation.push(k); this.classList.add('selected'); }
    });
  });

  document.querySelectorAll('.pf-int-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.intensitaet = this.dataset.ik;
      document.querySelectorAll('.pf-int-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  document.querySelectorAll('.pf-folge-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.folgepflege = this.dataset.fk;
      document.querySelectorAll('.pf-folge-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  document.getElementById('b3').addEventListener('click', function(){ go(2); });
  document.getElementById('n3').addEventListener('click', function(){
    if(!S.pflegeziel){ showErr('e3','Bitte das primäre Pflegeziel auswählen.'); return; }
    if(!S.intensitaet){ showErr('e3','Bitte die Pflegeintensität auswählen.'); return; }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Zeitraum & Planung ─────────────────────────────────────────────────
function s4(){
  var zeitpunktOpts = [
    {k:'fruehjahr', ico:'🌸', name:'Frühjahr',   sub:'März–Mai'},
    {k:'fruehs',    ico:'☀️', name:'Frühsommer', sub:'Juni–Juli'},
    {k:'herbst',    ico:'🍂', name:'Herbst',     sub:'Sep–Nov'},
    {k:'flexibel',  ico:'📅', name:'Flexibel',   sub:'nach Absprache'},
  ].map(function(z){
    var on = S.zeitpunkt === z.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-zt-btn" data-zk="'+z.k+'">'
      +'<span style="display:block;font-size:20px">'+z.ico+'</span>'
      +esc(z.name)
      +'<span class="ka-toggle-sub">'+esc(z.sub)+'</span>'
      +'</button>';
  }).join('');

  var dringlichkeitOpts = [
    {k:'naechste_saison', name:'Kann bis nächste Saison warten'},
    {k:'diese_saison',    name:'In dieser Saison'},
    {k:'baldmoeglichst',  name:'Baldmöglichst'},
  ].map(function(d){
    var on = S.dringlichkeit === d.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-dr-btn" data-dk="'+d.k+'">'
      +esc(d.name)+'</button>';
  }).join('');

  var wiederOpts = [
    {k:'einmalig',      name:'Einmalig',                      badge:''},
    {k:'rahmenvertrag', name:'Jährlicher Rahmenvertrag',      badge:'−10% Rabatt'},
  ].map(function(w){
    var on = S.wiederkehrend === w.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+' pf-wr-btn" data-wk="'+w.k+'">'
      +esc(w.name)
      +(w.badge ? '<span class="ka-toggle-sub" style="color:'+(on?'var(--kaw-forest)':'var(--kaw-forest)')+'">'+esc(w.badge)+'</span>' : '')
      +'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📅 Zeitraum & Planung</h2>'
    +'<p>Wann soll die Pflegemaßnahme durchgeführt werden? Freischneiden und Läuterung sind außerhalb der Vegetationsruhe zu empfehlen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Gewünschter Pflegezeitpunkt *</label>'
    +'<div class="ka-toggles">'+zeitpunktOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Dringlichkeit</label>'
    +'<div class="ka-toggles">'+dringlichkeitOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Wiederkehrende Maßnahme?</label>'
    +'<p class="ka-hint">Ein Rahmenvertrag sichert Kapazitäten und reduziert den Preis um 10%.</p>'
    +'<div class="ka-toggles">'+wiederOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Anmerkungen <span class="ka-label-optional">(optional)</span></label>'
    +'<textarea class="ka-textarea" id="i-bem" rows="3" placeholder="Besondere Hinweise zur Fläche, Zufahrt, Hangneigung, Vorgeschichte...">'+esc(S.bemerkung)+'</textarea>'
    +'</div>'

    +'<div class="ka-err" id="e4"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b4">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n4">Weiter →</button>'
    +'</div></div>';
}

function bind4(){
  document.querySelectorAll('.pf-zt-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.zeitpunkt = this.dataset.zk;
      document.querySelectorAll('.pf-zt-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('.pf-dr-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.dringlichkeit = this.dataset.dk;
      document.querySelectorAll('.pf-dr-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('.pf-wr-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.wiederkehrend = this.dataset.wk;
      document.querySelectorAll('.pf-wr-btn').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  var bemEl = document.getElementById('i-bem');
  if(bemEl) bemEl.addEventListener('input', function(){ S.bemerkung = this.value; });

  document.getElementById('b4').addEventListener('click', function(){
    var bemEl2 = document.getElementById('i-bem');
    if(bemEl2) S.bemerkung = bemEl2.value;
    go(3);
  });
  document.getElementById('n4').addEventListener('click', function(){
    var bemEl3 = document.getElementById('i-bem');
    if(bemEl3) S.bemerkung = bemEl3.value;
    if(!S.zeitpunkt){ showErr('e4','Bitte den gewünschten Pflegezeitpunkt wählen.'); return; }
    hideErr('e4');
    go(5);
  });
}

// ── Step 5: Fördercheck ────────────────────────────────────────────────────────
function s5(){
  var blOpts = Object.keys(BL_NAMEN).map(function(k){
    var on = S.bundesland === k;
    return '<option value="'+k+'"'+(on?' selected':'')+'>'+BL_NAMEN[k]+'</option>';
  }).join('');

  var progHtml = '';
  if(S.bundesland && FOERDER_PFLEGE[S.bundesland]){
    progHtml = '<div class="ka-foerder-box">'
      +'<div class="ka-foerder-title">🏦 Förderprogramme für '+esc(BL_NAMEN[S.bundesland])+'</div>'
      + FOERDER_PFLEGE[S.bundesland].map(function(prog){
        var checked = S.foerderprogramme.indexOf(prog) > -1;
        return '<label class="ka-check-card'+(checked?' selected':'')+'">'
          +'<input type="checkbox" class="pflege-prog-cb" data-prog="'+esc(prog)+'" '+(checked?'checked':'')+' style="width:16px;height:16px;accent-color:#012d1d;flex-shrink:0;margin-top:2px">'
          +'<div>'
          +'<div class="ka-foerder-prog-name">'+esc(prog)+'</div>'
          +'</div>'
          +'</label>';
      }).join('')
      +(S.foerderprogramme.length > 0
        ? '<div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--kaw-border)">'
          +'<button type="button" id="foerder-pdf-btn" class="ka-btn ka-btn-primary ka-btn-sm">📄 Förderprogramme als PDF speichern</button>'
          +'<p class="ka-hint">Öffnet sich in einem neuen Tab — dort als PDF drucken oder speichern.</p>'
          +'</div>'
        : '')
      +'</div>';
  }

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🏦 Fördermöglichkeiten prüfen</h2>'
    +'<p>Jungbestandspflege kann in vielen Bundesländern mit 50–90% gefördert werden.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Möchten Sie Fördermöglichkeiten prüfen? *</label>'
    +'<div class="ka-cards-stacked">'
    +'<div class="ka-radio-card'+(S.foerdercheck==='ja'?' selected':'')+'" data-fc="ja">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div><div class="ka-radio-label">✅ Ja, Förderung gewünscht</div>'
    +'<div class="ka-radio-desc">Bundesland auswählen und passende Programme ansehen</div></div>'
    +'</div>'
    +'<div class="ka-radio-card'+(S.foerdercheck==='nein'?' selected':'')+'" data-fc="nein">'
    +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
    +'<div><div class="ka-radio-label">→ Nein, weiter ohne Fördercheck</div>'
    +'<div class="ka-radio-desc">Direkt zur Kontaktaufnahme</div></div>'
    +'</div>'
    +'</div>'
    +'</div>'

    +(S.foerdercheck === 'ja' ?
      '<div class="ka-field">'
      +'<label class="ka-label">Bundesland *</label>'
      +'<select class="ka-select" id="i-bl-pflege"><option value="">— Bundesland wählen —</option>'+blOpts+'</select>'
      +'</div>'
      +'<div id="pflege-prog-container">'+progHtml+'</div>'
    :
      '<div id="pflege-bl-field" style="display:none">'
      +'<select class="ka-select" id="i-bl-pflege"><option value="">— Bundesland wählen —</option>'+blOpts+'</select>'
      +'</div>'
      +'<div id="pflege-prog-container"></div>'
    )

    +'<div class="ka-err" id="e5"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b5">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n5">Weiter →</button>'
    +'</div></div>';
}

function bind5(){
  document.querySelectorAll('[data-fc]').forEach(function(el){
    el.addEventListener('click', function(){
      S.foerdercheck = this.dataset.fc;
      if(S.foerdercheck === 'nein'){ S.bundesland = ''; S.foerderprogramme = []; }
      render();
    });
  });

  var blSel = document.getElementById('i-bl-pflege');
  if(blSel){
    blSel.addEventListener('change', function(){
      S.bundesland = this.value;
      S.foerderprogramme = [];
      render();
    });
  }

  document.querySelectorAll('.pflege-prog-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var prog = this.dataset.prog;
      if(this.checked){
        if(S.foerderprogramme.indexOf(prog) === -1) S.foerderprogramme.push(prog);
      } else {
        S.foerderprogramme = S.foerderprogramme.filter(function(p){ return p !== prog; });
      }
    });
  });

  var pdfBtn = document.getElementById('foerder-pdf-btn');
  if(pdfBtn) pdfBtn.addEventListener('click', function(){ downloadFoerderPDF_PFL(); });

  document.getElementById('b5').addEventListener('click', function(){ go(4); });
  document.getElementById('n5').addEventListener('click', function(){
    if(!S.foerdercheck){ showErr('e5','Bitte Fördercheck-Option wählen.'); return; }
    if(S.foerdercheck === 'ja' && !S.bundesland){ showErr('e5','Bitte Bundesland auswählen.'); return; }
    hideErr('e5');
    go(6);
  });
}

// ── Step 6: Kontakt + Zusammenfassung + Absenden ──────────────────────────────
function s6(){
  var preis = calcPreis();
  var massnahme = MM[S.massnahme] || {};
  var alterLabel  = (BESTANDSALTER.find(function(a){ return a.k === S.bestandsalter; }) || {name:'–'}).name;
  var dichteLabel = (DICHTE.find(function(d){ return d.k === S.dichte; }) || {name:'–'}).name;
  var baumLabels  = S.baumarten.map(function(k){ var b=BAUMARTEN.find(function(x){ return x.k===k; }); return b ? b.name : k; }).join(', ') || '–';
  var vegLabels   = S.vegetation.join(', ') || '–';

  var zielMap  = {aufwuchs:'Aufwuchsbeseitigung', qualitaet:'Qualitätssicherung', struktur:'Bestandsstruktur', mischung:'Mischungsregulierung'};
  var intMap   = {minimal:'Minimal', standard:'Standard', intensiv:'Intensiv'};
  var folgeMap = {jaehrlich:'Jährlich', 'alle2-3':'Alle 2–3 Jahre', einmalig:'Einmalig'};
  var ztMap    = {fruehjahr:'Frühjahr (März–Mai)', fruehs:'Frühsommer (Jun–Jul)', herbst:'Herbst (Sep–Nov)', flexibel:'Flexibel / nach Absprache'};
  var drMap    = {naechste_saison:'Kann bis nächste Saison warten', diese_saison:'In dieser Saison', baldmoeglichst:'Baldmöglichst'};
  var wrMap    = {einmalig:'Einmalig', rahmenvertrag:'Jährlicher Rahmenvertrag (−10%)'};
  var btLabel  = (BESITZERTYP.find(function(b){ return b.k === S.waldbesitzertyp; }) || {label:'–'}).label;

  var summaryRows = [
    ['Waldbesitzertyp', btLabel],
    ['Pflegemaßnahme', (massnahme.ico||'')+' '+(massnahme.name||'–')],
    ['Flächen', S.flaechenArr.map(function(f,i){ return (S.flaechenArr.length>1?'('+(i+1)+') ':'')+f.ha+' ha · '+f.plz+' '+f.ort+(f.forstamt?' · FA: '+f.forstamt:'')+(f.revier?' / '+f.revier:''); }).join(' | ')||'–'],
    ['Bestandsalter', alterLabel],
    ['Baumarten', baumLabels],
    ['Bestandsdichte', dichteLabel],
    ['Pflegeziel', zielMap[S.pflegeziel]||'–'],
    ['Konkurrenzvegetation', vegLabels],
    ['Pflegeintensität', intMap[S.intensitaet]||'–'],
    ['Folgepflege', folgeMap[S.folgepflege]||'–'],
    ['Pflegezeitpunkt', ztMap[S.zeitpunkt]||'–'],
    ['Dringlichkeit', drMap[S.dringlichkeit]||'–'],
    ['Maßnahmenart', wrMap[S.wiederkehrend]||'–'],
    ['Bundesland', S.foerdercheck==='ja' && S.bundesland ? (BL_NAMEN[S.bundesland]||S.bundesland) : ''],
    ['Förderprogramme', S.foerdercheck==='ja' && S.foerderprogramme.length ? S.foerderprogramme.join(' | ') : ''],
  ].filter(function(r){ return r[1] && r[1] !== '–'; }).map(function(r){
    return '<div class="ka-summary-row">'
      +'<span class="ka-summary-label">'+esc(r[0])+'</span>'
      +'<span class="ka-summary-value">'+esc(r[1])+'</span>'
      +'</div>';
  }).join('');

  var preisHtml = preis
    ? '<div class="ka-price-box">'
      +'<span>💶 Kostenindikation<br>'
      +esc(massnahme.name||'')+' · '+getTotalHa()+' ha'+(preis.rabatt>0?' · inkl. '+(preis.rabatt*100)+'% Rahmenvertrag-Rabatt':'')+'<br>'
      +'<small style="opacity:0.8">Unverbindliche Richtgröße. Endpreis nach Ortsbesichtigung.</small>'
      +'</span>'
      +'<strong>'+fmt(preis.min)+' – '+fmt(preis.max)+' €</strong>'
      +'</div>'
    : '';

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>👤 Kontaktdaten & Anfrage absenden</h2>'
    +'<p>Ihre Anfrage zur Kultur- und Jungbestandspflege. Wir melden uns innerhalb von 48 Stunden.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +preisHtml

    +'<div class="ka-summary">'
    +'<div class="ka-summary-title">📋 Ihre Angaben im Überblick</div>'
    +summaryRows
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Vollständiger Name *</label>'
    +'<input class="ka-inp" type="text" id="i-nm" value="'+esc(S.name)+'" placeholder="Vor- und Nachname" autocomplete="name">'
    +'</div>'

    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">E-Mail-Adresse *</label>'
    +'<input class="ka-inp" type="email" id="i-em" value="'+esc(S.email)+'" placeholder="ihre@email.de" autocomplete="email">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Telefon <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="tel" id="i-tel" value="'+esc(S.tel)+'" placeholder="+49 ..." autocomplete="tel">'
    +'</div>'
    +'</div>'

    +'<div class="ka-grid-2">'
    +'<div class="ka-field">'
    +'<label class="ka-label">PLZ</label>'
    +'<input class="ka-inp" type="text" inputmode="numeric" id="i-plz4" value="'+esc(S.plz4)+'" placeholder="12345" maxlength="5">'
    +'</div>'
    +'<div class="ka-field">'
    +'<label class="ka-label">Ort</label>'
    +'<input class="ka-inp" type="text" id="i-ort4" value="'+esc(S.ort4)+'" placeholder="Ihre Stadt">'
    +'</div>'
    +'</div>'

    +(S.foerdercheck === 'ja' && S.bundesland
      ? '<div class="ka-foerder-box">'
        +'<div class="ka-foerder-title">🏦 Gewählte Förderprogramme</div>'
        +(S.foerderprogramme.length
          ? S.foerderprogramme.map(function(p){ return '<div class="ka-foerder-prog"><div class="ka-foerder-prog-name">• '+esc(p)+'</div></div>'; }).join('')
          : '<p class="ka-hint">Keine Programme ausgewählt</p>'
        )
        +'</div>'
      : '')

    +'<div class="ka-field">'
    +'<label class="ka-label">Dokumente hochladen <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="file" id="i-docs" accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff" multiple>'
    +'<p class="ka-hint">z.B. Flurkarten, Lagepläne, Fotos der Fläche (max. 10 MB)</p>'
    +'</div>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="i-dsgvo" required style="width:20px;height:20px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'<div class="ka-err" id="e6"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b6">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind6(){
  var inmEl   = document.getElementById('i-nm');
  var iemEl   = document.getElementById('i-em');
  var itelEl  = document.getElementById('i-tel');
  var iplz4El = document.getElementById('i-plz4');
  var iort4El = document.getElementById('i-ort4');
  var idocsEl = document.getElementById('i-docs');

  if(inmEl)   inmEl.addEventListener('input',   function(){ S.name = this.value; });
  if(iemEl)   iemEl.addEventListener('input',   function(){ S.email = this.value; });
  if(itelEl)  itelEl.addEventListener('input',  function(){ S.tel = this.value; });
  if(iplz4El) iplz4El.addEventListener('input', function(){ S.plz4 = this.value; });
  if(iort4El) iort4El.addEventListener('input', function(){ S.ort4 = this.value; });
  if(idocsEl) idocsEl.addEventListener('change',function(){ S.uploadedFiles = Array.from(this.files); });

  document.getElementById('b6').addEventListener('click', function(){ go(5); });

  document.getElementById('sub').addEventListener('click', function(){
    if(inmEl)   S.name  = inmEl.value;
    if(iemEl)   S.email = iemEl.value;
    if(itelEl)  S.tel   = itelEl.value;
    if(iplz4El) S.plz4  = iplz4El.value;
    if(iort4El) S.ort4  = iort4El.value;
    if(idocsEl) S.uploadedFiles = Array.from(idocsEl.files);

    if(!S.name.trim()){ showErr('e6','Bitte Ihren Namen eingeben.'); return; }
    if(!S.email || !S.email.includes('@')){ showErr('e6','Bitte eine gültige E-Mail-Adresse eingeben.'); return; }
    var dsgvoEl=document.getElementById('i-dsgvo'); if(dsgvoEl&&!dsgvoEl.checked){ showErr('e6','Bitte Datenschutzerklärung bestätigen.'); return; }


    var btn = this;
    btn.disabled = true;
    btn.textContent = '⏳ Wird gesendet…';

    var massnahme   = MM[S.massnahme] || {};
    var alterLabel  = (BESTANDSALTER.find(function(a){ return a.k===S.bestandsalter; }) || {name:'–'}).name;
    var dichteLabel = (DICHTE.find(function(d){ return d.k===S.dichte; }) || {name:'–'}).name;
    var baumLabels  = S.baumarten.map(function(k){ var b=BAUMARTEN.find(function(x){ return x.k===k; }); return b?b.name:k; }).join(', ') || '–';
    var preis = calcPreis();
    var btLabel = (BESITZERTYP.find(function(b){ return b.k===S.waldbesitzertyp; }) || {label:''}).label;

    var payload = {
      leistung: 'Kulturpflege',
      waldbesitzertyp: btLabel || S.waldbesitzertyp || '',
      massnahme: massnahme.name || S.massnahme,
      massnahme_key: S.massnahme,
      ha: getTotalHa(),
      plz: (S.flaechenArr[0]||{}).plz||'',
      ort: (S.flaechenArr[0]||{}).ort||'',
      forstamt: (S.flaechenArr[0]||{}).forstamt||'',
      revier: (S.flaechenArr[0]||{}).revier||'',
      gps: (S.flaechenArr[0]||{}).gps||'',
      treffpunkt: S.treffpunkt || '',
      flaechen_str: S.flaechenArr.map(function(f,i){return 'Fläche '+(i+1)+': '+f.ha+' ha, '+f.plz+' '+f.ort+(f.forstamt?' (FA: '+f.forstamt+(f.revier?'/'+f.revier:'')+')'  :'');}).join(' | '),
      flaechen: S.flaechenArr.map(function(f){return {plz:f.plz,ort:f.ort,forstamt:f.forstamt,revier:f.revier,ha:f.ha,gps:f.gps||''};}),
      bestandsalter: alterLabel,
      baumarten: baumLabels,
      dichte: dichteLabel,
      pflegeziel: S.pflegeziel,
      vegetation: S.vegetation.join(', ') || '',
      intensitaet: S.intensitaet,
      folgepflege: S.folgepflege || '',
      zeitpunkt: S.zeitpunkt,
      dringlichkeit: S.dringlichkeit || '',
      wiederkehrend: S.wiederkehrend || '',
      bemerkung: S.bemerkung || '',
      foerderberatung: S.foerdercheck === 'ja' ? 'Ja' : 'Nein',
      bundesland: S.bundesland ? (BL_NAMEN[S.bundesland] || S.bundesland) : '',
      foerderprogramme: S.foerderprogramme.join(', ') || '',
      kostenindikation: preis ? fmt(preis.min)+' – '+fmt(preis.max)+' €' : 'Nicht berechnet',
      name: S.name,
      email: S.email,
      tel: S.tel || '',
      plz4: S.plz4 || '',
      ort4: S.ort4 || '',
    };

    var fd = new FormData();
    fd.append('data', JSON.stringify(payload));
    if(idocsEl && idocsEl.files && idocsEl.files[0]) fd.append('file', idocsEl.files[0]);

    fetch('/wp-json/koch/v1/anfrage', {method:'POST', credentials:'same-origin', body:fd})
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
      .then(function(){ showOK(); })
      .catch(function(err){
        console.error(err);
        btn.disabled = false;
        btn.textContent = '📤 Anfrage absenden';
        var errEl = document.getElementById('e6');
        if(errEl){errEl.setAttribute("role","alert");errEl.setAttribute("aria-live","assertive");errEl.innerHTML='<span>⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.parentNode.style.display=\'none\';document.querySelector(\'.pf-btn.p,.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small></span>';errEl.style.display='block';}
      });
  });
}

// ── Erfolgs-Screen ─────────────────────────────────────────────────────────────
function showOK(){ clearDraft();
  try {
    var korb = JSON.parse(localStorage.getItem('ka_projektkorb') || '{}');
    if(!korb.items) korb.items = [];
    korb.items = korb.items.filter(function(i){ return i.type !== 'kulturpflege'; });
    var summary = getTotalHa()+'ha · '+S.flaechenArr.length+' Fläche'+(S.flaechenArr.length>1?'n':'');
    var fullState = JSON.parse(JSON.stringify(S));
    korb.items.push({
      type: 'kulturpflege',
      label: '✂️ Kultur- & Jungbestandpflege',
      summary: summary,
      data: fullState,
      addedAt: Date.now()
    });
    localStorage.setItem('ka_projektkorb', JSON.stringify(korb));
    var korbCount = korb.items.length;
  } catch(e){ console.error(e); var korbCount = 1; }

  document.getElementById('pf-main').innerHTML = '<div class="ka-card"><div class="ka-success">'
    +'<div class="ka-success-icon">✅</div>'
    +'<h2>Anfrage eingegangen!</h2>'
    +'<p>Wir melden uns innerhalb von 48 Stunden mit einem unverbindlichen Angebot.</p>'
    +'<div class="ka-success-card">'
    +'<strong>✂️ Kultur- & Jungbestandpflege</strong><br>'
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

// ── Fördercheck PDF-Export ─────────────────────────────────────────────────────
function downloadFoerderPDF_PFL(){
  fetch('/wp-json/ka/v1/wizard-pdf', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      name: S.name || 'Waldbesitzer',
      email: S.email || '',
      waldflaeche: getTotalHa() || '',
      bundesland: S.bundesland,
      eigentuemer: 'Kulturpflege',
      programme: S.foerderprogramme
    })
  }).then(function(r){ return r.json(); })
    .then(function(d){ if(d && d.html){ var w=window.open('','_blank'); w.document.write(d.html); w.document.close(); } })
    .catch(function(e){ console.error('PDF Fehler:',e); alert('Fehler beim Generieren des PDFs. Bitte versuchen Sie es erneut.'); });
}

// ── Expose for edit-mode ────────────────────────────────────────────────────────
window._pflegeS = S;
window._pflegeRender = render;

// ── Init ───────────────────────────────────────────────────────────────────────
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', function(){ try{ render(); }catch(e){ console.error(e); } });
} else {
  try{ render(); }catch(e){ console.error(e); }
}

})();

// ── Edit-Mode (URL-Parameter ?edit) ──────────────────────────────────────────
(function(){
  var params = new URLSearchParams(window.location.search);
  if(!params.has('edit')) return;
  function tryLoadEdit(){
    if(typeof window._pflegeS === 'undefined' || typeof window._pflegeRender !== 'function'){
      setTimeout(tryLoadEdit, 100); return;
    }
    try {
      var korb = JSON.parse(localStorage.getItem('ka_projektkorb') || '{}');
      if(!korb.items) return;
      var item = korb.items.find(function(i){ return i.type === 'kulturpflege'; });
      if(!item || !item.data) return;
      Object.keys(item.data).forEach(function(k){ window._pflegeS[k] = item.data[k]; });
      window._pflegeRender();
      var main = document.getElementById('pf-main');
      if(main && main.parentNode){
        var b = document.createElement('div');
        b.innerHTML = '<div style="background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px;margin-bottom:16px"><strong style="color:#012d1d">✏️ Bearbeitungsmodus — Ihre gespeicherten Daten wurden geladen.</strong></div>';
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

