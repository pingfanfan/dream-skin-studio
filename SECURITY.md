# Security policy

Please report security issues privately through GitHub Security Advisories.

The project:

- never asks for API keys or account passwords;
- does not modify the official Codex application bundle or code signature;
- opens the debugging endpoint on `127.0.0.1` only;
- refuses pack symlinks, remote CSS URLs, missing rights records, and changed
  asset fingerprints;
- reads user links as references only and never executes their code;
- stores local state under `~/.codex/dream-skin-studio` with user-only access.
