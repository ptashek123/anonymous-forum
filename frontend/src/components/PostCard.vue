<!-- Задачи 4.1 (>>ID regex), 4.2 (popup preview), 4.3 (backlinks) -->
<template>
  <div class="post" :id="`p${post.id}`">

    <!-- Шапка поста -->
    <div class="post-header">
      <span class="author">{{ post.author_name }}</span>
      <span v-if="post.tripcode" class="tripcode">{{ post.tripcode }}</span>
      <span class="date">{{ fmt(post.created_at) }}</span>
      <span class="post-no">No.<strong>{{ post.id }}</strong></span>
    </div>

    <!-- Тело -->
    <div class="post-body">
      <div v-if="post.thumbnail_path" class="attachment">
        <a :href="'/' + post.file_path" target="_blank">
          <img :src="'/' + post.thumbnail_path" alt="вложение" />
        </a>
      </div>

      <!-- Задача 4.1: >>ID → кликабельные ссылки с data-атрибутом -->
      <div
        class="content"
        v-html="parsed"
        @click="onContentClick"
        @mouseover="onHover"
        @mouseout="scheduleHide"
      />
    </div>

    <!-- Задача 4.3: backlinks (обратные ссылки) -->
    <div v-if="post.backlinks?.length" class="backlinks">
      <span
        v-for="bl in post.backlinks"
        :key="bl"
        class="backlink"
        @click="scrollTo(bl)"
        @mouseover="showPopup(bl, $event)"
        @mouseout="scheduleHide"
      >&gt;&gt;{{ bl }}</span>
    </div>

    <!-- Задача 4.2: всплывающий предпросмотр (рендерим в <body>) -->
    <Teleport to="body">
      <div
        v-if="popup.visible"
        class="post-popup"
        :style="{ top: popup.y + 'px', left: popup.x + 'px' }"
        @mouseover="cancelHide"
        @mouseout="scheduleHide"
      >
        <template v-if="popup.post">
          <div class="popup-header">
            <span class="author">{{ popup.post.author_name }}</span>
            <span v-if="popup.post.tripcode" class="tripcode">{{ popup.post.tripcode }}</span>
            <span class="post-no">No.{{ popup.post.id }}</span>
          </div>
          <img
            v-if="popup.post.thumbnail_path"
            :src="'/' + popup.post.thumbnail_path"
            class="popup-thumb"
            alt=""
          />
          <div class="popup-content">{{ popup.post.content }}</div>
        </template>
        <span v-else class="popup-missing">Пост не найден</span>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { computed, reactive } from 'vue';

const props = defineProps({
  post:  { type: Object, required: true },
  posts: { type: Array,  default: () => [] },
});

// ── Задача 4.1: парсинг >>ID ──────────────────────────────────────────────
const parsed = computed(() => {
  const text = props.post.content ?? '';
  const esc  = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return esc.replace(
    /&gt;&gt;(\d+)/g,
    '<a class="quote-link" data-pid="$1" href="#p$1">&gt;&gt;$1</a>'
  );
});

// ── Задача 4.2: popup state ───────────────────────────────────────────────
const popup = reactive({ visible: false, x: 0, y: 0, post: null });
let hideTimer = null;

function onHover(e) {
  const a = e.target.closest('.quote-link');
  if (a) showPopup(parseInt(a.dataset.pid), e);
}

function showPopup(id, e) {
  cancelHide();
  popup.post    = props.posts.find(p => p.id === id) ?? null;
  popup.visible = true;
  place(e);
}

function place(e) {
  const W  = 320;
  let   x  = e.clientX + 14 + window.scrollX;
  const y  = e.clientY + 10 + window.scrollY;
  if (x + W > window.innerWidth + window.scrollX - 16) {
    x = e.clientX - W - 14 + window.scrollX;
  }
  popup.x = x;
  popup.y = y;
}

function scheduleHide() {
  hideTimer = setTimeout(() => { popup.visible = false; }, 120);
}
function cancelHide()   { clearTimeout(hideTimer); }

function onContentClick(e) {
  const a = e.target.closest('.quote-link');
  if (a) { e.preventDefault(); scrollTo(parseInt(a.dataset.pid)); }
}

function scrollTo(id) {
  popup.visible = false;
  document.getElementById(`p${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function fmt(ts) { return new Date(ts).toLocaleString('ru-RU'); }
</script>

<style scoped>
.post {
  background: #f0e0d6;
  border: 1px solid #d9bfb7;
  padding: 8px 10px;
  margin-bottom: 8px;
  display: block;
  max-width: 100%;
}
.post-header { font-size: 13px; margin-bottom: 4px; }
.author   { color: #117743; font-weight: bold; margin-right: 6px; }
.tripcode { color: #117743; margin-right: 6px; }
.date     { color: #888;    margin-right: 6px; }
.post-no  { color: #555; }

.post-body    { display: flex; gap: 8px; flex-wrap: wrap; }
.attachment img { max-width: 200px; max-height: 200px; display: block; cursor: zoom-in; }
.content { white-space: pre-wrap; word-break: break-word; font-size: 14px; flex: 1; min-width: 0; }

/* задача 4.1 */
:deep(.quote-link) {
  color: #c00;
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
}
:deep(.quote-link:hover) { text-decoration: underline; }

/* задача 4.3 */
.backlinks { margin-top: 4px; font-size: 12px; }
.backlink  { color: #c00; font-weight: bold; cursor: pointer; margin-right: 6px; }
.backlink:hover { text-decoration: underline; }

/* задача 4.2 */
.post-popup {
  position: absolute;
  z-index: 1000;
  background: #f0e0d6;
  border: 2px solid #d9bfb7;
  padding: 8px 10px;
  max-width: 320px;
  box-shadow: 3px 5px 14px rgba(0,0,0,.28);
  font-size: 13px;
  pointer-events: auto;
}
.popup-header   { margin-bottom: 4px; }
.popup-thumb    { max-width: 120px; max-height: 120px; display: block; margin-bottom: 4px; }
.popup-content  { white-space: pre-wrap; word-break: break-word; max-height: 140px; overflow-y: auto; }
.popup-missing  { color: #888; font-style: italic; }
</style>