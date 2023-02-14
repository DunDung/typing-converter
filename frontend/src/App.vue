<template>
  <v-app id="app">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",

  data: () => ({
    //
  }),
};
</script>
<style>
#app {
  width: 70%;
  margin: 0 auto;
}

@media screen and (max-width: 960px) {
  #app {
    width: 100%;
  }
}
</style>
