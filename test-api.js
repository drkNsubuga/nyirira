const fs = require('fs');
const env = fs.readFileSync('e:/Developer/Projects/DRK/DevPost/YouCam-API-Skin-AI-and-eCommerce/nyirira/.env', 'utf8');
const key = env.match(/YOUCAM_API_KEY=(.+)/)[1].trim().replace(/^"|"$/g, '');
const base = 'https://yce-api-01.makeupar.com';
const headers = { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' };

async function main() {
  // 1) tiny 1x1 jpeg
  const jpeg = Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCggICAgICAgICAgICAf//Z', 'base64');

  console.log('== 1. File init ==');
  const initRes = await fetch(base + '/s2s/v2.0/file', {
    method: 'POST', headers,
    body: JSON.stringify({ files: [{ content_type: 'image/jpeg', file_name: 'test.jpg', file_size: jpeg.length }] }),
  });
  const init = await initRes.json();
  console.log(JSON.stringify(init, null, 2).slice(0, 800));

  const f = init?.data?.files?.[0] ?? init?.files?.[0];
  const fileId = f?.file_id;
  const uploadUrl = f?.requests?.[0]?.url ?? f?.requests?.url ?? f?.upload_url;
  const method = f?.requests?.[0]?.method ?? 'PUT';
  console.log('file_id:', fileId);
  console.log('upload method:', method);
  console.log('upload url:', (uploadUrl || 'MISSING').slice(0, 120));

  if (!uploadUrl) return console.log('NO UPLOAD URL - aborting');

  console.log('== 2. Upload bytes ==');
  const putRes = await fetch(uploadUrl, { method, body: jpeg, headers: { 'Content-Type': 'image/jpeg' } });
  console.log('upload status:', putRes.status, putRes.statusText);
  if (!putRes.ok) console.log('upload body:', (await putRes.text()).slice(0, 300));

  console.log('== 3. Skin-analysis task ==');
  const taskRes = await fetch(base + '/s2s/v2.0/task/skin-analysis', {
    method: 'POST', headers,
    body: JSON.stringify({ src_file_id: fileId, dst_actions: ['age_spot', 'texture', 'redness', 'radiance'], format: 'json' }),
  });
  const task = await taskRes.json();
  console.log(JSON.stringify(task).slice(0, 400));
  const taskId = task?.data?.task_id;
  if (!taskId) return console.log('no task_id - aborting');

  console.log('== 4. Poll ==');
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const pollRes = await fetch(base + '/s2s/v2.0/task/skin-analysis/' + taskId, { headers });
    const poll = await pollRes.json();
    const status = poll?.data?.task_status;
    console.log('poll', i, status);
    if (status === 'success' || status === 'error') {
      console.log(JSON.stringify(poll?.data).slice(0, 1500));
      break;
    }
  }
}

main().catch(e => console.error('FATAL', e));
