# Personal all-in-one cloud edition

This is a personal Nextcloud/WebDAV edition, not a public multi-user service. The browser editor and the connector run in one image, on the existing container port **80**. Cloud is optional. Existing desktop transport, application identity, Vault and recovery paths are preserved.

## Minimal deployment

Build the all-in-one image from this branch with `docker compose -f self-hosted/compose.yml build`, then use that local image in your existing Compose. Keep the existing mapping, for example `9777:80`, and the existing reverse proxy. Add:

```yaml
environment:
  CLOUD_ENABLED: "true"
  CLOUD_ACCESS_PASSWORD: "${CLOUD_ACCESS_PASSWORD:?Set a private cloud access password}"
  CLOUD_REMEMBER_CONNECTIONS: "true"
volumes:
  - cloud-state:/data
```

Declare `cloud-state:` under the Compose top-level `volumes`. Put a random password of at least 12 characters in your private `.env`, or use `CLOUD_ACCESS_PASSWORD_FILE` with a Docker secret instead. Do not place real credentials in source control or send them to chat. An env password is convenience, not a secret vault: the host operator and container inspection can access it.

There is **no required init script, config JSON, hostname declaration, database service or separate connector container**. `/data` is initialized automatically when remembering connections is enabled. When remembering is off, no credential volume/key is required. Cloud-disabled mode needs no password or cloud storage at all.

Normal editing opens without an additional application login. Settings → Cloud connections → Connect requests the installation's cloud access password when needed, then the user's Nextcloud/WebDAV sign-in. The cloud password is separate from the Nextcloud password. `Lock cloud access` revokes that connector session without navigating away or deleting browser drafts.

Use HTTPS through the existing proxy, preserving the original Host. The connector compares the browser Origin to that Host and checks CSRF/session tokens. It does not blindly trust forwarded origin/identity headers. Cloud unlock refuses ordinary insecure HTTP; literal localhost development mode is opt-in for tests. `CLOUD_PUBLIC_URL` is only an optional override for deployments that require a fixed origin, not a normal setup requirement.

## Environment controls

| Variable | Default | Meaning |
| --- | --- | --- |
| `CLOUD_ENABLED` | `false` | Cloud endpoints/adaptor enabled; otherwise ordinary browser editor only. |
| `CLOUD_ACCESS_PASSWORD` | unset | Personal installation cloud access password, minimum 12 characters. Required when enabled unless the file option is used. |
| `CLOUD_ACCESS_PASSWORD_FILE` | unset | Alternative secret-file input; cannot be combined with the plain env option. |
| `CLOUD_REMEMBER_CONNECTIONS` | `false` | Allow explicit remembering of cloud credentials. Session-only by default. |
| `CLOUD_ALLOWED_SERVERS` | unset | Optional comma-separated HTTPS origins to restrict destinations. |
| `CLOUD_PRIVATE_SERVERS` | unset | Explicit HTTPS origins allowed to resolve to private addresses. Does not open every private host/port. |
| `CLOUD_CREDENTIAL_KEY_FILE` | unset | Optional external 32-byte key for saved credentials. Otherwise a key is generated once in `/data`. |
| `CLOUD_DATA_DIR` | `/data` | Persistent connector state location. |
| `CLOUD_PUBLIC_URL` | unset | Optional fixed HTTPS origin; normally same-origin is checked dynamically. |

Only `true`/`false` are accepted for boolean policies. With no allowlist, users can connect to public HTTPS Nextcloud/WebDAV roots, subject to DNS/IP restrictions. Internal servers require a matching private-server origin. Arbitrary redirects, weak versions and unguarded writes remain rejected. Existing-file mutations preserve strong ETags; new files use create-only conditions.

## Personal ownership and privacy

All sessions authenticated with the installation cloud password belong to the **same personal owner**. All remembered cloud accounts belong to that owner. This version does not offer independent people isolated accounts. Do not distribute the cloud password to unrelated users or expose it as a public connector.

Markdown bodies and recovery journals remain in the browser's existing IndexedDB. The server keeps active cloud credentials in memory; it stores only explicitly remembered credentials, encrypted with AES-GCM. Disabling remembering refuses persistent writes and does not silently delete older saved records. Disable cloud/rollback also preserves stored data. Session expiry, server restart and Lock revoke active sessions; remembered access survives restart when enabled.

The default generated key is in the same persistent volume for simple deployment. A backup of that entire volume includes the key and must therefore be treated as secret. An external `CLOUD_CREDENTIAL_KEY_FILE` allows separation. Encryption at rest does not prevent the host administrator from accessing active credentials or readable cloud content. No user-key/E2EE feature or public operator-blind privacy claim is made. Existing CDN, remote-renderer, media and sharing privacy boundaries remain relevant.

Browser storage belongs to its origin/profile, not to the connector password. Use the exact existing URL to retain the current browser workspace; desktop drafts are separate and unaffected. Two existing hostname aliases retain their own browser workspaces. Use separate profiles/devices on shared computers. Changing the cloud password invalidates sessions on restart and does not erase the encrypted credential store.

## Upgrade and rollback

Back up the existing browser workspace and Compose first. Keep the same app URL, host port and reverse proxy. Replace the image and add the env/volume configuration. Connect only to disposable `.md` test files first, then test edit/save confirmation, conflict rejection, context-menu create/delete, draft reload and remembered access after restart.

Return to the official image and remove the cloud env entries to roll back; the port remains `80` in both images. Do not remove the cloud volume or clear browser site data while recovery is needed. The official UI may not understand custom cloud document metadata, so export important cloud drafts before switching. Recovery is not a substitute for backup.

## Validation and future choices

Automated API, transport, environment and Chromium tests use disposable profiles and controlled servers, not a real personal cloud account. Container acceptance and desktop packaging are recorded with each release. Manual Nextcloud/homeserver and final desktop acceptance belong to the user's release test. No production deployment or GitHub publication is performed by the build.

This edition deliberately keeps the current small encrypted credential file rather than adding SQLite or personal encryption keys before their ownership/recovery model is agreed. Desktop cloud uses official Neutralino extension APIs and the official pinned runtime. Public web hosting, multi-user identities, long-lived device grants, frontend trust, SSRF/abuse policies and E2EE remain separate maintainer decisions. See the developer notes under `docs/`.

## Static asset upgrades behind a CDN

The all-in-one server adds content hashes to local script and stylesheet URLs. This avoids the stale unversioned JavaScript previously served by Cloudflare after changing the image. Responses remain `Cache-Control: no-store`; session/bootstrap/API responses must never be cached by a proxy. A custom proxy policy that ignores query strings or overrides no-store requires a cache purge/policy correction. Do not clear browser site storage: it holds drafts.

For an existing host bind mount, `/data` must be writable by the container's UID/GID 1000. A Docker named volume initializes with the image's ownership. This release preserves the existing volume format, application identity, account namespaces and draft locations.
