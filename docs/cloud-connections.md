# Cloud connections

Experimental remote folder access for Nextcloud and generic WebDAV, based on upstream 3.10.5. This is explicit remote access, not background synchronization. Provider identity/capabilities and shared recovery, copy and UI workflows are separated from platform transport and credential storage. Other providers are not implemented.

## Files and recovery

Browse folders, open Markdown, explicitly save, create `.md`, and delete individual `.md` files. Creation/deletion are context-menu actions; deletion always confirms. Save confirmation can be suppressed per account. Cloud documents have their own sidebar and recovery storage rather than becoming Vault copies. Connections can be hidden or disabled, and remembered accounts are optional.

Existing-file writes/deletes require a strong server ETag and matching precondition. New files are create-only. Local recovery is committed before mutation. Conflicts, missing validators, unknown write outcomes and changed editor content preserve the draft; no silent overwrite or automatic retry is allowed. A server must correctly enforce its preconditions. Batch copying cannot be atomic across HTTP operations.

Vault and Linked file/folder context menus offer Copy to cloud. A destination picker selects account, folder and a portable new name. Linked folders use currently indexed files in the selected subtree, not an unrequested disk scan. Copies snapshot current primary/split-editor drafts and commit all source/destination recovery before uploading. Existing targets are never overwritten or merged. Cancellation stops future operations after the current request settles; completed remote objects remain. Secret Workspace and Private mode are excluded. Limits: 500 files, 200 descendant folders, 20 path segments, 20 MiB/file and 50 MiB total.

## Windows desktop

Cloud uses a separate application-owned helper through official Neutralino extension APIs. The runtime is pinned to official 6.10.0 for command allowlist enforcement. The helper starts only on demand, uses authenticated IPC with bootstrap over stdin, and exits on shutdown/disable/idle. Credentials can be stored in Windows Credential Manager; stored passwords do not return to UI JavaScript. No custom runtime patch is required. See [build instructions](../desktop-app/cloud-extension/README.md).

Single instance and full-window native drag-and-drop patches from the personal distribution are excluded from this branch. [Stable Neutralino 6.10.0](https://github.com/neutralinojs/neutralinojs/releases/tag/v6.10.0) does not include those behaviors. macOS/Linux native cloud adapters remain future work.

## Self hosted web

The optional [all-in-one image](../self-hosted/README.md) serves the editor and same-origin connector on container port 80. The original static Dockerfile remains available. Build with `docker compose -f self-hosted/compose.yml build`; keep the existing URL, reverse proxy and host-port mapping. Cloud is disabled by default. To enable it in an existing Compose:

```yaml
environment:
  CLOUD_ENABLED: "true"
  CLOUD_ACCESS_PASSWORD: "${CLOUD_ACCESS_PASSWORD:?Set a private cloud password}"
  CLOUD_REMEMBER_CONNECTIONS: "true"
volumes:
  - cloud-state:/data
```

Declare `cloud-state:` under top-level `volumes`. Set a random password of at least 12 characters in `.env`, or use `CLOUD_ACCESS_PASSWORD_FILE` with a Docker secret. The password unlocks this installation's connector; Nextcloud/WebDAV sign-in is separate. All sessions share one owner's remembered accounts. No database service, init script or mandatory hostname configuration is needed. Remembering defaults off. A host bind mount must be writable by UID/GID 1000.

HTTPS, same-origin/CSRF/session checks, bounded requests, DNS/IP checks, destination-scoped credentials and encrypted remembered credentials protect the connector boundary. Internal cloud servers require an explicit HTTPS-origin allowance. Drafts remain in each browser's IndexedDB. Asset URLs include content hashes; release-note fetches are versioned. Proxies must respect no-store and query strings, especially for API/bootstrap/session responses.

The connector handles readable file bodies and credentials. Its operator can access active data and the default credential key. This is a single-owner deployment, not isolated public multi-user storage or end-to-end encryption. Local browser drafts do not remove trust in the connector or served JavaScript. Public deployment needs a separate decision about identities, tenant isolation, abuse controls, direct browser CORS and operator trust.

## Deferred providers

Google Drive folder browsing with save/create/delete was explored but deferred. An integration needs an application Google Cloud project with Drive API enabled, OAuth consent/client configuration and an owner responsible for credentials, policies and any verification. Each user would authorize their own account; requiring every user to create a developer project would be poor onboarding. A narrow `drive.file` scope does not automatically grant recursive access to arbitrary pre-existing folder contents; full folder browsing may require broader permissions, subject to [Google's scope and verification policy](https://developers.google.com/workspace/drive/api/guides/api-specific-auth). Safe mutation, token refresh/revocation and recovery need provider-specific design. No Google project, credentials or provider was created. The maintainer should decide ownership and scope before development.

OneDrive, Dropbox, GitHub, GitLab, Bitbucket and iCloud are future capability discussions only; sharing a provider interface does not make their protocols or authentication equivalent.

## Validation boundaries

Automated checks cover synthetic protocol/connector servers, isolated browser profiles, recovery migrations and the real official Windows runtime/helper lifecycle. They do not establish real-account compatibility with every DAV server, power-loss durability, macOS/Linux cloud support or public multi-user safety. Back up browser drafts and server state before upgrades; never clear site data to fix cache problems.
