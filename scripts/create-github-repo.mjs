import { execSync } from 'child_process';

function getGitHubToken() {
  const input = 'protocol=https\nhost=github.com\n\n';
  const out = execSync('git credential fill', {
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const password = out
    .split('\n')
    .find((line) => line.startsWith('password='))
    ?.slice('password='.length);
  if (!password) {
    throw new Error('No GitHub credential available from git credential manager.');
  }
  return password;
}

async function main() {
  const token = getGitHubToken();
  const response = await fetch('https://api.github.com/user/repos', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'diet-elite-mobile-setup',
    },
    body: JSON.stringify({
      name: 'diet-elite-mobile',
      description: 'Expo mobile client for Diet Elite — multi-role dashboards, messaging, bookings.',
      private: false,
      auto_init: false,
    }),
  });

  if (response.status === 422) {
    const body = await response.json();
    const exists = body.errors?.some((e) => e.message?.includes('already exists'));
    if (exists) {
      console.log('Repository already exists.');
      return;
    }
    throw new Error(JSON.stringify(body));
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  console.log('Repository created: diet-elite-mobile');
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
