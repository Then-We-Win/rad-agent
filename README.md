# RAD Agent
Rad agent is an agentic Rapid Application Development system designed to help you make software faster without legacy ideas or tools.

The main idea is you don't need an IDE to develop anymore; you just stub out an app with RAD agent, and inject your agentic feelers however you'd like.

By default, it comes with a UI console, so you can type or talk with it inside your app itself.

# Installation

```bash
npm install rad-agent
```


# Specific installation

## Quasar

To use rad-agent in Quasar, add `src/boot/rad-agent.js` and then add a reference to that to `quasar.config.js` as that's it, just configure the console in the boot file.

**Step 1 - Add rad-agent**

```bash
npm install rad-agent
```

**Step 2 - Copy the boot file**

Copy the demo boot file to `src/boot/rad-agent.js` in your project.

**Step 3 - Add the boot file to Quasar**

Add `rad-agent` to the `boot` array in  `quasar.config.js`.

You can now use the console!

**Optional Step 4 - Add UI console**

Somewhere in your app you need to add the UI console component if you want to use it.

Since this gives people access to the app system, you'd probably only want to do this in dev, or if you're giving people access to debugging abilites, etc.

For Quasar, probably the best place to put the console if you want it on every page is in `src/layouts/MainLayout`, however, if you only
want the console to work on a certain page, just put it on that page!

Also keep in mind you can use things like `v-if` to optionally add the console or not depending on any criteria you'd like.

# Want a quick demo?

We made a fully working Quasar project. Check it out for all kinds of use cases.

## Install the demo

Just a standard install
```bash
cd examples/quasar
npm install
```
## Run the demo

Start a live-Vite dev environment
```bash
npm run dev
```
## Build the demo
Your build files will be in /build/spa (quasar's default)
```bash
npm run build
```