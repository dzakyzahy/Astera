# ASTERA Deployment

## Local preview

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production verification

```bash
npm run check
```

Do not deploy when either command fails.

## GitHub and Emergent handoff

The canonical repository is the private GitHub repository `dzakyzahy/Astera` on branch `main`. Import that repository into Emergent, keep the repository private, and configure platform secrets through the deployment settings.

The prototype has no required runtime secrets because its API and in-memory store contain synthetic contest data only. Production integrations will need environment-specific credentials and should fail closed when those values are absent.

## Sites-compatible deployment

The project includes `.openai/hosting.json`, which identifies its Sites project. A deployment package must be created from the same committed source revision that is pushed to the hosting source repository. Deploy privately first, validate the golden workflow, then change visibility only by explicit project decision.

## Release checklist

- clean working tree and reviewed commit;
- lint and production build pass;
- no secrets or personal data in source or generated assets;
- Open Graph metadata points to the deployed origin;
- incident, quote, approval, dispatch, reset, search, and notification flows work;
- desktop and mobile layouts remain usable;
- accessibility and reduced-motion checks pass;
- synthetic-data disclosure is visible;
- rollback target and owner are documented.

## Rollback

Keep the previous known-good deployment version available. If a release breaks the golden workflow or exposes data incorrectly, stop promotion, restore the previous version, preserve logs, and open an incident review before retrying.
