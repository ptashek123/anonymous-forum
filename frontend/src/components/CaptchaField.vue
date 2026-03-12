<template>
  <div class="captcha-field">
    <label>Капча <span class="req">*</span></label>
    <div class="captcha-row">
      <span v-if="loading" class="captcha-loading">Загрузка…</span>
      <span v-else v-html="svg" />
      <button type="button" class="reload-btn" title="Обновить" @click="load">↺</button>
    </div>
    <input
      v-model="answer"
      type="text"
      placeholder="Введите символы с картинки"
      autocomplete="off"
      maxlength="8"
      @input="emit('update', { token, answer })"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCaptcha } from '../api/index.js';

const emit   = defineEmits(['update']);
const svg    = ref('');
const token  = ref('');
const answer = ref('');
const loading= ref(false);

async function load() {
  loading.value = true;
  answer.value  = '';
  try {
    const res = await getCaptcha();
    svg.value   = res.data.svg;
    token.value = res.data.token;
    emit('update', { token: token.value, answer: '' });
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>

<style scoped>
.captcha-field { margin-bottom: 8px; }
.captcha-field label { display: block; font-weight: bold; margin-bottom: 4px; }
.captcha-row  { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.captcha-loading { color: #888; font-style: italic; font-size: 12px; }
.reload-btn   { background: #ddd; border: 1px solid #aaa; padding: 2px 8px; cursor: pointer; font-size: 16px; line-height: 1; }
.reload-btn:hover { background: #ccc; }
input { border: 1px solid #aaa; padding: 4px 6px; width: 170px; font-family: monospace; letter-spacing: 2px; }
.req  { color: red; }
</style>
