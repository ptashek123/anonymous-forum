<template>
  <div>
    <div class="mode-bar">
      <router-link to="/">Лента</router-link> |
      <span class="cur">Каталог</span>
    </div>

    <p v-if="loading" class="msg">Загрузка…</p>

    <template v-else>
      <!-- Задача 6.2: сетка миниатюр -->
      <div class="grid">
        <router-link
          v-for="t in threads"
          :key="t.id"
          :to="`/thread/${t.id}`"
          class="card"
        >
          <div class="card-img">
            <img v-if="t.thumbnail_path" :src="'/' + t.thumbnail_path" alt="thumb" />
            <div v-else class="no-img">нет<br>фото</div>
          </div>
          <div class="card-info">
            <div class="card-subject">{{ t.subject || '(без темы)' }}</div>
            <div class="card-stat">{{ t.reply_count }} ответов</div>
            <div class="card-preview">{{ cut(t.content, 90) }}</div>
          </div>
        </router-link>
      </div>
      <p v-if="!threads.length" class="msg">Тредов нет.</p>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getCatalog } from '../api/index.js';

const threads = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try { threads.value = (await getCatalog()).data; }
  finally { loading.value = false; }
}
onMounted(load);

const cut = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;
</script>

<style scoped>
.mode-bar { margin-bottom: 14px; font-size: 13px; }
.mode-bar a { color: #0f0c5d; }
.cur { font-weight: bold; }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.card {
  background: #f0e0d6;
  border: 1px solid #d9bfb7;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  transition: border-color .15s, box-shadow .15s;
}
.card:hover { border-color: #af0a0f; box-shadow: 0 2px 6px rgba(0,0,0,.15); }

.card-img {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: #e0d0c8;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-img img { width: 100%; height: 100%; object-fit: cover; }
.no-img { color: #aaa; font-size: 12px; text-align: center; line-height: 1.4; }

.card-info { padding: 5px 6px; }
.card-subject {
  font-weight: bold; font-size: 12px; color: #0f0c5d;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 2px;
}
.card-stat   { font-size: 11px; color: #888; margin-bottom: 2px; }
.card-preview{ font-size: 11px; color: #555; word-break: break-word; }

.msg { padding: 24px; text-align: center; color: #666; }
</style>
