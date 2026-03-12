<template>
  <div class="admin">

    <!-- 3.1: форма входа -->
    <div v-if="!token" class="login">
      <h2>Вход модератора</h2>
      <form @submit.prevent="login">
        <input v-model="pw" type="password" placeholder="Пароль" autofocus />
        <button type="submit">Войти</button>
        <span v-if="loginErr" class="err">{{ loginErr }}</span>
      </form>
    </div>

    <template v-else>
      <div class="panel-head">
        <h2>Панель модератора</h2>
        <button class="logout" @click="logout">Выйти</button>
      </div>

      <div class="tabs">
        <button :class="{ on: tab === 'posts' }" @click="switchTab('posts')">Посты</button>
        <button :class="{ on: tab === 'bans'  }" @click="switchTab('bans')">Бан-лист</button>
      </div>

      <!-- 3.2: таблица постов -->
      <div v-show="tab === 'posts'">
        <button class="refresh" @click="loadPosts">↺ Обновить</button>
        <p v-if="postsLoading" class="msg">Загрузка…</p>
        <table v-else class="tbl">
          <thead>
            <tr>
              <th>ID</th><th>Тред</th><th>Автор</th><th>IP</th>
              <th>Дата</th><th>Превью</th><th>Действия</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in posts" :key="p.id">
              <td>{{ p.id }}</td>
              <td>
                <router-link :to="`/thread/${p.thread_id}`" target="_blank">#{{ p.thread_id }}</router-link>
                <span v-if="p.is_op" class="op">OP</span>
              </td>
              <td>{{ p.author_name }}</td>
              <td class="mono">{{ p.ip_address }}</td>
              <td class="small">{{ fmt(p.created_at) }}</td>
              <td class="prev-cell">
                <img v-if="p.thumbnail_path" :src="'/' + p.thumbnail_path" class="athumb" />
                <span>{{ cut(p.content, 60) }}</span>
              </td>
              <td>
                <button class="act del" @click="deletePost(p.id)">Удалить</button>
                <button class="act ban" @click="prefillBan(p.ip_address)">Бан</button>
              </td>
            </tr>
            <tr v-if="!posts.length && !postsLoading">
              <td colspan="7" class="msg">Постов нет.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 3.3: бан-лист -->
      <div v-show="tab === 'bans'">
        <div class="ban-add">
          <h3>Добавить бан</h3>
          <form @submit.prevent="addBan" class="ban-form">
            <input v-model="banF.ip"      placeholder="IP-адрес" required />
            <input v-model="banF.reason"  placeholder="Причина (необязательно)" />
            <input v-model="banF.expires" type="datetime-local" title="Срок (пусто = навсегда)" />
            <button type="submit">Забанить</button>
          </form>
        </div>

        <button class="refresh" @click="loadBans">↺ Обновить</button>
        <p v-if="bansLoading" class="msg">Загрузка…</p>
        <table v-else class="tbl">
          <thead>
            <tr><th>ID</th><th>IP</th><th>Причина</th><th>Истекает</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="b in bans" :key="b.id">
              <td>{{ b.id }}</td>
              <td class="mono">{{ b.ip_address }}</td>
              <td>{{ b.reason || '—' }}</td>
              <td class="small">{{ b.expires_at ? fmt(b.expires_at) : 'Навсегда' }}</td>
              <td><button class="act del" @click="deleteBan(b.id)">Снять</button></td>
            </tr>
            <tr v-if="!bans.length && !bansLoading">
              <td colspan="5" class="msg">Банов нет.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import {
  adminLogin, adminGetPosts, adminDeletePost,
  adminGetBans, adminAddBan, adminDeleteBan,
} from '../api/index.js';

const token   = ref(sessionStorage.getItem('adminToken') || '');
const pw      = ref('');
const loginErr= ref('');
const tab     = ref('posts');

const posts       = ref([]);
const postsLoading= ref(false);
const bans        = ref([]);
const bansLoading = ref(false);
const banF = reactive({ ip: '', reason: '', expires: '' });

// ── auth ──────────────────────────────────────────────────────
async function login() {
  loginErr.value = '';
  try {
    const { data } = await adminLogin(pw.value);
    token.value = data.token;
    sessionStorage.setItem('adminToken', data.token);
    loadPosts();
  } catch { loginErr.value = 'Неверный пароль'; }
}
function logout() {
  token.value = '';
  sessionStorage.removeItem('adminToken');
}

// ── posts ─────────────────────────────────────────────────────
async function loadPosts() {
  postsLoading.value = true;
  try { posts.value = (await adminGetPosts(token.value)).data; }
  catch (e) { if (e.response?.status === 401) logout(); }
  finally { postsLoading.value = false; }
}

async function deletePost(id) {
  if (!confirm(`Удалить пост #${id}?`)) return;
  try {
    await adminDeletePost(token.value, id);
    posts.value = posts.value.filter(p => p.id !== id);
  } catch (e) { alert(e.response?.data?.error || 'Ошибка'); }
}

// ── bans ──────────────────────────────────────────────────────
async function loadBans() {
  bansLoading.value = true;
  try { bans.value = (await adminGetBans(token.value)).data; }
  finally { bansLoading.value = false; }
}

async function addBan() {
  try {
    await adminAddBan(token.value, {
      ip_address: banF.ip,
      reason:     banF.reason || null,
      expires_at: banF.expires || null,
    });
    Object.assign(banF, { ip: '', reason: '', expires: '' });
    loadBans();
  } catch (e) { alert(e.response?.data?.error || 'Ошибка'); }
}

async function deleteBan(id) {
  try {
    await adminDeleteBan(token.value, id);
    bans.value = bans.value.filter(b => b.id !== id);
  } catch (e) { alert(e.response?.data?.error || 'Ошибка'); }
}

function prefillBan(ip) { banF.ip = ip; switchTab('bans'); }
function switchTab(t)   { tab.value = t; }

watch(tab, t => {
  if (token.value) t === 'posts' ? loadPosts() : loadBans();
});
onMounted(() => { if (token.value) loadPosts(); });

const fmt = ts => new Date(ts).toLocaleString('ru-RU');
const cut = (s, n) => s?.length > n ? s.slice(0, n) + '…' : s;
</script>

<style scoped>
.admin { max-width: 1100px; }

/* Логин */
.login { max-width: 280px; margin: 40px auto; background: #f0e0d6; border: 1px solid #d9bfb7; padding: 20px; }
.login h2 { color: #af0a0f; margin-bottom: 12px; }
.login input { display: block; width: 100%; padding: 6px; margin-bottom: 8px; border: 1px solid #aaa; }
.login button { background: #af0a0f; color: white; border: none; padding: 6px 18px; cursor: pointer; }
.err { color: #d00; font-size: 13px; margin-left: 8px; }

/* Panel */
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-head h2 { color: #af0a0f; }
.logout { background: #888; color: white; border: none; padding: 4px 12px; cursor: pointer; }

/* Tabs */
.tabs { display: flex; border-bottom: 2px solid #af0a0f; margin-bottom: 12px; }
.tabs button {
  padding: 6px 18px; border: none; background: #ddd;
  cursor: pointer; border-radius: 4px 4px 0 0; margin-right: 2px;
}
.tabs button.on { background: #af0a0f; color: white; }

.refresh { background: #ccc; border: 1px solid #aaa; padding: 4px 10px; cursor: pointer; margin-bottom: 8px; }

/* Table */
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th, .tbl td { border: 1px solid #ccc; padding: 5px 7px; vertical-align: top; }
.tbl th { background: #af0a0f; color: white; }
.tbl tr:nth-child(even) { background: #faf0ee; }
.mono  { font-family: monospace; font-size: 12px; }
.small { font-size: 12px; white-space: nowrap; }
.prev-cell { display: flex; gap: 6px; align-items: flex-start; }
.athumb { width: 40px; height: 40px; object-fit: cover; flex-shrink: 0; }
.op { background: #036; color: white; font-size: 10px; padding: 1px 4px; border-radius: 2px; margin-left: 4px; }
.act { border: none; padding: 3px 8px; cursor: pointer; font-size: 12px; display: block; margin-bottom: 3px; color: white; }
.del { background: #af0a0f; }
.ban { background: #555; }

/* Ban form */
.ban-add { background: #f0e0d6; border: 1px solid #d9bfb7; padding: 10px; margin-bottom: 12px; }
.ban-add h3 { margin-bottom: 8px; color: #0f0c5d; }
.ban-form { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.ban-form input { border: 1px solid #aaa; padding: 4px 6px; }
.ban-form button { background: #af0a0f; color: white; border: none; padding: 5px 14px; cursor: pointer; }

.msg { padding: 14px; text-align: center; color: #666; }
</style>
