<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { useTripsStore } from './stores/trips'
import ToastStack from './components/ToastStack.vue'

const store = useTripsStore()
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <div class="topbar-inner">
        <RouterLink to="/" class="brand">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            <path d="M4 22 11 9l4 7 3-4 6 6H4Z" class="b-mountains" />
            <circle cx="20" cy="7" r="2.6" class="b-sun" />
          </svg>
          <span class="brand-name">ПоходПлан</span>
        </RouterLink>

        <nav class="nav" aria-label="Основная навигация">
          <RouterLink to="/" class="nav-item">Мои походы</RouterLink>
          <RouterLink to="/routes" class="nav-item">Каталог маршрутов</RouterLink>
        </nav>

        <span class="trips-count mono">{{ store.trips.length }} походов</span>
      </div>
    </header>

    <main class="main">
      <RouterView />
    </main>

    <ToastStack />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
}

.topbar-inner {
  max-width: 1180px;
  margin: 0 auto;
  padding: 12px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--text);
}

.b-mountains {
  fill: var(--accent);
}

.b-sun {
  fill: var(--warn);
}

.brand-name {
  font-weight: 800;
  font-size: 18px;
}

.nav {
  display: flex;
  gap: 4px;
}

.nav-item {
  padding: 8px 14px;
  border-radius: 999px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14.5px;
  transition: background-color 0.15s ease-out, color 0.15s ease-out;
}

.nav-item:hover {
  background: var(--surface-2);
  color: var(--text);
}

.nav-item.router-link-active {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.trips-count {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-faint);
}

.mono {
  font-family: var(--mono);
}

.main {
  flex: 1;
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px 56px;
}

@media (max-width: 640px) {
  .topbar-inner {
    flex-wrap: wrap;
    gap: 10px;
    padding: 12px 16px;
  }
  .trips-count {
    display: none;
  }
  .main {
    padding: 16px 16px 40px;
  }
}
</style>
