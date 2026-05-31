/**
 * YouTube Top 5 Daily Scanner
 * Chạy bởi GitHub Actions lúc 7h tối (Vietnam)
 * - Lấy top 5 video view cao nhất từ 7 kênh
 * - Lưu vào data.json
 * - Gửi báo cáo qua Slack
 */

const BASE = 'https://www.googleapis.com/youtube/v3';
const KEY  = process.env.YOUTUBE_API_KEY;
const SLACK = process.env.SLACK_WEBHOOK_URL;
const DAYS  = parseInt(process.env.SCAN_DAYS || '7', 10);

const CHANNELS = [
  { handle: 'bao-baovietsub',            label: 'Bao Bao VietSub' },
  { handle: 'NguThuSuManhNhatMyVietsub', label: 'Ngư Thủ Sư Mạnh Nhất Mỹ' },
  { handle: 'traumapreview',             label: 'Trauma Preview' },
  { handle: 'honghotvietsub01',          label: 'Hồng Hót VietSub' },
  { handle: 'thietreviewphim',           label: 'Thiết Review Phim' },
  { handle: 'ThiVietsubphim',            label: 'Thi Vietsub Phim' },
  { handle: 'NoanNoan_Review',           label: 'Noan Noan Review' },
];

// ── Helpers ────────────────────────────────────────────────────
function fmt(n) {
  const v = parseInt(n || '0', 10);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + 'K';
  return v.toLocaleString();
}

async function apiFetch(url) {
  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(`YouTube API: ${data.error.message}`);
  return data;
}

async function resolveChannel(handle) {
  const data = await apiFetch(`${BASE}/channels?part=id,snippet&forHandle=${handle}&key=${KEY}`);
  if (!data.items?.length) return null;
  return { id: data.items[0].id, title: data.items[0].snippet.title };
}

async function fetchVideos(channelId, publishedAfter) {
  const data = await apiFetch(
    `${BASE}/search?part=id,snippet&channelId=${channelId}&type=video&order=date` +
    `&publishedAfter=${publishedAfter}&maxResults=20&key=${KEY}`
  );
  return (data.items || []).map(item => ({
    videoId:     item.id.videoId,
    title:       item.snippet.title,
    thumbnail:   item.snippet.thumbnails?.medium?.url || '',
    publishedAt: item.snippet.publishedAt,
  }));
}

async function fetchStats(ids) {
  const data = await apiFetch(
    `${BASE}/videos?part=statistics&id=${ids.join(',')}&key=${KEY}`
  );
  const map = {};
  (data.items || []).forEach(item => { map[item.id] = item.statistics; });
  return map;
}

// ── Slack notification ─────────────────────────────────────────
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

async function sendSlack(top5, scannedAt) {
  if (!SLACK) { console.log('⚠ SLACK_WEBHOOK_URL chưa set, bỏ qua gửi Slack'); return; }

  const dateStr = new Date(scannedAt).toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    dateStyle: 'full', timeStyle: 'short',
  });

  // Header block
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '📺 YouTube Top 5 — Báo cáo hàng ngày', emoji: true },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `🕖 *${dateStr}* · ${DAYS} ngày gần nhất · ${CHANNELS.length} kênh` }],
    },
    { type: 'divider' },
  ];

  // Video blocks
  top5.forEach((v, i) => {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${MEDALS[i]} *<https://www.youtube.com/watch?v=${v.videoId}|${v.title}>*`,
          `📺 ${v.channelLabel}`,
          `👁 *${fmt(v.viewCount)} views*   👍 ${fmt(v.likeCount)}   💬 ${fmt(v.commentCount)}`,
        ].join('\n'),
      },
      accessory: v.thumbnail ? {
        type: 'image',
        image_url: v.thumbnail,
        alt_text: v.title,
      } : undefined,
    });
    if (i < top5.length - 1) blocks.push({ type: 'divider' });
  });

  // Footer
  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `_Dữ liệu tự động từ YouTube Data API · Cập nhật lúc 7h tối hàng ngày_`,
      }],
    }
  );

  const res = await fetch(SLACK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Slack webhook lỗi: ${res.status} — ${text}`);
  }
  console.log('✅ Đã gửi Slack thành công');
}

// ── Main ───────────────────────────────────────────────────────
async function main() {
  if (!KEY) throw new Error('YOUTUBE_API_KEY chưa được set');

  console.log(`\n🚀 Bắt đầu quét — ${DAYS} ngày gần nhất\n`);

  const publishedAfter = new Date(Date.now() - DAYS * 86400_000).toISOString();
  const allVideos = [];

  for (const ch of CHANNELS) {
    console.log(`  Đang quét: ${ch.label} (@${ch.handle})...`);
    try {
      const resolved = await resolveChannel(ch.handle);
      if (!resolved) { console.log(`    ⚠ Không tìm thấy kênh`); continue; }

      const videos = await fetchVideos(resolved.id, publishedAfter);
      videos.forEach(v => { v.channelLabel = ch.label; });
      allVideos.push(...videos);
      console.log(`    ✓ ${videos.length} video`);
    } catch (e) {
      console.error(`    ✗ Lỗi: ${e.message}`);
    }
  }

  if (!allVideos.length) throw new Error('Không lấy được video nào');

  // Fetch stats
  console.log('\n📊 Đang lấy thống kê...');
  const ids = allVideos.map(v => v.videoId);
  const statsMap = {};
  for (let i = 0; i < ids.length; i += 50) {
    Object.assign(statsMap, await fetchStats(ids.slice(i, i + 50)));
  }

  allVideos.forEach(v => {
    const s = statsMap[v.videoId] || {};
    v.viewCount    = parseInt(s.viewCount    || '0', 10);
    v.likeCount    = parseInt(s.likeCount    || '0', 10);
    v.commentCount = parseInt(s.commentCount || '0', 10);
  });

  const top5 = allVideos
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5);

  const scannedAt = new Date().toISOString();

  // In kết quả
  console.log('\n🏆 Top 5:\n');
  top5.forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.title}`);
    console.log(`     ${v.channelLabel} · ${fmt(v.viewCount)} views · ${fmt(v.likeCount)} likes`);
    console.log(`     https://www.youtube.com/watch?v=${v.videoId}\n`);
  });

  // Lưu data.json
  const fs = await import('fs');
  const output = { scannedAt, days: DAYS, channels: CHANNELS.map(c => c.label), top5 };
  fs.writeFileSync('data.json', JSON.stringify(output, null, 2), 'utf8');
  console.log('💾 Đã lưu data.json');

  // Gửi Slack
  await sendSlack(top5, scannedAt);

  console.log('\n✅ Hoàn thành!\n');
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
