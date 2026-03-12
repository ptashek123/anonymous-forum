<template>
  <div class="post-form">
    <h3>{{ isOp ? 'Создать тред' : 'Ответить' }}</h3>
    <form @submit.prevent="submit">

      <div v-if="isOp" class="field">
        <label>Тема</label>
        <input v-model="subject" type="text" placeholder="Необязательно" maxlength="255" />
      </div>

      <div class="field">
        <label>
          Имя
          <span class="hint">
            — пустое: Anonymous &nbsp;|&nbsp;
            <code>Имя#пароль</code> → трипкод
          </span>
        </label>
        <input v-model="author" type="text" placeholder="Anonymous" maxlength="64" />
      </div>

      <div class="field">
        <label>Сообщение <span class="req">*</span></label>
        <textarea v-model="content" rows="5" required maxlength="2000" />
      </div>

      <div class="field">
        <label>Файл <span class="hint">jpg / png / gif / webp — до 4 МБ</span></label>
        <input type="file" accept="image/*" @change="onFile" />
      </div>

      <!-- Задача 8.1 -->
      <CaptchaField @update="onCaptcha" />

      <div class="actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Отправка…' : 'Отправить' }}
        </button>
        <span v-if="error" class="error">{{ error }}</span>
      </div>

    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { createThread, createPost } from '../api/index.js';
import CaptchaField from './CaptchaField.vue';

const props = defineProps({
  isOp:     { type: Boolean, default: false },
  threadId: { type: Number,  default: null  },
});
const emit = defineEmits(['submitted']);

const subject  = ref('');
const author   = ref('');
const content  = ref('');
const file     = ref(null);
const loading  = ref(false);
const error    = ref('');
const captcha  = ref({ token: '', answer: '' });

const onFile    = (e) => { file.value = e.target.files[0] || null; };
const onCaptcha = (v) => { captcha.value = v; };

async function submit() {
  error.value   = '';
  loading.value = true;
  try {
    const fd = new FormData();
    fd.append('content',        content.value);
    fd.append('author',         author.value);
    fd.append('captcha_token',  captcha.value.token);
    fd.append('captcha_answer', captcha.value.answer);
    if (props.isOp)  fd.append('subject', subject.value);
    if (file.value)  fd.append('file',    file.value);

    props.isOp
      ? await createThread(fd)
      : await createPost(props.threadId, fd);

    subject.value = '';
    author.value  = '';
    content.value = '';
    file.value    = null;
    emit('submitted');
  } catch (e) {
    error.value = e.response?.data?.error || 'Ошибка отправки';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.post-form { background: #d6daf0; border: 1px solid #b7c5d9; padding: 12px; margin-bottom: 16px; }
.post-form h3 { color: #0f0c5d; margin-bottom: 10px; }
.field { margin-bottom: 8px; }
.field label { display: block; font-weight: bold; margin-bottom: 2px; }
.field input,
.field textarea { width: 100%; border: 1px solid #aaa; padding: 4px 6px; font-size: 13px; }
.hint { font-weight: normal; color: #666; font-size: 12px; }
code { background: #e8e8e8; padding: 0 3px; border-radius: 2px; font-size: 11px; }
.req  { color: red; }
.actions { display: flex; align-items: center; gap: 12px; margin-top: 8px; }
button { background: #af0a0f; color: #fff; border: none; padding: 6px 18px; cursor: pointer; font-size: 13px; }
button:disabled { opacity: .6; cursor: default; }
.error { color: red; font-size: 13px; }
</style>
