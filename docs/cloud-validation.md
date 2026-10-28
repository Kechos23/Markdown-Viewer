# Cloud validation

Cloud-only branch based on upstream v3.10.5. Personal runtime patches and personal release/deployment metadata are excluded.

Review fixes preserve locked/expired web-session cleanup, explicit remembered-account unlock, portable copy-name suggestions, visible Unicode text and the minimum official runtime needed for command restrictions. Existing cloud identities, draft metadata and per-account preferences retain their formats.

Validation on the clean branch:

- 277 unit tests and 18 connector API/configuration/cache tests passed.
- 85 Chromium cloud/copy/smoke scenarios and four self-hosted browser scenarios passed.
- Official Neutralino 6.10.0 with the actual SDK/helper passed zero automatic startup, concurrent launch, stdin bootstrap, stop/crash recovery and command restriction checks in a disposable headless profile.
- Real helper tests passed bounded DAV, conditional mutations, TLS/redirect restrictions, Unicode, credential scoping/restart/removal and exit-with-live-socket regressions.
- `npm run build:cloud` produced the Windows executable and helper from the official runtime. Static mirror checks passed.
- The locally built all-in-one image passed non-root/read-only operation, Secure/HttpOnly/SameSite sessions, Host/Origin guards, static-source restrictions, encrypted remembered credentials and restart revocation. Cloud-disabled image required neither password nor credential volume.

These checks use synthetic servers and disposable credentials/profiles. They do not replace real-server acceptance or prove safety for public multi-user hosting, every DAV implementation or abrupt power loss. No real cloud account was used and no production deployment was changed.
