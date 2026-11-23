<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTripsStore } from '../stores/trips'

const route = useRoute()
const router = useRouter()
const store = useTripsStore()

const trip = computed(() => store.tripById(route.params.id))
const tab = ref('participants')

const newParticipant = ref('')
const participantError = ref('')

function addParticipant() {
  participantError.value = ''
  const r = store.addParticipant(trip.value.id, newParticipant.value)
  if (!r.ok) {
    participantError.value = r.error
    return
  }
  newParticipant.value = ''
}

const newGear = ref({ name: '', category: 'Лагерь' })
const GEAR_CATS = ['Лагерь', 'Кухня', 'Одежда', 'Безопасность', 'Навигация', 'Прочее']

function addGear() {
  const r = store.addGear(trip.value.id, newGear.value.name, newGear.value.category)
  if (r.ok) newGear.value.name = ''
}

const gearByCat = computed(() => {
  const map = {}
  for (const g of trip.value.gear) {
    ;(map[g.category] = map[g.category] || []).push(g)
  }
  return map
})

const confirmDelete = ref(false)

function fmtDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

const packed = computed(() => trip.value.gear.filter((g) => g.packed).length)
</script>

<template>
  <section v-if="trip" class="trip-page">
    <button class="back" type="button" @click="router.push('/')">← К списку походов</button>

    <header class="card trip-head">
      <div class="badges">
        <span class="badge">{{ trip.difficulty }}</span>
        <span v-if="trip.region" class="badge region">{{ trip.region }}</span>
      </div>
      <h1>{{ trip.name }}</h1>
      <p v-if="trip.description" class="desc">{{ trip.description }}</p>
      <div class="facts">
        <span class="mono">{{ fmtDate(trip.dateStart) }} — {{ fmtDate(trip.dateEnd) }}</span>
        <span>{{ trip.days.length }} дн. · {{ store.tripDistance(trip) }} км</span>
        <span>{{ trip.participants.length }} участн.</span>
        <span>Снаряжение: {{ store.gearProgress(trip) }}% ({{ packed }}/{{ trip.gear.length }})</span>
      </div>
      <div class="head-actions">
        <button class="btn btn-danger btn-sm" type="button" @click="confirmDelete = true">Удалить поход</button>
      </div>
    </header>

    <div class="tabs" role="tablist" aria-label="Разделы похода">
      <button
        v-for="t in [['participants', 'Участники'], ['gear', 'Снаряжение'], ['days', 'План по дням']]"
        :key="t[0]"
        class="tab"
        :class="{ active: tab === t[0] }"
        role="tab"
        :aria-selected="tab === t[0]"
        type="button"
        @click="tab = t[0]"
      >
        {{ t[1] }}
      </button>
    </div>

    <!-- Участники -->
    <div v-if="tab === 'participants'" class="card pane">
      <h2 class="h2">Группа похода</h2>
      <ul class="plist">
        <li v-for="p in trip.participants" :key="p.id">
          <span class="avatar" aria-hidden="true">{{ p.name[0] }}</span>
          <span class="pname">{{ p.name }}</span>
          <span class="badge" :class="{ org: p.role === 'Организатор' }">{{ p.role }}</span>
          <button
            v-if="p.role !== 'Организатор'"
            class="remove"
            type="button"
            :aria-label="`Убрать ${p.name}`"
            @click="store.removeParticipant(trip.id, p.id)"
          >
            ×
          </button>
        </li>
      </ul>
      <div class="add-row">
        <input v-model="newParticipant" type="text" placeholder="Имя нового участника" aria-label="Имя нового участника" @keydown.enter.prevent="addParticipant" />
        <button class="btn btn-primary btn-sm" type="button" @click="addParticipant">Добавить</button>
      </div>
      <p v-if="participantError" class="error" role="alert">{{ participantError }}</p>
    </div>

    <!-- Снаряжение -->
    <div v-else-if="tab === 'gear'" class="card pane">
      <h2 class="h2">Снаряжение · собрано {{ packed }} из {{ trip.gear.length }}</h2>
      <div class="gear-progress" role="progressbar" :aria-valuenow="store.gearProgress(trip)" aria-valuemin="0" aria-valuemax="100">
        <div class="gear-fill" :style="{ width: store.gearProgress(trip) + '%' }" />
      </div>

      <div v-for="(items, cat) in gearByCat" :key="cat" class="gear-cat">
        <h3>{{ cat }}</h3>
        <div v-for="g in gearByCat[cat]" :key="g.id" class="gear-row" :class="{ packed: g.packed }">
          <label class="gear-check">
            <input type="checkbox" :checked="g.packed" @change="store.togglePacked(trip.id, g.id)" />
            <span class="gear-name">{{ g.name }}</span>
          </label>
          <select
            class="assignee"
            :value="g.assignee"
            :aria-label="`Кто несёт: ${g.name}`"
            @change="store.assignGear(trip.id, g.id, $event.target.value)"
          >
            <option value="">Никто</option>
            <option v-for="p in trip.participants" :key="p.id" :value="p.name">{{ p.name }}</option>
          </select>
          <button class="remove" type="button" :aria-label="`Удалить ${g.name}`" @click="store.removeGear(trip.id, g.id)">×</button>
        </div>
      </div>

      <div class="add-row">
        <input v-model="newGear.name" type="text" placeholder="Добавить снаряжение" aria-label="Название снаряжения" @keydown.enter.prevent="addGear" />
        <select v-model="newGear.category" aria-label="Категория">
          <option v-for="c in GEAR_CATS" :key="c" :value="c">{{ c }}</option>
        </select>
        <button class="btn btn-primary btn-sm" type="button" @click="addGear">Добавить</button>
      </div>
    </div>

    <!-- План по дням -->
    <div v-else class="card pane">
      <h2 class="h2">Маршрут по дням · всего {{ store.tripDistance(trip) }} км</h2>
      <ol class="days">
        <li v-for="d in trip.days" :key="d.id" class="day-row">
          <span class="day-num mono">{{ d.day }}</span>
          <div class="day-fields">
            <input
              class="day-title"
              :value="d.title"
              type="text"
              aria-label="Название дня"
              @change="store.updateDay(trip.id, d.id, { title: $event.target.value })"
            />
            <div class="day-sub">
              <input
                class="day-km"
                :value="d.distanceKm"
                type="number"
                min="0"
                step="0.5"
                aria-label="Километров"
                @change="store.updateDay(trip.id, d.id, { distanceKm: Number($event.target.value) || 0 })"
              />
              <span class="km-label">км</span>
              <input
                class="day-note"
                :value="d.note"
                type="text"
                placeholder="Заметки: ночёвка, вода, заброска…"
                aria-label="Заметки дня"
                @change="store.updateDay(trip.id, d.id, { note: $event.target.value })"
              />
            </div>
          </div>
          <button
            v-if="trip.days.length > 1"
            class="remove"
            type="button"
            :aria-label="`Удалить день ${d.day}`"
            @click="store.removeDay(trip.id, d.id)"
          >
            ×
          </button>
        </li>
      </ol>
      <button class="btn btn-ghost btn-sm" type="button" @click="store.addDay(trip.id)">+ Добавить день</button>
    </div>

    <!-- Подтверждение удаления -->
    <Transition name="fade">
      <div v-if="confirmDelete" class="backdrop" @mousedown.self="confirmDelete = false">
        <div class="card modal" role="alertdialog" aria-modal="true" aria-label="Подтверждение удаления похода">
          <h2>Удалить поход?</h2>
          <p class="confirm-text">«{{ trip.name }}» будет удалён вместе с группой, снаряжением и планом.</p>
          <footer class="modal-foot">
            <button class="btn btn-ghost" type="button" @click="confirmDelete = false">Оставить</button>
            <button class="btn btn-danger" type="button" @click="store.deleteTrip(trip.id); router.push('/')">Удалить</button>
          </footer>
        </div>
      </div>
    </Transition>
  </section>

  <section v-else class="card empty">
    <p>Поход не найден.</p>
    <RouterLink class="btn btn-ghost" to="/">К списку походов</RouterLink>
  </section>
</template>

<style scoped>
.trip-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 860px;
}

.back {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 14.5px;
  padding: 6px 0;
}

.back:hover {
  color: var(--accent-strong);
}

.trip-head {
  padding: 22px 26px;
}

.badges {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.region {
  background: var(--warn-soft);
  color: var(--warn);
}

h1 {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
}

.desc {
  margin: 0 0 14px;
  color: var(--text-secondary);
  font-size: 15px;
}

.facts {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  font-size: 14px;
  color: var(--text-secondary);
}

.mono {
  font-family: var(--mono);
}

.head-actions {
  margin-top: 14px;
}

.tabs {
  display: flex;
  gap: 6px;
}

.tab {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 999px;
  padding: 9px 18px;
  font-weight: 600;
  font-size: 14.5px;
  color: var(--text-secondary);
  transition: background-color 0.15s ease-out, color 0.15s ease-out;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--surface);
}

.pane {
  padding: 22px 26px;
}

.h2 {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 700;
}

/* участники */
.plist {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plist li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pname {
  font-weight: 600;
}

.badge.org {
  background: var(--accent-soft);
  color: var(--accent-strong);
}

.remove {
  margin-left: auto;
  border: none;
  background: transparent;
  color: var(--text-faint);
  font-size: 20px;
  line-height: 1;
  border-radius: 999px;
  padding: 4px 8px;
}

.remove:hover {
  color: var(--danger);
  background: var(--danger-soft);
}

.add-row {
  display: flex;
  gap: 10px;
  margin-top: 8px;
}

.add-row input {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 9px 12px;
  font-size: 14.5px;
}

.add-row select {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 9px 10px;
  font-size: 14px;
}

.error {
  margin: 10px 0 0;
  color: var(--danger);
  font-size: 14px;
}

/* снаряжение */
.gear-progress {
  height: 8px;
  background: var(--surface-2);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 18px;
}

.gear-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 999px;
  transition: width 0.25s ease-out;
}

.gear-cat h3 {
  margin: 14px 0 8px;
  font-size: 12.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-faint);
}

.gear-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid var(--surface-2);
}

.gear-row.packed .gear-name {
  text-decoration: line-through;
  color: var(--text-faint);
}

.gear-check {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14.5px;
}

.gear-check input {
  width: 17px;
  height: 17px;
  accent-color: var(--accent);
}

.assignee {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  background: var(--surface);
  padding: 5px 8px;
  font-size: 13px;
  max-width: 170px;
}

/* план по дням */
.days {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.day-row {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.day-num {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 4px;
}

.day-fields {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.day-title {
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: 9px 12px;
  font-size: 15px;
  font-weight: 600;
  background: var(--surface);
}

.day-sub {
  display: flex;
  align-items: center;
  gap: 8px;
}

.day-km {
  width: 80px;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: 7px 10px;
  font-size: 14px;
  background: var(--surface);
}

.km-label {
  font-size: 13px;
  color: var(--text-faint);
}

.day-note {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: var(--radius-s);
  padding: 7px 10px;
  font-size: 14px;
  background: var(--surface);
}

.day-row .remove {
  margin-left: 0;
  margin-top: 6px;
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
  max-width: 440px;
  padding: 24px;
}

.modal h2 {
  margin: 0 0 10px;
  font-size: 20px;
  font-weight: 700;
}

.confirm-text {
  margin: 0 0 16px;
  color: var(--text-secondary);
  font-size: 14.5px;
}

.modal-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.empty {
  padding: 48px 32px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
</style>
