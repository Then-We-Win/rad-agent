# A Quasar Demo App featuring rad-console
This is a Quasar 2 / Vue 3 example of how to get rad-console running in your app.

## Installing rad-console into your Quasar app

To use rad-console in Quasar, add `src/boot/rad-console.js` and then add a reference to that to `quasar.config.js` as that's it, just configure the console in the boot file.

## Step 1 - Add rad-console

```bash
npm install rad-console
```

## Step 2 - Copy the boot file

Copy the demo boot file to `src/boot/rad-console.js` in your project.

## Step 3 - Add the boot file to Quasar

Add `rad-console` to the `boot` array in  `quasar.config.js`.

You can now use the console!

## Optional Step 4 - Add UI console

Somewhere in your app you need to add the UI console component if you want to use it.


Since this gives people access to the app system, you'd probably only want to do this in dev, or if you're giving people access to debugging abilites, etc.

For Quasar, probably the best place to put the console if you want it on every page is in `src/layouts/MainLayout`, however, if you only
want the console to work on a certain page, just put it on that page!

Also keep in mind you can use things like `v-if` to optionally add the console or not depending on any criteria you'd like.

## Want a quick demo?

This is a fully working Quasar project. Check it out for all kinds of use cases.

### Install the dmeo

Just a standard install
```bash
npm install
```
### Run the demo

Start a live-Vite dev environment
```bash
npm run dev
```
### Build the demo
Your build files will be in /build/spa (quasar's default)
```bash
npm run build
```