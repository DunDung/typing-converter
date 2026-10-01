<template>
  <v-container class="converter-shell" :class="{ 'native-shell': nativeApp, 'compact-shell': nativeApp && viewportHeight < 480 }" :style="nativeApp ? { height: viewportHeight + 'px' } : undefined">
    <header v-if="!nativeApp" class="page-header">
      <h1>한영타변환기</h1>
      <p>잘못 입력한 한/영타를 바로 바꾸세요.</p>
    </header>
    <div class="direction-control" role="group" aria-label="변환 방향">
      <button type="button" :class="{ selected: mappingTarget === 'toKorean' }" :aria-pressed="mappingTarget === 'toKorean'" @click="mappingTarget = 'toKorean'">영타 → 한글</button>
      <button type="button" :class="{ selected: mappingTarget === 'toEnglish' }" :aria-pressed="mappingTarget === 'toEnglish'" @click="mappingTarget = 'toEnglish'">한타 → 영문</button>
    </div>
    <section class="text-panel input-panel" aria-label="변환할 문장">
      <div class="panel-heading"><label for="converter-input">입력</label>
        <button type="button" class="text-button" :disabled="!inputText" @click="clearInput">비우기</button>
      </div>
      <textarea id="converter-input" class="converter-textarea" v-model="inputText" rows="4" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" :placeholder="mappingTarget === 'toKorean' ? '예: dkssudgktpdy → 안녕하세요' : '예: ㅗㄷㅣㅣㅐ → hello'"
        aria-label="변환할 문장 입력"></textarea>
    </section>
    <section class="text-panel result-panel" aria-label="변환 결과">
      <div class="panel-heading"><label for="converter-result">변환 결과</label><span class="result-hint">입력하면 바로 변환돼요</span></div>
      <textarea id="converter-result" class="converter-textarea" :value="convertInputText" readonly rows="4" placeholder="변환 결과가 여기에 표시됩니다" aria-label="변환 결과"></textarea>
      <v-btn class="copy-button" color="indigo-darken-1" height="44" prepend-icon="mdi-content-copy" elevation="0" :disabled="!convertInputText || copying" :loading="copying" @click="copy">결과 복사</v-btn>
    </section>
    <div v-if="!headerFeedback" class="feedback-link">
      <v-btn class="feedback-button" variant="text" color="grey-darken-2" height="44" @click="dialog = true">의견 보내기</v-btn>
    </div>
    <v-dialog v-model="updateDialog" max-width="400" aria-labelledby="update-title">
      <v-card rounded="xl">
        <v-card-title id="update-title" class="text-h6 pt-5 px-6">새 버전으로 업데이트해 주세요</v-card-title>
        <v-card-text>더 편해진 입력 화면과 광고 제거 구매 기능을 이용할 수 있어요.</v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" color="grey-darken-2" @click="updateDialog = false">나중에</v-btn>
          <v-btn color="indigo-darken-1" variant="flat" :href="updateStoreUrl" @click="updateDialog = false">업데이트</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
      <!-- 건의사항 입력 모달 -->
      <v-dialog v-model="dialog" max-width="480">
        <v-card rounded="xl">
          <v-card-title class="text-h6 pt-5 px-6">의견 보내기</v-card-title>
          <v-card-text>
            <v-textarea
                v-model="suggestionText"
                label="개선할 점이나 불편한 점을 알려주세요"
                rows="5"
                auto-grow
                variant="outlined"
                color="indigo-darken-1"
                hide-details
            />
            <p class="text-caption mt-3">보내신 의견은 개발자에게 전달돼요. <a href="./privacy.html" target="_blank" rel="noopener">개인정보 처리방침</a></p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn text :disabled="sendingSuggestion" @click="dialog = false">취소</v-btn>
            <v-btn color="indigo-darken-1" :disabled="!suggestionText.trim() || sendingSuggestion" :loading="sendingSuggestion" @click="submitSuggestion">보내기</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <v-snackbar
        :timeout="1000"
        v-model="snackbarFlag"
        color="indigo"
        variant="tonal"
        rounded="pill"
    >
      {{ copyMessage }}
    </v-snackbar>
    <v-snackbar
        :timeout="2000"
        v-model="suggestionSnackbarFlag"
        :color="suggestionFailed ? 'error' : 'success'"
        variant="tonal"
        rounded="pill"
    >
      {{ suggestionFailed ? '전송하지 못했어요. 잠시 후 다시 시도해 주세요.' : '의견을 보내주셔서 감사합니다!' }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { englishToKorean, koreanToEnglish } from '../utils/converter';
import { copyText } from "../utils/clipboard";
import { connectFeedback, announceConverterReady } from "../utils/nativeFeedback.mjs";
import { legacyPlatform, claimReminder, storeLinks } from "../utils/updateReminder.mjs";
import * as emailjs from "@emailjs/browser";

export default defineComponent({
  name: "HomeView",

  setup() {
    const viewportHeight = ref(window.visualViewport?.height || window.innerHeight);
    const resizeViewport = () => {
      viewportHeight.value = Math.round(Math.min(window.innerHeight, window.visualViewport?.height || window.innerHeight));
    };
    const updateDialog = ref(false);
    const legacy = legacyPlatform({ search: window.location.search, userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints });
    const updateStoreUrl = legacy ? storeLinks[legacy] : '';
    const checkUpdateReminder = () => {
      if (!legacy || document.visibilityState === 'hidden' || updateDialog.value || dialog.value || inputText.value || document.activeElement?.tagName === 'TEXTAREA') return;
      try { updateDialog.value = claimReminder(window.localStorage); } catch { /* storage unavailable */ }
    };
    const headerFeedback = ref(false);
    let disconnectFeedback;
    let stopReadyAnnouncement;
    onMounted(async () => {
      window.visualViewport?.addEventListener("resize", resizeViewport);
      window.addEventListener("resize", resizeViewport);
      resizeViewport();
      disconnectFeedback = connectFeedback(window, {
        onHeader: () => { headerFeedback.value = true; },
        onOpen: () => { dialog.value = true; },
      });
      await nextTick();
      stopReadyAnnouncement = announceConverterReady(window);
      checkUpdateReminder();
      document.addEventListener("visibilitychange", checkUpdateReminder);
    });
    onBeforeUnmount(() => {
      document.removeEventListener("visibilitychange", checkUpdateReminder);
      disconnectFeedback?.();
      stopReadyAnnouncement?.();
      window.visualViewport?.removeEventListener("resize", resizeViewport);
      window.removeEventListener("resize", resizeViewport);
    });
    const mappingTarget = ref("toKorean");
    const inputText = ref("");
    const snackbarFlag = ref(false);
    const copyMessage = ref("");
    const copying = ref(false);
    const nativeApp = new URLSearchParams(window.location.search).get("native") === "1";
    const clearInput = () => { inputText.value = ""; document.getElementById("converter-input")?.focus(); };
    const dialog = ref(false);
    const suggestionText = ref("");
    const suggestionSnackbarFlag = ref(false);
    const sendingSuggestion = ref(false);
    const suggestionFailed = ref(false);
    emailjs.init("user_FRGW9AFFOhL8ApQvS3xev");

    const copy = async () => {
      if (!convertInputText.value || copying.value) return;
      copying.value = true;
      const text = convertInputText.value;
      try {
        await copyText(text);
        copyMessage.value = "복사 완료! 원하는 곳에 붙여넣으세요.";
      } catch {
        copyMessage.value = "복사하지 못했어요. 결과를 길게 눌러 복사해 주세요.";
      } finally {
        copying.value = false;
        snackbarFlag.value = true;
      }
    };

    const submitSuggestion = async () => {
      if (!suggestionText.value.trim() || sendingSuggestion.value) return;
      sendingSuggestion.value = true;
      suggestionFailed.value = false;
      try {
        await sendMail('한영타 변환기 건의사항', suggestionText.value);
        suggestionText.value = '';
        dialog.value = false;
      } catch {
        suggestionFailed.value = true;
      } finally {
        sendingSuggestion.value = false;
        suggestionSnackbarFlag.value = true;
      }
    };

    function sendMail(nickname, comment) {
      let templateParams = {
        nickname: nickname,
        comment: comment,
      };
      return emailjs
          .send("service_2syktss", "template_4nk0rnw", templateParams)
    }

    const convertInputText = computed(() => {
      if (mappingTarget.value === "toEnglish") return koreanToEnglish(inputText.value || "");
      return englishToKorean(inputText.value || "");
    });

    return {
      updateDialog, updateStoreUrl, viewportHeight, headerFeedback, nativeApp, clearInput, copyMessage, copying,
      mappingTarget,
      inputText,
      snackbarFlag,
      dialog,
      suggestionText,
      convertInputText,
      copy,
      submitSuggestion,
      suggestionSnackbarFlag, sendingSuggestion, suggestionFailed
    };
  },
});
</script>

<style scoped>
.converter-shell { max-width: 640px; padding: 16px; color: #18243b; }
.native-shell { height: 100vh; height: 100dvh; min-height: 420px; display: flex; flex-direction: column; }
.native-shell > .text-panel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.native-shell > .input-panel { flex: 1.1; }
.converter-textarea { display: block; width: 100%; flex: 1; min-height: 72px; margin-top: 4px; padding: 4px 0; resize: none; border: 0; outline: none; color: #18243b; font: inherit; font-size: 16px; line-height: 1.65; background: transparent; overflow-y: auto; }
.converter-textarea::placeholder { color: #778297; opacity: 1; }
.text-panel:focus-within { border-color: #9aa9df; }
.page-header { margin: 8px 0 24px; }
h1 { font-size: 26px; font-weight: 750; letter-spacing: -1px; }
.page-header p { color: #64748b; font-size: 14px; margin-top: 6px; }
.direction-control { display: flex; padding: 4px; border-radius: 12px; background: #e9edf6; margin-bottom: 12px; gap: 4px; }
.direction-control button { flex: 1; min-height: 40px; border-radius: 9px; color: #52617b; font-size: 15px; font-weight: 600; }
.direction-control button.selected { background: #fff; color: #334ec6; box-shadow: 0 1px 4px #18243b12; }
button:focus-visible { outline: 3px solid #8097f0; outline-offset: 2px; }
.text-panel { padding: 12px 16px; background: white; border: 1px solid #e1e7f1; border-radius: 16px; margin-bottom: 12px; }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px; font-size: 14px; font-weight: 600; }
.text-button { padding: 8px; min-height: 36px; color: #536786; font-size: 13px; }
.text-button:disabled { opacity: .4; }
.result-hint { color: #64748b; font-size: 12px; font-weight: 400; }
.result-panel { background: #fdfdff; }
.copy-button { display: flex; width: fit-content; min-width: 124px; flex: 0 0 auto; align-self: flex-end; margin: 12px 0 0 auto; border-radius: 10px; letter-spacing: 0; font-size: 14px; }
:deep(textarea) { font-size: 16px; line-height: 1.6; }
.feedback-link { flex: 0 0 auto; text-align: center; margin: 0; }
.feedback-button { padding: 0 18px; border-radius: 8px; font-size: 14px; font-weight: 500; letter-spacing: 0; }
  .native-shell.compact-shell { min-height: 360px; padding: 8px 12px; }
  .native-shell.compact-shell .direction-control { margin-bottom: 8px; }
  .native-shell.compact-shell .direction-control button { min-height: 36px; }
  .native-shell.compact-shell .text-panel { min-height: 116px; padding: 8px 12px; margin-bottom: 8px; }
  .native-shell.compact-shell .result-panel { min-height: 154px; }
  .native-shell.compact-shell .panel-heading { min-height: 32px; }
  .native-shell.compact-shell .text-button { min-height: 32px; padding: 6px 8px; }
  .native-shell.compact-shell .converter-textarea { min-height: 48px; margin-top: 0; line-height: 1.5; }
  .native-shell.compact-shell .copy-button { margin-top: 8px; }
</style>
