import { Donation, SiteStats } from '@/types/donation';

interface NotificationPayload {
  donation: Donation;
  stats: SiteStats;
}

/**
 * Dispatches instant notifications to Telegram and/or Discord.
 * Fails gracefully if webhooks are not configured.
 */
export async function sendDonationAlert({ donation, stats }: NotificationPayload): Promise<void> {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;

  // If neither is configured, exit silently without error
  if (!discordWebhook && (!telegramToken || !telegramChatId)) {
    return;
  }

  const donorName = donation.name?.trim() || 'Anonymous Chad';
  const donorMessage = donation.message?.trim() || 'Respect +';
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, stats.wantedLevel || 1)));

  // 1. Dispatch to Telegram
  if (telegramToken && telegramChatId) {
    try {
      const text = [
        `🌴 *NEW GTA VI DONATION RECEIVED!* 🎮`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `👤 *Donor:* ${escapeMarkdown(donorName)}`,
        `💰 *Amount:* ₹${donation.amount.toLocaleString('en-IN')}`,
        `🏷️ *Badge:* ${escapeMarkdown(donation.badge || 'Chad')}`,
        `💬 *Message:* _"${escapeMarkdown(donorMessage)}"_`,
        donation.utrNumber ? `🔢 *UTR:* \`${donation.utrNumber}\`` : null,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📈 *Total Raised:* ₹${stats.totalRaised.toLocaleString('en-IN')} / ₹${stats.targetAmount.toLocaleString('en-IN')} (${stats.percentComplete}%)`,
        `⭐ *Wanted Level:* ${stars}`,
        `👥 *Total Chads:* ${stats.totalDonors}`,
      ]
        .filter(Boolean)
        .join('\n');

      await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      });
    } catch (err) {
      console.error('[Notification] Failed to send Telegram alert:', err);
    }
  }

  // 2. Dispatch to Discord
  if (discordWebhook) {
    try {
      const payload = {
        username: 'GTA 6 Vice City Fund',
        avatar_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjEx.../gta.gif',
        embeds: [
          {
            title: '🌴 NEW DONATION RECEIVED! Respect +',
            color: 0xff007f, // Neon Pink
            fields: [
              { name: '👤 Legend', value: donorName, inline: true },
              { name: '💰 Amount', value: `₹${donation.amount}`, inline: true },
              { name: '🏷️ Badge', value: donation.badge || 'Chad', inline: true },
              { name: '💬 Message', value: donorMessage },
              ...(donation.utrNumber ? [{ name: '🔢 UTR Number', value: donation.utrNumber, inline: true }] : []),
              {
                name: '📈 Campaign Progress',
                value: `₹${stats.totalRaised.toLocaleString('en-IN')} / ₹${stats.targetAmount.toLocaleString('en-IN')} (${stats.percentComplete}%)\n${stars}`,
              },
            ],
            footer: {
              text: `Total Donors: ${stats.totalDonors} | Vice City Fund`,
            },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[Notification] Failed to send Discord alert:', err);
    }
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+-=|{}.!]/g, '\\$&');
}
