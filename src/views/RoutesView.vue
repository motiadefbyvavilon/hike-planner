<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '../stores/trips'

const store = useTripsStore()
const router = useRouter()

const createdFrom = ref('')

function useRoute(route) {
  const r = store.createFromRoute(route.id)
  if (!r.ok) return
  createdFrom.value = route.id
  setTimeout(() => router.push(`/trip/${r.trip.id}`), 600)
}

const diffClass = (d) => ({ 'Лёгкий': 'easy', 'Средний': 'mid', 'Сложный': 'hard' })[d]
</script>

<template>
  <section class="routes-page">
    <header class="page-head">
      <div>
        <h1>Каталог маршрутов</h1>
        <p class="subtitle">Проверенные маршруты от сообщества — один клик, и поход создан с готовым чек-листом снаряжения</p>
      </div>
    </header>

    <div class="grid">
      <article v-for="r in store.catalog" :key="r.id" class="card route-card">
        <div class="route-top">
          <span class="badge" :class="diffClass(r.difficulty)">{{ r.difficulty }}</span>
          <span class="badge region">{{ r.region }}</span>
        </div>
        <h2 class="route-name">{{ r.name }}</h2>
        <p class="route-desc">{{ r.description }}</p>
        <dl class="route-facts">
          <div><dt>Дней</dt><dd>{{ r.days }}</dd></div>
          <div><dt>Километров</dt><dd>{{ r.distanceKm }}</dd></div>
          <div><dt>Сезон</dt><dd>{{ r.season }}</dd></div>
        </dl>
        <footer class="route-foot">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="createdFrom === r.id"
            @click="useRoute(r)"
          >
            {{ createdFrom === r.id ? 'Создаю…' : 'Спланировать поход' }}
          </button>
        </footer>
      </article>
    </div>
  </section>
</template>

<style scoped>
.routes-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14.5px;
  max-width: 70ch;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
  gap: 16px;
}

.route-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.route-top {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.easy {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.mid {
  background: var(--warn-soft);
  color: var(--warn);
}

.hard {
  background: var(--danger-soft);
  color: var(--danger);
}

.region {
  background: var(--surface-2);
}

.route-name {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.3;
}

.route-desc {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.route-facts {
  display: flex;
  gap: 20px;
  margin: 0;
}

.route-facts dt {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
  font-weight: 600;
}

.route-facts dd {
  margin: 1px 0 0;
  font-size: 13.5px;
  font-weight: 600;
}

.route-foot {
  margin-top: auto;
  padding-top: 6px;
}
</style>
