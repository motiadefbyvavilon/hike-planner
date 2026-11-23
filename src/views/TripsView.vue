<script setup>
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTripsStore } from '../stores/trips'
import { DIFFICULTIES } from '../data/catalog'

const store = useTripsStore()
const router = useRouter()

const modalOpen = ref(false)
const error = ref('')
const form = reactive({ name: '', region: '', dateStart: '', dateEnd: '', difficulty: 'Лёгкий', description: '' })

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

function daysCount(t) {
  return Math.round((new Date(t.dateEnd) - new Date(t.dateStart)) / 86400000) + 1
}

function submit() {
  error.value = ''
  const result = store.createTrip({ ...form })
  if (!result.ok) {
    error.value = result.error
    return
  }
  modalOpen.value = false
  Object.assign(form, { name: '', region: '', dateStart: '', dateEnd: '', difficulty: 'Лёгкий', description: '' })
  router.push(`/trip/${result.trip.id}`)
}

const sorted = computed(() =>
  [...store.trips].sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
)
</script>

<template>
  <section class="trips-page">
    <header class="page-head">
      <div>
        <h1>Мои походы</h1>
        <p class="subtitle">Планируйте маршрут, собирайте группу и распределяйте снаряжение в одном месте</p>
      </div>
      <button class="btn btn-primary" type="button" @click="modalOpen = true">+ Новый поход</button>
    </header>

    <div v-if="sorted.length" class="grid">
      <article v-for="t in sorted" :key="t.id" class="card trip-card">
        <RouterLink class="trip-link" :to="`/trip/${t.id}`">
          <div class="trip-top">
            <span class="badge">{{ t.difficulty }}</span>
            <span class="badge region">{{ t.region || 'Регион не указан' }}</span>
          </div>
          <h2 class="trip-name">{{ t.name }}</h2>
          <p class="trip-dates mono">{{ fmtDate(t.dateStart) }} — {{ fmtDate(t.dateEnd) }} · {{ daysCount(t) }} дн. · {{ store.tripDistance(t) }} км</p>
          <div class="trip-meta">
            <span>{{ t.participants.length }} участн.</span>
            <span>Снаряжение: {{ store.gearProgress(t) }}%</span>
          </div>
          <div class="gear-bar" role="progressbar" :aria-valuenow="store.gearProgress(t)" aria-valuemin="0" aria-valuemax="100">
            <div class="gear-fill" :style="{ width: store.gearProgress(t) + '%' }" />
          </div>
        </RouterLink>
      </article>
    </div>

    <div v-else class="card empty">
      <p>Походов пока нет. Создайте свой первый или выберите готовый маршрут из <RouterLink to="/routes">каталога</RouterLink>.</p>
    </div>

    <!-- Модалка нового похода -->
    <Transition name="fade">
      <div v-if="modalOpen" class="backdrop" @mousedown.self="modalOpen = false">
        <div class="card modal" role="dialog" aria-modal="true" aria-label="Новый поход">
          <h2>Новый поход</h2>
          <form class="modal-body" @submit.prevent="submit">
            <div v-if="error" class="alert" role="alert">{{ error }}</div>
            <div class="field">
              <label for="tf-name">Название</label>
              <input id="tf-name" v-model="form.name" type="text" placeholder="Например: Кольцо по Карелии" required />
            </div>
            <div class="field">
              <label for="tf-region">Регион</label>
              <input id="tf-region" v-model="form.region" type="text" placeholder="Область, страна" />
            </div>
            <div class="row">
              <div class="field">
                <label for="tf-start">Начало</label>
                <input id="tf-start" v-model="form.dateStart" type="date" required />
              </div>
              <div class="field">
                <label for="tf-end">Окончание</label>
                <input id="tf-end" v-model="form.dateEnd" type="date" required />
              </div>
            </div>
            <div class="field">
              <label for="tf-diff">Сложность</label>
              <select id="tf-diff" v-model="form.difficulty">
                <option v-for="d in DIFFICULTIES" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="field">
              <label for="tf-desc">Описание</label>
              <textarea id="tf-desc" v-model="form.description" rows="3" placeholder="Цели похода, особенности маршрута…" />
            </div>
            <footer class="modal-foot">
              <button class="btn btn-ghost" type="button" @click="modalOpen = false">Отмена</button>
              <button class="btn btn-primary" type="submit">Создать поход</button>
            </footer>
          </form>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped>
.trips-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.subtitle {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 14.5px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.trip-link {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  text-decoration: none;
  color: inherit;
  transition: transform 0.15s ease-out;
}

.trip-card {
  transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
}

.trip-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-pop);
}

.trip-top {
  display: flex;
  gap: 8px;
}

.region {
  background: var(--warn-soft);
  color: var(--warn);
}

.trip-name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.trip-dates {
  margin: 0;
  font-size: 12.5px;
  color: var(--text-secondary);
}

.mono {
  font-family: var(--mono);
}

.trip-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--text-faint);
}

.gear-bar {
  height: 6px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
}

.gear-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s ease-out;
}

.empty {
  padding: 40px 32px;
  text-align: center;
  color: var(--text-secondary);
}

.backdrop {
  position: fixed;
  inset: 0;
  background: oklch(25% 0.025 150 / 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: var(--z-modal);
}

.modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100dvh - 40px);
  overflow-y: auto;
  padding: 24px;
}

.modal h2 {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 700;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.alert {
  background: var(--danger-soft);
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: var(--radius-m);
  padding: 12px 14px;
  font-size: 14px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}
</style>
