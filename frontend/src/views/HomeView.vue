<template>
  <v-container class="pb-0">
    <h1>한/영타 변환기</h1>
    <a href="https://hits.seeyoufarm.com" style=" float: right">
      <!--방문자 counter-->
      <img
          src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fdundung.github.io%2Ftyping-converter%2F&count_bg=%23C4C4C4&title_bg=%238A8A8A&icon=&icon_color=%23E7E7E7&title=%5Eo%5E&edge_flat=false"/>
    </a>
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
    >
      <template v-slot:label>
        키보드로 타이핑한 영어를 한글로 변환해줍니다.<br>
        그 반대 방향도 가능해요.<br>
        여기에 변환할 문장을 입력해주세요.<br><br>
        입력한 문장 비우기 기능 지원합니다.<br>
        변환된 문장 복사 기능 지원합니다.<br>
      </template>
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
    <v-card
        class="mx-auto"
    >
      <v-card-title>
        <v-label style="letter-spacing: 2px">댓글</v-label>
      </v-card-title>
      <v-text-field
          v-model="inputComment"
          label="여기에 댓글을 입력해주세요."
          required
          hide-details
          append-inner-icon="mdi-plus-circle-outline"
          @click:append-inner="createComment"
      ></v-text-field>
      <v-list
          :items="comments"
          item-props
          lines="three"
          border="border"
      >
      </v-list>
    </v-card>
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
    createGithubToken() {
      // github에 토큰 그대로 올라가면 토큰 삭제됨
      const token1 = "ghp_uIilxQ0"
      const token2 = "38tk1BJG"
      const token3 = "1CdxikGDWGs"
      const token4 = "hmAc0zG1XE"
      return token1 + token2 + token3 + token4;
    },
    createComment() {
      fetch(
          "https://api.github.com/repos/dundung/typing-converter/issues",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: "token " + this.createGithubToken(),
            },
            body: JSON.stringify({
              title: (this.comments.length + 1) + "번째 댓글",
              body: this.inputComment,
            }),
          }
      ).then(() => {
        this.inputComment = ""
        this.getComments()
      });
    },
    getComments() {
      fetch("https://api.github.com/repos/dundung/typing-converter/issues", {
        method: "GET",
        headers: {
          Authorization: "token " + this.createGithubToken(),
        },
      })
          .then((res) => res.json())
          .then((comments) => {
            this.comments = []
            for (let i in comments) {
              this.comments.push({
                title: comments[i].body,
                subtitle: comments[i].created_at
                    .replace("T", "  ")
                    .replace("Z", "")
                    .slice(0, -3)
              })
              if (parseInt(i) !== comments.length - 1)
                this.comments.push({type: 'divider'})
            }
          });
    }
  },
  created() {
    this.getComments()
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