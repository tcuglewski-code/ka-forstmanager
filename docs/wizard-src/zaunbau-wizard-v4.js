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





// ── Step Labels ───────────────────────────────────────────────────────────────
var STEP_LABELS = ['Besitzertyp','Zauntyp','Gelände','Ausstattung','Zeitraum','Kontakt'];
var TOTAL_STEPS = 6;

// ── Waldbesitzertypen ─────────────────────────────────────────────────────────
var BESITZERTYP = [
  { k: 'privatperson',   label: 'Privatperson' },
  { k: 'personengesell', label: 'Personengesellschaft' },
  { k: 'koerperschaft',  label: 'Körperschaft d. öffentl. Rechts' },
  { k: 'kommunal',       label: 'Kommunal/Staatlich' },
];

// ── Zauntypen ─────────────────────────────────────────────────────────────────
var ZAUNTYPEN = [
  {
    k: 'rotwild',
    name: 'Rotwild-/Schwarzwildschutzzaun',
    ico: '🦌',
    hoehe: '1,8 m',
    desc: 'Robuster Hochschutz für Gebiete mit Rotwild oder Schwarzwild. Knotengeflechtmatte mit engmaschigem Unterkantenschutz.',
    einsatz: 'Bergwälder, Reviere mit starkem Wildbestand, Neupflanzungen im Rotwildgebiet',
    preisMin: 8, preisMax: 14,
  },
  {
    k: 'rehwild',
    name: 'Rehwild-Schutzzaun',
    ico: '🐾',
    hoehe: '1,2 m',
    desc: 'Bewährter Standardschutz für Rehwild-Gebiete. Kosteneffizient, leicht zu montieren.',
    einsatz: 'Aufforstungen in Normallagen, Laubholzpflanzungen, Kahlschläge',
    preisMin: 5, preisMax: 9,
  },
  {
    k: 'reviergrenz',
    name: 'Reviergrenzzaun / Eigentumszaun',
    ico: '🗺️',
    hoehe: 'Flexibel',
    desc: 'Markierung von Grundstücksgrenzen und Reviergrenzen. Verschiedene Höhen und Materialien möglich.',
    einsatz: 'Waldeigentümer-Grenzen, Revierabgrenzung, Schutzfunktionen am Waldrand',
    preisMin: 4, preisMax: 7,
  },
  {
    k: 'kombizaun',
    name: 'Kombinierter Schutz- und Revierzaun',
    ico: '🔒',
    hoehe: '1,5–2,0 m',
    desc: 'Kombination aus Wildschutz und Reviergrenzmarkierung. Optimal für Flächen an Eigentumsgrenzen mit gleichzeitigem Wildverbiss-Problem.',
    einsatz: 'Grenzbereiche zwischen Privatwald, Kommunal- und Staatswald; Sonderstandorte',
    preisMin: 7, preisMax: 12,
  },
];

var ZAUNTYP_MAP = {};
ZAUNTYPEN.forEach(function(z){ ZAUNTYP_MAP[z.k] = z; });

// ── Geländetypen ──────────────────────────────────────────────────────────────
var GELAENDE = [
  { k: 'eben',       name: 'Eben',          ico: '▬',  aufschlag: 0,  info: 'Kein Aufschlag' },
  { k: 'leicht',     name: 'Leicht hängig', ico: '📐', aufschlag: 15, info: '+15% Aufschlag' },
  { k: 'steil',      name: 'Steil',         ico: '⛰️',  aufschlag: 30, info: '+30% Aufschlag' },
  { k: 'sehr_steil', name: 'Sehr steil',    ico: '🏔️',  aufschlag: 50, info: '+50% Aufschlag' },
];

// ── Pfahltypen ────────────────────────────────────────────────────────────────
var PFAHLTYPEN = [
  { k: 'stahl',   name: 'Stahlpfähle',                         ico: '🔩', desc: 'Langlebig, witterungsbeständig, schnelle Montage' },
  { k: 'holz_g',  name: 'Holzpfähle (geschält)',               ico: '🪵', desc: 'Natürliches Material, kostengünstig, typisch im Forst' },
  { k: 'holz_ki', name: 'Holzpfähle (kesseldruckimprägniert)', ico: '🌲', desc: 'Beste Haltbarkeit für Holz, 20+ Jahre Standzeit' },
];

// ── Netztypen ─────────────────────────────────────────────────────────────────
var NETZTYPEN = [
  { k: 'standard',   name: 'Standard-Wildschutznetz', ico: '🔲', desc: 'Knotengeflecht, bewährt für Standardanwendungen' },
  { k: 'doppel',     name: 'Doppelnetz',              ico: '🔳', desc: 'Erhöhter Schutz bei starkem Wildverbiss' },
  { k: 'hochschutz', name: 'Hochschutz-Netz',         ico: '🛡️',  desc: 'Für extreme Wilddrucksituationen, verstärktes Geflecht' },
];

// ── Fördercheck-Daten ─────────────────────────────────────────────────────────
var FOERDER_ZAUN = {
  BY: [
    {
      id: 'waldfoerp_z', name: 'WALDFÖPR Bayern — Kulturschutz & Zaunbau',
      desc: 'Zaunbau zur Kultur-/Bestandsschutzmaßnahme im Privat- und Körperschaftswald',
      rate: 'Bis 70% (Kleinprivatwald bis 90%)',
      url: 'https://www.stmelf.bayern.de/foerderung/index.html',
      keyPoints: [
        '✅ Zaunbau bei Aufforstungen und Waldumbau förderfähig',
        '✅ Wildschutzeinzäunungen eingeschlossen',
        '📋 Antrag über das zuständige AELF Bayern',
        '📐 Mindestfläche: 0,3 ha',
        '💰 Kleinprivatwald < 5 ha: bis 90% Förderung',
      ],
    },
    {
      id: 'gak_z', name: 'GAK — Gemeinschaftsaufgabe Agrarstruktur',
      desc: 'Bundesweites Rahmenprogramm inkl. Kulturschutzmaßnahmen',
      rate: '50–90% je nach Maßnahme',
      url: 'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints: [
        '🇩🇪 Kofinanzierung Bund + Freistaat Bayern',
        '✅ Zaunbau als Schutzmaßnahme förderfähig',
        '📋 Antrag über das zuständige Forstamt',
      ],
    },
  ],
  HE: [
    {
      id: 'he_zaun', name: 'Forstförderung Hessen — Kulturschutz',
      desc: 'Zaunbau und Einzelschutz bei Waldumbau und Wiederaufforstung',
      rate: 'Pauschalen je Maßnahme',
      url: 'https://landwirtschaft.hessen.de/landwirtschaft/foerderung',
      keyPoints: [
        '✅ Zaunbau bei Kalamitätsflächen förderfähig',
        '✅ Wildschutz als Kulturschutzmaßnahme',
        '📋 Antrag über das zuständige Landwirtschaftsamt',
      ],
    },
    {
      id: 'gak_z', name: 'GAK — Gemeinschaftsaufgabe Agrarstruktur',
      desc: 'Bundesweites Rahmenprogramm',
      rate: '50–90% je nach Maßnahme',
      url: 'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints: ['🇩🇪 Kofinanzierung Bund + Bundesland', '✅ Zaunbau als Schutzmaßnahme', '📋 Antrag über das Forstamt'],
    },
  ],
  NRW: [
    {
      id: 'nrw_zaun', name: 'FöRL NRW — Kulturschutz & Zaunbau',
      desc: 'Wildschutzmaßnahmen als Teil der Wiederaufforstungsförderung',
      rate: 'Je Maßnahme verschieden',
      url: 'https://www.waldbauernlotse.de/massnahmen-im-privat-und-koerperschaftswald',
      keyPoints: [
        '✅ Wildschutzzäune bei Aufforstung förderfähig',
        '💻 100% digitales Antragsverfahren über Waldweb NRW',
        '⚠️ Vertragsschluss erst nach Antragstellung!',
      ],
    },
    {
      id: 'gak_z', name: 'GAK — Gemeinschaftsaufgabe Agrarstruktur',
      desc: 'Bundesweites Rahmenprogramm',
      rate: '50–90% je nach Maßnahme',
      url: 'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints: ['🇩🇪 Kofinanzierung Bund + Bundesland', '✅ Zaunbau als Schutzmaßnahme', '📋 Antrag über das Forstamt'],
    },
  ],
  DEFAULT: [
    {
      id: 'gak_z', name: 'GAK — Gemeinschaftsaufgabe Agrarstruktur (Bund)',
      desc: 'Bundesweites Programm — Zaunbau als Kulturschutzmaßnahme förderbar',
      rate: '50–90% je nach BL und Maßnahme',
      url: 'https://www.bmleh.de/DE/Home/home_node.html',
      keyPoints: [
        '🇩🇪 Gilt in allen 16 Bundesländern',
        '✅ Zaunbau für Aufforstungsschutz förderfähig',
        '💰 50–90% Förderanteil je nach Bundesland',
        '📋 Antrag über das zuständige Landes-Forstamt',
      ],
    },
  ],
};

// ── State ─────────────────────────────────────────────────────────────────────
var S = {
  step: 0,
  // Step 0: Waldbesitzertyp
  besitzertyp: '',
  // Step 1: Zauntyp
  zauntyp: '',
  // Step 2: Zaunlänge & Gelände
  laenge: 200,
  abschnitte: [{ id: 1, laenge: 200, forstamt: '', revier: '' }],
  gelaende: '',
  untergrund: '',   // gruenland | waldbestand
  altmaterial: '',  // ja | nein
  // Step 3: Ausstattung
  pfahltyp: '',
  netztyp: '',
  klettersch: false,
  erdanker: false,
  unterkriechsch: false,
  tore: 0,
  // Step 4: Zeitraum
  quartal: '',
  jahr: new Date().getFullYear(),
  dringlichkeit: '',
  besonderheiten: '',
  // Step 5: Kontakt
  name: '', tel: '', email: '', plzOrt: '', gps: '', treffpunkt: '',
  grundstueck: '',
  bundesland: '',
  foerderProgramme: [],
  foerderBeratung: false,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function esc(v){ var d=document.createElement('div'); d.textContent=String(v||''); return d.innerHTML; }
function fmt(n){ return Number(n).toLocaleString('de-DE',{maximumFractionDigits:2}); }
function showErr(id,msg){ var e=document.getElementById(id); if(e){e.textContent=msg;e.setAttribute("role","alert");e.setAttribute("aria-live","assertive");e.style.display="block";} }

/* P1: sessionStorage Autosave */
var DRAFT_KEY='ka-wizard-zaunbau-draft';
function saveDraft(){try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify(S));}catch(e){}}
function loadDraft(){try{var d=sessionStorage.getItem(DRAFT_KEY);if(d){var p=JSON.parse(d);Object.keys(p).forEach(function(k){if(k!=='step')S[k]=p[k];});}}catch(e){}}
function clearDraft(){try{sessionStorage.removeItem(DRAFT_KEY);}catch(e){}}

function hideErr(id){ var e=document.getElementById(id); if(e){e.textContent=''; e.style.display='none';} }
function go(n){ S.step=n; saveDraft(); try{history.pushState({step:n},"","#step-"+n);}catch(e){} render(); window.scrollTo(0,0); }

// ── Price Calculation ─────────────────────────────────────────────────────────
function calcPrice(){
  if(!S.zauntyp || !S.laenge) return null;
  var zt = ZAUNTYP_MAP[S.zauntyp];
  if(!zt) return null;
  var gl = GELAENDE.find(function(g){ return g.k===S.gelaende; });
  var aufschlag = gl ? gl.aufschlag/100 : 0;
  var minPrm = zt.preisMin * (1+aufschlag);
  var maxPrm = zt.preisMax * (1+aufschlag);
  if(S.netztyp==='doppel'){ minPrm*=1.15; maxPrm*=1.15; }
  if(S.netztyp==='hochschutz'){ minPrm*=1.25; maxPrm*=1.25; }
  var extrasM = 0;
  if(S.klettersch) extrasM += 1.5;
  if(S.erdanker) extrasM += 0.8;
  if(S.unterkriechsch) extrasM += 0.6;
  var gesMin = Math.round((minPrm + extrasM) * S.laenge);
  var gesMax = Math.round((maxPrm + extrasM) * S.laenge);
  var toreMin = S.tore * 80;
  var toreMax = S.tore * 150;
  return {
    gesMin: gesMin + toreMin,
    gesMax: gesMax + toreMax,
    prMin: minPrm + extrasM,
    prMax: maxPrm + extrasM,
  };
}

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

// ── Main Render ───────────────────────────────────────────────────────────────
function render(){
  var root = document.getElementById('pf');
  if(!root) return;

  var hero = '<div class="ka-hero">'
    +'<a href="/" class="ka-home-btn">← Koch Aufforstung</a>'
    +'<span class="ka-hero-icon">🏗️</span>'
    +'<h1>Zaunbau anfragen</h1>'
    +'<p>In wenigen Schritten zum unverbindlichen Angebot</p>'
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

// ── Step 0: Waldbesitzertyp ───────────────────────────────────────────────────
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

// ── Step 1: Zauntyp ───────────────────────────────────────────────────────────
function s1(){
  var cards = ZAUNTYPEN.map(function(z){
    var on = S.zauntyp === z.k;
    return '<div class="ka-card-option'+(on?' selected':'')+' ka-zauntyp-card" data-ztk="'+z.k+'">'
      +'<div style="display:flex;align-items:flex-start;gap:12px">'
      +'<span class="ka-card-icon" style="font-size:28px;margin-bottom:0">'+z.ico+'</span>'
      +'<div style="flex:1;min-width:0">'
      +'<span class="ka-card-name">'+esc(z.name)+'</span>'
      +'<span class="ka-card-sub">Höhe: '+esc(z.hoehe)+'</span>'
      +'<p class="ka-card-desc">'+esc(z.desc)+'</p>'
      +'<div class="ka-info-box brand" style="margin-bottom:0;padding:6px 10px;font-size:11px">📍 '+esc(z.einsatz)+'</div>'
      +'<div class="ka-card-price">💰 ca. '+z.preisMin+'–'+z.preisMax+' €/m (Richtpreis, ohne Geländeaufschlag)</div>'
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>🏗️ Welchen Zaun benötigen Sie?</h2>'
    +'<p>Wählen Sie den passenden Zauntyp für Ihren Standort und Wildbestand.</p>'
    +'</div>'
    +'<div class="ka-card-body">'
    +'<div class="ka-cards-stacked">'+cards+'</div>'
    +'<div class="ka-err" id="e1"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b1">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n1">Weiter →</button>'
    +'</div></div>';
}

function bind1(){
  document.querySelectorAll('.ka-zauntyp-card').forEach(function(card){
    card.addEventListener('click', function(){
      S.zauntyp = this.dataset.ztk;
      document.querySelectorAll('.ka-zauntyp-card').forEach(function(c){ c.classList.remove('selected'); });
      this.classList.add('selected');
      hideErr('e1');
    });
  });
  document.getElementById('b1').addEventListener('click', function(){ go(0); });
  document.getElementById('n1').addEventListener('click', function(){
    if(!S.zauntyp){ showErr('e1','Bitte einen Zauntyp auswählen.'); return; }
    go(2);
  });
}

// ── Step 2: Zaunlänge & Gelände ───────────────────────────────────────────────
function renderAbschnitte(){
  return (S.abschnitte||[]).map(function(ab, idx){
    return '<div class="ka-flaeche" id="ab-block-'+ab.id+'">'
      +'<div class="ka-flaeche-header">'
      +'<div class="ka-flaeche-title">📏 Abschnitt '+(idx+1)+'</div>'
      +(S.abschnitte.length > 1
        ? '<button type="button" class="ka-flaeche-del zb-rem" data-id="'+ab.id+'">✕ Entfernen</button>'
        : '')
      +'</div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">Länge *</label>'
      +'<div class="ka-qty">'
      +'<button type="button" class="ka-qty-btn ab-m" data-id="'+ab.id+'">−</button>'
      +'<input type="number" class="ka-qty-input ab-l" data-id="'+ab.id+'" min="50" step="50" value="'+ab.laenge+'">'
      +'<span style="font-size:13px;color:var(--kaw-text-muted);margin-left:4px">m</span>'
      +'</div>'
      +'</div>'
      +'<div class="ka-grid-2">'
      +'<div class="ka-field">'
      +'<label class="ka-label">Forstamt *</label>'
      +'<input type="text" class="ka-inp ab-fa" data-id="'+ab.id+'" value="'+esc(ab.forstamt)+'" placeholder="z.B. FA Rosenheim">'
      +'</div>'
      +'<div class="ka-field">'
      +'<label class="ka-label">Revier *</label>'
      +'<input type="text" class="ka-inp ab-rv" data-id="'+ab.id+'" value="'+esc(ab.revier)+'" placeholder="z.B. Revier 3">'
      +'</div>'
      +'</div>'
      +'</div>';
  }).join('');
}

function gesamtLaenge(){
  return (S.abschnitte||[]).reduce(function(s,a){ return s+(a.laenge||0); }, 0);
}

function s2(){
  var glCards = GELAENDE.map(function(g){
    var on = S.gelaende === g.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-glk="'+g.k+'">'
      +g.ico+' '+esc(g.name)
      +'<span class="ka-toggle-sub">'+esc(g.info)+'</span>'
      +'</button>';
  }).join('');

  var gl = S.gelaende ? GELAENDE.find(function(g){ return g.k===S.gelaende; }) : null;

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📏 Zaunlänge &amp; Gelände</h2>'
    +'<p>Angaben zu Länge und Geländebeschaffenheit. Mehrere Abschnitte möglich.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // Abschnitte
    +'<div class="ka-field">'
    +'<label class="ka-label">Zaunabschnitte *</label>'
    +renderAbschnitte()
    +'<button type="button" id="add-ab" class="ka-add-btn">+ Weiteren Abschnitt hinzufügen</button>'
    +'<p class="ka-hint">Gesamtlänge: '+gesamtLaenge()+' m · Schritte à 50 m. Unsicher? Einfach schätzen.</p>'
    +'</div>'

    // Geländetyp
    +'<div class="ka-field">'
    +'<label class="ka-label">Geländetyp *</label>'
    +'<p class="ka-hint">Das Gelände beeinflusst den Arbeitsaufwand und damit den Preis.</p>'
    +'<div class="ka-toggles">'+glCards+'</div>'
    +(gl ? '<div class="ka-info-box brand" style="margin-top:10px">💡 <strong>Geländezuschlag für '+esc(gl.name)+':</strong> '+esc(gl.info)+'</div>' : '')
    +'</div>'

    // Flächentyp
    +'<div class="ka-field">'
    +'<label class="ka-label">Flächentyp</label>'
    +'<div class="ka-toggles">'
    +'<button type="button" class="ka-toggle'+(S.untergrund==='gruenland'?' selected':'')+'" data-ug="gruenland">🌿 Grünland</button>'
    +'<button type="button" class="ka-toggle'+(S.untergrund==='waldbestand'?' selected':'')+'" data-ug="waldbestand">🌲 Waldbestand</button>'
    +'</div>'
    +'</div>'

    // Altmaterial
    +'<div class="ka-field">'
    +'<label class="ka-label">Bestehende Pfähle / Altmaterial vorhanden?</label>'
    +'<div class="ka-toggles">'
    +'<button type="button" class="ka-toggle'+(S.altmaterial==='ja'?' selected':'')+'" data-am="ja">✅ Ja</button>'
    +'<button type="button" class="ka-toggle'+(S.altmaterial==='nein'?' selected':'')+'" data-am="nein">❌ Nein</button>'
    +'</div>'
    +'<p class="ka-hint">Vorhandene Pfähle können ggf. wiederverwendet werden und reduzieren die Kosten.</p>'
    +'</div>'

    +'<div class="ka-err" id="e2"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b2">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n2">Weiter →</button>'
    +'</div></div>';
}

function bindAbschnittHandlers(){
  document.querySelectorAll('.ab-m').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id=parseInt(this.dataset.id);
      var ab=S.abschnitte.find(function(a){ return a.id===id; });
      if(ab){ ab.laenge=Math.max(50,ab.laenge-50); S.laenge=gesamtLaenge(); render(); }
    });
  });
  document.querySelectorAll('.ab-p, .ka-qty-btn[data-p]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id=parseInt(this.dataset.id);
      var ab=S.abschnitte.find(function(a){ return a.id===id; });
      if(ab){ ab.laenge+=50; S.laenge=gesamtLaenge(); render(); }
    });
  });
  document.querySelectorAll('.ab-l').forEach(function(inp){
    inp.addEventListener('input', function(){
      var id=parseInt(this.dataset.id);
      var ab=S.abschnitte.find(function(a){ return a.id===id; });
      if(ab){ ab.laenge=Math.max(50,parseInt(this.value)||50); S.laenge=gesamtLaenge(); }
    });
  });
  document.querySelectorAll('.ab-fa').forEach(function(inp){
    inp.addEventListener('input', function(){
      var id=parseInt(this.dataset.id);
      var ab=S.abschnitte.find(function(a){ return a.id===id; });
      if(ab) ab.forstamt=this.value;
    });
  });
  document.querySelectorAll('.ab-rv').forEach(function(inp){
    inp.addEventListener('input', function(){
      var id=parseInt(this.dataset.id);
      var ab=S.abschnitte.find(function(a){ return a.id===id; });
      if(ab) ab.revier=this.value;
    });
  });
  document.querySelectorAll('.zb-rem').forEach(function(btn){
    btn.addEventListener('click', function(){
      var id=parseInt(this.dataset.id);
      S.abschnitte=S.abschnitte.filter(function(a){ return a.id!==id; });
      S.laenge=gesamtLaenge();
      render();
    });
  });
  var addBtn=document.getElementById('add-ab');
  if(addBtn) addBtn.addEventListener('click', function(){
    var newId=Math.max.apply(null, S.abschnitte.map(function(a){ return a.id; }))+1;
    S.abschnitte.push({id:newId, laenge:200, forstamt:'', revier:''});
    S.laenge=gesamtLaenge();
    render();
    setTimeout(function(){
      var last=document.getElementById('ab-block-'+newId);
      if(last) last.scrollIntoView({behavior:'smooth', block:'start'});
    }, 100);
  });
}

function bind2(){
  bindAbschnittHandlers();

  document.querySelectorAll('[data-glk]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.gelaende = this.dataset.glk;
      render();
    });
  });
  document.querySelectorAll('[data-ug]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.untergrund = this.dataset.ug;
      document.querySelectorAll('[data-ug]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('[data-am]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.altmaterial = this.dataset.am;
      document.querySelectorAll('[data-am]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  document.getElementById('b2').addEventListener('click', function(){ go(1); });
  document.getElementById('n2').addEventListener('click', function(){
    S.laenge = gesamtLaenge();
    if(S.laenge < 50){ showErr('e2','Bitte Zaunlänge eingeben (mind. 50 m).'); return; }
    for(var i=0; i<S.abschnitte.length; i++){
      var ab=S.abschnitte[i];
      if(!ab.forstamt||!ab.forstamt.trim()){ showErr('e2','Bitte Forstamt für Abschnitt '+(i+1)+' eingeben.'); return; }
      if(!ab.revier||!ab.revier.trim()){ showErr('e2','Bitte Revier für Abschnitt '+(i+1)+' eingeben.'); return; }
    }
    if(!S.gelaende){ showErr('e2','Bitte Geländetyp wählen.'); return; }
    hideErr('e2');
    go(3);
  });
}

// ── Step 3: Ausstattung ───────────────────────────────────────────────────────
function s3(){
  var pfahlCards = PFAHLTYPEN.map(function(p){
    var on = S.pfahltyp === p.k;
    return '<div class="ka-card-option'+(on?' selected':'')+' zb-pfahl-opt" data-pk="'+p.k+'">'
      +'<span class="ka-card-icon">'+p.ico+'</span>'
      +'<span class="ka-card-name">'+esc(p.name)+'</span>'
      +'<p class="ka-card-desc">'+esc(p.desc)+'</p>'
      +'</div>';
  }).join('');

  var netzCards = NETZTYPEN.map(function(n){
    var on = S.netztyp === n.k;
    return '<div class="ka-card-option'+(on?' selected':'')+' zb-netz-opt" data-nk="'+n.k+'">'
      +'<span class="ka-card-icon">'+n.ico+'</span>'
      +'<span class="ka-card-name">'+esc(n.name)+'</span>'
      +'<p class="ka-card-desc">'+esc(n.desc)+'</p>'
      +'</div>';
  }).join('');

  var preis = calcPrice();

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>⚙️ Ausstattung &amp; Extras</h2>'
    +'<p>Konfigurieren Sie Material, Netz und optionale Zusatzleistungen.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-field">'
    +'<label class="ka-label">Pfahltyp *</label>'
    +'<div class="ka-grid-auto">'+pfahlCards+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Wildschutznetz *</label>'
    +'<div class="ka-grid-auto">'+netzCards+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Extras (optional)</label>'
    +'<label class="ka-check-card'+(S.klettersch?' selected':'')+'">'
    +'<input type="checkbox" id="ex-kletter" '+(S.klettersch?'checked':'')+'>'
    +'<div>'
    +'<div style="font-size:13px;font-weight:600">Überkletterschutz</div>'
    +'<div class="ka-hint" style="margin-top:0">+ca. 1,50 €/m — Verhindert Überklettern durch Rehe und Schwarzwild</div>'
    +'</div>'
    +'</label>'
    +'<label class="ka-check-card'+(S.erdanker?' selected':'')+'">'
    +'<input type="checkbox" id="ex-erdanker" '+(S.erdanker?'checked':'')+'>'
    +'<div>'
    +'<div style="font-size:13px;font-weight:600">Erdanker / Bodenverankerung</div>'
    +'<div class="ka-hint" style="margin-top:0">+ca. 0,80 €/m — Stabilisierung in lockerem oder steinigem Boden</div>'
    +'</div>'
    +'</label>'
    +'<label class="ka-check-card'+(S.unterkriechsch?' selected':'')+'">'
    +'<input type="checkbox" id="ex-unkr" '+(S.unterkriechsch?'checked':'')+'>'
    +'<div>'
    +'<div style="font-size:13px;font-weight:600">Unterkriechschutz (Bodenanker)</div>'
    +'<div class="ka-hint" style="margin-top:0">+ca. 0,60 €/m — Verhindert Untergraben durch Schwarzwild</div>'
    +'</div>'
    +'</label>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Wilddurchlass-Tore</label>'
    +'<div class="ka-qty">'
    +'<button type="button" class="ka-qty-btn" id="t-minus">−</button>'
    +'<input class="ka-qty-input" type="number" id="i-tore" min="0" step="1" value="'+S.tore+'">'
    +'<span style="font-size:13px;color:var(--kaw-text-muted);margin-left:4px">Tore (ca. 80–150 €/Stück)</span>'
    +'</div>'
    +'</div>'

    // Preisindikation
    +(preis
      ? '<div class="ka-price-box" id="zb-price-box">'
        +'<span>💰 Aktuelle Preisindikation<br>'
        +'<small>ca. '+preis.prMin.toFixed(2)+' – '+preis.prMax.toFixed(2)+' €/m · '+S.laenge+' m'
        +(S.tore>0?' · '+S.tore+' Tor'+(S.tore>1?'e':''):'')
        +'<br>Unverbindliche Richtpreis-Angabe</small>'
        +'</span>'
        +'<strong>'+fmt(preis.gesMin)+' – '+fmt(preis.gesMax)+' €</strong>'
        +'</div>'
      : '<div id="zb-price-box"></div>')

    +'<div class="ka-err" id="e3"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b3">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n3">Weiter →</button>'
    +'</div></div>';
}

function updatePreisBox(){
  var preis = calcPrice();
  var box = document.getElementById('zb-price-box');
  if(!box) return;
  if(preis){
    box.className = 'ka-price-box';
    box.innerHTML = '<span>💰 Aktuelle Preisindikation<br>'
      +'<small>ca. '+preis.prMin.toFixed(2)+' – '+preis.prMax.toFixed(2)+' €/m · '+S.laenge+' m'
      +(S.tore>0?' · '+S.tore+' Tor'+(S.tore>1?'e':''):'')
      +'<br>Unverbindliche Richtpreis-Angabe</small>'
      +'</span>'
      +'<strong>'+fmt(preis.gesMin)+' – '+fmt(preis.gesMax)+' €</strong>';
  } else {
    box.className=''; box.innerHTML='';
  }
}

function bind3(){
  document.querySelectorAll('.zb-pfahl-opt').forEach(function(opt){
    opt.addEventListener('click', function(){
      S.pfahltyp = this.dataset.pk;
      document.querySelectorAll('.zb-pfahl-opt').forEach(function(o){ o.classList.remove('selected'); });
      this.classList.add('selected');
      updatePreisBox();
    });
  });
  document.querySelectorAll('.zb-netz-opt').forEach(function(opt){
    opt.addEventListener('click', function(){
      S.netztyp = this.dataset.nk;
      document.querySelectorAll('.zb-netz-opt').forEach(function(o){ o.classList.remove('selected'); });
      this.classList.add('selected');
      updatePreisBox();
    });
  });

  // Checkbox ka-check-card visual sync
  function syncCheckCard(inp){
    var card = inp.closest ? inp.closest('.ka-check-card') : inp.parentElement;
    if(card){ card.classList.toggle('selected', inp.checked); }
  }
  var exKletter=document.getElementById('ex-kletter');
  var exErdanker=document.getElementById('ex-erdanker');
  var exUnkr=document.getElementById('ex-unkr');
  if(exKletter) exKletter.addEventListener('change', function(){ S.klettersch=this.checked; syncCheckCard(this); updatePreisBox(); });
  if(exErdanker) exErdanker.addEventListener('change', function(){ S.erdanker=this.checked; syncCheckCard(this); updatePreisBox(); });
  if(exUnkr) exUnkr.addEventListener('change', function(){ S.unterkriechsch=this.checked; syncCheckCard(this); updatePreisBox(); });

  document.getElementById('t-minus').addEventListener('click', function(){
    S.tore=Math.max(0,S.tore-1);
    document.getElementById('i-tore').value=S.tore;
    updatePreisBox();
  });

  // Plus button — rendered next to minus in ka-qty but we need to add one dynamically
  // Actually the ka-qty structure has no plus button rendered — add it
  var qtyWrap = document.querySelector('#i-tore').parentElement;
  if(qtyWrap && !document.getElementById('t-plus')){
    var plusBtn = document.createElement('button');
    plusBtn.type='button'; plusBtn.id='t-plus'; plusBtn.className='ka-qty-btn'; plusBtn.textContent='+';
    qtyWrap.insertBefore(plusBtn, document.getElementById('i-tore').nextSibling);
  }
  document.getElementById('t-plus') && document.getElementById('t-plus').addEventListener('click', function(){
    S.tore++;
    document.getElementById('i-tore').value=S.tore;
    updatePreisBox();
  });

  document.getElementById('i-tore').addEventListener('input', function(){ S.tore=Math.max(0,parseInt(this.value)||0); updatePreisBox(); });

  document.getElementById('b3').addEventListener('click', function(){ go(2); });
  document.getElementById('n3').addEventListener('click', function(){
    if(!S.pfahltyp){ showErr('e3','Bitte Pfahltyp wählen.'); return; }
    if(!S.netztyp){ showErr('e3','Bitte Wildschutznetz wählen.'); return; }
    hideErr('e3');
    go(4);
  });
}

// ── Step 4: Zeitraum ──────────────────────────────────────────────────────────
function s4(){
  var currentYear = new Date().getFullYear();
  var jahre = [currentYear, currentYear+1, currentYear+2];
  var quartalDefs = [
    {k:'fruehling', label:'Frühling', desc:'Mär–Mai'},
    {k:'sommer',    label:'Sommer',   desc:'Jun–Aug'},
    {k:'herbst',    label:'Herbst',   desc:'Sep–Nov'},
    {k:'winter',    label:'Winter',   desc:'Dez–Feb'},
  ];

  var quartalBtns = quartalDefs.map(function(q){
    var on = S.quartal === q.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-q="'+q.k+'">'
      +esc(q.label)
      +'<span class="ka-toggle-sub">'+esc(q.desc)+'</span>'
      +'</button>';
  }).join('');

  var jahrBtns = jahre.map(function(j){
    var on = S.jahr === j;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-j="'+j+'">'+j+'</button>';
  }).join('');

  var dringOpts = [
    {k:'flexibel', label:'🗓️ Flexibel',                 desc:'Termin nach gemeinsamer Absprache'},
    {k:'datum',    label:'📅 Bis zu bestimmtem Datum',   desc:'Fertigstellung bis Wunschdatum nötig'},
    {k:'sofort',   label:'🚨 Sofort nötig',              desc:'Dringend — so bald wie möglich'},
  ].map(function(d){
    var on = S.dringlichkeit === d.k;
    return '<div class="ka-radio-card'+(on?' selected':'')+'" data-dk="'+d.k+'">'
      +'<div class="ka-radio-dot"><div class="ka-radio-dot-inner"></div></div>'
      +'<div>'
      +'<div class="ka-radio-label">'+d.label+'</div>'
      +'<div class="ka-radio-desc">'+esc(d.desc)+'</div>'
      +'</div>'
      +'</div>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>📅 Baubeginn &amp; Zeitplanung</h2>'
    +'<p>Zaunbau am besten vor der Pflanzung — wir planen rechtzeitig.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    +'<div class="ka-info-box warn">'
    +'⏰ <strong>Wichtiger Hinweis:</strong> Der Zaun muss <strong>vor der Pflanzung</strong> fertiggestellt sein. Planen Sie mindestens 4–8 Wochen Vorlaufzeit ein.'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Gewünschtes Quartal</label>'
    +'<div class="ka-toggles">'+quartalBtns+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Jahr</label>'
    +'<div class="ka-toggles">'+jahrBtns+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Dringlichkeit</label>'
    +'<div class="ka-cards-stacked">'+dringOpts+'</div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Besonderheiten / Hinweise <span class="ka-label-optional">(optional)</span></label>'
    +'<textarea class="ka-textarea" id="i-beson" rows="3" placeholder="z.B. Bachquerung im Zaunverlauf, schlechte Zufahrt, Wilddurchlass-Position...">'+esc(S.besonderheiten)+'</textarea>'
    +'</div>'

    +'<div class="ka-err" id="e4"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b4">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="n4">Weiter →</button>'
    +'</div></div>';
}

function bind4(){
  document.querySelectorAll('[data-q]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.quartal=this.dataset.q;
      document.querySelectorAll('[data-q]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('[data-j]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.jahr=parseInt(this.dataset.j);
      document.querySelectorAll('[data-j]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.querySelectorAll('[data-dk]').forEach(function(opt){
    opt.addEventListener('click', function(){
      S.dringlichkeit=this.dataset.dk;
      document.querySelectorAll('[data-dk]').forEach(function(o){ o.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });
  document.getElementById('i-beson').addEventListener('input', function(){ S.besonderheiten=this.value; });
  document.getElementById('b4').addEventListener('click', function(){
    S.besonderheiten=(document.getElementById('i-beson')||{}).value||S.besonderheiten;
    go(3);
  });
  document.getElementById('n4').addEventListener('click', function(){
    S.besonderheiten=(document.getElementById('i-beson')||{}).value||S.besonderheiten;
    go(5);
  });
}

// ── Fördercheck Render ────────────────────────────────────────────────────────
function renderFoerderZaun(bl){
  var el = document.getElementById('foerder-zaun-list');
  if(!el) return;
  var progs = FOERDER_ZAUN[bl] || FOERDER_ZAUN.DEFAULT;
  S.bundesland = bl;
  S.foerderProgramme = S.foerderProgramme.filter(function(id){
    return progs.some(function(p){ return p.id===id; });
  });
  var html = '<div class="ka-cards-stacked" style="margin-top:8px">';
  progs.forEach(function(p){
    var checked = S.foerderProgramme.indexOf(p.id) > -1;
    html += '<label class="ka-check-card'+(checked?' selected':'')+'">'
      +'<input type="checkbox" class="foerder-zaun-cb" data-progid="'+p.id+'" '+(checked?'checked':'')+'>'
      +'<div style="flex:1;min-width:0">'
      +'<div class="ka-foerder-prog-name">'+esc(p.name)+'</div>'
      +'<div class="ka-foerder-prog-desc">'+esc(p.desc)+'</div>'
      +'<div class="ka-foerder-prog-rate">💰 '+esc(p.rate)+'</div>'
      +(p.keyPoints&&p.keyPoints.length
        ? '<ul style="margin:6px 0 0;padding:0 0 0 16px;font-size:11px;color:#555;line-height:1.6">'
          +p.keyPoints.map(function(k){ return '<li>'+esc(k)+'</li>'; }).join('')
          +'</ul>'
        : '')
      +(p.url ? '<a href="'+p.url+'" target="_blank" rel="noopener" class="ka-btn ka-btn-ghost ka-btn-sm" style="display:inline-flex;margin-top:6px;font-size:11px;border:1px solid var(--kaw-border);border-radius:var(--kaw-radius-xs)">🔗 Weitere Informationen</a>' : '')
      +'</div>'
      +'</label>';
  });
  html += '</div>';
  el.innerHTML = html;
  el.querySelectorAll('.foerder-zaun-cb').forEach(function(cb){
    cb.addEventListener('change', function(){
      var id=this.dataset.progid;
      if(this.checked){
        if(S.foerderProgramme.indexOf(id)===-1) S.foerderProgramme.push(id);
      } else {
        S.foerderProgramme=S.foerderProgramme.filter(function(x){ return x!==id; });
      }
      // sync visual
      var card=this.closest ? this.closest('.ka-check-card') : this.parentElement;
      if(card) card.classList.toggle('selected', this.checked);
    });
  });
}

// ── Step 5: Kontakt + Zusammenfassung + Fördercheck ──────────────────────────
function s5(){
  var preis = calcPrice();
  var zt = S.zauntyp ? ZAUNTYP_MAP[S.zauntyp] : null;
  var gl = S.gelaende ? GELAENDE.find(function(g){ return g.k===S.gelaende; }) : null;
  var pt = S.pfahltyp ? PFAHLTYPEN.find(function(p){ return p.k===S.pfahltyp; }) : null;
  var nt = S.netztyp ? NETZTYPEN.find(function(n){ return n.k===S.netztyp; }) : null;
  var bt = S.besitzertyp ? BESITZERTYP.find(function(b){ return b.k===S.besitzertyp; }) : null;
  var quartalMap = {fruehling:'Frühling',sommer:'Sommer',herbst:'Herbst',winter:'Winter'};
  var dringMap = {flexibel:'Flexibel',datum:'Bis zu bestimmtem Datum',sofort:'Sofort nötig'};

  var extras = [];
  if(S.klettersch) extras.push('Überkletterschutz');
  if(S.erdanker) extras.push('Erdanker');
  if(S.unterkriechsch) extras.push('Unterkriechschutz');
  if(S.tore>0) extras.push(S.tore+' Tor'+(S.tore>1?'e':''));

  var grundstueckOpts = [
    {k:'privatwald',        label:'Privatwald'},
    {k:'koerperschaftswald',label:'Körperschaftswald'},
    {k:'staatswald',        label:'Staatswald'},
    {k:'kirchenwald',       label:'Kirchenwald'},
  ].map(function(g){
    var on = S.grundstueck === g.k;
    return '<button type="button" class="ka-toggle'+(on?' selected':'')+'" data-gs="'+g.k+'">'+esc(g.label)+'</button>';
  }).join('');

  return '<div class="ka-card">'
    +'<div class="ka-card-header"><h2>👤 Kontakt &amp; Zusammenfassung</h2>'
    +'<p>Letzte Angaben — wir melden uns innerhalb von 48 Stunden.</p>'
    +'</div>'
    +'<div class="ka-card-body">'

    // ── Zusammenfassung ──
    +'<div class="ka-summary">'
    +'<div class="ka-summary-title">📋 Ihre Auswahl im Überblick</div>'
    +(bt?'<div class="ka-summary-row"><span class="ka-summary-label">Waldbesitzertyp</span><span class="ka-summary-value">'+esc(bt.label)+'</span></div>':'')
    +(zt?'<div class="ka-summary-row"><span class="ka-summary-label">Zauntyp</span><span class="ka-summary-value">'+zt.ico+' '+esc(zt.name)+' ('+esc(zt.hoehe)+')</span></div>':'')
    +'<div class="ka-summary-row"><span class="ka-summary-label">Zaunlänge</span><span class="ka-summary-value">'+S.laenge+' m</span></div>'
    +(gl?'<div class="ka-summary-row"><span class="ka-summary-label">Gelände</span><span class="ka-summary-value">'+esc(gl.name)+' ('+esc(gl.info)+')</span></div>':'')
    +(S.untergrund?'<div class="ka-summary-row"><span class="ka-summary-label">Untergrund</span><span class="ka-summary-value">'+(S.untergrund==='gruenland'?'🌿 Grünland':'🌲 Waldbestand')+'</span></div>':'')
    +(S.altmaterial?'<div class="ka-summary-row"><span class="ka-summary-label">Altmaterial</span><span class="ka-summary-value">'+(S.altmaterial==='ja'?'✅ Vorhanden':'❌ Keines')+'</span></div>':'')
    +(pt?'<div class="ka-summary-row"><span class="ka-summary-label">Pfahltyp</span><span class="ka-summary-value">'+esc(pt.name)+'</span></div>':'')
    +(nt?'<div class="ka-summary-row"><span class="ka-summary-label">Netz</span><span class="ka-summary-value">'+esc(nt.name)+'</span></div>':'')
    +(extras.length?'<div class="ka-summary-row"><span class="ka-summary-label">Extras</span><span class="ka-summary-value">'+esc(extras.join(', '))+'</span></div>':'')
    +(S.quartal?'<div class="ka-summary-row"><span class="ka-summary-label">Baubeginn</span><span class="ka-summary-value">'+esc((quartalMap[S.quartal]||S.quartal)+' '+S.jahr)+'</span></div>':'')
    +(S.dringlichkeit?'<div class="ka-summary-row"><span class="ka-summary-label">Dringlichkeit</span><span class="ka-summary-value">'+esc(dringMap[S.dringlichkeit]||S.dringlichkeit)+'</span></div>':'')
    +(S.besonderheiten?'<div class="ka-summary-row"><span class="ka-summary-label">Hinweise</span><span class="ka-summary-value">'+esc(S.besonderheiten)+'</span></div>':'')
    +(preis
      ? '<div class="ka-summary-row" style="border-top:2px solid var(--kaw-border);padding-top:10px;margin-top:4px">'
        +'<span class="ka-summary-label" style="font-weight:700">Preisindikation</span>'
        +'<span class="ka-summary-value" style="font-size:16px;font-weight:800;color:var(--kaw-forest)">'+fmt(preis.gesMin)+' – '+fmt(preis.gesMax)+' € netto</span>'
        +'</div>'
      : '')
    +'</div>'
    +'<p class="ka-hint">Unverbindliche Richtpreise. Endangebot nach Besichtigung/Rücksprache.</p>'

    // ── Kontaktdaten ──
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
    +'<label class="ka-label">PLZ / Ort *</label>'
    +'<input class="ka-inp" type="text" id="i-plzort" value="'+esc(S.plzOrt)+'" placeholder="z.B. 83229 Aschau i. Chiemgau" autocomplete="postal-code">'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">GPS-Koordinaten der Fläche <span class="ka-label-optional">(optional)</span></label>'
    +'<div class="ka-gps-row">'
    +'<input class="ka-inp" type="text" id="gps-zb" value="'+esc(S.gps)+'" placeholder="z.B. 51.1234, 8.5678">'
    +'<button type="button" class="ka-gps-btn" id="gps-btn-zb">📍 Standort</button>'
    +'</div>'
    +'<div class="ka-gps-info" id="gps-info-zb"></div>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Treffpunkt mit Förster <span class="ka-label-optional">(optional)</span></label>'
    +'<input class="ka-inp" type="text" id="i-treffpunkt" value="'+esc(S.treffpunkt)+'" placeholder="z.B. Parkplatz Waldweg / GPS-Koordinaten / Forststraße km 3">'
    +'<p class="ka-hint">Wo soll der Förster Sie treffen?</p>'
    +'</div>'

    +'<div class="ka-field">'
    +'<label class="ka-label">Grundstücksart</label>'
    +'<div class="ka-toggles">'+grundstueckOpts+'</div>'
    +'</div>'

    // ── Fördercheck ──
    +'<div class="ka-foerder-box">'
    +'<div class="ka-foerder-title">🏦 Fördercheck für Zaunbau</div>'
    +'<p class="ka-hint">Zaunbau als Kulturschutzmaßnahme wird in vielen Bundesländern mit <strong>50–90%</strong> gefördert. Bundesland wählen:</p>'
    +'<select class="ka-select" id="i-bl" style="margin-bottom:12px">'
    +'<option value="">— Bundesland wählen —</option>'
    +'<option value="BY"'+(S.bundesland==='BY'?' selected':'')+'>Bayern</option>'
    +'<option value="HE"'+(S.bundesland==='HE'?' selected':'')+'>Hessen</option>'
    +'<option value="NRW"'+(S.bundesland==='NRW'?' selected':'')+'>Nordrhein-Westfalen</option>'
    +'<option value="RP"'+(S.bundesland==='RP'?' selected':'')+'>Rheinland-Pfalz</option>'
    +'<option value="TH"'+(S.bundesland==='TH'?' selected':'')+'>Thüringen</option>'
    +'<option value="BW"'+(S.bundesland==='BW'?' selected':'')+'>Baden-Württemberg</option>'
    +'<option value="NI"'+(S.bundesland==='NI'?' selected':'')+'>Niedersachsen</option>'
    +'<option value="SN"'+(S.bundesland==='SN'?' selected':'')+'>Sachsen</option>'
    +'<option value="DEFAULT">Anderes Bundesland</option>'
    +'</select>'
    +'<div id="foerder-zaun-list">'
    +(S.bundesland
      ? '<p class="ka-hint" style="font-style:italic">Wird geladen…</p>'
      : '<p class="ka-hint" style="font-style:italic">Bundesland wählen für Förderprogramme</p>')
    +'</div>'
    +'<label class="ka-check-card'+(S.foerderBeratung?' selected':'')+'" style="margin-top:14px;border-top:1px solid var(--kaw-border);padding-top:14px;border-radius:0 0 var(--kaw-radius-sm) var(--kaw-radius-sm)">'
    +'<input type="checkbox" id="i-foerder" '+(S.foerderBeratung?'checked':'')+'>'
    +'<div>'
    +'<div style="font-size:13px;font-weight:600">Förderberatung anfragen</div>'
    +'<div class="ka-hint" style="margin-top:0">Wir prüfen kostenlos alle Fördermöglichkeiten und unterstützen bei der Antragstellung.</div>'
    +'</div>'
    +'</label>'
    +'</div>'

    +'<label style="display:flex;align-items:flex-start;gap:10px;margin-top:14px;cursor:pointer;padding:14px;background:#f8f8f6;border-radius:10px;border:1px solid #d0cfc7;line-height:1.4">'
    +'<input type="checkbox" id="i-dsgvo" required style="width:20px;height:20px;margin-top:2px;accent-color:#012d1d;flex-shrink:0">'
    +'<span class="ka-dsgvo">Ich habe die <a href="/datenschutz/" target="_blank">Datenschutzerklärung</a> gelesen und stimme der Verarbeitung meiner Daten zur Bearbeitung dieser Anfrage zu. *</span>'
    +'</label>'
    +'<div class="ka-err" id="e5"></div>'
    +'</div>'
    +'<div class="ka-card-footer">'
    +'<button class="ka-btn ka-btn-secondary" id="b5">← Zurück</button>'
    +'<button class="ka-btn ka-btn-primary" id="sub">📤 Anfrage absenden</button>'
    +'</div></div>';
}

function bind5(){
  // Collect contact fields live
  ['i-nm','i-tel','i-em','i-plzort'].forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.addEventListener('input', function(){
      if(id==='i-nm') S.name=this.value;
      else if(id==='i-tel') S.tel=this.value;
      else if(id==='i-em') S.email=this.value;
      else if(id==='i-plzort') S.plzOrt=this.value;
    });
  });

  // PLZ autocomplete (shared script)
  var plzOrtInp = document.getElementById('i-plzort');
  if(plzOrtInp && window.bindPlzAutocomplete){
    window.bindPlzAutocomplete(plzOrtInp, null, function(val){ S.plzOrt=val; });
  }

  // GPS
  var gpsInp = document.getElementById('gps-zb');
  if(gpsInp) gpsInp.addEventListener('input', function(){ S.gps=this.value; });
  var gpsBtn = document.getElementById('gps-btn-zb');
  if(gpsBtn) gpsBtn.addEventListener('click', function(){
    var info=document.getElementById('gps-info-zb');
    if(!navigator.geolocation){
      if(info) info.innerHTML='<span role="status" aria-live="polite">📍 GPS nicht verfügbar. Koordinaten manuell eingeben oder auf Google Maps markieren.<br><a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a> und Koordinaten manuell eintragen.</span>';
      return;
    }
    if(info) info.textContent='Standort wird ermittelt…';
    navigator.geolocation.getCurrentPosition(function(pos){
      var coords=pos.coords.latitude.toFixed(6)+', '+pos.coords.longitude.toFixed(6);
      S.gps=coords;
      if(gpsInp) gpsInp.value=coords;
      if(info) info.textContent='Koordinaten: '+coords;
    }, function(){
      if(info) info.innerHTML='Bitte <a href="https://maps.google.com" target="_blank" style="color:#012d1d;font-weight:600">Google Maps öffnen</a>, zur Fläche navigieren und Koordinaten kopieren.';
    }, {enableHighAccuracy:true,timeout:10000,maximumAge:0});
  });

  // Leaflet map (shared script)
  if(false && window.kaInitMap){
    window.kaInitMap('map-gps-zb', {
      gpsInputId: 'gps-zb',
      onSelect: function(lat, lng){
        S.gps=lat.toFixed(6)+', '+lng.toFixed(6);
        var inp=document.getElementById('gps-zb');
        if(inp) inp.value=S.gps;
        var info=document.getElementById('gps-info-zb');
        if(info) info.textContent='Koordinaten: '+S.gps;
      }
    });
  }

  // Treffpunkt
  var trfInp=document.getElementById('i-treffpunkt');
  if(trfInp) trfInp.addEventListener('input', function(){ S.treffpunkt=this.value; });

  // Grundstücksart
  document.querySelectorAll('[data-gs]').forEach(function(btn){
    btn.addEventListener('click', function(){
      S.grundstueck=this.dataset.gs;
      document.querySelectorAll('[data-gs]').forEach(function(b){ b.classList.remove('selected'); });
      this.classList.add('selected');
    });
  });

  // Fördercheck Bundesland
  var blSel=document.getElementById('i-bl');
  if(blSel){
    if(S.bundesland) renderFoerderZaun(S.bundesland);
    blSel.addEventListener('change', function(){
      S.bundesland=this.value;
      if(this.value) renderFoerderZaun(this.value);
      else{ var el=document.getElementById('foerder-zaun-list'); if(el) el.innerHTML='<p class="ka-hint" style="font-style:italic">Bundesland wählen für Förderprogramme</p>'; }
    });
  }

  var foerderCb=document.getElementById('i-foerder');
  if(foerderCb) foerderCb.addEventListener('change', function(){
    S.foerderBeratung=this.checked;
    var card=this.closest ? this.closest('.ka-check-card') : this.parentElement;
    if(card) card.classList.toggle('selected', this.checked);
  });

  document.getElementById('b5').addEventListener('click', function(){ go(4); });
  document.getElementById('sub').addEventListener('click', function(){
    // Collect all fields
    S.name    = (document.getElementById('i-nm')||{}).value||S.name;
    S.tel     = (document.getElementById('i-tel')||{}).value||S.tel;
    S.email   = (document.getElementById('i-em')||{}).value||S.email;
    S.plzOrt  = (document.getElementById('i-plzort')||{}).value||S.plzOrt;
    S.gps     = (document.getElementById('gps-zb')||{}).value||S.gps;
    S.treffpunkt=(document.getElementById('i-treffpunkt')||{}).value||S.treffpunkt;
    var foerderEl=document.getElementById('i-foerder');
    if(foerderEl) S.foerderBeratung=foerderEl.checked;

    if(!S.name.trim()){ showErr('e5','Bitte Namen eingeben.'); return; }
    if(!S.tel.trim() && !S.email.trim()){ showErr('e5','Bitte Telefon oder E-Mail angeben.'); return; }
    if(S.email && !S.email.includes('@')){ showErr('e5','Bitte gültige E-Mail eingeben.'); return; }
    if(!S.plzOrt.trim()){ showErr('e5','Bitte PLZ / Ort eingeben.'); return; }
    sendAnfrage(this);
  });
}

// ── Submit ────────────────────────────────────────────────────────────────────
function sendAnfrage(btn){
    var dsgvoEl=document.getElementById('i-dsgvo'); if(dsgvoEl&&!dsgvoEl.checked){ showErr('e5','Bitte Datenschutzerklärung bestätigen.'); return; }

  btn.disabled=true;
  btn.textContent='⏳ Wird gesendet…';

  var zt  = S.zauntyp  ? ZAUNTYP_MAP[S.zauntyp]  : {};
  var gl  = S.gelaende ? GELAENDE.find(function(g){ return g.k===S.gelaende; })   : {};
  var pt  = S.pfahltyp ? PFAHLTYPEN.find(function(p){ return p.k===S.pfahltyp; }) : {};
  var nt  = S.netztyp  ? NETZTYPEN.find(function(n){ return n.k===S.netztyp; })   : {};
  var bt  = S.besitzertyp ? BESITZERTYP.find(function(b){ return b.k===S.besitzertyp; }) : {};
  var preis = calcPrice();
  var quartalMap={fruehling:'Frühling',sommer:'Sommer',herbst:'Herbst',winter:'Winter'};
  var dringMap={flexibel:'Flexibel',datum:'Bis zu bestimmtem Datum',sofort:'Sofort nötig'};
  var extras=[];
  if(S.klettersch) extras.push('Überkletterschutz');
  if(S.erdanker) extras.push('Erdanker');
  if(S.unterkriechsch) extras.push('Unterkriechschutz');
  if(S.tore>0) extras.push(S.tore+' Tor'+(S.tore>1?'e':''));

  var abschnitteData = S.abschnitte.map(function(ab,i){
    return { nr:i+1, laenge:ab.laenge, forstamt:ab.forstamt, revier:ab.revier };
  });

  var payload = {
    leistung: 'Zaunbau',
    waldbesitzertyp: (bt&&bt.label)||S.besitzertyp||'',
    zauntyp: ((zt&&zt.name)||'')+(zt&&zt.hoehe?' ('+zt.hoehe+')':''),
    zaunlaenge: S.laenge+' m',
    abschnitte: abschnitteData,
    gelaende: ((gl&&gl.name)||'')+(gl&&gl.info?' — '+gl.info:''),
    untergrund: S.untergrund==='gruenland'?'Grünland':S.untergrund==='waldbestand'?'Waldbestand':'',
    altmaterial: S.altmaterial==='ja'?'Vorhanden':S.altmaterial==='nein'?'Keines':'',
    pfahltyp: (pt&&pt.name)||'',
    netztyp: (nt&&nt.name)||'',
    extras: extras.join(', ')||'keine',
    tore: S.tore,
    baubeginn: ((quartalMap[S.quartal]||S.quartal)||'')+' '+S.jahr,
    dringlichkeit: dringMap[S.dringlichkeit]||'',
    besonderheiten: S.besonderheiten||'',
    preisindikation: preis ? fmt(preis.gesMin)+' – '+fmt(preis.gesMax)+' € netto' : '',
    grundstueck: {privatwald:'Privatwald',koerperschaftswald:'Körperschaftswald',staatswald:'Staatswald',kirchenwald:'Kirchenwald'}[S.grundstueck]||'',
    bundesland: S.bundesland||'',
    foerderProgramme: S.foerderProgramme.join(', '),
    foerderBeratung: S.foerderBeratung?'Ja':'Nein',
    name: S.name,
    tel: S.tel,
    email: S.email,
    plzOrt: S.plzOrt,
    gps: S.gps||'',
    treffpunkt: S.treffpunkt||'',
  };

  var fd=new FormData();
  fd.append('data', JSON.stringify(payload));

  fetch('/wp-json/koch/v1/anfrage', {method:'POST', credentials:'same-origin', body:fd})
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(){ showOK(); })
    .catch(function(err){
      console.error(err);
      btn.disabled=false;
      btn.textContent='📤 Anfrage absenden';
      var errEl=document.getElementById('e5');
      if(errEl){
        errEl.setAttribute('role','alert');errEl.setAttribute('aria-live','assertive');errEl.innerHTML='⚠️ Fehler beim Senden. Ihre Eingaben sind gesichert.<br><button class="ka-retry-btn" onclick="this.parentNode.style.display=\'none\';document.querySelector(\'.ka-btn-primary\').click()">🔄 Erneut versuchen</button><br><small>Oder per E-Mail: <a href="mailto:info@koch-aufforstung.de">info@koch-aufforstung.de</a></small>';
        errEl.style.display='block';
      }
    });
}

// ── Projektkorb ───────────────────────────────────────────────────────────────
function addToProjektkorb(){
  try {
    var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
    if(!korb.items) korb.items=[];
    korb.items=korb.items.filter(function(i){ return i.type!=='zaunbau'; });
    var zt=S.zauntyp?ZAUNTYP_MAP[S.zauntyp]:null;
    var summary=(zt?zt.name:'Zaunbau')+' · '+S.laenge+' m';
    var fullState=JSON.parse(JSON.stringify(S));
    korb.items.push({type:'zaunbau',label:'🏗️ Zaunbau',summary:summary,data:fullState,addedAt:Date.now()});
    localStorage.setItem('ka_projektkorb',JSON.stringify(korb));
    return korb.items.length;
  } catch(e){ console.error(e); return 1; }
}

// ── Erfolgs-Screen ────────────────────────────────────────────────────────────
function showOK(){ clearDraft();
  var korbCount = addToProjektkorb();

  document.getElementById('pf-main').innerHTML='<div class="ka-card"><div class="ka-success">'
    +'<div class="ka-success-icon">✅</div>'
    +'<h2>Anfrage eingegangen!</h2>'
    +'<p>Vielen Dank, <strong>'+esc(S.name)+'</strong>!<br>Wir melden uns innerhalb von 48 Stunden mit einem Angebot'+(S.email?' an <strong>'+esc(S.email)+'</strong>':'')+'.</p>'
    +'<div class="ka-success-card">'
    +'<strong>🏗️ Zaunbau</strong><br>'
    +'<span style="color:#666">'+esc(S.laenge+' m'+(S.zauntyp&&ZAUNTYP_MAP[S.zauntyp]?' · '+ZAUNTYP_MAP[S.zauntyp].name:''))+' &mdash; '+esc(S.name)+'</span>'
    +'</div>'
    +'<div class="ka-success-hint">'
    +'<p style="margin:0 0 8px;font-weight:600">💡 Mehrere Leistungen kombinieren?</p>'
    +'<p style="margin:0;color:#666;font-size:0.9rem">Die meisten Projekte benötigen Flächenvorbereitung, Pflanzung UND Kulturschutz durch Zäune.</p>'
    +'</div>'
    +'<div style="display:flex;flex-direction:column;gap:12px;margin-top:20px">'
    +'<a href="/#leistungen" style="display:block;padding:14px 24px;background:#012d1d;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center">➕ Weitere Leistung hinzufügen</a>'
    +'<a href="/projektkorb/" style="display:block;padding:14px 24px;background:#A3E635;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;text-align:center">🛒 Zum Projektkorb ('+korbCount+')</a>'
    +'</div>'
    +'<p style="margin-top:20px;font-size:0.85rem;color:#999"><a href="/" style="color:#012d1d">← Zur Startseite</a></p>'
    +'</div></div>';
}

// ── Expose for edit-mode support ──────────────────────────────────────────────
window._zbS = S;
window._zbRender = render;

// ── Bootstrap: Inject #pf if not present ─────────────────────────────────────
function bootstrap(){
  if(!document.getElementById('pf')){
    var container = document.querySelector('.flow-page')
      || document.querySelector('main')
      || document.querySelector('#primary')
      || document.body;

    var pf=document.createElement('div');
    pf.id='pf';

    var flowPage=document.querySelector('.flow-page');
    if(flowPage && flowPage.parentNode){
      flowPage.parentNode.replaceChild(pf, flowPage);
    } else {
      if(container) container.insertBefore(pf, container.firstChild);
    }
  }
  render();
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', function(){ try{ bootstrap(); }catch(e){ console.error('ZaunWizardV3:',e); } });
} else {
  try{ bootstrap(); }catch(e){ console.error('ZaunWizardV3:',e); }
}

})();

// ── Edit-Mode (URL-Parameter ?edit) ───────────────────────────────────────────
(function(){
  var params=new URLSearchParams(window.location.search);
  if(!params.has('edit')) return;
  function tryLoadEdit(){
    if(typeof window._zbS==='undefined'||typeof window._zbRender!=='function'){
      setTimeout(tryLoadEdit,100); return;
    }
    try {
      var korb=JSON.parse(localStorage.getItem('ka_projektkorb')||'{}');
      if(!korb.items) return;
      var item=korb.items.find(function(i){ return i.type==='zaunbau'; });
      if(!item||!item.data) return;
      Object.keys(item.data).forEach(function(k){ window._zbS[k]=item.data[k]; });
      window._zbRender();
      var main=document.getElementById('pf-main');
      if(main&&main.parentNode){
        var b=document.createElement('div');
        b.style.cssText='background:#F8F9F5;border:2px solid #A3E635;border-radius:10px;padding:14px;margin-bottom:16px';
        b.innerHTML='<strong style="color:#012d1d">✏️ Bearbeitungsmodus — Ihre gespeicherten Daten wurden geladen.</strong>';
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

