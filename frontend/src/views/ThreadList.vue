<template>
  <div>
    <div class="mode-bar">
      <span class="cur">Лента</span> |
      <router-link to="/catalog">Каталог</router-link>
    </div>

    <PostForm :isOp="true" @submitted="load" />

    <p v-if="loading" class="msg">Загрузка…</p>

    <template v-else>
      <article v-for="t in threads" :key="t.id" class="thread-row">
        <div v-if="t.thumbnail_path" class="t-thumb">
          <router-link :to="`/thread/${t.id}`">
            <img :src="'/' + t.thumbnail_path" alt="thumb" />
          </router-link>
        </div>
        <div class="t-body">
          <div class="t-title">
            <router-link :to="`/thread/${t.id}`">
              {{ t.subject || '(без темы)' }}
            </router-link>
          </div>
          <div class="t-meta">
            <span class="author">{{ t.author_name }}</span>
            <span v-if="t.tripcode" class="tripcode">{{ t.tripcode }}</span>
            <span class="date">{{ fmt(t.created_at) }}</span>
            <span class="replies">{{ t.reply_count }} ответов</span>
          </div>
          <div class="t-preview">{{ cut(t.content, 260) }}</div>
          <div class="t-bump">Bump: {{ fmt(t.last_bump) }}</div>
        </div>
      </article>
      <p v-if="!threads.length" class="msg">Тредов пока нет. Создайте первый!</p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getThreads } from '../api/index.js';
import PostForm from '../components/PostForm.vue';

const threads = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try { threads.value = (await getThreads()).data; }
  finally { loading.value = false; }
}

onMounted(load);
const fmt = ts => new Date(ts).toLocaleString('ru-RU');
const cut = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;
</script>

<style scoped>
.mode-bar { margin-bottom: 12px; font-size: 13px; }
.mode-bar a { color: #0f0c5d; }
.cur { font-weight: bold; }
.thread-row {
  background: #f0e0d6;
  border: 1px solid #d9bfb7;
  padding: 10px;
  margin-bottom: 10px;
  display: flex;
  gap: 12px;
}
.t-thumb img { width: 150px; height: 150px; object-fit: cover; display: block; }
.t-title a { font-size: 15px; font-weight: bold; color: #0f0c5d; text-decoration: none; }
.t-title a:hover { text-decoration: underline; }
.t-meta { margin-top: 3px; font-size: 12px; }
.author  { color: #117743; font-weight: bold; margin-right: 5px; }
.tripcode{ color: #117743; margin-right: 5px; }
.date    { color: #888; margin-right: 8px; }
.replies { color: #555; }
.t-preview { margin-top: 5px; font-size: 13px; white-space: pre-wrap; }
.t-bump    { margin-top: 3px; font-size: 11px; color: #999; }
.msg { padding: 20px; text-align: center; color: #666; }
</style>
