<template>
  <v-container class="pb-0">
    <h1>한/영 변환기</h1>
  </v-container>
  <v-container fluid>
    <v-radio-group
        v-model="mappingTarget"
        inline
        hide-details
    >
      <v-radio
          label="영어 -> 한글"
          value="toKorean"
      ></v-radio>
      <v-radio
          label="한글 -> 영어"
          value="toEnglish"
      ></v-radio>
    </v-radio-group>
    <v-textarea
        clearable
        clear-icon="mdi-trash-can-outline"
        rows="10"
        auto-grow
        label="변환할 문장을 입력해주세요."
        v-model="inputText"
    ></v-textarea>
    <v-textarea
        readonly
        rows="10"
        append-inner-icon="mdi-content-copy"
        @click:append-inner="copy"
        label="변환 결과"
        auto-grow
        v-model="convertInputText"
    ></v-textarea>
  </v-container>
</template>

<script>
import {defineComponent} from "vue";
import {englishToKorean, koreanToEnglish} from '../utils/converter';

export default defineComponent({
  name: "HomeView",

  data: () => ({
    mappingTarget: "toKorean",
    inputText: "",
  }),

  computed: {
    convertInputText() {
      if (this.mappingTarget === "toEnglish") return koreanToEnglish(this.inputText);
      return englishToKorean(this.inputText);
    },
  },
  methods: {
    copy(event) {
      const el = document.createElement("textarea");
      el.value = this.convertInputText;
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
  },
});
</script>
<style scoped>
@font-face {
  font-family: 'LINESeedKR-Bd';
  src: url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_11-01@1.0/LINESeedKR-Bd.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
}

* {
  font-family: 'LINESeedKR-Bd';
}

h1 {
  text-align: center;
  letter-spacing: 2px;
}
</style>