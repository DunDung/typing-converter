<template>
  <v-container class="pb-0">
    <h1>한/영타 변환기</h1>
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
        v-model="inputText"
        placeholder="키보드로 타이핑한 영어를 한글로 변환해줍니다.
그 반대 방향도 가능해요.
여기에 변환할 문장을 입력해주세요.

입력한 문장 비우기 기능 지원합니다.
변환된 문장 복사 기능 지원합니다."
    >
    </v-textarea>
    <v-textarea
        readonly
        rows="10"
        append-inner-icon="mdi-content-copy"
        @click:append-inner="copy"
        label="변환 결과"
        auto-grow
        v-model="convertInputText"
    ></v-textarea>
    <v-snackbar
        :timeout="1000"
        v-model="snackbarFlag"
        color="indigo"
        variant="tonal"
        rounded="pill"
    >
      복사 완료
    </v-snackbar>
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
    snackbarFlag: false,
    inputComment: "",
    comments: [],
  }),

  computed: {
    convertInputText() {
      if (this.mappingTarget === "toEnglish") return koreanToEnglish(this.inputText);
      return englishToKorean(this.inputText);
    },
  },
  methods: {
    copy() {
      const el = document.createElement("textarea");
      el.value = this.convertInputText;
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      this.snackbarFlag = true
    },
  }
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

small {
  color: #000000DE;
}
</style>