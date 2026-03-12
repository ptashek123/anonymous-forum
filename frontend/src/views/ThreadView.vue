<template>
  <div>
    <div class="nav">
      <router-link to="/">← Лента</router-link> |
      <router-link to="/catalog">Каталог</router-link>
    </div>

    <p v-if="loading" class="msg">Загрузка…</p>
    <p v-else-if="!thread" class="msg">Тред не найден.</p>

    <template v-else>
      <h2 class="t-title">
        {{ thread.subject || '(без темы)' }}
        <span class="count">{{ posts.length }} постов</span>
      </h2>

      <!-- posts передаётся целиком для разрешения >>ID в попапах -->
      <PostCard
        v-for="p in posts"
        :key="p.id"
        :post="p"
        :posts="posts"
      />

      <PostForm :isOp="false" :threadId="thread.id" @submitted="load" />
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getThread } from '../api/index.js';
import PostCard from '../components/PostCard.vue';
import PostForm from '../components/PostForm.vue';

const route   = useRoute();
const thread  = ref(null);
const posts   = ref([]);
const loading = ref(false);

async function load() {
  loading.value = true;
  try {
    const { data } = await getThread(route.params.id);
    thread.value = data.thread;
    posts.value  = data.posts;
  } catch {
    thread.value = null;
  } finally {
    loading.value = false;
  }
}
onMounted(load);
</script>

<style scoped>
.nav { margin-bottom: 12px; font-size: 13px; }
.nav a { color: #0f0c5d; }
.t-title { color: #0f0c5d; margin-bottom: 12px; font-size: 18px; }
.count { font-size: 13px; font-weight: normal; color: #888; margin-left: 8px; }
.msg { padding: 24px; text-align: center; color: #666; }
</style>
