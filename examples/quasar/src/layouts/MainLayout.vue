<template>
  <q-layout view="lHh Lpr lFf">
    <console/>
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title>
          A Demo Application
        </q-toolbar-title>
        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
export default { name: 'MainLayout' }
</script>
