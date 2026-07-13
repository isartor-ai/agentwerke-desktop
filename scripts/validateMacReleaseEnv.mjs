const requiredSigningVars = ['CSC_LINK', 'CSC_KEY_PASSWORD', 'APPLE_TEAM_ID'];
const apiKeyVars = ['APPLE_API_KEY', 'APPLE_API_KEY_ID', 'APPLE_API_ISSUER'];
const appleIdVars = ['APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD'];

function hasValue(name) {
  return Boolean(process.env[name]?.trim());
}

function requireAll(names, message) {
  let isValid = true;

  for (const name of names) {
    if (!hasValue(name)) {
      console.error(`${message}: missing ${name}`);
      isValid = false;
    }
  }

  return isValid;
}

let isValid = requireAll(
  requiredSigningVars,
  'Signed macOS releases require Apple Developer ID signing credentials'
);

const hasAnyApiKeyVar = apiKeyVars.some(hasValue);
const hasAnyAppleIdVar = appleIdVars.some(hasValue);

if (hasAnyApiKeyVar) {
  isValid = requireAll(apiKeyVars, 'App Store Connect API notarization credentials are incomplete') && isValid;
}

if (hasAnyAppleIdVar) {
  isValid = requireAll(appleIdVars, 'Apple ID notarization credentials are incomplete') && isValid;
}

if (!hasAnyApiKeyVar && !hasAnyAppleIdVar) {
  console.error(
    'Signed macOS releases require notarization credentials: set APPLE_API_KEY, APPLE_API_KEY_ID, and APPLE_API_ISSUER, or set APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD.'
  );
  isValid = false;
}

if (!isValid) {
  process.exit(1);
}
