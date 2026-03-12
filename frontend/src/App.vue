<template>
  <div id="app">
    <header>
      <div class="inner">
        <h1><router-link to="/">Imageboard</router-link></h1>
        <nav>
          <router-link to="/">Лента</router-link>
          <router-link to="/catalog">Каталог</router-link>
          <router-link to="/admin" class="mod">Модератор</router-link>
        </nav>
      </div>
    </header>
    <main><router-view /></main>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #d6daf0; font-family: Arial, sans-serif; font-size: 14px; color: #222; }
a { color: #0f0c5d; }
header { background: #af0a0f; }
.inner { max-width: 1100px; margin: 0 auto; padding: 8px 16px; display: flex; align-items: center; justify-content: space-between; }
header h1 a { color: #fff; text-decoration: none; font-size: 20px; }
nav { display: flex; gap: 16px; }
nav a { color: rgba(255,255,255,.85); text-decoration: none; font-size: 13px; }
nav a:hover, nav a.router-link-active { color: #fff; text-decoration: underline; }
nav a.mod { color: rgba(255,210,210,.8); }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
</style>
