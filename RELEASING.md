# Releasing Agentwerke Desktop

Use the `Release Desktop App` GitHub Actions workflow for releases. Do not
publish macOS artifacts from the `Desktop Build` workflow; those artifacts are
CI smoke-build outputs and are not guaranteed to be Developer ID signed or
notarized.

## macOS Signing Requirements

Public macOS downloads must be signed with a Developer ID Application
certificate and notarized by Apple. Otherwise macOS Gatekeeper can show errors
such as `"Agentwerke Desktop.app" is damaged and cannot be opened`.

Configure these GitHub repository secrets before running the release workflow:

- `MAC_CSC_LINK`: base64-encoded `.p12` export for the Developer ID Application
  certificate.
- `MAC_CSC_KEY_PASSWORD`: password for the `.p12` export.
- `APPLE_TEAM_ID`: Apple Developer Team ID.

For notarization, prefer App Store Connect API credentials:

- `APPLE_API_KEY`: base64-encoded contents of the `.p8` API key file.
- `APPLE_API_KEY_ID`: App Store Connect API key ID.
- `APPLE_API_ISSUER`: App Store Connect issuer ID.

Alternatively, use Apple ID notarization credentials:

- `APPLE_ID`: Apple ID email.
- `APPLE_APP_SPECIFIC_PASSWORD`: app-specific password for that Apple ID.

## Unsigned macOS Builds

If Apple signing credentials are not available yet, run the release workflow
with `macos_signing` set to `unsigned`. The workflow will publish macOS DMG/zip
artifacts without Developer ID signing or notarization and will add a warning to
the GitHub release notes.

Unsigned macOS builds are useful for internal testing, but they are not a good
public distribution format. macOS Gatekeeper may block them or report that the
app is damaged.

## Release Steps

1. Confirm `main` is green.
2. Run the `Release Desktop App` workflow from GitHub Actions.
3. Enter the next tag, for example `v0.1.1`.
4. Choose `macos_signing`:
   - `unsigned` when Apple signing credentials are not available yet.
   - `signed` for public macOS releases after the Apple secrets are configured.
5. For signed macOS releases, wait for the verification step to pass. It runs
   `codesign`, `spctl`, and `stapler` before publishing the release.
6. Download the new release DMG from GitHub and open it on a clean macOS
   machine.
