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
      <v-radio label="영어 -> 한글" value="toKorean"></v-radio>
      <v-radio label="한글 -> 영어" value="toEnglish"></v-radio>
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

    <div>
      <!-- 건의함 카드 -->
      <v-card
          class="mx-auto pa-4"
          max-width="500"
          elevation="3"
          @click="dialog = true"
          style="cursor: pointer;"
      >
        <v-row align="center" no-gutters>
          <v-col cols="auto">
            <v-img
                src="../../public/feedback_button.png"
                alt="서비스 건의함"
                width="80"
                height="80"
                class="me-4"
                cover
            />
          </v-col>

          <v-col>
            <h4 style="margin: 0; font-weight: 400; color: gray">
              <span style="font-size: 14px">(웬만하면 반영되는)</span> 서비스 건의함
            </h4>
          </v-col>
        </v-row>
      </v-card>

      <!-- 건의사항 입력 모달 -->
      <v-dialog v-model="dialog" max-width="600">
        <v-card>
          <v-card-title class="text-h6">건의사항을 입력해주세요 ✨</v-card-title>
          <v-card-text>
            <v-textarea
                v-model="suggestionText"
                label="건의 내용"
                rows="5"
                auto-grow
                outlined
                clearable
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text @click="dialog = false">취소</v-btn>
            <v-btn color="primary" @click="submitSuggestion">제출</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>

    <v-snackbar
        :timeout="1000"
        v-model="snackbarFlag"
        color="indigo"
        variant="tonal"
        rounded="pill"
    >
      복사 완료
    </v-snackbar>
    <v-snackbar
        :timeout="2000"
        v-model="suggestionSnackbarFlag"
        color="success"
        variant="tonal"
        rounded="pill"
    >
      건의사항이 제출되었습니다! 감사합니다 ✨
    </v-snackbar>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { englishToKorean, koreanToEnglish } from '../utils/converter';
import * as emailjs from "@emailjs/browser";

export default defineComponent({
  name: "HomeView",

  setup() {
    const mappingTarget = ref("toKorean");
    const inputText = ref("");
    const snackbarFlag = ref(false);
    const dialog = ref(false);
    const suggestionText = ref("");
    const suggestionSnackbarFlag = ref(false);
    emailjs.init("user_FRGW9AFFOhL8ApQvS3xev");

    const copy = () => {
      const el = document.createElement("textarea");
      el.value = convertInputText.value;
      el.style.position = "fixed";
      el.style.top = "-9999px";
      el.style.left = "-9999px";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      snackbarFlag.value = true;
    };

    const submitSuggestion = () => {
      if (suggestionText.value.trim()) {
        console.log('제출된 건의사항:', suggestionText.value);
        sendMail('한영타 변환기 건의사항', suggestionText.value);

        suggestionText.value = '';
        dialog.value = false;
        suggestionSnackbarFlag.value = true; // 스낵바 띄우기!
      } else {
        alert('건의 내용을 입력해주세요.');
      }
    };

    function sendMail(nickname, comment) {
      let templateParams = {
        nickname: nickname,
        comment: comment,
      };
      emailjs
          .send("service_2syktss", "template_4nk0rnw", templateParams)
    }

    const convertInputText = computed(() => {
      if (mappingTarget.value === "toEnglish") return koreanToEnglish(inputText.value);
      return englishToKorean(inputText.value);
    });

    return {
      mappingTarget,
      inputText,
      snackbarFlag,
      dialog,
      suggestionText,
      convertInputText,
      copy,
      submitSuggestion,
      suggestionSnackbarFlag
    };
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

small {
  color: #000000DE;
}
</style>
