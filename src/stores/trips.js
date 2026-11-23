import { defineStore } from 'pinia'
import { baseGear, routeCatalog } from '../data/catalog'

const STORAGE_KEY = 'pohodplan-state-v1'

let idSeq = 500
function nextId(prefix) {
  idSeq += 1
  return `${prefix}-${idSeq}`
}

function seedTrips() {
  const start = new Date()
  start.setDate(start.getDate() + 14)
  const end = new Date(start)
  end.setDate(end.getDate() + 3)
  const iso = (d) => d.toISOString().slice(0, 10)

  return [
    {
      id: 't-1',
      name: 'Выходные на Селигере',
      region: 'Тверская область',
      dateStart: iso(start),
      dateEnd: iso(end),
      difficulty: 'Лёгкий',
      description: 'Спокойный поход вдоль берега, рыбалка, купание. Проверка нового снаряжения перед большим сезоном.',
      participants: [
        { id: 'p-1', name: 'Матвей (я)', role: 'Организатор' },
        { id: 'p-2', name: 'Катя Смирнова', role: 'Участник' },
        { id: 'p-3', name: 'Женя Прохоров', role: 'Участник' },
      ],
      gear: baseGear.slice(0, 8).map((g, i) => ({
        id: `g-${i + 1}`,
        ...g,
        assignee: i % 3 === 0 ? 'Матвей (я)' : i % 3 === 1 ? 'Катя Смирнова' : 'Женя Прохоров',
        packed: i < 3,
      })),
      days: [
        { id: 'd-1', day: 1, title: 'Заброска и выход на маршрут', distanceKm: 12, note: 'Электричка до Осташкова, старт в 11:00' },
        { id: 'd-2', day: 2, title: 'Вдоль берега до истока', distanceKm: 16, note: 'Купание, баня в приюте' },
        { id: 'd-3', day: 3, title: 'Возвращение', distanceKm: 10, note: 'Выход к дороге до 15:00' },
      ],
      createdAt: new Date().toISOString(),
    },
  ]
}

function load() {
  const fallback = { trips: seedTrips() }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed.trips)) return fallback
    return parsed
  } catch {
    return fallback
  }
}

export const useTripsStore = defineStore('trips', {
  state: () => ({
    ...load(),
    catalog: routeCatalog,
    toasts: [],
  }),

  getters: {
    tripById: (s) => (id) => s.trips.find((t) => t.id === id) || null,

    gearProgress: () => (trip) => {
      if (!trip.gear.length) return 0
      return Math.round((trip.gear.filter((g) => g.packed).length / trip.gear.length) * 100)
    },

    tripDistance: () => (trip) => trip.days.reduce((sum, d) => sum + (Number(d.distanceKm) || 0), 0),
  },

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ trips: this.trips }))
    },

    createTrip(payload) {
      if (!payload.name?.trim()) return { ok: false, error: 'Укажите название похода' }
      if (!payload.dateStart || !payload.dateEnd) return { ok: false, error: 'Укажите даты похода' }
      if (payload.dateEnd < payload.dateStart) return { ok: false, error: 'Дата окончания раньше даты начала' }

      const trip = {
        id: nextId('t'),
        region: '',
        difficulty: 'Лёгкий',
        description: '',
        ...payload,
        name: payload.name.trim(),
        participants: [{ id: nextId('p'), name: 'Матвей (я)', role: 'Организатор' }],
        gear: baseGear.map((g, i) => ({ id: nextId('g'), ...g, assignee: '', packed: false })),
        days: [{ id: nextId('d'), day: 1, title: 'День 1', distanceKm: 0, note: '' }],
        createdAt: new Date().toISOString(),
      }
      this.trips.unshift(trip)
      this.persist()
      this.pushToast(`Поход «${trip.name}» создан`, 'success')
      return { ok: true, trip }
    },

    createFromRoute(routeId) {
      const route = this.catalog.find((r) => r.id === routeId)
      if (!route) return { ok: false, error: 'Маршрут не найден' }
      const start = new Date()
      start.setDate(start.getDate() + 21)
      const end = new Date(start)
      end.setDate(end.getDate() + route.days - 1)
      const iso = (d) => d.toISOString().slice(0, 10)
      return this.createTrip({
        name: route.name,
        region: route.region,
        dateStart: iso(start),
        dateEnd: iso(end),
        difficulty: route.difficulty,
        description: route.description,
      })
    },

    deleteTrip(id) {
      this.trips = this.trips.filter((t) => t.id !== id)
      this.persist()
      this.pushToast('Поход удалён', 'success')
    },

    // ── Участники ─────────────────────────────────────────────
    addParticipant(tripId, name) {
      const trip = this.tripById(tripId)
      if (!trip) return { ok: false, error: 'Поход не найден' }
      const trimmed = name.trim()
      if (!trimmed) return { ok: false, error: 'Введите имя участника' }
      if (trip.participants.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        return { ok: false, error: 'Такой участник уже в группе' }
      }
      trip.participants.push({ id: nextId('p'), name: trimmed, role: 'Участник' })
      this.persist()
      return { ok: true }
    },

    removeParticipant(tripId, participantId) {
      const trip = this.tripById(tripId)
      if (!trip) return
      const p = trip.participants.find((x) => x.id === participantId)
      if (p?.role === 'Организатор') return
      trip.participants = trip.participants.filter((x) => x.id !== participantId)
      // Освобождаем снаряжение удалённого участника
      trip.gear.forEach((g) => {
        if (g.assignee === p.name) g.assignee = ''
      })
      this.persist()
    },

    // ── Снаряжение ────────────────────────────────────────────
    addGear(tripId, name, category) {
      const trip = this.tripById(tripId)
      if (!trip) return { ok: false, error: 'Поход не найден' }
      if (!name.trim()) return { ok: false, error: 'Введите название снаряжения' }
      trip.gear.push({ id: nextId('g'), name: name.trim(), category: category || 'Прочее', assignee: '', packed: false })
      this.persist()
      return { ok: true }
    },

    togglePacked(tripId, gearId) {
      const trip = this.tripById(tripId)
      const g = trip?.gear.find((x) => x.id === gearId)
      if (!g) return
      g.packed = !g.packed
      this.persist()
    },

    assignGear(tripId, gearId, assignee) {
      const trip = this.tripById(tripId)
      const g = trip?.gear.find((x) => x.id === gearId)
      if (!g) return
      g.assignee = assignee
      this.persist()
    },

    removeGear(tripId, gearId) {
      const trip = this.tripById(tripId)
      if (!trip) return
      trip.gear = trip.gear.filter((g) => g.id !== gearId)
      this.persist()
    },

    // ── План по дням ──────────────────────────────────────────
    addDay(tripId) {
      const trip = this.tripById(tripId)
      if (!trip) return
      const dayNum = trip.days.length + 1
      trip.days.push({ id: nextId('d'), day: dayNum, title: `День ${dayNum}`, distanceKm: 0, note: '' })
      this.persist()
    },

    updateDay(tripId, dayId, patch) {
      const trip = this.tripById(tripId)
      const d = trip?.days.find((x) => x.id === dayId)
      if (!d) return
      Object.assign(d, patch)
      this.persist()
    },

    removeDay(tripId, dayId) {
      const trip = this.tripById(tripId)
      if (!trip || trip.days.length <= 1) return
      trip.days = trip.days.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, day: i + 1 }))
      this.persist()
    },

    pushToast(text, tone = 'info') {
      const id = nextId('toast')
      this.toasts.push({ id, text, tone })
      setTimeout(() => {
        this.toasts = this.toasts.filter((t) => t.id !== id)
      }, 4200)
    },
  },
})
