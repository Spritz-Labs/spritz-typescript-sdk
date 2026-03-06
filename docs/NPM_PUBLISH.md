# Publishing @spritzlabs/sdk to npm

## 1. Create the npm organization (one-time)

The scope `@spritzlabs` must exist before you can publish.

1. Go to **https://www.npmjs.com** and sign in.
2. Click your profile avatar (top right) → **Add Organization** (or go to https://www.npmjs.com/org/create).
3. Choose **Create a free organization**.
4. Set the organization name to **spritzlabs** (this becomes the scope `@spritzlabs`).
5. Complete the flow. You’ll be the owner and can publish packages under `@spritzlabs`.

## 2. Publish the package

From the package root:

```bash
npm publish --access public
```

`prepublishOnly` will run the build automatically. Use `--access public` so the scoped package is public.

## If you can’t use the org scope

To publish under your user scope instead (e.g. `@your-npm-username/spritz-sdk`), change `name` in `package.json` to `@YOUR_NPM_USERNAME/spritz-sdk` and run `npm publish --access public`.
