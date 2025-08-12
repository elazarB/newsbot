require('dotenv').config(); // טוען את .env
const { Client, GatewayIntentBits } = require('discord.js');
const Parser = require('rss-parser'); // התקן עם npm install rss-parser

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const parser = new Parser(); // יוצר אובייקט פרסר

let lastSecurityDate = null; // תאריך אחרון לביטחון
let lastGeneralDate = null; // תאריך אחרון לכללי

// מילות מפתח פוליטיות לסינון (התאם אם צריך)
const politicalKeywords = [
   'בג"ץ'
];

client.on('ready', () => {
  console.log(`בוט מחובר כ-${client.user.tag}!`);

  // פונקציה לבדיקת חדשות ביטחוניות
  const checkSecurityNews = async () => {
    try {
      const feed = await parser.parseURL('https://special.now14.co.il/war-rss/');
      if (feed.items.length > 0) {
        const latest = feed.items[0];
        const publishedDate = new Date(latest.pubDate);

        if (!lastSecurityDate || publishedDate > lastSecurityDate) {
          const channel = client.channels.cache.get(process.env.CHANNEL_ID);
          if (channel) {
            const description = latest.contentSnippet || latest.description || 'אין תיאור';
            channel.send(`**ידיעה ביטחונית חדשה :**\n${latest.title}\n${description}\nקרא עוד: ${latest.link}`);
            lastSecurityDate = publishedDate;
            console.log('חדשה ביטחונית נשלחה!');
          } else {
            console.error('ערוץ לא נמצא!');
          }
        } else {
          console.log('אין חדשות ביטחוניות חדשות.');
        }
      }
    } catch (error) {
      console.error('שגיאה בבדיקת RSS ביטחון:', error);
    }
  };

  // פונקציה לבדיקת חדשות כלליות (ללא פוליטיקה)
  const checkGeneralNews = async () => {
    try {
      const feed = await parser.parseURL('https://www.now14.co.il/feed/');
      if (feed.items.length > 0) {
        const latest = feed.items[0];
        const publishedDate = new Date(latest.pubDate);
        const title = latest.title;
        const description = latest.contentSnippet || latest.description || '';

        // בדוק אם פוליטי
        const isPolitical = politicalKeywords.some(kw => title.toLowerCase().includes(kw.toLowerCase()) || description.toLowerCase().includes(kw.toLowerCase()));

        if (!isPolitical && (!lastGeneralDate || publishedDate > lastGeneralDate)) {
          const channel = client.channels.cache.get(process.env.CHANNEL_ID);
          if (channel) {
            channel.send(`**ידיעה חדשה:**\n${title}\n${description}\nקרא עוד: ${latest.link}`);
            lastGeneralDate = publishedDate;
            console.log('חדשה כללית נשלחה!');
          } else {
            console.error('ערוץ לא נמצא!');
          }
        } else if (isPolitical) {
          console.log('ידיעה כללית פוליטית – מדלג.');
        } else {
          console.log('אין חדשות כלליות חדשות.');
        }
      }
    } catch (error) {
      console.error('שגיאה בבדיקת RSS כללי:', error);
    }
  };

  // הרץ מיד פעם ראשונה
  checkSecurityNews();
  checkGeneralNews();

  // הרץ כל 30 דקות (1800000 מילישניות)
  setInterval(checkSecurityNews, 1800000);
  setInterval(checkGeneralNews, 1800000);
});

client.login(process.env.DISCORD_TOKEN);