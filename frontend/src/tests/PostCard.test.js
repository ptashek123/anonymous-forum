// Тест компонента PostCard — наиболее функциональный компонент фронтенда.
// Покрывает: парсинг >>ID (задача 4.1), отображение трипкода (задача 5),
// отображение вложений (задача 2), backlinks (задача 4.3)

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import PostCard from '../components/PostCard.vue';

function makePost(overrides = {}) {
  return {
    id:             1,
    author_name:    'Anonymous',
    tripcode:       null,
    created_at:     '2026-03-12T10:00:00.000Z',
    content:        'Test content',
    file_path:      null,
    thumbnail_path: null,
    backlinks:      [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// ТЕСТ 1: Отображение поста
// ═══════════════════════════════════════════════════════════════
describe('PostCard — отображение', () => {

  test('отображает имя автора', () => {
    const wrapper = mount(PostCard, {
      props: { post: makePost({ author_name: 'Anonymous' }), posts: [] },
    });
    expect(wrapper.find('.author').text()).toBe('Anonymous');
  });

  test('отображает номер поста', () => {
    const wrapper = mount(PostCard, {
      props: { post: makePost({ id: 42 }), posts: [] },
    });
    expect(wrapper.find('.post-no').text()).toContain('42');
  });

  test('отображает текст сообщения', () => {
    const wrapper = mount(PostCard, {
      props: { post: makePost({ content: 'Hello imageboard!' }), posts: [] },
    });
    expect(wrapper.find('.content').text()).toContain('Hello imageboard!');
  });

  test('отображает трипкод если он есть', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ author_name: 'User', tripcode: '!AbCdEfGhIj' }),
        posts: [],
      },
    });
    expect(wrapper.find('.tripcode').text()).toBe('!AbCdEfGhIj');
  });

  test('не отображает трипкод если его нет', () => {
    const wrapper = mount(PostCard, {
      props: { post: makePost({ tripcode: null }), posts: [] },
    });
    expect(wrapper.find('.tripcode').exists()).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// ТЕСТ 2: Парсинг >>ID (задача 4.1)
// v-html рендерится в DOM — ищем через wrapper.element.querySelector
// ═══════════════════════════════════════════════════════════════
describe('PostCard — парсинг >>ID', () => {

  test('>>ID превращается в кликабельную ссылку', async () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ content: '>>5 смотри этот пост' }),
        posts: [],
      },
    });
    await wrapper.vm.$nextTick();
    const link = wrapper.element.querySelector('.quote-link');
    expect(link).not.toBeNull();
    expect(link.textContent).toBe('>>5');
  });

  test('несколько >>ID в одном сообщении', async () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ content: '>>1 и >>2 посты' }),
        posts: [],
      },
    });
    await wrapper.vm.$nextTick();
    const links = wrapper.element.querySelectorAll('.quote-link');
    expect(links.length).toBe(2);
    expect(links[0].textContent).toBe('>>1');
    expect(links[1].textContent).toBe('>>2');
  });

  test('текст без >>ID не содержит quote-link ссылок', async () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ content: 'Просто обычный текст' }),
        posts: [],
      },
    });
    await wrapper.vm.$nextTick();
    const links = wrapper.element.querySelectorAll('.quote-link');
    expect(links.length).toBe(0);
  });

  test('ссылка >>ID содержит корректный href', async () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ content: '>>99' }),
        posts: [],
      },
    });
    await wrapper.vm.$nextTick();
    const link = wrapper.element.querySelector('.quote-link');
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('#p99');
  });
});

// ═══════════════════════════════════════════════════════════════
// ТЕСТ 3: Вложения (задача 2.2, 2.3)
// ═══════════════════════════════════════════════════════════════
describe('PostCard — вложения', () => {

  test('отображает миниатюру если есть thumbnail_path', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({
          file_path:      'uploads/image.jpg',
          thumbnail_path: 'uploads/th_image.jpg',
        }),
        posts: [],
      },
    });
    const img = wrapper.find('.attachment img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toContain('th_image.jpg');
  });

  test('не отображает блок вложения если файла нет', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ file_path: null, thumbnail_path: null }),
        posts: [],
      },
    });
    expect(wrapper.find('.attachment').exists()).toBe(false);
  });

  test('ссылка на оригинал открывается в новой вкладке', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({
          file_path:      'uploads/orig.png',
          thumbnail_path: 'uploads/th_orig.jpg',
        }),
        posts: [],
      },
    });
    const link = wrapper.find('.attachment a');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('href')).toContain('uploads/orig.png');
  });
});

// ═══════════════════════════════════════════════════════════════
// ТЕСТ 4: Backlinks (задача 4.3)
// ═══════════════════════════════════════════════════════════════
describe('PostCard — backlinks', () => {

  test('отображает backlinks если они есть', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ id: 1, backlinks: [3, 7] }),
        posts: [],
      },
    });
    const bls = wrapper.findAll('.backlink');
    expect(bls.length).toBe(2);
    expect(bls[0].text()).toBe('>>3');
    expect(bls[1].text()).toBe('>>7');
  });

  test('не отображает блок backlinks если список пустой', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: makePost({ backlinks: [] }),
        posts: [],
      },
    });
    expect(wrapper.find('.backlinks').exists()).toBe(false);
  });
});
