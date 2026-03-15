'use client';
// ══════════════════════════════════════════════════════════════
// JARVIS VOICE COMMANDS + APP LAUNCHER
// Chat mein kuch bhi likho → app khulega / action hoga
// Pattern: broad match — "youtube", "youtube kholo", "yt chala"
// ══════════════════════════════════════════════════════════════

export interface VoiceCommand {
  type: 'deeplink' | 'appcontrol' | 'none';
  action?: string;
  payload?: any;
  spoken?: string;
}

// ── App definitions — name variants + package + intent URL ───
const APPS: Array<{
  patterns: RegExp;
  name: string;
  emoji: string;
  pkg: string;
  url?: string;       // optional override URL
  msgUrl?: string;    // for messaging apps: send message URL template
}> = [
  // ── Social / Chat ──────────────────────────────────────────
  {
    patterns: /whatsapp|watsapp|wa\b/i,
    name: 'WhatsApp', emoji: '💬', pkg: 'com.whatsapp',
    url: 'intent://send#Intent;scheme=whatsapp;package=com.whatsapp;end',
    msgUrl: 'whatsapp://send?text={msg}',
  },
  {
    patterns: /instagram|insta\b|ig\b/i,
    name: 'Instagram', emoji: '📸', pkg: 'com.instagram.android',
    url: 'intent://instagram.com/#Intent;scheme=https;package=com.instagram.android;end',
  },
  {
    patterns: /telegram|tele\b/i,
    name: 'Telegram', emoji: '✈️', pkg: 'org.telegram.messenger',
    url: 'intent://telegram.me/#Intent;scheme=https;package=org.telegram.messenger;end',
  },
  {
    patterns: /facebook|fb\b/i,
    name: 'Facebook', emoji: '👤', pkg: 'com.facebook.katana',
    url: 'intent://facebook.com/#Intent;scheme=https;package=com.facebook.katana;end',
  },
  {
    patterns: /twitter|x\.com|\btweet/i,
    name: 'X (Twitter)', emoji: '🐦', pkg: 'com.twitter.android',
    url: 'intent://twitter.com/#Intent;scheme=https;package=com.twitter.android;end',
  },
  {
    patterns: /snapchat|snap\b/i,
    name: 'Snapchat', emoji: '👻', pkg: 'com.snapchat.android',
    url: 'intent://snapchat.com/#Intent;scheme=https;package=com.snapchat.android;end',
  },
  {
    patterns: /linkedin/i,
    name: 'LinkedIn', emoji: '💼', pkg: 'com.linkedin.android',
    url: 'intent://linkedin.com/#Intent;scheme=https;package=com.linkedin.android;end',
  },
  {
    patterns: /discord/i,
    name: 'Discord', emoji: '🎮', pkg: 'com.discord',
    url: 'intent://discord.com/#Intent;scheme=https;package=com.discord;end',
  },
  {
    patterns: /sharechat/i,
    name: 'ShareChat', emoji: '🇮🇳', pkg: 'in.sharechat.sharechat',
    url: 'intent://sharechat.com/#Intent;scheme=https;package=in.sharechat.sharechat;end',
  },
  {
    patterns: /moj\b/i,
    name: 'Moj', emoji: '🎵', pkg: 'in.moj.app',
    url: 'intent://moj.in/#Intent;scheme=https;package=in.moj.app;end',
  },
  {
    patterns: /josh\b/i,
    name: 'Josh', emoji: '🎬', pkg: 'com.josh.video',
    url: 'intent://josh.video/#Intent;scheme=https;package=com.josh.video;end',
  },

  // ── Video ──────────────────────────────────────────────────
  {
    patterns: /youtube|yt\b/i,
    name: 'YouTube', emoji: '▶️', pkg: 'com.google.android.youtube',
    url: 'intent://www.youtube.com/#Intent;scheme=https;package=com.google.android.youtube;end',
  },
  {
    patterns: /netflix/i,
    name: 'Netflix', emoji: '🎬', pkg: 'com.netflix.mediaclient',
    url: 'intent://netflix.com/#Intent;scheme=https;package=com.netflix.mediaclient;end',
  },
  {
    patterns: /prime.*video|amazon.*video|primevideo/i,
    name: 'Prime Video', emoji: '📺', pkg: 'com.amazon.avod.thirdpartyclient',
    url: 'intent://primevideo.com/#Intent;scheme=https;package=com.amazon.avod.thirdpartyclient;end',
  },
  {
    patterns: /hotstar|disney/i,
    name: 'Hotstar', emoji: '⭐', pkg: 'in.startv.hotstar',
    url: 'intent://hotstar.com/#Intent;scheme=https;package=in.startv.hotstar;end',
  },
  {
    patterns: /jio.*cinema|jiocinema/i,
    name: 'JioCinema', emoji: '🎥', pkg: 'com.jio.media.ondemand',
    url: 'intent://jiocinema.com/#Intent;scheme=https;package=com.jio.media.ondemand;end',
  },
  {
    patterns: /zee5/i,
    name: 'ZEE5', emoji: '📽️', pkg: 'com.graymatrix.did',
    url: 'intent://zee5.com/#Intent;scheme=https;package=com.graymatrix.did;end',
  },
  {
    patterns: /mx.*player|mxplayer/i,
    name: 'MX Player', emoji: '🎞️', pkg: 'com.mxtech.videoplayer.ad',
    url: 'intent://mxplayer.in/#Intent;scheme=https;package=com.mxtech.videoplayer.ad;end',
  },
  {
    patterns: /vlc/i,
    name: 'VLC', emoji: '🔶', pkg: 'org.videolan.vlc',
    url: 'intent://videolan.org/#Intent;scheme=https;package=org.videolan.vlc;end',
  },

  // ── Music ──────────────────────────────────────────────────
  {
    patterns: /spotify/i,
    name: 'Spotify', emoji: '🎵', pkg: 'com.spotify.music',
    url: 'intent://spotify.com/#Intent;scheme=https;package=com.spotify.music;end',
  },
  {
    patterns: /gaana/i,
    name: 'Gaana', emoji: '🎶', pkg: 'com.gaana',
    url: 'intent://gaana.com/#Intent;scheme=https;package=com.gaana;end',
  },
  {
    patterns: /jiosaavn|saavn/i,
    name: 'JioSaavn', emoji: '🎵', pkg: 'com.jio.media.jiobeats',
    url: 'intent://jiosaavn.com/#Intent;scheme=https;package=com.jio.media.jiobeats;end',
  },
  {
    patterns: /wynk/i,
    name: 'Wynk Music', emoji: '🎵', pkg: 'com.bsbportal.music',
    url: 'intent://wynk.in/#Intent;scheme=https;package=com.bsbportal.music;end',
  },
  {
    patterns: /\byoutube.*music|yt.*music|music.*youtube/i,
    name: 'YouTube Music', emoji: '🎵', pkg: 'com.google.android.apps.youtube.music',
    url: 'intent://music.youtube.com/#Intent;scheme=https;package=com.google.android.apps.youtube.music;end',
  },

  // ── Food / Delivery ────────────────────────────────────────
  {
    patterns: /zomato/i,
    name: 'Zomato', emoji: '🍕', pkg: 'com.application.zomato',
    url: 'intent://zomato.com/#Intent;scheme=https;package=com.application.zomato;end',
  },
  {
    patterns: /swiggy/i,
    name: 'Swiggy', emoji: '🛵', pkg: 'in.swiggy.android',
    url: 'intent://swiggy.com/#Intent;scheme=https;package=in.swiggy.android;end',
  },
  {
    patterns: /blinkit|grofers/i,
    name: 'Blinkit', emoji: '⚡', pkg: 'com.grofers.customerapp',
    url: 'intent://blinkit.com/#Intent;scheme=https;package=com.grofers.customerapp;end',
  },
  {
    patterns: /zepto/i,
    name: 'Zepto', emoji: '⚡', pkg: 'com.zepto.app',
    url: 'intent://zeptonow.com/#Intent;scheme=https;package=com.zepto.app;end',
  },
  {
    patterns: /bigbasket/i,
    name: 'BigBasket', emoji: '🛒', pkg: 'com.bigbasket.mobileapp',
    url: 'intent://bigbasket.com/#Intent;scheme=https;package=com.bigbasket.mobileapp;end',
  },
  {
    patterns: /amazon.*fresh|fresh.*amazon/i,
    name: 'Amazon Fresh', emoji: '🌿', pkg: 'com.amazon.mShop.android.shopping',
    url: 'intent://amazon.in/#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end',
  },

  // ── Shopping ───────────────────────────────────────────────
  {
    patterns: /amazon\b/i,
    name: 'Amazon', emoji: '📦', pkg: 'com.amazon.mShop.android.shopping',
    url: 'intent://amazon.in/#Intent;scheme=https;package=com.amazon.mShop.android.shopping;end',
  },
  {
    patterns: /flipkart/i,
    name: 'Flipkart', emoji: '🛍️', pkg: 'com.flipkart.android',
    url: 'intent://flipkart.com/#Intent;scheme=https;package=com.flipkart.android;end',
  },
  {
    patterns: /myntra/i,
    name: 'Myntra', emoji: '👗', pkg: 'com.myntra.android',
    url: 'intent://myntra.com/#Intent;scheme=https;package=com.myntra.android;end',
  },
  {
    patterns: /meesho/i,
    name: 'Meesho', emoji: '🧵', pkg: 'com.meesho.supply',
    url: 'intent://meesho.com/#Intent;scheme=https;package=com.meesho.supply;end',
  },
  {
    patterns: /ajio/i,
    name: 'AJIO', emoji: '👠', pkg: 'com.ril.ajio',
    url: 'intent://ajio.com/#Intent;scheme=https;package=com.ril.ajio;end',
  },

  // ── Payments ───────────────────────────────────────────────
  {
    patterns: /gpay|google.*pay|google pay/i,
    name: 'Google Pay', emoji: '💳', pkg: 'com.google.android.apps.nbu.paisa.user',
    url: 'intent://pay.google.com/#Intent;scheme=https;package=com.google.android.apps.nbu.paisa.user;end',
  },
  {
    patterns: /phonepe|phone pe/i,
    name: 'PhonePe', emoji: '💜', pkg: 'com.phonepe.app',
    url: 'intent://phonepe.com/#Intent;scheme=https;package=com.phonepe.app;end',
  },
  {
    patterns: /paytm/i,
    name: 'Paytm', emoji: '💙', pkg: 'net.one97.paytm',
    url: 'intent://paytm.com/#Intent;scheme=https;package=net.one97.paytm;end',
  },
  {
    patterns: /bhim/i,
    name: 'BHIM', emoji: '🏛️', pkg: 'in.org.npci.upiapp',
    url: 'intent://bhimupi.org.in/#Intent;scheme=https;package=in.org.npci.upiapp;end',
  },
  {
    patterns: /cred\b/i,
    name: 'CRED', emoji: '💎', pkg: 'com.dreamplug.androidapp',
    url: 'intent://cred.club/#Intent;scheme=https;package=com.dreamplug.androidapp;end',
  },

  // ── Travel / Maps ──────────────────────────────────────────
  {
    patterns: /google.*maps?|\bmaps?\b/i,
    name: 'Google Maps', emoji: '🗺️', pkg: 'com.google.android.apps.maps',
    url: 'intent://maps.google.com/#Intent;scheme=https;package=com.google.android.apps.maps;end',
  },
  {
    patterns: /ola\b/i,
    name: 'Ola', emoji: '🚗', pkg: 'com.olacabs.customer',
    url: 'intent://olacabs.com/#Intent;scheme=https;package=com.olacabs.customer;end',
  },
  {
    patterns: /uber\b/i,
    name: 'Uber', emoji: '🚙', pkg: 'com.ubercab',
    url: 'intent://uber.com/#Intent;scheme=https;package=com.ubercab;end',
  },
  {
    patterns: /rapido/i,
    name: 'Rapido', emoji: '🏍️', pkg: 'com.rapido.passenger',
    url: 'intent://rapido.bike/#Intent;scheme=https;package=com.rapido.passenger;end',
  },
  {
    patterns: /redbus/i,
    name: 'RedBus', emoji: '🚌', pkg: 'in.redbus.android',
    url: 'intent://redbus.in/#Intent;scheme=https;package=in.redbus.android;end',
  },
  {
    patterns: /irctc|train.*booking/i,
    name: 'IRCTC', emoji: '🚆', pkg: 'cris.org.in.prs.ima',
    url: 'intent://irctc.co.in/#Intent;scheme=https;package=cris.org.in.prs.ima;end',
  },
  {
    patterns: /makemytrip|mmt\b/i,
    name: 'MakeMyTrip', emoji: '✈️', pkg: 'com.makemytrip',
    url: 'intent://makemytrip.com/#Intent;scheme=https;package=com.makemytrip;end',
  },

  // ── Health / Fitness ───────────────────────────────────────
  {
    patterns: /healthify|healthifyme/i,
    name: 'Healthify', emoji: '💪', pkg: 'com.healthifyme.basic',
    url: 'intent://healthifyme.com/#Intent;scheme=https;package=com.healthifyme.basic;end',
  },
  {
    patterns: /cult.*fit|curefit/i,
    name: 'Cult.fit', emoji: '🏋️', pkg: 'com.curefit.client',
    url: 'intent://cult.fit/#Intent;scheme=https;package=com.curefit.client;end',
  },
  {
    patterns: /practo/i,
    name: 'Practo', emoji: '👨‍⚕️', pkg: 'com.practo.client',
    url: 'intent://practo.com/#Intent;scheme=https;package=com.practo.client;end',
  },
  {
    patterns: /netmeds/i,
    name: 'Netmeds', emoji: '💊', pkg: 'com.netmeds.android',
    url: 'intent://netmeds.com/#Intent;scheme=https;package=com.netmeds.android;end',
  },
  {
    patterns: /1mg|one.*mg/i,
    name: '1mg', emoji: '💊', pkg: 'com.aranoah.healthkart.plus',
    url: 'intent://1mg.com/#Intent;scheme=https;package=com.aranoah.healthkart.plus;end',
  },

  // ── Finance / Banking ──────────────────────────────────────
  {
    patterns: /zerodha|kite\b/i,
    name: 'Zerodha Kite', emoji: '📈', pkg: 'com.zerodha.kite3',
    url: 'intent://kite.zerodha.com/#Intent;scheme=https;package=com.zerodha.kite3;end',
  },
  {
    patterns: /groww/i,
    name: 'Groww', emoji: '📊', pkg: 'com.nextbillion.groww',
    url: 'intent://groww.in/#Intent;scheme=https;package=com.nextbillion.groww;end',
  },
  {
    patterns: /upstox/i,
    name: 'Upstox', emoji: '💹', pkg: 'in.upstox.user',
    url: 'intent://upstox.com/#Intent;scheme=https;package=in.upstox.user;end',
  },
  {
    patterns: /sbi.*yono|yono/i,
    name: 'YONO SBI', emoji: '🏦', pkg: 'com.sbi.lotusintouch',
    url: 'intent://yonolite.onlinesbi.sbi/#Intent;scheme=https;package=com.sbi.lotusintouch;end',
  },
  {
    patterns: /my.*airtel|airtel\b/i,
    name: 'Airtel', emoji: '📡', pkg: 'com.airtel.android.myairtel',
    url: 'intent://airtel.in/#Intent;scheme=https;package=com.airtel.android.myairtel;end',
  },
  {
    patterns: /myjio|jio\b/i,
    name: 'MyJio', emoji: '📱', pkg: 'com.jio.myjio',
    url: 'intent://myjio.com/#Intent;scheme=https;package=com.jio.myjio;end',
  },

  // ── Productivity ───────────────────────────────────────────
  {
    patterns: /gmail/i,
    name: 'Gmail', emoji: '📧', pkg: 'com.google.android.gm',
    url: 'intent://gmail.com/#Intent;scheme=https;package=com.google.android.gm;end',
  },
  {
    patterns: /google.*drive|gdrive/i,
    name: 'Google Drive', emoji: '📁', pkg: 'com.google.android.apps.docs',
    url: 'intent://drive.google.com/#Intent;scheme=https;package=com.google.android.apps.docs;end',
  },
  {
    patterns: /google.*meet|gmeet/i,
    name: 'Google Meet', emoji: '🎥', pkg: 'com.google.android.apps.meetings',
    url: 'intent://meet.google.com/#Intent;scheme=https;package=com.google.android.apps.meetings;end',
  },
  {
    patterns: /zoom\b/i,
    name: 'Zoom', emoji: '💻', pkg: 'us.zoom.videomeetings',
    url: 'intent://zoom.us/#Intent;scheme=https;package=us.zoom.videomeetings;end',
  },
  {
    patterns: /microsoft.*teams|ms.*teams|teams\b/i,
    name: 'Teams', emoji: '💼', pkg: 'com.microsoft.teams',
    url: 'intent://teams.microsoft.com/#Intent;scheme=https;package=com.microsoft.teams;end',
  },
  {
    patterns: /notion\b/i,
    name: 'Notion', emoji: '📝', pkg: 'notion.id',
    url: 'intent://notion.so/#Intent;scheme=https;package=notion.id;end',
  },
  {
    patterns: /todoist/i,
    name: 'Todoist', emoji: '✅', pkg: 'com.todoist.android.Todoist',
    url: 'intent://todoist.com/#Intent;scheme=https;package=com.todoist.android.Todoist;end',
  },
  {
    patterns: /\bcalculator|calculator\b/i,
    name: 'Calculator', emoji: '🔢', pkg: 'com.android.calculator2',
    url: 'intent://calculator/#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CALCULATOR;end',
  },

  // ── System / Android ───────────────────────────────────────
  {
    patterns: /settings|setting\b/i,
    name: 'Settings', emoji: '⚙️', pkg: 'com.android.settings',
    url: 'intent://settings/#Intent;action=android.settings.SETTINGS;end',
  },
  {
    patterns: /camera/i,
    name: 'Camera', emoji: '📷', pkg: '',
    url: 'intent://camera/#Intent;action=android.media.action.STILL_IMAGE_CAMERA;end',
  },
  {
    patterns: /gallery|photos/i,
    name: 'Gallery', emoji: '🖼️', pkg: '',
    url: 'intent://gallery/#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_GALLERY;end',
  },
  {
    patterns: /chrome\b/i,
    name: 'Chrome', emoji: '🌐', pkg: 'com.android.chrome',
    url: 'intent://www.google.com/#Intent;scheme=https;package=com.android.chrome;end',
  },
  {
    patterns: /clock|alarm.*app/i,
    name: 'Clock', emoji: '⏰', pkg: 'com.google.android.deskclock',
    url: 'intent://clock/#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CLOCK;end',
  },
  {
    patterns: /contacts\b/i,
    name: 'Contacts', emoji: '👥', pkg: 'com.android.contacts',
    url: 'intent://contacts/#Intent;action=android.intent.action.MAIN;category=android.intent.category.APP_CONTACTS;end',
  },
  {
    patterns: /\bfiles?\b|file.*manager/i,
    name: 'Files', emoji: '📂', pkg: 'com.google.android.apps.nbu.files',
    url: 'intent://files.google.com/#Intent;scheme=https;package=com.google.android.apps.nbu.files;end',
  },
];

// ── Open word detection ───────────────────────────────────────
const OPEN_WORDS = /khol|open|chala|chalu|start|launch|dikha|de|do|karo|jao|jaaun|kholo|chalao|चालू|खोलो/i;

export function detectVoiceCommand(text: string): VoiceCommand {
  const t = text.trim();

  // Try each app
  for (const app of APPS) {
    const appMatch = app.patterns.test(t);
    if (!appMatch) continue;

    // Check if text has open-word OR is just the app name (short query)
    const hasOpenWord = OPEN_WORDS.test(t);
    const isJustAppName = t.replace(app.patterns, '').trim().length < 8;

    if (hasOpenWord || isJustAppName) {
      // Check for message to send (WhatsApp, Telegram etc.)
      const msgMatch = t.match(/(?:message|msg|bolo|likh|bhej|send|text)\s+(?:karo\s+)?["']?(.+?)["']?\s*$/i);
      let url = app.url || `intent://${app.pkg}/#Intent;package=${app.pkg};end`;

      if (msgMatch && app.msgUrl) {
        url = app.msgUrl.replace('{msg}', encodeURIComponent(msgMatch[1]));
      }

      return {
        type: 'deeplink',
        payload: { url, name: app.name, emoji: app.emoji, pkg: app.pkg },
        spoken: `${app.emoji} ${app.name} khol raha hoon!`,
      };
    }
  }

  // Search commands
  const ytSearch = t.match(/(?:youtube|yt)\s+(?:pe|par|mein|on|search|dhundh)?\s*(?:search\s+)?(.+)/i);
  if (ytSearch?.[1] && ytSearch[1].length > 2) {
    const q = encodeURIComponent(ytSearch[1]);
    return { type: 'deeplink', payload: { url: `https://www.youtube.com/search?q=${q}`, name: 'YouTube Search', emoji: '▶️' }, spoken: `▶️ YouTube mein "${ytSearch[1]}" search kar raha hoon!` };
  }
  const gSearch = t.match(/(?:google|search)\s+(?:karo\s+|pe\s+|mein\s+)?(.+)/i);
  if (gSearch?.[1] && gSearch[1].length > 2) {
    const q = encodeURIComponent(gSearch[1]);
    return { type: 'deeplink', payload: { url: `https://www.google.com/search?q=${q}`, name: 'Google Search', emoji: '🔍' }, spoken: `🔍 Google pe "${gSearch[1]}" search kar raha hoon!` };
  }
  const mapsSearch = t.match(/(?:maps?|navigate|navigation|rasta)\s+(?:pe|par|mein|to|ke liye)?\s*(.+)/i);
  if (mapsSearch?.[1] && mapsSearch[1].length > 2) {
    const q = encodeURIComponent(mapsSearch[1]);
    return { type: 'deeplink', payload: { url: `https://maps.google.com/search/${q}`, name: 'Maps Navigate', emoji: '🗺️' }, spoken: `🗺️ Maps mein "${mapsSearch[1]}" dhundh raha hoon!` };
  }

  return { type: 'none' };
}

export function executeDeepLink(url: string): void {
  if (typeof window !== 'undefined') window.location.href = url;
}

export function isAgentIntent(text: string): boolean {
  const t = text.toLowerCase();
  return !!(
    t.match(/automatically|auto.*karo|background.*mein.*karo|schedule.*karo/) &&
    t.match(/har.*din|daily|every.*day|weekly|reminder/)
  );
}

export function containsWakeWord(text: string): boolean {
  return /\b(hey jarvis|hi jarvis|jarvis|ok jarvis|jai jarvis)\b/i.test(text);
}
