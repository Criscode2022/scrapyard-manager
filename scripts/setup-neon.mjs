#!/usr/bin/env node
/**
 * Create a Neon project + database and print DATABASE_URL.
 *
 * Requires: NEON_API_KEY (https://console.neon.tech → Account → API keys)
 *
 * Usage:
 *   NEON_API_KEY=nap_... node scripts/setup-neon.mjs
 *   NEON_API_KEY=nap_... node scripts/setup-neon.mjs --name scrapyard-manager
 *
 * Then set the secret on GitHub (needs repo secrets write access):
 *   gh secret set DATABASE_URL --env production --body "$DATABASE_URL" -R OWNER/REPO
 */

const API = 'https://console.neon.tech/api/v2';

async function main() {
  const key = process.env.NEON_API_KEY?.trim();
  if (!key) {
    console.error('Missing NEON_API_KEY. Create one at https://console.neon.tech');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const nameIdx = args.indexOf('--name');
  const projectName =
    (nameIdx >= 0 && args[nameIdx + 1]) || 'scrapyard-manager';

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  console.log(`Creating Neon project "${projectName}"…`);
  const createRes = await fetch(`${API}/projects`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      project: {
        name: projectName,
        region_id: 'aws-eu-central-1',
        pg_version: 16,
      },
    }),
  });

  const createBody = await createRes.json().catch(() => ({}));
  if (!createRes.ok) {
    console.error('Failed to create project:', createRes.status, createBody);
    process.exit(1);
  }

  const project = createBody.project;
  const connectionUri =
    createBody.connection_uris?.[0]?.connection_uri ||
    createBody.connection_uri;

  let databaseUrl = connectionUri;
  if (!databaseUrl && project?.id) {
    // Fallback: list connection URI
    const csRes = await fetch(
      `${API}/projects/${project.id}/connection_uri?database_name=neondb&role_name=neondb_owner`,
      { headers },
    );
    const csBody = await csRes.json().catch(() => ({}));
    databaseUrl = csBody.uri || csBody.connection_uri;
  }

  console.log('\nNeon project ready');
  console.log('  project id :', project?.id);
  console.log('  name       :', project?.name);
  console.log('  region     :', project?.region_id);
  if (databaseUrl) {
    console.log('\nDATABASE_URL (store as GitHub secret — do not commit):\n');
    console.log(databaseUrl);
    console.log(`
Next:
  # Local preview with Neon
  export DATABASE_URL='…'
  sh /workspace/startup.sh   # or restart the API

  # GitHub environment secret (production)
  echo -n "$DATABASE_URL" | gh secret set DATABASE_URL --env production -R OWNER/REPO
`);
  } else {
    console.log(
      '\nProject created but connection string not returned. Fetch it from the Neon console.',
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
