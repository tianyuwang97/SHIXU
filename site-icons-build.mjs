import fs from 'node:fs';
import path from 'node:path';

// Shared across entry pages, including /login, so iOS never falls back to its title initial.
export function buildSiteIcons(directory='dist/client') {
  const files=['apple-touch-icon.png','shixu-gold-v1-180.png','shixu-gold-v1-32.png'];
  for (const file of files) fs.copyFileSync(path.join('icons',file),path.join(directory,file));
  const metadata='<meta name="application-name" content="时序">'
    +'<meta name="apple-mobile-web-app-title" content="时序">'
    +'<link rel="apple-touch-icon" sizes="180x180" href="/shixu-gold-v1-180.png">'
    +'<link rel="icon" type="image/png" sizes="32x32" href="/shixu-gold-v1-32.png">';
  for (const file of fs.readdirSync(directory).filter(file=>file.endsWith('.html'))) {
    const target=path.join(directory,file);
    let html=fs.readFileSync(target,'utf8');
    html=html.replace(/<link\b[^>]*\brel=(["'])(?:(?:shortcut\s+)?icon|apple-touch-icon)\1[^>]*>/gi,'')
      .replace(/<meta\b[^>]*\bname=(["'])(?:application-name|apple-mobile-web-app-title)\1[^>]*>/gi,'');
    if (html.includes('</head>')) html=html.replace('</head>',metadata+'</head>');
    else if (html.includes('<style>')) html=html.replace('<style>',metadata+'<style>');
    else throw new Error('Cannot locate document head for icon metadata: '+file);
    fs.writeFileSync(target,html);
  }
}
